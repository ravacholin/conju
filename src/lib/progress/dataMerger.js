import { STORAGE_CONFIG } from './config.js'
import {
  getAllFromDB,
  batchSaveToDB,
  batchUpdateInDB
} from './database.js'
import { createSafeLogger } from './safeLogger.js'
import { getCurrentUserId } from './userSettingsStore.js'
import { getAuthenticatedUser } from './authBridge.js'

const safeLogger = createSafeLogger('progress:userManager')

const TEMP_USER_ID_PATTERN = /^user-temp-/i

export function isReliableUserId(userId) {
  return typeof userId === 'string' && userId.trim().length > 0 && !TEMP_USER_ID_PATTERN.test(userId)
}

function extractUserIdFromAccountData(accountData) {
  if (!accountData || typeof accountData !== 'object') return null

  const directCandidates = [
    accountData.userId,
    accountData.user?.id,
    accountData.account?.id,
    accountData.account?.userId,
    accountData.profile?.id,
    accountData.metadata?.userId,
    accountData.meta?.userId
  ]

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  const collectionKeys = ['attempts', 'mastery', 'schedules', 'sessions']
  for (const key of collectionKeys) {
    const collection = Array.isArray(accountData[key]) ? accountData[key] : []
    for (const item of collection) {
      const candidate = item?.userId || item?.ownerId || item?.accountId
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate
      }
    }
  }

  return null
}

export function resolveMergeUserId(accountData) {
  const authenticatedUser = getAuthenticatedUser()
  const authenticatedId = authenticatedUser?.id || null
  if (isReliableUserId(authenticatedId)) {
    return { userId: authenticatedId, source: 'auth', attempted: { authenticatedId } }
  }

  const remoteId = extractUserIdFromAccountData(accountData)
  if (isReliableUserId(remoteId)) {
    return {
      userId: remoteId,
      source: 'remote',
      attempted: { authenticatedId, remoteId }
    }
  }

  const fallbackId = getCurrentUserId()
  if (isReliableUserId(fallbackId)) {
    return {
      userId: fallbackId,
      source: 'fallback',
      attempted: { authenticatedId, remoteId, fallbackId }
    }
  }

  return {
    userId: null,
    source: null,
    attempted: { authenticatedId, remoteId, fallbackId }
  }
}

function notifySyncIssue(reason, message) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return
  }

  try {
    window.dispatchEvent(
      new CustomEvent('progress:syncError', {
        detail: {
          reason,
          message,
          timestamp: new Date().toISOString()
        }
      })
    )
  } catch (error) {
    safeLogger.warn('mergeAccountDataLocally: no se pudo notificar fallo de sincronización', {
      message: error?.message || String(error),
      name: error?.name
    })
  }
}

