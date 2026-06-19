import { useState, useCallback } from 'react'
import trainers from '../data/trainers.json'

const ALL_GAMES = [...new Set(trainers.trainers.map(t => t.game))]
const MAX_GUESSES = 5

function pickRandom(pool, excludeId = null) {
  const filtered = excludeId ? pool.filter(t => t.id !== excludeId) : pool
  if (filtered.length === 0) return pool[Math.floor(Math.random() * pool.length)]
  return filtered[Math.floor(Math.random() * filtered.length)]
}

// Points awarded for a completed round: 5 minus the number of guesses used
// (a "Pass" counts as a used guess), floored at 0. A first-guess win scores 5/5.
function scoreForRound(guesses, gameOver) {
  if (gameOver === 'won') {
    return Math.max(0, MAX_GUESSES - (guesses.length - 1))
  }
  return 0
}

export function useInfiniteMode() {
  const [selectedGames, setSelectedGames] = useState(new Set(ALL_GAMES))
  const [rounds, setRounds] = useState([]) // completed rounds, oldest first
  const [currentTrainer, setCurrentTrainer] = useState(() => {
    const pool = trainers.trainers
    return pickRandom(pool)
  })
  const [currentGuesses, setCurrentGuesses] = useState([])
  const [currentHints, setCurrentHints] = useState(0)
  const [currentGameOver, setCurrentGameOver] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const activePool = trainers.trainers.filter(t => selectedGames.has(t.game))

  // Running totals derived from completed rounds
  const totalScore = rounds.reduce((sum, r) => sum + scoreForRound(r.guesses, r.gameOver), 0)
  const totalPossible = rounds.length * MAX_GUESSES

  // Clear state and select a brand new starting trainer explicitly from the filtered pool
  const resetGame = useCallback(() => {
    const pool = activePool.length > 0 ? activePool : trainers.trainers
    const next = pickRandom(pool)
    setCurrentTrainer(next)
    setRounds([])
    setCurrentGuesses([])
    setCurrentHints(0)
    setCurrentGameOver(false)
    setIsTransitioning(false)
  }, [activePool])

  function toggleGame(game) {
    setSelectedGames(prev => {
      const next = new Set(prev)
      if (next.has(game)) {
        // Don't allow deselecting all
        if (next.size <= 1) return prev
        next.delete(game)
      } else {
        next.add(game)
      }
      return next
    })
  }

  function selectAllGames() {
    setSelectedGames(new Set(ALL_GAMES))
  }

  function handleGuess(selected) {
    const isCorrect = selected.id === currentTrainer.id
    const newGuesses = [...currentGuesses, { ...selected, correct: isCorrect }]
    setCurrentGuesses(newGuesses)

    if (isCorrect) {
      setCurrentGameOver('won')
      setCurrentHints(5)
      return
    }

    const newHints = newGuesses.length
    setCurrentHints(newHints)

    if (newGuesses.length >= MAX_GUESSES) {
      setCurrentGameOver('lost')
    }
  }

  function handlePass() {
    const newGuesses = [...currentGuesses, { id: '__pass__', label: 'Passed', correct: false }]
    setCurrentGuesses(newGuesses)
    const newHints = newGuesses.length
    setCurrentHints(newHints)
    if (newGuesses.length >= MAX_GUESSES) {
      setCurrentGameOver('lost')
    }
  }

  const advanceRound = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)

    // Archive current round
    setRounds(prev => [...prev, {
      trainer: currentTrainer,
      guesses: currentGuesses,
      gameOver: currentGameOver,
      hints: currentHints,
    }])

    // After transition delay, load next trainer
    setTimeout(() => {
      const pool = activePool.length > 0 ? activePool : trainers.trainers
      const next = pickRandom(pool, currentTrainer.id)
      setCurrentTrainer(next)
      setCurrentGuesses([])
      setCurrentHints(0)
      setCurrentGameOver(false)
      setIsTransitioning(false)
    }, 400)
  }, [currentTrainer, currentGuesses, currentGameOver, currentHints, activePool, isTransitioning])

  return {
    allGames: ALL_GAMES,
    selectedGames,
    toggleGame,
    setSelectedGames,
    selectAllGames,
    activePool,
    rounds,
    currentTrainer,
    currentGuesses,
    currentHints,
    currentGameOver,
    isTransitioning,
    handleGuess,
    handlePass,
    advanceRound,
    resetGame,
    MAX_GUESSES,
    totalScore,
    totalPossible,
    scoreForRound,
  }
}