import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, Send, Check } from 'lucide-react'
import apiService from '../services/api'
import { useLayout } from '../contexts/LayoutContext'
import PropTypes from 'prop-types'

const EmbeddedSearchBar = ({ onSendMessage, isLoading }) => {
  const { isMobile } = useLayout()
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState(['All Subjects'])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const subjectDropdownRef = useRef(null)
  const textareaRef = useRef(null)

  // Load available subjects from Pinecone
  const loadAvailableSubjects = async () => {
    setIsLoadingSubjects(true)
    try {
      const response = await apiService.getBooks()
      const indexedBooks = response.filter(book => book.total_chunks > 0)

      const subjects = ['All Subjects']
      indexedBooks.forEach(book => {
        const subjectName = book.title.replace('NCERT ', '')
        if (!subjects.includes(subjectName)) {
          subjects.push(subjectName)
        }
      })
      setAvailableSubjects(subjects)
    } catch (error) {
      console.error('Failed to load available subjects:', error)
      setAvailableSubjects(['All Subjects'])
    } finally {
      setIsLoadingSubjects(false)
    }
  }

  useEffect(() => {
    loadAvailableSubjects()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Multi-select helpers for subjects
  const isSubjectSelected = (subject) => {
    if (subject === 'General AI (No Subject)') {
      return selectedSubjects.length === 0
    }
    if (subject === 'All Subjects') {
      return selectedSubjects.includes('All Subjects')
    }
    return selectedSubjects.includes(subject)
  }

  const handleToggleSubject = (subject) => {
    if (subject === 'General AI (No Subject)') {
      setSelectedSubjects([])
      return
    }
    const nonAllSubjects = availableSubjects.filter(s => s !== 'All Subjects' && s !== 'General AI (No Subject)')
    if (subject === 'All Subjects') {
      if (selectedSubjects.includes('All Subjects')) {
        // Deselect all -> General AI mode (0 subjects)
        setSelectedSubjects([])
      } else {
        setSelectedSubjects(['All Subjects'])
      }
      return
    }

    let currentList = selectedSubjects.includes('All Subjects')
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
      return 'General AI (No Subject)'
    }
    if (selectedSubjects.length === 1) {
      return selectedSubjects[0]
    }
    return `${selectedSubjects.length} Subjects`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const query = inputValue.trim()
    if (!query || isLoading) return

    const nonAllSubjects = availableSubjects.filter(s => s !== 'All Subjects')
    const isAllSubjects = selectedSubjects.includes('All Subjects') || 
                          (nonAllSubjects.length > 0 && selectedSubjects.length === nonAllSubjects.length)
    const isZeroSubjects = selectedSubjects.length === 0

    let subjectId = 'all'
    let subjectList = ['all']
    if (isZeroSubjects) {
      subjectId = ''
      subjectList = []
    } else if (!isAllSubjects) {
      subjectList = selectedSubjects.map(s => s.toLowerCase())
      subjectId = subjectList.length === 1 ? subjectList[0] : subjectList.join(',')
    }

    onSendMessage(query, {
      subject: subjectId,
      subjects: subjectList,
      selectedSubject: subjectId,
      selectedSubjects: subjectList,
      is_general_ai: isZeroSubjects,
      isGeneralAi: isZeroSubjects
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
      {/* Subject Filter Row */}
      <div className="flex flex-wrap items-center gap-1.5 min-w-0 justify-start px-1">
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
            <span className="whitespace-nowrap truncate max-w-[130px]">
              {isLoadingSubjects ? 'Loading...' : getSubjectButtonLabel()}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0 text-white" />
          </button>

          {showDropdown && !isLoadingSubjects && (
            <div className="absolute bottom-full left-0 mb-1 w-52 rounded-lg shadow-lg border border-gray-200 bg-white z-[60] py-1">
              <div className="max-h-52 overflow-y-auto">
                {/* Dedicated General AI Option */}
                <button
                  type="button"
                  onClick={() => handleToggleSubject('General AI (No Subject)')}
                  className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-left"
                  style={{
                    backgroundColor: isSubjectSelected('General AI (No Subject)') ? 'rgba(228, 87, 46, 0.08)' : 'transparent'
                  }}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                      isSubjectSelected('General AI (No Subject)')
                        ? 'bg-[#E4572E] border-[#E4572E] text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSubjectSelected('General AI (No Subject)') && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                  <span
                    className="truncate text-xs font-semibold"
                    style={{
                      color: isSubjectSelected('General AI (No Subject)') ? '#E4572E' : '#1F2933'
                    }}
                  >
                    General AI (No Subject)
                  </span>
                </button>

                <div className="my-1 border-t border-gray-100" />

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
      </div>

      {/* Search Input Row */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[768px] mx-auto rounded-xl border border-gray-200 p-1.5 pr-2 pl-3 flex items-center gap-2 transition-colors duration-200 focus-within:border-[#E4572E] focus-within:ring-1 focus-within:ring-[#E4572E] bg-white"
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
