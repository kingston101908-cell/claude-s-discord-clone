import { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { subscribeToAuthChanges } from '../supabase/auth';
import {
    subscribeToServers,
    subscribeToChannels,
    subscribeToMessages,
    createServer as dbCreateServer,
    createChannel as dbCreateChannel,
    sendMessage as dbSendMessage
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
            };
        }

        case ActionTypes.SELECT_CHANNEL:
            return { ...state, activeChannelId: action.payload, messages: [] };

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

    // Subscribe to messages when channel is selected
    useEffect(() => {
        if (!state.activeChannelId) return;

        const unsubscribe = subscribeToMessages(state.activeChannelId, (messages) => {
            dispatch({ type: ActionTypes.SET_MESSAGES, payload: messages });
        });

        return () => unsubscribe();
    }, [state.activeChannelId]);

    // Computed values
    const activeServer = useMemo(() =>
        state.servers.find(s => s.id === state.activeServerId) || null,
        [state.servers, state.activeServerId]
    );

    const activeChannel = useMemo(() =>
        state.channels.find(c => c.id === state.activeChannelId) || null,
        [state.channels, state.activeChannelId]
    );

    // Action creators
    const selectServer = useCallback((serverId) => {
        dispatch({ type: ActionTypes.SELECT_SERVER, payload: serverId });
    }, []);

    const selectChannel = useCallback((channelId) => {
        dispatch({ type: ActionTypes.SELECT_CHANNEL, payload: channelId });
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
        const channelId = await dbCreateChannel(serverId, name, category);
        if (channelId) {
            dispatch({ type: ActionTypes.SELECT_CHANNEL, payload: channelId });
        }
    }, []);

    const sendMessage = useCallback(async (channelId, content) => {
        if (!state.user) return;
        await dbSendMessage(channelId, content, state.user);
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
        selectServer,
        selectChannel,
        addServer,
        addChannel,
        sendMessage,
    }), [state, activeServer, activeChannel, selectServer, selectChannel, addServer, addChannel, sendMessage]);

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
