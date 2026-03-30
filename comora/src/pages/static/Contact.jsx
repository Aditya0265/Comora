import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, MessageSquare, ShieldAlert, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Button from '../../components/ui/Button'
import { Input, Textarea, Select } from '../../components/ui/Input'

const CATEGORIES = [
  { value: 'general',  label: 'General enquiry' },
  { value: 'account',  label: 'Account issue' },
  { value: 'booking',  label: 'Booking problem' },
  { value: 'host',     label: 'Host support' },
  { value: 'safety',   label: 'Safety / report a problem' },
  { value: 'other',    label: 'Other' },
]

export default function Contact() {
  const { user, profile } = useAuth()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    name: profile?.name || '',
    email: user?.email || '',
    category: 'general',
    subject: '',
    message: '',
  })

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.subject.trim()) { toast.error('Please enter a subject.'); return }
    if (!form.message.trim()) { toast.error('Please write a message.'); return }
    if (!form.email.trim()) { toast.error('Please enter your email.'); return }

    setSubmitting(true)
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user?.id ?? null,
      name: form.name || 'Anonymous',
      email: form.email,
      category: form.category,
      subject: form.subject,
      message: form.message,
      status: 'open',
    })
    setSubmitting(false)

    if (error) {
      toast.error(error.message || 'Failed to send. Please try again.')
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center flex flex-col items-center gap-5 max-w-sm px-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-soft)' }}>
            <CheckCircle size={32} style={{ color: 'var(--comora-navy)' }} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Message sent!</h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            We've received your message and will get back to you within 1–2 business days.
          </p>
          <Link to="/" className="text-sm font-medium hover:underline" style={{ color: 'var(--comora-navy)' }}>
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-10 transition-colors">
          <ArrowLeft size={15} /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Contact Support</h1>
        <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
          Have a question or need help? Send us a message and our team will respond within 1–2 business days.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Your name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Full name"
            />
            <Input
              label="Email address"
              type="email"
              required
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <Select
            label="Category"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>

          <Input
            label="Subject"
            required
            value={form.subject}
            onChange={(e) => set('subject', e.target.value)}
            placeholder="Brief summary of your issue"
          />

          <Textarea
            label="Message"
            required
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            placeholder="Describe your issue or question in detail…"
            style={{ minHeight: '140px' }}
          />

          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[var(--text-muted)]">
              For urgent safety issues, please also email{' '}
              <a href="mailto:trust@comora.app" className="underline">trust@comora.app</a>
            </p>
            <Button type="submit" variant="primary" loading={submitting}>
              <Send size={15} />
              Send Message
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
