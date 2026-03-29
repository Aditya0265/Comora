import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Calendar, Clock, MapPin, Users, Star, Share2, ShieldCheck,
  ChevronRight, ArrowLeft, CheckCircle2, AlertCircle, Utensils,
} from 'lucide-react'

import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'

import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  formatDate, formatTime, formatDateTime, formatCurrency,
  AGENDA_TYPES, VIBE_LABELS,
} from '../../lib/utils'

// ─── helpers ────────────────────────────────────────────────────────────────

function VibeDots({ value = 1, max = 5 }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            i < value
              ? 'bg-[var(--navy-800)]'
              : 'bg-[var(--border-strong)]'
          }`}
        />
      ))}
    </div>
  )
}

function RatingBar({ label, value = 0, max = 5 }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--text-secondary)] w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--amber-500)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-[var(--text-primary)] w-6 text-right">
        {value ? Number(value).toFixed(1) : '—'}
      </span>
    </div>
  )
}

function StarRow({ value = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= Math.round(value)
            ? 'text-[var(--amber-500)] fill-[var(--amber-500)]'
            : 'text-[var(--border-strong)]'}
        />
      ))}
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [applyNote, setApplyNote] = useState('')

  // ── fetch event ──────────────────────────────────────────────────────────
  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, host:profiles(id,name,avatar_url,bio,host_verified,avg_rating,total_reviews,expertise_tags)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })

  // ── fetch reviews ────────────────────────────────────────────────────────
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles(name,avatar_url)')
        .eq('event_id', id)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data
    },
  })

  // ── fetch user booking ───────────────────────────────────────────────────
  const { data: booking, refetch: refetchBooking } = useQuery({
    queryKey: ['booking', id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('event_id', id)
        .eq('guest_id', user.id)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data ?? null
    },
  })

  // ── RSVP mutation ────────────────────────────────────────────────────────
  const rsvpMutation = useMutation({
    mutationFn: async ({ status, payment_status }) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          event_id: id,
          guest_id: user.id,
          status,
          payment_status: payment_status ?? (event?.price > 0 ? 'pending' : 'free'),
          amount_paid: event?.price ?? 0,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === 'waitlisted'
          ? 'Added to waitlist!'
          : 'RSVP confirmed!'
      )
      queryClient.invalidateQueries({ queryKey: ['booking', id, user?.id] })
      queryClient.invalidateQueries({ queryKey: ['event', id] })
    },
    onError: (err) => toast.error(err.message || 'Something went wrong'),
  })

  // ── cancel mutation ──────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', booking.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('RSVP cancelled.')
      setCancelModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['booking', id, user?.id] })
      queryClient.invalidateQueries({ queryKey: ['event', id] })
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel'),
  })

  // ── pay confirmation ─────────────────────────────────────────────────────
  const confirmPayMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: 'paid', status: 'confirmed' })
        .eq('id', booking.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Payment confirmed! You're all set.")
      setPayModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['booking', id, user?.id] })
    },
    onError: (err) => toast.error(err.message || 'Payment failed'),
  })

  // ── share ────────────────────────────────────────────────────────────────
  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: event?.title, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  // ── derived state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--navy-800)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle size={40} className="text-[var(--coral-500)]" />
        <p className="text-[var(--text-secondary)]">Event not found.</p>
        <Button variant="outline" onClick={() => navigate('/browse')}>Browse Events</Button>
      </div>
    )
  }

  const agendaInfo = AGENDA_TYPES.find((a) => a.id === event.agenda_type)
  const isFull = (event.current_guests ?? 0) >= (event.max_guests ?? Infinity)
  const spotsLeft = (event.max_guests ?? 0) - (event.current_guests ?? 0)
  const spotsPercent = Math.min(100, Math.round(((event.current_guests ?? 0) / (event.max_guests ?? 1)) * 100))
  const isConfirmed = booking?.status === 'confirmed'
  const isWaitlisted = booking?.status === 'waitlisted'
  const isCancelled = booking?.status === 'cancelled'
  const hasPendingPayment = booking?.payment_status === 'pending' && event.price > 0
  const isRequestMode = event.registration_mode === 'request'
  const isInviteOnly = event.registration_mode === 'invite_only'

  const avgRating = event.avg_overall ?? event.host?.avg_rating ?? null
  const reviewCount = event.review_count ?? event.host?.total_reviews ?? 0

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mb-6">
          <Link to="/browse" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            Browse
          </Link>
          <ChevronRight size={14} />
          <span className="text-[var(--text-secondary)] truncate max-w-xs">{event.title}</span>
        </nav>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ── LEFT: Main content ────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 flex flex-col gap-8">

            {/* Format + topic tag pills */}
            <div className="flex flex-wrap gap-2">
              {agendaInfo && (
                <span className={`${agendaInfo.tagClass} inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium`}>
                  <span>{agendaInfo.icon}</span>
                  <span>{agendaInfo.label}</span>
                </span>
              )}
              {(event.topic_tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-[var(--text-primary)] leading-tight">
              {event.title}
            </h1>

            {/* Host row */}
            <div className="flex items-center gap-3 flex-wrap">
              <Avatar
                src={event.host?.avatar_url}
                name={event.host?.name}
                size="md"
                verified={event.host?.host_verified}
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {event.host?.name}
                  {event.host?.host_verified && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[var(--navy-800)] text-xs font-medium">
                      <ShieldCheck size={13} className="inline" /> Verified Host
                    </span>
                  )}
                </span>
                {(avgRating || reviewCount > 0) && (
                  <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                    <Star size={12} className="text-[var(--amber-500)] fill-[var(--amber-500)]" />
                    {avgRating ? Number(avgRating).toFixed(1) : '—'}
                    {reviewCount > 0 && ` (${reviewCount} review${reviewCount !== 1 ? 's' : ''})`}
                  </span>
                )}
              </div>
            </div>

            {/* Event meta */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.date_time && (
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Date & Time</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{formatDate(event.date_time)}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{formatTime(event.date_time)}</p>
                  </div>
                </div>
              )}
              {event.duration_minutes && (
                <div className="flex items-start gap-3">
                  <Clock size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Duration</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {event.duration_minutes >= 60
                        ? `${event.duration_minutes / 60}h${event.duration_minutes % 60 ? ` ${event.duration_minutes % 60}m` : ''}`
                        : `${event.duration_minutes} min`}
                    </p>
                  </div>
                </div>
              )}
              {(event.venue_city || event.venue_type) && (
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Location</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{event.venue_city}</p>
                    {event.venue_type && (
                      <p className="text-xs text-[var(--text-secondary)] capitalize">{event.venue_type}</p>
                    )}
                  </div>
                </div>
              )}
              {event.max_guests && (
                <div className="flex items-start gap-3">
                  <Users size={16} className="mt-0.5 shrink-0 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-0.5">Group Size</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{event.max_guests} guests max</p>
                    {event.registration_mode && (
                      <p className="text-xs text-[var(--text-secondary)] capitalize">
                        {event.registration_mode === 'open' ? 'Open registration'
                          : event.registration_mode === 'request' ? 'Request to join'
                          : 'Invite only'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* What we'll do */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What we'll do</h2>
              <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </section>

            {/* Vibe indicators */}
            {(event.vibe_structure || event.vibe_energy || event.vibe_expertise) && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Vibe & Atmosphere</h2>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 flex flex-col gap-5">
                  {event.vibe_structure != null && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">Structure</span>
                          <span className="text-xs font-medium text-[var(--text-primary)]">
                            {VIBE_LABELS.structure[event.vibe_structure - 1] ?? ''}
                          </span>
                        </div>
                        <VibeDots value={event.vibe_structure} />
                      </div>
                    </div>
                  )}
                  {event.vibe_energy != null && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">Energy</span>
                          <span className="text-xs font-medium text-[var(--text-primary)]">
                            {VIBE_LABELS.energy[event.vibe_energy - 1] ?? ''}
                          </span>
                        </div>
                        <VibeDots value={event.vibe_energy} />
                      </div>
                    </div>
                  )}
                  {event.vibe_expertise != null && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wide">Expertise</span>
                          <span className="text-xs font-medium text-[var(--text-primary)]">
                            {VIBE_LABELS.expertise[event.vibe_expertise - 1] ?? ''}
                          </span>
                        </div>
                        <VibeDots value={event.vibe_expertise} />
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Food section */}
            {event.cuisine_type && (
              <section>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Utensils size={18} className="text-[var(--text-muted)]" />
                  Food & Drinks
                </h2>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    Cuisine: <span className="font-medium text-[var(--text-primary)]">{event.cuisine_type}</span>
                  </p>
                  {(event.dietary_options ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {event.dietary_options.map((opt) => (
                        <Badge key={opt} variant="success">{opt}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                Reviews
                {reviewCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">({reviewCount})</span>
                )}
              </h2>

              {avgRating && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 mb-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-4xl font-bold text-[var(--text-primary)]">
                      {Number(avgRating).toFixed(1)}
                    </span>
                    <div>
                      <StarRow value={avgRating} />
                      <p className="text-xs text-[var(--text-muted)] mt-1">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <RatingBar label="Agenda Quality" value={event.avg_agenda_quality ?? avgRating} />
                  <RatingBar label="Host Warmth" value={event.avg_host_warmth ?? avgRating} />
                  <RatingBar label="Food Accuracy" value={event.avg_food_accuracy ?? avgRating} />
                  <RatingBar label="Group Vibe" value={event.avg_group_vibe ?? avgRating} />
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] italic">No reviews yet — be the first to attend!</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar
                          src={review.reviewer?.avatar_url}
                          name={review.reviewer?.name}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {review.reviewer?.name}
                          </p>
                          <StarRow value={review.overall_rating ?? review.avg_rating ?? 0} />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* About the Host */}
            <section>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">About the Host</h2>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar
                    src={event.host?.avatar_url}
                    name={event.host?.name}
                    size="xl"
                    verified={event.host?.host_verified}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] text-lg">{event.host?.name}</p>
                    {event.host?.host_verified && (
                      <Badge variant="primary" className="mt-1">
                        <ShieldCheck size={11} />
                        Verified Host
                      </Badge>
                    )}
                    {(event.host?.avg_rating || event.host?.total_reviews) && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                        <Star size={13} className="text-[var(--amber-500)] fill-[var(--amber-500)]" />
                        {event.host?.avg_rating ? Number(event.host.avg_rating).toFixed(1) : '—'}
                        {event.host?.total_reviews > 0 && ` · ${event.host.total_reviews} reviews`}
                      </p>
                    )}
                  </div>
                </div>
                {event.host?.bio && (
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                    {event.host.bio}
                  </p>
                )}
                {(event.host?.expertise_tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.host.expertise_tags.map((tag) => (
                      <Badge key={tag} variant="default">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </main>

          {/* ── RIGHT: Sticky sidebar ──────────────────────────────────────── */}
          <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-6">
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden">

              {/* Price */}
              <div className="px-6 pt-6 pb-4 border-b border-[var(--border)]">
                <p className="text-3xl font-bold text-[var(--text-primary)]">
                  {formatCurrency(event.price)}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">per person</p>
              </div>

              <div className="px-6 py-5 flex flex-col gap-5">

                {/* Seats remaining */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-[var(--text-secondary)]">
                      {spotsLeft > 0
                        ? `${spotsLeft} of ${event.max_guests} spots left`
                        : 'Event is full'}
                    </span>
                    <span className="text-xs font-medium text-[var(--text-primary)]">
                      {event.current_guests ?? 0}/{event.max_guests}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        spotsPercent >= 80 ? 'bg-[var(--coral-500)]' : 'bg-[var(--sage-500)]'
                      }`}
                      style={{ width: `${spotsPercent}%` }}
                    />
                  </div>
                </div>

                {/* Date/time card */}
                <div className="bg-[var(--bg-subtle)] rounded-[var(--radius-md)] p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--navy-800)] flex flex-col items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-semibold uppercase leading-none">
                      {event.date_time ? new Date(event.date_time).toLocaleString('en', { month: 'short' }) : '—'}
                    </span>
                    <span className="text-white text-lg font-bold leading-none">
                      {event.date_time ? new Date(event.date_time).getDate() : '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {event.date_time ? formatDateTime(event.date_time) : '—'}
                    </p>
                    {event.venue_city && (
                      <p className="text-xs text-[var(--text-secondary)]">{event.venue_city}</p>
                    )}
                  </div>
                </div>

                {/* RSVP button logic */}
                {!user ? (
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={() => navigate('/login', { state: { returnTo: `/events/${id}` } })}
                  >
                    Sign in to Book
                  </Button>
                ) : isConfirmed && !isCancelled ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2 py-3 rounded-[var(--radius-md)] bg-[var(--sage-500)]/10 border border-[var(--sage-500)]/30">
                      <CheckCircle2 size={18} className="text-[var(--sage-500)]" />
                      <span className="text-sm font-semibold text-[var(--sage-500)]">You're going! 🎉</span>
                    </div>
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="text-xs text-center text-[var(--text-muted)] hover:text-[var(--coral-500)] transition-colors underline underline-offset-2"
                    >
                      Cancel RSVP
                    </button>
                  </div>
                ) : isWaitlisted ? (
                  <div className="text-center py-3 rounded-[var(--radius-md)] bg-[var(--amber-500)]/10 border border-[var(--amber-500)]/30">
                    <p className="text-sm font-semibold text-[var(--amber-500)]">You're on the waitlist</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">We'll notify you if a spot opens</p>
                  </div>
                ) : isFull ? (
                  <Button
                    variant="warm"
                    fullWidth
                    size="lg"
                    loading={rsvpMutation.isPending}
                    onClick={() => rsvpMutation.mutate({ status: 'waitlisted' })}
                  >
                    Join Waitlist
                  </Button>
                ) : isInviteOnly ? (
                  <div className="text-center py-3 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] border border-[var(--border)]">
                    <p className="text-sm text-[var(--text-secondary)]">Invite only event</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Contact the host to request an invitation</p>
                  </div>
                ) : isRequestMode ? (
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={() => setApplyModalOpen(true)}
                  >
                    Apply to Join
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    loading={rsvpMutation.isPending}
                    onClick={() => {
                      if (event.price > 0) {
                        rsvpMutation.mutate(
                          { status: 'confirmed', payment_status: 'pending' },
                          { onSuccess: () => setPayModalOpen(true) }
                        )
                      } else {
                        rsvpMutation.mutate({ status: 'confirmed', payment_status: 'free' })
                      }
                    }}
                  >
                    Reserve Your Spot
                  </Button>
                )}

                {/* Pending payment prompt */}
                {hasPendingPayment && isConfirmed && (
                  <Button
                    variant="warm"
                    fullWidth
                    onClick={() => setPayModalOpen(true)}
                  >
                    Complete Payment · {formatCurrency(event.price)}
                  </Button>
                )}

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Share2 size={15} />
                  Share this event
                </button>

                {/* Cancellation policy */}
                <p className="text-xs text-[var(--text-muted)] text-center border-t border-[var(--border)] pt-3">
                  {event.cancellation_policy === 'none'
                    ? 'No cancellation policy.'
                    : event.cancellation_policy
                    ? `Cancel up to ${event.cancellation_policy} before the event for a full refund.`
                    : 'Cancellation policy set by host.'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Apply Modal ────────────────────────────────────────────────────── */}
      <Modal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        title="Apply to Join"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            The host reviews all applications. Tell them a bit about yourself and why you'd like to join.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Your message (optional)</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--navy-800)] focus:ring-2 focus:ring-[var(--accent-soft)] resize-y min-h-[100px]"
              placeholder="I'm really interested in this topic because…"
              value={applyNote}
              onChange={(e) => setApplyNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setApplyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={rsvpMutation.isPending}
              onClick={() => {
                rsvpMutation.mutate(
                  { status: 'pending', payment_status: event.price > 0 ? 'pending' : 'free' },
                  { onSuccess: () => setApplyModalOpen(false) }
                )
              }}
            >
              Send Application
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Simulated Payment Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Simulated Payment"
        size="md"
      >
        <div className="flex flex-col gap-5">
          <div className="bg-[var(--bg-subtle)] rounded-[var(--radius-lg)] p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Event</span>
              <span className="text-sm font-medium text-[var(--text-primary)] text-right max-w-[60%] truncate">
                {event.title}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 mt-1">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Total</span>
              <span className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(event.price)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">Card number</label>
              <input
                className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--navy-800)]"
                placeholder="4242 4242 4242 4242"
                disabled
                defaultValue="4242 4242 4242 4242"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-medium text-[var(--text-primary)]">Expiry</label>
                <input
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none"
                  placeholder="12/28"
                  disabled
                  defaultValue="12/28"
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-sm font-medium text-[var(--text-primary)]">CVV</label>
                <input
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] focus:outline-none"
                  placeholder="123"
                  disabled
                  defaultValue="123"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
              <ShieldCheck size={12} /> This is a simulated payment. No real charge will be made.
            </p>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="secondary" onClick={() => setPayModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={confirmPayMutation.isPending}
              onClick={() => confirmPayMutation.mutate()}
            >
              Confirm & Pay {formatCurrency(event.price)}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Cancel RSVP Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel RSVP?"
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to cancel your spot at <strong>{event.title}</strong>? This action cannot be undone.
          </p>
          {event.cancellation_policy && event.cancellation_policy !== 'none' && (
            <div className="bg-[var(--amber-500)]/10 border border-[var(--amber-500)]/30 rounded-[var(--radius-md)] p-3">
              <p className="text-xs text-[var(--amber-500)] font-medium">
                Cancellation policy: {event.cancellation_policy}
              </p>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-1">
            <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>Keep RSVP</Button>
            <Button
              variant="danger"
              loading={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate()}
            >
              Cancel RSVP
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
