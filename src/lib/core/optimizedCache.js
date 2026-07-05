// Enhanced optimized cache with persistence and memory management
// Provides global maps, intelligent caching, and comprehensive failsafe mechanisms

import { getAllVerbs, getVerbByLemma, getVerbsByLemmas } from './verbDataService.js'
import { getAllVerbsWithRedundancy } from './VerbDataRedundancyManager.js'
import { validateAndHealVerbs } from './DataIntegrityGuard.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('OptimizedCache')

// Global Maps for fast lookups
export const VERB_LOOKUP_MAP = new Map()
export const FORM_LOOKUP_MAP = new Map()

// In-memory intelligent cache with TTL, LRU/LFU eviction and mastery-aware stats.
class IntelligentCache {
  constructor(maxSize = 1000, ttl = 5 * 60 * 1000, masteryAware = false) {
    this.cache = new Map()
    this.accessTimes = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
    this.hits = 0
    this.misses = 0
    this.masteryAware = masteryAware
    this.masteryScores = new Map()
    this.totalMasteryScore = 0
    this.predictions = 0
    this.memoryPressureThreshold = 0.8
    this.evictionStrategy = 'lru' // 'lru', 'lfu', 'mixed'
    this.accessFrequency = new Map()
  }

  get(key) {
    const entry = this.cache.get(key)
    if (!entry) {
      this.misses++
      return null
    }

    // Check expiration
    const now = Date.now()
    if (now - entry.timestamp > this.ttl) {
      this.delete(key)
      this.misses++
      return null
    }

    // Cache hit - update access time and frequency
    this.hits++
    this.accessTimes.set(key, now)
    this.accessFrequency.set(key, (this.accessFrequency.get(key) || 0) + 1)

    // Check for memory pressure
    if (this.isMemoryPressureHigh()) {
      this.handleMemoryPressure()
    }

    return entry.value
  }

  set(key, value, masteryScore) {
    // Clean cache if full
    if (this.cache.size >= this.maxSize) {
      this._evictByStrategy()
    }

    const timestamp = Date.now()

    this.cache.set(key, {
      value,
      timestamp,
      size: this._estimateSize(value)
    })

    this.accessTimes.set(key, timestamp)
    this.accessFrequency.set(key, (this.accessFrequency.get(key) || 0) + 1)

    if (this.masteryAware) {
      const score = Number.isFinite(masteryScore) ? masteryScore : 0
      if (this.masteryScores.has(key)) {
        this.totalMasteryScore -= this.masteryScores.get(key)
      }
      this.masteryScores.set(key, score)
      this.totalMasteryScore += score
    }
  }

  delete(key) {
    if (this.masteryAware && this.masteryScores.has(key)) {
      this.totalMasteryScore -= this.masteryScores.get(key)
      this.masteryScores.delete(key)
    }
    this.cache.delete(key)
    this.accessTimes.delete(key)
    this.accessFrequency.delete(key)
  }

  _evictByStrategy(evictCount = Math.max(1, Math.floor(this.maxSize * 0.1))) {
    // Default: evict 10% when full. Callers (e.g. memory-pressure handling) may
    // request a larger batch by passing an explicit count.
    evictCount = Math.max(1, Math.floor(evictCount))

    if (this.evictionStrategy === 'lru') {
      this._evictLRU(evictCount)
    } else if (this.evictionStrategy === 'lfu') {
      this._evictLFU(evictCount)
    } else {
      this._evictMixed(evictCount)
    }
  }

  _evictLRU(count) {
    const entries = Array.from(this.accessTimes.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, count)

    for (const [key] of entries) {
      this.delete(key)
    }
  }

  _evictLFU(count) {
    const entries = Array.from(this.accessFrequency.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, count)

    for (const [key] of entries) {
      this.delete(key)
    }
  }

  _evictMixed(count) {
    // Hybrid approach: evict based on score combining recency and frequency
    const now = Date.now()
    const entries = Array.from(this.cache.keys()).map(key => {
      const lastAccess = this.accessTimes.get(key) || 0
      const frequency = this.accessFrequency.get(key) || 0
      const recency = now - lastAccess
      const score = recency / (frequency + 1) // Higher score = more likely to evict
      return { key, score }
    })

    entries.sort((a, b) => b.score - a.score)

    for (let i = 0; i < count && i < entries.length; i++) {
      this.delete(entries[i].key)
    }
  }

