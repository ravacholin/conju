// Social and community features (Phase 3)

import { PROGRESS_CONFIG } from './config.js'
import { getCurrentUserId } from './userManager.js'
import { getDailyChallengeSnapshot } from './challenges.js'
import logger from './logger.js'

const STORAGE_KEY = 'progress-social-community'
const communityCache = new Map()
const listeners = new Set()

function loadState(userId) {
  if (communityCache.has(userId)) {
    return communityCache.get(userId)
  }
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}:${userId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    communityCache.set(userId, parsed)
    return parsed
  } catch (error) {
    logger.warn('No se pudo cargar estado social', error)
    return null
  }
}

function persistState(userId, state) {
  communityCache.set(userId, state)
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(state))
    } catch (error) {
      logger.warn('No se pudo persistir estado social', error)
    }
  }
}

function notify(userId, snapshot) {
  const payload = { userId, snapshot }
  listeners.forEach(listener => {
    try {
      listener(payload)
    } catch (error) {
      logger.warn('Error notificando listeners sociales', error)
    }
  })
}

function createPeer(alias, baseXp, baseStreak) {
  const streakVariance = Math.floor(Math.random() * 4) - 1
  const xpVariance = Math.round(baseXp * (0.8 + Math.random() * 0.4))
  return {
    alias,
    xp: Math.max(200, Math.round(baseXp + xpVariance / 5)),
    streak: Math.max(1, baseStreak + streakVariance),
    lastContribution: Math.round(50 + Math.random() * 150)
  }
}

function synthesizeLeaderboard(userMetrics) {
  const baseXp = userMetrics.communityXP || 400
  const baseStreak = userMetrics.streak || 3
  const peers = [
    createPeer('Ana', baseXp * 1.1, baseStreak + 2),
    createPeer('Luis', baseXp * 0.95, baseStreak - 1),
    createPeer('Sofía', baseXp * 1.2, baseStreak + 1),
    createPeer('Mateo', baseXp * 0.85, baseStreak)
  ]
  return peers
}

function defaultCommunitySnapshot(userId, userMetrics) {
  const config = PROGRESS_CONFIG.SOCIAL || {}
  const target = config.DEFAULT_COMMUNITY_TARGET || { attempts: 2000, xp: 4000, streak: 10 }
  const peers = synthesizeLeaderboard(userMetrics)

  const leaderboard = [
    {
      alias: userMetrics.alias || 'Tú',
      xp: userMetrics.communityXP,
      streak: userMetrics.streak,
      lastContribution: userMetrics.lastContribution
    },
    ...peers
  ].sort((a, b) => b.xp - a.xp)

  return {
    date: new Date().toISOString().slice(0, 10),
    communityGoal: {
      target,
      progress: {
        attempts: Math.round(target.attempts * 0.35),
        xp: Math.round(target.xp * 0.42),
        streak: Math.max(2, Math.round(target.streak * 0.5))
      }
    },
    leaderboard,
    communitySize: config.COMMUNITY_SIZE_ESTIMATE || 1000,
    userAlias: userMetrics.alias || 'Tú',
    updatedAt: new Date().toISOString(),
    contributions: {
      user: userMetrics.lastContribution,
      peers: peers.reduce((sum, peer) => sum + peer.lastContribution, 0)
    },
    lastMetrics: { ...userMetrics }
  }
}

function computeUserMetrics(metrics) {
  const attempts = metrics?.attemptsToday || 0
  const focusMinutes = metrics?.focusMinutesToday || 0
  const streak = metrics?.bestStreakToday || 0
  const accuracy = metrics?.accuracyToday || 0
  const communityXP = Math.round(attempts * 8 + focusMinutes * 5 + streak * 12 + accuracy)
  const contribution = Math.round(attempts * 4 + focusMinutes * 3)
  return {
    attempts,
    focusMinutes,
    streak,
    accuracy,
    communityXP,
    lastContribution: contribution
  }
}

