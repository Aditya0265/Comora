import { Link, useNavigate } from 'react-router-dom'
import { Plus, Users, Calendar, TrendingUp, Star, Edit, Eye, MessageSquare, ChevronRight } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Button from '../../components/ui/Button'
import CategoryBadge from '../../components/ui/CategoryBadge'
import { useAuth } from '../../contexts/AuthContext'
import { getCategoryColor } from '../../utils/constants'
import { supabase } from '../../lib/supabase'

// Mock data - replace with real Supabase data
const MOCK_STATS = {
  totalMembers: 147,
  upcomingEvents: 8,
  avgAttendance: 85,
  avgRating: 4.7,
}

const MOCK_GATHERINGS = [
  {
    id: 1,
    title: 'Philosophy & Coffee',
    category: 'philosophy',
    memberCount: 24,
    nextEvent: 'Apr 5, 2026',
    status: 'active',
  },
  {
    id: 2,
    title: 'Sci-Fi Book Club',
    category: 'literature',
    memberCount: 42,
    nextEvent: 'Apr 8, 2026',
    status: 'active',
  },
  {
    id: 3,
    title: 'React Workshop Series',
    category: 'tech',
    memberCount: 38,
    nextEvent: 'Apr 10, 2026',
    status: 'active',
  },
]

const MOCK_RECENT_ACTIVITY = [
  { id: 1, type: 'rsvp', user: 'Priya Singh', gathering: 'Philosophy & Coffee', time: '2 hours ago' },
  { id: 2, type: 'question', user: 'Rahul Kapoor', gathering: 'Sci-Fi Book Club', time: '5 hours ago' },
  { id: 3, type: 'member', user: 'Ananya Desai', gathering: 'Philosophy & Coffee', time: '1 day ago' },
  { id: 4, type: 'rsvp', user: 'Vikram Patel', gathering: 'React Workshop Series', time: '2 days ago' },
]

