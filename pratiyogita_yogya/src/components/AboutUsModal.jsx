import React from 'react'
import { X, Bot, Sparkles, Target, Users } from 'lucide-react'

const AboutUsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const teamMembers = [
    {
      role: 'CO-FOUNDER & PRODUCT LEAD',
      image: '/Aboutusimages/Abhi.jpg',
      name: 'Abhinav Kumar'
    },
    {
      role: 'CO-FOUNDER & TECHNICAL LEAD',
      image: '/Aboutusimages/Manu.jpg',
      name: 'Manu Dev'
    },
    {
      role: 'DATA & OPERATIONS LEAD',
      image: '/Aboutusimages/Nitish.jpeg',
      name: 'Nitish Yadav'
    }
  ]

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-3 sm:p-4 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col my-auto max-h-[95vh] md:max-h-none md:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#E4572E]/20 border border-[#E4572E]/40 flex items-center justify-center text-[#E4572E]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">About Pratiyogita Setu</h2>
              <p className="text-xs text-gray-400">Guiding aspirants toward clarity, direction, and success</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop 2-Column Grid Body - Zero Scroll on Desktop */}
        <div className="p-4 sm:p-5 overflow-y-auto md:overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            
            {/* Left Column: Mission & Story */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              <div className="bg-blue-50/90 p-3.5 rounded-xl border-l-4 border-blue-600 shadow-xs">
                <p className="text-xs sm:text-[13px] text-gray-800 italic leading-relaxed">
                  We are <span className="font-bold text-blue-700">Abhinav Kumar</span>, <span className="font-bold text-blue-700">Manu Dev</span>, and <span className="font-bold text-blue-700">Nitish Yadav</span>. We created <span className="font-bold text-gray-900">Pratiyogita Setu</span> to bring clarity, direction, and confidence to students preparing for competitive examinations.
                </p>
              </div>

              <div className="space-y-2 text-xs sm:text-[13px] text-gray-700 leading-relaxed">
                <p>
                  Every year, millions of aspirants prepare for thousands of government and competitive exams across India. Yet, many struggle with one fundamental barrier: <strong>not clearly knowing their true eligibility</strong> or their most optimal path forward.
                </p>
                <p>
                  Some miss opportunities due to complex eligibility rules, others spend years preparing for exams they can't qualify for, and many feel lost in fragmented information.
                </p>
              </div>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/80 text-center">
                  <Target className="w-4 h-4 text-[#E4572E] mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-gray-800 block">Eligibility Clarity</span>
                  <span className="text-[10px] text-gray-500">Know where you stand</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-center">
                  <Sparkles className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-gray-800 block">Smart Analysis</span>
                  <span className="text-[10px] text-gray-500">Structured roadmaps</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-center">
                  <Users className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[11px] font-bold text-gray-800 block">Fair Chance</span>
                  <span className="text-[10px] text-gray-500">For every aspirant</span>
                </div>
              </div>
            </div>

            {/* Right Column: Meet the Team */}
            <div className="md:col-span-5 flex flex-col justify-between">
              <div className="bg-gray-50/90 border border-gray-200 rounded-xl p-3.5 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2.5 text-center md:text-left flex items-center justify-between">
                    <span>Meet the Founders</span>
                    <span className="text-[10px] text-gray-500 font-normal">Leadership Team</span>
                  </h3>

                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div
                        key={member.name}
                        className="flex items-center gap-3 p-2 bg-white rounded-xl border border-gray-200/80 shadow-xs hover:border-blue-300 transition-all"
                      >
                        <div className="w-11 h-13 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = 'https://via.placeholder.com/150'
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-[#E4572E] uppercase tracking-wide truncate">
                            {member.role}
                          </p>
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {member.name}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            Pratiyogita Setu
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-center text-gray-500 italic mt-2.5 pt-2 border-t border-gray-200">
                  "Supporting students in one of the most vital journeys of their lives."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AboutUsModal