  clear() {
    this.cache.clear()
    this.accessTimes.clear()
    this.accessFrequency.clear()
    if (this.masteryAware) {
      this.masteryScores.clear()
      this.totalMasteryScore = 0
    }
    this.predictions = 0
  }

  getStats() {
    const hitRate = this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses) * 100).toFixed(1) : '0'
    const avgMastery = this.masteryAware && this.masteryScores.size > 0
      ? (this.totalMasteryScore / this.masteryScores.size).toFixed(1)
      : '0'

    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + (entry.size || 0), 0)
    const memoryUsage = this._getMemoryUsage()

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      ttl: this.ttl,
      masteryAware: this.masteryAware,
      avgMastery: `${avgMastery}%`,
      predictions: this.predictions,
      totalDataSize: totalSize,
      memoryUsage: memoryUsage,
      evictionStrategy: this.evictionStrategy
    }
  }

  // Memory management methods
  isMemoryPressureHigh() {
    if (typeof performance === 'undefined' || !performance.memory) {
      // Fallback: check cache size ratio
      return this.cache.size / this.maxSize > this.memoryPressureThreshold
    }

    const used = performance.memory.usedJSHeapSize
    const limit = performance.memory.jsHeapSizeLimit
    return (used / limit) > this.memoryPressureThreshold
  }

  handleMemoryPressure() {
    logger.warn('handleMemoryPressure', 'Memory pressure detected, performing emergency cleanup')

    // Evict 25% of cache entries
    const evictCount = Math.floor(this.cache.size * 0.25)
    this._evictByStrategy(evictCount)

    // Force garbage collection hint (if available)
    if (typeof window !== 'undefined' && window.gc) {
      window.gc()
    }
  }

  _getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1)
      }
    }
    return null
  }

  _estimateSize(value) {
    if (typeof value === 'string') {
      return value.length * 2 // 2 bytes per character (UTF-16)
    }
    if (Array.isArray(value)) {
      return value.reduce((sum, item) => sum + this._estimateSize(item), 0)
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value).length * 2
    }
    return 8 // Default for primitives
  }

  // Cleanup resources
  destroy() {
    this.clear()
  }
}

// In-memory cache instances
export const verbLookupCache = new IntelligentCache(500, 10 * 60 * 1000, false) // 10 minutes TTL
export const formFilterCache = new IntelligentCache(1000, 5 * 60 * 1000, true) // mastery-aware

