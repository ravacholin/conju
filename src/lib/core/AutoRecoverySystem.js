/**
 * AutoRecoverySystem.js - Sistema de auto-recuperación y manejo de errores avanzado
 *
 * Este sistema proporciona recuperación automática y manejo de errores robusto:
 * - Detección automática de fallos en tiempo real
 * - Estrategias de recuperación escalonadas
 * - Circuit breaker patterns avanzados
 * - Error classification y routing
 * - Fallback chains inteligentes
 * - Recovery metrics y reporting
 * - Graceful degradation management
 */

import { getRedundancyManager } from './VerbDataRedundancyManager.js'
import { getIntegrityGuard } from './DataIntegrityGuard.js'
import { getOrchestrator } from './CacheOrchestrator.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('AutoRecovery')

// Error categories and severities
const ERROR_CATEGORIES = {
  DATA_CORRUPTION: 'data_corruption',
  CACHE_FAILURE: 'cache_failure',
  MEMORY_PRESSURE: 'memory_pressure',
  NETWORK_FAILURE: 'network_failure',
  PERFORMANCE_DEGRADATION: 'performance_degradation',
  INITIALIZATION_FAILURE: 'initialization_failure',
  VALIDATION_FAILURE: 'validation_failure',
  SYSTEM_OVERLOAD: 'system_overload'
}

const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
  CATASTROPHIC: 'catastrophic'
}

// Recovery strategies
const RECOVERY_STRATEGIES = {
  RESTART_COMPONENT: 'restart_component',
  FALLBACK_DATA: 'fallback_data',
  CACHE_REBUILD: 'cache_rebuild',
  MEMORY_CLEANUP: 'memory_cleanup',
  GRACEFUL_DEGRADATION: 'graceful_degradation',
  EMERGENCY_MODE: 'emergency_mode',
  SYSTEM_RESTART: 'system_restart'
}

// System states
const SYSTEM_STATES = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  RECOVERING: 'recovering',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
  OFFLINE: 'offline'
}

class AutoRecoverySystem {
  constructor() {
    this.currentState = SYSTEM_STATES.HEALTHY
    this.errorHistory = []
    this.recoveryAttempts = new Map()
    this.circuitBreakers = new Map()
    this.recoveryStrategies = new Map()
    this.errorClassifiers = new Map()
    this.monitoringActive = false
    this.metrics = {
      totalErrors: 0,
      recoveryAttempts: 0,
      successfulRecoveries: 0,
      failedRecoveries: 0,
      systemRestarts: 0,
      averageRecoveryTime: 0,
      lastError: null,
      lastRecovery: null
    }
    this.alertThresholds = {
      errorRate: 10, // errors per minute
      failureRate: 0.3, // 30% failure rate
      recoveryTime: 10000 // 10 seconds
    }
    this.gracefulDegradationActive = false
    this.emergencyModeActive = false
    this.isRecovering = false
    this.lastHealthCheck = null
    this.monitoringInterval = null

    this.isInitialized = false
    this.initializationPromise = null
    this.errorListenersRegistered = false
    this.boundGlobalErrorHandler = null
    this.boundUnhandledRejectionHandler = null

    this.initialize()
  }

