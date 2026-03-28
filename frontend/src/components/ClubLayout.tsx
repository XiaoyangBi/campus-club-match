import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { EmptyState } from './EmptyState'
import { useAuth } from '../context/AuthContext'
import { useWorkspaceAccessQuery } from '../hooks/useOpsData'

export function ClubLayout() {
  const { isAuthEnabled, isAuthenticated, isLoading, user } = useAuth()
  const accessQuery = useWorkspaceAccessQuery()

  if (isAuthEnabled && isLoading) {
    return <div className="page-shell auth-placeholder">正在初始化社团端身份...</div>
  }

  if (isAuthEnabled && !isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (isAuthEnabled && accessQuery.isPending) {
    return <div className="page-shell auth-placeholder">正在校验社团端角色权限...</div>
  }

  if (isAuthEnabled && accessQuery.data && !accessQuery.data.isClubAdmin) {
    return (
      <main className="single-column">
        <EmptyState
          panel
          title="当前账号无社团端权限"
          description={`当前登录邮箱${accessQuery.data.email}还未被加入社团负责人名单。请在数据库表club_admin_memberships中分配邮箱与社团关系后再登录。`}
        />
      </main>
    )
  }

  if (isAuthEnabled && accessQuery.isError) {
    return (
      <main className="single-column">
        <EmptyState
          panel
          title="当前账号无社团端权限"
          description={`当前登录邮箱${user?.email ?? ''}无法进入社团端。请在数据库表club_admin_memberships中为该邮箱分配社团权限。`}
        />
      </main>
    )
  }

  return (
    <div className="page-shell role-shell">
      <header className="masthead role-masthead">
        <div className="topbar">
          <div className="brand-block">
            <span className="brand-mark">Club Match</span>
            <span className="brand-subtitle">社团端</span>
          </div>
          <nav className="main-nav">
            <NavLink to="/club/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              招新概览
            </NavLink>
            <NavLink to="/club/applications" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              报名处理
            </NavLink>
            <NavLink to="/club/profile" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              社团资料
            </NavLink>
          </nav>
        </div>
        <div className="hero compact">
          <div className="hero-copy">
            <span className="eyebrow">Club Workspace</span>
            <h1>轻量处理报名、维护资料、推进招新。</h1>
            <p>这里保留社团端MVP最关键的三件事：看概览、处理申请、维护资料。</p>
          </div>
        </div>
      </header>
      <div className="page-main">
        <Outlet />
      </div>
    </div>
  )
}
