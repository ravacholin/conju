import { STORAGE_CONFIG } from './config.js'
import {
  getAllFromDB,
  batchSaveToDB,
  batchUpdateInDB
} from './database.js'
import { createSafeLogger } from './safeLogger.js'
import { getCurrentUserId } from './userSettingsStore.js'
import { getAuthenticatedUser } from './authBridge.js'
import { setGlobalUserLevel } from '../../lib/levels/userLevelProfile.js'

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
  const results = { attempts: 0, mastery: 0, schedules: 0, sessions: 0, settings: 0, challenges: 0, events: 0, conflicts: 0 }
  const resolution = resolveMergeUserId(accountData)
  const currentUserId = resolution.userId

  function toComparableTime(value) {
    if (!value) return 0
    const date = value instanceof Date ? value : new Date(value)
    const time = date.getTime()
    return Number.isFinite(time) ? time : 0
  }

  function getAttemptCompositeKey(attempt) {
    const createdAtTime = toComparableTime(attempt?.createdAt)
    const createdTimeBucket = Math.floor(createdAtTime / 5000) * 5000
    const verbId = attempt?.verbId || ''
    const mood = attempt?.mood || ''
    const tense = attempt?.tense || ''
    const person = attempt?.person || ''
    return `${verbId}|${mood}|${tense}|${person}|${createdTimeBucket}`
  }

  function getAttemptMergeTimestamp(attempt) {
    return Math.max(
      toComparableTime(attempt?.syncedAt),
      toComparableTime(attempt?.updatedAt),
      toComparableTime(attempt?.createdAt)
    )
  }

  if (!currentUserId) {
    const warningMessage = 'No pudimos determinar un usuario fiable para fusionar los datos. Inicia sesión nuevamente e intenta sincronizar.'
    console.error('🚨 SYNC BUG: No reliable userId found!', {
      attemptedSources: resolution.attempted,
      resolution
    });
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

  console.log('✅ SYNC: Using userId for merge:', {
    userId: currentUserId,
    source: resolution.source,
    attempted: resolution.attempted
  });

  const allAttempts = await getAllFromDB(STORAGE_CONFIG.STORES.ATTEMPTS)
  const allMastery = await getAllFromDB(STORAGE_CONFIG.STORES.MASTERY)
  const allSchedules = await getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES)
  const allSessions = await getAllFromDB(STORAGE_CONFIG.STORES.LEARNING_SESSIONS)

  console.log('📊 SYNC: Local IndexedDB data counts:', {
    attempts: allAttempts.length,
    mastery: allMastery.length,
    schedules: allSchedules.length,
    sessions: allSessions.length,
    sampleAttemptUserIds: allAttempts.slice(0, 3).map(a => a.userId),
    currentUserId
  });

  const attemptMap = new Map()
  const masteryMap = new Map()
  const scheduleMap = new Map()
  const sessionMap = new Map()

  allAttempts.forEach((attempt) => {
    const compositeKey = getAttemptCompositeKey(attempt)
    attemptMap.set(compositeKey, attempt)
    if (attempt?.id) {
      attemptMap.set(`id:${attempt.id}`, attempt)
    }
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
    const attemptsToUpdate = []

    for (const remoteAttempt of accountData.attempts) {
      try {
        const idKey = remoteAttempt?.id ? `id:${remoteAttempt.id}` : null
        const compositeKey = getAttemptCompositeKey(remoteAttempt)
        const existing = (idKey && attemptMap.get(idKey)) || attemptMap.get(compositeKey)

        if (!existing) {
          const localAttempt = {
            ...remoteAttempt,
            userId: currentUserId,
            id: remoteAttempt.id || `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            syncedAt: new Date()
          }
          attemptsToSave.push(localAttempt)
          attemptMap.set(getAttemptCompositeKey(localAttempt), localAttempt)
          if (localAttempt?.id) attemptMap.set(`id:${localAttempt.id}`, localAttempt)
        } else {
          const remoteTime = getAttemptMergeTimestamp(remoteAttempt)
          const localTime = getAttemptMergeTimestamp(existing)

          if (remoteTime > localTime) {
            const updatedAttempt = {
              ...existing,
              ...remoteAttempt,
              userId: currentUserId,
              createdAt: existing.createdAt || remoteAttempt.createdAt,
              syncedAt: new Date()
            }

            const updateId = existing?.id || remoteAttempt?.id

            if (updateId) {
              attemptsToUpdate.push({ id: updateId, updates: updatedAttempt })
            } else {
              // Fallback: if no id is available, treat as new to avoid losing data
              updatedAttempt.id = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
              attemptsToSave.push(updatedAttempt)
            }

            attemptMap.set(getAttemptCompositeKey(updatedAttempt), updatedAttempt)
            if (updateId) attemptMap.set(`id:${updateId}`, updatedAttempt)
          }
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
        results.attempts += batchResult.saved
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

    if (attemptsToUpdate.length > 0) {
      try {
        const batchResult = await batchUpdateInDB(STORAGE_CONFIG.STORES.ATTEMPTS, attemptsToUpdate)
        results.attempts += batchResult.updated
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error en batch update de attempts', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += attemptsToUpdate.length
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

  // Settings merge - use most recent settings from server
  // CRITICAL: Server settings may come as {id, userId, settings: {...}} or directly as the settings object
  // To avoid "fresh device" overriding server settings due to recent local defaults,
  // prefer server when there is no local IndexedDB record for this user's settings.
  if (accountData?.settings) {
    try {
      const { useSettings } = await import('../../state/settings.js')
      const { saveUserSettings, getUserSettings } = await import('./database.js')
      const currentSettings = useSettings.getState()

      // Extract actual settings - handle both wrapped {settings: {...}} and direct format
      const serverSettingsRecord = accountData.settings
      const actualServerSettings = serverSettingsRecord?.settings || serverSettingsRecord

      // Determine authoritative timestamps
      const serverUpdatedAt = serverSettingsRecord?.updatedAt ||
        actualServerSettings?.lastUpdated ||
        actualServerSettings?.updatedAt || 0

      // Look up the last persisted settings from IndexedDB for this user
      // If none exist, treat localUpdatedAt as 0 so server wins on fresh devices
      let localUpdatedAt = 0
      try {
        const localDbSettings = await getUserSettings(currentUserId)
        localUpdatedAt = localDbSettings?.updatedAt || currentSettings?.lastUpdated || currentSettings?.updatedAt || 0
      } catch {
        localUpdatedAt = currentSettings?.lastUpdated || currentSettings?.updatedAt || 0
      }

      console.log('🔄 SYNC: Settings merge comparison:', {
        serverUpdatedAt: new Date(serverUpdatedAt || 0).toISOString(),
        localUpdatedAt: new Date(localUpdatedAt || 0).toISOString(),
        serverIsNewer: serverUpdatedAt > localUpdatedAt,
        serverUserLevel: actualServerSettings?.userLevel,
        localUserLevel: currentSettings?.userLevel,
        hasNestedSettings: !!serverSettingsRecord?.settings
      })

      const shouldApplyServer = serverUpdatedAt > localUpdatedAt

      if (shouldApplyServer) {
        // Server has newer settings, apply them
        // Merge with existing state to preserve any local-only properties
        const mergedSettings = { ...currentSettings, ...actualServerSettings, lastUpdated: serverUpdatedAt }

        useSettings.setState(mergedSettings)

        // Persist to IndexedDB immediately to prevent re-upload
        // CRITICAL: Mark as alreadySynced to prevent sync loop
        await saveUserSettings(currentUserId, mergedSettings, { alreadySynced: true })

        // CRITICAL: Sync user level to local profile system
        if (mergedSettings.userLevel) {
          try {
            await setGlobalUserLevel(mergedSettings.userLevel, 'sync')
          } catch (e) {
            safeLogger.warn('mergeAccountDataLocally: failed to sync user level to profile', e)
          }
        }

        results.settings = 1
        safeLogger.info('mergeAccountDataLocally: applied server settings (authoritative or newer)', {
          serverUpdatedAt,
          localUpdatedAt,
          serverUserLevel: actualServerSettings?.userLevel,
          appliedUserLevel: mergedSettings?.userLevel
        })
        console.log('✅ SYNC: Applied server settings:', {
          userLevel: mergedSettings?.userLevel,
          level: mergedSettings?.level
        })
      } else {
        safeLogger.info('mergeAccountDataLocally: kept local settings (newer or equal)', {
          serverUpdatedAt,
          localUpdatedAt
        })
        console.log('ℹ️ SYNC: Kept local settings (newer or equal)')
      }
    } catch (error) {
      safeLogger.warn('mergeAccountDataLocally: error merging settings', {
        message: error?.message || String(error),
        name: error?.name
      })
      console.error('❌ SYNC: Settings merge error:', error)
      results.conflicts++
    }
  }

  // Challenges merge
  if (accountData?.challenges && Array.isArray(accountData.challenges)) {
    const challengesToSave = []
    const allChallenges = await getAllFromDB(STORAGE_CONFIG.STORES.CHALLENGES)
    const challengeMap = new Map()

    allChallenges.forEach(challenge => {
      if (challenge?.id) challengeMap.set(challenge.id, challenge)
    })

    for (const remoteChallenge of accountData.challenges) {
      try {
        const existing = challengeMap.get(remoteChallenge.id)
        if (!existing) {
          // New challenge from server
          const localChallenge = {
            ...remoteChallenge,
            userId: currentUserId,
            syncedAt: Date.now()
          }
          challengesToSave.push(localChallenge)
          challengeMap.set(remoteChallenge.id, localChallenge)
        } else {
          // Challenge exists locally - use last-write-wins based on updatedAt
          const localUpdated = existing.updatedAt || existing.createdAt || 0
          const serverUpdated = remoteChallenge.updatedAt || remoteChallenge.createdAt || 0

          if (serverUpdated > localUpdated) {
            // Server version is newer, replace local
            const updatedChallenge = {
              ...remoteChallenge,
              userId: currentUserId,
              syncedAt: Date.now()
            }
            challengesToSave.push(updatedChallenge)
            challengeMap.set(remoteChallenge.id, updatedChallenge)
            safeLogger.info('mergeAccountDataLocally: replacing local challenge with server version (newer)', {
              id: remoteChallenge.id,
              serverUpdated,
              localUpdated
            })
          }
          // else: local version is newer or equal, keep it
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error merging challenge', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts++
      }
    }

    if (challengesToSave.length > 0) {
      try {
        const batchResult = await batchSaveToDB(STORAGE_CONFIG.STORES.CHALLENGES, challengesToSave, { skipTimestamps: true })
        results.challenges += batchResult.saved
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error in batch save of challenges', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += challengesToSave.length
      }
    }
  }

  // Events merge
  if (accountData?.events && Array.isArray(accountData.events)) {
    const eventsToSave = []
    const allEvents = await getAllFromDB(STORAGE_CONFIG.STORES.EVENTS)
    const eventMap = new Map()

    allEvents.forEach(event => {
      if (event?.id) eventMap.set(event.id, event)
    })

    for (const remoteEvent of accountData.events) {
      try {
        const existing = eventMap.get(remoteEvent.id)
        if (!existing) {
          // New event from server
          const localEvent = {
            ...remoteEvent,
            userId: currentUserId,
            syncedAt: Date.now()
          }
          eventsToSave.push(localEvent)
          eventMap.set(remoteEvent.id, localEvent)
        } else {
          // Event exists locally - use last-write-wins based on updatedAt
          const localUpdated = existing.updatedAt || existing.createdAt || 0
          const serverUpdated = remoteEvent.updatedAt || remoteEvent.createdAt || 0

          if (serverUpdated > localUpdated) {
            // Server version is newer, replace local
            const updatedEvent = {
              ...remoteEvent,
              userId: currentUserId,
              syncedAt: Date.now()
            }
            eventsToSave.push(updatedEvent)
            eventMap.set(remoteEvent.id, updatedEvent)
            safeLogger.info('mergeAccountDataLocally: replacing local event with server version (newer)', {
              id: remoteEvent.id,
              serverUpdated,
              localUpdated
            })
          }
          // else: local version is newer or equal, keep it
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error merging event', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts++
      }
    }

    if (eventsToSave.length > 0) {
      try {
        const batchResult = await batchSaveToDB(STORAGE_CONFIG.STORES.EVENTS, eventsToSave, { skipTimestamps: true })
        results.events += batchResult.saved
        if (batchResult.errors.length > 0) {
          results.conflicts += batchResult.errors.length
        }
      } catch (error) {
        safeLogger.warn('mergeAccountDataLocally: error in batch save of events', {
          message: error?.message || String(error),
          name: error?.name
        })
        results.conflicts += eventsToSave.length
      }
    }
  }

  return { ...results, userId: currentUserId, source: resolution.source, attempted: resolution.attempted, merged: results }
}

export const __testing = {
  extractUserIdFromAccountData,
  notifySyncIssue
}
