/**
 * VerbDataRedundancyManager.js - Sistema de redundancia multi-capa para datos de verbos
 *
 * Este sistema garantiza que NUNCA falten verbos implementando múltiples capas de redundancia:
 * - Primary: Direct import desde verbs.js
 * - Secondary: Backup estático en memoria
 * - Tertiary: IndexedDB local cache
 * - Emergency: Dataset mínimo hardcoded
 *
 * Características:
 * - Auto-recovery automático
 * - Validación de integridad
 * - Performance monitoring
 * - Memory management
 * - Circuit breaker patterns
 */

import { getVerbs } from '../../data/verbsLazy.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('VerbDataRedundancy')

// Emergency minimal dataset - verbos más esenciales para garantizar funcionalidad básica
const EMERGENCY_VERBS = [
  {
    id: "ser",
    lemma: "ser",
    type: "irregular",
    paradigms: [{
      regionTags: ["rioplatense", "la_general", "peninsular"],
      forms: [
        { mood: "indicative", tense: "pres", person: "1s", value: "soy" },
        { mood: "indicative", tense: "pres", person: "2s_tu", value: "eres", accepts: { vos: "sos" } },
        { mood: "indicative", tense: "pres", person: "2s_vos", value: "sos", accepts: { tu: "eres" } },
        { mood: "indicative", tense: "pres", person: "3s", value: "es" },
        { mood: "indicative", tense: "pres", person: "1p", value: "somos" },
        { mood: "indicative", tense: "pres", person: "2p", value: "sois" },
        { mood: "indicative", tense: "pres", person: "3p", value: "son" }
      ]
    }]
  },
  {
    id: "estar",
    lemma: "estar",
    type: "irregular",
    paradigms: [{
      regionTags: ["rioplatense", "la_general", "peninsular"],
      forms: [
        { mood: "indicative", tense: "pres", person: "1s", value: "estoy" },
        { mood: "indicative", tense: "pres", person: "2s_tu", value: "estás", accepts: { vos: "estás" } },
        { mood: "indicative", tense: "pres", person: "2s_vos", value: "estás", accepts: { tu: "estás" } },
        { mood: "indicative", tense: "pres", person: "3s", value: "está" },
        { mood: "indicative", tense: "pres", person: "1p", value: "estamos" },
        { mood: "indicative", tense: "pres", person: "2p", value: "estáis" },
        { mood: "indicative", tense: "pres", person: "3p", value: "están" }
      ]
    }]
  },
  {
    id: "hablar",
    lemma: "hablar",
    type: "regular",
    paradigms: [{
      regionTags: ["rioplatense", "la_general", "peninsular"],
      forms: [
        { mood: "indicative", tense: "pres", person: "1s", value: "hablo" },
        { mood: "indicative", tense: "pres", person: "2s_tu", value: "hablas", accepts: { vos: "hablás" } },
        { mood: "indicative", tense: "pres", person: "2s_vos", value: "hablás", accepts: { tu: "hablas" } },
        { mood: "indicative", tense: "pres", person: "3s", value: "habla" },
        { mood: "indicative", tense: "pres", person: "1p", value: "hablamos" },
        { mood: "indicative", tense: "pres", person: "2p", value: "habláis" },
        { mood: "indicative", tense: "pres", person: "3p", value: "hablan" }
      ]
    }]
  }
]

// Cache layers
const DATA_LAYERS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary',
  EMERGENCY: 'emergency'
}

// Health states
const HEALTH_STATES = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency'
}

class VerbDataRedundancyManager {
  constructor() {
    this.currentLayer = null
    this.healthState = HEALTH_STATES.HEALTHY
    this.layerHealth = new Map()
    this.dataCache = new Map()
    this.lastValidation = null
    this.failureCount = 0
    this.circuitBreakerOpen = false
    this.recoveryAttempts = 0
    this.maxRecoveryAttempts = 5
    this.validationInterval = null
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      fallbackRequests: 0,
      layerSwitches: 0,
      lastError: null,
      averageResponseTime: 0
    }

    // Seed caches synchronously
    // Since we moved to lazy loading, we cannot seed PRIMARY synchronously anymore.
    // We start with PRIMARY as unavailable and rely on EMERGENCY layer until async init finishes.
    this.layerHealth.set(DATA_LAYERS.PRIMARY, false)

