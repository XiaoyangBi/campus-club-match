import { useMemo, useState } from 'react'
import { SectionPanel } from '../components/SectionPanel'
import { useOpsActions, useOpsQuery } from '../context/OpsContext'
import type { ApplicationStatus } from '../types'

type ClubManageStatus = '待筛选' | '待面试' | '已录取' | '未通过'

const quickStatuses: ClubManageStatus[] = ['待筛选', '待面试', '已录取', '未通过']
const statusActionLabelMap: Record<ClubManageStatus, string> = {
  待筛选: '开始筛选',
  待面试: '发送面试通知',
  已录取: '发送录取通知',
  未通过: '发送未通过通知',
}

export function ClubApplicationsPage() {
  const { applications, clubs } = useOpsQuery()
  const { updateApplicationStatus } = useOpsActions()
  const [selectedStatus, setSelectedStatus] = useState<'全部' | ApplicationStatus>('全部')
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})

  const visibleApplications = useMemo(
    () => applications.filter((item) => (selectedStatus === '全部' ? true : item.status === selectedStatus)),
    [applications, selectedStatus],
  )

  return (
    <main className="single-column">
      <SectionPanel
        eyebrow="申请处理"
        title="报名处理"
        description="按状态筛选，并快速推进处理。"
        actions={
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value as '全部' | ApplicationStatus)}>
            <option value="全部">全部状态</option>
            <option value="已提交">已提交</option>
            <option value="待筛选">待筛选</option>
            <option value="待面试">待面试</option>
            <option value="已录取">已录取</option>
            <option value="未通过">未通过</option>
          </select>
        }
      >
        <div className="ops-card-grid">
          {visibleApplications.map((application) => {
            const club = clubs.find((item) => item.id === application.clubId)
            const note = noteDrafts[application.id] ?? application.note
            return (
              <article key={application.id} className="ops-card">
                <div className="club-card-top">
                  <div>
                    <strong>{application.applicantName}</strong>
                    <span>{club?.name ?? application.clubId} · {application.selectedDirection}</span>
                  </div>
                  <span className={`status-badge ${application.status === '已录取' ? 'success' : application.status === '未通过' ? 'reject' : application.status === '待面试' ? 'info' : 'pending'}`}>
                    {application.status}
                  </span>
                </div>
                <p>{application.selfIntro}</p>
                <div className="application-meta">
                  <span>{application.college} · {application.major} · {application.grade}</span>
                  <span>附件：{application.attachmentName}</span>
                  <span>提交：{application.submittedAt}</span>
                </div>
                <textarea
                  value={note}
                  rows={3}
                  onChange={(event) =>
                    setNoteDrafts((current) => ({
                      ...current,
                      [application.id]: event.target.value,
                    }))
                  }
                />
                <div className="chip-group">
                  {quickStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={application.status === status ? 'chip active' : 'chip'}
                      onClick={() => updateApplicationStatus(application.id, status, note)}
                    >
                      {statusActionLabelMap[status]}
                    </button>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </SectionPanel>
    </main>
  )
}
