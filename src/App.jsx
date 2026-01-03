import { useState, useEffect } from 'react'
import { useApp } from './context/AppContext'
import AuthPage from './components/Auth/AuthPage'
import ServerSidebar from './components/ServerSidebar/ServerSidebar'
import ChannelSidebar from './components/ChannelSidebar/ChannelSidebar'
import ChatArea from './components/ChatArea/ChatArea'
import MemberList from './components/MemberList/MemberList'
import Modal from './components/Modal/Modal'
import JoinServer from './components/JoinServer/JoinServer'
import DMSidebar from './components/DMSidebar/DMSidebar'
import DMChatArea from './components/DMChatArea/DMChatArea'
import './App.css'

function App() {
  const {
    user,
    authLoading,
    activeServer,
    selectServer,
    viewMode,
    setViewMode,
    dmConversations,
    dmUnreadCounts
  } = useApp()

  const [showMemberList, setShowMemberList] = useState(true)
  const [modalConfig, setModalConfig] = useState(null)
  const [inviteCode, setInviteCode] = useState(null)
  const [activeDMConversation, setActiveDMConversation] = useState(null)
  const [activeDMUser, setActiveDMUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check for invite code in URL on mount and when user changes
  useEffect(() => {
    const checkInviteCode = () => {
      const path = window.location.pathname
      if (path.startsWith('/invite/')) {
        const code = path.replace('/invite/', '')
        if (code && code.length > 0) {
          setInviteCode(code)
          // Store in sessionStorage so it persists through login
          sessionStorage.setItem('pendingInvite', code)
        }
      } else {
        // Check if there's a pending invite after login
        const pending = sessionStorage.getItem('pendingInvite')
        if (pending && user) {
          setInviteCode(pending)
        }
      }
    }

    checkInviteCode()
  }, [user])

  const openModal = (config) => setModalConfig(config)
  const closeModal = () => setModalConfig(null)

  const handleJoinedServer = (serverId) => {
    setInviteCode(null)
    sessionStorage.removeItem('pendingInvite')
    // Clear the URL
    window.history.pushState({}, '', '/')
    // Select the joined server
    selectServer(serverId)
  }

  const handleCancelJoin = () => {
    setInviteCode(null)
    sessionStorage.removeItem('pendingInvite')
    window.history.pushState({}, '', '/')
  }

  const handleOpenDMs = () => {
    setViewMode('dm')
    setMobileMenuOpen(false)
  }

  const handleSelectServer = (serverId) => {
    selectServer(serverId)
    setViewMode('server')
    setActiveDMConversation(null)
    setActiveDMUser(null)
    setMobileMenuOpen(false)
  }

  const handleSelectDMConversation = (conversation, otherUser) => {
    setActiveDMConversation(conversation)
    setActiveDMUser(otherUser)
    setMobileMenuOpen(false)
  }

  const handleBackFromDM = () => {
    setActiveDMConversation(null)
    setActiveDMUser(null)
  }

  // Show loading state
  if (authLoading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage inviteCode={inviteCode} />
  }

  // Show join server page if there's an invite code
  if (inviteCode) {
    return (
      <JoinServer
        inviteCode={inviteCode}
        onJoined={handleJoinedServer}
        onCancel={handleCancelJoin}
      />
    )
  }

  return (
    <div className={`app ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      <ServerSidebar
        onAddServer={() => openModal({ type: 'server' })}
        onOpenDMs={handleOpenDMs}
        onSelectServer={handleSelectServer}
        isInDMView={viewMode === 'dm'}
      />

      {viewMode === 'dm' ? (
        // DM View
        <>
          <div className={`sidebar-container ${mobileMenuOpen ? 'show' : ''}`}>
            <DMSidebar
              conversations={dmConversations}
              unreadCounts={dmUnreadCounts}
              activeConversationId={activeDMConversation?.id}
              onSelectConversation={handleSelectDMConversation}
            />
          </div>
          <DMChatArea
            conversation={activeDMConversation}
            otherUser={activeDMUser}
            onBack={handleBackFromDM}
          />
        </>
      ) : activeServer ? (
        // Server View
        <>
          <div className={`sidebar-container ${mobileMenuOpen ? 'show' : ''}`}>
            <ChannelSidebar
              onAddChannel={() => openModal({ type: 'channel' })}
            />
          </div>
          <ChatArea
            onToggleMemberList={() => setShowMemberList(!showMemberList)}
            showMemberList={showMemberList}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
          {showMemberList && <MemberList />}
        </>
      ) : (
        <div className="no-server-selected">
          <div className="no-server-content">
            <div className="no-server-icon">👋</div>
            <h2>Welcome to Discord Clone!</h2>
            <p>Create or join a server to get started chatting.</p>
            <button
              className="create-server-btn"
              onClick={() => openModal({ type: 'server' })}
            >
              Create Your First Server
            </button>
          </div>
        </div>
      )}

      {modalConfig && (
        <Modal
          type={modalConfig.type}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

export default App