  /**
   * Initialize the auto-recovery system
   */
  async initialize() {
    if (this.isInitialized) {
      logger.debug('initialize', 'Initialization skipped - already initialized')
      return
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = (async () => {
      logger.info('initialize', '🔄 Initializing AutoRecoverySystem...')

      try {
        // Setup error classifiers
        this.setupErrorClassifiers()

        // Setup recovery strategies
        this.setupRecoveryStrategies()

        // Initialize circuit breakers
        this.initializeCircuitBreakers()

        // Setup error listeners
        this.setupErrorListeners()

        // Start monitoring
        this.startMonitoring()

        this.isInitialized = true

        logger.info('initialize', '✅ AutoRecoverySystem initialized successfully')

      } catch (error) {
        this.isInitialized = false
        logger.error('initialize', 'Failed to initialize AutoRecoverySystem', error)
        this.currentState = SYSTEM_STATES.CRITICAL
        throw error

      } finally {
        this.initializationPromise = null
      }
    })()

    return this.initializationPromise
  }

  /**
   * Handle error with automatic recovery
   */
  async handleError(error, context = {}) {
    const startTime = performance.now()
    this.metrics.totalErrors++

    try {
      // Classify error
      const classification = this.classifyError(error, context)

      // Log error with classification
      logger.error('handleError', `Error classified as ${classification.category}:${classification.severity}`, {
        error: error.message,
        context,
        classification
      })

      // Record error in history
      this.recordError(error, classification, context)

      // Check if circuit breaker should trip
      this.updateCircuitBreaker(classification.category, false)

      // Determine recovery strategy
      const strategy = this.determineRecoveryStrategy(classification, context)

      // Attempt recovery
      const recoveryResult = await this.executeRecovery(strategy, error, context)

      // Update metrics
      this.updateRecoveryMetrics(startTime, recoveryResult.success)

      // Update system state based on recovery result
      this.updateSystemState(classification, recoveryResult)

      return recoveryResult

    } catch (recoveryError) {
      logger.error('handleError', 'Recovery attempt failed', recoveryError)
      this.metrics.failedRecoveries++

      // Escalate to emergency recovery
      return await this.executeEmergencyRecovery(error, context)
    }
  }

  /**
   * Classify error type and severity
   */
  classifyError(error, context) {
    const classification = {
      category: ERROR_CATEGORIES.DATA_CORRUPTION,
      severity: ERROR_SEVERITY.MEDIUM,
      confidence: 0.5,
      suggestedStrategy: RECOVERY_STRATEGIES.RESTART_COMPONENT
    }

    // Use registered classifiers
    for (const [name, classifier] of this.errorClassifiers) {
      try {
        const result = classifier(error, context)
        if (result.confidence > classification.confidence) {
          Object.assign(classification, result)
        }
      } catch (classifierError) {
        logger.warn('classifyError', `Classifier ${name} failed`, classifierError)
      }
    }

    return classification
  }

  /**
   * Determine appropriate recovery strategy
   */
  determineRecoveryStrategy(classification, context) {
    const { category, severity, suggestedStrategy } = classification

    // Check if we've tried this strategy recently
    const attemptKey = `${category}:${suggestedStrategy}`
    const recentAttempts = this.recoveryAttempts.get(attemptKey) || 0

    // Escalate strategy if previous attempts failed
    if (recentAttempts > 2) {
      return this.escalateStrategy(suggestedStrategy, severity)
    }

    // Check circuit breaker status
    if (this.isCircuitBreakerOpen(category)) {
      return RECOVERY_STRATEGIES.EMERGENCY_MODE
    }

    return suggestedStrategy
  }

  /**
   * Execute recovery strategy
   */
  async executeRecovery(strategy, error, context) {
    this.isRecovering = true
    this.currentState = SYSTEM_STATES.RECOVERING
    this.metrics.recoveryAttempts++

    const startTime = performance.now()

    logger.info('executeRecovery', `Executing recovery strategy: ${strategy}`, { error: error.message })

    try {
      const strategyFunction = this.recoveryStrategies.get(strategy)
      if (!strategyFunction) {
        throw new Error(`Unknown recovery strategy: ${strategy}`)
      }

      const result = await strategyFunction(error, context)

      const recoveryTime = performance.now() - startTime

      if (result.success) {
        this.metrics.successfulRecoveries++
        this.metrics.lastRecovery = new Date()

        logger.info('executeRecovery', `Recovery successful: ${strategy}`, {
          recoveryTime: `${recoveryTime.toFixed(2)}ms`,
          result
        })

        // Reset circuit breaker on successful recovery
        this.updateCircuitBreaker(this.getErrorCategory(error), true)

        return {
          success: true,
          strategy,
          recoveryTime,
          result
        }
      } else {
        this.metrics.failedRecoveries++

        logger.warn('executeRecovery', `Recovery failed: ${strategy}`, {
          recoveryTime: `${recoveryTime.toFixed(2)}ms`,
          error: result.error
        })

        return {
          success: false,
          strategy,
          recoveryTime,
          error: result.error
        }
      }

    } catch (recoveryError) {
      this.metrics.failedRecoveries++
      const recoveryTime = performance.now() - startTime

      logger.error('executeRecovery', `Recovery strategy ${strategy} threw error`, recoveryError)

      return {
        success: false,
        strategy,
        recoveryTime,
        error: recoveryError.message
      }
    } finally {
      this.isRecovering = false
      this.updateRecoveryAttempts(strategy)
    }
  }

  /**
   * Execute emergency recovery as last resort
   */
  async executeEmergencyRecovery(error, context) {
    logger.error('executeEmergencyRecovery', '🚨 EMERGENCY RECOVERY ACTIVATED', { error: error.message })

    this.emergencyModeActive = true
    this.currentState = SYSTEM_STATES.EMERGENCY

    try {
      // Immediate actions
      await this.activateEmergencyMode()

      // Try to restart core systems
      const restartResult = await this.restartCoreSystem()

      if (restartResult.success) {
        this.emergencyModeActive = false
        this.currentState = SYSTEM_STATES.DEGRADED

        logger.info('executeEmergencyRecovery', '✅ Emergency recovery successful')

        return {
          success: true,
          strategy: RECOVERY_STRATEGIES.EMERGENCY_MODE,
          result: restartResult
        }
      } else {
        this.currentState = SYSTEM_STATES.OFFLINE

        logger.error('executeEmergencyRecovery', '❌ Emergency recovery failed - system offline')

        return {
          success: false,
          strategy: RECOVERY_STRATEGIES.EMERGENCY_MODE,
          error: 'Complete system failure'
        }
      }

    } catch (emergencyError) {
      logger.error('executeEmergencyRecovery', 'Emergency recovery threw error', emergencyError)
      this.currentState = SYSTEM_STATES.OFFLINE

      return {
        success: false,
        strategy: RECOVERY_STRATEGIES.EMERGENCY_MODE,
        error: emergencyError.message
      }
    }
  }

  /**
   * Setup error classifiers
   */
  setupErrorClassifiers() {
    // Data corruption classifier
    this.addErrorClassifier('data_corruption', (error, context) => {
      const patterns = ['corrupt', 'invalid', 'malformed', 'checksum', 'integrity']
      const isDataError = patterns.some(pattern =>
        error.message.toLowerCase().includes(pattern)
      )

      if (isDataError) {
        return {
          category: ERROR_CATEGORIES.DATA_CORRUPTION,
          severity: ERROR_SEVERITY.HIGH,
          confidence: 0.8,
          suggestedStrategy: RECOVERY_STRATEGIES.FALLBACK_DATA
        }
      }

      return { confidence: 0 }
    })

    // Cache failure classifier
    this.addErrorClassifier('cache_failure', (error, context) => {
      const patterns = ['cache', 'storage', 'memory', 'evict']
      const isCacheError = patterns.some(pattern =>
        error.message.toLowerCase().includes(pattern) ||
        context.component?.includes('cache')
      )

      if (isCacheError) {
        return {
          category: ERROR_CATEGORIES.CACHE_FAILURE,
          severity: ERROR_SEVERITY.MEDIUM,
          confidence: 0.7,
          suggestedStrategy: RECOVERY_STRATEGIES.CACHE_REBUILD
        }
      }

      return { confidence: 0 }
    })

    // Memory pressure classifier
    this.addErrorClassifier('memory_pressure', (error, context) => {
      const patterns = ['memory', 'heap', 'out of memory', 'allocation']
      const isMemoryError = patterns.some(pattern =>
        error.message.toLowerCase().includes(pattern)
      )

      if (isMemoryError || context.memoryPressure) {
        return {
          category: ERROR_CATEGORIES.MEMORY_PRESSURE,
          severity: ERROR_SEVERITY.HIGH,
          confidence: 0.9,
          suggestedStrategy: RECOVERY_STRATEGIES.MEMORY_CLEANUP
        }
      }

      return { confidence: 0 }
    })

    // Network failure classifier
    this.addErrorClassifier('network_failure', (error, context) => {
      const patterns = ['network', 'fetch', 'connection', 'timeout', 'offline']
      const isNetworkError = patterns.some(pattern =>
        error.message.toLowerCase().includes(pattern)
      )

      if (isNetworkError) {
        return {
          category: ERROR_CATEGORIES.NETWORK_FAILURE,
          severity: ERROR_SEVERITY.MEDIUM,
          confidence: 0.8,
          suggestedStrategy: RECOVERY_STRATEGIES.FALLBACK_DATA
        }
      }

      return { confidence: 0 }
    })

    // Initialization failure classifier
    this.addErrorClassifier('initialization_failure', (error, context) => {
      const patterns = ['initialize', 'init', 'startup', 'bootstrap']
      const isInitError = patterns.some(pattern =>
        error.message.toLowerCase().includes(pattern) ||
        context.phase === 'initialization'
      )

      if (isInitError) {
        return {
          category: ERROR_CATEGORIES.INITIALIZATION_FAILURE,
          severity: ERROR_SEVERITY.CRITICAL,
          confidence: 0.9,
          suggestedStrategy: RECOVERY_STRATEGIES.RESTART_COMPONENT
        }
      }

      return { confidence: 0 }
    })
  }

  /**
   * Setup recovery strategies
   */
  setupRecoveryStrategies() {
    // Restart component strategy
    this.addRecoveryStrategy(RECOVERY_STRATEGIES.RESTART_COMPONENT, async (error, context) => {
      try {
        const component = context.component || 'unknown'
        logger.info('recovery:restart_component', `Restarting component: ${component}`)

        // Restart based on component type
        if (component.includes('cache')) {
          const orchestrator = getOrchestrator()
          await orchestrator.initialize()
        } else if (component.includes('redundancy')) {
          const redundancyManager = getRedundancyManager()
          await redundancyManager.forceRefresh()
        } else if (component.includes('integrity')) {
          const integrityGuard = getIntegrityGuard()
          integrityGuard.clearCache()
        }

        return { success: true, message: `Component ${component} restarted` }
      } catch (restartError) {
        return { success: false, error: restartError.message }
      }
    })

    // Fallback data strategy
    this.addRecoveryStrategy(RECOVERY_STRATEGIES.FALLBACK_DATA, async (error, context) => {
      try {
        logger.info('recovery:fallback_data', 'Activating fallback data sources')

        const redundancyManager = getRedundancyManager()
        await redundancyManager.forceRefresh()

        // Force fallback to lower-level data sources
        const stats = redundancyManager.getStats()
        if (stats.currentLayer !== 'emergency') {
          return { success: true, message: 'Fallback data activated' }
        }

        return { success: false, error: 'All fallback sources exhausted' }
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message }
      }
    })

    // Cache rebuild strategy
    this.addRecoveryStrategy(RECOVERY_STRATEGIES.CACHE_REBUILD, async (error, context) => {
      try {
        logger.info('recovery:cache_rebuild', 'Rebuilding caches')

        const orchestrator = getOrchestrator()

        // Clear all caches
        await orchestrator.invalidate('*', { reason: 'recovery_rebuild' })

        // Reinitialize
        await orchestrator.initialize()

        return { success: true, message: 'Caches rebuilt successfully' }
      } catch (rebuildError) {
        return { success: false, error: rebuildError.message }
      }
    })

    // Memory cleanup strategy
    this.addRecoveryStrategy(RECOVERY_STRATEGIES.MEMORY_CLEANUP, async (error, context) => {
      try {
        logger.info('recovery:memory_cleanup', 'Performing memory cleanup')

        const orchestrator = getOrchestrator()
        await orchestrator.handleMemoryPressure()

        // Force garbage collection if available
        if (typeof window !== 'undefined' && window.gc) {
          window.gc()
        }

        return { success: true, message: 'Memory cleanup completed' }
      } catch (cleanupError) {
        return { success: false, error: cleanupError.message }
      }
    })

    // Graceful degradation strategy
    this.addRecoveryStrategy(RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION, async (error, context) => {
      try {
        logger.warn('recovery:graceful_degradation', 'Activating graceful degradation')

        this.gracefulDegradationActive = true

        // Reduce system capabilities
        const orchestrator = getOrchestrator()
        orchestrator.strategy = 'conservative'

        return { success: true, message: 'Graceful degradation activated' }
      } catch (degradationError) {
        return { success: false, error: degradationError.message }
      }
    })

    // Emergency mode strategy
    this.addRecoveryStrategy(RECOVERY_STRATEGIES.EMERGENCY_MODE, async (error, context) => {
      try {
        logger.error('recovery:emergency_mode', '🚨 Activating emergency mode')

        await this.activateEmergencyMode()

        return { success: true, message: 'Emergency mode activated' }
      } catch (emergencyError) {
        return { success: false, error: emergencyError.message }
      }
    })
  }

