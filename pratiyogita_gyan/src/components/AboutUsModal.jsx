import React from 'react'
import { X, Bot } from 'lucide-react'

const AboutUsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const teamMembers = [
    {
      role: 'CO-FOUNDER & PRODUCT LEAD',
      image: './Aboutusimages/Abhi.jpg',
      name: 'Abhinav Kumar'
    },
    {
      role: 'CO-FOUNDER & TECHNICAL LEAD',
      image: './Aboutusimages/Manu.jpg',
      name: 'Manu Dev'
    },
    {
      role: 'DATA & OPERATIONS LEAD',
      image: './Aboutusimages/Nitish.jpeg',
      name: 'Nitish Yadav'
    }
  ]

  const handleOverlayClick = (e) => {
    // Close only if the user clicks directly on the semi-transparent backdrop
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed top-14 left-0 right-0 bottom-0 md:inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white w-full h-full max-w-none max-h-none rounded-none md:rounded-lg md:max-w-2xl md:h-auto md:max-h-[90vh] md:shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent inside clicks from closing
      >
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">About Pratiyogita Gyan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-gray-700 italic mb-3">
              We are <span className="font-semibold text-blue-700">Abhinav Kumar</span>, <span className="font-semibold text-blue-700">Manu Dev</span>, and <span className="font-semibold text-blue-700">Nitish Yadav</span>, and we created <span className="font-semibold">Pratiyogita Setu</span> with a simple purpose—
              to bring clarity, direction, and confidence to students preparing for competitive examinations.
            </p>
            <p className="text-sm text-gray-700 mb-3">
              Every year in India, millions of aspirants prepare for thousands of government and competitive exams.
              But despite the effort they put in, many students struggle with one basic problem:
              they don’t clearly know where they stand or what their best path forward is.
            </p>
            <p className="text-sm text-gray-700 mb-3">
              Some miss opportunities because they are unaware of their eligibility.
              Others spend years preparing for exams they may never qualify for.
              And many feel lost in a system filled with scattered information and uncertainty.
            </p>
            <p className="text-sm font-semibold text-gray-800 mb-3">Pratiyogita Setu was built to change that.</p>
            <p className="text-sm text-gray-700 mb-3">
              We believe that the first step toward success is clear and reliable guidance.
              Our platform helps aspirants understand their real eligibility, plan their preparation with structure,
              and move forward with confidence instead of confusion.
            </p>
            <p className="text-sm text-gray-700 mb-3">
              Through intelligent analysis, structured roadmaps, and trustworthy learning support,
              we aim to make sure that no genuine effort goes in the wrong direction
              and every student gets a fair chance to reach their goal.
            </p>
            <p className="text-sm text-gray-700">
              This is not just a project for us—
              it is a commitment to support students in one of the most important journeys of their lives.
            </p>
          </div>

          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3 text-center">Meet the Team</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <div key={member.name} className="border border-gray-200 rounded-lg p-3 text-center bg-white">
                  <div className="w-24 h-28 mx-auto rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = 'https://via.placeholder.com/200'
                      }}
                    />
                  </div>
                  <p className="mt-3 text-xs font-semibold text-blue-700">{member.role}</p>
                  <p className="text-sm font-medium text-gray-800">{member.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AboutUsModal
