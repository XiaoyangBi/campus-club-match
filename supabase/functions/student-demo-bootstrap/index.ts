import { AuthError, getAuthUser } from '../_shared/auth.ts'
import { mapApplicationRow } from '../_shared/application.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { demoOptions } from '../_shared/demoOptions.ts'
import { ensureWelcomeNotification } from '../_shared/notification.ts'
import { createDefaultProfile, mapStudentProfileRow } from '../_shared/profile.ts'
import { createSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await getAuthUser(request)
    const studentId = user.id
    const supabase = createSupabaseAdmin()

    const [clubsResult, profileResult, applicationsResult, favoritesResult, applicationHistoryResult] = await Promise.all([
      supabase.from('clubs').select('*').eq('is_active', true).order('popularity', { ascending: false }),
      supabase.from('student_profiles').select('*').eq('student_id', studentId).maybeSingle(),
      supabase.from('applications').select('*').eq('student_id', studentId).order('submitted_at', { ascending: false }),
      supabase.from('favorite_clubs').select('club_id').eq('student_id', studentId),
      supabase
        .from('application_status_history')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: true }),
    ])

    if (clubsResult.error) throw clubsResult.error
    if (profileResult.error) throw profileResult.error
    if (applicationsResult.error) throw applicationsResult.error
    if (favoritesResult.error) throw favoritesResult.error
    if (applicationHistoryResult.error) throw applicationHistoryResult.error

    let profileData = profileResult.data

    if (!profileData) {
      const defaultProfile = createDefaultProfile()
      const insertedProfileResult = await supabase
        .from('student_profiles')
        .insert({
          student_id: studentId,
          ...defaultProfile,
        })
        .select('*')
        .single()

      if (insertedProfileResult.error) throw insertedProfileResult.error
      profileData = insertedProfileResult.data
    }

    if (!profileData) {
      throw new Error('Failed to initialize student profile')
    }

    await ensureWelcomeNotification({
      studentId,
      email: user.email ?? '',
    })

    const applications = await Promise.all(
      applicationsResult.data.map((application) =>
        mapApplicationRow(
          application,
          applicationHistoryResult.data.filter((history) => history.application_id === application.id),
        ),
      ),
    )

    return jsonResponse({
      ...demoOptions,
      account: {
        email: user.email ?? '',
      },
      clubs: clubsResult.data.map((club) => ({
        id: club.id,
        name: club.name,
        category: club.category,
        intro: club.intro,
        tags: club.tags,
        skills: club.skills,
        availableDirections: club.available_directions,
        recruitDeadline: club.recruit_deadline.replace('T', ' ').replace(/:\d{2}(?:\.\d+)?\+\d{2}:\d{2}$/, ''),
        frequency: club.frequency,
        timeLevel: club.time_level,
        fit: club.fit,
        highlights: club.highlights,
        popularity: club.popularity,
      })),
      profile: mapStudentProfileRow(profileData),
      applications,
      favorites: favoritesResult.data.map((item) => item.club_id),
    })
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to load bootstrap data',
      },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
