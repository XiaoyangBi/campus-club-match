import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApplicationStatus, ClubWorkspaceApplication, ClubWorkspaceClub, RecruitmentCycleConfig, WorkspaceAccess } from '../types'
import { useAuth } from '../context/AuthContext'
import { hasSupabaseEnv } from '../lib/supabaseClient'
import { opsWorkspaceSupabaseService } from '../services/supabase/opsWorkspaceSupabaseService'

const opsKeys = {
  all: ['ops-workspace'] as const,
  access: () => [...opsKeys.all, 'access'] as const,
  clubWorkspace: () => [...opsKeys.all, 'club-workspace'] as const,
  adminWorkspace: () => [...opsKeys.all, 'admin-workspace'] as const,
}

export function useWorkspaceAccessQuery() {
  const { isLoading, user } = useAuth()

  return useQuery<WorkspaceAccess>({
    queryKey: [...opsKeys.access(), user?.id ?? 'guest'],
    queryFn: () => opsWorkspaceSupabaseService.getWorkspaceAccess(),
    enabled: hasSupabaseEnv && !isLoading && Boolean(user),
  })
}

export function useClubWorkspaceQuery() {
  const { isLoading, user } = useAuth()
  return useQuery({
    queryKey: [...opsKeys.clubWorkspace(), user?.id ?? 'guest'],
    queryFn: () => opsWorkspaceSupabaseService.getClubWorkspace(),
    enabled: hasSupabaseEnv && !isLoading && Boolean(user),
  })
}

export function useAdminWorkspaceQuery() {
  const { isLoading, user } = useAuth()
  return useQuery({
    queryKey: [...opsKeys.adminWorkspace(), user?.id ?? 'guest'],
    queryFn: () => opsWorkspaceSupabaseService.getAdminWorkspace(),
    enabled: hasSupabaseEnv && !isLoading && Boolean(user),
  })
}

export function useUpdateClubApplicationStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ applicationId, status, note }: { applicationId: string; status: ApplicationStatus; note: string }) =>
      opsWorkspaceSupabaseService.updateApplicationStatus(applicationId, status, note),
    onSuccess: (result) => {
      queryClient.setQueriesData<{ clubs: ClubWorkspaceClub[]; applications: ClubWorkspaceApplication[] }>(
        { queryKey: opsKeys.clubWorkspace() },
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            applications: current.applications.map((item) =>
              item.id === result.id
                ? {
                    ...item,
                    status: result.status,
                    note: result.note,
                  }
                : item,
            ),
          }
        },
      )
    },
  })
}

export function useUpdateClubProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clubId, patch }: { clubId: string; patch: Partial<ClubWorkspaceClub> }) =>
      opsWorkspaceSupabaseService.updateClubProfile(clubId, patch),
    onSuccess: (club) => {
      queryClient.setQueriesData<{ clubs: ClubWorkspaceClub[]; applications: ClubWorkspaceApplication[] }>(
        { queryKey: opsKeys.clubWorkspace() },
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            clubs: current.clubs.map((item) => (item.id === club.id ? club : item)),
          }
        },
      )
      queryClient.setQueriesData<{ clubs: ClubWorkspaceClub[]; cycles: RecruitmentCycleConfig[]; metrics: { applicationCount: number } }>(
        { queryKey: opsKeys.adminWorkspace() },
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            clubs: current.clubs.map((item) => (item.id === club.id ? club : item)),
          }
        },
      )
    },
  })
}

export function useReviewClubMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clubId, decision, reason }: { clubId: string; decision: 'approved' | 'rejected'; reason: string }) =>
      opsWorkspaceSupabaseService.reviewClub(clubId, decision, reason),
    onSuccess: (club) => {
      queryClient.setQueriesData<{ clubs: ClubWorkspaceClub[]; cycles: RecruitmentCycleConfig[]; metrics: { applicationCount: number } }>(
        { queryKey: opsKeys.adminWorkspace() },
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            clubs: current.clubs.map((item) => (item.id === club.id ? club : item)),
          }
        },
      )
      queryClient.setQueriesData<{ clubs: ClubWorkspaceClub[]; applications: ClubWorkspaceApplication[] }>(
        { queryKey: opsKeys.clubWorkspace() },
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            clubs: current.clubs.map((item) => (item.id === club.id ? club : item)),
          }
        },
      )
    },
  })
}

export function useUpdateCycleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cycleId, patch }: { cycleId: string; patch: Partial<RecruitmentCycleConfig> }) =>
      opsWorkspaceSupabaseService.updateCycle(cycleId, patch),
    onSuccess: (cycle) => {
      queryClient.setQueriesData<{ clubs: ClubWorkspaceClub[]; cycles: RecruitmentCycleConfig[]; metrics: { applicationCount: number } }>(
        { queryKey: opsKeys.adminWorkspace() },
        (current) => {
          if (!current) {
            return current
          }

          return {
            ...current,
            cycles: current.cycles.map((item) => (item.id === cycle.id ? cycle : item)),
          }
        },
      )
    },
  })
}

export { opsKeys }
