import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { EmptyState } from './EmptyState'
import { useAuth } from '../context/AuthContext'
import { useWorkspaceAccessQuery } from '../hooks/useOpsData'

export function AdminLayout() {
  const { isAuthEnabled, isAuthenticated, isLoading, user } = useAuth()
  const accessQuery = useWorkspaceAccessQuery()

  if (isAuthEnabled && isLoading) {
    return <div className="page-shell auth-placeholder">正在加载管理端...</div>
  }

  if (isAuthEnabled && !isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (isAuthEnabled && accessQuery.isPending) {
    return <div className="page-shell auth-placeholder">正在校验权限...</div>
  }

  if (isAuthEnabled && accessQuery.data && !accessQuery.data.isPlatformAdmin) {
    return (
      <main className="single-column">
        <EmptyState
          panel
          title="当前账号暂无管理端权限"
          description={`邮箱${accessQuery.data.email}尚未加入管理员名单。`}
        />
      </main>
    )
  }

  if (isAuthEnabled && accessQuery.isError) {
    return (
      <main className="single-column">
        <EmptyState
          panel
          title="当前账号暂无管理端权限"
          description={`邮箱${user?.email ?? ''}暂时无法进入管理端。`}
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
            <span className="brand-subtitle">管理端</span>
          </div>
          <nav className="main-nav">
            <NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              数据看板
            </NavLink>
            <NavLink to="/admin/clubs" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              社团审核
            </NavLink>
            <NavLink to="/admin/cycles" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              招新周期
            </NavLink>
          </nav>
        </div>
        <div className="hero compact">
          <div className="hero-copy">
            <span className="eyebrow">管理端</span>
            <h1>审核社团，管理招新节奏。</h1>
            <p>这里聚焦审核、周期配置和基础看板。</p>
          </div>
        </div>
      </header>
      <div className="page-main">
        <Outlet />
      </div>
    </div>
  )
}
