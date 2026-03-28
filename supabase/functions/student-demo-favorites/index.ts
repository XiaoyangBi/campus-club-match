import { AuthError, getAuthUserId } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const studentId = await getAuthUserId(request)
    const { favorites = [] } = await request.json()
    const supabase = createSupabaseAdmin()

    const { error: deleteError } = await supabase.from('favorite_clubs').delete().eq('student_id', studentId)
    if (deleteError) throw deleteError

    if (Array.isArray(favorites) && favorites.length > 0) {
      const { error: insertError } = await supabase.from('favorite_clubs').insert(
        favorites.map((clubId: string) => ({
          student_id: studentId,
          club_id: clubId,
        })),
      )

      if (insertError) throw insertError
    }

    return jsonResponse(favorites)
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to save favorites' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
