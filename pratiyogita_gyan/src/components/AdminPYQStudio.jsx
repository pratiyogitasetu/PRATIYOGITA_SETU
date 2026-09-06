import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  InputBase,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Database,
  UploadCloud,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  FileJson,
  Layers,
  ChevronDown,
  Sparkles,
  Server,
  BookOpen,
  Eye,
  AlertTriangle,
  X,
  Check,
  Copy,
  Download
} from 'lucide-react'
import apiService from '../services/api'
import { useLayout } from '../contexts/LayoutContext'

const CATEGORY_CONFIG = {
  DEFENCE_EXAMS: { index: 'pyq1', color: '#E4572E' },
  CIVIL_SERVICES_EXAMS: { index: 'pyq1', color: '#7C3AED' },
  POLICE_EXAMS: { index: 'pyq1', color: '#0891B2' },
  SSC_EXAMS: { index: 'pyq2', color: '#D97706' },
  RAILWAY_EXAMS: { index: 'pyq2', color: '#2563EB' },
  BANKING_EXAMS: { index: 'pyq2', color: '#059669' },
  MBA_EXAMS: { index: 'pyq3', color: '#C026D3' },
  CUET_AND_UG_ENTRANCE_EXAMS: { index: 'pyq3', color: '#0284C7' },
  PG_EXAMS: { index: 'pyq3', color: '#4F46E5' },
  ENGINEERING_RECRUITING_EXAMS: { index: 'pyq4', color: '#4338CA' },
  TEACHING_EXAMS: { index: 'pyq4', color: '#E11D48' },
  JUDICIARY_EXAMS: { index: 'pyq4', color: '#B45309' }
}

