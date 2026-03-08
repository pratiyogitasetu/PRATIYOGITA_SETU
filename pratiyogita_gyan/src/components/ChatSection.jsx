import { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, ChevronUp, FileText, Hash } from 'lucide-react'
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
import { SEARCH_SETTINGS } from '../config/searchSettings'
import { validateSearchQuery } from '../utils/validation'

const EMPTY_EXPANDED_SOURCES = new Set()
const PENDING_CHAT_LOAD_STORAGE_KEY = 'pendingChatToLoad'
const MAX_CHAT_TITLE_LENGTH = 32
const MAX_CHAT_TITLE_WORDS = 4
const CHAT_FONT_SIZES = {
  body: { xs: '0.75rem', md: '0.875rem' },
  h1: { xs: '1rem', md: '1.125rem' },
  h2: { xs: '0.9rem', md: '1.025rem' },
  h3: { xs: '0.85rem', md: '0.975rem' },
  code: { xs: '0.72rem', md: '0.845rem' }
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
  aiStatusText,
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
      sx={{ display: 'flex', justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
          width: { xs: '100%', md: 'auto' },
          maxWidth: { xs: '100%', md: '80%' },
          flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
        }}
      >
        {/* Avatar */}
        <Box sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {message.type === 'user' ? (
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
              <User size={12} />
            </Avatar>
          ) : (
            <Box
              component="img"
              src="/mg.png"
              alt="MG Bot"
              sx={{ width: 48, height: 48, objectFit: 'contain' }}
            />
          )}
        </Box>

        {/* Message content */}
        <Paper
          elevation={0}
          sx={{
            p: message.type === 'bot' ? 1.15 : 1.4,
            width: { xs: '100%', md: 'auto' },
            borderRadius: 2,
            backgroundColor: message.type === 'user' ? 'primary.main' : 'background.paper',
            color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
            border: message.type === 'user' ? 'none' : (theme) => `1px solid ${theme.palette.divider}`
          }}
        >
          {/* Loading Indicator - Only for bot messages when loading */}
          {message.type === 'bot' && message.isLoading ? (
            <Box>
              <SearchProgressIndicator isVisible={true} />
              {aiStatusText && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#6b7280' }}>
                  {aiStatusText}
                </Typography>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                fontSize: '0.75rem',
                lineHeight: message.type === 'bot' ? 1.34 : 1.5,
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
          )}

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

                <Stack direction="row" spacing={0.5} flexWrap="wrap">
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
                          px: 1,
                          py: 0.25,
                          borderRadius: 999,
                          fontSize: '0.7rem',
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
                          <Hash className="w-2.5 h-2.5" />
                          <span>{index + 1}</span>
                          {source.score && (
                            <span style={{ opacity: 0.75 }}>({(source.score * 100).toFixed(0)}%)</span>
                          )}
                        </Box>
                      </Button>
                    )
                  })}
                </Stack>
              </Box>

              {/* Individual Source Content - Only show the specific expanded source */}
              {message.sources.map((source, index) => {
                const isExpanded = expandedSourceSet.has(index)
                const sourceKey = `${message.id}-${index}`
                return isExpanded ? (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{ mt: 2, p: 1.5, borderRadius: 2, backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0' }}
                  >
                    {/* Source Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Hash className="w-2.5 h-2.5" style={{ color: '#000000', opacity: 0.6 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#000000' }}>
                          Source {index + 1}
                        </Typography>
                        {source.score && (
                          <Chip
                            size="small"
                            label={`${(source.score * 100).toFixed(1)}%`}
                            sx={{ backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.2), color: 'text.primary', fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                      <IconButton onClick={() => onToggleSource(sourceKey)} size="small" sx={{ color: '#000000', opacity: 0.6 }}>
                        <ChevronUp className="w-2.5 h-2.5" />
                      </IconButton>
                    </Box>

                    {/* Source Details */}
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {source.subject && (
                          <Chip size="small" label={source.subject} sx={{ backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.18), color: 'text.primary', fontSize: '0.7rem' }} />
                        )}
                        {source.class && (
                          <Chip size="small" label={source.class} sx={{ backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08), color: 'text.primary', fontSize: '0.7rem' }} />
                        )}
                        {(source.chapter || source.chapter_name) && (
                          <Chip size="small" label={source.chapter_name || source.chapter} sx={{ backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08), color: 'text.primary', fontSize: '0.7rem' }} />
                        )}
                        {source.topic && (
                          <Chip size="small" label={source.topic} sx={{ backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.08), color: 'text.primary', fontSize: '0.7rem' }} />
                        )}
                      </Stack>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.7rem', pt: 1, borderTop: '1px solid #e0e0e0', color: '#000000', opacity: 0.6 }}>
                        {source.chunk && (
                          <span><strong>Chunk:</strong> {source.chunk}</span>
                        )}
                        <span><strong>Score:</strong> {(source.score * 100).toFixed(1)}%</span>
                      </Box>

                      {(source.content || source.text_preview || source.text || source.full_text) && (
                        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0', maxHeight: 256, overflowY: 'auto' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#000000', display: 'block', mb: 1 }}>
                            Content:
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', color: '#000000', opacity: 0.8 }}>
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
  aiStatusText: PropTypes.string,
  expandedSourceSet: PropTypes.instanceOf(Set),
  onToggleSource: PropTypes.func.isRequired,
  onRegisterUserRef: PropTypes.func.isRequired
}

