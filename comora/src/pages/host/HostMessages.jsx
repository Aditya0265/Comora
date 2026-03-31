import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Send, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

function Avatar({ name, src, size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--comora-navy)', color: 'white', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.375,
    }}>
      {src
        ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (name?.[0] ?? '?').toUpperCase()
      }
    </div>
  )
}

function fmt(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function HostMessages() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  // All threads sent to this host
  const { data: threads = [], isLoading, error } = useQuery({
    queryKey: ['host-threads', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('host_messages')
        .select('*, guest:profiles!guest_id(id, name, avatar_url), community:communities(name)')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  // Replies for selected thread
  const { data: replies = [] } = useQuery({
    queryKey: ['thread-replies', selected],
    enabled: !!selected,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_replies')
        .select('*, sender:profiles!sender_id(name, avatar_url)')
        .eq('thread_id', selected)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })

  const thread = threads.find(t => t.id === selected)
  const unread = threads.filter(t => !t.is_read).length

  // Mark thread as read when opened
  useEffect(() => {
    if (!selected) return
    const t = threads.find(t => t.id === selected)
    if (t && !t.is_read) {
      supabase.from('host_messages').update({ is_read: true }).eq('id', selected).then(() => {
        queryClient.invalidateQueries({ queryKey: ['host-threads', user?.id] })
        queryClient.invalidateQueries({ queryKey: ['host-messages-unread', user?.id] })
      })
    }
  }, [selected])

  // Scroll to bottom on open/new message
  useEffect(() => {
    if (selected) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected, replies.length])

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    const { error } = await supabase.from('message_replies').insert({
      thread_id: selected,
      sender_id: user.id,
      message:   text.trim(),
    })
    if (error) { toast.error(error.message); setSending(false); return }
    // Notify the guest
    await supabase.from('notifications').insert({
      user_id: thread.guest_id,
      type:    'message_reply',
      title:   `${profile?.name || 'Your host'} replied to your message`,
      message: text.trim().slice(0, 80),
    })
    setText('')
    setSending(false)
    queryClient.invalidateQueries({ queryKey: ['thread-replies', selected] })
  }

  // ── Thread list view ──────────────────────────────────────────────────────
  if (!selected) {
    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <MessageSquare size={22} style={{ color: 'var(--comora-navy)' }} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--comora-charcoal)', letterSpacing: '-0.02em' }}>
            Inbox
          </h1>
          {unread > 0 && (
            <span style={{ padding: '0.15rem 0.625rem', borderRadius: '9999px', background: 'var(--comora-orange)', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
              {unread} new
            </span>
          )}
        </div>

        {isLoading && <p style={{ color: 'var(--comora-grey)', fontSize: '0.875rem', textAlign: 'center', padding: '3rem' }}>Loading…</p>}
        {error && <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{error.message}</p>}

        {!isLoading && !error && threads.length === 0 && (
          <div style={{ background: 'white', border: '1px solid var(--comora-beige)', borderRadius: 'var(--radius-md)', padding: '3rem 2rem', textAlign: 'center' }}>
            <MessageSquare size={36} style={{ color: 'var(--comora-beige)', margin: '0 auto 1rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--comora-charcoal)', marginBottom: '0.375rem' }}>No messages yet</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--comora-grey)' }}>Guests will message you from event or gathering pages.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {threads.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              style={{
                width: '100%', textAlign: 'left', background: 'white',
                border: '1px solid var(--comora-beige)',
                borderLeft: t.is_read ? '1px solid var(--comora-beige)' : '4px solid var(--comora-orange)',
                borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
                cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
                display: 'flex', alignItems: 'center', gap: '0.875rem', transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            >
              <Avatar name={t.guest?.name} src={t.guest?.avatar_url} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--comora-charcoal)' }}>{t.guest?.name || 'Guest'}</p>
                    {!t.is_read && (
                      <span style={{ padding: '0.1rem 0.4rem', borderRadius: '9999px', background: 'var(--comora-orange)', color: 'white', fontSize: '0.62rem', fontWeight: 700 }}>NEW</span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--comora-grey)' }}>{fmt(t.created_at)}</span>
                </div>
                {t.community?.name && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--comora-orange)', marginBottom: '0.25rem' }}>re: {t.community.name}</p>
                )}
                <p style={{ fontSize: '0.8rem', color: 'var(--comora-grey)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.message}
                </p>
              </div>
              <span style={{ color: 'var(--comora-navy)', fontSize: '1rem', flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Chat thread view ──────────────────────────────────────────────────────
  const allMessages = [
    { id: 'original', sender_id: thread.guest_id, message: thread.message, created_at: thread.created_at, sender: { name: thread.guest?.name, avatar_url: thread.guest?.avatar_url } },
    ...replies,
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 0px)', background: 'var(--bg-base)' }}>

      {/* Header */}
      <div style={{ padding: '0.875rem 1.25rem', background: 'white', borderBottom: '1px solid var(--comora-beige)', display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--comora-navy)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--comora-beige)' }} />
        <Avatar name={thread.guest?.name} src={thread.guest?.avatar_url} size={34} />
        <div>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--comora-charcoal)' }}>{thread.guest?.name || 'Guest'}</p>
          {thread.community?.name && <p style={{ fontSize: '0.72rem', color: 'var(--comora-grey)' }}>re: {thread.community.name}</p>}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {allMessages.map((msg) => {
          const isMe = msg.sender_id === user.id
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: '0.25rem' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--comora-grey)', fontWeight: 600, paddingInline: '0.25rem' }}>
                {isMe ? 'You' : (msg.sender?.name || thread.guest?.name || 'Guest')}
              </p>
              <div style={{
                maxWidth: '75%', padding: '0.75rem 1rem', lineHeight: 1.6,
                fontSize: '0.875rem',
                borderRadius: isMe ? 'var(--radius-md) 0 var(--radius-md) var(--radius-md)' : '0 var(--radius-md) var(--radius-md) var(--radius-md)',
                background: isMe ? 'var(--comora-navy)' : 'white',
                color: isMe ? 'white' : 'var(--comora-charcoal)',
                border: isMe ? 'none' : '1px solid var(--comora-beige)',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {msg.message}
              </div>
              <p style={{ fontSize: '0.65rem', color: 'var(--comora-grey)', paddingInline: '0.25rem' }}>{fmt(msg.created_at)}</p>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: '0.875rem 1.25rem', background: 'white', borderTop: '1px solid var(--comora-beige)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexShrink: 0 }}>
        <textarea
          rows={2}
          placeholder="Type a message…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e) } }}
          style={{
            flex: 1, padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--comora-beige)', background: 'var(--comora-cream)',
            fontSize: '0.875rem', color: 'var(--comora-charcoal)', resize: 'none',
            fontFamily: 'inherit', outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--comora-navy)'}
          onBlur={e => e.target.style.borderColor = 'var(--comora-beige)'}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={{
            padding: '0.625rem 1.125rem', borderRadius: 'var(--radius-md)', border: 'none',
            background: sending || !text.trim() ? 'var(--comora-beige)' : 'var(--comora-navy)',
            color: sending || !text.trim() ? 'var(--comora-grey)' : 'white',
            cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            fontSize: '0.875rem', fontWeight: 600, flexShrink: 0, transition: 'all 0.15s',
          }}
        >
          <Send size={15} />
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
