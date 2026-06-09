import React, { createContext, useContext, useState, useEffect } from 'react'

const SearchHistoryContext = createContext()

export const useSearchHistory = () => {
  const context = useContext(SearchHistoryContext)
  if (!context) {
    throw new Error('useSearchHistory must be used within a SearchHistoryProvider')
  }
  return context
}

export const SearchHistoryProvider = ({ children }) => {
  const [searchHistory, setSearchHistory] = useState([])
  const [guestChatHistory, setGuestChatHistory] = useState([])

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('chatSearchHistory')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Error loading search history:', error)
        setSearchHistory([])
      }
    }

    // Load guest chat history
    const savedGuestChats = localStorage.getItem('guestChatHistory')
    if (savedGuestChats) {
      try {
        setGuestChatHistory(JSON.parse(savedGuestChats))
      } catch (error) {
        console.error('Error loading guest chat history:', error)
        setGuestChatHistory([])
      }
    }
  }, [])

  // Function to add item to search history
  const addToSearchHistory = (query) => {
    if (!query.trim()) return
    
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 10) // Keep only last 10 items
    setSearchHistory(newHistory)
    localStorage.setItem('chatSearchHistory', JSON.stringify(newHistory))
  }

  // Function to clear search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('chatSearchHistory')
  }

  // Function to remove specific item from search history
  const removeFromSearchHistory = (query) => {
    const newHistory = searchHistory.filter(item => item !== query)
    setSearchHistory(newHistory)
    localStorage.setItem('chatSearchHistory', JSON.stringify(newHistory))
  }

  // Guest chat history functions
  const addGuestChat = (chatData) => {
    const newChat = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: chatData.title || 'New Chat',
      firstMessage: chatData.firstMessage || '',
      messages: chatData.messages || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: (chatData.messages || []).length
    }
    
    const newHistory = [newChat, ...guestChatHistory.filter(chat => chat.id !== newChat.id)].slice(0, 20)
    setGuestChatHistory(newHistory)
    localStorage.setItem('guestChatHistory', JSON.stringify(newHistory))
    return newChat
  }

  const updateGuestChat = (chatId, updateData) => {
    const updatedHistory = guestChatHistory.map(chat => 
      chat.id === chatId 
        ? { 
            ...chat, 
            ...updateData, 
            updatedAt: new Date().toISOString(),
            messageCount: updateData.messages ? updateData.messages.length : chat.messageCount
          }
        : chat
    )
    setGuestChatHistory(updatedHistory)
    localStorage.setItem('guestChatHistory', JSON.stringify(updatedHistory))
  }

  const getGuestChat = (chatId) => {
    return guestChatHistory.find(chat => chat.id === chatId)
  }

  const clearGuestChatHistory = () => {
    setGuestChatHistory([])
    localStorage.removeItem('guestChatHistory')
  }

  const deleteGuestChat = (chatId) => {
    const updatedHistory = guestChatHistory.filter(chat => chat.id !== chatId)
    setGuestChatHistory(updatedHistory)
    localStorage.setItem('guestChatHistory', JSON.stringify(updatedHistory))
  }

  const value = {
    searchHistory,
    addToSearchHistory,
    clearSearchHistory,
    removeFromSearchHistory,
    guestChatHistory,
    addGuestChat,
    updateGuestChat,
    getGuestChat,
    clearGuestChatHistory,
    deleteGuestChat
  }

  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  )
}

export default SearchHistoryContext
