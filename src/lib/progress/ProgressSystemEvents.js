/**
 * ProgressSystemEvents.js - Sistema de eventos para inicialización del sistema de progreso
 * 
 * Reemplaza el patrón de sondeo por un sistema eficiente basado en eventos
 * que notifica cuando el sistema de progreso está listo para su uso.
 */

import { createLogger } from '../utils/logger.js'

const logger = createLogger('ProgressSystemEvents')

// Estado del sistema
let isSystemReady = false
let readyPromise = null
let readyResolve = null

// Lista de callbacks para notificar cuando el sistema esté listo
const readyCallbacks = new Set()

/**
 * Crea una promesa que se resuelve cuando el sistema está listo
 * @returns {Promise<boolean>} Promesa que se resuelve con true cuando está listo
 */
function createReadyPromise() {
  if (isSystemReady) {
    return Promise.resolve(true)
  }
  
  if (!readyPromise) {
    readyPromise = new Promise((resolve) => {
      readyResolve = resolve
    })
  }
  
  return readyPromise
}

/**
 * Marca el sistema como listo y notifica a todos los listeners
 */
export function markProgressSystemReady() {
  if (isSystemReady) {
    return // Ya está listo
  }
  
  isSystemReady = true
  logger.debug('Sistema de progreso marcado como listo')
  
  // Resolver la promesa pendiente
  if (readyResolve) {
    readyResolve(true)
    readyResolve = null
  }
  
  // Notificar a todos los callbacks registrados
  readyCallbacks.forEach(callback => {
    try {
      callback(true)
    } catch (error) {
      logger.warn('Error en callback de sistema listo:', error)
    }
  })
  
  // Limpiar callbacks después de notificar
  readyCallbacks.clear()
}

/**
 * Verifica si el sistema está listo (sin efectos secundarios)
 * @returns {boolean} true si el sistema está listo
 */
export function isProgressSystemReady() {
  return isSystemReady
}

/**
 * Espera a que el sistema esté listo usando una promesa
 * @param {number} timeout - Timeout en ms (opcional)
 * @returns {Promise<boolean>} Promesa que se resuelve cuando está listo
 */
export function waitForProgressSystem(timeout = null) {
  if (isSystemReady) {
    return Promise.resolve(true)
  }
  
  const readyPromise = createReadyPromise()
  
  if (!timeout) {
    return readyPromise
  }
  
  // Crear promesa con timeout
  return Promise.race([
    readyPromise,
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Progress system not ready after ${timeout}ms`))
      }, timeout)
    })
  ])
}

/**
 * Registra un callback para ser notificado cuando el sistema esté listo
 * @param {Function} callback - Función a llamar cuando esté listo
 * @returns {Function} Función para cancelar la suscripción
 */
export function onProgressSystemReady(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function')
  }
  
  // Si ya está listo, llamar inmediatamente
  if (isSystemReady) {
    try {
      callback(true)
    } catch (error) {
      logger.warn('Error en callback inmediato de sistema listo:', error)
    }
    return () => {} // No-op unsubscribe
  }
  
  // Registrar para notificación futura
  readyCallbacks.add(callback)
  
  // Devolver función de unsubscribe
  return () => {
    readyCallbacks.delete(callback)
  }
}

/**
 * Hook React para usar el sistema de eventos de progreso
 * @returns {Object} Estado y funciones del sistema de progreso
 */
export function useProgressSystemReady() {
  const [ready, setReady] = useState(isSystemReady)
  
  useEffect(() => {
    if (isSystemReady) {
      setReady(true)
      return
    }
    
    // Suscribirse a notificaciones de cambio de estado
    const unsubscribe = onProgressSystemReady((isReady) => {
      setReady(isReady)
    })
    
    return unsubscribe
  }, [])
  
  return {
    isReady: ready,
    waitForSystem: waitForProgressSystem,
    onReady: onProgressSystemReady
  }
}

/**
 * Resetea el estado del sistema (útil para tests)
 */
export function resetProgressSystemState() {
  isSystemReady = false
  readyPromise = null
  readyResolve = null
  readyCallbacks.clear()
  logger.debug('Estado del sistema de progreso reseteado')
}

// Import React hooks for the React hook
let useState, useEffect
try {
  const react = await import('react')
  useState = react.useState
  useEffect = react.useEffect
} catch (_error) {
  // En entornos no-React, proveer stubs
  useState = () => [false, () => {}]
  useEffect = () => {}
}