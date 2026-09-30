export function computeStreak(results) {
  if (!results || results.length === 0) return 0

  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const todayStr = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`

  const dates = new Set(results.map(r => r.date))

  let streak = 0
  let current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  if (!dates.has(todayStr)) {
    current = new Date(current.getTime() - 86400000)
  }

  while (true) {
    const d = current
    const dateStr = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    if (!dates.has(dateStr)) break
    streak++
    current = new Date(current.getTime() - 86400000)
  }

  return streak
}