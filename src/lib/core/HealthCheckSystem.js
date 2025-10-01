/**
 * HealthCheckSystem.js - Sistema de monitoreo proactivo y chequeos de salud
 *
 * Este sistema proporciona monitoreo continuo y proactivo de la salud del sistema:
 * - Health checks programados automáticamente
 * - Métricas de performance en tiempo real
 * - Detección temprana de problemas
 * - Alertas proactivas basadas en tendencias
 * - Dashboard de salud del sistema
 * - Predicción de fallos
 * - Reporting automático
 * - Integration con sistema de auto-recovery
 */

import { getRedundancyManager } from './VerbDataRedundancyManager.js'
import { getIntegrityGuard } from './DataIntegrityGuard.js'
import { getOrchestrator } from './CacheOrchestrator.js'
import { getRecoverySystem } from './AutoRecoverySystem.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('HealthCheck')

// Health check types
const CHECK_TYPES = {
  SYSTEM_OVERVIEW: 'system_overview',
  DATA_INTEGRITY: 'data_integrity',
  CACHE_PERFORMANCE: 'cache_performance',
  MEMORY_USAGE: 'memory_usage',
  ERROR_RATES: 'error_rates',
  PERFORMANCE_METRICS: 'performance_metrics',
  REDUNDANCY_STATUS: 'redundancy_status',
  RECOVERY_READINESS: 'recovery_readiness'
}

// Health status levels
const HEALTH_STATUS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  WARNING: 'warning',
  CRITICAL: 'critical',
  FAILURE: 'failure'
}

// Alert types
const ALERT_TYPES = {
  PERFORMANCE_DEGRADATION: 'performance_degradation',
  MEMORY_PRESSURE: 'memory_pressure',
  HIGH_ERROR_RATE: 'high_error_rate',
  CACHE_MISS_SPIKE: 'cache_miss_spike',
  DATA_CORRUPTION: 'data_corruption',
  SYSTEM_OVERLOAD: 'system_overload',
  RECOVERY_FAILURE: 'recovery_failure',
  PREDICTIVE_WARNING: 'predictive_warning'
}

class HealthCheckSystem {
  constructor() {
    this.isActive = false
    this.checkIntervals = new Map()
    this.healthHistory = []
    this.alertHistory = []
    this.metrics = new Map()
    this.thresholds = new Map()
    this.subscribers = new Set()
    this.predictiveModels = new Map()
    this.lastFullCheck = null
    this.mainInterval = null
    this.quickCheckInterval = null
    this.alertCooldowns = new Map()
    this.trendAnalysis = {
      performanceDegrade: false,
      memoryGrowth: false,
      errorIncrease: false,
      cacheEfficiencyDrop: false
    }

    this.setupDefaultThresholds()
    this.setupPredictiveModels()
  }

  /**
   * Initialize health check system
   */
  async initialize() {
    logger.info('initialize', '🏥 Initializing HealthCheckSystem...')

    try {
      // Setup check intervals
      this.setupCheckSchedules()

      // Perform initial full health check
      const initialHealth = await this.performFullHealthCheck()

      // Start continuous monitoring
      this.startContinuousMonitoring()

      this.isActive = true

      logger.info('initialize', '✅ HealthCheckSystem initialized successfully', {
        initialStatus: initialHealth.overallStatus,
        checksScheduled: this.checkIntervals.size
      })

      // Send initialization notification
      this.notifySubscribers({
        type: 'system_initialized',
        status: initialHealth.overallStatus,
        timestamp: new Date()
      })

      return initialHealth

    } catch (error) {
      logger.error('initialize', 'Failed to initialize HealthCheckSystem', error)
      throw error
    }
  }

