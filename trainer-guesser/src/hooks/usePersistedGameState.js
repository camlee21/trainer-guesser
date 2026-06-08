
import { useState, useEffect } from 'react'

function getTodayKey() {
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(now.getUTCDate()).padStart(2, '0')
  return `wtt-game-${yyyy}-${mm}-${dd}` // e.g. "wtt-game-2026-06-08"
}

export function usePersistedGameState() {
  const key = getTodayKey()

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

  // Persist whenever state changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify({ guesses, gameOver, hintsRevealed }))
  }, [guesses, gameOver, hintsRevealed])

  // Clear old keys (optional but tidy)
  useEffect(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('wtt-game-') && k !== key)
      .forEach(k => localStorage.removeItem(k))
  }, [])

  return { guesses, setGuesses, gameOver, setGameOver, hintsRevealed, setHintsRevealed }
}