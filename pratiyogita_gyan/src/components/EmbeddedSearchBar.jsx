import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, Search, Menu, FileText, Send } from 'lucide-react'
import apiService from '../services/api'
import { useLayout } from '../contexts/LayoutContext'
import PropTypes from 'prop-types'

const EmbeddedSearchBar = ({ onSendMessage, isLoading }) => {
  const { isMobile, toggleSidebar, togglePyq } = useLayout()
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('All Subjects')
  const [showDropdown, setShowDropdown] = useState(false)
  const [availableClasses, setAvailableClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('All Classes')
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

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject)
    setShowDropdown(false)
  }

  const handleClassSelect = (selectedClassLabel) => {
    setSelectedClass(selectedClassLabel)
    setShowClassDropdown(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const query = inputValue.trim()
    if (!query || isLoading) return
    
    // Convert subject name to the format expected by the API
    let subjectId = 'all'
    if (selectedSubject !== 'All Subjects') {
      subjectId = selectedSubject.toLowerCase()
    }
    
    let selectedClassValue = null
    if (selectedClass !== 'All Classes') {
      const classNumMatch = selectedClass.match(/(6|7|8|9|10|11|12)/)
      if (classNumMatch) {
        selectedClassValue = `class-${classNumMatch[1]}`
      }
    }

    const answerLength = answerLengthModes[answerLengthIndex]?.value || 'normal'

    onSendMessage(query, {
      subject: subjectId,
      selectedClass: selectedClassValue,
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
            <span className="whitespace-nowrap truncate max-w-[80px]">
              {isLoadingSubjects ? 'Loading...' : selectedSubject}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-white" />
          </button>

          {showDropdown && !isLoadingSubjects && (
            <div className="absolute bottom-full left-0 mb-1 w-40 rounded-lg shadow-lg border border-gray-200 bg-white z-[60]">
              <div className="py-1 max-h-48 overflow-y-auto">
                {availableSubjects.map((subject, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSubjectSelect(subject)}
                    className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                    style={{
                      color: '#1F2933',
                      fontWeight: selectedSubject === subject ? '600' : '400',
                      backgroundColor: selectedSubject === subject ? 'rgba(228, 87, 46, 0.08)' : 'transparent'
                    }}
                  >
                    {subject}
                  </button>
                ))}
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
            <span className="whitespace-nowrap truncate max-w-[70px]">
              {isLoadingClasses ? 'Loading...' : selectedClass}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-white" />
          </button>

          {showClassDropdown && !isLoadingClasses && (
            <div className="absolute bottom-full left-0 mb-1 w-36 rounded-lg shadow-lg border border-gray-200 bg-white z-[60]">
              <div className="py-1 max-h-48 overflow-y-auto">
                {availableClasses.map((classLabel, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleClassSelect(classLabel)}
                    className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 transition-colors"
                    style={{
                      color: '#1F2933',
                      fontWeight: selectedClass === classLabel ? '600' : '400',
                      backgroundColor: selectedClass === classLabel ? 'rgba(228, 87, 46, 0.08)' : 'transparent'
                    }}
                  >
                    {classLabel}
                  </button>
                ))}
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
