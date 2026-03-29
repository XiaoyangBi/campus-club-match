import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AiMatchHistoryRecord,
  AiMatchResult,
  ChatbotMessage,
  NotificationInbox,
  StudentDemoBootstrap,
  StudentProfile,
} from '../types'
import { hasSupabaseEnv } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { studentDemoService } from '../services/studentDemoService'

const studentDemoKeys = {
  all: ['student-demo'] as const,
  bootstrap: () => [...studentDemoKeys.all, 'bootstrap'] as const,
  latestAiMatch: () => [...studentDemoKeys.all, 'latest-ai-match'] as const,
  aiMatchHistory: () => [...studentDemoKeys.all, 'ai-match-history'] as const,
  notifications: () => [...studentDemoKeys.all, 'notifications'] as const,
}

function updateBootstrapCache(queryClient: ReturnType<typeof useQueryClient>, updater: (current: StudentDemoBootstrap) => StudentDemoBootstrap) {
  queryClient.setQueriesData<StudentDemoBootstrap>({ queryKey: studentDemoKeys.bootstrap() }, (current) => {
    if (!current) {
      return current
    }

    return updater(current)
  })
}

export function useStudentDemoBootstrapQuery() {
  const { isLoading, user } = useAuth()

  return useQuery({
    queryKey: [...studentDemoKeys.bootstrap(), user?.id ?? 'guest'],
    queryFn: () => studentDemoService.getBootstrap(),
    enabled: !hasSupabaseEnv || (!isLoading && Boolean(user)),
  })
}

export function useStudentDemoLatestAiMatchQuery() {
  const { isLoading, user } = useAuth()

  return useQuery<AiMatchResult | null>({
    queryKey: [...studentDemoKeys.latestAiMatch(), user?.id ?? 'guest'],
    queryFn: () => studentDemoService.getLatestAiMatch(),
    staleTime: 30 * 1000,
    enabled: !hasSupabaseEnv || (!isLoading && Boolean(user)),
    retry: hasSupabaseEnv && !isLoading && Boolean(user) ? 1 : false,
  })
}

export function useStudentDemoAiMatchHistoryQuery() {
  const { isLoading, user } = useAuth()

  return useQuery<AiMatchHistoryRecord[]>({
    queryKey: [...studentDemoKeys.aiMatchHistory(), user?.id ?? 'guest'],
    queryFn: () => studentDemoService.getAiMatchHistory(),
    staleTime: 30 * 1000,
    enabled: !hasSupabaseEnv || (!isLoading && Boolean(user)),
    retry: hasSupabaseEnv && !isLoading && Boolean(user) ? 1 : false,
  })
}

export function useStudentDemoNotificationsQuery() {
  const { isLoading, user } = useAuth()

  return useQuery<NotificationInbox>({
    queryKey: [...studentDemoKeys.notifications(), user?.id ?? 'guest'],
    queryFn: () => studentDemoService.getNotifications(),
    staleTime: 15 * 1000,
    enabled: !hasSupabaseEnv || (!isLoading && Boolean(user)),
    retry: hasSupabaseEnv && !isLoading && Boolean(user) ? 1 : false,
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profile: StudentProfile) => studentDemoService.updateProfile(profile),
    onMutate: async (profile) => {
      updateBootstrapCache(queryClient, (current) => ({
        ...current,
        profile,
      }))
    },
    onSuccess: (profile) => {
      updateBootstrapCache(queryClient, (current) => ({
        ...current,
        profile,
      }))
    },
  })
}

export function useUpdateFavoritesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (favorites: string[]) => studentDemoService.updateFavorites(favorites),
    onMutate: async (favorites) => {
      updateBootstrapCache(queryClient, (current) => ({
        ...current,
        favorites,
      }))
    },
    onSuccess: (favorites) => {
      updateBootstrapCache(queryClient, (current) => ({
        ...current,
        favorites,
      }))
    },
  })
}

export function useSubmitApplicationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: studentDemoService.submitApplication,
    onSuccess: (application) => {
      if (!application) {
        return
      }

      updateBootstrapCache(queryClient, (current) => ({
        ...current,
        applications: [application, ...current.applications],
      }))
      void queryClient.invalidateQueries({ queryKey: studentDemoKeys.notifications() })
    },
  })
}

export function useWithdrawApplicationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: studentDemoService.withdrawApplication,
    onSuccess: (application) => {
      if (!application) {
        return
      }

      updateBootstrapCache(queryClient, (current) => ({
        ...current,
        applications: current.applications.map((item) => (item.id === application.id ? application : item)),
      }))
      void queryClient.invalidateQueries({ queryKey: studentDemoKeys.notifications() })
    },
  })
}

export function useRunAiMatchMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (refresh: boolean) => studentDemoService.runAiMatch(refresh),
    onSuccess: (result) => {
      queryClient.setQueriesData<AiMatchResult | null>({ queryKey: studentDemoKeys.latestAiMatch() }, result)
      void queryClient.invalidateQueries({ queryKey: studentDemoKeys.aiMatchHistory() })
    },
  })
}

export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationIds?: string[]) => studentDemoService.markNotificationsRead(notificationIds),
    onSuccess: (result, notificationIds) => {
      queryClient.setQueriesData<NotificationInbox>({ queryKey: studentDemoKeys.notifications() }, (current) => {
        if (!current) {
          return current
        }

        return {
          unreadCount: result.unreadCount,
          notifications: current.notifications.map((item) =>
            !notificationIds || notificationIds.length === 0 || notificationIds.includes(item.id)
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        }
      })
    },
  })
}

export function useParseResumeMutation() {
  return useMutation({
    mutationFn: (extractedText: string) => studentDemoService.parseResumeText(extractedText),
  })
}

export function useChatbotMutation() {
  return useMutation({
    mutationFn: ({ messages, currentPath }: { messages: ChatbotMessage[]; currentPath: string }) =>
      studentDemoService.chatWithAssistant(messages, currentPath),
  })
}

export { studentDemoKeys }
