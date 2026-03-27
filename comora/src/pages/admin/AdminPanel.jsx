import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarDays, ShieldCheck, Swords,
  Wallet, BarChart2, ScrollText, Menu, X, ChevronRight,
  CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp,
  Search, Filter, Eye, UserCog, Ban, ShieldOff, Star,
  ArrowLeft, LogOut, Sun, Moon,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import Input, { Textarea, Select } from '../../components/ui/Input'
import { formatDateTime, formatDate, formatCurrency, getInitials } from '../../lib/utils'

/* ─── Audit log helper ───────────────────────────────────────────────────── */
async function insertAuditLog(adminId, actionType, targetType, targetId, details = {}) {
  await supabase.from('audit_logs').insert({
    admin_id: adminId,
    action_type: actionType,
    target_type: targetType,
    target_id: String(targetId),
    details,
    created_at: new Date().toISOString(),
  })
}

/* ─── Nav items ──────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'dashboard',         label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'users',             label: 'Users',              icon: Users           },
  { id: 'events',            label: 'Events',             icon: CalendarDays    },
  { id: 'host-verification', label: 'Host Verification',  icon: ShieldCheck     },
  { id: 'disputes',          label: 'Disputes',           icon: Swords          },
  { id: 'escrow',            label: 'Escrow',             icon: Wallet          },
  { id: 'analytics',         label: 'Analytics',          icon: BarChart2       },
  { id: 'audit-log',         label: 'Audit Log',          icon: ScrollText      },
]

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, accent = false, loading = false }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
        {Icon && (
          <span style={{
            width: '2rem', height: '2rem',
            borderRadius: 'var(--radius-md)',
            background: accent ? 'var(--accent-soft)' : 'var(--bg-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent ? 'var(--navy-800)' : 'var(--text-muted)',
          }}>
            <Icon size={15} />
          </span>
        )}
      </div>
      {loading
        ? <div className="skeleton h-8 w-20 rounded" />
        : <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</span>
      }
    </div>
  )
}

/* ─── Section header ─────────────────────────────────────────────────────── */
function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{subtitle}</p>}
    </div>
  )
}

/* ─── Table wrapper ──────────────────────────────────────────────────────── */
function Table({ children }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        {children}
      </table>
    </div>
  )
}