  /**
   * Perform comprehensive health check
   */
  async performFullHealthCheck() {
    const startTime = performance.now()
    logger.info('performFullHealthCheck', '🔍 Performing comprehensive health check...')

    const healthReport = {
      timestamp: new Date(),
      overallStatus: HEALTH_STATUS.GOOD,
      checks: {},
      metrics: {},
      alerts: [],
      recommendations: [],
      checkDuration: 0
    }

    try {
      // Run all health checks
      for (const checkType of Object.values(CHECK_TYPES)) {
        try {
          const checkResult = await this.runHealthCheck(checkType)
          healthReport.checks[checkType] = checkResult

          // Collect metrics
          if (checkResult.metrics) {
            Object.assign(healthReport.metrics, checkResult.metrics)
          }

          // Collect alerts
          if (checkResult.alerts) {
            healthReport.alerts.push(...checkResult.alerts)
          }

          // Collect recommendations
          if (checkResult.recommendations) {
            healthReport.recommendations.push(...checkResult.recommendations)
          }

        } catch (checkError) {
          logger.warn('performFullHealthCheck', `Check ${checkType} failed`, checkError)
          healthReport.checks[checkType] = {
            status: HEALTH_STATUS.FAILURE,
            error: checkError.message,
            timestamp: new Date()
          }
        }
      }

      // Determine overall status
      healthReport.overallStatus = this.calculateOverallStatus(healthReport.checks)

      // Perform trend analysis
      const trends = this.analyzeTrends(healthReport)
      healthReport.trends = trends

      // Generate predictive insights
      const predictions = this.generatePredictions(healthReport)
      healthReport.predictions = predictions

      // Record check duration
      healthReport.checkDuration = performance.now() - startTime

      // Store in history
      this.recordHealthCheck(healthReport)

      // Process alerts
      await this.processAlerts(healthReport.alerts)

      this.lastFullCheck = new Date()

      logger.info('performFullHealthCheck', `✅ Health check completed: ${healthReport.overallStatus}`, {
        duration: `${healthReport.checkDuration.toFixed(2)}ms`,
        alertsFound: healthReport.alerts.length,
        recommendations: healthReport.recommendations.length
      })

      return healthReport

    } catch (error) {
      logger.error('performFullHealthCheck', 'Health check failed', error)
      healthReport.overallStatus = HEALTH_STATUS.FAILURE
      healthReport.error = error.message
      return healthReport
    }
  }

  /**
   * Run specific health check
   */
  async runHealthCheck(checkType) {
    switch (checkType) {
      case CHECK_TYPES.SYSTEM_OVERVIEW:
        return this.checkSystemOverview()

      case CHECK_TYPES.DATA_INTEGRITY:
        return this.checkDataIntegrity()

      case CHECK_TYPES.CACHE_PERFORMANCE:
        return this.checkCachePerformance()

      case CHECK_TYPES.MEMORY_USAGE:
        return this.checkMemoryUsage()

      case CHECK_TYPES.ERROR_RATES:
        return this.checkErrorRates()

      case CHECK_TYPES.PERFORMANCE_METRICS:
        return this.checkPerformanceMetrics()

      case CHECK_TYPES.REDUNDANCY_STATUS:
        return this.checkRedundancyStatus()

      case CHECK_TYPES.RECOVERY_READINESS:
        return this.checkRecoveryReadiness()

      default:
        throw new Error(`Unknown check type: ${checkType}`)
    }
  }

  /**
   * Check system overview
   */
  async checkSystemOverview() {
    const result = {
      status: HEALTH_STATUS.GOOD,
      metrics: {},
      alerts: [],
      recommendations: [],
      timestamp: new Date()
    }

    try {
      // Check if core components are initialized
      const components = {
        redundancyManager: false,
        integrityGuard: false,
        cacheOrchestrator: false,
        recoverySystem: false
      }

      try {
        const redundancyManager = getRedundancyManager()
        components.redundancyManager = !!redundancyManager.currentLayer
      } catch (e) { /* component not available */ }

      try {
        const integrityGuard = getIntegrityGuard()
        components.integrityGuard = !!integrityGuard.validationMetrics
      } catch (e) { /* component not available */ }

      try {
        const orchestrator = getOrchestrator()
        components.cacheOrchestrator = orchestrator.isInitialized
      } catch (e) { /* component not available */ }

      try {
        const recovery = getRecoverySystem()
        components.recoverySystem = recovery.monitoringActive
      } catch (e) { /* component not available */ }

      const healthyComponents = Object.values(components).filter(Boolean).length
      const totalComponents = Object.keys(components).length

      result.metrics.componentHealth = {
        healthy: healthyComponents,
        total: totalComponents,
        percentage: (healthyComponents / totalComponents * 100).toFixed(1)
      }

      result.metrics.components = components

      // Determine status
      if (healthyComponents === totalComponents) {
        result.status = HEALTH_STATUS.EXCELLENT
      } else if (healthyComponents >= totalComponents * 0.75) {
        result.status = HEALTH_STATUS.GOOD
      } else if (healthyComponents >= totalComponents * 0.5) {
        result.status = HEALTH_STATUS.WARNING
        result.alerts.push({
          type: ALERT_TYPES.SYSTEM_OVERLOAD,
          severity: 'medium',
          message: `Only ${healthyComponents}/${totalComponents} core components are healthy`
        })
      } else {
        result.status = HEALTH_STATUS.CRITICAL
        result.alerts.push({
          type: ALERT_TYPES.SYSTEM_OVERLOAD,
          severity: 'high',
          message: `Critical: Only ${healthyComponents}/${totalComponents} core components are healthy`
        })
      }

      return result

    } catch (error) {
      result.status = HEALTH_STATUS.FAILURE
      result.error = error.message
      return result
    }
  }

