import trainers from '../data/trainers.json'

function getDailyIndex(listLength) {
  const today = new Date().toISOString().slice(0, 10)
  let hash = 0
  for (const char of today) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  return hash % listLength
}

export function useDailyTrainer() {
  const index = getDailyIndex(trainers.trainers.length)
  return trainers.trainers[index]
}