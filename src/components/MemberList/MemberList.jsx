import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import UserProfileModal from '../UserProfileModal/UserProfileModal';
import './MemberList.css';

function MemberList() {
    const { activeServer, currentUser } = useApp();
    const [selectedMember, setSelectedMember] = useState(null);

    if (!activeServer) return null;

    // Get members from server's member_details (Supabase uses snake_case)
    const memberDetails = activeServer.member_details || {};
    const memberIds = activeServer.members || [];

    // Build member list from memberDetails
    const members = memberIds.map(id => ({
        id,
        username: memberDetails[id]?.username || 'Unknown User',
        status: id === currentUser?.id ? 'online' : 'offline',
        isCurrentUser: id === currentUser?.id
    }));

    // Group members by status
    const onlineMembers = members.filter(m => m.status === 'online' || m.status === 'idle' || m.status === 'dnd');
    const offlineMembers = members.filter(m => m.status === 'offline');

    // Generate consistent color for username
    const getUserColor = (username) => {
        const colors = [
            '#f23f43', '#f0b232', '#23a55a', '#00a8fc', '#5865f2', '#eb459f'
        ];
        const hash = (username || 'User').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length];
    };

    const handleMemberClick = (member) => {
        setSelectedMember(member);
    };

    return (
        <>
            <aside className="member-list">
                {/* Online Members */}
                {onlineMembers.length > 0 && (
                    <div className="member-group">
                        <h3 className="member-group-title">
                            Online — {onlineMembers.length}
                        </h3>
                        {onlineMembers.map(member => (
                            <div
                                key={member.id}
                                className="member-item"
                                onClick={() => handleMemberClick(member)}
                            >
                                <div className="member-avatar">
                                    <div
                                        className="avatar-img"
                                        style={{
                                            background: `linear-gradient(135deg, ${getUserColor(member.username)}, #8b5cf6)`
                                        }}
                                    >
                                        {(member.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className={`status-dot ${member.status}`}></div>
                                </div>
                                <div className="member-info">
                                    <span
                                        className="member-name"
                                        style={{ color: getUserColor(member.username) }}
                                    >
                                        {member.username}
                                    </span>
                                    {member.isCurrentUser && (
                                        <span className="member-you">(You)</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Offline Members */}
                {offlineMembers.length > 0 && (
                    <div className="member-group">
                        <h3 className="member-group-title">
                            Offline — {offlineMembers.length}
                        </h3>
                        {offlineMembers.map(member => (
                            <div
                                key={member.id}
                                className="member-item offline"
                                onClick={() => handleMemberClick(member)}
                            >
                                <div className="member-avatar">
                                    <div
                                        className="avatar-img"
                                        style={{
                                            background: `linear-gradient(135deg, ${getUserColor(member.username)}, #8b5cf6)`
                                        }}
                                    >
                                        {(member.username || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className={`status-dot ${member.status}`}></div>
                                </div>
                                <div className="member-info">
                                    <span className="member-name">{member.username}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {members.length === 0 && (
                    <div className="no-members">
                        <p>No members yet</p>
                    </div>
                )}
            </aside>

            {selectedMember && (
                <UserProfileModal
                    userId={selectedMember.id}
                    username={selectedMember.username}
                    onClose={() => setSelectedMember(null)}
                />
            )}
        </>
    );
}

export default MemberList;
