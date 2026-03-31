import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, ChevronDown, Loader2, Sparkles, Ticket } from 'lucide-react'
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

const SYSTEM_PROMPT = `You are Sage, the friendly AI support assistant for Comora — an agenda-first social gathering platform in India (currently Hyderabad). Keep replies concise, warm, and helpful. 2–4 sentences max unless the question needs more detail.

About Comora:
- Guests browse and attend curated events (book clubs, debates, film screenings, workshops, networking)
- Hosts create and manage events via the Host Studio
- Events are agenda-first — centred around ideas and intellectual connection
- Three roles: Guest, Host, Admin

Common topics you can help with:
- How to sign up / log in / reset password
- How to RSVP or book an event
- How to cancel a booking
- How to become a host (apply via Profile page)
- What Match Me quiz is (interest-based event recommendations)
- What the Agenda Card / Conversation Warm-Up Pack is
- How communities work
- How ratings and reviews work
- Payment and refund questions (note: payments are simulated in current version)
- Profile and settings help

If you cannot resolve the issue, or the user asks for a human, say exactly: "ESCALATE" — nothing else.`

const ESCALATION_KEYWORDS = ['not working', 'still doesn\'t', 'doesn\'t work', 'not resolved', 'speak to someone', 'talk to someone', 'human', 'real person', 'admin', 'contact support', 'not helping', 'useless']

