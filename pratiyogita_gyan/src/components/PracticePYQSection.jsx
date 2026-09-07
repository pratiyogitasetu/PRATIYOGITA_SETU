import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Target,
  Clock,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  Sparkles,
  ZoomIn,
  X,
  Filter,
  Award,
  BookOpen,
  ArrowRight,
  Shuffle,
  Eye,
  Check,
  Calendar,
  Layers,
  ArrowLeft,
  Search
} from 'lucide-react'
import {
  Box,
  Paper,
  Stack,
  Typography,
  IconButton,
  Button,
  Chip,
  LinearProgress,
  Divider,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Tooltip,
  InputBase
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useAuth } from '../contexts/AuthContext'
import { useLayout } from '../contexts/LayoutContext'
import apiService from '../services/api'

const formatImageUrl = (url) => {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

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

const getStableQuestionId = (question, index = 0) => {
  if (question?.id !== undefined && question?.id !== null && String(question.id).trim() !== '') {
    return String(question.id)
  }
  const exam = question?.exam_name || question?.metadata?.exam_name || 'unknown_exam'
  const subject = question?.subject || question?.metadata?.subject || 'unknown_subject'
  const year = question?.year || question?.metadata?.year || 'unknown_year'
  const questionText = (question?.question || question?.text || '').trim().slice(0, 80)
  return [exam, subject, year, questionText || `q_${index}`]
    .map((part) => String(part).toLowerCase().replace(/\s+/g, '_'))
    .join('__')
}

const MAIN_CATEGORIES = [
  {
    id: 'DEFENCE_EXAMS',
    badge: 'DEFENCE_EXAMS',
    color: '#E4572E',
    bgColor: '#FFF7ED',
    borderColor: '#FED7AA',
    textColor: '#C2410C'
  },
  {
    id: 'BANKING_EXAMS',
    badge: 'BANKING_EXAMS',
    color: '#10B981',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    textColor: '#047857'
  },
  {
    id: 'SSC_EXAMS',
    badge: 'SSC_EXAMS',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    textColor: '#0369A1'
  },
  {
    id: 'CIVIL_SERVICES_EXAMS',
    badge: 'CIVIL_SERVICES_EXAMS',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A',
    textColor: '#B45309'
  },
  {
    id: 'RAILWAY_EXAMS',
    badge: 'RAILWAY_EXAMS',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    textColor: '#6D28D9'
  },
  {
    id: 'POLICE_EXAMS',
    badge: 'POLICE_EXAMS',
    color: '#0891B2',
    bgColor: '#ECFEFF',
    borderColor: '#A5F3FC',
    textColor: '#0E7490'
  },
  {
    id: 'TEACHING_EXAMS',
    badge: 'TEACHING_EXAMS',
    color: '#E11D48',
    bgColor: '#FFF1F2',
    borderColor: '#FECDD3',
    textColor: '#BE123C'
  },
  {
    id: 'ENGINEERING_RECRUITING_EXAMS',
    badge: 'ENGINEERING_RECRUITING_EXAMS',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    textColor: '#4338CA'
  },
  {
    id: 'JUDICIARY_EXAMS',
    badge: 'JUDICIARY_EXAMS',
    color: '#B45309',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    textColor: '#92400E'
  },
  {
    id: 'MBA_EXAMS',
    badge: 'MBA_EXAMS',
    color: '#C026D3',
    bgColor: '#FDF4FF',
    borderColor: '#F5D0FE',
    textColor: '#A21CAF'
  },
  {
    id: 'PG_EXAMS',
    badge: 'PG_EXAMS',
    color: '#6D28D9',
    bgColor: '#F3E8FF',
    borderColor: '#E9D5FF',
    textColor: '#581C87'
  },
  {
    id: 'CUET_AND_UG_ENTRANCE_EXAMS',
    badge: 'CUET_AND_UG_ENTRANCE_EXAMS',
    color: '#0D9488',
    bgColor: '#F0FDFA',
    borderColor: '#99F6E4',
    textColor: '#0F766E'
  }
]

const SUB_EXAM_DESCRIPTIONS = {
  CDS: { code: 'CDS', title: 'Combined Defence Services (UPSC)' },
  SBI_PO: { code: 'SBI PO', title: 'State Bank of India Probationary Officer' },
  SSC_CGL: { code: 'SSC CGL', title: 'Staff Selection Commission - Combined Graduate Level' },
  UPSC: { code: 'UPSC CSE', title: 'Civil Services Examination (IAS / IPS / IFS)' },
  RRB_NTPC: { code: 'RRB NTPC', title: 'Railway Non-Technical Popular Categories' },
  UPSI: { code: 'UP Police SI', title: 'Uttar Pradesh Police Sub-Inspector' },
  CTET: { code: 'CTET', title: 'Central Teacher Eligibility Test' },
  GATE: { code: 'GATE', title: 'Graduate Aptitude Test in Engineering' },
  DJS: { code: 'Delhi Judiciary', title: 'Delhi Judicial Services Examination' },
  CAT: { code: 'CAT', title: 'Common Admission Test (IIM Entrance)' },
  CUET_PG: { code: 'CUET PG', title: 'Common University Entrance Test (Postgraduate)' },
  CUET_UG: { code: 'CUET UG', title: 'Common University Entrance Test (Undergraduate)' }
}

const PracticePYQSection = () => {
  const { contentOffsetLeft, isMobile } = useLayout()
  const {
    currentUser,
    saveStarredPyqQuestion,
    removeStarredPyqQuestion,
    getStarredPyqQuestions,
    saveUserPracticeAnswer,
    savePaperPracticeReport
  } = useAuth()

  // Papers / Exams Catalog State
  const [availableExams, setAvailableExams] = useState([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true)
  const [selectedCategoryId, setSelectedCategoryId] = useState('DEFENCE_EXAMS')
  const [selectedExamObj, setSelectedExamObj] = useState(null)
  const [selectedYearObj, setSelectedYearObj] = useState(null)
  const [categorySearchQuery, setCategorySearchQuery] = useState('')

  // Active Practice State
  const [isPracticing, setIsPracticing] = useState(false)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [userAnswers, setUserAnswers] = useState({})
  const [starredMap, setStarredMap] = useState({})
  const [lightboxImg, setLightboxImg] = useState(null)
  const [isFinished, setIsFinished] = useState(false)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [hasSubmittedPaper, setHasSubmittedPaper] = useState(false)

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(true)

  // Switch to Chat / Close
  const handleClose = () => {
    window.dispatchEvent(new CustomEvent('switchToChat'))
  }

  // Load available exams and years from backend
  const loadAvailablePapers = useCallback(async () => {
    setIsLoadingCatalog(true)
    try {
      const res = await apiService.getAvailablePapers()
      if (res?.exams && Array.isArray(res.exams) && res.exams.length > 0) {
        setAvailableExams(res.exams)
        const defCat = res.exams.find((e) => e.category === 'DEFENCE_EXAMS') ? 'DEFENCE_EXAMS' : res.exams[0].category
        setSelectedCategoryId(defCat)
        const defExam = res.exams.find((e) => e.category === defCat) || res.exams[0]
        setSelectedExamObj(defExam)
        if (defExam?.years?.length > 0) {
          const yr2020 = defExam.years.find((y) => y.year_id === '2020_1') || defExam.years[0]
          setSelectedYearObj(yr2020)
        }
      }
    } catch (err) {
      console.error('Failed to load available papers catalog:', err)
    } finally {
      setIsLoadingCatalog(false)
    }
  }, [])

  useEffect(() => {
    loadAvailablePapers()
  }, [loadAvailablePapers])

  // Load Starred Questions from Firestore / Auth
  useEffect(() => {
    let isMounted = true
    const loadStarred = async () => {
      if (currentUser && getStarredPyqQuestions) {
        try {
          const starred = await getStarredPyqQuestions()
          if (isMounted && starred) {
            const map = {}
            starred.forEach((item) => {
              if (item?.id) map[item.id] = true
            })
            setStarredMap(map)
          }
        } catch (err) {
          console.error('Failed to load starred PYQs:', err)
        }
      }
    }
    loadStarred()
    return () => { isMounted = false }
  }, [currentUser, getStarredPyqQuestions])

  // Timer hook
  useEffect(() => {
    let interval = null
    if (isPracticing && isTimerRunning && !isFinished) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPracticing, isTimerRunning, isFinished])

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Start Practicing Selected Exam & Year
  const startPracticePaper = async (examObj, yearObj) => {
    const targetExam = examObj || selectedExamObj
    const targetYear = yearObj || selectedYearObj
    if (!targetExam || !targetYear) return

    setSelectedExamObj(targetExam)
    setSelectedYearObj(targetYear)
    setIsPracticing(true)
    setIsLoadingQuestions(true)
    setCurrentIndex(0)
    setUserAnswers({})
    setIsFinished(false)
    setIsReviewMode(false)
    setHasSubmittedPaper(false)
    setTimerSeconds(0)
    setIsTimerRunning(true)

    try {
      const res = await apiService.getPaperQuestions({
        category: targetExam.category,
        exam_id: targetExam.exam_id,
        year: targetYear.year_id
      })

      const fetched = Array.isArray(res?.questions) ? res.questions : []
      setQuestions(fetched)
    } catch (err) {
      console.error('Failed to load paper questions:', err)
      setQuestions([])
    } finally {
      setIsLoadingQuestions(false)
    }
  }

  // Current question helpers
  const currentQuestion = questions[currentIndex] || null
  const currentQId = currentQuestion ? getStableQuestionId(currentQuestion, currentIndex) : null
  const currentAttempt = currentQId ? userAnswers[currentQId] : null
  const isCurrentStarred = currentQId ? !!starredMap[currentQId] : false

  // Handle Option Click
  const handleSelectOption = (optionIndex) => {
    if (!currentQuestion || isReviewMode) return

    const correctIndex = currentQuestion.correct_answer
    const isCorrect = correctIndex !== null && correctIndex !== undefined && optionIndex === correctIndex

    const newAttempt = {
      selectedIndex: optionIndex,
      isCorrect,
      timestamp: Date.now()
    }

    setUserAnswers((prev) => ({
      ...prev,
      [currentQId]: newAttempt
    }))

    if (currentUser && saveUserPracticeAnswer) {
      try {
        saveUserPracticeAnswer({
          questionId: currentQId,
          examName: currentQuestion.exam_name,
          subject: currentQuestion.subject,
          isCorrect,
          selectedOption: optionIndex
        })
      } catch (err) {
        console.error('Error saving practice answer:', err)
      }
    }
  }

  // Handle Toggle Star / Bookmark
  const handleToggleStar = async () => {
    if (!currentQuestion || !currentQId) return
    const isStarred = starredMap[currentQId]

    setStarredMap((prev) => ({
      ...prev,
      [currentQId]: !isStarred
    }))

    try {
      if (isStarred) {
        if (removeStarredPyqQuestion) await removeStarredPyqQuestion(currentQId)
      } else {
        if (saveStarredPyqQuestion) {
          await saveStarredPyqQuestion({
            id: currentQId,
            question: currentQuestion.question || '',
            options: currentQuestion.options || [],
            correct_answer: currentQuestion.correct_answer,
            explanation: currentQuestion.explanation || '',
            exam_name: currentQuestion.exam_name || '',
            subject: currentQuestion.subject || '',
            year: currentQuestion.year || '',
            term: currentQuestion.term || '',
            img: currentQuestion.img || currentQuestion.image_url || ''
          })
        }
      }
    } catch (err) {
      console.error('Failed to toggle star:', err)
      setStarredMap((prev) => ({
        ...prev,
        [currentQId]: isStarred
      }))
    }
  }

  // Save Paper Practice Report when finished
  const handleFinishPaper = useCallback(async () => {
    setIsFinished(true)
    setIsTimerRunning(false)

    // Calculate score details
    let answered = 0
    let correct = 0
    let wrong = 0

    Object.values(userAnswers).forEach((att) => {
      if (att && att.selectedIndex !== undefined) {
        answered++
        if (att.isCorrect) correct++
        else wrong++
      }
    })

    const total = questions.length
    const unattempted = Math.max(0, total - answered)
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0
    const now = new Date()
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    // Build detailed breakdown of all questions in this paper
    const questionDetails = questions.map((q, idx) => {
      const qId = getStableQuestionId(q, idx)
      const att = userAnswers[qId]
      const hasAnswered = att && att.selectedIndex !== undefined
      const correctIndex = q.correct_answer
      const isCorrect = hasAnswered ? att.isCorrect : false
      const status = !hasAnswered ? 'unattempted' : isCorrect ? 'correct' : 'wrong'

      return {
        index: idx,
        id: qId,
        question: q.question || '',
        options: q.options || [],
        correctAnswer: correctIndex,
        userAnswer: hasAnswered ? att.selectedIndex : null,
        status, // 'correct' | 'wrong' | 'unattempted'
        explanation: q.explanation || '',
        subject: q.subject || '',
        img: q.img || q.image_url || ''
      }
    })

    const report = {
      id: `${selectedExamObj?.exam_id || 'EXAM'}_${selectedYearObj?.year_id || 'YEAR'}_${Date.now()}`,
      examId: selectedExamObj?.exam_id || 'EXAM',
      examName: selectedExamObj?.exam_name || selectedExamObj?.exam_id || 'Exam',
      category: selectedCategoryId || selectedExamObj?.category || 'EXAMS',
      yearId: selectedYearObj?.year_id || '',
      yearLabel: selectedYearObj?.label || 'Paper',
      date: formattedDate,
      timestamp: Date.now(),
      total,
      attempted: answered,
      unattempted,
      correct,
      wrong,
      accuracy,
      timeSpent: formatTimer(timerSeconds),
      questions: questionDetails,
      userAnswers
    }

    // Only save report to database/localStorage once per attempt session
    if (!hasSubmittedPaper) {
      setHasSubmittedPaper(true)
      if (savePaperPracticeReport) {
        try {
          await savePaperPracticeReport(report)
        } catch (err) {
          console.error('Failed to save paper practice report:', err)
        }
      }
    }
  }, [userAnswers, questions, selectedExamObj, selectedYearObj, selectedCategoryId, timerSeconds, savePaperPracticeReport, hasSubmittedPaper])

  // Score statistics
  const stats = useMemo(() => {
    let answered = 0
    let correct = 0
    let wrong = 0

    Object.values(userAnswers).forEach((att) => {
      if (att && att.selectedIndex !== undefined) {
        answered++
        if (att.isCorrect) correct++
        else wrong++
      }
    })

    const total = questions.length
    const unattempted = Math.max(0, total - answered)
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0

    return { answered, correct, wrong, total, unattempted, accuracy }
  }, [userAnswers, questions.length])

  // Question progress percentage
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0

  // Group available exams into 12 Main Categories
  const categoriesWithData = useMemo(() => {
    const map = {}
    availableExams.forEach((exam) => {
      const catKey = exam.category || 'OTHER'
      if (!map[catKey]) {
        map[catKey] = []
      }
      map[catKey].push(exam)
    })

    return MAIN_CATEGORIES.map((cat) => {
      const examsInCat = map[cat.id] || []
      const totalPapers = examsInCat.reduce((sum, e) => sum + (e.years?.length || 0), 0)
      const totalQuestions = examsInCat.reduce((sum, e) => sum + (e.total_questions || 0), 0)
      return {
        ...cat,
        exams: examsInCat,
        totalPapers,
        totalQuestions
      }
    })
  }, [availableExams])

  // Filtered categories by search
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoriesWithData
    const q = categorySearchQuery.toLowerCase().trim()
    return categoriesWithData.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.badge.toLowerCase().includes(q) ||
        cat.id.toLowerCase().includes(q)
    )
  }, [categoriesWithData, categorySearchQuery])

  // Current selected category object
  const currentCategory = useMemo(() => {
    return categoriesWithData.find((c) => c.id === selectedCategoryId) || categoriesWithData[0] || null
  }, [categoriesWithData, selectedCategoryId])

  // Sub-exams for the selected category
  const examsInSelectedCategory = useMemo(() => {
    return currentCategory?.exams || []
  }, [currentCategory])

  // Selection handlers
  const handleSelectCategory = (cat) => {
    setSelectedCategoryId(cat.id)
    const firstExam = cat.exams?.[0] || null
    setSelectedExamObj(firstExam)
    if (firstExam?.years?.length > 0) {
      setSelectedYearObj(firstExam.years[0])
    } else {
      setSelectedYearObj(null)
    }
  }

  const handleSelectExam = (exam) => {
    setSelectedExamObj(exam)
    if (exam.years?.length > 0) {
      setSelectedYearObj(exam.years[0])
    } else {
      setSelectedYearObj(null)
    }
  }

  return (
    <div
      className={`dashboard-page flex-1 flex flex-col h-full overflow-hidden ${isMobile ? 'p-0' : 'pr-1 pb-1'}`}
      style={{
        paddingTop: isMobile ? '56px' : '60px',
        marginLeft: isMobile ? 0 : `${contentOffsetLeft}px`,
        width: isMobile ? '100%' : `calc(100% - ${contentOffsetLeft + 4}px)`,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Outer Dashboard Card Wrapper */}
      <div className={`flex-1 bg-white flex flex-col overflow-hidden ${isMobile ? 'border-0 rounded-none' : 'border border-gray-200 rounded-lg shadow-sm'}`}>
        
        {/* Top Header Bar */}
        <div className="border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 shrink-0 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            {isPracticing ? (
              <button
                onClick={() => setIsPracticing(false)}
                className="p-1 hover:bg-gray-100 text-gray-700 rounded-md transition-colors flex items-center justify-center shrink-0 border border-gray-200"
                title="Change Exam / Year"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 text-gray-700 rounded-md transition-colors flex items-center justify-center shrink-0 border border-gray-200"
                title="Back to Home / Chat"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </button>
            )}
            
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-gray-900 leading-tight truncate">
                  {isPracticing ? `${selectedExamObj?.exam_id || 'Exam'} · ${selectedYearObj?.label || 'Paper'}` : 'PYQ Practice Arena'}
                </h1>
                {isPracticing && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-[#E4572E] rounded-full">
                    {questions.length} Qs
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-[11px] truncate">
                {isPracticing
                  ? `Official Paper Year ${selectedYearObj?.label}`
                  : 'Select Exam & Year to practice official previous year question papers'}
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isPracticing ? (
              <>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded border border-gray-200 text-xs font-bold text-gray-800">
                  <Clock className="w-3 h-3 text-[#E4572E]" />
                  <span>{formatTimer(timerSeconds)}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1">
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                    {stats.correct} Correct
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 rounded">
                    {stats.wrong} Wrong
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsReviewMode(false)
                    setIsPracticing(false)
                  }}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium"
                >
                  {isReviewMode ? 'Exit Review' : 'Change Paper'}
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded text-xs font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* VIEW 1: 3-WINDOW EXAM & YEAR SELECTION PORTAL           */}
        {/* ======================================================== */}
        {!isPracticing ? (
          <div className="flex-1 overflow-y-auto lg:overflow-hidden p-2.5 sm:p-3 bg-gray-50/80 flex flex-col min-h-0">
            {isLoadingCatalog ? (
              <div className="flex flex-col items-center justify-center py-16">
                <CircularProgress size={30} sx={{ color: '#E4572E', mb: 1.5 }} />
                <p className="text-xs sm:text-sm text-gray-500 font-medium">Loading exams and official question papers...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 w-full flex-1 min-h-0 overflow-y-auto lg:overflow-hidden pb-4 lg:pb-0">
                
                {/* ---------------------------------------------------- */}
                {/* WINDOW 1: MAIN EXAMS (12) (Left 4 cols)             */}
                {/* ---------------------------------------------------- */}
                <div className="lg:col-span-4 flex flex-col min-h-[240px] lg:min-h-0 max-h-[320px] lg:max-h-none overflow-hidden bg-white border-2 border-indigo-100/90 rounded-xl p-2.5 shadow-xs">
                  {/* Header 1: Indigo Accent */}
                  <div className="flex items-center justify-between px-1 py-1 mb-1.5 bg-indigo-50/70 border border-indigo-100 rounded-lg shrink-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs">
                        1
                      </span>
                      <span className="text-xs font-black text-indigo-950 uppercase tracking-wider truncate">
                        Main Exam ({categoriesWithData.length})
                      </span>
                    </div>

                    {/* Quick Search */}
                    <div className="flex items-center bg-white border border-indigo-200 rounded px-1.5 py-0.5 w-28 sm:w-32 shrink-0">
                      <Search className="w-3 h-3 text-indigo-400 mr-1 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="text-[11px] bg-transparent border-none outline-none w-full text-gray-800"
                      />
                    </div>
                  </div>

                  {/* Categories Cards List */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 min-h-0">
                    {filteredCategories.map((cat) => {
                      const isSelected = selectedCategoryId === cat.id
                      const paperWord = cat.totalPapers === 1 ? '1 Paper' : `${cat.totalPapers} Papers`
                      const infoLine = `${cat.exams.length} Exam / ${paperWord} / Total Questions - ${cat.totalQuestions.toLocaleString()}`

                      return (
                        <div
                          key={cat.id}
                          onClick={() => handleSelectCategory(cat)}
                          className={`px-2.5 py-2 rounded-lg cursor-pointer border transition-all flex items-center justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-indigo-50/90 shadow-xs border-l-4 font-bold'
                              : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-gray-800'
                          }`}
                          style={{
                            borderLeftColor: isSelected ? cat.color : undefined,
                            borderColor: isSelected ? cat.color : undefined,
                            backgroundColor: isSelected ? cat.bgColor : undefined
                          }}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {/* Pinecone Name Badge */}
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide uppercase shrink-0 border"
                              style={{
                                backgroundColor: cat.bgColor,
                                borderColor: cat.borderColor,
                                color: cat.textColor
                              }}
                            >
                              {cat.badge}
                            </span>

                            {/* Details in the SAME line */}
                            <span className="text-[11px] font-medium text-gray-600 truncate">
                              {infoLine}
                            </span>
                          </div>

                          <ChevronRight
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: isSelected ? cat.color : '#9CA3AF' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* WINDOW 2: SELECT EXAMS (Middle 4 cols)               */}
                {/* ---------------------------------------------------- */}
                <div className="lg:col-span-4 flex flex-col min-h-[240px] lg:min-h-0 max-h-[320px] lg:max-h-none overflow-hidden bg-white border-2 border-purple-100/90 rounded-xl p-2.5 shadow-xs">
                  {/* Header 2: Purple Accent */}
                  <div className="flex items-center justify-between px-1 py-1 mb-1.5 bg-purple-50/70 border border-purple-100 rounded-lg shrink-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs">
                        2
                      </span>
                      <span className="text-xs font-black text-purple-950 uppercase tracking-wider truncate">
                        Select Exam
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 truncate shrink-0">
                      {examsInSelectedCategory.length} in {currentCategory?.badge || 'Category'}
                    </span>
                  </div>

                  {/* Sub-Exams Cards List */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 min-h-0">
                    {examsInSelectedCategory.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500">
                        No sub-exams found for this category.
                      </div>
                    ) : (
                      examsInSelectedCategory.map((exam) => {
                        const isSelected = selectedExamObj?.exam_id === exam.exam_id
                        const subMeta = SUB_EXAM_DESCRIPTIONS[exam.exam_id]
                        const fullForm = exam.full_form || subMeta?.title || ''
                        const labelText = fullForm
                          ? `${exam.exam_id} (${fullForm})`
                          : exam.exam_id

                        return (
                          <div
                            key={exam.exam_id}
                            onClick={() => handleSelectExam(exam)}
                            className={`px-3 py-2 rounded-lg cursor-pointer border transition-all flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-purple-50/90 border-purple-500 text-purple-900 font-bold shadow-xs border-l-4'
                                : 'bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 text-gray-800'
                            }`}
                          >
                            <span className="text-xs font-semibold truncate">
                              {labelText}
                            </span>

                            <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* WINDOW 3: SELECT YEAR / PAPER (Right 4 cols)         */}
                {/* ---------------------------------------------------- */}
                <div className="lg:col-span-4 flex flex-col min-h-[260px] lg:min-h-0 max-h-[360px] lg:max-h-none overflow-hidden bg-white border-2 border-gray-800 rounded-xl p-2.5 shadow-xs">
                  {/* Header 3: Sleek Black Accent */}
                  <div className="flex items-center justify-between px-2 py-1.5 mb-1.5 bg-[#111827] border border-gray-800 rounded-lg shrink-0 text-white">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-white text-gray-950 text-[11px] font-black flex items-center justify-center shrink-0 shadow-xs">
                        3
                      </span>
                      <span className="text-xs font-black text-white uppercase tracking-wider truncate">
                        Select Year ({selectedExamObj?.exam_id || 'Exam'})
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-200 border border-gray-700 shrink-0">
                      {selectedExamObj?.years?.length || 0} Papers
                    </span>
                  </div>

                  {/* Papers Container */}
                  <div className="bg-gray-50/80 border border-gray-200 rounded-lg p-2 flex flex-col flex-1 min-h-0 overflow-hidden">
                    <p className="text-[11px] font-bold text-gray-700 mb-1.5 shrink-0">
                      Click on a Year / Paper to select:
                    </p>

                    {/* Compact Years Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
                      {selectedExamObj?.years?.map((yr) => {
                        const isSelected = selectedYearObj?.year_id === yr.year_id
                        return (
                          <button
                            key={yr.year_id}
                            onClick={() => setSelectedYearObj(yr)}
                            className={`p-2 rounded-lg text-left border transition-all flex flex-col justify-between h-[54px] ${
                              isSelected
                                ? 'bg-[#111827] border-black text-white font-bold ring-2 ring-gray-900 shadow-xs'
                                : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <Calendar className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-gray-300' : 'opacity-70'}`} />
                              <span className="text-xs font-bold truncate leading-tight">
                                {yr.label}
                              </span>
                            </div>
                            <span className={`text-[10px] font-semibold ${isSelected ? 'text-gray-300' : 'opacity-75'}`}>
                              {yr.question_count} Qs
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Start Practice Bottom Bar */}
                    <div className="mt-2 pt-2 border-t border-gray-200 bg-white -mx-2 -mb-2 p-2 rounded-b-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shrink-0">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 truncate">
                          {selectedExamObj?.exam_name}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          Paper: <span className="font-semibold text-gray-700">{selectedYearObj?.label}</span> ({selectedYearObj?.question_count || 0} Questions)
                        </p>
                      </div>

                      <button
                        onClick={() => startPracticePaper(selectedExamObj, selectedYearObj)}
                        disabled={!selectedExamObj || !selectedYearObj}
                        className="w-full sm:w-auto px-4 py-2 bg-[#E4572E] hover:bg-[#c8431e] text-white text-xs font-black rounded-lg shadow-sm flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-95 disabled:opacity-40"
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>Start Practice</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 2: COMPACT ACTIVE PRACTICE QUESTION ARENA           */
          /* ======================================================== */
          <div className="flex-1 overflow-hidden p-2.5 sm:p-3 bg-gray-50 flex flex-col lg:flex-row gap-2.5 min-h-0">
            {/* Left: Question Card (~75% or full on mobile) */}
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              {isLoadingQuestions ? (
                <div className="bg-white border border-gray-200 rounded-md p-8 flex flex-col items-center justify-center">
                  <CircularProgress size={28} sx={{ color: '#E4572E', mb: 1.5 }} />
                  <p className="text-xs text-gray-600 font-medium">
                    Loading questions for {selectedExamObj?.exam_id} ({selectedYearObj?.label})...
                  </p>
                </div>
              ) : !currentQuestion ? (
                <div className="bg-white border border-gray-200 rounded-md p-6 text-center">
                  <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-gray-800">No questions found for this paper</h3>
                  <button
                    onClick={() => setIsPracticing(false)}
                    className="mt-2.5 px-3 py-1 bg-[#E4572E] text-white text-xs font-bold rounded"
                  >
                    Select Another Year
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-md p-3 sm:p-4 shadow-sm flex flex-col justify-between">
                  <div>
                    {/* Question Tags & Star */}
                    <div className="flex items-center justify-between mb-2 gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-[#E4572E] rounded">
                          {currentQuestion.exam_name || selectedExamObj?.exam_id}
                        </span>
                        {currentQuestion.subject && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 rounded">
                            {currentQuestion.subject}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">
                          Year {currentQuestion.year || selectedYearObj?.year_id}
                        </span>
                      </div>

                      <button
                        onClick={handleToggleStar}
                        className="p-1 rounded hover:bg-gray-100 border border-gray-200 text-gray-400"
                        title={isCurrentStarred ? 'Remove from Saved PYQs' : 'Save to Dashboard'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isCurrentStarred ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* Question Statement */}
                    <div className="text-xs sm:text-sm font-semibold text-gray-900 leading-relaxed mb-3">
                      <span className="text-[#E4572E] font-extrabold mr-1">
                        Q{currentIndex + 1}.
                      </span>
                      {currentQuestion.question}
                    </div>

                    {/* Options & Image Container: Side-by-Side Flex Layout */}
                    <div className="flex flex-row items-start gap-3 w-full mb-2.5">
                      {/* Options Column (Left ~50% when image exists, 100% when no image) */}
                      <div className={`flex flex-col gap-1.5 ${currentQuestion.img || currentQuestion.image_url ? 'w-1/2' : 'w-full'}`}>
                        {Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
                          currentQuestion.options.map((option, idx) => {
                            const letter = ['A', 'B', 'C', 'D'][idx] || String(idx + 1)
                            const isSelected = currentAttempt?.selectedIndex === idx
                            const isCorrect = currentQuestion.correct_answer === idx
                            const hasAnswered = currentAttempt !== undefined

                            let borderCls = 'border-gray-200 bg-white hover:border-[#E4572E] hover:bg-orange-50/20'
                            let textCls = 'text-gray-800'
                            let badgeCls = 'bg-gray-100 text-gray-700'

                            if (isReviewMode) {
                              // REVIEW MODE (Post-submission): Show correct and incorrect clearly
                              if (isCorrect) {
                                borderCls = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold'
                                badgeCls = 'bg-emerald-500 text-white'
                              } else if (isSelected && !isCorrect) {
                                borderCls = 'border-red-500 bg-red-50 text-red-800'
                                badgeCls = 'bg-red-500 text-white'
                              }
                            } else {
                              // LIVE PRACTICE: Do NOT reveal correct/incorrect. Only indicate user's chosen option
                              if (isSelected) {
                                borderCls = 'border-[#E4572E] bg-orange-50 text-[#E4572E] font-medium ring-1 ring-[#E4572E]'
                                badgeCls = 'bg-[#E4572E] text-white'
                              }
                            }

                            return (
                              <button
                                key={idx}
                                onClick={() => handleSelectOption(idx)}
                                disabled={isReviewMode}
                                className={`w-full p-2 rounded-md border text-left flex items-center gap-2 transition-colors ${borderCls}`}
                              >
                                <span className={`w-5 h-5 rounded text-[10px] font-extrabold flex items-center justify-center shrink-0 ${badgeCls}`}>
                                  {isReviewMode && isCorrect ? (
                                    <Check className="w-3 h-3" />
                                  ) : isReviewMode && isSelected && !isCorrect ? (
                                    <X className="w-3 h-3" />
                                  ) : (
                                    letter
                                  )}
                                </span>
                                <span className="text-xs font-medium leading-snug break-words flex-1">
                                  {option}
                                </span>
                                {isReviewMode && isCorrect && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                    Correct
                                  </span>
                                )}
                                {isReviewMode && isSelected && !isCorrect && (
                                  <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded shrink-0">
                                    Your Answer
                                  </span>
                                )}
                              </button>
                            )
                          })
                        ) : (
                          <span className="text-[11px] text-gray-400">Options not available.</span>
                        )}
                      </div>

                      {/* Question Image (Direct right side ~50%, no container box) */}
                      {(currentQuestion.img || currentQuestion.image_url) && (
                        <div className="w-1/2 flex flex-col items-center gap-1 shrink-0">
                          <img
                            src={formatImageUrl(currentQuestion.img || currentQuestion.image_url)}
                            alt="Question figure"
                            onClick={() => setLightboxImg(formatImageUrl(currentQuestion.img || currentQuestion.image_url))}
                            className="w-full max-h-[190px] object-contain rounded cursor-pointer shadow-sm"
                            onError={(e) => {
                              const raw = currentQuestion.img || currentQuestion.image_url || ''
                              const match = raw.match(/([a-zA-Z0-9_-]{25,})/)
                              if (match && match[1] && !e.target.src.includes('drive.google.com/thumbnail')) {
                                e.target.src = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
                              }
                            }}
                          />
                          <button
                            onClick={() => setLightboxImg(formatImageUrl(currentQuestion.img || currentQuestion.image_url))}
                            className="text-[11px] font-semibold text-gray-600 hover:text-[#E4572E] flex items-center gap-1 py-0.5"
                          >
                            <ZoomIn className="w-3 h-3" />
                            <span>View figure</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Explanation Box (Shows ONLY in Review Mode after submission) */}
                    {isReviewMode && (
                      <div className={`mt-2 p-2.5 rounded-md border text-xs ${
                        currentAttempt === undefined
                          ? 'bg-amber-50/70 border-amber-200'
                          : currentAttempt.isCorrect
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-red-50/60 border-red-200'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          {currentAttempt === undefined ? (
                            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : currentAttempt.isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span className={
                            currentAttempt === undefined
                              ? 'text-amber-800'
                              : currentAttempt.isCorrect
                              ? 'text-emerald-800'
                              : 'text-red-800'
                          }>
                            {currentAttempt === undefined
                              ? 'Not Attempted / Skipped'
                              : currentAttempt.isCorrect
                              ? 'Correct Answer!'
                              : 'Incorrect Answer'}
                          </span>
                        </div>

                        {currentQuestion.explanation && (
                          <p className="text-gray-700 leading-relaxed text-[11px] mt-1">
                            <strong className="text-gray-900">Official Key:</strong> {currentQuestion.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation Buttons: Previous & Next */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className="px-3 py-1 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    {currentIndex < questions.length - 1 ? (
                      <button
                        onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                        className="px-3.5 py-1 bg-[#E4572E] hover:bg-[#c8431e] text-white rounded text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isReviewMode ? (
                      <button
                        onClick={() => {
                          setIsReviewMode(false)
                          setIsPracticing(false)
                        }}
                        className="px-3.5 py-1 bg-gray-900 hover:bg-black text-white rounded text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Exit Review</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleFinishPaper}
                        className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Finish Paper</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Compact Question Navigator Palette (~25%) */}
            <div className="w-full lg:w-60 bg-white border border-gray-200 rounded-md p-2.5 shrink-0 flex flex-col h-fit">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-900">Question Palette</span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {stats.answered}/{questions.length} Attempted
                </span>
              </div>

              <Divider sx={{ my: 1 }} />

              {/* Number Bubbles Grid */}
              <div className="grid grid-cols-6 gap-1 max-h-[220px] overflow-y-auto pr-0.5 mb-2">
                {questions.map((q, idx) => {
                  const qId = getStableQuestionId(q, idx)
                  const att = userAnswers[qId]
                  const isCurrent = currentIndex === idx

                  let bubbleCls = 'bg-gray-100 text-gray-700 border-gray-200'
                  if (att !== undefined) {
                    if (isReviewMode) {
                      if (att.isCorrect) bubbleCls = 'bg-emerald-600 text-white border-emerald-700'
                      else bubbleCls = 'bg-red-500 text-white border-red-600'
                    } else {
                      // During live practice: show marked/attempted without revealing right/wrong
                      bubbleCls = 'bg-[#E4572E] text-white border-[#E4572E]'
                    }
                  }

                  if (isCurrent) {
                    bubbleCls += ' ring-2 ring-blue-600 ring-offset-1'
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-7 rounded text-[11px] font-bold border transition-transform hover:scale-105 flex items-center justify-center ${bubbleCls}`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              {/* Compact Legend */}
              <div className="space-y-1 text-[10px] text-gray-600 pt-1.5 border-t border-gray-100">
                {isReviewMode ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <span>Correct</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span>Incorrect</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300" />
                      <span>Unattempted</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#E4572E]" />
                      <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300" />
                      <span>Unattempted</span>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-600" />
                  <span>Current Question</span>
                </div>
              </div>

              {isReviewMode ? (
                <button
                  onClick={() => {
                    setIsReviewMode(false)
                    setIsPracticing(false)
                  }}
                  className="mt-2.5 w-full py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Exit Review</span>
                </button>
              ) : (
                <button
                  onClick={handleFinishPaper}
                  className="mt-2.5 w-full py-1 border border-[#E4572E] text-[#E4572E] text-xs font-bold rounded hover:bg-orange-50 transition-colors"
                >
                  Submit Paper
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* In-Place Image Lightbox Modal with Close 'X' Button */}
      <Dialog
        open={Boolean(lightboxImg)}
        onClose={() => setLightboxImg(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#000000',
            borderRadius: 3,
            p: 0,
            overflow: 'hidden',
            position: 'relative'
          }
        }}
      >
        <IconButton
          onClick={() => setLightboxImg(null)}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.6)',
            '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' },
            zIndex: 10
          }}
        >
          <X className="w-5 h-5" />
        </IconButton>
        <DialogContent
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 280,
            backgroundColor: '#000000'
          }}
        >
          {lightboxImg && (
            <img
              src={lightboxImg}
              alt="Enlarged figure"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 4
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Session Finish / Summary Dialog */}
      <Dialog
        open={isFinished}
        onClose={() => setIsFinished(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1.5 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            Paper Completed!
          </h3>
          <p className="text-xs text-gray-500">
            Time Taken: {formatTimer(timerSeconds)}
          </p>
        </DialogTitle>

        <DialogContent sx={{ pt: 1.5 }}>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <div className="p-2 text-center bg-gray-50 rounded border border-gray-200">
              <span className="text-base font-bold text-emerald-600 block">{stats.correct}</span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Correct</span>
            </div>
            <div className="p-2 text-center bg-gray-50 rounded border border-gray-200">
              <span className="text-base font-bold text-red-600 block">{stats.wrong}</span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Wrong</span>
            </div>
            <div className="p-2 text-center bg-gray-50 rounded border border-gray-200">
              <span className="text-base font-bold text-gray-800 block">{stats.accuracy}%</span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Accuracy</span>
            </div>
            <div className="p-2 text-center bg-gray-50 rounded border border-gray-200">
              <span className="text-base font-bold text-gray-600 block">{stats.unattempted}</span>
              <span className="text-[10px] text-gray-500 uppercase font-semibold">Skipped</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => {
                setIsFinished(false)
                setIsPracticing(false)
              }}
              className="w-full py-1.5 bg-[#E4572E] text-white text-xs font-bold rounded hover:bg-[#c8431e] transition-colors"
            >
              Choose Another Exam / Year
            </button>
            <button
              onClick={() => {
                setIsFinished(false)
                setIsReviewMode(true)
                setCurrentIndex(0)
              }}
              className="w-full py-1.5 border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50 transition-colors"
            >
              Review Paper Questions (Correct/Wrong/Official Key)
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PracticePYQSection
