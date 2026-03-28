import { AuthError, getAuthUserId } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const studentId = await getAuthUserId(request)
    const supabase = createSupabaseAdmin()
    const { notificationIds } = await request.json().catch(() => ({}))

    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('student_id', studentId)
      .eq('is_read', false)

    if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      query = query.in('id', notificationIds)
    }

    const { error } = await query
    if (error) throw error

    const { count, error: countError } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('is_read', false)

    if (countError) throw countError

    return jsonResponse({ unreadCount: count ?? 0 })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to mark notifications as read' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
