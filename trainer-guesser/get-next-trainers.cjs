// Prints the daily trainer schedule around today, and checks trainers.json
// for problems that would shift the schedule. Usage:
//   node get-next-trainers.cjs [daysBefore=5] [daysAfter=10]
const trainers = require('./src/data/trainers.json')
const overrides = require('./src/data/dailyOverrides.json')

const DAY_MS = 86400000

async function main() {
  // The schedule logic lives in one shared ES module so this script can't drift from the app
  const { getDayNumber, getScheduledTrainer, getUtcDateString, validateTrainerList } = await import(
    './src/lib/dailySchedule.js'
  )

  const daysBefore = Number(process.argv[2] ?? 5)
  const daysAfter = Number(process.argv[3] ?? 10)
  const now = new Date()

  console.log(`Trainer schedule (previous ${daysBefore}, today, next ${daysAfter}):\n`)

  for (let offset = -daysBefore; offset <= daysAfter; offset++) {
    const date = new Date(now.getTime() + offset * DAY_MS)
    const utcDate = getUtcDateString(date)
    const dayNumber = getDayNumber(date)
    const { trainer, cycle, dayInCycle, cycleLength } = getScheduledTrainer(trainers.trainers, dayNumber)
    const override = overrides[utcDate]
    const shown = override ? override.trainer : trainer
    const marker = offset === 0 ? ' (current)' : ''
    const note = override ? ` [override by ${override.providedBy}, replaces ${trainer.name}]` : ''
    console.log(
      `Day #${dayNumber} (${utcDate}) cycle ${cycle} ${dayInCycle}/${cycleLength} - ${shown.name} [${shown.game}] - ${shown.difficulty}${note}${marker}`
    )
  }

  const today = getScheduledTrainer(trainers.trainers, getDayNumber(now))
  if (today.cycle !== null) {
    const nextCycleStart = new Date(now.getTime() + (today.cycleLength - today.dayInCycle + 1) * DAY_MS)
    console.log(`\nCycle ${today.cycle + 1} starts ${getUtcDateString(nextCycleStart)}.`)
  }

  const problems = validateTrainerList(trainers.trainers)
  if (problems.length > 0) {
    console.error('\nProblems with trainers.json:')
    for (const problem of problems) console.error(`- ${problem}`)
    process.exitCode = 1
  }
}

main()
