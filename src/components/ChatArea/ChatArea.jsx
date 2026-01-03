import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import Message from '../Message/Message'
import UserProfileModal from '../UserProfileModal/UserProfileModal'
import TypingIndicator from '../TypingIndicator/TypingIndicator'
import {
    subscribeToTyping,
    broadcastTyping,
    uploadFile
} from '../../supabase/database'
import { Hash, Users, Bell, Pin, Search, Inbox, HelpCircle, PlusCircle, Gift, ImagePlus, Smile, Send, Menu } from 'lucide-react'
import './ChatArea.css'

// Constants for anti-spam
const MAX_MESSAGE_LENGTH = 2000
const RATE_LIMIT_MESSAGES = 3
const RATE_LIMIT_WINDOW_MS = 5000 // 5 seconds

function QuestionCircle(props) {
    return <HelpCircle {...props} />
}

function ChatArea({ onToggleMemberList, showMemberList, onToggleMobileMenu }) {
    const {
        activeChannel,
        activeChannelId,
        activeServer,
        activeMessages,
        sendMessage,
        user,
        currentUser
    } = useApp()

    const [messageInput, setMessageInput] = useState('')
    const [selectedAuthor, setSelectedAuthor] = useState(null)
    const [rateLimitError, setRateLimitError] = useState(null)
    const [typingUsers, setTypingUsers] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const messagesEndRef = useRef(null)
    const recentMessagesRef = useRef([]) // Track recent message timestamps
    const typingChannelRef = useRef(null)
    const fileInputRef = useRef(null)

    // Subscribe to typing indicators
    useEffect(() => {
        if (!activeChannelId || !user?.id) return;

        const channel = subscribeToTyping(activeChannelId, user.id, setTypingUsers);
        typingChannelRef.current = channel;

        return () => {
            if (typingChannelRef.current) {
                typingChannelRef.current.unsubscribe();
            }
        };
    }, [activeChannelId, user?.id]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [activeMessages])

    // Clear rate limit error after 3 seconds
    useEffect(() => {
        if (rateLimitError) {
            const timer = setTimeout(() => setRateLimitError(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [rateLimitError])

    const checkRateLimit = () => {
        const now = Date.now()
        // Filter messages within the rate limit window
        recentMessagesRef.current = recentMessagesRef.current.filter(
            timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
        )

        if (recentMessagesRef.current.length >= RATE_LIMIT_MESSAGES) {
            return false // Rate limited
        }

        recentMessagesRef.current.push(now)
        return true
    }

    const handleSendMessage = async () => {
        const trimmedMessage = messageInput.trim()

        if (!trimmedMessage || !activeChannelId) return

        // Check message length
        if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
            setRateLimitError(`Message too long! Max ${MAX_MESSAGE_LENGTH} characters.`)
            return
        }

        // Check rate limit
        if (!checkRateLimit()) {
            setRateLimitError('Slow down! You can only send 3 messages every 5 seconds.')
            return
        }

        sendMessage(activeChannelId, trimmedMessage)
        setMessageInput('')
        setRateLimitError(null)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleAuthorClick = (author) => {
        setSelectedAuthor(author)
    }

    const handleInputChange = (e) => {
        const value = e.target.value
        setMessageInput(value)

        // Broadcast typing
        if (typingChannelRef.current && value.length > 0) {
            broadcastTyping(typingChannelRef.current, user?.id, currentUser?.username);
        }
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const result = await uploadFile(file, user?.id);
        setIsUploading(false);

        if (result.success) {
            // Send message with attachment
            const attachmentMessage = file.type.startsWith('image/')
                ? `![${file.name}](${result.url})`
                : `[📎 ${file.name}](${result.url})`;

            await sendMessage(activeChannelId, attachmentMessage, [{
                url: result.url,
                name: file.name,
                type: file.type,
                size: file.size
            }]);
        } else {
            setRateLimitError('Failed to upload file: ' + result.error);
        }

        e.target.value = '';
    };

    if (!activeChannel) {
        return (
            <div className="chat-area">
                <div className="chat-empty">
                    <div className="empty-icon">💬</div>
                    <h3>Select a channel</h3>
                    <p>Choose a channel from the sidebar to start chatting</p>
                </div>
            </div>
        )
    }

    // Check if messages are from the same author (for grouping)
    const shouldShowHeader = (message, index) => {
        if (index === 0) return true
        const prevMessage = activeMessages[index - 1]
        if (prevMessage.author?.id !== message.author?.id) return true

        // Show header if more than 5 minutes between messages
        const prevTime = new Date(prevMessage.timestamp)
        const currTime = new Date(message.timestamp)
        return (currTime - prevTime) > 5 * 60 * 1000
    }

    const memberCount = activeServer?.members?.length || 0
    const isOverLimit = messageInput.length > MAX_MESSAGE_LENGTH
    const charCount = messageInput.length

    return (
        <main className="chat-area">
            {/* Channel Header */}
            <header className="chat-header">
                <div className="header-left">
                    <button className="mobile-menu-btn" onClick={onToggleMobileMenu}>
                        <Menu size={20} />
                    </button>
                    <Hash size={24} className="header-hash" />
                    <h2 className="header-title">{activeChannel.name}</h2>
                </div>

                <div className="header-right">
                    <button className="header-icon-btn" title="Pinned Messages">
                        <Pin size={20} />
                    </button>
                    <button className="header-icon-btn" title="Notification Settings">
                        <Bell size={20} />
                    </button>
                    <button
                        className={`header-icon-btn member-count-btn ${showMemberList ? 'active' : ''}`}
                        onClick={onToggleMemberList}
                        title="Member List"
                    >
                        <Users size={20} />
                        <span className="member-count">{memberCount}</span>
                    </button>

                    <div className="header-search">
                        <input type="text" placeholder="Search" />
                        <Search size={16} className="search-icon" />
                    </div>

                    <button className="header-icon-btn" title="Inbox">
                        <Inbox size={20} />
                    </button>
                    <button className="header-icon-btn" title="Help">
                        <QuestionCircle size={20} />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="chat-messages">
                {/* Channel Welcome */}
                <div className="channel-welcome">
                    <div className="welcome-icon">
                        <Hash size={42} />
                    </div>
                    <h1>Welcome to #{activeChannel.name}!</h1>
                    <p>This is the start of the #{activeChannel.name} channel.</p>
                </div>

                {/* Message List */}
                {activeMessages.map((message, index) => (
                    <Message
                        key={message.id}
                        message={message}
                        showHeader={shouldShowHeader(message, index)}
                        onAuthorClick={() => handleAuthorClick(message.author)}
                        serverId={activeServer?.id}
                    />
                ))}

                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                    <TypingIndicator users={typingUsers} />
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="chat-input-container">
                {rateLimitError && (
                    <div className="rate-limit-error">
                        ⚠️ {rateLimitError}
                    </div>
                )}

                {isUploading && (
                    <div className="upload-progress-bar">
                        Uploading file...
                    </div>
                )}

                <div className={`chat-input-wrapper ${isOverLimit ? 'over-limit' : ''}`}>
                    <button
                        className="input-icon-btn"
                        title="Upload files"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        <PlusCircle size={24} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        hidden
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                    />

                    <input
                        type="text"
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message #${activeChannel.name}`}
                        maxLength={MAX_MESSAGE_LENGTH + 100} // Allow some overflow for feedback
                        disabled={isUploading}
                    />

                    <div className="input-actions">
                        {charCount > MAX_MESSAGE_LENGTH - 200 && (
                            <span className={`char-counter ${isOverLimit ? 'over' : ''}`}>
                                {charCount}/{MAX_MESSAGE_LENGTH}
                            </span>
                        )}
                        <button className="input-icon-btn" title="Gift Nitro">
                            <Gift size={24} />
                        </button>
                        <button
                            className="input-icon-btn"
                            title="Upload Image"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus size={24} />
                        </button>
                        <button className="input-icon-btn" title="Emoji">
                            <Smile size={24} />
                        </button>
                        <button
                            className="input-icon-btn send-btn"
                            title="Send"
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim() || isOverLimit || isUploading}
                        >
                            <Send size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* User Profile Modal */}
            {selectedAuthor && (
                <UserProfileModal
                    userId={selectedAuthor.id}
                    username={selectedAuthor.username}
                    photoURL={selectedAuthor.photoURL}
                    onClose={() => setSelectedAuthor(null)}
                />
            )}
        </main>
    )
}

export default ChatArea
