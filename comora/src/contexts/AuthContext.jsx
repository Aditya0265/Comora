import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [profile, setProfile]     = useState(null)
  const [loading, setLoading]     = useState(true)
  const [profileError, setProfileError] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setProfileError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      // PGRST116 = no rows returned — profile row missing, try to create it
      if (error.code === 'PGRST116') {
        const { data: userData } = await supabase.auth.getUser()
        const email = userData?.user?.email ?? ''
        const meta  = userData?.user?.user_metadata ?? {}
        const { data: created, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, email, name: meta.name || email.split('@')[0], city: meta.city || '' })
          .select()
          .single()

        if (insertError) {
          console.error('[Comora] profile insert failed:', insertError.message, insertError.code)
          setProfileError(insertError.message)
          setProfile(null)
        } else {
          setProfile(created)
        }
      } else {
        console.error('[Comora] fetchProfile failed:', error.message, error.code)
        setProfileError(error.message)
        setProfile(null)
      }
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  async function register(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: metadata.full_name ?? '', city: metadata.city ?? '' } },
    })

    // If sign-up succeeded and we have a live session (email confirmation disabled),
    // persist all extended metadata to the profile row created by the DB trigger.
    if (!error && data.user && data.session) {
      const profileUpdates = {}

      // Role — only allow valid DB values
      if (metadata.role && ['guest', 'host', 'admin'].includes(metadata.role)) {
        profileUpdates.role = metadata.role
      }

      // Basic fields
      if (metadata.bio)   profileUpdates.bio   = metadata.bio
      if (metadata.phone) profileUpdates.phone = metadata.phone
      if (metadata.city)  profileUpdates.city  = metadata.city

      // Attendee / MatchMe preference fields
      if (Array.isArray(metadata.interests) && metadata.interests.length)
        profileUpdates.interests = metadata.interests
      if (metadata.social_comfort != null)
        profileUpdates.social_comfort = Number(metadata.social_comfort)
      if (metadata.preferred_group_min != null)
        profileUpdates.preferred_group_min = Number(metadata.preferred_group_min)
      if (metadata.preferred_group_max != null)
        profileUpdates.preferred_group_max = Number(metadata.preferred_group_max)
      if (Array.isArray(metadata.dietary_prefs))
        profileUpdates.dietary_prefs = metadata.dietary_prefs
      if (metadata.budget_range)
        profileUpdates.budget_range = metadata.budget_range
      if (metadata.match_me_completed != null)
        profileUpdates.match_me_completed = Boolean(metadata.match_me_completed)

      // Host-specific fields (map to existing profile columns)
      if (Array.isArray(metadata.categories) && metadata.categories.length)
        profileUpdates.expertise_tags = metadata.categories
      if (metadata.group_size_min != null)
        profileUpdates.preferred_group_min = Number(metadata.group_size_min)
      if (metadata.group_size_max != null)
        profileUpdates.preferred_group_max = Number(metadata.group_size_max)
      if (Array.isArray(metadata.dietary_accommodations))
        profileUpdates.dietary_prefs = metadata.dietary_accommodations

      if (Object.keys(profileUpdates).length > 0) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', data.user.id)
        if (updateErr) {
          console.error('[Comora] profile metadata update failed:', updateErr.message)
        } else {
          // Re-fetch profile to pick up updates (especially match_me_completed)
          // This prevents the race condition where onAuthStateChange loads the
          // pre-update profile and needsMatchMe stays true.
          await fetchProfile(data.user.id)
        }
      }
    }

    return { data, error }
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (!error) setProfile(data)
    return { data, error }
  }

  const isHost  = profile?.role === 'host'  || profile?.role === 'admin'
  const isAdmin = profile?.role === 'admin'
  const needsMatchMe = user && profile && !profile.match_me_completed

  return (
    <AuthContext.Provider value={{
      user, profile, profileError, loading,
      isHost, isAdmin, needsMatchMe,
      register, login, logout, updateProfile, fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
