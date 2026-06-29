const trainers = require('./src/data/trainers.json')
const overrides = require('./src/data/dailyOverrides.json')

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
  let h = 1779033703 ^ utcDate.length
  for (let i = 0; i < utcDate.length; i++) {
    h = Math.imul(h ^ utcDate.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }

  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16

  return Math.abs(h) % listLength
}

function getDailyTrainerForDate(date) {
  const utcDate = getUtcDateString(date)
  const dayNumber = getDayNumber(date)

  const override = overrides[utcDate]

  if (override) {
    return {
      ...override.trainer,
      dayNumber,
      isProvided: true,
      providedBy: override.providedBy ?? null,
      providedLink: override.providedLink ?? null,
      utcDate,
    }
  }

  const index = getDailyIndex(utcDate, trainers.trainers.length)
  return {
    ...trainers.trainers[index],
    dayNumber,
    isProvided: false,
    providedBy: null,
    providedLink: null,
    utcDate,
  }
}

const NUM_DAYS = 10
const today = new Date()

console.log(`Upcoming ${NUM_DAYS} days of daily trainers:\n`)

for (let i = 0; i < NUM_DAYS; i++) {
  const date = new Date(today.getTime() + i * 86400000)
  const result = getDailyTrainerForDate(date)

  const providedTag = result.isProvided
    ? `provided by ${result.providedBy ?? 'unknown'}`
    : 'regular pool'

  console.log(
    `Day #${result.dayNumber} (${result.utcDate}) - ${result.name} [${result.game}] - ${providedTag}`
  )
}