import { Link, useParams } from 'react-router-dom'
import { ClubInfoPanel } from '../components/ClubInfoPanel'
import { EmptyState } from '../components/EmptyState'
import { FavoriteButton } from '../components/FavoriteButton'
import { MutationFeedback } from '../components/MutationFeedback'
import { SectionPanel } from '../components/SectionPanel'
import { SubmitActionBox } from '../components/SubmitActionBox'
import { useDemoActions, useDemoQuery } from '../context/DemoContext'
import { useClubById, useHasApplied } from '../hooks/useClubSelectors'

export function ClubDetailPage() {
  const { clubId } = useParams()
  const { favorites, feedback, isBootstrapping } = useDemoQuery()
  const { toggleFavorite } = useDemoActions()
  const club = useClubById(clubId)
  const applied = useHasApplied(clubId)

  if (isBootstrapping) {
    return (
      <main className="single-column">
        <EmptyState panel title="正在加载社团" description="请稍候。" />
      </main>
    )
  }

  if (!club) {
    return (
      <main className="single-column">
        <EmptyState panel title="社团不存在" description="这个社团可能已下线，请返回发现页重新选择。" />
      </main>
    )
  }

  return (
    <main className="single-column">
      <SectionPanel
        eyebrow="社团详情"
        title={club.name}
        description={`${club.category}社团`}
        actions={
          <div className="actions-inline">
            <span className="badge">招新中</span>
            <FavoriteButton
              active={favorites.includes(club.id)}
              loading={feedback.favorites.status === 'loading'}
              onClick={() => toggleFavorite(club.id)}
            />
          </div>
        }
      >
        <MutationFeedback feedback={feedback.favorites} />

        <ClubInfoPanel
          club={club}
          sideContent={
            <SubmitActionBox
              title="下一步"
              description="现在就报名，或继续比较其他社团。"
              actions={
                <>
                <Link to={`/apply/${club.id}`} className="primary-link">
                  {applied ? '查看报名进度' : '提交报名'}
                </Link>
                <Link to="/discover" className="secondary-link">
                  返回发现页
                </Link>
                </>
              }
            />
          }
        />
      </SectionPanel>
    </main>
  )
}
