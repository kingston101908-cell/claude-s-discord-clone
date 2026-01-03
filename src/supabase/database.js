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
    // Generate an invite code
    const inviteCode = generateInviteCode();

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
            },
            invite_code: inviteCode
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating server:', error);
        return null;
    }

    // Create default general channel
    await createChannel(server.id, 'general', 'Text Channels');

    // Create default roles
    await createDefaultRoles(server.id, userId);

    return server.id;
}

// Get server by invite code
export async function getServerByInviteCode(inviteCode) {
    const { data, error } = await supabase
        .from('servers')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

    if (error) {
        console.error('Error fetching server by invite:', error);
        return null;
    }
    return data;
}

// Join a server
export async function joinServer(serverId, userId, userName) {
    // First get current server data
    const { data: server, error: fetchError } = await supabase
        .from('servers')
        .select('members, member_details')
        .eq('id', serverId)
        .single();

    if (fetchError || !server) {
        console.error('Error fetching server:', fetchError);
        return false;
    }

    // Check if already a member
    if (server.members.includes(userId)) {
        return true; // Already a member
    }

    // Add user to members
    const { error } = await supabase
        .from('servers')
        .update({
            members: [...server.members, userId],
            member_details: {
                ...server.member_details,
                [userId]: {
                    username: userName,
                    joined_at: new Date().toISOString()
                }
            }
        })
        .eq('id', serverId);

    if (error) {
        console.error('Error joining server:', error);
        return false;
    }

    // Assign default Member role
    await assignDefaultRole(serverId, userId);

    return true;
}

// Generate invite code
function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
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
        return { error: error.message };
    }
    return { id: data?.id };
}

// ============ MESSAGES ============

// Get messages for a channel
export async function getMessages(channelId) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .is('deleted_at', null)
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
                event: '*',
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
export async function sendMessage(channelId, content, user, attachments = []) {
    const { error } = await supabase
        .from('messages')
        .insert({
            channel_id: channelId,
            content,
            author: {
                id: user.id,
                username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous',
                photoURL: user.user_metadata?.avatar_url
            },
            attachments
        });

    if (error) {
        console.error('Error sending message:', error);
        return { error: error.message };
    }
    return { success: true };
}

// Edit a message
export async function editMessage(messageId, newContent, userId) {
    // First verify the user owns this message
    const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('author')
        .eq('id', messageId)
        .single();

    if (fetchError || !message) {
        return { error: 'Message not found' };
    }

    if (message.author?.id !== userId) {
        return { error: 'You can only edit your own messages' };
    }

    const { error } = await supabase
        .from('messages')
        .update({
            content: newContent,
            edited_at: new Date().toISOString()
        })
        .eq('id', messageId);

    if (error) {
        console.error('Error editing message:', error);
        return { error: error.message };
    }
    return { success: true };
}

// Delete a message
export async function deleteMessage(messageId, userId, serverId) {
    // Check if user has permission
    const permissions = await getUserPermissions(serverId, userId);
    
    // First get the message to check ownership
    const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('author')
        .eq('id', messageId)
        .single();

    if (fetchError || !message) {
        return { error: 'Message not found' };
    }

    const isOwner = message.author?.id === userId;
    const canDeleteOthers = permissions?.delete_messages;

    if (!isOwner && !canDeleteOthers) {
        return { error: 'You do not have permission to delete this message' };
    }

    const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);

    if (error) {
        console.error('Error deleting message:', error);
        return { error: error.message };
    }
    return { success: true };
}

// ============ MESSAGE REACTIONS ============

// Add a reaction to a message
export async function addReaction(messageId, userId, emoji) {
    const { error } = await supabase
        .from('message_reactions')
        .insert({
            message_id: messageId,
            user_id: userId,
            emoji
        });

    if (error) {
        // Might already exist, which is fine
        if (error.code === '23505') {
            return { success: true, alreadyExists: true };
        }
        console.error('Error adding reaction:', error);
        return { error: error.message };
    }
    return { success: true };
}

// Remove a reaction from a message
export async function removeReaction(messageId, userId, emoji) {
    const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId)
        .eq('emoji', emoji);

    if (error) {
        console.error('Error removing reaction:', error);
        return { error: error.message };
    }
    return { success: true };
}

// Get reactions for a message
export async function getMessageReactions(messageId) {
    const { data, error } = await supabase
        .from('message_reactions')
        .select('*')
        .eq('message_id', messageId);

    if (error) {
        console.error('Error fetching reactions:', error);
        return [];
    }
    return data || [];
}

