import { getCategoryById } from '../../utils/constants'

export default function CategoryBadge({ categoryId, size = 'md' }) {
  const category = getCategoryById(categoryId)
  if (!category) return null

  const Icon = category.icon

  const sizes = {
    sm: {
      padding: '0.25rem 0.5rem',
      fontSize: '0.75rem',
      iconSize: 14,
    },
    md: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.875rem',
      iconSize: 16,
    },
    lg: {
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      iconSize: 18,
    },
  }

  const sizeConfig = sizes[size]

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: sizeConfig.padding,
        background: `${category.color}15`,
        border: `1px solid ${category.color}40`,
        borderRadius: 'var(--radius-full)',
        color: category.color,
        fontSize: sizeConfig.fontSize,
        fontWeight: '500',
      }}
    >
      <Icon size={sizeConfig.iconSize} />
      <span>{category.name}</span>
    </div>
  )
}