function Th({ children, align = 'left' }) {
  return (
    <th style={{
      padding: '0.75rem 1rem',
      textAlign: align,
      fontSize: '0.75rem',
      fontWeight: 600,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-subtle)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  )
}

function Td({ children, align = 'left' }) {
  return (
    <td style={{
      padding: '0.75rem 1rem',
      textAlign: align,
      color: 'var(--text-primary)',
      borderBottom: '1px solid var(--border)',
      verticalAlign: 'middle',
    }}>
      {children}
    </td>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: DASHBOARD
═══════════════════════════════════════════════════════════════════════════ */
function DashboardSection() {
  const { data: userCount } = useQuery({
    queryKey: ['admin-user-count'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      return count ?? 0
    },
  })

  const { data: eventCount } = useQuery({
    queryKey: ['admin-event-count'],
    queryFn: async () => {
      const { count } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'live')
      return count ?? 0
    },
  })

  const { data: disputeCount } = useQuery({
    queryKey: ['admin-dispute-count'],
    queryFn: async () => {
      const { count } = await supabase.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open')
      return count ?? 0
    },
  })

  const { data: revenue } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => {
      const { data } = await supabase.from('escrow_records').select('amount').eq('status', 'released')
      return (data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
    },
  })

  const { data: recentLogs } = useQuery({
    queryKey: ['admin-recent-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, admin:profiles(name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(5)
      return data || []
    },
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <SectionHeader title="Dashboard" subtitle="Platform overview and recent activity" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard label="Total Users"      value={userCount ?? '—'}          icon={Users}        accent />
        <StatCard label="Active Events"    value={eventCount ?? '—'}         icon={CalendarDays} />
        <StatCard label="Open Disputes"    value={disputeCount ?? '—'}       icon={Swords}       />
        <StatCard label="Simulated Revenue" value={formatCurrency(revenue ?? 0)} icon={Wallet}  accent />
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Recent Activity
        </h3>
        {!recentLogs
          ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>
          : recentLogs.length === 0
            ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No activity yet.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentLogs.map((log) => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                    <Avatar src={log.admin?.avatar_url} name={log.admin?.name} size="sm" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        <span style={{ color: 'var(--navy-800)' }}>{log.admin?.name ?? 'Admin'}</span>
                        {' — '}{log.action_type}
                        {log.target_type && <span style={{ color: 'var(--text-muted)' }}> on {log.target_type}</span>}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {log.created_at ? formatDateTime(log.created_at) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )
        }
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: USERS
═══════════════════════════════════════════════════════════════════════════ */
function UsersSection() {
  const { profile: adminProfile } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmModal, setConfirmModal] = useState(null) // { type, user }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      return data || []
    },
  })

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
      const matchRole   = roleFilter   === 'all' || u.role   === roleFilter
      const matchStatus = statusFilter === 'all' || u.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const updateUser = useMutation({
    mutationFn: async ({ userId, updates, actionType }) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
      if (error) throw error
      await insertAuditLog(adminProfile.id, actionType, 'profile', userId, updates)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User updated.')
      setConfirmModal(null)
    },
    onError: (e) => toast.error(e.message),
  })

  function handleAction(type, user) {
    if (type === 'promote') {
      updateUser.mutate({ userId: user.id, updates: { role: 'host' }, actionType: 'promote_to_host' })
      return
    }
    setConfirmModal({ type, user })
  }

  function confirmAction() {
    const { type, user } = confirmModal
    if (type === 'suspend') updateUser.mutate({ userId: user.id, updates: { status: 'suspended' }, actionType: 'suspend_user' })
    if (type === 'ban')     updateUser.mutate({ userId: user.id, updates: { status: 'banned'    }, actionType: 'ban_user'     })
  }

  const roleVariant = { guest: 'default', host: 'primary', admin: 'warning' }
  const statusVariant = { active: 'success', suspended: 'warning', banned: 'error' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionHeader title="Users" subtitle={`${users.length} total users`} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              width: '100%', paddingLeft: '2.25rem', paddingRight: '0.75rem', paddingTop: '0.5rem', paddingBottom: '0.5rem',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
            }}
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          <option value="all">All roles</option>
          <option value="guest">Guest</option>
          <option value="host">Host</option>
          <option value="admin">Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.875rem' }}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </select>
      </div>

      {isLoading
        ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading users…</p>
        : (
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>City</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} style={{ transition: 'background 0.1s' }}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <Avatar src={u.avatar_url} name={u.name} size="sm" verified={u.host_verified} />
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{u.name || 'No name'}</span>
                    </div>
                  </Td>
                  <Td><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{u.email}</span></Td>
                  <Td><Badge variant={roleVariant[u.role] || 'default'}>{u.role}</Badge></Td>
                  <Td><span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{u.city || '—'}</span></Td>
                  <Td><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{u.created_at ? formatDate(u.created_at) : '—'}</span></Td>
                  <Td><Badge variant={statusVariant[u.status] || 'default'}>{u.status || 'active'}</Badge></Td>
                  <Td align="right">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {u.role === 'guest' && (
                        <Button variant="ghost" size="sm" onClick={() => handleAction('promote', u)}>
                          <UserCog size={13} /> Promote
                        </Button>
                      )}
                      {u.status !== 'suspended' && u.role !== 'admin' && (
                        <Button variant="secondary" size="sm" onClick={() => handleAction('suspend', u)}>
                          <ShieldOff size={13} /> Suspend
                        </Button>
                      )}
                      {u.status !== 'banned' && u.role !== 'admin' && (
                        <Button variant="danger" size="sm" onClick={() => handleAction('ban', u)}>
                          <Ban size={13} /> Ban
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )
      }

      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.type === 'ban' ? 'Ban User' : 'Suspend User'}
        size="sm"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Are you sure you want to {confirmModal?.type}{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{confirmModal?.user?.name}</strong>?
          {confirmModal?.type === 'ban' && ' This is a serious action.'}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setConfirmModal(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmAction} loading={updateUser.isPending}>
            {confirmModal?.type === 'ban' ? 'Yes, Ban' : 'Yes, Suspend'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: EVENTS
═══════════════════════════════════════════════════════════════════════════ */
function EventsSection() {
  const { profile: adminProfile } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('pending')
  const [rejectModal, setRejectModal] = useState(null) // event
  const [rejectReason, setRejectReason] = useState('')

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin-events', tab],
    queryFn: async () => {
      let q = supabase
        .from('events')
        .select('*, host:profiles!host_id(name, avatar_url)')
        .order('created_at', { ascending: false })

      if (tab === 'pending') q = q.eq('status', 'pending_review')
      else if (tab === 'live') q = q.eq('status', 'live')

      const { data } = await q
      return data || []
    },
  })

  const updateEvent = useMutation({
    mutationFn: async ({ eventId, updates, actionType }) => {
      const { error } = await supabase.from('events').update(updates).eq('id', eventId)
      if (error) throw error
      await insertAuditLog(adminProfile.id, actionType, 'event', eventId, updates)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-events'] })
      toast.success('Event updated.')
      setRejectModal(null)
      setRejectReason('')
    },
    onError: (e) => toast.error(e.message),
  })

  const statusVariant = { live: 'live', pending_review: 'warning', draft: 'draft', cancelled: 'error' }

  const tabs = [
    { id: 'pending', label: 'Pending Review' },
    { id: 'live',    label: 'Live' },
    { id: 'all',     label: 'All' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionHeader title="Events" subtitle="Moderate and manage platform events" />

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? 'var(--navy-800)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--navy-800)' : '2px solid transparent',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--navy-800)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading
        ? <p style={{ color: 'var(--text-muted)' }}>Loading events…</p>
        : (
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Host</Th>
                <Th>Date</Th>
                <Th>City</Th>
                <Th>Spots</Th>
                <Th>Status</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <Td>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ev.title}</span>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Avatar src={ev.host?.avatar_url} name={ev.host?.name} size="xs" />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ev.host?.name}</span>
                    </div>
                  </Td>
                  <Td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ev.date_time ? formatDate(ev.date_time) : '—'}</span></Td>
                  <Td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ev.venue_city || '—'}</span></Td>
                  <Td><span style={{ fontSize: '0.8rem' }}>{ev.current_guests ?? 0} / {ev.max_guests}</span></Td>
                  <Td><Badge variant={statusVariant[ev.status] || 'default'}>{ev.status}</Badge></Td>
                  <Td align="right">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {ev.status === 'pending_review' && (
                        <Button variant="primary" size="sm" onClick={() => updateEvent.mutate({ eventId: ev.id, updates: { status: 'live' }, actionType: 'approve_event' })}>
                          <CheckCircle size={13} /> Approve
                        </Button>
                      )}
                      {ev.status === 'pending_review' && (
                        <Button variant="secondary" size="sm" onClick={() => setRejectModal(ev)}>
                          <XCircle size={13} /> Reject
                        </Button>
                      )}
                      {ev.status === 'live' && (
                        <Button variant="danger" size="sm" onClick={() => updateEvent.mutate({ eventId: ev.id, updates: { status: 'cancelled' }, actionType: 'force_cancel_event' })}>
                          Force Cancel
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )
      }

      <Modal isOpen={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason('') }} title="Reject Event" size="sm">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Provide a reason for rejecting <strong>{rejectModal?.title}</strong>:
        </p>
        <Textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Rejection reason…"
          rows={3}
        />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason('') }}>Cancel</Button>
          <Button
            variant="danger"
            loading={updateEvent.isPending}
            onClick={() => updateEvent.mutate({ eventId: rejectModal.id, updates: { status: 'draft', rejection_reason: rejectReason }, actionType: 'reject_event' })}
          >
            Reject Event
          </Button>
        </div>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: HOST VERIFICATION
