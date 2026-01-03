import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { signOut } from '../../supabase/auth';
import { Hash, Plus, ChevronDown, Mic, MicOff, Headphones, Volume2, VolumeX, LogOut, UserPlus, Settings, X, Shield } from 'lucide-react';
import InviteModal from '../InviteModal/InviteModal';
import UserProfileModal from '../UserProfileModal/UserProfileModal';
import RoleManagement from '../RoleManagement/RoleManagement';
import './ChannelSidebar.css';

function ChannelSidebar({ onAddChannel }) {
    const {
        activeServer,
        channels,
        activeChannelId,
        selectChannel,
        currentUser,
        permissions,
        unreadCounts,
        user
    } = useApp();

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showServerMenu, setShowServerMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showRoleManagement, setShowRoleManagement] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isDeafened, setIsDeafened] = useState(false);
    const [addChannelError, setAddChannelError] = useState(null);

    if (!activeServer) return null;

    // Group channels by category
    const channelsByCategory = channels.reduce((acc, channel) => {
        const category = channel.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(channel);
        return acc;
    }, {});

    const handleSignOut = async () => {
        await signOut();
    };

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    const toggleDeafen = () => {
        if (!isDeafened) {
            setIsMuted(true); // Deafening also mutes
        }
        setIsDeafened(!isDeafened);
    };

    const handleAddChannel = async () => {
        const result = await onAddChannel();
        if (result?.error) {
            setAddChannelError(result.error);
            setTimeout(() => setAddChannelError(null), 3000);
        }
    };

    const memberCount = activeServer.members?.length || 1;
    const isOwner = activeServer.owner_id === user?.id;
    const canManageRoles = isOwner || permissions?.manage_roles;
    const canCreateChannels = isOwner || permissions?.create_channels;

    return (
        <>
            <div className="channel-sidebar">
                {/* Server Header */}
                <div className="channel-header">
                    <button
                        className={`channel-header-button ${showServerMenu ? 'active' : ''}`}
                        onClick={() => setShowServerMenu(!showServerMenu)}
                    >
                        <span className="server-name">{activeServer.name}</span>
                        {showServerMenu ? <X size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {/* Server Dropdown Menu */}
                    {showServerMenu && (
                        <div className="server-menu">
                            <button className="server-menu-item" onClick={() => {
                                setShowInviteModal(true);
                                setShowServerMenu(false);
                            }}>
                                <UserPlus size={18} />
                                <span>Invite People</span>
                            </button>
                            {canManageRoles && (
                                <button className="server-menu-item" onClick={() => {
                                    setShowRoleManagement(true);
                                    setShowServerMenu(false);
                                }}>
                                    <Shield size={18} />
                                    <span>Manage Roles</span>
                                </button>
                            )}
                            <button className="server-menu-item" onClick={() => setShowServerMenu(false)}>
                                <Settings size={18} />
                                <span>Server Settings</span>
                            </button>
                            <div className="server-menu-divider"></div>
                            <div className="server-menu-info">
                                <span>Members: {memberCount}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {addChannelError && (
                    <div className="channel-error-banner">
                        ⚠️ {addChannelError}
                    </div>
                )}

                {/* Invite Banner */}
                <div className="invite-banner" onClick={() => setShowInviteModal(true)}>
                    <UserPlus size={18} />
                    <span>Invite People</span>
                </div>

                {/* Channel List */}
                <div className="channel-list">
                    {Object.entries(channelsByCategory).map(([category, categoryChannels]) => (
                        <div key={category} className="channel-category">
                            <div className="category-header">
                                <ChevronDown size={12} className="category-chevron" />
                                <span className="category-name">{category}</span>
                                {canCreateChannels && (
                                    <button
                                        className="add-channel-btn"
                                        onClick={handleAddChannel}
                                        title="Create Channel"
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="category-channels">
                                {categoryChannels.map(channel => {
                                    const unreadCount = unreadCounts[channel.id] || 0;
                                    return (
                                        <button
                                            key={channel.id}
                                            className={`channel-item ${activeChannelId === channel.id ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
                                            onClick={() => selectChannel(channel.id)}
                                        >
                                            <Hash size={20} className="channel-hash" />
                                            <span className="channel-name">{channel.name}</span>
                                            {unreadCount > 0 && (
                                                <span className="channel-unread-badge">{unreadCount}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {channels.length === 0 && (
                        <div className="no-channels">
                            <p>No channels yet</p>
                            {canCreateChannels ? (
                                <button onClick={handleAddChannel} className="create-channel-link">
                                    Create one
                                </button>
                            ) : (
                                <p className="no-permission-text">You don't have permission to create channels</p>
                            )}
                        </div>
                    )}
                </div>

                {/* User Panel */}
                <div className="user-panel">
                    <div className="user-info" onClick={() => setShowProfileModal(true)}>
                        <div className="user-avatar">
                            {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt={currentUser.username} className="avatar-image-img" />
                            ) : (
                                <div className="avatar-image">
                                    {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <div className={`status-indicator ${currentUser?.status || 'online'}`}></div>
                        </div>
                        <div className="user-details">
                            <div className="username">{currentUser?.username || 'User'}</div>
                            <div className="user-status">Online</div>
                        </div>
                    </div>
                    <div className="user-actions">
                        <button
                            className={`user-action-btn ${isMuted ? 'active danger' : ''}`}
                            title={isMuted ? "Unmute" : "Mute"}
                            onClick={toggleMute}
                        >
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button
                            className={`user-action-btn ${isDeafened ? 'active danger' : ''}`}
                            title={isDeafened ? "Undeafen" : "Deafen"}
                            onClick={toggleDeafen}
                        >
                            {isDeafened ? <VolumeX size={20} /> : <Headphones size={20} />}
                        </button>
                        <button className="user-action-btn" title="Sign Out" onClick={handleSignOut}>
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {showInviteModal && (
                <InviteModal
                    server={activeServer}
                    onClose={() => setShowInviteModal(false)}
                />
            )}

            {showProfileModal && (
                <UserProfileModal
                    userId={currentUser?.id}
                    username={currentUser?.username}
                    photoURL={currentUser?.photoURL}
                    onClose={() => setShowProfileModal(false)}
                    isOwnProfile={true}
                />
            )}

            {showRoleManagement && (
                <RoleManagement
                    serverId={activeServer.id}
                    onClose={() => setShowRoleManagement(false)}
                />
            )}
        </>
    );
}

export default ChannelSidebar;
