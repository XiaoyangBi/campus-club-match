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
    const { clubId, patch } = await request.json()
    await requireClubAdmin(request, clubId)
    const supabase = createSupabaseAdmin()

    const { data, error } = await supabase
      .from('clubs')
      .update({
        name: patch?.name,
        intro: patch?.intro,
        leader_name: patch?.leaderName,
        contact_email: patch?.contactEmail,
        recruit_deadline: patch?.recruitDeadline ? patch.recruitDeadline.replace(' ', 'T') : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clubId)
      .select('*')
      .single()

    if (error) throw error

    return jsonResponse(mapOpsClubRow(data))
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to update club profile' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
