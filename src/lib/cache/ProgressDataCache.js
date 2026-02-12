// Sistema de caché inteligente para datos de progreso
// Reduce solicitudes duplicadas y mejora el rendimiento del dashboard
import { onProgressEvent, PROGRESS_EVENTS } from '../events/progressEventBus.js'

class ProgressDataCache {
  constructor() {
    this.cache = new Map()
    this.pendingRequests = new Map() // Para deduplicación de requests
    this.defaultTTL = 5 * 60 * 1000 // 5 minutos
    this.stats = {
      hits: 0,
      misses: 0,
      deduped: 0
    }
    
    // Configuraciones de TTL específicas por tipo de dato
    this.ttlConfig = {
      heatMap: 3 * 60 * 1000,        // 3 min - cambia poco
      userStats: 2 * 60 * 1000,      // 2 min - actualiza moderadamente  
      weeklyGoals: 10 * 60 * 1000,   // 10 min - muy estático
      weeklyProgress: 1 * 60 * 1000, // 1 min - actualiza frecuentemente
      errorIntel: 5 * 60 * 1000,     // 5 min - análisis más pesado
      recommendations: 3 * 60 * 1000,  // 3 min - basado en datos cached
      dailyChallenges: 60 * 1000       // 1 min - métricas diarias cambian rápido
    }
  }
  
  /**
   * Obtener datos del caché o ejecutar función de carga
   * @param {string} key - Clave única para los datos
   * @param {Function} loadFn - Función que carga los datos si no están en caché
   * @param {string} dataType - Tipo de dato para TTL específico
   * @returns {Promise} - Los datos solicitados
   */
  async get(key, loadFn, dataType = 'default', options = {}) {
    const { signal, ttl, forceRefresh = false } = options || {}

    if (signal?.aborted) {
      throw new Error('Operation was cancelled')
    }

    // Verificar caché
    const cached = this.cache.get(key)
    if (!forceRefresh && cached && !this.isExpired(cached, dataType, ttl)) {
      if (signal?.aborted) {
        throw new Error('Operation was cancelled')
      }
      this.stats.hits++
      return cached.data
    }
    
    // Verificar si ya hay una request pendiente para esta clave
    if (this.pendingRequests.has(key)) {
      this.stats.deduped++
      return this.pendingRequests.get(key)
    }
    
    // Crear nueva request
    this.stats.misses++
    const requestPromise = this.executeLoadFunction(key, loadFn, dataType, signal, ttl)
    this.pendingRequests.set(key, requestPromise)

    try {
      const data = await requestPromise
      return data
    } finally {
      this.pendingRequests.delete(key)
    }
  }
  
