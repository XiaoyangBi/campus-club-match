import type { ApplicationRecord } from '../types'
import { applicationStatusToneMap } from '../utils/recommendation'

type ApplicationStatusCardProps = {
  application: ApplicationRecord
  onWithdraw?: (applicationId: string) => void
  isWithdrawing?: boolean
}

export function ApplicationStatusCard({ application, onWithdraw, isWithdrawing = false }: ApplicationStatusCardProps) {
  const canWithdraw = ['已提交', '待筛选', '待面试'].includes(application.status)
  const latestHistory = application.history[application.history.length - 1]
  const operatorLabelMap = {
    student: '你',
    club_admin: '社团管理员',
    school_admin: '平台管理员',
    system: '系统',
  } as const

  return (
    <article className="application-card">
      <div className="club-card-top">
        <div>
          <strong>{application.clubName}</strong>
          <span>{application.selectedDirection}</span>
        </div>
        <span className={`status-badge ${applicationStatusToneMap[application.status]}`}>
          {application.status}
        </span>
      </div>
      <p>{application.selfIntro}</p>
      <div className="application-detail-grid">
        <div className="application-detail-card">
          <span className="application-detail-label">当前进度</span>
          <strong>{application.status}</strong>
          <p>{application.note}</p>
        </div>
        <div className="application-detail-card">
          <span className="application-detail-label">简历附件</span>
          <strong>{application.attachmentUrl ? '已上传' : '未上传'}</strong>
          <p>{application.attachmentUrl ? '报名材料已随记录保存，可随时回看。' : '当前记录没有附带简历附件。'}</p>
          {application.attachmentUrl ? (
            <a href={application.attachmentUrl} target="_blank" rel="noreferrer" className="secondary-link">
              打开简历
            </a>
          ) : null}
        </div>
      </div>
      <div className="application-meta">
        <span>提交时间：{application.submittedAt}</span>
        <span>
          最近一次更新：
          {latestHistory ? `${latestHistory.createdAt} · ${operatorLabelMap[latestHistory.operatorType]}` : '暂无'}
        </span>
      </div>
      {application.history.length > 0 ? (
        <div className="application-history-wrapper">
          <div className="application-history-header">
            <strong>状态时间线</strong>
            <span>{application.history.length}次记录</span>
          </div>
          <div className="application-history-list">
          {application.history.map((item) => (
            <div key={item.id} className="application-history-item timeline">
              <div className="application-history-dot" />
              <div className="application-history-content">
                <div className="application-history-topline">
                  <strong>{item.fromStatus ? `${item.fromStatus} -> ${item.toStatus}` : item.toStatus}</strong>
                  <span>{item.createdAt}</span>
                </div>
                <div className="application-history-operator">{operatorLabelMap[item.operatorType]}发起</div>
                <p>{item.note}</p>
              </div>
            </div>
          ))}
          </div>
        </div>
      ) : null}
      {canWithdraw && onWithdraw ? (
        <div className="application-card-actions">
          <button
            type="button"
            className="ghost-button danger"
            onClick={() => onWithdraw(application.id)}
            disabled={isWithdrawing}
          >
            {isWithdrawing ? '处理中...' : '放弃报名'}
          </button>
        </div>
      ) : null}
    </article>
  )
}
