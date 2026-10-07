import { useState, useCallback, useEffect, useRef } from 'react'
import trainers from '../data/trainers.json'

const ALL_GAMES = [...new Set(trainers.trainers.map(t => t.game))]
const ALL_DIFFICULTIES = new Set(['easy', 'medium', 'hard'])
const MAX_GUESSES = 5
const MAX_TIMER_SECONDS = 3599

const EXTRAS_META = {
  romHacks: { key: 'romHacks', label: 'Rom Hacks', dataKey: 'hack-trainers' },
  challengeMode: { key: 'challengeMode', label: 'B2W2 Challenge Mode', dataKey: 'challenge-trainers' },
  rematches: { key: 'rematches', label: 'Rematches', dataKey: 'rematch-trainers' },
  pwt: { key: 'pwt', label: 'B2W2 World Tournament', dataKey: 'pwt_trainers' },
}

// Fisher-Yates. `avoidFirstId` stops a reshuffled list from repeating the trainer just played.
function shuffle(pool, avoidFirstId = null) {
  const list = [...pool]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  if (list.length > 1 && list[0].id === avoidFirstId) [list[0], list[1]] = [list[1], list[0]]
  return list
}

function scoreForRound(guesses, gameOver) {
  if (gameOver === 'won') {
    return Math.max(0, MAX_GUESSES - (guesses.length - 1))
  }
  return 0
}

// The last game settings, kept in memory so "Back to Game Select" (which remounts Infinite mode)
// and switching modes don't reset them. A reload or new tab starts from the defaults again.
let lastSettings = null

export function useInfiniteMode() {
  const [selectedGames, setSelectedGames] = useState(() => lastSettings?.games ?? new Set(ALL_GAMES))
  const [selectedDifficulties, setSelectedDifficulties] = useState(() => lastSettings?.difficulties ?? new Set(ALL_DIFFICULTIES))
  const [enabledExtras, setEnabledExtras] = useState(() => lastSettings?.extras ?? new Set())

  useEffect(() => {
    lastSettings = { games: selectedGames, difficulties: selectedDifficulties, extras: enabledExtras }
  }, [selectedGames, selectedDifficulties, enabledExtras])
  const [rounds, setRounds] = useState([])
  const [currentTrainer, setCurrentTrainer] = useState(() => shuffle(trainers.trainers)[0])
  // The session walks a shuffled copy of the pool so every trainer comes up once before any repeat,
  // then reshuffles. `poolCompletion` marks the first time the whole pool was played.
  const queueRef = useRef([])
  const queueIndexRef = useRef(0)
  const roundEndedAtRef = useRef(0)
  const [poolCompletion, setPoolCompletion] = useState(null)
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

  const buildActivePool = useCallback(() => {
    let base = trainers.trainers.filter(t =>
      selectedGames.has(t.game) && selectedDifficulties.has(t.difficulty)
    )
    enabledExtras.forEach(key => {
      const meta = EXTRAS_META[key]
      if (meta && trainers[meta.dataKey]) {
        const extra = trainers[meta.dataKey].filter(t => selectedDifficulties.has(t.difficulty))
        base = [...base, ...extra]
      }
    })
    return base
  }, [selectedGames, selectedDifficulties, enabledExtras])

  const activePool = buildActivePool()

  // A finished round counts straight away, not only once "Next Round" moves it into `rounds`
  const currentFinished = currentGameOver && !isTransitioning
  const totalScore = rounds.reduce((sum, r) => sum + scoreForRound(r.guesses, r.gameOver), 0)
    + (currentFinished ? scoreForRound(currentGuesses, currentGameOver) : 0)
  const totalPossible = (rounds.length + (currentFinished ? 1 : 0)) * MAX_GUESSES

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

  const startTimer = useCallback(() => setIsTimerRunning(true), [])
  const stopTimer = useCallback(() => setIsTimerRunning(false), [])

  const resetGame = useCallback(() => {
    const pool = activePool.length > 0 ? activePool : trainers.trainers
    queueRef.current = shuffle(pool)
    queueIndexRef.current = 0
    setCurrentTrainer(queueRef.current[0])
    setPoolCompletion(null)
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
        if (next.size <= 1 && enabledExtras.size === 0) return prev
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

  function toggleDifficulty(diff) {
    setSelectedDifficulties(prev => {
      const next = new Set(prev)
      if (next.has(diff)) {
        if (next.size <= 1) return prev
        next.delete(diff)
      } else {
        next.add(diff)
      }
      return next
    })
  }

  function selectAllDifficulties() {
    setSelectedDifficulties(new Set(ALL_DIFFICULTIES))
  }

  function toggleExtra(key) {
    setEnabledExtras(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function endRound(result) {
    setCurrentGameOver(result)
    setFinalRoundElapsedSeconds(roundElapsedSeconds)
    roundEndedAtRef.current = totalElapsedSeconds
  }

  function handleGuess(selected) {
    const isCorrect = selected.id === currentTrainer.id
    const newGuesses = [...currentGuesses, { ...selected, correct: isCorrect }]
    setCurrentGuesses(newGuesses)

    if (isCorrect) {
      setCurrentHints(5)
      endRound('won')
      return
    }

    const newHints = newGuesses.length
    setCurrentHints(newHints)

    if (newGuesses.length >= MAX_GUESSES) endRound('lost')
  }

  function handlePass() {
    const newGuesses = [...currentGuesses, { id: '__pass__', label: 'Passed', correct: false }]
    setCurrentGuesses(newGuesses)
    const newHints = newGuesses.length
    setCurrentHints(newHints)
    if (newGuesses.length >= MAX_GUESSES) endRound('lost')
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

    queueIndexRef.current++
    if (queueIndexRef.current >= queueRef.current.length) {
      if (!poolCompletion) setPoolCompletion({ afterRound: rounds.length + 1, seconds: roundEndedAtRef.current })
      queueRef.current = shuffle(queueRef.current, currentTrainer.id)
      queueIndexRef.current = 0
    }
    const next = queueRef.current[queueIndexRef.current]

    setTimeout(() => {
      setCurrentTrainer(next)
      setCurrentGuesses([])
      setCurrentHints(0)
      setCurrentGameOver(false)
      setIsTransitioning(false)
      setRoundElapsedSeconds(0)
      setFinalRoundElapsedSeconds(null)
    }, 400)
  }, [currentTrainer, currentGuesses, currentGameOver, currentHints, isTransitioning, roundElapsedSeconds, finalRoundElapsedSeconds, poolCompletion, rounds.length])

  return {
    allGames: ALL_GAMES,
    selectedGames,
    toggleGame,
    setSelectedGames,
    selectAllGames,
    activePool,
    selectedDifficulties,
    toggleDifficulty,
    selectAllDifficulties,
    enabledExtras,
    toggleExtra,
    EXTRAS_META,
    rounds,
    poolCompletion,
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