import { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { subscribeToAuthChanges } from '../supabase/auth';
import {
    subscribeToServers,
    subscribeToChannels,
    subscribeToMessages,
    createServer as dbCreateServer,
    createChannel as dbCreateChannel,
    sendMessage as dbSendMessage,
    getUserPermissions,
    getUnreadCounts,
    updateReadState,
    subscribeToDMConversations,
    getDMUnreadCounts
} from '../supabase/database';

// Initial state
const initialState = {
    user: null,
    authLoading: true,
    servers: [],
    channels: [],
    messages: [],
    activeServerId: null,
    activeChannelId: null,
    permissions: null,
    unreadCounts: {},
    dmConversations: [],
    dmUnreadCounts: {},
    viewMode: 'server', // 'server' or 'dm'
};

// Action types
const ActionTypes = {
    SET_USER: 'SET_USER',
    SET_AUTH_LOADING: 'SET_AUTH_LOADING',
    SET_SERVERS: 'SET_SERVERS',
    SET_CHANNELS: 'SET_CHANNELS',
    SET_MESSAGES: 'SET_MESSAGES',
    SELECT_SERVER: 'SELECT_SERVER',
    SELECT_CHANNEL: 'SELECT_CHANNEL',
    SET_PERMISSIONS: 'SET_PERMISSIONS',
    SET_UNREAD_COUNTS: 'SET_UNREAD_COUNTS',
    SET_DM_CONVERSATIONS: 'SET_DM_CONVERSATIONS',
    SET_DM_UNREAD_COUNTS: 'SET_DM_UNREAD_COUNTS',
    SET_VIEW_MODE: 'SET_VIEW_MODE',
};

// Reducer
function appReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_USER:
            return { ...state, user: action.payload, authLoading: false };

        case ActionTypes.SET_AUTH_LOADING:
            return { ...state, authLoading: action.payload };

        case ActionTypes.SET_SERVERS:
            return { ...state, servers: action.payload };

        case ActionTypes.SET_CHANNELS:
            return { ...state, channels: action.payload };

        case ActionTypes.SET_MESSAGES:
            return { ...state, messages: action.payload };

        case ActionTypes.SELECT_SERVER: {
            return {
                ...state,
                activeServerId: action.payload,
                activeChannelId: null,
                channels: [],
                messages: [],
                permissions: null,
                viewMode: 'server',
            };
        }

        case ActionTypes.SELECT_CHANNEL:
            return { ...state, activeChannelId: action.payload, messages: [] };

        case ActionTypes.SET_PERMISSIONS:
            return { ...state, permissions: action.payload };

        case ActionTypes.SET_UNREAD_COUNTS:
            return { ...state, unreadCounts: { ...state.unreadCounts, ...action.payload } };

        case ActionTypes.SET_DM_CONVERSATIONS:
            return { ...state, dmConversations: action.payload };

        case ActionTypes.SET_DM_UNREAD_COUNTS:
            return { ...state, dmUnreadCounts: action.payload };

        case ActionTypes.SET_VIEW_MODE:
            return { ...state, viewMode: action.payload };

        default:
            return state;
    }
}

// Context
const AppContext = createContext(null);

