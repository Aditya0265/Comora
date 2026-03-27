import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, Users, Sparkles } from 'lucide-react'
import AgendaCard from '../../components/events/AgendaCard'
import Button from '../../components/ui/Button'
import { supabase } from '../../lib/supabase'
import { TOPIC_TAGS, AGENDA_TYPES, CITIES } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'

/* ─── Constants ─────────────────────────────────────────────── */
const PAGE_SIZE = 12

const GROUP_SIZE_OPTIONS = [
  { value: 'any',    label: 'Any size' },
  { value: 'small',  label: 'Small (2–6)' },
  { value: 'medium', label: 'Medium (6–12)' },
  { value: 'large',  label: 'Large (12+)' },
]

const PRICE_OPTIONS = [
  { value: 'any',    label: 'Any price' },
  { value: 'free',   label: 'Free only' },
  { value: '300',    label: 'Under ₹300' },
  { value: '600',    label: 'Under ₹600' },
]

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'soonest',     label: 'Soonest' },
  { value: 'rating',      label: 'Top rated' },
  { value: 'price_asc',   label: 'Price (low–high)' },
]

const INITIAL_FILTERS = {
  search:      '',
  topics:      [],
  formats:     [],
  city:        '',
  structure:   3,
  energy:      3,
  groupSize:   'any',
  price:       'any',
}

