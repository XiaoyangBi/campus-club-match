export type Category =
  | '全部'
  | '媒体'
  | '学术'
  | '公益'
  | '文艺'
  | '体育'

export type TimeLevel = 'low' | 'medium' | 'high'

export type SortType = 'matchScore' | 'deadline' | 'hot'

export type Club = {
  id: string
  name: string
  category: Exclude<Category, '全部'>
  intro: string
  tags: string[]
  skills: string[]
  availableDirections: string[]
  recruitDeadline: string
  frequency: string
  timeLevel: TimeLevel
  fit: string
  highlights: string[]
  popularity: number
}

export type StudentProfile = {
  college: string
  major: string
  grade: string
  availableTime: TimeLevel
  expectedGain: string[]
  interests: string[]
  skills: string[]
}

export type ApplicationStatus =
  | '已提交'
  | '待筛选'
  | '待面试'
  | '已录取'
  | '未通过'
  | '已放弃'

export type ApplicationStatusHistory = {
  id: string
  fromStatus: ApplicationStatus | null
  toStatus: ApplicationStatus
  note: string
  operatorType: 'student' | 'club_admin' | 'school_admin' | 'system'
  createdAt: string
}

export type ApplicationRecord = {
  id: string
  clubId: string
  clubName: string
  selectedDirection: string
  selfIntro: string
  attachmentUrl: string | null
  submittedAt: string
  status: ApplicationStatus
  note: string
  history: ApplicationStatusHistory[]
}

export type AiClubMatch = {
  clubId: string
  score: number
  reasons: string[]
}

export type AiMatchResult = {
  matches: AiClubMatch[]
  generatedAt: string
  source: 'ai' | 'cache'
}

export type AiMatchHistoryRecord = AiMatchResult & {
  id: string
}

export type NotificationType =
  | 'application_submitted'
  | 'application_withdrawn'
  | 'application_status_changed'
  | 'system'

export type NotificationRecord = {
  id: string
  type: NotificationType
  title: string
  content: string
  isRead: boolean
  createdAt: string
}

export type NotificationInbox = {
  unreadCount: number
  notifications: NotificationRecord[]
}

export type StudentAccount = {
  email: string
}

export type ClubWorkspaceClub = {
  id: string
  name: string
  category: Exclude<Category, '全部'>
  intro: string
  recruitDeadline: string
  directions: string[]
  status: 'draft' | 'pending_review' | 'approved' | 'rejected'
  reviewNote: string
  leaderName: string
  contactEmail: string
}

export type ClubWorkspaceApplication = {
  id: string
  clubId: string
  applicantName: string
  college: string
  major: string
  grade: string
  selectedDirection: string
  selfIntro: string
  attachmentName: string
  submittedAt: string
  status: ApplicationStatus
  note: string
}

export type RecruitmentCycleConfig = {
  id: string
  name: string
  startDate: string
  endDate: string
  applyEnabled: boolean
  noticeTemplate: string
  interviewNoticeTemplate: string
}

export type OpsWorkspaceBootstrap = {
  clubs: ClubWorkspaceClub[]
  applications: ClubWorkspaceApplication[]
  cycles: RecruitmentCycleConfig[]
}

export type WorkspaceAccess = {
  email: string
  isClubAdmin: boolean
  managedClubIds: string[]
  isPlatformAdmin: boolean
  platformRole: 'super_admin' | 'operator' | null
}

export type StudentDemoOptions = {
  categories: Category[]
  collegeOptions: string[]
  gradeOptions: string[]
  interestOptions: string[]
  skillOptions: string[]
  expectedGainOptions: string[]
}

export type StudentDemoBootstrap = StudentDemoOptions & {
  account: StudentAccount
  clubs: Club[]
  profile: StudentProfile
  applications: ApplicationRecord[]
  favorites: string[]
}
