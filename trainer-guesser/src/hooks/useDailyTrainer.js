import trainers from '../data/trainers.json'

function getDailyIndex(listLength) {
  const now = new Date()
  const utcDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`

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
  const index = getDailyIndex(trainers.trainers.length)
  return trainers.trainers[index]
}