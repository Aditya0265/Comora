import { Link } from 'react-router-dom'
import { Calendar, Users, MapPin } from 'lucide-react'
import CategoryBadge from './ui/CategoryBadge'
import { getCategoryColor } from '../utils/constants'

export default function GatheringCard({ gathering }) {
  const {
    id,
    title,
    description,
    category,
    host,
    memberCount = 0,
    nextEvent,
    location,
  } = gathering

  const categoryColor = getCategoryColor(category)

  return (
    <Link
      to={`/gathering/${id}`}
      style={{
        display: 'block',
        background: 'white',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--comora-beige)',
        borderTop: `3px solid ${categoryColor}`,
        padding: '1.25rem',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.borderTopColor = categoryColor
        e.currentTarget.style.borderTopWidth = '4px'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        e.currentTarget.style.borderTopWidth = '3px'
      }}
    >
      {/* Category Badge */}
      <div style={{ marginBottom: '0.75rem' }}>
        <CategoryBadge categoryId={category} size="sm" />
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: 'var(--comora-charcoal)',
          marginBottom: '0.5rem',
          lineHeight: '1.4',
        }}
      >
        {title}
      </h3>

      {/* Host Info */}
      {host && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          {host.avatar ? (
            <img
              src={host.avatar}
              alt={host.name}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--comora-navy)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}
            >
              {host.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
            {host.name}
          </span>
        </div>
      )}

      {/* Member Count */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          marginBottom: '0.75rem',
          fontSize: '0.875rem',
          color: 'var(--comora-grey)',
        }}
      >
        <Users size={16} />
        <span>{memberCount} members</span>
      </div>

      {/* Next Event */}
      {nextEvent && (
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--comora-cream)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '0.75rem',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: 'var(--comora-grey)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
            }}
          >
            Next Event
          </div>
          <div
            style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--comora-charcoal)',
              marginBottom: '0.25rem',
            }}
          >
            {nextEvent.title}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              color: 'var(--comora-grey)',
            }}
          >
            <Calendar size={12} />
            <span>{nextEvent.date}</span>
          </div>
        </div>
      )}

      {/* Description */}
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--comora-grey)',
          lineHeight: '1.5',
          marginBottom: '0.75rem',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {description}
      </p>

      {/* Location */}
      {location && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.75rem',
            color: 'var(--comora-grey)',
          }}
        >
          <MapPin size={12} />
          <span>{location}</span>
        </div>
      )}

      {/* CTA */}
      <div
        style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--comora-beige)',
        }}
      >
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--comora-orange)',
          }}
        >
          Learn More →
        </span>
      </div>
    </Link>
  )
}
