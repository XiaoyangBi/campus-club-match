import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AdminLayout } from './components/AdminLayout'
import { ClubLayout } from './components/ClubLayout'
import { StudentLayout } from './components/StudentLayout'
import { AdminClubReviewPage } from './pages/AdminClubReviewPage'
import { AdminCyclesPage } from './pages/AdminCyclesPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { ApplyPage } from './pages/ApplyPage'
import { AuthPage } from './pages/AuthPage'
import { ClubDetailPage } from './pages/ClubDetailPage'
import { ClubApplicationsPage } from './pages/ClubApplicationsPage'
import { ClubDashboardPage } from './pages/ClubDashboardPage'
import { ClubProfilePage } from './pages/ClubProfilePage'
import { DiscoverPage } from './pages/DiscoverPage'
import { LandingPage } from './pages/LandingPage'
import { MessagesPage } from './pages/MessagesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route element={<StudentLayout />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
        <Route path="/apply/:clubId" element={<ApplyPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
      </Route>
      <Route element={<ClubLayout />}>
        <Route path="/club" element={<Navigate to="/club/dashboard" replace />} />
        <Route path="/club/dashboard" element={<ClubDashboardPage />} />
        <Route path="/club/applications" element={<ClubApplicationsPage />} />
        <Route path="/club/profile" element={<ClubProfilePage />} />
      </Route>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/clubs" element={<AdminClubReviewPage />} />
        <Route path="/admin/cycles" element={<AdminCyclesPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
