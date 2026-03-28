import { ApplicationStatusCard } from '../components/ApplicationStatusCard'
import { EmptyState } from '../components/EmptyState'
import { MutationFeedback } from '../components/MutationFeedback'
import { SectionPanel } from '../components/SectionPanel'
import { Link } from 'react-router-dom'
import { useDemoActions, useDemoQuery } from '../context/DemoContext'

export function ApplicationsPage() {
  const { applications, feedback } = useDemoQuery()
  const { withdrawApplication } = useDemoActions()

  return (
    <main className="single-column">
      <SectionPanel
        eyebrow="Application Status"
        title="我的报名"
        description="查看已提交、待筛选、待面试和最终结果状态。"
        actions={
          <Link to="/discover" className="secondary-link">
            去发现更多社团
          </Link>
        }
      >
        <MutationFeedback feedback={feedback.application} />

        {applications.length > 0 ? (
          <div className="application-list">
            {applications.map((application) => (
              <ApplicationStatusCard
                key={application.id}
                application={application}
                onWithdraw={(applicationId) => {
                  void withdrawApplication(applicationId)
                }}
                isWithdrawing={feedback.application.status === 'loading'}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="你还没有报名记录"
            description="先去发现页看看推荐社团，找到合适的再提交第一份报名。"
            actions={
              <Link to="/discover" className="primary-link">
                去发现页
              </Link>
            }
          />
        )}
      </SectionPanel>
    </main>
  )
}