const AdminPYQStudio = ({ onClose, onNavigateToPractice }) => {
  const { contentOffsetLeft, isMobile } = useLayout()

  const [activeTab, setActiveTab] = useState(0)
  const [inventory, setInventory] = useState(null)
  const [isLoadingInventory, setIsLoadingInventory] = useState(true)
  const [inventoryError, setInventoryError] = useState('')

  // 3-Step Selection State for Live Inventory (Main Exam -> Exam -> Years)
  const [selectedMainExam, setSelectedMainExam] = useState('DEFENCE_EXAMS')
  const [selectedExamId, setSelectedExamId] = useState('AFCAT')
  const [selectedYearId, setSelectedYearId] = useState('ALL')

  // Upload Form State
  const [uploadCategory, setUploadCategory] = useState('DEFENCE_EXAMS')
  const [uploadExamId, setUploadExamId] = useState('AFCAT')
  const [uploadYear, setUploadYear] = useState('2024')
  const [uploadTerm, setUploadTerm] = useState('1')
  const [jsonInput, setJsonInput] = useState('')
  const [parsedQuestions, setParsedQuestions] = useState([])
  const [validationError, setValidationError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('')

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteStatusMsg, setDeleteStatusMsg] = useState('')

  // Inspect / View Questions Dialog State
  const [inspectModalOpen, setInspectModalOpen] = useState(false)
  const [inspectTarget, setInspectTarget] = useState(null)
  const [inspectQuestions, setInspectQuestions] = useState([])
  const [isLoadingInspectQuestions, setIsLoadingInspectQuestions] = useState(false)
  const [inspectError, setInspectError] = useState('')
  const [inspectSearchQuery, setInspectSearchQuery] = useState('')
  const [inspectCopied, setInspectCopied] = useState(false)

  const handleCopyInspectJson = () => {
    if (!inspectQuestions || inspectQuestions.length === 0) return
    const dataToCopy = filteredInspectQuestions.length > 0 ? filteredInspectQuestions : inspectQuestions
    navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2))
    setInspectCopied(true)
    setTimeout(() => setInspectCopied(false), 2000)
  }

  const handleDownloadInspectJson = () => {
    if (!inspectQuestions || inspectQuestions.length === 0) return
    const dataToSave = filteredInspectQuestions.length > 0 ? filteredInspectQuestions : inspectQuestions
    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${inspectTarget?.exam_id || 'EXAM'}_${inspectTarget?.year_id || 'YEAR'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 2000 to Latest Year Options for Dropdown
  const YEAR_OPTIONS = useMemo(() => {
    const currentYear = new Date().getFullYear() + 1 // up to 2027
    const years = []
    for (let y = currentYear; y >= 2000; y--) {
      years.push(String(y))
    }
    return years
  }, [])

  // Term 1 to Term 10 + Annual Options
  const ROMAN_NUMERALS = useMemo(() => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'], [])

  const TERM_OPTIONS = useMemo(() => [
    ...Array.from({ length: 10 }, (_, i) => {
      const val = String(i + 1)
      return {
        value: val,
        label: `Paper ${val} (Term ${ROMAN_NUMERALS[i]})`
      }
    }),
    { value: 'Annual', label: 'Annual (Single Paper)' }
  ], [ROMAN_NUMERALS])

  // Fetch Inventory from Pinecone & Catalog
  const fetchInventory = useCallback(async () => {
    setIsLoadingInventory(true)
    setInventoryError('')
    try {
      const res = await apiService.getAdminInventory()
      if (res?.status === 'success') {
        setInventory(res)
      } else {
        setInventoryError(res?.error || 'Failed to load inventory')
      }
    } catch (err) {
      setInventoryError(err.message || 'Error connecting to backend')
    } finally {
      setIsLoadingInventory(false)
    }
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // Compute Target Year ID for the upload form
  const targetYearId = useMemo(() => {
    if (!uploadYear) return ''
    if (uploadTerm && uploadTerm !== 'Annual' && uploadTerm !== '0') {
      return `${uploadYear}_${uploadTerm}`
    }
    return uploadYear
  }, [uploadYear, uploadTerm])

  // Map of terms already uploaded for currently selected category + exam + year
  const uploadedTermsForSelectedExamAndYear = useMemo(() => {
    if (!inventory?.catalog || !uploadCategory || !uploadExamId || !uploadYear) {
      return new Map()
    }
    const examObj = inventory.catalog.find(
      (e) => e.category === uploadCategory && e.exam_id?.toUpperCase() === uploadExamId?.trim().toUpperCase()
    )
    if (!examObj || !Array.isArray(examObj.years)) {
      return new Map()
    }

    const map = new Map()
    for (const y of examObj.years) {
      const yId = String(y.year_id || '')
      if (yId === String(uploadYear)) {
        map.set('Annual', y.question_count || 0)
      } else if (yId.startsWith(`${uploadYear}_`)) {
        const termPart = yId.split('_')[1]
        if (termPart) {
          map.set(termPart, y.question_count || 0)
        }
      }
    }
    return map
  }, [inventory, uploadCategory, uploadExamId, uploadYear])

  // Automatically switch uploadTerm to the first unblocked term if current term is blocked
  useEffect(() => {
    if (uploadedTermsForSelectedExamAndYear.has(uploadTerm)) {
      const firstAvailable = TERM_OPTIONS.find((t) => !uploadedTermsForSelectedExamAndYear.has(t.value))
      if (firstAvailable) {
        setUploadTerm(firstAvailable.value)
      }
    }
  }, [uploadedTermsForSelectedExamAndYear, uploadTerm, TERM_OPTIONS])

  // Parse and validate JSON input
  const handleJsonChange = (text) => {
    setJsonInput(text)
    setValidationError('')
    setUploadSuccessMsg('')

    if (!text.trim()) {
      setParsedQuestions([])
      return
    }

    try {
      const parsed = JSON.parse(text)
      let list = []

      if (Array.isArray(parsed)) {
        list = parsed
      } else if (typeof parsed === 'object') {
        // Find first array of objects with questions
        for (const k of Object.keys(parsed)) {
          if (Array.isArray(parsed[k])) {
            list = parsed[k]
            break
          }
          if (typeof parsed[k] === 'object') {
            for (const subK of Object.keys(parsed[k])) {
              if (Array.isArray(parsed[k][subK])) {
                list = parsed[k][subK]
                break
              }
            }
          }
        }
      }

      if (list.length === 0) {
        setValidationError('Could not find any questions array in this JSON. Expected an array of questions: [{ question: "...", options: {...}, correct_option: "a" }]')
        setParsedQuestions([])
        return
      }

      // Check first item structure
      const sample = list[0]
      if (!sample.question || typeof sample.question !== 'string') {
        setValidationError('Question objects must have a string "question" field.')
        setParsedQuestions([])
        return
      }
      if (!sample.options) {
        setValidationError('Question objects must have an "options" field.')
        setParsedQuestions([])
        return
      }

      setParsedQuestions(list)
    } catch (err) {
      setValidationError(`Invalid JSON syntax: ${err.message}`)
      setParsedQuestions([])
    }
  }

  // File Upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        handleJsonChange(content)
      }
    }
    reader.readAsText(file)
  }

  // Handle Upload Submission to Pinecone
  const handleSubmitUpload = async () => {
    if (!uploadCategory || !uploadExamId || parsedQuestions.length === 0) return

    setIsUploading(true)
    setUploadSuccessMsg('')
    setValidationError('')

    const yearId = targetYearId
    const yearLabel = uploadTerm && uploadTerm !== 'Annual' && uploadTerm !== '0'
      ? `${uploadYear} (Paper ${uploadTerm})`
      : uploadYear

    try {
      const payload = {
        category: uploadCategory,
        exam_id: uploadExamId,
        year_id: yearId,
        year_label: yearLabel,
        questions: parsedQuestions
      }

      const res = await apiService.uploadAdminPaper(payload)
      if (res?.status === 'success') {
        setUploadSuccessMsg(res.message || `Successfully published ${parsedQuestions.length} questions to Pinecone!`)
        setJsonInput('')
        setParsedQuestions([])
        // Refresh live inventory
        fetchInventory()
      } else {
        setValidationError(res?.error || 'Upload failed')
      }
    } catch (err) {
      setValidationError(err.message || 'Error submitting paper to backend')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle Delete Confirmation
  const confirmDeletePaper = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteStatusMsg('')
    try {
      const res = await apiService.deleteAdminPaper({
        category: deleteTarget.category,
        exam_id: deleteTarget.exam_id,
        year_id: deleteTarget.year_id
      })
      if (res?.status === 'success') {
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
        fetchInventory()
      } else {
        setDeleteStatusMsg(res?.error || 'Failed to delete paper')
      }
    } catch (err) {
      setDeleteStatusMsg(err.message || 'Error deleting from Pinecone')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle Opening Inspect Questions Modal (Retrieve data directly from Pinecone in JSON format)
  const handleOpenInspectModal = async (paper) => {
    setInspectTarget(paper)
    setInspectModalOpen(true)
    setIsLoadingInspectQuestions(true)
    setInspectError('')
    setInspectSearchQuery('')
    try {
      const res = await apiService.getPaperQuestions({
        category: paper.category,
        exam_id: paper.exam_id,
        year: paper.year_id
      })
      if (res?.status === 'success') {
        const rawList = (Array.isArray(res.raw_questions) && res.raw_questions.length > 0)
          ? res.raw_questions
          : (Array.isArray(res.questions) ? res.questions : [])

        // Normalize each question into pristine standard JSON format
        const cleanList = rawList.map((item) => {
          let opts = item.options
          if (Array.isArray(opts)) {
            const letters = ['a', 'b', 'c', 'd', 'e', 'f']
            opts = {}
            item.options.forEach((opt, idx) => {
              opts[letters[idx] || `opt_${idx + 1}`] = opt
            })
          }

          let correctAns = item.correct_answer
          if (typeof correctAns === 'number' && Array.isArray(item.options) && item.options[correctAns]) {
            correctAns = item.options[correctAns]
          }

          return {
            question: item.question || '',
            options: opts || {},
            correct_option: item.correct_option ? String(item.correct_option).toLowerCase() : '',
            correct_answer: correctAns || '',
            explanation: item.explanation || '',
            exam_name: item.exam_name || paper.exam_id || '',
            exam_year: item.year || item.exam_year || paper.year_id?.split('_')[0] || '',
            exam_term: item.term || item.exam_term || (paper.year_id?.includes('_') ? paper.year_id?.split('_')[1] : '') || '',
            subject: item.subject || '',
            topic: item.topic || ''
          }
        })
        setInspectQuestions(cleanList)
      } else {
        setInspectError(res?.error || 'Failed to load paper questions from Pinecone')
      }
    } catch (err) {
      setInspectError(err.message || 'Error fetching questions from Pinecone')
    } finally {
      setIsLoadingInspectQuestions(false)
    }
  }

  // Available Exams under the selected Main Exam
  const availableExamsForCategory = useMemo(() => {
    if (!inventory?.catalog) return []
    return inventory.catalog.filter((item) => item.category === selectedMainExam)
  }, [inventory, selectedMainExam])

  // Sync selectedExamId when selectedMainExam changes or catalog loads
  useEffect(() => {
    if (availableExamsForCategory.length > 0) {
      const exists = availableExamsForCategory.some((e) => e.exam_id === selectedExamId)
      if (!exists) {
        setSelectedExamId(availableExamsForCategory[0].exam_id)
        setSelectedYearId('ALL')
      }
    } else {
      setSelectedExamId('')
      setSelectedYearId('ALL')
    }
  }, [availableExamsForCategory, selectedExamId])

  // Current Exam object
  const currentExamObj = useMemo(() => {
    return availableExamsForCategory.find((e) => e.exam_id === selectedExamId) || null
  }, [availableExamsForCategory, selectedExamId])

  // Available Years for the selected Exam
  const availableYearsForExam = useMemo(() => {
    return currentExamObj?.years || []
  }, [currentExamObj])

  // Filtered Years based on selectedYearId
  const displayedYears = useMemo(() => {
    if (!currentExamObj?.years) return []
    if (selectedYearId === 'ALL') return currentExamObj.years
    return currentExamObj.years.filter((yr) => yr.year_id === selectedYearId)
  }, [currentExamObj, selectedYearId])

  // Filtered Questions in Inspect Modal (searches whole JSON representation)
  const filteredInspectQuestions = useMemo(() => {
    if (!inspectQuestions) return []
    if (!inspectSearchQuery.trim()) return inspectQuestions
    const q = inspectSearchQuery.toLowerCase()
    return inspectQuestions.filter((item) => {
      return JSON.stringify(item).toLowerCase().includes(q)
    })
  }, [inspectQuestions, inspectSearchQuery])

  return (
    <Box
      className="admin-studio-page flex-1 transition-all duration-300"
      style={{
        paddingTop: isMobile ? '60px' : '64px',
        marginLeft: `${contentOffsetLeft}px`,
        width: `calc(100% - ${contentOffsetLeft + (isMobile ? 0 : 8)}px)`,
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#0B0A08',
        color: '#F3F4F6'
      }}
    >
      {/* Top Studio Header */}
      <Box
        sx={{
          py: 1.5,
          px: { xs: 2, md: 4 },
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'rgba(17, 16, 13, 0.95)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          zIndex: 10
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: '#9CA3AF',
              bgcolor: 'rgba(255,255,255,0.05)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#FFF' }
            }}
          >
            <ArrowLeft size={18} />
          </IconButton>
          <Box
            sx={{
              p: 0.8,
              borderRadius: 2,
              bgcolor: 'rgba(228, 87, 46, 0.15)',
              color: '#E4572E',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Database size={20} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1rem', md: '1.15rem' },
                fontFamily: '"Fredoka", sans-serif',
                color: '#FFF',
                letterSpacing: '0.02em',
                lineHeight: 1.2
              }}
            >
              Admin PYQ Studio
            </Typography>
            <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
              Offline / Local Pinecone Vector Manager
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            onClick={fetchInventory}
            startIcon={<RefreshCw size={14} className={isLoadingInventory ? 'animate-spin' : ''} />}
            sx={{
              borderColor: 'rgba(255,255,255,0.15)',
              color: '#E5E7EB',
              fontSize: '0.75rem',
              borderRadius: 2,
              px: 1.5,
              '&:hover': { borderColor: '#E4572E', bgcolor: 'rgba(228, 87, 46, 0.08)' }
            }}
          >
            Refresh Pinecone
          </Button>

          {onNavigateToPractice && (
            <Button
              size="small"
              variant="contained"
              onClick={onNavigateToPractice}
              startIcon={<BookOpen size={14} />}
              sx={{
                bgcolor: '#E4572E',
                color: '#FFF',
                fontSize: '0.75rem',
                borderRadius: 2,
                px: 1.8,
                '&:hover': { bgcolor: '#C2410C' }
              }}
            >
              Go to Practice Arena
            </Button>
          )}
        </Stack>
      </Box>

      {/* Tabs Header */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          bgcolor: 'rgba(20, 18, 15, 0.6)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{
            minHeight: 48,
            '& .MuiTabs-indicator': { backgroundColor: '#E4572E', height: 3, borderRadius: '3px 3px 0 0' },
            '& .MuiTab-root': {
              color: '#9CA3AF',
              textTransform: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              minHeight: 48,
              px: 2,
              '&.Mui-selected': { color: '#E4572E' }
            }
          }}
        >
          <Tab icon={<Layers size={16} />} iconPosition="start" label="Pinecone Live Inventory" />
          <Tab icon={<UploadCloud size={16} />} iconPosition="start" label="1-Click JSON Uploader" />
        </Tabs>
      </Box>

      {/* Main Scrollable Content Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2, md: 2.5 } }}>
        {/* ============================================================== */}
        {/* TAB 0: INVENTORY & CATALOG (COMPACT DENSE VIEW)               */}
        {/* ============================================================== */}
        {activeTab === 0 && (
          <Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Top Metric Cards - Sleek & Compact */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 1.2
              }}
            >
              <Paper
                sx={{
                  p: 1.2,
                  px: 1.8,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2
                }}
              >
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'rgba(228, 87, 46, 0.15)', color: '#E4572E', display: 'flex' }}>
                  <Database size={18} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem', display: 'block', lineHeight: 1.1 }}>
                    Total Vectors
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#FFF', fontSize: '1rem', lineHeight: 1.2 }}>
                    {inventory?.total_vectors_all?.toLocaleString() || '4,190+'}
                  </Typography>
                </Box>
              </Paper>

              <Paper
                sx={{
                  p: 1.2,
                  px: 1.8,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2
                }}
              >
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex' }}>
                  <Server size={18} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem', display: 'block', lineHeight: 1.1 }}>
                    Pinecone Indexes
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#FFF', fontSize: '1rem', lineHeight: 1.2 }}>
                    4 Indexes (pyq1 - pyq4)
                  </Typography>
                </Box>
              </Paper>

              <Paper
                sx={{
                  p: 1.2,
                  px: 1.8,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.2
                }}
              >
                <Box sx={{ p: 0.8, borderRadius: 1.5, bgcolor: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', display: 'flex' }}>
                  <BookOpen size={18} />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem', display: 'block', lineHeight: 1.1 }}>
                    Available Exams
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#FFF', fontSize: '1rem', lineHeight: 1.2 }}>
                    {inventory?.catalog?.length || 15} Exams
                  </Typography>
                </Box>
              </Paper>
            </Box>

            {/* Simple 3-Step Selection Bar: 1. Main Exam -> 2. Exam -> 3. Years */}
            <Paper
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.2fr 1fr 1fr' },
                  gap: 1.8,
                  alignItems: 'center'
                }}
              >
                {/* Step 1: Main Exam (Category) */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#E4572E',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      mb: 0.8,
                      letterSpacing: '0.02em'
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: '#E4572E',
                        color: '#FFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 800
                      }}
                    >
                      1
                    </Box>
                    MAIN EXAM (CATEGORY)
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={selectedMainExam}
                      onChange={(e) => {
                        setSelectedMainExam(e.target.value)
                        setSelectedYearId('ALL')
                      }}
                      sx={{
                        height: 40,
                        bgcolor: 'rgba(255,255,255,0.04)',
                        color: '#FFF',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E4572E' }
                      }}
                    >
                      {Object.keys(CATEGORY_CONFIG).map((catKey) => {
                        const cfg = CATEGORY_CONFIG[catKey]
                        return (
                          <MenuItem key={catKey} value={catKey} sx={{ fontSize: '0.8rem' }}>
                            {catKey} ({cfg.index})
                          </MenuItem>
                        )
                      })}
                    </Select>
                  </FormControl>
                </Box>

                {/* Step 2: Exam */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#60A5FA',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      mb: 0.8,
                      letterSpacing: '0.02em'
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: '#2563EB',
                        color: '#FFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 800
                      }}
                    >
                      2
                    </Box>
                    EXAM
                  </Typography>
                  <FormControl size="small" fullWidth disabled={availableExamsForCategory.length === 0}>
                    <Select
                      value={selectedExamId}
                      onChange={(e) => {
                        setSelectedExamId(e.target.value)
                        setSelectedYearId('ALL')
                      }}
                      sx={{
                        height: 40,
                        bgcolor: 'rgba(255,255,255,0.04)',
                        color: '#FFF',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#2563EB' }
                      }}
                    >
                      {availableExamsForCategory.map((ex) => (
                        <MenuItem key={ex.exam_id} value={ex.exam_id} sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {ex.exam_id} ({ex.total_questions || 0} Qs)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Step 3: Year / Paper */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#34D399',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      mb: 0.8,
                      letterSpacing: '0.02em'
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: '#059669',
                        color: '#FFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 800
                      }}
                    >
                      3
                    </Box>
                    YEARS / PAPERS
                  </Typography>
                  <FormControl size="small" fullWidth disabled={availableYearsForExam.length === 0}>
                    <Select
                      value={selectedYearId}
                      onChange={(e) => setSelectedYearId(e.target.value)}
                      sx={{
                        height: 40,
                        bgcolor: 'rgba(255,255,255,0.04)',
                        color: '#FFF',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#10B981' }
                      }}
                    >
                      <MenuItem value="ALL" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        All Uploaded Years ({availableYearsForExam.length})
                      </MenuItem>
                      {availableYearsForExam.map((yr) => (
                        <MenuItem key={yr.year_id} value={yr.year_id} sx={{ fontSize: '0.82rem' }}>
                          {yr.label || yr.year_id} ({yr.question_count || 0} Qs)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Paper>

            {/* Results: Selected Exam Details & Years List */}
            {isLoadingInventory ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <CircularProgress size={28} sx={{ color: '#E4572E', mb: 1.5 }} />
                <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block' }}>
                  Loading Pinecone inventory...
                </Typography>
              </Box>
            ) : inventoryError ? (
              <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#FCA5A5', py: 0.5, px: 1.5 }}>
                {inventoryError}
              </Alert>
            ) : currentExamObj ? (
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5
                }}
              >
                {/* Header Banner */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, pb: 1.2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFF', fontSize: '1.05rem' }}>
                      {currentExamObj.exam_id}
                    </Typography>
                    <Chip
                      size="small"
                      label={CATEGORY_CONFIG[selectedMainExam]?.index || 'pyq?'}
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        bgcolor: `${CATEGORY_CONFIG[selectedMainExam]?.color || '#9CA3AF'}22`,
                        color: CATEGORY_CONFIG[selectedMainExam]?.color || '#9CA3AF',
                        border: `1px solid ${CATEGORY_CONFIG[selectedMainExam]?.color || '#9CA3AF'}44`
                      }}
                    />
                    <Chip
                      size="small"
                      label={`${currentExamObj.total_questions || 0} Total Qs`}
                      sx={{
                        height: 20,
                        bgcolor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10B981',
                        fontWeight: 700,
                        fontSize: '0.68rem'
                      }}
                    />
                  </Stack>

                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.74rem' }}>
                    Namespace: <strong>{selectedMainExam}</strong> &bull; Showing {displayedYears.length} of {availableYearsForExam.length} Papers
                  </Typography>
                </Box>

                {/* Years / Papers Grid */}
                {displayedYears.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <AlertCircle size={28} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
                    <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.82rem' }}>
                      No papers uploaded for {selectedExamId} in Pinecone.
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setUploadCategory(selectedMainExam)
                        setUploadExamId(selectedExamId)
                        setActiveTab(1)
                      }}
                      startIcon={<UploadCloud size={14} />}
                      sx={{ mt: 1.5, borderColor: '#E4572E', color: '#E4572E', borderRadius: 2, textTransform: 'none', fontSize: '0.76rem' }}
                    >
                      Upload JSON Papers for {selectedExamId}
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)'
                      },
                      gap: 1.2
                    }}
                  >
                    {displayedYears.map((yr) => (
                      <Box
                        key={yr.year_id}
                        sx={{
                          p: 1.4,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          transition: 'all 0.15s',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 1.2,
                          '&:hover': {
                            borderColor: 'rgba(52, 211, 153, 0.3)',
                            bgcolor: 'rgba(255,255,255,0.04)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FFF', fontSize: '0.88rem' }}>
                            {yr.label || yr.year_id}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${yr.question_count || 0} Qs`}
                            sx={{
                              height: 19,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: 'rgba(255,255,255,0.06)',
                              color: '#D1D5DB'
                            }}
                          />
                        </Box>

                        <Stack direction="row" spacing={0.8} alignItems="center" sx={{ pt: 0.8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          {/* Retrieve JSON Button */}
                          <Button
                            fullWidth
                            size="small"
                            variant="contained"
                            onClick={() =>
                              handleOpenInspectModal({
                                category: selectedMainExam,
                                exam_id: selectedExamId,
                                year_id: yr.year_id,
                                label: yr.label || yr.year_id,
                                question_count: yr.question_count || 0
                              })
                            }
                            startIcon={<FileJson size={13} />}
                            sx={{
                              bgcolor: 'rgba(16, 185, 129, 0.15)',
                              color: '#34D399',
                              border: '1px solid rgba(52, 211, 153, 0.3)',
                              borderRadius: 1.5,
                              py: 0.4,
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              boxShadow: 'none',
                              '&:hover': {
                                bgcolor: '#10B981',
                                color: '#FFF',
                                boxShadow: 'none'
                              }
                            }}
                          >
                            Retrieve JSON
                          </Button>

                          {/* Delete Button */}
                          <Tooltip title={`Delete ${selectedExamId} ${yr.label || yr.year_id} from Pinecone`}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setDeleteTarget({
                                  category: selectedMainExam,
                                  exam_id: selectedExamId,
                                  year_id: yr.year_id,
                                  label: yr.label || yr.year_id
                                })
                                setDeleteStatusMsg('')
                                setDeleteDialogOpen(true)
                              }}
                              sx={{
                                color: '#9CA3AF',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 1.5,
                                p: 0.5,
                                '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }
                              }}
                            >
                              <Trash2 size={13} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 2 }}>
                <AlertCircle size={28} color="#9CA3AF" style={{ margin: '0 auto 6px' }} />
                <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                  Please choose a Main Exam and Exam from the dropdowns above.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* ============================================================== */}
        {/* TAB 1: 1-CLICK UPLOADER (2-COLUMN SIDE-BY-SIDE NO-SCROLL)     */}
        {/* ============================================================== */}
        {activeTab === 1 && (
          <Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Global Alerts */}
            {uploadSuccessMsg && (
              <Alert severity="success" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#A7F3D0', borderRadius: 2, py: 0.5, px: 1.5 }}>
                {uploadSuccessMsg}
              </Alert>
            )}

            {validationError && (
              <Alert severity="error" sx={{ bgcolor: 'rgba(239, 68, 68, 0.15)', color: '#FCA5A5', borderRadius: 2, py: 0.5, px: 1.5 }}>
                {validationError}
              </Alert>
            )}

            {/* 2-COLUMN GRID:
                LEFT COLUMN = Instructions banner + Duplicate warning + Step 1 Form
                RIGHT COLUMN = Step 2 Questions JSON + Textarea + Upload Button
            */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1.2fr', lg: '4.8fr 7.2fr' },
                gap: 2,
                alignItems: 'start'
              }}
            >
              {/* ================= LEFT COLUMN: Instructions, Warning & Step 1 ================= */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Instructions Banner */}
                <Paper
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(228, 87, 46, 0.08)',
                    border: '1px solid rgba(228, 87, 46, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}
                >
                  <Sparkles size={20} color="#E4572E" style={{ flexShrink: 0 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FFF', fontSize: '0.82rem', lineHeight: 1.2 }}>
                      Pinecone Cloud Vector Uploader (Offline Mode)
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#D1D5DB', fontSize: '0.74rem', lineHeight: 1.35, display: 'block', mt: 0.3 }}>
                      1. Select details on left &bull; 2. Paste or drop JSON on right &bull; 3. Direct cloud vector embedding
                    </Typography>
                  </Box>
                </Paper>

                {/* Step 1 Card: Exam & Paper Details */}
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.75
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#E4572E' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#FFF', fontSize: '0.9rem' }}>
                      Step 1: Exam & Paper Details
                    </Typography>
                  </Box>

                  {/* Category Selector */}
                  <FormControl size="small" fullWidth>
                    <InputLabel sx={{ color: '#9CA3AF' }}>Category</InputLabel>
                    <Select
                      value={uploadCategory}
                      label="Category"
                      onChange={(e) => setUploadCategory(e.target.value)}
                      sx={{
                        color: '#FFF',
                        bgcolor: 'rgba(255,255,255,0.04)',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }
                      }}
                    >
                      {Object.keys(CATEGORY_CONFIG).map((cKey) => (
                        <MenuItem key={cKey} value={cKey}>
                          {cKey} ({CATEGORY_CONFIG[cKey].index})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Exam ID */}
                  <TextField
                    size="small"
                    label="Exam ID (e.g. AFCAT, NDA, CDS)"
                    value={uploadExamId}
                    onChange={(e) => setUploadExamId(e.target.value.toUpperCase())}
                    fullWidth
                    InputLabelProps={{ sx: { color: '#9CA3AF' } }}
                    sx={{
                      '& input': { color: '#FFF', fontWeight: 600 },
                      bgcolor: 'rgba(255,255,255,0.04)',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }
                    }}
                  />

                  {/* Year Dropdown & Paper / Term */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel sx={{ color: '#9CA3AF' }}>Year</InputLabel>
                      <Select
                        value={uploadYear}
                        label="Year"
                        onChange={(e) => setUploadYear(e.target.value)}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 280,
                              bgcolor: '#181613',
                              color: '#FFF',
                              borderRadius: 2,
                              border: '1px solid rgba(255,255,255,0.1)'
                            }
                          }
                        }}
                        sx={{
                          color: '#FFF',
                          bgcolor: 'rgba(255,255,255,0.04)',
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }
                        }}
                      >
                        {YEAR_OPTIONS.map((yr) => (
                          <MenuItem key={yr} value={yr}>
                            {yr}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth>
                      <InputLabel sx={{ color: '#9CA3AF' }}>Paper / Term</InputLabel>
                      <Select
                        value={uploadTerm}
                        label="Paper / Term"
                        onChange={(e) => setUploadTerm(e.target.value)}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 320,
                              bgcolor: '#181613',
                              color: '#FFF',
                              borderRadius: 2,
                              border: '1px solid rgba(255,255,255,0.1)'
                            }
                          }
                        }}
                        sx={{
                          color: '#FFF',
                          bgcolor: 'rgba(255,255,255,0.04)',
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' }
                        }}
                      >
                        {TERM_OPTIONS.map((item) => {
                          const qCount = uploadedTermsForSelectedExamAndYear.get(item.value)
                          const isBlocked = qCount !== undefined
                          return (
                            <MenuItem
                              key={item.value}
                              value={item.value}
                              disabled={isBlocked}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.8rem',
                                py: 0.8,
                                ...(isBlocked && {
                                  opacity: '0.45 !important',
                                  bgcolor: 'rgba(239, 68, 68, 0.08) !important',
                                  color: '#9CA3AF !important',
                                  cursor: 'not-allowed !important'
                                })
                              }}
                            >
                              <span>{item.label}</span>
                              {isBlocked && (
                                <Chip
                                  size="small"
                                  label={`Blocked (${qCount} Qs)`}
                                  sx={{
                                    height: 18,
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    bgcolor: 'rgba(239, 68, 68, 0.2)',
                                    color: '#FCA5A5',
                                    border: '1px solid rgba(239, 68, 68, 0.4)'
                                  }}
                                />
                              )}
                            </MenuItem>
                          )
                        })}
                      </Select>
                    </FormControl>
                  </Box>
                </Paper>
              </Box>

              {/* ================= RIGHT COLUMN: Step 2 & JSON Upload ================= */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#FFF', fontSize: '0.9rem' }}>
                        Step 2: Questions JSON
                      </Typography>
                    </Box>

                    <Button
                      component="label"
                      size="small"
                      variant="outlined"
                      startIcon={<FileJson size={14} />}
                      sx={{
                        borderColor: '#E4572E',
                        color: '#E4572E',
                        borderRadius: 2,
                        fontSize: '0.74rem',
                        py: 0.35,
                        px: 1.2,
                        '&:hover': { bgcolor: 'rgba(228, 87, 46, 0.1)', borderColor: '#E4572E' }
                      }}
                    >
                      Choose JSON File
                      <input type="file" accept=".json" hidden onChange={handleFileUpload} />
                    </Button>
                  </Box>

                  <TextField
                    multiline
                    minRows={6}
                    maxRows={8}
                    value={jsonInput}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder='Paste JSON array here...'
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.35)',
                      borderRadius: 2,
                      '& textarea': {
                        color: '#E5E7EB',
                        fontFamily: 'monospace',
                        fontSize: '0.78rem',
                        lineHeight: 1.45
                      },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                    }}
                  />

                  {/* Validation Success Badge */}
                  {parsedQuestions.length > 0 && (
                    <Box
                      sx={{
                        p: 1.2,
                        borderRadius: 2,
                        bgcolor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 1
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CheckCircle2 size={16} color="#10B981" />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#A7F3D0', fontSize: '0.8rem' }}>
                          {parsedQuestions.length} Valid Questions Detected!
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
                        Target: {uploadCategory} &bull; {uploadExamId} ({uploadYear})
                      </Typography>
                    </Box>
                  )}

                  {/* Sample Question Preview Accordion */}
                  {parsedQuestions.length > 0 && (
                    <Accordion
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px !important',
                        color: '#FFF',
                        '&:before': { display: 'none' }
                      }}
                    >
                      <AccordionSummary expandIcon={<ChevronDown size={15} color="#9CA3AF" />} sx={{ minHeight: 36, py: 0 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#D1D5DB' }}>
                          Preview First Question (#{1} of {parsedQuestions.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, maxHeight: 160, overflowY: 'auto' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.8, color: '#F3F4F6', fontSize: '0.78rem' }}>
                          {parsedQuestions[0].question}
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, mb: 0.8 }}>
                          {parsedQuestions[0].options &&
                            Object.entries(parsedQuestions[0].options).map(([k, v]) => (
                              <Typography
                                key={k}
                                variant="caption"
                                sx={{
                                  color: k === parsedQuestions[0].correct_option ? '#34D399' : '#9CA3AF',
                                  fontWeight: k === parsedQuestions[0].correct_option ? 700 : 400
                                }}
                              >
                                ({k}) {v}
                              </Typography>
                            ))}
                        </Box>
                        {parsedQuestions[0].explanation && (
                          <Typography variant="caption" sx={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.72rem' }}>
                            Explanation: {parsedQuestions[0].explanation}
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Action Upload Button */}
                  <Button
                    variant="contained"
                    disabled={parsedQuestions.length === 0 || isUploading}
                    onClick={handleSubmitUpload}
                    startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <UploadCloud size={18} />}
                    sx={{
                      py: 1.1,
                      bgcolor: '#E4572E',
                      color: '#FFF',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      borderRadius: 2,
                      '&:hover': { bgcolor: '#C2410C' },
                      '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }
                    }}
                  >
                    {isUploading
                      ? 'Embedding & Uploading to Pinecone...'
                      : `Upload ${parsedQuestions.length} Questions to Pinecone`}
                  </Button>
                </Paper>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* ============================================================== */}
      {/* INSPECT QUESTIONS MODAL (RETRIEVED PINECONE DATA IN JSON)      */}
      {/* ============================================================== */}
      <Dialog
        open={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0D0C0A',
            color: '#FFF',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.12)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle
          sx={{
            py: 1.5,
            px: 3,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <FileJson size={20} color="#34D399" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#FFF', fontSize: '1rem' }}>
                {inspectTarget?.exam_id} &bull; {inspectTarget?.label}
              </Typography>
              <Chip
                size="small"
                label={`${inspectQuestions.length} Questions (JSON)`}
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
              Directly retrieved from Pinecone index [{inspectTarget?.category}]
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="outlined"
              onClick={handleCopyInspectJson}
              disabled={inspectQuestions.length === 0}
              startIcon={inspectCopied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              sx={{
                borderColor: inspectCopied ? '#10B981' : 'rgba(255,255,255,0.15)',
                color: inspectCopied ? '#10B981' : '#E5E7EB',
                fontSize: '0.74rem',
                textTransform: 'none',
                py: 0.4,
                px: 1.2,
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' }
              }}
            >
              {inspectCopied ? 'Copied JSON!' : 'Copy JSON'}
            </Button>

            <Button
              size="small"
              variant="outlined"
              onClick={handleDownloadInspectJson}
              disabled={inspectQuestions.length === 0}
              startIcon={<Download size={14} />}
              sx={{
                borderColor: 'rgba(255,255,255,0.15)',
                color: '#E5E7EB',
                fontSize: '0.74rem',
                textTransform: 'none',
                py: 0.4,
                px: 1.2,
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' }
              }}
            >
              Download .json
            </Button>

            <IconButton
              size="small"
              onClick={() => setInspectModalOpen(false)}
              sx={{ color: '#9CA3AF', '&:hover': { color: '#FFF', bgcolor: 'rgba(255,255,255,0.08)' } }}
            >
              <X size={18} />
            </IconButton>
          </Stack>
        </DialogTitle>

        {/* Filter bar inside JSON */}
        <Box sx={{ p: 1.2, px: 3, borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 1.5,
              py: 0.35,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              flex: 1,
              maxWidth: 400
            }}
          >
            <Search size={14} color="#9CA3AF" />
            <InputBase
              placeholder="Search keyword in retrieved JSON..."
              value={inspectSearchQuery}
              onChange={(e) => setInspectSearchQuery(e.target.value)}
              sx={{ ml: 1, color: '#FFF', fontSize: '0.78rem', flex: 1 }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.72rem' }}>
            {filteredInspectQuestions.length} of {inspectQuestions.length} questions matching
          </Typography>
        </Box>

        <DialogContent sx={{ p: 2, bgcolor: '#070605', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {isLoadingInspectQuestions ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <CircularProgress size={32} sx={{ color: '#E4572E', mb: 2 }} />
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                Retrieving JSON directly from Pinecone Cloud database...
              </Typography>
            </Box>
          ) : inspectError ? (
            <Alert severity="error" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#FCA5A5', m: 2 }}>
              {inspectError}
            </Alert>
          ) : filteredInspectQuestions.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <AlertCircle size={30} color="#9CA3AF" style={{ margin: '0 auto 8px' }} />
              <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                No questions found in this paper.
              </Typography>
            </Box>
          ) : (
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 2,
                borderRadius: 2,
                bgcolor: '#0B0A08',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#34D399',
                fontFamily: '"Fira Code", "Courier New", Consolas, monospace',
                fontSize: '0.78rem',
                lineHeight: 1.55,
                overflowX: 'auto',
                overflowY: 'auto',
                maxHeight: '62vh',
                whiteSpace: 'pre',
                '&::-webkit-scrollbar': { width: 6, height: 6 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 3 }
              }}
            >
              <code>{JSON.stringify(filteredInspectQuestions, null, 2)}</code>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 1.5, px: 3, borderTop: '1px solid rgba(255,255,255,0.08)', justifyContent: 'space-between' }}>
          <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.74rem' }}>
            Format: Raw JSON Array retrieved directly from Pinecone vector metadata
          </Typography>
          <Button
            onClick={() => setInspectModalOpen(false)}
            variant="outlined"
            size="small"
            sx={{ color: '#9CA3AF', borderColor: 'rgba(255,255,255,0.15)', textTransform: 'none', borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION DIALOG                                    */}
      {/* ============================================================== */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#181613',
            color: '#FFF',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: { xs: '90%', sm: 420 }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AlertCircle size={20} />
          Delete Paper from Pinecone?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#D1D5DB', mb: 2 }}>
            Are you sure you want to delete <strong>{deleteTarget?.exam_id}</strong> ({deleteTarget?.label}) from namespace <strong>{deleteTarget?.category}</strong>?
          </Typography>
          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
            This will wipe the vectors for this specific paper from Pinecone Cloud database. Other papers will not be affected.
          </Typography>
          {deleteStatusMsg && (
            <Alert severity="error" sx={{ mt: 2, bgcolor: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>
              {deleteStatusMsg}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={isDeleting}
            sx={{ color: '#9CA3AF', textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeletePaper}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={15} color="inherit" /> : <Trash2 size={15} />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminPYQStudio
