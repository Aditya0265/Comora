import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import {
  CATEGORIES,
  DIETARY_PREFERENCES,
  BUDGET_RANGES,
  SOCIAL_COMFORT_LEVELS,
} from '../../utils/constants'

export default function AttendeeSignup() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    fullName: '',
    email: '',
    password: '',
    age: '',

    // Step 2: Interest Discovery
    interests: [],

    // Step 3: Preferences
    dietaryPreferences: [],
    budgetRange: '',
    socialComfort: '',
    city: '',
    availability: [],
  })

  const [errors, setErrors] = useState({})

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function toggleInterest(catId) {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(catId)
        ? prev.interests.filter(id => id !== catId)
        : [...prev.interests, catId]
    }))
  }

  function toggleDietary(dietId) {
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(dietId)
        ? prev.dietaryPreferences.filter(id => id !== dietId)
        : [...prev.dietaryPreferences, dietId]
    }))
  }

  function toggleAvailability(day) {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }))
  }

  function validateStep1() {
    const errs = {}
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required'
    if (!formData.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email'
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters'
    return errs
  }

  function validateStep2() {
    const errs = {}
    if (formData.interests.length < 2) errs.interests = 'Select at least 2 interests'
    return errs
  }

  function validateStep3() {
    const errs = {}
    if (!formData.city.trim()) errs.city = 'City is required'
    return errs
  }

  function handleNext() {
    let errs = {}
    if (step === 1) errs = validateStep1()
    if (step === 2) errs = validateStep2()

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    if (step < 3) {
      setStep(step + 1)
      window.scrollTo(0, 0)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validateStep3()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await register(formData.email, formData.password, {
        full_name: formData.fullName,
        city: formData.city,
        role: 'guest',
        interests: formData.interests,
        dietary_prefs: formData.dietaryPreferences,
        budget_range: formData.budgetRange || 'moderate',
        social_comfort: formData.socialComfort ? Number(formData.socialComfort) : 3,
        // Preferences were collected here — skip MatchMe onboarding
        match_me_completed: formData.interests.length >= 2,
      })

      if (error) {
        toast.error(error.message || 'Registration failed')
      } else {
        toast.success('Welcome to Comora! Start exploring gatherings.')
        navigate('/browse')
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
        background: 'linear-gradient(135deg, var(--comora-cream) 0%, #FAF6F0 100%)',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <Link
            to="/auth/role-select"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--comora-grey)',
              textDecoration: 'none',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
            <ChevronLeft size={16} /> Back to role selection
          </Link>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: '600',
              color: 'var(--comora-charcoal)',
              marginBottom: '0.5rem',
            }}
          >
            Join as an Attendee
          </h1>
          <p style={{ color: 'var(--comora-grey)' }}>
            Step {step} of 3
          </p>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: '4px',
            background: 'var(--comora-beige)',
            borderRadius: '2px',
            marginBottom: '2rem',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'var(--comora-orange)',
              width: `${(step / 3) * 100}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Form Card */}
        <div
          style={{
            background: 'white',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext() }}>
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--comora-charcoal)' }}>
                  Personal Details
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--comora-grey)', marginBottom: '1.5rem' }}>
                  Join communities of curious minds
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder="Your full name"
                  />
                  {errors.fullName && <p style={{ color: '#E74C3C', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.fullName}</p>}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p style={{ color: '#E74C3C', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email}</p>}
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--comora-grey)',
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p style={{ color: '#E74C3C', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Age <span style={{ color: 'var(--comora-grey)', fontWeight: '400' }}>(optional)</span>
                  </label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    placeholder="Your age"
                    min="13"
                    max="120"
                  />
                </div>

                <Button type="submit" style={{ width: '100%', background: 'var(--comora-orange)', color: 'white' }}>
                  Continue to Interests
                </Button>
              </div>
            )}

            {/* Step 2: Interest Discovery */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--comora-charcoal)' }}>
                  What interests you?
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--comora-grey)', marginBottom: '1.5rem' }}>
                  Select everything that resonates with you (minimum 2)
                </p>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const isSelected = formData.interests.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleInterest(cat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          padding: '1rem',
                          border: isSelected
                            ? `2px solid ${cat.color}`
                            : '1px solid var(--comora-beige)',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? `${cat.color}15` : 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: 'var(--radius-sm)',
                            background: `${cat.color}20`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={24} style={{ color: cat.color }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--comora-charcoal)', marginBottom: '0.25rem' }}>
                            {cat.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                            {cat.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: cat.color,
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                            }}
                          >
                            ✓
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {errors.interests && <p style={{ color: '#E74C3C', fontSize: '0.75rem', marginBottom: '1rem' }}>{errors.interests}</p>}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    style={{ flex: 1 }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    style={{ flex: 2, background: 'var(--comora-orange)', color: 'white' }}
                  >
                    Continue to Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Preferences */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--comora-charcoal)' }}>
                  Your Preferences
                </h2>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Dietary Preferences
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {DIETARY_PREFERENCES.map((diet) => (
                      <button
                        key={diet.id}
                        type="button"
                        onClick={() => toggleDietary(diet.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: formData.dietaryPreferences.includes(diet.id)
                            ? '2px solid var(--comora-orange)'
                            : '1px solid var(--comora-beige)',
                          borderRadius: 'var(--radius-full)',
                          background: formData.dietaryPreferences.includes(diet.id)
                            ? '#FFF5F0'
                            : 'white',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--comora-charcoal)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {diet.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Budget Range
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {BUDGET_RANGES.map((budget) => (
                      <label
                        key={budget.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem',
                          border: formData.budgetRange === budget.id
                            ? '2px solid var(--comora-orange)'
                            : '1px solid var(--comora-beige)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          background: formData.budgetRange === budget.id ? '#FFF5F0' : 'white',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="radio"
                          name="budgetRange"
                          value={budget.id}
                          checked={formData.budgetRange === budget.id}
                          onChange={(e) => handleChange('budgetRange', e.target.value)}
                          style={{ marginRight: '0.75rem' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', color: 'var(--comora-charcoal)', marginBottom: '0.25rem' }}>
                            {budget.label}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--comora-grey)' }}>
                            {budget.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Social Comfort Level
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {SOCIAL_COMFORT_LEVELS.map((comfort) => (
                      <label
                        key={comfort.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem',
                          border: formData.socialComfort === comfort.id
                            ? '2px solid var(--comora-orange)'
                            : '1px solid var(--comora-beige)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          background: formData.socialComfort === comfort.id ? '#FFF5F0' : 'white',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="radio"
                          name="socialComfort"
                          value={comfort.id}
                          checked={formData.socialComfort === comfort.id}
                          onChange={(e) => handleChange('socialComfort', e.target.value)}
                          style={{ marginRight: '0.75rem' }}
                        />
                        <span style={{ marginRight: '0.5rem', fontSize: '1.25rem' }}>{comfort.icon}</span>
                        <span style={{ fontWeight: '500', fontSize: '0.875rem', color: 'var(--comora-charcoal)' }}>
                          {comfort.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Location
                  </label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Your city"
                  />
                  {errors.city && <p style={{ color: '#E74C3C', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.city}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Availability
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['weekdays', 'weekends', 'flexible'].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleAvailability(day)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: formData.availability.includes(day)
                            ? '2px solid var(--comora-orange)'
                            : '1px solid var(--comora-beige)',
                          borderRadius: 'var(--radius-full)',
                          background: formData.availability.includes(day)
                            ? '#FFF5F0'
                            : 'white',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'var(--comora-charcoal)',
                          textTransform: 'capitalize',
                          transition: 'all 0.2s',
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    variant="outline"
                    style={{ flex: 1 }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    style={{ flex: 2, background: 'var(--comora-orange)', color: 'white' }}
                  >
                    {submitting ? 'Creating Account...' : 'Finish Onboarding'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
