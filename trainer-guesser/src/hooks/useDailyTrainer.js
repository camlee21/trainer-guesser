import trainers from '../data/trainers.json'
import overrides from '../data/dailyOverrides.json'

// Day #1 is June 19th (GMT+0).
const DAY_ONE_UTC = Date.UTC(2026, 5, 19) // year, month_num, day_num

function getUtcDateString(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function getDayNumber(date) {
  // Normalise "now" to UTC midnight so partial-day drift never shifts the count
  const todayUtcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const diffDays = Math.floor((todayUtcMidnight - DAY_ONE_UTC) / 86400000)
  return diffDays + 1
}

function getDailyIndex(utcDateString, listLength) {
  // xmur3-style string hash for better avalanche/mixing
  let h = 1779033703 ^ utcDateString.length
  for (let i = 0; i < utcDateString.length; i++) {
    h = Math.imul(h ^ utcDateString.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }

  // Final mix (splitmix-style) to fully scramble bits before modulo
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16

  return Math.abs(h) % listLength
}

export function useDailyTrainer() {
  const now = new Date()
  const utcDateString = getUtcDateString(now)
  const dayNumber = getDayNumber(now)

  const override = overrides[utcDateString]

  if (override) {
    return {
      ...override.trainer,
      dayNumber,
      isProvided: true,
      providedBy: override.providedBy ?? null,
      providedLink: override.providedLink ?? null,
    }
  }

  const index = getDailyIndex(utcDateString, trainers.trainers.length)
  return {
    ...trainers.trainers[index],
    dayNumber,
    isProvided: false,
    providedBy: null,
    providedLink: null,
  }
}