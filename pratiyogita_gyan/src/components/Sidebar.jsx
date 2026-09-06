import { useState, useEffect, useCallback, lazy, Suspense, useMemo } from 'react'
import { MessageCircle, Trash2, Home, Plus, Target, ChevronFirst } from 'lucide-react'
import { Box, Paper, Stack, Typography, Button, IconButton, Divider } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useLayout } from '../contexts/LayoutContext'
import { useSearchHistory } from '../contexts/SearchHistoryContext'
import { useAuth } from '../contexts/AuthContext'
const HelpSupportModal = lazy(() => import('./HelpSupportModal'))
import { CircleHelp } from './icons/CircleHelp'

const PENDING_CHAT_LOAD_STORAGE_KEY = 'pendingChatToLoad'

const Sidebar = () => {
  const { sidebarVisible, toggleSidebar, isMobile } = useLayout()
  const { guestChatHistory, deleteGuestChat } = useSearchHistory()
  const { currentUser, getChatHistory, deleteChat } = useAuth()
  const [chatHistory, setChatHistory] = useState([])
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const [chatError, setChatError] = useState('')

  // Load chat history
  const loadChatHistory = useCallback(async ({ silent = false } = {}) => {
    if (!currentUser) {
      console.log('❌ No currentUser, skipping chat history load')
      return
    }

    console.log('📂 Loading chat history for user:', currentUser.uid)
    if (!silent) setIsLoadingChats(true)
    setChatError('')
    try {
      const chats = await getChatHistory()
      console.log('✅ Loaded chats:', chats.length, chats)
      setChatHistory(chats)
    } catch (error) {
      console.error('❌ Failed to load chat history:', error)
      setChatError('Failed to load chat history')
    } finally {
      if (!silent) setIsLoadingChats(false)
    }
  }, [currentUser, getChatHistory])

  // Handle practice pyq click
  const handlePracticePyqClick = () => {
    window.dispatchEvent(new CustomEvent('switchToPracticePYQ'))
    if (isMobile && sidebarVisible) {
      toggleSidebar()
    }
  }

  // Handle new chat creation
  const handleNewChat = async () => {
    console.log('🆕 New chat button clicked')
    try {
      // New Chat behaves like Home initially: no DB write until first message send
      sessionStorage.removeItem(PENDING_CHAT_LOAD_STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('switchToChat'))
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('newChat', { detail: { chatId: null } }))
      }, 0)
    } catch (error) {
      console.error('❌ Failed to create new chat:', error)
    }
  }

  // Handle chat selection
  const handleChatSelect = (chat) => {
    console.log('💬 Chat selected:', chat.title, 'chatId:', chat.id)
    sessionStorage.setItem(PENDING_CHAT_LOAD_STORAGE_KEY, JSON.stringify(chat))
    window.dispatchEvent(new CustomEvent('switchToChat'))

    // For guest chats, we need to load messages from the stored chat data
    if (chat.id.startsWith('guest-')) {
      // Load guest chat messages directly
      console.log('👤 Loading guest chat:', chat.id)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('loadGuestChat', {
          detail: {
            chatId: chat.id,
            title: chat.title,
            messages: chat.messages || []
          }
        }))
      }, 0)
    } else {
      // Emit event to load authenticated user chat messages from backend
      console.log('👤 Loading authenticated user chat:', chat.id)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('loadChat', { detail: { chatId: chat.id, title: chat.title } }))
      }, 0)
    }
  }

  // Handle chat deletion
  const handleDeleteChat = async (chatId, event) => {
    event.stopPropagation() // Prevent triggering chat selection

    // Show confirmation dialog
    const confirmDelete = window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')
    if (!confirmDelete) return

    if (chatId.startsWith('guest-')) {
      deleteGuestChat(chatId)
      console.log('🗑️ Deleted guest chat:', chatId)
    } else {
      // For authenticated users, delete from Firebase
      try {
        await deleteChat(chatId)
        console.log('🗑️ Deleted user chat from Firebase:', chatId)
        // Refresh the chat list
        await loadChatHistory()
      } catch (error) {
        console.error('❌ Failed to delete chat:', error)
        setChatError('Failed to delete chat')
        return
      }
    }

    // If the deleted chat was currently active, clear the chat section
    window.dispatchEvent(new CustomEvent('chatDeleted', { detail: { chatId } }))
  }

  // Format chat title from first message
  const formatChatTitle = useCallback((chat) => {
    // If chat has a custom title that's not "New Chat", use it
    if (chat.title && chat.title !== 'New Chat') {
      return chat.title
    }

    // Otherwise, use first 50 characters of the first message
    if (chat.firstMessage) {
      return chat.firstMessage.length > 50
        ? chat.firstMessage.substring(0, 50) + '...'
        : chat.firstMessage
    }

    // Fallback
    return 'Untitled Chat'
  }, [])

  const guestChats = useMemo(() => guestChatHistory || [], [guestChatHistory])
  const userChats = useMemo(() => chatHistory || [], [chatHistory])

  const closeTransientOverlays = useCallback(() => {
    setShowHelpModal(false)
  }, [])

  const handleHelpClick = useCallback(() => {
    if (isMobile) closeTransientOverlays()
    setShowHelpModal(true)
  }, [closeTransientOverlays, isMobile])

  const handleHomeClick = () => {
    if (isMobile) closeTransientOverlays()
    window.dispatchEvent(new CustomEvent('switchToChat'))
  }

  useEffect(() => {
    const openHelpModal = () => handleHelpClick()
    window.addEventListener('openHelpModal', openHelpModal)
    return () => {
      window.removeEventListener('openHelpModal', openHelpModal)
    }
  }, [handleHelpClick])

  useEffect(() => {
    if (!isMobile) return
    const handleNavigation = () => {
      closeTransientOverlays()
    }
    window.addEventListener('switchToChat', handleNavigation)
    return () => {
      window.removeEventListener('switchToChat', handleNavigation)
    }
  }, [closeTransientOverlays, isMobile])

  // Load chat history when user changes
  useEffect(() => {
    if (currentUser) {
      console.log('👤 User changed, loading chat history for:', currentUser.email)
      loadChatHistory()
    } else {
      console.log('👤 No user, clearing chat history')
      setChatHistory([])
    }
  }, [currentUser, loadChatHistory])

  // Listen for refresh chat list events
  useEffect(() => {
    const handleRefreshChatList = () => {
      if (currentUser) {
        loadChatHistory({ silent: true })
      }
    }

    window.addEventListener('refreshChatList', handleRefreshChatList)

    return () => {
      window.removeEventListener('refreshChatList', handleRefreshChatList)
    }
  }, [currentUser, loadChatHistory])

  return (
    <>
      {/* Mobile backdrop with smooth fade-in/fade-out */}
      {isMobile && (
        <div
          className="md:hidden fixed top-14 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-[1300] transition-opacity duration-300"
          style={{
            opacity: sidebarVisible ? 1 : 0,
            pointerEvents: sidebarVisible ? 'auto' : 'none'
          }}
          onClick={toggleSidebar}
        />
      )}

      {/* Unified Sidebar Container */}
      <Paper
        elevation={isMobile ? 16 : 0}
        sx={{
          position: 'fixed',
          left: isMobile ? 0 : 4,
          top: isMobile ? 56 : 60,
          bottom: isMobile ? 0 : 4,
          width: isMobile
            ? { xs: '84vw', sm: 300 }
            : (sidebarVisible
              ? { xs: 220, sm: 236, md: 244 }
              : { xs: 0, md: 42 }
            ),
          maxWidth: isMobile ? 320 : 'none',
          zIndex: isMobile ? 1400 : 30,
          borderRadius: isMobile ? '0 16px 16px 0' : '8px',
          border: isMobile && !sidebarVisible ? 'none' : '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          color: '#000000',
          overflow: 'hidden',
          boxShadow: isMobile && sidebarVisible ? '8px 0 32px rgba(0,0,0,0.25)' : '0 1px 2px rgba(0,0,0,0.04)',
          transform: isMobile
            ? (sidebarVisible ? 'translate3d(0, 0, 0)' : 'translate3d(-100%, 0, 0)')
            : 'none',
          willChange: isMobile ? 'transform' : 'auto',
          transition: isMobile
            ? 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.28s ease'
            : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Full Expanded Sidebar Content */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            opacity: sidebarVisible ? 1 : 0,
            visibility: sidebarVisible ? 'visible' : 'hidden',
            transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.25s',
            pointerEvents: sidebarVisible ? 'auto' : 'none',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            right: 0
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {/* Toggle Button and Sign-in Notice */}
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, width: '100%', boxSizing: 'border-box' }}>
              {!currentUser ? (
                <Typography
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: '0.68rem',
                    maxWidth: 'calc(100% - 36px)'
                  }}
                >
                  sign in to sync your data
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.5 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#22c55e',
                      boxShadow: '0 0 8px #22c55e',
                      animation: 'pulse 1.5s infinite ease-in-out',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(0.8)', opacity: 0.5 },
                        '50%': { transform: 'scale(1.2)', opacity: 1 },
                        '100%': { transform: 'scale(0.8)', opacity: 0.5 }
                      }
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.68rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    User data is syncing
                  </Typography>
                </Box>
              )}
              <IconButton
                onClick={toggleSidebar}
                size="small"
                title="Hide Sidebar"
                sx={{
                  color: '#000000',
                  padding: '4px',
                  borderRadius: 1.5,
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
                  flexShrink: 0,
                  ml: 'auto'
                }}
              >
                <ChevronFirst width={15} height={15} strokeWidth={2} stroke="#000000" />
              </IconButton>
            </Box>

            {/* Top section - New Chat */}
            <Box sx={{ px: isMobile ? 1 : 1, pb: isMobile ? 1 : 0.75 }}>
              <Button
                onClick={handleNewChat}
                fullWidth
                variant="contained"
                title="Start a new conversation"
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  py: isMobile ? 0.75 : 0.4,
                  minHeight: isMobile ? 36 : 28,
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Plus size={18} strokeWidth={2.6} color="#ffffff" />
                  <span>New Chat</span>
                </Box>
              </Button>
            </Box>

            {/* Practice PYQ Button */}
            <Box sx={{ px: isMobile ? 1 : 1, pb: isMobile ? 1 : 0.75 }}>
              <Button
                onClick={handlePracticePyqClick}
                fullWidth
                variant="outlined"
                title="Practice Previous Year Questions"
                sx={{
                  borderColor: '#E4572E',
                  color: '#E4572E',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  py: isMobile ? 0.75 : 0.4,
                  minHeight: isMobile ? 36 : 28,
                  backgroundColor: 'rgba(228, 87, 46, 0.05)',
                  '&:hover': {
                    backgroundColor: 'rgba(228, 87, 46, 0.12)',
                    borderColor: '#E4572E'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Target size={16} strokeWidth={2.4} color="#E4572E" />
                  <span>Practice PYQ</span>
                </Box>
              </Button>
            </Box>

            {/* Chat History Section - Scrollable */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 sidebar-chat-history">
              <div className="space-y-1">
                {/* Show guest chats if not authenticated or no user chats */}
                {!currentUser && guestChats.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageCircle
                      className="w-10 h-10 mx-auto mb-2 transition-colors duration-300"
                      style={{
                        color: '#000000',
                        opacity: 0.5
                      }}
                    />
                    <p
                      className="text-xs transition-colors duration-300"
                      style={{
                        color: '#000000',
                        opacity: 0.7
                      }}
                    >
                      Start a conversation to see your chat history
                    </p>
                  </div>
                ) : !currentUser && guestChats.length > 0 ? (
                  <>
                    <div
                      className="text-xs mb-2 px-2 font-medium transition-colors duration-300"
                      style={{ color: '#000000' }}
                    >
                      Recent Conversations
                    </div>
                    {guestChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="w-full text-left p-1 rounded-lg transition-colors group relative"
                        style={{ color: '#000000' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(58, 124, 165, 0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div className="flex items-start space-x-2 pr-6" onClick={() => handleChatSelect(chat)}>
                          <MessageCircle
                            className="w-3 h-3 mt-0.5 transition-colors"
                            style={{
                              color: '#000000',
                              opacity: 0.6
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {formatChatTitle(chat)}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span
                                className="text-xs"
                                style={{
                                  color: '#000000',
                                  opacity: 0.5
                                }}
                              >
                                {chat.messageCount || 0} {(chat.messageCount || 0) === 1 ? 'message' : 'messages'}
                              </span>
                              <span
                                className="text-xs"
                                style={{
                                  color: '#000000',
                                  opacity: 0.4
                                }}
                              >
                                {new Date(chat.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className={`absolute top-1 right-1 p-0.5 rounded transition-all ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 hover:bg-red-500/20'}`}
                          title="Delete chat"
                        >
                          <Trash2 className="w-2.5 h-2.5 text-red-400 hover:text-red-300" />
                        </button>
                      </div>
                    ))}
                  </>
                ) : currentUser && isLoadingChats ? (
                  <div className="text-center py-6">
                    <div
                      className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2"
                      style={{ borderColor: '#808080' }}
                    ></div>
                    <p
                      className="text-xs"
                      style={{ color: '#000000', opacity: 0.7 }}
                    >
                      Loading chats...
                    </p>
                  </div>
                ) : currentUser && chatError ? (
                  <div className="text-center py-6">
                    <MessageCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 text-xs">{chatError}</p>
                    <button
                      onClick={loadChatHistory}
                      className="mt-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : currentUser && userChats.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageCircle
                      className="w-10 h-10 mx-auto mb-2"
                      style={{ color: '#000000', opacity: 0.5 }}
                    />
                    <p
                      className="text-xs"
                      style={{ color: '#000000', opacity: 0.7 }}
                    >
                      No conversations yet
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: '#000000', opacity: 0.5 }}
                    >
                      Start chatting to see your history here
                    </p>
                  </div>
                ) : currentUser && userChats.length > 0 ? (
                  <>
                    <div
                      className="text-xs mb-2 px-2 font-medium"
                      style={{ color: '#000000' }}
                    >
                      Recent Conversations
                    </div>
                    {userChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="w-full text-left p-1 rounded-lg transition-colors group relative"
                        style={{ color: '#000000' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(58, 124, 165, 0.12)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div className="flex items-start space-x-2 pr-6" onClick={() => handleChatSelect(chat)}>
                          <MessageCircle
                            className="w-3 h-3 mt-0.5 transition-colors"
                            style={{ color: '#000000', opacity: 0.6 }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">
                              {formatChatTitle(chat)}
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <span
                                className="text-xs"
                                style={{ color: '#000000', opacity: 0.5 }}
                              >
                                {chat.messageCount || 0} {(chat.messageCount || 0) === 1 ? 'message' : 'messages'}
                              </span>
                              <span
                                className="text-xs"
                                style={{ color: '#000000', opacity: 0.4 }}
                              >
                                {chat.updatedAt ? (
                                  typeof chat.updatedAt.toLocaleDateString === 'function'
                                    ? chat.updatedAt.toLocaleDateString()
                                    : new Date(chat.updatedAt).toLocaleDateString()
                                ) : 'Recently'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className={`absolute top-1 right-1 p-0.5 rounded transition-all ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 hover:bg-red-500/20'}`}
                          title="Delete chat"
                        >
                          <Trash2 className="w-2.5 h-2.5 text-red-400 hover:text-red-300" />
                        </button>
                      </div>
                    ))}
                  </>
                ) : null}
              </div>
            </div>

            {/* Bottom section - Fixed at bottom */}
            <Box sx={{ p: isMobile ? 1 : 0.75 }}>
              {isMobile ? (
                <Stack spacing={0.5}>
                  <Button
                    onClick={() => { handleHomeClick(); toggleSidebar(); }}
                    variant="contained"
                    startIcon={<Home className="w-4 h-4" />}
                    sx={{
                      backgroundColor: '#111827',
                      color: '#ffffff',
                      py: 0.5,
                      fontSize: '0.7rem',
                      '&:hover': { backgroundColor: '#000000' }
                    }}
                  >
                    Home
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={0.5}>
                  <Button onClick={handleHelpClick} variant="contained" startIcon={<CircleHelp width={16} height={16} strokeWidth={2} stroke="currentColor" />} sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText', py: 0.4, minHeight: 26, fontSize: '0.68rem', '&:hover': { backgroundColor: 'primary.dark' } }}>
                    Help & Support
                  </Button>
                </Stack>
              )}
            </Box>
          </Box>
        </Box>

        {/* Collapsed Sidebar Content (Icon Rail) */}
        {!isMobile && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: 42,
              opacity: !sidebarVisible ? 1 : 0,
              visibility: !sidebarVisible ? 'visible' : 'hidden',
              transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.25s',
              pointerEvents: !sidebarVisible ? 'auto' : 'none',
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              right: 0
            }}
          >
            {/* Toggle Button */}
            <Box sx={{ p: 0.5, display: 'flex', justifyContent: 'center' }}>
              <IconButton onClick={toggleSidebar} size="small" title="Show Sidebar" sx={{ color: '#000000', transform: 'scaleX(-1)', padding: '3px' }}>
                <ChevronFirst width={15} height={15} strokeWidth={2} stroke="#000000" />
              </IconButton>
            </Box>

            {/* Icon Menu */}
            <div className="flex-1 flex flex-col items-center space-y-2 p-1">
              <button
                onClick={handleNewChat}
                className="p-1 rounded-lg transition-colors"
                style={{ color: '#000000' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(58, 124, 165, 0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="New Chat"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                onClick={handlePracticePyqClick}
                className="p-1 rounded-lg transition-colors"
                style={{ color: '#E4572E' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(228, 87, 46, 0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Practice PYQ"
              >
                <Target className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Icons */}
            <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <button
                onClick={handleHelpClick}
                className="p-1 rounded-lg transition-colors"
                style={{ color: '#000000' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(186, 255, 57, 0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Help & Support"
              >
                <CircleHelp width={16} height={16} strokeWidth={2} stroke="currentColor" />
              </button>
            </Box>
          </Box>
        )}
      </Paper>



      <Suspense fallback={null}>
        {/* Help & Support Modal */}
        <HelpSupportModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
      </Suspense>
    </>
  )
}

export default Sidebar
