import { cn, getInitials } from '../../lib/utils'

const sizes = {
  xs:  'w-6  h-6  text-[10px]',
  sm:  'w-8  h-8  text-xs',
  md:  'w-10 h-10 text-sm',
  lg:  'w-12 h-12 text-base',
  xl:  'w-16 h-16 text-lg',
  '2xl':'w-20 h-20 text-xl',
}

const colors = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
]

function getColor(name = '') {
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export default function Avatar({ src, name = '', size = 'md', className = '', verified = false }) {
  return (
    <div className={cn('relative shrink-0', className)}>
      <div className={cn(
        'rounded-full flex items-center justify-center font-semibold overflow-hidden',
        sizes[size],
        !src && getColor(name),
      )}>
        {src
          ? <img src={src} alt={name} className="w-full h-full object-cover" />
          : <span>{getInitials(name) || '?'}</span>
        }
      </div>
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--navy-800)] text-white rounded-full flex items-center justify-center text-[8px] font-bold border-2 border-[var(--bg-card)]">
          ✓
        </span>
      )}
    </div>
  )
}
