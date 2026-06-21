import { useState, useCallback, useEffect, useRef } from 'react'
import trainers from '../data/trainers.json'

const ALL_GAMES = [...new Set(trainers.trainers.map(t => t.game))]
const MAX_GUESSES = 5
const MAX_TIMER_SECONDS = 3599

function pickRandom(pool, excludeId = null) {
  const filtered = excludeId ? pool.filter(t => t.id !== excludeId) : pool
  if (filtered.length === 0) return pool[Math.floor(Math.random() * pool.length)]
  return filtered[Math.floor(Math.random() * filtered.length)]
}

function scoreForRound(guesses, gameOver) {
  if (gameOver === 'won') {
    return Math.max(0, MAX_GUESSES - (guesses.length - 1))
  }
  return 0
}

export function useInfiniteMode() {
  const [selectedGames, setSelectedGames] = useState(new Set(ALL_GAMES))
  const [rounds, setRounds] = useState([])
  const [currentTrainer, setCurrentTrainer] = useState(() => {
    const pool = trainers.trainers
    return pickRandom(pool)
  })
  const [currentGuesses, setCurrentGuesses] = useState([])
  const [currentHints, setCurrentHints] = useState(0)
  const [currentGameOver, setCurrentGameOver] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0)
  const [roundElapsedSeconds, setRoundElapsedSeconds] = useState(0)
  const [finalRoundElapsedSeconds, setFinalRoundElapsedSeconds] = useState(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const timerIntervalRef = useRef(null)
  const currentGameOverRef = useRef(currentGameOver)

  useEffect(() => {
    currentGameOverRef.current = currentGameOver
  }, [currentGameOver])

  const activePool = trainers.trainers.filter(t => selectedGames.has(t.game))

  const totalScore = rounds.reduce((sum, r) => sum + scoreForRound(r.guesses, r.gameOver), 0)
  const totalPossible = rounds.length * MAX_GUESSES

  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTotalElapsedSeconds(prev => Math.min(prev + 1, MAX_TIMER_SECONDS))
        if (!currentGameOverRef.current) {
          setRoundElapsedSeconds(prev => Math.min(prev + 1, MAX_TIMER_SECONDS))
        }
      }, 1000)
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [isTimerRunning])

  const startTimer = useCallback(() => {
    setIsTimerRunning(true)
  }, [])

  const stopTimer = useCallback(() => {
    setIsTimerRunning(false)
  }, [])

  const resetGame = useCallback(() => {
    const pool = activePool.length > 0 ? activePool : trainers.trainers
    const next = pickRandom(pool)
    setCurrentTrainer(next)
    setRounds([])
    setCurrentGuesses([])
    setCurrentHints(0)
    setCurrentGameOver(false)
    setIsTransitioning(false)
    setTotalElapsedSeconds(0)
    setRoundElapsedSeconds(0)
    setFinalRoundElapsedSeconds(null)
  }, [activePool])

  function toggleGame(game) {
    setSelectedGames(prev => {
      const next = new Set(prev)
      if (next.has(game)) {
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
      setFinalRoundElapsedSeconds(roundElapsedSeconds)
      return
    }

    const newHints = newGuesses.length
    setCurrentHints(newHints)

    if (newGuesses.length >= MAX_GUESSES) {
      setCurrentGameOver('lost')
      setFinalRoundElapsedSeconds(roundElapsedSeconds)
    }
  }

  function handlePass() {
    const newGuesses = [...currentGuesses, { id: '__pass__', label: 'Passed', correct: false }]
    setCurrentGuesses(newGuesses)
    const newHints = newGuesses.length
    setCurrentHints(newHints)
    if (newGuesses.length >= MAX_GUESSES) {
      setCurrentGameOver('lost')
      setFinalRoundElapsedSeconds(roundElapsedSeconds)
    }
  }

  const advanceRound = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)

    setRounds(prev => [...prev, {
      trainer: currentTrainer,
      guesses: currentGuesses,
      gameOver: currentGameOver,
      hints: currentHints,
      elapsedSeconds: finalRoundElapsedSeconds ?? roundElapsedSeconds,
    }])

    setTimeout(() => {
      const pool = activePool.length > 0 ? activePool : trainers.trainers
      const next = pickRandom(pool, currentTrainer.id)
      setCurrentTrainer(next)
      setCurrentGuesses([])
      setCurrentHints(0)
      setCurrentGameOver(false)
      setIsTransitioning(false)
      setRoundElapsedSeconds(0)
      setFinalRoundElapsedSeconds(null)
    }, 400)
  }, [currentTrainer, currentGuesses, currentGameOver, currentHints, activePool, isTransitioning, roundElapsedSeconds, finalRoundElapsedSeconds])

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
    totalElapsedSeconds,
    roundElapsedSeconds,
    finalRoundElapsedSeconds,
    startTimer,
    stopTimer,
    isTimerRunning,
  }
}