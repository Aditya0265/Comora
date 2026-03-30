import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Users, Sparkles, Calendar, Star, ChevronRight } from 'lucide-react'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useAuth } from '../contexts/AuthContext'

const howItWorks = [
  {
    step: '01',
    title: 'Tell us who you are',
    desc: 'Complete the Match Me quiz in 90 seconds. Your interests, social style, and city — so we only show you gatherings that fit.',
    icon: '🎯',
  },
  {
    step: '02',
    title: 'Discover by idea, not by food',
    desc: 'Browse events filtered by intellectual topic, format, and vibe — not cuisine type. Find people who read the same books as you.',
    icon: '🔍',
  },
  {
    step: '03',
    title: 'Show up ready to talk',
    desc: 'Every confirmed guest gets a Conversation Warm-Up Pack: icebreakers, discussion prompts, and trivia relevant to the agenda.',
    icon: '💬',
  },
  {
    step: '04',
    title: 'Build something that lasts',
    desc: 'Rate the experience, connect with co-attendees, and follow hosts you love. Comora is about recurring community, not one-time dinners.',
    icon: '🌱',
  },
]

const stats = [
  { label: 'Gatherings hosted',  value: '2,400+' },
  { label: 'Cities active',      value: '12'      },
  { label: 'Repeat attendance',  value: '73%'     },
  { label: 'Average rating',     value: '4.8 ★'   },
]

const categories = [
  { icon: '📚', label: 'Literature', count: '340+ events' },
  { icon: '🎬', label: 'Film Studies', count: '180+ events' },
  { icon: '🧠', label: 'Philosophy', count: '210+ events' },
  { icon: '🎵', label: 'Music & Arts', count: '150+ events' },
  { icon: '💻', label: 'Tech & Design', count: '290+ events' },
  { icon: '🚀', label: 'Career Growth', count: '120+ events' },
  { icon: '🔬', label: 'Science', count: '90+ events'  },
  { icon: '🌱', label: 'Social Impact', count: '70+ events'  },
]

export default function Landing() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  function handleBecomeHost() {
    if (!user) return navigate('/register')
    if (profile?.role === 'admin') return navigate('/admin')
    if (profile?.role === 'host') return navigate('/host/studio/new')
    return navigate('/profile?become-host=1')
  }

  return (
    <div className="flex flex-col">

      {/* ─── Hero ──────────────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20 flex flex-col items-center text-center gap-7">

          <Badge variant="warm" className="gap-1.5">
            <Sparkles size={12} />
            Agenda-first gatherings · Now in Hyderabad
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] leading-[1.1] tracking-tight max-w-3xl">
            Meet people who{' '}
            <span className="font-display italic" style={{ color: 'var(--comora-navy)' }}>think</span>{' '}
            like you
          </h1>

          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            Comora is a social gathering platform where the agenda comes first.
            Join curated discussions, workshops, and film circles
            with people who share your intellectual world.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={() => navigate('/auth/role-select')} style={{ background: 'var(--comora-orange)', color: 'white' }}>
              Get Started
              <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/discover')} style={{ borderColor: 'var(--comora-navy)', color: 'var(--comora-navy)' }}>
              Explore Gatherings
            </Button>
          </div>

          <p className="text-sm italic text-[var(--text-muted)] border-l-2 border-[var(--amber-400)] pl-3 text-left">
            "Food gathers people in a room. Ideas keep them at the table."
          </p>

        </div>
      </section>

      {/* ─── The Shift ─────────────────────────────────────── */}
      <section className="py-20 bg-[var(--bg-subtle)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col gap-8">
          <Badge variant="primary" className="self-center">The Comora Difference</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
            Other platforms ask "What do you want to eat?"<br />
            <span className="text-[var(--comora-navy)]">We ask "What do you want to talk about?"</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 text-left mt-4">
            <div className="p-5 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)]">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Old Model</p>
              <p className="text-[var(--text-secondary)] italic">"Join an Italian dinner at 7 PM on Saturday."</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">You show up, eat, struggle for conversation, go home.</p>
            </div>
            <div className="p-5 rounded-[var(--radius-xl)] border-2 border-[var(--comora-navy)] bg-[var(--accent-soft)]">
              <p className="text-xs font-semibold text-[var(--comora-navy)] uppercase tracking-wider mb-3">Comora Model</p>
              <p className="text-[var(--text-primary)] italic font-medium">"Join a dinner-discussion on the evolution of space opera — 6 people who read the same books as you."</p>
              <p className="text-sm text-[var(--comora-navy)] mt-2 font-medium">You already have something to say before you arrive.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 flex flex-col gap-3 items-center">
            <Badge variant="default">How it works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              From stranger to community in 4 steps
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="flex flex-col gap-4 p-6 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border)] card-hover">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-bold text-[var(--text-muted)] tracking-widest">{item.step}</span>
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Browse by Interest ─────────────────────────────── */}
      <section className="py-20 bg-[var(--bg-subtle)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 flex flex-col gap-3 items-center">
            <Badge variant="warm">Explore by Interest</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              Find your intellectual home
            </h2>
            <p className="text-[var(--text-secondary)] max-w-xl">
              Every gathering has a clear agenda. Browse by what you're curious about — not what you want to eat.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <Link
                key={i}
                to={`/browse?topic=${cat.label}`}
                className="flex flex-col gap-2 p-5 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border)] card-hover text-center group"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="font-semibold text-[var(--text-primary)] text-sm group-hover:text-[var(--comora-navy)] transition-colors">
                  {cat.label}
                </span>
                <span className="text-xs text-[var(--text-muted)]">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── For Hosts ─────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <Badge variant="default">For Hosts</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
              You don't need to be a chef.<br />
              <span className="text-[var(--comora-navy)]">You need to be curious.</span>
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              Traditional supper clubs require a skilled cook. Comora redefines the host as a
              community facilitator — someone with a passion and a purpose.
              The Host Studio handles the logistics. You focus on the conversation.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                'Guided event creation with agenda templates',
                'Guest dietary preferences and capacity management',
                'Guest screening to ensure the right fit',
                'Transparent earnings and reputation dashboard',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                  <span className="text-[var(--sage-500)] mt-0.5 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleBecomeHost}>
                Become a Host
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border)] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-[var(--comora-navy)]" />
                <span className="font-semibold text-[var(--text-primary)]">Host Studio</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Step-by-step event builder. Pick an agenda template, set the vibe with sliders,
                choose how guests can register — and publish in minutes.
              </p>
            </div>
            <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--bg-card)] border border-[var(--border)] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Calendar size={20} className="text-[var(--comora-orange)]" />
                <span className="font-semibold text-[var(--text-primary)]">Guest Management</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                View your confirmed guest list with dietary notes and RSVP reliability scores.
                Approve or decline request-to-join applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#1E3A5F' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center flex flex-col gap-6 items-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Your people are already here.
          </h2>
          <p className="text-blue-200 text-lg leading-relaxed">
            Stop scrolling. Start gathering. Find the room where you already
            have something to say.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="xl"
              className="!bg-white !text-[#1E3A5F] hover:!bg-blue-50"
              onClick={() => navigate('/register')}
            >
              Join Comora — It's Free
              <ArrowRight size={20} />
            </Button>
            <Button
              size="xl"
              variant="ghost"
              className="!text-white hover:!bg-white/10"
              onClick={() => navigate('/browse')}
            >
              Browse Events First
            </Button>
          </div>
          <p className="text-blue-300 text-sm italic mt-2">
            "The goal is not a better dinner. The goal is a better city."
          </p>
        </div>
      </section>
    </div>
  )
}
