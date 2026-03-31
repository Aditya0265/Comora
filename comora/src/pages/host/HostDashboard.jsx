import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Plus, Star, TrendingUp, Users, CalendarDays, ChevronDown, ChevronUp,
  ShieldAlert, X, Check, PencilLine, Eye, AlertCircle, MessageSquare,
} from 'lucide-react'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'

import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatDateTime, formatCurrency } from '../../lib/utils'

// ─── helpers ────────────────────────────────────────────────────────────────

function statusVariant(status) {
  const map = {
    draft:     'draft',
    pending:   'pending',
    approved:  'approved',
    live:      'live',
    completed: 'attended',
    cancelled: 'cancelled',
  }
  return map[status] ?? 'default'
}

function statCard(icon, label, value, sub) {
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
        <span className="text-[var(--text-muted)]">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      {sub && <p className="text-xs text-[var(--text-secondary)]">{sub}</p>}
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function HostDashboard() {
  const { user, profile } = useAuth()
  const navigate           = useNavigate()
  const queryClient        = useQueryClient()

  const [expandedEventId, setExpandedEventId]   = useState(null)
  const [cancelEventTarget, setCancelEventTarget] = useState(null)
  const [verifyModalOpen, setVerifyModalOpen]   = useState(false)
  const [verifyPhone, setVerifyPhone]           = useState('')
  const [verifyNote, setVerifyNote]             = useState('')
  const [isSubmittingVerify, setIsSubmittingVerify] = useState(false)

  // ── fetch events ─────────────────────────────────────────────────────────
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['host-events', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, bookings(count)')
        .eq('host_id', user.id)
        .order('date_time')
      if (error) throw error
      return data ?? []
    },
  })

  // ── fetch all bookings for stats ─────────────────────────────────────────
  const { data: allBookings = [] } = useQuery({
    queryKey: ['host-bookings-all', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const eventIds = events.map((e) => e.id)
      if (eventIds.length === 0) return []
      const { data, error } = await supabase
        .from('bookings')
        .select('id, status, amount_paid, payment_status, event_id')
        .in('event_id', eventIds)
        .eq('status', 'confirmed')
      if (error) throw error
      return data ?? []
    },
    enabled: events.length > 0,
  })

  // ── fetch guest messages ─────────────────────────────────────────────────
  const { data: guestMessages = [], error: msgError } = useQuery({
    queryKey: ['host-messages', user?.id],
    enabled:  !!user,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('host_messages')
        .select('*, guest:profiles!guest_id(name, avatar_url), community:communities(name)')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  async function markRead(id) {
    await supabase.from('host_messages').update({ is_read: true }).eq('id', id)
    queryClient.invalidateQueries(['host-messages', user?.id])
  }

  // ── fetch guests for selected event ─────────────────────────────────────
  const { data: eventGuests = [], isLoading: guestsLoading } = useQuery({
    queryKey: ['event-guests', expandedEventId],
    enabled:  !!expandedEventId,
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, guest:profiles(id, name, avatar_url, dietary_prefs, rsvp_reliability)')
        .eq('event_id', expandedEventId)
        .order('booked_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  // ── approve / decline booking ────────────────────────────────────────────
  const approveGuest = useMutation({
    mutationFn: async (bookingId) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed', approved_by: user.id, approved_at: new Date().toISOString() })
        .eq('id', bookingId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Guest approved!')
      queryClient.invalidateQueries({ queryKey: ['event-guests', expandedEventId] })
      queryClient.invalidateQueries({ queryKey: ['host-events', user?.id] })
    },
    onError: (err) => toast.error(err.message || 'Failed to approve'),
  })

  const declineGuest = useMutation({
    mutationFn: async (bookingId) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Guest declined.')
      queryClient.invalidateQueries({ queryKey: ['event-guests', expandedEventId] })
    },
    onError: (err) => toast.error(err.message || 'Failed to decline'),
  })

  // ── cancel event ─────────────────────────────────────────────────────────
  const cancelEventMutation = useMutation({
    mutationFn: async (eventId) => {
      const { error } = await supabase
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', eventId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Event cancelled.')
      setCancelEventTarget(null)
      queryClient.invalidateQueries({ queryKey: ['host-events', user?.id] })
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel event'),
  })

  // ── stats ─────────────────────────────────────────────────────────────────
  const totalEvents    = events.length
  const activeBookings = allBookings.filter((b) => b.status === 'confirmed').length
  const earnings       = allBookings.reduce((sum, b) => sum + (b.amount_paid ?? 0), 0)
  const avgRating      = profile?.avg_rating ? Number(profile.avg_rating).toFixed(1) : '—'

  // per-event booking count map
  const bookingCountMap = Object.fromEntries(
    events.map((e) => [e.id, Array.isArray(e.bookings) ? e.bookings.length : (e.bookings?.[0]?.count ?? 0)])
  )

  // earnings per event
  const earningsPerEvent = events.map((ev) => ({
    id:       ev.id,
    title:    ev.title,
    earnings: allBookings
      .filter((b) => b.event_id === ev.id)
      .reduce((s, b) => s + (b.amount_paid ?? 0), 0),
    confirmed: allBookings.filter((b) => b.event_id === ev.id && b.status === 'confirmed').length,
  })).filter((e) => e.earnings > 0)

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Host Studio</h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage your events and guests.</p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/host/studio/new')}
          >
            <Plus size={16} />
            Create New Event
          </Button>
        </div>

        {/* ── Verification banner ──────────────────────────────────────────── */}
        {profile && !profile.host_verified && (
          <div className="flex items-start gap-4 bg-[var(--comora-orange)]/10 border border-[var(--comora-orange)]/40 rounded-[var(--radius-xl)] p-4 mb-8">
            <ShieldAlert size={20} className="text-[var(--comora-orange)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--comora-orange)]">Get Verified as a Host</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Verification builds trust with guests and unlocks higher event limits.
              </p>
            </div>
            <Button variant="warm" size="sm" onClick={() => setVerifyModalOpen(true)}>
              Submit Verification
            </Button>
          </div>
        )}

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {statCard(<CalendarDays size={18} />, 'Total Events',      totalEvents,    `${events.filter((e) => e.status === 'live').length} live now`)}
          {statCard(<Users size={18} />,        'Active Bookings',   activeBookings, 'confirmed RSVPs')}
          {statCard(<TrendingUp size={18} />,   'Simulated Earnings', formatCurrency(earnings), 'from confirmed bookings')}
          {statCard(<Star size={18} />,         'Avg Rating',        avgRating,      profile?.total_reviews ? `${profile.total_reviews} reviews` : 'No reviews yet')}
        </div>

        {/* ── Events table ─────────────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">My Events</h2>

          {eventsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-[var(--comora-navy)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-14 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)]">
              <CalendarDays size={36} className="text-[var(--text-muted)]" />
              <div className="text-center">
                <p className="font-semibold text-[var(--text-primary)]">No events yet</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Create your first gathering to get started.</p>
              </div>
              <Button variant="primary" onClick={() => navigate('/host/studio/new')}>
                <Plus size={15} /> Create Event
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {events.map((event) => {
                const count   = bookingCountMap[event.id] ?? 0
                const isOpen  = expandedEventId === event.id

                return (
                  <div
                    key={event.id}
                    className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden"
                  >
                    {/* Event row */}
                    <div className="flex items-center gap-4 p-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={statusVariant(event.status)}>
                            {event.status}
                          </Badge>
                          {event.status === 'live' && (
                            <Badge variant="live" dot>Live</Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-[var(--text-primary)] truncate">{event.title}</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {event.date_time ? formatDateTime(event.date_time) : 'Date TBD'}
                          {' · '}
                          <span className={count >= event.max_guests ? 'text-[var(--coral-500)] font-medium' : ''}>
                            {count}/{event.max_guests ?? '?'} spots
                          </span>
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/host/studio/${event.id}`)}
                          title="Edit event"
                        >
                          <PencilLine size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedEventId(isOpen ? null : event.id)}
                          title="View guests"
                        >
                          <Eye size={14} />
                          Guests
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </Button>
                        {event.status !== 'cancelled' && event.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelEventTarget(event)}
                            title="Cancel event"
                            className="text-[var(--coral-500)] hover:bg-red-50"
                          >
                            <X size={14} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Guest list expansion */}
                    {isOpen && (
                      <div className="border-t border-[var(--border)] bg-[var(--bg-base)]">
                        <div className="p-4">
                          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                            Guest List
                          </h4>

                          {guestsLoading ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-[var(--comora-navy)] border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : eventGuests.length === 0 ? (
                            <p className="text-sm text-[var(--text-muted)] text-center py-6">
                              No guests yet.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left border-b border-[var(--border)]">
                                    <th className="pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Guest</th>
                                    <th className="pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</th>
                                    <th className="pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide hidden sm:table-cell">Dietary</th>
                                    <th className="pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide hidden md:table-cell">Reliability</th>
                                    <th className="pb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {eventGuests.map((booking) => (
                                    <tr key={booking.id} className="border-b border-[var(--border)] last:border-0">
                                      <td className="py-3 pr-4">
                                        <div className="flex items-center gap-2">
                                          <Avatar
                                            src={booking.guest?.avatar_url}
                                            name={booking.guest?.name}
                                            size="sm"
                                          />
                                          <span className="font-medium text-[var(--text-primary)] truncate max-w-[120px]">
                                            {booking.guest?.name ?? 'Unknown'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3 pr-4">
                                        <Badge variant={
                                          booking.status === 'confirmed'  ? 'confirmed'  :
                                          booking.status === 'waitlisted' ? 'waitlisted' :
                                          booking.status === 'cancelled'  ? 'cancelled'  :
                                          booking.status === 'pending'    ? 'pending'    :
                                          'default'
                                        }>
                                          {booking.status}
                                        </Badge>
                                      </td>
                                      <td className="py-3 pr-4 hidden sm:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                          {(booking.guest?.dietary_prefs ?? []).map((d) => (
                                            <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border)]">
                                              {d}
                                            </span>
                                          ))}
                                          {!(booking.guest?.dietary_prefs?.length) && (
                                            <span className="text-xs text-[var(--text-muted)]">—</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 pr-4 hidden md:table-cell">
                                        {booking.guest?.rsvp_reliability != null ? (
                                          <div className="flex items-center gap-1">
                                            <div className="w-16 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                                              <div
                                                className="h-full rounded-full bg-[var(--sage-500)]"
                                                style={{ width: `${Math.round(booking.guest.rsvp_reliability * 100)}%` }}
                                              />
                                            </div>
                                            <span className="text-xs text-[var(--text-muted)]">
                                              {Math.round(booking.guest.rsvp_reliability * 100)}%
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-[var(--text-muted)]">—</span>
                                        )}
                                      </td>
                                      <td className="py-3">
                                        {booking.status === 'pending' && event.registration_mode === 'request' ? (
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => approveGuest.mutate(booking.id)}
                                              disabled={approveGuest.isPending}
                                              title="Approve"
                                              className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center hover:bg-emerald-200 transition-colors disabled:opacity-50"
                                            >
                                              <Check size={13} />
                                            </button>
                                            <button
                                              onClick={() => declineGuest.mutate(booking.id)}
                                              disabled={declineGuest.isPending}
                                              title="Decline"
                                              className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center hover:bg-red-200 transition-colors disabled:opacity-50"
                                            >
                                              <X size={13} />
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-[var(--text-muted)]">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Guest Messages ────────────────────────────────────────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--comora-navy)]" />
            Guest Messages
            {guestMessages.filter(m => !m.is_read).length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--comora-orange)] text-white">
                {guestMessages.filter(m => !m.is_read).length} new
              </span>
            )}
          </h2>
          {msgError ? (
            <p className="text-sm text-red-500">{msgError.message}</p>
          ) : guestMessages.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] italic">No messages from guests yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {guestMessages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => !msg.is_read && markRead(msg.id)}
                  className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] p-4 flex flex-col gap-2 cursor-pointer"
                  style={{ borderLeft: msg.is_read ? undefined : '3px solid var(--comora-orange)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {msg.guest?.name || 'Guest'}
                      </span>
                      {msg.community?.name && (
                        <span className="text-xs text-[var(--text-muted)]">re: {msg.community.name}</span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-muted)] shrink-0">
                      {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{msg.message}</p>
                  {!msg.is_read && (
                    <span className="text-xs font-semibold text-[var(--comora-orange)]">Tap to mark as read</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Earnings overview ─────────────────────────────────────────────── */}
        {earnings > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Earnings Overview</h2>
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Simulated total revenue</span>
                <span className="text-xl font-bold text-[var(--text-primary)]">{formatCurrency(earnings)}</span>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {earningsPerEvent.map((ev) => (
                  <div key={ev.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ev.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{ev.confirmed} confirmed guest{ev.confirmed !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)] shrink-0">
                      {formatCurrency(ev.earnings)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>

      {/* ── Cancel event modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={!!cancelEventTarget}
        onClose={() => setCancelEventTarget(null)}
        title="Cancel Event?"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-[var(--coral-500)] shrink-0 mt-0.5" />
            <p className="text-sm text-[var(--text-secondary)]">
              Are you sure you want to cancel <strong>{cancelEventTarget?.title}</strong>?
              All confirmed guests will be notified.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCancelEventTarget(null)}>Keep Event</Button>
            <Button
              variant="danger"
              loading={cancelEventMutation.isPending}
              onClick={() => cancelEventMutation.mutate(cancelEventTarget.id)}
            >
              Cancel Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Verification modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Host Verification"
        size="md"
      >
        <div className="flex flex-col gap-5">
          <div className="bg-[var(--comora-orange)]/10 border border-[var(--comora-orange)]/30 rounded-[var(--radius-md)] p-4">
            <p className="text-sm font-medium text-[var(--comora-orange)] mb-1">How it works</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Submit your phone number and a short note. Our team will reach out to verify your identity via a quick call or document check. This is a simulated process for the MVP.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">Phone Number</label>
              <input
                type="tel"
                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--comora-navy)] focus:ring-2 focus:ring-[var(--accent-soft)]"
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
                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--comora-navy)] focus:ring-2 focus:ring-[var(--accent-soft)] resize-y min-h-[80px]"
                placeholder="Tell us a bit about yourself and your hosting experience…"
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Government ID upload is simulated in this MVP. The Comora team will review and respond within 2 business days.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="secondary" onClick={() => setVerifyModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={isSubmittingVerify}
              disabled={!verifyPhone.trim()}
              onClick={async () => {
                setIsSubmittingVerify(true)
                try {
                  // Simulated submission — just inserts a flag/note in profiles
                  await supabase
                    .from('profiles')
                    .update({ verification_requested: true, verification_phone: verifyPhone, verification_note: verifyNote })
                    .eq('id', user.id)
                  toast.success('Verification request submitted!')
                  setVerifyModalOpen(false)
                } catch (err) {
                  toast.error('Failed to submit — please try again.')
                } finally {
                  setIsSubmittingVerify(false)
                }
              }}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
