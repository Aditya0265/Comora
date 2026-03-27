import { format, formatDistanceToNow, isPast, addHours } from 'date-fns'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date) {
  return format(new Date(date), 'EEE, d MMM yyyy')
}

export function formatTime(date) {
  return format(new Date(date), 'h:mm a')
}

export function formatDateTime(date) {
  return format(new Date(date), 'EEE, d MMM · h:mm a')
}

export function timeFromNow(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isEventPast(date) {
  return isPast(new Date(date))
}

export function getEventEndTime(startDate, durationMinutes) {
  const start = new Date(startDate)
  return new Date(start.getTime() + durationMinutes * 60000)
}

export function formatCurrency(amount) {
  if (!amount || amount === 0) return 'Free'
  return `₹${amount.toLocaleString('en-IN')}`
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function truncate(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

export const AGENDA_TYPES = [
  { id: 'book_club',    label: 'Book Club',      icon: '📚', tagClass: 'tag-discussion' },
  { id: 'debate',       label: 'Debate',          icon: '🎙️', tagClass: 'tag-debate'    },
  { id: 'workshop',     label: 'Workshop',        icon: '🛠️', tagClass: 'tag-workshop'  },
  { id: 'screening',    label: 'Film Screening',  icon: '🎬', tagClass: 'tag-screening' },
  { id: 'storytelling', label: 'Storytelling',    icon: '✍️', tagClass: 'tag-freeform'  },
  { id: 'networking',   label: 'Networking',      icon: '🤝', tagClass: 'tag-networking'},
  { id: 'tasting',      label: 'Tasting',         icon: '🍽️', tagClass: 'tag-tasting'  },
  { id: 'discussion',   label: 'Open Discussion', icon: '💬', tagClass: 'tag-discussion'},
]

export const TOPIC_TAGS = [
  'Fantasy Fiction', 'Science Fiction', 'Classic Literature', 'Contemporary Fiction',
  'Philosophy', 'History', 'Science & Tech', 'Film Studies', 'Indie Music',
  'Visual Arts', 'Game Design', 'Entrepreneurship', 'Career Transition',
  'Mental Health', 'Sustainability', 'Food Culture', 'Travel', 'Photography',
  'Theatre', 'Poetry', 'UX Design', 'Data & AI', 'Social Impact',
]

export const VIBE_LABELS = {
  structure:  ['Very Freeform', 'Freeform', 'Mixed', 'Structured', 'Very Structured'],
  energy:     ['Very Quiet',    'Quiet',    'Mixed', 'Lively',     'Very Lively'    ],
  expertise:  ['Complete Beginner', 'Beginner', 'Mixed', 'Intermediate', 'Expert'  ],
  groupSize:  ['2–4 people', '4–6 people', '6–8 people', '8–12 people', '12+ people'],
}

export const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Jain', 'Gluten-Free', 'Dairy-Free',
  'Nut-Free', 'Halal', 'No Restrictions',
]

export const CITIES = [
  'Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi', 'Chennai',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi',
]

export const INTEREST_CATEGORIES = [
  { id: 'literature',  label: 'Literature & Books',  icon: '📚' },
  { id: 'film',        label: 'Film & Cinema',        icon: '🎬' },
  { id: 'philosophy',  label: 'Philosophy & Ethics',  icon: '🧠' },
  { id: 'music',       label: 'Music & Arts',         icon: '🎵' },
  { id: 'tech',        label: 'Technology & Design',  icon: '💻' },
  { id: 'science',     label: 'Science & Nature',     icon: '🔬' },
  { id: 'career',      label: 'Career & Growth',      icon: '🚀' },
  { id: 'food',        label: 'Food Culture',         icon: '🍜' },
  { id: 'gaming',      label: 'Gaming & Anime',       icon: '🎮' },
  { id: 'social',      label: 'Social Impact',        icon: '🌱' },
]

export const SOCIAL_COMFORT = [
  { value: 1, label: 'Very Introverted', desc: 'I prefer small, quiet groups' },
  { value: 2, label: 'Mostly Introverted', desc: 'I warm up slowly but enjoy good conversation' },
  { value: 3, label: 'Ambivert', desc: 'Depends on the vibe and people' },
  { value: 4, label: 'Mostly Extroverted', desc: 'I love meeting new people' },
  { value: 5, label: 'Very Extroverted', desc: 'The bigger and livelier the better' },
]
