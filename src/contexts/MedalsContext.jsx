import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuthContext } from './AuthContext'
import { computeMedals, infiniteRoundsToday, tripleThreatToday, MEDAL_IDS } from '../lib/medals'

const MedalsContext = createContext(null)
const EMPTY = { owner: null, daily: [], connections: [], stored: {} }

// Loads what the signed-in player's medals are worked out from (see src/lib/medals.js),
// and saves progress that can't be worked out from game results to user_medals.
export function MedalsProvider({ children }) {
  const { user } = useAuthContext()
  const userId = user?.id ?? null
  const [data, setData] = useState(EMPTY)
  // Latest stored progress, so saves compare against it without waiting for a re-render.
  // Null until loaded: counting up from an unloaded 0 would overwrite real progress.
  const storedRef = useRef(null)
  const userIdRef = useRef(userId)

  const save = useCallback(async (best = {}, add = []) => {
    const owner = userIdRef.current
    const stored = storedRef.current
    if (!owner || !stored) return
    const next = { ...best }
    for (const id of add) next[id] = (stored[id] ?? 0) + 1
    const rows = Object.entries(next)
      .filter(([id, progress]) => progress > (stored[id] ?? 0))
      .map(([id, progress]) => ({ user_id: owner, medal_id: Number(id), progress }))
    if (rows.length === 0) return

    storedRef.current = { ...stored, ...Object.fromEntries(rows.map(r => [r.medal_id, r.progress])) }
    setData(d => ({ ...d, stored: storedRef.current }))
    const { error } = await supabase.from('user_medals').upsert(rows, { onConflict: 'user_id,medal_id' })
    if (error) console.error('Failed to save medal progress', error)
  }, [])

  const refresh = useCallback(async () => {
    const owner = userIdRef.current
    if (!owner) return
    const [daily, connections, stored] = await Promise.all([
      supabase.from('daily_results').select('date, won, guesses_used, trainer_id').eq('user_id', owner),
      supabase.from('connections_results').select('date, won, connections, undos, best_score, route_json').eq('user_id', owner),
      supabase.from('user_medals').select('medal_id, progress').eq('user_id', owner),
    ])
    // Signed out or switched account while loading
    if (owner !== userIdRef.current) return
    for (const { error } of [daily, connections, stored]) {
      if (error) console.error('Failed to load medals', error)
    }
    // If stored progress failed to load, leave it unloaded so nothing is saved over it
    const storedProgress = stored.error ? null : Object.fromEntries(stored.data.map(r => [r.medal_id, r.progress]))
    storedRef.current = storedProgress
    const loaded = { owner, daily: daily.data ?? [], connections: connections.data ?? [], stored: storedProgress ?? {} }
    setData(loaded)
    // Triple Threat can only be checked on the day it happens
    if (storedProgress && tripleThreatToday(loaded.daily, loaded.connections, infiniteRoundsToday())) {
      save({ [MEDAL_IDS.tripleThreat]: 1 })
    }
  }, [save])

  useEffect(() => {
    userIdRef.current = userId
    storedRef.current = null
    refresh()
  }, [userId, refresh])

  // Data loaded for a previous account is ignored until this one's arrives
  const current = data.owner === userId ? data : EMPTY
  const medals = useMemo(() => computeMedals(current.daily, current.connections, current.stored), [current])
  const earnedCount = medals.filter(m => m.earned).length

  const value = useMemo(() => ({ medals, earnedCount, refresh, save }), [medals, earnedCount, refresh, save])
  return <MedalsContext.Provider value={value}>{children}</MedalsContext.Provider>
}

export function useMedals() {
  return useContext(MedalsContext)
}
