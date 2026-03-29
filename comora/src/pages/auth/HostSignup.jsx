import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Upload, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { CATEGORIES, HOSTING_EXPERIENCE, HOSTING_STYLES, DIETARY_PREFERENCES } from '../../utils/constants'

export default function HostSignup() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1: Host Details
    fullName: '',
    email: '',
    password: '',
    phone: '',
    bio: '',

    // Step 2: Hosting Profile
    profilePhoto: null,
    city: '',
    hostingExperience: '',

    // Step 3: Hosting Preferences
    categories: [],
    groupSizeMin: 4,
    groupSizeMax: 12,
    hostingStyle: '',
    dietaryAccommodations: [],
  })

  const [errors, setErrors] = useState({})

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function toggleCategory(catId) {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(catId)
        ? prev.categories.filter(id => id !== catId)
        : [...prev.categories, catId]
    }))
  }

  function toggleDietary(dietId) {
    setFormData(prev => ({
      ...prev,
      dietaryAccommodations: prev.dietaryAccommodations.includes(dietId)
        ? prev.dietaryAccommodations.filter(id => id !== dietId)
        : [...prev.dietaryAccommodations, dietId]
    }))
  }

  function validateStep1() {
    const errs = {}
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required'
    if (!formData.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email'
    if (!formData.password) errs.password = 'Password is required'
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (!formData.bio.trim()) errs.bio = 'Bio is required'
    else if (formData.bio.length > 160) errs.bio = 'Bio must be under 160 characters'
    return errs
  }

  function validateStep2() {
    const errs = {}
    if (!formData.city.trim()) errs.city = 'City is required'
    if (!formData.hostingExperience) errs.hostingExperience = 'Hosting experience is required'
    return errs
  }

  function validateStep3() {
    const errs = {}
    if (formData.categories.length === 0) errs.categories = 'Select at least one gathering type'
    if (!formData.hostingStyle) errs.hostingStyle = 'Select a hosting style'
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
        role: 'host',
        bio: formData.bio,
        phone: formData.phone,
        hosting_experience: formData.hostingExperience,
        categories: formData.categories,
        group_size_min: formData.groupSizeMin,
        group_size_max: formData.groupSizeMax,
        hosting_style: formData.hostingStyle,
        dietary_accommodations: formData.dietaryAccommodations,
      })

      if (error) {
        toast.error(error.message || 'Registration failed')
      } else {
        toast.success('Welcome to Comora! Your host account is ready.')
        navigate('/host/dashboard')
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
            Become a Host
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
            {/* Step 1: Host Details */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--comora-charcoal)' }}>
                  Host Details
                </h2>

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

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Phone Number <span style={{ color: 'var(--comora-grey)', fontWeight: '400' }}>(optional)</span>
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 "
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    About You <span style={{ color: 'var(--comora-grey)', fontSize: '0.75rem' }}>(max 160 chars)</span>
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Tell attendees who you are and what you bring to the table."
                    maxLength={160}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--comora-beige)',
                      fontSize: '0.875rem',
                      fontFamily: 'Inter, sans-serif',
                      minHeight: '80px',
                      resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                    {errors.bio ? (
                      <p style={{ color: '#E74C3C', fontSize: '0.75rem' }}>{errors.bio}</p>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--comora-grey)' }}>
                        {formData.bio.length}/160
                      </span>
                    )}
                  </div>
                </div>

                <Button type="submit" style={{ width: '100%', background: 'var(--comora-orange)', color: 'white' }}>
                  Continue to Profile Setup
                </Button>
              </div>
            )}

            {/* Step 2: Hosting Profile */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--comora-charcoal)' }}>
                  Hosting Profile Setup
                </h2>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Profile Photo <span style={{ color: 'var(--comora-grey)', fontWeight: '400' }}>(optional)</span>
                  </label>
                  <div
                    style={{
                      border: '2px dashed var(--comora-beige)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Upload size={32} style={{ margin: '0 auto', color: 'var(--comora-grey)', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                      Click to upload or drag and drop
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Preferred Location
                  </label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="City or region"
                  />
                  {errors.city && <p style={{ color: '#E74C3C', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.city}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Hosting Experience Level
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {HOSTING_EXPERIENCE.map((level) => (
                      <label
                        key={level.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '1rem',
                          border: formData.hostingExperience === level.id
                            ? '2px solid var(--comora-orange)'
                            : '1px solid var(--comora-beige)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          background: formData.hostingExperience === level.id ? '#FFF5F0' : 'white',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="radio"
                          name="hostingExperience"
                          value={level.id}
                          checked={formData.hostingExperience === level.id}
                          onChange={(e) => handleChange('hostingExperience', e.target.value)}
                          style={{ marginRight: '0.75rem' }}
                        />
                        <div>
                          <div style={{ fontWeight: '500', color: 'var(--comora-charcoal)', marginBottom: '0.25rem' }}>
                            {level.label}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--comora-grey)' }}>
                            {level.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.hostingExperience && <p style={{ color: '#E74C3C', fontSize: '0.75rem', marginTop: '0.5rem' }}>{errors.hostingExperience}</p>}
                </div>

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

            {/* Step 3: Hosting Preferences */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--comora-charcoal)' }}>
                  Hosting Preferences
                </h2>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Which gathering types do you host?
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem',
                            border: formData.categories.includes(cat.id)
                              ? `2px solid ${cat.color}`
                              : '1px solid var(--comora-beige)',
                            borderRadius: 'var(--radius-sm)',
                            background: formData.categories.includes(cat.id)
                              ? `${cat.color}15`
                              : 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                          }}
                        >
                          <Icon size={18} style={{ color: cat.color }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                            {cat.name.split(' & ')[0]}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  {errors.categories && <p style={{ color: '#E74C3C', fontSize: '0.75rem', marginTop: '0.5rem' }}>{errors.categories}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Expected Group Size: {formData.groupSizeMin} - {formData.groupSizeMax} people
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--comora-grey)', marginBottom: '0.25rem', display: 'block' }}>
                        Min
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="20"
                        value={formData.groupSizeMin}
                        onChange={(e) => handleChange('groupSizeMin', parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--comora-grey)', marginBottom: '0.25rem', display: 'block' }}>
                        Max
                      </label>
                      <input
                        type="range"
                        min="4"
                        max="50"
                        value={formData.groupSizeMax}
                        onChange={(e) => handleChange('groupSizeMax', parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Hosting Style
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {HOSTING_STYLES.map((style) => (
                      <label
                        key={style.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.75rem',
                          border: formData.hostingStyle === style.id
                            ? '2px solid var(--comora-orange)'
                            : '1px solid var(--comora-beige)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          background: formData.hostingStyle === style.id ? '#FFF5F0' : 'white',
                          transition: 'all 0.2s',
                        }}
                      >
                        <input
                          type="radio"
                          name="hostingStyle"
                          value={style.id}
                          checked={formData.hostingStyle === style.id}
                          onChange={(e) => handleChange('hostingStyle', e.target.value)}
                          style={{ marginRight: '0.75rem' }}
                        />
                        <span style={{ fontWeight: '500', fontSize: '0.875rem', color: 'var(--comora-charcoal)' }}>
                          {style.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.hostingStyle && <p style={{ color: '#E74C3C', fontSize: '0.75rem', marginTop: '0.5rem' }}>{errors.hostingStyle}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--comora-charcoal)' }}>
                    Dietary Accommodations
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {DIETARY_PREFERENCES.map((diet) => (
                      <button
                        key={diet.id}
                        type="button"
                        onClick={() => toggleDietary(diet.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          border: formData.dietaryAccommodations.includes(diet.id)
                            ? '2px solid var(--comora-orange)'
                            : '1px solid var(--comora-beige)',
                          borderRadius: 'var(--radius-full)',
                          background: formData.dietaryAccommodations.includes(diet.id)
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
                    {submitting ? 'Creating Account...' : 'Complete Setup'}
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
