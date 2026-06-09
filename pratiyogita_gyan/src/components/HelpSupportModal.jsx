import React from 'react'
import { X, HelpCircle, MessageCircle, Book, FileText, Search, Settings, Lightbulb } from 'lucide-react'

const HelpSupportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white w-full h-full max-w-none max-h-none rounded-none md:rounded-lg md:max-w-2xl md:h-auto md:max-h-[90vh] md:shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Help and Support"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Help & Support</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Getting Started */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2 text-sm">Getting Started</h3>
              <div className="space-y-2 text-xs text-blue-700">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-3 h-3 flex-shrink-0" />
                  <span>Type your question and choose a subject for better relevance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Search className="w-3 h-3 flex-shrink-0" />
                  <span>Use specific keywords (chapter, topic, class) for precise answers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span>Use PYQ Practice for question-wise preparation and revision</span>
                </div>
              </div>
            </div>
            
            {/* Features & Tips */}
            <div className="bg-green-50 p-3 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2 text-sm">Quick Tips</h3>
              <div className="space-y-2 text-xs text-green-700">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-3 h-3 flex-shrink-0" />
                  <span>If answer feels off, re-ask with subject + class selected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Book className="w-3 h-3 flex-shrink-0" />
                  <span>Sign in to keep chat history and dashboard progress synced</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Settings className="w-3 h-3 flex-shrink-0" />
                  <span>If history duplicates, reload once and reopen the chat</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mt-4 bg-gray-50 p-3 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">FAQ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-semibold text-gray-700">Q: Can I use without signing up?</p>
                <p className="text-gray-600">A: Yes! Guest users can chat freely.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Q: Are answers accurate?</p>
                <p className="text-gray-600">A: Answers are generated from indexed study content; verify important points with your syllabus/textbook.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Q: Any question limits?</p>
                <p className="text-gray-600">A: You can ask multiple questions, but response speed may vary with load.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Q: How to get best results?</p>
                <p className="text-gray-600">A: Be specific, select the right subject/class, and ask one clear question at a time.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-3 rounded-b-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Need help? support@pratiyogitagyan.com (include screenshot + query)</span>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white py-1 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpSupportModal
