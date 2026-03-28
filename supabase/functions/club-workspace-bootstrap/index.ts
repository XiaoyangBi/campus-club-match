import { AuthError } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { mapOpsClubRow } from '../_shared/ops.ts'
import { requireClubAdmin } from '../_shared/role.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const access = await requireClubAdmin(request)
    const supabase = createSupabaseAdmin()

    const [clubsResult, applicationsResult, profilesResult] = await Promise.all([
      supabase.from('clubs').select('*').in('id', access.managedClubIds).order('popularity', { ascending: false }),
      supabase.from('applications').select('*').in('club_id', access.managedClubIds).order('submitted_at', { ascending: false }),
      supabase.from('student_profiles').select('student_id, college, major, grade'),
    ])

    if (clubsResult.error) throw clubsResult.error
    if (applicationsResult.error) throw applicationsResult.error
    if (profilesResult.error) throw profilesResult.error

    const profileMap = new Map((profilesResult.data ?? []).map((item) => [item.student_id, item]))

    return jsonResponse({
      clubs: (clubsResult.data ?? []).map(mapOpsClubRow),
      applications: (applicationsResult.data ?? []).map((application) => {
        const profile = profileMap.get(application.student_id)
        const applicantName = application.student_email
          ? application.student_email.split('@')[0]
          : application.student_id

        return {
          id: application.id,
          clubId: application.club_id,
          applicantName,
          college: profile?.college ?? '待补充学院',
          major: profile?.major ?? '待补充专业',
          grade: profile?.grade ?? '待补充年级',
          selectedDirection: application.selected_direction,
          selfIntro: application.self_intro,
          attachmentName: application.attachment_path ? application.attachment_path.split('/').pop() ?? '已上传附件' : '未上传附件',
          submittedAt: application.submitted_at.replace('T', ' ').replace(/:\d{2}(?:\.\d+)?\+\d{2}:\d{2}$/, ''),
          status: application.status,
          note: application.note,
        }
      }),
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to load club workspace data' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
