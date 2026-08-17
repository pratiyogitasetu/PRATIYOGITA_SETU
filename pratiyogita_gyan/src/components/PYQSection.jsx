import React, { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronDown, FileText, ChevronLeft, ChevronRight, Star, RefreshCw, MessageSquare, Target, Sparkles } from 'lucide-react'
import { Box, Paper, Stack, Typography, IconButton, Chip, Divider, Button, Menu, MenuItem } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useLayout } from '../contexts/LayoutContext'
import { useTheme } from '../contexts/ThemeContext'
import { useDashboard } from '../contexts/DashboardContext'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
import { ChevronFirst } from './icons/ChevronFirst'
import EmbeddedSearchBar from './EmbeddedSearchBar'
import { ThinkingOrb } from 'thinking-orbs'

const PYQ_IMPORTANT_STORAGE_KEY = 'pyqImportantQuestionIds'
const STARRED_PYQ_LOCAL_STORAGE_KEY = 'pyqPracticeStarredQuestions'

const getStableQuestionId = (question, index = 0) => {
  if (question?.id !== undefined && question?.id !== null && String(question.id).trim() !== '') {
    return String(question.id)
  }

  const exam = question?.exam_name || question?.metadata?.exam_name || question?.metadata?.exam || 'unknown_exam'
  const subject = question?.subject || question?.metadata?.subject || 'unknown_subject'
  const year = question?.year || question?.metadata?.year || question?.metadata?.exam_year || 'unknown_year'
  const term = question?.term || question?.metadata?.term || question?.metadata?.exam_term || 'unknown_term'
  const questionText = (question?.question || question?.text || '').trim().slice(0, 80)

  return [exam, subject, year, term, questionText || `fallback_${index}`]
    .map((part) => String(part).toLowerCase().replace(/\s+/g, '_'))
    .join('__')
}

const buildStarredQuestionPayload = (question, questionId) => ({
  id: questionId,
  question: question?.question || question?.text || '',
  options: Array.isArray(question?.options) ? question.options : [],
  correct_answer: question?.correct_answer,
  explanation: question?.explanation || '',
  exam_name: question?.exam_name || question?.metadata?.exam_name || question?.metadata?.exam || '',
  subject: question?.subject || question?.metadata?.subject || '',
  year: question?.year || question?.metadata?.year || question?.metadata?.exam_year || '',
  term: question?.term || question?.metadata?.term || question?.metadata?.exam_term || '',
  metadata: question?.metadata || {},
  source: question?.source || '',
  score: question?.score ?? null
})

const PYQSection = () => {
  const { pyqVisible, togglePyq, isMobile, contentOffsetLeft, mobileActiveTab } = useLayout()
  const { trackInteraction } = useDashboard()
  const { theme } = useTheme()
  const isDarkMode = theme?.mode === 'dark'
  const {
    currentUser,
    getStarredPyqQuestions,
    saveStarredPyqQuestion,
    removeStarredPyqQuestion
  } = useAuth()
  const [searchResults, setSearchResults] = useState([])
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [selectedExam, setSelectedExam] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [showImportantOnly, setShowImportantOnly] = useState(false) // Filter for important questions only
  const [examAnchorEl, setExamAnchorEl] = useState(null)
  const [subjectAnchorEl, setSubjectAnchorEl] = useState(null)
  const [dateAnchorEl, setDateAnchorEl] = useState(null)
  const [topicAnchorEl, setTopicAnchorEl] = useState(null)
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState({}) // Track user selections for each question
  const [expandedExplanations, setExpandedExplanations] = useState({}) // Track expanded explanations
  const [expandedQueries, setExpandedQueries] = useState({})
  const [aiExplanations, setAiExplanations] = useState({})
  const [loadingExplanations, setLoadingExplanations] = useState({})
  const [explanationErrors, setExplanationErrors] = useState({})
  const [importantQuestions, setImportantQuestions] = useState(new Set()) // Track important/bookmarked questions
  const [isChatLoading, setIsChatLoading] = useState(false)
  const pyqScrollContainerRef = useRef(null)

  const isExamMenuOpen = Boolean(examAnchorEl)
  const isSubjectMenuOpen = Boolean(subjectAnchorEl)
  const isDateMenuOpen = Boolean(dateAnchorEl)
  const isTopicMenuOpen = Boolean(topicAnchorEl)

  useEffect(() => {
    if (pyqScrollContainerRef.current) {
      pyqScrollContainerRef.current.scrollTop = pyqScrollContainerRef.current.scrollHeight
    }
  }, [searchResults])

  useEffect(() => {
    const loadImportantQuestions = async () => {
      try {
        if (currentUser) {
          const remoteStarred = await getStarredPyqQuestions()
          const ids = remoteStarred
            .map((question, idx) => getStableQuestionId(question, idx))
            .filter(Boolean)
          setImportantQuestions(new Set(ids))
          return
        }

        const localStarredRaw = localStorage.getItem(STARRED_PYQ_LOCAL_STORAGE_KEY)
        if (localStarredRaw) {
          const parsedLocalStarred = JSON.parse(localStarredRaw)
          if (Array.isArray(parsedLocalStarred)) {
            const ids = parsedLocalStarred
              .map((question, idx) => getStableQuestionId(question, idx))
              .filter(Boolean)
            setImportantQuestions(new Set(ids))
            return
          }
        }

        const saved = localStorage.getItem(PYQ_IMPORTANT_STORAGE_KEY)
        if (!saved) {
          setImportantQuestions(new Set())
          return
        }

        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setImportantQuestions(new Set(parsed.map((id) => String(id))))
        } else {
          setImportantQuestions(new Set())
        }
      } catch (error) {
        console.warn('Failed to load important PYQs from storage:', error)
        setImportantQuestions(new Set())
      }
    }

    loadImportantQuestions()
  }, [currentUser, getStarredPyqQuestions])

  useEffect(() => {
    try {
      localStorage.setItem(PYQ_IMPORTANT_STORAGE_KEY, JSON.stringify(Array.from(importantQuestions)))
    } catch (error) {
      console.warn('Failed to persist important PYQs:', error)
    }
  }, [importantQuestions])

  // Load available exams and subjects from current search results only
  const [availableExams, setAvailableExams] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [availableDates, setAvailableDates] = useState([])
  const [availableTopics, setAvailableTopics] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(false)

  // Dynamic exam, subject, date, and topic lists from search results only
  const exams = [
    { id: 'all', name: 'All Exams' },
    ...availableExams.map(exam => ({ id: exam.toLowerCase(), name: exam }))
  ]

  const subjects = [
    { id: 'all', name: 'All Subjects' },
    ...availableSubjects.map(subject => ({ id: subject.toLowerCase(), name: subject }))
  ]

  const dates = [
    { id: 'all', name: 'All Dates' },
    ...availableDates.map(date => ({ id: String(date).toLowerCase(), name: String(date) }))
  ]

  const topics = [
    { id: 'all', name: 'All Topics' },
    ...availableTopics.map(topic => ({ id: topic.toLowerCase(), name: topic }))
  ]

  // Extract unique exams, subjects, dates, and topics from search results
  const extractFiltersFromResults = (questions) => {
    const uniqueExams = new Set()
    const uniqueSubjects = new Set()
    const uniqueDates = new Set()
    const uniqueTopics = new Set()

    const isPlaceholderExam = (name) => {
      const value = String(name || '').toLowerCase()
      return value.includes('coming soon') || value === 'tbd' || value.includes('to be announced')
    }

    questions.forEach(question => {
      // Extract exam name
      const examName = question.metadata?.exam_name || question.metadata?.exam || question.exam_name || ''
      if (examName && examName.trim() && !isPlaceholderExam(examName)) {
        uniqueExams.add(examName.trim())
      }

      // Extract subject
      const subject = question.metadata?.subject || question.subject || ''
      if (subject && subject.trim()) {
        uniqueSubjects.add(subject.trim())
      }

      // Extract year/date
      const year = question.metadata?.year || question.year || ''
      if (year && String(year).trim()) {
        uniqueDates.add(String(year).trim())
      }

      // Extract topic
      const topic = question.metadata?.topic || question.metadata?.subject || question.subject || ''
      if (topic && topic.trim()) {
        uniqueTopics.add(topic.trim())
      }
    })

    return {
      exams: Array.from(uniqueExams).sort(),
      subjects: Array.from(uniqueSubjects).sort(),
      dates: Array.from(uniqueDates).sort(),
      topics: Array.from(uniqueTopics).sort()
    }
  }

  // Load filter options and total questions count
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get total questions for display only
        const response = await apiService.getTotalQuestions()
        setTotalQuestions(response.total_questions || 0)

        console.log(`✅ Total questions in database: ${response.total_questions || 0}`)

      } catch (error) {
        console.error('Failed to load initial data:', error)
      }
    }

    loadInitialData()
  }, [])

  // Listen for MCQ results from chat searches
  useEffect(() => {
    const handleMcqResults = (event) => {
      const { mcqs, query } = event.detail
      
      setSearchResults(prev => {
        const existingIds = new Set(prev.map(q => q.id || q.question))
        const newMcqs = (mcqs || []).map(q => ({
          ...q,
          originatingQuery: query
        })).filter(q => !existingIds.has(q.id || q.question))
        const updated = [...prev, ...newMcqs]
        console.log(`🔍 Search: "${query}" - Found ${newMcqs.length} new questions, total: ${updated.length}`)
        return updated
      })
      setLastSearchQuery(query)
      setExpandedQueries(prev => ({
        ...Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: false }), {}),
        [query]: true
      }))
    }

    const handleNewChat = () => {
      // Reset all PYQ state when a new chat is started
      setSearchResults([])
      setLastSearchQuery('')
      setFilteredQuestions([])
      setUserAnswers({})
      setExpandedExplanations({})
      setExpandedQueries({})
      setAiExplanations({})
      setLoadingExplanations({})
      setExplanationErrors({})
      setSelectedExam('all')
      setSelectedSubject('all')
      setSelectedDate('all')
      setSelectedTopic('all')
      setShowImportantOnly(false)
      // Clear available filters since no search has been made
      setAvailableExams([])
      setAvailableSubjects([])
      setAvailableDates([])
      setAvailableTopics([])
      setLoadingFilters(false)
      console.log('🔄 PYQ Section reset for new chat')
    }

    const handleLoadChat = () => {
      // Reset PYQ state when loading an existing chat (similar to new chat)
      setSearchResults([])
      setLastSearchQuery('')
      setFilteredQuestions([])
      setUserAnswers({})
      setExpandedExplanations({})
      setExpandedQueries({})
      setAiExplanations({})
      setLoadingExplanations({})
      setExplanationErrors({})
      setSelectedExam('all')
      setSelectedSubject('all')
      setShowImportantOnly(false)
      // Clear available filters since no search has been made
      setAvailableExams([])
      setAvailableSubjects([])
      setLoadingFilters(false)
      console.log('🔄 PYQ Section reset for loaded chat')
    }

    const handleLoadGuestChat = () => {
      // Reset PYQ state when loading a guest chat
      setSearchResults([])
      setLastSearchQuery('')
      setFilteredQuestions([])
      setUserAnswers({})
      setExpandedExplanations({})
      setExpandedQueries({})
      setAiExplanations({})
      setLoadingExplanations({})
      setExplanationErrors({})
      setSelectedExam('all')
      setSelectedSubject('all')
      setShowImportantOnly(false)
      // Clear available filters since no search has been made
      setAvailableExams([])
      setAvailableSubjects([])
      setLoadingFilters(false)
      console.log('🔄 PYQ Section reset for loaded guest chat')
    }

    window.addEventListener('newMcqResults', handleMcqResults)
    window.addEventListener('newChat', handleNewChat)
    window.addEventListener('loadChat', handleLoadChat)
    window.addEventListener('loadGuestChat', handleLoadGuestChat)
    return () => {
      window.removeEventListener('newMcqResults', handleMcqResults)
      window.removeEventListener('newChat', handleNewChat)
      window.removeEventListener('loadChat', handleLoadChat)
      window.removeEventListener('loadGuestChat', handleLoadGuestChat)
    }
  }, [])

  // Listen for query submission from chat input or quick prompts
  useEffect(() => {
    const handleSubmitQuery = (event) => {
      const query = event.detail?.query
      if (query && typeof query === 'string' && query.trim()) {
        const cleanQuery = query.trim()
        setLastSearchQuery(cleanQuery)
        setIsChatLoading(true)
        setExpandedQueries(prev => {
          const collapsed = {}
          Object.keys(prev).forEach(k => { collapsed[k] = false })
          return collapsed
        })
      }
    }
    window.addEventListener('submitChatQuery', handleSubmitQuery)
    return () => {
      window.removeEventListener('submitChatQuery', handleSubmitQuery)
    }
  }, [])

  useEffect(() => {
    const handleLoadingChange = (event) => {
      const loading = Boolean(event.detail?.isLoading)
      setIsChatLoading(loading)
      if (loading) {
        setExpandedQueries(prev => {
          const collapsed = {}
          Object.keys(prev).forEach(k => { collapsed[k] = false })
          return collapsed
        })
      }
    }
    window.addEventListener('chatLoadingState', handleLoadingChange)
    return () => {
      window.removeEventListener('chatLoadingState', handleLoadingChange)
    }
  }, [])

  const handleSendMessage = (query, options) => {
    if (!pyqVisible) {
      togglePyq()
    }
    setLastSearchQuery(query)
    setExpandedQueries(prev => {
      const collapsed = {}
      Object.keys(prev).forEach(k => { collapsed[k] = false })
      return collapsed
    })
    setIsChatLoading(true)
    const event = new CustomEvent('submitChatQuery', {
      detail: { query, options }
    })
    window.dispatchEvent(event)
  }

  const groupedQuestions = useMemo(() => {
    const groups = {}
    searchResults.forEach((q) => {
      const queryKey = q.originatingQuery || 'Initial Search'
      if (!groups[queryKey]) {
        groups[queryKey] = []
      }
      groups[queryKey].push(q)
    })
    return groups
  }, [searchResults])

  const applyFiltersToQuestions = (questionsList) => {
    let filtered = [...questionsList]

    if (selectedExam !== 'all') {
      filtered = filtered.filter(q => {
        const examName = q.metadata?.exam_name || q.metadata?.exam || q.exam_name || ''
        return examName.toLowerCase() === selectedExam.toLowerCase()
      })
    }

    if (selectedSubject !== 'all') {
      filtered = filtered.filter(q => {
        const subject = q.metadata?.subject || q.subject || ''
        return subject.toLowerCase() === selectedSubject.toLowerCase()
      })
    }

    if (selectedDate !== 'all') {
      filtered = filtered.filter(q => {
        const year = q.metadata?.year || q.year || ''
        return String(year).toLowerCase() === selectedDate.toLowerCase()
      })
    }

    if (selectedTopic !== 'all') {
      filtered = filtered.filter(q => {
        const topic = q.metadata?.topic || q.metadata?.subject || q.subject || ''
        return topic.toLowerCase() === selectedTopic.toLowerCase()
      })
    }

    if (showImportantOnly) {
      filtered = filtered.filter(q => {
        const questionId = getStableQuestionId(q, searchResults.indexOf(q))
        return importantQuestions.has(questionId)
      })
    }

    return filtered
  }

  const openPanelsQuestions = useMemo(() => {
    const openQuestions = []
    Object.entries(groupedQuestions).forEach(([queryName, questions]) => {
      const isExpanded = expandedQueries[queryName] !== undefined
        ? expandedQueries[queryName]
        : (queryName === lastSearchQuery)
      if (isExpanded) {
        openQuestions.push(...questions)
      }
    })
    return openQuestions
  }, [groupedQuestions, expandedQueries, lastSearchQuery])

  // Extract filter dropdown options from open panels only (or all results if none are open)
  useEffect(() => {
    const targetQuestions = openPanelsQuestions.length > 0 ? openPanelsQuestions : searchResults
    if (targetQuestions.length > 0) {
      setLoadingFilters(true)
      const { exams, subjects, dates, topics } = extractFiltersFromResults(targetQuestions)
      setAvailableExams(exams)
      setAvailableSubjects(subjects)
      setAvailableDates(dates)
      setAvailableTopics(topics)
      setLoadingFilters(false)
    } else {
      setAvailableExams([])
      setAvailableSubjects([])
      setAvailableDates([])
      setAvailableTopics([])
      setLoadingFilters(false)
    }
  }, [openPanelsQuestions, searchResults])

  // Apply filters to open panels (or all results if none are open)
  useEffect(() => {
    const targetQuestions = openPanelsQuestions.length > 0 ? openPanelsQuestions : searchResults
    const filtered = applyFiltersToQuestions(targetQuestions)
    setFilteredQuestions(filtered)
  }, [openPanelsQuestions, searchResults, selectedExam, selectedSubject, selectedDate, selectedTopic, showImportantOnly, importantQuestions])

  // Function to refresh questions
  const refreshQuestions = () => {
    // This will trigger the useEffect to reload questions
    setSelectedExam(selectedExam)
  }

  // Handle option selection
  const handleOptionSelect = (questionId, optionIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }))

    // Find the question to check if answer is correct
    const question = searchResults.find(q => q.id === questionId)
    if (question) {
      const isCorrect = optionIndex === question.correct_answer
      const questionSubject = question.subject || question.metadata?.subject || 'Others'

      if (!isCorrect) {
        void requestAiExplanation(questionId, question)
      }

      // Track MCQ attempt with correct/wrong tracking
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

      console.log(`✅ MCQ ${isCorrect ? 'correct' : 'wrong'} answer tracked for subject: ${questionSubject}`)
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
        question: question.question || question.text || '',
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

  // Handle important question toggle
  const toggleImportantQuestion = async (question, questionIndex = 0) => {
    const questionId = getStableQuestionId(question, questionIndex)
    if (!questionId) return

    const isCurrentlyImportant = importantQuestions.has(questionId)

    // Optimistic UI update
    setImportantQuestions(prev => {
      const newSet = new Set(prev)
      if (isCurrentlyImportant) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })

    const payload = buildStarredQuestionPayload(question, questionId)

    try {
      if (currentUser) {
        const ok = isCurrentlyImportant
          ? await removeStarredPyqQuestion(questionId)
          : await saveStarredPyqQuestion(payload, questionId)

        if (!ok) {
          setImportantQuestions(prev => {
            const reverted = new Set(prev)
            if (isCurrentlyImportant) {
              reverted.add(questionId)
            } else {
              reverted.delete(questionId)
            }
            return reverted
          })
        }

        return
      }

      const localRaw = localStorage.getItem(STARRED_PYQ_LOCAL_STORAGE_KEY)
      const parsed = localRaw ? JSON.parse(localRaw) : []
      const existing = Array.isArray(parsed) ? parsed : []

      const map = {}
      existing.forEach((item, idx) => {
        const id = getStableQuestionId(item, idx)
        if (id) map[id] = { ...item, id }
      })

      if (isCurrentlyImportant) {
        delete map[questionId]
      } else {
        map[questionId] = payload
      }

      localStorage.setItem(STARRED_PYQ_LOCAL_STORAGE_KEY, JSON.stringify(Object.values(map)))
    } catch (error) {
      console.warn('Failed to sync important question:', error)
      // Revert optimistic update on failure
      setImportantQuestions(prev => {
        const reverted = new Set(prev)
        if (isCurrentlyImportant) {
          reverted.add(questionId)
        } else {
          reverted.delete(questionId)
        }
        return reverted
      })
    }
  }

  const handleSelectAllOrClearAll = () => {
    if (importantQuestions.size > 0) {
      // Clear all marked important questions globally
      setImportantQuestions(new Set())
      return
    }

    // Select all currently visible questions
    if (filteredQuestions.length === 0) return
    setImportantQuestions(prev => {
      const newSet = new Set(prev)
      filteredQuestions.forEach((question, idx) => {
        newSet.add(getStableQuestionId(question, idx))
      })
      return newSet
    })
  }

  // Determine which questions to display based on search results or filtered API results
  const currentQuestions = searchResults.length > 0 ? filteredQuestions : filteredQuestions


  const progressStats = useMemo(() => {
    if (currentQuestions.length === 0 || Object.keys(userAnswers).length === 0) {
      return { correct: 0, wrong: 0, answered: 0 }
    }

    let correct = 0
    let wrong = 0

    currentQuestions.forEach((q, idx) => {
      const questionId = q.id || `fallback_${idx}`
      const userAnswer = userAnswers[questionId]
      const hasValidCorrectAnswer =
        q.correct_answer !== undefined &&
        Number.isInteger(q.correct_answer) &&
        q.correct_answer >= 0 &&
        q.correct_answer < (q.options?.length || 0)

      if (!hasValidCorrectAnswer || userAnswer === undefined) return

      if (userAnswer === q.correct_answer) {
        correct++
      } else {
        wrong++
      }
    })

    return {
      correct,
      wrong,
      answered: Object.keys(userAnswers).length
    }
  }, [currentQuestions, userAnswers])

  const leftMarginPx = contentOffsetLeft
  const rightMarginPx = pyqVisible ? 424 : 44

  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: 104, md: 64 },
        bottom: { xs: 0, md: 4 },
        left: { xs: 0, md: leftMarginPx },
        right: { xs: 0, md: rightMarginPx },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: { xs: 0.5, md: 0.5 },
        transform: isMobile ? (mobileActiveTab === 'pyq' ? 'translateX(0%)' : 'translateX(-100%)') : 'none',
        opacity: isMobile ? (mobileActiveTab === 'pyq' ? 1 : 0) : 1,
        pointerEvents: isMobile ? (mobileActiveTab === 'pyq' ? 'auto' : 'none') : 'auto',
        visibility: isMobile ? (mobileActiveTab === 'pyq' ? 'visible' : 'hidden') : 'visible',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, left 0.3s cubic-bezier(0.4, 0, 0.2, 1), right 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <Paper
        elevation={1}
        className="flex-grow rounded-lg shadow-sm flex flex-col overflow-hidden transition-colors duration-300"
        sx={{
          backgroundColor: '#ffffff',
          border: '1px solid #808080',
          position: 'relative'
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Toggle Button and Header - Hidden on mobile until results are loaded */}
          {(!isMobile || searchResults.length > 0) && (
          <Box 
            sx={{ 
              p: '6px 10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: 1, 
              borderBottom: '1px solid #f1f5f9',
              minWidth: 0
            }}
          >
            {/* Left: Title + Filter Buttons All in One Horizontal Line */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.8, 
                overflowX: 'auto', 
                whiteSpace: 'nowrap', 
                flex: 1, 
                minWidth: 0,
                py: 0.25,
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' }
              }}
            >
              {/* Title & Count Badge */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexShrink: 0, mr: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#111827', fontSize: '0.82rem', letterSpacing: '0.02em' }}>
                  PYQs
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.72rem', fontWeight: 600 }}>
                  ({filteredQuestions.length})
                </Typography>
              </Box>

              {/* Filters in Single Horizontal Row: All Exams -> All Subjects -> Select Date -> Select Topic -> Starred Filter -> Select All */}
              {!loadingFilters && searchResults.length > 0 && (
                <>
                  {/* 1. Exam Filter */}
                  <Button
                    size="small"
                    variant="contained"
                    onClick={(event) => !loadingFilters && setExamAnchorEl(event.currentTarget)}
                    disabled={loadingFilters}
                    endIcon={<ChevronDown className="w-3 h-3" />}
                    sx={{
                      backgroundColor: '#E4572E',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      px: 1.1,
                      py: 0.25,
                      minHeight: 22,
                      height: 22,
                      borderRadius: 999,
                      textTransform: 'none',
                      flexShrink: 0,
                      boxShadow: 'none',
                      '&:hover': { backgroundColor: '#c43e1c', boxShadow: 'none' }
                    }}
                  >
                    {loadingFilters ? 'Loading...' : (exams.find(e => e.id === selectedExam)?.name || 'All Exams')}
                  </Button>
                  <Menu
                    anchorEl={examAnchorEl}
                    open={isExamMenuOpen}
                    onClose={() => setExamAnchorEl(null)}
                    MenuListProps={{ dense: true }}
                    PaperProps={{ sx: { border: '1px solid #e0e0e0', borderRadius: 2 } }}
                  >
                    {exams.map((exam) => (
                      <MenuItem
                        key={exam.id}
                        selected={selectedExam === exam.id}
                        onClick={() => {
                          setSelectedExam(exam.id)
                          setExamAnchorEl(null)
                        }}
                        sx={{ fontSize: '0.7rem' }}
                      >
                        {exam.name}
                      </MenuItem>
                    ))}
                  </Menu>

                  {/* 2. Subject Filter */}
                  <Button
                    size="small"
                    variant="contained"
                    onClick={(event) => !loadingFilters && setSubjectAnchorEl(event.currentTarget)}
                    disabled={loadingFilters}
                    endIcon={<ChevronDown className="w-3 h-3" />}
                    sx={{
                      backgroundColor: '#E4572E',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      px: 1.1,
                      py: 0.25,
                      minHeight: 22,
                      height: 22,
                      borderRadius: 999,
                      textTransform: 'none',
                      flexShrink: 0,
                      boxShadow: 'none',
                      '&:hover': { backgroundColor: '#c43e1c', boxShadow: 'none' }
                    }}
                  >
                    {loadingFilters ? 'Loading...' : (subjects.find(s => s.id === selectedSubject)?.name || 'All Subjects')}
                  </Button>
                  <Menu
                    anchorEl={subjectAnchorEl}
                    open={isSubjectMenuOpen}
                    onClose={() => setSubjectAnchorEl(null)}
                    MenuListProps={{ dense: true }}
                    PaperProps={{ sx: { border: '1px solid #e0e0e0', borderRadius: 2 } }}
                  >
                    {subjects.map((subject) => (
                      <MenuItem
                        key={subject.id}
                        selected={selectedSubject === subject.id}
                        onClick={() => {
                          setSelectedSubject(subject.id)
                          setSubjectAnchorEl(null)
                        }}
                        sx={{ fontSize: '0.7rem' }}
                      >
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Menu>

                  {/* 3. Select Date Filter */}
                  {availableDates.length > 0 && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(event) => setDateAnchorEl(event.currentTarget)}
                        endIcon={<ChevronDown className="w-3 h-3" />}
                        sx={{
                          backgroundColor: '#E4572E',
                          color: '#FFFFFF',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          px: 1.1,
                          py: 0.25,
                          minHeight: 22,
                          height: 22,
                          borderRadius: 999,
                          textTransform: 'none',
                          flexShrink: 0,
                          boxShadow: 'none',
                          '&:hover': { backgroundColor: '#c43e1c', boxShadow: 'none' }
                        }}
                      >
                        {dates.find(d => d.id === selectedDate)?.name || 'Select Date'}
                      </Button>
                      <Menu
                        anchorEl={dateAnchorEl}
                        open={isDateMenuOpen}
                        onClose={() => setDateAnchorEl(null)}
                        MenuListProps={{ dense: true }}
                        PaperProps={{ sx: { border: '1px solid #e0e0e0', borderRadius: 2 } }}
                      >
                        {dates.map((date) => (
                          <MenuItem
                            key={date.id}
                            selected={selectedDate === date.id}
                            onClick={() => {
                              setSelectedDate(date.id)
                              setDateAnchorEl(null)
                            }}
                            sx={{ fontSize: '0.7rem' }}
                          >
                            {date.name}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  )}

                  {/* 4. Select Topic Filter */}
                  {availableTopics.length > 0 && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(event) => setTopicAnchorEl(event.currentTarget)}
                        endIcon={<ChevronDown className="w-3 h-3" />}
                        sx={{
                          backgroundColor: '#E4572E',
                          color: '#FFFFFF',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          px: 1.1,
                          py: 0.25,
                          minHeight: 22,
                          height: 22,
                          borderRadius: 999,
                          textTransform: 'none',
                          flexShrink: 0,
                          boxShadow: 'none',
                          '&:hover': { backgroundColor: '#c43e1c', boxShadow: 'none' }
                        }}
                      >
                        {topics.find(t => t.id === selectedTopic)?.name || 'Select Topic'}
                      </Button>
                      <Menu
                        anchorEl={topicAnchorEl}
                        open={isTopicMenuOpen}
                        onClose={() => setTopicAnchorEl(null)}
                        MenuListProps={{ dense: true }}
                        PaperProps={{ sx: { border: '1px solid #e0e0e0', borderRadius: 2 } }}
                      >
                        {topics.map((topic) => (
                          <MenuItem
                            key={topic.id}
                            selected={selectedTopic === topic.id}
                            onClick={() => {
                              setSelectedTopic(topic.id)
                              setTopicAnchorEl(null)
                            }}
                            sx={{ fontSize: '0.7rem' }}
                          >
                            {topic.name}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  )}

                  {/* 5. Starred / Important Filter Chip */}
                  {importantQuestions.size > 0 && (
                    <Chip
                      size="small"
                      clickable
                      onClick={() => setShowImportantOnly(prev => !prev)}
                      icon={<Star className={`w-3 h-3 ${showImportantOnly ? 'fill-current' : ''}`} />}
                      label={`${importantQuestions.size} Starred`}
                      title={showImportantOnly ? 'Show all questions' : 'Show only starred questions'}
                      sx={{
                        backgroundColor: showImportantOnly ? '#f59e0b' : 'rgba(245, 158, 11, 0.12)',
                        color: showImportantOnly ? '#ffffff' : '#d97706',
                        border: '1px solid',
                        borderColor: showImportantOnly ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        height: 22,
                        flexShrink: 0,
                        borderRadius: 999,
                        '&:hover': {
                          backgroundColor: showImportantOnly ? '#d97706' : 'rgba(245, 158, 11, 0.22)'
                        }
                      }}
                    />
                  )}

                  {/* 6. Select All / Clear All Button */}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleSelectAllOrClearAll}
                    startIcon={<Star className="w-3 h-3" />}
                    title={importantQuestions.size > 0 ? 'Clear all marked important questions' : 'Mark all currently visible questions as important'}
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      px: 1.1,
                      py: 0.25,
                      minHeight: 22,
                      height: 22,
                      borderRadius: 999,
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      borderColor: '#d1d5db',
                      textTransform: 'none',
                      flexShrink: 0,
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#e5e7eb',
                        borderColor: '#9ca3af'
                      }
                    }}
                  >
                    {importantQuestions.size > 0 ? 'Clear All' : 'Select All'}
                  </Button>
                </>
              )}
            </Box>

            {/* Toggle chat panel button on right side of PYQ header */}
            {!isMobile && !pyqVisible && (
              <IconButton onClick={togglePyq} size="small" title="Show Chat Panel" sx={{ color: '#4b5563', flexShrink: 0 }}>
                <MessageSquare className="w-4 h-4" />
              </IconButton>
            )}
          </Box>
          )}

            {/* Content Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', m: 0.5, mt: 0, minHeight: 0, backgroundColor: '#ffffff', borderRadius: 2 }}>
              {/* Sticky Header - Only rendered if progress stats exist */}
              {filteredQuestions.length > 0 && Object.keys(userAnswers).length > 0 && (
                <Box
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #d0d0d0',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    p: 0.75
                  }}
                >
                  {/* Progress */}
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#000000' }}>
                      Progress:
                    </Typography>
                    <Chip
                      size="small"
                      label={`${progressStats.correct} Correct`}
                      sx={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#16a34a', fontSize: '0.7rem' }}
                    />
                    <Chip
                      size="small"
                      label={`${progressStats.wrong} Wrong`}
                      sx={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#dc2626', fontSize: '0.7rem' }}
                    />
                    <Chip
                      size="small"
                      label={`${progressStats.answered}/${currentQuestions.length} Answered`}
                      sx={{ backgroundColor: 'rgba(0,0,0,0.06)', color: '#000000', fontSize: '0.7rem' }}
                    />
                  </Stack>
                </Box>
              )}

              {/* Scrollable Content */}
              <Box ref={pyqScrollContainerRef} className="pyq-content" sx={{ flex: 1, overflowY: 'auto', p: 1, minHeight: 0, pb: { xs: 24, sm: 20, md: 16 } }}>
                {/* Questions */}
                <Stack spacing={1}>
                  {isChatLoading && currentQuestions.length === 0 ? (
                    <Box 
                      className="pyq-fade-slide"
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        py: 8,
                        px: 2,
                        textAlign: 'center'
                      }}
                    >
                      <ThinkingOrb state="connecting" size={64} speed={1.80} />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 3, 
                          fontWeight: 700, 
                          color: '#111827',
                          fontSize: '0.88rem',
                          letterSpacing: '0.01em'
                        }}
                      >
                        {lastSearchQuery ? `Finding PYQs for "${lastSearchQuery}"...` : 'Finding relevant previous year questions...'}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          mt: 0.5, 
                          color: '#6b7280', 
                          fontSize: '0.75rem'
                        }}
                      >
                        Searching questions across UPSC, CDS, SSC & State PSC
                      </Typography>
                    </Box>
                  ) : !lastSearchQuery && currentQuestions.length === 0 ? (
                    <Box sx={{ py: 1.5, px: { xs: 1, sm: 2 }, maxWidth: 760, mx: 'auto', width: '100%' }}>
                      {/* Compact Top Header Card */}
                      <Paper
                        elevation={0}
                        className="pyq-fade-slide"
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 2.5,
                          border: '1px solid #e5e7eb',
                          background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
                          mb: 1.25,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1.25,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <img 
                            src="/pg.png" 
                            alt="PG Logo" 
                            className="w-10 h-10 object-contain mg-logo-shake"
                            style={{ filter: 'drop-shadow(0 2px 8px rgba(228,87,46,0.25))' }}
                          />
                          <Box>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                color: '#E4572E',
                                fontSize: '0.68rem',
                                textTransform: 'uppercase',
                                display: 'block',
                                lineHeight: 1
                              }}
                            >
                              Exam Intelligence Archive
                            </Typography>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 800,
                                color: '#111827',
                                fontSize: { xs: '0.92rem', sm: '1.02rem' },
                                lineHeight: 1.25,
                                mt: 0.2
                              }}
                            >
                              Previous Year Questions
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem', display: 'block' }}>
                              Real exam MCQs indexed with instant solutions
                            </Typography>
                          </Box>
                        </Box>

                        {/* Compact Countdown Display */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: 'rgba(228,87,46,0.06)', p: '5px 8px', borderRadius: 2, border: '1px solid rgba(228,87,46,0.15)' }}>
                          {(totalQuestions > 0 ? String(totalQuestions).split('') : ['1', '1', '7']).map((digit, idx) => (
                            <Box
                              key={idx}
                              className="pyq-countdown-digit"
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 24,
                                height: 30,
                                borderRadius: 1.2,
                                background: 'linear-gradient(135deg, #E4572E 0%, #c43e1c 100%)',
                                color: '#ffffff',
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                fontFamily: '"Fredoka", "Sora", sans-serif',
                                boxShadow: '0 2px 6px rgba(228, 87, 46, 0.3)'
                              }}
                            >
                              {digit}
                            </Box>
                          ))}
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#E4572E', fontSize: '0.72rem', ml: 0.5 }}>
                            PYQs Loaded
                          </Typography>
                        </Box>
                      </Paper>

                      {/* Compact 4-Badge Category Row */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 1, mb: 1.25 }}>
                        {[
                          { title: 'UPSC CSE', icon: '🏛️', bg: 'rgba(59,130,246,0.06)', border: '#bfdbfe' },
                          { title: 'CDS / NDA', icon: '⚔️', bg: 'rgba(16,185,129,0.06)', border: '#bbf7d0' },
                          { title: 'SSC CGL', icon: '📊', bg: 'rgba(139,92,246,0.06)', border: '#ddd6fe' },
                          { title: 'State PCS', icon: '🎓', bg: 'rgba(245,158,11,0.06)', border: '#fde68a' },
                        ].map((cat, idx) => (
                          <Box
                            key={idx}
                            className="pyq-badge-enter"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                            sx={{
                              py: 0.7,
                              px: 1,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: cat.border,
                              backgroundColor: cat.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 0.75,
                              userSelect: 'none',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                              }
                            }}
                          >
                            <span style={{ fontSize: '0.95rem' }}>{cat.icon}</span>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                              {cat.title}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* Quick Practice Prompts (Compact 2-Column Grid) */}
                      <Box sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#4b5563', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.72rem' }}>
                          <Sparkles size={13} color="#fbbf24" />
                          <span>Quick Practice (Click to Search)</span>
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.75 }}>
                          {[
                            'Fundamental Rights (Articles 12-35)',
                            'Indian Monetary Policy & Inflation',
                            'Indian Monsoon & Drainage System',
                            '1857 Revolt & Freedom Struggle',
                            'ISRO Space Missions & Satellites',
                            'National Parks & Ramsar Sites'
                          ].map((topic, idx) => (
                            <Button
                              key={idx}
                              onClick={() => handleSendMessage(topic, { exam: 'all', subject: 'all' })}
                              variant="outlined"
                              size="small"
                              className="pyq-fade-slide"
                              style={{ animationDelay: `${0.1 + idx * 0.03}s` }}
                              sx={{
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                borderRadius: 1.8,
                                py: 0.5,
                                px: 1,
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                textTransform: 'none',
                                color: '#374151',
                                borderColor: '#e5e7eb',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                  borderColor: '#E4572E',
                                  backgroundColor: 'rgba(228,87,46,0.06)',
                                  color: '#E4572E',
                                  transform: 'translateY(-1px)'
                                }
                              }}
                            >
                              <span style={{ color: '#E4572E', marginRight: 6 }}>•</span>
                              {topic}
                            </Button>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  ) : lastSearchQuery && currentQuestions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }} className="pyq-fade-slide">
                      <FileText className="w-12 h-12 mx-auto mb-2" style={{ color: '#000000', opacity: 0.4 }} />
                      <Typography variant="caption" sx={{ display: 'block', color: '#000000', opacity: 0.7 }}>
                        No related questions found for "{lastSearchQuery}"
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#000000', opacity: 0.5 }}>
                        Try different keywords or remove filters
                      </Typography>
                    </Box>
                  ) : currentQuestions.length > 0 ? (
                    <Stack spacing={1.5}>
                      {isChatLoading && (
                        <Box 
                          className="pyq-fade-slide"
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5, 
                            p: 1.5, 
                            borderRadius: 2, 
                            border: '1px dashed #E4572E',
                            backgroundColor: 'rgba(228, 87, 46, 0.05)',
                            mb: 1
                          }}
                        >
                          <ThinkingOrb state="connecting" size={20} speed={1.80} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#E4572E', fontSize: '0.8rem' }}>
                            Searching new questions...
                          </Typography>
                        </Box>
                      )}
                      {Object.entries(groupedQuestions).map(([queryName, questions]) => {
                        const isExpanded = expandedQueries[queryName] !== undefined
                          ? expandedQueries[queryName]
                          : (queryName === lastSearchQuery)

                        return (
                          <Box
                            key={queryName}
                            className="pyq-card-enter"
                            sx={{
                              border: '1px solid',
                              borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
                              borderRadius: 2,
                              overflow: 'hidden',
                              backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                              mb: 1
                            }}
                          >
                            {/* Accordion Header */}
                            <Box
                              onClick={() => {
                                setExpandedQueries(prev => ({
                                  ...prev,
                                  [queryName]: !isExpanded
                                }))
                              }}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 1.5,
                                py: 1,
                                cursor: 'pointer',
                                backgroundColor: isDarkMode ? '#111827' : '#eff6ff',
                                borderBottom: isExpanded ? '1px solid' : 'none',
                                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
                                '&:hover': {
                                  backgroundColor: isDarkMode ? '#1e293b' : '#dbeafe'
                                },
                                transition: 'background-color 0.2s'
                              }}
                            >
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                  color: isDarkMode ? '#9ca3af' : '#1e40af',
                                  maxWidth: '75%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                Search: "{queryName}"
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  size="small"
                                  label={`${isExpanded ? applyFiltersToQuestions(questions).length : questions.length} question${(isExpanded ? applyFiltersToQuestions(questions).length : questions.length) !== 1 ? 's' : ''}`}
                                  sx={{
                                    fontSize: '0.62rem',
                                    height: 18,
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#dbeafe',
                                    color: isDarkMode ? '#d1d5db' : '#1e40af'
                                  }}
                                />
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                  style={{ color: isDarkMode ? '#9ca3af' : '#2563eb' }}
                                />
                              </Stack>
                            </Box>

                            {/* Accordion Content */}
                            {isExpanded && (
                              <Stack spacing={1.5} sx={{ p: 1, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }}>
                                {applyFiltersToQuestions(questions).length === 0 ? (
                                  <Typography variant="caption" sx={{ display: 'block', py: 1.5, px: 1, color: isDarkMode ? '#9ca3af' : '#6b7280', textAlign: 'center', fontStyle: 'italic' }}>
                                    No questions match the selected filters.
                                  </Typography>
                                ) : (
                                  applyFiltersToQuestions(questions).map((question, qIdx) => {
                                    const questionIndex = currentQuestions.indexOf(question)
                                    const questionId = getStableQuestionId(question, questionIndex)
                                    const userAnswer = userAnswers[questionId]
                                    const isCorrect = userAnswer === question.correct_answer
                                    const hasAnswered = userAnswer !== undefined

                                    return (
                                      <Paper
                                        key={questionId}
                                        elevation={0}
                                        className="pyq-card-enter"
                                        style={{ animationDelay: `${Math.min(qIdx * 0.04, 0.25)}s` }}
                                        sx={{
                                          borderRadius: 2,
                                          border: '1px solid',
                                          borderColor: hasAnswered ? (isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : (isDarkMode ? '#374151' : '#e5e7eb'),
                                          backgroundColor: isDarkMode ? '#111827' : '#ffffff',
                                          overflow: 'hidden',
                                          transition: 'all 0.2s ease'
                                        }}
                                      >
                                        {/* Question Header */}
                                        <Box sx={{ p: 1, pb: 0.75, borderBottom: '1px solid #f1f5f9' }}>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                                            <Typography variant="body2" sx={{ fontSize: '0.7rem', fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827', flex: 1 }}>
                                              {question.question}
                                            </Typography>
                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                              <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  toggleImportantQuestion(question, questionIndex);
                                                }}
                                                title={importantQuestions.has(questionId) ? 'Remove from important' : 'Mark as important'}
                                                sx={{
                                                  color: importantQuestions.has(questionId) ? '#f59e0b' : '#9ca3af',
                                                  backgroundColor: importantQuestions.has(questionId) ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                                                  '&:hover': { backgroundColor: 'rgba(245, 158, 11, 0.12)' }
                                                }}
                                              >
                                                <Star className={`w-4 h-4 ${importantQuestions.has(questionId) ? 'fill-current' : ''}`} />
                                              </IconButton>
                                              {hasAnswered && (
                                                <Chip
                                                  size="small"
                                                  label={isCorrect ? '✓' : '✗'}
                                                  sx={{
                                                    fontSize: '0.7rem',
                                                    height: 20,
                                                    backgroundColor: isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: isCorrect ? '#16a34a' : '#dc2626'
                                                  }}
                                                />
                                              )}
                                            </Stack>
                                          </Box>

                                          {/* Options */}
                                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                            {question.options?.map((option, optionIndex) => {
                                              const isUserSelected = userAnswer === optionIndex
                                              const isCorrectAnswer = question.correct_answer === optionIndex

                                              let borderColor = isDarkMode ? '#374151' : '#e5e7eb'
                                              let backgroundColor = 'transparent'
                                              if (!hasAnswered) {
                                                backgroundColor = 'transparent'
                                              } else if (isUserSelected) {
                                                borderColor = isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'
                                                backgroundColor = isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'
                                              } else if (isCorrectAnswer) {
                                                borderColor = 'rgba(34,197,94,0.4)'
                                                backgroundColor = 'rgba(34,197,94,0.08)'
                                              }

                                              return (
                                                <Box
                                                  key={optionIndex}
                                                  onClick={(e) => {
                                                    if (!hasAnswered) {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      handleOptionSelect(questionId, optionIndex);
                                                    }
                                                  }}
                                                  sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    p: 0.6,
                                                    borderRadius: 1,
                                                    border: '1px solid',
                                                    borderColor,
                                                    backgroundColor,
                                                    cursor: hasAnswered ? 'default' : 'pointer',
                                                    transition: 'background-color 0.2s, border-color 0.2s',
                                                    '&:hover': !hasAnswered ? { backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb' } : undefined
                                                  }}
                                                >
                                                  <Box sx={{ mr: 1, mt: 0.25 }}>
                                                    <Box
                                                      sx={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: '50%',
                                                        border: '1px solid',
                                                        borderColor: isUserSelected ? '#3b82f6' : '#d1d5db',
                                                        backgroundColor: isUserSelected ? '#3b82f6' : 'transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                      }}
                                                    >
                                                      {isUserSelected && <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ffffff' }} />}
                                                    </Box>
                                                  </Box>
                                                  <Typography variant="body2" sx={{ fontSize: '0.7rem', color: isDarkMode ? '#d1d5db' : '#111827', flex: 1 }}>
                                                    {option}
                                                  </Typography>
                                                  {hasAnswered && isCorrectAnswer && !isUserSelected && (
                                                    <Box sx={{ ml: 1 }}>
                                                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16a34a' }} />
                                                      </Box>
                                                    </Box>
                                                  )}
                                                </Box>
                                              )
                                            })}
                                          </Stack>
                                        </Box>

                                        {/* Question Footer with Metadata */}
                                        <Box sx={{ px: 1, py: 0.75, backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb' }}>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                                              {(question.exam_name || question.metadata?.exam_name || question.metadata?.exam) && (
                                                <Chip size="small" label={question.exam_name || question.metadata?.exam_name || question.metadata?.exam} sx={{ backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '0.65rem' }} />
                                              )}
                                              {(question.year || question.metadata?.year || question.metadata?.exam_year) && (
                                                <Chip size="small" label={question.year || question.metadata?.year || question.metadata?.exam_year} sx={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.65rem' }} />
                                              )}
                                              {(question.term || question.metadata?.term || question.metadata?.exam_term) && (
                                                <Chip size="small" label={question.term || question.metadata?.term || question.metadata?.exam_term} sx={{ backgroundColor: '#ede9fe', color: '#5b21b6', fontSize: '0.65rem' }} />
                                              )}
                                              {(question.subject || question.metadata?.subject) && (
                                                <Chip size="small" label={question.subject || question.metadata?.subject} sx={{ backgroundColor: '#ffedd5', color: '#9a3412', fontSize: '0.65rem' }} />
                                              )}
                                            </Stack>

                                            <Button
                                              size="small"
                                              variant="text"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (hasAnswered) {
                                                  toggleExplanation(questionId, question);
                                                }
                                              }}
                                              disabled={!hasAnswered}
                                              endIcon={hasAnswered ? <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandedExplanations[questionId] ? 'rotate-180' : ''}`} /> : null}
                                              sx={{
                                                fontSize: '0.68rem',
                                                color: hasAnswered ? '#2563eb' : '#9ca3af',
                                                '&:hover': { backgroundColor: hasAnswered ? 'rgba(37,99,235,0.08)' : 'transparent' }
                                              }}
                                            >
                                              {hasAnswered
                                                ? (expandedExplanations[questionId] ? 'Hide Explanation' : 'Show Explanation')
                                                : 'Answer to view explanation'
                                              }
                                            </Button>
                                          </Box>

                                          {expandedExplanations[questionId] && (
                                            <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid #e5e7eb' }}>
                                              <Paper
                                                elevation={0}
                                                sx={{
                                                  p: 1.5,
                                                  borderRadius: 2,
                                                  borderLeft: '4px solid #60a5fa',
                                                  background: isDarkMode ? 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(90deg, #eff6ff 0%, #eef2ff 100%)'
                                                }}
                                              >
                                                {loadingExplanations[questionId] ? (
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    <Typography variant="body2" sx={{ fontSize: '0.75rem', color: isDarkMode ? '#9ca3af' : '#374151', lineHeight: 1.6 }}>
                                                      Generating AI explanation...
                                                    </Typography>
                                                  </Box>
                                                ) : explanationErrors[questionId] ? (
                                                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#dc2626', lineHeight: 1.6 }}>
                                                    {explanationErrors[questionId]}
                                                  </Typography>
                                                ) : (
                                                  <Typography variant="body2" sx={{ fontSize: '0.75rem', color: isDarkMode ? '#d1d5db' : '#1f2937', lineHeight: 1.6 }}>
                                                    {aiExplanations[questionId] || question.explanation || 'Explanation unavailable.'}
                                                  </Typography>
                                                )}
                                              </Paper>
                                            </Box>
                                          )}
                                        </Box>
                                      </Paper>
                                    )
                                  })
                                )}
                              </Stack>
                            )}
                          </Box>
                        )
                      })}
                    </Stack>
                  ) : !lastSearchQuery ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <FileText className="w-12 h-12 mx-auto mb-2" style={{ color: '#9ca3af' }} />
                      <Typography variant="caption" sx={{ display: 'block', color: '#6b7280' }}>
                        Use the search bar below to find relevant PYQs
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
            </Box>
            {/* Floating Embedded Search Bar at Bottom (Desktop only, mobile has unified sticky search bar) */}
            {!isMobile && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: { xs: 8, sm: 12 },
                  left: { xs: 8, sm: 12 },
                  right: { xs: 8, sm: 12 },
                  zIndex: 10,
                  backgroundColor: 'transparent'
                }}
              >
                <EmbeddedSearchBar onSendMessage={handleSendMessage} isLoading={isChatLoading} />
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

export default PYQSection
