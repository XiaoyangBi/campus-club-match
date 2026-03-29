import { useEffect, useState } from 'react'
import { SectionPanel } from '../components/SectionPanel'
import { useOpsActions, useOpsQuery } from '../context/OpsContext'

export function ClubProfilePage() {
  const { clubs } = useOpsQuery()
  const { updateClubProfile } = useOpsActions()
  const primaryClub = clubs[0]
  const [draft, setDraft] = useState(primaryClub ?? null)

  useEffect(() => {
    if (primaryClub) {
      setDraft(primaryClub)
    }
  }, [primaryClub])

  if (!primaryClub || !draft) {
    return null
  }

  return (
    <main className="single-column">
      <SectionPanel eyebrow="资料维护" title="社团资料" description="维护对外展示信息与联系人。">
        <div className="ops-form-grid">
          <div className="field-block">
            <label htmlFor="clubName">社团名称</label>
            <input id="clubName" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>
          <div className="field-block">
            <label htmlFor="clubLeader">负责人姓名</label>
            <input id="clubLeader" value={draft.leaderName} onChange={(event) => setDraft({ ...draft, leaderName: event.target.value })} />
          </div>
          <div className="field-block">
            <label htmlFor="clubEmail">联系邮箱</label>
            <input id="clubEmail" value={draft.contactEmail} onChange={(event) => setDraft({ ...draft, contactEmail: event.target.value })} />
          </div>
          <div className="field-block">
            <label htmlFor="clubDeadline">招新截止时间</label>
            <input
              id="clubDeadline"
              value={draft.recruitDeadline}
              onChange={(event) => setDraft({ ...draft, recruitDeadline: event.target.value })}
            />
          </div>
          <div className="field-block">
            <label htmlFor="clubIntro">社团简介</label>
            <textarea
              id="clubIntro"
              rows={6}
              value={draft.intro}
              onChange={(event) => setDraft({ ...draft, intro: event.target.value })}
            />
          </div>
        </div>
        <div className="stack-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => updateClubProfile(primaryClub.id, draft)}
          >
            保存修改
          </button>
        </div>
      </SectionPanel>
    </main>
  )
}
