import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
    getServerRoles,
    getServerMembers,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    getUserPermissions
} from '../../supabase/database';
import { X, Plus, Trash2, Edit2, Save, Shield, Users, ChevronDown } from 'lucide-react';
import './RoleManagement.css';

function RoleManagement({ serverId, onClose }) {
    const { user, activeServer } = useApp();
    const [roles, setRoles] = useState([]);
    const [members, setMembers] = useState([]);
    const [activeTab, setActiveTab] = useState('roles');
    const [editingRole, setEditingRole] = useState(null);
    const [showCreateRole, setShowCreateRole] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', color: '#99aab5', permissions: {} });
    const [error, setError] = useState(null);
    const [permissions, setPermissions] = useState(null);

    // Check if user has permission
    useEffect(() => {
        const checkPermissions = async () => {
            const perms = await getUserPermissions(serverId, user?.id);
            setPermissions(perms);
            if (!perms.manage_roles && !perms.isOwner) {
                setError('You do not have permission to manage roles');
            }
        };
        checkPermissions();
    }, [serverId, user?.id]);

    // Load roles and members
    useEffect(() => {
        const loadData = async () => {
            const [rolesData, membersData] = await Promise.all([
                getServerRoles(serverId),
                getServerMembers(serverId)
            ]);
            setRoles(rolesData);
            setMembers(membersData);
        };
        loadData();
    }, [serverId]);

    const handleCreateRole = async () => {
        if (!newRole.name.trim()) {
            setError('Role name is required');
            return;
        }

        const result = await createRole(serverId, newRole.name, newRole.color, newRole.permissions);
        if (result.error) {
            setError(result.error);
        } else {
            setRoles([...roles, result.data]);
            setShowCreateRole(false);
            setNewRole({ name: '', color: '#99aab5', permissions: {} });
            setError(null);
        }
    };

    const handleUpdateRole = async (roleId, updates) => {
        const result = await updateRole(roleId, updates);
        if (result.error) {
            setError(result.error);
        } else {
            setRoles(roles.map(r => r.id === roleId ? { ...r, ...updates } : r));
            setEditingRole(null);
            setError(null);
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (!confirm('Are you sure you want to delete this role?')) return;

        const result = await deleteRole(roleId);
        if (result.error) {
            setError(result.error);
        } else {
            setRoles(roles.filter(r => r.id !== roleId));
        }
    };

    const handleAssignRole = async (userId, roleId) => {
        const result = await assignRole(serverId, userId, roleId);
        if (result.error) {
            setError(result.error);
        } else {
            // Refresh members
            const membersData = await getServerMembers(serverId);
            setMembers(membersData);
            setError(null);
        }
    };

    const isOwner = activeServer?.owner_id === user?.id;
    const canManage = isOwner || permissions?.manage_roles;

    if (!canManage) {
        return (
            <div className="role-management-overlay" onClick={onClose}>
                <div className="role-management-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Role Management</h2>
                        <button className="close-btn" onClick={onClose}><X size={24} /></button>
                    </div>
                    <div className="permission-error">
                        <Shield size={48} />
                        <h3>Access Denied</h3>
                        <p>You don't have permission to manage roles in this server.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="role-management-overlay" onClick={onClose}>
            <div className="role-management-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Role Management</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                {error && (
                    <div className="error-banner">
                        ⚠️ {error}
                        <button onClick={() => setError(null)}>×</button>
                    </div>
                )}

                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
                        onClick={() => setActiveTab('roles')}
                    >
                        <Shield size={18} /> Roles
                    </button>
                    <button
                        className={`tab ${activeTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('members')}
                    >
                        <Users size={18} /> Members
                    </button>
                </div>

                <div className="modal-content">
                    {activeTab === 'roles' && (
                        <div className="roles-section">
                            <div className="section-header">
                                <h3>Server Roles</h3>
                                <button
                                    className="add-role-btn"
                                    onClick={() => setShowCreateRole(!showCreateRole)}
                                >
                                    <Plus size={16} /> New Role
                                </button>
                            </div>

                            {showCreateRole && (
                                <div className="create-role-form">
                                    <input
                                        type="text"
                                        placeholder="Role name"
                                        value={newRole.name}
                                        onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                                    />
                                    <input
                                        type="color"
                                        value={newRole.color}
                                        onChange={e => setNewRole({ ...newRole, color: e.target.value })}
                                    />
                                    <div className="permission-checkboxes">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={newRole.permissions.create_channels}
                                                onChange={e => setNewRole({
                                                    ...newRole,
                                                    permissions: { ...newRole.permissions, create_channels: e.target.checked }
                                                })}
                                            />
                                            Create Channels
                                        </label>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={newRole.permissions.delete_messages}
                                                onChange={e => setNewRole({
                                                    ...newRole,
                                                    permissions: { ...newRole.permissions, delete_messages: e.target.checked }
                                                })}
                                            />
                                            Delete Messages
                                        </label>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={newRole.permissions.manage_roles}
                                                onChange={e => setNewRole({
                                                    ...newRole,
                                                    permissions: { ...newRole.permissions, manage_roles: e.target.checked }
                                                })}
                                            />
                                            Manage Roles
                                        </label>
                                    </div>
                                    <div className="form-actions">
                                        <button className="cancel-btn" onClick={() => setShowCreateRole(false)}>Cancel</button>
                                        <button className="save-btn" onClick={handleCreateRole}>Create Role</button>
                                    </div>
                                </div>
                            )}

                            <div className="roles-list">
                                {roles.map(role => (
                                    <div key={role.id} className="role-item">
                                        <div
                                            className="role-color"
                                            style={{ backgroundColor: role.color }}
                                        />
                                        <span className="role-name">{role.name}</span>
                                        <div className="role-permissions">
                                            {role.permissions?.create_channels && <span title="Create Channels">📺</span>}
                                            {role.permissions?.delete_messages && <span title="Delete Messages">🗑️</span>}
                                            {role.permissions?.manage_roles && <span title="Manage Roles">👑</span>}
                                        </div>
                                        {role.name !== 'Owner' && role.name !== 'Member' && (
                                            <div className="role-actions">
                                                <button
                                                    className="edit-btn"
                                                    onClick={() => setEditingRole(role)}
                                                    title="Edit role"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDeleteRole(role.id)}
                                                    title="Delete role"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="members-section">
                            <h3>Server Members</h3>
                            <div className="members-list">
                                {members.map(member => (
                                    <div key={member.id} className="member-item">
                                        <div className="member-avatar">
                                            {activeServer?.member_details?.[member.user_id]?.username?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span className="member-name">
                                            {activeServer?.member_details?.[member.user_id]?.username || 'Unknown'}
                                        </span>
                                        <div className="member-role">
                                            <select
                                                value={member.role_id || ''}
                                                onChange={e => handleAssignRole(member.user_id, e.target.value)}
                                                disabled={member.user_id === activeServer?.owner_id}
                                            >
                                                {roles.map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="select-arrow" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Role Modal */}
                {editingRole && (
                    <div className="edit-role-modal">
                        <h4>Edit Role: {editingRole.name}</h4>
                        <input
                            type="text"
                            value={editingRole.name}
                            onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                        />
                        <input
                            type="color"
                            value={editingRole.color}
                            onChange={e => setEditingRole({ ...editingRole, color: e.target.value })}
                        />
                        <div className="permission-checkboxes">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={editingRole.permissions?.create_channels}
                                    onChange={e => setEditingRole({
                                        ...editingRole,
                                        permissions: { ...editingRole.permissions, create_channels: e.target.checked }
                                    })}
                                />
                                Create Channels
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={editingRole.permissions?.delete_messages}
                                    onChange={e => setEditingRole({
                                        ...editingRole,
                                        permissions: { ...editingRole.permissions, delete_messages: e.target.checked }
                                    })}
                                />
                                Delete Messages
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={editingRole.permissions?.manage_roles}
                                    onChange={e => setEditingRole({
                                        ...editingRole,
                                        permissions: { ...editingRole.permissions, manage_roles: e.target.checked }
                                    })}
                                />
                                Manage Roles
                            </label>
                        </div>
                        <div className="form-actions">
                            <button className="cancel-btn" onClick={() => setEditingRole(null)}>Cancel</button>
                            <button
                                className="save-btn"
                                onClick={() => handleUpdateRole(editingRole.id, {
                                    name: editingRole.name,
                                    color: editingRole.color,
                                    permissions: editingRole.permissions
                                })}
                            >
                                <Save size={14} /> Save
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RoleManagement;
