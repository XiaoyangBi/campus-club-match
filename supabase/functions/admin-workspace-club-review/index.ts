import { AuthError } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { mapOpsClubRow } from '../_shared/ops.ts'
import { requirePlatformAdmin } from '../_shared/role.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    await requirePlatformAdmin(request)
    const { clubId, decision, reason } = await request.json()
    const supabase = createSupabaseAdmin()

    const { data, error } = await supabase
      .from('clubs')
      .update({
        review_status: decision,
        review_note: typeof reason === 'string' ? reason.trim() : '',
        is_active: decision === 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', clubId)
      .select('*')
      .single()

    if (error) throw error

    return jsonResponse(mapOpsClubRow(data))
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to review club' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
