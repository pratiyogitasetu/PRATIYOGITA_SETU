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
    <div 
      className="w-full mx-auto p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl flex flex-col gap-2 transition-all duration-300"
      style={{
        backgroundColor: '#262626',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 12px 36px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)'
      }}
    >
      {/* 3 Buttons Row at top (Sleek Dark Glass Pills) */}
      <div className="flex flex-wrap items-center gap-1.5 min-w-0 justify-start px-0.5">
        {/* Subject Selector */}
        <div className="relative" ref={subjectDropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center justify-between space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200 hover:bg-white/15 active:scale-95"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.16)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#f3f4f6'
            }}
            disabled={isLoadingSubjects}
          >
            <span className="whitespace-nowrap truncate max-w-[90px]">
              {isLoadingSubjects ? 'Loading...' : selectedSubject}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-white/70" />
          </button>

          {showDropdown && !isLoadingSubjects && (
            <div 
              className="absolute bottom-full left-0 mb-2 w-44 rounded-xl shadow-2xl overflow-hidden z-[70] py-1 max-h-52 overflow-y-auto"
              style={{
                backgroundColor: '#262626',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
              }}
            >
              {availableSubjects.map((subject, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSubjectSelect(subject)}
                  className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/10"
                  style={{
                    color: selectedSubject === subject ? '#E4572E' : '#f3f4f6',
                    fontWeight: selectedSubject === subject ? '700' : '400',
                    backgroundColor: selectedSubject === subject ? 'rgba(228, 87, 46, 0.15)' : 'transparent'
                  }}
                >
                  {subject}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Class Selector */}
        <div className="relative" ref={classDropdownRef}>
          <button
            type="button"
            onClick={() => setShowClassDropdown(!showClassDropdown)}
            className="flex items-center justify-between space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200 hover:bg-white/15 active:scale-95"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.16)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#f3f4f6'
            }}
            disabled={isLoadingClasses}
          >
            <span className="whitespace-nowrap truncate max-w-[80px]">
              {isLoadingClasses ? 'Loading...' : selectedClass}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-white/70" />
          </button>

          {showClassDropdown && !isLoadingClasses && (
            <div 
              className="absolute bottom-full left-0 mb-2 w-40 rounded-xl shadow-2xl overflow-hidden z-[70] py-1 max-h-52 overflow-y-auto"
              style={{
                backgroundColor: '#262626',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
              }}
            >
              {availableClasses.map((classLabel, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleClassSelect(classLabel)}
                  className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/10"
                  style={{
                    color: selectedClass === classLabel ? '#E4572E' : '#f3f4f6',
                    fontWeight: selectedClass === classLabel ? '700' : '400',
                    backgroundColor: selectedClass === classLabel ? 'rgba(228, 87, 46, 0.15)' : 'transparent'
                  }}
                >
                  {classLabel}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Answer Length Selector */}
        <div className="relative" ref={lengthDropdownRef}>
          <button
            type="button"
            onClick={() => setShowLengthDropdown(!showLengthDropdown)}
            className="flex items-center justify-between space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200 hover:bg-white/15 active:scale-95"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.16)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#f3f4f6'
            }}
          >
            <span className="whitespace-nowrap">
              {answerLengthModes[answerLengthIndex]?.label} Length
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-white/70" />
          </button>

          {showLengthDropdown && (
            <div 
              className="absolute bottom-full left-0 mb-2 w-40 rounded-xl shadow-2xl overflow-hidden z-[70] py-1"
              style={{
                backgroundColor: '#262626',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
              }}
            >
              {answerLengthModes.map((mode, idx) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => {
                    setAnswerLengthIndex(idx)
                    setShowLengthDropdown(false)
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/10"
                  style={{
                    color: answerLengthIndex === idx ? '#E4572E' : '#f3f4f6',
                    fontWeight: answerLengthIndex === idx ? '700' : '400',
                    backgroundColor: answerLengthIndex === idx ? 'rgba(228, 87, 46, 0.15)' : 'transparent'
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dark sleek search input row */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[768px] mx-auto rounded-xl p-1.5 pr-2 pl-3 flex items-center gap-2 transition-all duration-200 focus-within:border-[#E4572E] focus-within:ring-1 focus-within:ring-[#E4572E]"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
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
            className="w-full py-1 text-xs sm:text-sm rounded-md focus:outline-none resize-none bg-transparent placeholder:text-gray-400"
            style={{
              color: '#ffffff',
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
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:scale-95 hover:scale-105 active:scale-95 shadow-md"
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
