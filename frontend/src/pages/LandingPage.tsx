import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { clubs as seedClubs, initialProfile } from '../data/mock'
import { useAuth } from '../context/AuthContext'
import { buildScoredClubs } from '../utils/recommendation'

function formatShortDate(value: string) {
  const date = new Date(value.replace(' ', 'T'))

  if (Number.isNaN(date.getTime())) {
    return value.slice(5, 10)
  }

  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function LandingPage() {
  const navigate = useNavigate()
  const { isAuthEnabled, isAuthenticated, isLoading } = useAuth()
  const [authError] = useState('')

  const clubs = seedClubs
  const recommendedClubs = useMemo(
    () => buildScoredClubs(seedClubs, initialProfile).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3),
    [],
  )

  const bulletinItems = clubs.slice(0, 4).map((club, index) => ({
    id: `${club.id}-bulletin`,
    date: formatShortDate(club.recruitDeadline),
    year: club.recruitDeadline.slice(0, 4),
    title: `关于${club.name}秋季招新安排的通知`,
    summary: `${club.name}当前开放${club.availableDirections.join('、')}方向报名，建议尽早完善画像并完成投递。`,
    link: `/clubs/${club.id}`,
    accent: index === 0,
  }))

  const activityItems = recommendedClubs.map((club) => ({
    id: `${club.id}-activity`,
    title: club.name,
    meta: `${club.category}社团 · ${club.frequency}`,
    summary: club.highlights[0] ?? club.intro,
    link: `/apply/${club.id}`,
  }))

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <div className="landing-brand">
          <span className="landing-brand-mark">社团招新智能平台</span>
          <span className="landing-brand-subtitle">Campus Club Service</span>
        </div>

        <nav className="landing-nav">
          <a href="#landing-hero">首页</a>
          <a href="#landing-news">新闻</a>
          <a href="#landing-activity">活动</a>
          <Link to="/discover">社团</Link>
          <Link to="/profile">我的画像</Link>
          <Link to="/club/dashboard">社团端</Link>
          <Link to="/admin/dashboard">管理端</Link>
        </nav>

        {isAuthEnabled ? (
          <button
            type="button"
            className="landing-login"
            disabled={isLoading}
            onClick={() => {
              if (isAuthenticated) {
                navigate('/discover')
                return
              }
              navigate('/auth')
            }}
          >
            {isAuthenticated ? '进入学生端' : '登录 / 注册'}
          </button>
        ) : (
          <Link to="/discover" className="landing-login">
            进入学生端
          </Link>
        )}
      </header>

      <main className="landing-main">
        <section id="landing-hero" className="landing-hero">
          <div className="landing-hero-stage">
            <div className="landing-stage-side left" />
            <div className="landing-stage-center">
              <div className="landing-stage-spotlight" />
              <div className="landing-stage-content">
                <span className="landing-stage-label">2026社团开放季</span>
                <h1>找到适合你的社团投入方式</h1>
                <p>
                  围绕画像匹配、方向筛选和在线报名，帮助新生更快进入真正适合自己的校园组织。
                </p>
                <div className="landing-hero-actions">
                  <button
                    type="button"
                    className="landing-primary-button"
                    onClick={() => {
                      if (!isAuthEnabled) {
                        navigate('/discover')
                        return
                      }

                      if (isAuthenticated) {
                        navigate('/discover')
                        return
                      }
                      navigate('/auth')
                    }}
                  >
                    {isAuthEnabled ? '登录后进入学生端' : '加入社团'}
                  </button>
                  <Link to={isAuthEnabled && !isAuthenticated ? '/' : '/profile'} className="landing-secondary-button">
                    先完善画像
                  </Link>
                </div>
                {authError ? <div className="landing-auth-error">{authError}</div> : null}
              </div>
            </div>
            <div className="landing-stage-side right" />
          </div>

          <div className="landing-hero-strip">
            <div>
              <strong>{clubs.length}</strong>
              <span>开放中的社团</span>
            </div>
            <div>
              <strong>{recommendedClubs.length}</strong>
              <span>AI优先推荐</span>
            </div>
            <div>
              <strong>{clubs.reduce((total, club) => total + club.availableDirections.length, 0)}</strong>
              <span>开放报名方向</span>
            </div>
          </div>
        </section>

        <section id="landing-news" className="landing-section">
          <div className="landing-section-heading">
            <div>
              <h2>新闻公告</h2>
              <p>NEWS BULLETIN</p>
            </div>
            <Link to="/discover">MORE</Link>
          </div>

          <div className="landing-news-grid">
            {bulletinItems.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                className={item.accent ? 'landing-news-card accent' : 'landing-news-card'}
              >
                <div className="landing-news-date">
                  <strong>{item.date}</strong>
                  <span>{item.year}</span>
                </div>
                <div className="landing-news-copy">
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="landing-activity" className="landing-section">
          <div className="landing-section-heading">
            <div>
              <h2>近期活动</h2>
              <p>RECENT ACTIVITY</p>
            </div>
            <Link to="/discover">MORE</Link>
          </div>

          <div className="landing-activity-grid">
            {activityItems.map((item, index) => (
              <Link key={item.id} to={item.link} className={index === 0 ? 'landing-activity-card featured' : 'landing-activity-card'}>
                <span className="landing-activity-index">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{item.title}</h3>
                  <strong>{item.meta}</strong>
                  <p>{item.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
