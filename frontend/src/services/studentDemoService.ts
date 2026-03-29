import { clubs, initialProfile } from '../data/mock'
import type {
  AiMatchHistoryRecord,
  AiMatchResult,
  NotificationInbox,
  ResumeParseSuggestion,
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

function pickMatches(sourceText: string, options: readonly string[], maxCount: number) {
  const matched = options.filter((option) => sourceText.includes(option)).slice(0, maxCount)
  return matched
}

function buildMockResumeSuggestion(extractedText: string): ResumeParseSuggestion {
  const normalizedText = extractedText.replace(/\s+/g, '')
  const interests = pickMatches(normalizedText, initialProfile.interests.length ? ['媒体运营', '摄影摄像', '设计创意', '竞赛科研', '公益服务', '活动策划', '体育运动', '音乐舞蹈'] : [], 5)
  const skills = pickMatches(normalizedText, ['文案写作', '平面设计', '视频剪辑', '编程开发', '组织协调', '主持表达'], 5)
  const expectedGain = pickMatches(normalizedText, ['技能提升', '社交拓展', '比赛经历', '志愿服务', '表达机会'], 3)

  return {
    college: normalizedText.includes('计算机') ? '计算机学院' : '',
    major: normalizedText.includes('软件工程') ? '软件工程' : normalizedText.includes('计算机科学') ? '计算机科学与技术' : '',
    interests: interests.length > 0 ? interests : ['竞赛科研', '活动策划'],
    skills: skills.length > 0 ? skills : ['组织协调', '文案写作'],
    expectedGain: expectedGain.length > 0 ? expectedGain : ['技能提升', '社交拓展'],
    summary: '已根据简历中的经历、项目和关键词生成一版候选画像，建议你确认后再保存到正式画像。',
    confidence: normalizedText.length > 400 ? 'medium' : 'low',
    evidence: [
      '提取了简历中的项目经历、校园活动和技能关键词',
      '优先映射到平台现有的兴趣、技能与期望收获标签',
    ],
  }
}

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

  parseResumeText(extractedText: string) {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.parseResumeText(extractedText)
    }

    return Promise.resolve(buildMockResumeSuggestion(extractedText))
  },
}
