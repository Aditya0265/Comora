import { useState } from 'react'
import { Bell, Lock, Trash2, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '1.75rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {Icon && <Icon size={18} style={{ color: 'var(--comora-navy)' }} />}
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPw,      setChangingPw]      = useState(false)

  const [emailNotifs,   setEmailNotifs]   = useState(true)
  const [reminderNotifs, setReminderNotifs] = useState(true)

  async function handleChangePassword(e) {
    e.preventDefault()
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters.'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match.'); return }

    setChangingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setChangingPw(false)

    if (error) toast.error(error.message || 'Failed to update password.')
    else {
      toast.success('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This cannot be undone.'
    )
    if (!confirmed) return
    toast.error('Account deletion requires contacting support at hello@comora.app.')
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem 4rem' }}>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Manage your account and preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Notifications ── */}
        <SectionCard title="Notifications" icon={Bell}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Booking confirmations & updates', state: emailNotifs, set: setEmailNotifs },
              { label: 'Event reminders (48h and 2h before)', state: reminderNotifs, set: setReminderNotifs },
            ].map(({ label, state, set }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</p>
                <button
                  onClick={() => { set(!state); toast.success('Preference saved.') }}
                  style={{
                    width: '2.75rem', height: '1.5rem',
                    borderRadius: '9999px',
                    background: state ? 'var(--comora-navy)' : 'var(--border-strong)',
                    border: 'none', cursor: 'pointer',
                    position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '3px',
                    left: state ? 'calc(100% - 21px)' : '3px',
                    width: '18px', height: '18px',
                    borderRadius: '50%', background: 'white',
                    transition: 'left 0.2s',
                  }} />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Account ── */}
        <SectionCard title="Account" icon={Globe}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Signed in as</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.email}</p>
          </div>
        </SectionCard>

        {/* ── Change password ── */}
        <SectionCard title="Change Password" icon={Lock}>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" size="sm" loading={changingPw}>
                Update Password
              </Button>
            </div>
          </form>
        </SectionCard>

        {/* ── Danger zone ── */}
        <SectionCard title="Danger Zone" icon={Trash2}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Deleting your account permanently removes all your data, bookings, and reviews. This cannot be undone.
          </p>
          <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
            Delete My Account
          </Button>
        </SectionCard>

      </div>
    </div>
  )
}
