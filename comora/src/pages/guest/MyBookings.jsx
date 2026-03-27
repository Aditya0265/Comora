import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Calendar, MapPin, Star, AlertCircle, ClipboardList,
} from 'lucide-react'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'

import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { formatDateTime, formatCurrency, AGENDA_TYPES } from '../../lib/utils'

// ─── constants ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'upcoming',   label: 'Upcoming' },
  { id: 'past',       label: 'Past' },
  { id: 'waitlisted', label: 'Waitlisted' },
  { id: 'cancelled',  label: 'Cancelled' },
]

const RATING_AXES = [
  { key: 'agenda_quality', label: 'Agenda Quality' },
  { key: 'host_warmth',    label: 'Host Warmth' },
  { key: 'food_accuracy',  label: 'Food & Accuracy' },
  { key: 'group_vibe',     label: 'Group Vibe' },
]

// ─── helpers ────────────────────────────────────────────────────────────────

function StarPicker({ value = 0, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${s} star${s !== 1 ? 's' : ''}`}
        >
          <Star
            size={22}
            className={
              s <= value
                ? 'text-[var(--amber-500)] fill-[var(--amber-500)]'
                : 'text-[var(--border-strong)]'
            }
          />
        </button>
      ))}
    </div>
  )
}

function statusBadgeVariant(status) {
  const map = {
    confirmed:  'confirmed',
    waitlisted: 'waitlisted',
    cancelled:  'cancelled',
    attended:   'attended',
    pending:    'pending',
  }
  return map[status] ?? 'default'
}

function statusLabel(status) {
  const map = {
    confirmed:  'Confirmed',
    waitlisted: 'Waitlisted',
    cancelled:  'Cancelled',
    attended:   'Attended',
    pending:    'Pending',
  }
  return map[status] ?? status
}

function isPast(dateTime) {
  return dateTime ? new Date(dateTime) < new Date() : false
}

// ─── main component ──────────────────────────────────────────────────────────

export default function MyBookings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('upcoming')
  const [cancelTarget, setCancelTarget] = useState(null)   // booking obj
  const [reviewTarget, setReviewTarget] = useState(null)   // booking obj
  const [ratings, setRatings] = useState({
    agenda_quality: 0,
    host_warmth:    0,
    food_accuracy:  0,
    group_vibe:     0,
  })
  const [comment, setComment] = useState('')

  // ── fetch bookings ───────────────────────────────────────────────────────
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, event:events(id,title,agenda_type,topic_tags,date_time,venue_city,price,host:profiles(name,avatar_url,host_verified))')
        .eq('guest_id', user.id)
        .order('booked_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  // ── cancel mutation ──────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: async (bookingId) => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('RSVP cancelled.')
      setCancelTarget(null)
      queryClient.invalidateQueries({ queryKey: ['my-bookings', user?.id] })
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel'),
  })

  // ── review mutation ──────────────────────────────────────────────────────
  const reviewMutation = useMutation({
    mutationFn: async () => {
      const overall = Math.round(
        (ratings.agenda_quality + ratings.host_warmth + ratings.food_accuracy + ratings.group_vibe) / 4
      )
      const { error } = await supabase
        .from('reviews')
        .insert({
          event_id:         reviewTarget.event_id,
          reviewer_id:      user.id,
          booking_id:       reviewTarget.id,
          agenda_quality:   ratings.agenda_quality,
          host_warmth:      ratings.host_warmth,
          food_accuracy:    ratings.food_accuracy,
          group_vibe:       ratings.group_vibe,
          overall_rating:   overall,
          comment,
          is_visible:       true,
        })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Review submitted — thank you!')
      setReviewTarget(null)
      setRatings({ agenda_quality: 0, host_warmth: 0, food_accuracy: 0, group_vibe: 0 })
      setComment('')
      queryClient.invalidateQueries({ queryKey: ['my-bookings', user?.id] })
    },
    onError: (err) => toast.error(err.message || 'Failed to submit review'),
  })

  // ── filter bookings by tab ───────────────────────────────────────────────
  const filtered = bookings.filter((b) => {
    const past = isPast(b.event?.date_time)
    if (activeTab === 'upcoming')   return b.status === 'confirmed' && !past
    if (activeTab === 'past')       return (b.status === 'confirmed' || b.status === 'attended') && past
    if (activeTab === 'waitlisted') return b.status === 'waitlisted'
    if (activeTab === 'cancelled')  return b.status === 'cancelled'
    return false
  })

  // ── tab counts ───────────────────────────────────────────────────────────
  const counts = {
    upcoming:   bookings.filter((b) => b.status === 'confirmed' && !isPast(b.event?.date_time)).length,
    past:       bookings.filter((b) => (b.status === 'confirmed' || b.status === 'attended') && isPast(b.event?.date_time)).length,
    waitlisted: bookings.filter((b) => b.status === 'waitlisted').length,
    cancelled:  bookings.filter((b) => b.status === 'cancelled').length,
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">My Gatherings</h1>
          <p className="text-[var(--text-secondary)] mt-1.5">
            Track your upcoming events, past experiences, and waitlists.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] rounded-[var(--radius-lg)] p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-md)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-[var(--navy-800)] text-white'
                    : 'bg-[var(--border)] text-[var(--text-muted)]'
                }`}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--navy-800)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Booking cards */}
        {!isLoading && (
          <div className="flex flex-col gap-4">
            {filtered.length === 0 ? (
              <EmptyState tab={activeTab} onBrowse={() => navigate('/browse')} />
            ) : (
              filtered.map((booking) => {
                const event = booking.event
                const agendaInfo = AGENDA_TYPES.find((a) => a.id === event?.agenda_type)
                const past = isPast(event?.date_time)

                return (
                  <div
                    key={booking.id}
                    className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden transition-opacity ${
                      booking.status === 'cancelled' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="p-5 flex flex-col sm:flex-row gap-4">

                      {/* Left: event info */}
                      <div className="flex-1 min-w-0 flex flex-col gap-2">

                        {/* Format tag + status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {agendaInfo && (
                            <span className={`${agendaInfo.tagClass} inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                              <span>{agendaInfo.icon}</span>
                              <span>{agendaInfo.label}</span>
                            </span>
                          )}
                          <Badge variant={statusBadgeVariant(booking.status)}>
                            {statusLabel(booking.status)}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-semibold text-[var(--text-primary)] leading-snug">
                          {event?.title ?? 'Unknown event'}
                        </h3>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]">
                          {event?.date_time && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-[var(--text-muted)]" />
                              {formatDateTime(event.date_time)}
                            </span>
                          )}
                          {event?.venue_city && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-[var(--text-muted)]" />
                              {event.venue_city}
                            </span>
                          )}
                        </div>

                        {/* Host row */}
                        {event?.host && (
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar
                              src={event.host.avatar_url}
                              name={event.host.name}
                              size="xs"
                              verified={event.host.host_verified}
                            />
                            <span className="text-xs text-[var(--text-secondary)]">by {event.host.name}</span>
                          </div>
                        )}

                        {/* Waitlist position */}
                        {booking.status === 'waitlisted' && booking.waitlist_position && (
                          <p className="text-xs font-medium text-[var(--amber-500)]">
                            On Waitlist — Position #{booking.waitlist_position}
                          </p>
                        )}
                      </div>

                      {/* Right: price + actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {formatCurrency(event?.price)}
                        </span>

                        <div className="flex flex-col gap-2 items-end">
                          {/* Upcoming confirmed */}
                          {activeTab === 'upcoming' && booking.status === 'confirmed' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/events/${event?.id}`)}
                              >
                                View Event
                              </Button>
                              <button
                                onClick={() => setCancelTarget(booking)}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--coral-500)] transition-colors underline underline-offset-2"
                              >
                                Cancel RSVP
                              </button>
                            </>
                          )}

                          {/* Past attended */}
                          {activeTab === 'past' && (past || booking.status === 'attended') && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setReviewTarget(booking)
                                setRatings({ agenda_quality: 0, host_warmth: 0, food_accuracy: 0, group_vibe: 0 })
                                setComment('')
                              }}
                            >
                              <Star size={13} />
                              Leave Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* ── Cancel Confirm Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel RSVP?"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to cancel your spot at{' '}
            <strong>{cancelTarget?.event?.title}</strong>?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>Keep RSVP</Button>
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate(cancelTarget.id)}
            >
              Yes, Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Rating Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title="Leave a Review"
        size="md"
      >
        <div className="flex flex-col gap-5">
          {reviewTarget?.event?.title && (
            <p className="text-sm text-[var(--text-secondary)]">
              Reviewing: <strong className="text-[var(--text-primary)]">{reviewTarget.event.title}</strong>
            </p>
          )}

          {/* Star axes */}
          <div className="flex flex-col gap-4">
            {RATING_AXES.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-[var(--text-primary)] w-36 shrink-0">{label}</span>
                <StarPicker
                  value={ratings[key]}
                  onChange={(val) => setRatings((prev) => ({ ...prev, [key]: val }))}
                />
              </div>
            ))}
          </div>

          {/* Overall preview */}
          {Object.values(ratings).some((v) => v > 0) && (
            <div className="flex items-center gap-2 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] px-4 py-2.5">
              <Star size={14} className="text-[var(--amber-500)] fill-[var(--amber-500)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Overall:{' '}
                {(
                  Object.values(ratings).reduce((a, b) => a + b, 0) /
                  Object.values(ratings).filter((v) => v > 0).length
                ).toFixed(1)}
              </span>
            </div>
          )}

          {/* Comment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Your thoughts (optional)</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--navy-800)] focus:ring-2 focus:ring-[var(--accent-soft)] resize-y min-h-[100px]"
              placeholder="Share what you enjoyed about this gathering…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>Cancel</Button>
            <Button
              variant="primary"
              loading={reviewMutation.isPending}
              disabled={Object.values(ratings).every((v) => v === 0)}
              onClick={() => reviewMutation.mutate()}
            >
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ tab, onBrowse }) {
  const messages = {
    upcoming:   { icon: <Calendar size={36} />, title: 'No upcoming events', sub: 'Browse events and reserve your spot!' },
    past:       { icon: <ClipboardList size={36} />, title: 'No past events yet', sub: 'Your attended events will appear here.' },
    waitlisted: { icon: <AlertCircle size={36} />, title: 'Not on any waitlists', sub: 'Join full events to get on a waitlist.' },
    cancelled:  { icon: <AlertCircle size={36} />, title: 'No cancelled bookings', sub: 'Great — nothing cancelled!' },
  }
  const { icon, title, sub } = messages[tab] ?? messages.upcoming

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="text-[var(--text-muted)]">{icon}</div>
      <div>
        <p className="font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">{sub}</p>
      </div>
      {tab === 'upcoming' && (
        <Button variant="primary" onClick={onBrowse}>Browse Events</Button>
      )}
    </div>
  )
}