function StatCard({ icon: Icon, label, value, subtitle, color }) {
  return (
    <div
      style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--comora-beige)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--comora-grey)',
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div
        style={{
          fontSize: '2rem',
          fontWeight: '600',
          color: 'var(--comora-charcoal)',
          marginBottom: '0.25rem',
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

export default function HostDashboardNew() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: guestMessages = [], error: msgError } = useQuery({
    queryKey: ['host-messages', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('host_messages')
        .select('*, guest:profiles!guest_id(name, avatar_url), community:communities(name)')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })

  return (
    <div style={{ background: 'var(--comora-cream)', minHeight: 'calc(100vh - 64px)' }}>
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1rem',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: '600',
                color: 'var(--comora-charcoal)',
                marginBottom: '0.5rem',
                letterSpacing: '-0.02em',
              }}
            >
              Welcome back, {profile?.name?.split(' ')[0] || 'Host'}
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--comora-grey)' }}>
              Manage your gatherings and connect with your community
            </p>
          </div>
          <Button
            onClick={() => navigate('/host/studio/new')}
            style={{
              background: 'var(--comora-orange)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Plus size={18} />
            Create New Gathering
          </Button>
        </div>

        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <StatCard
            icon={Users}
            label="Total Members"
            value={MOCK_STATS.totalMembers}
            subtitle="Across all gatherings"
            color="var(--comora-orange)"
          />
          <StatCard
            icon={Calendar}
            label="Upcoming Events"
            value={MOCK_STATS.upcomingEvents}
            subtitle="This month"
            color="var(--comora-navy)"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Attendance"
            value={`${MOCK_STATS.avgAttendance}%`}
            subtitle="Last 3 months"
            color="var(--comora-success)"
          />
          <StatCard
            icon={Star}
            label="Avg Rating"
            value={MOCK_STATS.avgRating}
            subtitle="From attendees"
            color="#E67E22"
          />
        </div>

        {/* Main Content Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* Gatherings Management */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
              }}
            >
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: 'var(--comora-charcoal)',
                }}
              >
                Your Gatherings
              </h2>
              <Link
                to="/host/studio/new"
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--comora-orange)',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
              >
                Create new →
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {MOCK_GATHERINGS.map((gathering) => {
                const categoryColor = getCategoryColor(gathering.category)
                return (
                  <div
                    key={gathering.id}
                    style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--comora-beige)',
                      borderLeft: `4px solid ${categoryColor}`,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <CategoryBadge categoryId={gathering.category} size="sm" />
                        </div>
                        <h3
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: 'var(--comora-charcoal)',
                            marginBottom: '0.5rem',
                          }}
                        >
                          {gathering.title}
                        </h3>
                        <div
                          style={{
                            display: 'flex',
                            gap: '1.5rem',
                            fontSize: '0.875rem',
                            color: 'var(--comora-grey)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Users size={14} />
                            <span>{gathering.memberCount} members</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={14} />
                            <span>Next: {gathering.nextEvent}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                        }}
                      >
                        <button
                          onClick={() => navigate(`/host/studio/${gathering.id}`)}
                          style={{
                            padding: '0.5rem',
                            background: 'none',
                            border: '1px solid var(--comora-beige)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            color: 'var(--comora-grey)',
                            transition: 'all 0.2s',
                          }}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/gathering/${gathering.id}`)}
                          style={{
                            padding: '0.5rem',
                            background: 'none',
                            border: '1px solid var(--comora-beige)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            color: 'var(--comora-grey)',
                            transition: 'all 0.2s',
                          }}
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--comora-beige)',
                        display: 'flex',
                        gap: '0.75rem',
                      }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/host/studio/new')}
                        style={{ flex: 1 }}
                      >
                        Create Event
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/gathering/${gathering.id}`)}
                        style={{ flex: 1 }}
                      >
                        View Page
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Messages Sidebar */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--comora-charcoal)' }}>Messages</h2>
                {guestMessages.filter(m => !m.is_read).length > 0 && (
                  <span style={{ padding: '0.1rem 0.5rem', borderRadius: '9999px', background: 'var(--comora-orange)', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                    {guestMessages.filter(m => !m.is_read).length} new
                  </span>
                )}
              </div>
              <Link to="/host/messages" style={{ fontSize: '0.8rem', color: 'var(--comora-orange)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View all <ChevronRight size={14} />
              </Link>
            </div>

            <div style={{ background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--comora-beige)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              {msgError ? (
                <p style={{ padding: '1rem', fontSize: '0.8rem', color: '#b91c1c' }}>{msgError.message}</p>
              ) : guestMessages.length === 0 ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                  <MessageSquare size={28} style={{ color: 'var(--comora-beige)', margin: '0 auto 0.75rem' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--comora-grey)' }}>No messages yet</p>
                </div>
              ) : (
                guestMessages.slice(0, 5).map((msg, i) => (
                  <Link
                    key={msg.id}
                    to="/host/messages"
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                      padding: '0.875rem 1rem', textDecoration: 'none',
                      borderBottom: i < Math.min(guestMessages.length, 5) - 1 ? '1px solid var(--comora-beige)' : 'none',
                      background: msg.is_read ? 'white' : '#FFF7ED',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--comora-cream)'}
                    onMouseLeave={e => e.currentTarget.style.background = msg.is_read ? 'white' : '#FFF7ED'}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--comora-navy)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0, overflow: 'hidden' }}>
                      {msg.guest?.avatar_url
                        ? <img src={msg.guest.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (msg.guest?.name?.[0] ?? '?').toUpperCase()
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <p style={{ fontWeight: msg.is_read ? 500 : 700, fontSize: '0.85rem', color: 'var(--comora-charcoal)' }}>{msg.guest?.name || 'Guest'}</p>
                        {!msg.is_read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--comora-orange)', flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--comora-grey)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: '2rem' }}>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--comora-charcoal)',
                  marginBottom: '1rem',
                }}
              >
                Quick Actions
              </h3>
              <div
                style={{
                  background: 'white',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--comora-beige)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Link
                    to="/host/studio/new"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      color: 'var(--comora-charcoal)',
                      fontSize: '0.875rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--comora-cream)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Plus size={18} />
                    <span>Create New Event</span>
                  </Link>
                  <Link
                    to="/browse"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      color: 'var(--comora-charcoal)',
                      fontSize: '0.875rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--comora-cream)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Calendar size={18} />
                    <span>Browse Events</span>
                  </Link>
                  <Link
                    to="/settings"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      color: 'var(--comora-charcoal)',
                      fontSize: '0.875rem',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--comora-cream)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Users size={18} />
                    <span>Host Settings</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
