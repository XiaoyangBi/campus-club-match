import { createSupabaseAdmin } from './supabaseAdmin.ts'

export function formatDateTime(value: string) {
  return value.replace('T', ' ').replace(/:\d{2}(?:\.\d+)?\+\d{2}:\d{2}$/, '')
}

export function mapNotificationRow(row: {
  id: string
  type: 'application_submitted' | 'application_withdrawn' | 'application_status_changed' | 'system'
  title: string
  content: string
  is_read: boolean
  created_at: string
}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    isRead: row.is_read,
    createdAt: formatDateTime(row.created_at),
  }
}

export async function createStudentNotification(input: {
  studentId: string
  type: 'application_submitted' | 'application_withdrawn' | 'application_status_changed' | 'system'
  title: string
  content: string
  relatedApplicationId?: string
}) {
  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('notifications').insert({
    student_id: input.studentId,
    type: input.type,
    title: input.title,
    content: input.content,
    related_application_id: input.relatedApplicationId ?? null,
  })

  if (error) {
    throw error
  }
}

export async function ensureWelcomeNotification(input: {
  studentId: string
  email: string
}) {
  const supabase = createSupabaseAdmin()
  const title = '欢迎来到社团招新智能平台'
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('student_id', input.studentId)
    .eq('type', 'system')
    .eq('title', title)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data) {
    return
  }

  const { error: insertError } = await supabase.from('notifications').insert({
    student_id: input.studentId,
    type: 'system',
    title,
    content: `你的账号${input.email || '已完成注册'}，建议先完善画像、触发一次AI匹配，再上传简历完成第一份报名。`,
    related_application_id: null,
  })

  if (insertError) {
    throw insertError
  }
}
