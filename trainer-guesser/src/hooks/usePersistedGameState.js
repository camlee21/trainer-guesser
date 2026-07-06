
import { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (!user || !gameOver || !trainer) return
    const today = getTodayDateString()
    const score = gameOver === 'won' ? Math.max(0, MAX_GUESSES - (guesses.length - 1)) : 0
    supabase.from('daily_results').upsert({
      user_id: user.id,
      date: today,
      day_number: trainer.dayNumber,
      trainer_id: trainer.id,
      trainer_name: trainer.name,
      guesses_used: guesses.length,
      won: gameOver === 'won',
      score,
      guesses_json: JSON.stringify(guesses),
      hints_revealed: hintsRevealed,
    }, { onConflict: 'user_id,date' })
  }, [gameOver, user?.id])

  return { guesses, setGuesses, gameOver, setGameOver, hintsRevealed, setHintsRevealed }
}