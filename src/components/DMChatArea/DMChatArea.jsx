import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
    subscribeToDMMessages,
    sendDMMessage,
    updateDMReadState,
    uploadFile,
    subscribeToTyping,
    broadcastTyping
} from '../../supabase/database';
import Message from '../Message/Message';
import TypingIndicator from '../TypingIndicator/TypingIndicator';
import { AtSign, PlusCircle, Gift, ImagePlus, Smile, Send, ArrowLeft } from 'lucide-react';
import './DMChatArea.css';

function DMChatArea({ conversation, otherUser, onBack }) {
    const { user, currentUser } = useApp();
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [typingUsers, setTypingUsers] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const typingChannelRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const fileInputRef = useRef(null);

    // Subscribe to messages
    useEffect(() => {
        if (!conversation?.id) return;

        const unsubscribe = subscribeToDMMessages(conversation.id, (msgs) => {
            setMessages(msgs);
            // Mark as read
            if (msgs.length > 0) {
                updateDMReadState(user?.id, conversation.id, msgs[msgs.length - 1].id);
            }
        });

        return () => unsubscribe();
    }, [conversation?.id, user?.id]);

    // Subscribe to typing indicators
    useEffect(() => {
        if (!conversation?.id || !user?.id) return;

        const channel = subscribeToTyping(`dm-${conversation.id}`, user.id, setTypingUsers);
        typingChannelRef.current = channel;

        return () => {
            if (typingChannelRef.current) {
                typingChannelRef.current.unsubscribe();
            }
        };
    }, [conversation?.id, user?.id]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        const trimmedMessage = messageInput.trim();
        if (!trimmedMessage || !conversation?.id) return;

        setMessageInput('');
        const result = await sendDMMessage(
            conversation.id,
            trimmedMessage,
            user?.id,
            currentUser?.username
        );

        if (result.error) {
            console.error('Error sending message:', result.error);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleInputChange = (e) => {
        setMessageInput(e.target.value);

        // Broadcast typing
        if (typingChannelRef.current) {
            broadcastTyping(typingChannelRef.current, user?.id, currentUser?.username);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const result = await uploadFile(file, user?.id);
        setIsUploading(false);

        if (result.success) {
            const attachmentMessage = file.type.startsWith('image/')
                ? `![${file.name}](${result.url})`
                : `[📎 ${file.name}](${result.url})`;

            await sendDMMessage(
                conversation.id,
                attachmentMessage,
                user?.id,
                currentUser?.username,
                [{ url: result.url, name: file.name, type: file.type, size: file.size }]
            );
        } else {
            alert('Failed to upload file: ' + result.error);
        }

        e.target.value = '';
    };

    const shouldShowHeader = (message, index) => {
        if (index === 0) return true;
        const prevMessage = messages[index - 1];
        if (prevMessage.sender_id !== message.sender_id) return true;
        const prevTime = new Date(prevMessage.created_at);
        const currTime = new Date(message.created_at);
        return (currTime - prevTime) > 5 * 60 * 1000;
    };

    if (!conversation) {
        return (
            <div className="dm-chat-area">
                <div className="dm-empty">
                    <AtSign size={48} />
                    <h3>Select a conversation</h3>
                    <p>Choose a conversation from the sidebar or start a new one</p>
                </div>
            </div>
        );
    }

    return (
        <main className="dm-chat-area">
            {/* DM Header */}
            <header className="dm-chat-header">
                <button className="back-btn" onClick={onBack} title="Back to servers">
                    <ArrowLeft size={20} />
                </button>
                <div className="dm-recipient">
                    <AtSign size={24} className="at-icon" />
                    <h2>{otherUser?.username || 'Unknown User'}</h2>
                </div>
            </header>

            {/* Messages */}
            <div className="dm-messages">
                <div className="dm-welcome">
                    <div className="welcome-avatar">
                        {otherUser?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h1>{otherUser?.username || 'Unknown User'}</h1>
                    <p>This is the beginning of your direct message history with <strong>{otherUser?.username}</strong>.</p>
                </div>

                {messages.map((message, index) => (
                    <Message
                        key={message.id}
                        message={{
                            ...message,
                            author: {
                                id: message.sender_id,
                                username: message.sender_id === user?.id
                                    ? currentUser?.username
                                    : otherUser?.username
                            },
                            timestamp: message.created_at
                        }}
                        showHeader={shouldShowHeader(message, index)}
                        isDM={true}
                    />
                ))}

                {typingUsers.length > 0 && (
                    <TypingIndicator users={typingUsers} />
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="dm-input-container">
                <div className="dm-input-wrapper">
                    <button
                        className="input-icon-btn"
                        title="Upload file"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        <PlusCircle size={24} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} hidden />

                    <input
                        type="text"
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message @${otherUser?.username || 'user'}`}
                        disabled={isUploading}
                    />

                    <div className="input-actions">
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
                            disabled={!messageInput.trim() || isUploading}
                        >
                            <Send size={24} />
                        </button>
                    </div>
                </div>
                {isUploading && (
                    <div className="upload-progress">Uploading file...</div>
                )}
            </div>
        </main>
    );
}

export default DMChatArea;
