import React, { useState } from 'react'
import { 
  GraduationCap, 
  RefreshCw,
  FileText,
  XCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useLayout } from '../contexts/LayoutContext'

const SyllabusSection = () => {
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
  const [expandedSections, setExpandedSections] = useState({})
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

  const mockSyllabusData = [
    {
      id: 'upsc_cse',
      name: 'UPSC Civil Services Examination',
      papers: [
        {
          id: 'prelims',
          name: 'Preliminary Examination',
          subjects: [
            {
              id: 'gs_paper1',
              name: 'General Studies Paper I',
              topics: [
                {
                  id: 'history',
                  name: 'History of India and Indian National Movement',
                  subtopics: [
                    'Ancient India',
                    'Medieval India', 
                    'Modern India',
                    'Freedom Struggle',
                    'Post-Independence Consolidation'
                  ]
                },
                {
                  id: 'geography',
                  name: 'Indian and World Geography',
                  subtopics: [
                    'Physical Geography',
                    'Human Geography',
                    'Indian Geography',
                    'World Geography',
                    'Environmental Geography'
                  ]
                },
                {
                  id: 'polity',
                  name: 'Indian Polity and Governance',
                  subtopics: [
                    'Constitution',
                    'Political System',
                    'Panchayati Raj',
                    'Public Policy',
                    'Rights Issues'
                  ]
                }
              ]
            },
            {
              id: 'gs_paper2',
              name: 'General Studies Paper II (CSAT)',
              topics: [
                {
                  id: 'reasoning',
                  name: 'Comprehension and Reasoning',
                  subtopics: [
                    'Reading Comprehension',
                    'Logical Reasoning',
                    'Analytical Ability',
                    'Decision Making',
                    'Problem Solving'
                  ]
                },
                {
                  id: 'math',
                  name: 'Basic Numeracy',
                  subtopics: [
                    'Numbers and their relations',
                    'Order of magnitude',
                    'Data Interpretation',
                    'Statistics',
                    'Mental Ability'
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'mains',
          name: 'Main Examination',
          subjects: [
            {
              id: 'essay',
              name: 'Essay Paper',
              topics: [
                {
                  id: 'essay_topics',
                  name: 'Essay Writing',
                  subtopics: [
                    'Social Issues',
                    'Economic Issues',
                    'Political Issues',
                    'Environmental Issues',
                    'Ethical Issues'
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'capf',
      name: 'Central Armed Police Forces',
      papers: [
        {
          id: 'paper1',
          name: 'Paper I - General Ability and Intelligence',
          subjects: [
            {
              id: 'reasoning',
              name: 'Reasoning',
              topics: [
                {
                  id: 'logical_reasoning',
                  name: 'Logical Reasoning',
                  subtopics: [
                    'Analogies',
                    'Similarities',
                    'Differences',
                    'Space Visualization',
                    'Problem Solving'
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'paper2',
          name: 'Paper II - General Studies, Essay and Comprehension',
          subjects: [
            {
              id: 'general_studies',
              name: 'General Studies',
              topics: [
                {
                  id: 'current_affairs',
                  name: 'Current Affairs',
                  subtopics: [
                    'National Affairs',
                    'International Affairs',
                    'Sports',
                    'Awards',
                    'Books and Authors'
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const filteredSyllabus = selectedExam === 'all' 
    ? mockSyllabusData 
    : mockSyllabusData.filter(exam => exam.id === selectedExam)

  const getTotalTopics = (papers) => {
    return papers.reduce((total, paper) => {
      return total + paper.subjects.reduce((subTotal, subject) => {
        return subTotal + subject.topics.length
      }, 0)
    }, 0)
  }

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
                  <GraduationCap className="w-8 h-8 mr-3" style={{ color: theme.colors.primary }} />
                  Exam Syllabus
                </h1>
                <p className="text-gray-600 mt-1">
                  Comprehensive syllabus for competitive examinations
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
                    {filteredSyllabus.length}
                  </div>
                  <div className="text-sm text-gray-600">Available Syllabi</div>
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
                Showing {filteredSyllabus.length} syllabus{filteredSyllabus.length !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        
      </div>
    </div>
  )
}

export default SyllabusSection
