import type { ApplicationStatus, Club, SortType, StudentProfile, TimeLevel } from '../types'

export type ClubWithScore = Club & {
  matchScore: number
  reasons: string[]
}

export const timeLabelMap: Record<TimeLevel, string> = {
  low: '每周1小时内',
  medium: '每周2-4小时',
  high: '每周4小时以上',
}

export const sortLabelMap: Record<SortType, string> = {
  matchScore: '按匹配度',
  deadline: '按截止时间',
  hot: '按热度',
}

export const applicationStatusToneMap: Record<ApplicationStatus, string> = {
  已提交: 'neutral',
  待筛选: 'pending',
  待面试: 'info',
  已录取: 'success',
  未通过: 'reject',
  已放弃: 'neutral',
}

export function toggleItem<T>(items: T[], value: T) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value]
}

export function getDeadlineScore(deadline: string) {
  const timestamp = new Date(deadline).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function calculateMatch(club: Club, profile: StudentProfile) {
  const interestOverlap = club.tags.filter((tag) => profile.interests.includes(tag)).length
  const skillOverlap = club.skills.filter((skill) => profile.skills.includes(skill)).length
  const interestScore = Math.min(100, interestOverlap * 34)
  const skillScore = Math.min(100, skillOverlap * 50)
  const timeScore =
    club.timeLevel === profile.availableTime
      ? 100
      : club.timeLevel === 'medium' || profile.availableTime === 'medium'
        ? 75
        : 45
  const hotScore = club.popularity
  const matchScore = Math.round(
    interestScore * 0.5 + timeScore * 0.2 + skillScore * 0.2 + hotScore * 0.1,
  )

  const reasons = [
    interestOverlap > 0
      ? `你的兴趣标签与社团方向重合${interestOverlap}项，更适合作为优先投递对象。`
      : '你的兴趣标签与该社团重合较少，适合作为探索型选择。',
    club.timeLevel === profile.availableTime
      ? '你的可投入时间与社团活动频率高度匹配。'
      : '你的可投入时间与社团节奏基本兼容，后续可根据实际安排调整。',
    skillOverlap > 0
      ? `你当前已有${skillOverlap}项相关技能，可以更快参与社团具体工作。`
      : '即便没有直接技能经验，该社团也提供一定的新手成长空间。',
  ]

  return {
    matchScore,
    reasons,
  }
}

export function buildScoredClubs(clubs: Club[], profile: StudentProfile) {
  return clubs.map((club) => {
    const { matchScore, reasons } = calculateMatch(club, profile)
    return {
      ...club,
      matchScore,
      reasons,
    }
  })
}
