import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-10 transition-colors">
          <ArrowLeft size={15} /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Last updated: March 2025</p>

        <div className="flex flex-col gap-8 text-[var(--text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">What we collect</h2>
            <p>Comora collects information you provide directly — your name, email address, city, and preferences set during onboarding. We also collect usage data (pages visited, events browsed) to improve recommendations.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">How we use it</h2>
            <p>Your data is used to match you with relevant gatherings, send transactional emails (booking confirmations, reminders), and improve the platform. We do not sell your personal data to third parties.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Data storage</h2>
            <p>All data is stored securely on Supabase (PostgreSQL). Passwords are hashed and never stored in plain text. Venue addresses are encrypted at rest.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Your rights</h2>
            <p>You can request deletion of your account and associated data at any time by contacting us at <span className="text-[var(--navy-800)]">hello@comora.app</span>. Profile data can be edited from your account settings.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Cookies</h2>
            <p>Comora uses localStorage to persist your theme preference and session token. No third-party tracking cookies are used.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
