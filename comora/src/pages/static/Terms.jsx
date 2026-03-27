import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Terms() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-10 transition-colors">
          <ArrowLeft size={15} /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Terms of Use</h1>
        <p className="text-sm text-[var(--text-muted)] mb-10">Last updated: March 2025</p>

        <div className="flex flex-col gap-8 text-[var(--text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Using Comora</h2>
            <p>By creating an account, you agree to use the platform respectfully and in good faith. Comora is designed for genuine social gathering — misuse, spam, or harassment will result in account suspension.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">As a guest</h2>
            <p>When you book a gathering, you commit to attending or cancelling within the window specified by the host's cancellation policy. Repeated no-shows may affect your RSVP reliability score.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">As a host</h2>
            <p>Hosts are responsible for the accuracy of their event details — date, venue, food arrangements, and agenda. Cancelling events affects your host reputation and may delay payouts.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Payments</h2>
            <p>Payments are held in escrow until 24 hours after the event. Refunds for host-cancelled events are issued within 3–5 business days. Comora takes a platform fee on paid events.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Content</h2>
            <p>You retain ownership of content you create on Comora (event descriptions, reviews, bios). By posting, you grant Comora a licence to display that content on the platform.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
