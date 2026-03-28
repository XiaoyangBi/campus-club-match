import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  ApplicationRecord,
  Category,
  Club,
  SortType,
  StudentAccount,
  StudentDemoOptions,
  StudentProfile,
  TimeLevel,
} from '../types'
import type { MutationFeedbackState } from '../components/MutationFeedback'
import { toggleItem } from '../utils/recommendation'
import {
  useStudentDemoBootstrapQuery,
  useSubmitApplicationMutation,
  useUpdateFavoritesMutation,
  useUpdateProfileMutation,
  useWithdrawApplicationMutation,
} from '../hooks/useStudentDemoData'

type DemoQueryState = {
  isBootstrapping: boolean
  options: StudentDemoOptions
  account: StudentAccount
  clubs: Club[]
  profile: StudentProfile
  applications: ApplicationRecord[]
  favorites: string[]
  selectedCategory: Category
  sortType: SortType
  keyword: string
  feedback: {
    profile: MutationFeedbackState
    favorites: MutationFeedbackState
    application: MutationFeedbackState
  }
}

type DemoMutationActions = {
  saveProfile: (profile: StudentProfile) => void
  setProfileTextField: (field: 'college' | 'major' | 'grade', value: string) => void
  setAvailableTime: (value: TimeLevel) => void
  setProfileTagValues: (
    field: 'interests' | 'skills' | 'expectedGain',
    values: string[],
  ) => void
  setSelectedCategory: (value: Category) => void
  setSortType: (value: SortType) => void
  setKeyword: (value: string) => void
  toggleFavorite: (clubId: string) => void
  submitApplication: (
    clubId: string,
    selectedDirection: string,
    selfIntro: string,
    attachmentPath?: string | null,
  ) => Promise<boolean>
  withdrawApplication: (applicationId: string) => Promise<boolean>
}

const DemoQueryContext = createContext<DemoQueryState | null>(null)
const DemoActionContext = createContext<DemoMutationActions | null>(null)

const defaultOptions: StudentDemoOptions = {
  categories: ['全部'],
  collegeOptions: [],
  gradeOptions: [],
  interestOptions: [],
  skillOptions: [],
  expectedGainOptions: [],
}

const defaultAccount: StudentAccount = {
  email: '',
}

const defaultProfile: StudentProfile = {
  college: '',
  major: '',
  grade: '',
  availableTime: 'medium',
  expectedGain: [],
  interests: [],
  skills: [],
}

