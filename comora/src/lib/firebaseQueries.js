// ─── Firestore query helpers ──────────────────────────────────────────────────
// These mirror the Supabase queries used across pages.
// Each function is a drop-in replacement for its supabase equivalent.
//
// Firestore collections:
//   /profiles/{uid}
//   /events/{eventId}
//   /bookings/{bookingId}
//   /reviews/{reviewId}
//   /communities/{communityId}
//   /community_members/{memberId}
//   /notifications/{notifId}
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection, doc,
  getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit as fsLimit,
  serverTimestamp, increment,
} from 'firebase/firestore'
import { firebaseDB } from './firebase'

const col = (name) => collection(firebaseDB, name)
const ref = (name, id) => doc(firebaseDB, name, id)

// ─── PROFILES ────────────────────────────────────────────────────────────────

export async function getProfile(uid) {
  const snap = await getDoc(ref('profiles', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateProfileDoc(uid, updates) {
  await updateDoc(ref('profiles', uid), { ...updates, updated_at: serverTimestamp() })
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────

export async function getLiveEvents({ cityFilter, limitN = 12 } = {}) {
  let q = query(col('events'), where('status', '==', 'live'), orderBy('date_time'), fsLimit(limitN))
  if (cityFilter) {
    q = query(col('events'), where('status', '==', 'live'), where('venue_city', '==', cityFilter), orderBy('date_time'), fsLimit(limitN))
  }
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getEventById(eventId) {
  const snap = await getDoc(ref('events', eventId))
  if (!snap.exists()) return null
  const event = { id: snap.id, ...snap.data() }

  // Attach host profile
  if (event.host_id) {
    const hostSnap = await getDoc(ref('profiles', event.host_id))
    if (hostSnap.exists()) {
      event.host = { id: hostSnap.id, ...hostSnap.data() }
    }
  }
  return event
}

export async function getEventsByHost(hostId) {
  const q = query(col('events'), where('host_id', '==', hostId), orderBy('date_time'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function createEvent(data, hostId) {
  const docRef = await addDoc(col('events'), {
    ...data,
    host_id:        hostId,
    current_guests: 0,
    avg_overall:    null,
    review_count:   0,
    status:         'draft',
    created_at:     serverTimestamp(),
    updated_at:     serverTimestamp(),
  })
  return docRef.id
}

export async function updateEvent(eventId, updates) {
  await updateDoc(ref('events', eventId), { ...updates, updated_at: serverTimestamp() })
}

export async function publishEvent(eventId) {
  await updateDoc(ref('events', eventId), { status: 'live', updated_at: serverTimestamp() })
}

export async function cancelEvent(eventId) {
  await updateDoc(ref('events', eventId), { status: 'cancelled', updated_at: serverTimestamp() })
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

export async function getUserBookings(userId) {
  const q = query(col('bookings'), where('guest_id', '==', userId), orderBy('created_at', 'desc'))
  const snap = await getDocs(q)
  const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  // Attach event data to each booking
  await Promise.all(bookings.map(async (b) => {
    const evSnap = await getDoc(ref('events', b.event_id))
    if (evSnap.exists()) b.event = { id: evSnap.id, ...evSnap.data() }
  }))

  return bookings
}

export async function getEventBookings(eventId) {
  const q = query(col('bookings'), where('event_id', '==', eventId))
  const snap = await getDocs(q)
  const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  // Attach guest profiles
  await Promise.all(bookings.map(async (b) => {
    const guestSnap = await getDoc(ref('profiles', b.guest_id))
    if (guestSnap.exists()) b.guest = { id: guestSnap.id, ...guestSnap.data() }
  }))

  return bookings
}

export async function getUserBookingForEvent(eventId, userId) {
  const q = query(col('bookings'), where('event_id', '==', eventId), where('guest_id', '==', userId), fsLimit(1))
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function createBooking(eventId, userId, data = {}) {
  // Increment guest count on event
  await updateDoc(ref('events', eventId), { current_guests: increment(1) })

  const docRef = await addDoc(col('bookings'), {
    event_id:       eventId,
    guest_id:       userId,
    status:         'confirmed',
    payment_status: 'pending',
    amount_paid:    data.amount ?? 0,
    notes:          data.notes ?? '',
    waitlist_pos:   null,
    created_at:     serverTimestamp(),
  })
  return docRef.id
}

export async function cancelBooking(bookingId, eventId) {
  await updateDoc(ref('bookings', bookingId), { status: 'cancelled', updated_at: serverTimestamp() })
  await updateDoc(ref('events', eventId), { current_guests: increment(-1) })
}

export async function updateBookingStatus(bookingId, status) {
  await updateDoc(ref('bookings', bookingId), { status, updated_at: serverTimestamp() })
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────────

export async function getEventReviews(eventId) {
  const q = query(col('reviews'), where('event_id', '==', eventId), where('is_visible', '==', true), orderBy('created_at', 'desc'), fsLimit(5))
  const snap = await getDocs(q)
  const reviews = snap.docs.map(d => ({ id: d.id, ...d.data() }))

  await Promise.all(reviews.map(async (r) => {
    const rSnap = await getDoc(ref('profiles', r.reviewer_id))
    if (rSnap.exists()) r.reviewer = { id: rSnap.id, ...rSnap.data() }
  }))
  return reviews
}

export async function createReview(data) {
  const overall = (
    (data.agenda_quality + data.host_warmth + data.food_accuracy + data.group_vibe) / 4
  )
  await addDoc(col('reviews'), {
    ...data,
    overall,
    is_visible: true,
    created_at: serverTimestamp(),
  })
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export async function getUserNotifications(userId) {
  const q = query(col('notifications'), where('user_id', '==', userId), orderBy('created_at', 'desc'), fsLimit(20))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function markNotificationRead(notifId) {
  await updateDoc(ref('notifications', notifId), { is_read: true })
}

// ─── AVATAR UPLOAD (Firebase Storage) ────────────────────────────────────────
// Usage: import { uploadAvatar } from './firebaseQueries'

import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { firebaseStorage } from './firebase'

export async function uploadAvatar(userId, file) {
  const path     = `avatars/${userId}/${Date.now()}_${file.name}`
  const fileRef  = storageRef(firebaseStorage, path)
  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)
  await updateProfileDoc(userId, { avatar_url: url })
  return url
}
