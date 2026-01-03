import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { editMessage, deleteMessage, addReaction, removeReaction, getUserPermissions } from '../../supabase/database';
import { Edit2, Trash2, Smile, Check, X } from 'lucide-react';
import './Message.css';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

function Message({ message, showHeader, onAuthorClick, isDM = false, serverId }) {
    const { user, activeServer } = useApp();
    const [showActions, setShowActions] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);
    const [error, setError] = useState(null);
    const [reactions, setReactions] = useState(message.reactions || {});

    const currentServerId = serverId || activeServer?.id;
    const isOwnMessage = message.author?.id === user?.id;

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Just now';

        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today at ${date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })}`;
        } else if (diffDays === 1) {
            return `Yesterday at ${date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })}`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
    };

    // Generate consistent color for username
    const getUserColor = (username) => {
        const colors = [
            '#f23f43', '#f0b232', '#23a55a', '#00a8fc', '#5865f2', '#eb459f', '#fee75c'
        ];
        const hash = (username || 'User').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const handleEdit = async () => {
        if (!editContent.trim()) return;

        const result = await editMessage(message.id, editContent, user?.id);
        if (result.error) {
            setError(result.error);
            setTimeout(() => setError(null), 3000);
        } else {
            setIsEditing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        const result = await deleteMessage(message.id, user?.id, currentServerId);
        if (result.error) {
            setError(result.error);
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleReaction = async (emoji) => {
        const userReacted = reactions[emoji]?.includes(user?.id);

        if (userReacted) {
            // Remove reaction
            const result = await removeReaction(message.id, user?.id, emoji);
            if (!result.error) {
                setReactions(prev => ({
                    ...prev,
                    [emoji]: prev[emoji].filter(id => id !== user?.id)
                }));
            }
        } else {
            // Add reaction
            const result = await addReaction(message.id, user?.id, emoji);
            if (!result.error) {
                setReactions(prev => ({
                    ...prev,
                    [emoji]: [...(prev[emoji] || []), user?.id]
                }));
            }
        }
        setShowReactionPicker(false);
    };

    const renderReactions = () => {
        const reactionCounts = Object.entries(reactions).filter(([, users]) => users?.length > 0);
        if (reactionCounts.length === 0) return null;

        return (
            <div className="message-reactions">
                {reactionCounts.map(([emoji, users]) => (
                    <button
                        key={emoji}
                        className={`reaction-badge ${users.includes(user?.id) ? 'user-reacted' : ''}`}
                        onClick={() => handleReaction(emoji)}
                        title={`${users.length} reaction${users.length > 1 ? 's' : ''}`}
                    >
                        <span className="reaction-emoji">{emoji}</span>
                        <span className="reaction-count">{users.length}</span>
                    </button>
                ))}
            </div>
        );
    };

    const renderAttachments = () => {
        if (!message.attachments || message.attachments.length === 0) return null;

        return (
            <div className="message-attachments">
                {message.attachments.map((attachment, index) => {
                    if (attachment.type?.startsWith('image/')) {
                        return (
                            <a key={index} href={attachment.url} target="_blank" rel="noopener noreferrer">
                                <img src={attachment.url} alt={attachment.name} className="attachment-image" />
                            </a>
                        );
                    }
                    return (
                        <a key={index} href={attachment.url} target="_blank" rel="noopener noreferrer" className="attachment-file">
                            📎 {attachment.name}
                        </a>
                    );
                })}
            </div>
        );
    };

    const username = message.author?.username || 'Unknown User';
    const photoURL = message.author?.photoURL;

    return (
        <div
            className={`message ${showHeader ? 'has-header' : 'compact'}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
                setShowActions(false);
                setShowReactionPicker(false);
            }}
        >
            {error && (
                <div className="message-error">⚠️ {error}</div>
            )}

            {/* Action buttons */}
            {showActions && !isEditing && (
                <div className="message-actions">
                    <button
                        className="action-btn"
                        title="Add Reaction"
                        onClick={() => setShowReactionPicker(!showReactionPicker)}
                    >
                        <Smile size={16} />
                    </button>
                    {isOwnMessage && (
                        <button className="action-btn" title="Edit" onClick={() => setIsEditing(true)}>
                            <Edit2 size={16} />
                        </button>
                    )}
                    {(isOwnMessage || !isDM) && (
                        <button className="action-btn delete" title="Delete" onClick={handleDelete}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            )}

            {/* Reaction picker */}
            {showReactionPicker && (
                <div className="reaction-picker">
                    {REACTION_EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => handleReaction(emoji)}>
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {showHeader ? (
                <>
                    <div className="message-avatar" onClick={onAuthorClick}>
                        {photoURL ? (
                            <img src={photoURL} alt={username} className="avatar-img" />
                        ) : (
                            <div
                                className="avatar"
                                style={{
                                    background: `linear-gradient(135deg, ${getUserColor(username)}, #8b5cf6)`
                                }}
                            >
                                {username.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="message-content">
                        <div className="message-header">
                            <span
                                className="message-author"
                                style={{ color: getUserColor(username) }}
                                onClick={onAuthorClick}
                            >
                                {username}
                            </span>
                            <span className="message-timestamp">{formatTimestamp(message.timestamp)}</span>
                        </div>
                        {isEditing ? (
                            <div className="edit-input-container">
                                <input
                                    type="text"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleEdit();
                                        if (e.key === 'Escape') setIsEditing(false);
                                    }}
                                    autoFocus
                                />
                                <div className="edit-actions">
                                    <button className="edit-save" onClick={handleEdit}><Check size={16} /></button>
                                    <button className="edit-cancel" onClick={() => setIsEditing(false)}><X size={16} /></button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="message-text">
                                    {message.content}
                                    {message.edited_at && <span className="edited-indicator">(edited)</span>}
                                </div>
                                {renderAttachments()}
                            </>
                        )}
                        {renderReactions()}
                    </div>
                </>
            ) : (
                <>
                    <div className="message-timestamp-hover">
                        {new Date(message.timestamp).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </div>
                    <div className="message-content">
                        {isEditing ? (
                            <div className="edit-input-container">
                                <input
                                    type="text"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleEdit();
                                        if (e.key === 'Escape') setIsEditing(false);
                                    }}
                                    autoFocus
                                />
                                <div className="edit-actions">
                                    <button className="edit-save" onClick={handleEdit}><Check size={16} /></button>
                                    <button className="edit-cancel" onClick={() => setIsEditing(false)}><X size={16} /></button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="message-text">
                                    {message.content}
                                    {message.edited_at && <span className="edited-indicator">(edited)</span>}
                                </div>
                                {renderAttachments()}
                            </>
                        )}
                        {renderReactions()}
                    </div>
                </>
            )}
        </div>
    );
}

export default Message;
