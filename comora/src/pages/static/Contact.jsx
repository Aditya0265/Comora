import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, MessageSquare, ShieldAlert } from 'lucide-react'

const channels = [
  {
    icon: Mail,
    title: 'General enquiries',
    desc: 'Questions about the platform, partnerships, or press.',
    contact: 'hello@comora.app',
  },
  {
    icon: ShieldAlert,
    title: 'Report a problem',
    desc: 'Abuse, policy violations, or safety concerns.',
    contact: 'trust@comora.app',
  },
  {
    icon: MessageSquare,
    title: 'Host support',
    desc: 'Help with your event, payouts, or verification.',
    contact: 'hosts@comora.app',
  },
]

export default function Contact() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-10 transition-colors">
          <ArrowLeft size={15} /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Contact Us</h1>
        <p className="text-[var(--text-secondary)] mb-10 leading-relaxed">
          We're a small team. We read every message. Reach us at the right address and we'll get back to you faster.
        </p>

        <div className="flex flex-col gap-4">
          {channels.map(({ icon: Icon, title, desc, contact }) => (
            <div
              key={title}
              className="flex items-start gap-4 p-5 rounded-[var(--radius-xl)] border border-[var(--border)]"
              style={{ background: 'var(--bg-card)' }}
            >
              <div
                className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0"
                style={{ background: 'var(--accent-soft)' }}
              >
                <Icon size={18} style={{ color: 'var(--navy-800)' }} />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] mb-0.5">{title}</p>
                <p className="text-sm text-[var(--text-secondary)] mb-1">{desc}</p>
                <a
                  href={`mailto:${contact}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: 'var(--navy-800)' }}
                >
                  {contact}
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[var(--text-muted)] mt-10 text-center">
          Response time is typically 1–2 business days. For urgent safety issues, use trust@comora.app.
        </p>
      </div>
    </div>
  )
}
