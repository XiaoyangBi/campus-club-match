import { demoOptions } from './demoOptions.ts'

export type DbStudentProfileRow = {
  college: string
  major: string
  grade: string
  available_time: 'low' | 'medium' | 'high'
  expected_gain: string[]
  interests: string[]
  skills: string[]
}

export function createDefaultProfile() {
  return {
    college: '计算机学院',
    major: '计算机科学与技术',
    grade: demoOptions.gradeOptions[0],
    available_time: 'medium' as const,
    expected_gain: ['技能提升', '社交拓展'],
    interests: ['媒体运营', '摄影摄像', '设计创意'],
    skills: ['平面设计', '视频剪辑'],
  }
}

export function mapStudentProfileRow(profile: DbStudentProfileRow) {
  return {
    college: profile.college,
    major: profile.major,
    grade: profile.grade,
    availableTime: profile.available_time,
    expectedGain: profile.expected_gain,
    interests: profile.interests,
    skills: profile.skills,
  }
}

export function validateStudentProfile(profile: {
  college?: string
  major?: string
  grade?: string
  availableTime?: string
  expectedGain?: string[]
  interests?: string[]
  skills?: string[]
}) {
  const errors: string[] = []

  if (!profile.college?.trim()) {
    errors.push('学院不能为空')
  }

  if (!profile.major?.trim()) {
    errors.push('专业不能为空')
  }

  if (!profile.grade?.trim()) {
    errors.push('年级不能为空')
  }

  if (!['low', 'medium', 'high'].includes(profile.availableTime ?? '')) {
    errors.push('可投入时间不合法')
  }

  if (!Array.isArray(profile.interests) || profile.interests.length < 3) {
    errors.push('兴趣标签至少选择3项')
  }

  if (!Array.isArray(profile.skills)) {
    errors.push('技能标签格式不合法')
  }

  if (!Array.isArray(profile.expectedGain)) {
    errors.push('期望收获格式不合法')
  }

  return errors
}

export function getAiMissingFields(profile: DbStudentProfileRow) {
  const missingFields: string[] = []

  if (!profile.college?.trim()) {
    missingFields.push('学院')
  }

  if (!profile.major?.trim()) {
    missingFields.push('专业')
  }

  if (!profile.grade?.trim()) {
    missingFields.push('年级')
  }

  if (!profile.available_time?.trim()) {
    missingFields.push('可投入时间')
  }

  if (!Array.isArray(profile.interests) || profile.interests.length < 3) {
    missingFields.push('至少3个兴趣标签')
  }

  if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
    missingFields.push('技能标签')
  }

  if (!Array.isArray(profile.expected_gain) || profile.expected_gain.length === 0) {
    missingFields.push('期望收获')
  }

  return missingFields
}