/* ─── Skeleton card ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden flex flex-col">
      <div className="p-4 flex flex-col gap-3">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-5 w-3/4 rounded-[var(--radius-sm)]" />
        <div className="skeleton h-4 w-full rounded-[var(--radius-sm)]" />
        <div className="skeleton h-4 w-2/3 rounded-[var(--radius-sm)]" />
      </div>
      <div className="px-4 pb-4 flex flex-col gap-2">
        <div className="skeleton h-3 w-40 rounded-[var(--radius-sm)]" />
        <div className="skeleton h-3 w-32 rounded-[var(--radius-sm)]" />
        <div className="skeleton h-3 w-28 rounded-[var(--radius-sm)]" />
        <div className="flex gap-2 mt-1">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="mt-auto px-4 py-3 border-t border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="skeleton w-8 h-8 rounded-full" />
          <div className="skeleton h-3 w-20 rounded-[var(--radius-sm)]" />
        </div>
        <div className="skeleton h-4 w-12 rounded-[var(--radius-sm)]" />
      </div>
    </div>
  )
}

/* ─── Become a Host banner ───────────────────────────────────── */
function HostBanner() {
  const { user, isHost } = useAuth()
  const navigate = useNavigate()

  function handleHostCTA() {
    if (!user) navigate('/register')
    else if (isHost) navigate('/host/studio/new')
    else navigate('/profile?become-host=1')
  }

  return (
    <div
      className="col-span-full rounded-[var(--radius-xl)] px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"
      style={{ background: '#1E3A5F', color: 'white' }}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <Sparkles size={22} className="text-[var(--amber-500)]" />
        </div>
        <div>
          <p className="font-semibold text-white text-base">Want to host your own gathering?</p>
          <p className="text-white/70 text-sm mt-0.5">Create meaningful events and connect your community.</p>
        </div>
      </div>
      <Button variant="warm" size="md" className="shrink-0" onClick={handleHostCTA}>
        {isHost ? 'Create Event' : 'Start Hosting'}
      </Button>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
export default function Browse() {
  const [filters, setFilters]         = useState(INITIAL_FILTERS)
  const [sort, setSort]               = useState('recommended')
  const [limit, setLimit]             = useState(PAGE_SIZE)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showAllTopics, setShowAllTopics] = useState(false)

  /* ── Supabase fetch ── */
  const { data: rawEvents = [], isLoading } = useQuery({
    queryKey: ['events', filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('*, host:profiles(name,avatar_url,host_verified)')
        .eq('status', 'live')
        .order('date_time')
        .range(0, limit - 1)

      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        )
      }
      if (filters.city) {
        query = query.eq('venue_city', filters.city)
      }
      if (filters.formats.length > 0) {
        query = query.in('agenda_type', filters.formats)
      }
      if (filters.topics.length > 0) {
        query = query.contains('topic_tags', filters.topics)
      }

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
    staleTime: 60_000,
  })

  /* ── Client-side filter + sort ── */
  const events = useMemo(() => {
    let list = [...rawEvents]

    // Group size
    if (filters.groupSize !== 'any') {
      list = list.filter((e) => {
        const g = e.max_guests ?? 0
        if (filters.groupSize === 'small')  return g >= 2  && g <= 6
        if (filters.groupSize === 'medium') return g > 6   && g <= 12
        if (filters.groupSize === 'large')  return g > 12
        return true
      })
    }

    // Price
    if (filters.price !== 'any') {
      list = list.filter((e) => {
        const p = e.price ?? 0
        if (filters.price === 'free') return p === 0
        if (filters.price === '300')  return p < 300
        if (filters.price === '600')  return p < 600
        return true
      })
    }

    // Sort
    if (sort === 'soonest') {
      list.sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
    } else if (sort === 'rating') {
      list.sort((a, b) => (b.avg_overall ?? 0) - (a.avg_overall ?? 0))
    } else if (sort === 'price_asc') {
      list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    }

    return list
  }, [rawEvents, filters.groupSize, filters.price, sort])

  /* ── Filter helpers ── */
  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
    setLimit(PAGE_SIZE)
  }

  function toggleArrayFilter(key, value) {
    setFilters((f) => {
      const arr = f[key]
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      }
    })
    setLimit(PAGE_SIZE)
  }

  function clearAll() {
    setFilters(INITIAL_FILTERS)
    setLimit(PAGE_SIZE)
  }

  /* ── Active filter pills ── */
  const activeFilters = useMemo(() => {
    const pills = []
    if (filters.search)
      pills.push({ key: 'search', label: `"${filters.search}"`, clear: () => updateFilter('search', '') })
    if (filters.city)
      pills.push({ key: 'city', label: filters.city, clear: () => updateFilter('city', '') })
    filters.topics.forEach((t) =>
      pills.push({ key: `topic-${t}`, label: t, clear: () => toggleArrayFilter('topics', t) })
    )
    filters.formats.forEach((f) => {
      const info = AGENDA_TYPES.find((a) => a.id === f)
      pills.push({ key: `fmt-${f}`, label: info?.label ?? f, clear: () => toggleArrayFilter('formats', f) })
    })
    if (filters.groupSize !== 'any') {
      const opt = GROUP_SIZE_OPTIONS.find((o) => o.value === filters.groupSize)
      pills.push({ key: 'size', label: opt?.label, clear: () => updateFilter('groupSize', 'any') })
    }
    if (filters.price !== 'any') {
      const opt = PRICE_OPTIONS.find((o) => o.value === filters.price)
      pills.push({ key: 'price', label: opt?.label, clear: () => updateFilter('price', 'any') })
    }
    return pills
  }, [filters])

  const hasFilters = activeFilters.length > 0

  /* ── Sidebar panel (shared between desktop and mobile) ── */
  const topicsToShow = showAllTopics ? TOPIC_TAGS : TOPIC_TAGS.slice(0, 8)

  const SidebarContent = (
    <div className="flex flex-col gap-6">

      {/* Search */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Search
        </label>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Title, topic, description…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--navy-800)] transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Topic / Interest */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Topics &amp; Interests
        </label>
        <div className="flex flex-col gap-1.5">
          {topicsToShow.map((tag) => (
            <label key={tag} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.topics.includes(tag)}
                onChange={() => toggleArrayFilter('topics', tag)}
                className="w-4 h-4 rounded accent-[var(--navy-800)] cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {tag}
              </span>
            </label>
          ))}
        </div>
        {TOPIC_TAGS.length > 8 && (
          <button
            onClick={() => setShowAllTopics((v) => !v)}
            className="mt-2 text-xs text-[var(--navy-800)] font-medium flex items-center gap-1 hover:underline"
          >
            {showAllTopics ? (
              <><ChevronUp size={12} /> Show less</>
            ) : (
              <><ChevronDown size={12} /> Show {TOPIC_TAGS.length - 8} more</>
            )}
          </button>
        )}
      </div>

      {/* Format / Agenda type */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Format
        </label>
        <div className="flex flex-col gap-1.5">
          {AGENDA_TYPES.map((at) => (
            <label key={at.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.formats.includes(at.id)}
                onChange={() => toggleArrayFilter('formats', at.id)}
                className="w-4 h-4 rounded accent-[var(--navy-800)] cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {at.icon} {at.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
          City
        </label>
        <select
          value={filters.city}
          onChange={(e) => updateFilter('city', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--navy-800)] cursor-pointer"
        >
          <option value="">All Cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Structure slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            Vibe: Structure
          </label>
          <span className="text-xs text-[var(--text-secondary)]">
            {['Very Freeform', 'Freeform', 'Mixed', 'Structured', 'Very Structured'][filters.structure - 1]}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={filters.structure}
          onChange={(e) => updateFilter('structure', Number(e.target.value))}
        />
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
          <span>Freeform</span>
          <span>Structured</span>
        </div>
      </div>

      {/* Energy slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
            Vibe: Energy
          </label>
          <span className="text-xs text-[var(--text-secondary)]">
            {['Very Quiet', 'Quiet', 'Mixed', 'Lively', 'Very Lively'][filters.energy - 1]}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={filters.energy}
          onChange={(e) => updateFilter('energy', Number(e.target.value))}
        />
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
          <span>Quiet</span>
          <span>Lively</span>
        </div>
      </div>

      {/* Group size */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Group Size
        </label>
        <select
          value={filters.groupSize}
          onChange={(e) => updateFilter('groupSize', e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--navy-800)] cursor-pointer"
        >
          {GROUP_SIZE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Price */}
      <div>
        <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
          Price
        </label>
        <div className="flex flex-col gap-1.5">
          {PRICE_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="price"
                value={o.value}
                checked={filters.price === o.value}
                onChange={() => updateFilter('price', o.value)}
                className="w-4 h-4 accent-[var(--navy-800)] cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] underline underline-offset-2 text-left transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  )

  /* ── Grid with host banner injected ── */
  function EventGrid() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )
    }

    if (events.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center">
            <Users size={28} className="text-[var(--text-muted)]" />
          </div>
          <div>
            <p className="text-[var(--text-primary)] font-semibold text-lg">No gatherings found</p>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Try adjusting your filters or clearing them to see more events.
            </p>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear all filters
            </Button>
          )}
        </div>
      )
    }

    /* Inject host banner between rows 2 and 3 (after index 5 in a 3-col grid,
       after index 3 in a 2-col grid — we use col-span-full trick) */
    const BANNER_AFTER = 6
    const rows = []
    events.forEach((event, idx) => {
      rows.push(<AgendaCard key={event.id} event={event} />)
      if (idx === BANNER_AFTER - 1) {
        rows.push(<HostBanner key="host-banner" />)
      }
    })
    // If fewer than 6 results, append banner at the end (avoid duplicating)
    if (events.length < BANNER_AFTER) {
      rows.push(<HostBanner key="host-banner-bottom" />)
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {rows}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── Page header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Discover Gatherings
          </h1>
          <p className="text-[var(--text-secondary)] mt-1.5 text-base">
            Find intimate events curated for curious minds across India.
          </p>
        </div>

        {/* ── Mobile filter toggle ── */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-sm font-medium hover:border-[var(--border-strong)] transition-colors"
          >
            <SlidersHorizontal size={15} />
            Filters
            {hasFilters && (
              <span className="w-5 h-5 rounded-full bg-[var(--navy-800)] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilters.length}
              </span>
            )}
            {filtersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Mobile slide-down filters */}
          {filtersOpen && (
            <div className="mt-3 p-4 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-md)]">
              {SidebarContent}
            </div>
          )}
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex gap-8 items-start">

          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block w-[280px] shrink-0 sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 pb-4">
            <div className="p-5 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)]">
              <div className="flex items-center justify-between mb-5">
                <span className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <SlidersHorizontal size={16} />
                  Filters
                </span>
                {hasFilters && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-[var(--navy-800)] hover:underline font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {SidebarContent}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Active filter pills */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilters.map((pill) => (
                  <button
                    key={pill.key}
                    onClick={pill.clear}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent-soft)] text-[var(--navy-800)] border border-[var(--navy-800)]/20 hover:bg-[var(--navy-800)] hover:text-white transition-colors"
                  >
                    {pill.label}
                    <X size={11} />
                  </button>
                ))}
              </div>
            )}

            {/* Result count + sort */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <p className="text-sm text-[var(--text-secondary)]">
                {isLoading ? (
                  <span className="skeleton inline-block w-32 h-4 rounded" />
                ) : (
                  <><span className="font-semibold text-[var(--text-primary)]">{events.length}</span> gathering{events.length !== 1 ? 's' : ''} found</>
                )}
              </p>

              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-muted)] hidden sm:block">Sort:</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="text-sm px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--navy-800)] cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid */}
            <EventGrid />

            {/* Load more */}
            {!isLoading && events.length >= limit && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setLimit((l) => l + PAGE_SIZE)}
                >
                  Load more gatherings
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
