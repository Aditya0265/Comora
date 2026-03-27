import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--bg-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">

        {/* Brand */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--navy-800)] flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-bold text-[var(--text-primary)]">Comora</span>
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Where people meet around ideas.<br />
            Agenda-first social gatherings for curious minds.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            "Food gathers people in a room.<br/>Ideas keep them at the table."
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Platform</p>
          {[
            { to: '/browse',      label: 'Discover Events'   },
            { to: '/communities', label: 'Communities'       },
            { to: '/host/studio/new', label: 'Host an Event',  },
            { to: '/about',       label: 'About Comora'      },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Legal */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">Legal & Support</p>
          {[
            { to: '/code-of-conduct', label: 'Code of Conduct' },
            { to: '/privacy',         label: 'Privacy Policy'  },
            { to: '/terms',           label: 'Terms of Use'    },
            { to: '/contact',         label: 'Contact Us'      },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border)] px-4 sm:px-6 py-4">
        <p className="text-center text-xs text-[var(--text-muted)]">
          © 2025 Comora ·{' '}
          <span className="italic">The goal is not a better dinner. The goal is a better city.</span>
        </p>
      </div>
    </footer>
  )
}
