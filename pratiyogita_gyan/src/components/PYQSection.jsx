import React, { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronDown, FileText, ChevronLeft, ChevronRight, Star, RefreshCw, MessageSquare, Target, Sparkles, ZoomIn, X, ChevronFirst } from 'lucide-react'
import { Box, Paper, Stack, Typography, IconButton, Chip, Divider, Button, Menu, MenuItem } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useLayout } from '../contexts/LayoutContext'
import { useTheme } from '../contexts/ThemeContext'
import { useDashboard } from '../contexts/DashboardContext'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
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
  score: question?.score ?? null,
  question_type: question?.question_type || question?.metadata?.question_type || 'single_choice',
  directive: question?.directive || question?.metadata?.directive || '',
  statements: question?.statements || question?.metadata?.statements || [],
  match_data: question?.match_data || question?.metadata?.match_data || null,
  assertion_reason: question?.assertion_reason || question?.metadata?.assertion_reason || null,
  is_negative: question?.is_negative || question?.metadata?.is_negative || false
})

const QUESTION_TYPE_OPTIONS = [
  { id: 'all', name: 'All Types' },
  { id: 'multi_statement', name: 'Multi-Statement' },
  { id: 'match_list', name: 'Match List' },
  { id: 'single_choice', name: 'Single Choice' },
  { id: 'assertion_reason', name: 'Assertion & Reason' },
  { id: 'passage', name: 'Passage Based' }
]

const ALL_15_EXAMS = [
  { title: 'UPSC CSE', icon: '🏛️', bg: 'rgba(59,130,246,0.06)', border: '#bfdbfe' },
  { title: 'CDS / NDA', icon: '⚔️', bg: 'rgba(16,185,129,0.06)', border: '#bbf7d0' },
  { title: 'CAPF', icon: '🛡️', bg: 'rgba(239,68,68,0.06)', border: '#fecaca' },
  { title: 'AFCAT', icon: '✈️', bg: 'rgba(14,165,233,0.06)', border: '#bae6fd' },
  { title: 'SSC CGL', icon: '📊', bg: 'rgba(139,92,246,0.06)', border: '#ddd6fe' },
  { title: 'RRB NTPC', icon: '🚆', bg: 'rgba(245,158,11,0.06)', border: '#fde68a' },
  { title: 'SBI PO', icon: '🏦', bg: 'rgba(16,185,129,0.06)', border: '#a7f3d0' },
  { title: 'UP Police SI', icon: '🚔', bg: 'rgba(220,38,38,0.06)', border: '#fca5a5' },
  { title: 'State PCS', icon: '🎓', bg: 'rgba(234,88,12,0.06)', border: '#fed7aa' },
  { title: 'CAT', icon: '📈', bg: 'rgba(99,102,241,0.06)', border: '#c7d2fe' },
  { title: 'CUET UG', icon: '📖', bg: 'rgba(168,85,247,0.06)', border: '#e9d5ff' },
  { title: 'CUET PG', icon: '📚', bg: 'rgba(236,72,153,0.06)', border: '#fbcfe8' },
  { title: 'GATE', icon: '⚙️', bg: 'rgba(20,184,166,0.06)', border: '#99f6e4' },
  { title: 'CTET', icon: '👨‍🏫', bg: 'rgba(34,197,94,0.06)', border: '#bbf7d0' },
  { title: 'Delhi Judicial Service', icon: '⚖️', bg: 'rgba(100,116,139,0.06)', border: '#cbd5e1' }
]

