import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'general',  label: 'General question' },
  { value: 'account',  label: 'Account issue' },
  { value: 'booking',  label: 'Booking problem' },
  { value: 'host',     label: 'Host support' },
  { value: 'safety',   label: 'Safety concern' },
  { value: 'other',    label: 'Other' },
]

export default function SupportChat() {
  const { user, profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'new' | 'thread'
  const [tickets, setTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ category: 'general', subject: '', message: '' })
  const bottomRef = useRef(null)

  // Load user's tickets when chat opens
  useEffect(() => {
    if (!open || !user) return
    loadTickets()
  }, [open, user])

  // Scroll to bottom when thread opens
  useEffect(() => {
    if (view === 'thread') {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [view, selectedTicket])

  async function loadTickets() {
    if (!user) return
    setLoadingTickets(true)
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setTickets(data || [])
    setLoadingTickets(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error('Please fill in subject and message.')
      return
    }
    setSending(true)
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user?.id ?? null,
      name: profile?.name || user?.email?.split('@')[0] || 'User',
      email: user?.email || '',
      category: form.category,
      subject: form.subject,
      message: form.message,
      status: 'open',
    })
    setSending(false)
    if (error) {
      toast.error('Failed to send. Please try again.')
    } else {
      toast.success("Message sent! We will reply within 1-2 days.")
      setForm({ category: 'general', subject: '', message: '' })
      setView('list')
      loadTickets()
    }
  }

  const statusColor = {
    open: '#f59e0b',
    in_progress: '#3b82f6',
    resolved: '#22c55e',
  }

  const unreadCount = tickets.filter(t => t.admin_reply && t.status !== 'resolved').length

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 9000,
          width: '3.25rem',
          height: '3.25rem',
          borderRadius: '50%',
          background: '#1E3A5F',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Support chat"
      >
        {open ? <X size={20} color="white" /> : <MessageCircle size={20} color="white" />}
        {!open && unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            width: '18px', height: '18px', borderRadius: '50%',
            background: '#ef4444', color: 'white',
            fontSize: '11px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '1.5rem',
          zIndex: 8999,
          width: '340px',
          maxHeight: '520px',
          borderRadius: '1rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            background: '#1E3A5F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Comora Support</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>
                {view === 'new' ? 'New message' : view === 'thread' ? selectedTicket?.subject : 'How can we help?'}
              </p>
            </div>
            {view !== 'list' && (
              <button
                onClick={() => { setView('list'); setSelectedTicket(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '0.25rem' }}
              >
                <ChevronDown size={18} />
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>

            {/* Not logged in */}
            {!user && (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                <MessageCircle size={32} style={{ color: 'var(--text-muted)' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Sign in to contact our support team and track your conversations.
                </p>
                <a
                  href="/login"
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1.25rem',
                    borderRadius: '0.5rem',
                    background: '#1E3A5F',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Sign In
                </a>
              </div>
            )}

            {/* List view */}
            {user && view === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => setView('new')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.625rem',
                    background: '#1E3A5F',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Send size={14} /> New message
                </button>

                {loadingTickets ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : tickets.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>
                    No previous messages. Send us one!
                  </p>
                ) : (
                  tickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTicket(t); setView('thread') }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.75rem',
                        borderRadius: '0.625rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.subject}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: statusColor[t.status] || 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {t.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t.admin_reply ? 'Admin replied' : 'Awaiting reply'} · {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* New message form */}
            {user && view === 'new' && (
              <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    style={{
                      width: '100%', padding: '0.5rem 0.625rem',
                      borderRadius: '0.5rem', border: '1px solid var(--border)',
                      background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                      fontSize: '0.8rem', outline: 'none',
                    }}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Subject</label>
                  <input
                    required
                    value={form.subject}
                    onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="What's this about?"
                    style={{
                      width: '100%', padding: '0.5rem 0.625rem',
                      borderRadius: '0.5rem', border: '1px solid var(--border)',
                      background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                      fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Message</label>
                  <textarea
                    required
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Describe your issue…"
                    rows={4}
                    style={{
                      width: '100%', padding: '0.5rem 0.625rem',
                      borderRadius: '0.5rem', border: '1px solid var(--border)',
                      background: 'var(--bg-subtle)', color: 'var(--text-primary)',
                      fontSize: '0.8rem', outline: 'none', resize: 'vertical',
                      boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    padding: '0.625rem',
                    borderRadius: '0.5rem',
                    background: '#1E3A5F',
                    color: 'white',
                    border: 'none',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: sending ? 0.7 : 1,
                  }}
                >
                  {sending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}

            {/* Thread view */}
            {user && view === 'thread' && selectedTicket && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* User message */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '1rem 1rem 0.25rem 1rem',
                    background: '#1E3A5F',
                    color: 'white',
                    fontSize: '0.825rem',
                    lineHeight: 1.5,
                  }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem', opacity: 0.8, fontSize: '0.75rem' }}>{selectedTicket.subject}</p>
                    <p>{selectedTicket.message}</p>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(selectedTicket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Admin reply */}
                {selectedTicket.admin_reply ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                    <div style={{
                      maxWidth: '85%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '1rem 1rem 1rem 0.25rem',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.825rem',
                      lineHeight: 1.5,
                    }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.72rem', color: 'var(--comora-navy)' }}>Comora Support</p>
                      <p>{selectedTicket.admin_reply}</p>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {selectedTicket.replied_at ? new Date(selectedTicket.replied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Replied'}
                    </span>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}>
                    Awaiting reply from support team…
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
