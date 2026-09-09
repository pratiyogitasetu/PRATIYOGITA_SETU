import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, Search, Menu, FileText, Send, Check } from 'lucide-react'
import apiService from '../services/api'
import { useLayout } from '../contexts/LayoutContext'
import PropTypes from 'prop-types'

const EmbeddedSearchBar = ({ onSendMessage, isLoading }) => {
  const { isMobile, toggleSidebar, togglePyq } = useLayout()
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState(['All Subjects'])
  const [showDropdown, setShowDropdown] = useState(false)
  const [availableClasses, setAvailableClasses] = useState([])
  const [selectedClasses, setSelectedClasses] = useState(['All Classes'])
  const [showClassDropdown, setShowClassDropdown] = useState(false)
  const [showLengthDropdown, setShowLengthDropdown] = useState(false)
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [answerLengthIndex, setAnswerLengthIndex] = useState(2)
  const subjectDropdownRef = useRef(null)
  const classDropdownRef = useRef(null)
  const lengthDropdownRef = useRef(null)
  const textareaRef = useRef(null)

  const answerLengthModes = [
    { value: 'very_short', label: 'Very Short' },
    { value: 'short', label: 'Short' },
    { value: 'normal', label: 'Normal' },
    { value: 'explanatory', label: 'Explanatory' }
  ]

  // Load available subjects from Pinecone
  const loadAvailableSubjects = async () => {
    setIsLoadingSubjects(true)
    try {
      console.log('🔍 EmbeddedSearchBar: Loading available subjects...')
      const response = await apiService.getBooks()
      console.log('📚 EmbeddedSearchBar: Books response:', response)

      const indexedBooks = response.filter(book => book.total_chunks > 0)
      console.log('✅ EmbeddedSearchBar: Indexed books:', indexedBooks)

      // Create subject list with indexed subjects only
      const subjects = ['All Subjects'] // Always include "All Subjects"
      indexedBooks.forEach(book => {
        // Extract subject name from title (e.g., "NCERT Geography" -> "Geography")
        const subjectName = book.title.replace('NCERT ', '')
        if (!subjects.includes(subjectName)) {
          subjects.push(subjectName)
        }
      })

      console.log('🎯 EmbeddedSearchBar: Final subjects list:', subjects)
      setAvailableSubjects(subjects)
    } catch (error) {
      console.error('❌ EmbeddedSearchBar: Failed to load available subjects:', error)
      // Fallback to show only "All Subjects" if API fails
      setAvailableSubjects(['All Subjects'])
    } finally {
      setIsLoadingSubjects(false)
    }
  }

  // Load class options for class-specific retrieval
  const loadClassOptions = async () => {
    setIsLoadingClasses(true)
    try {
      const response = await apiService.getClassOptions()
      const classList = Array.isArray(response?.classes) ? response.classes : []
      const classes = ['All Classes', ...classList.map((item) => item.label)]
      setAvailableClasses(classes)
    } catch (error) {
      console.error('❌ EmbeddedSearchBar: Failed to load class options:', error)
      setAvailableClasses(['All Classes'])
    } finally {
      setIsLoadingClasses(false)
    }
  }

  // Load subjects on component mount
  useEffect(() => {
    loadAvailableSubjects()
    loadClassOptions()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target)) {
        setShowClassDropdown(false)
      }
      if (lengthDropdownRef.current && !lengthDropdownRef.current.contains(event.target)) {
        setShowLengthDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Multi-select helpers for subjects
  const isSubjectSelected = (subject) => {
    if (subject === 'All Subjects') {
      return selectedSubjects.length === 0 || selectedSubjects.includes('All Subjects')
    }
    if (selectedSubjects.length === 0 || selectedSubjects.includes('All Subjects')) {
      return true
    }
    return selectedSubjects.includes(subject)
  }

  const handleToggleSubject = (subject) => {
    const nonAllSubjects = availableSubjects.filter(s => s !== 'All Subjects')
    if (subject === 'All Subjects') {
      if (selectedSubjects.includes('All Subjects') || selectedSubjects.length === 0 || selectedSubjects.length === nonAllSubjects.length) {
        setSelectedSubjects([])
      } else {
        setSelectedSubjects(['All Subjects'])
      }
      return
    }

    let currentList = (selectedSubjects.includes('All Subjects') || selectedSubjects.length === 0)
      ? [...nonAllSubjects]
      : [...selectedSubjects]

    if (currentList.includes(subject)) {
      currentList = currentList.filter(s => s !== subject)
    } else {
      currentList.push(subject)
    }

    if (currentList.length === 0) {
      setSelectedSubjects([])
    } else if (nonAllSubjects.length > 0 && currentList.length === nonAllSubjects.length) {
      setSelectedSubjects(['All Subjects'])
    } else {
      setSelectedSubjects(currentList)
    }
  }

  const getSubjectButtonLabel = () => {
    const nonAllSubjects = availableSubjects.filter(s => s !== 'All Subjects')
    if (selectedSubjects.includes('All Subjects') || (nonAllSubjects.length > 0 && selectedSubjects.length === nonAllSubjects.length)) {
      return 'All Subjects'
    }
    if (selectedSubjects.length === 0) {
      return 'No Subject'
    }
    if (selectedSubjects.length === 1) {
      return selectedSubjects[0]
    }
    return `${selectedSubjects.length} Subjects`
  }

  // Multi-select helpers for classes
  const isClassSelected = (classLabel) => {
    if (classLabel === 'All Classes') {
      return selectedClasses.length === 0 || selectedClasses.includes('All Classes')
    }
    if (selectedClasses.length === 0 || selectedClasses.includes('All Classes')) {
      return true
    }
    return selectedClasses.includes(classLabel)
  }

  const handleToggleClass = (classLabel) => {
    const nonAllClasses = availableClasses.filter(c => c !== 'All Classes')
    if (classLabel === 'All Classes') {
      if (selectedClasses.includes('All Classes') || selectedClasses.length === 0 || selectedClasses.length === nonAllClasses.length) {
        setSelectedClasses([])
      } else {
        setSelectedClasses(['All Classes'])
      }
      return
    }

    let currentList = (selectedClasses.includes('All Classes') || selectedClasses.length === 0)
      ? [...nonAllClasses]
      : [...selectedClasses]

    if (currentList.includes(classLabel)) {
      currentList = currentList.filter(c => c !== classLabel)
    } else {
      currentList.push(classLabel)
    }

    if (currentList.length === 0) {
      setSelectedClasses([])
    } else if (nonAllClasses.length > 0 && currentList.length === nonAllClasses.length) {
      setSelectedClasses(['All Classes'])
    } else {
      setSelectedClasses(currentList)
    }
  }

  const getClassButtonLabel = () => {
    const nonAllClasses = availableClasses.filter(c => c !== 'All Classes')
    if (selectedClasses.includes('All Classes') || (nonAllClasses.length > 0 && selectedClasses.length === nonAllClasses.length)) {
      return 'All Classes'
    }
    if (selectedClasses.length === 0) {
      return 'No Class'
    }
    if (selectedClasses.length === 1) {
      return selectedClasses[0]
    }
    return `${selectedClasses.length} Classes`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const query = inputValue.trim()
    if (!query || isLoading) return

    // Convert subject names
    const nonAllSubjects = availableSubjects.filter(s => s !== 'All Subjects')
    const isAllSubjects = selectedSubjects.includes('All Subjects') || 
                          selectedSubjects.length === 0 || 
                          (nonAllSubjects.length > 0 && selectedSubjects.length === nonAllSubjects.length)
    
    let subjectId = 'all'
    let subjectList = ['all']
    if (!isAllSubjects) {
      subjectList = selectedSubjects.map(s => s.toLowerCase())
      subjectId = subjectList.length === 1 ? subjectList[0] : subjectList.join(',')
    }

    // Convert class names
    const nonAllClasses = availableClasses.filter(c => c !== 'All Classes')
    const isAllClasses = selectedClasses.includes('All Classes') || 
                         selectedClasses.length === 0 || 
                         (nonAllClasses.length > 0 && selectedClasses.length === nonAllClasses.length)

    let selectedClassValue = null
    let classList = []
    if (!isAllClasses) {
      classList = selectedClasses.map(c => {
        const match = c.match(/(6|7|8|9|10|11|12)/)
        return match ? `class-${match[1]}` : c.toLowerCase()
      })
      selectedClassValue = classList.length === 1 ? classList[0] : classList
    }

    const answerLength = answerLengthModes[answerLengthIndex]?.value || 'normal'

    onSendMessage(query, {
      subject: subjectId,
      subjects: subjectList,
      selectedSubject: subjectId,
      selectedSubjects: subjectList,
      selectedClass: selectedClassValue,
      selectedClasses: classList,
      classes: classList,
      answerLength
    })
    setInputValue('')
    requestAnimationFrame(adjustTextareaHeight)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = useCallback(() => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    el.style.height = 'auto'
    const viewportLimit = window.innerHeight * 0.3
    const maxHeight = isMobile ? viewportLimit : Math.min(viewportLimit, 180)
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [isMobile])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue, adjustTextareaHeight])

  return (
    <div className="w-full mx-auto p-3 rounded-2xl border border-gray-200 bg-white shadow-xl flex flex-col gap-2">
      {/* 3 Buttons Row at top, with orange BG */}
      <div className="flex flex-wrap items-center gap-1.5 min-w-0 justify-start px-1">
        {/* Subject Selector */}
        <div className="relative" ref={subjectDropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center justify-between space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors duration-200 hover:bg-[#d9522b]"
            style={{
              borderColor: '#E4572E',
              backgroundColor: '#E4572E',
              color: '#FFFFFF'
            }}
            disabled={isLoadingSubjects}
          >
            <span className="whitespace-nowrap truncate max-w-[90px]">
              {isLoadingSubjects ? 'Loading...' : getSubjectButtonLabel()}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-white" />
          </button>

          {showDropdown && !isLoadingSubjects && (
            <div className="absolute bottom-full left-0 mb-1 w-44 rounded-lg shadow-lg border border-gray-200 bg-white z-[60] py-1">
              <div className="max-h-52 overflow-y-auto">
                {availableSubjects.map((subject, index) => {
                  const isChecked = isSubjectSelected(subject)
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleToggleSubject(subject)}
                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-left"
                      style={{
                        backgroundColor: isChecked ? 'rgba(228, 87, 46, 0.06)' : 'transparent'
                      }}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                          isChecked
                            ? 'bg-[#E4572E] border-[#E4572E] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span
                        className="truncate text-xs"
                        style={{
                          color: '#1F2933',
                          fontWeight: isChecked ? '600' : '400'
                        }}
                      >
                        {subject}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Class Selector */}
        <div className="relative" ref={classDropdownRef}>
          <button
            type="button"
            onClick={() => setShowClassDropdown(!showClassDropdown)}
            className="flex items-center justify-between space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors duration-200 hover:bg-[#d9522b]"
            style={{
              borderColor: '#E4572E',
              backgroundColor: '#E4572E',
              color: '#FFFFFF'
            }}
            disabled={isLoadingClasses}
          >
            <span className="whitespace-nowrap truncate max-w-[80px]">
              {isLoadingClasses ? 'Loading...' : getClassButtonLabel()}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-white" />
          </button>

          {showClassDropdown && !isLoadingClasses && (
            <div className="absolute bottom-full left-0 mb-1 w-40 rounded-lg shadow-lg border border-gray-200 bg-white z-[60] py-1">
              <div className="max-h-52 overflow-y-auto">
                {availableClasses.map((classLabel, index) => {
                  const isChecked = isClassSelected(classLabel)
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleToggleClass(classLabel)}
                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-left"
                      style={{
                        backgroundColor: isChecked ? 'rgba(228, 87, 46, 0.06)' : 'transparent'
                      }}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                          isChecked
                            ? 'bg-[#E4572E] border-[#E4572E] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span
                        className="truncate text-xs"
                        style={{
                          color: '#1F2933',
                          fontWeight: isChecked ? '600' : '400'
                        }}
                      >
                        {classLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Answer Length Selector */}
        <div className="relative" ref={lengthDropdownRef}>
          <button
            type="button"
            onClick={() => setShowLengthDropdown(!showLengthDropdown)}
            className="flex items-center justify-between space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-colors duration-200 hover:bg-[#d9522b]"
            style={{
              borderColor: '#E4572E',
              backgroundColor: '#E4572E',
              color: '#FFFFFF'
            }}
          >
            <span className="whitespace-nowrap">
              {answerLengthModes[answerLengthIndex]?.label} Length
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-white" />
          </button>

          {showLengthDropdown && (
            <div className="absolute bottom-full left-0 mb-1 w-36 rounded-lg shadow-lg border border-gray-200 bg-white z-[60]">
              <div className="py-1">
                {answerLengthModes.map((mode, idx) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => {
                      setAnswerLengthIndex(idx)
                      setShowLengthDropdown(false)
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                    style={{
                      color: '#1F2933',
                      fontWeight: answerLengthIndex === idx ? '600' : '400',
                      backgroundColor: answerLengthIndex === idx ? 'rgba(228, 87, 46, 0.08)' : 'transparent'
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ChatGPT style search input row */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[768px] mx-auto rounded-xl border border-gray-200 p-1.5 pr-2 pl-3 flex items-center gap-2 transition-colors duration-200 focus-within:border-[#E4572E] focus-within:ring-1 focus-within:ring-[#E4572E]"
        style={{
          backgroundColor: '#FFFFFF'
        }}
      >
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              requestAnimationFrame(adjustTextareaHeight)
            }}
            onKeyDown={handleKeyPress}
            placeholder="Ask a question..."
            className="w-full py-1 text-xs rounded-md focus:outline-none resize-none bg-transparent"
            style={{
              color: '#1F2933',
              caretColor: '#E4572E',
              minHeight: 24,
              maxHeight: '120px',
              overflowY: 'auto',
              transition: 'height 0.1s ease-out'
            }}
            disabled={isLoading}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:scale-95 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: '#E4572E',
            color: '#FFFFFF'
          }}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  )
}

export default EmbeddedSearchBar

EmbeddedSearchBar.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired
}
