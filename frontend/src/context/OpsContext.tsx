import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { clubWorkspaceApplications, clubWorkspaceClubs, recruitmentCycles } from '../data/opsMock'
import {
  useAdminWorkspaceQuery,
  useClubWorkspaceQuery,
  useReviewClubMutation,
  useUpdateClubApplicationStatusMutation,
  useUpdateClubProfileMutation,
  useUpdateCycleMutation,
} from '../hooks/useOpsData'
import { hasSupabaseEnv } from '../lib/supabaseClient'
import type { ApplicationStatus, ClubWorkspaceApplication, ClubWorkspaceClub, RecruitmentCycleConfig } from '../types'

type OpsQueryState = {
  clubs: ClubWorkspaceClub[]
  applications: ClubWorkspaceApplication[]
  cycles: RecruitmentCycleConfig[]
}

type OpsMutationActions = {
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus, note: string) => void
  updateClubProfile: (clubId: string, patch: Partial<ClubWorkspaceClub>) => void
  reviewClub: (clubId: string, decision: 'approved' | 'rejected', reason: string) => void
  updateCycle: (cycleId: string, patch: Partial<RecruitmentCycleConfig>) => void
}

const OpsQueryContext = createContext<OpsQueryState | null>(null)
const OpsActionContext = createContext<OpsMutationActions | null>(null)

export function OpsProvider({ children }: { children: ReactNode }) {
  const [clubs, setClubs] = useState<ClubWorkspaceClub[]>(clubWorkspaceClubs)
  const [applications, setApplications] = useState<ClubWorkspaceApplication[]>(clubWorkspaceApplications)
  const [cycles, setCycles] = useState<RecruitmentCycleConfig[]>(recruitmentCycles)
  const clubWorkspaceQuery = useClubWorkspaceQuery()
  const adminWorkspaceQuery = useAdminWorkspaceQuery()
  const updateApplicationStatusMutation = useUpdateClubApplicationStatusMutation()
  const updateClubProfileMutation = useUpdateClubProfileMutation()
  const reviewClubMutation = useReviewClubMutation()
  const updateCycleMutation = useUpdateCycleMutation()

  const resolvedClubs = hasSupabaseEnv
    ? (clubWorkspaceQuery.data?.clubs ?? adminWorkspaceQuery.data?.clubs ?? [])
    : clubs
  const resolvedApplications = hasSupabaseEnv ? (clubWorkspaceQuery.data?.applications ?? []) : applications
  const resolvedCycles = hasSupabaseEnv ? (adminWorkspaceQuery.data?.cycles ?? []) : cycles

  const queryValue = useMemo<OpsQueryState>(
    () => ({
      clubs: resolvedClubs,
      applications: resolvedApplications,
      cycles: resolvedCycles,
    }),
    [resolvedApplications, resolvedClubs, resolvedCycles],
  )

  const actionValue = useMemo<OpsMutationActions>(
    () => ({
      updateApplicationStatus(applicationId, status, note) {
        if (hasSupabaseEnv) {
          void updateApplicationStatusMutation.mutateAsync({ applicationId, status, note })
          return
        }

        setApplications((current) =>
          current.map((item) =>
            item.id === applicationId
              ? {
                  ...item,
                  status,
                  note,
                }
              : item,
          ),
        )
      },
      updateClubProfile(clubId, patch) {
        if (hasSupabaseEnv) {
          void updateClubProfileMutation.mutateAsync({ clubId, patch })
          return
        }

        setClubs((current) =>
          current.map((item) =>
            item.id === clubId
              ? {
                  ...item,
                  ...patch,
                }
              : item,
          ),
        )
      },
      reviewClub(clubId, decision, reason) {
        if (hasSupabaseEnv) {
          void reviewClubMutation.mutateAsync({ clubId, decision, reason })
          return
        }

        setClubs((current) =>
          current.map((item) =>
            item.id === clubId
              ? {
                  ...item,
                  status: decision,
                  reviewNote: reason,
                }
              : item,
          ),
        )
      },
      updateCycle(cycleId, patch) {
        if (hasSupabaseEnv) {
          void updateCycleMutation.mutateAsync({ cycleId, patch })
          return
        }

        setCycles((current) =>
          current.map((item) =>
            item.id === cycleId
              ? {
                  ...item,
                  ...patch,
                }
              : item,
          ),
        )
      },
    }),
    [
      reviewClubMutation,
      updateApplicationStatusMutation,
      updateClubProfileMutation,
      updateCycleMutation,
    ],
  )

  return (
    <OpsQueryContext.Provider value={queryValue}>
      <OpsActionContext.Provider value={actionValue}>{children}</OpsActionContext.Provider>
    </OpsQueryContext.Provider>
  )
}

export function useOpsQuery() {
  const context = useContext(OpsQueryContext)
  if (!context) {
    throw new Error('useOpsQuery must be used within OpsProvider')
  }

  return context
}

export function useOpsActions() {
  const context = useContext(OpsActionContext)
  if (!context) {
    throw new Error('useOpsActions must be used within OpsProvider')
  }

  return context
}
