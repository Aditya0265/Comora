import { cn } from '../../lib/utils'

const variants = {
  primary:   'bg-[var(--comora-orange)] text-white hover:bg-[var(--accent-hover)] shadow-sm',
  secondary: 'bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--border)] hover:border-[var(--border-strong)]',
  ghost:     'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
  danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  warm:      'bg-[var(--comora-orange)] text-white hover:opacity-90 shadow-sm',
  outline:   'border border-[var(--comora-navy)] text-[var(--comora-navy)] hover:bg-[var(--accent-soft)]',
}

const sizes = {
  sm:   'px-3 py-1.5 text-sm gap-1.5',
  md:   'px-4 py-2 text-sm gap-2',
  lg:   'px-6 py-3 text-base gap-2',
  xl:   'px-8 py-4 text-lg gap-2.5',
  icon: 'p-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  fullWidth = false,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
          {children}
        </>
      ) : children}
    </button>
  )
}
