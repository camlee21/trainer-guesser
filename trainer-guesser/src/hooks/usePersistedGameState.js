
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthContext } from '../contexts/AuthContext'

const STORAGE_VERSION = __APP_VERSION__
const MAX_GUESSES = 5

function getTodayKey() {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  return `wtt-game-${yyyy}-${mm}-${dd}`
}

function getTodayDateString() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

export function usePersistedGameState(trainer) {
  const { user } = useAuthContext()
  const key = getTodayKey()
  const trainerRef = useRef(trainer)
  const userRef = useRef(user)

  useEffect(() => { trainerRef.current = trainer }, [trainer])
  useEffect(() => { userRef.current = user }, [user])

  const storedVersion = localStorage.getItem('wtt-version')
  if (storedVersion !== STORAGE_VERSION) {
    localStorage.removeItem(key)
    localStorage.setItem('wtt-version', STORAGE_VERSION)
  }

  const [guesses, setGuesses] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key))
      return saved?.guesses ?? []
    } catch { return [] }
  })

  const [gameOver, setGameOver] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key))
      return saved?.gameOver ?? false
    } catch { return false }
  })

  const [hintsRevealed, setHintsRevealed] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key))
      return saved?.hintsRevealed ?? 0
    } catch { return 0 }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify({ guesses, gameOver, hintsRevealed }))
  }, [guesses, gameOver, hintsRevealed])

  useEffect(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('wtt-game-') && k !== key)
      .forEach(k => localStorage.removeItem(k))
  }, [])

  useEffect(() => {
    if (!user || !trainer) return
    async function syncWithSupabase() {
      const today = getTodayDateString()
      const { data, error } = await supabase
        .from('daily_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      if (error) return

      if (data) {
        // Restore this user's saved progress from Supabase
        setGuesses(JSON.parse(data.guesses_json))
        setGameOver(data.won ? 'won' : 'lost')
        setHintsRevealed(data.hints_revealed)
      } else {
        // No Supabase record for this user today
        const saved = JSON.parse(localStorage.getItem(key))
        if (saved?.gameOver) {
          // A completed game exists in localStorage but not in Supabase
          // for this user — it belongs to a different account, so clear it
          localStorage.removeItem(key)
          setGuesses([])
          setGameOver(false)
          setHintsRevealed(0)
        }
      }
    }
    syncWithSupabase()
  }, [user?.id, trainer?.id])

  // Explicit save function called directly when game ends
  // Uses passed values instead of state to avoid stale closure issues
  async function saveResult(finalGuesses, finalGameOver, finalHints) {
    const currentUser = userRef.current
    const currentTrainer = trainerRef.current
    if (!currentUser || !currentTrainer) return
    const today = getTodayDateString()
    const score = finalGameOver === 'won'
      ? Math.max(0, MAX_GUESSES - (finalGuesses.length - 1))
      : 0
    await supabase.from('daily_results').upsert({
      user_id: currentUser.id,
      date: today,
      day_number: currentTrainer.dayNumber,
      trainer_id: currentTrainer.id,
      trainer_name: currentTrainer.name,
      guesses_used: finalGuesses.length,
      won: finalGameOver === 'won',
      score,
      guesses_json: JSON.stringify(finalGuesses),
      hints_revealed: finalHints,
    }, { onConflict: 'user_id,date' })
  }

  return { guesses, setGuesses, gameOver, setGameOver, hintsRevealed, setHintsRevealed, saveResult }
}