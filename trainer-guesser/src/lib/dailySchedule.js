// Daily trainer schedule, shared by useDailyTrainer and get-next-trainers.cjs.
//
// How it works:
// - Cycle 1 (days 1-206) is the frozen LAUNCH_CYCLE list of ids.
// - Every later cycle uses each trainer in trainers.trainers exactly once, in
//   an order decided by hashing `cycle-N:<id>`. Array order doesn't matter.
// - A cycle's members are fixed when it starts: a trainer with an `addedOn`
//   date ("YYYY-MM-DD") joins the first cycle that starts after that date, so
//   adding trainers never disturbs the cycle that's currently running.
//
// Adding a trainer: add it anywhere in trainers.trainers with
// `"addedOn": "<today's UTC date>"`. Nothing else to update.
//
// Removing a trainer: it stops appearing straight away, but every later day in
// the current cycle shifts by one. Prefer removing just after a cycle ends
// (run `node get-next-trainers.cjs` to see when that is).

import { LAUNCH_CYCLE } from '../data/launchCycle.js'

// Day #1 is June 10th GMT+0
const DAY_ONE_UTC = Date.UTC(2026, 5, 10) // year, month_num, day_num
const DAY_MS = 86400000

// Number of trainers with no `addedOn` date. Only change this when removing
// one of those trainers; new trainers should get an `addedOn` date instead.
const ORIGINAL_ROSTER_SIZE = 212

export function getUtcDateString(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function getDayNumber(date) {
  const todayUtcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const diffDays = Math.floor((todayUtcMidnight - DAY_ONE_UTC) / DAY_MS)
  return diffDays + 1
}

function dayNumberToUtcDateString(dayNumber) {
  return getUtcDateString(new Date(DAY_ONE_UTC + (dayNumber - 1) * DAY_MS))
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

// Trainers in the cycle that starts on `startDate`. `addedOn` must be strictly
// before the start, so a trainer added on a cycle's first day waits for the
// next one (that cycle has already been served).
function getCycleMembers(trainerList, startDate) {
  return trainerList.filter((t) => !t.addedOn || t.addedOn < startDate)
}

function buildCycleOrder(members, cycle, previousLastId) {
  const order = members
    .map((trainer) => ({ trainer, key: hashStringToSeed(`cycle-${cycle}:${trainer.id}`) }))
    .sort((a, b) => a.key - b.key || (a.trainer.id < b.trainer.id ? -1 : 1))
    .map(({ trainer }) => trainer)

  // Avoid the same trainer on the last day of one cycle and the first of the next
  if (order.length > 1 && order[0].id === previousLastId) {
    ;[order[0], order[1]] = [order[1], order[0]]
  }
  return order
}

// Cycles from cycle 2 onward, computed lazily and cached per trainer list.
const cycleCache = new WeakMap()

function getCycleContaining(trainerList, dayNumber) {
  if (!cycleCache.has(trainerList)) cycleCache.set(trainerList, [])
  const cycles = cycleCache.get(trainerList)

  for (let i = 0; ; i++) {
    if (i === cycles.length) {
      const prev = cycles[i - 1]
      const startDay = prev ? prev.startDay + prev.order.length : LAUNCH_CYCLE.length + 1
      const cycle = i + 2
      const members = getCycleMembers(trainerList, dayNumberToUtcDateString(startDay))
      if (members.length === 0) return null
      const previousLastId = prev ? prev.order.at(-1).id : LAUNCH_CYCLE.at(-1)
      cycles.push({ cycle, startDay, order: buildCycleOrder(members, cycle, previousLastId) })
    }
    const entry = cycles[i]
    if (dayNumber < entry.startDay + entry.order.length) return entry
  }
}

// Deterministic stand-in for a scheduled trainer that has since been removed
function getFallbackTrainer(trainerList, dayNumber) {
  return trainerList[hashStringToSeed(`fallback-${dayNumber}`) % trainerList.length]
}

// Returns { trainer, cycle, dayInCycle, cycleLength } for a day. `trainer` is
// always an entry from trainerList (or null if the list is empty).
export function getScheduledTrainer(trainerList, dayNumber) {
  if (trainerList.length === 0) return { trainer: null, cycle: null, dayInCycle: null, cycleLength: null }

  if (dayNumber <= LAUNCH_CYCLE.length) {
    const id = LAUNCH_CYCLE[Math.max(dayNumber, 1) - 1]
    const trainer = trainerList.find((t) => t.id === id) ?? getFallbackTrainer(trainerList, dayNumber)
    return { trainer, cycle: 1, dayInCycle: Math.max(dayNumber, 1), cycleLength: LAUNCH_CYCLE.length }
  }

  const entry = getCycleContaining(trainerList, dayNumber)
  if (!entry) return { trainer: getFallbackTrainer(trainerList, dayNumber), cycle: null, dayInCycle: null, cycleLength: null }
  return {
    trainer: entry.order[dayNumber - entry.startDay],
    cycle: entry.cycle,
    dayInCycle: dayNumber - entry.startDay + 1,
    cycleLength: entry.order.length,
  }
}

// Problems with trainers.trainers that would make the schedule shift
// unexpectedly. Returns a list of messages (empty when everything's fine).
export function validateTrainerList(trainerList) {
  const problems = []
  const seen = new Set()
  for (const t of trainerList) {
    if (!t.id) problems.push(`Trainer "${t.name}" has no id`)
    else if (seen.has(t.id)) problems.push(`Duplicate trainer id "${t.id}"`)
    seen.add(t.id)
    if (t.addedOn !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(t.addedOn)) {
      problems.push(`Trainer "${t.id}" has addedOn "${t.addedOn}", expected YYYY-MM-DD`)
    }
  }
  const undated = trainerList.filter((t) => !t.addedOn).length
  if (undated !== ORIGINAL_ROSTER_SIZE) {
    problems.push(
      `${undated} trainers have no addedOn date, expected ${ORIGINAL_ROSTER_SIZE}. ` +
        'New trainers need "addedOn": "YYYY-MM-DD" or they reshuffle the current cycle. ' +
        'If you removed an original trainer, lower ORIGINAL_ROSTER_SIZE in src/lib/dailySchedule.js.'
    )
  }
  return problems
}
