import React from 'react'
import { BookOpen, MessageSquare } from 'lucide-react'
import { useLayout } from '../contexts/LayoutContext'
import PropTypes from 'prop-types'

const MobileTabBar = () => {
  const { mobileActiveTab, setMobileActiveTab } = useLayout()

  return (
    <div
      className="md:hidden fixed left-0 right-0 flex items-center justify-center px-4 py-1.5 bg-transparent pointer-events-none"
      style={{
        top: 56,
        height: 48,
        zIndex: 1000
      }}
    >
      <div className="relative flex w-full max-w-sm items-center bg-[#18181b]/80 backdrop-blur-md p-1 rounded-2xl border border-white/10 shadow-xl pointer-events-auto">
        {/* Animated Sliding Background Pill */}
        <div
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-[#E4572E] shadow-md transition-all duration-300 ease-out pointer-events-none"
          style={{
            left: mobileActiveTab === 'pyq' ? '4px' : 'calc(50% + 0px)',
            boxShadow: '0 2px 10px rgba(228, 87, 46, 0.45)'
          }}
        />

        {/* Tab 1: PYQ Section */}
        <button
          type="button"
          onClick={() => setMobileActiveTab('pyq')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-xl transition-colors duration-200 ${mobileActiveTab === 'pyq' ? 'text-white' : 'text-gray-300 hover:text-white'
            }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>PYQ Section</span>
        </button>

        {/* Tab 2: Chat Section */}
        <button
          type="button"
          onClick={() => setMobileActiveTab('chat')}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-xl transition-colors duration-200 ${mobileActiveTab === 'chat' ? 'text-white' : 'text-gray-300 hover:text-white'
            }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat Section</span>
        </button>
      </div>
    </div>
  )
}

export default MobileTabBar
