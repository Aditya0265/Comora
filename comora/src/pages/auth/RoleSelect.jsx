import { Link } from 'react-router-dom'
import { Users, Home } from 'lucide-react'
import Button from '../../components/ui/Button'

export default function RoleSelect() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, var(--comora-cream) 0%, #FAF6F0 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '32rem',
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--comora-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '32px', fontWeight: '700', color: 'white' }}>C</span>
          </div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: '600',
              color: 'var(--comora-charcoal)',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome to Comora
          </h1>
          <p style={{ color: 'var(--comora-grey)', fontSize: '1rem' }}>
            Find your intellectual home
          </p>
        </div>

        {/* Role Selection Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          {/* Host Option */}
          <Link
            to="/auth/host/signup"
            style={{
              display: 'block',
              background: 'var(--comora-orange)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              transition: 'var(--transition)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
              <Home size={24} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  I'm Hosting a Gathering
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                  Create and manage your own intellectual communities
                </div>
              </div>
            </div>
          </Link>

          {/* Attendee Option */}
          <Link
            to="/auth/attendee/signup"
            style={{
              display: 'block',
              background: 'white',
              color: 'var(--comora-navy)',
              padding: '1.5rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              border: '2px solid var(--comora-navy)',
              transition: 'var(--transition)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
              e.currentTarget.style.background = 'var(--comora-navy)'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.color = 'var(--comora-navy)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
              <Users size={24} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  I'm Looking to Attend
                </div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                  Join communities of curious minds
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Tagline */}
        <p style={{ color: 'var(--comora-grey)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Choose how you want to participate in Comora
        </p>

        {/* Sign In Link */}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--comora-orange)',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
