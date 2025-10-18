// Social Backend Integration - Real leaderboards and challenges
// Replaces synthetic data with actual server-side data

import { getSyncApiBase } from '../config/syncConfig.js'
import { getCurrentUserId } from './userManager/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:socialSync')

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cache = new Map()

/**
 * Generic cache wrapper for social API calls
 */
function withCache(key, ttl, fetcher) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < ttl) {
    logger.debug(`Cache hit for ${key}`)
    return Promise.resolve(cached.data)
  }

  return fetcher().then(data => {
    cache.set(key, { data, timestamp: Date.now() })
    return data
  })
}

/**
 * Fetch real leaderboard from backend
 * @param {('daily'|'weekly'|'alltime')} timeframe - Leaderboard timeframe
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Leaderboard entries
 */
export async function fetchLeaderboard(timeframe = 'daily', options = {}) {
  const {
    limit = 50,
    offset = 0,
    includeCurrentUser = true
  } = options

  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      logger.warn('Sync API not configured, using fallback data')
      return getFallbackLeaderboard(timeframe)
    }

    const userId = getCurrentUserId()
    const url = new URL(`${apiBase}/social/leaderboard`)
    url.searchParams.set('timeframe', timeframe)
    url.searchParams.set('limit', limit.toString())
    url.searchParams.set('offset', offset.toString())
    if (userId && includeCurrentUser) {
      url.searchParams.set('userId', userId)
    }

    const cacheKey = `leaderboard:${timeframe}:${limit}:${offset}:${userId || 'anon'}`

    return withCache(cacheKey, CACHE_TTL, async () => {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`)
      }

      const data = await response.json()
      logger.debug(`Fetched ${timeframe} leaderboard`, { count: data.leaderboard?.length })

      return {
        leaderboard: data.leaderboard || [],
        currentUserRank: data.currentUserRank || null,
        currentUserData: data.currentUserData || null,
        totalPlayers: data.totalPlayers || 0,
        timeframe: data.timeframe || timeframe,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching leaderboard:', error)
    return getFallbackLeaderboard(timeframe)
  }
}

/**
 * Fetch community statistics
 * @returns {Promise<Object>} Community stats
 */
export async function fetchCommunityStats() {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      logger.warn('Sync API not configured, using fallback stats')
      return getFallbackCommunityStats()
    }

    const url = `${apiBase}/social/stats`
    const cacheKey = 'community:stats'

    return withCache(cacheKey, CACHE_TTL, async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch community stats: ${response.status}`)
      }

      const data = await response.json()
      logger.debug('Fetched community stats', data)

      return {
        totalAttempts: data.totalAttempts || 0,
        totalXP: data.totalXP || 0,
        activeUsers: data.activeUsers || 0,
        activeUsersToday: data.activeUsersToday || 0,
        avgAccuracy: data.avgAccuracy || 0,
        topPerformers: data.topPerformers || [],
        updatedAt: data.updatedAt || new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching community stats:', error)
    return getFallbackCommunityStats()
  }
}

/**
 * Submit leaderboard entry for current user
 * @param {string} userId - User ID
 * @param {string} alias - User alias/display name
 * @param {number} xp - Current XP
 * @param {number} streak - Current streak
 * @param {number} attempts - Total attempts
 * @returns {Promise<Object>} Submission result
 */
export async function submitLeaderboardEntry(userId, alias, xp, streak, attempts) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      logger.warn('Sync API not configured, skipping leaderboard submission')
      return { success: false, reason: 'sync_disabled' }
    }

    const url = `${apiBase}/social/leaderboard/submit`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        alias: alias || 'Anonymous',
        xp: xp || 0,
        streak: streak || 0,
        attempts: attempts || 0,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to submit leaderboard entry: ${response.status}`)
    }

    const data = await response.json()
    logger.debug('Submitted leaderboard entry', { userId, rank: data.rank })

    // Invalidate leaderboard caches
    clearLeaderboardCaches()

    return {
      success: true,
      rank: data.rank || null,
      percentile: data.percentile || null,
      improvement: data.improvement || null
    }
  } catch (error) {
    logger.error('Error submitting leaderboard entry:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user's social achievements
 * @param {string} userId - User ID (optional, uses current user if not provided)
 * @returns {Promise<Array>} Social achievements
 */
export async function getSocialAchievements(userId = null) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      logger.warn('Sync API not configured, using fallback achievements')
      return getFallbackAchievements()
    }

    const targetUserId = userId || getCurrentUserId()
    if (!targetUserId) {
      logger.warn('No user ID available for achievements')
      return []
    }

    const url = `${apiBase}/social/achievements/${targetUserId}`
    const cacheKey = `achievements:${targetUserId}`

    return withCache(cacheKey, CACHE_TTL, async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.status}`)
      }

      const data = await response.json()
      logger.debug('Fetched social achievements', { count: data.achievements?.length })

      return data.achievements || []
    })
  } catch (error) {
    logger.error('Error fetching social achievements:', error)
    return getFallbackAchievements()
  }
}

