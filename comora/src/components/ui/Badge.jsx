import { cn } from '../../lib/utils'

const variants = {
  default:   'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border)]',
  primary:   'bg-[var(--accent-soft)] text-[var(--comora-navy)] border border-[var(--navy-50)]',
  warm:      'bg-[var(--warm-soft)] text-[var(--comora-orange)] border border-[var(--amber-100)]',
  success:   'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  warning:   'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  error:     'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  info:      'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  waitlisted:'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  cancelled: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  attended:  'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  pending:   'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  approved:  'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  live:      'bg-emerald-500 text-white border-0',
  draft:     'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border)]',
}

export default function Badge({ children, variant = 'default', className = '', dot = false }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
      variants[variant] || variants.default,
      className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full bg-current')} />}
      {children}
    </span>
  )
}
