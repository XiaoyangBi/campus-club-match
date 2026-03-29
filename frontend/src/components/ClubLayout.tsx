import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { EmptyState } from './EmptyState'
import { useAuth } from '../context/AuthContext'
import { useWorkspaceAccessQuery } from '../hooks/useOpsData'

export function ClubLayout() {
  const { isAuthEnabled, isAuthenticated, isLoading, user } = useAuth()
  const accessQuery = useWorkspaceAccessQuery()

  if (isAuthEnabled && isLoading) {
    return <div className="page-shell auth-placeholder">正在加载社团端...</div>
  }

  if (isAuthEnabled && !isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (isAuthEnabled && accessQuery.isPending) {
    return <div className="page-shell auth-placeholder">正在校验权限...</div>
  }

  if (isAuthEnabled && accessQuery.data && !accessQuery.data.isClubAdmin) {
    return (
      <main className="single-column">
        <EmptyState
          panel
          title="当前账号暂无社团端权限"
          description={`邮箱${accessQuery.data.email}尚未加入社团管理员名单。`}
        />
      </main>
    )
  }

  if (isAuthEnabled && accessQuery.isError) {
    return (
      <main className="single-column">
        <EmptyState
          panel
          title="当前账号暂无社团端权限"
          description={`邮箱${user?.email ?? ''}暂时无法进入社团端。`}
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
            <span className="eyebrow">社团端</span>
            <h1>处理报名，维护社团信息。</h1>
            <p>这里聚焦三件事：看进度、处理申请、更新资料。</p>
          </div>
        </div>
      </header>
      <div className="page-main">
        <Outlet />
      </div>
    </div>
  )
}
