import { z } from 'zod'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:eventBus')

export const PROGRESS_EVENTS = Object.freeze({
  DATA_UPDATED: 'progress:dataUpdated',
  CHALLENGE_COMPLETED: 'progress:challengeCompleted',
  NAVIGATE: 'progress:navigate',
  SRS_UPDATED: 'progress:srs-updated'
})

const progressDataUpdatedSchema = z.object({
  type: z.string().optional(),
  userId: z.string().optional(),
  attemptId: z.string().optional(),
  challengeId: z.string().optional(),
  mood: z.string().optional(),
  tense: z.string().optional(),
  person: z.union([z.string(), z.number()]).optional(),
  correct: z.boolean().optional(),
  forceFullRefresh: z.boolean().optional(),
  fullRefresh: z.boolean().optional()
}).passthrough()

const progressChallengeCompletedSchema = z.object({
  userId: z.string().optional(),
  challengeId: z.string().optional(),
  emittedAt: z.string().optional(),
  reward: z.unknown().optional()
}).passthrough()

const progressNavigateSchema = z.object({
  mood: z.string().optional(),
  tense: z.string().optional(),
  person: z.union([z.string(), z.number()]).optional(),
  micro: z.object({
    errorTag: z.string().optional(),
    size: z.number().int().positive().optional()
  }).partial().optional()
}).passthrough()

const progressSrsUpdatedSchema = z.object({
  userId: z.string().optional(),
  mood: z.string().optional(),
  tense: z.string().optional(),
  person: z.union([z.string(), z.number()]).optional()
}).passthrough()

const EVENT_SCHEMAS = Object.freeze({
  [PROGRESS_EVENTS.DATA_UPDATED]: progressDataUpdatedSchema,
  [PROGRESS_EVENTS.CHALLENGE_COMPLETED]: progressChallengeCompletedSchema,
  [PROGRESS_EVENTS.NAVIGATE]: progressNavigateSchema,
  [PROGRESS_EVENTS.SRS_UPDATED]: progressSrsUpdatedSchema
})

export const PROGRESS_EVENT_CATALOG = Object.freeze({
  [PROGRESS_EVENTS.DATA_UPDATED]: Object.freeze({
    payload: 'ProgressDataUpdated',
    origins: ['tracking', 'challenges', 'sync'],
    consumers: ['dashboard', 'cache', 'widgets']
  }),
  [PROGRESS_EVENTS.CHALLENGE_COMPLETED]: Object.freeze({
    payload: 'ProgressChallengeCompleted',
    origins: ['challenges'],
    consumers: ['cache', 'dashboard']
  }),
  [PROGRESS_EVENTS.NAVIGATE]: Object.freeze({
    payload: 'ProgressNavigate',
    origins: ['progress-ui'],
    consumers: ['ProgressDashboard']
  }),
  [PROGRESS_EVENTS.SRS_UPDATED]: Object.freeze({
    payload: 'ProgressSrsUpdated',
    origins: ['srs'],
    consumers: ['SRSPanel', 'notifications']
  })
})

function getSchema(eventName) {
  return EVENT_SCHEMAS[eventName] || null
}

export function validateProgressEventDetail(eventName, detail) {
  const schema = getSchema(eventName)
  if (!schema) {
    return { ok: true, data: detail ?? {} }
  }

  const parsed = schema.safeParse(detail ?? {})
  if (!parsed.success) {
    return { ok: false, error: parsed.error }
  }
  return { ok: true, data: parsed.data }
}

export function emitProgressEvent(eventName, detail = {}, { validate = true } = {}) {
  if (typeof window === 'undefined') {
    return false
  }

  let eventDetail = detail ?? {}
  if (validate) {
    const validation = validateProgressEventDetail(eventName, detail)
    if (!validation.ok) {
      logger.warn('emitProgressEvent', `Invalid payload for ${eventName}`, validation.error)
      return false
    }
    eventDetail = validation.data
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail: eventDetail }))
  return true
}

export function onProgressEvent(eventName, handler, { validate = false } = {}) {
  if (typeof window === 'undefined' || typeof handler !== 'function') {
    return () => {}
  }

  const listener = (event) => {
    const detail = event?.detail ?? {}
    if (!validate) {
      handler(detail, event)
      return
    }

    const validation = validateProgressEventDetail(eventName, detail)
    if (!validation.ok) {
      logger.warn('onProgressEvent', `Invalid payload for ${eventName}`, validation.error)
      return
    }
    handler(validation.data, event)
  }

  window.addEventListener(eventName, listener)
  return () => {
    window.removeEventListener(eventName, listener)
  }
}
