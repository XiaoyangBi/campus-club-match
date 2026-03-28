import { AuthError, getAuthUserId } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

function formatDateTime(value: string) {
  return value.replace('T', ' ').replace(/:\d{2}(?:\.\d+)?\+\d{2}:\d{2}$/, '')
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const studentId = await getAuthUserId(request)
    const supabase = createSupabaseAdmin()
    const { limit = 5 } = await request.json().catch(() => ({}))

    const { data, error } = await supabase
      .from('match_runs')
      .select('id, matches, created_at, source')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(Math.min(10, Math.max(1, Number(limit) || 5)))

    if (error) throw error

    return jsonResponse(
      (data ?? []).map((item) => ({
        id: item.id,
        matches: Array.isArray(item.matches) ? item.matches : [],
        generatedAt: formatDateTime(item.created_at),
        source: item.source === 'cache' ? 'cache' : 'ai',
      })),
    )
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to load AI match history' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
