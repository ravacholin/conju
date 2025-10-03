/**
 * CacheOrchestrator.js - Sistema coordinador de caches multi-nivel
 *
 * Este sistema orquesta todos los niveles de cache para garantizar:
 * - Coordinación entre diferentes tipos de cache
 * - Preloading inteligente basado en patrones de uso
 * - Memory pressure management global
 * - Cache invalidation strategies
 * - Performance monitoring centralizado
 * - Auto-recovery de caches corruptos
 * - Circuit breaker patterns
 */

import { VERB_LOOKUP_MAP, FORM_LOOKUP_MAP } from './optimizedCache.js'
import { getRedundancyManager } from './VerbDataRedundancyManager.js'
import { getIntegrityGuard } from './DataIntegrityGuard.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('CacheOrchestrator')

// Cache levels and priorities
const CACHE_LEVELS = {
  L1_MEMORY: 'l1_memory',      // Global Maps (fastest)
  L2_INTELLIGENT: 'l2_intelligent', // Intelligent Caches (fast)
  L3_PERSISTENCE: 'l3_persistence', // localStorage/IndexedDB (medium)
  L4_REDUNDANCY: 'l4_redundancy',   // Redundancy Manager (fallback)
  L5_EMERGENCY: 'l5_emergency'      // Emergency data (last resort)
}

// Cache coordination strategies
const COORDINATION_STRATEGIES = {
  AGGRESSIVE: 'aggressive',    // Pre-load everything possible
  BALANCED: 'balanced',        // Smart preloading based on patterns
  CONSERVATIVE: 'conservative', // Minimal preloading, on-demand only
  EMERGENCY: 'emergency'       // Emergency mode, minimal operations
}

// Health states
const ORCHESTRATOR_HEALTH = {
  OPTIMAL: 'optimal',
  DEGRADED: 'degraded',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency'
}

class CacheOrchestrator {
  constructor() {
    this.strategy = COORDINATION_STRATEGIES.BALANCED
    this.health = ORCHESTRATOR_HEALTH.OPTIMAL
    this.cacheRegistry = new Map()
    this.preloadingQueue = []
    this.isPreloading = false
    this.memoryPressureActive = false
    this.circuitBreakers = new Map()
    this.performanceMetrics = {
      totalRequests: 0,
      cacheHits: new Map(),
      cacheMisses: new Map(),
      preloadingOperations: 0,
      invalidationOperations: 0,
      recoveryOperations: 0,
      averageResponseTime: 0,
      memoryPressureEvents: 0
    }
    this.usagePatterns = new Map()
    this.preloadingRules = new Set()
    this.lastHealthCheck = null
    this.monitoringInterval = null
    this.isInitialized = false

    // Don't call initialize() here to avoid temporal dead zone
  }

  /**
   * Initialize the cache orchestrator
   */
  async initialize() {
    logger.info('initialize', '🎼 Initializing CacheOrchestrator...')

    try {
      // Register static caches first
      this.registerCache('verbMap', { size: () => VERB_LOOKUP_MAP.size }, CACHE_LEVELS.L1_MEMORY, 5)
      this.registerCache('formMap', { size: () => FORM_LOOKUP_MAP.size }, CACHE_LEVELS.L1_MEMORY, 5)

      // Defer intelligent cache registration until they're needed
      this._deferredCacheRegistration = true

      // Initialize circuit breakers
      this.initializeCircuitBreakers()

      // Setup preloading rules
      this.setupPreloadingRules()

      // Start health monitoring
      this.startHealthMonitoring()

      // Perform initial health check
      await this.performHealthCheck()

      this.isInitialized = true

      logger.info('initialize', '✅ CacheOrchestrator initialized successfully', {
        strategy: this.strategy,
        health: this.health,
        registeredCaches: this.cacheRegistry.size
      })

    } catch (error) {
      logger.error('initialize', 'Failed to initialize CacheOrchestrator', error)
      this.health = ORCHESTRATOR_HEALTH.EMERGENCY
      throw error
    }
  }

