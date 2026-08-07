import trainers from '../data/trainers.json'
import overrides from '../data/dailyOverrides.json'

// Day #1 is June 10th GMT+0
const DAY_ONE_UTC = Date.UTC(2026, 5, 10) // year, month_num, day_num

// Whenever you add/remove trainers, add a new entry here with the
// dayNumber that change takes effect (pick a day AFTER the current
// cycle ends, so it doesn't disturb an in-progress cycle).
// `listLength` = trainers.trainers.length as of that revision.
const REVISIONS = [
  { fromDay: 1, listLength: 206 },
  // { fromDay: 207, listLength: 210 }, // example: added 4 trainers, next cycle
]

function getUtcDateString(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function getDayNumber(date) {
  const todayUtcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const diffDays = Math.floor((todayUtcMidnight - DAY_ONE_UTC) / 86400000)
  return diffDays + 1
}

function hashStringToSeed(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle(array, seed) {
  const rng = mulberry32(seed)
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const cycleCache = new Map()

function getShuffledOrderForCycle(revisionIndex, cycle, listLength) {
  const cacheKey = `${revisionIndex}-${cycle}`
  if (cycleCache.has(cacheKey)) {
    return cycleCache.get(cacheKey)
  }

  const indices = Array.from({ length: listLength }, (_, i) => i)
  const seed = hashStringToSeed(`trainer-rev${revisionIndex}-cycle-${cycle}`)
  const shuffled = seededShuffle(indices, seed)

  cycleCache.set(cacheKey, shuffled)
  return shuffled
}

// Finds which revision applies to a given day (the last one whose
// fromDay is <= dayNumber).
function getRevisionForDay(dayNumber) {
  let revisionIndex = 0
  for (let i = 0; i < REVISIONS.length; i++) {
    if (REVISIONS[i].fromDay <= dayNumber) {
      revisionIndex = i
    }
  }
  return { revisionIndex, revision: REVISIONS[revisionIndex] }
}

function getDailyIndex(dayNumber) {
  const { revisionIndex, revision } = getRevisionForDay(dayNumber)
  const zeroBasedDayInRevision = dayNumber - revision.fromDay
  const cycle = Math.floor(zeroBasedDayInRevision / revision.listLength)
  const positionInCycle = zeroBasedDayInRevision % revision.listLength

  const shuffledOrder = getShuffledOrderForCycle(revisionIndex, cycle, revision.listLength)
  return shuffledOrder[positionInCycle]
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

  const index = getDailyIndex(dayNumber)
  return {
    ...trainers.trainers[index],
    dayNumber,
    isProvided: false,
    providedBy: null,
    providedLink: null,
  }
}