  async executeLoadFunction(key, loadFn, dataType, signal, ttlOverride) {
    const abortError = new Error('Operation was cancelled')

    if (signal?.aborted) {
      throw abortError
    }

    const loadPromise = Promise.resolve().then(() => loadFn({ signal }))

    let abortListener = null
    const racePromise = signal
      ? new Promise((_, reject) => {
          abortListener = () => {
            reject(abortError)
          }
          signal.addEventListener('abort', abortListener, { once: true })
        })
      : null

    let data

    try {
      data = await (racePromise ? Promise.race([loadPromise, racePromise]) : loadPromise)
    } catch (error) {
      if (signal?.aborted) {
        throw abortError
      }
      throw error
    } finally {
      if (signal && abortListener) {
        signal.removeEventListener('abort', abortListener)
      }
    }

    if (signal?.aborted) {
      throw abortError
    }

    // Cache los datos con timestamp
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      dataType,
      ttl: Number.isFinite(ttlOverride) ? ttlOverride : null
    })
    
    return data
  }
  
  isExpired(cached, dataType, ttlOverride) {
    const ttl = this.resolveTTL(cached, dataType, ttlOverride)
    return Date.now() - cached.timestamp > ttl
  }

  resolveTTL(cached, dataType, ttlOverride) {
    if (Number.isFinite(ttlOverride) && ttlOverride >= 0) {
      return ttlOverride
    }

    if (cached && Number.isFinite(cached.ttl) && cached.ttl >= 0) {
      return cached.ttl
    }

    return this.ttlConfig[dataType] || this.defaultTTL
  }
  
  /**
   * Invalidar datos específicos del caché
   * @param {string|RegExp} keyPattern - Clave o patrón a invalidar
   */
  invalidate(keyPattern) {
    if (typeof keyPattern === 'string') {
      this.cache.delete(keyPattern)
    } else if (keyPattern instanceof RegExp) {
      // Invalidar todas las claves que coincidan con el patrón
      for (const key of this.cache.keys()) {
        if (keyPattern.test(key)) {
          this.cache.delete(key)
        }
      }
    }
  }
  
  /**
   * Invalidar todos los datos de un usuario específico
   * @param {string} userId - ID del usuario
   */
  invalidateUser(userId) {
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return
    }

    const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const userPattern = new RegExp(`^${escapedUserId}:`)
    this.invalidate(userPattern)
  }

  /**
   * Invalidar entradas por tipo de dato, opcionalmente limitadas a un usuario.
   * @param {string|string[]} dataTypes - Tipo(s) de datos a invalidar
   * @param {string} [userId] - Usuario opcional
   */
  invalidateByDataType(dataTypes, userId) {
    const normalizedTypes = Array.isArray(dataTypes) ? dataTypes : [dataTypes]
    const validTypes = normalizedTypes
      .filter((type) => typeof type === 'string' && type.trim().length > 0)
      .map((type) => type.trim())

    if (validTypes.length === 0) {
      return
    }

    const typeSet = new Set(validTypes)
    const hasUserFilter = typeof userId === 'string' && userId.trim().length > 0
    const normalizedUserId = hasUserFilter ? userId.trim() : null

    for (const [key, cached] of this.cache.entries()) {
      if (!typeSet.has(cached?.dataType)) {
        continue
      }

      if (hasUserFilter && !key.startsWith(`${normalizedUserId}:`)) {
        continue
      }

      this.cache.delete(key)
    }
  }
  
  /**
   * Limpieza automática de entradas expiradas
   */
  cleanup() {
    for (const [key, cached] of this.cache.entries()) {
      if (this.isExpired(cached, cached.dataType)) {
        this.cache.delete(key)
      }
    }
  }
  
  /**
   * Pre-calentar caché con datos comunes
   * @param {string} userId - ID del usuario
   * @param {Object} loaders - Objeto con funciones de carga
   */
  async warmup(userId, loaders) {
    const warmupPromises = []
    
    // Pre-cargar datos más comunes en paralelo
    if (loaders.userStats) {
      warmupPromises.push(
        this.get(`${userId}:userStats`, loaders.userStats, 'userStats')
      )
    }
    
    if (loaders.weeklyGoals) {
      warmupPromises.push(
        this.get(`${userId}:weeklyGoals`, loaders.weeklyGoals, 'weeklyGoals')
      )
    }
    
    // Ejecutar en paralelo sin esperar
    Promise.allSettled(warmupPromises).catch(error => {
      console.warn('Cache warmup partial failure:', error)
    })
  }
  
  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(1) + '%' : '0%',
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size
    }
  }
  
  /**
   * Configurar TTL para un tipo de dato específico
   * @param {string} dataType - Tipo de dato
   * @param {number} ttl - TTL en milisegundos
   */
  setTTL(dataType, ttl) {
    this.ttlConfig[dataType] = ttl
  }
  
  /**
   * Limpiar todo el caché
   */
  clear() {
    this.cache.clear()
    this.pendingRequests.clear()
    this.stats.hits = 0
    this.stats.misses = 0
    this.stats.deduped = 0
  }
}

const CORE_CACHE_TYPES = ['heatMap', 'userStats', 'weeklyGoals', 'weeklyProgress', 'recommendations', 'dailyChallenges', 'pronunciationStats']

