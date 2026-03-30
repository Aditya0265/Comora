import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Check, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import { INTEREST_CATEGORIES, SOCIAL_COMFORT, DIETARY_OPTIONS, CITIES } from '../../lib/utils'

const TOTAL_STEPS = 6

const GROUP_SIZE_OPTIONS = [
  { label: '2–4', sublabel: 'Very intimate', min: 2, max: 4 },
  { label: '4–8', sublabel: 'Small group', min: 4, max: 8 },
  { label: '8–12', sublabel: 'Medium gathering', min: 8, max: 12 },
  { label: '12+', sublabel: 'Big table energy', min: 12, max: 99 },
]

const BUDGET_OPTIONS = [
  { id: 'free',     label: 'Free',     sublabel: 'Community events', emoji: '🎁' },
  { id: 'low',      label: 'Low',      sublabel: '₹100 – ₹300',      emoji: '🪙' },
  { id: 'moderate', label: 'Moderate', sublabel: '₹300 – ₹600',      emoji: '💰' },
  { id: 'high',     label: 'High',     sublabel: '₹600+',             emoji: '✨' },
]

const STEP_META = [
  { heading: 'What are you into?',             sub: "Pick at least 2 interests. We'll find people who share your curiosity." },
  { heading: 'How social are you?',            sub: "Be honest — there's no wrong answer here." },
  { heading: 'How large should your table be?', sub: 'Different sizes create different conversations.' },
  { heading: 'Any dietary preferences?',       sub: 'Select everything that applies to you.' },
  { heading: "What's your budget comfort?",    sub: "We'll match you to events within your range." },
  { heading: 'One last thing — your city',     sub: "We'll show you tables close to home." },
]

function ProgressBar({ step }) {
  const pct = Math.round((step / TOTAL_STEPS) * 100)
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div
        className="progress-bar"
        style={{
          height: '4px',
          borderRadius: '999px',
          background: 'var(--border)',
          overflow: 'hidden',
        }}
      >
        <div
          className="progress-fill"
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--comora-orange)',
            borderRadius: '999px',
            transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  )
}

function StepWrapper({ children, visible }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  )
}

