import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, ChevronUp, FileText, Hash, ChevronLeft, ChevronRight, MessageSquare, Sparkles, TrendingUp, Zap, GraduationCap, Book, BookOpen, Sliders } from 'lucide-react'
import { Box, Paper, Stack, Typography, Alert, Chip, Divider, Avatar, IconButton, Button } from '@mui/material'
import { alpha } from '@mui/material/styles'
import PropTypes from 'prop-types'
import { useTheme } from '../contexts/ThemeContext'
import { useLayout } from '../contexts/LayoutContext'
import { useSearchHistory } from '../contexts/SearchHistoryContext'
import { useAuth } from '../contexts/AuthContext'
import { useDashboard } from '../contexts/DashboardContext'
import apiService from '../services/api'
import SearchProgressIndicator from './SearchProgressIndicator'
import EmbeddedSearchBar from './EmbeddedSearchBar'
import { ChevronFirst } from './icons/ChevronFirst'
import { SEARCH_SETTINGS } from '../config/searchSettings'
import { validateSearchQuery } from '../utils/validation'

const EMPTY_EXPANDED_SOURCES = new Set()
const PENDING_CHAT_LOAD_STORAGE_KEY = 'pendingChatToLoad'
const MAX_CHAT_TITLE_LENGTH = 32
const MAX_CHAT_TITLE_WORDS = 4
const CHAT_FONT_SIZES = {
  body: { xs: '0.7rem', md: '0.775rem' },
  h1: { xs: '0.9rem', md: '1.0rem' },
  h2: { xs: '0.8rem', md: '0.9rem' },
  h3: { xs: '0.75rem', md: '0.825rem' },
  code: { xs: '0.68rem', md: '0.775rem' }
}
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'for', 'to', 'and', 'or', 'with', 'without',
  'about', 'regarding', 'please', 'explain', 'describe', 'detail', 'details',
  'what', 'why', 'how', 'is', 'are', 'was', 'were', 'can', 'could', 'should',
  'would', 'tell', 'me', 'give', 'show', 'list', 'define', 'meaning', 'meaningful',
  'this', 'that', 'these', 'those', 'topic', 'concept', 'question', 'answer'
])

const isPlaceholderTitle = (title) => {
  if (!title) return true
  return title.startsWith('New Chat')
}

const buildConciseTitle = (input) => {
  if (!input) return 'New Chat'

  const rawTokens = input
    .replace(/[\n\r]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)

  if (rawTokens.length === 0) return 'New Chat'

  const capitalizedTokens = []
  const otherTokens = []

  rawTokens.forEach((token) => {
    const lowered = token.toLowerCase()
    if (STOP_WORDS.has(lowered)) return
    if (token[0] && token[0] === token[0].toUpperCase()) {
      capitalizedTokens.push(token)
    } else {
      otherTokens.push(token)
    }
  })

  const meaningful = [...capitalizedTokens, ...otherTokens]
  const fallbackTokens = meaningful.length > 0 ? meaningful : rawTokens
  const selectedTokens = fallbackTokens.slice(0, MAX_CHAT_TITLE_WORDS)

  let title = selectedTokens.join(' ').trim()
  if (!title) title = rawTokens.slice(0, MAX_CHAT_TITLE_WORDS).join(' ').trim()

  if (title.length > MAX_CHAT_TITLE_LENGTH) {
    title = `${title.slice(0, MAX_CHAT_TITLE_LENGTH - 3).trim()}...`
  }

  return title || 'New Chat'
}

const ensureUniqueTitle = (baseTitle, existingTitles) => {
  const normalizedBase = baseTitle.trim()
  if (!normalizedBase) return 'New Chat'

  const normalizedSet = new Set(
    existingTitles.map((title) => title.trim().toLowerCase()).filter(Boolean)
  )

  if (!normalizedSet.has(normalizedBase.toLowerCase())) {
    return normalizedBase
  }

  let counter = 2
  let candidate = `${normalizedBase} (${counter})`
  while (normalizedSet.has(candidate.toLowerCase())) {
    counter += 1
    candidate = `${normalizedBase} (${counter})`
  }
  return candidate
}

