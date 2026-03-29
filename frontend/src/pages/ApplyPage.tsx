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
        <EmptyState panel title="正在加载社团" description="请稍候。" />
      </main>
    )
  }

  if (!club) {
    return (
      <main className="single-column">
        <EmptyState
          panel
          title="未找到对应社团"
          description="请返回发现页重新选择。"
        />
      </main>
    )
  }

  const handleSubmit = async () => {
    if (!resumeFile) {
      setResumeError('请先上传简历')
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
      setResumeError(error instanceof Error ? error.message : '上传失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="single-column">
      <SectionPanel
        eyebrow="报名"
        title="提交报名"
        description={`确认方向并补充介绍后，提交到${club.name}。`}
      >
        <ClubInfoPanel club={club} />

        <ApplicationForm
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
