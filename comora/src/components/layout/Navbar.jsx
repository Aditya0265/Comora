import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Menu, X, Bell, ChevronDown,
  User, Calendar, LogOut, Settings, Shield, PlusCircle,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { cn } from '../../lib/utils'

const navLinks = [
  { to: '/discover', label: 'Discover' },
  { to: '/communities', label: 'Communities' },
]

export default function Navbar() {
  const { user, profile, logout, isHost, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [mobileOpen, setMobileOpen]   = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await logout()
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--comora-navy)] flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-[var(--comora-charcoal)] text-lg tracking-tight">
            Comora
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--comora-orange)] text-white'
                  : 'text-[var(--comora-grey)] hover:text-[var(--comora-charcoal)] hover:bg-[var(--comora-cream)]',
              )}
            >
              {label}
            </NavLink>
          ))}
          {isHost && (
            <NavLink
              to="/host/dashboard"
              className={({ isActive }) => cn(
                'px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--comora-orange)] text-white'
                  : 'text-[var(--comora-grey)] hover:text-[var(--comora-charcoal)] hover:bg-[var(--comora-cream)]',
              )}
            >
              Host
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => cn(
                'px-3 py-1.5 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-amber-600 hover:bg-amber-50',
              )}
            >
              Admin
            </NavLink>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">

          {user ? (
            <>
              {/* Host create event shortcut */}
              {isHost && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/host/studio/new')}
                  className="hidden md:inline-flex"
                >
                  <PlusCircle size={15} />
                  Create Event
                </Button>
              )}

              {/* Notifications */}
              <button className="relative p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors">
                <Bell size={18} />
              </button>

              {/* User dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex items-center gap-2 p-1 rounded-[var(--radius-lg)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <Avatar
                    src={profile?.avatar_url}
                    name={profile?.name}
                    size="sm"
                    verified={profile?.host_verified}
                  />
                  <ChevronDown size={14} className={cn('text-[var(--text-muted)] transition-transform hidden md:block', dropdownOpen && 'rotate-180')} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-1 page-enter">
                    <div className="px-3 py-2 border-b border-[var(--border)]">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{profile?.name}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate capitalize">{profile?.role}</p>
                    </div>

                    {[
                      { to: '/profile',         label: 'My Profile',  Icon: User     },
                      { to: '/my-bookings',     label: 'My Bookings', Icon: Calendar },
                      { to: '/settings',        label: 'Settings',    Icon: Settings },
                      ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', Icon: Shield }] : []),
                    ].map(({ to, label, Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Icon size={15} />
                        {label}
                      </Link>
                    ))}

                    <div className="border-t border-[var(--border)] mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={15} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')} style={{ color: 'var(--comora-navy)' }}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => navigate('/register')} style={{ background: 'var(--comora-orange)', color: 'white' }}>
                Get Started
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 flex flex-col gap-2 page-enter">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                'px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium',
                isActive ? 'bg-[var(--accent-soft)] text-[var(--comora-navy)]' : 'text-[var(--text-secondary)]',
              )}
            >
              {label}
            </NavLink>
          ))}
          {isHost && (
            <NavLink to="/host/dashboard" onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--text-secondary)]">
              Host Dashboard
            </NavLink>
          )}
          {!user ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
              <Button variant="secondary" fullWidth onClick={() => { navigate('/login'); setMobileOpen(false) }} style={{ borderColor: 'var(--comora-navy)', color: 'var(--comora-navy)' }}>
                Sign In
              </Button>
              <Button fullWidth onClick={() => { navigate('/register'); setMobileOpen(false) }} style={{ background: 'var(--comora-orange)', color: 'white' }}>
                Get Started
              </Button>
            </div>
          ) : (
            <button
              onClick={() => { handleLogout(); setMobileOpen(false) }}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 mt-1"
            >
              <LogOut size={15} /> Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  )
}
