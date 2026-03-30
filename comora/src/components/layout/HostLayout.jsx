import { useState } from 'react'
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, LogOut, ArrowLeft,
  Menu, X, Settings, User,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from '../ui/Avatar'

const HOST_NAV = [
  { to: '/host/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/host/studio/new', label: 'Create Event',   icon: PlusCircle      },
]

export default function HostLayout() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  const Sidebar = ({ onClose }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      width: '240px',
      flexShrink: 0,
    }}>
      {/* Logo + Host badge */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{
              width: '1.875rem', height: '1.875rem',
              borderRadius: '0.5rem',
              background: '#1E3A5F',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>C</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>Comora</span>
          </Link>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
              <X size={18} />
            </button>
          )}
        </div>
        <div style={{
          marginTop: '0.625rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.625rem',
          borderRadius: '9999px',
          background: '#1E3A5F',
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'white',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Host Mode
        </div>
      </div>

      {/* Host profile summary */}
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Avatar src={profile?.avatar_url} name={profile?.name} size="sm" verified={profile?.host_verified} />
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.name}
          </p>
          <p style={{ fontSize: '0.75rem', color: profile?.host_verified ? '#22c55e' : 'var(--comora-orange)' }}>
            {profile?.host_verified ? 'Verified host' : 'Pending verification'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.75rem', marginBottom: '0.375rem' }}>
          Host Studio
        </p>
        {HOST_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/host/dashboard'}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--comora-navy)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-soft)' : 'transparent',
              marginBottom: '0.125rem',
              transition: 'all 0.15s',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        <Link
          to="/profile"
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontSize: '0.875rem', color: 'var(--text-secondary)',
          }}
        >
          <User size={16} />
          My Profile
        </Link>

        <Link
          to="/settings"
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontSize: '0.875rem', color: 'var(--text-secondary)',
          }}
        >
          <Settings size={16} />
          Settings
        </Link>

        <Link
          to="/browse"
          onClick={onClose}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontSize: '0.875rem', color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={16} />
          Back to Browse
        </Link>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.875rem', color: '#ef4444',
            width: '100%', textAlign: 'left',
            marginTop: '0.25rem',
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-base)' }}>

      {/* Desktop sidebar */}
      <div className="hidden md:flex" style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ height: '100%', width: '240px' }}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile top bar */}
        <div
          className="md:hidden"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky', top: 0, zIndex: 30,
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '0.25rem' }}
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '0.375rem', background: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '0.65rem' }}>C</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Host Studio</span>
          </div>
        </div>

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
