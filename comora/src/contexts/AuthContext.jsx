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
