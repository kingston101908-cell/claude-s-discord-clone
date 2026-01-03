import { useApp } from '../../context/AppContext'
import { signOut } from '../../supabase/auth'
import { Hash, Plus, ChevronDown, Settings, Mic, Headphones, LogOut } from 'lucide-react'
import './ChannelSidebar.css'

function ChannelSidebar({ onAddChannel }) {
    const {
        activeServer,
        channels,
        activeChannelId,
        selectChannel,
        currentUser
    } = useApp()

    if (!activeServer) return null

    // Group channels by category
    const channelsByCategory = channels.reduce((acc, channel) => {
        const category = channel.category || 'Other'
        if (!acc[category]) acc[category] = []
        acc[category].push(channel)
        return acc
    }, {})

    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <div className="channel-sidebar">
            {/* Server Header */}
            <div className="channel-header">
                <button className="channel-header-button">
                    <span className="server-name">{activeServer.name}</span>
                    <ChevronDown size={18} />
                </button>
            </div>

            {/* Channel List */}
            <div className="channel-list">
                {Object.entries(channelsByCategory).map(([category, categoryChannels]) => (
                    <div key={category} className="channel-category">
                        <div className="category-header">
                            <ChevronDown size={12} className="category-chevron" />
                            <span className="category-name">{category}</span>
                            <button
                                className="add-channel-btn"
                                onClick={onAddChannel}
                                title="Create Channel"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className="category-channels">
                            {categoryChannels.map(channel => (
                                <button
                                    key={channel.id}
                                    className={`channel-item ${activeChannelId === channel.id ? 'active' : ''}`}
                                    onClick={() => selectChannel(channel.id)}
                                >
                                    <Hash size={20} className="channel-hash" />
                                    <span className="channel-name">{channel.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {channels.length === 0 && (
                    <div className="no-channels">
                        <p>No channels yet</p>
                        <button onClick={onAddChannel} className="create-channel-link">
                            Create one
                        </button>
                    </div>
                )}
            </div>

            {/* User Panel */}
            <div className="user-panel">
                <div className="user-info">
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
                    <button className="user-action-btn" title="Mute">
                        <Mic size={20} />
                    </button>
                    <button className="user-action-btn" title="Deafen">
                        <Headphones size={20} />
                    </button>
                    <button className="user-action-btn" title="Sign Out" onClick={handleSignOut}>
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChannelSidebar
