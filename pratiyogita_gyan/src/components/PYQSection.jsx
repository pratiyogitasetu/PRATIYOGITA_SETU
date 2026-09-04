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

const makeSafeFirestoreKey = (rawId) => {
  return String(rawId || '')
    .replace(/[./\\~*\[\]]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 150);
}

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

const formatImageUrl = (url) => {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  // Match Google Drive links
  // Pattern 1: https://drive.google.com/file/d/{id}/...
  const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileDMatch && fileDMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileDMatch[1]}`
  }

  // Pattern 2: https://drive.google.com/open?id={id} or uc?id={id}
  const idMatch = trimmed.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`
  }

  return trimmed
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
  img: question?.img || question?.image_url || question?.metadata?.img || question?.metadata?.image_url || '',
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
    removeStarredPyqQuestion,
    saveUserPracticeAnswer,
    getUserPracticeAnswers
  } = useAuth()
  const [searchResults, setSearchResults] = useState([])
  const [lastSearchQuery, setLastSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [totalQuestions, setTotalQuestions] = useState(null)
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

  const lastScrolledQueryRef = useRef('')

  // When a new search query arrives, ensure we stay/scroll to the top question
  useEffect(() => {
    if (lastSearchQuery && lastSearchQuery !== lastScrolledQueryRef.current) {
      lastScrolledQueryRef.current = lastSearchQuery
      if (pyqScrollContainerRef.current) {
        pyqScrollContainerRef.current.scrollTop = 0
      }
    }
  }, [lastSearchQuery, searchResults])

  // Load previously answered questions from localStorage and Firestore
  useEffect(() => {
    const loadUserAnswers = async () => {
      let mergedAnswers = {}
      try {
        const storedAnswers = JSON.parse(localStorage.getItem('pyq_user_answers') || '{}')
        if (storedAnswers && typeof storedAnswers === 'object') {
          Object.entries(storedAnswers).forEach(([qId, val]) => {
            mergedAnswers[qId] = typeof val === 'object' && val !== null ? val.selectedOption : val
          })
        }
      } catch (e) {
        console.error('Failed to load user answers from localStorage:', e)
      }

      // Fetch from Firestore if user is logged in
      if (currentUser && getUserPracticeAnswers) {
        try {
          const cloudAnswers = await getUserPracticeAnswers()
          if (cloudAnswers && typeof cloudAnswers === 'object') {
            Object.entries(cloudAnswers).forEach(([qId, opt]) => {
              if (opt !== undefined && opt !== null) {
                mergedAnswers[qId] = typeof opt === 'object' && opt !== null ? opt.selectedOption : opt
              }
            })
            // Keep localStorage updated with merged answers
            try {
              const currentLocal = JSON.parse(localStorage.getItem('pyq_user_answers') || '{}')
              localStorage.setItem('pyq_user_answers', JSON.stringify({ ...currentLocal, ...mergedAnswers }))
            } catch (err) {}
          }
        } catch (err) {
          console.warn('Failed to load user answers from cloud:', err)
        }
      }

      if (Object.keys(mergedAnswers).length > 0) {
        setUserAnswers(prev => ({ ...mergedAnswers, ...prev }))
      }
    }

    loadUserAnswers()
  }, [currentUser, getUserPracticeAnswers])

  // Listen for external updates to starred PYQs (e.g. from Dashboard)
  useEffect(() => {
    const handleStarredUpdate = (e) => {
      const { questionId, isStarred } = e.detail || {}
      if (!questionId) return
      setImportantQuestions(prev => {
        const next = new Set(prev)
        if (isStarred) {
          next.add(questionId)
        } else {
          next.delete(questionId)
        }
        return next
      })
    }
    window.addEventListener('starredPyqsUpdated', handleStarredUpdate)
    return () => window.removeEventListener('starredPyqsUpdated', handleStarredUpdate)
  }, [])

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
        if (response?.total_questions) {
          setTotalQuestions(response.total_questions)
          try {
            localStorage.setItem('cached_total_pyqs', String(response.total_questions))
          } catch {}
        }

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
      lastScrolledQueryRef.current = ''
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
      // Reset PYQ search view when loading an existing chat, but keep answered question status
      setSearchResults([])
      setLastSearchQuery('')
      setFilteredQuestions([])
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
      console.log('🔄 PYQ Section reset for loaded chat (retaining user answers)')
    }

    const handleLoadGuestChat = () => {
      // Reset PYQ search view when loading a guest chat, but keep answered question status
      setSearchResults([])
      setLastSearchQuery('')
      setFilteredQuestions([])
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
      console.log('🔄 PYQ Section reset for loaded guest chat (retaining user answers)')
    }

    const handleRestoreChatPyqs = (event) => {
      const { mcqs, query } = event.detail || {}
      if (Array.isArray(mcqs) && mcqs.length > 0) {
        const existingIds = new Set()
        const uniqueMcqs = mcqs.filter(q => {
          const id = q.id || q.question
          if (!id || existingIds.has(id)) return false
          existingIds.add(id)
          return true
        }).map(q => ({
          ...q,
          originatingQuery: q.originatingQuery || query || 'Search Results'
        }))

        setSearchResults(uniqueMcqs)
        setFilteredQuestions(uniqueMcqs)
        if (query) setLastSearchQuery(query)

        // Expand query accordion so questions are visible immediately
        const initialExpanded = {}
        uniqueMcqs.forEach(q => {
          if (q.originatingQuery) initialExpanded[q.originatingQuery] = true
        })
        if (query) initialExpanded[query] = true
        setExpandedQueries(initialExpanded)

        // Restore user answers for these questions from memory, question payload & localStorage
        try {
          const storedAnswers = JSON.parse(localStorage.getItem('pyq_user_answers') || '{}')
          const restoredAnswers = {}

          const resolveAns = (map, key) => {
            if (!key || !map || map[key] === undefined) return undefined
            const val = map[key]
            return typeof val === 'object' && val !== null ? val.selectedOption : val
          }

          uniqueMcqs.forEach((q, idx) => {
            const qId = getStableQuestionId(q, idx)
            const safeId = makeSafeFirestoreKey(qId)
            const rawId = q.id ? String(q.id) : null
            const safeRawId = rawId ? makeSafeFirestoreKey(rawId) : null

            // 1. Direct answer on question object (from chat message)
            if (q.selectedOption !== undefined && q.selectedOption !== null) {
              restoredAnswers[qId] = q.selectedOption
              if (safeId) restoredAnswers[safeId] = q.selectedOption
              if (rawId) restoredAnswers[rawId] = q.selectedOption
              return
            }
            if (q.userAnswer !== undefined && q.userAnswer !== null) {
              restoredAnswers[qId] = q.userAnswer
              if (safeId) restoredAnswers[safeId] = q.userAnswer
              if (rawId) restoredAnswers[rawId] = q.userAnswer
              return
            }

            // 2. In-memory userAnswers state
            let found = resolveAns(userAnswers, qId) ?? resolveAns(userAnswers, safeId) ?? resolveAns(userAnswers, rawId) ?? resolveAns(userAnswers, safeRawId)
            if (found !== undefined) {
              restoredAnswers[qId] = found
              return
            }

            // 3. LocalStorage
            found = resolveAns(storedAnswers, qId) ?? resolveAns(storedAnswers, safeId) ?? resolveAns(storedAnswers, rawId) ?? resolveAns(storedAnswers, safeRawId)
            if (found !== undefined) {
              restoredAnswers[qId] = found
              return
            }
          })

          if (Object.keys(restoredAnswers).length > 0) {
            setUserAnswers(prev => ({ ...prev, ...restoredAnswers }))
          }
        } catch (e) {
          console.error('Failed to restore answers from localStorage:', e)
        }

        // 4. Also asynchronously pull fresh practice answers from Firestore for cross-device accuracy
        if (currentUser && getUserPracticeAnswers) {
          getUserPracticeAnswers().then(cloudAnswers => {
            if (cloudAnswers && typeof cloudAnswers === 'object' && Object.keys(cloudAnswers).length > 0) {
              const cloudRestored = {}
              const resolveAns = (map, key) => {
                if (!key || !map || map[key] === undefined) return undefined
                const val = map[key]
                return typeof val === 'object' && val !== null ? val.selectedOption : val
              }

              uniqueMcqs.forEach((q, idx) => {
                const qId = getStableQuestionId(q, idx)
                const safeId = makeSafeFirestoreKey(qId)
                const rawId = q.id ? String(q.id) : null
                const safeRawId = rawId ? makeSafeFirestoreKey(rawId) : null

                const found = resolveAns(cloudAnswers, qId) ?? resolveAns(cloudAnswers, safeId) ?? resolveAns(cloudAnswers, rawId) ?? resolveAns(cloudAnswers, safeRawId)
                if (found !== undefined) {
                  cloudRestored[qId] = found
                  if (safeId) cloudRestored[safeId] = found
                  if (rawId) cloudRestored[rawId] = found
                }
              })

              if (Object.keys(cloudRestored).length > 0) {
                setUserAnswers(prev => ({ ...prev, ...cloudRestored }))
              }
            }
          }).catch(err => {
            console.warn('Notice: cross-device answer fetch:', err)
          })
        }

        setExpandedExplanations({})
        setSelectedExam('all')
        setSelectedSubject('all')
        setShowImportantOnly(false)

        // Populate available filters from restored questions
        const exams = Array.from(new Set(uniqueMcqs.map(q => q.exam_name || q.metadata?.exam_name).filter(Boolean))).sort()
        const subjects = Array.from(new Set(uniqueMcqs.map(q => q.subject || q.metadata?.subject).filter(Boolean))).sort()
        setAvailableExams(exams)
        setAvailableSubjects(subjects)
        console.log(`✅ Restored ${uniqueMcqs.length} PYQs for chat session`)
      } else {
        setSearchResults([])
        setFilteredQuestions([])
        setLastSearchQuery('')
        setAvailableExams([])
        setAvailableSubjects([])
      }
    }

    window.addEventListener('newMcqResults', handleMcqResults)
    window.addEventListener('newChat', handleNewChat)
    window.addEventListener('loadChat', handleLoadChat)
    window.addEventListener('loadGuestChat', handleLoadGuestChat)
    window.addEventListener('restoreChatPyqs', handleRestoreChatPyqs)
    return () => {
      window.removeEventListener('newMcqResults', handleMcqResults)
      window.removeEventListener('newChat', handleNewChat)
      window.removeEventListener('loadChat', handleLoadChat)
      window.removeEventListener('loadGuestChat', handleLoadGuestChat)
      window.removeEventListener('restoreChatPyqs', handleRestoreChatPyqs)
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
  const handleOptionSelect = (param1, param2, param3) => {
    let question = null
    let questionId = null
    let optionIndex = null

    if (typeof param1 === 'object' && param1 !== null) {
      question = param1
      questionId = param2
      optionIndex = param3
    } else {
      questionId = param1
      optionIndex = param2
    }

    if (!questionId || optionIndex === undefined || optionIndex === null) return

    const safeKey = makeSafeFirestoreKey(questionId)
    const rawId = (question?.id || question?._id) ? String(question.id || question._id) : null

    // If already answered this question, do not count again
    if (userAnswers[questionId] !== undefined || (safeKey && userAnswers[safeKey] !== undefined) || (rawId && userAnswers[rawId] !== undefined)) return

    // Immediately update in-memory state with all lookup keys
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
      ...(safeKey ? { [safeKey]: optionIndex } : {}),
      ...(rawId ? { [rawId]: optionIndex } : {})
    }))

    // Save answer to localStorage immediately
    try {
      const storedAnswers = JSON.parse(localStorage.getItem('pyq_user_answers') || '{}')
      storedAnswers[questionId] = { selectedOption: optionIndex, timestamp: Date.now() }
      if (safeKey) storedAnswers[safeKey] = { selectedOption: optionIndex, timestamp: Date.now() }
      if (rawId) storedAnswers[rawId] = { selectedOption: optionIndex, timestamp: Date.now() }
      localStorage.setItem('pyq_user_answers', JSON.stringify(storedAnswers))
    } catch (e) {
      console.error('Failed to save answer to localStorage:', e)
    }

    // Save answer to cloud (Firestore) for cross-device sync
    if (currentUser && saveUserPracticeAnswer) {
      saveUserPracticeAnswer(questionId, optionIndex).catch(err => {
        console.warn('Failed to sync answer to cloud:', err)
      })
    }

    // Find the question to check if answer is correct
    const targetQuestion = question || searchResults.find(q =>
      (q.id && String(q.id) === String(questionId)) ||
      getStableQuestionId(q) === questionId ||
      q._id === questionId
    ) || filteredQuestions.find(q =>
      (q.id && String(q.id) === String(questionId)) ||
      getStableQuestionId(q) === questionId ||
      q._id === questionId
    )

    // Notify chat and other components of answered question
    window.dispatchEvent(new CustomEvent('pyqAnswerUpdated', {
      detail: {
        questionId,
        question: targetQuestion || question,
        selectedOption: optionIndex
      }
    }))

    if (targetQuestion) {
      const isCorrect = optionIndex === targetQuestion.correct_answer
      const questionSubject = targetQuestion.subject || targetQuestion.metadata?.subject || 'Others'

      if (!isCorrect) {
        void requestAiExplanation(questionId, targetQuestion)
      }

      // Track MCQ attempt with correct/wrong tracking
      if (isCorrect) {
        trackInteraction('mcq_correct', {
          questionId: questionId,
          subject: questionSubject,
          exam: targetQuestion.exam_name || targetQuestion.metadata?.exam_name || 'Unknown',
          selectedOption: optionIndex,
          correctOption: targetQuestion.correct_answer
        })
      } else {
        trackInteraction('mcq_wrong', {
          questionId: questionId,
          subject: questionSubject,
          exam: targetQuestion.exam_name || targetQuestion.metadata?.exam_name || 'Unknown',
          selectedOption: optionIndex,
          correctOption: targetQuestion.correct_answer
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
          window.dispatchEvent(new CustomEvent('starredPyqsUpdated', {
            detail: { questionId, isStarred: isCurrentlyImportant }
          }))
          return
        }

        window.dispatchEvent(new CustomEvent('starredPyqsUpdated', {
          detail: { questionId, isStarred: !isCurrentlyImportant, question: payload }
        }))
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
      window.dispatchEvent(new CustomEvent('starredPyqsUpdated', {
        detail: { questionId, isStarred: !isCurrentlyImportant, question: payload }
      }))
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
      window.dispatchEvent(new CustomEvent('starredPyqsUpdated', {
        detail: { questionId, isStarred: isCurrentlyImportant }
      }))
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
        top: { xs: 60, md: 64 },
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
          border: '1px solid #e5e7eb',
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
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e5e7eb',
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
                    endIcon={<ChevronDown className="w-3 h-3 text-white" />}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
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
                      '&:hover': { backgroundColor: 'primary.dark', boxShadow: 'none' }
                    }}
                  >
                    {loadingFilters ? 'Loading...' : (exams.find(e => e.id === selectedExam)?.name || 'All Exams')}
                  </Button>
                  <Menu
                    anchorEl={examAnchorEl}
                    open={isExamMenuOpen}
                    onClose={() => setExamAnchorEl(null)}
                    MenuListProps={{ dense: true }}
                    PaperProps={{
                      sx: {
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        border: '1px solid #e5e7eb',
                        borderRadius: 2.5,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    {exams.map((exam) => (
                      <MenuItem
                        key={exam.id}
                        selected={selectedExam === exam.id}
                        onClick={() => {
                          setSelectedExam(exam.id)
                          setExamAnchorEl(null)
                        }}
                        sx={{
                          fontSize: '0.72rem',
                          '&:hover': { backgroundColor: '#f3f4f6' },
                          '&.Mui-selected': { backgroundColor: 'rgba(228,87,46,0.12)', color: '#E4572E', fontWeight: 700 }
                        }}
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
                    endIcon={<ChevronDown className="w-3 h-3 text-white" />}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
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
                      '&:hover': { backgroundColor: 'primary.dark', boxShadow: 'none' }
                    }}
                  >
                    {loadingFilters ? 'Loading...' : (subjects.find(s => s.id === selectedSubject)?.name || 'All Subjects')}
                  </Button>
                  <Menu
                    anchorEl={subjectAnchorEl}
                    open={isSubjectMenuOpen}
                    onClose={() => setSubjectAnchorEl(null)}
                    MenuListProps={{ dense: true }}
                    PaperProps={{
                      sx: {
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        border: '1px solid #e5e7eb',
                        borderRadius: 2.5,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                      }
                    }}
                  >
                    {subjects.map((subject) => (
                      <MenuItem
                        key={subject.id}
                        selected={selectedSubject === subject.id}
                        onClick={() => {
                          setSelectedSubject(subject.id)
                          setSubjectAnchorEl(null)
                        }}
                        sx={{
                          fontSize: '0.72rem',
                          '&:hover': { backgroundColor: '#f3f4f6' },
                          '&.Mui-selected': { backgroundColor: 'rgba(228,87,46,0.12)', color: '#E4572E', fontWeight: 700 }
                        }}
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
                        endIcon={<ChevronDown className="w-3 h-3 text-white" />}
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
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
                          '&:hover': { backgroundColor: 'primary.dark', boxShadow: 'none' }
                        }}
                      >
                        {dates.find(d => d.id === selectedDate)?.name || 'Select Date'}
                      </Button>
                      <Menu
                        anchorEl={dateAnchorEl}
                        open={isDateMenuOpen}
                        onClose={() => setDateAnchorEl(null)}
                        MenuListProps={{ dense: true }}
                        PaperProps={{
                          sx: {
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            border: '1px solid #e5e7eb',
                            borderRadius: 2.5,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        {dates.map((date) => (
                          <MenuItem
                            key={date.id}
                            selected={selectedDate === date.id}
                            onClick={() => {
                              setSelectedDate(date.id)
                              setDateAnchorEl(null)
                            }}
                            sx={{
                              fontSize: '0.72rem',
                              '&:hover': { backgroundColor: '#f3f4f6' },
                              '&.Mui-selected': { backgroundColor: 'rgba(228,87,46,0.12)', color: '#E4572E', fontWeight: 700 }
                            }}
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
                        endIcon={<ChevronDown className="w-3 h-3 text-white" />}
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'primary.contrastText',
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
                          '&:hover': { backgroundColor: 'primary.dark', boxShadow: 'none' }
                        }}
                      >
                        {topics.find(t => t.id === selectedTopic)?.name || 'Select Topic'}
                      </Button>
                      <Menu
                        anchorEl={topicAnchorEl}
                        open={isTopicMenuOpen}
                        onClose={() => setTopicAnchorEl(null)}
                        MenuListProps={{ dense: true }}
                        PaperProps={{
                          sx: {
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            border: '1px solid #e5e7eb',
                            borderRadius: 2.5,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                          }
                        }}
                      >
                        {topics.map((topic) => (
                          <MenuItem
                            key={topic.id}
                            selected={selectedTopic === topic.id}
                            onClick={() => {
                              setSelectedTopic(topic.id)
                              setTopicAnchorEl(null)
                            }}
                            sx={{
                              fontSize: '0.72rem',
                              '&:hover': { backgroundColor: '#f3f4f6' },
                              '&.Mui-selected': { backgroundColor: 'rgba(228,87,46,0.12)', color: '#E4572E', fontWeight: 700 }
                            }}
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
                        backgroundColor: showImportantOnly ? '#f59e0b' : 'rgba(255, 146, 28, 0.15)',
                        color: showImportantOnly ? '#ffffff' : '#FF921C',
                        border: '1px solid',
                        borderColor: showImportantOnly ? '#f59e0b' : 'rgba(255, 146, 28, 0.3)',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        height: 22,
                        flexShrink: 0,
                        borderRadius: 999,
                        '&:hover': {
                          backgroundColor: showImportantOnly ? '#d97706' : 'rgba(255, 146, 28, 0.25)'
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
                      borderColor: '#e5e7eb',
                      textTransform: 'none',
                      flexShrink: 0,
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#e5e7eb',
                        borderColor: '#d1d5db'
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
              <IconButton onClick={togglePyq} size="small" title="Show Chat Panel" sx={{ color: '#000000', flexShrink: 0 }}>
                <MessageSquare className="w-4 h-4" />
              </IconButton>
            )}
          </Box>
          )}

            {/* Content Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', m: 0, minHeight: 0, backgroundColor: '#ffffff' }}>
              {/* Sticky Header - Only rendered if progress stats exist */}
              {filteredQuestions.length > 0 && Object.keys(userAnswers).length > 0 && (
                <Box
                  sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
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
                      sx={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#16a34a', fontSize: '0.7rem', fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      label={`${progressStats.wrong} Wrong`}
                      sx={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#dc2626', fontSize: '0.7rem', fontWeight: 600 }}
                    />
                    <Chip
                      size="small"
                      label={`${progressStats.answered}/${currentQuestions.length} Answered`}
                      sx={{ backgroundColor: 'rgba(0,0,0,0.06)', color: '#000000', fontSize: '0.7rem', fontWeight: 600 }}
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
                      <Box sx={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ThinkingOrb state="connecting" size={64} speed={1.80} style={{ transform: 'scale(1.5)', transformOrigin: 'center' }} />
                      </Box>
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
                      {/* Compact Top Header Card (Simplified Clean Version) */}
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
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <img 
                            src="/pg.png" 
                            alt="Pratiyogita Gyan Logo" 
                            className="w-11 h-11 object-contain mg-logo-shake"
                            style={{ filter: 'drop-shadow(0 2px 8px rgba(228,87,46,0.25))' }}
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 800,
                                color: '#111827',
                                fontSize: '1rem',
                                letterSpacing: '0.01em',
                                lineHeight: 1.2
                              }}
                            >
                              Pratiyogita Gyan
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.3, flexWrap: 'wrap' }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  color: '#E4572E',
                                  fontSize: '0.82rem'
                                }}
                              >
                                {totalQuestions !== null
                                  ? `${Number(totalQuestions).toLocaleString()} PYQ Questions`
                                  : 'Loading PYQ Questions...'}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#6b7280',
                                  fontSize: '0.78rem',
                                  fontWeight: 500
                                }}
                              >
                                • Adding more everyday 🚀
                              </Typography>
                            </Box>
                          </Box>
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
                      {/* Searched Query Accordion Tabs */}
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
                                    const safeKey = makeSafeFirestoreKey(questionId)
                                    const rawId = (question?.id || question?._id) ? String(question.id || question._id) : null
                                    const safeRawId = rawId ? makeSafeFirestoreKey(rawId) : null

                                    const userAnswer = userAnswers[questionId] !== undefined
                                      ? userAnswers[questionId]
                                      : (userAnswers[safeKey] !== undefined
                                          ? userAnswers[safeKey]
                                          : (rawId && userAnswers[rawId] !== undefined
                                              ? userAnswers[rawId]
                                              : (safeRawId && userAnswers[safeRawId] !== undefined
                                                  ? userAnswers[safeRawId]
                                                  : (question.selectedOption !== undefined ? question.selectedOption : question.userAnswer))))

                                    const isCorrect = userAnswer === question.correct_answer
                                    const hasAnswered = userAnswer !== undefined && userAnswer !== null

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

                                          {/* Options and Image Layout (Options on Left, Image on Right) */}
                                          {(() => {
                                            const rawImg = question.img || question.image_url || question.metadata?.img || question.metadata?.image_url;
                                            const formattedImg = formatImageUrl(rawImg);

                                            const renderOptions = () => (
                                              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
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
                                                          handleOptionSelect(question, questionId, optionIndex);
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
                                            );

                                            if (!formattedImg) {
                                              return (
                                                <Box sx={{ mt: 0.5 }}>
                                                  {renderOptions()}
                                                </Box>
                                              );
                                            }

                                            return (
                                              <Box
                                                sx={{
                                                  mt: 0.75,
                                                  display: 'flex',
                                                  flexDirection: { xs: 'column-reverse', sm: 'row' },
                                                  alignItems: 'center',
                                                  gap: 1.5
                                                }}
                                              >
                                                {/* Options on Left */}
                                                {renderOptions()}

                                                {/* Image on Right Side of Options */}
                                                <Box
                                                  sx={{
                                                    width: { xs: '100%', sm: '42%', md: '40%' },
                                                    maxWidth: { xs: '100%', sm: '260px' },
                                                    minWidth: { sm: '160px' },
                                                    flexShrink: 0,
                                                    p: 0.75,
                                                    borderRadius: 2,
                                                    border: '1px solid',
                                                    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                                                    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.25)' : '#f8fafc',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                      borderColor: isDarkMode ? 'rgba(255,255,255,0.25)' : '#cbd5e1',
                                                      boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
                                                    }
                                                  }}
                                                  onClick={() => {
                                                    window.open(formattedImg, '_blank', 'noopener,noreferrer');
                                                  }}
                                                  title="Click to view full image in new tab"
                                                >
                                                  <img
                                                    src={formattedImg}
                                                    alt="Question Figure"
                                                    loading="lazy"
                                                    style={{
                                                      maxHeight: '160px',
                                                      maxWidth: '100%',
                                                      width: 'auto',
                                                      height: 'auto',
                                                      objectFit: 'contain',
                                                      borderRadius: '6px'
                                                    }}
                                                    onError={(e) => {
                                                      if (!e.target.dataset.triedFallback) {
                                                        e.target.dataset.triedFallback = 'true';
                                                        const fileDMatch = (rawImg || '').match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
                                                        if (fileDMatch && fileDMatch[1]) {
                                                          e.target.src = `https://drive.google.com/thumbnail?id=${fileDMatch[1]}&sz=w1000`;
                                                        }
                                                      } else {
                                                        e.target.parentElement.style.display = 'none';
                                                      }
                                                    }}
                                                  />
                                                  <Typography
                                                    variant="caption"
                                                    sx={{
                                                      display: 'block',
                                                      mt: 0.5,
                                                      fontSize: '0.62rem',
                                                      color: isDarkMode ? '#9ca3af' : '#64748b',
                                                      textAlign: 'center',
                                                      userSelect: 'none'
                                                    }}
                                                  >
                                                    View figure ↗
                                                  </Typography>
                                                </Box>
                                              </Box>
                                            );
                                          })()}
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

                      {/* Searching new questions appears at the BOTTOM of searched results */}
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
                            mt: 1,
                            mb: 1
                          }}
                        >
                          <Box sx={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ThinkingOrb state="connecting" size={20} speed={1.80} style={{ transform: 'scale(1.4)', transformOrigin: 'center' }} />
                          </Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#E4572E', fontSize: '0.8rem' }}>
                            Searching new questions...
                          </Typography>
                        </Box>
                      )}
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
