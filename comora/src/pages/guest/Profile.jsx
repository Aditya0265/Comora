import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Camera, MapPin, User, FileText, Heart, Smile, Utensils,
  Star, Upload, ChevronRight, Loader2, Building2, Phone, Briefcase,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import Modal from '../../components/ui/Modal'
import Input, { Textarea, Select } from '../../components/ui/Input'
import {
  CITIES, INTEREST_CATEGORIES, SOCIAL_COMFORT, DIETARY_OPTIONS,
} from '../../lib/utils'

/* ─── Section card wrapper ───────────────────────────────────────────────── */
function SectionCard({ title, icon: Icon, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '1.75rem',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {Icon && <Icon size={18} style={{ color: 'var(--navy-800)' }} />}
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

/* ─── Chip multi-select ──────────────────────────────────────────────────── */
function ChipSelect({ options, value = [], onChange }) {
  function toggle(opt) {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt))
    else onChange([...value, opt])
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {options.map((opt) => {
        const selected = value.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: selected ? 600 : 400,
              background: selected ? 'var(--navy-800)' : 'var(--bg-subtle)',
              color: selected ? '#fff' : 'var(--text-secondary)',
              border: selected ? '1.5px solid var(--navy-800)' : '1.5px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: PROFILE PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuth()
  const qc = useQueryClient()
  const fileRef = useRef(null)
  const [searchParams] = useSearchParams()

  // Form state
  const [name,          setName]          = useState('')
  const [city,          setCity]          = useState('')
  const [bio,           setBio]           = useState('')
  const [interests,     setInterests]     = useState([])
  const [socialComfort, setSocialComfort] = useState(3)
  const [dietaryPrefs,  setDietaryPrefs]  = useState([])
  const [avatarUrl,     setAvatarUrl]     = useState(null)
  const [uploading,     setUploading]     = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [hostModal,     setHostModal]     = useState(false)

  // Host upgrade form
  const [hostPhone,  setHostPhone]  = useState('')
  const [hostBio,    setHostBio]    = useState('')
  const [hostTags,   setHostTags]   = useState([])
  const [hostSaving, setHostSaving] = useState(false)

  // Sync form when profile loads
  useEffect(() => {
    if (!profile) return
    setName(profile.name          || '')
    setCity(profile.city          || '')
    setBio(profile.bio            || '')
    setInterests(profile.interests     || [])
    setSocialComfort(profile.social_comfort ?? 3)
    setDietaryPrefs(profile.dietary_prefs  || [])
    setAvatarUrl(profile.avatar_url    || null)
    setHostPhone(profile.phone         || '')
    setHostBio(profile.bio             || '')
    setHostTags(profile.expertise_tags || [])
    // Auto-open host modal if redirected from a host-only page
    if (searchParams.get('become-host') === '1' && profile.role === 'guest') {
      setHostModal(true)
    }
  }, [profile])

  const expertiseTags = [
    'Book Discussions', 'Film & Cinema', 'Philosophy', 'Food & Wine',
    'Tech & Design', 'Music', 'Fitness', 'Business', 'Travel', 'Art',
    'Gaming', 'Science', 'Career', 'Social Impact',
  ]

  /* ── Avatar upload ── */
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB.'); return }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(publicUrl)
      await updateProfile({ avatar_url: publicUrl })
      toast.success('Profile photo updated.')
    } catch (err) {
      toast.error(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  /* ── Save all ── */
  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Name is required.'); return }
    setSaving(true)
    const { error } = await updateProfile({
      name: name.trim(),
      city,
      bio: bio.trim(),
      interests,
      social_comfort: socialComfort,
      dietary_prefs: dietaryPrefs,
    })
    setSaving(false)
    if (error) toast.error(error.message || 'Failed to save.')
    else toast.success('Profile saved!')
  }

  /* ── Become a host ── */
  async function handleBecomeHost() {
    if (!hostPhone.trim()) { toast.error('Phone number is required.'); return }
    setHostSaving(true)
    const { error } = await updateProfile({
      role: 'host',
      phone: hostPhone.trim(),
      bio: hostBio.trim() || bio.trim(),
      expertise_tags: hostTags,
      host_verified: false,
    })
    setHostSaving(false)
    if (error) toast.error(error.message || 'Failed to submit.')
    else { toast.success('Host application submitted! Our team will review it shortly.'); setHostModal(false) }
  }

  const { loading, profileError, fetchProfile } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (profileError || (!loading && !profile)) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderRadius: 'var(--radius-xl)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', maxWidth: '480px', width: '100%' }}>
          <p style={{ fontWeight: 600, color: '#ef4444', marginBottom: '0.5rem' }}>Profile could not be loaded</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            {profileError || 'Your profile row is missing from the database.'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Fix: Go to Supabase → SQL Editor → run:<br />
            <code style={{ display: 'block', marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: '6px', fontSize: '0.7rem' }}>
              CREATE POLICY "profiles: own insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
            </code>
            Then refresh this page.
          </p>
        </div>
        <button
          onClick={() => user && fetchProfile(user.id)}
          style={{ fontSize: '0.875rem', color: 'var(--navy-800)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Your Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Keep your profile complete to get better event matches.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── 1. Profile photo ── */}
        <SectionCard title="Profile Photo" icon={Camera}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Avatar src={avatarUrl} name={name || profile.name} size="2xl" verified={profile.host_verified} />
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                A clear photo helps hosts and guests recognise you.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={14} />
                {uploading ? 'Uploading…' : 'Change Photo'}
              </Button>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                JPG, PNG or WebP · Max 5 MB
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── 2. Basic info ── */}
        <SectionCard title="Basic Info" icon={User}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '0.375rem' }}>
                City <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              >
                <option value="">Select your city…</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Textarea
              label="Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people a bit about yourself — what you love, what you're curious about…"
              rows={4}
            />
          </div>
        </SectionCard>

        {/* ── 3. Interest tags ── */}
        <SectionCard title="Your Interests" icon={Heart}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Select everything that resonates with you.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.625rem' }}>
            {INTEREST_CATEGORIES.map(({ id, label, icon }) => {
              const selected = interests.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (selected) setInterests(interests.filter((i) => i !== id))
                    else setInterests([...interests, id])
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: 'var(--radius-md)',
                    border: selected ? '1.5px solid var(--navy-800)' : '1.5px solid var(--border)',
                    background: selected ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                    color: selected ? 'var(--navy-800)' : 'var(--text-secondary)',
                    fontWeight: selected ? 600 : 400,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
        </SectionCard>

        {/* ── 4. Social comfort ── */}
        <SectionCard title="Social Comfort Level" icon={Smile}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            How do you usually feel in social settings?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {SOCIAL_COMFORT.map(({ value, label, desc }) => {
              const selected = socialComfort === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSocialComfort(value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: selected ? '1.5px solid var(--navy-800)' : '1.5px solid var(--border)',
                    background: selected ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: '1.25rem', height: '1.25rem', borderRadius: '50%', flexShrink: 0,
                    border: selected ? '4px solid var(--navy-800)' : '2px solid var(--border)',
                    background: selected ? 'var(--navy-800)' : 'transparent',
                    transition: 'all 0.15s',
                  }} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: selected ? 'var(--navy-800)' : 'var(--text-primary)' }}>
                      {value}. {label}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </SectionCard>

        {/* ── 5. Dietary preferences ── */}
        <SectionCard title="Dietary Preferences" icon={Utensils}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            So hosts can plan food and drinks accordingly.
          </p>
          <ChipSelect options={DIETARY_OPTIONS} value={dietaryPrefs} onChange={setDietaryPrefs} />
        </SectionCard>

        {/* ── 6. Host upgrade ── */}
        {profile.role === 'guest' && (
          <SectionCard title="Become a Host" icon={Star}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Share your passion with a curated group of like-minded people. As a Comora host you can create
              intimate gatherings — book clubs, screenings, workshops, tastings, and more.
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🎉</span>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Your first gathering, reviewed & listed within 48 hours
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Applications are reviewed by our team. Once approved, you'll have full access to the Host Studio.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="warm"
              onClick={() => setHostModal(true)}
            >
              Apply to Become a Host
              <ChevronRight size={15} />
            </Button>
          </SectionCard>
        )}

        {/* ── Host pending badge ── */}
        {profile.role === 'host' && !profile.host_verified && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
            <Loader2 size={18} style={{ color: 'var(--amber-500)', animation: 'spin 1.5s linear infinite' }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Host verification pending</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Our team will review your application within 48 hours.</p>
            </div>
          </div>
        )}

        {/* ── Save button ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button type="submit" variant="primary" size="lg" loading={saving}>
            {saving ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </form>

      {/* ── Become a Host modal ── */}
      <Modal isOpen={hostModal} onClose={() => setHostModal(false)} title="Apply to Become a Host" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Tell us a bit more about yourself so we can verify your host application.
          </p>
          <Input
            label="Phone number"
            icon={Phone}
            value={hostPhone}
            onChange={(e) => setHostPhone(e.target.value)}
            placeholder="+91 98765 43210"
            required
          />
          <Textarea
            label="Host bio"
            value={hostBio}
            onChange={(e) => setHostBio(e.target.value)}
            placeholder="What kind of gatherings do you want to host? What makes your events unique?"
            rows={4}
          />
          <div>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
              Your areas of expertise <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(select all that apply)</span>
            </label>
            <ChipSelect options={expertiseTags} value={hostTags} onChange={setHostTags} />
          </div>
          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setHostModal(false)}>Cancel</Button>
            <Button variant="warm" loading={hostSaving} onClick={handleBecomeHost}>
              Submit Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
