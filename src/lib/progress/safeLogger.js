import { createLogger } from '../utils/logger.js'

const env = (typeof import.meta !== 'undefined' && import.meta?.env) ||
  (typeof process !== 'undefined'
    ? {
        DEV: process.env?.NODE_ENV !== 'production',
        PROD: process.env?.NODE_ENV === 'production'
      }
    : { DEV: true, PROD: false })

const isDevEnvironment = !!env?.DEV && !env?.PROD

const SENSITIVE_PATTERNS = ['token', 'authorization', 'auth', 'email', 'cookie', 'password', 'secret']

function maskSensitiveValue(value) {
  if (value == null) return value
  if (typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') {
    return { redacted: true, length: value.length }
  }
  if (Array.isArray(value)) {
    return { redacted: true, items: value.length }
  }
  if (typeof value === 'object') {
    return { redacted: true, keys: Object.keys(value).length }
  }
  return { redacted: true }
}

function sanitizeMeta(meta, depth = 0) {
  if (meta == null || depth > 5) return meta
  if (Array.isArray(meta)) {
    return meta.map((item) => sanitizeMeta(item, depth + 1))
  }
  if (typeof meta === 'object') {
    return Object.entries(meta).reduce((acc, [key, value]) => {
      const lowerKey = key.toLowerCase()
      if (SENSITIVE_PATTERNS.some((pattern) => lowerKey.includes(pattern))) {
        acc[key] = maskSensitiveValue(value)
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = sanitizeMeta(value, depth + 1)
      } else if (typeof value === 'string' && /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(value)) {
        acc[key] = '[redacted-email]'
      } else {
        acc[key] = value
      }
      return acc
    }, Array.isArray(meta) ? [] : {})
  }
  if (typeof meta === 'string' && /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(meta)) {
    return '[redacted-email]'
  }
  return meta
}

function formatMeta(meta) {
  if (meta == null) return undefined
  const sanitized = sanitizeMeta(meta)
  if (isDevEnvironment) {
    return sanitized
  }

  if (typeof sanitized === 'object' && !Array.isArray(sanitized)) {
    const summary = {}
    if (typeof sanitized.status === 'number') summary.status = sanitized.status
    if (typeof sanitized.statusCode === 'number') summary.statusCode = sanitized.statusCode
    if (typeof sanitized.statusText === 'string') summary.statusText = sanitized.statusText
    if (typeof sanitized.errorName === 'string') summary.errorName = sanitized.errorName
    if (typeof sanitized.errorMessage === 'string') summary.errorMessage = sanitized.errorMessage
    if (typeof sanitized.message === 'string') summary.message = sanitized.message
    return Object.keys(summary).length > 0 ? summary : undefined
  }

  return undefined
}

export function createSafeLogger(scope = 'progress:userManager') {
  const logger = createLogger(scope)
  return {
    debug(message, meta) {
      logger.debug(message, formatMeta(meta))
    },
    info(message, meta) {
      logger.info(message, formatMeta(meta))
    },
    warn(message, meta) {
      logger.warn(message, formatMeta(meta))
    },
    error(message, meta) {
      logger.error(message, formatMeta(meta))
    }
  }
}

export const __testing = {
  sanitizeMeta,
  formatMeta
}

