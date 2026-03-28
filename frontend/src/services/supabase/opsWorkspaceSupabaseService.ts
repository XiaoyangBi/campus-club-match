import type { ApplicationStatus, ClubWorkspaceClub, OpsWorkspaceBootstrap, RecruitmentCycleConfig, WorkspaceAccess } from '../../types'
import { supabase } from '../../lib/supabaseClient'

async function invokeFunction<TResponse>(name: string, body: Record<string, unknown>) {
  if (!supabase) {
    throw new Error('Supabase client is not configured')
  }

  const { data, error } = await supabase.functions.invoke(name, {
    body,
  })

  if (error) {
    throw error
  }

  return data as TResponse
}

export const opsWorkspaceSupabaseService = {
  getWorkspaceAccess() {
    return invokeFunction<WorkspaceAccess>('workspace-access', {})
  },
  getClubWorkspace() {
    return invokeFunction<Pick<OpsWorkspaceBootstrap, 'clubs' | 'applications'>>('club-workspace-bootstrap', {})
  },
  updateApplicationStatus(applicationId: string, status: ApplicationStatus, note: string) {
    return invokeFunction<{ id: string; status: ApplicationStatus; note: string }>('club-workspace-application-status', {
      applicationId,
      status,
      note,
    })
  },
  updateClubProfile(clubId: string, patch: Partial<ClubWorkspaceClub>) {
    return invokeFunction<ClubWorkspaceClub>('club-workspace-club-profile', {
      clubId,
      patch,
    })
  },
  getAdminWorkspace() {
    return invokeFunction<{ clubs: ClubWorkspaceClub[]; cycles: RecruitmentCycleConfig[]; metrics: { applicationCount: number } }>(
      'admin-workspace-bootstrap',
      {},
    )
  },
  reviewClub(clubId: string, decision: 'approved' | 'rejected', reason: string) {
    return invokeFunction<ClubWorkspaceClub>('admin-workspace-club-review', {
      clubId,
      decision,
      reason,
    })
  },
  updateCycle(cycleId: string, patch: Partial<RecruitmentCycleConfig>) {
    return invokeFunction<RecruitmentCycleConfig>('admin-workspace-cycle', {
      cycleId,
      patch,
    })
  },
}