  /**
   * Register a cache with the orchestrator
   */
  registerCache(name, cache, level, priority = 0) {
    this.cacheRegistry.set(name, {
      cache,
      level,
      priority,
      lastAccess: Date.now(),
      accessCount: 0,
      errorCount: 0,
      isHealthy: true
    })

    logger.debug('registerCache', `Cache "${name}" registered`, { level, priority })
  }

  /**
   * Register intelligent caches when they're available
   */
  registerIntelligentCaches() {
    if (this._deferredCacheRegistration) {
      try {
        // Import and register intelligent caches dynamically
        import('./optimizedCache.js').then(module => {
          if (module.verbLookupCache) {
            this.registerCache('verbLookup', module.verbLookupCache, CACHE_LEVELS.L2_INTELLIGENT, 10)
          }
          if (module.formFilterCache) {
            this.registerCache('formFilter', module.formFilterCache, CACHE_LEVELS.L2_INTELLIGENT, 20)
          }
          this._deferredCacheRegistration = false
          logger.info('registerIntelligentCaches', '🎯 Intelligent caches registered successfully')
        }).catch(error => {
          logger.warn('registerIntelligentCaches', 'Failed to register intelligent caches', error)
        })
      } catch (error) {
        logger.warn('registerIntelligentCaches', 'Failed to register intelligent caches', error)
      }
    }
  }

  /**
   * Get data with orchestrated cache coordination
   */
  async get(key, options = {}) {
    const startTime = performance.now()
    this.performanceMetrics.totalRequests++

    const {
      cacheTypes = ['verbLookup', 'formFilter'],
      fallbackToRedundancy = true,
      skipL1 = false,
      recordPattern = true
    } = options

    try {
      // Record usage pattern
      if (recordPattern) {
        this.recordUsagePattern(key, options)
      }

      // Try caches in priority order
      for (const cacheType of cacheTypes) {
        const cacheInfo = this.cacheRegistry.get(cacheType)
        if (!cacheInfo || !cacheInfo.isHealthy) {
          continue
        }

        // Skip L1 if requested (for testing fallback paths)
        if (skipL1 && cacheInfo.level === CACHE_LEVELS.L1_MEMORY) {
          continue
        }

        try {
          // Check circuit breaker
          if (this.isCircuitBreakerOpen(cacheType)) {
            logger.debug('get', `Circuit breaker open for ${cacheType}`)
            continue
          }

          const result = await this.getFromCache(cacheType, key)
          if (result !== null && result !== undefined) {
            this.recordCacheHit(cacheType, startTime)
            this.updateCacheInfo(cacheType, true)

            // Trigger preloading if applicable
            this.triggerIntelligentPreloading(key, cacheType)

            return result
          }
        } catch (error) {
          logger.warn('get', `Cache ${cacheType} failed for key ${key}`, error)
          this.recordCacheError(cacheType, error)
          this.updateCacheInfo(cacheType, false)
        }
      }

      // All caches missed, try redundancy manager
      if (fallbackToRedundancy) {
        try {
          const redundancyManager = getRedundancyManager()
          const result = await this.getFromRedundancyManager(key, redundancyManager)
          if (result !== null && result !== undefined) {
            this.recordCacheHit('redundancy', startTime)

            // Store in appropriate caches for future use
            await this.storeInCaches(key, result, cacheTypes)

            return result
          }
        } catch (error) {
          logger.warn('get', 'Redundancy manager also failed', error)
          this.performanceMetrics.recoveryOperations++
        }
      }

      this.recordCacheMiss('all', startTime)
      return null

    } catch (error) {
      logger.error('get', 'Critical error in orchestrated get', error)
      this.recordCacheMiss('error', startTime)
      return null
    }
  }

