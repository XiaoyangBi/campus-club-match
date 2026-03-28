import { AuthError } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { mapOpsClubRow, mapRecruitmentCycleRow } from '../_shared/ops.ts'
import { requirePlatformAdmin } from '../_shared/role.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requirePlatformAdmin(request)
    const supabase = createSupabaseAdmin()

    const [clubsResult, cyclesResult, applicationsResult] = await Promise.all([
      supabase.from('clubs').select('*').order('popularity', { ascending: false }),
      supabase.from('recruitment_cycles').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('id'),
    ])

    if (clubsResult.error) throw clubsResult.error
    if (cyclesResult.error) throw cyclesResult.error
    if (applicationsResult.error) throw applicationsResult.error

    return jsonResponse({
      clubs: (clubsResult.data ?? []).map(mapOpsClubRow),
      cycles: (cyclesResult.data ?? []).map(mapRecruitmentCycleRow),
      metrics: {
        applicationCount: applicationsResult.data?.length ?? 0,
      },
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to load admin workspace data' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
