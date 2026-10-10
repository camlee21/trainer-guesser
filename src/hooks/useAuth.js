import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { dailyGameKey, CONNECTIONS_KEYS } from '../lib/storageKeys'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUpWithEmail(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  async function signOut() {
    // Guess data is reset on sign-out to not share account 1 guesses with account 2
    localStorage.removeItem(dailyGameKey())
    localStorage.removeItem(CONNECTIONS_KEYS.daily) // Same for today's Connections puzzle

    await supabase.auth.signOut()
    window.location.href = '/' // Show clear data instantly, transports to home page to prevent errors with grabbing stats
  }

  async function signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  return { user, loading, signInWithEmail, signUpWithEmail, signOut, signInWithGoogle }
}