  /**
   * Activate emergency mode
   */
  async activateEmergencyMode() {
    this.emergencyModeActive = true

    try {
      // Disable all non-essential systems
      const orchestrator = getOrchestrator()
      orchestrator.strategy = 'emergency'

      // Force redundancy manager to emergency layer
      const redundancyManager = getRedundancyManager()
      const stats = redundancyManager.getStats()

      if (stats.currentLayer !== 'emergency') {
        // This would force switch to emergency data
        await redundancyManager.handleInitializationFailure(new Error('Emergency mode activated'))
      }

      logger.warn('activateEmergencyMode', 'Emergency mode activated - limited functionality')

    } catch (error) {
      logger.error('activateEmergencyMode', 'Failed to activate emergency mode', error)
      throw error
    }
  }

  /**
   * Restart core system components
   */
  async restartCoreSystem() {
    this.metrics.systemRestarts++

    try {
      logger.info('restartCoreSystem', 'Restarting core system components...')

      // Restart in dependency order
      const redundancyManager = getRedundancyManager()
      await redundancyManager.initialize()

      const integrityGuard = getIntegrityGuard()
      integrityGuard.clearCache()

      const orchestrator = getOrchestrator()
      await orchestrator.initialize()

      logger.info('restartCoreSystem', '✅ Core system restart completed')

      return { success: true, message: 'Core system restarted' }

    } catch (restartError) {
      logger.error('restartCoreSystem', 'Core system restart failed', restartError)
      return { success: false, error: restartError.message }
    }
  }