// Enhanced initialize global maps with redundancy and validation
export async function initializeMaps() {
  logger.info('initializeMaps', '🚀 Initializing verb lookup maps with enhanced redundancy...')
  const startTime = performance.now()

  try {
    // Try multiple data sources with fallback
    let verbs = null
    let dataSource = 'unknown'

    // Primary: Try redundancy manager
    try {
      verbs = getAllVerbsWithRedundancy()
      dataSource = 'redundancy_manager'
      logger.info('initializeMaps', 'Using VerbDataRedundancyManager as primary source')
    } catch (error) {
      logger.warn('initializeMaps', 'RedundancyManager failed, trying direct service', error)
    }

    // Fallback: Try direct service
    if (!verbs || !Array.isArray(verbs) || verbs.length === 0) {
      try {
        verbs = getAllVerbs()
        dataSource = 'direct_service'
        logger.info('initializeMaps', 'Using direct service as fallback')
      } catch (error) {
        logger.warn('initializeMaps', 'Direct service failed, using emergency data', error)
      }
    }

    // Emergency: Use emergency data if all else fails
    if (!verbs || !Array.isArray(verbs) || verbs.length === 0) {
      const { getAllVerbsWithRedundancy: emergency } = await import('./VerbDataRedundancyManager.js')
      verbs = emergency() // This will use emergency dataset
      dataSource = 'emergency'
      logger.warn('initializeMaps', 'Using emergency data source')
    }

    // Validate and heal data before using
    try {
      const validationResult = validateAndHealVerbs(verbs)
      if (validationResult.healingPerformed) {
        logger.info('initializeMaps', `Data healing performed: ${validationResult.totalHealed} verbs healed`)
      }
      if (!validationResult.valid) {
        logger.warn('initializeMaps', `Data validation issues: ${validationResult.summary.invalid} invalid verbs`)
      }
    } catch (validationError) {
      logger.warn('initializeMaps', 'Data validation failed, proceeding with raw data', validationError)
    }

    // Clear existing maps
    VERB_LOOKUP_MAP.clear()
    FORM_LOOKUP_MAP.clear()

    let verbCount = 0
    let formCount = 0

    // Populate VERB_LOOKUP_MAP with error handling
    for (const verb of verbs) {
      try {
        if (verb?.lemma) {
          VERB_LOOKUP_MAP.set(verb.lemma, verb)
          if (verb.id) {
            VERB_LOOKUP_MAP.set(verb.id, verb)
          }
          verbCount++
        }
      } catch (error) {
        logger.warn('initializeMaps', `Failed to process verb ${verb?.lemma || 'unknown'}`, error)
      }
    }

    // Populate FORM_LOOKUP_MAP with error handling
    for (const verb of verbs) {
      try {
        if (!verb?.paradigms) continue

        for (const paradigm of verb.paradigms) {
          if (!paradigm.forms) continue

          for (const form of paradigm.forms) {
            try {
              const key = `${verb.lemma}|${form.mood}|${form.tense}|${form.person || ''}`
              const enrichedForm = {
                ...form,
                lemma: verb.lemma,
                id: key,
                type: verb.type || 'regular',
                verbType: verb.type || 'regular'
              }
              FORM_LOOKUP_MAP.set(key, enrichedForm)
              formCount++
            } catch (formError) {
              logger.warn('initializeMaps', `Failed to process form for verb ${verb.lemma}`, formError)
            }
          }
        }
      } catch (paradigmError) {
        logger.warn('initializeMaps', `Failed to process paradigms for verb ${verb?.lemma || 'unknown'}`, paradigmError)
      }
    }

    const endTime = performance.now()
    const initTime = endTime - startTime

    // Log success with comprehensive stats
    logger.info('initializeMaps', `✅ Maps initialized successfully`, {
      dataSource,
      verbCount,
      formCount,
      initTime: `${initTime.toFixed(2)}ms`,
      totalVerbs: verbs.length
    })

    // Trigger cache warming
    try {
      warmupCaches()
    } catch (warmupError) {
      logger.warn('initializeMaps', 'Cache warmup failed', warmupError)
    }

    return {
      success: true,
      dataSource,
      verbCount,
      formCount,
      initTime,
      totalVerbs: verbs.length
    }

  } catch (error) {
    logger.error('initializeMaps', '❌ Critical failure in map initialization', error)

    // Emergency fallback - try to initialize with minimal data
    try {
      const minimalVerbs = [
        {
          lemma: 'ser',
          type: 'irregular',
          paradigms: [{
            regionTags: ['la_general'],
            forms: [{ mood: 'indicative', tense: 'pres', person: '1s', value: 'soy' }]
          }]
        }
      ]

      VERB_LOOKUP_MAP.clear()
      FORM_LOOKUP_MAP.clear()
      VERB_LOOKUP_MAP.set('ser', minimalVerbs[0])

      logger.warn('initializeMaps', 'Emergency minimal initialization completed')

      return {
        success: false,
        error: error.message,
        dataSource: 'emergency_minimal',
        verbCount: 1,
        formCount: 1,
        initTime: 0
      }
    } catch (emergencyError) {
      logger.error('initializeMaps', 'Even emergency initialization failed', emergencyError)
      throw new Error(`Complete initialization failure: ${error.message}`)
    }
  }
}

// Enhanced cache warmup with intelligent preloading
export function warmupCaches() {
  logger.info('warmupCaches', '🔥 Starting verb data warmup...')

  try {
    // Priority verbs - most commonly used in exercises. Touching them warms the
    // underlying verbDataService lookups so the first real exercise selection is fast.
    // (We intentionally do NOT pre-seed verbLookupCache/formFilterCache here: their
    // real lookup keys are built from full request context, so any synthetic key we
    // wrote would never be read.)
    const priorityVerbs = [
      'ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber',
      'querer', 'poner', 'parecer', 'creer', 'seguir', 'venir', 'pensar', 'salir', 'volver',
      'conocer', 'vivir', 'sentir', 'empezar', 'hablar', 'comer', 'escribir', 'leer'
    ]

    let warmedCount = 0
    for (const lemma of priorityVerbs) {
      try {
        if (getVerbByLemma(lemma)) {
          warmedCount++
        }
      } catch (error) {
        logger.warn('warmupCaches', `Failed to warm verb ${lemma}`, error)
      }
    }

    logger.info('warmupCaches', '✅ Verb data warmup complete', {
      warmedVerbs: warmedCount,
      totalPriority: priorityVerbs.length
    })

  } catch (error) {
    logger.error('warmupCaches', 'Cache warmup failed', error)
  }
}

