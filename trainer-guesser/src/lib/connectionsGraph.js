import trainerData from '../data/trainers.json'
import { hashStringToSeed } from './dailySchedule.js'

// Connections is a graph with two kinds of node, trainers and Pokémon, and an edge wherever a trainer
// uses a Pokémon. It's rebuilt from trainers.trainers[] every time the app loads, so adding a trainer to
// the JSON is all it takes for them to show up here. Rom hacks, Challenge Mode and rematches are left out.
const TRAINERS = trainerData.trainers

const trainerById = new Map(TRAINERS.map(t => [t.id, t]))

// A trainer's distinct Pokémon in team order; a species used twice (Koga's Koffing) is one choice
const teamByTrainer = new Map()
// pokedexId -> ids of every trainer who uses it, in trainers.json order
const trainersByPokemon = new Map()
// pokedexId -> the spelling most teams use, so a one-off typo in the data doesn't leak into the UI
const nameVotes = new Map()

for (const trainer of TRAINERS) {
  const team = []
  const seen = new Set()
  for (const { pokedexId, name } of trainer.team) {
    const votes = nameVotes.get(pokedexId) ?? new Map()
    votes.set(name, (votes.get(name) ?? 0) + 1)
    nameVotes.set(pokedexId, votes)

    if (seen.has(pokedexId)) continue
    seen.add(pokedexId)
    team.push(pokedexId)
    if (!trainersByPokemon.has(pokedexId)) trainersByPokemon.set(pokedexId, [])
    trainersByPokemon.get(pokedexId).push(trainer.id)
  }
  teamByTrainer.set(trainer.id, team)
}

const pokemonNames = new Map(
  [...nameVotes].map(([id, votes]) => [id, [...votes].sort((a, b) => b[1] - a[1])[0][0]])
)

export const CONNECTION_TRAINERS = TRAINERS

export function getTrainer(id) {
  return trainerById.get(id) ?? null
}

export function trainerLabel(trainer) {
  return `${trainer.name} (${trainer.game})`
}

export function pokemonName(pokedexId) {
  return pokemonNames.get(pokedexId) ?? '???'
}

// The Pokémon a trainer can hand off through, with how many *other* trainers each one leads to
export function getTeamOptions(trainerId) {
  return (teamByTrainer.get(trainerId) ?? []).map(pokedexId => ({
    pokedexId,
    name: pokemonName(pokedexId),
    otherTrainers: trainersByPokemon.get(pokedexId).length - 1,
  }))
}

export function getTrainersUsing(pokedexId, excludeId = null) {
  return (trainersByPokemon.get(pokedexId) ?? [])
    .filter(id => id !== excludeId)
    .map(id => trainerById.get(id))
}

export function trainerUsesPokemon(trainerId, pokedexId) {
  return (teamByTrainer.get(trainerId) ?? []).includes(pokedexId)
}

// Breadth-first search over trainers, stepping through a shared Pokémon each time. Every hop costs the
// same (one trainer), so this is exactly what Dijkstra would return, without the priority queue.
// Returns the parent links for every trainer reachable from startId.
function searchFrom(startId, stopAtId = null) {
  const parent = new Map([[startId, null]])
  const hops = new Map([[startId, 0]])
  const queue = [startId]

  for (let head = 0; head < queue.length; head++) {
    const current = queue[head]
    if (current === stopAtId) break
    for (const pokedexId of teamByTrainer.get(current)) {
      for (const next of trainersByPokemon.get(pokedexId)) {
        if (parent.has(next)) continue
        parent.set(next, { trainerId: current, pokedexId })
        hops.set(next, hops.get(current) + 1)
        queue.push(next)
      }
    }
  }
  return { parent, hops }
}

// Shortest route from start to goal as alternating steps, or null when no chain of shared Pokémon exists:
// { trainers: ['flint', 'cyrus', 'crasherwake'], pokemon: [229, 130], hops: 2 }
export function findShortestRoute(startId, goalId) {
  if (!trainerById.has(startId) || !trainerById.has(goalId)) return null
  const { parent } = searchFrom(startId, goalId)
  if (!parent.has(goalId)) return null

  const trainers = [goalId]
  const pokemon = []
  for (let link = parent.get(goalId); link; link = parent.get(link.trainerId)) {
    trainers.unshift(link.trainerId)
    pokemon.unshift(link.pokedexId)
  }
  return { trainers, pokemon, hops: pokemon.length }
}

// Trainers with no Pokémon in common with anyone can't be part of any puzzle
const connectableTrainers = TRAINERS.filter(t =>
  teamByTrainer.get(t.id).some(pokedexId => trainersByPokemon.get(pokedexId).length > 1)
)

// A random start and goal that are connected and at least `minHops` trainers apart
export function pickRandomPair({ minHops = 2, random = Math.random } = {}) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const start = connectableTrainers[Math.floor(random() * connectableTrainers.length)]
    const { hops } = searchFrom(start.id)
    const goals = [...hops].filter(([, n]) => n >= minHops).map(([id]) => id)
    if (goals.length === 0) continue
    return { startId: start.id, goalId: goals[Math.floor(random() * goals.length)] }
  }
  // Only reachable if the roster somehow has no pair that far apart; settle for a shorter puzzle
  return minHops > 1 ? pickRandomPair({ minHops: minHops - 1, random }) : null
}

// Daily puzzles sit in the middle of the difficulty range: never a one-step freebie, never a 7+ slog
const DAILY_MIN_HOPS = 3
const DAILY_MAX_HOPS = 5

// Everyone gets the same pair on a given day. Each trainer gets a hash for that day and the lowest wins, so
// array order doesn't matter, and adding a trainer only changes a day's pair if it wins that day's hash (or
// creates a shortcut that moves the winning goal out of range).
export function getDailyPair(dayNumber) {
  const rank = tag => ids => ids
    .map(id => ({ id, key: hashStringToSeed(`connections-${dayNumber}:${tag}:${id}`) }))
    .sort((a, b) => a.key - b.key)
    .map(({ id }) => id)

  for (const startId of rank('start')(connectableTrainers.map(t => t.id))) {
    const { hops } = searchFrom(startId)
    const goals = [...hops].filter(([, n]) => n >= DAILY_MIN_HOPS && n <= DAILY_MAX_HOPS).map(([id]) => id)
    if (goals.length > 0) return { startId, goalId: rank('goal')(goals)[0] }
  }
  return pickRandomPair()
}
