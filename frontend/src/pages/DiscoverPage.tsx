import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClubCard } from '../components/ClubCard'
import { DiscoverToolbar } from '../components/DiscoverToolbar'
import { EmptyState } from '../components/EmptyState'
import { MutationFeedback } from '../components/MutationFeedback'
import { RecommendationCard } from '../components/RecommendationCard'
import { SectionPanel } from '../components/SectionPanel'
import { useDemoActions, useDemoQuery } from '../context/DemoContext'
import { useFilteredClubs, useScoredClubs } from '../hooks/useClubSelectors'
import {
  useRunAiMatchMutation,
  useStudentDemoAiMatchHistoryQuery,
  useStudentDemoLatestAiMatchQuery,
  useStudentDemoNotificationsQuery,
} from '../hooks/useStudentDemoData'
import { hasSupabaseEnv } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { ClubWithScore } from '../utils/recommendation'

export function DiscoverPage() {
  const { options, profile, applications, keyword, selectedCategory, sortType } = useDemoQuery()
  const { setKeyword, setSelectedCategory, setSortType } = useDemoActions()
  const { user } = useAuth()
  const clubList = useFilteredClubs()
  const scoredClubs = useScoredClubs()
  const latestAiMatchQuery = useStudentDemoLatestAiMatchQuery()
  const aiMatchHistoryQuery = useStudentDemoAiMatchHistoryQuery()
  const notificationsQuery = useStudentDemoNotificationsQuery()
  const runAiMatchMutation = useRunAiMatchMutation()
  const [hasRequestedAi, setHasRequestedAi] = useState(false)
  const [dismissedGuide, setDismissedGuide] = useState(false)

  const incompleteProfileFields = useMemo(() => {
    const missingFields: string[] = []

    if (!profile.college.trim()) {
      missingFields.push('学院')
    }

    if (!profile.major.trim()) {
      missingFields.push('专业')
    }

    if (!profile.grade.trim()) {
      missingFields.push('年级')
    }

    if (!profile.availableTime) {
      missingFields.push('可投入时间')
    }

    if (profile.interests.length < 3) {
      missingFields.push('至少3个兴趣标签')
    }

    if (profile.skills.length === 0) {
      missingFields.push('技能标签')
    }

    if (profile.expectedGain.length === 0) {
      missingFields.push('期望收获')
    }

    return missingFields
  }, [profile])

  const isProfileReadyForAiMatch = incompleteProfileFields.length === 0

  const recommendedClubs = useMemo(() => {
    const aiMatches = latestAiMatchQuery.data?.matches ?? []

    return aiMatches
      .map((match) => {
        const club = scoredClubs.find((item) => item.id === match.clubId)

        if (!club) {
          return null
        }

        return {
          ...club,
          matchScore: match.score,
          reasons: match.reasons,
        }
      })
      .filter((club): club is ClubWithScore => Boolean(club))
  }, [latestAiMatchQuery.data, scoredClubs])

  const [featuredClub, ...secondaryRecommendedClubs] = recommendedClubs
  const showAiResults = (hasRequestedAi || Boolean(latestAiMatchQuery.data)) && recommendedClubs.length > 0
  const latestGeneratedAt = latestAiMatchQuery.data?.generatedAt ?? ''
  const latestSource = latestAiMatchQuery.data?.source ?? ''
  const welcomeNotification = notificationsQuery.data?.notifications.find((item) => item.type === 'system') ?? null
  const shouldShowGuide =
    Boolean(welcomeNotification) &&
    !dismissedGuide &&
    (applications.length === 0 || !latestAiMatchQuery.data || incompleteProfileFields.length > 0)

  useEffect(() => {
    if (!user) {
      setDismissedGuide(false)
      return
    }

    const key = `discover-guide-dismissed-${user.id}`
    setDismissedGuide(window.localStorage.getItem(key) === 'true')
  }, [user])

  return (
    <main className="content">
      <SectionPanel
        eyebrow="Discover"
        title="社团发现中心"
        description="先用关键词和分类快速缩小范围，再优先查看最匹配你的社团。"
        tone="featured"
      >
        <DiscoverToolbar
          categories={options.categories}
          keyword={keyword}
          selectedCategory={selectedCategory}
          sortType={sortType}
          onKeywordChange={setKeyword}
          onCategoryChange={setSelectedCategory}
          onSortChange={setSortType}
        />
      </SectionPanel>

      {shouldShowGuide ? (
        <SectionPanel
          eyebrow="First Guide"
          title="先按这3步完成首次上手"
          description={welcomeNotification?.content ?? '建议先完善画像，再触发AI匹配，最后上传简历完成第一份报名。'}
        >
          <div className="onboarding-guide">
            <article className="onboarding-step-card">
              <span className="discover-cover-label">01</span>
              <h3>完善画像</h3>
              <p>先补齐学院、专业、年级，并至少选择3个兴趣标签，这会直接影响推荐质量。</p>
              <Link to="/profile" className="secondary-link">
                去完善画像
              </Link>
            </article>
            <article className="onboarding-step-card">
              <span className="discover-cover-label">02</span>
              <h3>触发AI匹配</h3>
              <p>基于当前画像拿到第一轮AI推荐，并查看最近一次匹配时间与历史结果。</p>
              <button
                type="button"
                className="secondary-button"
                disabled={!hasSupabaseEnv || runAiMatchMutation.isPending || !isProfileReadyForAiMatch}
                onClick={() => {
                  setHasRequestedAi(true)
                  void runAiMatchMutation.mutateAsync(false)
                }}
              >
                立即匹配
              </button>
            </article>
            <article className="onboarding-step-card">
              <span className="discover-cover-label">03</span>
              <h3>上传简历后报名</h3>
              <p>选择适合的社团方向，在报名页上传简历，提交后可在“我的报名”和“消息中心”继续追踪。</p>
              <Link to="/applications" className="secondary-link">
                查看报名页
              </Link>
            </article>
          </div>
          <div className="stack-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                if (user) {
                  window.localStorage.setItem(`discover-guide-dismissed-${user.id}`, 'true')
                }
                setDismissedGuide(true)
              }}
            >
              暂时收起引导
            </button>
          </div>
        </SectionPanel>
      ) : null}

      <SectionPanel
        eyebrow="Curated Picks"
        title="为你优先推荐"
        description="点击后基于你的用户画像触发一次AI匹配，返回更贴近你当前选择偏好的推荐结果。"
      >
        <div className="ai-match-panel">
          <div className="ai-match-intro">
            <span className="discover-cover-label">AI Match</span>
            <h3>让AI基于你的画像给出一次真实推荐。</h3>
            <p>只有在你主动触发后，系统才会调用AI生成高匹配社团和推荐理由。</p>
          </div>
          <div className="ai-match-actions">
            <span className={`status-badge ${isProfileReadyForAiMatch ? 'success' : 'pending'}`}>
              {isProfileReadyForAiMatch ? '画像已完整' : '画像待完善'}
            </span>
            <button
              type="button"
              className="primary-button ai-match-button"
              disabled={!hasSupabaseEnv || runAiMatchMutation.isPending || !isProfileReadyForAiMatch}
              onClick={() => {
                if (!isProfileReadyForAiMatch) {
                  return
                }

                setHasRequestedAi(true)
                void runAiMatchMutation.mutateAsync(false)
              }}
            >
              {!hasSupabaseEnv
                ? '当前环境未开启AI匹配'
                : !isProfileReadyForAiMatch
                  ? '请先完善画像'
                : runAiMatchMutation.isPending
                  ? 'AI匹配中...'
                  : latestAiMatchQuery.data
                    ? '使用当前画像匹配结果'
                    : '一键AI匹配'}
            </button>
            {latestAiMatchQuery.data ? (
              <button
                type="button"
                className="secondary-button ai-match-button"
                disabled={!hasSupabaseEnv || runAiMatchMutation.isPending || !isProfileReadyForAiMatch}
                onClick={() => {
                  setHasRequestedAi(true)
                  void runAiMatchMutation.mutateAsync(true)
                }}
              >
                重新匹配
              </button>
            ) : null}
            <span className="ai-match-hint">
              {!isProfileReadyForAiMatch
                ? `画像未填写完整，需先补充：${incompleteProfileFields.join('、')}`
                : hasSupabaseEnv
                ? latestGeneratedAt
                  ? `最近一次匹配时间：${latestGeneratedAt} · 来源：${latestSource === 'cache' ? '缓存结果' : '实时生成'}`
                  : 'AI会结合兴趣、技能、期望收获和可投入时间生成推荐理由。'
                : '配置Supabase环境并登录后，可使用真实AI匹配。'}
            </span>
            <Link to="/profile" className="secondary-link ai-match-link">
              去完善画像
            </Link>
          </div>
        </div>

        {runAiMatchMutation.isError ? (
          <MutationFeedback
            feedback={{
              status: 'error',
              message: runAiMatchMutation.error instanceof Error ? runAiMatchMutation.error.message : 'AI匹配失败，请稍后重试',
            }}
          />
        ) : null}

        {showAiResults ? (
          <div className="discover-secondary-stack">
            {featuredClub ? <RecommendationCard club={featuredClub} featured /> : null}

            {secondaryRecommendedClubs.length > 0 ? (
              <div className="discover-secondary-grid">
                {secondaryRecommendedClubs.map((club) => (
                  <RecommendationCard key={club.id} club={club} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {hasRequestedAi && !runAiMatchMutation.isPending && recommendedClubs.length === 0 ? (
          <EmptyState
            title="还没有生成AI推荐"
            description={
              runAiMatchMutation.isError
                ? '本次AI匹配请求失败了，请稍后重试。'
                : 'AI暂时没有返回有效结果，你可以调整画像后再次尝试。'
            }
          />
        ) : null}

        {aiMatchHistoryQuery.data && aiMatchHistoryQuery.data.length > 0 ? (
          <div className="ai-history-panel">
            <div className="section-copy">
              <span className="discover-cover-label">History</span>
              <h3>最近匹配记录</h3>
              <p>便于你回看最近几次AI给出的推荐时间和结果来源。</p>
            </div>
            <div className="ai-history-list">
              {aiMatchHistoryQuery.data.map((item) => (
                <article key={item.id} className="ai-history-card">
                  <div className="club-card-top">
                    <div>
                      <strong>{item.generatedAt}</strong>
                      <span>{item.source === 'cache' ? '缓存命中' : '实时生成'}</span>
                    </div>
                    <span className="status-badge neutral">{item.matches.length}条结果</span>
                  </div>
                  <p>{item.matches.map((match) => scoredClubs.find((club) => club.id === match.clubId)?.name ?? match.clubId).join('、')}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </SectionPanel>

      <SectionPanel
        eyebrow="All Clubs"
        title="全部社团"
        description={`当前筛选结果共${clubList.length}个，你可以继续比较风格、方向与投入强度。`}
      >
        {clubList.length > 0 ? (
          <div className="recommend-grid">
            {clubList.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="没有匹配到社团"
            description="当前筛选条件下没有可展示的社团，试试调整关键词、分类或画像标签。"
          />
        )}
      </SectionPanel>
    </main>
  )
}
