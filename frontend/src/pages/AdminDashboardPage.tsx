import { SectionPanel } from '../components/SectionPanel'
import { useOpsQuery } from '../context/OpsContext'

export function AdminDashboardPage() {
  const { clubs, applications, cycles } = useOpsQuery()
  const approvedCount = clubs.filter((item) => item.status === 'approved').length
  const pendingCount = clubs.filter((item) => item.status === 'pending_review').length
  const activeCycle = cycles.find((item) => item.applyEnabled)

  return (
    <main className="single-column">
      <SectionPanel eyebrow="Dashboard" title="平台看板" description="快速查看招新周期、社团审核进度和报名处理规模。">
        <div className="stats-grid">
          <div className="stat-card">
            <span>已通过社团</span>
            <strong>{approvedCount}</strong>
          </div>
          <div className="stat-card">
            <span>待审核社团</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="stat-card">
            <span>报名总量</span>
            <strong>{applications.length}</strong>
          </div>
          <div className="stat-card">
            <span>当前招新周期</span>
            <strong>{activeCycle ? '开放中' : '未开放'}</strong>
          </div>
        </div>
      </SectionPanel>
    </main>
  )
}
