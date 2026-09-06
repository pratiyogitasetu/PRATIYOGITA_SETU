import React, { createContext, useContext, useEffect, useState } from 'react'

const LayoutContext = createContext()

export const useLayout = () => {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider')
  }
  return context
}

export const LayoutProvider = ({ children }) => {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [pyqVisible, setPyqVisible] = useState(true)
  const [mobileActiveTab, setMobileActiveTab] = useState('pyq') // 'pyq' | 'chat'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200))
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false))

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setViewportWidth(width)
      setIsMobile(width < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleSwitchToChat = (event) => {
      if (isMobile) {
        const targetTab = event?.detail?.targetTab || 'chat'
        setMobileActiveTab(targetTab)
      }
    }
    const handleSwitchToPyq = () => {
      if (isMobile) setMobileActiveTab('pyq')
    }
    const handleNewChat = () => {
      if (isMobile) setMobileActiveTab('pyq')
    }
    window.addEventListener('switchToChat', handleSwitchToChat)
    window.addEventListener('switchToPyq', handleSwitchToPyq)
    window.addEventListener('newChat', handleNewChat)
    return () => {
      window.removeEventListener('switchToChat', handleSwitchToChat)
      window.removeEventListener('switchToPyq', handleSwitchToPyq)
      window.removeEventListener('newChat', handleNewChat)
    }
  }, [isMobile])

  const contentOffsetLeft = (() => {
    if (isMobile) return 0

    // Sidebar dimensions mirror Sidebar.jsx:
    // expanded: 244px with 4px left gap + 4px separation gap = 252px (tablet 244px)
    // collapsed icon rail: 42px with 4px left gap + 4px separation gap = 50px
    if (sidebarVisible) {
      return viewportWidth >= 900 ? 252 : 244
    }

    return 50
  })()

  const toggleSidebar = () => {
    setSidebarVisible((prev) => {
      const next = !prev
      if (isMobile && next) {
        setMobileMenuOpen(false)
      }
      return next
    })
  }

  const togglePyq = () => {
    if (isMobile) {
      setMobileActiveTab((prev) => (prev === 'pyq' ? 'chat' : 'pyq'))
    } else {
      setPyqVisible((prev) => !prev)
    }
  }

  const openMobileMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(true)
      setSidebarVisible(false)
    }
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const closeAllOverlays = () => {
    setSidebarVisible(false)
    setMobileMenuOpen(false)
  }

  return (
    <LayoutContext.Provider value={{
      sidebarVisible,
      pyqVisible,
      mobileActiveTab,
      setMobileActiveTab,
      mobileMenuOpen,
      isMobile,
      contentOffsetLeft,
      toggleSidebar,
      togglePyq,
      openMobileMenu,
      closeMobileMenu,
      closeAllOverlays
    }}>
      {children}
    </LayoutContext.Provider>
  )
}
