import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Star, ArrowRight } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import { formatDateTime, formatCurrency, truncate, AGENDA_TYPES } from '../../lib/utils'

function AgendaCard({ event, compact = false }) {
  if (!event) return null

  const {
    id,
    title,
    description,
    agenda_type,
    topic_tags = [],
    vibe_tags = [],
    date_time,
    duration_minutes,
    venue_city,
    max_guests,
    current_guests,
    price,
    registration_mode,
    status,
    avg_overall,
    review_count,
    host = {},
  } = event

  const agendaInfo = AGENDA_TYPES.find((a) => a.id === agenda_type)
  const isFull = current_guests >= max_guests
  const isLive = status === 'live'
  const visibleVibes = vibe_tags.slice(0, 3)
  const visibleTopics = topic_tags.slice(0, 2)

  /* Map vibe tag strings to tag-* CSS classes */
  function vibeTagClass(tag) {
    const t = tag?.toLowerCase()
    if (t?.includes('quiet'))      return 'tag-quiet'
    if (t?.includes('lively'))     return 'tag-lively'
    if (t?.includes('structured')) return 'tag-structured'
    if (t?.includes('freeform'))   return 'tag-freeform'
    if (t?.includes('beginner'))   return 'tag-beginner'
    if (t?.includes('expert'))     return 'tag-expert'
    if (t?.includes('discussion')) return 'tag-discussion'
    if (t?.includes('workshop'))   return 'tag-workshop'
    if (t?.includes('screening'))  return 'tag-screening'
    if (t?.includes('network'))    return 'tag-networking'
    if (t?.includes('debate'))     return 'tag-debate'
    if (t?.includes('tasting'))    return 'tag-tasting'
    return 'tag-discussion'
  }

  return (
    <Link
      to={`/events/${id}`}
      className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--comora-navy)] focus-visible:ring-offset-2 rounded-[var(--radius-xl)]"
    >
      <article className="card-hover rounded-[var(--radius-xl)] overflow-hidden flex flex-col h-full">

        {/* ── TOP ── */}
        <div className="p-4 pb-3 flex flex-col gap-2">

          {/* Format tag + live indicator row */}
          <div className="flex items-center gap-2 flex-wrap">
            {agendaInfo && (
              <span className={`${agendaInfo.tagClass} inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                <span>{agendaInfo.icon}</span>
                <span>{agendaInfo.label}</span>
              </span>
            )}
            {isLive && (
              <Badge variant="live" dot>Live</Badge>
            )}
            {isFull && (
              <Badge variant="warm">Waitlist Available</Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[var(--text-primary)] font-semibold text-base leading-snug group-hover:text-[var(--comora-navy)] transition-colors">
            {truncate(title, 60)}
          </h3>

          {/* Description — hidden in compact */}
          {!compact && description && (
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed line-clamp-2">
              {truncate(description, 100)}
            </p>
          )}
        </div>

        {/* ── MIDDLE ── */}
        <div className="px-4 pb-3 flex flex-col gap-3">

          {/* Info rows */}
          <div className="flex flex-col gap-1.5">
            {date_time && (
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
                <Calendar size={13} className="shrink-0 text-[var(--text-muted)]" />
                <span>{formatDateTime(date_time)}</span>
                {duration_minutes && (
                  <span className="text-[var(--text-muted)]">· {duration_minutes} min</span>
                )}
              </div>
            )}
            {venue_city && (
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
                <MapPin size={13} className="shrink-0 text-[var(--text-muted)]" />
                <span>{venue_city}</span>
              </div>
            )}
            {max_guests != null && (
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
                <Users size={13} className="shrink-0 text-[var(--text-muted)]" />
                <span>
                  <span className={isFull ? 'text-[var(--comora-orange)] font-medium' : ''}>
                    {current_guests ?? 0}
                  </span>
                  {' / '}{max_guests} spots
                </span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)]" />

          {/* What we'll do + vibe tags */}
          {visibleVibes.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[var(--text-muted)] text-[11px] font-semibold uppercase tracking-wide">
                What we'll do
              </span>
              <div className="flex flex-wrap gap-1.5">
                {visibleVibes.map((tag) => (
                  <span
                    key={tag}
                    className={`${vibeTagClass(tag)} inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Topic tags */}
          {visibleTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {visibleTopics.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── BOTTOM ── */}
        <div className="mt-auto px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-between gap-3">

          {/* Host info */}
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              src={host.avatar_url}
              name={host.name}
              size="sm"
              verified={host.host_verified}
            />
            <span className="text-[var(--text-secondary)] text-xs font-medium truncate">
              {host.name}
            </span>
          </div>

          {/* Right side: rating + price + mode */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Rating */}
            {avg_overall != null && (
              <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <Star size={12} className="text-[var(--comora-orange)] fill-[var(--comora-orange)]" />
                <span className="font-medium">{Number(avg_overall).toFixed(1)}</span>
                {review_count > 0 && (
                  <span className="text-[var(--text-muted)]">({review_count})</span>
                )}
              </div>
            )}

            {/* Registration mode badge */}
            {registration_mode && registration_mode !== 'open' && (
              <Badge variant="default" className="text-[10px]">
                {registration_mode === 'request' ? 'Request to Join' : 'Invite Only'}
              </Badge>
            )}

            {/* Price */}
            <span className={`text-xs font-semibold ${price && price > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--sage-500)]'}`}>
              {formatCurrency(price)}
            </span>

            {/* CTA arrow */}
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--comora-navy)] group-hover:gap-1.5 transition-all">
              View <ArrowRight size={12} />
            </span>
          </div>
        </div>

      </article>
    </Link>
  )
}

export default AgendaCard
