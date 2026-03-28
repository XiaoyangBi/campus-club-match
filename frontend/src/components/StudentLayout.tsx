import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useStudentDemoNotificationsQuery } from '../hooks/useStudentDemoData'
import { useStudentDashboardStats } from '../hooks/useClubSelectors'

export function StudentLayout() {
  const { isAuthEnabled, isAuthenticated, isLoading, signOut, user } = useAuth()
  const { applicationCount, favoriteCount, visibleClubCount } = useStudentDashboardStats()
  const notificationsQuery = useStudentDemoNotificationsQuery()
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0

  if (isAuthEnabled && isLoading) {
    return <div className="page-shell auth-placeholder">正在初始化学生身份...</div>
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
        {isAuthEnabled && user?.email ? <div className="auth-user-meta">当前账号：{user.email}</div> : null}

        <div className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Student Edition</span>
            <h1>
              为你的大学生活，
              <br />
              找到真正适合的
              <mark className="hero-highlight">社团投入方式</mark>
              。
            </h1>
            <p>
              这是一个围绕新生视角搭建的社团发现体验。你可以先完善画像，再用更轻松的方式比较社团、查看方向并完成报名。
            </p>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <span>当前可浏览社团</span>
              <strong>{visibleClubCount}</strong>
            </div>
            <div className="stat-card">
              <span>我的报名记录</span>
              <strong>{applicationCount}</strong>
            </div>
            <div className="stat-card">
              <span>已收藏社团</span>
              <strong>{favoriteCount}</strong>
            </div>
          </div>
        </div>
      </header>

      <div className="page-main">
        <Outlet />
      </div>
    </div>
  )
}
