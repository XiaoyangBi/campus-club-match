import { SectionPanel } from '../components/SectionPanel'
import { useOpsQuery } from '../context/OpsContext'

export function ClubDashboardPage() {
  const { clubs, applications } = useOpsQuery()
  const ownedClubIds = new Set(clubs.map((item) => item.id))
  const ownedApplications = applications.filter((item) => ownedClubIds.has(item.clubId))
  const pendingCount = ownedApplications.filter((item) => item.status === '已提交' || item.status === '待筛选').length
  const interviewCount = ownedApplications.filter((item) => item.status === '待面试').length
  const offerCount = ownedApplications.filter((item) => item.status === '已录取').length

  return (
    <main className="single-column">
      <SectionPanel eyebrow="Overview" title="招新概览" description="快速查看当前社团资料状态和待处理报名。">
        <div className="stats-grid">
          <div className="stat-card">
            <span>负责社团</span>
            <strong>{clubs.length}</strong>
          </div>
          <div className="stat-card">
            <span>待处理报名</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="stat-card">
            <span>待面试</span>
            <strong>{interviewCount}</strong>
          </div>
          <div className="stat-card">
            <span>已录取</span>
            <strong>{offerCount}</strong>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel eyebrow="Club Status" title="社团发布状态" description="查看当前社团是否已通过审核并保持开放招新。">
        <div className="ops-card-grid">
          {clubs.map((club) => (
            <article key={club.id} className="ops-card">
              <div className="club-card-top">
                <div>
                  <strong>{club.name}</strong>
                  <span>{club.category} · {club.leaderName}</span>
                </div>
                <span className={`status-badge ${club.status === 'approved' ? 'success' : club.status === 'pending_review' ? 'pending' : 'reject'}`}>
                  {club.status === 'approved' ? '已通过' : club.status === 'pending_review' ? '待审核' : '已驳回'}
                </span>
              </div>
              <p>{club.intro}</p>
              {club.reviewNote ? <div className="field-note">审核备注：{club.reviewNote}</div> : null}
            </article>
          ))}
        </div>
      </SectionPanel>
    </main>
  )
}