  /**
   * Check data integrity
   */
  async checkDataIntegrity() {
    const result = {
      status: HEALTH_STATUS.GOOD,
      metrics: {},
      alerts: [],
      recommendations: [],
      timestamp: new Date()
    }

    try {
      const integrityGuard = getIntegrityGuard()
      const stats = integrityGuard.getIntegrityStats()

      result.metrics.integrity = {
        totalValidations: stats.validationMetrics.totalValidations,
        passedValidations: stats.validationMetrics.passedValidations,
        failedValidations: stats.validationMetrics.failedValidations,
        healingAttempts: stats.validationMetrics.healingAttempts,
        successfulHealings: stats.validationMetrics.successfulHealings,
        averageValidationTime: stats.validationMetrics.averageValidationTime
      }

      // Calculate integrity score
      const totalValidations = stats.validationMetrics.totalValidations
      if (totalValidations > 0) {
        const successRate = (stats.validationMetrics.passedValidations / totalValidations) * 100
        result.metrics.integrity.successRate = successRate.toFixed(1)

        if (successRate >= 95) {
          result.status = HEALTH_STATUS.EXCELLENT
        } else if (successRate >= 90) {
          result.status = HEALTH_STATUS.GOOD
        } else if (successRate >= 80) {
          result.status = HEALTH_STATUS.WARNING
          result.alerts.push({
            type: ALERT_TYPES.DATA_CORRUPTION,
            severity: 'medium',
            message: `Data integrity success rate: ${successRate.toFixed(1)}%`
          })
        } else {
          result.status = HEALTH_STATUS.CRITICAL
          result.alerts.push({
            type: ALERT_TYPES.DATA_CORRUPTION,
            severity: 'high',
            message: `Critical data integrity issues: ${successRate.toFixed(1)}% success rate`
          })
        }
      }

      // Check healing effectiveness
      if (stats.validationMetrics.healingAttempts > 0) {
        const healingRate = (stats.validationMetrics.successfulHealings / stats.validationMetrics.healingAttempts) * 100
        result.metrics.integrity.healingRate = healingRate.toFixed(1)

        if (healingRate < 70) {
          result.recommendations.push('Consider improving data healing strategies - low success rate')
        }
      }

      return result

    } catch (error) {
      result.status = HEALTH_STATUS.FAILURE
      result.error = error.message
      return result
    }
  }

  /**
   * Check cache performance
   */
  async checkCachePerformance() {
    const result = {
      status: HEALTH_STATUS.GOOD,
      metrics: {},
      alerts: [],
      recommendations: [],
      timestamp: new Date()
    }

    try {
      const orchestrator = getOrchestrator()
      const stats = orchestrator.getStats()

      result.metrics.cache = {
        strategy: stats.strategy,
        health: stats.health,
        memoryPressureActive: stats.memoryPressureActive,
        isPreloading: stats.isPreloading,
        preloadingQueueSize: stats.preloadingQueueSize
      }

      // Analyze cache hit rates
      const cacheStats = {}
      let totalHits = 0
      let totalMisses = 0

      for (const [cacheType, cacheInfo] of Object.entries(stats.caches)) {
        if (cacheInfo.detailed) {
          const hitRate = parseFloat(cacheInfo.detailed.hitRate) || 0
          cacheStats[cacheType] = {
            hitRate,
            size: cacheInfo.detailed.size,
            maxSize: cacheInfo.detailed.maxSize
          }

          totalHits += cacheInfo.detailed.hits || 0
          totalMisses += cacheInfo.detailed.misses || 0
        }
      }

      if (totalHits + totalMisses > 0) {
        const overallHitRate = (totalHits / (totalHits + totalMisses)) * 100
        result.metrics.cache.overallHitRate = overallHitRate.toFixed(1)

        if (overallHitRate >= 80) {
          result.status = HEALTH_STATUS.EXCELLENT
        } else if (overallHitRate >= 60) {
          result.status = HEALTH_STATUS.GOOD
        } else if (overallHitRate >= 40) {
          result.status = HEALTH_STATUS.WARNING
          result.alerts.push({
            type: ALERT_TYPES.CACHE_MISS_SPIKE,
            severity: 'medium',
            message: `Low cache hit rate: ${overallHitRate.toFixed(1)}%`
          })
        } else {
          result.status = HEALTH_STATUS.CRITICAL
          result.alerts.push({
            type: ALERT_TYPES.CACHE_MISS_SPIKE,
            severity: 'high',
            message: `Critical cache performance: ${overallHitRate.toFixed(1)}% hit rate`
          })
        }
      }

      result.metrics.cache.individual = cacheStats

      // Check memory pressure
      if (stats.memoryPressureActive) {
        result.alerts.push({
          type: ALERT_TYPES.MEMORY_PRESSURE,
          severity: 'high',
          message: 'Memory pressure is currently active'
        })
      }

      return result

    } catch (error) {
      result.status = HEALTH_STATUS.FAILURE
      result.error = error.message
      return result
    }
  }

