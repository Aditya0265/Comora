import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import HostLayout from './components/layout/HostLayout'
import SupportChat from './components/ui/SupportChat'

// Pages
import Landing       from './pages/Landing'
import Login         from './pages/auth/Login'
import Register      from './pages/auth/Register'
import MatchMe       from './pages/auth/MatchMe'
import Browse        from './pages/guest/Browse'
import Discover      from './pages/guest/Discover'
import EventDetail   from './pages/guest/EventDetail'
import GatheringDetail from './pages/guest/GatheringDetail'
import MyBookings    from './pages/guest/MyBookings'
import Profile       from './pages/guest/Profile'
import Settings      from './pages/guest/Settings'
import HostDashboard from './pages/host/HostDashboard'
import HostDashboardNew from './pages/host/HostDashboardNew'
import HostStudio    from './pages/host/HostStudio'
import HostProfile   from './pages/host/HostProfile'
import Communities  from './pages/guest/Communities'
import AdminPanel    from './pages/admin/AdminPanel'
import NotFound      from './pages/NotFound'
import Privacy       from './pages/static/Privacy'
import Terms         from './pages/static/Terms'
import CodeOfConduct from './pages/static/CodeOfConduct'
import Contact       from './pages/static/Contact'
import About         from './pages/static/About'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 2, retry: 1 } },
})

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-pulse" style={{ background: 'var(--comora-navy)' }}>
          <span className="text-white font-bold">C</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireHost({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  if (profile && profile.role !== 'host') return <Navigate to="/profile?become-host=1" replace />
  return children
}

function RequireAdmin({ children }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (profile && profile.role !== 'admin') return <Navigate to="/browse" replace />
  return children
}

function RequireNotAdmin({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return <PageLoader />
  if (profile?.role === 'admin') return <Navigate to="/admin" replace />
  return children
}

function RequireMatchMe({ children }) {
  const { user, needsMatchMe, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user && needsMatchMe) return <Navigate to="/onboarding" replace />
  return children
}

function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }} className="page-enter">
        <Outlet />
      </main>
      <Footer />
      <SupportChat />
    </div>
  )
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
        }}
      />
      <Routes>

        {/* ── Admin: fully standalone layout, no Navbar/Footer ── */}
        <Route path="/admin/*" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />

        {/* ── Host: dedicated sidebar layout ── */}
        <Route element={<RequireHost><HostLayout /></RequireHost>}>
          <Route path="/host/dashboard"  element={<HostDashboardNew />} />
          <Route path="/host/studio/new" element={<HostStudio />} />
          <Route path="/host/studio/:id" element={<HostStudio />} />
        </Route>

        {/* ── Guest / public: main layout with Navbar + Footer ── */}
        <Route element={<MainLayout />}>
          <Route path="/"                     element={<RequireNotAdmin><Landing /></RequireNotAdmin>} />
          <Route path="/login"                element={<Login />} />
          <Route path="/register"             element={<Register />} />
          <Route path="/auth/role-select"     element={<Navigate to="/register" replace />} />
          <Route path="/auth/host/signup"     element={<Navigate to="/register" replace />} />
          <Route path="/auth/attendee/signup" element={<Navigate to="/register" replace />} />
          <Route path="/browse"               element={<RequireNotAdmin><RequireMatchMe><Browse /></RequireMatchMe></RequireNotAdmin>} />
          <Route path="/discover"             element={<RequireNotAdmin><RequireMatchMe><Discover /></RequireMatchMe></RequireNotAdmin>} />
          <Route path="/communities"   element={<RequireNotAdmin><Communities /></RequireNotAdmin>} />
          <Route path="/events/:id"    element={<RequireNotAdmin><EventDetail /></RequireNotAdmin>} />
          <Route path="/gathering/:id" element={<RequireNotAdmin><GatheringDetail /></RequireNotAdmin>} />
          <Route path="/host/:id"      element={<RequireNotAdmin><HostProfile /></RequireNotAdmin>} />

          <Route path="/onboarding"  element={<RequireNotAdmin><RequireAuth><MatchMe /></RequireAuth></RequireNotAdmin>} />

          <Route path="/my-bookings" element={<RequireNotAdmin><RequireAuth><MyBookings /></RequireAuth></RequireNotAdmin>} />
          <Route path="/profile"     element={<RequireNotAdmin><RequireAuth><Profile /></RequireAuth></RequireNotAdmin>} />
          <Route path="/settings"    element={<RequireNotAdmin><RequireAuth><Settings /></RequireAuth></RequireNotAdmin>} />

          <Route path="/privacy"         element={<Privacy />} />
          <Route path="/terms"           element={<Terms />} />
          <Route path="/code-of-conduct" element={<CodeOfConduct />} />
          <Route path="/contact"         element={<Contact />} />
          <Route path="/about"           element={<About />} />

          <Route path="*"            element={<NotFound />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
