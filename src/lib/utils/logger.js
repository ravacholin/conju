/**
 * Production-safe logging utility
 * Controls console output based on environment and log levels
 */

// Log levels in order of severity
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

// Default log level based on environment
const getDefaultLogLevel = () => {
  if (import.meta.env.DEV) {
    return LOG_LEVELS.DEBUG // Show all logs in development
  } else if (import.meta.env.PROD) {
    return LOG_LEVELS.ERROR // Only errors in production
  }
  return LOG_LEVELS.WARN // Default to warnings
}

// Current log level (can be overridden)
let currentLogLevel = getDefaultLogLevel()

// Performance tracking for expensive operations
const performanceTracking = new Map()

/**
 * Set the current log level
 * @param {string|number} level - Log level name or number
 */
export function setLogLevel(level) {
  if (typeof level === 'string') {
    currentLogLevel = LOG_LEVELS[level.toUpperCase()] ?? getDefaultLogLevel()
  } else if (typeof level === 'number') {
    currentLogLevel = level
  }
}

/**
 * Check if a log level should be output
 * @param {number} level - Log level to check
 * @returns {boolean} - Whether to output the log
 */
function shouldLog(level) {
  return level >= currentLogLevel
}

/**
 * Format log message with timestamp and context
 * @param {string} level - Log level name
 * @param {string} context - Context/module name
 * @param {string} message - Log message
 * @param {any} data - Additional data
 * @returns {Array} - Formatted log arguments
 */
function formatLog(level, context, message, data) {
  const timestamp = new Date().toLocaleTimeString()
  const prefix = `[${timestamp}] ${level.toUpperCase()}`
  const contextStr = context ? `[${context}]` : ''
  
  if (data !== undefined) {
    return [`${prefix}${contextStr} ${message}`, data]
  }
  return [`${prefix}${contextStr} ${message}`]
}

/**
 * Debug logger - only in development
 * @param {string} context - Context/module name
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
export function debug(context, message, data) {
  if (shouldLog(LOG_LEVELS.DEBUG)) {
    console.log(...formatLog('debug', context, message, data))
  }
}

/**
 * Info logger
 * @param {string} context - Context/module name
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
export function info(context, message, data) {
  if (shouldLog(LOG_LEVELS.INFO)) {
    console.info(...formatLog('info', context, message, data))
  }
}

/**
 * Warning logger
 * @param {string} context - Context/module name
 * @param {string} message - Log message
 * @param {any} data - Optional data to log
 */
export function warn(context, message, data) {
  if (shouldLog(LOG_LEVELS.WARN)) {
    console.warn(...formatLog('warn', context, message, data))
  }
}

/**
 * Error logger - always logs
 * @param {string} context - Context/module name
 * @param {string} message - Log message
 * @param {any} error - Error object or additional data
 */
export function error(context, message, error) {
  if (shouldLog(LOG_LEVELS.ERROR)) {
    console.error(...formatLog('error', context, message, error))
  }
}

/**
 * Performance tracking utilities
 */
export const perf = {
  /**
   * Start performance measurement
   * @param {string} key - Unique identifier for this measurement
   */
  start(key) {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      performanceTracking.set(key, performance.now())
    }
  },

  /**
   * End performance measurement and log result
   * @param {string} key - Unique identifier for this measurement
   * @param {string} context - Context/module name
   * @param {string} operation - Description of the operation
   * @param {number} threshold - Threshold in ms to warn about slow operations
   */
  end(key, context, operation, threshold = 100) {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return

    const startTime = performanceTracking.get(key)
    if (startTime === undefined) {
      warn(context, `Performance measurement '${key}' was not started`)
      return
    }

    const duration = performance.now() - startTime
    performanceTracking.delete(key)

    if (duration > threshold) {
      warn(context, `${operation} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`)
    } else {
      debug(context, `${operation} completed in ${duration.toFixed(2)}ms`)
    }

    return duration
  },

  /**
   * Measure a function execution time
   * @param {string} context - Context/module name
   * @param {string} operation - Description of the operation
   * @param {Function} fn - Function to measure
   * @param {number} threshold - Threshold in ms to warn about slow operations
   * @returns {any} - Result of the function
   */
  async measure(context, operation, fn, threshold = 100) {
    const key = `${context}-${operation}-${Date.now()}`
    this.start(key)
    
    try {
      const result = await fn()
      this.end(key, context, operation, threshold)
      return result
    } catch (err) {
      this.end(key, context, `${operation} (failed)`, threshold)
      throw err
    }
  }
}

/**
 * Create a logger for a specific context/module
 * @param {string} context - Context/module name
 * @returns {Object} - Logger object with context pre-filled
 */
export function createLogger(context) {
  return {
    debug: (message, data) => debug(context, message, data),
    info: (message, data) => info(context, message, data),
    warn: (message, data) => warn(context, message, data),
    error: (message, error) => error(context, message, error),
    perf: {
      start: (key) => perf.start(`${context}-${key}`),
      end: (key, operation, threshold) => perf.end(`${context}-${key}`, context, operation, threshold),
      measure: (operation, fn, threshold) => perf.measure(context, operation, fn, threshold)
    }
  }
}

/**
 * Graceful console replacement for noisy third-party libraries
 * Use this to temporarily suppress logs from dependencies
 */
export function suppressLogs() {
  const originalConsole = { ...console }
  
  console.log = (...args) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      originalConsole.log(...args)
    }
  }
  
  console.info = (...args) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      originalConsole.info(...args)
    }
  }
  
  console.warn = (...args) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      originalConsole.warn(...args)
    }
  }
  
  // Always allow errors through
  console.error = originalConsole.error
  
  // Return function to restore original console
  return () => {
    Object.assign(console, originalConsole)
  }
}

/**
 * Get current log configuration
 * @returns {Object} - Current log configuration
 */
export function getLogConfig() {
  return {
    level: currentLogLevel,
    levelName: Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === currentLogLevel),
    environment: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD
  }
}

// Export log levels for external use
export { LOG_LEVELS }

// Global logger instance
export const logger = createLogger('app')