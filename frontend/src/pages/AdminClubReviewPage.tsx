import { useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { SectionPanel } from '../components/SectionPanel'
import { useOpsActions, useOpsQuery } from '../context/OpsContext'

export function AdminClubReviewPage() {
  const { clubs } = useOpsQuery()
  const { reviewClub } = useOpsActions()
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const pendingClubs = clubs.filter((club) => club.status === 'pending_review')

  return (
    <main className="single-column">
      <SectionPanel eyebrow="审核" title="社团审核" description="集中处理社团审核结果。">
        {pendingClubs.length === 0 ? (
          <EmptyState
            panel
            title="当前没有待审核社团"
            description="已通过或已驳回的社团不再显示在这里。新的待审核社团进入队列后，会出现在这个面板。"
          />
        ) : (
          <>
            <div className="review-queue-summary">
              <article className="review-queue-stat">
                <span>待审核社团</span>
                <strong>{pendingClubs.length}</strong>
              </article>
              <article className="review-queue-tip">
                <span>处理建议</span>
                <p>优先核对社团简介、联系人邮箱和截止时间是否完整，再决定通过或驳回。</p>
              </article>
            </div>

            <div className="review-queue-list">
              {pendingClubs.map((club) => {
            const reason = reasons[club.id] ?? ''
            return (
                  <article key={club.id} className="review-queue-card">
                    <div className="review-queue-top">
                      <div className="review-queue-title">
                        <div className="review-queue-meta">
                          <span className="tag">{club.category}</span>
                          <span className="tag">{club.contactEmail}</span>
                        </div>
                        <strong>{club.name}</strong>
                      </div>
                      <span className="status-badge pending">待审核</span>
                    </div>

                    <p className="review-queue-intro">{club.intro}</p>

                    <div className="review-queue-info">
                      <div>
                        <span>负责人</span>
                        <strong>{club.leaderName}</strong>
                      </div>
                      <div>
                        <span>截止时间</span>
                        <strong>{club.recruitDeadline}</strong>
                      </div>
                    </div>

                    {club.reviewNote ? (
                      <div className="review-queue-note">
                        <span>当前备注</span>
                        <p>{club.reviewNote}</p>
                      </div>
                    ) : null}

                    <div className="field-block review-queue-field">
                      <label htmlFor={`review-note-${club.id}`}>审核备注</label>
                      <textarea
                        id={`review-note-${club.id}`}
                        rows={4}
                        placeholder="填写审核判断、需补充信息或驳回原因"
                        value={reason}
                        onChange={(event) =>
                          setReasons((current) => ({
                            ...current,
                            [club.id]: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="review-queue-actions">
                      <button type="button" className="ghost-button danger" onClick={() => reviewClub(club.id, 'rejected', reason)}>
                        驳回
                      </button>
                      <button type="button" className="primary-button review-approve-button" onClick={() => reviewClub(club.id, 'approved', reason)}>
                        通过审核
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </SectionPanel>
    </main>
  )
}
