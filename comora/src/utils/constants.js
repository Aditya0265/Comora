import {
  Book, Brain, Film, Code, Music, Microscope,
  Rocket, UtensilsCrossed, Gamepad2, Leaf
} from 'lucide-react'

// Gathering categories with theme colors and icons
export const CATEGORIES = [
  {
    id: 'literature',
    name: 'Literature & Books',
    color: '#A86F6F',
    icon: Book,
    description: 'Book clubs, reading groups, literary discussions',
  },
  {
    id: 'philosophy',
    name: 'Philosophy & Ethics',
    color: '#7B68BE',
    icon: Brain,
    description: 'Philosophical debates, ethical discussions, thought experiments',
  },
  {
    id: 'film',
    name: 'Film & Cinema',
    color: '#6A5ACD',
    icon: Film,
    description: 'Film screenings, cinema discussions, movie analysis',
  },
  {
    id: 'tech',
    name: 'Technology & Design',
    color: '#4A90E2',
    icon: Code,
    description: 'Tech meetups, design workshops, coding sessions',
  },
  {
    id: 'music',
    name: 'Music & Arts',
    color: '#E67E22',
    icon: Music,
    description: 'Music appreciation, art discussions, creative sessions',
  },
  {
    id: 'science',
    name: 'Science & Nature',
    color: '#27AE60',
    icon: Microscope,
    description: 'Science talks, nature walks, research discussions',
  },
  {
    id: 'career',
    name: 'Career & Growth',
    color: '#E74C3C',
    icon: Rocket,
    description: 'Professional development, networking, skill-building',
  },
  {
    id: 'food',
    name: 'Food Culture',
    color: '#D4A574',
    icon: UtensilsCrossed,
    description: 'Culinary experiences, food tastings, cooking workshops',
  },
  {
    id: 'gaming',
    name: 'Gaming & Anime',
    color: '#9B59B6',
    icon: Gamepad2,
    description: 'Gaming sessions, anime discussions, esports watching',
  },
  {
    id: 'social',
    name: 'Social Impact',
    color: '#16A085',
    icon: Leaf,
    description: 'Social causes, community service, activism',
  },
]

// Dietary preferences
export const DIETARY_PREFERENCES = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
  { id: 'none', label: 'No Restrictions' },
]

// Budget ranges
export const BUDGET_RANGES = [
  { id: 'low', label: 'Low-cost / BYOB', description: 'Under ₹500' },
  { id: 'moderate', label: 'Moderate', description: '₹500 - ₹1500' },
  { id: 'high', label: 'High-end', description: '₹1500+' },
  { id: 'flexible', label: 'Flexible', description: 'No preference' },
]

// Social comfort levels
export const SOCIAL_COMFORT_LEVELS = [
  { id: 'small', label: 'Small groups (4-6)', icon: '👥' },
  { id: 'large', label: 'Larger gatherings (10+)', icon: '👨‍👩‍👧‍👦' },
  { id: 'flexible', label: 'Flexible', icon: '🤝' },
]

// Hosting experience levels
export const HOSTING_EXPERIENCE = [
  { id: 'first-timer', label: 'First-timer', description: 'New to hosting' },
  { id: 'regular', label: 'Regular Host', description: 'Host occasionally' },
  { id: 'seasoned', label: 'Seasoned Curator', description: 'Experienced host' },
]

// Hosting styles
export const HOSTING_STYLES = [
  { id: 'structured', label: 'Structured & Agenda-Driven' },
  { id: 'casual', label: 'Casual & Open-Ended' },
  { id: 'mix', label: 'Mix of Both' },
]

// Helper functions
export function getCategoryById(id) {
  return CATEGORIES.find(cat => cat.id === id)
}

export function getCategoryColor(id) {
  const category = getCategoryById(id)
  return category?.color || '#666666'
}

export function getCategoryIcon(id) {
  const category = getCategoryById(id)
  return category?.icon || Book
}
