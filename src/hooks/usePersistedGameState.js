import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthContext } from '../contexts/AuthContext'
import { getUtcDateString } from '../lib/dailySchedule.js'
import { useResultSaver } from './useResultSaver'

const STORAGE_VERSION = __APP_VERSION__
const MAX_GUESSES = 5

function readSavedGame(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch { return null }
}

function getTodayDateString() {
  return getUtcDateString(new Date())
}

function getTodayKey() {
  return `wtt-game-${getTodayDateString()}`
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

  const [guesses, setGuesses] = useState(() => readSavedGame(key)?.guesses ?? [])
  const [gameOver, setGameOver] = useState(() => readSavedGame(key)?.gameOver ?? false)
  const [hintsRevealed, setHintsRevealed] = useState(() => readSavedGame(key)?.hintsRevealed ?? 0)
  // Account that played today's saved game (null = played as a guest)
  const [ownerId, setOwnerId] = useState(() => readSavedGame(key)?.userId ?? null)
  const { saveStatus, setSaveStatus, save } = useResultSaver('daily_results')

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify({ guesses, gameOver, hintsRevealed, userId: ownerId }))
  }, [guesses, gameOver, hintsRevealed, ownerId])

  useEffect(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('wtt-game-') && k !== key)
      .forEach(k => localStorage.removeItem(k))
  }, [])

  useEffect(() => {
    if (!user || !trainer) return
    let cancelled = false
    async function syncWithSupabase() {
      const today = getTodayDateString()
      const { data, error } = await supabase
        .from('daily_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      // Offline or a server error: try again when the browser comes back online
      if (cancelled || error) return

      if (data) {
        // Restore this user's saved progress from Supabase
        setGuesses(JSON.parse(data.guesses_json))
        setGameOver(data.won ? 'won' : 'lost')
        setHintsRevealed(data.hints_revealed)
        setOwnerId(user.id)
        setSaveStatus('saved')
        return
      }

      // No Supabase record for this user today
      const saved = readSavedGame(key)
      if (saved?.userId && saved.userId !== user.id) {
        // Left over from a different account (e.g. its session expired
        // without signing out), so don't show or upload it
        localStorage.removeItem(key)
        setGuesses([])
        setGameOver(false)
        setHintsRevealed(0)
        setOwnerId(user.id)
        return
      }

      setOwnerId(user.id)
      if (saved?.gameOver) {
        // Finished as a guest before logging in, or an earlier save
        // failed: upload it now instead of losing it
        await saveResult(saved.guesses, saved.gameOver, saved.hintsRevealed)
      }
    }
    syncWithSupabase()
    window.addEventListener('online', syncWithSupabase)
    return () => {
      cancelled = true
      window.removeEventListener('online', syncWithSupabase)
    }
  }, [user?.id, trainer?.id])

  // Explicit save function called directly when game ends
  // Uses passed values instead of state to avoid stale closure issues
  async function saveResult(finalGuesses, finalGameOver, finalHints) {
    if (!userRef.current || !trainerRef.current) return
    setOwnerId(userRef.current.id)
    await save(() => {
      const currentUser = userRef.current
      const currentTrainer = trainerRef.current
      if (!currentUser || !currentTrainer) return null
      return {
        user_id: currentUser.id,
        date: getTodayDateString(),
        day_number: currentTrainer.dayNumber,
        trainer_id: currentTrainer.id,
        trainer_name: currentTrainer.name,
        guesses_used: finalGuesses.length,
        won: finalGameOver === 'won',
        score: finalGameOver === 'won' ? Math.max(0, MAX_GUESSES - (finalGuesses.length - 1)) : 0,
        guesses_json: JSON.stringify(finalGuesses),
        hints_revealed: finalHints,
      }
    })
  }

  return { guesses, setGuesses, gameOver, setGameOver, hintsRevealed, setHintsRevealed, saveResult, saveStatus }
}