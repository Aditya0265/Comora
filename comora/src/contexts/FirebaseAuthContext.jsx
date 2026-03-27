// ─── FirebaseAuthContext ──────────────────────────────────────────────────────
// Drop-in replacement for AuthContext.jsx (Supabase).
// Exports the IDENTICAL interface: { user, profile, loading, login, register,
// logout, updateProfile, isHost, isAdmin, needsMatchMe }
//
// TO SWITCH: in App.jsx change
//   import { AuthProvider, useAuth } from './contexts/AuthContext'
// to
//   import { AuthProvider, useAuth } from './contexts/FirebaseAuthContext'
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { firebaseAuth, firebaseDB } from '../lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Listen to Firebase Auth state ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        await loadProfile(firebaseUser.uid)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function loadProfile(uid) {
    const ref  = doc(firebaseDB, 'profiles', uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
      setProfile({ id: uid, ...snap.data() })
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  async function register(email, password, metadata = {}) {
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(
        firebaseAuth, email, password,
      )

      // Create profile document in Firestore
      const profileData = {
        name:                metadata.full_name ?? '',
        email,
        city:                metadata.city ?? '',
        role:                'guest',
        avatar_url:          null,
        bio:                 null,
        host_verified:       false,
        match_me_completed:  false,
        interests:           [],
        social_comfort:      null,
        dietary_preferences: [],
        budget_comfort:      null,
        preferred_group_size_min: null,
        preferred_group_size_max: null,
        created_at:          serverTimestamp(),
        updated_at:          serverTimestamp(),
      }

      await setDoc(doc(firebaseDB, 'profiles', fbUser.uid), profileData)
      setProfile({ id: fbUser.uid, ...profileData })

      return { error: null }
    } catch (err) {
      return { error: { message: friendlyAuthError(err.code) } }
    }
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function login(email, password) {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password)
      return { error: null }
    } catch (err) {
      return { error: { message: friendlyAuthError(err.code) } }
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function logout() {
    await signOut(firebaseAuth)
  }

  // ── Update profile ─────────────────────────────────────────────────────────
  async function updateProfile(updates) {
    if (!user) return { error: { message: 'Not logged in' } }
    try {
      const ref = doc(firebaseDB, 'profiles', user.uid)
      await updateDoc(ref, { ...updates, updated_at: serverTimestamp() })
      setProfile(prev => ({ ...prev, ...updates }))
      return { error: null }
    } catch (err) {
      return { error: { message: err.message } }
    }
  }

  // ── Derived flags ──────────────────────────────────────────────────────────
  const isHost       = profile?.role === 'host' || profile?.role === 'admin'
  const isAdmin      = profile?.role === 'admin'
  const needsMatchMe = !!user && !!profile && !profile.match_me_completed

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      login,
      register,
      logout,
      updateProfile,
      isHost,
      isAdmin,
      needsMatchMe,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// ── Translate Firebase error codes to readable messages ───────────────────────
function friendlyAuthError(code) {
  const map = {
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/invalid-credential':      'Invalid email or password.',
    'auth/too-many-requests':       'Too many attempts. Please wait and try again.',
    'auth/network-request-failed':  'Network error. Check your connection.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
