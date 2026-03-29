import { useMemo } from 'react'
import { useDemoQuery } from '../context/DemoContext'
import { buildScoredClubs, getDeadlineScore, type ClubWithScore } from '../utils/recommendation'

export function useScoredClubs() {
  const { clubs, profile } = useDemoQuery()

  return useMemo(() => buildScoredClubs(clubs, profile), [clubs, profile])
}

export function useFilteredClubs() {
  const { keyword, selectedCategory, sortType } = useDemoQuery()
  const scoredClubs = useScoredClubs()

  return useMemo(() => {
    return scoredClubs
      .filter((club) => {
        const matchesCategory = selectedCategory === '全部' || club.category === selectedCategory
        const matchesKeyword =
          keyword.trim() === '' ||
          club.name.includes(keyword) ||
          club.intro.includes(keyword) ||
          club.tags.some((tag) => tag.includes(keyword))

        return matchesCategory && matchesKeyword
      })
      .sort((a, b) => {
        if (sortType === 'deadline') {
          return getDeadlineScore(a.recruitDeadline) - getDeadlineScore(b.recruitDeadline)
        }

        if (sortType === 'hot') {
          return b.popularity - a.popularity
        }

        return b.matchScore - a.matchScore
      })
  }, [keyword, scoredClubs, selectedCategory, sortType])
}

export function useRecommendedClubs() {
  const scoredClubs = useScoredClubs()

  return useMemo(
    () => scoredClubs.slice().sort((a, b) => b.matchScore - a.matchScore).slice(0, 3),
    [scoredClubs],
  )
}

export function useClubById(clubId?: string) {
  const scoredClubs = useScoredClubs()

  return useMemo(
    () => (clubId ? scoredClubs.find((club) => club.id === clubId) : undefined),
    [clubId, scoredClubs],
  )
}

export function useHasApplied(clubId?: string) {
  const { applications } = useDemoQuery()

  return useMemo(
    () => (clubId ? applications.some((item) => item.clubId === clubId) : false),
    [applications, clubId],
  )
}

export function useStudentDashboardStats() {
  const { applications, favorites, clubs } = useDemoQuery()

  return useMemo(
    () => ({
      openClubCount: clubs.length,
      applicationCount: applications.length,
      favoriteCount: favorites.length,
    }),
    [applications.length, favorites.length, clubs.length],
  )
}

export type { ClubWithScore }