const EVENT_TYPE_TO_CACHE_TYPES = {
  challenge_completed: ['dailyChallenges', 'weeklyGoals', 'weeklyProgress', 'userStats'],
  drill_result: CORE_CACHE_TYPES,
  practice_session: CORE_CACHE_TYPES,
  mastery_update: ['heatMap', 'userStats', 'recommendations'],
  error_logged: ['errorIntel', 'recommendations'],
  settings_change: ['recommendations', 'heatMap']
}

const resolveProgressUpdateKeys = (detail = {}) => {
  if (!detail || detail.forceFullRefresh || detail.fullRefresh) {
    return null
  }

  const { type, attemptId, challengeId, mood, tense, person } = detail

  if (type === 'sync') {
    return null
  }

  if (type && EVENT_TYPE_TO_CACHE_TYPES[type]) {
    return EVENT_TYPE_TO_CACHE_TYPES[type]
  }

  if (attemptId || mood || tense || person) {
    return CORE_CACHE_TYPES
  }

  if (challengeId) {
    return ['dailyChallenges']
  }

  return null
}

// Singleton instance
const progressDataCache = new ProgressDataCache()

// Limpieza automática cada 2 minutos (solo en browser)
if (typeof window !== 'undefined') {
  if (window.__CONJU_PROGRESS_CACHE_CLEANUP__) {
    clearInterval(window.__CONJU_PROGRESS_CACHE_CLEANUP__)
  }

  window.__CONJU_PROGRESS_CACHE_CLEANUP__ = setInterval(() => {
    progressDataCache.cleanup()
  }, 2 * 60 * 1000)
}

// Invalidar caché cuando se actualiza el progreso
if (typeof window !== 'undefined' && !window.__CONJU_PROGRESS_CACHE_EVENTS__) {
  window.__CONJU_PROGRESS_CACHE_EVENTS__ = true

  onProgressEvent(PROGRESS_EVENTS.DATA_UPDATED, (detail = {}) => {
    const userId = detail.userId
    const updateType = detail.type || 'general'
    const cacheKeys = resolveProgressUpdateKeys(detail)
    
    if (import.meta.env?.DEV) {
      console.log('🗑️ Cache invalidation triggered:', { userId, updateType })
    }
    
    if (userId) {
      if (Array.isArray(cacheKeys) && cacheKeys.length > 0) {
        progressDataCache.invalidateByDataType(cacheKeys, userId)
      } else {
        // Invalidación completa para cambios generales
        progressDataCache.invalidateUser(userId)
      }
    } else {
      if (Array.isArray(cacheKeys) && cacheKeys.length > 0) {
        progressDataCache.invalidateByDataType(cacheKeys)
      } else {
        // Si no hay userId específico, invalidar datos frecuentemente actualizados
        progressDataCache.invalidate(/:(weeklyProgress|recommendations)$/)
      }
    }
  }, { validate: true })
  
  // Invalidar recomendaciones cuando cambian las configuraciones del usuario
  window.addEventListener('settings:changed', (event) => {
    const settings = event.detail
    if (settings && (settings.level || settings.region || settings.practiceMode)) {
      if (import.meta.env?.DEV) {
        console.log('⚙️ Settings changed, invalidating recommendations cache')
      }
      progressDataCache.invalidateByDataType(['recommendations', 'heatMap'])
    }
  })

  onProgressEvent(PROGRESS_EVENTS.CHALLENGE_COMPLETED, (detail = {}) => {
    const userId = detail.userId
    if (import.meta.env?.DEV) {
      console.log('🏅 Desafío diario completado, invalidando caché correspondiente', detail)
    }
    if (userId) {
      progressDataCache.invalidateByDataType('dailyChallenges', userId)
    } else {
      progressDataCache.invalidateByDataType('dailyChallenges')
    }
  }, { validate: true })
}

export { progressDataCache, ProgressDataCache, resolveProgressUpdateKeys, CORE_CACHE_TYPES }