const QUICK_PRACTICE_POOL = [
  'Fundamental Rights (Articles 12-35)',
  'Indian Monetary Policy & Inflation',
  'Indian Monsoon & Drainage System',
  '1857 Revolt & Freedom Struggle',
  'ISRO Space Missions & Satellites',
  'National Parks & Ramsar Sites',
  'Preamble & Constitutional Amendments',
  'Buddhism & Jainism Doctrines',
  'Mughal Administration & Revenue System',
  'Plate Tectonics & Earthquake Belts',
  'Fiscal Deficit & GST Council',
  'Defense Exercises & Missiles (Agni/BrahMos)',
  'Fundamental Duties & DPSP (Part IV)',
  'Atmospheric Layers & Cyclones',
  'Harappan Civilization & Vedic Age',
  'Supreme Court & Judicial Review',
  'CRPF, BSF, ITBP Border Security',
  'Carbon Cycle & Climate Change Protocols'
]

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
  const [subtopicAnchorEl, setSubtopicAnchorEl] = useState(null)
  const [questionTypeAnchorEl, setQuestionTypeAnchorEl] = useState(null)
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedTopic, setSelectedTopic] = useState('all')
  const [selectedSubtopic, setSelectedSubtopic] = useState('all')
  const [selectedQuestionType, setSelectedQuestionType] = useState('all')
  const [filteredQuestions, setFilteredQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState({}) // Track user selections for each question (persistent)
  const [sessionAnswers, setSessionAnswers] = useState({}) // Track user selections in CURRENT search session (for clean top progress bar)
  const [quickPracticeTopics, setQuickPracticeTopics] = useState(QUICK_PRACTICE_POOL.slice(0, 6))
  const [expandedExplanations, setExpandedExplanations] = useState({}) // Track expanded explanations
  const [previewImage, setPreviewImage] = useState(null) // Track full-screen image preview lightbox
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
  const isSubtopicMenuOpen = Boolean(subtopicAnchorEl)
  const isQuestionTypeMenuOpen = Boolean(questionTypeAnchorEl)

  const rotateQuickPractice = () => {
    const shuffled = [...QUICK_PRACTICE_POOL].sort(() => Math.random() - 0.5)
    setQuickPracticeTopics(shuffled.slice(0, 6))
  }

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
  const [availableSubtopics, setAvailableSubtopics] = useState([])
  const [loadingFilters, setLoadingFilters] = useState(false)

  // Dynamic exam, subject, date, topic, and subtopic lists from search results only
  const exams = [
    { id: 'all', name: 'All Exams' },
    ...availableExams.map(exam => ({ id: exam.toLowerCase(), name: exam }))
  ]

  const subjects = [
    { id: 'all', name: 'All Subjects' },
    ...availableSubjects.map(subject => ({ id: subject.toLowerCase(), name: subject }))
  ]

  const dates = [
    { id: 'all', name: 'All Years' },
    ...availableDates.map(date => ({ id: String(date).toLowerCase(), name: String(date) }))
  ]

  const topics = [
    { id: 'all', name: 'All Topics' },
    ...availableTopics.map(topic => ({ id: topic.toLowerCase(), name: topic }))
  ]

  const subtopics = [
    { id: 'all', name: 'All Subtopics' },
    ...availableSubtopics.map(subtopic => ({ id: subtopic.toLowerCase(), name: subtopic }))
  ]

  // Extract unique exams, subjects, dates, topics, and subtopics from search results
  const extractFiltersFromResults = (questions) => {
    const uniqueExams = new Set()
    const uniqueSubjects = new Set()
    const uniqueDates = new Set()
    const uniqueTopics = new Set()
    const uniqueSubtopics = new Set()

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

      // Extract subtopic
      const subtopic = question.subtopic || question.metadata?.subtopic || ''
      if (subtopic && subtopic.trim()) {
        uniqueSubtopics.add(subtopic.trim())
      }
    })

    return {
      exams: Array.from(uniqueExams).sort(),
      subjects: Array.from(uniqueSubjects).sort(),
      dates: Array.from(uniqueDates).sort(),
      topics: Array.from(uniqueTopics).sort(),
      subtopics: Array.from(uniqueSubtopics).sort()
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

    if (selectedSubtopic !== 'all') {
      filtered = filtered.filter(q => {
        const subtopic = q.subtopic || q.metadata?.subtopic || ''
        return subtopic.toLowerCase() === selectedSubtopic.toLowerCase()
      })
    }

    if (selectedQuestionType !== 'all') {
      filtered = filtered.filter(q => {
        const qType = q.question_type || q.metadata?.question_type || 'single_choice'
        return qType.toLowerCase() === selectedQuestionType.toLowerCase()
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

  // Count starred questions strictly within the current view/chat's questions
  const currentStarredCount = useMemo(() => {
    const targetQuestions = openPanelsQuestions.length > 0 ? openPanelsQuestions : searchResults
    if (!targetQuestions || targetQuestions.length === 0) return 0
    return targetQuestions.filter((q, idx) => {
      const qId = getStableQuestionId(q, idx)
      return importantQuestions.has(qId)
    }).length
  }, [openPanelsQuestions, searchResults, importantQuestions])

  // Auto-reset important filter if no questions in current view are starred
  useEffect(() => {
    if (currentStarredCount === 0 && showImportantOnly) {
      setShowImportantOnly(false)
    }
  }, [currentStarredCount, showImportantOnly])

  // Extract filter dropdown options from open panels only (or all results if none are open)
  useEffect(() => {
    const targetQuestions = openPanelsQuestions.length > 0 ? openPanelsQuestions : searchResults
    if (targetQuestions.length > 0) {
      setLoadingFilters(true)
      const { exams, subjects, dates, topics, subtopics } = extractFiltersFromResults(targetQuestions)
      setAvailableExams(exams)
      setAvailableSubjects(subjects)
      setAvailableDates(dates)
      setAvailableTopics(topics)
      setAvailableSubtopics(subtopics)
      setLoadingFilters(false)
    } else {
      setAvailableExams([])
      setAvailableSubjects([])
      setAvailableDates([])
      setAvailableTopics([])
      setAvailableSubtopics([])
      setLoadingFilters(false)
    }
  }, [openPanelsQuestions, searchResults])

  // Apply filters to open panels (or all results if none are open)
  useEffect(() => {
    const targetQuestions = openPanelsQuestions.length > 0 ? openPanelsQuestions : searchResults
    const filtered = applyFiltersToQuestions(targetQuestions)
    setFilteredQuestions(filtered)
  }, [openPanelsQuestions, searchResults, selectedExam, selectedSubject, selectedDate, selectedTopic, selectedSubtopic, selectedQuestionType, showImportantOnly, importantQuestions])

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
    if (sessionAnswers[questionId] !== undefined || userAnswers[questionId] !== undefined || (safeKey && userAnswers[safeKey] !== undefined) || (rawId && userAnswers[rawId] !== undefined)) return

    // Immediately update in-memory state with all lookup keys
    setSessionAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
      ...(safeKey ? { [safeKey]: optionIndex } : {}),
      ...(rawId ? { [rawId]: optionIndex } : {})
    }))

    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
      ...(safeKey ? { [safeKey]: optionIndex } : {}),
      ...(rawId ? { [rawId]: optionIndex } : {})
    }))

    // Keep active question lists in sync with selected option
    setSearchResults(prev => prev.map((q, idx) => {
      const match = (q.id && String(q.id) === String(questionId)) ||
        getStableQuestionId(q, idx) === questionId ||
        q._id === questionId ||
        (safeKey && makeSafeFirestoreKey(getStableQuestionId(q, idx)) === safeKey)
      return match ? { ...q, selectedOption: optionIndex, userAnswer: optionIndex } : q
    }))
    setFilteredQuestions(prev => prev.map((q, idx) => {
      const match = (q.id && String(q.id) === String(questionId)) ||
        getStableQuestionId(q, idx) === questionId ||
        q._id === questionId ||
        (safeKey && makeSafeFirestoreKey(getStableQuestionId(q, idx)) === safeKey)
      return match ? { ...q, selectedOption: optionIndex, userAnswer: optionIndex } : q
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
    const targetQuestions = openPanelsQuestions.length > 0 ? openPanelsQuestions : searchResults
    if (targetQuestions.length === 0) return

    if (currentStarredCount > 0) {
      // Clear starred status ONLY for the questions in the current view
      setImportantQuestions(prev => {
        const next = new Set(prev)
        targetQuestions.forEach((q, idx) => {
          const qId = getStableQuestionId(q, idx)
          next.delete(qId)
        })
        return next
      })
      return
    }

    // Select all currently visible questions
    if (filteredQuestions.length === 0) return
    setImportantQuestions(prev => {
      const newSet = new Set(prev)
      filteredQuestions.forEach((question, idx) => {
        const qId = getStableQuestionId(question, idx)
        if (qId) newSet.add(qId)
      })
      return newSet
    })
  }

  // Determine which questions to display based on search results or filtered API results
  const currentQuestions = searchResults.length > 0 ? filteredQuestions : filteredQuestions


  const progressStats = useMemo(() => {
    if (!currentQuestions || currentQuestions.length === 0) {
      return { correct: 0, wrong: 0, answered: 0 }
    }

    let correct = 0
    let wrong = 0
    let answered = 0

    currentQuestions.forEach((q, idx) => {
      const questionId = getStableQuestionId(q, idx)
      const safeKey = makeSafeFirestoreKey(questionId)
      const rawId = (q?.id || q?._id) ? String(q.id || q._id) : null
      const safeRawId = rawId ? makeSafeFirestoreKey(rawId) : null

      const sessionAnswer = sessionAnswers[questionId] !== undefined
        ? sessionAnswers[questionId]
        : (sessionAnswers[safeKey] !== undefined
            ? sessionAnswers[safeKey]
            : (rawId && sessionAnswers[rawId] !== undefined
                ? sessionAnswers[rawId]
                : (safeRawId && sessionAnswers[safeRawId] !== undefined
                    ? sessionAnswers[safeRawId]
                    : undefined)))

      const hasAnswered = sessionAnswer !== undefined && sessionAnswer !== null
      if (hasAnswered) {
        answered++
        const hasValidCorrectAnswer =
          q.correct_answer !== undefined &&
          Number.isInteger(q.correct_answer) &&
          q.correct_answer >= 0 &&
          q.correct_answer < (q.options?.length || 0)

        if (hasValidCorrectAnswer) {
          if (sessionAnswer === q.correct_answer) {
            correct++
          } else {
            wrong++
          }
        }
      }
    })

    return {
      correct,
      wrong,
      answered
    }
  }, [currentQuestions, sessionAnswers])

  const leftMarginPx = contentOffsetLeft
  const rightMarginPx = pyqVisible ? 408 : 50

  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: 56, md: 60 },
        bottom: { xs: 0, md: 4 },
        left: { xs: 0, md: leftMarginPx },
        right: { xs: 0, md: rightMarginPx },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: 0,
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
          borderRadius: isMobile ? 0 : '8px',
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
                        {dates.find(d => d.id === selectedDate)?.name || 'All Years'}
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
                        {topics.find(t => t.id === selectedTopic)?.name || 'All Topics'}
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

                  {/* 5. Select Subtopic Filter */}
                  {availableSubtopics.length > 0 && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(event) => setSubtopicAnchorEl(event.currentTarget)}
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
                        {subtopics.find(s => s.id === selectedSubtopic)?.name || 'All Subtopics'}
                      </Button>
                      <Menu
                        anchorEl={subtopicAnchorEl}
                        open={isSubtopicMenuOpen}
                        onClose={() => setSubtopicAnchorEl(null)}
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
                        {subtopics.map((sub) => (
                          <MenuItem
                            key={sub.id}
                            selected={selectedSubtopic === sub.id}
                            onClick={() => {
                              setSelectedSubtopic(sub.id)
                              setSubtopicAnchorEl(null)
                            }}
                            sx={{
                              fontSize: '0.72rem',
                              '&:hover': { backgroundColor: '#f3f4f6' },
                              '&.Mui-selected': { backgroundColor: 'rgba(228,87,46,0.12)', color: '#E4572E', fontWeight: 700 }
                            }}
                          >
                            {sub.name}
                          </MenuItem>
                        ))}
                      </Menu>
                    </>
                  )}

                  {/* 6. Question Type Filter */}
                  <Button
                    size="small"
                    variant="contained"
                    onClick={(event) => setQuestionTypeAnchorEl(event.currentTarget)}
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
                    {QUESTION_TYPE_OPTIONS.find(t => t.id === selectedQuestionType)?.name || 'Question Type'}
                  </Button>
                  <Menu
                    anchorEl={questionTypeAnchorEl}
                    open={isQuestionTypeMenuOpen}
                    onClose={() => setQuestionTypeAnchorEl(null)}
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
                    {QUESTION_TYPE_OPTIONS.map((opt) => (
                      <MenuItem
                        key={opt.id}
                        selected={selectedQuestionType === opt.id}
                        onClick={() => {
                          setSelectedQuestionType(opt.id)
                          setQuestionTypeAnchorEl(null)
                        }}
                        sx={{
                          fontSize: '0.72rem',
                          '&:hover': { backgroundColor: '#f3f4f6' },
                          '&.Mui-selected': { backgroundColor: 'rgba(228,87,46,0.12)', color: '#E4572E', fontWeight: 700 }
                        }}
                      >
                        {opt.name}
                      </MenuItem>
                    ))}
                  </Menu>

                  {/* 5. Starred / Important Filter Chip - only show if current view questions have starred items */}
                  {currentStarredCount > 0 && (
                    <Chip
                      size="small"
                      clickable
                      onClick={() => setShowImportantOnly(prev => !prev)}
                      icon={<Star className={`w-3 h-3 ${showImportantOnly ? 'fill-current' : ''}`} />}
                      label={`${currentStarredCount} Starred`}
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
                  {(openPanelsQuestions.length > 0 || searchResults.length > 0) && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleSelectAllOrClearAll}
                      startIcon={<Star className="w-3 h-3" />}
                      title={currentStarredCount > 0 ? 'Clear marked important questions in current view' : 'Mark all questions in current view as important'}
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
                      {currentStarredCount > 0 ? 'Clear Stars' : 'Star All'}
                    </Button>
                  )}
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
              {/* Sticky Header - Always rendered when questions exist */}
              {filteredQuestions.length > 0 && (
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
                    <Box sx={{ py: 2, px: { xs: 1, sm: 2 }, maxWidth: 860, mx: 'auto', width: '100%' }}>
                      <Box 
                        className="pyq-fade-slide"
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          py: 2.5,
                          textAlign: 'center'
                        }}
                      >
                        <Box sx={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ThinkingOrb state="connecting" size={64} speed={1.80} style={{ transform: 'scale(1.0)', transformOrigin: 'center' }} />
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 1.5, 
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
                            fontSize: '0.75rem',
                            mb: 2.5
                          }}
                        >
                          Searching 4,200+ questions across UPSC, CDS, SSC & State PSC in Pinecone
                        </Typography>
                      </Box>

                      {/* Shimmer Skeleton Question Cards */}
                      <Stack spacing={1.5}>
                        {[1, 2, 3].map((item) => (
                          <Paper
                            key={item}
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              <Box className="shimmer-skeleton" sx={{ width: 80, height: 20, borderRadius: 1 }} />
                              <Box className="shimmer-skeleton" sx={{ width: 60, height: 20, borderRadius: 1 }} />
                              <Box className="shimmer-skeleton" sx={{ width: 70, height: 20, borderRadius: 1, ml: 'auto' }} />
                            </Box>
                            <Box className="shimmer-skeleton" sx={{ width: '92%', height: 16, borderRadius: 1, mb: 1 }} />
                            <Box className="shimmer-skeleton" sx={{ width: '70%', height: 16, borderRadius: 1, mb: 2 }} />
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
                              {[1, 2, 3, 4].map((opt) => (
                                <Box key={opt} className="shimmer-skeleton" sx={{ height: 36, borderRadius: 1.5 }} />
                              ))}
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
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

                      {/* Continuous Marquee Ticker with 15 Exams */}
                      <Box sx={{ mb: 1.5, overflow: 'hidden' }}>
                        <div className="marquee-container py-0.5">
                          <div className="marquee-track">
                            {[...ALL_15_EXAMS, ...ALL_15_EXAMS].map((cat, idx) => (
                              <Box
                                key={idx}
                                onClick={() => {
                                  setSelectedExam(cat.title.toLowerCase())
                                }}
                                sx={{
                                  py: 0.55,
                                  px: 1.1,
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: cat.border,
                                  backgroundColor: cat.bg,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 0.7,
                                  userSelect: 'none',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                  '&:hover': {
                                    transform: 'scale(1.04)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                  }
                                }}
                              >
                                <span style={{ fontSize: '0.9rem' }}>{cat.icon}</span>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.73rem', whiteSpace: 'nowrap' }}>
                                  {cat.title}
                                </Typography>
                              </Box>
                            ))}
                          </div>
                        </div>
                      </Box>

                      {/* Quick Practice Prompts with Rotate/Shuffle button */}
                      <Box sx={{ mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#4b5563', display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.72rem' }}>
                            <Sparkles size={13} color="#fbbf24" />
                            <span>Quick Practice (Click to Search)</span>
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            onClick={rotateQuickPractice}
                            startIcon={<RefreshCw size={11} />}
                            sx={{
                              fontSize: '0.68rem',
                              textTransform: 'none',
                              py: 0.1,
                              px: 0.6,
                              color: '#E4572E',
                              fontWeight: 600,
                              '&:hover': { backgroundColor: 'rgba(228,87,46,0.08)' }
                            }}
                          >
                            Rotate
                          </Button>
                        </Box>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.75 }}>
                          {quickPracticeTopics.map((topic, idx) => (
                            <Button
                              key={idx}
                              onClick={() => handleSendMessage(topic, { exam: 'all', subject: 'all' })}
                              variant="outlined"
                              size="small"
                              className="pyq-fade-slide"
                              style={{ animationDelay: `${0.04 + idx * 0.02}s` }}
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
                                  backgroundColor: 'rgba(228, 87, 46, 0.06)',
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

                                    const userAnswer = sessionAnswers[questionId] !== undefined
                                      ? sessionAnswers[questionId]
                                      : (sessionAnswers[safeKey] !== undefined
                                          ? sessionAnswers[safeKey]
                                          : (rawId && sessionAnswers[rawId] !== undefined
                                              ? sessionAnswers[rawId]
                                              : (userAnswers[questionId] !== undefined
                                                  ? userAnswers[questionId]
                                                  : (userAnswers[safeKey] !== undefined
                                                      ? userAnswers[safeKey]
                                                      : (rawId && userAnswers[rawId] !== undefined
                                                          ? userAnswers[rawId]
                                                          : (safeRawId && userAnswers[safeRawId] !== undefined
                                                              ? userAnswers[safeRawId]
                                                              : (question.selectedOption !== undefined ? question.selectedOption : question.userAnswer)))))))

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

                                          {/* Negative Interrogative Indicator */}
                                          {Boolean(question.is_negative || question.metadata?.is_negative) && (
                                            <Box
                                              sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                mb: 1,
                                                px: 0.8,
                                                py: 0.3,
                                                borderRadius: 1,
                                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#dc2626',
                                                fontSize: '0.62rem',
                                                fontWeight: 800,
                                                letterSpacing: '0.03em',
                                                textTransform: 'uppercase'
                                              }}
                                            >
                                              ⚠️ Negative Question (Look for NOT / INCORRECT)
                                            </Box>
                                          )}

                                          {/* Multi-Statement Question Cards */}
                                          {(() => {
                                            const stmts = question.statements || question.metadata?.statements;
                                            if (!Array.isArray(stmts) || stmts.length === 0) return null;

                                            return (
                                              <Box sx={{ mb: 1.25, p: 0.85, borderRadius: 1.5, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                                                <Stack spacing={0.65}>
                                                  {stmts.map((stmt, sIdx) => {
                                                    const matchNum = typeof stmt === 'string' ? stmt.match(/^(\d+|[I|V|X]+)\.\s*(.*)/) : null;
                                                    const numLabel = matchNum ? matchNum[1] : String(sIdx + 1);
                                                    const textContent = matchNum ? matchNum[2] : stmt;

                                                    return (
                                                      <Box
                                                        key={sIdx}
                                                        sx={{
                                                          display: 'flex',
                                                          alignItems: 'flex-start',
                                                          gap: 0.85,
                                                          p: 0.7,
                                                          borderRadius: 1,
                                                          backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                                                          border: '1px solid',
                                                          borderColor: isDarkMode ? '#334155' : '#e5e7eb'
                                                        }}
                                                      >
                                                        <Box
                                                          sx={{
                                                            px: 0.7,
                                                            py: 0.2,
                                                            fontSize: '0.65rem',
                                                            fontWeight: 800,
                                                            borderRadius: 0.75,
                                                            backgroundColor: 'rgba(228, 87, 46, 0.15)',
                                                            color: '#E4572E',
                                                            flexShrink: 0
                                                          }}
                                                        >
                                                          {numLabel}
                                                        </Box>
                                                        <Typography variant="body2" sx={{ fontSize: '0.72rem', color: isDarkMode ? '#d1d5db' : '#374151', lineHeight: 1.4 }}>
                                                          {textContent}
                                                        </Typography>
                                                      </Box>
                                                    );
                                                  })}
                                                </Stack>
                                              </Box>
                                            );
                                          })()}

                                          {/* Match List Question Comparison Table */}
                                          {(() => {
                                            const matchData = question.match_data || question.metadata?.match_data;
                                            if (!matchData || (!matchData.list_1 && !matchData.list_2)) return null;

                                            return (
                                              <Box
                                                sx={{
                                                  mb: 1.25,
                                                  borderRadius: 1.5,
                                                  overflow: 'hidden',
                                                  border: '1px solid',
                                                  borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                                  backgroundColor: isDarkMode ? '#0f172a' : '#ffffff'
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                                                    borderBottom: '1px solid',
                                                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                                    py: 0.6,
                                                    px: 1,
                                                    fontWeight: 700,
                                                    fontSize: '0.68rem',
                                                    color: isDarkMode ? '#94a3b8' : '#475569'
                                                  }}
                                                >
                                                  <Box sx={{ pr: 1, borderRight: '1px solid', borderColor: isDarkMode ? '#334155' : '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {matchData.list_1_title || 'List-I'}
                                                  </Box>
                                                  <Box sx={{ pl: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {matchData.list_2_title || 'List-II'}
                                                  </Box>
                                                </Box>

                                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                                  {/* List 1 items */}
                                                  <Box sx={{ p: 1, pr: 1, borderRight: '1px solid', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                                                    <Stack spacing={0.6}>
                                                      {(matchData.list_1 || []).map((item, idx) => (
                                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.6 }}>
                                                          <Typography component="span" sx={{ fontWeight: 700, color: '#E4572E', fontSize: '0.68rem', flexShrink: 0 }}>
                                                            {item.match(/^[A-E]\./) ? '' : `${['A','B','C','D','E'][idx]}. `}
                                                          </Typography>
                                                          <Typography variant="body2" sx={{ fontSize: '0.7rem', color: isDarkMode ? '#d1d5db' : '#374151', lineHeight: 1.35 }}>
                                                            {item}
                                                          </Typography>
                                                        </Box>
                                                      ))}
                                                    </Stack>
                                                  </Box>

                                                  {/* List 2 items */}
                                                  <Box sx={{ p: 1, pl: 1 }}>
                                                    <Stack spacing={0.6}>
                                                      {(matchData.list_2 || []).map((item, idx) => (
                                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.6 }}>
                                                          <Typography component="span" sx={{ fontWeight: 700, color: '#6366f1', fontSize: '0.68rem', flexShrink: 0 }}>
                                                            {item.match(/^[1-9]\./) ? '' : `${idx + 1}. `}
                                                          </Typography>
                                                          <Typography variant="body2" sx={{ fontSize: '0.7rem', color: isDarkMode ? '#d1d5db' : '#374151', lineHeight: 1.35 }}>
                                                            {item}
                                                          </Typography>
                                                        </Box>
                                                      ))}
                                                    </Stack>
                                                  </Box>
                                                </Box>
                                              </Box>
                                            );
                                          })()}

                                          {/* Assertion & Reason Question Cards */}
                                          {(() => {
                                            const arData = question.assertion_reason || question.metadata?.assertion_reason;
                                            if (!arData || (!arData.assertion && !arData.reason)) return null;

                                            return (
                                              <Box sx={{ mb: 1.25, p: 0.75, borderRadius: 1.5, backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc', border: '1px solid', borderColor: isDarkMode ? '#334155' : '#e2e8f0' }}>
                                                <Stack spacing={0.5}>
                                                  <Box sx={{ p: 0.75, borderRadius: 1, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', border: '1px solid', borderColor: isDarkMode ? '#334155' : '#e5e7eb' }}>
                                                    <Typography component="span" sx={{ fontWeight: 700, color: '#6366f1', mr: 0.5, fontSize: '0.68rem' }}>
                                                      Assertion (A):
                                                    </Typography>
                                                    <Typography component="span" sx={{ fontSize: '0.7rem', color: isDarkMode ? '#d1d5db' : '#374151' }}>
                                                      {arData.assertion}
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ p: 0.75, borderRadius: 1, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', border: '1px solid', borderColor: isDarkMode ? '#334155' : '#e5e7eb' }}>
                                                    <Typography component="span" sx={{ fontWeight: 700, color: '#10b981', mr: 0.5, fontSize: '0.68rem' }}>
                                                      Reason (R):
                                                    </Typography>
                                                    <Typography component="span" sx={{ fontSize: '0.7rem', color: isDarkMode ? '#d1d5db' : '#374151' }}>
                                                      {arData.reason}
                                                    </Typography>
                                                  </Box>
                                                </Stack>
                                              </Box>
                                            );
                                          })()}

                                          {/* Directive / Prompt (e.g. Which of the statements given above is/are correct?) */}
                                          {(() => {
                                            const directive = question.directive || question.metadata?.directive;
                                            if (!directive) return null;

                                            return (
                                              <Box
                                                sx={{
                                                  mb: 1,
                                                  px: 1,
                                                  py: 0.5,
                                                  borderRadius: 1,
                                                  backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)',
                                                  borderLeft: '3px solid #f59e0b'
                                                }}
                                              >
                                                <Typography variant="body2" sx={{ fontSize: '0.68rem', fontStyle: 'italic', fontWeight: 600, color: isDarkMode ? '#fbbf24' : '#b45309' }}>
                                                  {directive}
                                                </Typography>
                                              </Box>
                                            );
                                          })()}

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
                                                  flexDirection: 'row',
                                                  alignItems: 'center',
                                                  gap: 1
                                                }}
                                              >
                                                {/* Options on Left (~50%) */}
                                                {renderOptions()}

                                                {/* Image directly on Right Side (~50%, no outer container box) */}
                                                <Box
                                                  sx={{
                                                    width: { xs: '48%', sm: '48%' },
                                                    maxWidth: { xs: '180px', sm: '260px' },
                                                    flexShrink: 0,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    p: 0
                                                  }}
                                                >
                                                  <img
                                                    src={formattedImg}
                                                    alt="Question Figure"
                                                    loading="lazy"
                                                    style={{
                                                      maxHeight: '175px',
                                                      maxWidth: '100%',
                                                      width: 'auto',
                                                      height: 'auto',
                                                      objectFit: 'contain',
                                                      borderRadius: '8px',
                                                      cursor: 'pointer',
                                                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                                                    }}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setPreviewImage(formattedImg);
                                                    }}
                                                    title="Click to enlarge"
                                                    onError={(e) => {
                                                      if (!e.target.dataset.triedFallback) {
                                                        e.target.dataset.triedFallback = 'true';
                                                        const fileDMatch = (rawImg || '').match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
                                                        if (fileDMatch && fileDMatch[1]) {
                                                          e.target.src = `https://drive.google.com/thumbnail?id=${fileDMatch[1]}&sz=w1000`;
                                                        }
                                                      } else {
                                                        e.target.style.display = 'none';
                                                      }
                                                    }}
                                                  />
                                                  <Box
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setPreviewImage(formattedImg);
                                                    }}
                                                    sx={{
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: 0.4,
                                                      mt: 0.6,
                                                      cursor: 'pointer',
                                                      userSelect: 'none',
                                                      color: '#E4572E',
                                                      transition: 'transform 0.15s ease, opacity 0.15s ease',
                                                      '&:hover': { opacity: 0.85, transform: 'scale(1.03)' }
                                                    }}
                                                    title="Click to enlarge"
                                                  >
                                                    <ZoomIn size={12} color="#E4572E" />
                                                    <Typography
                                                      variant="caption"
                                                      sx={{
                                                        fontSize: '0.66rem',
                                                        fontWeight: 700,
                                                        color: '#E4572E',
                                                        lineHeight: 1
                                                      }}
                                                    >
                                                      View figure
                                                    </Typography>
                                                  </Box>
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

      {/* Enlarged Image Lightbox Modal with Cross Button */}
      {previewImage && (
        <Box
          onClick={() => setPreviewImage(null)}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 1.5, sm: 3 }
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={() => setPreviewImage(null)}
              title="Close image"
              sx={{
                position: 'absolute',
                top: { xs: -12, sm: -16 },
                right: { xs: -12, sm: -16 },
                backgroundColor: '#ffffff',
                color: '#111827',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                zIndex: 10,
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                  transform: 'scale(1.08)'
                },
                transition: 'all 0.15s ease'
              }}
              size="small"
            >
              <X size={18} />
            </IconButton>

            {/* Enlarged Image */}
            <img
              src={previewImage}
              alt="Enlarged figure"
              style={{
                maxWidth: '100%',
                maxHeight: '84vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                backgroundColor: '#ffffff'
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default PYQSection
