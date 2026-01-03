import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { X, Hash } from 'lucide-react'
import './Modal.css'

function Modal({ type, onClose }) {
    const { addServer, addChannel, activeServerId } = useApp()
    const [name, setName] = useState('')
    const [icon, setIcon] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!name.trim()) return

        if (type === 'server') {
            addServer(name.trim(), icon.trim() || undefined)
        } else if (type === 'channel') {
            addChannel(activeServerId, name.trim())
        }

        onClose()
    }

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    const isServer = type === 'server'

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal animate-scaleIn">
                <div className="modal-header">
                    <h2>{isServer ? 'Create a server' : 'Create a channel'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="modal-description">
                        {isServer
                            ? 'Your server is where you and your friends hang out. Make yours and start talking.'
                            : 'Create a new text channel to start conversations with your server members.'
                        }
                    </p>

                    <form onSubmit={handleSubmit}>
                        {isServer && (
                            <div className="form-group">
                                <label htmlFor="icon">SERVER ICON (EMOJI)</label>
                                <input
                                    type="text"
                                    id="icon"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    placeholder="🎮"
                                    maxLength="2"
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="name">
                                {isServer ? 'SERVER NAME' : 'CHANNEL NAME'}
                            </label>
                            <div className="input-with-icon">
                                {!isServer && <Hash size={20} className="input-icon" />}
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={isServer ? "My Awesome Server" : "new-channel"}
                                    autoFocus
                                    className={!isServer ? 'with-icon' : ''}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={!name.trim()}
                            >
                                {isServer ? 'Create Server' : 'Create Channel'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Modal
