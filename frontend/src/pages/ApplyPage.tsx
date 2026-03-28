import { useEffect, useState } from 'react'
import { ClubInfoPanel } from '../components/ClubInfoPanel'
import { EmptyState } from '../components/EmptyState'
import { SectionPanel } from '../components/SectionPanel'
import { useNavigate, useParams } from 'react-router-dom'
import { ApplicationForm } from '../components/ApplicationForm'
import { useDemoActions, useDemoQuery } from '../context/DemoContext'
import { useClubById, useHasApplied } from '../hooks/useClubSelectors'
import { studentDemoService } from '../services/studentDemoService'

export function ApplyPage() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const { feedback, isBootstrapping } = useDemoQuery()
  const { submitApplication } = useDemoActions()

  const club = useClubById(clubId)
  const applied = useHasApplied(clubId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDirection, setSelectedDirection] = useState('')
  const [selfIntro, setSelfIntro] = useState(
    '我对这个社团的方向比较感兴趣，也愿意持续投入时间参与活动，希望在大学积累项目经验和团队合作经历。',
  )
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeError, setResumeError] = useState('')

  useEffect(() => {
    if (club) {
      setSelectedDirection(club.availableDirections[0] ?? '')
    }
  }, [club])

  if (isBootstrapping) {
    return (
      <main className="single-column">
        <EmptyState panel title="社团加载中" description="正在加载报名信息，请稍候。" />
      </main>
    )
  }

  if (!club) {
    return (
      <main className="single-column">
        <EmptyState
          panel
          title="未找到对应社团"
          description="请从发现页重新进入报名流程，确保当前社团仍然处于可浏览状态。"
        />
      </main>
    )
  }

  const handleSubmit = async () => {
    if (!resumeFile) {
      setResumeError('请上传简历后再提交报名')
      return
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      setResumeError('简历文件需控制在5MB以内')
      return
    }

    setIsSubmitting(true)
    setResumeError('')

    try {
      const attachmentPath = await studentDemoService.uploadResume(resumeFile)
      const success = await submitApplication(club.id, selectedDirection, selfIntro, attachmentPath)

      if (success) {
        navigate('/applications')
      }
    } catch (error) {
      setResumeError(error instanceof Error ? error.message : '简历上传失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="single-column">
      <SectionPanel
        eyebrow="Apply"
        title="在线报名"
        description={`填写报名方向与自我介绍，完成对${club.name}的投递。`}
      >
        <ClubInfoPanel club={club} />

        <ApplicationForm
          clubName={club.name}
          clubId={club.id}
          directions={club.availableDirections}
          selectedDirection={selectedDirection}
          selfIntro={selfIntro}
          resumeName={resumeFile?.name ?? ''}
          resumeError={resumeError}
          applied={applied}
          submitting={isSubmitting}
          feedback={feedback.application}
          onDirectionChange={setSelectedDirection}
          onSelfIntroChange={setSelfIntro}
          onResumeChange={(file) => {
            setResumeFile(file)
            if (resumeError) {
              setResumeError('')
            }
          }}
          onSubmit={handleSubmit}
        />
      </SectionPanel>
    </main>
  )
}
