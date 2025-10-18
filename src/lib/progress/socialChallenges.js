// Social Challenge System - Friend challenges and team competitions
// Builds on top of basic challenges.js with multiplayer features

import { getSyncApiBase } from '../config/syncConfig.js'
import { getCurrentUserId } from './userManager/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:socialChallenges')

const CACHE_TTL = 2 * 60 * 1000 // 2 minutes (more dynamic than leaderboard)
const cache = new Map()

/**
 * Create a one-on-one challenge with a friend
 * @param {string} userId - Current user ID
 * @param {string} friendId - Friend's user ID
 * @param {string} targetMetric - Metric to compete on ('xp', 'attempts', 'accuracy', 'streak')
 * @param {number} targetScore - Target score to reach
 * @param {number} duration - Duration in hours (default: 24)
 * @returns {Promise<Object>} Challenge details
 */
export async function createChallenge(userId, friendId, targetMetric = 'xp', targetScore = 100, duration = 24) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      logger.warn('Sync API not configured, cannot create challenge')
      return { success: false, reason: 'sync_disabled' }
    }

    const url = `${apiBase}/social/challenges/create`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        creatorId: userId,
        challengedId: friendId,
        metric: targetMetric,
        targetScore,
        durationHours: duration,
        createdAt: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to create challenge: ${response.status}`)
    }

    const data = await response.json()
    logger.debug('Created challenge', { challengeId: data.challengeId, friendId })

    // Clear cache
    cache.delete(`challenges:active:${userId}`)
    cache.delete(`challenges:active:${friendId}`)

    return {
      success: true,
      challengeId: data.challengeId,
      expiresAt: data.expiresAt,
      status: 'pending'
    }
  } catch (error) {
    logger.error('Error creating challenge:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Accept a challenge from a friend
 * @param {string} userId - Current user ID
 * @param {string} challengeId - Challenge ID to accept
 * @returns {Promise<Object>} Acceptance result
 */
export async function acceptChallenge(userId, challengeId) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      return { success: false, reason: 'sync_disabled' }
    }

    const url = `${apiBase}/social/challenges/${challengeId}/accept`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        acceptedAt: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to accept challenge: ${response.status}`)
    }

    const data = await response.json()
    logger.debug('Accepted challenge', { challengeId })

    // Clear cache
    cache.delete(`challenges:active:${userId}`)
    cache.delete(`challenge:${challengeId}`)

    return {
      success: true,
      challenge: data.challenge,
      startedAt: data.startedAt
    }
  } catch (error) {
    logger.error('Error accepting challenge:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Track progress on an active challenge
 * @param {string} userId - Current user ID
 * @param {string} challengeId - Challenge ID
 * @param {number} currentScore - Current score/progress
 * @returns {Promise<Object>} Progress update result
 */
export async function trackChallengeProgress(userId, challengeId, currentScore) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      return { success: false, reason: 'sync_disabled' }
    }

    const url = `${apiBase}/social/challenges/${challengeId}/progress`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        score: currentScore,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to track challenge progress: ${response.status}`)
    }

    const data = await response.json()
    logger.debug('Tracked challenge progress', { challengeId, score: currentScore })

    // Clear challenge cache
    cache.delete(`challenge:${challengeId}`)

    return {
      success: true,
      currentRank: data.currentRank,
      opponentScore: data.opponentScore,
      isLeading: data.isLeading,
      completed: data.completed
    }
  } catch (error) {
    logger.error('Error tracking challenge progress:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user's active challenges
 * @param {string} userId - User ID (optional)
 * @returns {Promise<Array>} Active challenges
 */
export async function getActiveChallenges(userId = null) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      return []
    }

    const targetUserId = userId || getCurrentUserId()
    if (!targetUserId) {
      return []
    }

    const url = `${apiBase}/social/challenges/active/${targetUserId}`
    const cacheKey = `challenges:active:${targetUserId}`

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch active challenges: ${response.status}`)
    }

    const data = await response.json()
    const challenges = data.challenges || []

    // Cache result
    cache.set(cacheKey, { data: challenges, timestamp: Date.now() })

    logger.debug('Fetched active challenges', { count: challenges.length })
    return challenges
  } catch (error) {
    logger.error('Error fetching active challenges:', error)
    return []
  }
}

/**
 * Get completed challenges history
 * @param {string} userId - User ID
 * @param {number} limit - Number of challenges to fetch (default: 20)
 * @returns {Promise<Array>} Completed challenges
 */
export async function getCompletedChallenges(userId, limit = 20) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      return []
    }

    const targetUserId = userId || getCurrentUserId()
    if (!targetUserId) {
      return []
    }

    const url = `${apiBase}/social/challenges/completed/${targetUserId}?limit=${limit}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch completed challenges: ${response.status}`)
    }

    const data = await response.json()
    logger.debug('Fetched completed challenges', { count: data.challenges?.length })

    return data.challenges || []
  } catch (error) {
    logger.error('Error fetching completed challenges:', error)
    return []
  }
}

/**
 * Get challenge details by ID
 * @param {string} challengeId - Challenge ID
 * @returns {Promise<Object|null>} Challenge details
 */
export async function getChallengeDetails(challengeId) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      return null
    }

    const url = `${apiBase}/social/challenges/${challengeId}`
    const cacheKey = `challenge:${challengeId}`

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch challenge details: ${response.status}`)
    }

    const data = await response.json()

    // Cache result
    cache.set(cacheKey, { data: data.challenge, timestamp: Date.now() })

    return data.challenge
  } catch (error) {
    logger.error('Error fetching challenge details:', error)
    return null
  }
}

/**
 * Decline/reject a challenge
 * @param {string} userId - Current user ID
 * @param {string} challengeId - Challenge ID to decline
 * @returns {Promise<Object>} Decline result
 */
export async function declineChallenge(userId, challengeId) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      return { success: false, reason: 'sync_disabled' }
    }

    const url = `${apiBase}/social/challenges/${challengeId}/decline`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        userId,
        declinedAt: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to decline challenge: ${response.status}`)
    }

    // Clear cache
    cache.delete(`challenges:active:${userId}`)
    cache.delete(`challenge:${challengeId}`)

    return { success: true }
  } catch (error) {
    logger.error('Error declining challenge:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get pending challenge invitations
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Pending invitations
 */
export async function getPendingInvitations(userId = null) {
  try {
    const apiBase = getSyncApiBase()
    if (!apiBase) {
      return []
    }

    const targetUserId = userId || getCurrentUserId()
    if (!targetUserId) {
      return []
    }

    const url = `${apiBase}/social/challenges/pending/${targetUserId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch pending invitations: ${response.status}`)
    }

    const data = await response.json()
    return data.invitations || []
  } catch (error) {
    logger.error('Error fetching pending invitations:', error)
    return []
  }
}

/**
 * Clear all challenge caches
 */
export function clearChallengeCaches() {
  cache.clear()
  logger.debug('Cleared all challenge caches')
}

export default {
  createChallenge,
  acceptChallenge,
  trackChallengeProgress,
  getActiveChallenges,
  getCompletedChallenges,
  getChallengeDetails,
  declineChallenge,
  getPendingInvitations,
  clearChallengeCaches
}
