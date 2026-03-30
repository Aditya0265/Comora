import { useState, useMemo } from 'react'
import { Search, Calendar, MapPin, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import AgendaCard from '../../components/events/AgendaCard'
import Badge from '../../components/ui/Badge'
import { supabase } from '../../lib/supabase'

const CATEGORY_ICONS = {
  literature: '📚', philosophy: '💭', film: '🎬',
  technology: '🛠️', music: '🎵', science: '🔬',
  career: '🚀', social: '🌱', food: '🍽️', art: '🎨', other: '🌐',
}

export default function Discover() {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['discover-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*, host:profiles(name, avatar_url, host_verified)')
        .eq('status', 'live')
        .order('date_time', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })

  const filtered = useMemo(() => {
    let list = events
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.host?.name?.toLowerCase().includes(q)
      )
    }
    if (selectedTag) {
      list = list.filter(e => e.topic_tags?.includes(selectedTag) || e.agenda_type === selectedTag)
    }
    if (selectedCity) {
      list = list.filter(e => e.venue_city === selectedCity)
    }
    return list
  }, [events, search, selectedTag, selectedCity])

  const topTags = useMemo(() => {
    const counts = {}
    events.forEach(e => {
      (e.topic_tags ?? []).forEach(t => { counts[t] = (counts[t] || 0) + 1 })
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag)
  }, [events])

  const activeCities = useMemo(() => {
    const seen = new Set()
    events.forEach(e => { if (e.venue_city) seen.add(e.venue_city) })
    return [...seen].sort()
  }, [events])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>

      {/* Hero */}
      <section className="hero-gradient pt-14 pb-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center gap-5">
          <Badge variant="warm" className="gap-1.5">
            <Sparkles size={12} />
            Live events · Curated by local hosts
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">
            Discover events<br />
            <span className="font-display italic" style={{ color: 'var(--comora-navy)' }}>near you</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-base max-w-xl leading-relaxed">
            Browse upcoming gatherings created by Comora hosts — discussions, workshops,
            screenings, and more.
          </p>

          {/* Search */}
          <div className="relative w-full max-w-lg mt-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search events, topics, or hosts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-lg)] text-sm border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--comora-navy)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
            />
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Topic filter pills */}
          {topTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedTag('')}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
                style={
                  !selectedTag
                    ? { background: 'var(--comora-navy)', color: '#fff', borderColor: 'var(--comora-navy)' }
                    : { background: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                }
              >
                All topics
              </button>
              {topTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-1"
                  style={
                    selectedTag === tag
                      ? { background: 'var(--comora-navy)', color: '#fff', borderColor: 'var(--comora-navy)' }
                      : { background: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }
                  }
                >
                  <span>{CATEGORY_ICONS[tag.toLowerCase()] ?? '🌐'}</span>
                  <span className="capitalize">{tag}</span>
                </button>
              ))}
            </div>
          )}

          {/* City filter */}
          {activeCities.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCity('')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all"
                style={
                  !selectedCity
                    ? { background: 'var(--comora-orange)', color: '#fff', borderColor: 'var(--comora-orange)' }
                    : { background: 'var(--bg-card)', color: 'var(--text-muted)', borderColor: 'var(--border)' }
                }
              >
                <MapPin size={11} /> All cities
              </button>
              {activeCities.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(selectedCity === city ? '' : city)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all"
                  style={
                    selectedCity === city
                      ? { background: 'var(--comora-orange)', color: '#fff', borderColor: 'var(--comora-orange)' }
                      : { background: 'var(--bg-card)', color: 'var(--text-muted)', borderColor: 'var(--border)' }
                  }
                >
                  <MapPin size={11} /> {city}
                </button>
              ))}
            </div>
          )}

          {/* Result count */}
          <p className="text-sm text-[var(--text-muted)] mb-5">
            {isLoading ? 'Loading events…' : `${filtered.length} event${filtered.length !== 1 ? 's' : ''} found`}
          </p>

          {/* Events grid */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-56 animate-pulse" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(event => (
                <AgendaCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 flex flex-col items-center gap-4">
              <span className="text-5xl">🔭</span>
              <p className="font-semibold text-[var(--text-primary)]">No events found</p>
              <p className="text-sm text-[var(--text-muted)]">
                {events.length === 0
                  ? 'No live events yet. Check back soon!'
                  : 'Try a different search or topic.'}
              </p>
              {(search || selectedTag || selectedCity) && (
                <button
                  onClick={() => { setSearch(''); setSelectedTag(''); setSelectedCity('') }}
                  className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-all"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Link to full Browse */}
          {filtered.length > 0 && (
            <div className="text-center mt-10">
              <p className="text-sm text-[var(--text-muted)] mb-3">Want advanced filters?</p>
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all"
                style={{ background: 'var(--comora-navy)', color: 'white' }}
              >
                <Calendar size={15} />
                Browse with full filters
              </Link>
            </div>
          )}

        </div>
      </section>
    </div>
  )
}
