import trainerData from '../data/trainers.json'
import overrides from '../data/dailyOverrides.json'
import { getUtcDateString } from './dailySchedule.js'

// Every medal, in the order the Medal Box shows them (easiest first, staged medals together).
// IDs are saved in the user_medals table, so a released medal's ID must never change.
//
// Daily and Daily Connections medals are worked out from daily_results and connections_results,
// so they include games played before medals existed. Medals that can't be worked out from those
// (Infinite sessions, custom Connections puzzles, Triple Threat) keep their best progress in
// user_medals instead, as `stored[id]`.

export const TOTAL_MEDALS = 75

// Medal count each Medal Box stage starts at. Stage 7 needs every medal.
export const STAGE_STARTS = [0, 5, 15, 30, 45, 60, TOTAL_MEDALS]
export const STAGE_NAMES = ['Beginner', 'Novice', 'Expert', 'Veteran', 'Elite', 'Master', 'Champion']

export function medalStage(count) {
  return STAGE_STARTS.findLastIndex(start => count >= start) + 1
}

// Main-series games by generation. Colosseum, XD, rom hacks, rematches and Challenge Mode have none.
const GEN_GAMES = [
  ['Red/Blue'],
  ['Gold/Silver'],
  ['Ruby/Sapphire', 'Ruby', 'Sapphire', 'Emerald'],
  ['Platinum', 'HeartGold/SoulSilver'],
  ['Black/White', 'Black', 'White', 'Black2/White2', 'Black2', 'White2'],
  ['X/Y', 'Omega Ruby/Alpha Sapphire'],
  ['Sun/Moon', 'Ultra Sun/Ultra Moon'],
  ['Sword/Shield', 'Legends Arceus'],
  ['Scarlet/Violet', 'Scarlet', 'Violet', 'Legends Z-A'],
]
const GEN_BY_GAME = new Map(GEN_GAMES.flatMap((games, i) => games.map(game => [game, i + 1])))
const GENS = GEN_GAMES.map((_, i) => i + 1)

const GEN3_SPINOFFS = new Set(['Colosseum', 'XD: Gale of Darkness'])

function genOf(game) {
  return GEN_BY_GAME.get(game) ?? null
}

const trainerById = new Map(trainerData.trainers.map(t => [t.id, t]))
const CHALLENGE_IDS = new Set(trainerData['challenge-trainers'].map(t => t.id))
const REMATCH_IDS = new Set(trainerData['rematch-trainers'].map(t => t.id))

// IDs of the medals that keep progress in user_medals
export const MEDAL_IDS = {
  firstLink: 63, cleanRun: 64, neverGiveUp: 65, optimalRoute: 70, longHaul: 71,
  timeTraveller: 72, puzzleAddict: 73, routeMaster: 74, tripleThreat: 75,
}

const GEN_TIERS = [['Trainer', 3], ['Ace Trainer', 7], ['Champion', 12]]

