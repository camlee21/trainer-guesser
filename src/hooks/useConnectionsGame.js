import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { getTrainer, findShortestRoute, pickRandomPair, getDailyPair, trainerUsesPokemon, TIME_LIMIT_MS } from '../lib/connectionsGraph'
import { getDayNumber, dayNumberToUtcDateString } from '../lib/dailySchedule.js'
import { supabase } from '../lib/supabaseClient'
import { recordCompletion } from '../lib/completionCounter'
import { useAuthContext } from '../contexts/AuthContext'
import { useMedals } from '../contexts/MedalsContext'
import { connectionsFacts, customConnectionsProgress } from '../lib/medals'

// Daily and custom games are saved separately, so playing one never disturbs the other.
// A custom game only lasts for the browser tab (sessionStorage), so coming back later starts at trainer selection.
const STORAGE_KEYS = { daily: 'wtt-connections-daily', custom: 'wtt-connections' }
const storageFor = kind => (kind === 'custom' ? sessionStorage : localStorage)
// Finished daily puzzles are also saved to the signed-in account, like Daily mode's daily_results
const RESULTS_TABLE = 'connections_results'
// Same retry schedule as Daily mode. After these run out, the save is retried when the browser
// comes back online or the page is next loaded.
const RETRY_DELAYS_MS = [2000, 5000, 15000]

function newGame(startId, goalId, phase) {
  // startedAt is set by the first Pokémon pick; elapsedMs once the game ends
  return { phase, startId, goalId, trainers: [startId], pokemon: [], undos: 0, outcome: null, startedAt: null, elapsedMs: null }
}

function freshCustom() {
  const { startId, goalId } = pickRandomPair()
  return newGame(startId, goalId, 'setup')
}

function freshDaily(dayNumber) {
  const { startId, goalId } = getDailyPair(dayNumber)
  return { ...newGame(startId, goalId, 'playing'), dayNumber }
}

// A saved game is only usable if trainers.json hasn't changed underneath it since it was saved
function isValidGame(game) {
  if (!game || !['setup', 'playing', 'finished'].includes(game.phase)) return false
  const { startId, goalId, trainers, pokemon } = game
  if (!getTrainer(startId) || !getTrainer(goalId)) return false
  if (!Array.isArray(trainers) || !Array.isArray(pokemon) || trainers[0] !== startId) return false
  if (!trainers.every(getTrainer)) return false
  if (pokemon.length !== trainers.length && pokemon.length !== trainers.length - 1) return false
  return pokemon.every((pokedexId, i) =>
    trainerUsesPokemon(trainers[i], pokedexId) && (i + 1 >= trainers.length || trainerUsesPokemon(trainers[i + 1], pokedexId))
  )
}

function loadSaved(kind) {
  try {
    const saved = JSON.parse(storageFor(kind).getItem(STORAGE_KEYS[kind]))
    // Games saved before undos or the timer existed count as having none
    return isValidGame(saved) ? { undos: 0, startedAt: null, elapsedMs: null, ...saved } : null
  } catch {
    return null
  }
}

// A finished daily puzzle as stored in Supabase, turned back into game state
function gameFromRow(row, userId) {
  const route = typeof row.route_json === 'string' ? JSON.parse(row.route_json) : row.route_json
  const game = {
    phase: 'finished',
    startId: row.start_id,
    goalId: row.goal_id,
    trainers: route?.trainers,
    pokemon: route?.pokemon,
    undos: row.undos ?? 0,
    startedAt: null,
    elapsedMs: route?.elapsedMs ?? null,
    outcome: row.won ? 'won' : 'gaveup',
    dayNumber: row.day_number,
    userId,
  }
  return isValidGame(game) ? game : null
}

function rowFromGame(game, userId) {
  const won = game.outcome === 'won'
  const connections = game.trainers.length - 1
  return {
    user_id: userId,
    date: dayNumberToUtcDateString(game.dayNumber),
    day_number: game.dayNumber,
    start_id: game.startId,
    goal_id: game.goalId,
    won,
    connections,
    undos: game.undos,
    // Nothing to score when the answer was revealed. Undos are free, so the score is just the route length.
    score: won ? connections : null,
    best_score: findShortestRoute(game.startId, game.goalId)?.hops ?? null,
    route_json: { trainers: game.trainers, pokemon: game.pokemon, elapsedMs: game.elapsedMs },
  }
}

