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
  Check
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useLayout } from '../contexts/LayoutContext'
import { CircularProgress } from '@mui/material'

const STARRED_PYQ_LOCAL_STORAGE_KEY = 'pyqPracticeStarredQuestions'

const SavedPYQSection = ({ onClose }) => {
  const { currentUser, getStarredPyqQuestions, removeStarredPyqQuestion } = useAuth()
  const { contentOffsetLeft, isMobile } = useLayout()
  
  const [savedQuestions, setSavedQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExam, setSelectedExam] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [expandedExplanations, setExpandedExplanations] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)

  // Load Starred Questions from Firestore / LocalStorage
  const loadSavedQuestions = async () => {
    setLoading(true)
    try {
      if (currentUser && typeof getStarredPyqQuestions === 'function') {
        const firestoreList = await getStarredPyqQuestions()
        if (Array.isArray(firestoreList)) {
          setSavedQuestions(firestoreList)
          setLoading(false)
          return
        }
      }

      // Fallback: LocalStorage
      const localData = localStorage.getItem(STARRED_PYQ_LOCAL_STORAGE_KEY)
      if (localData) {
        try {
          const parsed = JSON.parse(localData)
          if (Array.isArray(parsed)) {
            setSavedQuestions(parsed)
          } else {
            setSavedQuestions([])
          }
        } catch {
          setSavedQuestions([])
        }
      } else {
        setSavedQuestions([])
      }
    } catch (err) {
      console.warn('Failed to load starred PYQs:', err)
      setSavedQuestions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSavedQuestions()
  }, [currentUser])

  // Extract unique exams & subjects for filtering
  const availableExams = useMemo(() => {
    const exams = new Set()
    savedQuestions.forEach((q) => {
      const exam = q.exam_name || q.metadata?.exam_name || q.metadata?.exam
      if (exam) exams.add(exam)
    })
    return Array.from(exams).sort()
  }, [savedQuestions])

  const availableSubjects = useMemo(() => {
    const subjects = new Set()
    savedQuestions.forEach((q) => {
      const subj = q.subject || q.metadata?.subject
      if (subj) subjects.add(subj)
    })
    return Array.from(subjects).sort()
  }, [savedQuestions])

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return savedQuestions.filter((q) => {
      const qText = (q.question || q.text || '').toLowerCase()
      const exam = (q.exam_name || q.metadata?.exam_name || q.metadata?.exam || '').toLowerCase()
      const subject = (q.subject || q.metadata?.subject || '').toLowerCase()

      // Search match
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase().trim()
        const matchesText = qText.includes(term)
        const matchesExam = exam.includes(term)
        const matchesSubject = subject.includes(term)
        if (!matchesText && !matchesExam && !matchesSubject) return false
      }

      // Exam filter
      if (selectedExam !== 'all') {
        if ((q.exam_name || q.metadata?.exam_name || q.metadata?.exam) !== selectedExam) {
          return false
        }
      }

      // Subject filter
      if (selectedSubject !== 'all') {
        if ((q.subject || q.metadata?.subject) !== selectedSubject) {
          return false
        }
      }

      return true
    })
  }, [savedQuestions, searchQuery, selectedExam, selectedSubject])

  // Remove question from saved
  const handleRemove = async (questionId) => {
    if (!questionId) return
    setRemovingId(questionId)
    try {
      if (currentUser && typeof removeStarredPyqQuestion === 'function') {
        await removeStarredPyqQuestion(questionId)
      } else {
        const updated = savedQuestions.filter((q) => (q.id || q._id) !== questionId)
        localStorage.setItem(STARRED_PYQ_LOCAL_STORAGE_KEY, JSON.stringify(updated))
      }
      setSavedQuestions((prev) => prev.filter((q) => (q.id || q._id) !== questionId))
      window.dispatchEvent(new CustomEvent('starredQuestionsUpdated'))
    } catch (err) {
      console.error('Error removing question from saved:', err)
    } finally {
      setRemovingId(null)
    }
  }

  // Toggle explanation expand
  const toggleExplanation = (qId) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }))
  }

  // Copy question text
  const handleCopyQuestion = (q, qId) => {
    const text = q.question || q.text || ''
    let fullText = text
    if (Array.isArray(q.options) && q.options.length > 0) {
      fullText += '\n\n' + q.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')
    }
    if (q.explanation) {
      fullText += `\n\nExplanation: ${q.explanation}`
    }
    navigator.clipboard.writeText(fullText)
    setCopiedId(qId)
    setTimeout(() => setCopiedId(null), 2000)
  }

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
    <div
      className={`saved-pyq-page flex-1 flex flex-col h-full overflow-hidden ${isMobile ? 'p-0' : 'pr-1 pb-1'}`}
      style={{
        paddingTop: isMobile ? '56px' : '60px',
        marginLeft: isMobile ? 0 : `${contentOffsetLeft}px`,
        width: isMobile ? '100%' : `calc(100% - ${contentOffsetLeft + 4}px)`,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className={`flex-1 bg-white flex flex-col overflow-hidden ${isMobile ? 'border-0 rounded-none' : 'border border-gray-200 rounded-lg shadow-sm'}`}>
        
        {/* Top Header - Matches Dashboard */}
        <div className="border-b border-gray-200 px-3 py-2.5 sm:px-6 sm:py-3.5 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center shrink-0 border border-gray-200"
                title="Back to Home / Chat"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight truncate">
                    Saved PYQs
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-full">
                    {savedQuestions.length} Questions
                  </span>
                </div>
                <p className="text-gray-600 mt-0.5 text-xs sm:text-sm truncate">
                  Your bookmarked previous year questions for quick revision & practice
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadSavedQuestions}
                className="px-2.5 sm:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-gray-200"
                title="Refresh Saved PYQs"
              >
                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 ${loading ? 'animate-spin text-amber-600' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={onClose}
                className="px-2.5 sm:px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors text-xs sm:text-sm font-medium flex items-center gap-1.5"
                title="Close Saved PYQs"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toolbar - Clean Dashboard Style */}
        <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          
          {/* Search Input */}
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in saved questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters (Exam & Subject) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Exam Filter */}
            {availableExams.length > 0 && (
              <div className="relative">
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Exams ({availableExams.length})</option>
                  {availableExams.map((exam) => (
                    <option key={exam} value={exam}>
                      {exam}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Subject Filter */}
            {availableSubjects.length > 0 && (
              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-700 text-xs rounded-lg px-2.5 py-1.5 pr-7 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Subjects ({availableSubjects.length})</option>
                  {availableSubjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Reset Filters */}
            {(selectedExam !== 'all' || selectedSubject !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedExam('all')
                  setSelectedSubject('all')
                  setSearchQuery('')
                }}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 min-h-0 bg-gray-50/50">
          <div className="max-w-4xl mx-auto space-y-3.5 pb-12">
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <CircularProgress size={32} sx={{ color: '#d97706', mb: 2 }} />
                <p className="text-sm text-gray-500 font-medium">Loading your bookmarked questions...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white border border-dashed border-gray-300 rounded-2xl max-w-lg mx-auto shadow-xs">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500">
                  <Star className="w-7 h-7 fill-amber-400/30 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {savedQuestions.length === 0 ? 'No Saved Questions Yet' : 'No Matching Questions Found'}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
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
                    className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all"
                  >
                    {/* Card Header: Metadata Tags + Actions */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-100">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 text-[11px] font-bold text-gray-700 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {exam && (
                          <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded">
                            {exam}
                          </span>
                        )}
                        {subject && (
                          <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                            {subject}
                          </span>
                        )}
                        {(year || term) && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 rounded">
                            {[year, term].filter(Boolean).join(' - ')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Copy Question */}
                        <button
                          onClick={() => handleCopyQuestion(q, qId)}
                          title="Copy question text"
                          className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors"
                        >
                          {copiedId === qId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Remove / Unstar */}
                        <button
                          onClick={() => handleRemove(qId)}
                          disabled={removingId === qId}
                          title="Remove from saved"
                          className="px-2 py-1 text-xs font-bold text-amber-700 hover:text-rose-700 bg-amber-50 hover:bg-rose-50 border border-amber-200 hover:border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                          <span className="hidden sm:inline">Saved</span>
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-sm sm:text-base font-semibold text-gray-900 mb-3.5 leading-relaxed">
                      {q.question || q.text}
                    </p>

                    {/* Optional Diagram / Image */}
                    {imageUrl && (
                      <div className="mb-3">
                        <div
                          onClick={() => setPreviewImage(imageUrl)}
                          className="relative inline-block cursor-pointer group rounded-lg overflow-hidden border border-gray-200 max-w-xs sm:max-w-sm"
                        >
                          <img
                            src={imageUrl}
                            alt="Question diagram"
                            className="max-h-48 w-auto object-contain bg-gray-50"
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
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                  : 'bg-gray-50/80 border-gray-200 text-gray-800'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white font-extrabold'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1 leading-snug">{opt}</span>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Explanation Toggle */}
                    {hasExplanation && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => toggleExplanation(qId)}
                          className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 py-1 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{isExplanationOpen ? 'Hide Explanation' : 'View Detailed Explanation'}</span>
                          {isExplanationOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExplanationOpen && (
                          <div className="mt-2 p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs sm:text-sm text-gray-800 leading-relaxed">
                            <p className="font-bold text-amber-800 mb-1">Official Solution / Explanation:</p>
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
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
          >
            <div className="relative max-w-3xl max-h-[90vh] p-2 bg-white rounded-xl shadow-2xl">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-3 -right-3 p-1.5 rounded-full bg-gray-900 text-white hover:bg-black border border-gray-700 shadow-md"
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
    </div>
  )
}

SavedPYQSection.propTypes = {
  onClose: PropTypes.func.isRequired
}

export default SavedPYQSection
