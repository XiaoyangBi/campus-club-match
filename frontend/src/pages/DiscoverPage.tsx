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
        eyebrow="发现"
        title="社团发现"
        description="先筛选，再看推荐。"
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
          eyebrow="新手引导"
          title="第一次使用，先做这3步"
          description={welcomeNotification?.content ?? '先填画像，再看推荐，最后提交报名。'}
        >
          <div className="onboarding-guide">
            <article className="onboarding-step-card">
              <span className="discover-cover-label">01</span>
              <h3>补画像</h3>
              <p>先补基础信息和兴趣标签，推荐会更准。</p>
              <Link to="/profile" className="secondary-link">
                去填写画像
              </Link>
            </article>
            <article className="onboarding-step-card">
              <span className="discover-cover-label">02</span>
              <h3>跑一次AI推荐</h3>
              <p>先拿到一版推荐结果，再决定投哪个。</p>
              <button
                type="button"
                className="secondary-button"
                disabled={!hasSupabaseEnv || runAiMatchMutation.isPending || !isProfileReadyForAiMatch}
                onClick={() => {
                  setHasRequestedAi(true)
                  void runAiMatchMutation.mutateAsync(false)
                }}
              >
                开始匹配
              </button>
            </article>
            <article className="onboarding-step-card">
              <span className="discover-cover-label">03</span>
              <h3>提交报名</h3>
              <p>选好方向后投递，后续进展会同步到报名和消息里。</p>
              <Link to="/applications" className="secondary-link">
                查看报名
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
              先收起
            </button>
          </div>
        </SectionPanel>
      ) : null}

      <SectionPanel
        eyebrow="AI推荐"
        title="AI推荐"
        description="基于当前画像生成一版推荐结果。"
      >
        <div className="ai-match-panel">
          <div className="ai-match-intro">
            <span className="discover-cover-label">智能匹配</span>
            <h3>先让AI帮你缩小范围</h3>
            <p>匹配后会返回推荐社团和简短理由。</p>
          </div>
          <div className="ai-match-actions">
            <span className={`status-badge ${isProfileReadyForAiMatch ? 'success' : 'pending'}`}>
              {isProfileReadyForAiMatch ? '可开始匹配' : '画像待完善'}
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
                ? '当前环境不可用'
                : !isProfileReadyForAiMatch
                  ? '去填写画像'
                : runAiMatchMutation.isPending
                  ? '处理中...'
                  : latestAiMatchQuery.data
                    ? '重新匹配'
                    : '开始AI匹配'}
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
                ? `还缺：${incompleteProfileFields.join('、')}`
                : hasSupabaseEnv
                ? latestGeneratedAt
                  ? `最近匹配：${latestGeneratedAt} · ${latestSource === 'cache' ? '缓存结果' : '实时生成'}`
                  : 'AI会结合兴趣、技能、时间和期望收获给出推荐。'
                : '接入Supabase后可使用真实AI匹配。'}
            </span>
            <Link to="/profile" className="secondary-link ai-match-link">
              去填写画像
            </Link>
          </div>
        </div>

        {runAiMatchMutation.isError ? (
          <MutationFeedback
            feedback={{
              status: 'error',
              message: runAiMatchMutation.error instanceof Error ? runAiMatchMutation.error.message : '匹配失败，请稍后重试',
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
            title="暂无推荐结果"
            description={
              runAiMatchMutation.isError
                ? '本次匹配失败，请稍后再试。'
                : '暂时没有可用结果，调整画像后再试试。'
            }
          />
        ) : null}

        {aiMatchHistoryQuery.data && aiMatchHistoryQuery.data.length > 0 ? (
          <div className="ai-history-panel">
            <div className="section-copy">
              <span className="discover-cover-label">历史记录</span>
              <h3>最近匹配</h3>
              <p>方便回看最近几次结果。</p>
            </div>
            <div className="ai-history-list">
              {aiMatchHistoryQuery.data.map((item) => (
                <article key={item.id} className="ai-history-card">
                  <div className="club-card-top">
                    <div>
                      <strong>{item.generatedAt}</strong>
                      <span>{item.source === 'cache' ? '缓存结果' : '实时生成'}</span>
                    </div>
                    <span className="status-badge neutral">{item.matches.length}项</span>
                  </div>
                  <p>{item.matches.map((match) => scoredClubs.find((club) => club.id === match.clubId)?.name ?? match.clubId).join('、')}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </SectionPanel>

      <SectionPanel
        eyebrow="社团列表"
        title="全部社团"
        description={`共${clubList.length}个结果。`}
      >
        {clubList.length > 0 ? (
          <div className="recommend-grid">
            {clubList.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="没有找到社团"
            description="换个关键词或筛选条件试试。"
          />
        )}
      </SectionPanel>
    </main>
  )
}
