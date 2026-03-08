import React, { useState } from 'react'
import { 
  CheckCircle, 
  RefreshCw,
  FileText,
  XCircle,
  User,
  Calendar,
  BookOpen,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useLayout } from '../contexts/LayoutContext'

const EligibilitySection = () => {
  const { theme } = useTheme()
  const { sidebarVisible, isMobile } = useLayout()
  
  // Calculate dynamic margins based on sidebar visibility
  const leftMargin = isMobile
    ? 'ml-0'
    : sidebarVisible
      ? 'ml-52 sm:ml-60 md:ml-68'
      : 'ml-12'

  // State for filters and data
  const [selectedExam, setSelectedExam] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Mock data - replace with actual API calls later
  const examOptions = [
    { id: 'all', name: 'All Exams' },
    { id: 'upsc_cse', name: 'UPSC CSE' },
    { id: 'capf', name: 'CAPF' },
    { id: 'cds', name: 'CDS' },
    { id: 'mppsc', name: 'MPPSC' },
    { id: 'uppcs', name: 'UPPCS' },
    { id: 'bpsc', name: 'BPSC' }
  ]

  const mockEligibilityData = [
    {
      id: 'upsc_cse',
      name: 'UPSC Civil Services Examination',
      eligibilityStatus: 'eligible',
      maxAttempts: 6,
      attemptsUsed: 2,
      ageLimit: '21-32 years',
      educationRequired: 'Bachelor\'s Degree',
      nextExamDate: '2025-06-08',
      registrationDeadline: '2025-03-15',
      details: {
        age: { min: 21, max: 32, relaxation: 'Age relaxation available for reserved categories' },
        education: 'Graduate from recognized university',
        nationality: 'Indian citizen or eligible foreigner',
        attempts: 'General: 6, OBC: 9, SC/ST: No limit'
      }
    },
    {
      id: 'capf',
      name: 'Central Armed Police Forces',
      eligibilityStatus: 'eligible',
      maxAttempts: 8,
      attemptsUsed: 1,
      ageLimit: '20-25 years',
      educationRequired: 'Bachelor\'s Degree',
      nextExamDate: '2025-08-15',
      registrationDeadline: '2025-05-20',
      details: {
        age: { min: 20, max: 25, relaxation: 'Age relaxation for reserved categories' },
        education: 'Bachelor\'s degree in any discipline',
        nationality: 'Indian citizen',
        attempts: 'General: 8, OBC: 11, SC/ST: No limit'
      }
    },
    {
      id: 'cds',
      name: 'Combined Defence Services',
      eligibilityStatus: 'not_eligible',
      maxAttempts: 4,
      attemptsUsed: 4,
      ageLimit: '19-24 years',
      educationRequired: 'Bachelor\'s Degree',
      nextExamDate: '2025-04-20',
      registrationDeadline: '2025-02-10',
      details: {
        age: { min: 19, max: 24, relaxation: 'No age relaxation' },
        education: 'Bachelor\'s degree for IMA/INA, Intermediate for AFA',
        nationality: 'Indian citizen',
        attempts: 'General: 4 attempts only'
      }
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'eligible': return 'text-green-600 bg-green-100'
      case 'not_eligible': return 'text-red-600 bg-red-100'
      case 'partial': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'eligible': return <CheckCircle className="w-5 h-5" />
      case 'not_eligible': return <XCircle className="w-5 h-5" />
      case 'partial': return <AlertTriangle className="w-5 h-5" />
      default: return <FileText className="w-5 h-5" />
    }
  }

  const filteredExams = selectedExam === 'all' 
    ? mockEligibilityData 
    : mockEligibilityData.filter(exam => exam.id === selectedExam)

  return (
    <div className={`flex-1 ${leftMargin} mr-0 md:mr-4 flex flex-col h-full overflow-hidden pl-2 pr-2 pb-2`}>
      {/* Main Container */}
      <div className="flex-1 bg-white border border-gray-400 rounded-lg shadow-sm flex flex-col overflow-hidden">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 flex-shrink-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <CheckCircle className="w-8 h-8 mr-3" style={{ color: theme.colors.primary }} />
                  Check Eligibility & Attempts
                </h1>
                <p className="text-gray-600 mt-1">
                  Check your eligibility status and track remaining attempts for competitive exams
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                    {filteredExams.filter(exam => exam.eligibilityStatus === 'eligible').length}
                  </div>
                  <div className="text-sm text-gray-600">Eligible Exams</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {examOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
              <div className="text-sm text-gray-600">
                Showing {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        
      </div>
    </div>
  )
}

export default EligibilitySection