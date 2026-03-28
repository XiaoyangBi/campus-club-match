import { AuthError, getAuthUserId } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { mapStudentProfileRow, validateStudentProfile } from '../_shared/profile.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const studentId = await getAuthUserId(request)
    const { profile } = await request.json()

    if (!profile) {
      return jsonResponse({ error: 'profile is required' }, { status: 400 })
    }

    const validationErrors = validateStudentProfile(profile)
    if (validationErrors.length > 0) {
      return jsonResponse({ error: validationErrors.join('；'), validationErrors }, { status: 400 })
    }

    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('student_profiles')
      .upsert(
        {
          student_id: studentId,
          college: profile.college.trim(),
          major: profile.major.trim(),
          grade: profile.grade.trim(),
          available_time: profile.availableTime,
          expected_gain: profile.expectedGain,
          interests: profile.interests,
          skills: profile.skills,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id' },
      )
      .select('*')
      .single()

    if (error) throw error

    return jsonResponse(mapStudentProfileRow(data))
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to save profile' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