export const MEDALS = [
  { id: 1, mode: 'daily', name: 'Down to the Wire', description: 'Guess correctly on your 5th and final guess', target: 1, progress: s => s.daily.lastGuessWins },
  { id: 2, mode: 'daily', name: 'First Try', description: 'Win on your first guess', target: 1, progress: s => s.daily.firstGuessWins },
  { id: 3, mode: 'daily', name: 'Community Spirit', description: 'Win a daily on a day the trainer was suggested by a player', target: 1, progress: s => s.daily.communityWins },

  { id: 4, mode: 'daily', name: 'Daily Regular', description: '10 daily wins in total', target: 10, progress: s => s.daily.wins },
  { id: 5, mode: 'daily', name: 'Daily Veteran', description: '50 daily wins in total', target: 50, progress: s => s.daily.wins },
  { id: 6, mode: 'daily', name: 'Daily Devotee', description: '100 daily wins in total', target: 100, progress: s => s.daily.wins },

  { id: 7, mode: 'daily', name: 'Streak Novice', description: 'Daily streak of 5 days', target: 5, progress: s => s.daily.bestStreak },
  { id: 8, mode: 'daily', name: 'Streak Expert', description: 'Daily streak of 10 days', target: 10, progress: s => s.daily.bestStreak },
  { id: 9, mode: 'daily', name: 'Streak Master', description: 'Daily streak of 20 days', target: 20, progress: s => s.daily.bestStreak },

  { id: 10, mode: 'daily', name: 'Winning Run', description: 'Win 7 days in a row', target: 7, progress: s => s.daily.bestWinStreak },
  { id: 11, mode: 'daily', name: 'Badge Case', description: 'Win 8 dailies against gym leaders', target: 8, progress: s => s.daily.gymLeaderWins },

  // IDs 12-38: three tiers per generation
  ...GENS.flatMap(gen => GEN_TIERS.map(([title, target], tier) => ({
    id: 12 + (gen - 1) * 3 + tier,
    mode: 'daily',
    name: `Gen ${gen} ${title}`,
    description: `Correctly guess ${target} different Gen ${gen} trainers`,
    target,
    progress: s => s.daily.beatenByGen[gen].size,
  }))),

  { id: 39, mode: 'daily', name: 'Sharpshooter', description: 'Win on the first guess 10 times in total', target: 10, progress: s => s.daily.firstGuessWins },
  { id: 40, mode: 'daily', name: 'World Traveller', description: 'Win a daily from every generation (1 to 9)', target: 9, progress: s => GENS.filter(gen => s.daily.beatenByGen[gen].size > 0).length },

  { id: 41, mode: 'infinite', name: 'Quick Draw', description: 'Guess correctly in 10 seconds or less', target: 1 },

  { id: 42, mode: 'infinite', name: 'Hot Streak', description: '10 correct guesses in a row in one session', target: 10 },
  { id: 43, mode: 'infinite', name: 'On Fire', description: '25 correct guesses in a row in one session', target: 25 },
  { id: 44, mode: 'infinite', name: 'Unstoppable', description: '50 correct guesses in a row in one session', target: 50 },

  { id: 45, mode: 'infinite', name: 'High Scorer', description: 'Score 100 points in one session', target: 100 },
  { id: 46, mode: 'infinite', name: 'Score Master', description: 'Score 250 points in one session', target: 250 },

  { id: 47, mode: 'infinite', name: 'Challenge Accepted', description: 'Guess all 12 B2W2 Challenge Mode trainers in one session', target: CHALLENGE_IDS.size },
  { id: 48, mode: 'infinite', name: 'Rematch Ready', description: '15 rematch trainers correct in one session', target: 15 },

  // IDs 49-57
  ...GENS.map(gen => ({
    id: 48 + gen,
    mode: 'infinite',
    name: `Gen ${gen} Expert`,
    description: `20 correct guesses in one session with only Gen ${gen} games selected (no extras)`,
    target: 20,
  })),

  { id: 58, mode: 'infinite', name: 'Lightning Reflexes', description: 'Guess correctly in 3 seconds or less', target: 1 },
  { id: 59, mode: 'infinite', name: 'Hard Boiled', description: '10 correct guesses in a row with only Hard selected', target: 10 },
  { id: 60, mode: 'infinite', name: 'Kaizo Survivor', description: '10 correct guesses in a row with only Rom Hacks in the pool', target: 10 },
  { id: 61, mode: 'infinite', name: 'Perfect Ten', description: '10 rounds in a row, all won on the first guess', target: 10 },
  { id: 62, mode: 'infinite', name: 'Speedrunner', description: '20 correct guesses within 2 minutes of total time', target: 20 },

  { id: 63, mode: 'connections', name: 'First Link', description: 'Finish any Connections puzzle', target: 1, progress: s => Math.max(s.stored[MEDAL_IDS.firstLink] ?? 0, s.connections.finished > 0 ? 1 : 0) },
  { id: 64, mode: 'connections', name: 'Clean Run', description: 'Win without using any undos', target: 1, progress: s => s.fromAnyPuzzle(MEDAL_IDS.cleanRun, 'clean') },
  { id: 65, mode: 'connections', name: 'Never Give Up', description: 'Win after the timer reaches 3:00', target: 1, progress: s => s.fromAnyPuzzle(MEDAL_IDS.neverGiveUp, 'persistent') },

  { id: 66, mode: 'connections', name: 'Linked In', description: 'Daily Connections streak of 5', target: 5, progress: s => s.connections.bestStreak },
  { id: 67, mode: 'connections', name: 'Chain Reaction', description: 'Daily Connections streak of 10', target: 10, progress: s => s.connections.bestStreak },
  { id: 68, mode: 'connections', name: 'Fully Connected', description: 'Daily Connections streak of 20', target: 20, progress: s => s.connections.bestStreak },

  { id: 69, mode: 'connections', name: 'Medal Recognition', description: 'Win 10 Daily Connections in total', target: 10, progress: s => s.connections.wins },
  { id: 70, mode: 'connections', name: 'Optimal Route', description: 'Win using the shortest possible route, with no undos', target: 1, progress: s => s.fromAnyPuzzle(MEDAL_IDS.optimalRoute, 'flawless') },
  { id: 71, mode: 'connections', name: 'Long Haul', description: 'Win a puzzle whose best route is 5 or more hops', target: 1, progress: s => s.fromAnyPuzzle(MEDAL_IDS.longHaul, 'longHaul') },
  { id: 72, mode: 'connections', name: 'Time Traveller', description: 'Win with a route through trainers from 4+ generations', target: 1, progress: s => s.fromAnyPuzzle(MEDAL_IDS.timeTraveller, 'timeTraveller') },
  { id: 73, mode: 'connections', name: 'Puzzle Addict', description: 'Finish 25 custom puzzles', target: 25 },
  // Stored progress here only counts custom puzzles; daily ones come from connections_results
  { id: 74, mode: 'connections', name: 'Route Master', description: 'Find the optimal route 10 times', target: 10, progress: s => (s.stored[MEDAL_IDS.routeMaster] ?? 0) + s.connections.optimal },

  { id: 75, mode: 'all', name: 'Triple Threat', description: 'Finish the Daily, the Daily Connections and 10 Infinite rounds on the same day', target: 1 },
]

