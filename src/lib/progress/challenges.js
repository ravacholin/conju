import { STORAGE_CONFIG } from './config.js'
import { getFromDB, saveToDB } from './database.js'
import { getDailyChallengeMetrics } from './analytics.js'
import { createLogger } from '../utils/logger.js'
import { emitProgressEvent, PROGRESS_EVENTS } from '../events/progressEventBus.js'

const logger = createLogger('progress:challenges')


const CHALLENGE_STORE = STORAGE_CONFIG.STORES.CHALLENGES

const CHALLENGE_DEFINITIONS = [
  {
    id: 'attempts-20',
    title: 'Reto de práctica',
    description: 'Completa 20 intentos hoy para mantener tu constancia.',
    metric: 'attemptsToday',
    target: 20,
    icon: '/icons/bolt.png',
    reward: { type: 'xp', value: 20 }
  },
  {
    id: 'accuracy-85',
    title: 'Precisión impecable',
    description: 'Mantén al menos 85% de aciertos con 10 intentos o más.',
    metric: 'accuracyToday',
    target: 85,
    minimumAttempts: 10,
    icon: '/icons/brain.png',
    reward: { type: 'booster', value: 'accuracy' }
  },
  {
    id: 'streak-5',
    title: 'Racha caliente',
    description: 'Consigue una racha de 5 respuestas correctas seguidas hoy.',
    metric: 'bestStreakToday',
    target: 5,
    icon: '/icons/sparks.png',
    reward: { type: 'streak', value: 5 }
  },
  {
    id: 'focus-10',
    title: 'Enfoque total',
    description: 'Acumula 10 minutos de práctica hoy (tiempo activo).',
    metric: 'focusMinutesToday',
    target: 10,
    icon: '/icons/timer.png',
    reward: { type: 'token', value: 1 }
  }
]

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function computeProgress(definition, metrics) {
  const value = metrics[definition.metric] || 0
  const target = definition.target || 0
  const percentage = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0

  switch (definition.metric) {
    case 'attemptsToday':
      return { value, target, percentage, label: `${value} / ${target} intentos` }
    case 'accuracyToday':
      return {
        value: Math.round(value),
        target,
        percentage: target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0,
        label: `${Math.round(value)}% precisión`
      }
    case 'bestStreakToday':
      return { value, target, percentage, label: `${value} / ${target} en racha` }
    case 'focusMinutesToday':
      return { value, target, percentage, label: `${value} / ${target} min` }
    default:
      return { value, target, percentage, label: `${value} / ${target}` }
  }
}

function isRequirementMet(definition, metrics) {
  const value = metrics[definition.metric] || 0
  if (definition.metric === 'accuracyToday') {
    const attempts = metrics.attemptsToday || 0
    if (attempts < (definition.minimumAttempts || 0)) return false
    return value >= definition.target
  }
  return value >= definition.target
}

function emitChallengeCompleted(detail) {
  try {
    const eventDetail = {
      ...detail,
      emittedAt: new Date().toISOString()
    }
    emitProgressEvent(PROGRESS_EVENTS.CHALLENGE_COMPLETED, eventDetail)
    emitProgressEvent(PROGRESS_EVENTS.DATA_UPDATED, {
      type: 'challenge_completed',
      userId: detail.userId,
      challengeId: detail.challengeId
    })
  } catch (error) {
    logger.warn('No se pudo emitir evento de desafío completado:', error)
  }
}

function buildPersistedChallenges(definitions, existing = []) {
  const byId = new Map(existing.map(entry => [entry.id, entry]))
  return definitions.map(def => {
    const stored = byId.get(def.id)
    return {
      id: def.id,
      status: stored?.status || 'pending',
      completedAt: stored?.completedAt || null
    }
  })
}

export async function getDailyChallengeSnapshot(userId, { signal } = {}) {
  if (!userId) {
    throw new Error('Se requiere userId para obtener desafíos diarios')
  }

  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }

  const metrics = await getDailyChallengeMetrics(userId, signal)
  const date = todayKey()
  const recordId = `${userId}|${date}`
  const existing = await getFromDB(CHALLENGE_STORE, recordId)

  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }
  const baseChallenges = existing?.date === date ? existing?.challenges : []

  let persisted = buildPersistedChallenges(CHALLENGE_DEFINITIONS, baseChallenges)
  let mutated = !existing || existing.date !== date
  const nowIso = new Date().toISOString()
  const challenges = CHALLENGE_DEFINITIONS.map(def => {
    const stored = persisted.find(entry => entry.id === def.id) || { id: def.id, status: 'pending', completedAt: null }
    const progress = computeProgress(def, metrics)
    const requirementMet = isRequirementMet(def, metrics)
    let status = stored.status
    let completedAt = stored.completedAt

    if (requirementMet && status !== 'completed') {
      status = 'completed'
      completedAt = nowIso
      mutated = true
      emitChallengeCompleted({ userId, challengeId: def.id, reward: def.reward })
    }

    return {
      ...def,
      status,
      completedAt,
      progress,
      requirementMet
    }
  })

  if (mutated) {
    persisted = challenges.map(({ id, status, completedAt }) => ({ id, status, completedAt }))
    const payload = {
      id: recordId,
      userId,
      date,
      challenges: persisted,
      createdAt: existing?.date === date ? existing?.createdAt : nowIso,
      updatedAt: nowIso, // Track when challenges were last modified
      syncedAt: 0 // Mark as needing sync
    }
    if (signal?.aborted) {
      throw new Error('Operation was cancelled')
    }
    await saveToDB(CHALLENGE_STORE, payload)
  }

  return {
    date,
    metrics,
    challenges
  }
}

export async function markChallengeCompleted(userId, challengeId) {
  if (!userId) {
    throw new Error('Se requiere userId para marcar desafíos')
  }
  const date = todayKey()
  const recordId = `${userId}|${date}`
  const existing = await getFromDB(CHALLENGE_STORE, recordId)
  const nowIso = new Date().toISOString()

  const persisted = buildPersistedChallenges(
    CHALLENGE_DEFINITIONS,
    existing?.date === date ? existing?.challenges : []
  )
  const target = persisted.find(entry => entry.id === challengeId)
  if (!target) {
    throw new Error(`Desafío ${challengeId} no reconocido`)
  }

  if (target.status !== 'completed') {
    target.status = 'completed'
    target.completedAt = nowIso
    await saveToDB(CHALLENGE_STORE, {
      id: recordId,
      userId,
      date,
      challenges: persisted,
      createdAt: existing?.date === date ? existing?.createdAt : nowIso,
      updatedAt: nowIso, // Track when challenge was completed
      syncedAt: 0 // Mark as needing sync
    })
    const definition = CHALLENGE_DEFINITIONS.find(def => def.id === challengeId)
    emitChallengeCompleted({ userId, challengeId, reward: definition?.reward })
  }

  return {
    date,
    challenges: persisted
  }
}

export function getChallengeDefinitions() {
  return [...CHALLENGE_DEFINITIONS]
}
