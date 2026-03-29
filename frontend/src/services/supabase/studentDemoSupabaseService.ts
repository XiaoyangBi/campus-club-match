import type {
  AiMatchHistoryRecord,
  AiMatchResult,
  ApplicationRecord,
  ChatbotMessage,
  ChatbotReply,
  NotificationInbox,
  ResumeParseSuggestion,
  StudentDemoBootstrap,
  StudentProfile,
} from '../../types'
import { supabase } from '../../lib/supabaseClient'

type SubmitApplicationInput = {
  clubId: string
  clubName: string
  selectedDirection: string
  selfIntro: string
  attachmentPath?: string | null
}

type WithdrawApplicationInput = {
  applicationId: string
}

function isResponseLike(value: unknown): value is Response {
  return typeof value === 'object' && value !== null && 'text' in value
}

function isEdgeFunctionNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return [
    'Failed to send a request to the Edge Function',
    'Failed to fetch',
    'Load failed',
    'NetworkError',
  ].some((keyword) => error.message.includes(keyword))
}

async function invokeFunctionOnce<TResponse>(name: string, body: Record<string, unknown>) {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { data, error } = await supabase.functions.invoke(name, {
    body,
  })

  if (error) {
    const maybeContext =
      typeof error === 'object' && error !== null && 'context' in error ? error.context : null

    if (isResponseLike(maybeContext)) {
      try {
        const rawText = await maybeContext.text()
        const parsed = JSON.parse(rawText) as { error?: string }

        if (parsed?.error) {
          throw new Error(parsed.error)
        }

        if (rawText.trim()) {
          throw new Error(rawText)
        }
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message) {
          throw parseError
        }
      }
    }

    throw error
  }

  return data as TResponse
}

async function invokeFunction<TResponse>(name: string, body: Record<string, unknown>) {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  try {
    return await invokeFunctionOnce<TResponse>(name, body)
  } catch (error) {
    if (isEdgeFunctionNetworkError(error)) {
      try {
        return await invokeFunctionOnce<TResponse>(name, body)
      } catch (retryError) {
        if (isEdgeFunctionNetworkError(retryError)) {
          throw new Error('网络有点波动，暂时没连上服务。请稍后再试一次。')
        }

        throw retryError
      }
    }

    throw error
  }
}

export const studentDemoSupabaseService = {
  getBootstrap() {
    return invokeFunction<StudentDemoBootstrap>('student-demo-bootstrap', {})
  },

  updateProfile(profile: StudentProfile) {
    return invokeFunction<StudentProfile>('student-demo-profile', { profile })
  },

  updateFavorites(favorites: string[]) {
    return invokeFunction<string[]>('student-demo-favorites', { favorites })
  },

  submitApplication(input: SubmitApplicationInput) {
    return invokeFunction<ApplicationRecord | null>('student-demo-application', input)
  },

  withdrawApplication(input: WithdrawApplicationInput) {
    return invokeFunction<ApplicationRecord | null>('student-demo-application-withdraw', input)
  },

  runAiMatch(refresh = false) {
    return invokeFunction<AiMatchResult>('student-demo-ai-match', { refresh })
  },

  getLatestAiMatch() {
    return invokeFunction<AiMatchResult | null>('student-demo-ai-match-latest', {})
  },

  getAiMatchHistory() {
    return invokeFunction<AiMatchHistoryRecord[]>('student-demo-ai-match-history', {})
  },

  getNotifications() {
    return invokeFunction<NotificationInbox>('student-demo-notifications', {})
  },

  markNotificationsRead(notificationIds?: string[]) {
    return invokeFunction<{ unreadCount: number }>('student-demo-notifications-read', {
      notificationIds: notificationIds ?? [],
    })
  },

  parseResumeText(extractedText: string) {
    return invokeFunction<ResumeParseSuggestion>('student-demo-resume-parse', {
      extractedText,
    })
  },

  chatWithAssistant(messages: ChatbotMessage[], currentPath: string) {
    return invokeFunction<ChatbotReply>('student-demo-chatbot', {
      messages,
      currentPath,
    })
  },
}
