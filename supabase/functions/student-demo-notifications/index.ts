import { AuthError, getAuthUserId } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { mapNotificationRow } from '../_shared/notification.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const studentId = await getAuthUserId(request)
    const supabase = createSupabaseAdmin()
    const { limit = 20 } = await request.json().catch(() => ({}))

    const [notificationsResult, unreadCountResult] = await Promise.all([
      supabase
        .from('notifications')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(Math.min(50, Math.max(1, Number(limit) || 20))),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('is_read', false),
    ])

    if (notificationsResult.error) throw notificationsResult.error
    if (unreadCountResult.error) throw unreadCountResult.error

    return jsonResponse({
      unreadCount: unreadCountResult.count ?? 0,
      notifications: (notificationsResult.data ?? []).map(mapNotificationRow),
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to load notifications' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
