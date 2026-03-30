import { cn } from '../../lib/utils'

export function Input({
  label,
  error,
  hint,
  className = '',
  containerClass = '',
  icon: Icon,
  ...props
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClass)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)]">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            <Icon size={16} />
          </div>
        )}
        <input
          className={cn(
            'w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm',
            'bg-[var(--bg-card)] text-[var(--text-primary)]',
            'border border-[var(--border)]',
            'placeholder:text-[var(--text-muted)]',
            'transition-all duration-150',
            'focus:outline-none focus:border-[var(--comora-navy)] focus:ring-2 focus:ring-[var(--accent-soft)]',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
            Icon && 'pl-9',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  )
}

export default Input

export function Textarea({ label, error, hint, className = '', containerClass = '', ...props }) {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClass)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)]">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm resize-y min-h-[100px]',
          'bg-[var(--bg-card)] text-[var(--text-primary)]',
          'border border-[var(--border)]',
          'placeholder:text-[var(--text-muted)]',
          'transition-all duration-150',
          'focus:outline-none focus:border-[var(--comora-navy)] focus:ring-2 focus:ring-[var(--accent-soft)]',
          error && 'border-red-400',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  )
}

export function Select({ label, error, hint, className = '', containerClass = '', children, ...props }) {
  return (
    <div className={cn('flex flex-col gap-1.5', containerClass)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-primary)]">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm',
          'bg-[var(--bg-card)] text-[var(--text-primary)]',
          'border border-[var(--border)]',
          'transition-all duration-150',
          'focus:outline-none focus:border-[var(--comora-navy)] focus:ring-2 focus:ring-[var(--accent-soft)]',
          error && 'border-red-400',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