/**
 * Get user's friend list
 * @param {string} userId - User ID (optional)
 * @returns {Promise<Array>} Friend list
 */
export async function getFriendList(userId = null) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      return []
    }

    const targetUserId = userId || getCurrentUserId()
    if (!targetUserId) {
      return []
    }

    const url = `${apiBase}/social/friends/${targetUserId}`
    const cacheKey = `friends:${targetUserId}`

    return withCache(cacheKey, CACHE_TTL, async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch friends: ${response.status}`)
      }

      const data = await response.json()
      return data.friends || []
    })
  } catch (error) {
    logger.error('Error fetching friends:', error)
    return []
  }
}

/**
 * Clear all leaderboard caches (call after updates)
 */
export function clearLeaderboardCaches() {
  const keys = Array.from(cache.keys())
  keys.forEach(key => {
    if (key.startsWith('leaderboard:')) {
      cache.delete(key)
    }
  })
  logger.debug('Cleared leaderboard caches')
}

/**
 * Clear all social caches
 */
export function clearAllSocialCaches() {
  cache.clear()
  logger.debug('Cleared all social caches')
}

/**
 * Fallback leaderboard data when offline or sync disabled
 */
function getFallbackLeaderboard(timeframe) {
  logger.debug('Using fallback leaderboard data')
  const userId = getCurrentUserId()

  return {
    leaderboard: [
      { rank: 1, userId: 'demo1', alias: 'Ana', xp: 3200, streak: 15, attempts: 450 },
      { rank: 2, userId: 'demo2', alias: 'Luis', xp: 2800, streak: 12, attempts: 380 },
      { rank: 3, userId: userId || 'you', alias: 'Tú', xp: 2400, streak: 8, attempts: 320 },
      { rank: 4, userId: 'demo3', alias: 'Sofía', xp: 2100, streak: 10, attempts: 290 },
      { rank: 5, userId: 'demo4', alias: 'Mateo', xp: 1900, streak: 7, attempts: 260 }
    ],
    currentUserRank: 3,
    currentUserData: { xp: 2400, streak: 8, attempts: 320 },
    totalPlayers: 1247,
    timeframe,
    lastUpdated: new Date().toISOString(),
    offline: true
  }
}

/**
 * Fallback community stats when offline
 */
function getFallbackCommunityStats() {
  logger.debug('Using fallback community stats')

  return {
    totalAttempts: 125430,
    totalXP: 487200,
    activeUsers: 1247,
    activeUsersToday: 342,
    avgAccuracy: 78.5,
    topPerformers: [
      { alias: 'Ana', xp: 3200 },
      { alias: 'Luis', xp: 2800 },
      { alias: 'Sofía', xp: 2100 }
    ],
    updatedAt: new Date().toISOString(),
    offline: true
  }
}

/**
 * Fallback achievements
 */
function getFallbackAchievements() {
  logger.debug('Using fallback achievements')

  return [
    {
      id: 'first_day',
      title: 'Primer Día',
      description: 'Completaste tu primer día de práctica',
      icon: '🎯',
      earnedAt: new Date().toISOString()
    },
    {
      id: 'streak_7',
      title: 'Racha de 7 Días',
      description: 'Mantuviste una racha de 7 días',
      icon: '🔥',
      earnedAt: new Date().toISOString()
    }
  ]
}

export default {
  fetchLeaderboard,
  fetchCommunityStats,
  submitLeaderboardEntry,
  getSocialAchievements,
  getFriendList,
  clearLeaderboardCaches,
  clearAllSocialCaches
}
