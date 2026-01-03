import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getServerByInviteCode, joinServer } from '../../supabase/database';
import './JoinServer.css';

function JoinServer({ inviteCode, onJoined, onCancel }) {
    const { user } = useApp();
    const [server, setServer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadServer() {
            const data = await getServerByInviteCode(inviteCode);
            if (data) {
                setServer(data);
            } else {
                setError('Invalid or expired invite link');
            }
            setLoading(false);
        }
        loadServer();
    }, [inviteCode]);

    const handleJoin = async () => {
        if (!user || !server) return;

        setJoining(true);
        const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        const success = await joinServer(server.id, user.id, userName);

        if (success) {
            onJoined(server.id);
        } else {
            setError('Failed to join server');
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="join-server-page">
                <div className="join-server-card">
                    <div className="join-loading">Loading invite...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="join-server-page">
                <div className="join-server-card">
                    <div className="join-error-icon">❌</div>
                    <h2>Invite Invalid</h2>
                    <p>{error}</p>
                    <button className="join-btn secondary" onClick={onCancel}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const memberCount = server?.members?.length || 1;

    return (
        <div className="join-server-page">
            <div className="join-server-card">
                <p className="join-invited-text">You've been invited to join a server</p>

                <div className="join-server-icon">
                    {server?.icon || '🏠'}
                </div>

                <h2 className="join-server-name">{server?.name}</h2>

                <div className="join-server-stats">
                    <span className="stat">
                        <span className="stat-dot online"></span>
                        {memberCount} Online
                    </span>
                    <span className="stat">
                        <span className="stat-dot"></span>
                        {memberCount} Members
                    </span>
                </div>

                <div className="join-actions">
                    <button
                        className="join-btn primary"
                        onClick={handleJoin}
                        disabled={joining}
                    >
                        {joining ? 'Joining...' : 'Accept Invite'}
                    </button>
                    <button className="join-btn secondary" onClick={onCancel}>
                        No Thanks
                    </button>
                </div>
            </div>
        </div>
    );
}

export default JoinServer;