═══════════════════════════════════════════════════════════════════════════ */
function HostVerificationSection() {
  const { profile: adminProfile } = useAuth()
  const qc = useQueryClient()

  const { data: hosts = [], isLoading } = useQuery({
    queryKey: ['admin-host-verification'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'host')
        .eq('host_verified', false)
        .order('created_at', { ascending: false })
      return data || []
    },
  })

  const verifyHost = useMutation({
    mutationFn: async ({ hostId, approve }) => {
      if (approve) {
        const { error } = await supabase.from('profiles').update({
          host_verified: true,
          host_verified_at: new Date().toISOString(),
          host_verified_by: adminProfile.id,
          verification_level: 'medium',
        }).eq('id', hostId)
        if (error) throw error
        await insertAuditLog(adminProfile.id, 'approve_host_verification', 'profile', hostId, { verification_level: 'medium' })
      } else {
        const { error } = await supabase.from('profiles').update({ role: 'guest' }).eq('id', hostId)
        if (error) throw error
        await insertAuditLog(adminProfile.id, 'reject_host_verification', 'profile', hostId, {})
      }
    },
    onSuccess: (_, { approve }) => {
      qc.invalidateQueries({ queryKey: ['admin-host-verification'] })
      toast.success(approve ? 'Host verified.' : 'Application rejected.')
    },
    onError: (e) => toast.error(e.message),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionHeader title="Host Verification" subtitle={`${hosts.length} pending verification${hosts.length !== 1 ? 's' : ''}`} />

      {isLoading
        ? <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
        : hosts.length === 0
          ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center' }}>
              <ShieldCheck size={36} style={{ color: 'var(--sage-500)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>No pending host verifications.</p>
            </div>
          )
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {hosts.map((host) => (
                <div key={host.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <Avatar src={host.avatar_url} name={host.name} size="lg" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{host.name}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{host.email}</p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
                      {host.phone && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone: {host.phone}</span>}
                      {host.city && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>City: {host.city}</span>}
                    </div>
                    {host.bio && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>{host.bio}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={verifyHost.isPending}
                      onClick={() => verifyHost.mutate({ hostId: host.id, approve: true })}
                    >
                      <CheckCircle size={13} /> Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => verifyHost.mutate({ hostId: host.id, approve: false })}
                    >
                      <XCircle size={13} /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
      }
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: DISPUTES
═══════════════════════════════════════════════════════════════════════════ */
function DisputesSection() {
  const { profile: adminProfile } = useAuth()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('open')
  const [resolveModal, setResolveModal] = useState(null)
  const [resolution, setResolution] = useState('')

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('disputes')
        .select('*, raised_by_profile:profiles!raised_by(name, avatar_url), event:events(title)')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      const { data } = await q
      return data || []
    },
  })

  const updateDispute = useMutation({
    mutationFn: async ({ disputeId, updates, actionType }) => {
      const { error } = await supabase.from('disputes').update(updates).eq('id', disputeId)
      if (error) throw error
      await insertAuditLog(adminProfile.id, actionType, 'dispute', disputeId, updates)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] })
      toast.success('Dispute updated.')
      setResolveModal(null)
      setResolution('')
    },
    onError: (e) => toast.error(e.message),
  })

  const disputeStatusVariant = { open: 'warning', under_review: 'info', resolved: 'success', dismissed: 'default' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionHeader title="Disputes" subtitle="Manage and resolve member disputes" />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['open', 'under_review', 'resolved', 'dismissed', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: statusFilter === s ? 600 : 400,
              background: statusFilter === s ? 'var(--navy-800)' : 'var(--bg-subtle)',
              color: statusFilter === s ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading
        ? <p style={{ color: 'var(--text-muted)' }}>Loading disputes…</p>
        : disputes.length === 0
          ? <p style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>No disputes found.</p>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {disputes.map((d) => (
                <div key={d.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <Badge variant={disputeStatusVariant[d.status] || 'default'}>{d.status}</Badge>
                        {d.type && <Badge variant="default">{d.type}</Badge>}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.created_at ? formatDateTime(d.created_at) : ''}</span>
                      </div>
                      {d.event?.title && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                          Event: <strong style={{ color: 'var(--text-secondary)' }}>{d.event.title}</strong>
                        </p>
                      )}
                      {d.raised_by_profile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <Avatar src={d.raised_by_profile.avatar_url} name={d.raised_by_profile.name} size="xs" />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Raised by {d.raised_by_profile.name}</span>
                        </div>
                      )}
                      {d.description && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{d.description}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
                      {d.status === 'open' && (
                        <Button variant="secondary" size="sm" onClick={() => updateDispute.mutate({ disputeId: d.id, updates: { status: 'under_review' }, actionType: 'dispute_under_review' })}>
                          <Clock size={13} /> Mark Under Review
                        </Button>
                      )}
                      {(d.status === 'open' || d.status === 'under_review') && (
                        <Button variant="primary" size="sm" onClick={() => setResolveModal(d)}>
                          <CheckCircle size={13} /> Resolve
                        </Button>
                      )}
                      {d.status !== 'dismissed' && d.status !== 'resolved' && (
                        <Button variant="ghost" size="sm" onClick={() => updateDispute.mutate({ disputeId: d.id, updates: { status: 'dismissed' }, actionType: 'dispute_dismissed' })}>
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      <Modal isOpen={!!resolveModal} onClose={() => { setResolveModal(null); setResolution('') }} title="Resolve Dispute" size="sm">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Provide a resolution note:</p>
        <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Resolution details…" rows={3} />
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <Button variant="secondary" onClick={() => { setResolveModal(null); setResolution('') }}>Cancel</Button>
          <Button
            variant="primary"
            loading={updateDispute.isPending}
            onClick={() => updateDispute.mutate({ disputeId: resolveModal.id, updates: { status: 'resolved', resolution_note: resolution, resolved_at: new Date().toISOString() }, actionType: 'resolve_dispute' })}
          >
            Confirm Resolution
          </Button>
        </div>
      </Modal>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: ESCROW
═══════════════════════════════════════════════════════════════════════════ */
function EscrowSection() {
  const { profile: adminProfile } = useAuth()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('held')

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['admin-escrow', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('escrow_records')
        .select('*, event:events(title), guest:profiles!guest_id(name), host:profiles!host_id(name)')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      const { data } = await q
      return data || []
    },
  })

  const updateEscrow = useMutation({
    mutationFn: async ({ recordId, updates, actionType }) => {
      const { error } = await supabase.from('escrow_records').update(updates).eq('id', recordId)
      if (error) throw error
      await insertAuditLog(adminProfile.id, actionType, 'escrow_record', recordId, updates)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-escrow'] })
      toast.success('Escrow record updated.')
    },
    onError: (e) => toast.error(e.message),
  })

  const escrowStatusVariant = { held: 'warning', released: 'success', refunded: 'info' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionHeader title="Escrow" subtitle="Manage payment escrow records" />

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {['held', 'released', 'refunded', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: statusFilter === s ? 600 : 400,
              background: statusFilter === s ? 'var(--navy-800)' : 'var(--bg-subtle)',
              color: statusFilter === s ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading
        ? <p style={{ color: 'var(--text-muted)' }}>Loading escrow records…</p>
        : (
          <Table>
            <thead>
              <tr>
                <Th>Event</Th>
                <Th>Guest</Th>
                <Th>Host</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th align="right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <Td><span style={{ fontWeight: 500 }}>{r.event?.title || '—'}</span></Td>
                  <Td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.guest?.name || '—'}</span></Td>
                  <Td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{r.host?.name || '—'}</span></Td>
                  <Td><span style={{ fontWeight: 600 }}>{formatCurrency(r.amount)}</span></Td>
                  <Td><Badge variant={escrowStatusVariant[r.status] || 'default'}>{r.status}</Badge></Td>
                  <Td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.created_at ? formatDate(r.created_at) : '—'}</span></Td>
                  <Td align="right">
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {r.status === 'held' && (
                        <>
                          <Button variant="primary" size="sm" onClick={() => updateEscrow.mutate({ recordId: r.id, updates: { status: 'released', released_at: new Date().toISOString() }, actionType: 'release_escrow' })}>
                            Release to Host
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => updateEscrow.mutate({ recordId: r.id, updates: { status: 'refunded', refunded_at: new Date().toISOString() }, actionType: 'refund_escrow' })}>
                            Refund Guest
                          </Button>
                        </>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )
      }
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: ANALYTICS
═══════════════════════════════════════════════════════════════════════════ */
function AnalyticsSection() {
  const { data: profiles = [] } = useQuery({
    queryKey: ['analytics-profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('created_at, role')
      return data || []
    },
  })

  const { data: events = [] } = useQuery({
    queryKey: ['analytics-events'],
    queryFn: async () => {
      const { data } = await supabase.from('events').select('status, review_count, avg_overall, host_id')
      return data || []
    },
  })

  const { data: topHosts = [] } = useQuery({
    queryKey: ['analytics-top-hosts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('name, avatar_url, events_hosted, avg_host_rating')
        .eq('role', 'host')
        .order('events_hosted', { ascending: false })
        .limit(10)
      return data || []
    },
  })

  // Group signups by week
  const weeklyGrowth = useMemo(() => {
    const map = {}
    profiles.forEach((p) => {
      if (!p.created_at) return
      const d = new Date(p.created_at)
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      const key = weekStart.toISOString().slice(0, 10)
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([week, count]) => ({ week, count }))
  }, [profiles])

  const eventsByStatus = useMemo(() => {
    const map = {}
    events.forEach((e) => { map[e.status] = (map[e.status] || 0) + 1 })
    return Object.entries(map).map(([status, count]) => ({ status, count }))
  }, [events])

  const statVariant = { live: 'live', pending_review: 'warning', draft: 'draft', cancelled: 'error' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <SectionHeader title="Analytics" subtitle="Platform metrics and trends" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard label="Total Users"  value={profiles.length}                              icon={Users}       accent />
        <StatCard label="Total Events" value={events.length}                                icon={CalendarDays} />
        <StatCard label="Total Hosts"  value={profiles.filter((p) => p.role === 'host').length} icon={ShieldCheck} />
        <StatCard label="Avg Rating"   value={events.filter((e) => e.avg_overall).length > 0
          ? (events.reduce((s, e) => s + (e.avg_overall || 0), 0) / events.filter((e) => e.avg_overall).length).toFixed(2)
          : '—'
        } icon={Star} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* User growth */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Weekly Signups</h3>
          <Table>
            <thead><tr><Th>Week of</Th><Th align="right">New Users</Th></tr></thead>
            <tbody>
              {weeklyGrowth.map((w) => (
                <tr key={w.week}>
                  <Td><span style={{ fontSize: '0.8rem' }}>{w.week}</span></Td>
                  <Td align="right"><span style={{ fontWeight: 600 }}>{w.count}</span></Td>
                </tr>
              ))}
              {weeklyGrowth.length === 0 && (
                <tr><Td colSpan={2}><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No data yet.</span></Td></tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Events by status */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Events by Status</h3>
          <Table>
            <thead><tr><Th>Status</Th><Th align="right">Count</Th></tr></thead>
            <tbody>
              {eventsByStatus.map((e) => (
                <tr key={e.status}>
                  <Td><Badge variant={statVariant[e.status] || 'default'}>{e.status}</Badge></Td>
                  <Td align="right"><span style={{ fontWeight: 600 }}>{e.count}</span></Td>
                </tr>
              ))}
              {eventsByStatus.length === 0 && (
                <tr><Td colSpan={2}><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No data yet.</span></Td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Top hosts */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Top Hosts by Events Hosted</h3>
        <Table>
          <thead><tr><Th>Host</Th><Th align="right">Events Hosted</Th><Th align="right">Avg Rating</Th></tr></thead>
          <tbody>
            {topHosts.map((h, i) => (
              <tr key={i}>
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Avatar src={h.avatar_url} name={h.name} size="xs" />
                    <span style={{ fontWeight: 500 }}>{h.name}</span>
                  </div>
                </Td>
                <Td align="right"><span style={{ fontWeight: 600 }}>{h.events_hosted ?? 0}</span></Td>
                <Td align="right">
                  {h.avg_host_rating
                    ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <Star size={12} style={{ color: 'var(--amber-500)', fill: 'var(--amber-500)' }} />
                        {Number(h.avg_host_rating).toFixed(1)}
                      </span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>
                  }
                </Td>
              </tr>
            ))}
            {topHosts.length === 0 && (
              <tr><Td colSpan={3}><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No host data yet.</span></Td></tr>
            )}
          </tbody>
        </Table>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION: AUDIT LOG
═══════════════════════════════════════════════════════════════════════════ */
function AuditLogSection() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, admin:profiles(name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50)
      return data || []
    },
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionHeader title="Audit Log" subtitle="Last 50 administrative actions" />

      {isLoading
        ? <p style={{ color: 'var(--text-muted)' }}>Loading audit log…</p>
        : (
          <Table>
            <thead>
              <tr>
                <Th>Admin</Th>
                <Th>Action</Th>
                <Th>Target</Th>
                <Th>Target ID</Th>
                <Th>Details</Th>
                <Th>Time</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Avatar src={log.admin?.avatar_url} name={log.admin?.name} size="xs" />
                      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{log.admin?.name ?? 'System'}</span>
                    </div>
                  </Td>
                  <Td><Badge variant="default">{log.action_type}</Badge></Td>
                  <Td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.target_type || '—'}</span></Td>
                  <Td>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {log.target_id ? `${log.target_id.slice(0, 8)}…` : '—'}
                    </span>
                  </Td>
                  <Td>
                    {log.details && Object.keys(log.details).length > 0
                      ? <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{JSON.stringify(log.details).slice(0, 60)}…</span>
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                    }
                  </Td>
                  <Td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{log.created_at ? formatDateTime(log.created_at) : '—'}</span></Td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><Td colSpan={6}><span style={{ color: 'var(--text-muted)' }}>No audit log entries yet.</span></Td></tr>
              )}
            </tbody>
          </Table>
        )
      }
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT: ADMIN PANEL
═══════════════════════════════════════════════════════════════════════════ */
export default function AdminPanel() {
  const { profile, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  if (!profile || profile.role !== 'admin') {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <ShieldCheck size={40} style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Access restricted to administrators.</p>
      </div>
    )
  }

  const sections = {
    dashboard:          <DashboardSection />,
    users:              <UsersSection />,
    events:             <EventsSection />,
    'host-verification': <HostVerificationSection />,
    disputes:           <DisputesSection />,
    escrow:             <EscrowSection />,
    analytics:          <AnalyticsSection />,
    'audit-log':        <AuditLogSection />,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex' }}>
      {/* ── Desktop sidebar ── */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }} className="hidden md:flex">
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '0.625rem' }}>
            <div style={{ width: '1.875rem', height: '1.875rem', borderRadius: '0.5rem', background: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>C</span>
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>Comora</span>
          </Link>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.2rem 0.6rem', borderRadius: '9999px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{profile.name}</p>
        </div>
        <nav style={{ padding: '0.75rem 0.5rem', flex: 1 }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: activeSection === id ? 600 : 400,
                color: activeSection === id ? 'var(--navy-800)' : 'var(--text-secondary)',
                background: activeSection === id ? 'var(--accent-soft)' : 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '0.125rem',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        {/* Bottom actions */}
        <div style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
          <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)', width: '100%', textAlign: 'left' }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <Link to="/browse" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={16} /> Back to site
          </Link>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#ef4444', width: '100%', textAlign: 'left' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '240px',
              height: '100%',
              background: 'var(--bg-card)',
              borderRight: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>Admin Panel</p>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <nav style={{ padding: '0.75rem 0.5rem', flex: 1 }}>
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveSection(id); setSidebarOpen(false) }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: activeSection === id ? 600 : 400,
                    color: activeSection === id ? 'var(--navy-800)' : 'var(--text-secondary)',
                    background: activeSection === id ? 'var(--accent-soft)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    marginBottom: '0.125rem',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* ── Main content ── */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }} className="md:hidden">
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '0.25rem' }}>
            <Menu size={20} />
          </button>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            {NAV_ITEMS.find((n) => n.id === activeSection)?.label || 'Admin'}
          </span>
        </div>

        {/* Mobile tab bar */}
        <div style={{ display: 'flex', overflowX: 'auto', gap: '0', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', scrollbarWidth: 'none' }} className="md:hidden">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.625rem 0.75rem',
                fontSize: '0.65rem',
                fontWeight: activeSection === id ? 600 : 400,
                color: activeSection === id ? 'var(--navy-800)' : 'var(--text-muted)',
                borderBottom: activeSection === id ? '2px solid var(--navy-800)' : '2px solid transparent',
                background: 'none',
                border: 'none',
                borderBottom: activeSection === id ? '2px solid var(--navy-800)' : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div style={{ padding: '2rem 1.5rem', flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {sections[activeSection]}
        </div>
      </main>
    </div>
  )
}