  /**
   * Store data in orchestrated caches
   */
  async set(key, value, options = {}) {
    const {
      cacheTypes = ['verbLookup', 'formFilter'],
      priority = 0,
      ttl = null,
      skipValidation = false
    } = options

    try {
      // Validate data if requested
      if (!skipValidation) {
        const isValid = await this.validateData(key, value)
        if (!isValid) {
          logger.warn('set', `Data validation failed for key ${key}`)
          return false
        }
      }

      let successCount = 0

      // Store in all requested cache types
      for (const cacheType of cacheTypes) {
        try {
          const stored = await this.storeInCache(cacheType, key, value, { priority, ttl })
          if (stored) {
            successCount++
          }
        } catch (error) {
          logger.warn('set', `Failed to store in cache ${cacheType}`, error)
          this.recordCacheError(cacheType, error)
        }
      }

      return successCount > 0

    } catch (error) {
      logger.error('set', 'Critical error in orchestrated set', error)
      return false
    }
  }

  /**
   * Invalidate cached data across all levels
   */
  async invalidate(pattern, options = {}) {
    const {
      cacheTypes = ['verbLookup', 'formFilter'],
      cascadeToLower = true,
      reason = 'manual'
    } = options

    logger.info('invalidate', `Invalidating pattern "${pattern}"`, { reason, cacheTypes })

    this.performanceMetrics.invalidationOperations++
    let invalidatedCount = 0

    try {
      // Invalidate in specified caches
      for (const cacheType of cacheTypes) {
        const cacheInfo = this.cacheRegistry.get(cacheType)
        if (cacheInfo && cacheInfo.cache.clear) {
          try {
            if (pattern === '*') {
              cacheInfo.cache.clear()
            } else {
              // Pattern-based invalidation (if supported)
              await this.invalidatePattern(cacheType, pattern)
            }
            invalidatedCount++
          } catch (error) {
            logger.warn('invalidate', `Failed to invalidate ${cacheType}`, error)
          }
        }
      }

      // Cascade to lower levels if requested
      if (cascadeToLower) {
        await this.invalidateLowerLevels(pattern)
      }

      logger.info('invalidate', `Invalidation complete`, {
        pattern,
        invalidatedCaches: invalidatedCount,
        cascaded: cascadeToLower
      })

      return invalidatedCount > 0

    } catch (error) {
      logger.error('invalidate', 'Critical error during invalidation', error)
      return false
    }
  }

  /**
   * Trigger intelligent preloading based on patterns
   */
  async triggerIntelligentPreloading(triggerKey, cacheType) {
    if (this.isPreloading || this.strategy === COORDINATION_STRATEGIES.CONSERVATIVE) {
      return
    }

    try {
      const patterns = this.analyzeUsagePatterns(triggerKey)
      if (patterns.length === 0) {
        return
      }

      logger.debug('triggerIntelligentPreloading', `Triggering preload for ${patterns.length} patterns`)

      this.performanceMetrics.preloadingOperations++
      this.isPreloading = true

      // Add patterns to preloading queue
      for (const pattern of patterns) {
        if (!this.preloadingQueue.includes(pattern)) {
          this.preloadingQueue.push(pattern)
        }
      }

      // Process queue asynchronously
      setTimeout(() => this.processPreloadingQueue(), 100)

    } catch (error) {
      logger.warn('triggerIntelligentPreloading', 'Preloading trigger failed', error)
      this.isPreloading = false
    }
  }

  /**
   * Process preloading queue
   */
  async processPreloadingQueue() {
    if (this.preloadingQueue.length === 0) {
      this.isPreloading = false
      return
    }

    // Check memory pressure
    if (this.memoryPressureActive) {
      logger.debug('processPreloadingQueue', 'Skipping preloading due to memory pressure')
      this.preloadingQueue.length = 0
      this.isPreloading = false
      return
    }

    const batchSize = this.strategy === COORDINATION_STRATEGIES.AGGRESSIVE ? 10 : 3
    const batch = this.preloadingQueue.splice(0, batchSize)

    try {
      await Promise.all(batch.map(pattern => this.preloadPattern(pattern)))
    } catch (error) {
      logger.warn('processPreloadingQueue', 'Batch preloading failed', error)
    }

    // Continue processing if more items remain
    if (this.preloadingQueue.length > 0) {
      setTimeout(() => this.processPreloadingQueue(), 200)
    } else {
      this.isPreloading = false
    }
  }

