import React, { useState, useEffect, useMemo } from 'react'
import { 
  ChevronDown, 
  Target, 
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useLayout } from '../contexts/LayoutContext'
import { useAuth } from '../contexts/AuthContext'
import { useDashboard } from '../contexts/DashboardContext'
import apiService from '../services/api'

const getStableQuestionId = (question, index = 0) => {
  if (question?.id !== undefined && question?.id !== null && String(question.id).trim() !== '') {
    return String(question.id)
  }

  const exam = question?.exam_name || question?.metadata?.exam_name || question?.metadata?.exam || 'unknown_exam'
  const subject = question?.subject || question?.metadata?.subject || 'unknown_subject'
  const year = question?.year || question?.metadata?.year || question?.metadata?.exam_year || 'unknown_year'
  const term = question?.term || question?.metadata?.term || question?.metadata?.exam_term || 'unknown_term'
  const questionText = (question?.question || '').trim().slice(0, 80)

  return [exam, subject, year, term, questionText || `fallback_${index}`]
    .map((part) => String(part).toLowerCase().replace(/\s+/g, '_'))
    .join('__')
}

const PYQPractice = () => {
  const { theme } = useTheme()
  const { contentOffsetLeft, isMobile } = useLayout()
  const {
    currentUser,
    getStarredPyqQuestions,
    saveStarredPyqQuestion,
    removeStarredPyqQuestion
  } = useAuth()
  const { trackInteraction } = useDashboard()

  const STARRED_PYQ_LOCAL_STORAGE_KEY = 'pyqPracticeStarredQuestions'

  // State for filters
  const [selectedExam, setSelectedExam] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [questionsPerPage, setQuestionsPerPage] = useState('10')
  
  // State for dropdowns
  const [showExamDropdown, setShowExamDropdown] = useState(false)
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  
  // State for data
  const [questions, setQuestions] = useState([])
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // State for available filter options
  const [availableExams, setAvailableExams] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [availableYears, setAvailableYears] = useState([])
  
  // State for user answers and explanations
  const [userAnswers, setUserAnswers] = useState({})
  // revealedAnswers now represents whether the question has been answered (checked)
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [expandedExplanations, setExpandedExplanations] = useState({})
  const [aiExplanations, setAiExplanations] = useState({})
  const [loadingExplanations, setLoadingExplanations] = useState({})
  const [explanationErrors, setExplanationErrors] = useState({})
  const [starredQuestionsMap, setStarredQuestionsMap] = useState({})
  const [showStarredOnly, setShowStarredOnly] = useState(false)

  const starredQuestions = useMemo(() => Object.values(starredQuestionsMap), [starredQuestionsMap])

  // Filter options (DB-backed only)
  const examOptions = useMemo(() => [
    { id: 'all', name: 'All Exams' },
    ...availableExams.map(exam => ({ id: exam.toLowerCase().replace(/\s+/g, '_'), name: exam }))
  ], [availableExams])

  const subjectOptions = useMemo(() => [
    { id: 'all', name: 'All Subjects' },
    ...availableSubjects.map(subject => ({ id: subject.toLowerCase().replace(/\s+/g, '_'), name: subject }))
  ], [availableSubjects])

  const yearOptions = useMemo(() => [
    { id: 'all', name: 'All Years' },
    ...availableYears
      .slice()
      .sort((a, b) => Number(b) - Number(a))
      .map(year => ({ id: year.toString(), name: year.toString() }))
  ], [availableYears])



  const questionsPerPageOptions = [
    { id: '5', name: '5 per page' },
    { id: '10', name: '10 per page' },
    { id: '20', name: '20 per page' },
    { id: '50', name: '50 per page' }
  ]

  const applyFiltersToDataset = (dataset) => {
    let filtered = [...dataset]

    if (selectedExam !== 'all') {
      filtered = filtered.filter((question) => {
        const examValue = question.exam_name || question.metadata?.exam_name || question.metadata?.exam || ''
        return examValue.toLowerCase().replace(/\s+/g, '_') === selectedExam.toLowerCase()
      })
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter((question) => {
        const subjectValue = question.subject || question.metadata?.subject || ''
        return subjectValue.toLowerCase().replace(/\s+/g, '_') === selectedSubject.toLowerCase()
      })
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter((question) => String(question.year) === String(selectedYear))
    }

    return filtered
  }

  // Load initial data and filters
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load filter options in background after UI becomes idle
  useEffect(() => {
    let cancelled = false
    let idleHandle = null
    let timeoutHandle = null

    const loadPyqFilterOptions = async () => {
      try {
        const response = await apiService.getPyqFilters()
        if (cancelled) return

        const exams = Array.isArray(response?.exams) ? response.exams.filter(Boolean) : []
        const subjects = Array.isArray(response?.subjects) ? response.subjects.filter(Boolean) : []
        const years = Array.isArray(response?.years) ? response.years.filter(Boolean) : []

        setAvailableExams(exams)
        setAvailableSubjects(subjects)
        setAvailableYears(years)
      } catch (err) {
        console.error('Failed to load PYQ filter options:', err)
      }
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(() => {
        loadPyqFilterOptions()
      }, { timeout: 1200 })
    } else {
      timeoutHandle = window.setTimeout(() => {
        loadPyqFilterOptions()
      }, 250)
    }

    return () => {
      cancelled = true
      if (idleHandle && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle)
      if (timeoutHandle) window.clearTimeout(timeoutHandle)
    }
  }, [])

  // Load persisted starred questions (user-scoped in Firestore, guest-scoped in localStorage)
  useEffect(() => {
    const loadStarredQuestions = async () => {
      try {
        if (currentUser) {
          const remoteStarred = await getStarredPyqQuestions()
          const map = {}
          remoteStarred.forEach((question) => {
            const id = getStableQuestionId(question)
            if (id) map[id] = { ...question, id }
          })
          setStarredQuestionsMap(map)
          return
        }

        const localRaw = localStorage.getItem(STARRED_PYQ_LOCAL_STORAGE_KEY)
        if (!localRaw) {
          setStarredQuestionsMap({})
          return
        }

        const parsed = JSON.parse(localRaw)
        if (!Array.isArray(parsed)) {
          setStarredQuestionsMap({})
          return
        }

        const map = {}
        parsed.forEach((question) => {
          const id = getStableQuestionId(question)
          if (id) map[id] = { ...question, id }
        })
        setStarredQuestionsMap(map)
      } catch (loadError) {
        console.error('Failed to load starred PYQs:', loadError)
        setStarredQuestionsMap({})
      }
    }

    loadStarredQuestions()
  }, [currentUser, getStarredPyqQuestions])

  // Persist guest starred questions to localStorage
  useEffect(() => {
    if (currentUser) return
    try {
      localStorage.setItem(STARRED_PYQ_LOCAL_STORAGE_KEY, JSON.stringify(starredQuestions))
    } catch (persistError) {
      console.error('Failed to persist starred PYQs locally:', persistError)
    }
  }, [currentUser, starredQuestions])

  // Load questions when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (showStarredOnly) {
      const filteredStarred = applyFiltersToDataset(starredQuestions)
      setQuestions(starredQuestions)
      setFilteredQuestions(filteredStarred)
      setCurrentPage(1)
      setIsLoading(false)
    } else if (selectedExam !== 'all' || selectedSubject !== 'all' || selectedYear !== 'all') {
      loadFilteredQuestions()
    } else {
      setFilteredQuestions([])
      setIsLoading(false)
    }
  }, [selectedExam, selectedSubject, selectedYear, showStarredOnly, starredQuestions])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside all dropdowns
      const isDropdownClick = event.target.closest('.dropdown-container')
      if (!isDropdownClick) {
        setShowExamDropdown(false)
        setShowSubjectDropdown(false)
        setShowYearDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])



  const loadInitialData = async () => {
    // Don't load anything initially - just set loading to false
    setIsLoading(false)
    setError('')
  }

  const loadFilteredQuestions = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiService.searchPyqQuestions({
        query: '',
        exam: selectedExam !== 'all' ? selectedExam : null,
        subject: selectedSubject !== 'all' ? selectedSubject : null,
        year: selectedYear !== 'all' ? selectedYear : null,
        limit: 20 // Reduced limit for faster loading
      })
      
      if (response && response.questions) {
        const normalizedQuestions = response.questions || []
        setQuestions(normalizedQuestions)
        setFilteredQuestions(applyFiltersToDataset(normalizedQuestions))
        // Reset user answers and revealed states when new questions are loaded
        setUserAnswers({})
        setRevealedAnswers({})
        setExpandedExplanations({})
        setAiExplanations({})
        setLoadingExplanations({})
        setExplanationErrors({})
        setCurrentPage(1)
      }
    } catch (error) {
      console.error('Failed to load questions:', error)
      setError('Failed to load questions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (questionId, optionIndex) => {
    // If already answered, don't allow changes
    if (revealedAnswers[questionId]) return;

    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }))

    // mark as answered (reveal feedback)
    setRevealedAnswers(prev => ({
      ...prev,
      [questionId]: true
    }))

    // Track the MCQ attempt (correct/wrong)
    const question = filteredQuestions.find((q, idx) => getStableQuestionId(q, idx) === questionId)
    if (question) {
      const questionSubject = question.subject || question.metadata?.subject || 'Others'
      const isCorrect = optionIndex === question.correct_answer

      if (!isCorrect) {
        void requestAiExplanation(questionId, question)
      }

      if (isCorrect) {
        trackInteraction('mcq_correct', {
          questionId: questionId,
          subject: questionSubject,
          exam: question.exam_name || question.metadata?.exam_name || 'Unknown',
          selectedOption: optionIndex,
          correctOption: question.correct_answer
        })
      } else {
        trackInteraction('mcq_wrong', {
          questionId: questionId,
          subject: questionSubject,
          exam: question.exam_name || question.metadata?.exam_name || 'Unknown',
          selectedOption: optionIndex,
          correctOption: question.correct_answer
        })
      }
    }
  }
  

  const getCorrectAnswerText = (question) => {
    if (!question) return ''

    const options = Array.isArray(question.options) ? question.options : []
    if (typeof question.correct_answer === 'number' && question.correct_answer >= 0 && question.correct_answer < options.length) {
      return String(options[question.correct_answer] || '').trim()
    }

    const optionMap = { A: 0, B: 1, C: 2, D: 3, a: 0, b: 1, c: 2, d: 3 }
    const idx = optionMap[question.correct_option]
    if (idx !== undefined && idx < options.length) {
      return String(options[idx] || '').trim()
    }

    return String(question.correct_answer_text || '').trim()
  }

  const requestAiExplanation = async (questionId, question) => {
    if (aiExplanations[questionId] || loadingExplanations[questionId]) return

    setLoadingExplanations(prev => ({ ...prev, [questionId]: true }))
    setExplanationErrors(prev => {
      const next = { ...prev }
      delete next[questionId]
      return next
    })

    try {
      const response = await apiService.generatePyqExplanation({
        question: question.question,
        options: question.options || [],
        correct_answer: question.correct_answer,
        correct_option: question.correct_option,
        correct_answer_text: getCorrectAnswerText(question),
        subject: question.subject || question.metadata?.subject || '',
        exam_name: question.exam_name || question.metadata?.exam_name || question.metadata?.exam || '',
        existing_explanation: question.explanation || ''
      })

      const explanation = (response?.explanation || '').trim() || (question.explanation || '').trim()
      if (explanation) {
        setAiExplanations(prev => ({ ...prev, [questionId]: explanation }))
      } else {
        setExplanationErrors(prev => ({ ...prev, [questionId]: 'Unable to generate explanation right now.' }))
      }
    } catch (error) {
      console.error('Failed to generate explanation:', error)
      const fallback = (question.explanation || '').trim()
      if (fallback) {
        setAiExplanations(prev => ({ ...prev, [questionId]: fallback }))
      } else {
        setExplanationErrors(prev => ({ ...prev, [questionId]: 'Unable to generate explanation right now.' }))
      }
    } finally {
      setLoadingExplanations(prev => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }
  }

  // Handle explanation toggle
  const toggleExplanation = (questionId, question) => {
    const willOpen = !expandedExplanations[questionId]
    setExpandedExplanations(prev => ({
      ...prev,
      [questionId]: willOpen
    }))

    if (willOpen) {
      void requestAiExplanation(questionId, question)
    }
  }

  const toggleStarredQuestion = async (question, questionIndex = 0) => {
    const questionId = getStableQuestionId(question, questionIndex)
    if (!questionId) return

    const isCurrentlyStarred = Boolean(starredQuestionsMap[questionId])
    const previousMap = starredQuestionsMap

    // Optimistic local update
    const nextMap = { ...previousMap }
    if (isCurrentlyStarred) {
      delete nextMap[questionId]
    } else {
      nextMap[questionId] = { ...question, id: questionId }
    }
    setStarredQuestionsMap(nextMap)

    if (!currentUser) return

    try {
      const ok = isCurrentlyStarred
        ? await removeStarredPyqQuestion(questionId)
        : await saveStarredPyqQuestion({ ...question, id: questionId }, questionId)

      if (!ok) {
        setStarredQuestionsMap(previousMap)
      }
    } catch (persistError) {
      console.error('Failed to sync starred PYQ:', persistError)
      setStarredQuestionsMap(previousMap)
    }
  }

  const DropdownButton = ({ label, options, selected, onSelect, show, onToggle, className = '' }) => (
    <div className={`relative dropdown-container ${className}`}>
      <button 
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="w-full flex items-center justify-between space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
        <span className="truncate text-left">{options.find(opt => opt.id === selected)?.name || label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${show ? 'rotate-180' : ''}`} />
      </button>
      {show && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(option.id)
                onToggle()
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                selected === option.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900'
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </div>
  )

  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * parseInt(questionsPerPage),
    currentPage * parseInt(questionsPerPage)
  )

  const totalPages = Math.ceil(filteredQuestions.length / parseInt(questionsPerPage))

  return (
    <div
      className="pyq-practice-page flex-1 mr-0 flex flex-col h-full overflow-hidden pl-2 pr-2 pb-2"
      style={{
        marginLeft: `${contentOffsetLeft}px`,
        width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`
      }}
    >
      {/* Main Container */}
      <div className="flex-1 bg-white border border-gray-400 rounded-lg shadow-sm flex flex-col overflow-hidden">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex-shrink-0">
          {/* Header */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-2xl font-bold text-gray-900 flex items-start md:items-center">
                  <Target className="w-7 h-7 md:w-8 md:h-8 mr-2 md:mr-3 mt-1 md:mt-0 flex-shrink-0" style={{ color: theme.colors.primary }} />
                  PYQ Practice
                </h1>
                <p className="text-gray-600 mt-1 text-sm md:text-base leading-relaxed">
                  Practice with previous year questions from various competitive exams
                </p>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 w-full md:w-auto">
                <button
                  onClick={() => setShowStarredOnly((prev) => !prev)}
                  className={`flex items-center space-x-2 px-2.5 md:px-3 py-2 border rounded-lg text-xs md:text-sm transition-colors whitespace-nowrap ${showStarredOnly ? 'bg-amber-100 border-amber-300 text-amber-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  title={showStarredOnly ? 'Show all PYQs' : 'Show only starred PYQs'}
                >
                  <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-current' : ''}`} />
                  <span>Starred ({starredQuestions.length})</span>
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openPyqsModal'))}
                  className="flex items-center space-x-2 px-2.5 md:px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  title="View Inserted PYQs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Inserted PYQs</span>
                </button>
                <div className="text-right min-w-[72px] md:min-w-0">
                  <div className="text-3xl md:text-2xl font-bold leading-none" style={{ color: theme.colors.primary }}>
                    {isLoading ? '...' : filteredQuestions.length}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Total Questions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50">
            <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-3 md:gap-4">
              <DropdownButton 
                label="Select Exam"
                options={examOptions}
                selected={selectedExam}
                onSelect={setSelectedExam}
                show={showExamDropdown}
                className="col-span-1"
                onToggle={() => {
                  setShowExamDropdown(!showExamDropdown)
                  setShowSubjectDropdown(false)
                  setShowYearDropdown(false)
                }}
              />
              <DropdownButton 
                label="Select Subject"
                options={subjectOptions}
                selected={selectedSubject}
                onSelect={setSelectedSubject}
                show={showSubjectDropdown}
                className="col-span-1"
                onToggle={() => {
                  setShowSubjectDropdown(!showSubjectDropdown)
                  setShowExamDropdown(false)
                  setShowYearDropdown(false)
                }}
              />
              <DropdownButton 
                label="Select Year"
                options={yearOptions}
                selected={selectedYear}
                onSelect={setSelectedYear}
                show={showYearDropdown}
                className="col-span-1"
                onToggle={() => {
                  setShowYearDropdown(!showYearDropdown)
                  setShowExamDropdown(false)
                  setShowSubjectDropdown(false)
                }}
              />
              <select
                value={questionsPerPage}
                onChange={(e) => setQuestionsPerPage(e.target.value)}
                className="w-full md:w-auto md:min-w-[140px] md:ml-auto flex-none px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent col-span-1"
              >
                {questionsPerPageOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-gray-600">Loading questions...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-600 mb-4">
                  <XCircle className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Questions</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadInitialData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex items-center justify-center h-[55vh] md:h-64">
              <div className="text-center max-w-none md:max-w-md">
                <div className="mb-4">
                  <Target className="w-14 h-14 md:w-16 md:h-16 mx-auto text-blue-500 opacity-50" />
                </div>
                <h3 className="text-2xl md:text-xl font-semibold text-gray-900 mb-3">
                  Ready to Start Practicing?
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed text-base md:text-base">
                  Select your <span className="font-medium text-blue-600">exam</span>, <span className="font-medium text-green-600">subject</span>, or <span className="font-medium text-purple-600">year</span> from the filters above to load previous year questions.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800 leading-relaxed">
                    💡 <strong>Tip:</strong> You can combine multiple filters (e.g., UPSC CSE + History + 2024) to practice specific topics!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Questions List */}
              <div className="space-y-4">
                {paginatedQuestions.map((question, index) => {
                  const questionId = getStableQuestionId(
                    question,
                    ((currentPage - 1) * parseInt(questionsPerPage)) + index
                  )
                  const userAnswer = userAnswers[questionId]
                  const isRevealed = revealedAnswers[questionId]
                  const isCorrect = userAnswer === question.correct_answer
                  
                  return (
                    <div 
                      key={questionId} 
                      className={`bg-white rounded-lg shadow-sm border ${isRevealed ? (isCorrect ? 'border-green-200' : 'border-red-200') : 'border-gray-200'}`}
                    >
                      {/* Question Header */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-base font-medium text-gray-900 flex-1 pr-2">
                            {question.question}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleStarredQuestion(
                                  question,
                                  ((currentPage - 1) * parseInt(questionsPerPage)) + index
                                )
                              }}
                              className={`p-1 rounded transition-colors ${starredQuestionsMap[questionId] ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'}`}
                              title={starredQuestionsMap[questionId] ? 'Remove from starred' : 'Add to starred'}
                            >
                              <Star className={`w-4 h-4 ${starredQuestionsMap[questionId] ? 'fill-current' : ''}`} />
                            </button>
                            {/* Answer Status Icon */}
                            {isRevealed && (
                              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {isCorrect ? '✓' : '✗'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Options */}
                        <div className="space-y-2 mt-3">
                          {!question.options || question.options.length === 0 ? (
                            <div className="text-sm text-red-600 p-3 bg-red-50 rounded">
                              ⚠️ No options available for this question. Debug: {JSON.stringify(question)}
                            </div>
                          ) : (
                            question.options.map((option, optionIndex) => {
                              const isUserSelected = userAnswer === optionIndex
                              const isCorrectAnswer = question.correct_answer === optionIndex
                              
                              let optionClass = "flex items-start p-3 border rounded-md cursor-pointer transition-colors"
                              
                              // Not revealed yet
                              if (!isRevealed) {
                                optionClass += isUserSelected 
                                  ? " border-blue-500 bg-blue-50" 
                                  : " border-gray-200 hover:bg-gray-50"
                              }
                              // Revealed and this is user's selection
                              else if (isUserSelected) {
                                optionClass += isCorrect
                                  ? " border-green-500 bg-green-50"
                                  : " border-red-500 bg-red-50"
                              }
                              // Revealed and this is the correct answer
                              else if (isCorrectAnswer) {
                                optionClass += " border-green-500 bg-green-50"
                              }
                              // Revealed, not selected, not correct
                              else {
                                optionClass += " border-gray-200"
                              }
                              
                              return (
                                <div 
                                  key={optionIndex}
                                  className={optionClass}
                                  onClick={(e) => {
                                    if (!isRevealed) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleAnswerSelect(questionId, optionIndex);
                                    }
                                  }}
                                >
                                  <div className="flex-shrink-0 mr-3 mt-0.5">
                                    <div className={`w-5 h-5 flex items-center justify-center rounded-full border ${
                                      isUserSelected 
                                        ? 'border-blue-500 bg-blue-500 text-white' 
                                        : 'border-gray-300'
                                    }`}>
                                      {isUserSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                    </div>
                                  </div>
                                  <div className="flex-1 text-sm text-gray-900">
                                    {option}
                                  </div>
                                  {isRevealed && isCorrectAnswer && (
                                    <div className="flex-shrink-0 ml-2">
                                      <div className="w-5 h-5 flex items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">
                                        ✓
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          )}
                        </div>
                        
                        {/* No reveal button: selecting an option immediately checks the answer */}
                      </div>
                      
                      {/* Question Footer with Metadata */}
                      <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
                        <div className="flex items-center justify-between">
                          {/* Left side - Metadata tags */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            {/* Exam Name */}
                            {(question.exam_name || question.metadata?.exam_name || question.metadata?.exam) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {question.exam_name || question.metadata?.exam_name || question.metadata?.exam}
                              </span>
                            )}
                            
                            {/* Year */}
                            {(question.year || question.metadata?.year || question.metadata?.exam_year) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {question.year || question.metadata?.year || question.metadata?.exam_year}
                              </span>
                            )}
                            
                            {/* Term */}
                            {(question.term || question.metadata?.term || question.metadata?.exam_term) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {question.term || question.metadata?.term || question.metadata?.exam_term}
                              </span>
                            )}
                            
                            {/* Subject */}
                            {(question.subject || question.metadata?.subject) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {question.subject || question.metadata?.subject}
                              </span>
                            )}
                          </div>
                          
                          {/* Right side - Show Explanation button */}
                          {isRevealed && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleExplanation(questionId, question);
                              }}
                              className="text-xs flex items-center space-x-1 transition-all duration-200 px-2 py-1 rounded flex-shrink-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                            >
                              <span>
                                {expandedExplanations[questionId] ? 'Hide Explanation' : 'Show Explanation'}
                              </span>
                              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandedExplanations[questionId] ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                        
                        {/* Explanation Dropdown */}
                        {expandedExplanations[questionId] && (
                          <div className="mt-3 pt-3 border-t border-gray-200 animate-in slide-in-from-top-1 duration-200">
                            <div className="text-xs text-gray-700">
                              <div className="flex items-center mb-2">
                                <p className="font-semibold text-blue-600">Explanation</p>
                              </div>
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border-l-4 border-blue-400 shadow-sm">
                                {loadingExplanations[questionId] ? (
                                  <div className="flex items-center gap-2 text-gray-700">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <p className="leading-relaxed">Generating AI explanation...</p>
                                  </div>
                                ) : explanationErrors[questionId] ? (
                                  <p className="leading-relaxed text-red-600">{explanationErrors[questionId]}</p>
                                ) : (
                                  <p className="leading-relaxed text-gray-800">{aiExplanations[questionId] || question.explanation || 'Explanation unavailable.'}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + Math.max(1, currentPage - 2)
                    if (page > totalPages) return null
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 border rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PYQPractice