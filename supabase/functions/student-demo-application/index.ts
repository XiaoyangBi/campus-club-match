import { AuthError, getAuthUser } from '../_shared/auth.ts'
import { mapApplicationRow } from '../_shared/application.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createStudentNotification } from '../_shared/notification.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await getAuthUser(request)
    const studentId = user.id
    const { clubId, clubName, selectedDirection, selfIntro, attachmentPath = null } = await request.json()
    const supabase = createSupabaseAdmin()
    const submissionNote = '报名已提交成功，社团将在1到3天内完成初筛。'

    const [
      { data: duplicated, error: duplicatedError },
      { data: club, error: clubError },
      { data: latestCycle, error: cycleError },
    ] = await Promise.all([
      supabase
        .from('applications')
        .select('id')
        .eq('student_id', studentId)
        .eq('club_id', clubId)
        .maybeSingle(),
      supabase
        .from('clubs')
        .select('id, name, recruit_deadline, is_active')
        .eq('id', clubId)
        .maybeSingle(),
      supabase
        .from('recruitment_cycles')
        .select('id, apply_enabled')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (duplicatedError) throw duplicatedError
    if (clubError) throw clubError
    if (cycleError) throw cycleError

    if (duplicated) {
      return jsonResponse(null)
    }

    if (!club || !club.is_active) {
      return jsonResponse({ error: '当前社团暂不可报名' }, { status: 400 })
    }

    if (latestCycle && latestCycle.apply_enabled === false) {
      return jsonResponse({ error: '当前招新周期已关闭，暂不可提交报名' }, { status: 400 })
    }

    if (attachmentPath && (typeof attachmentPath !== 'string' || !attachmentPath.startsWith(`${studentId}/`))) {
      return jsonResponse({ error: '简历附件路径不合法' }, { status: 400 })
    }

    const deadline = new Date(club.recruit_deadline)
    if (Number.isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
      return jsonResponse({ error: '该社团报名已截止，请选择其他社团' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({
        student_id: studentId,
        student_email: user.email ?? '',
        club_id: clubId,
        club_name: clubName || club.name,
        selected_direction: selectedDirection,
        self_intro: selfIntro,
        attachment_path: attachmentPath,
        status: '已提交',
        note: submissionNote,
      })
      .select('*')
      .single()

    if (error) throw error

    const { error: historyError } = await supabase.from('application_status_history').insert({
      application_id: data.id,
      student_id: studentId,
      from_status: null,
      to_status: '已提交',
      operator_type: 'student',
      operator_id: studentId,
      note: submissionNote,
    })

    if (historyError) throw historyError

    await createStudentNotification({
      studentId,
      type: 'application_submitted',
      title: `${club.name}报名已提交`,
      content: '你的报名材料已提交成功，社团将在1到3天内完成初筛。',
      relatedApplicationId: data.id,
    })

    const { data: historyRows, error: historyRowsError } = await supabase
      .from('application_status_history')
      .select('*')
      .eq('application_id', data.id)
      .order('created_at', { ascending: true })

    if (historyRowsError) throw historyRowsError

    return jsonResponse(await mapApplicationRow(data, historyRows))
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to submit application' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
