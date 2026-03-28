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
      <SectionPanel eyebrow="Club Profile" title="社团资料维护" description="调整社团简介、联系人和招新截止时间，满足首期资料维护场景。">
        <div className="ops-form-grid">
          <div className="field-block">
            <label htmlFor="clubName">社团名称</label>
            <input id="clubName" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </div>
          <div className="field-block">
            <label htmlFor="clubLeader">负责人</label>
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
            保存社团资料
          </button>
        </div>
      </SectionPanel>
    </main>
  )
}
