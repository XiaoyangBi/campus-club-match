import type {
  AiMatchHistoryRecord,
  AiMatchResult,
  ApplicationRecord,
  NotificationInbox,
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

async function invokeFunction<TResponse>(name: string, body: Record<string, unknown>) {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { data, error } = await supabase.functions.invoke(name, {
    body,
  })

  if (error) {
    throw error
  }

  return data as TResponse
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
}
