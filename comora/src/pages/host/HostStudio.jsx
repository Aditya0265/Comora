import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Check, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react'

import Button from '../../components/ui/Button'
import Input, { Textarea, Select } from '../../components/ui/Input'
import AgendaCard from '../../components/events/AgendaCard'

import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  AGENDA_TYPES, TOPIC_TAGS, VIBE_LABELS, DIETARY_OPTIONS, CITIES,
} from '../../lib/utils'

// ─── constants ──────────────────────────────────────────────────────────────

const STEPS = [
  { number: 1, label: 'Template' },
  { number: 2, label: 'Identity' },
  { number: 3, label: 'Vibe' },
  { number: 4, label: 'Logistics' },
  { number: 5, label: 'Guests' },
  { number: 6, label: 'Preview' },
]

const DURATIONS = [60, 90, 120, 150, 180, 240]

const VENUE_TYPES = ['Home', 'Café', 'Community Hall', 'Park', 'Other']

// Maps display labels → DB constraint values
const VENUE_TYPE_TO_DB = {
  'Home': 'home', 'Café': 'cafe', 'Community Hall': 'hall', 'Park': 'park', 'Other': 'other',
}
// Maps DB values → display labels (for loading existing events)
const VENUE_TYPE_FROM_DB = {
  'home': 'Home', 'cafe': 'Café', 'hall': 'Community Hall', 'park': 'Park', 'other': 'Other',
}

const CANCELLATION_POLICIES = [
  { value: 'none', label: 'No policy' },
  { value: '24h',  label: '24 hours notice' },
  { value: '48h',  label: '48 hours notice' },
  { value: '72h',  label: '72 hours notice' },
]

const REG_MODES = [
  {
    value: 'open',
    label: 'Open to Anyone',
    description: 'Anyone can RSVP immediately. Great for casual events.',
    icon: '🌐',
  },
  {
    value: 'request',
    label: 'Request to Join',
    description: 'Guests apply and you approve each one. Good for curated groups.',
    icon: '✋',
  },
  {
    value: 'invite_only',
    label: 'Invite Only',
    description: 'You control who gets access. Fully private gathering.',
    icon: '🔒',
  },
]

const AGENDA_TYPE_DESCRIPTIONS = {
  book_club:    'Discuss a chosen book in an intimate group setting.',
  debate:       'Structured arguments on a topic, moderated by the host.',
  workshop:     'Hands-on learning session with practical activities.',
  screening:    'Watch and discuss a film or short together.',
  storytelling: 'Share personal stories and experiences in a circle.',
  networking:   'Connect with like-minded people in your field.',
  tasting:      'Guided culinary or beverage tasting experience.',
  discussion:   'Free-flowing conversation on a shared interest.',
}

const DEFAULT_FORM = {
  agenda_type:          '',
  title:                '',
  description:          '',
  topic_tags:           [],
  vibe_structure:       3,
  vibe_energy:          3,
  vibe_expertise:       3,
  min_guests:           4,
  max_guests:           8,
  date:                 '',
  time:                 '',
  duration_minutes:     120,
  venue_type:           'Home',
  venue_name:           '',
  venue_city:           '',
  price:                0,
  cancellation_policy:  'none',
  registration_mode:    'open',
  dietary_options:      [],
}

// ─── validation ──────────────────────────────────────────────────────────────

function validateStep(step, form) {
  const errors = {}
  if (step === 1) {
    if (!form.agenda_type) errors.agenda_type = 'Please choose a format.'
  }
  if (step === 2) {
    if (!form.title.trim()) errors.title = 'Title is required.'
    if (form.title.length > 80) errors.title = 'Max 80 characters.'
    if (!form.description.trim()) errors.description = 'Description is required.'
    if (form.description.trim().length < 100) errors.description = 'Please write at least 100 characters.'
    if (form.description.length > 5000) errors.description = 'Max 5000 characters.'
  }
  if (step === 4) {
    if (!form.date) errors.date = 'Please pick a date.'
    if (!form.time) errors.time = 'Please pick a time.'
    if (!form.venue_city) errors.venue_city = 'Please choose a city.'
  }
  return errors
}

