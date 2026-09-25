import trainers from '../data/trainers.json'
import overrides from '../data/dailyOverrides.json'
import { getDayNumber, getScheduledTrainer, getUtcDateString, validateTrainerList } from '../lib/dailySchedule.js'

// See src/lib/dailySchedule.js for how the schedule works and how to add trainers.
if (import.meta.env.DEV) {
  for (const problem of validateTrainerList(trainers.trainers)) {
    console.warn(`[daily schedule] ${problem}`)
  }
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

  const { trainer } = getScheduledTrainer(trainers.trainers, dayNumber)
  return {
    ...trainer,
    dayNumber,
    isProvided: false,
    providedBy: null,
    providedLink: null,
  }
}
