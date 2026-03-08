import React from 'react'
import { X, Lightbulb, Calendar, Star, Zap, MessageCircle, Search, Book, Shield } from 'lucide-react'

const WhatsNewModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const updates = [
    {
      date: "Feb 2026",
      version: "Latest",
      features: [
        {
          icon: <Book className="w-4 h-4 text-blue-600" />,
          title: "Pratiyogita Dashboard",
          description: "Added a dedicated performance dashboard with subject-wise analysis, quiz trends, and activity-based insights."
        },
        {
          icon: <Search className="w-4 h-4 text-green-600" />,
          title: "External Product Navigation",
          description: "Sidebar now supports direct access to Pratiyogita Yogya and Pratiyogita Marg through configurable links."
        }
      ]
    },
    {
      date: "Jan 2026",
      version: "Major Update",
      features: [
        {
          icon: <Shield className="w-4 h-4 text-purple-600" />,
          title: "Account & Profile Experience",
          description: "Improved authentication flow with profile editing, better login gating, and cleaner account-driven navigation."
        },
        {
          icon: <MessageCircle className="w-4 h-4 text-orange-600" />,
          title: "Enhanced Chat Workspace",
          description: "Upgraded chat UX with improved history handling, smoother session switching, and better answer rendering."
        }
      ]
    },
    {
      date: "Dec 2025",
      version: "Platform Expansion",
      features: [
        {
          icon: <Zap className="w-4 h-4 text-yellow-600" />,
          title: "PYQ Practice Improvements",
          description: "Expanded PYQ workflows for practice-oriented preparation with better question handling and user controls."
        },
        {
          icon: <Star className="w-4 h-4 text-red-600" />,
          title: "Answer Mode Controls",
          description: "Introduced multiple answer-length modes to support quick revision as well as detailed concept learning."
        }
      ]
    }
  ]

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleOpenInsertedBooks = () => {
    window.dispatchEvent(new CustomEvent('openBooksModal'))
    onClose()
  }

  return (
    <div
      className="fixed top-0 right-0 left-0 bottom-0 md:inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1500] p-0 md:p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white w-full h-full max-w-none max-h-none rounded-none md:rounded-lg md:max-w-2xl md:h-auto md:max-h-[90vh] md:shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="What's New"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">What's New</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            
            {updates.map((update, index) => (
              <div key={index} className="relative pb-6 last:pb-0">
                {/* Timeline dot */}
                <div className="absolute left-4 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-sm"></div>
                
                {/* Content */}
                <div className="ml-12">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800">{update.date}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {update.version}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {update.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {feature.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-sm mb-1">
                              {feature.title}
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Quick Access */}
          <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">Inserted Books</h3>
                <p className="text-xs text-gray-600 mt-1">
                  View indexed books and key topics from the knowledge base.
                </p>
              </div>
              <button
                onClick={handleOpenInsertedBooks}
                className="bg-blue-600 text-white py-1.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold"
              >
                Open
              </button>
            </div>
          </div>

          {/* Product direction section */}
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-purple-800 text-sm">Product Direction</span>
            </div>
            <div className="space-y-2 text-xs text-purple-700">
              <p>• Keep core preparation tools simple, fast, and reliable.</p>
              <p>• Improve answer relevance and subject-level tracking accuracy.</p>
              <p>• Strengthen integration across Pratiyogita Gyan, Yogya, and Marg.</p>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3 rounded-b-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Stay updated with our latest features!</span>
            <button
              onClick={onClose}
              className="bg-yellow-600 text-white py-1 px-3 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WhatsNewModal
