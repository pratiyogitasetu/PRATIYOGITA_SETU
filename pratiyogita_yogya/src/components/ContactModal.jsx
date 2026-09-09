import React from 'react'
import { X, Mail, Phone, Clock, Globe, MessageSquare, Headphones, ArrowUpRight } from 'lucide-react'

const ContactModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

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
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col my-auto max-h-[95vh] md:max-h-none md:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between shrink-0 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Contact Us</h2>
              <p className="text-xs text-gray-400">We're here to support your learning journey</p>
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
            
            {/* Left Column: Contact Channels */}
            <div className="md:col-span-7 space-y-2.5">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Direct Contact Channels
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href="mailto:askpsetu@gmail.com"
                  className="flex items-center space-x-3 p-2.5 rounded-xl bg-gray-50 hover:bg-blue-50/70 border border-gray-200 hover:border-blue-300 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 group-hover:text-blue-600 transition-colors">Email Support</p>
                    <p className="text-xs text-gray-600 font-mono truncate">askpsetu@gmail.com</p>
                  </div>
                </a>

                <a
                  href="tel:+917500024959"
                  className="flex items-center space-x-3 p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50/70 border border-gray-200 hover:border-emerald-300 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">Phone Hotline</p>
                    <p className="text-xs text-gray-600 font-mono truncate">+91 7500024959</p>
                  </div>
                </a>

                <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-800">Support Hours</p>
                    <p className="text-xs text-gray-600">Mon-Fri: 9 AM - 6 PM IST</p>
                  </div>
                </div>

                <a
                  href="https://www.psetu.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50/70 border border-gray-200 hover:border-indigo-300 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Website</p>
                      <ArrowUpRight className="w-3 h-3 text-gray-400 group-hover:text-indigo-600" />
                    </div>
                    <p className="text-xs text-gray-600 font-mono truncate">www.psetu.com</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Right Column: Quick Help & Guidance */}
            <div className="md:col-span-5 flex flex-col justify-between">
              <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-3.5 rounded-xl border border-blue-200/80 h-full flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Quick Assistance</span>
                  </h3>
                  <ul className="space-y-1.5 text-xs text-blue-900 leading-snug">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>Instant doubt resolution via AI chatbot</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>Verified eligibility calculation help</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">✓</span>
                      <span>Email turnaround within 24 hours</span>
                    </li>
                  </ul>
                </div>

                <div className="p-2 rounded-lg bg-white/90 border border-blue-200 text-center">
                  <p className="text-[11px] font-semibold text-emerald-700">
                    "We are dedicated to your exam success!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContactModal
