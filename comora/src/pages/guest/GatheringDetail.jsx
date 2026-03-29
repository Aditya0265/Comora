import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, MapPin, Users, Star, Clock, DollarSign, Mail } from 'lucide-react'
import CategoryBadge from '../../components/ui/CategoryBadge'
import HostCredibilityBadge from '../../components/ui/HostCredibilityBadge'
import Button from '../../components/ui/Button'
import { getCategoryColor } from '../../utils/constants'

// Mock data - replace with real Supabase data
const MOCK_GATHERING = {
  id: 1,
  title: 'Philosophy & Coffee: Existentialism Deep Dive',
  description: 'Join us for weekly explorations into existentialist philosophy over artisan coffee. We create a welcoming space for both newcomers and philosophy enthusiasts to discuss Sartre, Camus, Kierkegaard, and modern interpretations of existential thought.\n\nEach session focuses on a specific text or theme, with guided discussion that encourages everyone to share their perspectives. We believe philosophy is most meaningful when it connects to lived experience, so we emphasize practical applications and personal insights alongside theoretical exploration.',
  category: 'philosophy',
  categoryColor: '#7B68BE',
  coverImage: null,
  host: {
    id: 1,
    name: 'Arjun Mehta',
    avatar: null,
    bio: 'Philosophy graduate and coffee enthusiast. I believe in creating spaces where curious minds can explore big questions together.',
    eventsHosted: 24,
    avgRating: 4.8,
    memberCount: 156,
  },
  memberCount: 24,
  rating: 4.7,
  reviewCount: 18,
  location: 'Bangalore, Indiranagar',
  vibe: 'Casual & Open-Ended',
  groupSize: '6-12 people',
  guidelines: [
    'Come with an open mind and respect for different viewpoints',
    'No prior philosophy knowledge required',
    'We start on time, please arrive 5-10 minutes early',
    'Coffee and light refreshments provided',
  ],
  upcomingEvents: [
    {
      id: 1,
      title: 'Being and Nothingness Discussion',
      date: 'Saturday, April 5, 2026',
      time: '10:00 AM - 12:00 PM',
      location: 'Third Wave Coffee, Indiranagar',
      attendees: 8,
      capacity: 12,
      price: '₹300',
    },
    {
      id: 2,
      title: 'Absurdism and The Myth of Sisyphus',
      date: 'Saturday, April 12, 2026',
      time: '10:00 AM - 12:00 PM',
      location: 'Third Wave Coffee, Indiranagar',
      attendees: 5,
      capacity: 12,
      price: '₹300',
    },
    {
      id: 3,
      title: 'Existentialism in Modern Life',
      date: 'Saturday, April 19, 2026',
      time: '10:00 AM - 12:00 PM',
      location: 'Third Wave Coffee, Indiranagar',
      attendees: 3,
      capacity: 12,
      price: '₹300',
    },
  ],
  members: [
    { id: 1, name: 'Priya Singh', avatar: null, eventsAttended: 12 },
    { id: 2, name: 'Rahul Kapoor', avatar: null, eventsAttended: 8 },
    { id: 3, name: 'Ananya Desai', avatar: null, eventsAttended: 15 },
    { id: 4, name: 'Vikram Patel', avatar: null, eventsAttended: 6 },
    { id: 5, name: 'Lakshmi Iyer', avatar: null, eventsAttended: 10 },
  ],
}

export default function GatheringDetail() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('overview')

  // In production, fetch gathering by id from Supabase
  const gathering = MOCK_GATHERING

  const categoryColor = getCategoryColor(gathering.category)

  return (
    <div style={{ background: 'var(--comora-cream)', minHeight: 'calc(100vh - 64px)' }}>
      {/* Hero Section */}
      <div
        style={{
          background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}05 100%)`,
          borderBottom: `4px solid ${categoryColor}`,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '3rem 1rem',
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <CategoryBadge categoryId={gathering.category} size="md" />
          </div>

          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: '600',
              color: 'var(--comora-charcoal)',
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
              lineHeight: '1.2',
            }}
          >
            {gathering.title}
          </h1>

          {/* Quick Stats */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '2rem',
              fontSize: '0.875rem',
              color: 'var(--comora-grey)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} />
              <span>{gathering.memberCount} members</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} />
              <span>{gathering.location}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={18} fill={categoryColor} stroke={categoryColor} />
              <span>{gathering.rating} ({gathering.reviewCount} reviews)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} />
              <span>{gathering.vibe}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* Left Column - Tabs Content */}
          <div>
            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '2rem',
                borderBottom: '2px solid var(--comora-beige)',
                marginBottom: '2rem',
              }}
            >
              {['overview', 'events', 'members', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '0.75rem 0',
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab ? `3px solid ${categoryColor}` : '3px solid transparent',
                    color: activeTab === tab ? 'var(--comora-charcoal)' : 'var(--comora-grey)',
                    fontWeight: activeTab === tab ? '600' : '500',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    marginBottom: '-2px',
                    transition: 'all 0.2s',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div>
                  <div
                    style={{
                      background: 'white',
                      padding: '2rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--comora-beige)',
                      marginBottom: '2rem',
                    }}
                  >
                    <h2
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: 'var(--comora-charcoal)',
                        marginBottom: '1rem',
                      }}
                    >
                      About This Gathering
                    </h2>
                    <p
                      style={{
                        fontSize: '1rem',
                        color: 'var(--comora-grey)',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {gathering.description}
                    </p>
                  </div>

                  <div
                    style={{
                      background: 'white',
                      padding: '2rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--comora-beige)',
                      marginBottom: '2rem',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: 'var(--comora-charcoal)',
                        marginBottom: '1rem',
                      }}
                    >
                      Community Guidelines
                    </h3>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                      {gathering.guidelines.map((guideline, index) => (
                        <li
                          key={index}
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--comora-grey)',
                            marginBottom: '0.5rem',
                            lineHeight: '1.5',
                          }}
                        >
                          {guideline}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      background: 'white',
                      padding: '2rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--comora-beige)',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: 'var(--comora-charcoal)',
                        marginBottom: '1.5rem',
                      }}
                    >
                      Your Host
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: 'var(--comora-navy)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          fontWeight: '600',
                          flexShrink: 0,
                        }}
                      >
                        {gathering.host.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Link
                          to={`/host/${gathering.host.id}`}
                          style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            color: 'var(--comora-charcoal)',
                            textDecoration: 'none',
                            marginBottom: '0.5rem',
                            display: 'block',
                          }}
                        >
                          {gathering.host.name}
                        </Link>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <HostCredibilityBadge
                            eventsHosted={gathering.host.eventsHosted}
                            avgRating={gathering.host.avgRating}
                            memberCount={gathering.host.memberCount}
                          />
                        </div>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            color: 'var(--comora-grey)',
                            lineHeight: '1.5',
                          }}
                        >
                          {gathering.host.bio}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming Events Tab */}
              {activeTab === 'events' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {gathering.upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--comora-beige)',
                        borderLeft: `4px solid ${categoryColor}`,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: 'var(--comora-charcoal)',
                          marginBottom: '1rem',
                        }}
                      >
                        {event.title}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                          <Calendar size={16} />
                          <span>{event.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                          <Clock size={16} />
                          <span>{event.time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                          <MapPin size={16} />
                          <span>{event.location}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                          <Users size={16} />
                          <span>{event.attendees}/{event.capacity} attending</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                          <DollarSign size={16} />
                          <span>{event.price}</span>
                        </div>
                      </div>
                      <Button
                        style={{
                          background: 'var(--comora-orange)',
                          color: 'white',
                          width: '100%',
                        }}
                      >
                        RSVP to This Event
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Members Tab */}
              {activeTab === 'members' && (
                <div
                  style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--comora-beige)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: 'var(--comora-charcoal)',
                      marginBottom: '1.5rem',
                    }}
                  >
                    Community Members
                  </h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '1rem',
                    }}
                  >
                    {gathering.members.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '1rem',
                          border: '1px solid var(--comora-beige)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--comora-navy)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: '600',
                            flexShrink: 0,
                          }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: 'var(--comora-charcoal)',
                              marginBottom: '0.25rem',
                            }}
                          >
                            {member.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--comora-grey)' }}>
                            {member.eventsAttended} events
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div
                  style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--comora-beige)',
                    textAlign: 'center',
                  }}
                >
                  <Star size={48} style={{ color: 'var(--comora-grey)', margin: '0 auto 1rem' }} />
                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: 'var(--comora-charcoal)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Reviews Coming Soon
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                    Review system will be available in the next update
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ position: 'sticky', top: '1rem' }}>
            <div
              style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--comora-beige)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--comora-grey)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Community Size
                </div>
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: '600',
                    color: 'var(--comora-charcoal)',
                  }}
                >
                  {gathering.memberCount}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                  active members
                </div>
              </div>

              <Button
                style={{
                  width: '100%',
                  background: 'var(--comora-orange)',
                  color: 'white',
                  marginBottom: '0.75rem',
                }}
              >
                Join Gathering
              </Button>

              <Button
                variant="outline"
                style={{
                  width: '100%',
                  borderColor: 'var(--comora-navy)',
                  color: 'var(--comora-navy)',
                }}
              >
                <Mail size={16} style={{ marginRight: '0.5rem' }} />
                Message Host
              </Button>

              <div
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--comora-beige)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--comora-grey)',
                    marginBottom: '0.75rem',
                  }}
                >
                  Details
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                  <div>
                    <div style={{ color: 'var(--comora-grey)', marginBottom: '0.25rem' }}>Location</div>
                    <div style={{ color: 'var(--comora-charcoal)', fontWeight: '500' }}>{gathering.location}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--comora-grey)', marginBottom: '0.25rem' }}>Group Size</div>
                    <div style={{ color: 'var(--comora-charcoal)', fontWeight: '500' }}>{gathering.groupSize}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--comora-grey)', marginBottom: '0.25rem' }}>Vibe</div>
                    <div style={{ color: 'var(--comora-charcoal)', fontWeight: '500' }}>{gathering.vibe}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
