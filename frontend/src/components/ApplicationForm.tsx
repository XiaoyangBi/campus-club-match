import { MutationFeedback, type MutationFeedbackState } from './MutationFeedback'
import { Link } from 'react-router-dom'

type ApplicationFormProps = {
  clubId: string
  directions: string[]
  selectedDirection: string
  selfIntro: string
  resumeName: string
  resumeError?: string
  applied: boolean
  submitting?: boolean
  feedback?: MutationFeedbackState
  onDirectionChange: (value: string) => void
  onSelfIntroChange: (value: string) => void
  onResumeChange: (file: File | null) => void
  onSubmit: () => void
}

export function ApplicationForm({
  clubId,
  directions,
  selectedDirection,
  selfIntro,
  resumeName,
  resumeError = '',
  applied,
  submitting = false,
  feedback,
  onDirectionChange,
  onSelfIntroChange,
  onResumeChange,
  onSubmit,
}: ApplicationFormProps) {
  return (
    <div className="application-box standalone">
      {feedback ? <MutationFeedback feedback={feedback} /> : null}

      <div className="application-form-grid">
        <div className="application-form-field">
          <label htmlFor="direction">报名方向</label>
          <select
            id="direction"
            value={selectedDirection}
            onChange={(event) => onDirectionChange(event.target.value)}
            disabled={applied || submitting}
          >
            {directions.map((direction) => (
              <option key={direction} value={direction}>
                {direction}
              </option>
            ))}
          </select>
          <span className="field-note">优先选你最想长期参与的方向。</span>
        </div>

        <div className="application-form-field">
          <div className="application-form-label-row">
            <label htmlFor="selfIntro">自我介绍</label>
            <span className="field-note">{selfIntro.length}字</span>
          </div>
          <textarea
            id="selfIntro"
            value={selfIntro}
            onChange={(event) => onSelfIntroChange(event.target.value)}
            rows={7}
            disabled={applied || submitting}
          />
          <span className="field-note">写清你的兴趣、经历和想做什么。</span>
        </div>

        <div className="application-form-field">
          <label htmlFor="resumeUpload">简历附件</label>
          <input
            id="resumeUpload"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={applied || submitting}
            onChange={(event) => onResumeChange(event.target.files?.[0] ?? null)}
          />
          <span className="field-note">{resumeName || '支持PDF/DOC/DOCX，建议5MB以内。'}</span>
          {resumeError ? <div className="field-error">{resumeError}</div> : null}
        </div>
      </div>

      <div className="stack-actions">
        <button type="button" className="primary-button" onClick={onSubmit} disabled={applied || submitting}>
          {applied ? '查看报名进度' : submitting ? '处理中...' : `提交报名`}
        </button>
        <Link to={`/clubs/${clubId}`} className="secondary-link">
          查看社团详情
        </Link>
      </div>
    </div>
  )
}
