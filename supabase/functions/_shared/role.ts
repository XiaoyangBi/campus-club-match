import { AuthError, getAuthUser } from './auth.ts'
import { createSupabaseAdmin } from './supabaseAdmin.ts'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

type ClubMembershipRow = {
  id: string
  email: string
  user_id: string | null
  club_id: string
  role: 'owner' | 'manager'
}

type PlatformAdminRow = {
  id: string
  email: string
  user_id: string | null
  role: 'super_admin' | 'operator'
}

async function bindClubMembershipsToUser(supabase: ReturnType<typeof createSupabaseAdmin>, ids: string[], userId: string, email: string) {
  if (ids.length === 0) {
    return
  }

  const { error } = await supabase
    .from('club_admin_memberships')
    .update({
      user_id: userId,
      email,
      updated_at: new Date().toISOString(),
    })
    .in('id', ids)
    .is('user_id', null)

  if (error) {
    throw error
  }
}

async function bindPlatformAdminToUser(supabase: ReturnType<typeof createSupabaseAdmin>, id: string, userId: string, email: string) {
  const { error } = await supabase
    .from('platform_admin_users')
    .update({
      user_id: userId,
      email,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('user_id', null)

  if (error) {
    throw error
  }
}

export async function getWorkspaceAccess(request: Request) {
  const user = await getAuthUser(request)
  const email = user.email ? normalizeEmail(user.email) : ''

  if (!email) {
    throw new AuthError('Current account does not have a bound email')
  }

  const supabase = createSupabaseAdmin()
  const [clubMembershipsByUserIdResult, clubMembershipsByEmailResult, adminUserByUserIdResult, adminUserByEmailResult] = await Promise.all([
    supabase
      .from('club_admin_memberships')
      .select('id, email, user_id, club_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('club_admin_memberships')
      .select('id, email, user_id, club_id, role')
      .eq('email', email)
      .eq('is_active', true),
    supabase
      .from('platform_admin_users')
      .select('id, email, user_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('platform_admin_users')
      .select('id, email, user_id, role')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle(),
  ])

  if (clubMembershipsByUserIdResult.error) throw clubMembershipsByUserIdResult.error
  if (clubMembershipsByEmailResult.error) throw clubMembershipsByEmailResult.error
  if (adminUserByUserIdResult.error) throw adminUserByUserIdResult.error
  if (adminUserByEmailResult.error) throw adminUserByEmailResult.error

  const clubMembershipMap = new Map<string, ClubMembershipRow>()
  for (const membership of clubMembershipsByUserIdResult.data ?? []) {
    clubMembershipMap.set(membership.club_id, membership)
  }

  const emailOnlyMembershipIds: string[] = []
  for (const membership of clubMembershipsByEmailResult.data ?? []) {
    if (!membership.user_id) {
      emailOnlyMembershipIds.push(membership.id)
      membership.user_id = user.id
    }

    clubMembershipMap.set(membership.club_id, membership)
  }

  if (emailOnlyMembershipIds.length > 0) {
    await bindClubMembershipsToUser(supabase, emailOnlyMembershipIds, user.id, email)
  }

  let adminUser = adminUserByUserIdResult.data ?? null
  if (!adminUser && adminUserByEmailResult.data) {
    adminUser = {
      ...adminUserByEmailResult.data,
      user_id: adminUserByEmailResult.data.user_id ?? user.id,
    }

    if (!adminUserByEmailResult.data.user_id) {
      await bindPlatformAdminToUser(supabase, adminUserByEmailResult.data.id, user.id, email)
    }
  }

  const managedClubIds = [...clubMembershipMap.values()].map((item) => item.club_id)

  return {
    user,
    email,
    isClubAdmin: managedClubIds.length > 0,
    managedClubIds,
    isPlatformAdmin: Boolean(adminUser),
    platformRole: (adminUser?.role ?? null) as 'super_admin' | 'operator' | null,
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
