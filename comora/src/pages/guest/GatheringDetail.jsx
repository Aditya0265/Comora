import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Star, Clock, DollarSign, Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import CategoryBadge from '../../components/ui/CategoryBadge'
import HostCredibilityBadge from '../../components/ui/HostCredibilityBadge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { getCategoryColor } from '../../utils/constants'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function GatheringDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [joiningId, setJoiningId] = useState(null)
  const [gathering, setGathering] = useState(null)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading]         = useState(true)
  const [notFound, setNotFound]       = useState(false)
  const [msgModal, setMsgModal]       = useState(false)
  const [msgText, setMsgText]         = useState('')
  const [sendingMsg, setSendingMsg]   = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setNotFound(false)

      const { data: community, error } = await supabase
        .from('communities')
        .select(`
          *,
          host:profiles!created_by(id, name, avatar_url, bio, avg_rating, total_reviews, expertise_tags)
        `)
        .eq('id', id)
        .single()

      if (error || !community) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Fetch upcoming events hosted by this community's creator
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, date_time, duration_minutes, venue_name, venue_address, venue_city, current_guests, max_guests, price')
        .eq('host_id', community.created_by)
        .in('status', ['approved', 'live'])
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(5)

      // Fetch community members
      const { data: membersData } = await supabase
        .from('community_members')
        .select('user:profiles!user_id(id, name, avatar_url)')
        .eq('community_id', id)
        .limit(10)

      setGathering(community)
      setUpcomingEvents(eventsData ?? [])
      setMembers((membersData ?? []).map(m => m.user).filter(Boolean))
      setLoading(false)
    }

    fetchData()
  }, [id])

  async function handleJoin() {
    if (!user) { navigate('/login'); return }
    setJoiningId('community')
    try {
      const { error } = await supabase
        .from('community_members')
        .upsert({ community_id: gathering.id, user_id: user.id }, { onConflict: 'community_id,user_id' })
      if (error) throw error
      toast.success('You joined the gathering!')
    } catch (err) {
      toast.error(err.message || 'Could not join. Please try again.')
    } finally {
      setJoiningId(null)
    }
  }

  async function handleRsvp(eventId) {
    if (!user) { navigate('/login'); return }
    navigate(`/events/${eventId}`)
  }

  function handleMessageHost() {
    if (!user) { navigate('/login'); return }
    setMsgModal(true)
  }

  async function handleSendMessage(e) {
    e.preventDefault()
    if (!msgText.trim()) return
    setSendingMsg(true)
    const hostId = gathering?.host?.id
    const { error } = await supabase.from('host_messages').insert({
      community_id: gathering.id,
      guest_id:     user.id,
      host_id:      hostId,
      message:      msgText.trim(),
    })
    setSendingMsg(false)
    if (error) {
      toast.error(error.message || 'Failed to send message.')
    } else {
      // Notify the host
      await supabase.from('notifications').insert({
        user_id: hostId,
        type:    'new_guest_message',
        title:   'New message from a guest',
        message: msgText.trim().length > 80 ? msgText.trim().slice(0, 80) + '…' : msgText.trim(),
      })
      toast.success('Message sent to the host!')
      setMsgText('')
      setMsgModal(false)
    }
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--comora-cream)', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--comora-grey)', fontSize: '0.875rem' }}>Loading…</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ background: 'var(--comora-cream)', minHeight: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
        <span style={{ fontSize: '3rem' }}>🔭</span>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--comora-charcoal)' }}>Gathering not found</h2>
        <p style={{ color: 'var(--comora-grey)', fontSize: '0.875rem' }}>This gathering may have been removed or the link is incorrect.</p>
        <Button variant="outline" onClick={() => navigate('/discover')}>
          <ArrowLeft size={16} />
          Back to Discover
        </Button>
      </div>
    )
  }

  const category = gathering.topic_tags?.[0]?.toLowerCase() ?? 'other'
  const categoryColor = getCategoryColor(category)

  const hostData = {
    id: gathering.host?.id ?? gathering.created_by,
    name: gathering.host?.name ?? 'Unknown Host',
    avatar: gathering.host?.avatar_url ?? null,
    bio: gathering.host?.bio ?? '',
    eventsHosted: gathering.host?.total_reviews ?? 0,
    avgRating: gathering.host?.avg_rating ? Number(gathering.host.avg_rating) : null,
    memberCount: gathering.member_count ?? 0,
  }

  return (
    <>
    <div style={{ background: 'var(--comora-cream)', minHeight: 'calc(100vh - 64px)' }}>
      {/* Hero Section */}
      <div
        style={{
          background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}05 100%)`,
          borderBottom: `4px solid ${categoryColor}`,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <CategoryBadge categoryId={category} size="md" />
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
            {gathering.name}
          </h1>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} />
              <span>{gathering.member_count ?? 0} members</span>
            </div>
            {gathering.city && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={18} />
                <span>{gathering.city}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Action Bar — visible below ~900px */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--comora-beige)', padding: '0.875rem 1rem', display: 'flex', gap: '0.75rem' }} className="md:hidden">
        <Button
          onClick={handleJoin}
          disabled={joiningId === 'community'}
          style={{ flex: 1, background: 'var(--comora-orange)', color: 'white' }}
        >
          {joiningId === 'community' ? 'Joining…' : 'Join Gathering'}
        </Button>
        <Button
          variant="outline"
          onClick={handleMessageHost}
          style={{ flex: 1, borderColor: 'var(--comora-navy)', color: 'var(--comora-navy)' }}
        >
          <Mail size={15} style={{ marginRight: '0.4rem' }} />
          Message Host
        </Button>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>

          {/* Left Column */}
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2rem', borderBottom: '2px solid var(--comora-beige)', marginBottom: '2rem' }}>
              {['overview', 'events', 'members'].map((tab) => (
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

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--comora-beige)', marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--comora-charcoal)', marginBottom: '1rem' }}>
                    About This Gathering
                  </h2>
                  <p style={{ fontSize: '1rem', color: 'var(--comora-grey)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                    {gathering.description || 'No description provided.'}
                  </p>
                </div>

                {hostData.name && (
                  <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--comora-beige)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--comora-charcoal)', marginBottom: '1.5rem' }}>
                      Your Host
                    </h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '64px', height: '64px', borderRadius: '50%',
                          background: hostData.avatar ? 'transparent' : 'var(--comora-navy)',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem', fontWeight: '600', flexShrink: 0, overflow: 'hidden',
                        }}
                      >
                        {hostData.avatar
                          ? <img src={hostData.avatar} alt={hostData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : hostData.name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <Link
                          to={`/host/${hostData.id}`}
                          style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--comora-charcoal)', textDecoration: 'none', marginBottom: '0.5rem', display: 'block' }}
                        >
                          {hostData.name}
                        </Link>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <HostCredibilityBadge
                            eventsHosted={hostData.eventsHosted}
                            avgRating={hostData.avgRating}
                            memberCount={hostData.memberCount}
                          />
                        </div>
                        {hostData.bio && (
                          <p style={{ fontSize: '0.875rem', color: 'var(--comora-grey)', lineHeight: '1.5' }}>
                            {hostData.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {upcomingEvents.length === 0 ? (
                  <div style={{ background: 'white', padding: '3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--comora-beige)', textAlign: 'center' }}>
                    <Calendar size={40} style={{ color: 'var(--comora-grey)', margin: '0 auto 1rem' }} />
                    <p style={{ color: 'var(--comora-grey)', fontSize: '0.875rem' }}>No upcoming events scheduled yet.</p>
                  </div>
                ) : upcomingEvents.map((event) => {
                  const eventDate = new Date(event.date_time)
                  const dateStr = eventDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                  const timeStr = eventDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  const endTime = new Date(eventDate.getTime() + (event.duration_minutes ?? 120) * 60000)
                  const endTimeStr = endTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div
                      key={event.id}
                      style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--comora-beige)', borderLeft: `4px solid ${categoryColor}` }}
                    >
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--comora-charcoal)', marginBottom: '1rem' }}>
                        {event.title}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                          <Calendar size={16} /><span>{dateStr}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                          <Clock size={16} /><span>{timeStr} – {endTimeStr}</span>
                        </div>
                        {(event.venue_name || event.venue_city) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                            <MapPin size={16} /><span>{[event.venue_name, event.venue_city].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                          <Users size={16} /><span>{event.current_guests}/{event.max_guests} attending</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--comora-grey)' }}>
                          <DollarSign size={16} /><span>{event.price > 0 ? `₹${event.price}` : 'Free'}</span>
                        </div>
                      </div>
                      <Button onClick={() => handleRsvp(event.id)} style={{ background: 'var(--comora-orange)', color: 'white', width: '100%' }}>
                        RSVP to This Event
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--comora-beige)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--comora-charcoal)', marginBottom: '1.5rem' }}>
                  Community Members
                </h3>
                {members.length === 0 ? (
                  <p style={{ color: 'var(--comora-grey)', fontSize: '0.875rem' }}>No members yet. Be the first to join!</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {members.map((member) => (
                      <div
                        key={member.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: '1px solid var(--comora-beige)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <div
                          style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: member.avatar_url ? 'transparent' : 'var(--comora-navy)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', fontWeight: '600', flexShrink: 0, overflow: 'hidden',
                          }}
                        >
                          {member.avatar_url
                            ? <img src={member.avatar_url} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : member.name.charAt(0).toUpperCase()
                          }
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--comora-charcoal)' }}>
                            {member.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div style={{ position: 'sticky', top: '1rem' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--comora-beige)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--comora-grey)', marginBottom: '0.5rem' }}>
                  Community Size
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '600', color: 'var(--comora-charcoal)' }}>
                  {gathering.member_count ?? 0}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--comora-grey)' }}>active members</div>
              </div>

              <Button
                onClick={handleJoin}
                disabled={joiningId === 'community'}
                style={{ width: '100%', background: 'var(--comora-orange)', color: 'white', marginBottom: '0.75rem' }}
              >
                {joiningId === 'community' ? 'Joining…' : 'Join Gathering'}
              </Button>

              <Button
                variant="outline"
                onClick={handleMessageHost}
                style={{ width: '100%', borderColor: 'var(--comora-navy)', color: 'var(--comora-navy)' }}
              >
                <Mail size={16} style={{ marginRight: '0.5rem' }} />
                Message Host
              </Button>

              {gathering.city && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--comora-beige)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--comora-grey)', marginBottom: '0.75rem' }}>
                    Details
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ color: 'var(--comora-grey)', marginBottom: '0.25rem' }}>Location</div>
                      <div style={{ color: 'var(--comora-charcoal)', fontWeight: '500' }}>{gathering.city}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ── Message Host Modal ── */}
      <Modal isOpen={msgModal} onClose={() => setMsgModal(false)} title={`Message ${gathering?.host?.name || 'Host'}`} size="sm">
        <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Ask the host anything about <strong>{gathering?.name}</strong>.
          </p>
          <textarea
            required
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            placeholder="Type your question or message…"
            rows={4}
            style={{ width: '100%', padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button variant="secondary" type="button" onClick={() => setMsgModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" loading={sendingMsg}>Send Message</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