const normalizeBotMarkdown = (rawText) => {
  if (!rawText) return ''

  let text = String(rawText).replace(/\r\n/g, '\n').trim()

  // Fix malformed heading markers like '*Introduction' or '* Conclusion'.
  text = text.replace(/(^|\n)\s*\*\s*(Introduction|Conclusion|Overview|Summary|Key Points|Key Events and Factors)\s*(?=\n|$)/gi, '$1**$2**')

  // Normalize plain heading lines into markdown headings.
  text = text.replace(/(^|\n)(Introduction|Conclusion|Overview|Summary|Key Points|Key Events and Factors)\s*:\s*(?=\n|$)/gi, '$1**$2**')

  // Split patterns like 'Conclusion The ...' into heading + paragraph.
  text = text.replace(/(^|\n)(Introduction|Conclusion|Overview|Summary)\s+([A-Z])/g, '$1**$2**\n\n$3')

  // Only normalize explicit star/dot bullets; never rewrite hyphenated prose.
  const markerMatches = text.match(/(?:\*|•)\s+/g) || []
  if (markerMatches.length >= 2) {
    // Convert inline bullets after sentence boundaries into proper markdown bullets.
    text = text.replace(/([.!?:])\s+[•*]\s+/g, '$1\n\n* ')

    // Convert inline bullet separators into new lines.
    text = text.replace(/\s+[•*]\s+/g, '\n* ')

    // Convert line-start bullets to standard markdown star bullets.
    text = text.replace(/(^|\n)\s*[•*]\s+/g, '$1* ')

    // Ensure first bullet starts on a fresh paragraph when needed.
    const firstBulletIndex = text.search(/(^|\n)\*\s+/)
    if (firstBulletIndex > 0) {
      const before = text.slice(0, firstBulletIndex).trimEnd()
      const after = text.slice(firstBulletIndex).trimStart()
      text = `${before}\n\n${after}`
    }
  }

  // Remove orphan marker-only lines that create empty bullets.
  text = text.replace(/^\s*[-*•]\s*$/gm, '')

  // Ensure heading blocks have spacing from body text.
  text = text.replace(/(\*\*[A-Za-z][^*\n]{1,60}\*\*)(\n)(?!\n)/g, '$1\n\n')

  // Normalize excessive blank lines.
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

const createMarkdownComponents = (isUserMessage) => ({
  p: ({ ...props }) => (
    <Typography
      variant="body2"
      sx={{
        fontSize: CHAT_FONT_SIZES.body,
        lineHeight: isUserMessage ? 1.48 : 1.44,
        mb: isUserMessage ? 0.35 : 0.26,
        color: 'inherit',
        '&:last-of-type': { mb: 0 }
      }}
      {...props}
    />
  ),
  h1: ({ ...props }) => (
    <Typography
      variant="h6"
      sx={{ fontSize: CHAT_FONT_SIZES.h1, fontWeight: 700, mt: 0.12, mb: isUserMessage ? 0.22 : 0.08, color: 'inherit' }}
      {...props}
    />
  ),
  h2: ({ ...props }) => (
    <Typography
      variant="subtitle1"
      sx={{ fontSize: CHAT_FONT_SIZES.h2, fontWeight: 700, mt: 0.1, mb: isUserMessage ? 0.2 : 0.06, color: 'inherit' }}
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <Typography
      variant="subtitle2"
      sx={{ fontSize: CHAT_FONT_SIZES.h3, fontWeight: 700, mt: 0.1, mb: isUserMessage ? 0.18 : 0.05, color: 'inherit' }}
      {...props}
    />
  ),
  ul: ({ ...props }) => (
    <Box
      component="ul"
      sx={{
        listStyleType: 'disc',
        listStylePosition: 'outside',
        pl: 2.1,
        ml: 0.4,
        mb: isUserMessage ? 0.35 : 0.16,
        mt: 0.12,
        '& ul': { listStyleType: 'circle', mt: 0.25, ml: 2 },
        '& ol': { listStyleType: 'decimal', mt: 0.25, ml: 2 }
      }}
      {...props}
    />
  ),
  ol: ({ ...props }) => (
    <Box
      component="ol"
      sx={{
        listStyleType: 'decimal',
        listStylePosition: 'outside',
        pl: 2.1,
        ml: 0.4,
        mb: isUserMessage ? 0.35 : 0.16,
        mt: 0.12,
        '& ul': { listStyleType: 'disc', mt: 0.25, ml: 2 },
        '& ol': { listStyleType: 'lower-alpha', mt: 0.25, ml: 2 }
      }}
      {...props}
    />
  ),
  li: ({ children, ...props }) => (
    <Box
      component="li"
      sx={{
        mb: isUserMessage ? 0.14 : 0.08,
        fontSize: CHAT_FONT_SIZES.body,
        lineHeight: isUserMessage ? 1.42 : 1.32,
        color: 'inherit',
        '& > p': {
          display: 'inline',
          m: 0,
        },
        '& > p + p': {
          display: 'block',
          mt: 0.25,
        },
        '& > p:empty': {
          display: 'none',
        }
      }}
      {...props}
    >
      {children}
    </Box>
  ),
  blockquote: ({ ...props }) => (
    <Box
      component="blockquote"
      sx={{
        pl: 1.5,
        ml: 0,
        mr: 0,
        mb: 0.35,
        borderLeft: (theme) => `3px solid ${alpha(theme.palette.text.primary, 0.2)}`,
        color: 'inherit',
        opacity: isUserMessage ? 0.9 : 0.85
      }}
      {...props}
    />
  ),
  pre: ({ ...props }) => (
    <Box
      component="pre"
      sx={{
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: CHAT_FONT_SIZES.code,
        backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08),
        p: 1,
        borderRadius: 1,
        overflowX: 'auto',
        my: 0.35,
        whiteSpace: 'pre'
      }}
      {...props}
    />
  ),
  code: ({ inline, ...props }) => (
    <Box
      component="code"
      sx={{
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: CHAT_FONT_SIZES.code,
        backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08),
        px: inline ? 0.45 : 0,
        py: inline ? 0.05 : 0,
        borderRadius: 1,
        display: inline ? 'inline' : 'inherit',
        whiteSpace: inline ? 'pre-wrap' : 'inherit',
        overflowX: inline ? 'visible' : 'inherit'
      }}
      {...props}
    />
  ),
  a: ({ ...props }) => (
    <Box
      component="a"
      sx={{ color: 'inherit', textDecoration: 'underline' }}
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  )
})