  /**
   * Check memory usage
   */
  async checkMemoryUsage() {
    const result = {
      status: HEALTH_STATUS.GOOD,
      metrics: {},
      alerts: [],
      recommendations: [],
      timestamp: new Date()
    }

    try {
      if (typeof performance !== 'undefined' && performance.memory) {
        const memory = performance.memory
        const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

        result.metrics.memory = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          usagePercentage: usagePercentage.toFixed(1)
        }

        if (usagePercentage < 60) {
          result.status = HEALTH_STATUS.EXCELLENT
        } else if (usagePercentage < 75) {
          result.status = HEALTH_STATUS.GOOD
        } else if (usagePercentage < 85) {
          result.status = HEALTH_STATUS.WARNING
          result.alerts.push({
            type: ALERT_TYPES.MEMORY_PRESSURE,
            severity: 'medium',
            message: `Memory usage: ${usagePercentage.toFixed(1)}%`
          })
        } else {
          result.status = HEALTH_STATUS.CRITICAL
          result.alerts.push({
            type: ALERT_TYPES.MEMORY_PRESSURE,
            severity: 'high',
            message: `Critical memory usage: ${usagePercentage.toFixed(1)}%`
          })
        }

        // Recommendations based on usage
        if (usagePercentage > 80) {
          result.recommendations.push('Consider clearing non-essential caches to free memory')
        }

      } else {
        result.metrics.memory = { available: false }
        result.recommendations.push('Memory monitoring not available - consider using a supporting browser')
      }

      return result

    } catch (error) {
      result.status = HEALTH_STATUS.FAILURE
      result.error = error.message
      return result
    }
  }

  /**
   * Check error rates
   */
  async checkErrorRates() {
    const result = {
      status: HEALTH_STATUS.GOOD,
      metrics: {},
      alerts: [],
      recommendations: [],
      timestamp: new Date()
    }

    try {
      const recovery = getRecoverySystem()
      const recoveryStats = recovery.getStats()

      result.metrics.errors = {
        totalErrors: recoveryStats.metrics.totalErrors,
        recoveryAttempts: recoveryStats.metrics.recoveryAttempts,
        successfulRecoveries: recoveryStats.metrics.successfulRecoveries,
        failedRecoveries: recoveryStats.metrics.failedRecoveries,
        averageRecoveryTime: recoveryStats.metrics.averageRecoveryTime,
        recentErrors: recoveryStats.recentErrors.length
      }

      // Calculate error rates
      const recentErrors = recoveryStats.recentErrors.length
      const recoveryAttempts = recoveryStats.metrics.recoveryAttempts

      if (recoveryAttempts > 0) {
        const recoverySuccessRate = (recoveryStats.metrics.successfulRecoveries / recoveryAttempts) * 100
        result.metrics.errors.recoverySuccessRate = recoverySuccessRate.toFixed(1)

        if (recoverySuccessRate >= 90) {
          result.status = HEALTH_STATUS.EXCELLENT
        } else if (recoverySuccessRate >= 75) {
          result.status = HEALTH_STATUS.GOOD
        } else if (recoverySuccessRate >= 50) {
          result.status = HEALTH_STATUS.WARNING
          result.alerts.push({
            type: ALERT_TYPES.RECOVERY_FAILURE,
            severity: 'medium',
            message: `Recovery success rate: ${recoverySuccessRate.toFixed(1)}%`
          })
        } else {
          result.status = HEALTH_STATUS.CRITICAL
          result.alerts.push({
            type: ALERT_TYPES.RECOVERY_FAILURE,
            severity: 'high',
            message: `Critical recovery failure rate: ${recoverySuccessRate.toFixed(1)}%`
          })
        }
      }

      // Check recent error spike
      if (recentErrors > 5) {
        result.alerts.push({
          type: ALERT_TYPES.HIGH_ERROR_RATE,
          severity: 'medium',
          message: `High recent error count: ${recentErrors}`
        })
      }

      return result

    } catch (error) {
      result.status = HEALTH_STATUS.FAILURE
      result.error = error.message
      return result
    }
  }

  /**
   * Check performance metrics
   */
  async checkPerformanceMetrics() {
    const result = {
      status: HEALTH_STATUS.GOOD,
      metrics: {},
      alerts: [],
      recommendations: [],
      timestamp: new Date()
    }

    try {
      // Gather performance metrics from various sources
      const orchestrator = getOrchestrator()
      const orchestratorStats = orchestrator.getStats()

      const recovery = getRecoverySystem()
      const recoveryStats = recovery.getStats()

      result.metrics.performance = {
        averageRecoveryTime: recoveryStats.metrics.averageRecoveryTime,
        systemState: recoveryStats.currentState,
        cacheStrategy: orchestratorStats.strategy,
        cacheHealth: orchestratorStats.health
      }

      // Performance thresholds
      const avgRecoveryTime = recoveryStats.metrics.averageRecoveryTime

      if (avgRecoveryTime < 1000) { // < 1 second
        result.status = HEALTH_STATUS.EXCELLENT
      } else if (avgRecoveryTime < 5000) { // < 5 seconds
        result.status = HEALTH_STATUS.GOOD
      } else if (avgRecoveryTime < 10000) { // < 10 seconds
        result.status = HEALTH_STATUS.WARNING
        result.alerts.push({
          type: ALERT_TYPES.PERFORMANCE_DEGRADATION,
          severity: 'medium',
          message: `Slow recovery times: ${avgRecoveryTime.toFixed(0)}ms average`
        })
      } else {
        result.status = HEALTH_STATUS.CRITICAL
        result.alerts.push({
          type: ALERT_TYPES.PERFORMANCE_DEGRADATION,
          severity: 'high',
          message: `Critical performance: ${avgRecoveryTime.toFixed(0)}ms recovery time`
        })
      }

      return result

    } catch (error) {
      result.status = HEALTH_STATUS.FAILURE
      result.error = error.message
      return result
    }
  }

  /**
   * Check redundancy status
   */
  async checkRedundancyStatus() {
    const result = {
      status: HEALTH_STATUS.GOOD,
      metrics: {},
      alerts: [],
      recommendations: [],
      timestamp: new Date()
    }

    try {
      const redundancyManager = getRedundancyManager()
      const stats = redundancyManager.getStats()

      result.metrics.redundancy = {
        currentLayer: stats.currentLayer,
        healthState: stats.healthState,
        verbCount: stats.verbCount,
        circuitBreakerOpen: stats.circuitBreakerOpen,
        failureCount: stats.failureCount,
        recoveryAttempts: stats.recoveryAttempts,
        layerHealth: stats.layerHealth
      }

      // Assess redundancy health
      if (stats.healthState === 'healthy') {
        result.status = HEALTH_STATUS.EXCELLENT
      } else if (stats.healthState === 'degraded') {
        result.status = HEALTH_STATUS.WARNING
        result.alerts.push({
          type: ALERT_TYPES.SYSTEM_OVERLOAD,
          severity: 'medium',
          message: `Redundancy system degraded, using layer: ${stats.currentLayer}`
        })
      } else if (stats.healthState === 'critical') {
        result.status = HEALTH_STATUS.CRITICAL
        result.alerts.push({
          type: ALERT_TYPES.SYSTEM_OVERLOAD,
          severity: 'high',
          message: `Critical redundancy state, using layer: ${stats.currentLayer}`
        })
      } else if (stats.healthState === 'emergency') {
        result.status = HEALTH_STATUS.FAILURE
        result.alerts.push({
          type: ALERT_TYPES.SYSTEM_OVERLOAD,
          severity: 'critical',
          message: 'Emergency redundancy mode active - minimal functionality'
        })
      }

      // Check circuit breaker
      if (stats.circuitBreakerOpen) {
        result.alerts.push({
          type: ALERT_TYPES.SYSTEM_OVERLOAD,
          severity: 'high',
          message: 'Redundancy circuit breaker is open'
        })
      }

      return result

    } catch (error) {
      result.status = HEALTH_STATUS.FAILURE
      result.error = error.message
      return result
    }
  }

  /**
   * Check recovery readiness
   */
  async checkRecoveryReadiness() {
    const result = {
      status: HEALTH_STATUS.GOOD,
      metrics: {},
      alerts: [],
      recommendations: [],
      timestamp: new Date()
    }

    try {
      const recovery = getRecoverySystem()
      const stats = recovery.getStats()

      result.metrics.recovery = {
        currentState: stats.currentState,
        isRecovering: stats.isRecovering,
        gracefulDegradationActive: stats.gracefulDegradationActive,
        emergencyModeActive: stats.emergencyModeActive,
        monitoringActive: stats.monitoringActive,
        circuitBreakers: Object.keys(stats.circuitBreakers).length
      }

      // Check recovery system state
      if (stats.currentState === 'healthy') {
        result.status = HEALTH_STATUS.EXCELLENT
      } else if (stats.currentState === 'degraded') {
        result.status = HEALTH_STATUS.WARNING
      } else if (stats.currentState === 'critical') {
        result.status = HEALTH_STATUS.CRITICAL
      } else if (stats.currentState === 'emergency' || stats.currentState === 'offline') {
        result.status = HEALTH_STATUS.FAILURE
      }

      // Check for active emergency states
      if (stats.emergencyModeActive) {
        result.alerts.push({
          type: ALERT_TYPES.SYSTEM_OVERLOAD,
          severity: 'critical',
          message: 'Emergency mode is currently active'
        })
      }

      if (stats.gracefulDegradationActive) {
        result.alerts.push({
          type: ALERT_TYPES.PERFORMANCE_DEGRADATION,
          severity: 'medium',
          message: 'Graceful degradation is active'
        })
      }

      // Check monitoring status
      if (!stats.monitoringActive) {
        result.alerts.push({
          type: ALERT_TYPES.SYSTEM_OVERLOAD,
          severity: 'high',
          message: 'Recovery system monitoring is not active'
        })
        result.recommendations.push('Restart recovery system monitoring')
      }

      return result

    } catch (error) {
      result.status = HEALTH_STATUS.FAILURE
      result.error = error.message
      return result
    }
  }

  /**
   * Calculate overall system status
   */
  calculateOverallStatus(checks) {
    const statuses = Object.values(checks).map(check => check.status)
    const statusWeights = {
      [HEALTH_STATUS.EXCELLENT]: 5,
      [HEALTH_STATUS.GOOD]: 4,
      [HEALTH_STATUS.WARNING]: 3,
      [HEALTH_STATUS.CRITICAL]: 2,
      [HEALTH_STATUS.FAILURE]: 1
    }

    const totalWeight = statuses.reduce((sum, status) => sum + (statusWeights[status] || 1), 0)
    const averageWeight = totalWeight / statuses.length

    if (averageWeight >= 4.5) return HEALTH_STATUS.EXCELLENT
    if (averageWeight >= 3.5) return HEALTH_STATUS.GOOD
    if (averageWeight >= 2.5) return HEALTH_STATUS.WARNING
    if (averageWeight >= 1.5) return HEALTH_STATUS.CRITICAL
    return HEALTH_STATUS.FAILURE
  }

  /**
   * Analyze trends over time
   */
  analyzeTrends(currentReport) {
    const trends = { ...this.trendAnalysis }

    if (this.healthHistory.length >= 3) {
      const recent = this.healthHistory.slice(-3)

      // Performance trend
      const perfMetrics = recent.map(h => h.metrics.performance?.averageRecoveryTime || 0)
      trends.performanceDegrade = this.isIncreasingTrend(perfMetrics)

      // Memory trend
      const memoryMetrics = recent.map(h => parseFloat(h.metrics.memory?.usagePercentage) || 0)
      trends.memoryGrowth = this.isIncreasingTrend(memoryMetrics)

      // Error trend
      const errorMetrics = recent.map(h => h.metrics.errors?.recentErrors || 0)
      trends.errorIncrease = this.isIncreasingTrend(errorMetrics)

      // Cache efficiency trend
      const cacheMetrics = recent.map(h => parseFloat(h.metrics.cache?.overallHitRate) || 0)
      trends.cacheEfficiencyDrop = this.isDecreasingTrend(cacheMetrics)
    }

    this.trendAnalysis = trends
    return trends
  }

  /**
   * Generate predictive insights
   */
  generatePredictions(currentReport) {
    const predictions = []

    // Memory pressure prediction
    if (this.trendAnalysis.memoryGrowth) {
      predictions.push({
        type: ALERT_TYPES.PREDICTIVE_WARNING,
        severity: 'medium',
        message: 'Memory usage trending upward - potential pressure in next 5-10 minutes',
        confidence: 0.7,
        timeframe: '5-10 minutes'
      })
    }

    // Performance degradation prediction
    if (this.trendAnalysis.performanceDegrade && this.trendAnalysis.cacheEfficiencyDrop) {
      predictions.push({
        type: ALERT_TYPES.PREDICTIVE_WARNING,
        severity: 'high',
        message: 'Performance degradation pattern detected - system may require intervention',
        confidence: 0.8,
        timeframe: '1-3 minutes'
      })
    }

    // Error spike prediction
    if (this.trendAnalysis.errorIncrease) {
      predictions.push({
        type: ALERT_TYPES.PREDICTIVE_WARNING,
        severity: 'medium',
        message: 'Error rate increasing - potential system instability ahead',
        confidence: 0.6,
        timeframe: '2-5 minutes'
      })
    }

    return predictions
  }

  /**
   * Setup monitoring schedules
   */
  setupCheckSchedules() {
    // Full health check every 2 minutes
    this.checkIntervals.set('full', 120000)

    // Quick checks every 30 seconds
    this.checkIntervals.set('quick', 30000)

    // Memory check every 15 seconds
    this.checkIntervals.set('memory', 15000)
  }

  /**
   * Start continuous monitoring
   */
  startContinuousMonitoring() {
    // Full health check interval
    this.mainInterval = setInterval(() => {
      this.performFullHealthCheck()
    }, this.checkIntervals.get('full'))

    // Quick health checks
    this.quickCheckInterval = setInterval(() => {
      this.performQuickHealthCheck()
    }, this.checkIntervals.get('quick'))

    logger.info('startContinuousMonitoring', 'Continuous health monitoring started')
  }

  /**
   * Stop continuous monitoring
   */
  stopContinuousMonitoring() {
    if (this.mainInterval) {
      clearInterval(this.mainInterval)
      this.mainInterval = null
    }

    if (this.quickCheckInterval) {
      clearInterval(this.quickCheckInterval)
      this.quickCheckInterval = null
    }

    logger.info('stopContinuousMonitoring', 'Continuous health monitoring stopped')
  }

  /**
   * Perform quick health check (subset of full check)
   */
  async performQuickHealthCheck() {
    try {
      const quickChecks = [
        CHECK_TYPES.MEMORY_USAGE,
        CHECK_TYPES.ERROR_RATES,
        CHECK_TYPES.SYSTEM_OVERVIEW
      ]

      const alerts = []

      for (const checkType of quickChecks) {
        const result = await this.runHealthCheck(checkType)
        if (result.alerts) {
          alerts.push(...result.alerts)
        }
      }

      if (alerts.length > 0) {
        await this.processAlerts(alerts)
      }

    } catch (error) {
      logger.warn('performQuickHealthCheck', 'Quick health check failed', error)
    }
  }

  /**
   * Process and handle alerts
   */
  async processAlerts(alerts) {
    for (const alert of alerts) {
      // Check cooldown to prevent spam
      const cooldownKey = `${alert.type}:${alert.severity}`
      const lastAlert = this.alertCooldowns.get(cooldownKey)
      const cooldownPeriod = this.getCooldownPeriod(alert.severity)

      if (lastAlert && Date.now() - lastAlert < cooldownPeriod) {
        continue // Skip due to cooldown
      }

      // Record alert
      this.recordAlert(alert)

      // Set cooldown
      this.alertCooldowns.set(cooldownKey, Date.now())

      // Notify subscribers
      this.notifySubscribers({
        type: 'alert',
        alert,
        timestamp: new Date()
      })

      // Take automatic action for critical alerts
      if (alert.severity === 'critical' || alert.severity === 'high') {
        await this.handleCriticalAlert(alert)
      }
    }
  }

  /**
   * Handle critical alerts automatically
   */
  async handleCriticalAlert(alert) {
    logger.warn('handleCriticalAlert', `Handling critical alert: ${alert.type}`, alert)

    try {
      const recovery = getRecoverySystem()

      // Create appropriate error for recovery system
      const error = new Error(`Critical alert: ${alert.message}`)
      await recovery.handleError(error, {
        alertType: alert.type,
        severity: alert.severity,
        automatic: true
      })

    } catch (recoveryError) {
      logger.error('handleCriticalAlert', 'Failed to handle critical alert', recoveryError)
    }
  }

  /**
   * Subscribe to health notifications
   */
  subscribe(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify all subscribers
   */
  notifySubscribers(notification) {
    for (const callback of this.subscribers) {
      try {
        callback(notification)
      } catch (error) {
        logger.warn('notifySubscribers', 'Subscriber callback failed', error)
      }
    }
  }

  // Utility methods
  setupDefaultThresholds() {
    this.thresholds.set('memory_usage', 85)
    this.thresholds.set('cache_hit_rate', 60)
    this.thresholds.set('error_rate', 10)
    this.thresholds.set('recovery_time', 5000)
  }

  setupPredictiveModels() {
    // Simple trend-based models
    this.predictiveModels.set('memory_pressure', {
      type: 'linear_trend',
      lookback: 5,
      threshold: 80
    })
  }

  recordHealthCheck(report) {
    this.healthHistory.push(report)

    // Keep only last 20 health checks
    if (this.healthHistory.length > 20) {
      this.healthHistory.shift()
    }
  }

  recordAlert(alert) {
    this.alertHistory.push({
      ...alert,
      timestamp: new Date()
    })

    // Keep only last 50 alerts
    if (this.alertHistory.length > 50) {
      this.alertHistory.shift()
    }
  }

  getCooldownPeriod(severity) {
    const cooldowns = {
      low: 300000,      // 5 minutes
      medium: 120000,   // 2 minutes
      high: 60000,      // 1 minute
      critical: 30000   // 30 seconds
    }
    return cooldowns[severity] || cooldowns.medium
  }

  isIncreasingTrend(values) {
    if (values.length < 2) return false
    let increases = 0
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i-1]) increases++
    }
    return increases >= values.length / 2
  }

  isDecreasingTrend(values) {
    if (values.length < 2) return false
    let decreases = 0
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i-1]) decreases++
    }
    return decreases >= values.length / 2
  }

  /**
   * Get comprehensive health statistics
   */
  getStats() {
    return {
      isActive: this.isActive,
      lastFullCheck: this.lastFullCheck,
      healthHistory: this.healthHistory.slice(-5), // Last 5 checks
      alertHistory: this.alertHistory.slice(-10), // Last 10 alerts
      trendAnalysis: this.trendAnalysis,
      activeSubscribers: this.subscribers.size,
      checkIntervals: Object.fromEntries(this.checkIntervals),
      thresholds: Object.fromEntries(this.thresholds)
    }
  }

  /**
   * Get current system health summary
   */
  getCurrentHealth() {
    const lastCheck = this.healthHistory[this.healthHistory.length - 1]
    if (!lastCheck) {
      return {
        status: HEALTH_STATUS.WARNING,
        message: 'No health data available'
      }
    }

    return {
      status: lastCheck.overallStatus,
      timestamp: lastCheck.timestamp,
      checkDuration: lastCheck.checkDuration,
      alertCount: lastCheck.alerts.length,
      trends: lastCheck.trends
    }
  }

  /**
   * Force immediate health check
   */
  async forceHealthCheck() {
    logger.info('forceHealthCheck', 'Forcing immediate health check')
    return this.performFullHealthCheck()
  }

  /**
   * Cleanup and destroy health check system
   */
  destroy() {
    this.stopContinuousMonitoring()
    this.healthHistory.length = 0
    this.alertHistory.length = 0
    this.subscribers.clear()
    this.alertCooldowns.clear()
    this.isActive = false

    logger.info('destroy', 'HealthCheckSystem destroyed')
  }
}

