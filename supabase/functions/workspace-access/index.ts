import { AuthError } from '../_shared/auth.ts'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { getWorkspaceAccess } from '../_shared/role.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const access = await getWorkspaceAccess(request)

    return jsonResponse({
      email: access.email,
      isClubAdmin: access.isClubAdmin,
      managedClubIds: access.managedClubIds,
      isPlatformAdmin: access.isPlatformAdmin,
      platformRole: access.platformRole,
    })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Failed to load workspace access' },
      { status: error instanceof AuthError ? error.status : 500 },
    )
  }
})