export default function SupportChat() {
  const { user, profile } = useAuth()
  const [open, setOpen]               = useState(false)
  const [view, setView]               = useState('bot')
  const [tickets, setTickets]         = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [sending, setSending]         = useState(false)
  const [form, setForm]               = useState({ category: 'general', subject: '', message: '' })

  // Bot state
  const [messages, setMessages]       = useState([{ role: 'assistant', content: 'Hi! I\'m Sage, Comora\'s support assistant. What can I help you with today?' }])
  const [input, setInput]             = useState('')
  const [botLoading, setBotLoading]   = useState(false)
  const [botReplies, setBotReplies]   = useState(0)
  const [escalated, setEscalated]     = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!open || !user) return
    loadTickets()
  }, [open, user])

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }, [messages, view])

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
    if (!form.subject.trim() || !form.message.trim()) { toast.error('Please fill in subject and message.'); return }
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
      toast.success('Message sent! We will reply within 1-2 days.')
      setForm({ category: 'general', subject: '', message: '' })
      setView('list')
      loadTickets()
    }
  }

  async function handleBotSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || botLoading) return
    setInput('')

    const shouldEscalate = ESCALATION_KEYWORDS.some(k => text.toLowerCase().includes(k))
    if (shouldEscalate) { setEscalated(true); setMessages(prev => [...prev, { role: 'user', content: text }]); return }

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setBotLoading(true)

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...newMessages.map(m => ({ role: m.role, content: m.content }))],
          max_tokens: 200,
          temperature: 0.7,
        }),
      })
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content?.trim() || 'Sorry, I couldn\'t process that. Please try again.'

      if (reply === 'ESCALATE') {
        setEscalated(true)
        setMessages(prev => [...prev, { role: 'assistant', content: 'I\'m not able to resolve this one for you. Let me connect you with our support team.' }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
        const newCount = botReplies + 1
        setBotReplies(newCount)
        if (newCount >= 4) setEscalated(true)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong on my end. Please try again.' }])
    } finally {
      setBotLoading(false)
    }
  }

  const statusColor = { open: '#f59e0b', in_progress: '#3b82f6', resolved: '#22c55e' }
  const unreadCount = tickets.filter(t => t.admin_reply && t.status !== 'resolved').length

  const panelStyle = {
    position: 'fixed', bottom: '5.5rem', right: '1.5rem', zIndex: 8999,
    width: '340px', maxHeight: '520px', borderRadius: '1rem',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
  }

  const headerSubtitle = {
    bot: 'AI Support · Sage',
    list: 'My Tickets',
    new: 'New message',
    thread: selectedTicket?.subject,
  }[view]

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9000,
          width: '3.25rem', height: '3.25rem', borderRadius: '50%',
          background: '#1E3A5F', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)', transition: 'transform 0.2s, box-shadow 0.2s',
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
            background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unreadCount}</span>
        )}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div style={panelStyle}>

          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', background: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Comora Support</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem' }}>{headerSubtitle}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {view === 'bot' && user && (
                <button
                  onClick={() => { setView('list'); loadTickets() }}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '0.4rem', fontSize: '0.72rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  title="View my tickets"
                >
                  <Ticket size={12} /> Tickets
                </button>
              )}
              {view !== 'bot' && (
                <button
                  onClick={() => { setView('bot'); setSelectedTicket(null) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '0.25rem' }}
                >
                  <ChevronDown size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* ── Bot view ── */}
            {view === 'bot' && (
              <>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {m.role === 'assistant' && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Sparkles size={9} /> Sage
                      </span>
                    )}
                    <div style={{
                      maxWidth: '85%', padding: '0.55rem 0.8rem',
                      borderRadius: m.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                      background: m.role === 'user' ? '#1E3A5F' : 'var(--bg-subtle)',
                      border: m.role === 'user' ? 'none' : '1px solid var(--border)',
                      color: m.role === 'user' ? 'white' : 'var(--text-primary)',
                      fontSize: '0.82rem', lineHeight: 1.5,
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}

                {botLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Loader2 size={13} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sage is typing…</span>
                  </div>
                )}

                {/* Escalation card */}
                {escalated && (
                  <div style={{ padding: '0.75rem', borderRadius: '0.625rem', background: 'var(--accent-soft)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Need more help?</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Our team is happy to help you directly.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <a
                        href="/contact"
                        style={{ padding: '0.5rem', borderRadius: '0.4rem', background: '#1E3A5F', color: 'white', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}
                      >
                        Message our team
                      </a>
                      <a
                        href="mailto:trust@comora.app"
                        style={{ padding: '0.5rem', borderRadius: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}
                      >
                        trust@comora.app
                      </a>
                    </div>
                  </div>
                )}

                <div ref={bottomRef} />
              </>
            )}

            {/* ── List view ── */}
            {view === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {!user ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>Sign in to view your tickets.</p>
                ) : (
                  <>
                    <button
                      onClick={() => setView('new')}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.625rem', background: '#1E3A5F', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Send size={14} /> New message
                    </button>
                    {loadingTickets ? (
                      <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    ) : tickets.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>No previous messages.</p>
                    ) : (
                      tickets.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setSelectedTicket(t); setView('thread') }}
                          style={{ width: '100%', textAlign: 'left', padding: '0.75rem', borderRadius: '0.625rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</span>
                            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: statusColor[t.status] || 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{t.status?.replace('_', ' ')}</span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {t.admin_reply ? 'Admin replied' : 'Awaiting reply'} · {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </button>
                      ))
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── New message form ── */}
            {view === 'new' && (
              <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ width: '100%', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Subject</label>
                  <input required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="What's this about?" style={{ width: '100%', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Message</label>
                  <textarea required value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Describe your issue…" rows={4} style={{ width: '100%', padding: '0.5rem 0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <button type="submit" disabled={sending} style={{ padding: '0.625rem', borderRadius: '0.5rem', background: '#1E3A5F', color: 'white', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: sending ? 0.7 : 1 }}>
                  {sending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                  {sending ? 'Sending…' : 'Send Message'}
                </button>
              </form>
            )}

            {/* ── Thread view ── */}
            {view === 'thread' && selectedTicket && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                  <div style={{ maxWidth: '85%', padding: '0.625rem 0.875rem', borderRadius: '1rem 1rem 0.25rem 1rem', background: '#1E3A5F', color: 'white', fontSize: '0.825rem', lineHeight: 1.5 }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem', opacity: 0.8, fontSize: '0.75rem' }}>{selectedTicket.subject}</p>
                    <p>{selectedTicket.message}</p>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(selectedTicket.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {selectedTicket.admin_reply ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-start' }}>
                    <div style={{ maxWidth: '85%', padding: '0.625rem 0.875rem', borderRadius: '1rem 1rem 1rem 0.25rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '0.825rem', lineHeight: 1.5 }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.72rem', color: 'var(--comora-navy)' }}>Comora Support</p>
                      <p>{selectedTicket.admin_reply}</p>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{selectedTicket.replied_at ? new Date(selectedTicket.replied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Replied'}</span>
                  </div>
                ) : (
                  <div style={{ padding: '0.625rem 0.875rem', borderRadius: '0.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Awaiting reply from support team…
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* ── Bot input bar ── */}
          {view === 'bot' && (
            <form onSubmit={handleBotSend} style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything…"
                disabled={botLoading}
                style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
              />
              <button
                type="submit"
                disabled={botLoading || !input.trim()}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: input.trim() && !botLoading ? '#1E3A5F' : 'var(--bg-subtle)', color: input.trim() && !botLoading ? 'white' : 'var(--text-muted)', border: 'none', cursor: input.trim() && !botLoading ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
              >
                <Send size={15} />
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
