import { createSupabaseAdmin } from './supabaseAdmin.ts'

export const APPLICATION_RESUME_BUCKET = 'application-resumes'

export type DbApplicationRow = {
  id: string
  club_id: string
  club_name: string
  selected_direction: string
  self_intro: string
  attachment_path?: string | null
  submitted_at: string
  status: '已提交' | '待筛选' | '待面试' | '已录取' | '未通过' | '已放弃'
  note: string
}

export type DbApplicationHistoryRow = {
  id: string
  application_id: string
  from_status: DbApplicationRow['status'] | null
  to_status: DbApplicationRow['status']
  note: string
  operator_type: 'student' | 'club_admin' | 'school_admin' | 'system'
  created_at: string
}

function formatDateTime(value: string) {
  return value.replace('T', ' ').replace(/:\d{2}(?:\.\d+)?\+\d{2}:\d{2}$/, '')
}

export function mapApplicationHistoryRow(row: DbApplicationHistoryRow) {
  return {
    id: row.id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    note: row.note,
    operatorType: row.operator_type,
    createdAt: formatDateTime(row.created_at),
  }
}

async function getAttachmentUrl(path: string | null | undefined) {
  if (!path) {
    return null
  }

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase.storage.from(APPLICATION_RESUME_BUCKET).createSignedUrl(path, 60 * 60)

  if (error) {
    throw error
  }

  return data.signedUrl
}

export async function mapApplicationRow(
  row: DbApplicationRow,
  historyRows: DbApplicationHistoryRow[] = [],
) {
  const attachmentUrl = await getAttachmentUrl(row.attachment_path)

  return {
    id: row.id,
    clubId: row.club_id,
    clubName: row.club_name,
    selectedDirection: row.selected_direction,
    selfIntro: row.self_intro,
    attachmentUrl,
    submittedAt: formatDateTime(row.submitted_at),
    status: row.status,
    note: row.note,
    history: historyRows
      .sort((left, right) => left.created_at.localeCompare(right.created_at))
      .map(mapApplicationHistoryRow),
  }
}

export function canStudentWithdraw(status: DbApplicationRow['status']) {
  return status === '已提交' || status === '待筛选' || status === '待面试'
}
