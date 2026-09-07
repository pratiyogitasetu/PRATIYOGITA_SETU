import React from 'react'
import PropTypes from 'prop-types'
import {
  ArrowLeft,
  Sparkles,
  Award,
  BookOpen,
  Compass,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
  Target
} from 'lucide-react'
import { useLayout } from '../contexts/LayoutContext'

const YogyaDetailsSection = ({ onClose }) => {
  const { contentOffsetLeft, isMobile } = useLayout()

  const handleBack = () => {
    if (typeof onClose === 'function') {
      onClose()
    } else {
      window.dispatchEvent(new CustomEvent('switchToChat'))
    }
  }

  return (
    <div
      className={`yogya-details-page flex-1 flex flex-col h-full overflow-hidden ${
        isMobile ? 'p-0' : 'pr-1 pb-1'
      }`}
      style={{
        paddingTop: isMobile ? '56px' : '60px',
        marginLeft: isMobile ? 0 : `${contentOffsetLeft}px`,
        width: isMobile ? '100%' : `calc(100% - ${contentOffsetLeft + 4}px)`,
        transition:
          'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div
        className={`flex-1 bg-[#0f1117] text-white flex flex-col overflow-hidden ${
          isMobile ? 'border-0 rounded-none' : 'border border-white/10 rounded-2xl shadow-xl'
        }`}
      >
        {/* Top Header */}
        <div className="p-3 sm:p-4 border-b border-white/10 bg-[#161922] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition-colors border border-white/10 flex items-center justify-center shrink-0"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-wide">
                  Pratiyogita Yogya Details
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>Module Details</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">
                Comprehensive eligibility, syllabus breakdown, and aspirant readiness framework
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBack}
            className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-gray-200 border border-white/10 transition-colors"
          >
            Back to Chat
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Welcome / Under Development Banner */}
          <div className="relative overflow-hidden rounded-2xl p-5 sm:p-7 bg-gradient-to-r from-purple-950/60 via-[#1e1b4b]/50 to-[#18181b] border border-purple-500/30 shadow-lg">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-600/30 text-purple-200 border border-purple-400/30 mb-3">
                <Compass className="w-3.5 h-3.5 text-purple-300" />
                <span>Next-Gen Aspirant Roadmap</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-2">
                Pratiyogita Yogya is getting ready for you!
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Yahan par aapke exam ki complete eligibility criteria, detailed syllabus mapping, NCERT-to-exam weightage, aur aspirant preparedness benchmark details live hone wali hain.
              </p>
            </div>

            {/* Background Glow */}
            <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
          </div>

          {/* Quick Preview Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 */}
            <div className="p-4 rounded-xl bg-[#1a1d27] border border-white/10 hover:border-purple-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Exam Eligibility & Criteria</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Age limits, educational qualifications, attempt counts, and category-wise concessions.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-4 rounded-xl bg-[#1a1d27] border border-white/10 hover:border-purple-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Micro-Syllabus Mapping</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Topic-by-topic breakdowns mapped with NCERT textbook chapters and high-yield PYQ weightage.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-4 rounded-xl bg-[#1a1d27] border border-white/10 hover:border-purple-500/40 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Readiness Scorecard</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Personalized analytics measuring how prepared you are for prelims, mains, and cutoff thresholds.
              </p>
            </div>
          </div>

          {/* Placeholder Status Note */}
          <div className="p-4 rounded-xl bg-[#141721] border border-dashed border-white/20 text-center py-8">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-white">Awaiting Custom Specifications</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              Aap jo bhi information ya features yahan add karwana chahte hain, bas bataiye — hum turant yahan build kar denge!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

YogyaDetailsSection.propTypes = {
  onClose: PropTypes.func
}

export default YogyaDetailsSection
