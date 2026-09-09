import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  UserPlus,
  Home,
  Info,
  Phone,
  LogOut,
  ChevronRight,
  Settings,
  MoreVertical,
  Target,
  Sparkles
} from 'lucide-react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  Avatar,
  Stack,
  Container,
  Divider,
  MenuItem,
  Popover
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../AuthModal';
import EditProfileModal from '../auth/EditProfileModal';
import AboutUsModal from '../AboutUsModal';
import ContactModal from '../ContactModal';

// Theme matching Pratiyogita Gyan exactly
const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#E4572E' },
    secondary: { main: '#3D2817' },
    error: { main: '#D46A6A' },
    warning: { main: '#E2B93B' },
    success: { main: '#8DBE7F' },
    background: { default: 'transparent', paper: '#FFFFFF' },
    text: { primary: '#0B0A08', secondary: 'rgba(11, 10, 8, 0.6)' },
    divider: 'rgba(11, 10, 8, 0.12)'
  },
  typography: {
    fontFamily: "\"Sora\", -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    button: { textTransform: 'none', fontWeight: 600, fontSize: '11px', lineHeight: '16px' }
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: { borderRadius: 10, textTransform: 'none' }
      }
    }
  }
});

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const isMenuOpen = Boolean(menuAnchorEl);

  useEffect(() => {
    if (currentUser && showAuthModal) {
      setShowAuthModal(false);
    }
  }, [currentUser, showAuthModal]);

  useEffect(() => {
    const handleOpenAuthModal = (event) => {
      const mode = event.detail?.mode || 'login';
      setAuthMode(mode);
      setShowAuthModal(true);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal);
    };
  }, []);

  const handleAuthClick = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
    handleCloseMenu();
  };

  const handleOpenMenu = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleCloseMenu();
  };

  const handleLogout = async () => {
    try {
      handleCloseMenu();
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getUserDisplayName = () => {
    const displayName = currentUser?.displayName?.trim();
    if (displayName) return displayName;

    const email = currentUser?.email?.trim();
    if (!email) return 'Guest Explorer';

    const prefix = email.split('@')[0]?.trim();
    return prefix || email;
  };

  const getUserInitials = (displayName) => {
    if (!displayName || displayName === 'Guest Explorer') return 'PY';
    const names = displayName.split(' ');
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    if (path === '/check-eligibility') {
      return location.pathname === '/check-eligibility' || location.pathname === '/checkeligibility';
    }
    return location.pathname === path;
  };

  return (
    <ThemeProvider theme={muiTheme}>
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

              {/* Left: Brand Logo + Name matching Pratiyogita Gyan */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  onClick={() => handleNavigate('/')}
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
                    src="/logos/py.png"
                    alt="PY Logo"
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
                      color: '#E4572E',
                      fontSize: { xs: '0.95rem', sm: '1.15rem' },
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
                    }}
                  >
                    PRATIYOGITA YOGYA
                  </Typography>
                </Box>
              </Box>

              {/* Right: Desktop Nav Tabs + Attached Menu Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {/* Desktop Nav Tabs (Shifted from Dropdown for Desktop View Only) */}
                <Box
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    gap: 0.8,
                    mr: 0.5
                  }}
                >
                  {[
                    { path: '/', label: 'Home', icon: Home },
                    { path: '/check-eligibility', label: 'Check Eligibility', icon: Target },
                    { path: '/profile', label: 'Pratiyogita Details', icon: Sparkles }
                  ].map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    const isPurple = item.path === '/profile';
                    return (
                      <Button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        size="small"
                        startIcon={<Icon size={15} strokeWidth={2} />}
                        sx={{
                          height: 36,
                          px: 1.5,
                          borderRadius: 999,
                          fontSize: '0.8rem',
                          fontWeight: active ? 700 : 500,
                          textTransform: 'none',
                          fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                          color: active
                            ? (isPurple ? '#a855f7' : '#E4572E')
                            : '#4b5563',
                          backgroundColor: active
                            ? (isPurple ? 'rgba(168,85,247,0.12)' : 'rgba(228,87,46,0.08)')
                            : 'transparent',
                          border: '1px solid',
                          borderColor: active
                            ? (isPurple ? 'rgba(168,85,247,0.25)' : 'rgba(228,87,46,0.18)')
                            : 'transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            color: isPurple ? '#a855f7' : '#E4572E',
                            backgroundColor: isPurple ? 'rgba(168,85,247,0.08)' : 'rgba(228,87,46,0.05)',
                            borderColor: active
                              ? (isPurple ? 'rgba(168,85,247,0.3)' : 'rgba(228,87,46,0.25)')
                              : 'rgba(0,0,0,0.06)'
                          }
                        }}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Box>

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
                    borderColor: isMenuOpen ? '#E4572E' : '#e5e7eb',
                    backgroundColor: isMenuOpen ? 'rgba(228,87,46,0.08)' : '#ffffff',
                    color: '#1f2937',
                    minWidth: 'auto',
                    height: 38,
                    textTransform: 'none',
                    boxShadow: isMenuOpen ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.04)',
                      borderColor: '#d1d5db'
                    }
                  }}
                >
                  <Avatar
                    src={currentUser?.photoURL || undefined}
                    sx={{
                      width: 26,
                      height: 26,
                      bgcolor: currentUser ? '#10b981' : '#E4572E',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
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
                      color: '#111827',
                      fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                      textTransform: 'none'
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
              overflow: 'hidden',
              fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
            }
          }}
        >
          {/* User Card */}
          <Box
            onClick={() => {
              if (currentUser) {
                setShowEditProfile(true);
                handleCloseMenu();
              } else {
                handleAuthClick('login');
              }
            }}
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
                src={currentUser?.photoURL || undefined}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: currentUser ? '#10b981' : '#E4572E',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
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
                    whiteSpace: 'nowrap',
                    fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
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
                    mt: 0.2,
                    fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
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
              onClick={() => handleNavigate('/')}
              selected={isActive('/')}
              sx={{
                display: { xs: 'flex', md: 'none' },
                borderRadius: 2,
                py: 0.85,
                px: 1.2,
                gap: 1.5,
                color: isActive('/') ? '#E4572E' : '#e5e7eb',
                fontSize: '0.82rem',
                fontWeight: 500,
                fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                '&.Mui-selected': { backgroundColor: 'rgba(228,87,46,0.12)', color: '#E4572E' }
              }}
            >
              <Home size={17} strokeWidth={2} />
              <span style={{ fontFamily: '"Sora", sans-serif' }}>Home</span>
            </MenuItem>

            <MenuItem
              onClick={() => handleNavigate('/check-eligibility')}
              selected={isActive('/check-eligibility')}
              sx={{
                display: { xs: 'flex', md: 'none' },
                borderRadius: 2,
                py: 0.85,
                px: 1.2,
                gap: 1.5,
                color: isActive('/check-eligibility') ? '#E4572E' : '#e5e7eb',
                fontSize: '0.82rem',
                fontWeight: 500,
                fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                '&.Mui-selected': { backgroundColor: 'rgba(228,87,46,0.12)', color: '#E4572E' }
              }}
            >
              <Target size={17} strokeWidth={2} />
              <span style={{ fontFamily: '"Sora", sans-serif' }}>Check Eligibility</span>
            </MenuItem>

            <MenuItem
              onClick={() => handleNavigate('/profile')}
              selected={isActive('/profile')}
              sx={{
                display: { xs: 'flex', md: 'none' },
                borderRadius: 2,
                py: 0.85,
                px: 1.2,
                gap: 1.5,
                color: isActive('/profile') ? '#a855f7' : '#e5e7eb',
                fontSize: '0.82rem',
                fontWeight: 500,
                fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                '&.Mui-selected': { backgroundColor: 'rgba(168,85,247,0.15)', color: '#c084fc' }
              }}
            >
              <Sparkles size={17} strokeWidth={2} />
              <span style={{ fontFamily: '"Sora", sans-serif' }}>Pratiyogita Details</span>
            </MenuItem>

            <MenuItem
              onClick={() => {
                setShowAboutModal(true);
                handleCloseMenu();
              }}
              sx={{
                borderRadius: 2,
                py: 0.85,
                px: 1.2,
                gap: 1.5,
                color: '#e5e7eb',
                fontSize: '0.82rem',
                fontWeight: 500,
                fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
              }}
            >
              <Info size={17} strokeWidth={2} />
              <span style={{ fontFamily: '"Sora", sans-serif' }}>About Us</span>
            </MenuItem>

            <MenuItem
              onClick={() => {
                setShowContactModal(true);
                handleCloseMenu();
              }}
              sx={{
                borderRadius: 2,
                py: 0.85,
                px: 1.2,
                gap: 1.5,
                color: '#e5e7eb',
                fontSize: '0.82rem',
                fontWeight: 500,
                fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
              }}
            >
              <Phone size={17} strokeWidth={2} />
              <span style={{ fontFamily: '"Sora", sans-serif' }}>Contact</span>
            </MenuItem>

            {currentUser && (
              <MenuItem
                onClick={() => {
                  setShowEditProfile(true);
                  handleCloseMenu();
                }}
                sx={{
                  borderRadius: 2,
                  py: 0.85,
                  px: 1.2,
                  gap: 1.5,
                  color: '#e5e7eb',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' }
                }}
              >
                <Settings size={17} strokeWidth={2} />
                <span style={{ fontFamily: '"Sora", sans-serif' }}>Settings & Profile</span>
              </MenuItem>
            )}
          </Stack>

          <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />

          {/* Footer Actions */}
          <Stack spacing={0.3}>
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
                  fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                  '&:hover': { backgroundColor: 'rgba(239,68,68,0.12)' }
                }}
              >
                <LogOut size={17} strokeWidth={2} />
                <span style={{ fontFamily: '"Sora", sans-serif' }}>Log out</span>
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
                    fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                    textTransform: 'none',
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
                    backgroundColor: '#E4572E',
                    color: '#ffffff',
                    borderRadius: 2,
                    fontSize: '0.78rem',
                    py: 0.6,
                    fontFamily: '"Sora", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#c9451e' }
                  }}
                >
                  Sign up
                </Button>
              </Box>
            )}
          </Stack>
        </Popover>

        {/* Modals matching Pratiyogita Gyan */}
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
      </AppBar>
    </ThemeProvider>
  );
};

export default Navbar;
