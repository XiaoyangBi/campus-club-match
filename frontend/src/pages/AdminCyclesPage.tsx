import { useEffect, useState } from 'react'
import { SectionPanel } from '../components/SectionPanel'
import { useOpsActions, useOpsQuery } from '../context/OpsContext'

export function AdminCyclesPage() {
  const { cycles } = useOpsQuery()
  const { updateCycle } = useOpsActions()
  const cycle = cycles[0]
  const [draft, setDraft] = useState(cycle ?? null)

  useEffect(() => {
    if (cycle) {
      setDraft(cycle)
    }
  }, [cycle])

  if (!cycle || !draft) {
    return null
  }

  return (
    <main className="single-column">
      <SectionPanel eyebrow="周期配置" title="招新周期" description="维护开放时间与通知模板。">
        <div className="cycle-config-layout">
          <aside className="cycle-config-summary">
            <article className="cycle-config-card cycle-config-card-highlight">
              <span className="cycle-config-label">当前状态</span>
              <strong>{draft.applyEnabled ? '报名开放中' : '报名已关闭'}</strong>
              <p>{draft.applyEnabled ? '学生端当前可以继续提交报名。' : '学生端当前不会开放新的报名提交。'}</p>
            </article>

            <article className="cycle-config-card">
              <span className="cycle-config-label">周期时间</span>
              <strong>{draft.name}</strong>
              <p>
                {draft.startDate} 至 {draft.endDate}
              </p>
            </article>

            <article className="cycle-config-card">
              <span className="cycle-config-label">模板提示</span>
              <p>建议把通知文案写成可直接发送给学生的正式口吻，减少社团端重复修改成本。</p>
              <div className="chip-group compact">
                <span className="tag">{'{{clubName}}'}</span>
                <span className="tag">{'{{status}}'}</span>
                <span className="tag">{'{{note}}'}</span>
                <span className="tag">{'{{selectedDirection}}'}</span>
              </div>
            </article>
          </aside>

          <div className="cycle-config-editor">
            <div className="cycle-config-grid">
              <div className="field-block cycle-config-field cycle-config-field-compact">
                <label htmlFor="cycleName">周期名称</label>
                <input id="cycleName" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </div>

              <div className="field-block cycle-config-field cycle-config-field-compact">
                <label htmlFor="cycleStart">开始日期</label>
                <input
                  id="cycleStart"
                  type="date"
                  value={draft.startDate}
                  onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
                />
              </div>

              <div className="field-block cycle-config-field cycle-config-field-compact">
                <label htmlFor="cycleEnd">结束日期</label>
                <input
                  id="cycleEnd"
                  type="date"
                  value={draft.endDate}
                  onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
                />
              </div>

              <div className="field-block cycle-config-field cycle-config-field-wide">
                <label htmlFor="cycleNotice">通用通知模板</label>
                <textarea
                  id="cycleNotice"
                  rows={5}
                  value={draft.noticeTemplate}
                  onChange={(event) => setDraft({ ...draft, noticeTemplate: event.target.value })}
                />
                <span className="field-note">用于通过、未通过、状态更新等通用通知场景。</span>
              </div>

              <div className="field-block cycle-config-field cycle-config-field-wide">
                <label htmlFor="cycleInterviewNotice">面试通知模板</label>
                <textarea
                  id="cycleInterviewNotice"
                  rows={5}
                  value={draft.interviewNoticeTemplate}
                  onChange={(event) => setDraft({ ...draft, interviewNoticeTemplate: event.target.value })}
                />
                <span className="field-note">{'可用占位符：{{clubName}}、{{status}}、{{note}}、{{selectedDirection}}'}</span>
              </div>
            </div>

            <div className="cycle-config-footer">
              <div className="cycle-config-status-text">
                <span className={`status-badge ${draft.applyEnabled ? 'success' : 'neutral'}`}>
                  {draft.applyEnabled ? '当前对学生开放' : '当前对学生关闭'}
                </span>
                <small>保存后将同步影响学生端报名状态与通知模板。</small>
              </div>

              <div className="stack-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setDraft((current) => ({ ...current, applyEnabled: !current.applyEnabled }))}
                >
                  {draft.applyEnabled ? '关闭报名' : '开启报名'}
                </button>
                <button type="button" className="primary-button" onClick={() => updateCycle(cycle.id, draft)}>
                  保存配置
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionPanel>
    </main>
  )
}
