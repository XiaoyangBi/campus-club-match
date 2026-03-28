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
      <SectionPanel eyebrow="Cycle Config" title="招新周期配置" description="控制平台当前招新周期是否开放，并维护基础通知模板。">
        <div className="ops-form-grid">
          <div className="field-block">
            <label htmlFor="cycleName">周期名称</label>
            <input id="cycleName" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>
          <div className="field-block">
            <label htmlFor="cycleStart">开始日期</label>
            <input id="cycleStart" value={draft.startDate} onChange={(event) => setDraft({ ...draft, startDate: event.target.value })} />
          </div>
          <div className="field-block">
            <label htmlFor="cycleEnd">结束日期</label>
            <input id="cycleEnd" value={draft.endDate} onChange={(event) => setDraft({ ...draft, endDate: event.target.value })} />
          </div>
          <div className="field-block">
            <label htmlFor="cycleNotice">通知模板</label>
            <textarea
              id="cycleNotice"
              rows={5}
              value={draft.noticeTemplate}
              onChange={(event) => setDraft({ ...draft, noticeTemplate: event.target.value })}
            />
          </div>
          <div className="field-block">
            <label htmlFor="cycleInterviewNotice">面试通知模板</label>
            <textarea
              id="cycleInterviewNotice"
              rows={5}
              value={draft.interviewNoticeTemplate}
              onChange={(event) => setDraft({ ...draft, interviewNoticeTemplate: event.target.value })}
            />
            <span className="field-note">{'支持占位符：{{clubName}}、{{status}}、{{note}}、{{selectedDirection}}'}</span>
          </div>
        </div>
        <div className="stack-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setDraft((current) => ({ ...current, applyEnabled: !current.applyEnabled }))}
          >
            {draft.applyEnabled ? '关闭本周期报名' : '开启本周期报名'}
          </button>
          <button type="button" className="primary-button" onClick={() => updateCycle(cycle.id, draft)}>
            保存周期配置
          </button>
        </div>
      </SectionPanel>
    </main>
  )
}
