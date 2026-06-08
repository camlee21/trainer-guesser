
import trainers from '../data/trainers.json'

function getDailyIndex(listLength) {
  const now = new Date()
  const utcDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  
  let hash = 0
  for (const char of utcDate) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash % listLength
}

export function useDailyTrainer() {
  const index = getDailyIndex(trainers.trainers.length)
  return trainers.trainers[index]
}