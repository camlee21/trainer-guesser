import trainers from '../data/trainers.json'
import overrides from '../data/dailyOverrides.json'

// Day #1 is June 10th GMT+0
const DAY_ONE_UTC = Date.UTC(2026, 5, 10) // year, month_num, day_num

function getUtcDateString(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function getDayNumber(date) {
  const todayUtcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const diffDays = Math.floor((todayUtcMidnight - DAY_ONE_UTC) / 86400000)
  return diffDays + 1
}

function getDailyIndex(utcDate, listLength) {
  // xmur3-style string hash for better avalanche/mixing
  let h = 1779033703 ^ utcDate.length
  for (let i = 0; i < utcDate.length; i++) {
    h = Math.imul(h ^ utcDate.charCodeAt(i), 3432918353)
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
  const utcDate = getUtcDateString(now)
  const dayNumber = getDayNumber(now)

  const override = overrides[utcDate]

  if (override) {
    return {
      ...override.trainer,
      dayNumber,
      isProvided: true,
      providedBy: override.providedBy ?? null,
      providedLink: override.providedLink ?? null,
    }
  }

  const index = getDailyIndex(utcDate, trainers.trainers.length)
  return {
    ...trainers.trainers[index],
    dayNumber,
    isProvided: false,
    providedBy: null,
    providedLink: null,
  }
}