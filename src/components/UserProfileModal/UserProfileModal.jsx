import { useState, useEffect } from 'react';
import { getUserProfile } from '../../supabase/database';
import { X } from 'lucide-react';
import './UserProfileModal.css';

function UserProfileModal({ userId, username, photoURL, onClose }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProfile() {
            const data = await getUserProfile(userId);
            setProfile(data);
            setLoading(false);
        }
        loadProfile();
    }, [userId]);

    // Generate consistent color for username
    const getUserColor = (name) => {
        const colors = [
            '#f23f43', '#f0b232', '#23a55a', '#00a8fc', '#5865f2', '#eb459f'
        ];
        const hash = (name || 'User').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const userColor = getUserColor(username);

    // Default banner gradient based on user color
    const bannerStyle = profile?.banner_url
        ? { backgroundImage: `url(${profile.banner_url})` }
        : { background: `linear-gradient(135deg, ${userColor}, #1a1a2e)` };

    return (
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                <button className="profile-close" onClick={onClose}>
                    <X size={24} />
                </button>

                {/* Banner */}
                <div className="profile-banner" style={bannerStyle}></div>

                {/* Avatar */}
                <div className="profile-avatar-container">
                    {photoURL ? (
                        <img src={photoURL} alt={username} className="profile-avatar-img" />
                    ) : (
                        <div
                            className="profile-avatar"
                            style={{ background: `linear-gradient(135deg, ${userColor}, #8b5cf6)` }}
                        >
                            {(username || 'U').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="profile-status-badge online"></div>
                </div>

                {/* User Info */}
                <div className="profile-content">
                    <div className="profile-header">
                        <h2 className="profile-username" style={{ color: userColor }}>
                            {username || 'Unknown User'}
                        </h2>
                        <span className="profile-tag">#{userId?.slice(-4) || '0000'}</span>
                    </div>

                    {loading ? (
                        <div className="profile-loading">Loading profile...</div>
                    ) : (
                        <>
                            {/* About Me Section */}
                            <div className="profile-section">
                                <h3>ABOUT ME</h3>
                                <p>{profile?.bio || 'No bio set.'}</p>
                            </div>

                            {/* Member Since */}
                            <div className="profile-section">
                                <h3>DISCORD MEMBER SINCE</h3>
                                <p>{profile?.created_at
                                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })
                                    : 'Unknown'
                                }</p>
                            </div>

                            {/* Note Section */}
                            <div className="profile-section">
                                <h3>NOTE</h3>
                                <input
                                    type="text"
                                    placeholder="Click to add a note"
                                    className="profile-note-input"
                                />
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="profile-actions">
                        <button className="profile-action-btn primary">Send Message</button>
                        <button className="profile-action-btn secondary">Add Friend</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserProfileModal;