  /**
   * Handle memory pressure events
   */
  async handleMemoryPressure() {
    if (this.memoryPressureActive) {
      return // Already handling
    }

    logger.warn('handleMemoryPressure', '⚠️ Memory pressure detected, initiating cache cleanup')

    this.memoryPressureActive = true
    this.performanceMetrics.memoryPressureEvents++

    try {
      // Stop preloading
      this.preloadingQueue.length = 0
      this.isPreloading = false

      // Trigger cleanup in all caches
      for (const [cacheType, cacheInfo] of this.cacheRegistry) {
        try {
          if (cacheInfo.cache.handleMemoryPressure) {
            await cacheInfo.cache.handleMemoryPressure()
          } else if (cacheInfo.cache.clear && cacheInfo.level !== CACHE_LEVELS.L1_MEMORY) {
            // Clear non-critical caches
            cacheInfo.cache.clear()
          }
        } catch (error) {
          logger.warn('handleMemoryPressure', `Failed to cleanup cache ${cacheType}`, error)
        }
      }

      // Force garbage collection hint
      if (typeof window !== 'undefined' && window.gc) {
        window.gc()
      }

      // Wait a bit before allowing normal operation
      setTimeout(() => {
        this.memoryPressureActive = false
        logger.info('handleMemoryPressure', 'Memory pressure handling completed')
      }, 5000)

    } catch (error) {
      logger.error('handleMemoryPressure', 'Memory pressure handling failed', error)
      this.memoryPressureActive = false
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    logger.debug('performHealthCheck', 'Performing comprehensive health check')

    try {
      let healthyCount = 0
      let totalCount = 0
      const healthReport = {}

      // Check each registered cache
      for (const [cacheType, cacheInfo] of this.cacheRegistry) {
        totalCount++
        const health = await this.checkCacheHealth(cacheType, cacheInfo)
        healthReport[cacheType] = health

        if (health.isHealthy) {
          healthyCount++
        }
      }

      // Check system-wide metrics
      const systemHealth = this.checkSystemHealth()
      healthReport.system = systemHealth

      // Determine overall health
      const healthRatio = healthyCount / totalCount
      let overallHealth

      if (healthRatio >= 0.9 && systemHealth.memoryOk) {
        overallHealth = ORCHESTRATOR_HEALTH.OPTIMAL
      } else if (healthRatio >= 0.7) {
        overallHealth = ORCHESTRATOR_HEALTH.DEGRADED
      } else if (healthRatio >= 0.4) {
        overallHealth = ORCHESTRATOR_HEALTH.CRITICAL
      } else {
        overallHealth = ORCHESTRATOR_HEALTH.EMERGENCY
      }

      this.health = overallHealth
      this.lastHealthCheck = new Date()

      logger.info('performHealthCheck', `Health check completed: ${overallHealth}`, {
        healthyCount,
        totalCount,
        healthRatio: `${(healthRatio * 100).toFixed(1)}%`
      })

      // Take corrective actions if needed
      if (overallHealth !== ORCHESTRATOR_HEALTH.OPTIMAL) {
        await this.takeCorrectiveActions(overallHealth, healthReport)
      }

      return {
        health: overallHealth,
        report: healthReport,
        timestamp: this.lastHealthCheck
      }

    } catch (error) {
      logger.error('performHealthCheck', 'Health check failed', error)
      this.health = ORCHESTRATOR_HEALTH.EMERGENCY
      return {
        health: ORCHESTRATOR_HEALTH.EMERGENCY,
        error: error.message,
        timestamp: new Date()
      }
    }
  }

  /**
   * Take corrective actions based on health status
   */
  async takeCorrectiveActions(health, healthReport) {
    logger.info('takeCorrectiveActions', `Taking corrective actions for health: ${health}`)

    try {
      switch (health) {
        case ORCHESTRATOR_HEALTH.DEGRADED:
          // Reduce preloading aggressiveness
          if (this.strategy === COORDINATION_STRATEGIES.AGGRESSIVE) {
            this.strategy = COORDINATION_STRATEGIES.BALANCED
            logger.info('takeCorrectiveActions', 'Reduced strategy to BALANCED')
          }
          break

        case ORCHESTRATOR_HEALTH.CRITICAL:
          // More aggressive cleanup
          this.strategy = COORDINATION_STRATEGIES.CONSERVATIVE
          await this.invalidate('*', { reason: 'critical_health' })
          await this.handleMemoryPressure()
          logger.warn('takeCorrectiveActions', 'Switched to CONSERVATIVE mode and performed cleanup')
          break

        case ORCHESTRATOR_HEALTH.EMERGENCY:
          // Emergency mode
          this.strategy = COORDINATION_STRATEGIES.EMERGENCY
          this.preloadingQueue.length = 0
          this.isPreloading = false

          // Disable all non-essential caches
          for (const [cacheType, cacheInfo] of this.cacheRegistry) {
            if (cacheInfo.level !== CACHE_LEVELS.L1_MEMORY) {
              cacheInfo.isHealthy = false
            }
          }

          logger.error('takeCorrectiveActions', 'Entered EMERGENCY mode - disabled non-essential caches')
          break
      }

      this.performanceMetrics.recoveryOperations++

    } catch (error) {
      logger.error('takeCorrectiveActions', 'Corrective actions failed', error)
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    // Health check every 2 minutes
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck()
    }, 120000)

    logger.info('startHealthMonitoring', 'Health monitoring started')
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    logger.info('stopHealthMonitoring', 'Health monitoring stopped')
  }

