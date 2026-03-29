import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function Login() {
  const { user, login, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (user) navigate('/browse', { replace: true })
  }, [user, navigate])

  function validate() {
    const errs = {}
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.password) errs.password = 'Password is required'
    return errs
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    if (serverError) setServerError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setServerError('')
    try {
      const { error } = await login(form.email.trim(), form.password)
      if (error) {
        setServerError(error.message || 'Invalid email or password')
      } else {
        toast.success('Welcome back!')
        navigate('/browse')
      }
    } catch (err) {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
          maxWidth: '28rem',
          background: 'white',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--comora-beige)',
          padding: '2.5rem 2rem',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', textDecoration: 'none' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--comora-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>C</span>
            </div>
            <span style={{ color: 'var(--comora-charcoal)', fontWeight: 700, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>Comora</span>
          </Link>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--comora-charcoal)',
              marginBottom: '0.25rem',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
            Sign in to your Comora account
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <div
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#ef4444',
              fontSize: '0.875rem',
            }}
          >
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

          <div style={{ position: 'relative' }}>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              error={errors.password}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: errors.password ? 'calc(50% - 10px)' : '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: '0.25rem',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting || authLoading}
            style={{ marginTop: '0.5rem' }}
          >
            Sign In
          </Button>
        </form>

        {/* Footer link */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--comora-grey)',
          }}
        >
          Don't have an account?{' '}
          <Link
            to="/auth/role-select"
            style={{ color: 'var(--comora-orange)', fontWeight: 600, textDecoration: 'none' }}
          >
            Create one
          </Link>
        </p>
      </div>

      {/* Quote */}
      <p
        style={{
          marginTop: '2rem',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          maxWidth: '28rem',
          fontStyle: 'italic',
          lineHeight: 1.6,
        }}
      >
        "Food gathers people in a room. Ideas keep them at the table."
      </p>
    </div>
  )
}