if (MEDALS.length !== TOTAL_MEDALS || MEDALS.some((m, i) => m.id !== i + 1)) {
  throw new Error('MEDALS must hold IDs 1 to TOTAL_MEDALS in order')
}

function dayIndex(dateStr) {
  return Date.parse(dateStr) / 86400000 // 'YYYY-MM-DD' parses as UTC midnight
}

// Longest run of consecutive days among the given dates
function longestRun(dates) {
  const days = [...new Set(dates)].map(dayIndex).sort((a, b) => a - b)
  let best = 0
  let run = 0
  days.forEach((day, i) => {
    run = i > 0 && day === days[i - 1] + 1 ? run + 1 : 1
    best = Math.max(best, run)
  })
  return best
}

// What a finished Connections puzzle counts towards. Used for daily rows and custom puzzles alike.
// Undos are free, so a win with none is a flawless run. Daily rows saved before the timer existed have no elapsedMs.
export function connectionsFacts({ won, hops, undos, best, trainers, elapsedMs }) {
  const gens = new Set(trainers.map(id => genOf(trainerById.get(id)?.game)).filter(Boolean))
  return {
    clean: won && undos === 0,
    persistent: won && elapsedMs >= 3 * 60 * 1000,
    optimal: won && hops === best,
    flawless: won && undos === 0 && hops === best,
    longHaul: won && best >= 5,
    timeTraveller: won && gens.size >= 4,
  }
}

// Progress to save when a custom Connections puzzle is finished: `best` keeps the higher value, `add` counts up
export function customConnectionsProgress(facts) {
  return {
    best: {
      [MEDAL_IDS.firstLink]: 1,
      [MEDAL_IDS.cleanRun]: facts.clean ? 1 : 0,
      [MEDAL_IDS.neverGiveUp]: facts.persistent ? 1 : 0,
      [MEDAL_IDS.optimalRoute]: facts.flawless ? 1 : 0,
      [MEDAL_IDS.longHaul]: facts.longHaul ? 1 : 0,
      [MEDAL_IDS.timeTraveller]: facts.timeTraveller ? 1 : 0,
    },
    add: facts.optimal ? [MEDAL_IDS.puzzleAddict, MEDAL_IDS.routeMaster] : [MEDAL_IDS.puzzleAddict],
  }
}

// Best progress towards each Infinite medal in one session. `log` has one entry per finished round.
export function infiniteSessionProgress(log, { games, difficulties, extras }) {
  let streak = 0, bestStreak = 0, firstTries = 0, bestFirstTries = 0
  let score = 0, quick = 0, lightning = 0, rematches = 0, winsInTwoMinutes = 0, wins = 0
  const challengeBeaten = new Set()

  for (const round of log) {
    if (!round.won) {
      streak = 0
      firstTries = 0
      continue
    }
    wins++
    streak++
    firstTries = round.guesses === 1 ? firstTries + 1 : 0
    bestStreak = Math.max(bestStreak, streak)
    bestFirstTries = Math.max(bestFirstTries, firstTries)
    score += 6 - round.guesses // same as useInfiniteMode's scoreForRound
    if (round.seconds <= 10) quick = 1
    if (round.seconds <= 3) lightning = 1
    if (CHALLENGE_IDS.has(round.trainerId)) challengeBeaten.add(round.trainerId)
    if (REMATCH_IDS.has(round.trainerId)) rematches++
    if (round.totalSeconds <= 120) winsInTwoMinutes++
  }

  // Infinite's game select files Colosseum and XD under Gen 3, so its Gen 3 button still counts as Gen 3 only
  const selectGen = game => genOf(game) ?? (GEN3_SPINOFFS.has(game) ? 3 : null)
  const onlyGen = extras.size === 0 && games.size > 0 && new Set([...games].map(selectGen)).size === 1 ? selectGen([...games][0]) : null
  const hardOnly = difficulties.size === 1 && difficulties.has('hard')
  const romHacksOnly = games.size === 0 && extras.size === 1 && extras.has('romHacks')

  return {
    41: quick,
    42: bestStreak, 43: bestStreak, 44: bestStreak,
    45: score, 46: score,
    47: challengeBeaten.size,
    48: rematches,
    ...Object.fromEntries(GENS.map(gen => [48 + gen, onlyGen === gen ? wins : 0])),
    58: lightning,
    59: hardOnly ? bestStreak : 0,
    60: romHacksOnly ? bestStreak : 0,
    61: bestFirstTries,
    62: winsInTwoMinutes,
  }
}

