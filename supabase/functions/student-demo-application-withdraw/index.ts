import { AuthError, getAuthUserId } from '../_shared/auth.ts'
import { canStudentWithdraw, mapApplicationRow } from '../_shared/application.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createStudentNotification } from '../_shared/notification.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const studentId = await getAuthUserId(request)
    const { applicationId } = await request.json()
    const supabase = createSupabaseAdmin()

    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (applicationError) throw applicationError

    if (!application) {
      return jsonResponse({ error: '未找到对应报名记录' }, { status: 404 })
    }

    if (!canStudentWithdraw(application.status)) {
      return jsonResponse({ error: '当前报名状态不支持放弃操作' }, { status: 400 })
    }

    const withdrawNote = '你已主动放弃本次报名，可继续浏览其他社团机会。'

    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update({
        status: '已放弃',
        note: withdrawNote,
        updated_at: new Date().toISOString(),
        last_status_changed_at: new Date().toISOString(),
        withdrawn_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .eq('student_id', studentId)
      .select('*')
      .single()

    if (updateError) throw updateError

    const { error: historyError } = await supabase.from('application_status_history').insert({
      application_id: applicationId,
      student_id: studentId,
      from_status: application.status,
      to_status: '已放弃',
      operator_type: 'student',
      operator_id: studentId,
      note: withdrawNote,
    })

    if (historyError) throw historyError

    await createStudentNotification({
      studentId,
      type: 'application_withdrawn',
      title: `${application.club_name}报名已放弃`,
      content: '你已主动放弃本次报名，如有需要可继续浏览并投递其他社团。',
      relatedApplicationId: applicationId,
    })

    const { data: historyRows, error: historyRowsError } = await supabase
      .from('application_status_history')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: true })

    if (historyRowsError) throw historyRowsError

    return jsonResponse(await mapApplicationRow(updatedApplication, historyRows))
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to withdraw application' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