const idleFeedback: MutationFeedbackState = {
  status: 'idle',
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const bootstrapQuery = useStudentDemoBootstrapQuery()
  const updateProfileMutation = useUpdateProfileMutation()
  const updateFavoritesMutation = useUpdateFavoritesMutation()
  const submitApplicationMutation = useSubmitApplicationMutation()
  const withdrawApplicationMutation = useWithdrawApplicationMutation()

  const [selectedCategory, setSelectedCategory] = useState<Category>('全部')
  const [sortType, setSortType] = useState<SortType>('matchScore')
  const [keyword, setKeyword] = useState('')
  const [profileFeedback, setProfileFeedback] = useState<MutationFeedbackState>(idleFeedback)
  const [favoritesFeedback, setFavoritesFeedback] = useState<MutationFeedbackState>(idleFeedback)
  const [applicationFeedback, setApplicationFeedback] = useState<MutationFeedbackState>(idleFeedback)

  const bootstrap = bootstrapQuery.data
  const isBootstrapping = bootstrapQuery.isPending
  const options: StudentDemoOptions = bootstrap
    ? {
        categories: bootstrap.categories,
        collegeOptions: bootstrap.collegeOptions,
        gradeOptions: bootstrap.gradeOptions,
        interestOptions: bootstrap.interestOptions,
        skillOptions: bootstrap.skillOptions,
        expectedGainOptions: bootstrap.expectedGainOptions,
      }
    : defaultOptions
  const clubs: Club[] = bootstrap?.clubs ?? []
  const account: StudentAccount = bootstrap?.account ?? defaultAccount
  const profile: StudentProfile = bootstrap?.profile ?? defaultProfile
  const applications: ApplicationRecord[] = bootstrap?.applications ?? []
  const favorites: string[] = bootstrap?.favorites ?? []

  useEffect(() => {
    if (profileFeedback.status !== 'success') {
      return
    }

    const timer = window.setTimeout(() => {
      setProfileFeedback(idleFeedback)
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [profileFeedback])

  useEffect(() => {
    if (favoritesFeedback.status !== 'success') {
      return
    }

    const timer = window.setTimeout(() => {
      setFavoritesFeedback(idleFeedback)
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [favoritesFeedback])

  useEffect(() => {
    if (applicationFeedback.status !== 'success') {
      return
    }

    const timer = window.setTimeout(() => {
      setApplicationFeedback(idleFeedback)
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [applicationFeedback])

  const persistProfile = useCallback(
    (nextProfile: StudentProfile) => {
      setProfileFeedback({
        status: 'loading',
        message: '正在保存画像...',
      })

      void updateProfileMutation
        .mutateAsync(nextProfile)
        .then(() => {
          setProfileFeedback({
            status: 'success',
            message: '画像已自动保存',
          })
        })
        .catch(() => {
          setProfileFeedback({
            status: 'error',
            message: '画像保存失败，请稍后重试',
          })
        })
    },
    [updateProfileMutation],
  )

  const setProfileTextField = useCallback(
    (field: 'college' | 'major' | 'grade', value: string) => {
      persistProfile({
        ...profile,
        [field]: value,
      })
    },
    [persistProfile, profile],
  )

  const setAvailableTime = useCallback((value: TimeLevel) => {
    persistProfile({
      ...profile,
      availableTime: value,
    })
  }, [persistProfile, profile])

  const setProfileTagValues = useCallback(
    (field: 'interests' | 'skills' | 'expectedGain', values: string[]) => {
      persistProfile({
        ...profile,
        [field]: values,
      })
    },
    [persistProfile, profile],
  )

  const toggleFavorite = useCallback((clubId: string) => {
    const nextFavorites = toggleItem(favorites, clubId)

    setFavoritesFeedback({
      status: 'loading',
      message: '正在更新收藏状态...',
    })

    void updateFavoritesMutation
      .mutateAsync(nextFavorites)
      .then(() => {
        setFavoritesFeedback({
          status: 'success',
          message: nextFavorites.includes(clubId) ? '已加入收藏' : '已取消收藏',
        })
      })
      .catch(() => {
        setFavoritesFeedback({
          status: 'error',
          message: '收藏状态更新失败，请稍后重试',
        })
      })
  }, [favorites, updateFavoritesMutation])

  const submitApplication = useCallback(
    async (clubId: string, selectedDirection: string, selfIntro: string, attachmentPath?: string | null) => {
      const targetClub = clubs.find((club) => club.id === clubId)

      if (!targetClub || applications.some((item) => item.clubId === clubId)) {
        setApplicationFeedback({
          status: 'error',
          message: '该社团已报名或当前不可提交，请检查后重试',
        })
        return false
      }

      setApplicationFeedback({
        status: 'loading',
        message: '正在提交报名...',
      })

      try {
        const application = await submitApplicationMutation.mutateAsync({
          clubId: targetClub.id,
          clubName: targetClub.name,
          selectedDirection,
          selfIntro,
          attachmentPath: attachmentPath ?? null,
        })

        if (!application) {
          setApplicationFeedback({
            status: 'error',
            message: '报名提交失败，请稍后重试',
          })
          return false
        }

        setApplicationFeedback({
          status: 'success',
          message: `已成功提交到${targetClub.name}`,
        })

        return true
      } catch {
        setApplicationFeedback({
          status: 'error',
          message: '报名提交失败，请稍后重试',
        })
        return false
      }
    },
    [applications, clubs, submitApplicationMutation],
  )

  const withdrawApplication = useCallback(
    async (applicationId: string) => {
      const targetApplication = applications.find((item) => item.id === applicationId)

      if (!targetApplication || !['已提交', '待筛选', '待面试'].includes(targetApplication.status)) {
        setApplicationFeedback({
          status: 'error',
          message: '当前状态下无法放弃报名，请刷新后重试',
        })
        return false
      }

      setApplicationFeedback({
        status: 'loading',
        message: '正在放弃报名...',
      })

      try {
        const nextApplication = await withdrawApplicationMutation.mutateAsync({ applicationId })

        if (!nextApplication) {
          setApplicationFeedback({
            status: 'error',
            message: '放弃报名失败，请稍后重试',
          })
          return false
        }

        setApplicationFeedback({
          status: 'success',
          message: `已放弃${targetApplication.clubName}的报名`,
        })

        return true
      } catch {
        setApplicationFeedback({
          status: 'error',
          message: '放弃报名失败，请稍后重试',
        })
        return false
      }
    },
    [applications, withdrawApplicationMutation],
  )

  const queryValue = useMemo<DemoQueryState>(() => ({
    isBootstrapping,
    options,
    account,
    clubs,
    profile,
    applications,
    favorites,
    selectedCategory,
    sortType,
    keyword,
    feedback: {
      profile: profileFeedback,
      favorites: favoritesFeedback,
      application: applicationFeedback,
    },
  }), [
    account,
    applications,
    clubs,
    favoritesFeedback,
    favorites,
    applicationFeedback,
    isBootstrapping,
    keyword,
    options,
    profile,
    profileFeedback,
    selectedCategory,
    sortType,
  ])

  const actionValue = useMemo<DemoMutationActions>(() => ({
    saveProfile: persistProfile,
    setProfileTextField,
    setAvailableTime,
    setProfileTagValues,
    setSelectedCategory,
    setSortType,
    setKeyword,
    toggleFavorite,
    submitApplication,
    withdrawApplication,
  }), [
    persistProfile,
    setProfileTextField,
    setAvailableTime,
    setKeyword,
    setProfileTagValues,
    setSelectedCategory,
    setSortType,
    submitApplication,
    toggleFavorite,
    withdrawApplication,
  ])

  return (
    <DemoQueryContext.Provider value={queryValue}>
      <DemoActionContext.Provider value={actionValue}>{children}</DemoActionContext.Provider>
    </DemoQueryContext.Provider>
  )
}

export function useDemoQuery() {
  const context = useContext(DemoQueryContext)

  if (!context) {
    throw new Error('useDemoQuery must be used within DemoProvider')
  }

  return context
}

export function useDemoActions() {
  const context = useContext(DemoActionContext)

  if (!context) {
    throw new Error('useDemoActions must be used within DemoProvider')
  }

  return context
}
