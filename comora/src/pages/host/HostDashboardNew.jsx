import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Plus, CalendarDays, Users, Star, TrendingUp,
  PencilLine, Eye, X, MessageSquare, ChevronRight,
  AlertCircle, ExternalLink, ShieldAlert,
} from 'lucide-react'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatDate, formatCurrency } from '../../lib/utils'

// ─── Pipeline column config ───────────────────────────────────────────────────
const COLUMNS = [
  { key: 'draft',     label: 'Draft',      color: '#94a3b8', desc: 'In progress'       },
  { key: 'pending',   label: 'In Review',  color: '#f97316', desc: 'Awaiting approval' },
  { key: 'live',      label: 'Live',       color: '#22c55e', desc: 'Accepting RSVPs'   },
  { key: 'completed', label: 'Completed',  color: '#6366f1', desc: 'Past events'       },
]

function groupByStage(events) {
  return {
    draft:     events.filter((e) => e.status === 'draft'),
    pending:   events.filter((e) => e.status === 'pending'),
    live:      events.filter((e) => e.status === 'live' || e.status === 'approved'),
    completed: events.filter((e) => e.status === 'completed'),
    cancelled: events.filter((e) => e.status === 'cancelled'),
  }
}

// ─── Compact event card ───────────────────────────────────────────────────────
function EventCard({ event, onEdit, onView, onCancel, note, viewLabel = 'View' }) {
  const bookingCount = Array.isArray(event.bookings)
    ? event.bookings.length
    : (event.bookings?.[0]?.count ?? 0)

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-3 flex flex-col gap-2">
      <div>
        <h4
          className="text-sm font-semibold text-[var(--text-primary)] mb-0.5"
          style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
        >
          {event.title}
        </h4>
        <p className="text-[11px] text-[var(--text-muted)]">
          {event.date_time ? formatDate(event.date_time) : 'Date TBD'}
          {' · '}
          <span className={bookingCount >= (event.max_guests ?? 0) && event.max_guests ? 'text-[var(--coral-500)] font-medium' : ''}>
            {bookingCount}/{event.max_guests ?? '?'} RSVPs
          </span>
          {event.price > 0 && <span className="ml-1">· {formatCurrency(event.price)}</span>}
        </p>
      </div>

      {note && (
        <p className="text-[11px] text-[var(--comora-orange)] font-medium leading-snug">{note}</p>
      )}

      <div className="flex items-center gap-1.5">
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
          >
            <PencilLine size={10} /> Edit
          </button>
        )}
        {onView && (
          <button
            onClick={onView}
            className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-[11px] font-medium bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
          >
            <Eye size={10} /> {viewLabel}
          </button>
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="ml-auto flex items-center justify-center w-6 h-6 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Cancel event"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Pipeline column ──────────────────────────────────────────────────────────
function PipelineColumn({ col, events, onEdit, onView, onCancel, renderNote }) {
  return (
    <div className="flex flex-col min-w-[200px]">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 mb-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border)]">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: col.color }}
        />
        <span className="text-xs font-semibold text-[var(--text-primary)]">{col.label}</span>
        <span className="ml-auto text-xs font-bold text-[var(--text-muted)]">{events.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 flex-1">
        {events.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-8 border border-dashed border-[var(--border)] rounded-[var(--radius-lg)]">
            <p className="text-xs text-[var(--text-muted)] text-center px-3">{col.desc}</p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={onEdit ? () => onEdit(event) : null}
              onView={onView ? () => onView(event) : null}
              onCancel={onCancel ? () => onCancel(event) : null}
              note={renderNote ? renderNote(event) : null}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HostDashboardNew() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [cancelTarget, setCancelTarget] = useState(null)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [verifyPhone, setVerifyPhone] = useState('')
  const [verifyNote, setVerifyNote] = useState('')
  const [verifySubmitting, setVerifySubmitting] = useState(false)

  // ── Fetch events ────────────────────────────────────────────────────────────
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['host-events', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, bookings(count)')
        .eq('host_id', user.id)
        .order('date_time', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  // ── Auto-complete past events ───────────────────────────────────────────────
  useEffect(() => {
    if (!events.length) return
    const now = Date.now()
    const toComplete = events
      .filter((e) => {
        if (e.status !== 'approved' && e.status !== 'live') return false
        if (!e.date_time) return false
        const endMs = new Date(e.date_time).getTime() + (e.duration_minutes ?? 120) * 60_000
        return endMs < now
      })
      .map((e) => e.id)
    if (!toComplete.length) return
    supabase
      .from('events')
      .update({ status: 'completed' })
      .in('id', toComplete)
      .then(() => queryClient.invalidateQueries({ queryKey: ['host-events', user?.id] }))
  }, [events])

  // ── Fetch messages ──────────────────────────────────────────────────────────
  const { data: messages = [] } = useQuery({
    queryKey: ['host-messages', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('host_messages')
        .select('*, guest:profiles!guest_id(name, avatar_url)')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data ?? []
    },
  })

  // ── Cancel mutation ─────────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: async (eventId) => {
      const { error } = await supabase
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Event cancelled.')
      setCancelTarget(null)
      queryClient.invalidateQueries({ queryKey: ['host-events', user?.id] })
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel'),
  })

  // ── Stats ───────────────────────────────────────────────────────────────────
  const pipeline = groupByStage(events)
  const totalRSVPs = events.reduce((sum, e) => {
    const n = Array.isArray(e.bookings) ? e.bookings.length : (e.bookings?.[0]?.count ?? 0)
    return sum + n
  }, 0)
  const avgRating = profile?.avg_rating ? Number(profile.avg_rating).toFixed(1) : '—'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Host Dashboard
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Welcome back, {profile?.name?.split(' ')[0] || 'Host'}
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate('/host/studio/new')}>
            <Plus size={15} /> New Event
          </Button>
        </div>

        {/* ── Verification banner ────────────────────────────────────────────── */}
        {profile && !profile.host_verified && (
          <div className="flex items-start gap-4 bg-[var(--comora-orange)]/10 border border-[var(--comora-orange)]/40 rounded-[var(--radius-xl)] p-4 mb-6">
            <ShieldAlert size={18} className="text-[var(--comora-orange)] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--comora-orange)]">Get Verified as a Host</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Verification builds trust with guests and unlocks higher event limits.
              </p>
            </div>
            <Button variant="warm" size="sm" onClick={() => setVerifyOpen(true)}>
              Submit Verification
            </Button>
          </div>
        )}

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total Events',   value: events.filter(e => e.status !== 'cancelled').length, sub: `${events.length} created`, icon: <CalendarDays size={16} /> },
            { label: 'Live Now',       value: pipeline.live.length, sub: 'accepting RSVPs', icon: <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> },
            { label: 'Total RSVPs',    value: totalRSVPs, sub: 'across all events', icon: <Users size={16} /> },
            { label: 'Avg Rating',     value: avgRating, sub: profile?.total_reviews ? `${profile.total_reviews} reviews` : 'No reviews yet', icon: <Star size={16} /> },
          ].map(({ label, value, sub, icon }) => (
            <div
              key={label}
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
                <span className="text-[var(--text-muted)]">{icon}</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── Main grid: pipeline + sidebar ─────────────────────────────────── */}
        <div className="flex gap-6 items-start">

          {/* Pipeline */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Event Pipeline</h2>
              {pipeline.cancelled.length > 0 && (
                <span className="text-xs text-[var(--text-muted)]">
                  {pipeline.cancelled.length} cancelled (hidden)
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-2 border-[var(--comora-navy)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : events.filter(e => e.status !== 'cancelled').length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 border border-dashed border-[var(--border)] rounded-[var(--radius-xl)]">
                <CalendarDays size={32} className="text-[var(--text-muted)]" />
                <div className="text-center">
                  <p className="font-semibold text-[var(--text-primary)]">No events yet</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Create your first gathering to get started.</p>
                </div>
                <Button variant="primary" onClick={() => navigate('/host/studio/new')}>
                  <Plus size={14} /> Create Event
                </Button>
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
              >
                {COLUMNS.map((col) => (
                  <PipelineColumn
                    key={col.key}
                    col={col}
                    events={pipeline[col.key]}
                    onEdit={col.key !== 'completed' ? (e) => navigate(`/host/studio/${e.id}`) : null}
                    onView={(e) => navigate(`/events/${e.id}`)}
                    onCancel={col.key !== 'completed' ? (e) => setCancelTarget(e) : null}
                    renderNote={col.key === 'pending' ? () => 'Under review · editing resets to draft' : null}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-64 shrink-0 hidden lg:flex flex-col gap-5">

            {/* Messages */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Messages</h3>
                  {messages.filter(m => !m.is_read).length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--comora-orange)] text-white">
                      {messages.filter(m => !m.is_read).length}
                    </span>
                  )}
                </div>
                <Link
                  to="/host/messages"
                  className="text-xs text-[var(--comora-navy)] font-medium flex items-center gap-0.5 hover:underline"
                >
                  View all <ChevronRight size={12} />
                </Link>
              </div>

              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden">
                {messages.length === 0 ? (
                  <div className="p-5 text-center">
                    <MessageSquare size={22} className="text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-xs text-[var(--text-muted)]">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <Link
                      key={msg.id}
                      to="/host/messages"
                      className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-[var(--bg-subtle)] transition-colors"
                      style={{
                        borderBottom: i < messages.length - 1 ? '1px solid var(--border)' : 'none',
                        background: msg.is_read ? undefined : 'var(--accent-soft)',
                        textDecoration: 'none',
                      }}
                    >
                      <Avatar src={msg.guest?.avatar_url} name={msg.guest?.name} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {msg.guest?.name || 'Guest'}
                          {!msg.is_read && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-[var(--comora-orange)] inline-block" />}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{msg.message}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Quick Actions</h3>
              <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden divide-y divide-[var(--border)]">
                {[
                  { label: 'Create New Event', to: '/host/studio/new', icon: <Plus size={14} /> },
                  { label: 'Browse Events',    to: '/browse',           icon: <ExternalLink size={14} /> },
                  { label: 'My Profile',       to: '/profile',          icon: <CalendarDays size={14} /> },
                ].map(({ label, to, icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="text-[var(--text-muted)]">{icon}</span>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Cancel event modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Event?"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--text-secondary)]">
              Cancel <strong>{cancelTarget?.title}</strong>? All confirmed guests will be notified.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setCancelTarget(null)}>Keep</Button>
            <Button
              variant="danger"
              size="sm"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelTarget.id)}
            >
              Cancel Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Verification modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title="Host Verification"
        size="md"
      >
        <div className="flex flex-col gap-5">
          <div className="bg-[var(--comora-orange)]/10 border border-[var(--comora-orange)]/30 rounded-[var(--radius-md)] p-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Submit your phone number. Our team will reach out to verify via a quick call. This is simulated for the MVP.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">Phone Number</label>
              <input
                type="tel"
                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--comora-navy)]"
                placeholder="+91 98765 43210"
                value={verifyPhone}
                onChange={(e) => setVerifyPhone(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                About You <span className="text-[var(--text-muted)] font-normal">(optional)</span>
              </label>
              <textarea
                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--comora-navy)] resize-y min-h-[70px]"
                placeholder="Tell us about yourself and your hosting experience…"
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" size="sm" onClick={() => setVerifyOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              loading={verifySubmitting}
              disabled={!verifyPhone.trim()}
              onClick={async () => {
                setVerifySubmitting(true)
                try {
                  await supabase.from('profiles').update({
                    verification_requested: true,
                    verification_phone: verifyPhone,
                    verification_note: verifyNote,
                  }).eq('id', user.id)
                  toast.success('Verification request submitted!')
                  setVerifyOpen(false)
                } catch {
                  toast.error('Failed — please try again.')
                } finally {
                  setVerifySubmitting(false)
                }
              }}
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