export async function mergeAccountDataLocally(accountData) {
  const results = { attempts: 0, mastery: 0, schedules: 0, sessions: 0, conflicts: 0 }
  const resolution = resolveMergeUserId(accountData)
  const currentUserId = resolution.userId

  if (!currentUserId) {
    const warningMessage = 'No pudimos determinar un usuario fiable para fusionar los datos. Inicia sesión nuevamente e intenta sincronizar.'
    safeLogger.warn('mergeAccountDataLocally: abortado por falta de userId confiable', {
      attemptedSources: resolution.attempted
    })
    notifySyncIssue('missing_user_id', warningMessage)
    return {
      ...results,
      userId: null,
      aborted: true,
      reason: 'missing_user_id',
      message: warningMessage,
      attempted: resolution.attempted
    }
  }

  const allAttempts = await getAllFromDB(STORAGE_CONFIG.STORES.ATTEMPTS)
  const allMastery = await getAllFromDB(STORAGE_CONFIG.STORES.MASTERY)
  const allSchedules = await getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES)
  const allSessions = await getAllFromDB(STORAGE_CONFIG.STORES.LEARNING_SESSIONS)

  const attemptMap = new Map()
  const masteryMap = new Map()
  const scheduleMap = new Map()
  const sessionMap = new Map()

  allAttempts.forEach((attempt) => {
    const createdTime = Math.floor(new Date(attempt.createdAt).getTime() / 5000) * 5000
    const key = `${attempt.verbId}|${attempt.mood}|${attempt.tense}|${attempt.person}|${createdTime}`
    attemptMap.set(key, attempt)
  })

  allMastery.forEach((mastery) => {
    const key = `${mastery.verbId}|${mastery.mood}|${mastery.tense}|${mastery.person}`
    masteryMap.set(key, mastery)
  })

  allSchedules.forEach((schedule) => {
    const key = `${schedule.verbId}|${schedule.mood}|${schedule.tense}|${schedule.person}`
    scheduleMap.set(key, schedule)
  })

  allSessions.forEach((session) => {
    if (!session || !session.sessionId) return
    const key = session.sessionId
    sessionMap.set(key, session)
  })

  if (accountData?.attempts) {
    const attemptsToSave = []

    for (const remoteAttempt of accountData.attempts) {
      try {
        const createdTime = Math.floor(new Date(remoteAttempt.createdAt).getTime() / 5000) * 5000
        const key = `${remoteAttempt.verbId}|${remoteAttempt.mood}|${remoteAttempt.tense}|${remoteAttempt.person}|${createdTime}`
        const existing = attemptMap.get(key)

        if (!existing) {
          const localAttempt = {
            ...remoteAttempt,
            userId: currentUserId,
            id: remoteAttempt.id || `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          attemptsToSave.push(localAttempt)
          attemptMap.set(key, localAttempt)
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error al fusionar attempt', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts++
      }
    }

    if (attemptsToSave.length > 0) {
      try {
        const batchResult = await batchSaveToDB(STORAGE_CONFIG.STORES.ATTEMPTS, attemptsToSave, { skipTimestamps: true })
        results.attempts = batchResult.saved
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch save de attempts', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += attemptsToSave.length
      }
    }
  }

  if (Array.isArray(accountData?.sessions)) {
    const sessionsToSave = []
    const sessionsToUpdate = []

    for (const remoteSession of accountData.sessions) {
      try {
        const key = remoteSession.sessionId || remoteSession.id
        if (!key) continue
        const existing = sessionMap.get(key)

        if (!existing) {
          const localSession = {
            ...remoteSession,
            sessionId: key,
            userId: currentUserId,
            updatedAt: remoteSession.updatedAt || new Date().toISOString(),
            syncedAt: new Date()
          }
          sessionsToSave.push(localSession)
          sessionMap.set(key, localSession)
        } else if (remoteSession.updatedAt && new Date(remoteSession.updatedAt) > new Date(existing.updatedAt || 0)) {
          const updatedSession = {
            ...existing,
            ...remoteSession,
            sessionId: key,
            userId: currentUserId,
            syncedAt: new Date()
          }
          sessionsToUpdate.push({ id: existing.sessionId || key, updates: updatedSession })
          sessionMap.set(key, updatedSession)
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error al fusionar session', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts++
      }
    }

    if (sessionsToSave.length > 0) {
      try {
        const batchResult = await batchSaveToDB(STORAGE_CONFIG.STORES.LEARNING_SESSIONS, sessionsToSave, { skipTimestamps: true })
        results.sessions += batchResult.saved
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch save de sessions', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += sessionsToSave.length
      }
    }

    if (sessionsToUpdate.length > 0) {
      try {
        const batchResult = await batchUpdateInDB(STORAGE_CONFIG.STORES.LEARNING_SESSIONS, sessionsToUpdate)
        results.sessions += batchResult.updated
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch update de sessions', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += sessionsToUpdate.length
      }
    }
  }

  if (accountData?.mastery) {
    const masteryToSave = []
    const masteryToUpdate = []

    for (const remoteMastery of accountData.mastery) {
      try {
        const key = `${remoteMastery.verbId}|${remoteMastery.mood}|${remoteMastery.tense}|${remoteMastery.person}`
        const existing = masteryMap.get(key)

        if (!existing) {
          const localMastery = {
            ...remoteMastery,
            userId: currentUserId,
            id: remoteMastery.id || `mastery-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          masteryToSave.push(localMastery)
          masteryMap.set(key, localMastery)
        } else if (new Date(remoteMastery.updatedAt) > new Date(existing.updatedAt)) {
          const updatedMastery = {
            ...existing,
            ...remoteMastery,
            userId: currentUserId,
            syncedAt: new Date()
          }
          masteryToUpdate.push({ id: existing.id, updates: updatedMastery })
          masteryMap.set(key, updatedMastery)
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error al fusionar mastery', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts++
      }
    }

    if (masteryToSave.length > 0) {
      try {
        const batchResult = await batchSaveToDB(STORAGE_CONFIG.STORES.MASTERY, masteryToSave, { skipTimestamps: true })
        results.mastery += batchResult.saved
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch save de mastery', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += masteryToSave.length
      }
    }

    if (masteryToUpdate.length > 0) {
      try {
        const batchResult = await batchUpdateInDB(STORAGE_CONFIG.STORES.MASTERY, masteryToUpdate)
        results.mastery += batchResult.updated
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch update de mastery', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += masteryToUpdate.length
      }
    }
  }

  if (accountData?.schedules) {
    const schedulesToSave = []
    const schedulesToUpdate = []

    for (const remoteSchedule of accountData.schedules) {
      try {
        const key = `${remoteSchedule.verbId}|${remoteSchedule.mood}|${remoteSchedule.tense}|${remoteSchedule.person}`
        const existing = scheduleMap.get(key)

        if (!existing) {
          const localSchedule = {
            ...remoteSchedule,
            userId: currentUserId,
            id: remoteSchedule.id || `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          schedulesToSave.push(localSchedule)
          scheduleMap.set(key, localSchedule)
        } else if (new Date(remoteSchedule.updatedAt) > new Date(existing.updatedAt)) {
          const updatedSchedule = {
            ...existing,
            ...remoteSchedule,
            userId: currentUserId,
            syncedAt: new Date()
          }
          schedulesToUpdate.push({ id: existing.id, updates: updatedSchedule })
          scheduleMap.set(key, updatedSchedule)
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error al fusionar schedule', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts++
      }
    }

    if (schedulesToSave.length > 0) {
      try {
        const batchResult = await batchSaveToDB(STORAGE_CONFIG.STORES.SCHEDULES, schedulesToSave, { skipTimestamps: true })
        results.schedules += batchResult.saved
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch save de schedules', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += schedulesToSave.length
      }
    }

    if (schedulesToUpdate.length > 0) {
      try {
        const batchResult = await batchUpdateInDB(STORAGE_CONFIG.STORES.SCHEDULES, schedulesToUpdate)
        results.schedules += batchResult.updated
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch update de schedules', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += schedulesToUpdate.length
      }
    }
  }

  return { ...results, userId: currentUserId, source: resolution.source, attempted: resolution.attempted, merged: results }
}

export const __testing = {
  extractUserIdFromAccountData,
  notifySyncIssue
}

