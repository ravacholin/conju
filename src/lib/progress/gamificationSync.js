import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:gamification-sync')

function toTimestamp(value) {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
}

function getMeaningfulPracticeUpdatedAt(stats) {
  if (!stats || typeof stats !== 'object') return 0
  return toTimestamp(
    stats.updatedAt ||
    stats.lastUpdatedAt ||
    stats.lastActivityDate ||
    stats.lastActivityAt
  )
}

function getMeaningfulPracticeStats(userId) {
  if (typeof window === 'undefined' || !userId) {
    return { stats: null, updatedAt: 0 }
  }

  try {
    const raw = window.localStorage.getItem(`gamification_stats_${userId}`)
    if (!raw) return { stats: null, updatedAt: 0 }
    const stats = JSON.parse(raw)
    return { stats, updatedAt: getMeaningfulPracticeUpdatedAt(stats) }
  } catch (error) {
    logger.warn('getMeaningfulPracticeStats', 'Failed to read meaningful practice stats', {
      message: error?.message || String(error)
    })
    return { stats: null, updatedAt: 0 }
  }
}

function writeMeaningfulPracticeStats(userId, stats) {
  if (typeof window === 'undefined' || !userId) return false
  if (!stats || typeof stats !== 'object') return false

  try {
    window.localStorage.setItem(`gamification_stats_${userId}`, JSON.stringify(stats))
    return true
  } catch (error) {
    logger.warn('writeMeaningfulPracticeStats', 'Failed to write meaningful practice stats', {
      message: error?.message || String(error)
    })
    return false
  }
}

function buildGamificationPayload(userRecord, userId) {
  const base = userRecord && typeof userRecord === 'object'
    ? { ...userRecord }
    : { id: userId, userId }

  const baseMpUpdatedAt = getMeaningfulPracticeUpdatedAt(
    base.meaningfulPractice || {}
  ) || toTimestamp(base.meaningfulPracticeUpdatedAt)

  const localMp = getMeaningfulPracticeStats(userId)
  const useLocalMp = localMp.updatedAt >= baseMpUpdatedAt
  const meaningfulPractice = useLocalMp ? localMp.stats : base.meaningfulPractice
  const meaningfulPracticeUpdatedAt = useLocalMp ? localMp.updatedAt : baseMpUpdatedAt

  const progressUpdatedAt = toTimestamp(base.progressUpdatedAt || base.updatedAt || base.createdAt)
  const mergedUpdatedAt = Math.max(progressUpdatedAt, meaningfulPracticeUpdatedAt || 0)
  const finalUpdatedAt = mergedUpdatedAt || Date.now()

  return {
    ...base,
    id: base.id || userId,
    userId,
    meaningfulPractice: meaningfulPractice || null,
    meaningfulPracticeUpdatedAt: meaningfulPracticeUpdatedAt || null,
    progressUpdatedAt: progressUpdatedAt || null,
    createdAt: base.createdAt || new Date(finalUpdatedAt).toISOString(),
    updatedAt: new Date(finalUpdatedAt).toISOString()
  }
}

export {
  toTimestamp,
  getMeaningfulPracticeUpdatedAt,
  getMeaningfulPracticeStats,
  writeMeaningfulPracticeStats,
  buildGamificationPayload
}
