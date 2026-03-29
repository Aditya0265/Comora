import { Star, Calendar, Users } from 'lucide-react'

export default function HostCredibilityBadge({ eventsHosted, avgRating, memberCount }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '0.75rem',
        color: 'var(--comora-grey)',
      }}
    >
      {eventsHosted && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Calendar size={14} />
          <span>{eventsHosted} events</span>
        </div>
      )}
      {avgRating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Star size={14} fill="var(--comora-orange)" stroke="var(--comora-orange)" />
          <span>{avgRating.toFixed(1)}</span>
        </div>
      )}
      {memberCount && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Users size={14} />
          <span>{memberCount} members</span>
        </div>
      )}
    </div>
  )
}
