import { useState, useEffect } from 'react';
import { getUserProfile, upsertUserProfile } from '../../supabase/database';
import { X, Camera } from 'lucide-react';
import './UserProfileModal.css';

function UserProfileModal({ userId, username, photoURL, onClose, isOwnProfile = false }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        bio: '',
        banner_url: ''
    });

    useEffect(() => {
        async function loadProfile() {
            const data = await getUserProfile(userId);
            setProfile(data);
            if (data) {
                setEditForm({
                    bio: data.bio || '',
                    banner_url: data.banner_url || ''
                });
            }
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
    const bannerStyle = (editing ? editForm.banner_url : profile?.banner_url)
        ? { backgroundImage: `url(${editing ? editForm.banner_url : profile.banner_url})` }
        : { background: `linear-gradient(135deg, ${userColor}, #1a1a2e)` };

    const handleSave = async () => {
        setSaving(true);
        const success = await upsertUserProfile(userId, {
            username: username,
            bio: editForm.bio,
            banner_url: editForm.banner_url
        });

        if (success) {
            setProfile({
                ...profile,
                bio: editForm.bio,
                banner_url: editForm.banner_url
            });
            setEditing(false);
        }
        setSaving(false);
    };

    // Check if viewing own profile
    const canEdit = isOwnProfile;

    return (
        <div className="profile-modal-overlay" onClick={onClose}>
            <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                <button className="profile-close" onClick={onClose}>
                    <X size={24} />
                </button>

                {/* Banner */}
                <div className="profile-banner" style={bannerStyle}>
                    {editing && (
                        <div className="banner-edit-overlay">
                            <Camera size={24} />
                            <input
                                type="text"
                                placeholder="Paste banner image URL..."
                                value={editForm.banner_url}
                                onChange={(e) => setEditForm({ ...editForm, banner_url: e.target.value })}
                                className="banner-url-input"
                            />
                        </div>
                    )}
                </div>

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
                    ) : editing ? (
                        <>
                            {/* Edit Mode */}
                            <div className="profile-section">
                                <h3>ABOUT ME</h3>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    className="profile-bio-input"
                                    maxLength={190}
                                    rows={4}
                                />
                                <div className="char-count">{editForm.bio.length}/190</div>
                            </div>

                            <div className="profile-actions">
                                <button
                                    className="profile-action-btn primary"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    className="profile-action-btn secondary"
                                    onClick={() => setEditing(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* View Mode */}
                            <div className="profile-section">
                                <h3>ABOUT ME</h3>
                                <p>{profile?.bio || 'No bio set.'}</p>
                            </div>

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

                            {canEdit && (
                                <div className="profile-actions">
                                    <button
                                        className="profile-action-btn primary"
                                        onClick={() => setEditing(true)}
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                            )}

                            {!canEdit && (
                                <div className="profile-actions">
                                    <button className="profile-action-btn primary">Send Message</button>
                                    <button className="profile-action-btn secondary">Add Friend</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserProfileModal;
