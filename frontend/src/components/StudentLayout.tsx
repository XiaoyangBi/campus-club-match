import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ChatbotWidget } from './ChatbotWidget'
import { useStudentDemoNotificationsQuery } from '../hooks/useStudentDemoData'
import { useStudentDashboardStats } from '../hooks/useClubSelectors'

export function StudentLayout() {
  const { isAuthEnabled, isAuthenticated, isLoading, signOut, user } = useAuth()
  const { applicationCount, favoriteCount, openClubCount } = useStudentDashboardStats()
  const notificationsQuery = useStudentDemoNotificationsQuery()
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0

  if (isAuthEnabled && isLoading) {
    return <div className="page-shell auth-placeholder">正在加载账号...</div>
  }

  if (isAuthEnabled && !isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="page-shell">
      <header className="masthead">
        <div className="topbar">
          <div className="brand-block">
            <span className="brand-mark">Club Match</span>
            <span className="brand-subtitle">学生端</span>
          </div>

          <nav className="main-nav">
            <NavLink to="/discover" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              发现
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              画像
            </NavLink>
            <NavLink
              to="/applications"
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              报名
            </NavLink>
            <NavLink to="/messages" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              消息
              {unreadCount > 0 ? <span className="nav-count-badge">{unreadCount}</span> : null}
            </NavLink>
            {isAuthEnabled ? (
              <button type="button" className="nav-link auth-ghost-button" onClick={() => void signOut()}>
                退出
              </button>
            ) : null}
          </nav>
        </div>
        {isAuthEnabled && user?.email ? <div className="auth-user-meta">登录账号：{user.email}</div> : null}

        <div className="hero">
          <div className="hero-copy">
            <span className="eyebrow">学生端</span>
            <h1>
              为你的大学生活，
              <br />
              找到真正适合的
              <mark className="hero-highlight">社团选择</mark>
              。
            </h1>
            <p>先填画像，再看推荐，再去报名。</p>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <span>总开放社团</span>
              <strong>{openClubCount}</strong>
            </div>
            <div className="stat-card">
              <span>我的报名</span>
              <strong>{applicationCount}</strong>
            </div>
            <div className="stat-card">
              <span>我的收藏</span>
              <strong>{favoriteCount}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className="page-main">
        <Outlet />
      </div>

      <ChatbotWidget />
    </div>
  )
}
