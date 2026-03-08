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
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [answerLengthIndex, setAnswerLengthIndex] = useState(2)
  const subjectDropdownRef = useRef(null)
  const classDropdownRef = useRef(null)
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
    <div className="w-full mx-auto px-2 md:px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[1280px] mx-auto rounded-2xl shadow-sm p-1.5"
        style={{
          backgroundColor: '#FFFFFF',
          border: isMobile ? 'none' : '1px solid #E3E7ED'
        }}
      >
        {!isMobile ? (
          <div className="px-2 pb-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 w-full">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-bold shrink-0" style={{ color: '#52616B' }}>
                  Answer
                </span>
                <div className="flex items-center rounded-lg p-0.5 gap-1 flex-wrap min-w-0" style={{ backgroundColor: '#F4F6F8' }}>
                  {answerLengthModes.map((mode, idx) => (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setAnswerLengthIndex(idx)}
                      disabled={isLoading}
                      className="rounded-md transition-all whitespace-nowrap text-[10px] px-2.5 py-1 font-semibold"
                      style={{
                        color: answerLengthIndex === idx ? '#1F2933' : '#6B7280',
                        fontWeight: answerLengthIndex === idx ? 700 : 600,
                        backgroundColor: answerLengthIndex === idx ? 'rgba(58, 124, 165, 0.18)' : 'transparent',
                        border: answerLengthIndex === idx ? '1px solid rgba(58, 124, 165, 0.35)' : '1px solid transparent'
                      }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative" ref={subjectDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-between space-x-1 px-2.5 py-1.5 rounded-md text-xs hover:opacity-90 transition-opacity min-w-[110px]"
                  style={{ backgroundColor: '#3A7CA5', color: '#FFFFFF' }}
                  disabled={isLoadingSubjects}
                >
                  <span className="whitespace-nowrap truncate text-xs font-bold">
                    {isLoadingSubjects
                      ? 'Loading...'
                      : selectedSubject === 'All Subjects'
                        ? 'Subject'
                        : selectedSubject.length > 12
                          ? selectedSubject.substring(0, 12) + '...'
                          : selectedSubject}
                  </span>
                  <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${
                    showDropdown ? 'rotate-180' : ''
                  }`} />
                </button>

                {showDropdown && !isLoadingSubjects && (
                  <div className="absolute bottom-full right-0 mb-1 w-44 rounded-md shadow-lg z-[60]" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E3E7ED' }}>
                    <div className="py-1">
                      {availableSubjects.map((subject, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSubjectSelect(subject)}
                          className="w-full text-left px-2 py-1.5 text-xs transition-colors"
                          style={{
                            backgroundColor: selectedSubject === subject ? 'rgba(58, 124, 165, 0.12)' : 'transparent',
                            color: '#1F2933',
                            fontWeight: selectedSubject === subject ? '600' : '400'
                          }}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={classDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                  className="flex items-center justify-between space-x-1 px-2.5 py-1.5 rounded-md text-xs hover:opacity-90 transition-opacity min-w-[110px]"
                  style={{ backgroundColor: '#0E7490', color: '#FFFFFF' }}
                  disabled={isLoadingClasses}
                >
                  <span className="whitespace-nowrap truncate text-xs font-bold">
                    {isLoadingClasses ? 'Loading...' : selectedClass === 'All Classes' ? 'Class' : selectedClass.replace('Class ', 'C-')}
                  </span>
                  <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${
                    showClassDropdown ? 'rotate-180' : ''
                  }`} />
                </button>

                {showClassDropdown && !isLoadingClasses && (
                  <div className="absolute bottom-full right-0 mb-1 w-36 rounded-md shadow-lg z-[60]" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E3E7ED' }}>
                    <div className="py-1">
                      {availableClasses.map((classLabel, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleClassSelect(classLabel)}
                          className="w-full text-left px-2 py-1.5 text-xs transition-colors"
                          style={{
                            backgroundColor: selectedClass === classLabel ? 'rgba(14, 116, 144, 0.14)' : 'transparent',
                            color: '#1F2933',
                            fontWeight: selectedClass === classLabel ? '600' : '400'
                          }}
                        >
                          {classLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-2 pb-1.5">
            <div className="w-full flex rounded-lg p-0.5 gap-0.5" style={{ backgroundColor: '#F4F6F8' }}>
              {answerLengthModes.map((mode, idx) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setAnswerLengthIndex(idx)}
                  disabled={isLoading}
                  className="flex-1 rounded-md transition-all text-[10px] px-1.5 py-1 whitespace-nowrap"
                  style={{
                    color: answerLengthIndex === idx ? '#1F2933' : '#6B7280',
                    fontWeight: answerLengthIndex === idx ? 600 : 500,
                    backgroundColor: answerLengthIndex === idx ? 'rgba(58, 124, 165, 0.18)' : 'transparent',
                    border: answerLengthIndex === idx ? '1px solid rgba(58, 124, 165, 0.35)' : '1px solid transparent'
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isMobile ? (
          <div className="flex items-center gap-2 px-2 pb-1">
            {/* Search Input - Takes remaining space */}
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
                className="w-full px-2 py-1.5 text-xs rounded-md focus:outline-none focus:ring-1 focus:border-transparent resize-none"
                style={{
                  backgroundColor: '#FAFBFC',
                  border: '1px solid #E3E7ED',
                  color: '#1F2933',
                  caretColor: '#3A7CA5',
                  minHeight: 32,
                  maxHeight: '180px',
                  transition: 'height 0.12s ease-out'
                }}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            {/* Search Button - Compact (Desktop/Tablet) */}
            <button 
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex-shrink-0 p-1.5 rounded-md transition-colors disabled:opacity-50"
              style={{ 
                backgroundColor: '#3A7CA5',
                color: '#FFFFFF'
              }}
            >
              <Search className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Top row: input */}
            <div className="w-full">
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
                className="w-full px-2 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:border-transparent resize-none placeholder:text-gray-400"
                style={{
                  backgroundColor: '#FAFBFC',
                  border: 'none',
                  color: '#1F2933',
                  caretColor: '#3A7CA5',
                  minHeight: 40,
                  maxHeight: '30vh',
                  transition: 'height 0.12s ease-out'
                }}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            {/* Bottom row: actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex-shrink-0 p-2 rounded-md transition-colors"
                style={{ backgroundColor: '#F6F7F9', border: '1px solid #E3E7ED', color: '#1F2933' }}
                aria-label="Open sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="relative flex-1" ref={subjectDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex w-full items-center justify-between space-x-1 px-2 py-2 rounded-md text-xs hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#3A7CA5', color: '#FFFFFF' }}
                  disabled={isLoadingSubjects}
                >
                  <span className="whitespace-nowrap truncate text-xs">
                    {isLoadingSubjects
                      ? 'Loading...'
                      : selectedSubject === 'All Subjects'
                        ? 'Subject'
                        : selectedSubject.length > 10
                          ? selectedSubject.substring(0, 10) + '...'
                          : selectedSubject}
                  </span>
                  <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${
                    showDropdown ? 'rotate-180' : ''
                  }`} />
                </button>
                {showDropdown && !isLoadingSubjects && (
                  <div className="absolute bottom-full left-0 mb-1 w-40 rounded-md shadow-lg z-[60]" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E3E7ED' }}>
                    <div className="py-1">
                      {availableSubjects.map((subject, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSubjectSelect(subject)}
                          className="w-full text-left px-2 py-1.5 text-xs transition-colors"
                          style={{
                            backgroundColor: selectedSubject === subject ? 'rgba(58, 124, 165, 0.12)' : 'transparent',
                            color: '#1F2933',
                            fontWeight: selectedSubject === subject ? '600' : '400'
                          }}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative flex-1" ref={classDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                  className="flex w-full items-center justify-between space-x-1 px-2 py-2 rounded-md text-xs hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#0E7490', color: '#FFFFFF' }}
                  disabled={isLoadingClasses}
                >
                  <span className="whitespace-nowrap truncate text-xs">
                    {isLoadingClasses ? 'Loading...' : selectedClass === 'All Classes' ? 'Class' : selectedClass.replace('Class ', 'C-')}
                  </span>
                  <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${
                    showClassDropdown ? 'rotate-180' : ''
                  }`} />
                </button>
                {showClassDropdown && !isLoadingClasses && (
                  <div className="absolute bottom-full right-0 mb-1 w-36 rounded-md shadow-lg z-[60]" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E3E7ED' }}>
                    <div className="py-1">
                      {availableClasses.map((classLabel, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleClassSelect(classLabel)}
                          className="w-full text-left px-2 py-1.5 text-xs transition-colors"
                          style={{
                            backgroundColor: selectedClass === classLabel ? 'rgba(14, 116, 144, 0.14)' : 'transparent',
                            color: '#1F2933',
                            fontWeight: selectedClass === classLabel ? '600' : '400'
                          }}
                        >
                          {classLabel}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={togglePyq}
                className="flex-shrink-0 p-2 rounded-md transition-colors"
                style={{ backgroundColor: '#F6F7F9', border: '1px solid #E3E7ED', color: '#1F2933' }}
                aria-label="Open PYQ"
              >
                <FileText className="w-4 h-4" />
              </button>

              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="flex-shrink-0 p-2 rounded-md transition-colors disabled:opacity-50"
                style={{ backgroundColor: '#3A7CA5', color: '#FFFFFF' }}
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default EmbeddedSearchBar

EmbeddedSearchBar.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired
}