// Subscribe to reactions for a channel's messages
export function subscribeToReactions(channelId, callback) {
    const channel = supabase
        .channel(`reactions-${channelId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'message_reactions'
            },
            () => {
                callback();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// ============ ROLES & PERMISSIONS ============

// Create default roles for a new server
export async function createDefaultRoles(serverId, ownerId) {
    const roles = [
        {
            server_id: serverId,
            name: 'Owner',
            color: '#f0b232',
            permissions: { create_channels: true, delete_messages: true, manage_roles: true },
            position: 100
        },
        {
            server_id: serverId,
            name: 'Admin',
            color: '#f23f43',
            permissions: { create_channels: true, delete_messages: true, manage_roles: true },
            position: 50
        },
        {
            server_id: serverId,
            name: 'Moderator',
            color: '#23a55a',
            permissions: { create_channels: false, delete_messages: true, manage_roles: false },
            position: 25
        },
        {
            server_id: serverId,
            name: 'Member',
            color: '#99aab5',
            permissions: { create_channels: false, delete_messages: false, manage_roles: false },
            position: 0
        }
    ];

    const { data, error } = await supabase
        .from('roles')
        .insert(roles)
        .select();

    if (error) {
        console.error('Error creating default roles:', error);
        return null;
    }

    // Assign Owner role to the server creator
    const ownerRole = data.find(r => r.name === 'Owner');
    if (ownerRole) {
        await supabase
            .from('server_members')
            .upsert({
                server_id: serverId,
                user_id: ownerId,
                role_id: ownerRole.id,
                joined_at: new Date().toISOString()
            });
    }

    return data;
}

// Assign default member role when joining
export async function assignDefaultRole(serverId, userId) {
    // Get the Member role
    const { data: memberRole } = await supabase
        .from('roles')
        .select('id')
        .eq('server_id', serverId)
        .eq('name', 'Member')
        .single();

    if (memberRole) {
        await supabase
            .from('server_members')
            .upsert({
                server_id: serverId,
                user_id: userId,
                role_id: memberRole.id,
                joined_at: new Date().toISOString()
            });
    }
}

// Get roles for a server
export async function getServerRoles(serverId) {
    const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('server_id', serverId)
        .order('position', { ascending: false });

    if (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
    return data || [];
}

// Create a new role
export async function createRole(serverId, name, color, permissions) {
    const { data, error } = await supabase
        .from('roles')
        .insert({
            server_id: serverId,
            name,
            color: color || '#99aab5',
            permissions: permissions || { create_channels: false, delete_messages: false, manage_roles: false },
            position: 10
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating role:', error);
        return { error: error.message };
    }
    return { data };
}

// Update a role
export async function updateRole(roleId, updates) {
    const { error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id', roleId);

    if (error) {
        console.error('Error updating role:', error);
        return { error: error.message };
    }
    return { success: true };
}

// Delete a role
export async function deleteRole(roleId) {
    const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

    if (error) {
        console.error('Error deleting role:', error);
        return { error: error.message };
    }
    return { success: true };
}

// Assign a role to a user
export async function assignRole(serverId, userId, roleId) {
    const { error } = await supabase
        .from('server_members')
        .upsert({
            server_id: serverId,
            user_id: userId,
            role_id: roleId
        });

    if (error) {
        console.error('Error assigning role:', error);
        return { error: error.message };
    }
    return { success: true };
}

// Get user's role and permissions in a server
export async function getUserPermissions(serverId, userId) {
    // First check if user is the server owner
    const { data: server } = await supabase
        .from('servers')
        .select('owner_id')
        .eq('id', serverId)
        .single();

    if (server?.owner_id === userId) {
        return { create_channels: true, delete_messages: true, manage_roles: true, isOwner: true };
    }

    // Get user's role
    const { data: member } = await supabase
        .from('server_members')
        .select('role_id, roles(*)')
        .eq('server_id', serverId)
        .eq('user_id', userId)
        .single();

    if (member?.roles?.permissions) {
        return { ...member.roles.permissions, roleName: member.roles.name, roleColor: member.roles.color };
    }

    // Default permissions (no special perms)
    return { create_channels: false, delete_messages: false, manage_roles: false };
}

// Get all members with their roles for a server
export async function getServerMembers(serverId) {
    const { data, error } = await supabase
        .from('server_members')
        .select('*, roles(*)')
        .eq('server_id', serverId);

    if (error) {
        console.error('Error fetching server members:', error);
        return [];
    }
    return data || [];
}

// ============ DIRECT MESSAGES ============

// Get all DM conversations for a user
export async function getDMConversations(userId) {
    const { data, error } = await supabase
        .from('dm_conversations')
        .select('*')
        .contains('participant_ids', [userId])
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching DM conversations:', error);
        return [];
    }
    return data || [];
}

// Get or create a DM conversation between two users
export async function getOrCreateDMConversation(userId, otherUserId) {
    // First try to find existing conversation
    const { data: existing } = await supabase
        .from('dm_conversations')
        .select('*')
        .contains('participant_ids', [userId, otherUserId]);

    if (existing && existing.length > 0) {
        return existing[0];
    }

    // Create new conversation
    const { data, error } = await supabase
        .from('dm_conversations')
        .insert({
            participant_ids: [userId, otherUserId]
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating DM conversation:', error);
        return null;
    }
    return data;
}

// Get messages for a DM conversation
export async function getDMMessages(conversationId) {
    const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching DM messages:', error);
        return [];
    }
    return data || [];
}

// Subscribe to DM messages
export function subscribeToDMMessages(conversationId, callback) {
    // Initial fetch
    getDMMessages(conversationId).then(callback);

    // Real-time subscription
    const channel = supabase
        .channel(`dm-${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'direct_messages',
                filter: `conversation_id=eq.${conversationId}`
            },
            () => {
                getDMMessages(conversationId).then(callback);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// Send a DM
export async function sendDMMessage(conversationId, content, senderId, senderName, attachments = []) {
    // Update conversation timestamp
    await supabase
        .from('dm_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    const { error } = await supabase
        .from('direct_messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
            attachments
        });

    if (error) {
        console.error('Error sending DM:', error);
        return { error: error.message };
    }
    return { success: true };
}

// Subscribe to DM conversations
export function subscribeToDMConversations(userId, callback) {
    // Initial fetch
    getDMConversations(userId).then(callback);

    const channel = supabase
        .channel(`dm-conversations-${userId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'dm_conversations'
            },
            () => {
                getDMConversations(userId).then(callback);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// ============ READ STATES & UNREAD COUNTS ============

// Update read state for a channel
export async function updateReadState(userId, channelId, messageId) {
    const { error } = await supabase
        .from('read_states')
        .upsert({
            user_id: userId,
            channel_id: channelId,
            last_read_message_id: messageId,
            last_read_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error updating read state:', error);
    }
}

// Update read state for a DM conversation
export async function updateDMReadState(userId, conversationId, messageId) {
    const { error } = await supabase
        .from('read_states')
        .upsert({
            user_id: userId,
            conversation_id: conversationId,
            last_read_message_id: messageId,
            last_read_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error updating DM read state:', error);
    }
}

// Get unread counts for channels in a server
export async function getUnreadCounts(userId, channelIds) {
    const unreadCounts = {};
    
    for (const channelId of channelIds) {
        // Get last read message
        const { data: readState } = await supabase
            .from('read_states')
            .select('last_read_at')
            .eq('user_id', userId)
            .eq('channel_id', channelId)
            .single();

        const lastReadAt = readState?.last_read_at || '1970-01-01';

        // Count messages after last read
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channelId)
            .is('deleted_at', null)
            .gt('created_at', lastReadAt);

        unreadCounts[channelId] = count || 0;
    }

    return unreadCounts;
}

// Get unread counts for DM conversations
export async function getDMUnreadCounts(userId, conversationIds) {
    const unreadCounts = {};
    
    for (const conversationId of conversationIds) {
        const { data: readState } = await supabase
            .from('read_states')
            .select('last_read_at')
            .eq('user_id', userId)
            .eq('conversation_id', conversationId)
            .single();

        const lastReadAt = readState?.last_read_at || '1970-01-01';

        const { count } = await supabase
            .from('direct_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .gt('created_at', lastReadAt);

        unreadCounts[conversationId] = count || 0;
    }

    return unreadCounts;
}

// ============ TYPING INDICATORS ============

// Broadcast typing status
export function subscribeToTyping(channelId, userId, onTypingUpdate) {
    const channel = supabase.channel(`typing-${channelId}`, {
        config: {
            presence: {
                key: userId
            }
        }
    });

    channel
        .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const typingUsers = Object.entries(state)
                .filter(([key]) => key !== userId)
                .map(([key, value]) => ({
                    id: key,
                    username: value[0]?.username || 'Someone'
                }));
            onTypingUpdate(typingUsers);
        })
        .subscribe();

    return channel;
}

// Broadcast that user is typing
export async function broadcastTyping(channel, userId, username) {
    await channel.track({
        user_id: userId,
        username,
        typing: true
    });

    // Auto-untrack after 3 seconds
    setTimeout(async () => {
        await channel.untrack();
    }, 3000);
}

// ============ FILE UPLOADS ============

// Upload a file to Supabase Storage
export async function uploadFile(file, userId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `attachments/${fileName}`;

    const { error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

    if (error) {
        console.error('Error uploading file:', error);
        return { error: error.message };
    }

    const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

    return {
        success: true,
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type
    };
}

// ============ USER SEARCH ============

// Search users by username or email
export async function searchUsers(query, currentUserId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId)
        .limit(10);

    if (error) {
        console.error('Error searching users:', error);
        return [];
    }
    return data || [];
}

// ============ USER PROFILES ============

// Get user profile
export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching profile:', error);
    }
    return data;
}

// Create or update user profile
export async function upsertUserProfile(userId, profile) {
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            ...profile,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error upserting profile:', error);
        return false;
    }
    return true;
}