  /**
   * Setup global error listeners
   */
  setupErrorListeners() {
    if (this.errorListenersRegistered || typeof window === 'undefined') {
      return
    }

    this.boundGlobalErrorHandler = (event) => {
      this.handleError(event.error || new Error(event.message), {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }

    this.boundUnhandledRejectionHandler = (event) => {
      const reason = event.reason instanceof Error
        ? event.reason
        : new Error(event.reason)

      this.handleError(reason, {
        type: 'unhandled_rejection',
        promise: true
      })
    }

    window.addEventListener('error', this.boundGlobalErrorHandler)
    window.addEventListener('unhandledrejection', this.boundUnhandledRejectionHandler)

    this.errorListenersRegistered = true
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    // Monitor every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck()
    }, 30000)

    this.monitoringActive = true
    logger.info('startMonitoring', 'Auto-recovery monitoring started')
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    this.monitoringActive = false
    logger.info('stopMonitoring', 'Auto-recovery monitoring stopped')
  }

  /**
   * Perform system health check
   */
  async performHealthCheck() {
    try {
      this.lastHealthCheck = new Date()

      // Check error rates
      const recentErrors = this.getRecentErrors(60000) // Last minute
      if (recentErrors.length > this.alertThresholds.errorRate) {
        logger.warn('performHealthCheck', `High error rate: ${recentErrors.length} errors in last minute`)

        // Trigger preventive recovery
        await this.executeRecovery(RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
          new Error('High error rate detected'),
          { preventive: true }
        )
      }

      // Check system components
      const componentHealth = await this.checkComponentHealth()

      // Update system state based on health
      this.updateSystemStateFromHealth(componentHealth)

    } catch (healthError) {
      logger.error('performHealthCheck', 'Health check failed', healthError)
    }
  }

