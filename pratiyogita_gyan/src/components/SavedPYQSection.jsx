import React, { useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'
import { 
  Star, 
  ArrowLeft, 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  BookOpen, 
  ZoomIn, 
  X, 
  Copy, 
  Check, 
  ExternalLink,
  Trash2
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { CircularProgress } from '@mui/material'

const STARRED_PYQ_LOCAL_STORAGE_KEY = 'pyqPracticeStarredQuestions'

const SavedPYQSection = ({ onClose }) => {
  const { currentUser, getStarredPyqQuestions, removeStarredPyqQuestion } = useAuth()
  
  const [savedQuestions, setSavedQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExam, setSelectedExam] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [expandedExplanations, setExpandedExplanations] = useState({})
  const [previewImage, setPreviewImage] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [removingId, setRemovingId] = useState(null)

  // Load saved questions from Firestore and LocalStorage
  const loadSavedQuestions = async () => {
    setLoading(true)
    let localList = []
    try {
      const stored = localStorage.getItem(STARRED_PYQ_LOCAL_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) localList = parsed
      }
    } catch (e) {
      console.warn('Failed to parse local starred questions:', e)
    }

    if (currentUser && getStarredPyqQuestions) {
      try {
        const cloudQuestions = await getStarredPyqQuestions()
        if (Array.isArray(cloudQuestions) && cloudQuestions.length > 0) {
          const map = new Map()
          cloudQuestions.forEach(q => {
            const id = q.id || q._id
            if (id) map.set(String(id), q)
          })
          localList.forEach(q => {
            const id = q.id || q._id
            if (id && !map.has(String(id))) map.set(String(id), q)
          })
          const merged = Array.from(map.values())
          setSavedQuestions(merged)
          try {
            localStorage.setItem(STARRED_PYQ_LOCAL_STORAGE_KEY, JSON.stringify(merged))
          } catch (err) {}
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn('Failed to fetch starred questions from cloud:', err)
      }
    }

    setSavedQuestions(localList)
    setLoading(false)
  }

  useEffect(() => {
    loadSavedQuestions()

    const handleExternalUpdate = () => {
      loadSavedQuestions()
    }
    window.addEventListener('starredPyqsUpdated', handleExternalUpdate)
    return () => window.removeEventListener('starredPyqsUpdated', handleExternalUpdate)
  }, [currentUser])

  // Handle Unstar / Remove
  const handleRemove = async (questionId) => {
    setRemovingId(questionId)
    try {
      if (currentUser && removeStarredPyqQuestion) {
        await removeStarredPyqQuestion(questionId)
      } else {
        const updated = savedQuestions.filter(q => String(q.id || q._id) !== String(questionId))
        setSavedQuestions(updated)
        try {
          localStorage.setItem(STARRED_PYQ_LOCAL_STORAGE_KEY, JSON.stringify(updated))
        } catch (err) {}
        window.dispatchEvent(new CustomEvent('starredPyqsUpdated', {
          detail: { questionId, isStarred: false }
        }))
      }
      setSavedQuestions(prev => prev.filter(q => String(q.id || q._id) !== String(questionId)))
    } catch (err) {
      console.error('Failed to remove saved question:', err)
    } finally {
      setRemovingId(null)
    }
  }

  // Toggle explanation
  const toggleExplanation = (id) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Copy Question to clipboard
  const handleCopyQuestion = (question, id) => {
    const text = question.question || question.text || ''
    const optionsText = Array.isArray(question.options)
      ? question.options.map((opt, i) => `${String.fromCharCode(65 + i)}) ${opt}`).join('\n')
      : ''
    const fullText = `${text}\n\n${optionsText}`
    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  // Extract available filter values
  const availableExams = useMemo(() => {
    const set = new Set()
    savedQuestions.forEach(q => {
      const exam = q.exam_name || q.metadata?.exam_name || q.metadata?.exam
      if (exam) set.add(exam)
    })
    return Array.from(set).sort()
  }, [savedQuestions])

  const availableSubjects = useMemo(() => {
    const set = new Set()
    savedQuestions.forEach(q => {
      const sub = q.subject || q.metadata?.subject
      if (sub) set.add(sub)
    })
    return Array.from(set).sort()
  }, [savedQuestions])

  // Filtered list
  const filteredQuestions = useMemo(() => {
    return savedQuestions.filter(q => {
      const qText = (q.question || q.text || '').toLowerCase()
      const exam = (q.exam_name || q.metadata?.exam_name || q.metadata?.exam || '').toLowerCase()
      const sub = (q.subject || q.metadata?.subject || '').toLowerCase()

      if (selectedExam !== 'all' && (q.exam_name || q.metadata?.exam_name || q.metadata?.exam) !== selectedExam) {
        return false
      }
      if (selectedSubject !== 'all' && (q.subject || q.metadata?.subject) !== selectedSubject) {
        return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesText = qText.includes(query)
        const matchesExam = exam.includes(query)
        const matchesSub = sub.includes(query)
        if (!matchesText && !matchesExam && !matchesSub) return false
      }
      return true
    })
  }, [savedQuestions, searchQuery, selectedExam, selectedSubject])

  const formatImageUrl = (url) => {
    if (!url || typeof url !== 'string') return ''
    const trimmed = url.trim()
    if (!trimmed) return ''
    const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (fileDMatch && fileDMatch[1]) return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`
    const idMatch = trimmed.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/)
    if (idMatch && idMatch[1]) return `https://lh3.googleusercontent.com/d/${idMatch[1]}`
    return trimmed
  }

  return (
    <div className="fixed inset-0 top-14 bg-[#0f172a] text-slate-100 flex flex-col overflow-hidden z-40">
      
      {/* Top Header */}
      <div className="bg-[#1e293b] border-b border-slate-700/80 px-3 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center justify-center shrink-0"
            title="Back to Home / Chat"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                Saved PYQs
              </h1>
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                {savedQuestions.length} Questions
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate hidden sm:block">
              Your bookmarked previous year questions for quick revision & practice
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadSavedQuestions}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Saved PYQs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#182234] border-b border-slate-700/60 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        
        {/* Search Input */}
        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search in saved questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Exam Filter */}
          <div className="flex items-center gap-1 bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Exam:</span>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="bg-transparent text-xs text-slate-200 border-none outline-none font-medium cursor-pointer"
            >
              <option value="all" className="bg-[#1e293b]">All Exams</option>
              {availableExams.map(ex => (
                <option key={ex} value={ex} className="bg-[#1e293b]">{ex}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1 bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent text-xs text-slate-200 border-none outline-none font-medium cursor-pointer"
            >
              <option value="all" className="bg-[#1e293b]">All Subjects</option>
              {availableSubjects.map(sub => (
                <option key={sub} value={sub} className="bg-[#1e293b]">{sub}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {(selectedExam !== 'all' || selectedSubject !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedExam('all')
                setSelectedSubject('all')
                setSearchQuery('')
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 min-h-0 bg-[#0b0f19]">
        <div className="max-w-4xl mx-auto space-y-4 pb-12">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <CircularProgress size={32} sx={{ color: '#f59e0b', mb: 2 }} />
              <p className="text-sm text-slate-400 font-medium">Loading your bookmarked questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#1e293b]/60 border border-slate-800 rounded-2xl max-w-lg mx-auto">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
                <Star className="w-7 h-7 fill-amber-400/30 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                {savedQuestions.length === 0 ? 'No Saved Questions Yet' : 'No Matching Questions Found'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {savedQuestions.length === 0
                  ? 'Whenever you find an important question in the Chat or PYQ Practice, click the star icon to save it here for quick revision anytime.'
                  : 'Try clearing your search query or adjusting the exam and subject filters above.'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const qId = q.id || q._id || `saved_${idx}`
              const exam = q.exam_name || q.metadata?.exam_name || q.metadata?.exam
              const subject = q.subject || q.metadata?.subject
              const year = q.year || q.metadata?.year || q.metadata?.exam_year
              const term = q.term || q.metadata?.term || q.metadata?.exam_term
              const hasExplanation = Boolean(q.explanation && q.explanation.trim())
              const isExplanationOpen = expandedExplanations[qId]
              const rawImg = q.img || q.image_url || q.metadata?.img || q.metadata?.image_url
              const imageUrl = formatImageUrl(rawImg)

              return (
                <div
                  key={qId}
                  className="bg-[#161f30] border border-slate-700/80 rounded-xl p-4 sm:p-5 shadow-sm hover:border-slate-600 transition-all"
                >
                  {/* Card Header: Metadata Tags + Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-700/60">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {exam && (
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded">
                          {exam}
                        </span>
                      )}
                      {subject && (
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
                          {subject}
                        </span>
                      )}
                      {(year || term) && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded">
                          {[year, term].filter(Boolean).join(' - ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Copy Question */}
                      <button
                        onClick={() => handleCopyQuestion(q, qId)}
                        title="Copy question text"
                        className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                      >
                        {copiedId === qId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Remove / Unstar */}
                      <button
                        onClick={() => handleRemove(qId)}
                        disabled={removingId === qId}
                        title="Remove from saved"
                        className="px-2 py-1 text-xs font-bold text-amber-400 hover:text-rose-400 bg-amber-500/10 hover:bg-rose-500/15 border border-amber-500/30 hover:border-rose-500/30 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="hidden sm:inline">Saved</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm sm:text-base font-semibold text-slate-100 mb-3.5 leading-relaxed">
                    {q.question || q.text}
                  </p>

                  {/* Optional Diagram / Image */}
                  {imageUrl && (
                    <div className="mb-3">
                      <div
                        onClick={() => setPreviewImage(imageUrl)}
                        className="relative inline-block cursor-pointer group rounded-lg overflow-hidden border border-slate-700 max-w-xs sm:max-w-sm"
                      >
                        <img
                          src={imageUrl}
                          alt="Question diagram"
                          className="max-h-48 w-auto object-contain bg-white/5"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold">
                          <ZoomIn className="w-4 h-4" />
                          <span>Click to Zoom</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Options List */}
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      {q.options.map((opt, optIdx) => {
                        const isCorrect = q.correct_answer === optIdx
                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-lg border text-xs sm:text-sm font-medium flex items-start gap-2 ${
                              isCorrect
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                isCorrect
                                  ? 'bg-emerald-500 text-slate-900 font-extrabold'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 leading-snug">{opt}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Explanation Toggle */}
                  {hasExplanation && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50">
                      <button
                        onClick={() => toggleExplanation(qId)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 py-1 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isExplanationOpen ? 'Hide Explanation' : 'View Detailed Explanation'}</span>
                        {isExplanationOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExplanationOpen && (
                        <div className="mt-2 p-3 rounded-lg bg-blue-950/30 border border-blue-500/20 text-xs sm:text-sm text-slate-300 leading-relaxed">
                          <p className="font-bold text-blue-300 mb-1">Official Solution / Explanation:</p>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh] p-2 bg-slate-900 border border-slate-700 rounded-xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-1.5 rounded-full bg-slate-800 text-white hover:bg-slate-700 border border-slate-600 shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewImage}
              alt="Full resolution preview"
              className="max-h-[85vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

SavedPYQSection.propTypes = {
  onClose: PropTypes.func.isRequired
}

export default SavedPYQSection
