import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Brain, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { CITIES } from '../../lib/utils'

const BENEFITS = [
  {
    icon: <Users size={20} />,
    title: 'Meet people around ideas',
    desc: 'Join gatherings built around real conversations — film, philosophy, tech, books, and more.',
  },
  {
    icon: <Brain size={20} />,
    title: 'Matched to your interests',
    desc: 'Tell us what you\'re curious about. We\'ll show you rooms where you already have something to say.',
  },
  {
    icon: <Sparkles size={20} />,
    title: 'Build your community',
    desc: 'From strangers to regulars — Comora gatherings become the friendships you didn\'t know you needed.',
  },
]

export default function Register() {
  const { user, register, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    city: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) navigate('/browse', { replace: true })
  }, [user, navigate])

  function validate() {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required'
    else if (form.fullName.trim().length < 2) errs.fullName = 'Name must be at least 2 characters'

    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'

    if (!form.city) errs.city = 'Please select your city'

    if (!form.password) errs.password = 'Password is required'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'

    if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'

    return errs
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const { error } = await register(form.email.trim(), form.password, {
        full_name: form.fullName.trim(),
        city: form.city,
      })
      if (error) {
        toast.error(error.message || 'Registration failed. Please try again.')
      } else {
        toast.success('Account created! Let\'s set you up.')
        navigate('/onboarding')
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        background: 'var(--bg-base)',
      }}
    >
      {/* Left: Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: '26rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.375rem',
                letterSpacing: '-0.02em',
              }}
            >
              Create your account
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Join Comora — where every meal becomes a story.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Full Name"
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Your full name"
              error={errors.fullName}
              autoComplete="name"
            />

            <Input
              label="Email address"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
              autoComplete="email"
            />

            <Select
              label="Your City"
              name="city"
              value={form.city}
              onChange={handleChange}
              error={errors.city}
            >
              <option value="">Select your city</option>
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </Select>

            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              error={errors.password}
              hint={!errors.password ? 'Use 8+ characters for a strong password' : undefined}
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting || authLoading}
              style={{ marginTop: '0.5rem' }}
            >
              Create Account
            </Button>
          </form>

          <p
            style={{
              textAlign: 'center',
              marginTop: '1.5rem',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
            }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--amber-500)', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Benefits panel — hidden on small screens */}
      <div
        style={{
          display: 'none',
          flex: '0 0 42%',
          background: 'var(--navy-800)',
          padding: '3rem 2.5rem',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
        className="register-panel"
      >
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            top: '-4rem',
            right: '-4rem',
            width: '18rem',
            height: '18rem',
            borderRadius: '50%',
            background: 'rgba(245,158,11,0.08)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-6rem',
            left: '-3rem',
            width: '22rem',
            height: '22rem',
            borderRadius: '50%',
            background: 'rgba(245,158,11,0.05)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '999px',
              padding: '0.375rem 1rem',
              marginBottom: '2rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--amber-500)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Why Comora?
            </span>
          </div>

          <h2
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.25,
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em',
            }}
          >
            Tables that turn strangers into friends
          </h2>
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.65,
              marginBottom: '2.5rem',
            }}
          >
            Comora is where curious people share a meal and leave with a connection. Every seat is earned, every conversation is real.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {BENEFITS.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(245,158,11,0.15)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--amber-500)',
                  }}
                >
                  {b.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                    {b.title}
                  </p>
                  <p style={{ fontSize: '0.84375rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive style injected inline via a <style> tag trick using a hidden element */}
      <style>{`
        @media (min-width: 768px) {
          .register-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