// Provider component
export function AppProvider({ children }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Subscribe to auth changes
    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((user) => {
            dispatch({ type: ActionTypes.SET_USER, payload: user });
        });

        return () => unsubscribe();
    }, []);

    // Subscribe to servers when user is authenticated
    useEffect(() => {
        if (!state.user) return;

        const unsubscribe = subscribeToServers(state.user.id, (servers) => {
            dispatch({ type: ActionTypes.SET_SERVERS, payload: servers });

            // Auto-select first server if none selected
            if (servers.length > 0 && !state.activeServerId) {
                dispatch({ type: ActionTypes.SELECT_SERVER, payload: servers[0].id });
            }
        });

        return () => unsubscribe();
    }, [state.user, state.activeServerId]);

    // Subscribe to DM conversations
    useEffect(() => {
        if (!state.user) return;

        const unsubscribe = subscribeToDMConversations(state.user.id, (conversations) => {
            dispatch({ type: ActionTypes.SET_DM_CONVERSATIONS, payload: conversations });
        });

        return () => unsubscribe();
    }, [state.user]);

    // Update DM unread counts
    useEffect(() => {
        if (!state.user || state.dmConversations.length === 0) return;

        const updateDMUnread = async () => {
            const conversationIds = state.dmConversations.map(c => c.id);
            const counts = await getDMUnreadCounts(state.user.id, conversationIds);
            dispatch({ type: ActionTypes.SET_DM_UNREAD_COUNTS, payload: counts });
        };

        updateDMUnread();
        const interval = setInterval(updateDMUnread, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [state.user, state.dmConversations]);

    // Subscribe to channels when server is selected
    useEffect(() => {
        if (!state.activeServerId) return;

        const unsubscribe = subscribeToChannels(state.activeServerId, (channels) => {
            dispatch({ type: ActionTypes.SET_CHANNELS, payload: channels });

            // Auto-select first channel if none selected
            if (channels.length > 0 && !state.activeChannelId) {
                dispatch({ type: ActionTypes.SELECT_CHANNEL, payload: channels[0].id });
            }
        });

        return () => unsubscribe();
    }, [state.activeServerId, state.activeChannelId]);

    // Load permissions when server is selected
    useEffect(() => {
        if (!state.activeServerId || !state.user) return;

        const loadPermissions = async () => {
            const perms = await getUserPermissions(state.activeServerId, state.user.id);
            dispatch({ type: ActionTypes.SET_PERMISSIONS, payload: perms });
        };

        loadPermissions();
    }, [state.activeServerId, state.user]);

    // Update unread counts for channels
    useEffect(() => {
        if (!state.user || state.channels.length === 0) return;

        const updateUnread = async () => {
            const channelIds = state.channels.map(c => c.id);
            const counts = await getUnreadCounts(state.user.id, channelIds);
            dispatch({ type: ActionTypes.SET_UNREAD_COUNTS, payload: counts });
        };

        updateUnread();
    }, [state.user, state.channels, state.messages]);

    // Subscribe to messages when channel is selected
    useEffect(() => {
        if (!state.activeChannelId) return;

        const unsubscribe = subscribeToMessages(state.activeChannelId, (messages) => {
            dispatch({ type: ActionTypes.SET_MESSAGES, payload: messages });
            // Update read state
            if (messages.length > 0 && state.user) {
                updateReadState(state.user.id, state.activeChannelId, messages[messages.length - 1].id);
            }
        });

        return () => unsubscribe();
    }, [state.activeChannelId, state.user]);

    // Computed values
    const activeServer = useMemo(() =>
        state.servers.find(s => s.id === state.activeServerId) || null,
        [state.servers, state.activeServerId]
    );

    const activeChannel = useMemo(() =>
        state.channels.find(c => c.id === state.activeChannelId) || null,
        [state.channels, state.activeChannelId]
    );

    // Calculate total unread for servers
    const serverUnreadCounts = useMemo(() => {
        const counts = {};
        for (const server of state.servers) {
            const serverChannelIds = state.channels
                .filter(c => c.server_id === server.id)
                .map(c => c.id);
            counts[server.id] = serverChannelIds.reduce((sum, id) => sum + (state.unreadCounts[id] || 0), 0);
        }
        return counts;
    }, [state.servers, state.channels, state.unreadCounts]);

    // Total DM unread
    const totalDMUnread = useMemo(() => {
        return Object.values(state.dmUnreadCounts).reduce((sum, count) => sum + count, 0);
    }, [state.dmUnreadCounts]);

    // Action creators
    const selectServer = useCallback((serverId) => {
        dispatch({ type: ActionTypes.SELECT_SERVER, payload: serverId });
    }, []);

    const selectChannel = useCallback((channelId) => {
        dispatch({ type: ActionTypes.SELECT_CHANNEL, payload: channelId });
    }, []);

    const setViewMode = useCallback((mode) => {
        dispatch({ type: ActionTypes.SET_VIEW_MODE, payload: mode });
    }, []);

    const addServer = useCallback(async (name, icon) => {
        if (!state.user) return;
        const userName = state.user.user_metadata?.full_name || state.user.email?.split('@')[0] || 'User';
        const serverId = await dbCreateServer(name, icon, state.user.id, userName);
        if (serverId) {
            dispatch({ type: ActionTypes.SELECT_SERVER, payload: serverId });
        }
    }, [state.user]);

    const addChannel = useCallback(async (serverId, name, category) => {
        // Check permission
        if (!state.permissions?.create_channels && !state.permissions?.isOwner) {
            return { error: 'You do not have permission to create channels' };
        }
        const result = await dbCreateChannel(serverId, name, category);
        if (result.id) {
            dispatch({ type: ActionTypes.SELECT_CHANNEL, payload: result.id });
        }
        return result;
    }, [state.permissions]);

    const sendMessage = useCallback(async (channelId, content, attachments = []) => {
        if (!state.user) return;
        await dbSendMessage(channelId, content, state.user, attachments);
    }, [state.user]);

    const value = useMemo(() => ({
        ...state,
        currentUser: state.user ? {
            id: state.user.id,
            username: state.user.user_metadata?.full_name || state.user.email?.split('@')[0] || 'Anonymous',
            photoURL: state.user.user_metadata?.avatar_url,
            status: 'online',
        } : null,
        activeServer,
        activeChannel,
        activeMessages: state.messages,
        serverUnreadCounts,
        totalDMUnread,
        selectServer,
        selectChannel,
        setViewMode,
        addServer,
        addChannel,
        sendMessage,
    }), [state, activeServer, activeChannel, serverUnreadCounts, totalDMUnread, selectServer, selectChannel, setViewMode, addServer, addChannel, sendMessage]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

// Custom hook
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

export default AppContext;
