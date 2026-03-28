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

    const { data, error } = await supabase
      .from('match_runs')
      .select('matches, created_at, source')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return jsonResponse(null)
    }

    return jsonResponse({
      matches: Array.isArray(data.matches) ? data.matches : [],
      generatedAt: formatDateTime(data.created_at),
      source: data.source === 'cache' ? 'cache' : 'ai',
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to load latest AI match result' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
