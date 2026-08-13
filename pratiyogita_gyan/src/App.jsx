
import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Box, Skeleton } from '@mui/material'
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { LayoutProvider } from './contexts/LayoutContext'
import { SearchHistoryProvider } from './contexts/SearchHistoryContext'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardProvider } from './contexts/DashboardContext'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'

const Sidebar = lazy(() => import('./components/Sidebar'))
const PYQSection = lazy(() => import('./components/PYQSection'))
const Dashboard = lazy(() => import('./components/Dashboard'))
const PYQPractice = lazy(() => import('./components/PYQPractice'))
const QuizSection = lazy(() => import('./components/QuizSection'))
const EligibilitySection = lazy(() => import('./components/EligibilitySection'))
const SyllabusSection = lazy(() => import('./components/SyllabusSection'))
const GDTopicsSection = lazy(() => import('./components/GDTopicsSection'))
const ChatSection = lazy(() => import('./components/ChatSection'))

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
    h1: { fontSize: '20px', lineHeight: '26px', fontWeight: 600, fontFamily: "\"Fredoka\", sans-serif" },
    h2: { fontSize: '16px', lineHeight: '22px', fontWeight: 600, fontFamily: "\"Fredoka\", sans-serif" },
    h3: { fontSize: '14px', lineHeight: '20px', fontWeight: 600, fontFamily: "\"Fredoka\", sans-serif" },
    subtitle1: { fontSize: '13px', lineHeight: '18px', fontWeight: 500 },
    body1: { fontSize: '12.5px', lineHeight: '18px', fontWeight: 400 },
    body2: { fontSize: '11px', lineHeight: '16px', fontWeight: 400 },
    caption: { fontSize: '10px', lineHeight: '14px', fontWeight: 400 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '11px', lineHeight: '16px' }
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { border: '1px solid rgba(11, 10, 8, 0.12)' }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(11, 10, 8, 0.12)' }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: { borderRadius: 10, minHeight: 40 }
      }
    }
  }
})

function AppContent() {
  const [currentView, setCurrentView] = useState('chat') // 'chat', 'dashboard', 'pyq-practice', 'eligibility', 'syllabus', 'quiz', 'gd-topics'
  const { theme } = useTheme()

  // Function to handle view changes
  const handleViewChange = (view) => {
    setCurrentView(view)
  }

  // Listen for events from sidebar
  useEffect(() => {
    const handleSwitchToPyqPractice = () => {
      setCurrentView('pyq-practice')
    }

    const handleSwitchToEligibility = () => {
      setCurrentView('eligibility')
    }

    const handleSwitchToSyllabus = () => {
      setCurrentView('syllabus')
    }

    const handleSwitchToQuiz = () => {
      setCurrentView('quiz')
    }

    const handleSwitchToGDTopics = () => {
      setCurrentView('gd-topics')
    }

    const handleSwitchToChat = () => {
      setCurrentView('chat')
    }

    window.addEventListener('switchToPyqPractice', handleSwitchToPyqPractice)
    window.addEventListener('switchToEligibility', handleSwitchToEligibility)
    window.addEventListener('switchToSyllabus', handleSwitchToSyllabus)
    window.addEventListener('switchToQuiz', handleSwitchToQuiz)
    window.addEventListener('switchToGDTopics', handleSwitchToGDTopics)
    window.addEventListener('switchToChat', handleSwitchToChat)

    return () => {
      window.removeEventListener('switchToPyqPractice', handleSwitchToPyqPractice)
      window.removeEventListener('switchToEligibility', handleSwitchToEligibility)
      window.removeEventListener('switchToSyllabus', handleSwitchToSyllabus)
      window.removeEventListener('switchToQuiz', handleSwitchToQuiz)
      window.removeEventListener('switchToGDTopics', handleSwitchToGDTopics)
      window.removeEventListener('switchToChat', handleSwitchToChat)
    }
  }, [])

  return (
    <div
      className="h-screen overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: 'transparent'
      }}
    >
      {/* Grainy background - matching Setu/Yogya */}
      <svg className="hidden">
        <filter id="grainy">
          <feTurbulence type="fractalNoise" baseFrequency=".537" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </svg>
      <div className="grainy-background-layer" />
      <Navbar onViewChange={handleViewChange} currentView={currentView} />
      <div className="flex flex-col md:flex-row h-full pt-[56px] md:pt-[60px]">
        <Suspense
          fallback={
            <Box sx={{ width: 240, p: 2 }}>
              <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={16} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={16} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={16} sx={{ mb: 1 }} />
              <Skeleton variant="rounded" height={16} />
            </Box>
          }
        >
          <Sidebar />
        </Suspense>
        {currentView === 'dashboard' ? (
          <Suspense
            fallback={
              <Box sx={{ flex: 1, p: 2 }}>
                <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={200} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={200} />
              </Box>
            }
          >
            <Dashboard />
          </Suspense>
        ) : currentView === 'pyq-practice' ? (
          <Suspense
            fallback={
              <Box sx={{ flex: 1, p: 2 }}>
                <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={300} />
              </Box>
            }
          >
            <PYQPractice />
          </Suspense>
        ) : currentView === 'eligibility' ? (
          <Suspense
            fallback={
              <Box sx={{ flex: 1, p: 2 }}>
                <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={300} />
              </Box>
            }
          >
            <EligibilitySection />
          </Suspense>
        ) : currentView === 'syllabus' ? (
          <Suspense
            fallback={
              <Box sx={{ flex: 1, p: 2 }}>
                <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={300} />
              </Box>
            }
          >
            <SyllabusSection />
          </Suspense>
        ) : currentView === 'quiz' ? (
          <Suspense
            fallback={
              <Box sx={{ flex: 1, p: 2 }}>
                <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={300} />
              </Box>
            }
          >
            <QuizSection />
          </Suspense>
        ) : currentView === 'gd-topics' ? (
          <Suspense
            fallback={
              <Box sx={{ flex: 1, p: 2 }}>
                <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
                <Skeleton variant="rounded" height={300} />
              </Box>
            }
          >
            <GDTopicsSection />
          </Suspense>
        ) : (
          <>
            <Suspense
              fallback={
                <Box sx={{ flex: 1, p: 2 }}>
                  <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={160} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={160} />
                </Box>
              }
            >
              <PYQSection />
            </Suspense>
            <Suspense
              fallback={
                <Box sx={{ flex: 1, p: 2 }}>
                  <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={160} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={160} />
                </Box>
              }
            >
              <ChatSection />
            </Suspense>
          </>
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <LayoutProvider>
            <SearchHistoryProvider>
              <DashboardProvider>
                <MuiThemeProvider theme={muiTheme}>
                  <CssBaseline />
                  <AppContent />
                </MuiThemeProvider>
              </DashboardProvider>
            </SearchHistoryProvider>
          </LayoutProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
