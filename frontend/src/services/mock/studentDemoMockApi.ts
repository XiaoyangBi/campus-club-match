import {
  categories,
  collegeOptions,
  clubs as seedClubs,
  expectedGainOptions,
  gradeOptions,
  initialApplications,
  initialFavorites,
  initialProfile,
  interestOptions,
  skillOptions,
} from '../../data/mock'
import type { ApplicationRecord, StudentDemoBootstrap, StudentProfile } from '../../types'

type CreateApplicationInput = {
  clubId: string
  clubName: string
  selectedDirection: string
  selfIntro: string
  attachmentPath?: string | null
}

type WithdrawApplicationInput = {
  applicationId: string
}

const LATENCY_MS = 120

let mockDb: StudentDemoBootstrap = {
  categories: [...categories],
  collegeOptions: [...collegeOptions],
  gradeOptions: [...gradeOptions],
  interestOptions: [...interestOptions],
  skillOptions: [...skillOptions],
  expectedGainOptions: [...expectedGainOptions],
  account: {
    email: 'mock@example.com',
  },
  clubs: structuredClone(seedClubs),
  profile: structuredClone(initialProfile),
  applications: structuredClone(initialApplications),
  favorites: [...initialFavorites],
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function withLatency<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(value)), LATENCY_MS)
  })
}

export function fetchStudentDemoBootstrap() {
  return withLatency(mockDb)
}

export function saveStudentProfile(profile: StudentProfile) {
  mockDb = {
    ...mockDb,
    profile: clone(profile),
  }

  return withLatency(mockDb.profile)
}

export function saveFavorites(favorites: string[]) {
  mockDb = {
    ...mockDb,
    favorites: [...favorites],
  }

  return withLatency(mockDb.favorites)
}

export function createApplication(input: CreateApplicationInput) {
  const duplicated = mockDb.applications.some((item) => item.clubId === input.clubId)

  if (duplicated) {
    return withLatency<ApplicationRecord | null>(null)
  }

  const application: ApplicationRecord = {
    id: `app-${Date.now()}`,
    clubId: input.clubId,
    clubName: input.clubName,
    selectedDirection: input.selectedDirection,
    selfIntro: input.selfIntro,
    attachmentUrl: input.attachmentPath ?? null,
    submittedAt: new Date().toLocaleString('zh-CN', {
      hour12: false,
    }),
    status: '已提交',
    note: '报名已提交成功，社团将在1到3天内完成初筛。',
    history: [
      {
        id: `history-${Date.now()}`,
        fromStatus: null,
        toStatus: '已提交',
        note: '报名已提交成功，社团将在1到3天内完成初筛。',
        operatorType: 'student',
        createdAt: new Date().toLocaleString('zh-CN', {
          hour12: false,
        }),
      },
    ],
  }

  mockDb = {
    ...mockDb,
    applications: [application, ...mockDb.applications],
  }

  return withLatency(application)
}

export function withdrawApplication({ applicationId }: WithdrawApplicationInput) {
  const application = mockDb.applications.find((item) => item.id === applicationId)

  if (!application || !['已提交', '待筛选', '待面试'].includes(application.status)) {
    return withLatency<ApplicationRecord | null>(null)
  }

  const now = new Date().toLocaleString('zh-CN', {
    hour12: false,
  })
  const nextApplication: ApplicationRecord = {
    ...application,
    status: '已放弃',
    note: '你已主动放弃本次报名，可继续浏览其他社团机会。',
    history: [
      ...application.history,
      {
        id: `history-withdraw-${Date.now()}`,
        fromStatus: application.status,
        toStatus: '已放弃',
        note: '你已主动放弃本次报名，可继续浏览其他社团机会。',
        operatorType: 'student',
        createdAt: now,
      },
    ],
  }

  mockDb = {
    ...mockDb,
    applications: mockDb.applications.map((item) => (item.id === applicationId ? nextApplication : item)),
  }

  return withLatency(nextApplication)
}
