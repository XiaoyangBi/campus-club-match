import { useMemo, useState } from 'react'
import { useParseResumeMutation } from '../hooks/useStudentDemoData'
import type { ResumeParseSuggestion, StudentProfile } from '../types'
import { extractPdfText } from '../utils/extractPdfText'
import { MutationFeedback, type MutationFeedbackState } from './MutationFeedback'

type ResumeProfileAssistantProps = {
  profile: StudentProfile
  disabled?: boolean
  onApplySuggestion: (nextProfile: StudentProfile) => void
}

type ApplySelection = {
  college: boolean
  major: boolean
  interests: boolean
  skills: boolean
  expectedGain: boolean
}

const idleFeedback: MutationFeedbackState = {
  status: 'idle',
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter((item) => item.trim())))
}

function buildDefaultSelection(profile: StudentProfile, suggestion: ResumeParseSuggestion): ApplySelection {
  return {
    college: Boolean(suggestion.college) && !profile.college.trim(),
    major: Boolean(suggestion.major) && !profile.major.trim(),
    interests: suggestion.interests.length > 0,
    skills: suggestion.skills.length > 0,
    expectedGain: suggestion.expectedGain.length > 0,
  }
}

export function ResumeProfileAssistant({ profile, disabled = false, onApplySuggestion }: ResumeProfileAssistantProps) {
  const parseResumeMutation = useParseResumeMutation()
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState<MutationFeedbackState>(idleFeedback)
  const [suggestion, setSuggestion] = useState<ResumeParseSuggestion | null>(null)
  const [selection, setSelection] = useState<ApplySelection>({
    college: false,
    major: false,
    interests: true,
    skills: true,
    expectedGain: true,
  })

  const parsedTagCount = useMemo(() => {
    if (!suggestion) {
      return 0
    }

    return suggestion.interests.length + suggestion.skills.length + suggestion.expectedGain.length
  }, [suggestion])

  const handleParseResume = async () => {
    if (!resumeFile) {
      setFeedback({
        status: 'error',
        message: '请先选择一份PDF简历',
      })
      return
    }

    if (resumeFile.type && resumeFile.type !== 'application/pdf') {
      setFeedback({
        status: 'error',
        message: '目前仅支持PDF格式的简历文件',
      })
      return
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      setFeedback({
        status: 'error',
        message: '简历文件需控制在5MB以内',
      })
      return
    }

    try {
      setFeedback({
        status: 'loading',
        message: '正在解析...',
      })

      const extractedText = await extractPdfText(resumeFile)
      const nextSuggestion = await parseResumeMutation.mutateAsync(extractedText)

      setSuggestion(nextSuggestion)
      setSelection(buildDefaultSelection(profile, nextSuggestion))
      setFeedback({
        status: 'success',
        message: '解析完成，请确认要采纳的内容',
      })
    } catch (error) {
      setSuggestion(null)
      setFeedback({
        status: 'error',
        message: error instanceof Error ? error.message : '解析失败，请稍后重试',
      })
    }
  }

  const handleApplySuggestion = () => {
    if (!suggestion) {
      return
    }

    const nextProfile: StudentProfile = {
      ...profile,
      college: selection.college && suggestion.college ? suggestion.college : profile.college,
      major: selection.major && suggestion.major ? suggestion.major : profile.major,
      interests: selection.interests ? uniqueValues([...profile.interests, ...suggestion.interests]) : profile.interests,
      skills: selection.skills ? uniqueValues([...profile.skills, ...suggestion.skills]) : profile.skills,
      expectedGain: selection.expectedGain
        ? uniqueValues([...profile.expectedGain, ...suggestion.expectedGain])
        : profile.expectedGain,
    }

    onApplySuggestion(nextProfile)
    setFeedback({
      status: 'success',
      message: '已写入当前编辑内容，请再点击“保存修改”',
    })
  }

  return (
    <section className="resume-assistant-card">
      <div className="resume-assistant-head">
        <div>
          <span className="section-eyebrow">简历辅助</span>
          <h3>用简历生成画像</h3>
          <p>不会填也没关系，先上传简历，我们帮你生成一版候选标签。</p>
        </div>
        <div className="resume-assistant-stats">
          <strong>{parsedTagCount}</strong>
          <span>候选标签</span>
        </div>
      </div>

      <div className="resume-upload-box">
        <input
          type="file"
          accept="application/pdf"
          disabled={disabled || parseResumeMutation.isPending}
          onChange={(event) => {
            setResumeFile(event.target.files?.[0] ?? null)
            setSuggestion(null)
            setFeedback(idleFeedback)
          }}
        />
        <div className="resume-upload-meta">
          <strong>{resumeFile?.name ?? '尚未选择文件'}</strong>
          <span>仅支持文本型PDF，建议5MB以内。</span>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={disabled || parseResumeMutation.isPending || !resumeFile}
          onClick={() => void handleParseResume()}
        >
          {parseResumeMutation.isPending ? '处理中...' : '开始解析'}
        </button>
      </div>

      <MutationFeedback feedback={feedback} />

      {suggestion ? (
        <div className="resume-suggestion-grid">
          <div className="resume-suggestion-main">
            <div className="resume-suggestion-summary">
              <span>AI画像摘要</span>
              <strong>{suggestion.summary}</strong>
              <small>可信度：{suggestion.confidence === 'high' ? '高' : suggestion.confidence === 'medium' ? '中' : '低'}</small>
            </div>

            <div className="resume-suggestion-section">
              <label className="resume-toggle-line">
                <input
                  type="checkbox"
                  checked={selection.college}
                  onChange={(event) => setSelection((current) => ({ ...current, college: event.target.checked }))}
                />
                <span>采纳学院</span>
              </label>
              <div className="resume-suggestion-value">{suggestion.college || '未识别到学院'}</div>
            </div>

            <div className="resume-suggestion-section">
              <label className="resume-toggle-line">
                <input
                  type="checkbox"
                  checked={selection.major}
                  onChange={(event) => setSelection((current) => ({ ...current, major: event.target.checked }))}
                />
                <span>采纳专业</span>
              </label>
              <div className="resume-suggestion-value">{suggestion.major || '未识别到专业'}</div>
            </div>

            <div className="resume-suggestion-section">
              <label className="resume-toggle-line">
                <input
                  type="checkbox"
                  checked={selection.interests}
                  onChange={(event) => setSelection((current) => ({ ...current, interests: event.target.checked }))}
                />
                <span>采纳兴趣</span>
              </label>
              <div className="chip-group compact">
                {suggestion.interests.map((item) => (
                  <span key={item} className="chip active">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="resume-suggestion-section">
              <label className="resume-toggle-line">
                <input
                  type="checkbox"
                  checked={selection.skills}
                  onChange={(event) => setSelection((current) => ({ ...current, skills: event.target.checked }))}
                />
                <span>采纳技能</span>
              </label>
              <div className="chip-group compact">
                {suggestion.skills.map((item) => (
                  <span key={item} className="chip active">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="resume-suggestion-section">
              <label className="resume-toggle-line">
                <input
                  type="checkbox"
                  checked={selection.expectedGain}
                  onChange={(event) => setSelection((current) => ({ ...current, expectedGain: event.target.checked }))}
                />
                <span>采纳期望收获</span>
              </label>
              <div className="chip-group compact">
                {suggestion.expectedGain.map((item) => (
                  <span key={item} className="chip active">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="resume-suggestion-side">
            <div className="resume-evidence-card">
              <span>提取依据</span>
              <ul className="resume-evidence-list">
                {suggestion.evidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <button type="button" className="primary-button" disabled={disabled} onClick={handleApplySuggestion}>
              写入当前编辑内容
            </button>
            <p className="resume-suggestion-tip">这一步只会更新当前页面，真正保存还要再点一次“保存修改”。</p>
          </aside>
        </div>
      ) : null}
    </section>
  )
}
