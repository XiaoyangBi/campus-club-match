import { AuthError, getAuthUser } from './auth.ts'
import { createSupabaseAdmin } from './supabaseAdmin.ts'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function getWorkspaceAccess(request: Request) {
  const user = await getAuthUser(request)
  const email = user.email ? normalizeEmail(user.email) : ''

  if (!email) {
    throw new AuthError('Current account does not have a bound email')
  }

  const supabase = createSupabaseAdmin()
  const [clubMembershipsResult, adminUserResult] = await Promise.all([
    supabase
      .from('club_admin_memberships')
      .select('club_id, role')
      .eq('email', email)
      .eq('is_active', true),
    supabase
      .from('platform_admin_users')
      .select('role')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  if (clubMembershipsResult.error) throw clubMembershipsResult.error
  if (adminUserResult.error) throw adminUserResult.error

  const managedClubIds = (clubMembershipsResult.data ?? []).map((item) => item.club_id)

  return {
    user,
    email,
    isClubAdmin: managedClubIds.length > 0,
    managedClubIds,
    isPlatformAdmin: Boolean(adminUserResult.data),
    platformRole: (adminUserResult.data?.role ?? null) as 'super_admin' | 'operator' | null,
  }
}

export async function requireClubAdmin(request: Request, clubId?: string) {
  const access = await getWorkspaceAccess(request)

  if (!access.isClubAdmin) {
    throw new AuthError('Current account is not authorized for club workspace', 403)
  }

  if (clubId && !access.managedClubIds.includes(clubId)) {
    throw new AuthError('Current account is not authorized for this club', 403)
  }

  return access
}

export async function requirePlatformAdmin(request: Request) {
  const access = await getWorkspaceAccess(request)

  if (!access.isPlatformAdmin) {
    throw new AuthError('Current account is not authorized for admin workspace', 403)
  }

  return access
}