  /**
   * Check health of system components
   */
  async checkComponentHealth() {
    const health = {
      redundancyManager: false,
      integrityGuard: false,
      cacheOrchestrator: false,
      overall: false
    }

    try {
      // Check redundancy manager
      const redundancyManager = getRedundancyManager()
      const redundancyStats = redundancyManager.getStats()
      health.redundancyManager = redundancyStats.healthState !== 'emergency'

      // Check integrity guard
      const integrityGuard = getIntegrityGuard()
      const integrityStats = integrityGuard.getIntegrityStats()
      health.integrityGuard = integrityStats.validationMetrics.failedValidations < 10

      // Check cache orchestrator
      const orchestrator = getOrchestrator()
      const orchestratorStats = orchestrator.getStats()
      health.cacheOrchestrator = orchestratorStats.health === 'optimal'

      // Overall health
      const healthyCount = Object.values(health).filter(Boolean).length
      health.overall = healthyCount >= 2 // At least 2 components healthy

      return health

    } catch (error) {
      logger.error('checkComponentHealth', 'Component health check failed', error)
      return health
    }
  }

  // Utility methods
  addErrorClassifier(name, classifier) {
    this.errorClassifiers.set(name, classifier)
  }

  addRecoveryStrategy(name, strategy) {
    this.recoveryStrategies.set(name, strategy)
  }

