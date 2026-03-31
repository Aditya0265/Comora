import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Menu, X, Bell, ChevronDown,
  User, Calendar, LogOut, Settings, Shield, PlusCircle,
  CheckCheck, MessageCircle,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import { cn } from '../../lib/utils'

const navLinks = [
  { to: '/discover',    label: 'Discover'     },
  { to: '/communities', label: 'Communities'  },
  { to: '/my-messages', label: 'Messages', authOnly: true, guestOnly: true },
]

function NotificationBell({ user }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [ticketReplies, setTicketReplies] = useState([])
  const [loading, setLoading] = useState(false)
  const [marked, setMarked] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 64, right: 16 })
  const btnRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Load data once on mount
  useEffect(() => {
    if (!user) return
    async function load() {
      setLoading(true)
      try {
        const [{ data: notifs }, { data: tickets }] = await Promise.all([
          supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20),
          supabase
            .from('support_tickets')
            .select('id, subject, admin_reply, replied_at')
            .eq('user_id', user.id)
            .not('admin_reply', 'is', null)
            .order('replied_at', { ascending: false })
            .limit(5),
        ])
        setNotifications(notifs ?? [])
        setTicketReplies(tickets ?? [])
      } catch (_) {
        // silently ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  function handleOpen() {
    // Calculate fixed position based on button's screen rect
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    const wasOpen = open
    setOpen(o => !o)
    if (!wasOpen && !marked && user) {
      setMarked(true)
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(() => setNotifications(prev => prev.map(n => ({ ...n, is_read: true }))))
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  function getLink(type) {
    if (type === 'message_reply')     return '/my-messages'
    if (type === 'new_guest_message') return '/host/messages'
    if (type === 'support')           return '/contact'
    if (type === 'booking_confirmed') return '/my-bookings'
    if (type === 'event_reminder')    return '/my-bookings'
    if (type === 'event_cancelled')   return '/my-bookings'
    return null
  }

  const allItems = [
    ...ticketReplies.map(t => ({
      id:      'ticket-' + t.id,
      icon:    'support',
      title:   'Support reply received',
      message: t.subject,
      time:    t.replied_at,
      link:    '/contact',
    })),
    ...notifications.map(n => ({
      id:      n.id,
      icon:    n.type,
      title:   n.title,
      message: n.message,
      time:    n.created_at,
      link:    getLink(n.type),
      unread:  !n.is_read,
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15)

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="relative p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '16px', height: '16px', borderRadius: '50%',
            background: '#ef4444', color: 'white',
            fontSize: '10px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Render at fixed position to escape navbar stacking context */}
      {open && (
        <div style={{
          position: 'fixed',
          top: dropPos.top,
          right: dropPos.right,
          width: '320px',
          maxHeight: '400px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 9100,
        }}>
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Notifications</span>
            {marked && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCheck size={12} /> Marked as read
              </span>
            )}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading…</p>
            ) : allItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No notifications yet</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  You'll see replies and updates here.
                </p>
              </div>
            ) : (
              allItems.map(item => {
                const isMsg = item.icon === 'message_reply' || item.icon === 'new_guest_message'
                const isSupport = item.icon === 'support'
                const iconBg = isMsg ? '#FFF7ED' : isSupport ? '#EFF6FF' : 'var(--accent-soft)'
                const iconColor = isMsg ? 'var(--comora-orange)' : 'var(--comora-navy)'
                return (
                  <div
                    key={item.id}
                    onClick={() => { if (item.link) { setOpen(false); navigate(item.link) } }}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                      cursor: item.link ? 'pointer' : 'default',
                      background: item.unread ? 'var(--accent-soft)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (item.link) e.currentTarget.style.background = 'var(--bg-subtle)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = item.unread ? 'var(--accent-soft)' : 'transparent' }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: iconBg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <MessageCircle size={15} style={{ color: iconColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: item.unread ? 700 : 600, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>
                        {item.title}
                      </p>
                      {item.message && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.message}
                        </p>
                      )}
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {item.time ? new Date(item.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    {item.link && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--comora-navy)', fontWeight: 600, alignSelf: 'center', flexShrink: 0 }}>→</span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </>
  )
}

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
        <Link to="/" className="flex items-center shrink-0 group">
          <span className="font-bold text-[var(--comora-charcoal)] text-lg tracking-tight">
            Comora
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {!isAdmin && navLinks.filter(l => (!l.authOnly || user) && (!l.guestOnly || !isHost)).map(({ to, label }) => (
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
              {!isAdmin && <NotificationBell user={user} />}

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
                      ...(!isAdmin ? [
                        { to: '/profile',     label: 'My Profile',  Icon: User           },
                        { to: '/my-bookings', label: 'My Bookings', Icon: Calendar       },
                        { to: '/my-messages', label: 'My Messages', Icon: MessageCircle  },
                        { to: '/settings',    label: 'Settings',    Icon: Settings       },
                      ] : []),
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
          {!isAdmin && navLinks.filter(l => (!l.authOnly || user) && (!l.guestOnly || !isHost)).map(({ to, label }) => (
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
            <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-1">
              {!isAdmin && [
                { to: '/profile',     label: 'My Profile',  Icon: User          },
                { to: '/my-bookings', label: 'My Bookings', Icon: Calendar      },
                { to: '/my-messages', label: 'My Messages', Icon: MessageCircle },
                { to: '/settings',    label: 'Settings',    Icon: Settings      },
              ].map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium',
                    isActive ? 'bg-[var(--accent-soft)] text-[var(--comora-navy)]' : 'text-[var(--text-secondary)]',
                  )}
                >
                  <Icon size={15} />
                  {label}
                </NavLink>
              ))}
              <button
                onClick={() => { handleLogout(); setMobileOpen(false) }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 mt-1"
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
