import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Box, ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { 
  Search, 
  BookOpen, 
  Target, 
  Star, 
  HelpCircle, 
  ChevronDown, 
  RefreshCw, 
  Award,
  Filter,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { LayoutProvider } from './contexts/LayoutContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DashboardProvider, useDashboard } from './contexts/DashboardContext'
import apiService from './services/api'

// MUI Theme config aligned with premium cyan/teal branding
const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0E7490' },
    secondary: { main: '#0891B2' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' }
  },
  typography: {
    fontFamily: "\"Sora\", -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  shape: { borderRadius: 12 }
})

// Helper to generate a stable question ID if one is missing
const getStableQuestionId = (question, index = 0) => {
  if (question?.id) return String(question.id)
  const exam = question?.exam_name || 'exam'
  const subject = question?.subject || 'subject'
  const year = question?.year || 'year'
  const term = question?.term || 'term'
  const text = (question?.question || '').trim().slice(0, 80)
  return [exam, subject, year, term, text || `fallback_${index}`]
    .map(p => String(p).toLowerCase().replace(/\s+/g, '_'))
    .join('__')
}

function MainDashboard() {
  const { theme } = useTheme()
  const { trackInteraction } = useDashboard()
  const {
    getStarredPyqQuestions,
    saveStarredPyqQuestion,
    removeStarredPyqQuestion
  } = useAuth()

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [refinedQuery, setRefinedQuery] = useState('')
  const [selectedExam, setSelectedExam] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  
  // Dynamic filter dropdown options
  const [availableExams, setAvailableExams] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [availableYears, setAvailableYears] = useState([])
  
  // UI Dropdowns state
  const [showExamDropdown, setShowExamDropdown] = useState(false)
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)

  // Questions and loading states
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [dbTotalQuestions, setDbTotalQuestions] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  
  // Bookmarks & Starred questions
  const [starredQuestionsMap, setStarredQuestionsMap] = useState({})
  const [showStarredOnly, setShowStarredOnly] = useState(false)

  // MCQ response and explanations states
  const [userAnswers, setUserAnswers] = useState({})
  const [revealedAnswers, setRevealedAnswers] = useState({})
  const [expandedExplanations, setExpandedExplanations] = useState({})
  const [aiExplanations, setAiExplanations] = useState({})
  const [loadingExplanations, setLoadingExplanations] = useState({})
  const [explanationErrors, setExplanationErrors] = useState({})

  const dropdownRef = useRef(null)

  // Load database total question count and filters on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const countRes = await apiService.getTotalQuestions()
        setDbTotalQuestions(countRes.total_questions || 0)
        
        const filterRes = await apiService.getPyqFilters()
        setAvailableExams(filterRes?.exams || [])
        setAvailableSubjects(filterRes?.subjects || [])
        setAvailableYears(filterRes?.years || [])
      } catch (err) {
        console.error("Failed to load initial data:", err)
      }
    }
    initData()
  }, [])

  // Load Starred Questions
  const loadStarred = async () => {
    const list = await getStarredPyqQuestions()
    const map = {}
    list.forEach(q => {
      const qId = getStableQuestionId(q)
      map[qId] = q
    })
    setStarredQuestionsMap(map)
  }

  useEffect(() => {
    loadStarred()
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowExamDropdown(false)
        setShowSubjectDropdown(false)
        setShowYearDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Fetch / Search questions matching current filters
  const performSearch = async (isRandom = false) => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      let res;
      if (isRandom) {
        setRefinedQuery('')
        res = await apiService.getRandomPyqQuestions({
          count: 10,
          exam: selectedExam !== 'all' ? selectedExam : null,
          subject: selectedSubject !== 'all' ? selectedSubject : null,
          year: selectedYear !== 'all' ? selectedYear : null
        })
      } else {
        res = await apiService.searchPyqQuestions({
          query: searchQuery,
          exam: selectedExam !== 'all' ? selectedExam : null,
          subject: selectedSubject !== 'all' ? selectedSubject : null,
          year: selectedYear !== 'all' ? selectedYear : null,
          limit: 15
        })
      }

      if (res && res.questions) {
        setQuestions(res.questions)
        if (!isRandom) {
          setRefinedQuery(res.refined_query || '')
        }
        // Reset interactive states
        setUserAnswers({})
        setRevealedAnswers({})
        setExpandedExplanations({})
        setAiExplanations({})
        setLoadingExplanations({})
        setExplanationErrors({})
        
        // Track the search interaction
        if (searchQuery.trim()) {
          trackInteraction('search', {
            query: searchQuery,
            subject: selectedSubject !== 'all' ? selectedSubject : 'All'
          })
        }
      }
    } catch (err) {
      console.error(err)
      setErrorMessage('Failed to retrieve questions. Please check if backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  // Trigger search when query or filters change
  useEffect(() => {
    if (showStarredOnly) {
      // Just render the starred list
      setQuestions(Object.values(starredQuestionsMap))
    } else {
      performSearch(false)
    }
  }, [selectedExam, selectedSubject, selectedYear, showStarredOnly, starredQuestionsMap])

  // Handle choice selection
  const handleAnswerSelect = (questionId, optionIndex, question) => {
    if (revealedAnswers[questionId]) return // prevent change

    setUserAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
    setRevealedAnswers(prev => ({ ...prev, [questionId]: true }))

    const isCorrect = optionIndex === question.correct_answer
    const subject = question.subject || 'Others'

    // Track statistics
    trackInteraction('mcq_attempt', { correct: isCorrect, subject })

    // Auto-fetch explanation if wrong
    if (!isCorrect) {
      void fetchExplanation(questionId, question)
    }
  }

  // Handle Bookmarks/Star toggle
  const handleToggleStar = async (question, questionId) => {
    const isCurrentlyStarred = !!starredQuestionsMap[questionId]
    
    // Optimistic UI updates
    setStarredQuestionsMap(prev => {
      const next = { ...prev }
      if (isCurrentlyStarred) {
        delete next[questionId]
      } else {
        next[questionId] = question
      }
      return next
    })

    try {
      if (isCurrentlyStarred) {
        await removeStarredPyqQuestion(questionId)
      } else {
        await saveStarredPyqQuestion(question, questionId)
      }
    } catch (err) {
      console.error("Star sync failed:", err)
      // Revert mapping
      loadStarred()
    }
  }

  // Request AI Explanation from backend
  const fetchExplanation = async (questionId, question) => {
    if (aiExplanations[questionId] || loadingExplanations[questionId]) return

    setLoadingExplanations(prev => ({ ...prev, [questionId]: true }))
    try {
      const optLabels = ['A', 'B', 'C', 'D']
      const correctAnsText = question.options[question.correct_answer] || 'Not provided'
      
      const res = await apiService.generatePyqExplanation({
        question: question.question,
        options: question.options,
        correct_answer: question.correct_answer,
        correct_option: question.correct_option || optLabels[question.correct_answer] || '',
        correct_answer_text: correctAnsText,
        subject: question.subject,
        exam_name: question.exam_name,
        existing_explanation: question.explanation || ''
      })

      if (res?.explanation) {
        setAiExplanations(prev => ({ ...prev, [questionId]: res.explanation }))
      } else {
        setExplanationErrors(prev => ({ ...prev, [questionId]: 'Unable to fetch explanation at this time.' }))
      }
    } catch (err) {
      setExplanationErrors(prev => ({ ...prev, [questionId]: 'API Server error during explanation retrieval.' }))
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [questionId]: false }))
    }
  }

  const toggleExplanation = (questionId, question) => {
    const isExpanded = !expandedExplanations[questionId]
    setExpandedExplanations(prev => ({ ...prev, [questionId]: isExpanded }))

    if (isExpanded) {
      fetchExplanation(questionId, question)
    }
  }

  // Calculate statistics
  const sessionStats = useMemo(() => {
    let attempted = 0
    let correct = 0
    let wrong = 0

    questions.forEach((q, idx) => {
      const qId = getStableQuestionId(q, idx)
      const ans = userAnswers[qId]
      if (ans !== undefined) {
        attempted++
        if (ans === q.correct_answer) {
          correct++
        } else {
          wrong++
        }
      }
    })

    return {
      attempted,
      correct,
      wrong,
      accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0
    }
  }, [questions, userAnswers])

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-40">
      {/* Top Premium Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-100 animate-pulse-subtle">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-fredoka text-xl font-bold tracking-wide text-cyan-800">Sawal Jawab</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-cyan-600">Premium PYQ Practice</p>
          </div>
        </div>

        {/* Database Stats Badge */}
        <div className="flex items-center space-x-2 bg-cyan-50 border border-cyan-100 rounded-lg px-3 py-1.5">
          <Target className="w-4 h-4 text-cyan-600" />
          <span className="text-xs font-semibold text-cyan-800">{dbTotalQuestions.toLocaleString()} PYQs Indexed</span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Stats/Analytics Sidebar */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center">
              <Award className="w-4 h-4 text-cyan-600 mr-2" />
              Practice Session Analytics
            </h2>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Attempted</span>
                <span className="text-xl font-black text-slate-800 mt-1 block">{sessionStats.attempted}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Accuracy</span>
                <span className="text-xl font-black text-cyan-600 mt-1 block">{sessionStats.accuracy}%</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Correct answers</span>
                <span className="font-bold text-emerald-600">{sessionStats.correct}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Wrong answers</span>
                <span className="font-bold text-rose-600">{sessionStats.wrong}</span>
              </div>
            </div>

            {/* Starred filter button */}
            <button
              onClick={() => setShowStarredOnly(prev => !prev)}
              className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center space-x-2 text-sm font-semibold transition-all ${
                showStarredOnly 
                  ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-100' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Star className={`w-4 h-4 ${showStarredOnly ? 'fill-current' : ''}`} />
              <span>Bookmarks ({Object.keys(starredQuestionsMap).length})</span>
            </button>
          </div>

          <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Revision Tips</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Bookmark questions you struggle with. Use the Bookmarks tab to practice them later. AI explanations will dynamically detail the reasoning for correct and incorrect choices.
            </p>
          </div>
        </section>

        {/* Center/Right Main Search and Practice Panel */}
        <section className="lg:col-span-3 space-y-6">
          
          {/* Groq Query Optimization Banner */}
          {!isLoading && refinedQuery && searchQuery && refinedQuery.toLowerCase().trim() !== searchQuery.toLowerCase().trim() && (
            <div className="bg-gradient-to-r from-cyan-50 to-teal-50/20 border border-cyan-100 rounded-2xl p-4 mb-4 shadow-sm flex items-start space-x-3 animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="bg-cyan-600 text-white px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider mt-0.5 shadow-sm shadow-cyan-100 shrink-0">
                Groq AI
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold text-slate-500">
                  Search query corrected for spelling/typos:
                </p>
                <p className="text-sm font-bold text-cyan-800 italic">
                  "{refinedQuery}"
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Original input: "{searchQuery}"
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 flex items-center space-x-2">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-500">Retrieving interactive PYQs...</p>
            </div>
          )}

          {/* Questions Container */}
          {!isLoading && (
            <div className="space-y-6">
              {questions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <h3 className="font-fredoka text-lg font-bold text-slate-700">No questions found</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    {showStarredOnly 
                      ? 'You have not bookmarked any questions yet. Bookmark questions using the star icon on search results!'
                      : 'Try typing a different keyword or relaxing filters to load previous year questions.'}
                  </p>
                </div>
              ) : (
                questions.map((question, index) => {
                  const questionId = getStableQuestionId(question, index)
                  const userAnswer = userAnswers[questionId]
                  const isRevealed = revealedAnswers[questionId]
                  const isStarred = !!starredQuestionsMap[questionId]
                  
                  return (
                    <div 
                      key={questionId}
                      className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${
                        isRevealed 
                          ? (userAnswer === question.correct_answer ? 'border-emerald-200 bg-emerald-50/10' : 'border-rose-200 bg-rose-50/10')
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Card Header (Meta tags & bookmark) */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {question.exam_name && (
                            <span className="bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600">
                              {question.exam_name}
                            </span>
                          )}
                          {question.subject && (
                            <span className="bg-cyan-50 font-bold px-2 py-0.5 rounded text-cyan-700">
                              {question.subject}
                            </span>
                          )}
                          {question.year && (
                            <span className="bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600">
                              {question.year}
                            </span>
                          )}
                          {question.term && (
                            <span className="text-slate-400">
                              ({question.term})
                            </span>
                          )}
                        </div>

                        {/* Bookmark Button */}
                        <button
                          onClick={() => handleToggleStar(question, questionId)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isStarred 
                              ? 'text-amber-500 bg-amber-50' 
                              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50'
                          }`}
                          title={isStarred ? 'Remove from bookmarks' : 'Add to bookmarks'}
                        >
                          <Star className={`w-4.5 h-4.5 ${isStarred ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Question Text */}
                      <h4 className="text-sm font-semibold leading-relaxed text-slate-800 mb-4">
                        {question.question}
                      </h4>

                      {/* Options */}
                      <div className="space-y-2.5">
                        {question.options?.map((option, optIdx) => {
                          const isSelected = userAnswer === optIdx
                          const isCorrectChoice = question.correct_answer === optIdx
                          
                          let optionStyle = "w-full text-left p-3.5 text-xs rounded-xl border border-slate-200 font-medium transition-all flex items-start justify-between cursor-pointer "
                          
                          if (!isRevealed) {
                            optionStyle += isSelected
                              ? "bg-cyan-50 border-cyan-500 text-cyan-900"
                              : "bg-slate-50 hover:bg-slate-100/70 text-slate-700"
                          } else {
                            if (isCorrectChoice) {
                              optionStyle += "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                            } else if (isSelected) {
                              optionStyle += "bg-rose-50 border-rose-500 text-rose-950 font-bold"
                            } else {
                              optionStyle += "bg-slate-50/50 border-slate-200 text-slate-400 cursor-default"
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={isRevealed}
                              onClick={() => handleAnswerSelect(questionId, optIdx, question)}
                              className={optionStyle}
                            >
                              <span className="flex items-start">
                                <span className="w-5 font-black uppercase text-slate-400 mr-2">
                                  {['a', 'b', 'c', 'd'][optIdx]}.
                                </span>
                                <span>{option}</span>
                              </span>
                              
                              {/* Visual icons */}
                              {isRevealed && isCorrectChoice && (
                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 ml-2 mt-0.5" />
                              )}
                              {isRevealed && isSelected && !isCorrectChoice && (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2 mt-0.5" />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* AI Explanation Accordion */}
                      {isRevealed && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => toggleExplanation(questionId, question)}
                            className="flex items-center space-x-1 text-xs font-bold text-cyan-600 hover:text-cyan-800 transition-colors"
                          >
                            <HelpCircle className="w-4 h-4" />
                            <span>{expandedExplanations[questionId] ? 'Hide AI Explanation' : 'Explain Answer'}</span>
                          </button>

                          {expandedExplanations[questionId] && (
                            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-700">
                              {loadingExplanations[questionId] ? (
                                <div className="flex items-center space-x-2">
                                  <RefreshCw className="w-3.5 h-3.5 text-cyan-600 animate-spin" />
                                  <span className="font-semibold text-slate-500">Generating AI Tutor explanation...</span>
                                </div>
                              ) : explanationErrors[questionId] ? (
                                <span className="text-rose-600 font-medium">{explanationErrors[questionId]}</span>
                              ) : (
                                <div>
                                  <p className="font-bold text-cyan-800 mb-1">Tutor Explanation:</p>
                                  <p className="whitespace-pre-line">{aiExplanations[questionId] || question.explanation}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Search Bar (ChatGPT-style) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-8 pb-6 px-4">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={(e) => { e.preventDefault(); performSearch(); }} 
            className="relative w-full max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col p-3.5 space-y-3 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent transition-all"
          >
            {/* Top Row: Search Input */}
            <div className="flex items-center w-full px-1">
              <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search PYQs by sentence, topic, or keyword (AI optimized)..."
                className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-slate-800 placeholder-slate-400 p-0"
              />
            </div>

            {/* Bottom Row: Filters and Search Button */}
            <div ref={dropdownRef} className="flex flex-wrap items-center justify-between pt-2.5 border-t border-slate-100/70 text-xs">
              
              {/* Left Side: Pills for filters */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Exam Pill */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setShowExamDropdown(!showExamDropdown); setShowSubjectDropdown(false); setShowYearDropdown(false); }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
                      selectedExam !== 'all'
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>Exam: {selectedExam === 'all' ? 'All' : selectedExam}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {showExamDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5">
                      <button
                        type="button"
                        onClick={() => { setSelectedExam('all'); setShowExamDropdown(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-700"
                      >
                        All Exams
                      </button>
                      {availableExams.map(ex => (
                        <button
                          type="button"
                          key={ex}
                          onClick={() => { setSelectedExam(ex); setShowExamDropdown(false); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subject Pill */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setShowSubjectDropdown(!showSubjectDropdown); setShowExamDropdown(false); setShowYearDropdown(false); }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
                      selectedSubject !== 'all'
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Subject: {selectedSubject === 'all' ? 'All' : selectedSubject}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {showSubjectDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5">
                      <button
                        type="button"
                        onClick={() => { setSelectedSubject('all'); setShowSubjectDropdown(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-700"
                      >
                        All Subjects
                      </button>
                      {availableSubjects.map(sub => (
                        <button
                          type="button"
                          key={sub}
                          onClick={() => { setSelectedSubject(sub); setShowSubjectDropdown(false); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Year Pill */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => { setShowYearDropdown(!showYearDropdown); setShowExamDropdown(false); setShowSubjectDropdown(false); }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
                      selectedYear !== 'all'
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Year: {selectedYear === 'all' ? 'All' : selectedYear}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {showYearDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5">
                      <button
                        type="button"
                        onClick={() => { setSelectedYear('all'); setShowYearDropdown(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-semibold text-slate-700"
                      >
                        All Years
                      </button>
                      {availableYears.map(yr => (
                        <button
                          type="button"
                          key={yr}
                          onClick={() => { setSelectedYear(yr); setShowYearDropdown(false); }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600"
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Random Practice Pill */}
                <button
                  type="button"
                  onClick={() => performSearch(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 border border-cyan-150 rounded-full text-cyan-700 font-semibold text-[11px] transition-colors"
                  title="Fetch 10 Random Practice Questions"
                >
                  <RefreshCw className="w-3 h-3 text-cyan-600" />
                  <span>Random</span>
                </button>
              </div>

              {/* Right Side: Circular Search Button & AI Indicator */}
              <div className="flex items-center space-x-3 ml-auto">
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Groq RAG Active
                </span>
                <button 
                  type="submit"
                  className={`p-2 rounded-full transition-all flex items-center justify-center shrink-0 ${
                    searchQuery.trim().length > 0
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-100 hover:bg-cyan-700' 
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AuthProvider>
        <ThemeProvider>
          <LayoutProvider>
            <DashboardProvider>
              <MainDashboard />
            </DashboardProvider>
          </LayoutProvider>
        </ThemeProvider>
      </AuthProvider>
    </MuiThemeProvider>
  )
}

export default App
