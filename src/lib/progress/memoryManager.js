// Gestor de Memoria para Sistemas de Inteligencia Emocional
// Previene memory leaks y gestiona cleanup de recursos

import { PROGRESS_CONFIG } from './config.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:memoryManager')

/**
 * Gestor centralizado de memoria y cleanup
 */
class MemoryManager {
  constructor() {
    this.intervals = new Map() // intervalId -> metadata
    this.timeouts = new Map()  // timeoutId -> metadata
    this.eventListeners = new Map() // element -> listeners
    this.systems = new Map() // systemName -> cleanupFunction
    this.isCleaningUp = false
  }

  /**
   * Registra un interval para cleanup automático
   */
  registerInterval(systemName, callback, intervalMs, description = '') {
    if (typeof setInterval === 'undefined') return null

    const intervalId = setInterval(callback, intervalMs)

    this.intervals.set(intervalId, {
      systemName,
      intervalMs,
      description,
      createdAt: Date.now()
    })

    // Safe logging - avoid TDZ errors during module initialization
    try {
      logger?.debug?.(`Interval registrado: ${systemName}`, { intervalMs, description })
    } catch (e) {
      // Logger not ready yet - silent fail
    }
    return intervalId
  }

  /**
   * Registra un timeout para cleanup
   */
  registerTimeout(systemName, callback, timeoutMs, description = '') {
    if (typeof setTimeout === 'undefined') return null

    const timeoutId = setTimeout(() => {
      callback()
      this.timeouts.delete(timeoutId) // Auto-cleanup
    }, timeoutMs)
    
    this.timeouts.set(timeoutId, {
      systemName,
      timeoutMs,
      description,
      createdAt: Date.now()
    })

    return timeoutId
  }

  /**
   * Registra un sistema con función de cleanup
   */
  registerSystem(systemName, cleanupFunction) {
    this.systems.set(systemName, cleanupFunction)
    // Safe logging - avoid TDZ errors during module initialization
    try {
      logger?.debug?.(`Sistema registrado: ${systemName}`)
    } catch (e) {
      // Logger not ready yet - silent fail
    }
  }

  /**
   * Limpia un interval específico
   */
  clearInterval(intervalId) {
    if (intervalId && this.intervals.has(intervalId)) {
      clearInterval(intervalId)
      const metadata = this.intervals.get(intervalId)
      this.intervals.delete(intervalId)
      logger.cleanup(metadata.systemName, `Interval limpiado: ${metadata.description}`)
    }
  }

  /**
   * Limpia un timeout específico
   */
  clearTimeout(timeoutId) {
    if (timeoutId && this.timeouts.has(timeoutId)) {
      clearTimeout(timeoutId)
      const metadata = this.timeouts.get(timeoutId)
      this.timeouts.delete(timeoutId)
      logger.cleanup(metadata.systemName, `Timeout limpiado: ${metadata.description}`)
    }
  }

  /**
   * Limpia todos los recursos de un sistema específico
   */
  cleanupSystem(systemName) {
    // Limpiar intervals del sistema
    for (const [intervalId, metadata] of this.intervals.entries()) {
      if (metadata.systemName === systemName) {
        this.clearInterval(intervalId)
      }
    }

    // Limpiar timeouts del sistema
    for (const [timeoutId, metadata] of this.timeouts.entries()) {
      if (metadata.systemName === systemName) {
        this.clearTimeout(timeoutId)
      }
    }

    // Ejecutar cleanup específico del sistema
    const cleanupFn = this.systems.get(systemName)
    if (cleanupFn && typeof cleanupFn === 'function') {
      try {
        cleanupFn()
        logger.cleanup(systemName, 'Cleanup específico ejecutado')
      } catch (error) {
        logger.error(`Error en cleanup de ${systemName}:`, error)
      }
    }
  }