// Global singleton instance
let healthCheckInstance = null

/**
 * Get or create the global health check instance
 */
export function getHealthCheckSystem() {
  if (!healthCheckInstance) {
    healthCheckInstance = new HealthCheckSystem()
  }
  return healthCheckInstance
}

/**
 * Initialize health check system if not already done
 */
export async function initializeHealthCheckSystem() {
  const healthCheck = getHealthCheckSystem()
  if (!healthCheck.isActive) {
    await healthCheck.initialize()
  }
  return healthCheck
}

/**
 * Get current system health
 */
export function getCurrentSystemHealth() {
  const healthCheck = getHealthCheckSystem()
  return healthCheck.getCurrentHealth()
}

/**
 * Subscribe to health notifications
 */
export function subscribeToHealthUpdates(callback) {
  const healthCheck = getHealthCheckSystem()
  return healthCheck.subscribe(callback)
}

/**
 * Force immediate health check
 */
export async function forceSystemHealthCheck() {
  const healthCheck = getHealthCheckSystem()
  return healthCheck.forceHealthCheck()
}

/**
 * Get health check statistics
 */
export function getHealthCheckStats() {
  const healthCheck = getHealthCheckSystem()
  return healthCheck.getStats()
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  initializeHealthCheckSystem().catch(error => {
    console.error('Failed to auto-initialize HealthCheckSystem:', error)
  })
}