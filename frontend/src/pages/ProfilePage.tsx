import { useEffect, useId, useMemo, useState } from 'react'
import { MutationFeedback } from '../components/MutationFeedback'
import { PageHeader } from '../components/PageHeader'
import { ProfileTagSelector } from '../components/ProfileTagSelector'
import { ResumeProfileAssistant } from '../components/ResumeProfileAssistant'
import { useDemoActions, useDemoQuery } from '../context/DemoContext'
import { timeLabelMap } from '../utils/recommendation'
import type { StudentProfile, TimeLevel } from '../types'

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function profilesEqual(left: StudentProfile, right: StudentProfile) {
  return (
    left.college === right.college &&
    left.major === right.major &&
    left.grade === right.grade &&
    left.availableTime === right.availableTime &&
    arraysEqual(left.interests, right.interests) &&
    arraysEqual(left.skills, right.skills) &&
    arraysEqual(left.expectedGain, right.expectedGain)
  )
}

export function ProfilePage() {
  const { options, account, profile, feedback } = useDemoQuery()
  const { saveProfile } = useDemoActions()
  const profileSaving = feedback.profile.status === 'loading'
  const [draftProfile, setDraftProfile] = useState<StudentProfile>(profile)
  const [collegeError, setCollegeError] = useState('')
  const [majorError, setMajorError] = useState('')
  const [interestError, setInterestError] = useState('')
  const collegeOptionsId = useId()

  useEffect(() => {
    setDraftProfile(profile)
  }, [profile])

  const validateCollege = (value: string) => {
    const nextValue = value.trim()

    if (!nextValue) {
      return '学院不能为空'
    }

    if (!options.collegeOptions.includes(nextValue)) {
      return '请选择下拉列表中的学院选项'
    }

    return ''
  }

  const handleCollegeBlur = (value: string) => {
    const nextValue = value.trim()
    const error = validateCollege(nextValue)
    setCollegeError(error)
  }

  const validateMajor = (value: string) => {
    if (!value.trim()) {
      return '专业不能为空'
    }

    return ''
  }

  const isDirty = useMemo(() => !profilesEqual(draftProfile, profile), [draftProfile, profile])
  const saveStateLabel = profileSaving ? '保存中' : isDirty ? '未保存' : '已保存'
  const saveStateTone = profileSaving ? 'info' : isDirty ? 'pending' : 'success'

  const handleSaveProfile = () => {
    const nextCollege = draftProfile.college.trim()
    const nextMajor = draftProfile.major.trim()
    const error = validateCollege(nextCollege)
    const nextMajorError = validateMajor(nextMajor)
    const nextInterestError = draftProfile.interests.length < 3 ? '兴趣标签至少选择3项' : ''
    setCollegeError(error)
    setMajorError(nextMajorError)
    setInterestError(nextInterestError)

    if (error || nextMajorError || nextInterestError) {
      return
    }

    saveProfile({
      ...draftProfile,
      college: nextCollege,
      major: nextMajor,
    })
  }

  return (
    <main className="single-column">
      <section className="panel">
        <PageHeader
          eyebrow="Profile"
          title="我的画像"
          description="在这个页面集中配置推荐输入条件，调整后会影响发现页和详情页的匹配结果。"
          actions={
            <div className="profile-header-actions">
              <span className={`status-badge ${saveStateTone}`}>{saveStateLabel}</span>
              <button
                type="button"
                className="secondary-button profile-save-button"
                disabled={profileSaving || !isDirty || Boolean(collegeError) || Boolean(majorError) || Boolean(interestError)}
                onClick={handleSaveProfile}
              >
                {profileSaving ? '保存中...' : '保存画像'}
              </button>
            </div>
          }
        />

        <MutationFeedback feedback={feedback.profile} />

        <div className="profile-grid">
          <div className="field-item">
            <span>绑定邮箱</span>
            <div className="field-static">{account.email || '当前账号未读取到邮箱'}</div>
          </div>
          <div className="field-item">
            <span>学院</span>
            <input
              type="text"
              value={draftProfile.college}
              list={collegeOptionsId}
              disabled={profileSaving}
              className={collegeError ? 'field-input error' : 'field-input'}
              placeholder="请输入或搜索学院后选择"
              onChange={(event) => {
                setDraftProfile((current) => ({
                  ...current,
                  college: event.target.value,
                }))
                if (collegeError) {
                  setCollegeError('')
                }
              }}
              onBlur={() => handleCollegeBlur(draftProfile.college)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleSaveProfile()
                }
              }}
            />
            <datalist id={collegeOptionsId}>
              {options.collegeOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
            {collegeError ? <div className="field-error">{collegeError}</div> : null}
          </div>
          <div className="field-item">
            <span>专业</span>
            <input
              type="text"
              value={draftProfile.major}
              disabled={profileSaving}
              className={majorError ? 'field-input error' : 'field-input'}
              placeholder="请输入你的专业"
              onChange={(event) => {
                setDraftProfile((current) => ({
                  ...current,
                  major: event.target.value,
                }))
                if (majorError) {
                  setMajorError('')
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleSaveProfile()
                }
              }}
            />
            {majorError ? <div className="field-error">{majorError}</div> : null}
          </div>
          <div className="field-item">
            <span>年级</span>
            <select
              value={draftProfile.grade}
              disabled={profileSaving}
              className="field-input"
              onChange={(event) =>
                setDraftProfile((current) => ({
                  ...current,
                  grade: event.target.value,
                }))
              }
            >
              {options.gradeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ResumeProfileAssistant
          profile={draftProfile}
          disabled={profileSaving}
          onApplySuggestion={(nextProfile) => {
            setDraftProfile(nextProfile)
            setCollegeError('')
            setMajorError('')
            setInterestError('')
          }}
        />

        <div className="field-block">
          <label htmlFor="profileTimeLevel">可投入时间</label>
          <select
            id="profileTimeLevel"
            value={draftProfile.availableTime}
            disabled={profileSaving}
            onChange={(event) =>
              setDraftProfile((current) => ({
                ...current,
                availableTime: event.target.value as TimeLevel,
              }))
            }
          >
            <option value="low">{timeLabelMap.low}</option>
            <option value="medium">{timeLabelMap.medium}</option>
            <option value="high">{timeLabelMap.high}</option>
          </select>
        </div>

        <ProfileTagSelector
          label="兴趣标签"
          options={options.interestOptions}
          selectedValues={draftProfile.interests}
          disabled={profileSaving}
          onChangeSelectedValues={(values) =>
            {
              setDraftProfile((current) => ({
                ...current,
                interests: values,
              }))
              if (interestError) {
                setInterestError('')
              }
            }
          }
        />
        {interestError ? <div className="field-error">{interestError}</div> : null}

        <ProfileTagSelector
          label="技能标签"
          options={options.skillOptions}
          selectedValues={draftProfile.skills}
          disabled={profileSaving}
          onChangeSelectedValues={(values) =>
            setDraftProfile((current) => ({
              ...current,
              skills: values,
            }))
          }
        />

        <ProfileTagSelector
          label="期望收获"
          options={options.expectedGainOptions}
          selectedValues={draftProfile.expectedGain}
          disabled={profileSaving}
          onChangeSelectedValues={(values) =>
            setDraftProfile((current) => ({
              ...current,
              expectedGain: values,
            }))
          }
        />
      </section>
    </main>
  )
}