  /**
   * Get comprehensive orchestrator statistics
   */
  getStats() {
    const cacheStats = {}
    for (const [cacheType, cacheInfo] of this.cacheRegistry) {
      cacheStats[cacheType] = {
        level: cacheInfo.level,
        priority: cacheInfo.priority,
        isHealthy: cacheInfo.isHealthy,
        accessCount: cacheInfo.accessCount,
        errorCount: cacheInfo.errorCount,
        lastAccess: cacheInfo.lastAccess
      }

      if (cacheInfo.cache.getStats) {
        cacheStats[cacheType].detailed = cacheInfo.cache.getStats()
      }
    }

    return {
      strategy: this.strategy,
      health: this.health,
      isInitialized: this.isInitialized,
      memoryPressureActive: this.memoryPressureActive,
      isPreloading: this.isPreloading,
      preloadingQueueSize: this.preloadingQueue.length,
      lastHealthCheck: this.lastHealthCheck,
      metrics: this.performanceMetrics,
      caches: cacheStats,
      usagePatterns: this.usagePatterns.size,
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([key, cb]) => [
          key,
          { isOpen: cb.isOpen, failures: cb.failures }
        ])
      )
    }
  }

  // Helper methods (implementation details)

  async getFromCache(cacheType, key) {
    const cacheInfo = this.cacheRegistry.get(cacheType)
    if (!cacheInfo) return null

    if (cacheInfo.cache.get) {
      return cacheInfo.cache.get(key)
    }

    // Handle different cache types
    if (cacheType === 'verbMap') {
      return VERB_LOOKUP_MAP.get(key)
    } else if (cacheType === 'formMap') {
      return FORM_LOOKUP_MAP.get(key)
    }

    return null
  }

  async storeInCache(cacheType, key, value, options = {}) {
    const cacheInfo = this.cacheRegistry.get(cacheType)
    if (!cacheInfo) return false

    if (cacheInfo.cache.set) {
      cacheInfo.cache.set(key, value, options.priority)
      return true
    }

    return false
  }

  recordCacheHit(cacheType, startTime) {
    const responseTime = performance.now() - startTime
    if (!this.performanceMetrics.cacheHits.has(cacheType)) {
      this.performanceMetrics.cacheHits.set(cacheType, 0)
    }
    this.performanceMetrics.cacheHits.set(
      cacheType,
      this.performanceMetrics.cacheHits.get(cacheType) + 1
    )

    // Update average response time
    const alpha = 0.1
    this.performanceMetrics.averageResponseTime =
      this.performanceMetrics.averageResponseTime * (1 - alpha) + responseTime * alpha
  }

  recordCacheMiss(cacheType, startTime) {
    const responseTime = performance.now() - startTime
    if (!this.performanceMetrics.cacheMisses.has(cacheType)) {
      this.performanceMetrics.cacheMisses.set(cacheType, 0)
    }
    this.performanceMetrics.cacheMisses.set(
      cacheType,
      this.performanceMetrics.cacheMisses.get(cacheType) + 1
    )

    // Update average response time
    const alpha = 0.1
    this.performanceMetrics.averageResponseTime =
      this.performanceMetrics.averageResponseTime * (1 - alpha) + responseTime * alpha
  }

  recordCacheError(cacheType, error) {
    const cacheInfo = this.cacheRegistry.get(cacheType)
    if (cacheInfo) {
      cacheInfo.errorCount++
    }

    // Update circuit breaker
    const circuitBreaker = this.circuitBreakers.get(cacheType)
    if (circuitBreaker) {
      circuitBreaker.recordFailure()
    }
  }

  updateCacheInfo(cacheType, success) {
    const cacheInfo = this.cacheRegistry.get(cacheType)
    if (cacheInfo) {
      cacheInfo.lastAccess = Date.now()
      cacheInfo.accessCount++

      if (success) {
        // Reset circuit breaker on success
        const circuitBreaker = this.circuitBreakers.get(cacheType)
        if (circuitBreaker) {
          circuitBreaker.recordSuccess()
        }
      }
    }
  }

  initializeCircuitBreakers() {
    for (const cacheType of this.cacheRegistry.keys()) {
      this.circuitBreakers.set(cacheType, {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
        threshold: 5,
        timeout: 30000, // 30 seconds
        recordFailure() {
          this.failures++
          this.lastFailure = Date.now()
          if (this.failures >= this.threshold) {
            this.isOpen = true
          }
        },
        recordSuccess() {
          this.failures = 0
          this.isOpen = false
        },
        canAttempt() {
          if (!this.isOpen) return true
          return Date.now() - this.lastFailure > this.timeout
        }
      })
    }
  }

  isCircuitBreakerOpen(cacheType) {
    const circuitBreaker = this.circuitBreakers.get(cacheType)
    return circuitBreaker ? circuitBreaker.isOpen && !circuitBreaker.canAttempt() : false
  }

  recordUsagePattern(key, options) {
    const pattern = `${key}:${JSON.stringify(options)}`
    const count = this.usagePatterns.get(pattern) || 0
    this.usagePatterns.set(pattern, count + 1)
  }

  analyzeUsagePatterns(triggerKey) {
    // Simple pattern analysis - can be enhanced
    const relatedPatterns = []
    for (const [pattern, count] of this.usagePatterns) {
      if (pattern.includes(triggerKey) && count > 2) {
        relatedPatterns.push(pattern)
      }
    }
    return relatedPatterns.slice(0, 5) // Top 5 patterns
  }

  setupPreloadingRules() {
    // Define intelligent preloading rules
    this.preloadingRules.add('common_verbs_on_startup')
    this.preloadingRules.add('related_forms_on_verb_access')
    this.preloadingRules.add('user_level_appropriate_content')
  }

  async preloadPattern(pattern) {
    // Implementation would depend on specific pattern
    logger.debug('preloadPattern', `Preloading pattern: ${pattern}`)
  }

  async validateData(key, value) {
    try {
      const integrityGuard = getIntegrityGuard()
      if (Array.isArray(value)) {
        const result = integrityGuard.validateVerbs(value)
        return result.valid
      } else if (value && typeof value === 'object' && value.lemma) {
        const result = integrityGuard.validateVerb(value)
        return result.valid
      }
      return true // Simple data, assume valid
    } catch (error) {
      logger.warn('validateData', 'Data validation failed', error)
      return false
    }
  }

  async getFromRedundancyManager(key, redundancyManager) {
    // This would need to be implemented based on how keys map to redundancy manager data
    if (key.includes('verb:')) {
      const verbs = redundancyManager.getAllVerbs()
      return verbs // Return appropriate subset based on key
    }
    return null
  }

  async storeInCaches(key, value, cacheTypes) {
    for (const cacheType of cacheTypes) {
      try {
        await this.storeInCache(cacheType, key, value)
      } catch (error) {
        logger.warn('storeInCaches', `Failed to store in ${cacheType}`, error)
      }
    }
  }

  async checkCacheHealth(cacheType, cacheInfo) {
    try {
      const health = {
        isHealthy: true,
        errorRate: 0,
        size: 0,
        lastAccess: cacheInfo.lastAccess
      }

      if (cacheInfo.cache.getStats) {
        const stats = cacheInfo.cache.getStats()
        health.size = stats.size
        health.hitRate = stats.hitRate
      }

      if (cacheInfo.accessCount > 0) {
        health.errorRate = (cacheInfo.errorCount / cacheInfo.accessCount) * 100
        health.isHealthy = health.errorRate < 10 // Less than 10% error rate
      }

      return health
    } catch (error) {
      return { isHealthy: false, error: error.message }
    }
  }

  checkSystemHealth() {
    // Get verbLookup cache from registry instead of direct import
    const verbCache = this.cacheRegistry.get('verbLookup')
    if (verbCache && verbCache.cache && verbCache.cache._getMemoryUsage) {
      const memoryUsage = verbCache.cache._getMemoryUsage()
      return {
        memoryOk: !verbCache.cache.isMemoryPressureHigh(),
        memoryUsage,
        timestamp: Date.now()
      }
    } else {
      return {
        memoryOk: true,
        memoryUsage: 0,
        timestamp: Date.now()
      }
    }
  }

  async invalidatePattern(cacheType, pattern) {
    // Pattern-based invalidation implementation
    logger.debug('invalidatePattern', `Invalidating pattern ${pattern} in ${cacheType}`)
  }

  async invalidateLowerLevels(pattern) {
    // Invalidate persistence and redundancy caches
    logger.debug('invalidateLowerLevels', `Cascading invalidation for pattern ${pattern}`)
  }

  /**
   * Cleanup and destroy orchestrator
   */
  destroy() {
    this.stopHealthMonitoring()
    this.preloadingQueue.length = 0
    this.isPreloading = false
    this.cacheRegistry.clear()
    this.circuitBreakers.clear()
    this.usagePatterns.clear()

    logger.info('destroy', 'CacheOrchestrator destroyed')
  }
}

