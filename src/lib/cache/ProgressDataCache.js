// Sistema de caché inteligente para datos de progreso
// Reduce solicitudes duplicadas y mejora el rendimiento del dashboard

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
      recommendations: 3 * 60 * 1000  // 3 min - basado en datos cached
    }
  }
  
  /**
   * Obtener datos del caché o ejecutar función de carga
   * @param {string} key - Clave única para los datos
   * @param {Function} loadFn - Función que carga los datos si no están en caché
   * @param {string} dataType - Tipo de dato para TTL específico
   * @returns {Promise} - Los datos solicitados
   */
  async get(key, loadFn, dataType = 'default') {
    // Verificar caché
    const cached = this.cache.get(key)
    if (cached && !this.isExpired(cached, dataType)) {
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
    const requestPromise = this.executeLoadFunction(key, loadFn, dataType)
    this.pendingRequests.set(key, requestPromise)
    
    try {
      const data = await requestPromise
      return data
    } finally {
      this.pendingRequests.delete(key)
    }
  }
  
  async executeLoadFunction(key, loadFn, dataType) {
    const data = await loadFn()
    
    // Cache los datos con timestamp
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      dataType
    })
    
    return data
  }
  
  isExpired(cached, dataType) {
    const ttl = this.ttlConfig[dataType] || this.defaultTTL
    return Date.now() - cached.timestamp > ttl
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
    const userPattern = new RegExp(`^${userId}:`)
    this.invalidate(userPattern)
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

// Singleton instance
const progressDataCache = new ProgressDataCache()

// Limpieza automática cada 2 minutos
setInterval(() => {
  progressDataCache.cleanup()
}, 2 * 60 * 1000)

// Invalidar caché cuando se actualiza el progreso
if (typeof window !== 'undefined') {
  window.addEventListener('progress:dataUpdated', (event) => {
    const userId = event.detail?.userId
    const updateType = event.detail?.type || 'general'
    
    if (import.meta.env?.DEV) {
      console.log('🗑️ Cache invalidation triggered:', { userId, updateType })
    }
    
    if (userId) {
      // Invalidación específica basada en tipo de actualización
      switch (updateType) {
        case 'drill_result':
        case 'practice_session':
          // Invalidar solo datos que cambian con práctica
          progressDataCache.invalidate(new RegExp(`^${userId}:(userStats|weeklyProgress|heatMap|recommendations)`))
          break
        case 'mastery_update':
          // Invalidar datos de dominio
          progressDataCache.invalidate(new RegExp(`^${userId}:(heatMap|userStats|errorIntel)`))
          break
        case 'error_logged':
          // Invalidar solo análisis de errores
          progressDataCache.invalidate(new RegExp(`^${userId}:(errorIntel|recommendations)`))
          break
        case 'settings_change':
          // Invalidar recomendaciones que dependen de configuración
          progressDataCache.invalidate(new RegExp(`^${userId}:(recommendations|heatMap)`))
          break
        default:
          // Invalidación completa para cambios generales
          progressDataCache.invalidateUser(userId)
      }
    } else {
      // Si no hay userId específico, invalidar datos frecuentemente actualizados
      progressDataCache.invalidate(/:(weeklyProgress|recommendations)$/)
    }
  })
  
  // Invalidar recomendaciones cuando cambian las configuraciones del usuario
  window.addEventListener('settings:changed', (event) => {
    const settings = event.detail
    if (settings && (settings.level || settings.region || settings.practiceMode)) {
      if (import.meta.env?.DEV) {
        console.log('⚙️ Settings changed, invalidating recommendations cache')
      }
      progressDataCache.invalidate(/:recommendations$/)
    }
  })
}

export { progressDataCache, ProgressDataCache }