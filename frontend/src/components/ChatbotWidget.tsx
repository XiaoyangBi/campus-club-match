import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChatbotMutation } from '../hooks/useStudentDemoData'
import { useDemoQuery } from '../context/DemoContext'
import { useAuth } from '../context/AuthContext'
import type { ChatbotMessage, ChatbotReply, ChatbotSuggestedClub } from '../types'

function createMessage(
  role: ChatbotMessage['role'],
  content: string,
  suggestedClubs: ChatbotSuggestedClub[] = [],
): ChatbotMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    suggestedClubs,
  }
}

function buildWelcomeMessage(clubCount: number) {
  return createMessage(
    'assistant',
    `你好，我是社团助手。当前平台已开放${clubCount}个社团，我可以帮你看社团介绍、怎么选社团、报名流程、面试准备和简历建议。`,
  )
}

function parseNestedJson(value: string, depth = 0): unknown {
  if (depth >= 3) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as unknown

    if (typeof parsed === 'string') {
      return parseNestedJson(parsed, depth + 1)
    }

    return parsed
  } catch {
    return null
  }
}

function decodeJsonStringValue(value: string) {
  try {
    return JSON.parse(`"${value}"`) as string
  } catch {
    return value
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  }
}

function extractReplyFieldFromRawText(value: string) {
  const trimmed = value.trim()
  const replyPrefix = '"reply":"'
  const replyStartIndex = trimmed.indexOf(replyPrefix)

  if (replyStartIndex < 0) {
    return null
  }

  const start = replyStartIndex + replyPrefix.length
  const suffixCandidates = ['","suggestedClubs":', '"}', '", "suggestedClubs":']

  for (const suffix of suffixCandidates) {
    const end = trimmed.lastIndexOf(suffix)
    if (end > start) {
      return decodeJsonStringValue(trimmed.slice(start, end)).trim()
    }
  }

  return null
}

function isSuggestedClubArray(value: unknown): value is ChatbotSuggestedClub[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== 'object') {
      return false
    }

    const clubId = 'clubId' in item ? item.clubId : undefined
    const reason = 'reason' in item ? item.reason : undefined
    return typeof clubId === 'string' && typeof reason === 'string'
  })
}

function normalizeReplyPayload(result: { reply: string; suggestedClubs?: ChatbotSuggestedClub[] }): ChatbotReply {
  let reply = result.reply.trim()
  let suggestedClubs = result.suggestedClubs ?? []

  for (let depth = 0; depth < 3; depth += 1) {
    if (!reply.startsWith('{') && !reply.startsWith('"')) {
      break
    }

    const parsed = parseNestedJson(reply)

    if (!parsed || typeof parsed !== 'object') {
      break
    }

    const nextReply = 'reply' in parsed ? parsed.reply : undefined
    const nextSuggestedClubs = 'suggestedClubs' in parsed ? parsed.suggestedClubs : undefined

    if (typeof nextReply !== 'string') {
      break
    }

    reply = nextReply.trim()
    if (isSuggestedClubArray(nextSuggestedClubs)) {
      suggestedClubs = nextSuggestedClubs
    }
  }

  const shouldExtractReplyField = reply.trim().startsWith('{') && reply.includes('"reply"')
  const extractedReply = shouldExtractReplyField ? extractReplyFieldFromRawText(reply) : null

  if (extractedReply) {
    reply = extractedReply
  }

  return {
    reply,
    suggestedClubs,
  }
}

function normalizeStoredMessage(message: ChatbotMessage): ChatbotMessage {
  if (message.role !== 'assistant') {
    return message
  }

  const normalized = normalizeReplyPayload({
    reply: message.content,
    suggestedClubs: message.suggestedClubs ?? [],
  })

  return {
    ...message,
    content: normalized.reply,
    suggestedClubs: normalized.suggestedClubs,
  }
}

const quickPrompts = [
  '我适合先了解哪个社团？',
  '报名一个社团前要准备什么？',
  '社团面试一般会问什么？',
  '简历怎么写更容易通过初筛？',
]

function isValidStoredMessages(value: unknown): value is ChatbotMessage[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== 'object') {
      return false
    }

    const role = 'role' in item ? item.role : undefined
    const content = 'content' in item ? item.content : undefined

    return (role === 'user' || role === 'assistant') && typeof content === 'string'
  })
}