  recordError(error, classification, context) {
    this.errorHistory.push({
      timestamp: Date.now(),
      error: error.message,
      classification,
      context
    })

    // Keep only last 100 errors
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift()
    }

    this.metrics.lastError = new Date()
  }

  updateRecoveryMetrics(startTime, success) {
    const recoveryTime = performance.now() - startTime

    // Update average recovery time
    const alpha = 0.1
    this.metrics.averageRecoveryTime =
      this.metrics.averageRecoveryTime * (1 - alpha) + recoveryTime * alpha
  }

  updateSystemState(classification, recoveryResult) {
    if (recoveryResult.success) {
      if (this.currentState === SYSTEM_STATES.CRITICAL) {
        this.currentState = SYSTEM_STATES.DEGRADED
      } else if (this.currentState === SYSTEM_STATES.DEGRADED) {
        this.currentState = SYSTEM_STATES.HEALTHY
      }
    } else {
      if (classification.severity === ERROR_SEVERITY.CRITICAL) {
        this.currentState = SYSTEM_STATES.CRITICAL
      } else if (classification.severity === ERROR_SEVERITY.HIGH) {
        this.currentState = SYSTEM_STATES.DEGRADED
      }
    }
  }

  updateSystemStateFromHealth(componentHealth) {
    if (componentHealth.overall && this.currentState !== SYSTEM_STATES.HEALTHY) {
      this.currentState = SYSTEM_STATES.HEALTHY
      this.gracefulDegradationActive = false
      this.emergencyModeActive = false
    }
  }

  getRecentErrors(timeWindow) {
    const cutoff = Date.now() - timeWindow
    return this.errorHistory.filter(error => error.timestamp > cutoff)
  }

  updateRecoveryAttempts(strategy) {
    const count = this.recoveryAttempts.get(strategy) || 0
    this.recoveryAttempts.set(strategy, count + 1)
  }

  escalateStrategy(currentStrategy, severity) {
    const escalationMap = {
      [RECOVERY_STRATEGIES.RESTART_COMPONENT]: RECOVERY_STRATEGIES.CACHE_REBUILD,
      [RECOVERY_STRATEGIES.CACHE_REBUILD]: RECOVERY_STRATEGIES.FALLBACK_DATA,
      [RECOVERY_STRATEGIES.FALLBACK_DATA]: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
      [RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION]: RECOVERY_STRATEGIES.EMERGENCY_MODE,
      [RECOVERY_STRATEGIES.EMERGENCY_MODE]: RECOVERY_STRATEGIES.SYSTEM_RESTART
    }

    return escalationMap[currentStrategy] || RECOVERY_STRATEGIES.EMERGENCY_MODE
  }

  initializeCircuitBreakers() {
    for (const category of Object.values(ERROR_CATEGORIES)) {
      this.circuitBreakers.set(category, {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
        threshold: 5,
        timeout: 60000 // 1 minute
      })
    }
  }

  updateCircuitBreaker(category, success) {
    const breaker = this.circuitBreakers.get(category)
    if (!breaker) return

    if (success) {
      breaker.failures = 0
      breaker.isOpen = false
    } else {
      breaker.failures++
      breaker.lastFailure = Date.now()
      if (breaker.failures >= breaker.threshold) {
        breaker.isOpen = true
      }
    }
  }

  isCircuitBreakerOpen(category) {
    const breaker = this.circuitBreakers.get(category)
    if (!breaker || !breaker.isOpen) return false

    // Check if timeout period has passed
    if (Date.now() - breaker.lastFailure > breaker.timeout) {
      breaker.isOpen = false
      return false
    }

    return true
  }

  getErrorCategory(error) {
    const classification = this.classifyError(error, {})
    return classification.category
  }

  /**
   * Get comprehensive recovery statistics
   */
  getStats() {
    return {
      currentState: this.currentState,
      isRecovering: this.isRecovering,
      gracefulDegradationActive: this.gracefulDegradationActive,
      emergencyModeActive: this.emergencyModeActive,
      monitoringActive: this.monitoringActive,
      lastHealthCheck: this.lastHealthCheck,
      metrics: { ...this.metrics },
      recentErrors: this.errorHistory.slice(-10),
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([key, breaker]) => [
          key,
          {
            failures: breaker.failures,
            isOpen: breaker.isOpen,
            lastFailure: breaker.lastFailure
          }
        ])
      ),
      recoveryAttempts: Object.fromEntries(this.recoveryAttempts)
    }
  }

  /**
   * Cleanup and destroy recovery system
   */
  destroy() {
    this.stopMonitoring()
    this.errorHistory.length = 0
    this.recoveryAttempts.clear()
    this.circuitBreakers.clear()
    this.recoveryStrategies.clear()
    this.errorClassifiers.clear()

    if (typeof window !== 'undefined' && this.errorListenersRegistered) {
      window.removeEventListener('error', this.boundGlobalErrorHandler)
      window.removeEventListener('unhandledrejection', this.boundUnhandledRejectionHandler)
      this.errorListenersRegistered = false
      this.boundGlobalErrorHandler = null
      this.boundUnhandledRejectionHandler = null
    }

    this.isInitialized = false
    this.initializationPromise = null

    logger.info('destroy', 'AutoRecoverySystem destroyed')
  }
}

// Global singleton instance
let recoverySystemInstance = null

/**
 * Get or create the global recovery system instance
 */
export function getRecoverySystem() {
  if (!recoverySystemInstance) {
    recoverySystemInstance = new AutoRecoverySystem()
  }
  return recoverySystemInstance
}

/**
 * Initialize recovery system if not already done
 */
export async function initializeRecoverySystem() {
  const recovery = getRecoverySystem()
  if (!recovery.isInitialized) {
    await recovery.initialize()
  }
  return recovery
}

/**
 * Handle error with automatic recovery
 */
export async function handleErrorWithRecovery(error, context) {
  const recovery = getRecoverySystem()
  return recovery.handleError(error, context)
}

/**
 * Get recovery system statistics
 */
export function getRecoveryStats() {
  const recovery = getRecoverySystem()
  return recovery.getStats()
}

/**
 * Force emergency mode activation
 */
export async function activateEmergencyMode() {
  const recovery = getRecoverySystem()
  await recovery.activateEmergencyMode()
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  const recovery = getRecoverySystem()
  if (!recovery.isInitialized) {
    initializeRecoverySystem().catch(error => {
      console.error('Failed to auto-initialize AutoRecoverySystem:', error)
    })
  }
}