/* ── Step 1: Interests ───────────────────────────────────────────── */
function StepInterests({ value, onChange }) {
  function toggle(id) {
    onChange(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))',
        gap: '0.75rem',
      }}
    >
      {INTEREST_CATEGORIES.map(cat => {
        const selected = value.includes(cat.id)
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => toggle(cat.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.375rem',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: selected ? '2px solid var(--comora-orange)' : '2px solid var(--border)',
              background: selected ? 'var(--accent-soft)' : 'var(--bg-card)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s, background 0.15s, transform 0.1s',
              transform: selected ? 'scale(1.02)' : 'scale(1)',
              boxShadow: selected ? '0 0 0 3px rgba(245,158,11,0.12)' : 'none',
            }}
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{cat.icon}</span>
            <span
              style={{
                fontSize: '0.84375rem',
                fontWeight: selected ? 600 : 500,
                color: selected ? 'var(--comora-orange)' : 'var(--text-primary)',
                lineHeight: 1.3,
              }}
            >
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Step 2: Social Comfort ──────────────────────────────────────── */
function StepSocialComfort({ value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {SOCIAL_COMFORT.map(opt => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: selected ? '2px solid var(--comora-orange)' : '2px solid var(--border)',
              background: selected ? 'var(--accent-soft)' : 'var(--bg-card)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                background: selected ? 'var(--comora-orange)' : 'var(--bg-elevated)',
                border: selected ? '2px solid var(--comora-orange)' : '2px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              {selected && <Check size={14} color="#fff" strokeWidth={3} />}
            </div>
            <div>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  color: selected ? 'var(--comora-orange)' : 'var(--text-primary)',
                  marginBottom: '0.125rem',
                }}
              >
                {opt.label}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{opt.desc}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ── Step 3: Group Size ──────────────────────────────────────────── */
function StepGroupSize({ value, onChange }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
      }}
    >
      {GROUP_SIZE_OPTIONS.map(opt => {
        const selected = value?.min === opt.min
        return (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange({ min: opt.min, max: opt.max })}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: selected ? '2px solid var(--comora-orange)' : '2px solid var(--border)',
              background: selected ? 'var(--accent-soft)' : 'var(--bg-card)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'border-color 0.15s, background 0.15s, transform 0.1s',
              transform: selected ? 'scale(1.03)' : 'scale(1)',
              boxShadow: selected ? '0 0 0 3px rgba(245,158,11,0.12)' : 'none',
            }}
          >
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: selected ? 'var(--comora-orange)' : 'var(--text-primary)',
                lineHeight: 1,
                marginBottom: '0.375rem',
              }}
            >
              {opt.label}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{opt.sublabel}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Step 4: Dietary ─────────────────────────────────────────────── */
function StepDietary({ value, onChange }) {
  function toggle(opt) {
    onChange(prev =>
      prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
    )
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
      {DIETARY_OPTIONS.map(opt => {
        const selected = value.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              padding: '0.5rem 1.125rem',
              borderRadius: '999px',
              border: selected ? '2px solid var(--comora-orange)' : '2px solid var(--border)',
              background: selected ? 'var(--accent-soft)' : 'var(--bg-card)',
              color: selected ? 'var(--comora-orange)' : 'var(--text-secondary)',
              fontWeight: selected ? 600 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: selected ? '0 0 0 3px rgba(245,158,11,0.1)' : 'none',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/* ── Step 5: Budget ──────────────────────────────────────────────── */
function StepBudget({ value, onChange }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
      }}
    >
      {BUDGET_OPTIONS.map(opt => {
        const selected = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.375rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: selected ? '2px solid var(--comora-orange)' : '2px solid var(--border)',
              background: selected ? 'var(--accent-soft)' : 'var(--bg-card)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'border-color 0.15s, background 0.15s, transform 0.1s',
              transform: selected ? 'scale(1.03)' : 'scale(1)',
              boxShadow: selected ? '0 0 0 3px rgba(245,158,11,0.12)' : 'none',
              gap: '0.375rem',
            }}
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{opt.emoji}</span>
            <span
              style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: selected ? 'var(--comora-orange)' : 'var(--text-primary)',
              }}
            >
              {opt.label}
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{opt.sublabel}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ── Step 6: City + Confirmation ─────────────────────────────────── */
function StepCity({ city, onCityChange, answers }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Select
        label="Your city"
        name="city"
        value={city}
        onChange={e => onCityChange(e.target.value)}
      >
        <option value="">Select your city</option>
        {CITIES.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </Select>

      {/* Summary preview */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
        }}
      >
        <p
          style={{
            fontSize: '0.78125rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            marginBottom: '0.875rem',
          }}
        >
          Your profile snapshot
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <SummaryRow
            label="Interests"
            value={
              answers.interests.length
                ? INTEREST_CATEGORIES.filter(c => answers.interests.includes(c.id))
                    .map(c => c.label)
                    .join(', ')
                : '—'
            }
          />
          <SummaryRow
            label="Social comfort"
            value={
              answers.socialComfort
                ? SOCIAL_COMFORT.find(s => s.value === answers.socialComfort)?.label
                : '—'
            }
          />
          <SummaryRow
            label="Group size"
            value={
              answers.groupSize
                ? `${answers.groupSize.min}–${answers.groupSize.max === 99 ? '∞' : answers.groupSize.max} people`
                : '—'
            }
          />
          <SummaryRow
            label="Dietary"
            value={answers.dietary.length ? answers.dietary.join(', ') : 'No restrictions'}
          />
          <SummaryRow
            label="Budget"
            value={
              answers.budget
                ? BUDGET_OPTIONS.find(b => b.id === answers.budget)?.label + ' — ' +
                  BUDGET_OPTIONS.find(b => b.id === answers.budget)?.sublabel
                : '—'
            }
          />
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '0.84375rem', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span
        style={{
          fontSize: '0.84375rem',
          color: 'var(--text-primary)',
          fontWeight: 500,
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────────────── */
export default function MatchMe() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [visible, setVisible] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [interests, setInterests] = useState([])
  const [socialComfort, setSocialComfort] = useState(null)
  const [groupSize, setGroupSize] = useState(null)
  const [dietary, setDietary] = useState([])
  const [budget, setBudget] = useState(null)
  const [city, setCity] = useState('')

  function canAdvance() {
    if (step === 1) return interests.length >= 2
    if (step === 2) return socialComfort !== null
    if (step === 3) return groupSize !== null
    if (step === 4) return true  // dietary is optional-ish
    if (step === 5) return budget !== null
    if (step === 6) return city !== ''
    return false
  }

  function animateStep(fn) {
    setVisible(false)
    setTimeout(() => {
      fn()
      setVisible(true)
    }, 220)
  }

  function goNext() {
    if (!canAdvance()) return
    if (step < TOTAL_STEPS) {
      animateStep(() => setStep(s => s + 1))
    } else {
      handleComplete()
    }
  }

  function goBack() {
    if (step > 1) animateStep(() => setStep(s => s - 1))
  }

  async function handleComplete() {
    if (!user) {
      toast.error('You need to be signed in.')
      navigate('/login')
      return
    }
    setSubmitting(true)
    try {
      // Use AuthContext's updateProfile so the in-memory profile state is also
      // refreshed — prevents needsMatchMe from staying true and causing redirect loops.
      const { error } = await updateProfile({
        interests,
        social_comfort: socialComfort,
        preferred_group_min: groupSize?.min ?? null,
        preferred_group_max: groupSize?.max ?? null,
        dietary_prefs: dietary,
        budget_range: budget,
        city,
        match_me_completed: true,
      })

      if (error) throw error

      setDone(true)
      setTimeout(() => {
        toast.success("You're all set! Welcome to Comora 🎉")
        navigate('/browse')
      }, 1800)
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong saving your preferences. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  /* Celebration screen */
  if (done) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'var(--bg-base)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '5rem',
            height: '5rem',
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            border: '2px solid var(--comora-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            animation: 'celebPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
          }}
        >
          <PartyPopper size={32} color="var(--comora-orange)" />
        </div>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          You're all set!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          Finding your perfect table...
        </p>
        <style>{`
          @keyframes celebPop {
            from { transform: scale(0.4); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  const meta = STEP_META[step - 1]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          maxWidth: '42rem',
          width: '100%',
          margin: '0 auto',
          padding: '1.5rem 1.5rem 0',
        }}
      >
        <ProgressBar step={step} />
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            marginTop: '0.5rem',
          }}
        >
          Step {step} of {TOTAL_STEPS}
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          maxWidth: '42rem',
          width: '100%',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <StepWrapper visible={visible}>
          {/* Question heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h2
              style={{
                fontSize: 'clamp(1.375rem, 3vw, 1.75rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
              }}
            >
              {meta.heading}
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {meta.sub}
            </p>
          </div>

          {/* Step body */}
          {step === 1 && (
            <StepInterests value={interests} onChange={setInterests} />
          )}
          {step === 2 && (
            <StepSocialComfort value={socialComfort} onChange={setSocialComfort} />
          )}
          {step === 3 && (
            <StepGroupSize value={groupSize} onChange={setGroupSize} />
          )}
          {step === 4 && (
            <StepDietary value={dietary} onChange={setDietary} />
          )}
          {step === 5 && (
            <StepBudget value={budget} onChange={setBudget} />
          )}
          {step === 6 && (
            <StepCity
              city={city}
              onCityChange={setCity}
              answers={{ interests, socialComfort, groupSize, dietary, budget }}
            />
          )}

          {/* Validation hint */}
          {step === 1 && interests.length < 2 && interests.length > 0 && (
            <p style={{ marginTop: '1rem', fontSize: '0.84375rem', color: 'var(--comora-orange)' }}>
              Pick at least one more interest.
            </p>
          )}
        </StepWrapper>
      </div>

      {/* Bottom navigation */}
      <div
        style={{
          maxWidth: '42rem',
          width: '100%',
          margin: '0 auto',
          padding: '1.25rem 1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-base)',
          position: 'sticky',
          bottom: 0,
        }}
      >
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.625rem 1rem',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            cursor: step === 1 ? 'not-allowed' : 'pointer',
            color: step === 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: 500,
            opacity: step === 1 ? 0.4 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <Button
          variant="primary"
          size="md"
          onClick={goNext}
          loading={submitting}
          disabled={!canAdvance()}
        >
          {step === TOTAL_STEPS ? 'Complete Setup' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
