import React, { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useLayout } from '../contexts/LayoutContext'
import { MessageSquare, Sparkles, Send, Mic, Paperclip, Globe, Smile, Image } from 'lucide-react'

const GDTopicsSection = () => {
  const { theme } = useTheme()
  const { sidebarVisible, isMobile } = useLayout()
  
  // Calculate dynamic margins based on sidebar visibility
  const leftMargin = isMobile
    ? 'ml-0'
    : sidebarVisible
      ? 'ml-52 sm:ml-60 md:ml-68'
      : 'ml-12'
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!message.trim()) return

    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setIsLoading(true)

    // Simulate AI response - replace with actual API call
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        text: 'This is a placeholder response for GD Topics. Integrate with your AI backend here.',
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={`flex-1 ${leftMargin} mr-0 md:mr-4 flex flex-col h-full overflow-hidden pl-2 pr-2 pb-2`}>
      {/* Entire section with gradient background */}
      <div 
        className="flex-1 md:border md:border-gray-400 md:rounded-lg shadow-sm flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #87CEEB 0%, #FFB6D9 35%, #FFA07A 65%, #FF6B6B 100%)'
        }}
      >
        {/* Centered input area container */}
        <div className="flex-1 flex items-center justify-center px-2 md:px-6">
          <div className="w-full max-w-none md:max-w-2xl">
            <div 
              className="relative overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: '#1e1e1e',
                borderRadius: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div className="flex items-center px-4 py-4">
                {/* Textarea field */}
                <div className="flex-1 px-3">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your Topic here..."
                    rows="1"
                    className="w-full bg-transparent border-0 outline-none text-base resize-none overflow-y-auto"
                    style={{
                      color: '#ffffff',
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      caretColor: '#66ccff',
                      maxHeight: '6rem', // 4 lines approximately
                      minHeight: '1.5rem'
                    }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px'; // 96px = ~4 lines
                    }}
                  />
                  <style jsx>{`
                    textarea::placeholder {
                      color: #66ccff;
                      opacity: 0.8;
                    }
                    textarea::-webkit-scrollbar {
                      width: 4px;
                    }
                    textarea::-webkit-scrollbar-track {
                      background: transparent;
                    }
                    textarea::-webkit-scrollbar-thumb {
                      background: rgba(102, 204, 255, 0.3);
                      border-radius: 2px;
                    }
                    textarea::-webkit-scrollbar-thumb:hover {
                      background: rgba(102, 204, 255, 0.5);
                    }
                  `}</style>
                </div>

                {/* Send button */}
                <div className="ml-3 self-end pb-1">
                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !message.trim()}
                    className="p-3 rounded-full bg-white hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                    title="Send message"
                  >
                    <Send className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>
            </div>

            {/* Topic Badges - 3 lines max */}
            <div className="mt-4 flex flex-wrap gap-1.5 justify-center max-w-2xl mx-auto">
              {[
                { label: 'AI & Tech', emoji: '🤖' },
                { label: 'Climate Change', emoji: '🌍' },
                { label: 'Women Empowerment', emoji: '👩' },
                { label: 'Digital India', emoji: '📱' },
                { label: 'Social Media', emoji: '📲' },
                { label: 'Education', emoji: '📚' },
                { label: 'Economy', emoji: '📈' },
                { label: 'Healthcare', emoji: '🏥' },
                { label: 'Green Energy', emoji: '⚡' },
                { label: 'Crypto', emoji: '💰' },
                { label: 'Space Tech', emoji: '🚀' },
                { label: 'Democracy', emoji: '�️' }
              ].map((topic, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(topic.label)}
                  className="group relative px-2.5 py-1 rounded-full transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    fontSize: '11px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)'
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.85)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <span className="flex items-center space-x-1">
                    <span className="text-xs">{topic.emoji}</span>
                    <span 
                      className="font-medium whitespace-nowrap"
                      style={{ color: '#1e1e1e' }}
                    >
                      {topic.label}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GDTopicsSection
