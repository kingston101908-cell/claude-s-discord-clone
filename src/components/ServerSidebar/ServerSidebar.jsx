import { useApp } from '../../context/AppContext'
import { Plus, Compass, Download } from 'lucide-react'
import './ServerSidebar.css'

function ServerSidebar({ onAddServer, onOpenDMs, onSelectServer, isInDMView }) {
    const { servers, activeServerId, serverUnreadCounts, totalDMUnread } = useApp()

    return (
        <nav className="server-sidebar" aria-label="Servers">
            {/* Home Button / DMs */}
            <div className="server-sidebar-item">
                <button
                    className={`server-icon home-button ${isInDMView ? 'active' : ''}`}
                    title="Direct Messages"
                    onClick={onOpenDMs}
                >
                    <svg width="28" height="20" viewBox="0 0 28 20">
                        <path
                            fill="currentColor"
                            d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461742 10.3416 0C8.49087 0.318797 6.68679 0.879656 4.97999 1.67671C1.68049 6.67671 0.737949 11.5475 1.21069 16.3558C3.24064 17.8616 5.53633 18.9768 7.99999 19.6417C8.51413 18.9616 8.96927 18.2379 9.35923 17.4791C8.61333 17.2058 7.89999 16.8616 7.22999 16.4558C7.40469 16.3291 7.57576 16.1983 7.74306 16.0641C11.8029 17.9791 16.2417 17.9791 20.2569 16.0641C20.4244 16.1983 20.5955 16.3291 20.77 16.4558C20.0988 16.8616 19.3855 17.2058 18.6408 17.4791C19.0307 18.2379 19.4859 18.9616 20 19.6417C22.4649 18.9768 24.7606 17.8616 26.7893 16.3558C27.3477 10.7579 25.8883 5.9308 23.0212 1.67671ZM9.68041 13.4475C8.39776 13.4475 7.34399 12.2717 7.34399 10.82C7.34399 9.36825 8.37361 8.19255 9.68041 8.19255C10.9829 8.19255 12.0401 9.36825 12.0168 10.82C12.0168 12.2717 10.9829 13.4475 9.68041 13.4475ZM18.3196 13.4475C17.0369 13.4475 15.9832 12.2717 15.9832 10.82C15.9832 9.36825 17.0128 8.19255 18.3196 8.19255C19.6264 8.19255 20.6802 9.36825 20.6569 10.82C20.6569 12.2717 19.6264 13.4475 18.3196 13.4475Z"
                        />
                    </svg>
                    {totalDMUnread > 0 && (
                        <span className="unread-badge dm-badge">{totalDMUnread > 99 ? '99+' : totalDMUnread}</span>
                    )}
                </button>
                <div className={`pill-indicator ${isInDMView ? 'active' : ''}`}></div>
            </div>

            <div className="server-sidebar-divider"></div>

            {/* Server List */}
            <div className="server-list">
                {servers.map(server => {
                    const unreadCount = serverUnreadCounts?.[server.id] || 0;
                    return (
                        <div
                            key={server.id}
                            className={`server-sidebar-item ${activeServerId === server.id && !isInDMView ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
                        >
                            <button
                                className={`server-icon ${activeServerId === server.id && !isInDMView ? 'active' : ''}`}
                                onClick={() => onSelectServer(server.id)}
                                title={server.name}
                            >
                                {server.icon && server.icon.length > 2 ? (
                                    <span className="server-emoji">{server.icon}</span>
                                ) : (
                                    <span className="server-initial">{server.icon || server.name?.charAt(0).toUpperCase()}</span>
                                )}
                                {unreadCount > 0 && (
                                    <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                                )}
                            </button>
                            <div className={`pill-indicator ${activeServerId === server.id && !isInDMView ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}></div>
                        </div>
                    );
                })}
            </div>

            {/* Add Server Button */}
            <div className="server-sidebar-item">
                <button
                    className="server-icon add-server"
                    onClick={onAddServer}
                    title="Add a Server"
                >
                    <Plus size={24} />
                </button>
                <div className="pill-indicator"></div>
            </div>

            {/* Explore Button */}
            <div className="server-sidebar-item">
                <button
                    className="server-icon explore-button"
                    title="Explore Discoverable Servers"
                >
                    <Compass size={24} />
                </button>
                <div className="pill-indicator"></div>
            </div>

            <div className="server-sidebar-divider"></div>

            {/* Download Button */}
            <div className="server-sidebar-item">
                <button
                    className="server-icon download-button"
                    title="Download Apps"
                >
                    <Download size={24} />
                </button>
                <div className="pill-indicator"></div>
            </div>
        </nav>
    )
}

export default ServerSidebar