// ─── sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ current }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((step, idx) => {
          const done    = current > step.number
          const active  = current === step.number
          return (
            <div key={step.number} className="flex items-center gap-0 flex-1">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  done   ? 'bg-[var(--comora-navy)] text-white' :
                  active ? 'bg-[var(--comora-navy)] text-white ring-4 ring-[var(--accent-soft)]' :
                            'bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}>
                  {done ? <Check size={14} /> : step.number}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${
                  active ? 'text-[var(--comora-navy)]' : 'text-[var(--text-muted)]'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 transition-colors ${
                  current > step.number ? 'bg-[var(--comora-navy)]' : 'bg-[var(--border)]'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Step1Template({ form, onChange }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Choose a Format</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        What kind of gathering do you want to host?
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AGENDA_TYPES.map((type) => {
          const selected = form.agenda_type === type.id
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange('agenda_type', type.id)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-[var(--radius-xl)] border-2 text-center transition-all ${
                selected
                  ? 'border-[var(--comora-navy)] bg-[var(--accent-soft)] shadow-[var(--shadow-md)]'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              {selected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--comora-navy)] text-white flex items-center justify-center">
                  <Check size={11} />
                </span>
              )}
              <span className="text-2xl">{type.icon}</span>
              <span className="text-xs font-semibold text-[var(--text-primary)]">{type.label}</span>
              <span className="text-[10px] text-[var(--text-muted)] leading-snug">
                {AGENDA_TYPE_DESCRIPTIONS[type.id]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Step2Identity({ form, onChange, errors }) {
  const titleLen = form.title.length
  const descLen  = form.description.length
  const [generating, setGenerating] = useState(false)
  const [suggestingTags, setSuggestingTags] = useState(false)
  const hasDescription = form.description.trim().length > 0

  async function callGroq(messages) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 300, temperature: 1.1 }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error?.message || JSON.stringify(data))
    return data.choices?.[0]?.message?.content?.trim()
  }

  async function handleDescriptionAI() {
    if (!form.title.trim()) { toast.error('Add an event title first.'); return }
    setGenerating(true)
    try {
      const agendaLabel = AGENDA_TYPES.find(a => a.id === form.agenda_type)?.label || form.agenda_type
      const messages = hasDescription
        ? [
            { role: 'system', content: `You are an expert writer for Comora, a social gathering platform built around ideas, discussions, and intellectual connection. Your job is to improve the host's event description — sharpen the writing, improve flow, and make it feel natural and inviting — while staying completely true to the event's title and format. The format "${agendaLabel}" should shape the tone and energy of the description. Do not invent details not implied by the title or original text. Always 150–180 words. No bullet points. Plain paragraph only.` },
            { role: 'user', content: `Improve this event description. Keep the core idea intact but make the writing more natural, warm, and compelling.\n\nEvent title: "${form.title}"\nFormat: ${agendaLabel}${form.topic_tags.length ? `\nTopics: ${form.topic_tags.join(', ')}` : ''}\n\nOriginal description:\n"${form.description}"` },
          ]
        : (() => {
            const styles = [
              'Open with a thought-provoking question that hooks the reader.',
              'Open with a vivid scene — paint a picture of what the evening feels like.',
              'Open with a bold statement about why this kind of gathering matters.',
              'Open with a relatable feeling of intellectual loneliness and how this event solves it.',
              'Open with the specific idea or tension at the heart of the event.',
            ]
            const style = styles[Math.floor(Math.random() * styles.length)]
            return [
              { role: 'system', content: `You write short, compelling event descriptions for Comora, a social gathering platform built around ideas, discussions, and intellectual connection — not food or entertainment. The event's title and format are your primary anchors — let them define the theme, tone, and energy of the description. Write as if you deeply understand what this specific gathering is about. Tone: warm, curious, welcoming. Always 150–180 words. No bullet points. Plain paragraph only. ${style}` },
              { role: 'user', content: `Write a description for this event. Let the title and format guide the theme and content entirely.\n\nTitle: "${form.title}"\nFormat: ${agendaLabel}${form.topic_tags.length ? `\nTopics: ${form.topic_tags.join(', ')}` : ''}` },
            ]
          })()
      const text = await callGroq(messages)
      if (text) onChange('description', text)
    } catch (err) {
      toast.error(err.message || 'Failed. Check your API key.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSuggestTags() {
    if (!form.title.trim()) { toast.error('Add an event title first.'); return }
    setSuggestingTags(true)
    try {
      const agendaLabel = AGENDA_TYPES.find(a => a.id === form.agenda_type)?.label || form.agenda_type
      const text = await callGroq([
        { role: 'system', content: `You suggest topic tags for events. Only pick from this exact list: ${TOPIC_TAGS.join(', ')}. Return only a JSON array of 3–5 tag strings. No explanation, no markdown, just the array.` },
        { role: 'user', content: `Event title: "${form.title}"\nFormat: ${agendaLabel}${form.description.trim() ? `\nDescription: "${form.description.slice(0, 200)}"` : ''}` },
      ])
      const match = text.match(/\[.*?\]/s)
      if (!match) throw new Error('Could not parse tags.')
      const suggested = JSON.parse(match[0]).filter(t => TOPIC_TAGS.includes(t)).slice(0, 5)
      if (!suggested.length) throw new Error('No matching tags found.')
      onChange('topic_tags', suggested)
      toast.success(`${suggested.length} tags suggested!`)
    } catch (err) {
      toast.error(err.message || 'Failed to suggest tags.')
    } finally {
      setSuggestingTags(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Name Your Event</h2>
        <p className="text-sm text-[var(--text-secondary)]">Give your gathering an identity that draws people in.</p>
      </div>

      <div>
        <Input
          label="Event Title"
          required
          maxLength={80}
          value={form.title}
          onChange={(e) => onChange('title', e.target.value)}
          error={errors.title}
          placeholder="e.g. Late Night Philosophy Over Coffee"
        />
        <p className={`text-xs mt-1 text-right ${titleLen > 70 ? 'text-[var(--comora-orange)]' : 'text-[var(--text-muted)]'}`}>
          {titleLen}/80
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Description <span className="text-[var(--comora-orange)]">*</span>
          </label>
          <button
            type="button"
            onClick={handleDescriptionAI}
            disabled={generating || !form.title.trim()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: generating || !form.title.trim() ? 'var(--bg-subtle)' : '#000000',
              color: generating || !form.title.trim() ? 'var(--text-muted)' : '#ffffff',
              borderColor: generating || !form.title.trim() ? 'var(--border)' : '#000000',
              cursor: generating || !form.title.trim() ? 'not-allowed' : 'pointer',
            }}
            title={!form.title.trim() ? 'Add an event title first' : hasDescription ? 'Refine your description with AI' : 'Generate a description with AI'}
          >
            {generating
              ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> {hasDescription ? 'Refining…' : 'Generating…'}</>
              : <><Sparkles size={11} /> {hasDescription ? 'Refine with AI' : 'Generate with AI'}</>
            }
          </button>
        </div>
        <Textarea
          required
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          error={errors.description}
          placeholder="Describe what guests will experience, discuss, or create. What's the mood? What should they expect?"
          style={{ minHeight: '140px' }}
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${descLen < 100 ? 'text-[var(--comora-orange)]' : 'text-[var(--text-muted)]'}`}>
            {descLen < 100 ? `${100 - descLen} more characters needed` : ''}
          </span>
          <span className={`text-xs ${descLen > 4500 ? 'text-[var(--comora-orange)]' : 'text-[var(--text-muted)]'}`}>
            {descLen}/5000
          </span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Topic Tags <span className="text-[var(--text-muted)] font-normal">(up to 5)</span>
          </p>
          <button
            type="button"
            onClick={handleSuggestTags}
            disabled={suggestingTags || !form.title.trim()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: suggestingTags || !form.title.trim() ? 'var(--bg-subtle)' : '#000000',
              color: suggestingTags || !form.title.trim() ? 'var(--text-muted)' : '#ffffff',
              borderColor: suggestingTags || !form.title.trim() ? 'var(--border)' : '#000000',
              cursor: suggestingTags || !form.title.trim() ? 'not-allowed' : 'pointer',
            }}
            title={!form.title.trim() ? 'Add an event title first' : 'Suggest tags with AI'}
          >
            {suggestingTags
              ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> Suggesting…</>
              : <><Sparkles size={11} /> Suggest Tags</>
            }
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TOPIC_TAGS.map((tag) => {
            const selected = form.topic_tags.includes(tag)
            const maxed    = !selected && form.topic_tags.length >= 5
            return (
              <button
                key={tag}
                type="button"
                disabled={maxed}
                onClick={() => {
                  const next = selected
                    ? form.topic_tags.filter((t) => t !== tag)
                    : [...form.topic_tags, tag]
                  onChange('topic_tags', next)
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selected
                    ? 'bg-[var(--comora-navy)] text-white border-[var(--comora-navy)]'
                    : maxed
                    ? 'bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border)] opacity-50 cursor-not-allowed'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Step3Vibe({ form, onChange }) {
  function VibeSlider({ axis, label, leftLabel, rightLabel }) {
    const val = form[`vibe_${axis}`] ?? 3
    const vibeLabel = VIBE_LABELS[axis]?.[val - 1] ?? ''
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
          <span className="text-xs font-semibold text-[var(--comora-navy)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full">
            {vibeLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-muted)] w-24 text-right shrink-0">{leftLabel}</span>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={val}
            onChange={(e) => onChange(`vibe_${axis}`, Number(e.target.value))}
            className="flex-1 accent-[var(--comora-navy)] h-2 cursor-pointer"
          />
          <span className="text-xs text-[var(--text-muted)] w-24 shrink-0">{rightLabel}</span>
        </div>
        <div className="flex justify-between px-[calc(1.5rem+0.25rem)]">
          {[1,2,3,4,5].map((n) => (
            <span key={n} className={`text-[10px] ${n === val ? 'text-[var(--comora-navy)] font-bold' : 'text-[var(--text-muted)]'}`}>
              {n}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Set the Vibe</h2>
        <p className="text-sm text-[var(--text-secondary)]">Help guests know what kind of experience to expect.</p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 flex flex-col gap-8">
        <VibeSlider axis="structure" label="Structure"  leftLabel="Freeform"        rightLabel="Very Structured" />
        <VibeSlider axis="energy"    label="Energy"     leftLabel="Very Quiet"       rightLabel="Very Lively"     />
        <VibeSlider axis="expertise" label="Expertise"  leftLabel="Total Beginner"   rightLabel="Expert Level"    />
      </div>

      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Group Size Range</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Min Guests</label>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={form.min_guests}
              onChange={(e) => {
                const val = Number(e.target.value)
                onChange('min_guests', val)
                if (val > form.max_guests) onChange('max_guests', val)
              }}
              className="accent-[var(--comora-navy)] h-2 cursor-pointer"
            />
            <p className="text-center text-sm font-semibold text-[var(--comora-navy)]">{form.min_guests} people</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Max Guests</label>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={form.max_guests}
              onChange={(e) => {
                const val = Number(e.target.value)
                onChange('max_guests', val)
                if (val < form.min_guests) onChange('min_guests', val)
              }}
              className="accent-[var(--comora-navy)] h-2 cursor-pointer"
            />
            <p className="text-center text-sm font-semibold text-[var(--comora-navy)]">{form.max_guests} people</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step4Logistics({ form, onChange, errors }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Logistics</h2>
        <p className="text-sm text-[var(--text-secondary)]">Pin down the when and where.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          required
          value={form.date}
          onChange={(e) => onChange('date', e.target.value)}
          error={errors.date}
        />
        <Input
          label="Time"
          type="time"
          required
          value={form.time}
          onChange={(e) => onChange('time', e.target.value)}
          error={errors.time}
        />
      </div>

      <Select
        label="Duration"
        value={form.duration_minutes}
        onChange={(e) => onChange('duration_minutes', Number(e.target.value))}
      >
        {DURATIONS.map((d) => (
          <option key={d} value={d}>
            {d >= 60 ? `${d / 60}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d} min`}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Venue Type"
          value={form.venue_type}
          onChange={(e) => onChange('venue_type', e.target.value)}
        >
          {VENUE_TYPES.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </Select>
        <Input
          label="Venue Name (optional)"
          value={form.venue_name}
          onChange={(e) => onChange('venue_name', e.target.value)}
          placeholder="e.g. Brew Lab, My Living Room"
        />
      </div>

      <Select
        label="City"
        required
        value={form.venue_city}
        onChange={(e) => onChange('venue_city', e.target.value)}
        error={errors.venue_city}
      >
        <option value="">Select city…</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </Select>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            label="Price per seat (₹)"
            type="number"
            min={0}
            step={50}
            value={form.price}
            onChange={(e) => onChange('price', Number(e.target.value))}
            hint="Set 0 for a free event"
          />
        </div>
        <Select
          label="Cancellation Policy"
          value={form.cancellation_policy}
          onChange={(e) => onChange('cancellation_policy', e.target.value)}
        >
          {CANCELLATION_POLICIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </Select>
      </div>
    </div>
  )
}

function Step5Guests({ form, onChange }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Guest Settings</h2>
        <p className="text-sm text-[var(--text-secondary)]">Decide how people can join your gathering.</p>
      </div>

      {/* Registration mode */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">Registration Mode</p>
        {REG_MODES.map((mode) => {
          const selected = form.registration_mode === mode.value
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange('registration_mode', mode.value)}
              className={`flex items-start gap-4 p-4 rounded-[var(--radius-xl)] border-2 text-left transition-all ${
                selected
                  ? 'border-[var(--comora-navy)] bg-[var(--accent-soft)]'
                  : 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--border-strong)]'
              }`}
            >
              <span className="text-2xl shrink-0">{mode.icon}</span>
              <div>
                <p className={`text-sm font-semibold ${selected ? 'text-[var(--comora-navy)]' : 'text-[var(--text-primary)]'}`}>
                  {mode.label}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{mode.description}</p>
              </div>
              {selected && (
                <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-[var(--comora-navy)] text-white flex items-center justify-center">
                  <Check size={11} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Dietary options */}
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
          Dietary Options Offered <span className="text-[var(--text-muted)] font-normal">(optional)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((opt) => {
            const selected = form.dietary_options.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const next = selected
                    ? form.dietary_options.filter((d) => d !== opt)
                    : [...form.dietary_options, opt]
                  onChange('dietary_options', next)
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selected
                    ? 'bg-[var(--sage-500)] text-white border-[var(--sage-500)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Step6Preview({ form, onSaveDraft, onPublish, isSaving, isPublishing }) {
  const agendaInfo = AGENDA_TYPES.find((a) => a.id === form.agenda_type)

  const previewEvent = {
    id:               'preview',
    title:            form.title || 'Your Event Title',
    description:      form.description,
    agenda_type:      form.agenda_type,
    topic_tags:       form.topic_tags,
    vibe_tags:        [
      VIBE_LABELS.structure?.[form.vibe_structure - 1],
      VIBE_LABELS.energy?.[form.vibe_energy - 1],
      VIBE_LABELS.expertise?.[form.vibe_expertise - 1],
    ].filter(Boolean),
    date_time:        form.date && form.time ? `${form.date}T${form.time}` : null,
    duration_minutes: form.duration_minutes,
    venue_city:       form.venue_city,
    max_guests:       form.max_guests,
    current_guests:   0,
    price:            form.price,
    registration_mode: form.registration_mode,
    status:           'draft',
    host:             { name: 'You', avatar_url: null, host_verified: false },
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Preview & Publish</h2>
        <p className="text-sm text-[var(--text-secondary)]">This is how your event will appear to guests.</p>
      </div>

      <div className="max-w-sm mx-auto w-full">
        <AgendaCard event={previewEvent} />
      </div>

      {/* Summary */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-0.5">Format</p>
          <p className="font-medium text-[var(--text-primary)]">
            {agendaInfo ? `${agendaInfo.icon} ${agendaInfo.label}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-0.5">City</p>
          <p className="font-medium text-[var(--text-primary)]">{form.venue_city || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-0.5">Group Size</p>
          <p className="font-medium text-[var(--text-primary)]">{form.min_guests}–{form.max_guests} guests</p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-0.5">Price</p>
          <p className="font-medium text-[var(--text-primary)]">
            {form.price > 0 ? `₹${form.price.toLocaleString('en-IN')}` : 'Free'}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-0.5">Registration</p>
          <p className="font-medium text-[var(--text-primary)] capitalize">
            {REG_MODES.find((r) => r.value === form.registration_mode)?.label ?? '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)] mb-0.5">Cancellation</p>
          <p className="font-medium text-[var(--text-primary)]">
            {CANCELLATION_POLICIES.find((c) => c.value === form.cancellation_policy)?.label ?? '—'}
          </p>
        </div>
      </div>

      <div className="bg-[var(--comora-orange)]/10 border border-[var(--comora-orange)]/30 rounded-[var(--radius-md)] p-4">
        <p className="text-xs text-[var(--comora-orange)] font-medium">
          Submitting for review will notify the Comora team. Events are typically reviewed within 24 hours.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          loading={isSaving}
          onClick={onSaveDraft}
        >
          Save as Draft
        </Button>
        <Button
          variant="primary"
          fullWidth
          loading={isPublishing}
          onClick={onPublish}
        >
          Submit for Review
        </Button>
      </div>
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function HostStudio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEditMode = Boolean(id)

  const [step, setStep]         = useState(1)
  const [formData, setFormData] = useState(DEFAULT_FORM)
  const [errors, setErrors]     = useState({})
  const [isSaving, setIsSaving]       = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // ── load existing event in edit mode ────────────────────────────────────
  const { data: existingEvent } = useQuery({
    queryKey: ['studio-event', id],
    enabled: isEditMode,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })

  useEffect(() => {
    if (!existingEvent) return
    const dt = existingEvent.date_time ? new Date(existingEvent.date_time) : null
    setFormData({
      agenda_type:         existingEvent.agenda_type ?? '',
      title:               existingEvent.title ?? '',
      description:         existingEvent.description ?? '',
      topic_tags:          existingEvent.topic_tags ?? [],
      vibe_structure:      existingEvent.vibe_structure ?? 3,
      vibe_energy:         existingEvent.vibe_energy ?? 3,
      vibe_expertise:      existingEvent.vibe_expertise ?? 3,
      min_guests:          existingEvent.min_guests ?? 4,
      max_guests:          existingEvent.max_guests ?? 8,
      date:                dt ? dt.toISOString().split('T')[0] : '',
      time:                dt ? dt.toTimeString().slice(0, 5)  : '',
      duration_minutes:    existingEvent.duration_minutes ?? 120,
      venue_type:          VENUE_TYPE_FROM_DB[existingEvent.venue_type] ?? existingEvent.venue_type ?? 'Home',
      venue_name:          existingEvent.venue_name ?? '',
      venue_city:          existingEvent.venue_city ?? '',
      price:               existingEvent.price ?? 0,
      cancellation_policy: existingEvent.cancellation_policy ?? 'none',
      registration_mode:   existingEvent.registration_mode ?? 'open',
      dietary_options:     existingEvent.dietary_options ?? [],
    })
  }, [existingEvent])

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleNext() {
    const stepErrors = validateStep(step, formData)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setStep((s) => Math.min(s + 1, STEPS.length))
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1))
    setErrors({})
  }

  function buildPayload(status) {
    const dateTime = formData.date && formData.time
      ? new Date(`${formData.date}T${formData.time}`).toISOString()
      : null

    return {
      host_id:             user.id,
      agenda_type:         formData.agenda_type,
      title:               formData.title,
      description:         formData.description,
      topic_tags:          formData.topic_tags,
      vibe_structure:      formData.vibe_structure,
      vibe_energy:         formData.vibe_energy,
      vibe_expertise:      formData.vibe_expertise,
      min_guests:          formData.min_guests,
      max_guests:          formData.max_guests,
      date_time:           dateTime,
      duration_minutes:    formData.duration_minutes,
      venue_type:          VENUE_TYPE_TO_DB[formData.venue_type] ?? formData.venue_type,
      venue_name:          formData.venue_name,
      venue_city:          formData.venue_city,
      price:               formData.price,
      cancellation_policy: formData.cancellation_policy,
      registration_mode:   formData.registration_mode,
      dietary_options:     formData.dietary_options,
      status,
    }
  }

  async function handleSaveDraft() {
    setIsSaving(true)
    try {
      const payload = buildPayload('draft')
      if (isEditMode) {
        const { error } = await supabase.from('events').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('events').insert(payload)
        if (error) throw error
      }
      toast.success('Draft saved!')
      navigate('/host/dashboard')
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    setIsPublishing(true)
    try {
      const payload = buildPayload('pending')
      if (isEditMode) {
        const { error } = await supabase.from('events').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('events').insert(payload)
        if (error) throw error
      }
      toast.success('Submitted for review! 🎉')
      navigate('/host/dashboard')
    } catch (err) {
      toast.error(err.message || 'Failed to submit')
    } finally {
      setIsPublishing(false)
    }
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {isEditMode ? 'Edit Event' : 'Create a New Gathering'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Step {step} of {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>

        {/* Progress bar */}
        <ProgressBar current={step} />

        {/* Step panel */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)] p-6 mb-6">
          {step === 1 && <Step1Template form={formData} onChange={handleChange} />}
          {step === 2 && <Step2Identity form={formData} onChange={handleChange} errors={errors} />}
          {step === 3 && <Step3Vibe     form={formData} onChange={handleChange} />}
          {step === 4 && <Step4Logistics form={formData} onChange={handleChange} errors={errors} />}
          {step === 5 && <Step5Guests  form={formData} onChange={handleChange} />}
          {step === 6 && (
            <Step6Preview
              form={formData}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
              isSaving={isSaving}
              isPublishing={isPublishing}
            />
          )}
        </div>

        {/* Navigation */}
        {step < 6 && (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={step === 1 ? () => navigate('/host/dashboard') : handleBack}
            >
              <ChevronLeft size={16} />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button variant="primary" onClick={handleNext}>
              {step === 5 ? 'Preview' : 'Next'}
              <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {step === 6 && (
          <div className="flex">
            <Button variant="ghost" onClick={handleBack}>
              <ChevronLeft size={16} />
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
