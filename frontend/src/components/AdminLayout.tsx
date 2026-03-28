import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { EmptyState } from './EmptyState'
import { useAuth } from '../context/AuthContext'
import { useWorkspaceAccessQuery } from '../hooks/useOpsData'

export function AdminLayout() {
  const { isAuthEnabled, isAuthenticated, isLoading, user } = useAuth()
  const accessQuery = useWorkspaceAccessQuery()

  if (isAuthEnabled && isLoading) {
    return <div className="page-shell auth-placeholder">正在初始化管理端身份...</div>
  }

  if (isAuthEnabled && !isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (isAuthEnabled && accessQuery.isPending) {
    return <div className="page-shell auth-placeholder">正在校验管理端角色权限...</div>
  }

  if (isAuthEnabled && accessQuery.data && !accessQuery.data.isPlatformAdmin) {
    return (
      <main className="single-column">
        <EmptyState
          panel
          title="当前账号无管理端权限"
          description={`当前登录邮箱${accessQuery.data.email}还未被加入平台管理员名单。请在数据库表platform_admin_users中授权后再登录。`}
        />
      </main>
    )
  }

  if (isAuthEnabled && accessQuery.isError) {
    return (
      <main className="single-column">
        <EmptyState
          panel
          title="当前账号无管理端权限"
          description={`当前登录邮箱${user?.email ?? ''}无法进入管理端。请在数据库表platform_admin_users中为该邮箱分配管理员权限。`}
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
            <span className="eyebrow">Admin Workspace</span>
            <h1>用最小治理能力保证平台招新流程可控。</h1>
            <p>当前版本聚焦审核社团、配置周期和查看基础看板，满足首期平台治理需求。</p>
          </div>
        </div>
      </header>
      <div className="page-main">
        <Outlet />
      </div>
    </div>
  )
}
