import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { searchUsers, getOrCreateDMConversation, getUserProfile } from '../../supabase/database';
import { MessageSquare, Search, X, Plus } from 'lucide-react';
import './DMSidebar.css';

function DMSidebar({ onSelectConversation, activeConversationId, conversations, unreadCounts }) {
    const { user, currentUser } = useApp();
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [participantProfiles, setParticipantProfiles] = useState({});

    // Load participant profiles for conversations
    useEffect(() => {
        const loadProfiles = async () => {
            const profiles = {};
            for (const conv of conversations) {
                const otherUserId = conv.participant_ids.find(id => id !== user?.id);
                if (otherUserId && !profiles[otherUserId]) {
                    const profile = await getUserProfile(otherUserId);
                    profiles[otherUserId] = profile;
                }
            }
            setParticipantProfiles(profiles);
        };
        if (conversations.length > 0) {
            loadProfiles();
        }
    }, [conversations, user?.id]);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const results = await searchUsers(query, user?.id);
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleStartDM = async (otherUser) => {
        const conversation = await getOrCreateDMConversation(user?.id, otherUser.id);
        if (conversation) {
            onSelectConversation(conversation, otherUser);
            setShowSearch(false);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const getOtherParticipant = (conv) => {
        const otherUserId = conv.participant_ids.find(id => id !== user?.id);
        return participantProfiles[otherUserId] || { username: 'Unknown User' };
    };

    return (
        <div className="dm-sidebar">
            <div className="dm-header">
                <h3>Direct Messages</h3>
                <button
                    className="new-dm-btn"
                    onClick={() => setShowSearch(!showSearch)}
                    title="New Message"
                >
                    {showSearch ? <X size={20} /> : <Plus size={20} />}
                </button>
            </div>

            {showSearch && (
                <div className="dm-search">
                    <div className="search-input-wrapper">
                        <Search size={16} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Find or start a conversation"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {isSearching && (
                        <div className="search-loading">Searching...</div>
                    )}

                    {searchResults.length > 0 && (
                        <div className="search-results">
                            {searchResults.map((result) => (
                                <button
                                    key={result.id}
                                    className="search-result-item"
                                    onClick={() => handleStartDM(result)}
                                >
                                    <div className="result-avatar">
                                        {result.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span>{result.username || 'Unknown'}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                        <div className="no-results">No users found</div>
                    )}
                </div>
            )}

            <div className="dm-list">
                {conversations.length === 0 ? (
                    <div className="no-dms">
                        <MessageSquare size={32} />
                        <p>No direct messages yet</p>
                        <button onClick={() => setShowSearch(true)}>
                            Start a conversation
                        </button>
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const otherUser = getOtherParticipant(conv);
                        const unreadCount = unreadCounts[conv.id] || 0;

                        return (
                            <button
                                key={conv.id}
                                className={`dm-item ${activeConversationId === conv.id ? 'active' : ''}`}
                                onClick={() => onSelectConversation(conv, otherUser)}
                            >
                                <div className="dm-avatar">
                                    {otherUser.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="dm-username">{otherUser.username || 'Unknown'}</span>
                                {unreadCount > 0 && (
                                    <span className="unread-badge">{unreadCount}</span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default DMSidebar;
