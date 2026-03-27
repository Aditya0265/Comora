import { Link } from 'react-router-dom'
import { ArrowLeft, Users, Lightbulb, MapPin, Heart } from 'lucide-react'

function Section({ icon: Icon, title, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{
          width: '2.25rem', height: '2.25rem',
          borderRadius: 'var(--radius-md)',
          background: '#1E3A5F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={16} color="white" />
        </div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  )
}

export default function About() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem 5rem' }}>

      <Link
        to="/"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          fontSize: '0.85rem', color: 'var(--text-muted)',
          textDecoration: 'none', marginBottom: '2rem',
        }}
      >
        <ArrowLeft size={14} /> Back to home
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            width: '2.75rem', height: '2.75rem',
            borderRadius: '0.625rem',
            background: '#1E3A5F',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>C</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            About Comora
          </h1>
        </div>
        <p style={{
          fontSize: '1.05rem', color: 'var(--text-secondary)',
          lineHeight: 1.7, maxWidth: '600px',
        }}>
          Comora is a platform for agenda-first social gatherings — events built around a topic,
          an idea, or a shared curiosity, not just food or networking.
        </p>
      </div>

      {/* Quote */}
      <blockquote style={{
        borderLeft: '3px solid #1E3A5F',
        paddingLeft: '1.25rem',
        marginBottom: '2.5rem',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        fontSize: '1rem',
        lineHeight: 1.7,
      }}>
        "Food gathers people in a room. Ideas keep them at the table."
      </blockquote>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        <Section icon={Lightbulb} title="The Idea">
          <p>
            Most social events are forgettable — hollow networking, aimless dinners, parties
            where you leave feeling like you wasted your evening.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Comora starts with a different premise: every gathering should have a reason to exist.
            An agenda. A theme. A question worth discussing. When people know why they're in the
            room, the conversation gets interesting fast.
          </p>
        </Section>

        <Section icon={Users} title="How It Works">
          <p>
            Hosts design events with a clear agenda — a book discussion, a philosophy dinner,
            a film debate, a career roundtable. Guests browse events by topic and book a seat.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            Events are small by design — typically 8 to 20 people — so every voice can be heard
            and real connections can form. No stage, no microphone, no spectators. Just a table
            and a conversation.
          </p>
        </Section>

        <Section icon={MapPin} title="Where We're Starting">
          <p>
            Comora is launching in Hyderabad, India — a city full of curious, well-read,
            intellectually restless people who have been waiting for a place to actually talk.
          </p>
          <p style={{ marginTop: '0.75rem' }}>
            We're starting small and local, focusing on quality over scale. A handful of great
            events a week is better than a hundred mediocre ones.
          </p>
        </Section>

        <Section icon={Heart} title="What We Believe">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              'Every city has more interesting people than you think — they just need a room.',
              'The best conversations happen when there is a shared reason to be there.',
              'Small, intentional gatherings change people more than large ones.',
              'Curiosity is something you can build a community around.',
              'The goal is not a better dinner. The goal is a better city.',
            ].map((belief, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.625rem' }}>
                <span style={{ color: '#1E3A5F', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                <span>{belief}</span>
              </li>
            ))}
          </ul>
        </Section>

      </div>

      {/* CTA */}
      <div style={{
        marginTop: '3rem',
        background: '#1E3A5F',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
          Ready to find your table?
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Browse upcoming events in Hyderabad and book your seat.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/browse"
            style={{
              background: 'white',
              color: '#1E3A5F',
              padding: '0.625rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            Discover Events
          </Link>
          <Link
            to="/contact"
            style={{
              background: 'transparent',
              color: 'white',
              padding: '0.625rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.35)',
            }}
          >
            Get in Touch
          </Link>
        </div>
      </div>

    </div>
  )
}