export async function getCommunitySnapshot(userId = null, { signal } = {}) {
  if (!PROGRESS_CONFIG.FEATURE_FLAGS.SOCIAL_CHALLENGES) {
    return null
  }

  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }

  const resolvedUserId = userId || getCurrentUserId()
  if (!resolvedUserId) {
    throw new Error('Usuario no disponible para funciones sociales')
  }

  const today = new Date().toISOString().slice(0, 10)
  const challengeSnapshot = await getDailyChallengeSnapshot(resolvedUserId, { signal })
  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }
  const userMetrics = computeUserMetrics(challengeSnapshot?.metrics)
  const stored = loadState(resolvedUserId)

  const rotationDays = PROGRESS_CONFIG.SOCIAL?.CHALLENGE_ROTATION_DAYS || 3
  const needsRefresh = !stored || stored.date !== today

  let snapshot
  if (needsRefresh) {
    snapshot = defaultCommunitySnapshot(resolvedUserId, userMetrics)
  } else {
    const previousMetrics = stored.lastMetrics || { attempts: 0, communityXP: 0, streak: 0 }
    snapshot = {
      ...stored,
      leaderboard: updateLeaderboard(stored.leaderboard, userMetrics),
      communityGoal: updateCommunityGoal(stored.communityGoal, userMetrics, previousMetrics)
    }
  }

  snapshot.userMetrics = userMetrics
  snapshot.rotationExpiresAt = computeRotationExpiry(snapshot.date, rotationDays)
  snapshot.lastMetrics = { ...userMetrics }

  persistState(resolvedUserId, snapshot)
  notify(resolvedUserId, snapshot)

  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }

  return snapshot
}

function updateLeaderboard(existing = [], userMetrics) {
  if (!Array.isArray(existing) || existing.length === 0) {
    return synthesizeLeaderboard(userMetrics)
  }
  const filtered = existing.filter(entry => entry.alias !== (userMetrics.alias || 'Tú'))
  const updatedUserEntry = {
    alias: userMetrics.alias || 'Tú',
    xp: userMetrics.communityXP,
    streak: userMetrics.streak,
    lastContribution: userMetrics.lastContribution
  }
  return [updatedUserEntry, ...filtered]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, PROGRESS_CONFIG.SOCIAL?.LEADERBOARD_SIZE || 5)
}

function updateCommunityGoal(goal, userMetrics, previousMetrics) {
  if (!goal) return goal
  const progress = { ...goal.progress }
  const deltaAttempts = Math.max(0, userMetrics.attempts - (previousMetrics?.attempts || 0))
  const deltaXp = Math.max(0, userMetrics.communityXP - (previousMetrics?.communityXP || 0))
  const streak = Math.max(userMetrics.streak || 0, previousMetrics?.streak || 0)
  progress.attempts += deltaAttempts
  progress.xp += deltaXp
  progress.streak = Math.max(progress.streak || 0, streak)
  return {
    ...goal,
    progress
  }
}

function computeRotationExpiry(dateString, rotationDays) {
  const date = new Date(dateString)
  const expiry = new Date(date.getTime())
  expiry.setDate(expiry.getDate() + rotationDays)
  return expiry.toISOString()
}

export function recordCommunityContribution(delta, userId = null) {
  const resolvedUserId = userId || getCurrentUserId()
  if (!resolvedUserId) return
  const state = loadState(resolvedUserId)
  if (!state) return
  state.communityGoal.progress.attempts += delta?.attempts || 0
  state.communityGoal.progress.xp += delta?.xp || 0
  state.communityGoal.progress.streak = Math.max(state.communityGoal.progress.streak || 0, delta?.streak || 0)
  state.updatedAt = new Date().toISOString()
  persistState(resolvedUserId, state)
  notify(resolvedUserId, state)
}

export function onCommunitySnapshot(listener, { immediate = false } = {}) {
  if (typeof listener !== 'function') {
    throw new Error('Community listener debe ser función')
  }
  listeners.add(listener)
  if (immediate) {
    const snapshot = getCommunitySnapshot().catch(() => null)
    if (snapshot instanceof Promise) {
      snapshot.then(result => {
        if (result) {
          listener({ userId: getCurrentUserId(), snapshot: result })
        }
      }).catch(error => logger.warn('No se pudo obtener snapshot inmediato', error))
    }
  }
  return () => listeners.delete(listener)
}

export function clearCommunityCache(userId = null) {
  const resolvedUserId = userId || getCurrentUserId()
  if (!resolvedUserId) return
  communityCache.delete(resolvedUserId)
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(`${STORAGE_KEY}:${resolvedUserId}`)
    } catch (error) {
      logger.warn('No se pudo limpiar cache social', error)
    }
  }
}
