/**
 * progressRepository.js
 * Repositorio centralizado para consultar y persistir datos del sistema de progreso.
 * Ofrece una API estable para capas superiores (p.ej. meaningful-practice) sin exponer
 * los detalles de IndexedDB ni estructuras internas.
 */

import { STORAGE_CONFIG } from './config.js'
import {
  getAttemptsByUser,
  getMasteryByUser,
  getLearningSessionsByUser,
  getEventsByUser,
  getAllFromDB,
  saveAttempt
} from './database.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:repository')

const DEFAULT_PROGRESS_OPTIONS = {
  includeAttempts: true,
  includeMastery: true,
  includeSchedules: true,
  includeLearningSessions: true,
  includeEvents: false,
  limitAttempts: 250,
  limitEvents: 250,
  limitSessions: 100
}

/**
 * Normaliza un array asegurando orden por fecha descendente y límite máximo.
 * @param {Object[]} list
 * @param {number} limit
 * @param {string} dateKey
 */
function normalizeByDate(list = [], limit, dateKey = 'createdAt') {
  return [...list]
    .sort((a, b) => new Date(b?.[dateKey] ?? 0) - new Date(a?.[dateKey] ?? 0))
    .slice(0, limit)
}

/**
 * Obtiene un resumen completo del progreso del usuario.
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function getProgress(userId, options = {}) {
  if (!userId) {
    throw new Error('getProgress requires a valid userId')
  }

  const opts = { ...DEFAULT_PROGRESS_OPTIONS, ...options }
  const result = {
    userId,
    attempts: [],
    mastery: [],
    schedules: [],
    learningSessions: [],
    events: [],
    stats: {
      totalAttempts: 0,
      totalMastery: 0,
      totalSchedules: 0,
      totalSessions: 0,
      totalEvents: 0,
      lastAttemptAt: null
    }
  }

  try {
    if (opts.includeAttempts) {
      const attempts = await getAttemptsByUser(userId)
      result.attempts = normalizeByDate(attempts, opts.limitAttempts, 'createdAt')
      result.stats.totalAttempts = result.attempts.length
      if (result.attempts.length > 0) {
        result.stats.lastAttemptAt = result.attempts[0].createdAt ?? null
      }
    }
  } catch (error) {
    logger.warn('getProgress', 'Failed to load attempts', error)
  }

  try {
    if (opts.includeMastery) {
      result.mastery = await getMasteryByUser(userId)
      result.stats.totalMastery = result.mastery.length
    }
  } catch (error) {
    logger.warn('getProgress', 'Failed to load mastery data', error)
  }

  try {
    if (opts.includeSchedules) {
      const schedules = await getAllFromDB(STORAGE_CONFIG.STORES.SCHEDULES)
      result.schedules = schedules.filter(schedule => schedule?.userId === userId)
      result.stats.totalSchedules = result.schedules.length
    }
  } catch (error) {
    logger.warn('getProgress', 'Failed to load schedules', error)
  }

  try {
    if (opts.includeLearningSessions) {
      const sessions = await getLearningSessionsByUser(userId)
      result.learningSessions = normalizeByDate(sessions, opts.limitSessions ?? 100, 'timestamp')
      result.stats.totalSessions = result.learningSessions.length
    }
  } catch (error) {
    logger.warn('getProgress', 'Failed to load learning sessions', error)
  }

  try {
    if (opts.includeEvents) {
      const events = await getEventsByUser(userId)
      result.events = normalizeByDate(events, opts.limitEvents, 'createdAt')
      result.stats.totalEvents = result.events.length
    }
  } catch (error) {
    logger.warn('getProgress', 'Failed to load events', error)
  }

  return result
}

/**
 * Registra un intento en la base de datos de progreso.
 * @param {string} userId
 * @param {Object} attempt
 * @returns {Promise<Object>} Attempt almacenado (con IDs/timestamps normalizados)
 */
export async function recordAttempt(userId, attempt) {
  if (!userId) {
    throw new Error('recordAttempt requires a userId')
  }

  if (!attempt || typeof attempt !== 'object') {
    throw new Error('recordAttempt requires attempt data')
  }

  const attemptRecord = {
    ...attempt,
    userId,
    createdAt: attempt.createdAt ?? new Date().toISOString(),
    updatedAt: attempt.updatedAt ?? new Date().toISOString()
  }

  try {
    await saveAttempt(attemptRecord)
    logger.debug('recordAttempt', 'Attempt stored', { userId, itemId: attemptRecord.itemId })
    return attemptRecord
  } catch (error) {
    logger.error('recordAttempt', 'Failed to store attempt', error)
    throw error
  }
}

export default {
  getProgress,
  recordAttempt
}