const ChatMessageBubble = memo(({
  message,
  markdownComponents,
  typingText,
  currentStepIndex,
  expandedSourceSet,
  onToggleSource,
  onRegisterUserRef
}) => {
  const userRef = useMemo(() => {
    if (message.type !== 'user') return null
    return onRegisterUserRef(message.id)
  }, [message.type, message.id, onRegisterUserRef])

  return (
    <Box
      key={message.id}
      ref={message.type === 'user' ? userRef : null}
      sx={{
        display: 'flex',
        justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
        width: '100%'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          width: message.type === 'user' ? { xs: '100%', md: 'auto' } : '100%',
          maxWidth: message.type === 'user' ? { xs: '100%', md: '80%' } : '100%',
          flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
        }}
      >
        {/* Avatar */}
        <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {message.type === 'user' ? (
            <Avatar 
              sx={{ 
                width: 28, 
                height: 28, 
                bgcolor: '#f3f4f6', 
                color: '#374151', 
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <User size={13} />
            </Avatar>
          ) : (
            <Box
              component="img"
              src="/pg.png"
              alt="PG Bot"
              sx={{ width: 32, height: 32, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(228,87,46,0.2))' }}
            />
          )}
        </Box>

        {/* Message content */}
        {message.type === 'bot' && message.isLoading ? (
          <Box sx={{ p: 0 }}>
            <SearchProgressIndicator currentStepIndex={currentStepIndex} />
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: message.type === 'user' ? '7px 12px' : 0.9,
              width: message.type === 'user' ? { xs: 'auto', md: 'auto' } : 'auto',
              maxWidth: message.type === 'user' ? '85%' : '100%',
              flexGrow: message.type === 'user' ? 0 : 1,
              borderRadius: message.type === 'user' ? '14px 14px 4px 14px' : 2,
              backgroundColor: message.type === 'user' ? '#f3f4f6' : '#ffffff',
              color: message.type === 'user' ? '#111827' : '#1f2937',
              border: '1px solid #e5e7eb',
              boxShadow: message.type === 'user' ? '0 1px 3px rgba(0,0,0,0.04)' : 'none'
            }}
          >
            <Box
              sx={{
                fontSize: message.type === 'user' ? '0.78rem' : '0.7rem',
                fontWeight: message.type === 'user' ? 600 : 400,
                lineHeight: message.type === 'bot' ? 1.3 : 1.42,
                whiteSpace: 'normal',
                '& h1 + p, & h2 + p, & h3 + p, & h4 + p, & h5 + p, & h6 + p': {
                  marginTop: '0.08rem'
                },
                '& p + p': {
                  marginTop: '0.1rem'
                }
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {typingText ?? message.content}
              </ReactMarkdown>
            </Box>

            {/* Sources Section - Only for bot messages with sources */}
            {message.type === 'bot' && message.sources && message.sources.length > 0 && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                {/* Sources Header with Individual Source Buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FileText className="w-2.5 h-2.5" style={{ color: '#000000', opacity: 0.6 }} />
                    <Typography variant="caption" sx={{ color: '#000000', opacity: 0.7, fontWeight: 600 }}>
                      Sources ({message.sources.length}):
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {message.sources.map((source, index) => {
                      const sourceKey = `${message.id}-${index}`
                      const isExpanded = expandedSourceSet.has(index)
                      return (
                        <Button
                          key={index}
                          size="small"
                          variant={isExpanded ? 'contained' : 'outlined'}
                          onClick={() => onToggleSource(sourceKey)}
                          sx={{
                            minWidth: 0,
                            height: '20px',
                            minHeight: '20px',
                            px: 0.75,
                            py: 0,
                            borderRadius: 999,
                            fontSize: '0.62rem',
                            backgroundColor: (theme) =>
                              isExpanded
                                ? theme.palette.primary.main
                                : theme.palette.background.default,
                            borderColor: (theme) =>
                              isExpanded
                                ? theme.palette.primary.main
                                : theme.palette.divider,
                            color: (theme) =>
                              isExpanded
                                ? theme.palette.primary.contrastText
                                : theme.palette.text.primary,
                            '&:hover': {
                              backgroundColor: (theme) =>
                                isExpanded
                                  ? theme.palette.primary.dark
                                  : alpha(theme.palette.text.primary, 0.06)
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Hash className="w-2 h-2" />
                            <span>{index + 1}</span>
                            {source.score && (
                              <span style={{ opacity: 0.75 }}>({(source.score * 100).toFixed(0)}%)</span>
                            )}
                          </Box>
                        </Button>
                      )
                    })}
                  </Box>
                </Box>

                {/* Individual Source Content - Only show the specific expanded source */}
                {message.sources.map((source, index) => {
                  const isExpanded = expandedSourceSet.has(index)
                  const sourceKey = `${message.id}-${index}`
                  return isExpanded ? (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{ mt: 1, p: 1, borderRadius: 2, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0' }}
                    >
                      {/* Source Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Hash className="w-2 h-2" style={{ color: '#000000', opacity: 0.6 }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#000000', fontSize: '0.68rem' }}>
                            Source {index + 1}
                          </Typography>
                          {source.score && (
                            <Chip
                              size="small"
                              label={`${(source.score * 100).toFixed(1)}%`}
                              sx={{ height: '18px', backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2), color: 'text.primary', fontSize: '0.62rem', '& .MuiChip-label': { px: 0.75 } }}
                            />
                          )}
                        </Box>
                        <IconButton onClick={() => onToggleSource(sourceKey)} size="small" sx={{ color: '#000000', opacity: 0.6, p: 0.25 }}>
                          <ChevronUp className="w-2.5 h-2.5" />
                        </IconButton>
                      </Box>

                      {/* Source Details */}
                      <Stack spacing={0.75}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {source.subject && (
                            <Chip size="small" label={source.subject} sx={{ height: '18px', backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.18), color: 'text.primary', fontSize: '0.62rem', '& .MuiChip-label': { px: 0.75 } }} />
                          )}
                          {source.class && (
                            <Chip size="small" label={source.class} sx={{ height: '18px', backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08), color: 'text.primary', fontSize: '0.62rem', '& .MuiChip-label': { px: 0.75 } }} />
                          )}
                          {(source.chapter || source.chapter_name) && (
                            <Chip size="small" label={source.chapter_name || source.chapter} sx={{ height: '18px', backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08), color: 'text.primary', fontSize: '0.62rem', '& .MuiChip-label': { px: 0.75 } }} />
                          )}
                          {source.topic && (
                            <Chip size="small" label={source.topic} sx={{ height: '18px', backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08), color: 'text.primary', fontSize: '0.62rem', '& .MuiChip-label': { px: 0.75 } }} />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.62rem', pt: 0.75, borderTop: '1px solid #e0e0e0', color: '#000000', opacity: 0.6 }}>
                          {source.chunk && (
                            <span><strong>Chunk:</strong> {source.chunk}</span>
                          )}
                          <span><strong>Score:</strong> {(source.score * 100).toFixed(1)}%</span>
                        </Box>

                        {(source.content || source.text_preview || source.text || source.full_text) && (
                          <Paper elevation={0} sx={{ p: 1, borderRadius: 2, backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', maxHeight: 180, overflowY: 'auto' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#000000', display: 'block', mb: 0.5, fontSize: '0.68rem' }}>
                              Content:
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.68rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', color: '#000000', opacity: 0.8 }}>
                              {source.content || source.full_text || source.text_preview || source.text || 'No content available'}
                            </Typography>
                          </Paper>
                        )}
                      </Stack>
                    </Paper>
                  ) : null
                })}
              </Box>
            )}

            {/* Legacy sources display (fallback) */}
            {message.type === 'bot' && message.sources && typeof message.sources === 'string' && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#6b7280', borderTop: '1px solid #e5e7eb', pt: 1 }}>
                {message.sources}
              </Typography>
            )}

            {message.error && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: '#ef4444' }}>
                Error processing request
              </Typography>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  )
})

ChatMessageBubble.displayName = 'ChatMessageBubble'
ChatMessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    type: PropTypes.string.isRequired,
    content: PropTypes.string,
    isLoading: PropTypes.bool,
    sources: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
    error: PropTypes.bool
  }).isRequired,
  markdownComponents: PropTypes.object.isRequired,
  typingText: PropTypes.string,
  currentStepIndex: PropTypes.number,
  expandedSourceSet: PropTypes.instanceOf(Set),
  onToggleSource: PropTypes.func.isRequired,
  onRegisterUserRef: PropTypes.func.isRequired
}

