import { getUtcDateString, DAY_MS } from './dailySchedule.js'

export function computeStreak(results) {
  if (!results || results.length === 0) return 0

  const now = new Date()
  const todayStr = getUtcDateString(now)

  const dates = new Set(results.map(r => r.date))

  let streak = 0
  let current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  if (!dates.has(todayStr)) {
    current = new Date(current.getTime() - DAY_MS)
  }

  while (dates.has(getUtcDateString(current))) {
    streak++
    current = new Date(current.getTime() - DAY_MS)
  }

  return streak
}