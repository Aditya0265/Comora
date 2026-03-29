import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { CATEGORIES, DIETARY_PREFERENCES } from '../utils/constants'
import { Input } from './ui/Input'
import Button from './ui/Button'

export default function FilterSidebar({ filters, onFilterChange, onClearFilters }) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '')

  function handleSearchChange(e) {
    const value = e.target.value
    setSearchQuery(value)
    onFilterChange('search', value)
  }

  function toggleCategory(catId) {
    const current = filters.categories || []
    const updated = current.includes(catId)
      ? current.filter(id => id !== catId)
      : [...current, catId]
    onFilterChange('categories', updated)
  }

  function toggleDietary(dietId) {
    const current = filters.dietary || []
    const updated = current.includes(dietId)
      ? current.filter(id => id !== dietId)
      : [...current, dietId]
    onFilterChange('dietary', updated)
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '280px',
        background: 'white',
        borderRadius: 'var(--radius-sm)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--comora-beige)',
        position: 'sticky',
        top: '1rem',
        maxHeight: 'calc(100vh - 2rem)',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--comora-charcoal)',
          }}
        >
          Filters
        </h3>
        <button
          type="button"
          onClick={onClearFilters}
          style={{
            fontSize: '0.75rem',
            color: 'var(--comora-grey)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Clear all
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--comora-charcoal)',
            marginBottom: '0.5rem',
          }}
        >
          Search
        </label>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--comora-grey)',
            }}
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Title, topic, host..."
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Categories */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--comora-charcoal)',
            marginBottom: '0.75rem',
          }}
        >
          Category
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const isSelected = (filters.categories || []).includes(cat.id)
            return (
              <label
                key={cat.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: isSelected ? `${cat.color}10` : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategory(cat.id)}
                  style={{ cursor: 'pointer' }}
                />
                <Icon size={16} style={{ color: cat.color }} />
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--comora-charcoal)',
                    flex: 1,
                  }}
                >
                  {cat.name.split(' & ')[0]}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Group Size */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--comora-charcoal)',
            marginBottom: '0.75rem',
          }}
        >
          Group Size
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Input
            type="number"
            placeholder="Min"
            value={filters.groupSizeMin || ''}
            onChange={(e) => onFilterChange('groupSizeMin', e.target.value)}
            min="2"
            max="50"
            style={{ flex: 1 }}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.groupSizeMax || ''}
            onChange={(e) => onFilterChange('groupSizeMax', e.target.value)}
            min="2"
            max="50"
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Dietary Accommodations */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--comora-charcoal)',
            marginBottom: '0.75rem',
          }}
        >
          Dietary Accommodations
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {DIETARY_PREFERENCES.map((diet) => {
            const isSelected = (filters.dietary || []).includes(diet.id)
            return (
              <label
                key={diet.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: isSelected ? '#FFF5F0' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleDietary(diet.id)}
                  style={{ cursor: 'pointer' }}
                />
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--comora-charcoal)',
                  }}
                >
                  {diet.label}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--comora-charcoal)',
            marginBottom: '0.5rem',
          }}
        >
          Sort By
        </label>
        <select
          value={filters.sortBy || 'recommended'}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--comora-beige)',
            fontSize: '0.875rem',
            color: 'var(--comora-charcoal)',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="recommended">Recommended</option>
          <option value="newest">Newest</option>
          <option value="members">Most Members</option>
          <option value="upcoming">Upcoming Date</option>
        </select>
      </div>
    </div>
  )
}