export function ChatbotWidget() {
  const location = useLocation()
  const { clubs } = useDemoQuery()
  const { user } = useAuth()
  const chatMutation = useChatbotMutation()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatbotMessage[]>([])
  const storageKey = useMemo(() => `student-chatbot-history-${user?.id ?? 'guest'}`, [user?.id])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)

      if (!raw) {
        setMessages([buildWelcomeMessage(clubs.length)])
        return
      }

      const parsed = JSON.parse(raw) as unknown
      if (isValidStoredMessages(parsed) && parsed.length > 0) {
        setMessages(parsed.map(normalizeStoredMessage))
        return
      }

      setMessages([buildWelcomeMessage(clubs.length)])
    } catch {
      setMessages([buildWelcomeMessage(clubs.length)])
    }
  }, [storageKey, clubs.length])

  useEffect(() => {
    if (messages.length === 0) {
      return
    }

    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)))
  }, [messages, storageKey])

  const canSubmit = draft.trim().length > 0 && !chatMutation.isPending
  const promptCountLabel = useMemo(() => `${clubs.length}个开放社团`, [clubs.length])

  const sendMessage = (content: string) => {
    const trimmed = content.trim()

    if (!trimmed || chatMutation.isPending) {
      return
    }

    const userMessage = createMessage('user', trimmed)
    const nextMessages = [...messages, userMessage]
    const payloadMessages = nextMessages.slice(-8)

    setMessages(nextMessages)
    setDraft('')

    chatMutation.mutate(
      {
        messages: payloadMessages,
        currentPath: location.pathname,
      },
      {
        onSuccess: (result) => {
          const normalizedResult = normalizeReplyPayload(result)

          setMessages((current) => [
            ...current,
            createMessage(
              'assistant',
              normalizedResult.reply.trim() || '我先帮你整理到这里，你也可以继续追问更具体的问题。',
              normalizedResult.suggestedClubs ?? [],
            ),
          ])
        },
        onError: (error) => {
          setMessages((current) => [
            ...current,
            createMessage(
              'assistant',
              error instanceof Error ? error.message : '刚刚回复失败了，你可以再问一次。',
            ),
          ])
        },
      },
    )
  }

  return (
    <div className="chatbot-shell" aria-live="polite">
      {isOpen ? (
        <section className="chatbot-panel">
          <div className="chatbot-panel-header">
            <div className="chatbot-panel-title">
              <span className="chatbot-badge">AI助手</span>
              <strong>社团顾问</strong>
              <p>围绕社团介绍、选择、报名、面试和简历给你建议。</p>
            </div>
            <button
              type="button"
              className="chatbot-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="关闭社团助手"
            >
              ×
            </button>
          </div>

          <div className="chatbot-meta-row">
            <span>{promptCountLabel}</span>
            <button
              type="button"
              className="ghost-button"
              disabled={chatMutation.isPending}
              onClick={() => {
                setMessages([buildWelcomeMessage(clubs.length)])
                setDraft('')
                window.localStorage.removeItem(storageKey)
              }}
            >
              重新开始
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message) => {
              const displayMessage = normalizeStoredMessage(message)

              return (
                <article
                  key={message.id}
                  className={message.role === 'assistant' ? 'chatbot-message assistant' : 'chatbot-message user'}
                >
                  <span className="chatbot-message-role">{message.role === 'assistant' ? '助手' : '你'}</span>
                  <div className="chatbot-message-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayMessage.content}</ReactMarkdown>
                  </div>
                  {message.role === 'assistant' && displayMessage.suggestedClubs && displayMessage.suggestedClubs.length > 0 ? (
                  <div className="chatbot-suggestion-list">
                    {displayMessage.suggestedClubs.map((suggestion) => {
                      const club = clubs.find((item) => item.id === suggestion.clubId)

                      if (!club) {
                        return null
                      }

                      return (
                        <article key={`${message.id}-${suggestion.clubId}`} className="chatbot-suggestion-card">
                          <div className="chatbot-suggestion-copy">
                            <span>{club.category}</span>
                            <strong>{club.name}</strong>
                            <p>{suggestion.reason || club.intro}</p>
                          </div>
                          <Link
                            to={`/clubs/${club.id}`}
                            className="secondary-link chatbot-suggestion-link"
                            onClick={() => setIsOpen(false)}
                          >
                            查看社团详情
                          </Link>
                        </article>
                      )
                    })}
                  </div>
                ) : null}
                </article>
              )
            })}

            {chatMutation.isPending ? (
              <article className="chatbot-message assistant pending">
                <span className="chatbot-message-role">助手</span>
                <p>正在整理建议...</p>
              </article>
            ) : null}
          </div>

          <div className="chatbot-quick-prompts">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="chip"
                disabled={chatMutation.isPending}
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="chatbot-input-row"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage(draft)
            }}
          >
            <textarea
              value={draft}
              rows={3}
              placeholder="直接问我：哪个社团适合我、报名怎么准备、面试怎么答..."
              disabled={chatMutation.isPending}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendMessage(draft)
                }
              }}
            />
            <button type="submit" className="primary-button chatbot-send-button" disabled={!canSubmit}>
              {chatMutation.isPending ? '处理中...' : '发送'}
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="chatbot-launcher"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? '收起社团助手' : '打开社团助手'}
      >
        <span className="chatbot-launcher-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3.5c-4.97 0-9 3.5-9 7.82 0 2.3 1.14 4.37 2.95 5.8-.11 1.28-.52 2.5-1.2 3.56 1.69-.23 3.22-.84 4.47-1.77.87.2 1.8.31 2.78.31 4.97 0 9-3.5 9-7.9 0-4.32-4.03-7.82-9-7.82Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.5 11.25h7M8.5 14.25h4.25M9 8.25h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <span className="chatbot-launcher-copy">
          <strong>AI社团助手</strong>
          <small>随时问我</small>
        </span>
      </button>
    </div>
  )
}
