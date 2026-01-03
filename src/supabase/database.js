import { supabase } from './client';

// ============ SERVERS ============

// Get servers for a user
export async function getServers(userId) {
    const { data, error } = await supabase
        .from('servers')
        .select('*')
        .contains('members', [userId])
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching servers:', error);
        return [];
    }
    return data || [];
}

// Subscribe to servers for a user
export function subscribeToServers(userId, callback) {
    // Initial fetch
    getServers(userId).then(callback);

    // Real-time subscription
    const channel = supabase
        .channel('servers-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'servers' },
            () => {
                // Refetch on any change
                getServers(userId).then(callback);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// Create a new server
export async function createServer(name, icon, userId, userName) {
    const { data: server, error } = await supabase
        .from('servers')
        .insert({
            name,
            icon: icon || name.charAt(0).toUpperCase(),
            owner_id: userId,
            members: [userId],
            member_details: {
                [userId]: {
                    username: userName,
                    joined_at: new Date().toISOString()
                }
            }
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating server:', error);
        return null;
    }

    // Create default general channel
    await createChannel(server.id, 'general', 'Text Channels');

    return server.id;
}

// ============ CHANNELS ============

// Get channels for a server
export async function getChannels(serverId) {
    const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('server_id', serverId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching channels:', error);
        return [];
    }
    return data || [];
}

// Subscribe to channels for a server
export function subscribeToChannels(serverId, callback) {
    // Initial fetch
    getChannels(serverId).then(callback);

    // Real-time subscription
    const channel = supabase
        .channel(`channels-${serverId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'channels',
                filter: `server_id=eq.${serverId}`
            },
            () => {
                getChannels(serverId).then(callback);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// Create a new channel
export async function createChannel(serverId, name, category = 'Text Channels') {
    const { data, error } = await supabase
        .from('channels')
        .insert({
            server_id: serverId,
            name: name.toLowerCase().replace(/\s+/g, '-'),
            type: 'text',
            category
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating channel:', error);
        return null;
    }
    return data?.id;
}

// ============ MESSAGES ============

// Get messages for a channel
export async function getMessages(channelId) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return (data || []).map(msg => ({
        ...msg,
        timestamp: msg.created_at
    }));
}

// Subscribe to messages for a channel
export function subscribeToMessages(channelId, callback) {
    // Initial fetch
    getMessages(channelId).then(callback);

    // Real-time subscription
    const channel = supabase
        .channel(`messages-${channelId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `channel_id=eq.${channelId}`
            },
            () => {
                getMessages(channelId).then(callback);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// Send a message
export async function sendMessage(channelId, content, user) {
    const { error } = await supabase
        .from('messages')
        .insert({
            channel_id: channelId,
            content,
            author: {
                id: user.id,
                username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
                photoURL: user.user_metadata?.avatar_url
            }
        });

    if (error) {
        console.error('Error sending message:', error);
    }
}
