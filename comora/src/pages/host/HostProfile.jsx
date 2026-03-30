import { useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MapPin, Calendar, Star, Users, ShieldCheck, ArrowLeft,
  MessageCircle, Award, Clock,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import AgendaCard from '../../components/events/AgendaCard'
import { formatDate, formatDateTime, getInitials } from '../../lib/utils'

/* ─── Stat pill ──────────────────────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, accent = false }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.875rem 1.25rem',
      borderRadius: 'var(--radius-lg)',
      background: accent ? 'var(--accent-soft)' : 'var(--bg-subtle)',
      border: '1px solid var(--border)',
      minWidth: '90px',
      flex: '1',
    }}>
      {Icon && <Icon size={16} style={{ color: accent ? 'var(--comora-navy)' : 'var(--text-muted)' }} />}
      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
    </div>
  )
}

/* ─── Rating bar ─────────────────────────────────────────────────────────── */
function RatingBar({ stars, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '1rem', textAlign: 'right', flexShrink: 0 }}>{stars}</span>
      <Star size={11} style={{ color: 'var(--comora-orange)', fill: 'var(--comora-orange)', flexShrink: 0 }} />
      <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--comora-orange)', borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: '2rem', textAlign: 'right', flexShrink: 0 }}>{count}</span>
    </div>
  )
}

/* ─── Review card ────────────────────────────────────────────────────────── */
function ReviewCard({ review }) {
  const rating = review.rating_overall ?? review.overall ?? 0
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.125rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <Avatar src={review.reviewer?.avatar_url} name={review.reviewer?.name} size="sm" />
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{review.reviewer?.name || 'Anonymous'}</p>
            {review.created_at && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(review.created_at)}</p>
            )}
          </div>
        </div>
        {rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={13}
                style={{
                  color: s <= Math.round(rating) ? 'var(--comora-orange)' : 'var(--border)',
                  fill: s <= Math.round(rating) ? 'var(--comora-orange)' : 'var(--border)',
                }}
              />
            ))}
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>
              {Number(rating).toFixed(1)}
            </span>
          </div>
        )}
      </div>
      {review.comment && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{review.comment}</p>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: HOST PROFILE
═══════════════════════════════════════════════════════════════════════════ */
export default function HostProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  /* ── Queries ── */
  const { data: host, isLoading: hostLoading, error: hostError } = useQuery({
    queryKey: ['host-profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })

  const { data: events = [] } = useQuery({
    queryKey: ['host-events', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*, host:profiles!host_id(name, avatar_url, host_verified)')
        .eq('host_id', id)
        .eq('status', 'live')
        .order('date_time')
      return data || []
    },
    enabled: !!id,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['host-reviews', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles(name, avatar_url)')
        .eq('host_id', id)
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(10)
      return data || []
    },
    enabled: !!id,
  })

  /* ── Rating breakdown ── */
  const ratingBreakdown = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      const star = Math.round(r.rating_overall ?? r.overall ?? 0)
      if (star >= 1 && star <= 5) counts[star]++
    })
    return counts
  }, [reviews])

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null
    const sum = reviews.reduce((s, r) => s + (r.rating_overall ?? r.overall ?? 0), 0)
    return (sum / reviews.length).toFixed(1)
  }, [reviews])

  /* ── Loading / error states ── */
  if (hostLoading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Cover skeleton */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', padding: '2rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="skeleton" style={{ height: '1.5rem', width: '200px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '1rem', width: '140px', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    )
  }

  if (hostError || !host) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Host not found</p>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>This profile doesn't exist or may have been removed.</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Go back
        </Button>
      </div>
    )
  }

  const expertiseTags = host.expertise_tags || []
  const memberSinceYear = host.created_at ? new Date(host.created_at).getFullYear() : null

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>

      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.875rem', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* ── Cover section ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative gradient top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
          background: 'linear-gradient(90deg, var(--comora-navy), var(--comora-orange))',
        }} />

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <Avatar
            src={host.avatar_url}
            name={host.name}
            size="2xl"
            verified={host.host_verified}
          />

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{host.name}</h1>
              {host.host_verified && (
                <Badge variant="success">
                  <ShieldCheck size={11} /> Verified Host
                </Badge>
              )}
              {host.verification_level && (
                <Badge variant="primary">{host.verification_level}</Badge>
              )}
            </div>

            {host.city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.875rem' }}>
                <MapPin size={13} />
                {host.city}
              </div>
            )}

            {/* Expertise tags */}
            {expertiseTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {expertiseTags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: 'var(--accent-soft)',
                      color: 'var(--comora-navy)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <StatPill
          icon={CalendarDays}
          label="Events Hosted"
          value={host.events_hosted ?? events.length}
          accent
        />
        <StatPill
          icon={Star}
          label="Avg Rating"
          value={avgRating ?? (host.avg_host_rating ? Number(host.avg_host_rating).toFixed(1) : '—')}
        />
        <StatPill
          icon={MessageCircle}
          label="Reviews"
          value={reviews.length}
        />
        <StatPill
          icon={Award}
          label="Member Since"
          value={memberSinceYear ?? '—'}
        />
      </div>

      {/* ── About ── */}
      {host.bio && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.875rem' }}>
            About {host.name.split(' ')[0]}
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {host.bio}
          </p>
        </div>
      )}

      {/* ── Upcoming gatherings ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Upcoming gatherings by {host.name.split(' ')[0]}
        </h2>
        {events.length === 0
          ? (
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
              <Calendar size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No upcoming events at the moment.</p>
            </div>
          )
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {events.map((ev) => (
                <AgendaCard key={ev.id} event={ev} compact />
              ))}
            </div>
          )
        }
      </div>

      {/* ── Reviews ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            Reviews
            {reviews.length > 0 && (
              <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                ({reviews.length})
              </span>
            )}
          </h2>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Star size={18} style={{ color: 'var(--comora-orange)', fill: 'var(--comora-orange)' }} />
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{avgRating}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 5</span>
            </div>
          )}
        </div>

        {reviews.length === 0
          ? (
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
              <MessageCircle size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reviews yet.</p>
            </div>
          )
          : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>

              {/* Rating breakdown sidebar */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '1.25rem' }}>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Rating Breakdown</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <RatingBar
                      key={s}
                      stars={s}
                      count={ratingBreakdown[s]}
                      total={reviews.length}
                    />
                  ))}
                </div>
              </div>

              {/* Review list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}

/* ─── Missing import fix ─────────────────────────────────────────────────── */
function CalendarDays(props) {
  return <Calendar {...props} />
}
