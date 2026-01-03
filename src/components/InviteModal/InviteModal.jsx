import { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';
import './InviteModal.css';

function InviteModal({ server, onClose }) {
    const [copied, setCopied] = useState(false);

    const inviteUrl = `${window.location.origin}/invite/${server?.invite_code || 'invalid'}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="invite-modal-overlay" onClick={onClose}>
            <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
                <button className="invite-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="invite-header">
                    <span className="invite-server-icon">{server?.icon || '🏠'}</span>
                    <h2>Invite friends to {server?.name}</h2>
                </div>

                <p className="invite-description">
                    Share this link with others to grant access to your server!
                </p>

                <div className="invite-link-container">
                    <input
                        type="text"
                        value={inviteUrl}
                        readOnly
                        className="invite-link-input"
                    />
                    <button
                        className={`invite-copy-btn ${copied ? 'copied' : ''}`}
                        onClick={handleCopy}
                    >
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="invite-info">
                    <p>🔗 This invite link never expires</p>
                    <p>👥 Anyone with this link can join</p>
                </div>
            </div>
        </div>
    );
}

export default InviteModal;
