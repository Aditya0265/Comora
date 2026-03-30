import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import GatheringCard from '../../components/GatheringCard'
import FilterSidebar from '../../components/FilterSidebar'
import CategoryBadge from '../../components/ui/CategoryBadge'
import { CATEGORIES } from '../../utils/constants'
import { Input } from '../../components/ui/Input'
import { supabase } from '../../lib/supabase'

function normalizeCommunity(row) {
  return {
    id: row.id,
    title: row.name,
    description: row.description ?? '',
    category: row.topic_tags?.[0]?.toLowerCase() ?? 'other',
    host: {
      name: row.host?.name ?? 'Unknown Host',
      avatar: row.host?.avatar_url ?? null,
    },
    memberCount: row.member_count ?? 0,
    nextEvent: null,
    location: row.city ?? '',
  }
}

export default function Discover() {
  const [gatherings, setGatherings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    groupSizeMin: '',
    groupSizeMax: '',
    dietary: [],
    sortBy: 'recommended',
  })

  const [selectedCategory, setSelectedCategory] = useState(null)

  useEffect(() => {
    supabase
      .from('communities')
      .select('*, host:profiles!created_by(name, avatar_url)')
      .order('member_count', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setGatherings(data.map(normalizeCommunity))
        setLoading(false)
      })
  }, [])

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function handleClearFilters() {
    setFilters({
      search: '',
      categories: [],
      groupSizeMin: '',
      groupSizeMax: '',
      dietary: [],
      sortBy: 'recommended',
    })
    setSelectedCategory(null)
  }

  function toggleCategoryFilter(catId) {
    setSelectedCategory(selectedCategory === catId ? null : catId)
    const current = filters.categories
    const updated = current.includes(catId)
      ? current.filter(id => id !== catId)
      : [catId]
    setFilters(prev => ({ ...prev, categories: updated }))
  }

  const filteredGatherings = gatherings.filter(gathering => {
    if (filters.search) {
      const query = filters.search.toLowerCase()
      const matchesSearch =
        gathering.title.toLowerCase().includes(query) ||
        gathering.description.toLowerCase().includes(query) ||
        gathering.host.name.toLowerCase().includes(query)
      if (!matchesSearch) return false
    }

    if (filters.categories.length > 0) {
      if (!filters.categories.includes(gathering.category)) return false
    }

    return true
  })

  return (
    <div style={{ background: 'var(--comora-cream)', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Hero Section */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: '600',
              color: 'var(--comora-charcoal)',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Find your intellectual home
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--comora-grey)', marginBottom: '2rem' }}>
            Discover gatherings that match your interests and curiosity
          </p>

          {/* Search Bar */}
          <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
            <Search
              size={20}
              style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--comora-grey)' }}
            />
            <Input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search gatherings, topics, or hosts..."
              style={{ paddingLeft: '48px', fontSize: '1rem', height: '48px' }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '2rem' }}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategoryFilter(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  background: isSelected ? cat.color : 'white',
                  color: isSelected ? 'white' : cat.color,
                  border: `2px solid ${cat.color}`,
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} />
                <span>{cat.name.split(' & ')[0]}</span>
              </button>
            )
          })}
        </div>

        {/* Main Content - Sidebar + Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Filter Sidebar */}
          <FilterSidebar
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          {/* Gatherings Grid */}
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                {loading ? 'Loading…' : `${filteredGatherings.length} gatherings found`}
              </p>
            </div>

            {!loading && filteredGatherings.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredGatherings.map((gathering) => (
                  <GatheringCard key={gathering.id} gathering={gathering} />
                ))}
              </div>
            ) : !loading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--comora-beige)',
                }}
              >
                <div
                  style={{
                    width: '80px', height: '80px', margin: '0 auto 1.5rem',
                    borderRadius: '50%', background: 'var(--comora-cream)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Search size={32} style={{ color: 'var(--comora-grey)' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--comora-charcoal)', marginBottom: '0.5rem' }}>
                  No gatherings found
                </h3>
                <p style={{ color: 'var(--comora-grey)', marginBottom: '1.5rem' }}>
                  {gatherings.length === 0
                    ? 'No communities have been created yet. Be the first!'
                    : 'Try adjusting your filters or check back soon for new gatherings.'}
                </p>
                {gatherings.length > 0 && (
                  <button
                    onClick={handleClearFilters}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'var(--comora-orange)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
