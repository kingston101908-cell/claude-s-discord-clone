import { useState, useRef, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import Message from '../Message/Message'
import { Hash, Users, Pin, Bell, Search, Inbox, PlusCircle, Gift, Sticker, Smile, Send } from 'lucide-react'
import './ChatArea.css'

function ChatArea({ onToggleMemberList, showMemberList }) {
    const { activeChannel, activeMessages, activeChannelId, sendMessage } = useApp()
    const [messageInput, setMessageInput] = useState('')
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

    if (!activeChannel) {
        return (
            <div className="chat-area empty">
                <div className="empty-state">
                    <Hash size={72} strokeWidth={1.5} />
                    <h3>Select a channel</h3>
                    <p>Pick a channel from the list to start chatting</p>
                </div>
            </div>
        )
    }

    return (
        <div className="chat-area">
            {/* Chat Header */}
            <div className="chat-header">
                <div className="chat-header-left">
                    <Hash size={24} className="header-hash" />
                    <h2 className="header-channel-name">{activeChannel.name}</h2>
                    <div className="header-divider"></div>
                    <span className="header-topic">Welcome to #{activeChannel.name}!</span>
                </div>
                <div className="chat-header-right">
                    <button className="header-icon-btn" title="Pinned Messages">
                        <Pin size={24} />
                    </button>
                    <button className="header-icon-btn" title="Notification Settings">
                        <Bell size={24} />
                    </button>
                    <button
                        className={`header-icon-btn ${showMemberList ? 'active' : ''}`}
                        onClick={onToggleMemberList}
                        title="Member List"
                    >
                        <Users size={24} />
                    </button>
                    <div className="header-search">
                        <input type="text" placeholder="Search" />
                        <Search size={16} className="search-icon" />
                    </div>
                    <button className="header-icon-btn" title="Inbox">
                        <Inbox size={24} />
                    </button>
                    <button className="header-icon-btn" title="Help">
                        <QuestionCircle size={24} />
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div className="messages-container">
                <div className="messages-scroller">
                    {/* Welcome Message */}
                    <div className="channel-welcome">
                        <div className="welcome-icon">
                            <Hash size={68} strokeWidth={1.5} />
                        </div>
                        <h1>Welcome to #{activeChannel.name}!</h1>
                        <p>This is the start of the #{activeChannel.name} channel.</p>
                    </div>

                    {/* Messages */}
                    {activeMessages.map((message, index) => (
                        <Message
                            key={message.id}
                            message={message}
                            showHeader={index === 0 || activeMessages[index - 1]?.author?.id !== message.author?.id}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input */}
            <div className="message-input-container">
                <div className="message-input-wrapper">
                    <button className="input-icon-btn" title="Upload File">
                        <PlusCircle size={24} />
                    </button>
                    <div className="input-field">
                        <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Message #${activeChannel.name}`}
                        />
                    </div>
                    <div className="input-actions">
                        <button className="input-icon-btn" title="Send Gift">
                            <Gift size={24} />
                        </button>
                        <button className="input-icon-btn" title="GIF">
                            <Sticker size={24} />
                        </button>
                        <button className="input-icon-btn" title="Emoji">
                            <Smile size={24} />
                        </button>
                        {messageInput.trim() && (
                            <button
                                className="send-btn"
                                onClick={handleSendMessage}
                                title="Send Message"
                            >
                                <Send size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// QuestionCircle component (not in lucide)
function QuestionCircle({ size = 24, ...props }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    )
}

export default ChatArea