  /**
   * Limpia todos los recursos registrados
   */
  cleanupAll() {
    if (this.isCleaningUp) return
    this.isCleaningUp = true

    // Safe logging - avoid TDZ errors
    try {
      logger?.info?.('Iniciando cleanup completo de memoria')
    } catch (e) {
      // Logger not ready yet
    }

    // Limpiar todos los intervals
    for (const intervalId of this.intervals.keys()) {
      clearInterval(intervalId)
    }
    this.intervals.clear()

    // Limpiar todos los timeouts
    for (const timeoutId of this.timeouts.keys()) {
      clearTimeout(timeoutId)
    }
    this.timeouts.clear()

    // Ejecutar cleanup de todos los sistemas
    for (const [systemName, cleanupFn] of this.systems.entries()) {
      try {
        cleanupFn()
        // Safe logging - avoid TDZ errors
        try {
          logger?.cleanup?.(systemName, 'Sistema limpiado')
        } catch (e) {
          // Logger not ready yet
        }
      } catch (error) {
        // Safe logging - avoid TDZ errors
        try {
          logger?.error?.(`Error en cleanup de ${systemName}:`, error)
        } catch (e) {
          // Logger not ready yet
        }
      }
    }

    // Safe logging - avoid TDZ errors
    try {
      logger?.info?.('Cleanup completo de memoria finalizado')
    } catch (e) {
      // Logger not ready yet
    }
    this.isCleaningUp = false
  }

  /**
   * Obtiene estadísticas de uso de memoria
   */
  getMemoryStats() {
    return {
      activeIntervals: this.intervals.size,
      activeTimeouts: this.timeouts.size,
      registeredSystems: this.systems.size,
      intervalDetails: Array.from(this.intervals.values()),
      timeoutDetails: Array.from(this.timeouts.values()),
      systemNames: Array.from(this.systems.keys())
    }
  }

  /**
   * Auto-cleanup basado en antigüedad de recursos
   */
  performMaintenanceCleanup() {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hora

    // Limpiar intervals muy antiguos
    for (const [intervalId, metadata] of this.intervals.entries()) {
      if (now - metadata.createdAt > maxAge) {
        logger.warn(`Limpiando interval antiguo de ${metadata.systemName}`)
        this.clearInterval(intervalId)
      }
    }

    // Limpiar timeouts expirados (aunque deberían auto-limpiarse)
    for (const [timeoutId, metadata] of this.timeouts.entries()) {
      if (now - metadata.createdAt > metadata.timeoutMs + 1000) {
        logger.warn(`Limpiando timeout expirado de ${metadata.systemName}`)
        this.clearTimeout(timeoutId)
      }
    }
  }
}

// Instancia global del memory manager
export const memoryManager = new MemoryManager()

/**
 * Utility functions para uso fácil
 */
export const registerInterval = (systemName, callback, intervalMs, description) => 
  memoryManager.registerInterval(systemName, callback, intervalMs, description)

export const registerTimeout = (systemName, callback, timeoutMs, description) => 
  memoryManager.registerTimeout(systemName, callback, timeoutMs, description)

export const registerSystem = (systemName, cleanupFunction) => 
  memoryManager.registerSystem(systemName, cleanupFunction)

export const cleanupSystem = (systemName) => 
  memoryManager.cleanupSystem(systemName)

export const cleanupAll = () => 
  memoryManager.cleanupAll()

// Auto-cleanup cada 10 minutos para maintenance
if (typeof setInterval !== 'undefined') {
  const maintenanceInterval = setInterval(() => {
    memoryManager.performMaintenanceCleanup()
  }, 10 * 60 * 1000)

  // Registrar el maintenance interval para que también se pueda limpiar
  memoryManager.intervals.set(maintenanceInterval, {
    systemName: 'MemoryManager',
    intervalMs: 10 * 60 * 1000,
    description: 'Maintenance cleanup',
    createdAt: Date.now()
  })
}

// Cleanup automático en beforeunload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    memoryManager.cleanupAll()
  })

  // Exponer para debugging
  window.SpanishConjugator = window.SpanishConjugator || {}
  window.SpanishConjugator.MemoryManager = {
    getStats: () => memoryManager.getMemoryStats(),
    cleanup: () => memoryManager.cleanupAll(),
    cleanupSystem: (name) => memoryManager.cleanupSystem(name)
  }
}

export default memoryManager