    // Emergency layer must always be available before async initialization runs
    this.dataCache.set(DATA_LAYERS.EMERGENCY, EMERGENCY_VERBS)
    this.layerHealth.set(DATA_LAYERS.EMERGENCY, true)
    if (!this.currentLayer) {
      this.currentLayer = DATA_LAYERS.EMERGENCY
      this.healthState = HEALTH_STATES.EMERGENCY
    }

    // Initialize immediately
    this.initialize()
  }

  /**
   * Initialize the redundancy manager
   */
  async initialize() {
    // Safe logging - avoid TDZ during module initialization
    try {
      logger?.info?.('initialize', 'Starting VerbDataRedundancyManager initialization')
    } catch (e) {
      // Logger not ready yet
    }

    try {
      // Initialize all layers
      await this.initializeLayers()

      // Start health monitoring
      this.startHealthMonitoring()

      // Validate initial data
      await this.validateCurrentData()

      // Safe logging - avoid TDZ during module initialization
      try {
        logger?.info?.('initialize', 'VerbDataRedundancyManager initialized successfully', {
          currentLayer: this.currentLayer,
          healthState: this.healthState,
          verbCount: this.getVerbCount()
        })
      } catch (e) {
        // Logger not ready yet
      }

    } catch (error) {
      // Safe logging - avoid TDZ during module initialization
      try {
        logger?.error?.('initialize', 'Failed to initialize VerbDataRedundancyManager', error)
      } catch (e) {
        // Logger not ready yet
      }
      await this.handleInitializationFailure(error)
    }
  }

  /**
   * Initialize all data layers
   */
  async initializeLayers() {
    let loadedVerbs = null

    // Primary layer - lazy import
    try {
      loadedVerbs = await getVerbs()

      if (loadedVerbs && Array.isArray(loadedVerbs) && loadedVerbs.length > 0) {
        this.dataCache.set(DATA_LAYERS.PRIMARY, loadedVerbs)
        this.layerHealth.set(DATA_LAYERS.PRIMARY, true)
        this.currentLayer = DATA_LAYERS.PRIMARY
        logger.info('initializeLayers', `Primary layer initialized with ${loadedVerbs.length} verbs`)
      } else {
        throw new Error('Primary verbs data is invalid or empty')
      }
    } catch (error) {
      logger.warn('initializeLayers', 'Primary layer failed', error)
      this.layerHealth.set(DATA_LAYERS.PRIMARY, false)
    }

    // Secondary layer - backup in memory (copy of primary for now)
    try {
      if (loadedVerbs && Array.isArray(loadedVerbs)) {
        // Use shallow copy for performance, deep copy only if mutation risk exists (verbs are usually treated as immutable)
        const backupVerbs = [...loadedVerbs]
        this.dataCache.set(DATA_LAYERS.SECONDARY, backupVerbs)
        this.layerHealth.set(DATA_LAYERS.SECONDARY, true)
        if (!this.currentLayer) {
          this.currentLayer = DATA_LAYERS.SECONDARY
        }
        logger.info('initializeLayers', `Secondary layer initialized with ${backupVerbs.length} verbs`)
      } else {
        // If primary failed, we can't create secondary
        this.layerHealth.set(DATA_LAYERS.SECONDARY, false)
      }
    } catch (error) {
      logger.warn('initializeLayers', 'Secondary layer failed', error)
      this.layerHealth.set(DATA_LAYERS.SECONDARY, false)
    }

    // Tertiary layer - IndexedDB cache (async, non-blocking)
    this.initializeTertiaryLayer()

    // Emergency layer - always available
    this.dataCache.set(DATA_LAYERS.EMERGENCY, EMERGENCY_VERBS)
    this.layerHealth.set(DATA_LAYERS.EMERGENCY, true)
    if (!this.currentLayer) {
      this.currentLayer = DATA_LAYERS.EMERGENCY
      this.healthState = HEALTH_STATES.EMERGENCY
    }
    logger.info('initializeLayers', `Emergency layer initialized with ${EMERGENCY_VERBS.length} verbs`)
  }

  /**
   * Initialize tertiary layer (IndexedDB) asynchronously
   */
  async initializeTertiaryLayer() {
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const cachedVerbs = await this.loadFromIndexedDB()
        if (cachedVerbs && cachedVerbs.length > 0) {
          this.dataCache.set(DATA_LAYERS.TERTIARY, cachedVerbs)
          this.layerHealth.set(DATA_LAYERS.TERTIARY, true)
          logger.info('initializeTertiaryLayer', `Tertiary layer loaded with ${cachedVerbs.length} verbs from IndexedDB`)
        } else {
          // Try to save current data to IndexedDB for future use
          if (this.dataCache.has(DATA_LAYERS.PRIMARY)) {
            await this.saveToIndexedDB(this.dataCache.get(DATA_LAYERS.PRIMARY))
          }
          this.layerHealth.set(DATA_LAYERS.TERTIARY, false)
        }
      } else {
        logger.warn('initializeTertiaryLayer', 'IndexedDB not available')
        this.layerHealth.set(DATA_LAYERS.TERTIARY, false)
      }
    } catch (error) {
      logger.warn('initializeTertiaryLayer', 'Tertiary layer initialization failed', error)
      this.layerHealth.set(DATA_LAYERS.TERTIARY, false)
    }
  }

  /**
   * Get verbs with automatic fallback and recovery
   */
  getAllVerbs() {
    const startTime = performance.now()
    this.metrics.totalRequests++

    try {
      // Circuit breaker check
      if (this.circuitBreakerOpen) {
        return this.handleCircuitBreakerOpen()
      }

      // Try current layer first
      let verbs = this.getVerbsFromLayer(this.currentLayer)

      if (this.isValidVerbData(verbs)) {
        this.metrics.successfulRequests++
        this.updateMetrics(startTime)
        return verbs
      }

      // Current layer failed, try fallback
      logger.warn('getAllVerbs', `Current layer ${this.currentLayer} failed, attempting fallback`)
      return this.attemptFallback(startTime)

    } catch (error) {
      logger.error('getAllVerbs', 'Critical error in getAllVerbs', error)
      this.metrics.lastError = error
      return this.handleCriticalError(startTime)
    }
  }

  /**
   * Get verbs from specific layer
   */
  getVerbsFromLayer(layer) {
    if (!this.dataCache.has(layer)) {
      throw new Error(`Layer ${layer} not available in cache`)
    }

    const verbs = this.dataCache.get(layer)
    if (!this.isValidVerbData(verbs)) {
      throw new Error(`Layer ${layer} contains invalid data`)
    }

    return verbs
  }

  /**
   * Attempt fallback to next available layer
   */
  attemptFallback(startTime) {
    this.metrics.fallbackRequests++
    this.layerHealth.set(this.currentLayer, false)

    const fallbackOrder = this.getFallbackOrder()

    for (const layer of fallbackOrder) {
      if (layer === this.currentLayer) continue

      try {
        const verbs = this.getVerbsFromLayer(layer)
        if (this.isValidVerbData(verbs)) {
          logger.info('attemptFallback', `Successfully switched to ${layer}`, {
            fromLayer: this.currentLayer,
            toLayer: layer,
            verbCount: verbs.length
          })

          this.currentLayer = layer
          this.metrics.layerSwitches++
          this.updateHealthState()
          this.updateMetrics(startTime)

          // Try to recover failed layer in background
          this.scheduleLayerRecovery()

          return verbs
        }
      } catch (error) {
        logger.warn('attemptFallback', `Layer ${layer} also failed`, error)
        this.layerHealth.set(layer, false)
        continue
      }
    }

    // All layers failed
    throw new Error('All redundancy layers have failed')
  }

  /**
   * Handle circuit breaker open state
   */
  handleCircuitBreakerOpen() {
    logger.warn('handleCircuitBreakerOpen', 'Circuit breaker is open, using cached emergency data')

    // Try to use emergency layer
    try {
      const emergency = this.dataCache.get(DATA_LAYERS.EMERGENCY)
      if (this.isValidVerbData(emergency)) {
        return emergency
      }
    } catch (error) {
      logger.error('handleCircuitBreakerOpen', 'Even emergency layer failed', error)
    }

    // Return absolute minimum
    return EMERGENCY_VERBS
  }

  /**
   * Handle critical error state
   */
  handleCriticalError(startTime) {
    logger.error('handleCriticalError', 'Entering critical error state')

    this.healthState = HEALTH_STATES.CRITICAL
    this.failureCount++

    // Open circuit breaker if too many failures
    if (this.failureCount >= 5) {
      this.circuitBreakerOpen = true
      logger.error('handleCriticalError', 'Circuit breaker opened due to repeated failures')
    }

    this.updateMetrics(startTime)

    // Return emergency data as last resort
    return EMERGENCY_VERBS
  }

  /**
   * Get fallback order based on current health and preferences
   */
  getFallbackOrder() {
    const healthy = []
    const degraded = []

    for (const [layer, isHealthy] of this.layerHealth) {
      if (isHealthy) {
        healthy.push(layer)
      } else {
        degraded.push(layer)
      }
    }

    // Prioritize healthy layers, then try degraded ones
    const order = [
      DATA_LAYERS.PRIMARY,
      DATA_LAYERS.SECONDARY,
      DATA_LAYERS.TERTIARY,
      DATA_LAYERS.EMERGENCY
    ].filter(layer => healthy.includes(layer))

    // Add degraded layers as last resort
    order.push(...degraded.filter(layer => !order.includes(layer)))

    return order
  }

  /**
   * Validate verb data structure and content
   */
  isValidVerbData(verbs) {
    if (!Array.isArray(verbs) || verbs.length === 0) {
      return false
    }

    // Sample validation - check first few verbs
    const sampleSize = Math.min(3, verbs.length)
    for (let i = 0; i < sampleSize; i++) {
      const verb = verbs[i]
      if (!verb || !verb.lemma || !verb.paradigms || !Array.isArray(verb.paradigms)) {
        return false
      }

      // Check paradigm structure
      for (const paradigm of verb.paradigms) {
        if (!paradigm.forms || !Array.isArray(paradigm.forms) || paradigm.forms.length === 0) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Update health state based on current layer status
   */
  updateHealthState() {
    const healthyLayers = Array.from(this.layerHealth.values()).filter(Boolean).length

    if (healthyLayers >= 3) {
      this.healthState = HEALTH_STATES.HEALTHY
    } else if (healthyLayers >= 2) {
      this.healthState = HEALTH_STATES.DEGRADED
    } else if (healthyLayers >= 1) {
      this.healthState = HEALTH_STATES.CRITICAL
    } else {
      this.healthState = HEALTH_STATES.EMERGENCY
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    // Validate data every 30 seconds
    this.validationInterval = setInterval(() => {
      this.validateAllLayers()
    }, 30000)

    logger.info('startHealthMonitoring', 'Health monitoring started')
  }

  /**
   * Validate all layers
   */
  async validateAllLayers() {
    for (const layer of Object.values(DATA_LAYERS)) {
      try {
        if (this.dataCache.has(layer)) {
          const verbs = this.dataCache.get(layer)
          const isValid = this.isValidVerbData(verbs)
          this.layerHealth.set(layer, isValid)

          if (!isValid) {
            logger.warn('validateAllLayers', `Layer ${layer} validation failed`)
          }
        }
      } catch (error) {
        logger.warn('validateAllLayers', `Error validating layer ${layer}`, error)
        this.layerHealth.set(layer, false)
      }
    }

    this.updateHealthState()
    this.lastValidation = new Date()
  }

  /**
   * Validate current data
   */
  async validateCurrentData() {
    try {
      const verbs = this.getAllVerbs()
      const isValid = this.isValidVerbData(verbs)

      if (!isValid) {
        throw new Error('Current data validation failed')
      }

      logger.info('validateCurrentData', 'Data validation passed', {
        layer: this.currentLayer,
        verbCount: verbs.length
      })

      return true
    } catch (error) {
      logger.error('validateCurrentData', 'Data validation failed', error)
      return false
    }
  }

  /**
   * Schedule layer recovery attempt
   */
  scheduleLayerRecovery() {
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      logger.warn('scheduleLayerRecovery', 'Max recovery attempts reached')
      return
    }

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.recoveryAttempts), 30000)

    setTimeout(async () => {
      await this.attemptLayerRecovery()
    }, delay)
  }

  /**
   * Attempt to recover failed layers
   */
  async attemptLayerRecovery() {
    this.recoveryAttempts++
    logger.info('attemptLayerRecovery', `Recovery attempt ${this.recoveryAttempts}`)

    try {
      // Try to reinitialize failed layers
      await this.initializeLayers()

      // Reset circuit breaker if recovery successful
      if (this.healthState === HEALTH_STATES.HEALTHY) {
        this.circuitBreakerOpen = false
        this.failureCount = 0
        this.recoveryAttempts = 0
        logger.info('attemptLayerRecovery', 'Recovery successful, circuit breaker reset')
      }

    } catch (error) {
      logger.warn('attemptLayerRecovery', `Recovery attempt ${this.recoveryAttempts} failed`, error)

      if (this.recoveryAttempts < this.maxRecoveryAttempts) {
        this.scheduleLayerRecovery()
      }
    }
  }

  /**
   * Handle initialization failure
   */
  async handleInitializationFailure(error) {
    logger.error('handleInitializationFailure', 'Initialization failed, entering emergency mode', error)

    this.currentLayer = DATA_LAYERS.EMERGENCY
    this.healthState = HEALTH_STATES.EMERGENCY
    this.dataCache.clear()
    this.dataCache.set(DATA_LAYERS.EMERGENCY, EMERGENCY_VERBS)
    this.layerHealth.clear()
    this.layerHealth.set(DATA_LAYERS.EMERGENCY, true)

    // Try recovery in background
    this.scheduleLayerRecovery()
  }

  /**
   * Update performance metrics
   */
  updateMetrics(startTime) {
    const responseTime = performance.now() - startTime

    // Update rolling average
    const alpha = 0.1 // Smoothing factor
    this.metrics.averageResponseTime =
      this.metrics.averageResponseTime * (1 - alpha) + responseTime * alpha
  }

  /**
   * IndexedDB operations
   */
  async loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VerbDataCache', 1)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['verbs'], 'readonly')
        const store = transaction.objectStore('verbs')
        const getRequest = store.get('primary')

        getRequest.onsuccess = () => {
          const result = getRequest.result
          resolve(result ? result.data : null)
        }

        getRequest.onerror = () => reject(getRequest.error)
      }

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('verbs')) {
          db.createObjectStore('verbs', { keyPath: 'id' })
        }
      }
    })
  }

  async saveToIndexedDB(verbs) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VerbDataCache', 1)

      request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction(['verbs'], 'readwrite')
        const store = transaction.objectStore('verbs')

        store.put({
          id: 'primary',
          data: verbs,
          timestamp: Date.now()
        })

        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get current statistics and health info
   */
  getStats() {
    return {
      currentLayer: this.currentLayer,
      healthState: this.healthState,
      layerHealth: Object.fromEntries(this.layerHealth),
      verbCount: this.getVerbCount(),
      circuitBreakerOpen: this.circuitBreakerOpen,
      failureCount: this.failureCount,
      recoveryAttempts: this.recoveryAttempts,
      lastValidation: this.lastValidation,
      metrics: { ...this.metrics }
    }
  }

  /**
   * Get verb count from current layer
   */
  getVerbCount() {
    try {
      const verbs = this.dataCache.get(this.currentLayer)
      return verbs ? verbs.length : 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Force refresh of all layers
   */
  async forceRefresh() {
    logger.info('forceRefresh', 'Forcing refresh of all layers')

    this.dataCache.clear()
    this.layerHealth.clear()
    this.circuitBreakerOpen = false
    this.failureCount = 0
    this.recoveryAttempts = 0

    await this.initializeLayers()
    await this.validateCurrentData()
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval)
      this.validationInterval = null
    }

    this.dataCache.clear()
    this.layerHealth.clear()

    logger.info('destroy', 'VerbDataRedundancyManager destroyed')
  }
}

// Global singleton instance
let redundancyManagerInstance = null

/**
 * Get or create the global redundancy manager instance
 */
export function getRedundancyManager() {
  if (!redundancyManagerInstance) {
    redundancyManagerInstance = new VerbDataRedundancyManager()
  }
  return redundancyManagerInstance
}

/**
 * Initialize redundancy manager if not already done
 */
export async function initializeRedundancyManager() {
  const manager = getRedundancyManager()
  if (!manager.currentLayer) {
    await manager.initialize()
  }
  return manager
}

/**
 * Get verbs with full redundancy protection
 */
export function getAllVerbsWithRedundancy() {
  const manager = getRedundancyManager()
  return manager.getAllVerbs()
}

/**
 * Get redundancy manager statistics
 */
export function getRedundancyStats() {
  const manager = getRedundancyManager()
  return manager.getStats()
}

/**
 * Force refresh of verb data
 */
export async function forceRefreshVerbData() {
  const manager = getRedundancyManager()
  await manager.forceRefresh()
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  initializeRedundancyManager().catch(error => {
    console.error('Failed to auto-initialize VerbDataRedundancyManager:', error)
  })
}
