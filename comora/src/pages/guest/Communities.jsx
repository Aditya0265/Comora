import { useState, useEffect } from 'react'
import { Users, Flame, BookOpen, Calendar, ArrowRight, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const INTERESTS = ['All', 'Literature', 'Film', 'Philosophy', 'Technology', 'Music', 'Science', 'Career']

const CATEGORY_META = {
  Literature: { emoji: '📚', color: '#1E3A5F', bg: '#EFF6FF' },
  Philosophy: { emoji: '💭', color: '#5B21B6', bg: '#EDE9FE' },
  Film:       { emoji: '🎬', color: '#7E22CE', bg: '#FDF4FF' },
  Technology: { emoji: '🛠️', color: '#0369A1', bg: '#F0F9FF' },
  Music:      { emoji: '🎵', color: '#9A3412', bg: '#FFF7ED' },
  Science:    { emoji: '🔬', color: '#15803D', bg: '#F0FDF4' },
  Career:     { emoji: '🚀', color: '#065F46', bg: '#ECFDF5' },
}
const DEFAULT_META = { emoji: '🌐', color: '#1E3A5F', bg: '#EFF6FF' }

function normalizeCommunity(row) {
  const category = row.topic_tags?.[0] ?? 'Other'
  const meta = CATEGORY_META[category] ?? DEFAULT_META
  return {
    id: row.id,
    name: row.name,
    tagline: row.description ?? '',
    category,
    memberCount: row.member_count ?? 0,
    activeEvents: 0,
    recentTopic: row.description ?? '',
    ...meta,
  }
}

function CommunityCard({ community }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)

  async function handleJoin() {
    if (!user) {
      navigate('/login')
      return
    }
    setJoining(true)
    try {
      const { error } = await supabase
        .from('community_members')
        .upsert({ community_id: community.id, user_id: user.id }, { onConflict: 'community_id,user_id' })
      if (error) throw error
      toast.success(`Joined ${community.name}!`)
    } catch (err) {
      toast.error(err.message || 'Could not join community. Please try again.')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="card-hover rounded-[var(--radius-xl)] overflow-hidden flex flex-col">
      {/* Top accent strip */}
      <div style={{ height: '4px', background: community.color }} />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center text-xl shrink-0"
            style={{ background: community.bg }}
          >
            {community.emoji}
          </div>
          <Badge variant="default" className="text-[11px] shrink-0">{community.category}</Badge>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-[var(--text-primary)] text-base leading-snug">{community.name}</h3>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{community.tagline}</p>
        </div>

        {/* Recent activity */}
        {community.recentTopic && (
          <div
            className="flex items-start gap-2 p-3 rounded-[var(--radius-md)] text-xs"
            style={{ background: 'var(--bg-subtle)' }}
          >
            <Flame size={13} className="shrink-0 mt-0.5" style={{ color: community.color }} />
            <span className="text-[var(--text-secondary)]">{community.recentTopic}</span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-auto pt-1">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Users size={12} />
            <span>{community.memberCount.toLocaleString()} members</span>
          </div>
          {community.activeEvents > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <Calendar size={12} />
              <span>{community.activeEvents} upcoming</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
        <Link
          to={`/gathering/${community.id}`}
          className="text-xs font-medium flex items-center gap-1 transition-all hover:gap-2"
          style={{ color: community.color }}
        >
          View details <ArrowRight size={12} />
        </Link>
        <Button size="sm" variant="outline" onClick={handleJoin} disabled={joining}>
          {joining ? 'Joining…' : 'Join'}
        </Button>
      </div>
    </div>
  )
}

export default function Communities() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: commsData, error } = await supabase
        .from('communities')
        .select('*')
        .order('member_count', { ascending: false })

      if (error || !commsData) { setLoading(false); return }

      // Fetch upcoming event counts per community
      const { data: eventCounts } = await supabase
        .from('events')
        .select('community_id')
        .in('status', ['approved', 'live'])
        .gte('date_time', new Date().toISOString())
        .not('community_id', 'is', null)

      const countMap = {}
      if (eventCounts) {
        eventCounts.forEach(e => {
          if (e.community_id) countMap[e.community_id] = (countMap[e.community_id] || 0) + 1
        })
      }

      setCommunities(commsData.map(row => ({
        ...normalizeCommunity(row),
        activeEvents: countMap[row.id] || 0,
      })))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = communities.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.tagline.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = activeFilter === 'All' || c.category === activeFilter
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* ── Hero ── */}
      <section className="hero-gradient pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-5">
          <Badge variant="warm" className="gap-1.5">
            <BookOpen size={12} />
            Recurring communities · Not just one-off events
          </Badge>

          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight tracking-tight">
            Find your{' '}
            <span className="font-display italic" style={{ color: 'var(--comora-navy)' }}>intellectual home</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed">
            Communities are groups of people who meet regularly around a shared curiosity.
            Join one, attend events, and build real friendships that outlast the dinner table.
          </p>

          {/* Search */}
          <div className="relative w-full max-w-md mt-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search communities…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-lg)] text-sm border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--comora-navy)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
            />
          </div>
        </div>
      </section>

      {/* ── Main ── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {INTERESTS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
                style={
                  activeFilter === tag
                    ? { background: 'var(--comora-navy)', color: '#fff', borderColor: 'var(--comora-navy)' }
                    : { background: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                }
              >
                {tag}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-[var(--text-muted)] text-sm">Loading communities…</div>
          ) : (
            <>
              {/* Count */}
              <p className="text-sm text-[var(--text-muted)] mb-6">
                {filtered.length} {filtered.length === 1 ? 'community' : 'communities'} found
              </p>

              {/* Grid */}
              {filtered.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filtered.map(c => (
                    <CommunityCard key={c.id} community={c} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                  <span className="text-5xl">🔭</span>
                  <p className="font-semibold text-[var(--text-primary)]">No communities yet</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {communities.length === 0
                      ? 'Be the first to start one!'
                      : 'Try a different keyword or browse all categories.'}
                  </p>
                  {communities.length > 0 && (
                    <Button variant="outline" onClick={() => { setSearch(''); setActiveFilter('All') }}>
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* ── Start a community CTA ── */}
      <section className="py-16 mt-4" style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-5">
          <span className="text-4xl">🌱</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Don't see your people here?
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed max-w-xl">
            Start a community around your interest. Host regular events, build a following,
            and create the conversations you've been waiting to have.
          </p>
          <Button size="lg" onClick={() => window.location.href = '/host/studio/new'}>
            Start a Community
            <ArrowRight size={16} />
          </Button>
        </div>
      </section>

    </div>
  )
}