const ChatSection = () => {
  const { theme } = useTheme()
  const isDarkMode = theme?.mode === 'dark'
  const { contentOffsetLeft, pyqVisible } = useLayout()
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
  const [aiStatusText, setAiStatusText] = useState('')
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
      setAiStatusText('')
      return
    }

    const steps = [
      'Reformatting your question…',
      'Querying AI model…',
      'Fetching relevant information…',
      'Preparing final response…'
    ]

    setAiStatusText(steps[0])
    const timeouts = steps.slice(1).map((step, index) =>
      setTimeout(() => {
        setAiStatusText(step)
      }, (index + 1) * 900)
    )

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

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    scrollStateRef.current.scrollTop = container.scrollTop
    scrollStateRef.current.scrollHeight = container.scrollHeight
    scrollStateRef.current.isAtTop = container.scrollTop <= 8
  }, [])

  useLayoutEffect(() => {
    const targetId = pendingScrollToIdRef.current
    if (!targetId) return

    const container = scrollContainerRef.current
    const targetNode = userMessageRefs.current.get(targetId)
    if (!container || !targetNode) return

    const computed = window.getComputedStyle(container)
    const paddingTop = Number.parseFloat(computed.paddingTop || '0') || 0
    const nextTop = Math.max(0, targetNode.offsetTop - paddingTop)

    container.scrollTop = nextTop
    scrollStateRef.current.scrollTop = container.scrollTop
    scrollStateRef.current.scrollHeight = container.scrollHeight
    scrollStateRef.current.isAtTop = container.scrollTop <= 8

    pendingScrollToIdRef.current = null
  }, [messages.length])

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
      aiStatusText={message.type === 'bot' && message.isLoading ? aiStatusText : ''}
      expandedSourceSet={expandedSourcesByMessage.get(String(message.id)) || EMPTY_EXPANDED_SOURCES}
      onToggleSource={toggleSources}
      onRegisterUserRef={registerUserMessageRef}
    />
  )

  // Calculate dynamic margins based on visibility (match fixed panel sizes)
  const leftMarginPx = contentOffsetLeft
  const rightMarginPx = useMemo(() => (pyqVisible ? 428 : 48), [pyqVisible])

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        pl: 1,
        pr: 1,
        pb: 1,
        ml: { xs: 0, md: `${leftMarginPx}px` },
        mr: { xs: 0, md: `${rightMarginPx}px` }
      }}
    >
        {/* Main Chat Container with Theme-aware Background */}
        <Paper
          elevation={1}
          className="flex-1 rounded-lg shadow-sm flex flex-col overflow-hidden transition-colors duration-300"
          sx={{
            backgroundColor: { xs: 'transparent', md: '#ffffff' },
            border: { xs: 'none', md: '1px solid #808080' },
            position: 'relative'
          }}
        >
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
          
          {/* Scrollable Messages Container */}
          <Box
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 pb-2 chat-messages-container relative"
            style={{ overscrollBehavior: 'none' }}
            sx={{ pb: { xs: 8, md: 2 } }}
          >
            {/* Grid background for empty welcome state - spans full chat width */}
            {messages.length === 0 && (
              <div
                className="absolute inset-0 z-0 transition-opacity duration-300"
                style={{
                     backgroundImage: `linear-gradient(to right, rgba(58, 124, 165, 0.18) 1px, transparent 1px),
                       linear-gradient(to bottom, rgba(58, 124, 165, 0.18) 1px, transparent 1px)`,
                  backgroundSize: "20px 30px",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
                  maskImage:
                    "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
                }}
              />
            )}

            <div className="w-full md:w-[90%] max-w-none md:mx-auto space-y-2 py-2 relative z-10">
              {/* Welcome message when no messages exist */}
              {messages.length === 0 && (
                <div className="text-center py-3 mt-1">
                  <div className="max-w-3xl mx-auto">
                    {/* Logo and Welcome Header */}
                    <div className="mb-2">
                      <img 
                        src="/pg.png" 
                        alt="MG Logo" 
                        className="w-40 h-40 mx-auto object-contain mb-3 mg-logo-shake transition-all duration-300"
                      />
                      <h3 
                        className="text-lg font-semibold mb-2 transition-colors duration-300" 
                        style={{ color: '#000000' }}
                      >
                        Welcome to PRATIYOGITA GYAN!
                      </h3>
                      <p 
                        className="mb-2 text-sm transition-colors duration-300" 
                        style={{ 
                          color: '#000000',
                          opacity: 0.7
                        }}
                      >
                        Ask any question about your subjects and get comprehensive answers along with related previous year questions.
                      </p>
                    </div>

                    {/* Features Section */}
                    <div className="mb-3 md:mb-6">
                      <h3 
                        className="text-lg font-semibold text-center mb-4 transition-colors duration-300" 
                        style={{ color: '#000000' }}
                      >
                        Features
                      </h3>
                      
                      {/* Feature Icons - Auto-scrolling with blurred edges */}
                      <div className="relative w-full max-w-4xl mx-auto">
                        {/* Gradient overlays for blurred/faded edges */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-all duration-300"
                          style={{ 
                            background: 'linear-gradient(to right, #ffffff, rgba(255, 255, 255, 0.8), transparent)'
                          }}
                        ></div>
                        <div 
                          className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none transition-all duration-300"
                          style={{ 
                            background: 'linear-gradient(to left, #ffffff, rgba(255, 255, 255, 0.8), transparent)'
                          }}
                        ></div>
                        
                        {/* Auto-scrolling container */}
                        <div 
                          className="features-scroll-container overflow-hidden"
                          style={{
                            maskImage: 'linear-gradient(to right, transparent, black 60px, black calc(100% - 60px), transparent)',
                            WebkitMaskImage: 'linear-gradient(to right, transparent, black 60px, black calc(100% - 60px), transparent)'
                          }}
                        >
                          <div className="features-scroll-content flex items-center gap-4 animate-scroll-features">
                            {/* Duplicate the feature items twice for seamless loop */}
                            {[1, 2].map((iteration) => (
                              <Fragment key={iteration}>
                                {/* Subject Selection */}
                                <div className={`p-5 rounded-[15px] group cursor-pointer transition-all duration-300 flex-shrink-0 min-w-[240px] ${
                                  isDarkMode 
                                    ? 'bg-gradient-to-br from-purple-100 to-purple-200 hover:from-purple-50 hover:to-purple-100 shadow-lg shadow-purple-200/20' 
                                    : 'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-25 hover:to-purple-50 shadow-lg shadow-purple-200/30'
                                }`}>
                                  <div className="flex items-center gap-4">
                                    <img 
                                      src="/subject.svg" 
                                      alt="Subject Selection" 
                                      className="w-12 h-12 flex-shrink-0 transition-all duration-300"
                                    />
                                    <div className="flex-1">
                                      <h4 className={`font-medium text-sm mb-2 transition-colors ${'text-purple-700'}`}>Subject</h4>
                                      <div className="flex flex-wrap gap-1.5">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-300 text-red-800">History</span>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-300 text-yellow-800">Polity</span>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-300 text-green-800">Geography</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* NCERT Content */}
                                <div className={`p-5 rounded-[15px] group cursor-pointer transition-all duration-300 flex-shrink-0 min-w-[220px] ${
                                  isDarkMode 
                                    ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 hover:from-emerald-50 hover:to-emerald-100 shadow-lg shadow-emerald-200/20' 
                                    : 'bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-25 hover:to-emerald-50 shadow-lg shadow-emerald-200/30'
                                }`}>
                                  <div className="flex items-center gap-4">
                                    <img 
                                      src="/book.svg" 
                                      alt="NCERT Books" 
                                      className="w-12 h-12 flex-shrink-0 transition-all duration-300"
                                    />
                                    <div className="flex-1">
                                      <h4 className={`font-medium text-sm mb-2 transition-colors ${'text-emerald-700'}`}>NCERT</h4>
                                      <div className="flex justify-start">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-300 text-green-800">Class 6 - 12</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Previous Year Questions */}
                                <div className={`p-5 rounded-[15px] group cursor-pointer transition-all duration-300 flex-shrink-0 min-w-[260px] ${
                                  isDarkMode 
                                    ? 'bg-gradient-to-br from-blue-100 to-blue-200 hover:from-blue-50 hover:to-blue-100 shadow-lg shadow-blue-200/20' 
                                    : 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-25 hover:to-blue-50 shadow-lg shadow-blue-200/30'
                                }`}>
                                  <div className="flex items-center gap-4">
                                    <img 
                                      src="/pyq.svg" 
                                      alt="PYQ Questions" 
                                      className="w-12 h-12 flex-shrink-0 transition-all duration-300"
                                    />
                                    <div className="flex-1">
                                      <h4 className={`font-medium text-sm mb-2 transition-colors ${'text-blue-700'}`}>PYQ</h4>
                                      <div className="flex flex-wrap gap-1.5">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-300 text-indigo-800">UPSC</span>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-300 text-violet-800">CDS</span>
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-300 text-pink-800">SSC</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* AI Analysis */}
                                <div className={`p-5 rounded-[15px] group cursor-pointer transition-all duration-300 flex-shrink-0 min-w-[220px] ${
                                  isDarkMode 
                                    ? 'bg-gradient-to-br from-orange-100 to-orange-200 hover:from-orange-50 hover:to-orange-100 shadow-lg shadow-orange-200/20' 
                                    : 'bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-25 hover:to-orange-50 shadow-lg shadow-orange-200/30'
                                }`}>
                                  <div className="flex items-center gap-4">
                                    <img 
                                      src="/AI.svg" 
                                      alt="AI Analysis" 
                                      className="w-12 h-12 flex-shrink-0 transition-all duration-300"
                                    />
                                    <div className="flex-1">
                                      <h4 className={`font-medium text-sm mb-2 transition-colors ${'text-orange-700'}`}>AI</h4>
                                      <div className="flex justify-start">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-300 text-red-800">Accurate &amp; Precise</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Comprehensive Learning */}
                                <div className={`p-5 rounded-[15px] group cursor-pointer transition-all duration-300 flex-shrink-0 min-w-[220px] ${
                                  isDarkMode 
                                    ? 'bg-gradient-to-br from-teal-100 to-teal-200 hover:from-teal-50 hover:to-teal-100 shadow-lg shadow-teal-200/20' 
                                    : 'bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-25 hover:to-teal-50 shadow-lg shadow-teal-200/30'
                                }`}>
                                  <div className="flex items-center gap-4">
                                    <img 
                                      src="/Comprehensive.svg" 
                                      alt="Comprehensive Learning" 
                                      className="w-12 h-12 flex-shrink-0 transition-all duration-300"
                                    />
                                    <div className="flex-1">
                                      <h4 className={`font-medium text-sm mb-2 transition-colors ${'text-teal-700'}`}>Learning</h4>
                                      <div className="flex justify-start">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-cyan-300 text-cyan-800">Great Learning</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Quick Response */}
                                <div className={`p-5 rounded-[15px] group cursor-pointer transition-all duration-300 flex-shrink-0 min-w-[220px] ${
                                  isDarkMode 
                                    ? 'bg-gradient-to-br from-rose-100 to-rose-200 hover:from-rose-50 hover:to-rose-100 shadow-lg shadow-rose-200/20' 
                                    : 'bg-gradient-to-br from-rose-50 to-rose-100 hover:from-rose-25 hover:to-rose-50 shadow-lg shadow-rose-200/30'
                                }`}>
                                  <div className="flex items-center gap-4">
                                    <img 
                                      src="/quick.svg" 
                                      alt="Quick Response" 
                                      className="w-12 h-12 flex-shrink-0 transition-all duration-300"
                                    />
                                    <div className="flex-1">
                                      <h4 className={`font-medium text-sm mb-2 transition-colors ${'text-rose-700'}`}>Quick</h4>
                                      <div className="flex justify-start">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-300 text-yellow-800">Instant response</span>
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

          {/* Embedded Search Bar at Bottom */}
          <Divider sx={{ borderColor: '#e0e0e0', display: { xs: 'none', md: 'block' } }} />
          <Box
            sx={{
              p: { xs: 0, md: 1 },
              position: { xs: 'fixed', md: 'relative' },
              left: { xs: 0, md: 'auto' },
              right: { xs: 0, md: 'auto' },
              bottom: { xs: 0, md: 'auto' },
              zIndex: 120,
              backgroundColor: '#ffffff',
              borderTop: { xs: '1px solid #e0e0e0', md: 'none' }
            }}
          >
            <EmbeddedSearchBar onSendMessage={sendMessage} isLoading={isLoading} />
          </Box>
        </Paper>
    </Box>
  )
}

export default ChatSection
