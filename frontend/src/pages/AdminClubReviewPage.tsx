import { useState } from 'react'
import { SectionPanel } from '../components/SectionPanel'
import { useOpsActions, useOpsQuery } from '../context/OpsContext'

export function AdminClubReviewPage() {
  const { clubs } = useOpsQuery()
  const { reviewClub } = useOpsActions()
  const [reasons, setReasons] = useState<Record<string, string>>({})

  return (
    <main className="single-column">
      <SectionPanel eyebrow="审核" title="社团审核" description="集中处理社团审核结果。">
        <div className="ops-card-grid">
          {clubs.map((club) => {
            const reason = reasons[club.id] ?? ''
            return (
              <article key={club.id} className="ops-card">
                <div className="club-card-top">
                  <div>
                    <strong>{club.name}</strong>
                    <span>{club.category} · {club.contactEmail}</span>
                  </div>
                  <span className={`status-badge ${club.status === 'approved' ? 'success' : club.status === 'pending_review' ? 'pending' : 'reject'}`}>
                    {club.status === 'approved' ? '已通过' : club.status === 'pending_review' ? '待审核' : '已驳回'}
                  </span>
                </div>
                <p>{club.intro}</p>
                {club.reviewNote ? <div className="field-note">当前备注：{club.reviewNote}</div> : null}
                <textarea
                  rows={3}
                  placeholder="填写审核备注或驳回原因"
                  value={reason}
                  onChange={(event) =>
                    setReasons((current) => ({
                      ...current,
                      [club.id]: event.target.value,
                    }))
                  }
                />
                <div className="stack-actions">
                  <button type="button" className="primary-button" onClick={() => reviewClub(club.id, 'approved', reason)}>
                    通过
                  </button>
                  <button type="button" className="ghost-button danger" onClick={() => reviewClub(club.id, 'rejected', reason)}>
                    驳回
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </SectionPanel>
    </main>
  )
}
