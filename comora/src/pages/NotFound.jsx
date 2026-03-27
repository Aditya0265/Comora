import { Link, useNavigate } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {/* Large 404 numeral */}
        <div
          style={{
            fontSize: 'clamp(5rem, 20vw, 8rem)',
            fontWeight: 900,
            color: 'var(--navy-800)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            marginBottom: '0.25rem',
            userSelect: 'none',
          }}
        >
          404
        </div>

        {/* Decorative divider */}
        <div
          style={{
            width: '3rem',
            height: '4px',
            borderRadius: '2px',
            background: 'var(--amber-500)',
            margin: '0 auto 1.5rem',
          }}
        />

        {/* Heading */}
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
          }}
        >
          Page not found
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '2rem',
          }}
        >
          The page you're looking for doesn't exist or may have been moved.
          Let's get you back to something good.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Button
            as={Link}
            to="/"
            variant="primary"
            size="lg"
            onClick={() => navigate('/')}
          >
            <Home size={16} />
            Go Home
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/browse')}
          >
            <Search size={16} />
            Browse Events
          </Button>
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '1.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            transition: 'color 0.15s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={14} />
          Go back
        </button>
      </div>
    </div>
  )
}
