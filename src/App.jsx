import { useState } from 'react'
import { useApp } from './context/AppContext'
import AuthPage from './components/Auth/AuthPage'
import ServerSidebar from './components/ServerSidebar/ServerSidebar'
import ChannelSidebar from './components/ChannelSidebar/ChannelSidebar'
import ChatArea from './components/ChatArea/ChatArea'
import MemberList from './components/MemberList/MemberList'
import Modal from './components/Modal/Modal'
import './App.css'

function App() {
  const { user, authLoading, activeServer } = useApp()
  const [showMemberList, setShowMemberList] = useState(true)
  const [modalConfig, setModalConfig] = useState(null)

  const openModal = (config) => setModalConfig(config)
  const closeModal = () => setModalConfig(null)

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
    return <AuthPage />
  }

  return (
    <div className="app">
      <ServerSidebar onAddServer={() => openModal({ type: 'server' })} />

      {activeServer ? (
        <>
          <ChannelSidebar
            onAddChannel={() => openModal({ type: 'channel' })}
          />
          <ChatArea
            onToggleMemberList={() => setShowMemberList(!showMemberList)}
            showMemberList={showMemberList}
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