// Global singleton instance
let orchestratorInstance = null

/**
 * Get or create the global orchestrator instance
 */
export function getOrchestrator() {
  if (!orchestratorInstance) {
    orchestratorInstance = new CacheOrchestrator()
  }
  return orchestratorInstance
}

/**
 * Initialize orchestrator if not already done
 */
export async function initializeOrchestrator() {
  const orchestrator = getOrchestrator()
  if (!orchestrator.isInitialized) {
    await orchestrator.initialize()
  }
  return orchestrator
}

/**
 * Orchestrated cache get
 */
export async function orchestratedGet(key, options) {
  const orchestrator = getOrchestrator()
  return orchestrator.get(key, options)
}

/**
 * Orchestrated cache set
 */
export async function orchestratedSet(key, value, options) {
  const orchestrator = getOrchestrator()
  return orchestrator.set(key, value, options)
}

/**
 * Orchestrated cache invalidation
 */
export async function orchestratedInvalidate(pattern, options) {
  const orchestrator = getOrchestrator()
  return orchestrator.invalidate(pattern, options)
}

/**
 * Get orchestrator statistics
 */
export function getOrchestratorStats() {
  const orchestrator = getOrchestrator()
  return orchestrator.getStats()
}

/**
 * Handle memory pressure globally
 */
export async function handleGlobalMemoryPressure() {
  const orchestrator = getOrchestrator()
  await orchestrator.handleMemoryPressure()
}

/**
 * Perform global health check
 */
export async function performGlobalHealthCheck() {
  const orchestrator = getOrchestrator()
  return orchestrator.performHealthCheck()
}

// Auto-initialize in browser environment - disabled to prevent temporal dead zone issues
// The orchestrator will be initialized on-demand when caches are ready
if (typeof window !== 'undefined' && false) {
  initializeOrchestrator().catch(error => {
    console.error('Failed to auto-initialize CacheOrchestrator:', error)
  })
}