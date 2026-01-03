import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import Message from '../Message/Message'
import UserProfileModal from '../UserProfileModal/UserProfileModal'
import { Hash, Users, Bell, Pin, Search, Inbox, HelpCircle, PlusCircle, Gift, ImagePlus, Smile, Send } from 'lucide-react'
import './ChatArea.css'

function QuestionCircle(props) {
    return <HelpCircle {...props} />
}

function ChatArea({ onToggleMemberList, showMemberList }) {
    const {
        activeChannel,
        activeChannelId,
        activeServer,
        activeMessages,
        sendMessage
    } = useApp()

    const [messageInput, setMessageInput] = useState('')
    const [selectedAuthor, setSelectedAuthor] = useState(null)
    const messagesEndRef = useRef(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [activeMessages])

    const handleSendMessage = () => {
        if (messageInput.trim() && activeChannelId) {
            sendMessage(activeChannelId, messageInput.trim())
            setMessageInput('')
        }
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

    return (
        <main className="chat-area">
            {/* Channel Header */}
            <header className="chat-header">
                <div className="header-left">
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
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="chat-input-container">
                <div className="chat-input-wrapper">
                    <button className="input-icon-btn" title="Upload files">
                        <PlusCircle size={24} />
                    </button>

                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message #${activeChannel.name}`}
                    />

                    <div className="input-actions">
                        <button className="input-icon-btn" title="Gift Nitro">
                            <Gift size={24} />
                        </button>
                        <button className="input-icon-btn" title="Upload Image">
                            <ImagePlus size={24} />
                        </button>
                        <button className="input-icon-btn" title="Emoji">
                            <Smile size={24} />
                        </button>
                        <button
                            className="input-icon-btn send-btn"
                            title="Send"
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
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
