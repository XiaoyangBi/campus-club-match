import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function AuthPage() {
  const navigate = useNavigate()
  const { isAuthEnabled, isAuthenticated, isLoading, signInWithPassword, signUpWithPassword } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const emailError = useMemo(() => {
    if (!email) {
      return ''
    }

    return isValidEmail(email) ? '' : '请输入正确的邮箱'
  }, [email])

  const passwordError = useMemo(() => {
    if (!password) {
      return ''
    }

    return password.length >= 6 ? '' : '密码至少6位'
  }, [password])

  const confirmPasswordError =
    mode === 'signup' && confirmPassword && confirmPassword !== password ? '两次密码不一致' : ''

  if (!isAuthEnabled) {
    return <Navigate to="/discover" replace />
  }

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/discover" replace />
  }

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setErrorMessage('请输入正确的邮箱')
      return
    }

    if (password.length < 6) {
      setErrorMessage('密码至少6位')
      return
    }

    if (mode === 'signup' && confirmPassword !== password) {
      setErrorMessage('两次密码不一致')
      return
    }

    try {
      setSubmitting(true)
      setErrorMessage('')
      setSuccessMessage('')

      if (mode === 'signin') {
        await signInWithPassword(email, password)
        navigate('/discover')
        return
      }

      const result = await signUpWithPassword(email, password)
      if (result.requiresEmailConfirmation) {
        setSuccessMessage('注册成功，请先完成邮箱验证。')
        setMode('signin')
      } else {
        setSuccessMessage('注册成功，已自动登录。')
        navigate('/discover')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '操作失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-card-copy">
          <span className="landing-stage-label">Student Auth</span>
          <h1>{mode === 'signin' ? '登录' : '注册账号'}</h1>
          <p>登录后，画像、报名和消息都会跟随账号保存。</p>
          <div className="field-note">
            学生端任意邮箱可注册。社团端和管理端仅限已授权邮箱进入。
          </div>
        </div>

        <div className="auth-form">
          <div className="auth-mode-switch">
            <button
              type="button"
              className={mode === 'signin' ? 'sort-pill active' : 'sort-pill'}
              onClick={() => {
                setMode('signin')
                setErrorMessage('')
                setSuccessMessage('')
              }}
            >
              登录
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'sort-pill active' : 'sort-pill'}
              onClick={() => {
                setMode('signup')
                setErrorMessage('')
                setSuccessMessage('')
              }}
            >
              注册
            </button>
          </div>

          <div className="field-block">
            <label htmlFor="authEmail">邮箱</label>
            <input
              id="authEmail"
              type="email"
              className={emailError ? 'field-input error' : 'field-input'}
              placeholder="输入邮箱"
              value={email}
              disabled={submitting}
              onChange={(event) => setEmail(event.target.value)}
            />
            {emailError ? <div className="field-error">{emailError}</div> : null}
          </div>

          <div className="field-block">
            <label htmlFor="authPassword">密码</label>
            <input
              id="authPassword"
              type="password"
              className={passwordError ? 'field-input error' : 'field-input'}
              placeholder="输入密码"
              value={password}
              disabled={submitting}
              onChange={(event) => setPassword(event.target.value)}
            />
            {passwordError ? <div className="field-error">{passwordError}</div> : null}
          </div>

          {mode === 'signup' ? (
            <div className="field-block">
              <label htmlFor="authConfirmPassword">确认密码</label>
              <input
                id="authConfirmPassword"
                type="password"
                className={confirmPasswordError ? 'field-input error' : 'field-input'}
                placeholder="再输一次密码"
                value={confirmPassword}
                disabled={submitting}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              {confirmPasswordError ? <div className="field-error">{confirmPasswordError}</div> : null}
            </div>
          ) : null}

          {errorMessage ? <div className="mutation-feedback error">{errorMessage}</div> : null}
          {successMessage ? <div className="mutation-feedback success">{successMessage}</div> : null}

          <div className="stack-actions">
            <button type="button" className="primary-button" disabled={submitting} onClick={() => void handleSubmit()}>
              {submitting ? '处理中...' : mode === 'signin' ? '登录' : '注册'}
            </button>
            <Link to="/" className="secondary-link">
              回到首页
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
