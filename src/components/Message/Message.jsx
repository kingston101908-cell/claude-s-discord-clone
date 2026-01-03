import './Message.css'

function Message({ message, showHeader, onAuthorClick }) {
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Just now'

        const date = new Date(timestamp)
        const now = new Date()
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
            return `Today at ${date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })}`
        } else if (diffDays === 1) {
            return `Yesterday at ${date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })}`
        } else {
            return date.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        }
    }

    // Generate consistent color for username
    const getUserColor = (username) => {
        const colors = [
            '#f23f43', '#f0b232', '#23a55a', '#00a8fc', '#5865f2', '#eb459f', '#fee75c'
        ]
        const hash = (username || 'User').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return colors[hash % colors.length]
    }

    const username = message.author?.username || 'Unknown User'
    const photoURL = message.author?.photoURL

    return (
        <div className={`message ${showHeader ? 'has-header' : 'compact'}`}>
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
                        <div className="message-text">{message.content}</div>
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
                        <div className="message-text">{message.content}</div>
                    </div>
                </>
            )}
        </div>
    )
}

export default Message