const ChatSection = () => {
  const { theme } = useTheme()
  const isDarkMode = theme?.mode === 'dark'
  const { contentOffsetLeft, pyqVisible, togglePyq, isMobile, mobileActiveTab } = useLayout()
  const { addToSearchHistory, addGuestChat, updateGuestChat, guestChatHistory } = useSearchHistory()
  const { currentUser, createNewChat, saveMessage, getChatMessages, updateChatTitle, updateChatMessageCount, getChatHistory } = useAuth()
  const { trackInteraction } = useDashboard()
  const scrollContainerRef = useRef(null)
  const scrollStateRef = useRef({ scrollTop: 0, scrollHeight: 0, isAtTop: true })
  const userMessageRefs = useRef(new Map())
  const pendingScrollToIdRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [systemStatus, setSystemStatus] = useState({ initialized: false, healthy: false })
  const [currentChatId, setCurrentChatId] = useState(null)
  const [currentChatTitle, setCurrentChatTitle] = useState('New Chat')
  const [rateLimitMessage] = useState('')
  const [expandedSources, setExpandedSources] = useState({}) // Track expanded sources for each message
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [typingVisible, setTypingVisible] = useState({})
  const typingTimersRef = useRef({})
  const typedMessageIdsRef = useRef(new Set())
  const pendingBotIdRef = useRef(null)

  const toggleSources = useCallback((sourceKey) => {
    setExpandedSources(prev => {
      // If clicking the same source, close it
      if (prev[sourceKey]) {
        const newState = { ...prev }
        delete newState[sourceKey]
        return newState
      }

      // Otherwise, close all sources for this message and open only the clicked one
      const messageId = sourceKey.split('-')[0]
      const newState = {}

      // Keep sources from other messages intact
      Object.keys(prev).forEach(key => {
        if (!key.startsWith(messageId + '-')) {
          newState[key] = prev[key]
        }
      })

      // Open only the clicked source
      newState[sourceKey] = true
      return newState
    })
  }, [])

  // Check system health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await apiService.healthCheck()
        setSystemStatus({
          initialized: health.system_initialized,
          healthy: health.status === 'healthy'
        })
      } catch (error) {
        console.error('Health check failed:', error)
        setSystemStatus({ initialized: false, healthy: false })
      }
    }

    checkHealth()
  }, [])

  // Progressive UI feedback during AI response (non-blocking)
  useEffect(() => {
    if (!isLoading) {
      setCurrentStepIndex(0)
      return
    }

    setCurrentStepIndex(0)
    const timeouts = [
      setTimeout(() => {
        setCurrentStepIndex(1)
      }, 900),
      setTimeout(() => {
        setCurrentStepIndex(2)
      }, 1800),
      setTimeout(() => {
        setCurrentStepIndex(3)
      }, 2700)
    ]

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [isLoading])

  // Listen for chat events from Sidebar
  useEffect(() => {
    const handleNewChat = (event) => {
      setMessages([])
      sessionStorage.removeItem(PENDING_CHAT_LOAD_STORAGE_KEY)
      // Always use the chatId from the event (created in Sidebar)
      if (currentUser) {
        setCurrentChatId(event?.detail?.chatId || null)
        setCurrentChatTitle('New Chat')
        console.log('🔄 Set chat ID for authenticated user:', event?.detail?.chatId || null)
      } else {
        setCurrentChatId(event?.detail?.chatId || null)
        setCurrentChatTitle('New Chat')
        console.log('👤 Created new guest chat ID:', event?.detail?.chatId || null)
      }
    }

    const handleLoadChat = async (event) => {
      const { chatId, title } = event.detail
      console.log('🔄 Loading chat:', chatId, title)
      sessionStorage.removeItem(PENDING_CHAT_LOAD_STORAGE_KEY)
      setCurrentChatId(chatId)
      setCurrentChatTitle(title)
      setMessages([]) // Clear messages first

      try {
        // Always load all messages for this chatId from Firebase
        const chatMessages = await getChatMessages(chatId)
        console.log('✅ Loaded chat history for chatId:', chatId, 'messages:', chatMessages.length)
        setMessages(chatMessages)
      } catch (error) {
        console.error('❌ Failed to load chat messages:', error)
        setMessages([])
      }
    }

    const handleLoadGuestChat = (event) => {
      const { chatId, title, messages } = event.detail
      sessionStorage.removeItem(PENDING_CHAT_LOAD_STORAGE_KEY)
      setCurrentChatId(chatId)
      setCurrentChatTitle(title)
      setMessages(messages || [])
      console.log('✅ Loaded guest chat:', { chatId, title, messageCount: messages?.length || 0 })
    }

    const handleChatDeleted = (event) => {
      const { chatId } = event.detail
      // If the deleted chat was currently active, clear the current chat
      if (currentChatId === chatId) {
        setMessages([])
        setCurrentChatId(null)
        setCurrentChatTitle('New Chat')
        console.log('🗑️ Cleared active chat after deletion:', chatId)
      }
    }

    // Add event listeners
    window.addEventListener('newChat', handleNewChat)
    window.addEventListener('loadChat', handleLoadChat)
    window.addEventListener('loadGuestChat', handleLoadGuestChat)
    window.addEventListener('chatDeleted', handleChatDeleted)

    // Cleanup function to prevent memory leaks
    return () => {
      window.removeEventListener('newChat', handleNewChat)
      window.removeEventListener('loadChat', handleLoadChat)
      window.removeEventListener('loadGuestChat', handleLoadGuestChat)
      window.removeEventListener('chatDeleted', handleChatDeleted)
    }
  }, [currentUser, currentChatId, getChatMessages])

  // Recover pending chat selection when arriving from another view
  useEffect(() => {
    const pendingRaw = sessionStorage.getItem(PENDING_CHAT_LOAD_STORAGE_KEY)
    if (!pendingRaw) return

    const loadPendingChat = async () => {
      try {
        const pending = JSON.parse(pendingRaw)
        if (!pending?.id) {
          sessionStorage.removeItem(PENDING_CHAT_LOAD_STORAGE_KEY)
          return
        }

        if (String(pending.id).startsWith('guest-')) {
          setCurrentChatId(pending.id)
          setCurrentChatTitle(pending.title || 'New Chat')
          setMessages(pending.messages || [])
          sessionStorage.removeItem(PENDING_CHAT_LOAD_STORAGE_KEY)
          return
        }

        setCurrentChatId(pending.id)
        setCurrentChatTitle(pending.title || 'New Chat')
        setMessages([])
        const chatMessages = await getChatMessages(pending.id)
        setMessages(chatMessages || [])
      } catch (error) {
        console.error('❌ Failed to load pending chat:', error)
      } finally {
        sessionStorage.removeItem(PENDING_CHAT_LOAD_STORAGE_KEY)
      }
    }

    loadPendingChat()
  }, [getChatMessages])

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts or intervals
      if (window.chatTimeoutId) {
        clearTimeout(window.chatTimeoutId)
      }
      Object.values(typingTimersRef.current).forEach(clearInterval)
      typingTimersRef.current = {}
    }
  }, [])

  // Typing animation for the latest bot response
  useEffect(() => {
    if (!pendingBotIdRef.current) return
    const latestBotMessage = messages.find(
      (msg) => msg.id === pendingBotIdRef.current && msg.type === 'bot' && !msg.isLoading && msg.content
    )

    if (!latestBotMessage) return
    if (typedMessageIdsRef.current.has(latestBotMessage.id)) return
    if (typingTimersRef.current[latestBotMessage.id]) return

    const tokens = latestBotMessage.content.match(/\S+|\s+/g) || []
    let index = 0

    setTypingVisible((prev) => ({ ...prev, [latestBotMessage.id]: '' }))

    typingTimersRef.current[latestBotMessage.id] = setInterval(() => {
      index += 1
      setTypingVisible((prev) => ({
        ...prev,
        [latestBotMessage.id]: tokens.slice(0, index).join('')
      }))

      if (index >= tokens.length) {
        clearInterval(typingTimersRef.current[latestBotMessage.id])
        delete typingTimersRef.current[latestBotMessage.id]
        typedMessageIdsRef.current.add(latestBotMessage.id)
        pendingBotIdRef.current = null
        setTypingVisible((prev) => {
          const rest = { ...prev }
          delete rest[latestBotMessage.id]
          return rest
        })
      }
    }, 10)
  }, [messages])

  // Cleanup timers for removed messages
  useEffect(() => {
    const messageIds = new Set(messages.map((msg) => msg.id))
    Object.keys(typingTimersRef.current).forEach((id) => {
      if (!messageIds.has(Number(id))) {
        clearInterval(typingTimersRef.current[id])
        delete typingTimersRef.current[id]
      }
    })
  }, [messages])

  // Handle guest chat saving
  const handleGuestChatSave = useCallback((messages, titleSource) => {
    if (currentUser) return // Don't save guest chats for authenticated users

    if (!currentChatId || !currentChatId.startsWith('guest-')) {
      // Create a new guest chat
      const firstMessage = messages.find(msg => msg.type === 'user')?.content || 'New Chat'
      const baseTitle = titleSource ? buildConciseTitle(titleSource) : 'New Chat'
      const existingTitles = (guestChatHistory || []).map(chat => chat.title || '')
      const uniqueTitle = ensureUniqueTitle(baseTitle, existingTitles)
      const newChat = addGuestChat({
        title: uniqueTitle,
        firstMessage: firstMessage,
        messages: messages
      })
      setCurrentChatId(newChat.id)
      setCurrentChatTitle(newChat.title)
      console.log('✅ Created new guest chat:', newChat.id)
    } else {
      // Update existing guest chat
      const firstMessage = messages.find(msg => msg.type === 'user')?.content || 'New Chat'
      let nextTitle = currentChatTitle
      if (isPlaceholderTitle(currentChatTitle) && titleSource) {
        const baseTitle = buildConciseTitle(titleSource)
        const existingTitles = (guestChatHistory || [])
          .filter(chat => chat.id !== currentChatId)
          .map(chat => chat.title || '')
        nextTitle = ensureUniqueTitle(baseTitle, existingTitles)
      }

      updateGuestChat(currentChatId, {
        title: nextTitle,
        firstMessage: firstMessage,
        messages: messages
      })
      if (nextTitle && nextTitle !== currentChatTitle) {
        setCurrentChatTitle(nextTitle)
      }
      console.log('✅ Updated guest chat:', currentChatId)
    }
  }, [currentUser, currentChatId, currentChatTitle, addGuestChat, updateGuestChat, guestChatHistory])

  // Handle sending messages - can be called from EmbeddedSearchBar
  const sendMessage = useCallback(async (query, searchOptions = {}) => {
    // Validate query before processing
    const validation = validateSearchQuery(query)
    if (!validation.isValid) {
      // Show error message with suggestions to user
      let errorContent = `⚠️ ${validation.message}`
      if (validation.suggestions && validation.suggestions.length > 0) {
        errorContent += '\n\n**Try asking:**\n'
        validation.suggestions.forEach(suggestion => {
          errorContent += `• ${suggestion}\n`
        })
      }

      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: errorContent,
        error: true,
        isLoading: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    if (isLoading) return
    setIsLoading(true)

    // Extract search options with defaults
    const selectedSubject = searchOptions.subject || searchOptions.selectedSubject || 'all'
    const selectedClass = searchOptions.selectedClass || null
    const answerLength = searchOptions.answerLength || 'normal'

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }

    pendingScrollToIdRef.current = userMessage.id

    let activeChatId = currentChatId

    // Create chat lazily only when first message is sent
    if (currentUser && !activeChatId) {
      try {
        const initialTitle = buildConciseTitle(query)
        activeChatId = await createNewChat(initialTitle)
        setCurrentChatId(activeChatId)
        setCurrentChatTitle(initialTitle)
        window.dispatchEvent(new CustomEvent('refreshChatList'))
      } catch (error) {
        console.error('❌ Failed to create chat on first message:', error)
      }
    }

    // Add user message to chat immediately
    setMessages(prev => {
      const newMessages = [...prev, userMessage]
      if (!currentUser && prev.length === 0) {
        setTimeout(() => handleGuestChatSave(newMessages), 100)
      }
      return newMessages
    })

    // Save user message to Firebase for authenticated users
    if (currentUser && activeChatId) {
      try {
        await saveMessage(activeChatId, userMessage)
        await updateChatMessageCount(activeChatId, 1)
        // Title will be set after assistant response to avoid user-input noise
      } catch (error) {
        console.error('❌ Failed to save user message:', error)
      }
    }

    // Update search history after user message is added
    try {
      addToSearchHistory(query)
    } catch (error) {
      console.error('❌ Failed to update search history:', error)
    }

    // Create initial bot message with loading state
    const tempBotMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: '',
      isLoading: true,
      timestamp: new Date()
    }

    pendingBotIdRef.current = tempBotMessage.id

    setMessages(prev => [...prev, tempBotMessage])

    try {
      const response = await apiService.search(query, {
        subject: selectedSubject,
        n_results: SEARCH_SETTINGS.nResults,
        namespace: '',  // Keep empty for backend to use all namespaces
        selected_class: selectedClass,
        answer_length: answerLength,
        mcq_threshold: SEARCH_SETTINGS.mcqThreshold,
        mcq_limit: SEARCH_SETTINGS.mcqLimit,
        answer_settings: {
          temperature: SEARCH_SETTINGS.answerGeneration.temperature,
          top_p: SEARCH_SETTINGS.answerGeneration.topP,
          max_tokens: SEARCH_SETTINGS.answerGeneration.maxTokens
        }
      })

      // Track successful search interaction
      trackInteraction('search', {
        subject: selectedSubject,
        query: query,
        hasResults: response.rag_response ? true : false
      })

      // Track question asked
      trackInteraction('question', {
        subject: selectedSubject,
        query: query,
        hasResults: response.rag_response ? true : false
      })

      // Track chat interaction if this is the first message
      if (messages.length === 0) {
        trackInteraction('chat', {
          chatId: activeChatId,
          isNewChat: true,
          subject: selectedSubject
        })
      }

      // Update the bot message with actual response
      const normalizedResponse = normalizeBotMarkdown(
        response.rag_response || 'I received your question but couldn\'t generate a proper response.'
      )

      const botMessage = {
        id: tempBotMessage.id,
        type: 'bot',
        content: normalizedResponse,
        sources: response.sources,
        isLoading: false,
        timestamp: new Date()
      }

      let updatedMessages = []
      setMessages(prev => {
        updatedMessages = prev.map(msg =>
          msg.id === tempBotMessage.id ? botMessage : msg
        )
        return updatedMessages
      })

      if (currentUser && activeChatId) {
        setTimeout(async () => {
          try {
            await saveMessage(activeChatId, botMessage)
            await updateChatMessageCount(activeChatId, 1)

            if (isPlaceholderTitle(currentChatTitle)) {
              const baseTitle = buildConciseTitle(botMessage.content)
              let uniqueTitle = baseTitle
              try {
                const existingChats = await getChatHistory()
                const existingTitles = (existingChats || [])
                  .filter(chat => chat.id !== activeChatId)
                  .map(chat => chat.title || '')
                uniqueTitle = ensureUniqueTitle(baseTitle, existingTitles)
              } catch (error) {
                console.error('❌ Failed to load chat titles for uniqueness:', error)
              }
              await updateChatTitle(activeChatId, uniqueTitle)
              setCurrentChatTitle(uniqueTitle)
              if (uniqueTitle !== currentChatTitle) {
                window.dispatchEvent(new CustomEvent('refreshChatList'))
              }
            }
          } catch (error) {
            console.error('❌ Failed to save bot message:', error)
          }
        }, 100)
      } else {
        const titleSource = botMessage.content
        handleGuestChatSave(updatedMessages, titleSource)
      }

      if (response.mcq_results && response.mcq_results.length > 0) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('newMcqResults', {
            detail: {
              mcqs: response.mcq_results,
              query: query
            }
          }))
        }, 100)
      }
    } catch (error) {
      console.error('API Error:', error)

      // Build friendly error message with suggestions
      let errorContent = "Sorry, I couldn't process your request. Could you please rephrase your question?"

      // Check if error response has suggestions
      if (error.response?.data?.suggestions) {
        errorContent += '\n\n**Try asking:**\n'
        error.response.data.suggestions.forEach(suggestion => {
          errorContent += `• ${suggestion}\n`
        })
      } else {
        // Default suggestions
        errorContent += '\n\n**Try asking:**\n'
        errorContent += '• Tell me about the Ganga river\n'
        errorContent += '• Explain photosynthesis\n'
        errorContent += '• What is democracy?\n'
        errorContent += '• Describe the water cycle'
      }

      // Update the temporary bot message with error
      const errorMessage = {
        id: tempBotMessage.id,
        type: 'bot',
        content: errorContent,
        error: true,
        isLoading: false,
        timestamp: new Date()
      }
      setMessages(prev => prev.map(msg =>
        msg.id === tempBotMessage.id ? errorMessage : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }, [
    isLoading,
    currentUser,
    currentChatId,
    currentChatTitle,
    messages.length,
    addToSearchHistory,
    handleGuestChatSave,
    saveMessage,
    getChatHistory,
    updateChatMessageCount,
    updateChatTitle,
    trackInteraction,
    createNewChat
  ])

  useEffect(() => {
    const handleSubmittion = (event) => {
      const { query, options } = event.detail
      sendMessage(query, options)
    }
    window.addEventListener('submitChatQuery', handleSubmittion)
    return () => {
      window.removeEventListener('submitChatQuery', handleSubmittion)
    }
  }, [sendMessage])

  useEffect(() => {
    const event = new CustomEvent('chatLoadingState', {
      detail: { isLoading }
    })
    window.dispatchEvent(event)
  }, [isLoading])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    scrollStateRef.current.scrollTop = container.scrollTop
    scrollStateRef.current.scrollHeight = container.scrollHeight
    scrollStateRef.current.isAtTop = container.scrollTop <= 8
  }, [])

  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    container.scrollTop = container.scrollHeight
    scrollStateRef.current.scrollTop = container.scrollTop
    scrollStateRef.current.scrollHeight = container.scrollHeight
    scrollStateRef.current.isAtTop = container.scrollTop <= 8
  }, [messages.length, typingVisible])

  const messagePairs = useMemo(() => {
    const pairs = []
    let currentPair = null

    messages.forEach((message) => {
      if (message.type === 'user') {
        if (currentPair) pairs.push(currentPair)
        currentPair = { user: message, bot: null }
        return
      }

      if (!currentPair) {
        currentPair = { user: null, bot: message }
        return
      }

      if (!currentPair.bot) {
        currentPair.bot = message
      } else {
        pairs.push(currentPair)
        currentPair = { user: null, bot: message }
      }
    })

    if (currentPair) pairs.push(currentPair)
    return pairs
  }, [messages])

  const markdownComponentsByRole = useMemo(() => ({
    user: createMarkdownComponents(true),
    bot: createMarkdownComponents(false)
  }), [])

  const expandedSourcesByMessage = useMemo(() => {
    const map = new Map()
    Object.keys(expandedSources).forEach((key) => {
      const [messageId, sourceIndex] = key.split('-')
      if (!map.has(messageId)) {
        map.set(messageId, new Set())
      }
      map.get(messageId).add(Number(sourceIndex))
    })
    return map
  }, [expandedSources])

  const registerUserMessageRef = useCallback((messageId) => (node) => {
    if (!node) {
      userMessageRefs.current.delete(messageId)
      return
    }
    userMessageRefs.current.set(messageId, node)
  }, [])
  const renderMessage = (message) => (
    <ChatMessageBubble
      key={message.id}
      message={message}
      markdownComponents={message.type === 'user' ? markdownComponentsByRole.user : markdownComponentsByRole.bot}
      typingText={typingVisible[message.id]}
      currentStepIndex={message.type === 'bot' && message.isLoading ? currentStepIndex : 0}
      expandedSourceSet={expandedSourcesByMessage.get(String(message.id)) || EMPTY_EXPANDED_SOURCES}
      onToggleSource={toggleSources}
      onRegisterUserRef={registerUserMessageRef}
    />
  )

  const handleSendMessage = useCallback((query, options) => {
    const event = new CustomEvent('submitChatQuery', {
      detail: { query, options }
    })
    window.dispatchEvent(event)
  }, [])

  return (
    <>
      {/* Full Chat Section */}
      {(isMobile || pyqVisible) && (
        <Box
          sx={{
            position: 'fixed',
            right: isMobile ? 0 : 4,
            left: isMobile ? 0 : 'auto',
            top: isMobile ? 60 : 64,
            bottom: isMobile ? 0 : 4,
            width: isMobile ? '100%' : 420,
            zIndex: isMobile ? 25 : 30,
            borderRadius: isMobile ? 0 : 1,
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: isMobile ? 'none' : '1px solid #808080',
            transform: isMobile ? (mobileActiveTab === 'chat' ? 'translateX(0%)' : 'translateX(100%)') : 'none',
            opacity: isMobile ? (mobileActiveTab === 'chat' ? 1 : 0) : 1,
            pointerEvents: isMobile ? (mobileActiveTab === 'chat' ? 'auto' : 'none') : 'auto',
            visibility: isMobile ? (mobileActiveTab === 'chat' ? 'visible' : 'hidden') : 'visible',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease'
          }}
        >
          {/* Main Chat Container with Theme-aware Background */}
          <Paper
            elevation={1}
            className="flex-grow rounded-lg flex flex-col overflow-hidden transition-colors duration-300"
            sx={{
              backgroundColor: '#ffffff',
              border: 'none',
              position: 'relative',
              height: '100%'
            }}
          >
            {/* Toggle Button in Header (Desktop Only) */}
            {!isMobile && (
              <Box sx={{ p: 0.75, px: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton
                    onClick={togglePyq}
                    size="small"
                    title="Hide Chat Panel"
                    sx={{ color: '#000000', padding: '3px' }}
                  >
                    <ChevronFirst width={15} height={15} strokeWidth={2} stroke="#000000" />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#1f2937', fontSize: '0.8rem' }}>
                    Chat Companion
                  </Typography>
                </Box>
              </Box>
            )}
            {/* System Status Banner */}
            {!systemStatus.healthy && (
              <Box sx={{ mx: 2, mt: 1 }}>
                <Alert
                  severity="warning"
                  variant="outlined"
                  sx={{
                    py: 0.5,
                    borderColor: 'rgba(255, 146, 28, 0.5)',
                    backgroundColor: 'rgba(255, 146, 28, 0.15)',
                    color: '#d97706',
                    fontSize: '0.75rem'
                  }}
                >
                  System initializing... Please wait for the backend to be ready.
                </Alert>
              </Box>
            )}

            {/* Rate Limit Message */}
            {rateLimitMessage && (
              <Box sx={{ mx: 2, mt: 1 }}>
                <Alert
                  severity="warning"
                  variant="outlined"
                  sx={{
                    py: 0.5,
                    borderColor: 'rgba(234, 179, 8, 0.35)',
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    color: '#92400e',
                    fontSize: '0.75rem'
                  }}
                >
                  {rateLimitMessage}
                </Alert>
              </Box>
            )}

            {/* Chat Messages */}
            <Box
              ref={scrollContainerRef}
              className="flex-grow p-4 overflow-y-auto space-y-4 text-xs"
              sx={{
                backgroundColor: '#ffffff',
                color: '#000000',
                overflowAnchor: 'none',
                scrollBehavior: 'auto',
                pb: { xs: 22, sm: 18, md: 4 }
              }}
            >
              <div className="w-full space-y-1 py-1 relative z-10">
                {messages.length === 0 && (
                  <div className="text-center py-3 mt-1 w-full">
                    <div className="w-full px-2">
                      {/* Logo and Welcome Header */}
                      <div className="mb-2">
                        <img
                          src="/pg.png"
                          alt="MG Logo"
                          className="w-28 h-28 mx-auto object-contain mb-2 mg-logo-shake transition-all duration-300"
                        />

                        <p
                          className="mb-2 text-xs transition-colors duration-300 max-w-xs mx-auto"
                          style={{
                            color: '#000000',
                            opacity: 0.7
                          }}
                        >
                          Ask any question and get comprehensive answers along with related PYQs.
                        </p>
                      </div>

                      {/* Features Section */}
                      <div className="mb-2">
                        <h3
                          className="text-sm font-semibold text-center mb-2 transition-colors duration-300"
                          style={{ color: '#000000' }}
                        >
                          Features
                        </h3>

                        {/* Feature Icons - Auto-scrolling with blurred edges */}
                        <div className="relative w-full mx-auto">
                          {/* Gradient overlays for blurred/faded edges */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none transition-all duration-300"
                            style={{
                              background: 'linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0.8), transparent)'
                            }}
                          ></div>
                          <div
                            className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none transition-all duration-300"
                            style={{
                              background: 'linear-gradient(to left, #ffffff, rgba(255, 255, 255, 0.8), transparent)'
                            }}
                          ></div>

                          {/* Auto-scrolling container */}
                          <div
                            className="features-scroll-container overflow-hidden"
                            style={{
                              maskImage: 'linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)',
                              WebkitMaskImage: 'linear-gradient(to right, transparent, black 40px, black calc(100% - 40px), transparent)'
                            }}
                          >
                            <div className="features-scroll-content flex items-center gap-2.5 animate-scroll-features">
                              {/* Duplicate the feature items twice for seamless loop */}
                              {[1, 2].map((iteration) => (
                                <Fragment key={iteration}>
                                  {/* Subject Selection */}
                                  <div className="p-3 rounded-xl group cursor-pointer transition-all duration-300 flex-shrink-0 min-w-[160px] bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-25 hover:to-purple-50 shadow-md shadow-purple-200/30">
                                    <div className="flex items-center gap-2.5">
                                      <GraduationCap className="w-7 h-7 flex-shrink-0 transition-all duration-300 text-purple-700" />
                                      <div className="flex-1">
                                        <h4 className="font-medium text-xs mb-1 text-purple-700">Subject</h4>
                                        <div className="flex flex-wrap gap-1">
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-300 text-red-800">History</span>
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-300 text-yellow-800">Polity</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Class Selection */}
                                  <div className="p-3 rounded-xl group cursor-pointer transition-all duration-300 flex-shrink-0 min-w-[160px] bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-25 hover:to-emerald-50 shadow-md shadow-emerald-200/30">
                                    <div className="flex items-center gap-2.5">
                                      <BookOpen className="w-7 h-7 flex-shrink-0 transition-all duration-300 text-emerald-700" />
                                      <div className="flex-1">
                                        <h4 className="font-medium text-xs mb-1 text-emerald-700">NCERT</h4>
                                        <div className="flex flex-wrap gap-1">
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-300 text-blue-800">6-10th</span>
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-300 text-green-800">11-12th</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Answer Length */}
                                  <div className="p-3 rounded-xl group cursor-pointer transition-all duration-300 flex-shrink-0 min-w-[160px] bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-25 hover:to-blue-50 shadow-md shadow-blue-200/30">
                                    <div className="flex items-center gap-2.5">
                                      <Sliders className="w-7 h-7 flex-shrink-0 transition-all duration-300 text-blue-700" />
                                      <div className="flex-1">
                                        <h4 className="font-medium text-xs mb-1 text-blue-700">Length</h4>
                                        <div className="flex flex-wrap gap-1">
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-300 text-amber-800">Short</span>
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-indigo-300 text-indigo-800">Detailed</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quick Response */}
                                  <div className="p-3 rounded-xl group cursor-pointer transition-all duration-300 flex-shrink-0 min-w-[140px] bg-gradient-to-br from-rose-50 to-rose-100 hover:from-rose-25 hover:to-rose-50 shadow-md shadow-rose-200/30">
                                    <div className="flex items-center gap-2.5">
                                      <Zap className="w-7 h-7 flex-shrink-0 transition-all duration-300 text-rose-700" />
                                      <div className="flex-1">
                                        <h4 className="font-medium text-xs mb-1 text-rose-700">Quick</h4>
                                        <div className="flex justify-start">
                                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-yellow-300 text-yellow-800">Instant</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {messagePairs.flatMap((pair) => [
                  pair.user ? renderMessage(pair.user) : null,
                  pair.bot ? renderMessage(pair.bot) : null
                ])}
              </div>
            </Box>

          </Paper>
        </Box>
      )}

      {/* Collapsed Chat Section (Desktop Icon Bar Only) */}
      {!isMobile && !pyqVisible && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            right: 4,
            top: 64,
            bottom: 4,
            width: 40,
            zIndex: 30,
            borderRadius: 1,
            border: '1px solid #808080',
            backgroundColor: '#ffffff',
            color: '#000000',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Toggle Button */}
          <Box sx={{ p: 0.5, display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={togglePyq}
              size="small"
              title="Show Chat Panel"
              sx={{ color: '#000000', transform: 'scaleX(-1)', padding: '3px' }}
            >
              <ChevronFirst width={15} height={15} strokeWidth={2} stroke="#000000" />
            </IconButton>
          </Box>

          {/* Icon */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconButton
              onClick={togglePyq}
              size="small"
              title="Show Chat Panel"
              sx={{ color: 'text.primary', '&:hover': { backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12) } }}
            >
              <MessageSquare className="w-4 h-4" />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  )
}

export default ChatSection
