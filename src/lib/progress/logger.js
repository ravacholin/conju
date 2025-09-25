// Sistema de Logging Inteligente para el Sistema de Progreso
// Logging condicional basado en environment con niveles configurables

import { PROGRESS_CONFIG } from './config.js'

/**
 * Niveles de logging disponibles
 */
export const LOG_LEVELS = PROGRESS_CONFIG.LOGGING.LEVELS

/**
 * Logger inteligente para el sistema de progreso
 */
class ProgressLogger {
  constructor() {
    this.enabled = PROGRESS_CONFIG.LOGGING.ENABLED
    this.currentLevel = PROGRESS_CONFIG.LOGGING.DEFAULT_LEVEL
    this.prefix = '🧠 [Progreso]'
  }

  /**
   * Establece el nivel de logging
   */
  setLevel(level) {
    this.currentLevel = level
  }

  /**
   * Habilita o deshabilita logging
   */
  setEnabled(enabled) {
    this.enabled = enabled
  }

  /**
   * Logging de error (siempre visible)
   */
  error(message, ...args) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.ERROR) {
      console.error(`${this.prefix} ❌`, message, ...args)
    }
  }

  /**
   * Logging de warning
   */
  warn(message, ...args) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.WARN) {
      console.warn(`${this.prefix} ⚠️`, message, ...args)
    }
  }

  /**
   * Logging de información
   */
  info(message, ...args) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.INFO) {
      console.log(`${this.prefix} ℹ️`, message, ...args)
    }
  }

  /**
   * Logging de debug (solo en desarrollo)
   */
  debug(message, ...args) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(`${this.prefix} 🔍`, message, ...args)
    }
  }

  /**
   * Logging específico de flow state
   */
  flow(message, data) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.INFO) {
      console.log(`${this.prefix} 🔥 [Flow]`, message, data)
    }
  }

  /**
   * Logging específico de momentum
   */
  momentum(message, data) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.INFO) {
      console.log(`${this.prefix} 📈 [Momentum]`, message, data)
    }
  }

  /**
   * Logging específico de confianza
   */
  confidence(message, data) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.INFO) {
      console.log(`${this.prefix} 🎯 [Confianza]`, message, data)
    }
  }

  /**
   * Logging específico de objetivos
   */
  goals(message, data) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.INFO) {
      console.log(`${this.prefix} 🏆 [Objetivos]`, message, data)
    }
  }

  /**
   * Logging específico de temporal
   */
  temporal(message, data) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.INFO) {
      console.log(`${this.prefix} ⏰ [Temporal]`, message, data)
    }
  }

  /**
   * Logging para performance crítico
   */
  performance(message, timing) {
    if (this.enabled) {
      const timeStr = timing ? ` (${timing}ms)` : ''
      console.log(`${this.prefix} ⚡ [Performance]`, message + timeStr)
    }
  }

  /**
   * Log condicional solo si hay datos importantes
   */
  conditionalInfo(condition, message, data) {
    if (condition && this.enabled && this.currentLevel >= LOG_LEVELS.INFO) {
      console.log(`${this.prefix} ℹ️`, message, data)
    }
  }

  /**
   * Log de inicialización de sistema
   */
  systemInit(systemName, success = true) {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.INFO) {
      const status = success ? '✅ Inicializado' : '❌ Error al inicializar'
      console.log(`${this.prefix} 🚀 [${systemName}]`, status)
    }
  }

  /**
   * Log de limpieza/cleanup
   */
  cleanup(systemName, details = '') {
    if (this.enabled && this.currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(`${this.prefix} 🧹 [${systemName}] Cleanup`, details)
    }
  }
}

// Instancia global del logger
export const logger = new ProgressLogger()

// Shortcuts para uso común
export const logError = (...args) => logger.error(...args)
export const logWarn = (...args) => logger.warn(...args) 
export const logInfo = (...args) => logger.info(...args)
export const logDebug = (...args) => logger.debug(...args)
export const logFlow = (...args) => logger.flow(...args)
export const logMomentum = (...args) => logger.momentum(...args)
export const logConfidence = (...args) => logger.confidence(...args)
export const logGoals = (...args) => logger.goals(...args)
export const logTemporal = (...args) => logger.temporal(...args)

export default logger