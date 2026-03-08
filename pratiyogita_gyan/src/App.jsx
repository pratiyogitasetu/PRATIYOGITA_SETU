
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
import ChatSection from './components/ChatSection'

const Sidebar = lazy(() => import('./components/Sidebar'))
const PYQSection = lazy(() => import('./components/PYQSection'))
const Dashboard = lazy(() => import('./components/Dashboard'))
const PYQPractice = lazy(() => import('./components/PYQPractice'))
const QuizSection = lazy(() => import('./components/QuizSection'))
const EligibilitySection = lazy(() => import('./components/EligibilitySection'))
const SyllabusSection = lazy(() => import('./components/SyllabusSection'))
const GDTopicsSection = lazy(() => import('./components/GDTopicsSection'))

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#3A7CA5' },
    secondary: { main: '#6B7C93' },
    error: { main: '#D46A6A' },
    warning: { main: '#E2B93B' },
    success: { main: '#8DBE7F' },
    background: { default: '#F6F7F9', paper: '#FFFFFF' },
    text: { primary: '#1F2933', secondary: '#52616B' },
    divider: '#E3E7ED'
  },
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    h1: { fontSize: '28px', lineHeight: '36px', fontWeight: 600 },
    h2: { fontSize: '22px', lineHeight: '30px', fontWeight: 600 },
    h3: { fontSize: '18px', lineHeight: '26px', fontWeight: 600 },
    subtitle1: { fontSize: '16px', lineHeight: '24px', fontWeight: 500 },
    body1: { fontSize: '15px', lineHeight: '24px', fontWeight: 400 },
    body2: { fontSize: '13.5px', lineHeight: '22px', fontWeight: 400 },
    caption: { fontSize: '12px', lineHeight: '18px', fontWeight: 400 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '14px', lineHeight: '20px' }
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { border: '1px solid #E3E7ED' }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#E3E7ED' }
      }
    },
    MuiButton: {
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
        backgroundColor: '#f5f5f5'
      }}
    >
      <Navbar onViewChange={handleViewChange} currentView={currentView} />
      <div className="flex flex-col md:flex-row h-full pt-14 md:pt-[72px]">
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
            <ChatSection />
            <Suspense
              fallback={
                <Box sx={{ width: 450, p: 2 }}>
                  <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={160} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={160} />
                </Box>
              }
            >
              <PYQSection />
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
