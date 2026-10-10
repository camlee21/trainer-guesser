import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Delays before retrying a failed save. After these run out, the save is
// retried when the browser comes back online or the page is next loaded.
const RETRY_DELAYS_MS = [2000, 5000, 15000]

// Saves one finished daily result per user per day to `table`, retrying if it fails.
// `buildRow` is called again on every attempt, so a retry uses whoever is signed in by then;
// it returns null to cancel (e.g. signed out). `onSaved` runs once the row is stored.
export function useResultSaver(table) {
  // 'idle' | 'saving' | 'saved' | 'failed'
  const [saveStatus, setSaveStatus] = useState('idle')
  const retryTimerRef = useRef(null)

  useEffect(() => () => clearTimeout(retryTimerRef.current), [])

  const save = useCallback(async (buildRow, onSaved) => {
    async function attempt(n) {
      const row = buildRow()
      if (!row) return
      clearTimeout(retryTimerRef.current)
      setSaveStatus('saving')
      const { error } = await supabase.from(table).upsert(row, { onConflict: 'user_id,date' })
      if (!error) {
        setSaveStatus('saved')
        onSaved?.()
        return
      }
      console.error(`Failed to save ${table} result`, error)
      setSaveStatus('failed')
      if (n < RETRY_DELAYS_MS.length) {
        retryTimerRef.current = setTimeout(() => attempt(n + 1), RETRY_DELAYS_MS[n])
      }
    }
    return attempt(0)
  }, [table])

  return { saveStatus, setSaveStatus, save }
}
