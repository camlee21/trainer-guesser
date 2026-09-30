import { supabase } from './supabaseClient'

// Adds one to today's anonymous count of finished daily puzzles (see supabase/daily_completions.sql).
// Sends nothing about the player, and a failed call is simply skipped.
export function recordCompletion(mode) {
  supabase.rpc('record_completion', { p_mode: mode }).then(({ error }) => {
    if (error) console.error('Failed to record completion', error)
  })
}
