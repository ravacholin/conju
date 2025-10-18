// Framework A/B Testing para comparación de algoritmos SRS
// Permite probar FSRS vs SM-2 y otras funcionalidades de manera controlada

import { PROGRESS_CONFIG } from './config.js'
import { getCurrentUserId } from './userManager/index.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:abTesting')

/**
 * Manager de A/B Testing para experimentos de SRS
 */
export class ABTestingManager {
  constructor() {
    this.config = PROGRESS_CONFIG.AB_TESTING
    this.isEnabled = PROGRESS_CONFIG.FEATURE_FLAGS.A_B_TESTING

    // Experimentos activos
    this.activeExperiments = new Map()

    // Métricas de seguimiento
    this.metrics = new Map()

    // Storage keys
    this.storageKeys = {
      userGroups: 'ab_testing_user_groups',
      experimentData: 'ab_testing_experiment_data',
      metrics: 'ab_testing_metrics'
    }

    this.initialize()
  }

  /**
   * Inicializa el sistema de A/B testing
   */
  initialize() {
    if (!this.isEnabled) {
      logger.debug('A/B Testing disabled')
      return
    }

    // Cargar experimentos activos
    this.loadExperiments()

    // Configurar experimento principal: SM-2 vs FSRS
    this.setupMainSRSExperiment()

    logger.systemInit('A/B Testing Manager initialized')
  }

  /**
   * Configura el experimento principal SM-2 vs FSRS
   */
  setupMainSRSExperiment() {
    const experiment = {
      id: 'srs_algorithm_comparison',
      name: 'SM-2 vs FSRS Algorithm Comparison',
      description: 'Comparar eficacia entre algoritmo SM-2 legacy y FSRS moderno',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + (this.config.DURATION_DAYS * 24 * 60 * 60 * 1000)),

      groups: {
        'sm2_control': {
          name: 'SM-2 Control Group',
          percentage: this.config.GROUPS.SM2_CONTROL,
          config: {
            FSRS_ALGORITHM: false,
            algorithm: 'sm2'
          }
        },
        'fsrs_treatment': {
          name: 'FSRS Treatment Group',
          percentage: this.config.GROUPS.FSRS_TREATMENT,
          config: {
            FSRS_ALGORITHM: true,
            algorithm: 'fsrs'
          }
        }
      },

      metrics: {
        primary: ['retention_rate', 'mastery_improvement'],
        secondary: ['session_duration', 'user_engagement'],
        business: ['user_satisfaction']
      },

      hypotheses: [
        'FSRS will improve retention rate by 15-25%',
        'FSRS will reduce required reviews by 20-30%',
        'FSRS will maintain or improve user satisfaction'
      ]
    }

    this.activeExperiments.set(experiment.id, experiment)
    this.saveExperiments()

