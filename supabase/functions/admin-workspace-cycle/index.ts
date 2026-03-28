import { AuthError } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { mapRecruitmentCycleRow } from '../_shared/ops.ts'
import { requirePlatformAdmin } from '../_shared/role.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requirePlatformAdmin(request)
    const { cycleId, patch } = await request.json()
    const supabase = createSupabaseAdmin()

    const { data, error } = await supabase
      .from('recruitment_cycles')
      .update({
        name: patch?.name,
        start_date: patch?.startDate,
        end_date: patch?.endDate,
        apply_enabled: patch?.applyEnabled,
        notice_template: patch?.noticeTemplate,
        interview_notice_template: patch?.interviewNoticeTemplate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cycleId)
      .select('*')
      .single()

    if (error) throw error

    return jsonResponse(mapRecruitmentCycleRow(data))
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to update recruitment cycle' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