// Get verbs by lemmas with caching
export { getVerbsByLemmas }

// Re-export for compatibility
export { getVerbByLemma }

// Enhanced cache stats with comprehensive metrics
export function getCacheStats() {
  return {
    globalMaps: {
      verbs: VERB_LOOKUP_MAP.size,
      forms: FORM_LOOKUP_MAP.size
    },
    verbLookupCache: verbLookupCache.getStats(),
    formFilterCache: formFilterCache.getStats(),
    systemHealth: {
      memoryUsage: verbLookupCache._getMemoryUsage(),
      memoryPressure: verbLookupCache.isMemoryPressureHigh(),
      timestamp: new Date().toISOString()
    }
  }
}

// Enhanced clear all caches with persistence cleanup
export function clearAllCaches() {
  verbLookupCache.clear()
  formFilterCache.clear()

  // Clear persistence if available
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('verbLookupCache')
      localStorage.removeItem('formFilterCache')
    } catch (error) {
      logger.warn('clearAllCaches', 'Failed to clear persistence', error)
    }
  }

  logger.info('clearAllCaches', '🧹 All caches and persistence cleared')
}

// Enhanced auto-initialize with comprehensive error handling
if (typeof window !== 'undefined') {
  // Only auto-initialize in browser environment
  logger.info('auto-init', '🚀 Starting auto-initialization in browser environment')

  // Use setTimeout to avoid blocking the main thread
  const timeoutId = setTimeout(async () => {
    try {
      const initResult = await initializeMaps()
      if (initResult.success) {
        logger.info('auto-init', '✅ Auto-initialization completed successfully', {
          dataSource: initResult.dataSource,
          verbCount: initResult.verbCount,
          formCount: initResult.formCount
        })

        // Notify CacheOrchestrator that intelligent caches are ready
        try {
          const { getOrchestrator } = await import('./CacheOrchestrator.js')
          const orchestrator = getOrchestrator()
          if (orchestrator.registerIntelligentCaches) {
            orchestrator.registerIntelligentCaches()
          }
        } catch (error) {
          // Ignore if orchestrator isn't available yet
          logger.debug('auto-init', 'CacheOrchestrator not available yet for registration')
        }

        // Expose debug functions globally
        window.verbCacheDebug = {
          getCacheStats,
          clearAllCaches,
          initializeMaps,
          warmupCaches,
          getRedundancyStats: async () => {
            try {
              const { getRedundancyStats } = await import('./VerbDataRedundancyManager.js')
              return typeof getRedundancyStats === 'function' ? getRedundancyStats() : { error: 'RedundancyManager not available' }
            } catch (error) {
              return { error: 'RedundancyManager not available' }
            }
          },
          getIntegrityStats: async () => {
            try {
              const { getIntegrityStats } = await import('./DataIntegrityGuard.js')
              return typeof getIntegrityStats === 'function' ? getIntegrityStats() : { error: 'IntegrityGuard not available' }
            } catch (error) {
              return { error: 'IntegrityGuard not available' }
            }
          }
        }

        logger.info('auto-init', '🛠️ Debug tools exposed on window.verbCacheDebug')

      } else {
        logger.warn('auto-init', '⚠️ Auto-initialization completed with warnings', {
          error: initResult.error,
          dataSource: initResult.dataSource
        })
      }
    } catch (error) {
      logger.error('auto-init', '❌ Auto-initialization failed', error)
      logger.warn('auto-init', 'Maps may need manual initialization. Use initializeMaps() manually.')

      // Still expose debug tools even if init failed
      window.verbCacheDebug = {
        getCacheStats,
        clearAllCaches,
        initializeMaps,
        warmupCaches,
        error: error.message
      }
    }
  }, 100) // Small delay to ensure other modules are loaded

  // Store timeout ID so it can be cleared in tests
  if (typeof window !== 'undefined') {
    window.__verbCacheInitTimeout = timeoutId
  }
}
