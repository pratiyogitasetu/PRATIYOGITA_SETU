import { useState, useEffect, lazy, Suspense } from 'react'
import { LogIn, UserPlus, Home, BarChart3, Info, Phone, LogOut, Target, Menu, ChevronLeft, User } from 'lucide-react'
import { AppBar, Toolbar, Box, Typography, Button, Avatar, Stack, Container, Chip, IconButton, Divider } from '@mui/material'
import { alpha } from '@mui/material/styles'
import PropTypes from 'prop-types'
const AuthModal = lazy(() => import('./AuthModal'))
const AboutUsModal = lazy(() => import('./AboutUsModal'))
const ContactModal = lazy(() => import('./ContactModal'))
const EditProfileModal = lazy(() => import('./EditProfileModal'))
import { useAuth } from '../contexts/AuthContext'
import { useLayout } from '../contexts/LayoutContext'
import { CircleHelp } from './icons/CircleHelp'

const Navbar = ({ onViewChange, currentView }) => {
  const { currentUser, logout } = useAuth()
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu, closeAllOverlays } = useLayout()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [loadTimeMs, setLoadTimeMs] = useState(null)

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (currentUser && showAuthModal) {
      console.log('User authenticated, closing modal:', currentUser.email)
      setShowAuthModal(false)
    }
  }, [currentUser, showAuthModal])

  // Also close modal when user changes (additional safety)
  useEffect(() => {
    if (currentUser) {
      setShowAuthModal(false)
    }
  }, [currentUser])

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

  const handleAuthClick = (mode) => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  const handleMobileViewChange = (view) => {
    onViewChange(view)
    closeMobileMenu()
  }

  const handleMobileModalOpen = (modalSetter) => {
    modalSetter(true)
    closeMobileMenu()
  }

  const handleHomeClick = () => {
    onViewChange('chat')
    closeAllOverlays()
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const getUserDisplayName = () => {
    const displayName = currentUser?.displayName?.trim()
    if (displayName) return displayName

    const email = currentUser?.email?.trim()
    if (!email) return 'User'

    const prefix = email.split('@')[0]?.trim()
    return prefix || email
  }

  const getUserInitials = (displayName) => {
    if (!displayName) return 'U'
    const names = displayName.split(' ')
    return names.length > 1 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase()
  }

  useEffect(() => {
    const computeLoadTime = () => {
      const entry = performance.getEntriesByType('navigation')[0]
      if (entry && entry.duration) {
        setLoadTimeMs(Math.round(entry.duration))
        return
      }
      if (performance.timing) {
        const timing = performance.timing
        const duration = timing.loadEventEnd - timing.navigationStart
        if (duration > 0) {
          setLoadTimeMs(Math.round(duration))
        }
      }
    }

    if (document.readyState === 'complete') {
      computeLoadTime()
    } else {
      const onLoad = () => computeLoadTime()
      window.addEventListener('load', onLoad)
      return () => window.removeEventListener('load', onLoad)
    }
  }, [])

  const navButtonSx = (active) => ({
    px: { xs: 0.5, sm: 1, md: 1.5 },
    py: { xs: 0, sm: 0 },
    borderRadius: active ? 2 : 1.5,
    backgroundColor: active ? 'primary.main' : 'transparent',
    color: 'text.primary',
    fontWeight: 700,
    fontSize: { xs: '0.6rem', sm: '0.75rem' },
    minWidth: 'auto',
    height: 40,
    display: 'inline-flex',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: active ? 'primary.main' : 'action.hover'
    }
  })

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: '#ffffff',
        border: '1px solid #808080',
        borderRadius: { xs: 0, md: 1 },
        top: { xs: 0, md: 8 },
        left: { xs: 0, md: 8 },
        right: { xs: 0, md: 8 },
        width: { xs: '100%', md: 'calc(100% - 16px)' },
        height: 56,
        zIndex: (theme) => theme.zIndex.appBar + 10,
        overflow: 'hidden'
      }}
    >
      <Toolbar disableGutters sx={{ minHeight: 56, height: 56, display: 'flex', alignItems: 'center', px: 0 }}>
        <Container
          maxWidth={false}
          disableGutters
          sx={{
            px: { xs: 0.5, sm: 0.75, md: 1 },
            height: '100%',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', minWidth: 0, height: '100%' }}>
            {/* Left side - App name */}
            <Box
              onClick={handleHomeClick}
              role="button"
              title="Go to Home"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                minWidth: 0,
                height: '100%',
                cursor: 'pointer'
              }}
            >
              <img
                src="/pg.png"
                alt="GS Logo"
                width={36}
                height={36}
                style={{
                  display: 'block',
                  height: 36,
                  width: 36,
                  margin: 'auto 0',
                  objectFit: 'contain',
                  
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                    color: 'primary.main',
                  fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  lineHeight: 1
                }}
              >
                PRATIYOGITA GYAN
              </Typography>
            </Box>

            {/* Mobile - Clock + Menu */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ display: { xs: 'flex', md: 'none' }, ml: 'auto' }}>
              {/* <Clock isMobile={true} /> */}
              <IconButton
                onClick={openMobileMenu}
                size="small"
                aria-label="Open menu"
                sx={{ color: 'text.primary', border: '1px solid', borderColor: 'divider', borderRadius: 2, width: 34, height: 34 }}
              >
                <Menu size={18} />
              </IconButton>
            </Stack>

            {/* Center - Navigation */}
            <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center', minWidth: 0, overflow: 'hidden', height: '100%', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: 'rgba(255,255,255,0.9)', px: { sm: 0.75, md: 1, lg: 1.5 }, py: 0, borderRadius: 2, boxShadow: 1, overflow: 'hidden', height: 40 }}>
                <Button onClick={() => onViewChange('chat')} startIcon={<Home size={14} />} sx={navButtonSx(currentView === 'chat')}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Home</Box>
                </Button>
                <Button onClick={() => onViewChange('dashboard')} startIcon={<BarChart3 size={14} />} sx={navButtonSx(currentView === 'dashboard')}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Dashboard</Box>
                </Button>
                <Button onClick={() => onViewChange('pyq-practice')} startIcon={<Target size={14} />} sx={navButtonSx(currentView === 'pyq-practice')}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>PYQ Practice</Box>
                </Button>
                <Button onClick={() => setShowAboutModal(true)} startIcon={<Info size={14} />} sx={navButtonSx(false)}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>About Us</Box>
                </Button>
                <Button onClick={() => setShowContactModal(true)} startIcon={<Phone size={14} />} sx={navButtonSx(false)}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Contact</Box>
                </Button>
              </Box>
            </Box>

            {/* Right side - Clock and User actions */}
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0, height: '100%', display: { xs: 'none', md: 'flex' } }}>
              {/* <Box sx={{ display: { xs: 'none', lg: 'flex' } }}>
                <Clock />
              </Box> */}
              {loadTimeMs !== null && (
                <Chip
                  size="small"
                  label={`${loadTimeMs}ms`}
                  sx={{
                    display: { xs: 'none', lg: 'flex' },
                    fontSize: '0.65rem',
                    height: 20,
                    alignSelf: 'center',
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.18),
                      color: 'text.primary'
                  }}
                />
              )}

              {currentUser ? (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ height: '100%', alignItems: 'center' }}>
                  <Button
                    onClick={() => setShowEditProfile(true)}
                    size="small"
                    variant="text"
                    sx={{
                      minWidth: 0,
                        color: 'text.primary',
                      px: 0.5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '100%',
                        '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12) }
                    }}
                  >
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center' }}>
                      {getUserInitials(getUserDisplayName())}
                    </Avatar>
                    <Typography
                      variant="caption"
                        sx={{ ml: 0.75, color: 'primary.main', display: { xs: 'none', lg: 'inline' }, fontWeight: 600, lineHeight: 1 }}
                    >
                      {getUserDisplayName()}
                    </Typography>
                  </Button>
                  <Button
                    onClick={handleLogout}
                    size="small"
                    variant="contained"
                    color="error"
                    startIcon={<LogOut size={12} />}
                    sx={{ borderRadius: 999, fontSize: '0.7rem', px: 1, py: 0.25, height: 32, display: 'inline-flex', alignItems: 'center' }}
                  >
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Logout</Box>
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ height: '100%', alignItems: 'center' }}>
                    <Button
                    onClick={() => handleAuthClick('login')}
                    size="small"
                    variant="contained"
                      startIcon={<LogIn size={14} />}
                      sx={{ backgroundColor: 'secondary.main', color: 'secondary.contrastText', borderRadius: 2, fontSize: '0.7rem', px: 1, py: 0.25, height: 32, display: 'inline-flex', alignItems: 'center', '&:hover': { backgroundColor: 'secondary.dark' } }}
                  >
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Log In</Box>
                  </Button>
                    <Button
                    onClick={() => handleAuthClick('signup')}
                    size="small"
                    variant="contained"
                      startIcon={<UserPlus size={14} />}
                      sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText', borderRadius: 2, fontSize: '0.7rem', px: 1, py: 0.25, height: 32, display: 'inline-flex', alignItems: 'center', '&:hover': { backgroundColor: 'primary.dark' } }}
                  >
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sign up</Box>
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>
        </Container>
      </Toolbar>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          <Box
            onClick={closeMobileMenu}
            sx={{
              position: 'fixed',
              top: 56,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(6px)',
              zIndex: (theme) => theme.zIndex.modal + 1
            }}
          />
          <Box
            sx={{
              position: 'fixed',
              top: 56,
              right: 0,
              bottom: 0,
              width: '80vw',
              maxWidth: 320,
              backgroundColor: '#ffffff',
              borderLeft: '1px solid #e5e7eb',
              boxShadow: 6,
              zIndex: (theme) => theme.zIndex.modal + 2,
              p: 2,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Button
              onClick={closeMobileMenu}
              startIcon={<ChevronLeft size={18} />}
              sx={{ justifyContent: 'flex-start', color: 'text.primary', mb: 1 }}
            >
              Back
            </Button>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Button onClick={() => handleMobileViewChange('chat')} startIcon={<Home size={16} />} variant="outlined" sx={{ justifyContent: 'flex-start' }}>
                Home
              </Button>
              <Button onClick={() => handleMobileViewChange('dashboard')} startIcon={<BarChart3 size={16} />} variant="outlined" sx={{ justifyContent: 'flex-start' }}>
                Dashboard
              </Button>
              <Button onClick={() => handleMobileViewChange('pyq-practice')} startIcon={<Target size={16} />} variant="outlined" sx={{ justifyContent: 'flex-start' }}>
                PYQ Practice
              </Button>
              <Button onClick={() => handleMobileModalOpen(setShowAboutModal)} startIcon={<Info size={16} />} variant="outlined" sx={{ justifyContent: 'flex-start' }}>
                About Us
              </Button>
              <Button onClick={() => handleMobileModalOpen(setShowContactModal)} startIcon={<Phone size={16} />} variant="outlined" sx={{ justifyContent: 'flex-start' }}>
                Contact
              </Button>
              <Button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openHelpModal'))
                  closeMobileMenu()
                }}
                startIcon={<CircleHelp width={16} height={16} strokeWidth={2} stroke="currentColor" />}
                variant="outlined"
                sx={{ justifyContent: 'flex-start' }}
              >
                Help & Support
              </Button>
            </Stack>
            <Divider sx={{ my: 1.5 }} />
            {currentUser ? (
              <Stack spacing={1}>
                <Button
                  onClick={() => {
                    setShowEditProfile(true)
                    closeMobileMenu()
                  }}
                  startIcon={<User size={16} />}
                  variant="outlined"
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Profile
                </Button>
                <Button
                  onClick={() => {
                    handleLogout()
                    closeMobileMenu()
                  }}
                  startIcon={<LogOut size={16} />}
                  variant="contained"
                  color="error"
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Logout
                </Button>
              </Stack>
            ) : (
              <Stack spacing={1}>
                <Button
                  onClick={() => {
                    handleAuthClick('login')
                    closeMobileMenu()
                  }}
                  startIcon={<LogIn size={16} />}
                  variant="contained"
                  color="secondary"
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Log In
                </Button>
                <Button
                  onClick={() => {
                    handleAuthClick('signup')
                    closeMobileMenu()
                  }}
                  startIcon={<UserPlus size={16} />}
                  variant="contained"
                  color="primary"
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Sign up
                </Button>
              </Stack>
            )}
          </Box>
        </Box>
      )}

      <Suspense fallback={null}>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />

        <AboutUsModal
          isOpen={showAboutModal}
          onClose={() => setShowAboutModal(false)}
        />

        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
        />
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
        />
      </Suspense>
    </AppBar>
  )
}

export default Navbar

Navbar.propTypes = {
  onViewChange: PropTypes.func.isRequired,
  currentView: PropTypes.string.isRequired
}
