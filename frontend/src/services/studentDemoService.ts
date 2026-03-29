import { clubs, initialProfile } from '../data/mock'
import type {
  AiMatchHistoryRecord,
  AiMatchResult,
  ChatbotMessage,
  ChatbotReply,
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

function buildMockChatbotReply(messages: ChatbotMessage[]): ChatbotReply {
  const latestMessage = messages[messages.length - 1]?.content.trim() ?? ''
  const lowerMessage = latestMessage.toLowerCase()

  const matchedClub = clubs.find((club) => latestMessage.includes(club.name))

  if (matchedClub) {
    return {
      reply: `${matchedClub.name}属于${matchedClub.category}类社团，主要方向包括${matchedClub.availableDirections.join('、')}。${matchedClub.intro}如果你更看重${matchedClub.highlights[0] ?? '实际参与机会'}，它会是值得优先了解的一类选择。`,
      suggestedClubs: [
        {
          clubId: matchedClub.id,
          reason: `适合先看${matchedClub.availableDirections[0] ?? '核心方向'}方向`,
        },
      ],
    }
  }

  if (lowerMessage.includes('简历') || latestMessage.includes('简历')) {
    return {
      reply: '社团报名简历建议突出3块：和目标方向相关的经历、你能稳定投入的时间、以及你想在社团里继续提升什么。如果你要投媒体或内容类社团，最好补上作品、活动经历或具体负责过的内容。',
      suggestedClubs: [],
    }
  }

  if (latestMessage.includes('面试')) {
    return {
      reply: '社团面试通常会看3点：你为什么想来、你过去做过什么、你进来后想承担什么方向。准备时可以先用1分钟说清兴趣来源，再举1到2个具体经历，最后补一句你能稳定投入的时间。',
      suggestedClubs: [],
    }
  }

  if (latestMessage.includes('报名') || latestMessage.includes('流程')) {
    return {
      reply: '平台里的基本流程是：先完善画像，再查看推荐和社团详情，然后提交报名。提交后可以在“报名”页看进度，在“消息”页接收状态通知或面试提醒。',
      suggestedClubs: [],
    }
  }

  if (latestMessage.includes('适合') || latestMessage.includes('怎么选') || latestMessage.includes('推荐')) {
    const recommended = buildScoredClubs(clubs, initialProfile)
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, 3)
    const recommendedNames = recommended.map((club) => club.name)

    return {
      reply: `如果你还在犹豫先看哪个社团，可以先从${recommendedNames.join('、')}开始。判断时重点看3点：你的兴趣是否对口、每周投入时间能不能匹配、以及你希望在社团里获得技能提升、表达机会还是社交拓展。`,
      suggestedClubs: recommended.map((club) => ({
        clubId: club.id,
        reason: club.reasons[0] ?? '适合作为优先了解对象',
      })),
    }
  }

  return {
    reply: '我可以帮你看社团介绍、怎么选社团、报名流程、面试准备和简历优化。你也可以直接问我某个社团值不值得优先投，或者让我们一起比较两个社团。',
    suggestedClubs: [],
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

  chatWithAssistant(messages: ChatbotMessage[], currentPath: string) {
    if (hasSupabaseEnv) {
      return studentDemoSupabaseService.chatWithAssistant(messages, currentPath)
    }

    void currentPath
    return Promise.resolve(buildMockChatbotReply(messages))
  },
}