function initialGame(kind) {
  const saved = loadSaved(kind)
  if (kind === 'custom') return saved ?? freshCustom()
  const today = getDayNumber(new Date())
  return saved?.dayNumber === today ? saved : freshDaily(today)
}

export function useConnectionsGame(kind) {
  const { user } = useAuthContext()
  const userId = user?.id ?? null
  const { save: saveMedals, refresh: refreshMedals } = useMedals()
  const isDaily = kind === 'daily'
  const [game, setGame] = useState(() => initialGame(kind))
  const { phase, startId, goalId, trainers, pokemon, undos, outcome } = game
  const dailyDay = game.dayNumber
  // 'idle' | 'saving' | 'saved' | 'failed' (only used by the daily puzzle)
  const [saveStatus, setSaveStatus] = useState('idle')
  const userIdRef = useRef(userId)
  const retryTimerRef = useRef(null)

  useEffect(() => { userIdRef.current = userId }, [userId])
  useEffect(() => () => clearTimeout(retryTimerRef.current), [])

  useEffect(() => {
    try {
      storageFor(kind).setItem(STORAGE_KEYS[kind], JSON.stringify(game))
    } catch {
      // Storage full or blocked: the puzzle still works, it just won't survive a refresh
    }
  }, [kind, game])

  // Uploads a finished daily puzzle to the signed-in account, retrying a few times if it fails
  const saveDailyResult = useCallback(finished => {
    async function attempt(n) {
      const owner = userIdRef.current
      if (!isDaily || !owner || finished.phase !== 'finished') return
      clearTimeout(retryTimerRef.current)
      setSaveStatus('saving')
      const { error } = await supabase.from(RESULTS_TABLE).upsert(rowFromGame(finished, owner), { onConflict: 'user_id,date' })
      if (!error) {
        setSaveStatus('saved')
        // Today's puzzle may have earned medals
        refreshMedals()
        return
      }
      console.error('Failed to save daily connections result', error)
      setSaveStatus('failed')
      if (n < RETRY_DELAYS_MS.length) {
        retryTimerRef.current = setTimeout(() => attempt(n + 1), RETRY_DELAYS_MS[n])
      }
    }
    return attempt(0)
  }, [isDaily, refreshMedals])

  // On sign-in (and whenever the browser comes back online), line this device up with the account,
  // following the same rules as Daily mode
  useEffect(() => {
    if (!isDaily || !userId) return
    let cancelled = false
    async function sync() {
      const { data, error } = await supabase
        .from(RESULTS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .eq('date', dayNumberToUtcDateString(dailyDay))
        .maybeSingle()

      // Offline or a server error: try again when the browser comes back online
      if (cancelled || error) return

      if (data) {
        // Already finished today on this account (maybe on another device): show that result
        const restored = gameFromRow(data, userId)
        if (restored) setGame(restored)
        setSaveStatus('saved')
        return
      }

      const local = loadSaved('daily')
      if (local?.userId && local.userId !== userId) {
        // Left over from a different account, so don't show or upload it
        setGame({ ...freshDaily(dailyDay), userId })
        return
      }

      setGame(g => (g.userId === userId ? g : { ...g, userId }))
      if (local?.phase === 'finished' && local.dayNumber === dailyDay) {
        // Finished as a guest before signing in, or an earlier save failed: upload it now
        await saveDailyResult({ ...local, userId })
      }
    }
    sync()
    window.addEventListener('online', sync)
    return () => {
      cancelled = true
      window.removeEventListener('online', sync)
    }
  }, [isDaily, userId, dailyDay, saveDailyResult])

  // Ends the game, and for the daily puzzle adds it to the anonymous count and saves it to the account straight away.
  // Daily puzzles count towards medals through connections_results; custom ones are saved as medal progress here.
  function finish(next) {
    const elapsedMs = next.startedAt ? Math.min(Date.now() - next.startedAt, TIME_LIMIT_MS) : null
    const finished = { ...next, elapsedMs, ...(userId && { userId }) }
    setGame(finished)
    if (isDaily) {
      recordCompletion('connections')
      saveDailyResult(finished)
    } else {
      const facts = connectionsFacts({
        won: next.outcome === 'won',
        elapsedMs,
        hops: next.trainers.length - 1,
        undos: next.undos,
        best: findShortestRoute(next.startId, next.goalId)?.hops,
        trainers: next.trainers,
      })
      const { best, add } = customConnectionsProgress(facts)
      saveMedals(best, add)
    }
  }

  const bestRoute = useMemo(() => findShortestRoute(startId, goalId), [startId, goalId])

  // Why the chosen pair can't be played, if it can't
  let setupProblem = null
  if (startId === goalId) setupProblem = 'same'
  else if (!bestRoute) setupProblem = 'unreachable'

  // A trainer row waits for a Pokémon; a Pokémon row waits for the next trainer
  const awaiting = pokemon.length < trainers.length ? 'pokemon' : 'trainer'
  // Connections are trainer-to-trainer hops. Undoing is free; the timer is the cost of wrong turns.
  const hops = trainers.length - 1
  const score = hops
  const canUndo = phase === 'playing' && (awaiting === 'trainer' || trainers.length > 1)

  function setEndpoint(which, id) {
    setGame(g => newGame(which === 'start' ? id : g.startId, which === 'goal' ? id : g.goalId, 'setup'))
  }

  function swapEndpoints() {
    setGame(g => newGame(g.goalId, g.startId, 'setup'))
  }

  function randomise(which = 'both') {
    setGame(g => {
      if (which === 'both') return freshCustom()
      // Re-roll one side, keeping the other, until the pair is connected and at least two trainers apart
      for (let attempt = 0; attempt < 100; attempt++) {
        const { startId: candidate } = pickRandomPair()
        const pair = which === 'start' ? [candidate, g.goalId] : [g.startId, candidate]
        const route = findShortestRoute(...pair)
        if (route && route.hops >= 2) return newGame(pair[0], pair[1], 'setup')
      }
      // The side being kept can't reach anyone (e.g. a trainer with no shared Pokémon), so re-roll both
      return freshCustom()
    })
  }

  function startGame() {
    if (setupProblem) return
    setGame(g => newGame(g.startId, g.goalId, 'playing'))
  }

  function choosePokemon(pokedexId) {
    if (phase !== 'playing' || awaiting !== 'pokemon') return
    setGame(g => ({ ...g, pokemon: [...g.pokemon, pokedexId], startedAt: g.startedAt ?? Date.now() }))
  }

  function chooseTrainer(trainerId) {
    if (phase !== 'playing' || awaiting !== 'trainer' || trainers.includes(trainerId)) return
    const next = { ...game, trainers: [...trainers, trainerId] }
    if (trainerId === goalId) finish({ ...next, phase: 'finished', outcome: 'won' })
    else setGame(next)
  }

  // Takes back the most recent row
  function undo() {
    if (!canUndo) return
    setGame(g => g.pokemon.length === g.trainers.length
      ? { ...g, pokemon: g.pokemon.slice(0, -1) }
      : { ...g, trainers: g.trainers.slice(0, -1), undos: g.undos + 1 })
  }

  // Takes the route back to the start trainer, as if every row had been undone. The timer keeps running.
  function restartRoute() {
    if (phase !== 'playing' || pokemon.length === 0) return
    setGame(g => ({ ...g, trainers: [g.startId], pokemon: [], undos: g.undos + g.trainers.length - 1 }))
  }

  function giveUp() {
    if (phase !== 'playing') return
    finish({ ...game, phase: 'finished', outcome: 'gaveup' })
  }

  function playRandom() {
    const pair = pickRandomPair()
    setGame(newGame(pair.startId, pair.goalId, 'playing'))
  }

  function backToSetup() {
    setGame(g => newGame(g.startId, g.goalId, 'setup'))
  }

  return {
    kind, phase, outcome, dayNumber: game.dayNumber,
    start: getTrainer(startId),
    goal: getTrainer(goalId),
    trainers, pokemon, awaiting, hops, undos, score, startedAt: game.startedAt, elapsedMs: game.elapsedMs,
    bestRoute, setupProblem, canUndo,
    signedIn: !!userId, saveStatus,
    setEndpoint, swapEndpoints, randomise, startGame,
    choosePokemon, chooseTrainer, undo, restartRoute, giveUp, playRandom, backToSetup,
  }
}