    logger.debug('Main SRS experiment configured', experiment)
  }

  /**
   * Asigna un usuario a un grupo de experimento
   * @param {string} userId - ID del usuario
   * @param {string} experimentId - ID del experimento
   * @returns {string} Grupo asignado
   */
  assignUserToGroup(userId, experimentId = 'srs_algorithm_comparison') {
    if (!this.isEnabled) {
      return 'control'
    }

    // Verificar si el usuario ya está asignado
    const existingAssignment = this.getUserGroup(userId, experimentId)
    if (existingAssignment) {
      return existingAssignment
    }

    const experiment = this.activeExperiments.get(experimentId)
    if (!experiment) {
      logger.warn(`Experiment ${experimentId} not found`)
      return 'control'
    }

    // Usar hash del userId para asignación consistente
    const hash = this.hashUserId(userId)
    const groups = Object.keys(experiment.groups)
    let cumulativePercentage = 0

    for (const groupId of groups) {
      cumulativePercentage += experiment.groups[groupId].percentage
      if (hash < cumulativePercentage) {
        this.saveUserGroup(userId, experimentId, groupId)
        logger.debug(`User ${userId} assigned to group ${groupId}`)
        return groupId
      }
    }

    // Fallback al primer grupo
    const fallbackGroup = groups[0]
    this.saveUserGroup(userId, experimentId, fallbackGroup)
    return fallbackGroup
  }

  /**
   * Obtiene el grupo de un usuario para un experimento
   */
  getUserGroup(userId, experimentId) {
    try {
      const stored = localStorage.getItem(this.storageKeys.userGroups)
      if (stored) {
        const userGroups = JSON.parse(stored)
        return userGroups[userId]?.[experimentId]
      }
    } catch (error) {
      logger.warn('Error loading user groups:', error)
    }
    return null
  }

  /**
   * Guarda la asignación de grupo de un usuario
   */
  saveUserGroup(userId, experimentId, groupId) {
    try {
      let userGroups = {}
      const stored = localStorage.getItem(this.storageKeys.userGroups)
      if (stored) {
        userGroups = JSON.parse(stored)
      }

      if (!userGroups[userId]) {
        userGroups[userId] = {}
      }
      userGroups[userId][experimentId] = groupId

      localStorage.setItem(this.storageKeys.userGroups, JSON.stringify(userGroups))
    } catch (error) {
      logger.error('Error saving user group:', error)
    }
  }

  /**
   * Hash consistente del userId para asignación determinística
   */
  hashUserId(userId) {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483648 // Normalizar a 0-1
  }

  /**
   * Obtiene configuración para un usuario basada en su grupo de experimento
   */
  getUserExperimentConfig(userId, experimentId = 'srs_algorithm_comparison') {
    if (!this.isEnabled) {
      return {}
    }

    const userGroup = this.assignUserToGroup(userId, experimentId)
    const experiment = this.activeExperiments.get(experimentId)

    if (experiment && experiment.groups[userGroup]) {
      return experiment.groups[userGroup].config
    }

    return {}
  }

  /**
   * Registra evento de métricas para A/B testing
   * @param {string} userId - ID del usuario
   * @param {string} eventType - Tipo de evento
   * @param {Object} eventData - Datos del evento
   * @param {string} experimentId - ID del experimento
   */
  trackEvent(userId, eventType, eventData = {}, experimentId = 'srs_algorithm_comparison') {
    if (!this.isEnabled) {
      return
    }

    const userGroup = this.getUserGroup(userId, experimentId)
    if (!userGroup) {
      return
    }

    const event = {
      userId,
      experimentId,
      group: userGroup,
      eventType,
      eventData,
      timestamp: Date.now()
    }

    this.saveMetricEvent(event)

    // Log eventos importantes
    if (['session_completed', 'mastery_milestone', 'algorithm_comparison'].includes(eventType)) {
      logger.debug('A/B Test event tracked', event)
    }
  }

  /**
   * Guarda evento de métrica
   */
  saveMetricEvent(event) {
    try {
      let events = []
      const stored = localStorage.getItem(this.storageKeys.metrics)
      if (stored) {
        events = JSON.parse(stored)
      }

      events.push(event)

      // Mantener solo últimos 1000 eventos para evitar crecimiento excesivo
      if (events.length > 1000) {
        events = events.slice(-500)
      }

      localStorage.setItem(this.storageKeys.metrics, JSON.stringify(events))
    } catch (error) {
      logger.error('Error saving metric event:', error)
    }
  }

  /**
   * Analiza resultados del experimento
   * @param {string} experimentId - ID del experimento
   * @returns {Object} Análisis estadístico
   */
  analyzeExperimentResults(experimentId = 'srs_algorithm_comparison') {
    if (!this.isEnabled) {
      return { error: 'A/B Testing disabled' }
    }

    try {
      const events = this.loadMetricEvents()
      const experimentEvents = events.filter(e => e.experimentId === experimentId)

      if (experimentEvents.length === 0) {
        return { error: 'No data available for analysis' }
      }

      const analysis = this.performStatisticalAnalysis(experimentEvents, experimentId)

      logger.debug(`Experiment ${experimentId} analysis completed`, analysis)

      return analysis

    } catch (error) {
      logger.error('Error analyzing experiment results:', error)
      return { error: 'Analysis failed' }
    }
  }

  /**
   * Realiza análisis estadístico de los resultados
   */
  performStatisticalAnalysis(events, experimentId) {
    const experiment = this.activeExperiments.get(experimentId)
    const groups = Object.keys(experiment.groups)

    const analysis = {
      experimentId,
      totalEvents: events.length,
      dateRange: {
        start: new Date(Math.min(...events.map(e => e.timestamp))),
        end: new Date(Math.max(...events.map(e => e.timestamp)))
      },
      groups: {},
      comparisons: {},
      conclusions: []
    }

    // Analizar cada grupo
    groups.forEach(groupId => {
      const groupEvents = events.filter(e => e.group === groupId)
      analysis.groups[groupId] = this.analyzeGroupMetrics(groupEvents)
    })

    // Comparaciones entre grupos
    if (groups.length >= 2) {
      const controlGroup = groups[0]
      const treatmentGroup = groups[1]

      analysis.comparisons = this.compareGroups(
        analysis.groups[controlGroup],
        analysis.groups[treatmentGroup],
        controlGroup,
        treatmentGroup
      )

      // Generar conclusiones automáticas
      analysis.conclusions = this.generateConclusions(analysis.comparisons)
    }

    return analysis
  }

  /**
   * Analiza métricas de un grupo específico
   */
  analyzeGroupMetrics(groupEvents) {
    const uniqueUsers = new Set(groupEvents.map(e => e.userId)).size
    const sessionEvents = groupEvents.filter(e => e.eventType === 'session_completed')
    const masteryEvents = groupEvents.filter(e => e.eventType === 'mastery_milestone')
    const algorithmEvents = groupEvents.filter(e => e.eventType === 'algorithm_comparison')

    const metrics = {
      users: uniqueUsers,
      totalEvents: groupEvents.length,
      sessions: {
        total: sessionEvents.length,
        avgDuration: this.calculateAverage(sessionEvents, 'eventData.duration'),
        avgAccuracy: this.calculateAverage(sessionEvents, 'eventData.accuracy')
      },
      mastery: {
        milestones: masteryEvents.length,
        avgImprovement: this.calculateAverage(masteryEvents, 'eventData.improvement'),
        timeToMastery: this.calculateAverage(masteryEvents, 'eventData.timeToMastery')
      },
      retention: {
        rate: this.calculateRetentionRate(groupEvents),
        streakLength: this.calculateAverage(algorithmEvents, 'eventData.streakLength')
      }
    }

    return metrics
  }

  /**
   * Compara métricas entre dos grupos
   */
  compareGroups(controlMetrics, treatmentMetrics, controlName, treatmentName) {
    const comparison = {
      control: controlName,
      treatment: treatmentName,
      results: {}
    }

    // Comparar métricas clave
    const metricsToCompare = [
      'sessions.avgDuration',
      'sessions.avgAccuracy',
      'mastery.avgImprovement',
      'mastery.timeToMastery',
      'retention.rate'
    ]

    metricsToCompare.forEach(metric => {
      const controlValue = this.getNestedValue(controlMetrics, metric)
      const treatmentValue = this.getNestedValue(treatmentMetrics, metric)

      if (controlValue !== undefined && treatmentValue !== undefined) {
        const improvement = ((treatmentValue - controlValue) / controlValue) * 100
        const isSignificant = Math.abs(improvement) > 5 // Threshold simple de 5%

        comparison.results[metric] = {
          control: controlValue,
          treatment: treatmentValue,
          improvement: improvement,
          significant: isSignificant,
          direction: improvement > 0 ? 'positive' : 'negative'
        }
      }
    })

    return comparison
  }

  /**
   * Genera conclusiones automáticas del experimento
   */
  generateConclusions(comparisons) {
    const conclusions = []

    Object.entries(comparisons.results).forEach(([metric, result]) => {
      if (result.significant) {
        const direction = result.improvement > 0 ? 'mejoró' : 'empeoró'
        conclusions.push(
          `${metric}: ${comparisons.treatment} ${direction} ${Math.abs(result.improvement).toFixed(1)}% vs ${comparisons.control}`
        )
      }
    })

    if (conclusions.length === 0) {
      conclusions.push('No se detectaron diferencias significativas entre grupos')
    }

    return conclusions
  }

  /**
   * Helpers para análisis estadístico
   */
  calculateAverage(events, path) {
    const values = events
      .map(e => this.getNestedValue(e, path))
      .filter(v => v !== undefined && !isNaN(v))

    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
  }

  calculateRetentionRate(events) {
    const uniqueUsers = new Set(events.map(e => e.userId))
    const usersWithMultipleSessions = new Set()

    uniqueUsers.forEach(userId => {
      const userEvents = events.filter(e => e.userId === userId)
      if (userEvents.length > 1) {
        usersWithMultipleSessions.add(userId)
      }
    })

    return uniqueUsers.size > 0 ? usersWithMultipleSessions.size / uniqueUsers.size : 0
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Funciones de persistencia
   */
  loadExperiments() {
    try {
      const stored = localStorage.getItem(this.storageKeys.experimentData)
      if (stored) {
        const experiments = JSON.parse(stored)
        Object.entries(experiments).forEach(([id, experiment]) => {
          this.activeExperiments.set(id, experiment)
        })
      }
    } catch (error) {
      logger.warn('Error loading experiments:', error)
    }
  }

  saveExperiments() {
    try {
      const experimentsObj = Object.fromEntries(this.activeExperiments)
      localStorage.setItem(this.storageKeys.experimentData, JSON.stringify(experimentsObj))
    } catch (error) {
      logger.error('Error saving experiments:', error)
    }
  }

  loadMetricEvents() {
    try {
      const stored = localStorage.getItem(this.storageKeys.metrics)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      logger.warn('Error loading metric events:', error)
      return []
    }
  }

  /**
   * Limpia datos de experimentos (para testing)
   */
  clearExperimentData() {
    Object.values(this.storageKeys).forEach(key => {
      localStorage.removeItem(key)
    })
    this.activeExperiments.clear()
    this.metrics.clear()
  }

  /**
   * Obtiene resumen del estado actual
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      activeExperiments: this.activeExperiments.size,
      totalEvents: this.loadMetricEvents().length,
      experiments: Array.from(this.activeExperiments.entries()).map(([id, exp]) => ({
        id,
        name: exp.name,
        status: exp.status,
        groups: Object.keys(exp.groups).length
      }))
    }
  }
}

// Instancia singleton
export const abTestingManager = new ABTestingManager()

/**
 * Funciones helper para uso directo
 */

/**
 * Determina si FSRS debe estar habilitado para un usuario según A/B testing
 */
export function shouldUseFSRS(userId = null) {
  const actualUserId = userId || getCurrentUserId()
  const config = abTestingManager.getUserExperimentConfig(actualUserId)
  return config.FSRS_ALGORITHM || false
}

/**
 * Registra evento para A/B testing
 */
export function trackABEvent(eventType, eventData = {}) {
  const userId = getCurrentUserId()
  abTestingManager.trackEvent(userId, eventType, eventData)
}

/**
 * Obtiene análisis actual del experimento
 */
export function getExperimentAnalysis() {
  return abTestingManager.analyzeExperimentResults()
}

// Debug en navegador
if (typeof window !== 'undefined') {
  window.SpanishConjugator = window.SpanishConjugator || {}
  window.SpanishConjugator.ABTesting = {
    shouldUseFSRS,
    trackEvent: trackABEvent,
    getAnalysis: getExperimentAnalysis,
    getStatus: () => abTestingManager.getStatus(),
    clearData: () => abTestingManager.clearExperimentData(),
    manager: abTestingManager
  }

  logger.systemInit('A/B Testing Debug Interface')
}

export default abTestingManager