export function tripleThreatToday(dailyRows, connectionsRows, infiniteRoundsToday) {
  const today = getUtcDateString(new Date())
  return infiniteRoundsToday >= 10 && dailyRows.some(r => r.date === today) && connectionsRows.some(r => r.date === today)
}

// Infinite rounds finished today on this device, for Triple Threat
const INFINITE_ROUNDS_KEY = 'wtt-infinite-rounds-today'

export function infiniteRoundsToday() {
  try {
    const saved = JSON.parse(localStorage.getItem(INFINITE_ROUNDS_KEY))
    return saved?.date === getUtcDateString(new Date()) ? saved.count : 0
  } catch {
    return 0
  }
}

export function countInfiniteRound() {
  const count = infiniteRoundsToday() + 1
  try {
    localStorage.setItem(INFINITE_ROUNDS_KEY, JSON.stringify({ date: getUtcDateString(new Date()), count }))
  } catch {
    // Storage blocked: Triple Threat just can't be earned on this device
  }
  return count
}

// Guesses a daily win took. Older rows may only have a score (5 for a first-guess win, down to 1), like on the Stats page.
function guessesUsed(row) {
  return row.guesses_used ?? 6 - (row.score ?? 5)
}

// Progress for every medal, capped at its target. `stored` maps medal ID -> progress from user_medals,
// and `earned` maps the IDs already marked earned there to when, and those stay earned even if a requirement changes.
export function computeMedals({ daily: dailyRows, connections: connectionsRows, stored, earned }) {
  const dailyWins = dailyRows.filter(r => r.won)
  const beatenByGen = Object.fromEntries(GENS.map(gen => [gen, new Set()]))
  let gymLeaderWins = 0
  for (const row of dailyWins) {
    // Player-suggested days can use a trainer that isn't in trainers.json
    const trainer = overrides[row.date]?.trainer ?? trainerById.get(row.trainer_id)
    if (!trainer) continue
    const gen = genOf(trainer.game)
    if (gen) beatenByGen[gen].add(trainer.id)
    if (trainer.type === 'gym_leader') gymLeaderWins++
  }

  const puzzles = connectionsRows.map(r => {
    const route = typeof r.route_json === 'string' ? JSON.parse(r.route_json) : r.route_json
    return connectionsFacts({ won: r.won, hops: r.connections, undos: r.undos, best: r.best_score, trainers: route?.trainers ?? [], elapsedMs: route?.elapsedMs })
  })

  const s = {
    stored,
    daily: {
      wins: dailyWins.length,
      firstGuessWins: dailyWins.filter(r => guessesUsed(r) === 1).length,
      lastGuessWins: dailyWins.some(r => guessesUsed(r) === 5) ? 1 : 0,
      communityWins: dailyWins.some(r => overrides[r.date]) ? 1 : 0,
      bestStreak: longestRun(dailyRows.map(r => r.date)),
      bestWinStreak: longestRun(dailyWins.map(r => r.date)),
      gymLeaderWins,
      beatenByGen,
    },
    connections: {
      finished: connectionsRows.length,
      wins: connectionsRows.filter(r => r.won).length,
      bestStreak: longestRun(connectionsRows.map(r => r.date)),
      optimal: puzzles.filter(p => p.optimal).length,
    },
    // A one-off Connections medal is earned by a daily puzzle or a stored custom one
    fromAnyPuzzle: (id, fact) => Math.max(stored[id] ?? 0, puzzles.some(p => p[fact]) ? 1 : 0),
  }

  return MEDALS.map(medal => {
    const value = medal.progress ? medal.progress(s) : (stored[medal.id] ?? 0)
    const progress = earned.has(medal.id) ? medal.target : Math.min(value, medal.target)
    return { ...medal, progress, earned: progress >= medal.target, earnedAt: earned.get(medal.id) ?? null }
  })
}

