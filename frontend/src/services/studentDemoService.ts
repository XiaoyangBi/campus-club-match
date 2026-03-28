import { clubs, initialProfile } from '../data/mock'
import type {
  AiMatchHistoryRecord,
  AiMatchResult,
  NotificationInbox,
  StudentDemoBootstrap,
  StudentProfile,
} from '../types'
import { hasSupabaseEnv } from '../lib/supabaseClient'
import { supabase } from '../lib/supabaseClient'
import { buildScoredClubs } from '../utils/recommendation'
import {
  createApplication as createApplicationByMockApi,
  fetchStudentDemoBootstrap,
  saveFavorites,
  saveStudentProfile,
  withdrawApplication as withdrawApplicationByMockApi,
} from './mock/studentDemoMockApi'
import { studentDemoSupabaseService } from './supabase/studentDemoSupabaseService'

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

export const studentDemoService = {
  getBootstrap(): Promise<StudentDemoBootstrap> {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.getBootstrap()
    }

    return fetchStudentDemoBootstrap()
  },

  updateProfile(profile: StudentProfile) {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.updateProfile(profile)
    }

    return saveStudentProfile(profile)
  },

  updateFavorites(favorites: string[]) {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.updateFavorites(favorites)
    }

    return saveFavorites(favorites)
  },

  submitApplication(input: SubmitApplicationInput) {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.submitApplication(input)
    }

    return createApplicationByMockApi(input)
  },

  withdrawApplication(input: WithdrawApplicationInput) {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.withdrawApplication(input)
    }

    return withdrawApplicationByMockApi(input)
  },

  runAiMatch(refresh = false): Promise<AiMatchResult> {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.runAiMatch(refresh)
    }

    return Promise.resolve({
      matches: buildScoredClubs(clubs, initialProfile)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3)
        .map((club) => ({
          clubId: club.id,
          score: club.matchScore,
          reasons: club.reasons,
        })),
      generatedAt: new Date().toISOString(),
      source: refresh ? 'ai' : 'cache',
    })
  },

  getLatestAiMatch(): Promise<AiMatchResult | null> {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.getLatestAiMatch()
    }

    return Promise.resolve<AiMatchResult>({
      matches: buildScoredClubs(clubs, initialProfile)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3)
        .map((club) => ({
          clubId: club.id,
          score: club.matchScore,
          reasons: club.reasons,
        })),
      generatedAt: new Date().toISOString(),
      source: 'cache',
    })
  },

  getAiMatchHistory(): Promise<AiMatchHistoryRecord[]> {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.getAiMatchHistory()
    }

    return Promise.resolve([
      {
        id: 'mock-ai-run-latest',
        matches: buildScoredClubs(clubs, initialProfile)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 3)
          .map((club) => ({
            clubId: club.id,
            score: club.matchScore,
            reasons: club.reasons,
          })),
        generatedAt: new Date().toISOString(),
        source: 'cache',
      },
    ])
  },

  getNotifications(): Promise<NotificationInbox> {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.getNotifications()
    }

    return Promise.resolve({
      unreadCount: 0,
      notifications: [],
    })
  },

  markNotificationsRead(notificationIds?: string[]) {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.markNotificationsRead(notificationIds)
    }

    return Promise.resolve({ unreadCount: 0 })
  },

  async uploadResume(file: File) {
    if (!supabase) {
      return null
    }

    const extension = file.name.includes('.') ? file.name.split('.').pop() ?? 'pdf' : 'pdf'
    const filePath = `${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()}-${Date.now()}.${extension}`

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('当前未登录，无法上传简历')
    }

    const storagePath = `${user.id}/${filePath}`
    const { error } = await supabase.storage.from('application-resumes').upload(storagePath, file, {
      upsert: true,
      contentType: file.type || undefined,
    })

    if (error) {
      throw error
    }

    return storagePath
  },
}
