import { useState, useEffect, lazy, Suspense } from 'react'
import { LogIn, UserPlus, Home, BarChart3, Info, Phone, LogOut, ChevronLeft, User, ChevronRight, Settings, MoreVertical, BookOpen, MessageSquare } from 'lucide-react'
import { AppBar, Toolbar, Box, Typography, Button, Avatar, Stack, Container, IconButton, Divider, MenuItem, Popover } from '@mui/material'
import PropTypes from 'prop-types'
const AuthModal = lazy(() => import('./AuthModal'))
const AboutUsModal = lazy(() => import('./AboutUsModal'))
const ContactModal = lazy(() => import('./ContactModal'))
const EditProfileModal = lazy(() => import('./EditProfileModal'))
import { useAuth } from '../contexts/AuthContext'
import { useLayout } from '../contexts/LayoutContext'
import { CircleHelp } from './icons/CircleHelp'
import { ChevronFirst } from './icons/ChevronFirst'

const Navbar = ({ onViewChange, currentView }) => {
  const { currentUser, logout } = useAuth()
  const { toggleSidebar, sidebarVisible, mobileActiveTab, setMobileActiveTab } = useLayout()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const isMenuOpen = Boolean(menuAnchorEl)

  const handleOpenMenu = (event) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setMenuAnchorEl(null)
  }

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (currentUser && showAuthModal) {
      setShowAuthModal(false)
    }
  }, [currentUser, showAuthModal])

  // Listen for custom event to open auth modal from other components
  useEffect(() => {
    const handleOpenAuthModal = (event) => {
      const mode = event.detail?.mode || 'login'
      setAuthMode(mode)
      setShowAuthModal(true)
    }

    window.addEventListener('openAuthModal', handleOpenAuthModal)
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal)
    }
  }, [])

  const handleNavigation = (view) => {
    if (onViewChange) {
      onViewChange(view)
    }
    handleCloseMenu()
  }

  const handleNavigate = handleNavigation

  const handleHomeClick = () => {
    handleNavigation('chat')
  }

  const handleOpenModal = (setter) => {
    setter(true)
    handleCloseMenu()
  }

  const handleAuthClick = (mode) => {
    setAuthMode(mode)
    setShowAuthModal(true)
    handleCloseMenu()
  }

  const handleLogout = async () => {
    try {
      handleCloseMenu()
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const getUserDisplayName = () => {
    const displayName = currentUser?.displayName?.trim()
    if (displayName) return displayName

    const email = currentUser?.email?.trim()
    if (!email) return 'Guest Explorer'

    const prefix = email.split('@')[0]?.trim()
    return prefix || email
  }

  const getUserInitials = (displayName) => {
    if (!displayName || displayName === 'Guest Explorer') return 'PG'
    const names = displayName.split(' ')
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase()
  }

  return (
    <>
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: 56,
        zIndex: (theme) => theme.zIndex.appBar + 10
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: '56px !important', height: 56, px: { xs: 1, sm: 2 } }}>
        <Container maxWidth={false} disableGutters sx={{ px: 0, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%' }}>
            
            {/* Left: Sidebar Toggle + Brand Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                onClick={toggleSidebar}
                size="small"
                aria-label="Toggle sidebar"
                sx={{
                  display: { xs: 'inline-flex', md: 'none' },
                  color: '#000000',
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                  width: 36,
                  height: 36,
                  backgroundColor: sidebarVisible ? 'rgba(0,0,0,0.04)' : '#ffffff',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <ChevronFirst width={16} height={16} strokeWidth={2.2} stroke="#000000" />
              </IconButton>

              <Box
                onClick={handleHomeClick}
                role="button"
                title="Go to Home"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <img
                  src="/pg.png"
                  alt="PG Logo"
                  width={32}
                  height={32}
                  style={{
                    display: 'block',
                    height: 32,
                    width: 32,
                    objectFit: 'contain'
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '0.03em',
                    textTransform: 'uppercase',
                    color: 'primary.main',
                    fontSize: { xs: '0.95rem', sm: '1.15rem' },
                    display: { xs: currentView === 'chat' ? 'none' : 'block', sm: 'block' },
                    whiteSpace: 'nowrap',
                    lineHeight: 1
                  }}
                >
                  PRATIYOGITA GYAN
                </Typography>
              </Box>
            </Box>

            {/* Center: Integrated PYQ / Chat Switcher (Clean, Seamless & Single-Row with Smooth Sliding Highlight) */}
            {currentView === 'chat' && (
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  position: 'relative',
                  alignItems: 'center',
                  backgroundColor: '#18181b',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 999,
                  p: '3px',
                  height: 34,
                  width: 140,
                  overflow: 'hidden',
                  userSelect: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {/* Smooth Sliding Orange Highlight Pill */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 3,
                    bottom: 3,
                    left: 3,
                    width: 'calc(50% - 3px)',
                    backgroundColor: '#E4572E',
                    borderRadius: 999,
                    boxShadow: '0 2px 8px rgba(228,87,46,0.45)',
                    transform: mobileActiveTab === 'chat' ? 'translateX(100%)' : 'translateX(0%)',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />

                <Button
                  onClick={() => setMobileActiveTab('pyq')}
                  disableRipple
                  size="small"
                  sx={{
                    flex: 1,
                    height: '100%',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    gap: 0.5,
                    position: 'relative',
                    zIndex: 2,
                    color: mobileActiveTab === 'pyq' ? '#ffffff' : '#9ca3af',
                    backgroundColor: 'transparent !important',
                    boxShadow: 'none',
                    p: 0,
                    minWidth: 0,
                    transition: 'color 0.2s ease',
                    '&:hover': { color: '#ffffff' }
                  }}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>PYQ</span>
                </Button>
                <Button
                  onClick={() => setMobileActiveTab('chat')}
                  disableRipple
                  size="small"
                  sx={{
                    flex: 1,
                    height: '100%',
                    borderRadius: 999,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    gap: 0.5,
                    position: 'relative',
                    zIndex: 2,
                    color: mobileActiveTab === 'chat' ? '#ffffff' : '#9ca3af',
                    backgroundColor: 'transparent !important',
                    boxShadow: 'none',
                    p: 0,
                    minWidth: 0,
                    transition: 'color 0.2s ease',
                    '&:hover': { color: '#ffffff' }
                  }}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </Button>
              </Box>
            )}

            {/* Right: Attached Menu Button */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                onClick={handleOpenMenu}
                aria-label="Open navigation menu"
                aria-controls={isMenuOpen ? 'app-attached-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={isMenuOpen ? 'true' : undefined}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: { xs: 0, sm: 0.8 },
                  p: { xs: '4px 6px', sm: '4px 10px' },
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: isMenuOpen ? 'primary.main' : '#e5e7eb',
                  backgroundColor: isMenuOpen ? 'rgba(228,87,46,0.08)' : '#ffffff',
                  color: '#1f2937',
                  minWidth: 'auto',
                  height: 38,
                  boxShadow: isMenuOpen ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    borderColor: '#d1d5db'
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 26,
                    height: 26,
                    bgcolor: currentUser ? '#10b981' : '#E4572E',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {getUserInitials(getUserDisplayName())}
                </Avatar>
                <Box
                  component="span"
                  sx={{
                    display: { xs: 'none', sm: 'inline-block' },
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#111827'
                  }}
                >
                  {getUserDisplayName()}
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                  <MoreVertical size={16} strokeWidth={2} style={{ color: '#4b5563', marginLeft: 2 }} />
                </Box>
              </Button>
            </Box>
          </Box>
        </Container>
      </Toolbar>

      <Popover
        id="app-attached-menu"
        open={isMenuOpen}
        anchorEl={menuAnchorEl}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          elevation: 12,
          sx: {
            mt: 1,
            width: 270,
            borderRadius: 3.5,
            backgroundColor: '#262626',
            color: '#f3f4f6',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
            p: 1.25,
            overflow: 'hidden'
          }
        }}
      >
        <Box
          onClick={() => currentUser ? handleOpenModal(setShowEditProfile) : handleAuthClick('login')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.25,
            borderRadius: 2.5,
            backgroundColor: 'rgba(255,255,255,0.04)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.08)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: currentUser ? '#10b981' : '#E4572E',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {getUserInitials(getUserDisplayName())}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {getUserDisplayName()}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.72rem',
                  display: 'block',
                  lineHeight: 1.2,
                  mt: 0.2
                }}
              >
                {currentUser ? 'Free Tier' : 'Sign in for full sync'}
              </Typography>
            </Box>
          </Box>
          <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
        </Box>

        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* Menu Navigation Items */}
        <Stack spacing={0.3}>
          <MenuItem
            onClick={() => handleNavigate('chat')}
            selected={currentView === 'chat'}
            sx={{
              borderRadius: 2,
              py: 0.85,
              px: 1.2,
              gap: 1.5,
              color: currentView === 'chat' ? '#E4572E' : '#e5e7eb',
              fontSize: '0.82rem',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
              '&.Mui-selected': { backgroundColor: 'rgba(228,87,46,0.12)', color: '#E4572E' }
            }}
          >
            <Home size={17} strokeWidth={2} />
            <span>Home</span>
          </MenuItem>

          <MenuItem
            onClick={() => handleNavigate('dashboard')}
            selected={currentView === 'dashboard'}
            sx={{
              borderRadius: 2,
              py: 0.85,
              px: 1.2,
              gap: 1.5,
              color: currentView === 'dashboard' ? '#E4572E' : '#e5e7eb',
              fontSize: '0.82rem',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
              '&.Mui-selected': { backgroundColor: 'rgba(228,87,46,0.12)', color: '#E4572E' }
            }}
          >
            <BarChart3 size={17} strokeWidth={2} />
            <span>Dashboard</span>
          </MenuItem>

          <MenuItem
            onClick={() => handleOpenModal(setShowAboutModal)}
            sx={{
              borderRadius: 2,
              py: 0.85,
              px: 1.2,
              gap: 1.5,
              color: '#e5e7eb',
              fontSize: '0.82rem',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
            }}
          >
            <Info size={17} strokeWidth={2} />
            <span>About Us</span>
          </MenuItem>

          <MenuItem
            onClick={() => handleOpenModal(setShowContactModal)}
            sx={{
              borderRadius: 2,
              py: 0.85,
              px: 1.2,
              gap: 1.5,
              color: '#e5e7eb',
              fontSize: '0.82rem',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
            }}
          >
            <Phone size={17} strokeWidth={2} />
            <span>Contact</span>
          </MenuItem>

          {currentUser && (
            <MenuItem
              onClick={() => handleOpenModal(setShowEditProfile)}
              sx={{
                borderRadius: 2,
                py: 0.85,
                px: 1.2,
                gap: 1.5,
                color: '#e5e7eb',
                fontSize: '0.82rem',
                fontWeight: 500,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
              }}
            >
              <Settings size={17} strokeWidth={2} />
              <span>Settings & Profile</span>
            </MenuItem>
          )}
        </Stack>

        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />

        {/* Footer Actions */}
        <Stack spacing={0.3}>
          <MenuItem
            onClick={() => {
              window.dispatchEvent(new CustomEvent('openHelpModal'))
              handleCloseMenu()
            }}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              borderRadius: 2,
              py: 0.85,
              px: 1.2,
              color: '#e5e7eb',
              fontSize: '0.82rem',
              fontWeight: 500,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CircleHelp width={17} height={17} strokeWidth={2} stroke="currentColor" />
              <span>Help & Support</span>
            </Box>
            <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
          </MenuItem>

          {currentUser ? (
            <MenuItem
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                py: 0.85,
                px: 1.2,
                gap: 1.5,
                color: '#f87171',
                fontSize: '0.82rem',
                fontWeight: 600,
                '&:hover': { backgroundColor: 'rgba(239,68,68,0.12)' }
              }}
            >
              <LogOut size={17} strokeWidth={2} />
              <span>Log out</span>
            </MenuItem>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
              <Button
                onClick={() => handleAuthClick('login')}
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<LogIn size={15} />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  borderRadius: 2,
                  fontSize: '0.78rem',
                  py: 0.6,
                  '&:hover': {
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255,255,255,0.05)'
                  }
                }}
              >
                Log In
              </Button>
              <Button
                onClick={() => handleAuthClick('signup')}
                fullWidth
                variant="contained"
                size="small"
                startIcon={<UserPlus size={15} />}
                sx={{
                  backgroundColor: 'primary.main',
                  color: '#ffffff',
                  borderRadius: 2,
                  fontSize: '0.78rem',
                  py: 0.6,
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                Sign up
              </Button>
            </Box>
          )}
        </Stack>
      </Popover>

      {/* Lazy Loaded Modals */}
      <Suspense fallback={null}>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode={authMode}
          />
        )}
        {showAboutModal && (
          <AboutUsModal
            isOpen={showAboutModal}
            onClose={() => setShowAboutModal(false)}
          />
        )}
        {showContactModal && (
          <ContactModal
            isOpen={showContactModal}
            onClose={() => setShowContactModal(false)}
          />
        )}
        {showEditProfile && (
          <EditProfileModal
            isOpen={showEditProfile}
            onClose={() => setShowEditProfile(false)}
          />
        )}
      </Suspense>
    </AppBar>
    </>
  )
}

Navbar.propTypes = {
  onViewChange: PropTypes.func.isRequired,
  currentView: PropTypes.string.isRequired
}

export default Navbar
