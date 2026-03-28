import { AuthError } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createStudentNotification } from '../_shared/notification.ts'
import { canTransitionApplicationStatus, renderNoticeTemplate } from '../_shared/ops.ts'
import { requireClubAdmin } from '../_shared/role.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { applicationId, status, note } = await request.json()
    const supabase = createSupabaseAdmin()

    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle()

    if (applicationError) throw applicationError
    if (!application) {
      return jsonResponse({ error: '未找到对应报名记录' }, { status: 404 })
    }

    const access = await requireClubAdmin(request, application.club_id)
    const operatorId = access.user.id

    if (!canTransitionApplicationStatus(application.status, status)) {
      return jsonResponse({ error: '当前状态不允许这样流转' }, { status: 400 })
    }

    const nextNote = typeof note === 'string' && note.trim() ? note.trim() : application.note
    const now = new Date().toISOString()

    const { data: updatedApplication, error: updateError } = await supabase
      .from('applications')
      .update({
        status,
        note: nextNote,
        updated_at: now,
        last_status_changed_at: now,
      })
      .eq('id', applicationId)
      .select('*')
      .single()

    if (updateError) throw updateError

    const { error: historyError } = await supabase.from('application_status_history').insert({
      application_id: applicationId,
      student_id: application.student_id,
      from_status: application.status,
      to_status: status,
      operator_type: 'club_admin',
      operator_id: operatorId,
      note: nextNote,
    })

    if (historyError) throw historyError

    const { data: latestCycle, error: cycleError } = await supabase
      .from('recruitment_cycles')
      .select('notice_template, interview_notice_template')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cycleError) throw cycleError

    const template =
      status === '待面试'
        ? latestCycle?.interview_notice_template || '你已进入{{clubName}}的面试环节，请关注以下安排：{{note}}'
        : latestCycle?.notice_template || '你的{{clubName}}报名状态已更新为{{status}}。{{note}}'

    const notificationContent = renderNoticeTemplate(template, {
      clubName: application.club_name,
      status,
      note: nextNote,
      selectedDirection: application.selected_direction,
    })

    await createStudentNotification({
      studentId: application.student_id,
      type: 'application_status_changed',
      title: status === '待面试' ? `${application.club_name}面试通知` : `${application.club_name}报名状态已更新`,
      content: notificationContent,
      relatedApplicationId: applicationId,
    })

    return jsonResponse({
      id: updatedApplication.id,
      status: updatedApplication.status,
      note: updatedApplication.note,
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to update application status' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
