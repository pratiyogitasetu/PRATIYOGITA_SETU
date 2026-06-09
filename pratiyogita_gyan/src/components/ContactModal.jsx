import React from 'react'
import { X, Mail, Phone, Clock, Globe } from 'lucide-react'

const ContactModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Contact Us</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 mb-4 text-center">Get in Touch</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Email Support</p>
                    <p className="text-sm text-gray-600">support@pratiyogitagyan.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Phone</p>
                    <p className="text-sm text-gray-600">+91 9876543210</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Support Hours</p>
                    <p className="text-sm text-gray-600">Mon-Fri: 9 AM - 6 PM IST</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800">Website</p>
                    <p className="text-sm text-gray-600">www.pratiyogitagyan.com</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Help */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 mb-4 text-center">Quick Help</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="space-y-3 text-blue-700 text-sm">
                  <li className="flex items-center space-x-3">
                    <span>💬</span>
                    <span>Use the chatbot for instant study help</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span>📧</span>
                    <span>Email us for technical support</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span>📞</span>
                    <span>Call for urgent queries</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span>🕒</span>
                    <span>Response time: Within 24 hours</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-center text-green-700 font-medium text-sm">
                  "We're here to support your learning journey!"
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContactModal
