import { formatDateTime } from './notification.ts'

export type DbOpsClubRow = {
  id: string
  name: string
  category: string
  intro: string
  recruit_deadline: string
  available_directions: string[]
  review_status: 'draft' | 'pending_review' | 'approved' | 'rejected'
  review_note: string
  leader_name: string
  contact_email: string
}

export type DbRecruitmentCycleRow = {
  id: string
  name: string
  start_date: string
  end_date: string
  apply_enabled: boolean
  notice_template: string
  interview_notice_template: string
}

export function mapOpsClubRow(club: DbOpsClubRow) {
  return {
    id: club.id,
    name: club.name,
    category: club.category,
    intro: club.intro,
    recruitDeadline: formatDateTime(club.recruit_deadline),
    directions: club.available_directions,
    status: club.review_status,
    reviewNote: club.review_note,
    leaderName: club.leader_name,
    contactEmail: club.contact_email,
  }
}

export function mapRecruitmentCycleRow(cycle: DbRecruitmentCycleRow) {
  return {
    id: cycle.id,
    name: cycle.name,
    startDate: cycle.start_date,
    endDate: cycle.end_date,
    applyEnabled: cycle.apply_enabled,
    noticeTemplate: cycle.notice_template,
    interviewNoticeTemplate: cycle.interview_notice_template,
  }
}

const allowedStatusTransitions: Record<string, string[]> = {
  已提交: ['待筛选', '待面试', '已录取', '未通过'],
  待筛选: ['待面试', '已录取', '未通过'],
  待面试: ['已录取', '未通过'],
  已录取: [],
  未通过: [],
  已放弃: [],
}

export function canTransitionApplicationStatus(fromStatus: string, toStatus: string) {
  return fromStatus === toStatus || allowedStatusTransitions[fromStatus]?.includes(toStatus) === true
}

export function renderNoticeTemplate(
  template: string,
  variables: Record<string, string>,
) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '')
}
