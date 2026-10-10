import { getUtcDateString } from './dailySchedule.js'

// localStorage keys for saved games. Sign-out clears today's ones, so they live here rather than in each hook.
export const DAILY_GAME_PREFIX = 'wtt-game-'
export const dailyGameKey = () => `${DAILY_GAME_PREFIX}${getUtcDateString(new Date())}`
export const CONNECTIONS_KEYS = { daily: 'wtt-connections-daily', custom: 'wtt-connections' }
