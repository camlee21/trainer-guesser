import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthContext } from './AuthContext'
import { computeMedals, infiniteRoundsToday, tripleThreatToday, MEDAL_IDS } from '../lib/medals'

const MedalsContext = createContext(null)
const EMPTY = { owner: null, daily: [], connections: [], stored: {}, earned: new Set() }
const TOAST_MS = 3000

function earnedMessage(medals) {
  if (medals.length === 1) return `You've earned the ${medals[0].name} medal!`
  if (medals.length === 2) return `You've earned the ${medals[0].name} and ${medals[1].name} medals!`
  return `You've earned the ${medals[0].name} medal and ${medals.length - 1} more!`
}

function welcomeMessage(count) {
  return `Welcome to the Medal Box! Your past games have already earned you ${count} medal${count === 1 ? '' : 's'}!`
}

// Loads what the signed-in player's medals are worked out from (see src/lib/medals.js), saves progress
// that can't be worked out from game results to user_medals, and announces newly earned medals.
export function MedalsProvider({ children }) {
  const { user } = useAuthContext()
  const userId = user?.id ?? null
  const [data, setData] = useState(EMPTY)
  // Latest loaded data, so saves and checks don't wait for a re-render. Null until user_medals
  // has loaded: counting up from an unloaded 0 would overwrite real progress.
  const dataRef = useRef(null)
  const userIdRef = useRef(userId)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimerRef.current)
    setToast(null)
  }, [])

  const showToast = useCallback(message => {
    clearTimeout(toastTimerRef.current)
    setToast({ message, key: Date.now() })
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_MS)
  }, [])

  useEffect(() => () => clearTimeout(toastTimerRef.current), [])

  // Marks medals that are now earned but haven't been announced yet, and announces them. On the first
  // check after signing in, an account that has never had a medal announced gets a welcome message
  // instead, since those medals come from games played before medals existed.
  const announce = useCallback(async firstCheck => {
    const snapshot = dataRef.current
    if (!snapshot) return
    const fresh = computeMedals(snapshot).filter(m => m.earned && !snapshot.earned.has(m.id))
    if (fresh.length === 0) return

    const neverAnnounced = snapshot.earned.size === 0
    dataRef.current = { ...snapshot, earned: new Set([...snapshot.earned, ...fresh.map(m => m.id)]) }
    setData(dataRef.current)
    showToast(firstCheck && neverAnnounced ? welcomeMessage(fresh.length) : earnedMessage(fresh))

    const earnedAt = new Date().toISOString()
    const rows = fresh.map(m => ({ user_id: snapshot.owner, medal_id: m.id, progress: snapshot.stored[m.id] ?? 0, earned_at: earnedAt }))
    const { error } = await supabase.from('user_medals').upsert(rows, { onConflict: 'user_id,medal_id' })
    if (error) console.error('Failed to save earned medals', error)
  }, [showToast])

  // Saves progress for medals kept in user_medals. `best` keeps the higher value, `add` counts up by one.
  const save = useCallback(async (best = {}, add = []) => {
    const snapshot = dataRef.current
    if (!snapshot || snapshot.owner !== userIdRef.current) return
    const next = { ...best }
    for (const id of add) next[id] = (snapshot.stored[id] ?? 0) + 1
    const rows = Object.entries(next)
      .filter(([id, progress]) => progress > (snapshot.stored[id] ?? 0))
      .map(([id, progress]) => ({ user_id: snapshot.owner, medal_id: Number(id), progress }))
    if (rows.length === 0) return

    dataRef.current = { ...snapshot, stored: { ...snapshot.stored, ...Object.fromEntries(rows.map(r => [r.medal_id, r.progress])) } }
    setData(dataRef.current)
    announce(false)
    const { error } = await supabase.from('user_medals').upsert(rows, { onConflict: 'user_id,medal_id' })
    if (error) console.error('Failed to save medal progress', error)
  }, [announce])

  const refresh = useCallback(async () => {
    const owner = userIdRef.current
    if (!owner) return
    const [daily, connections, stored] = await Promise.all([
      supabase.from('daily_results').select('date, won, guesses_used, score, trainer_id').eq('user_id', owner),
      supabase.from('connections_results').select('date, won, connections, undos, best_score, route_json').eq('user_id', owner),
      supabase.from('user_medals').select('medal_id, progress, earned_at').eq('user_id', owner),
    ])
    // Signed out or switched account while loading
    if (owner !== userIdRef.current) return
    for (const { error } of [daily, connections, stored]) {
      if (error) console.error('Failed to load medals', error)
    }

    const previous = dataRef.current?.owner === owner ? dataRef.current : null
    const loaded = { owner, daily: daily.data ?? [], connections: connections.data ?? [], stored: {}, earned: new Set() }
    for (const row of stored.data ?? []) {
      loaded.stored[row.medal_id] = row.progress
      if (row.earned_at) loaded.earned.add(row.medal_id)
    }
    // Keep anything this tab saved that may not have reached the server yet
    if (previous) {
      for (const [id, progress] of Object.entries(previous.stored)) loaded.stored[id] = Math.max(loaded.stored[id] ?? 0, progress)
      previous.earned.forEach(id => loaded.earned.add(id))
    }
    setData(loaded)
    // If user_medals failed to load, leave it unloaded so nothing is saved over it or announced twice
    dataRef.current = stored.error ? null : loaded
    if (stored.error) return

    announce(!previous)
    // Triple Threat can only be checked on the day it happens
    if (tripleThreatToday(loaded.daily, loaded.connections, infiniteRoundsToday())) {
      save({ [MEDAL_IDS.tripleThreat]: 1 })
    }
  }, [save, announce])

  useEffect(() => {
    userIdRef.current = userId
    dataRef.current = null
    refresh()
  }, [userId, refresh])

  // Data loaded for a previous account is ignored until this one's arrives
  const current = data.owner === userId ? data : EMPTY
  const medals = useMemo(() => computeMedals(current), [current])
  const earnedCount = medals.filter(m => m.earned).length

  const value = useMemo(
    () => ({ medals, earnedCount, refresh, save, toast, dismissToast }),
    [medals, earnedCount, refresh, save, toast, dismissToast]
  )
  return <MedalsContext.Provider value={value}>{children}</MedalsContext.Provider>
}

export function useMedals() {
  return useContext(MedalsContext)
}
