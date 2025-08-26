// Sistema de Inteligencia Temporal y Circadiana
// Optimiza el aprendizaje basado en patrones temporales y ritmos biológicos

/**
 * Inteligencia Temporal para Optimización del Aprendizaje
 * - Análisis de patrones de rendimiento por hora del día
 * - Detección de ventanas óptimas de aprendizaje
 * - Adaptación de dificultad según fatiga cognitiva
 * - Recomendaciones de timing para diferentes tipos de práctica
 */
class TemporalIntelligence {
  constructor() {
    this.timeSlots = new Map() // hour -> performance data
    this.sessionPatterns = []
    this.circadianProfile = {
      peakHours: [], // Horas de mejor rendimiento
      lowHours: [], // Horas de menor rendimiento
      optimalSessionLength: 20, // minutos
      fatigueTolerance: 0.7,
      learningRhythm: 'neutral' // morning_person, night_owl, consistent
    }
    this.cognitiveLoad = {
      current: 0.5,
      history: [],
      threshold: 0.8,
      recoveryRate: 0.1 // por minuto
    }
    this.init()
  }

  async init() {
    await this.loadTemporalData()
    this.analyzeHistoricalPatterns()
  }

  /**
   * Procesa una sesión de práctica para análisis temporal
   */
  processSession(sessionData) {
    const {
      startTime,
      endTime,
      responses = [],
      averageAccuracy = 0,
      averageResponseTime = 0,
      totalCorrect = 0,
      totalIncorrect = 0,
      fatigueLevel = 0.5, // 0 = fresco, 1 = muy cansado
      interruptions = 0,
      sessionType = 'mixed' // mixed, specific, review, challenge
    } = sessionData

    const sessionEntry = {
      timestamp: startTime,
      duration: endTime - startTime,
      hour: new Date(startTime).getHours(),
      dayOfWeek: new Date(startTime).getDay(),
      averageAccuracy,
      averageResponseTime,
      totalResponses: responses.length,
      totalCorrect,
      totalIncorrect,
      fatigueLevel,
      interruptions,
      sessionType,
      cognitiveLoad: this.calculateSessionCognitiveLoad(sessionData),
      performance: this.calculateSessionPerformance(sessionData)
    }

    // Agregar a historial de patrones
    this.sessionPatterns.push(sessionEntry)
    if (this.sessionPatterns.length > 500) {
      this.sessionPatterns = this.sessionPatterns.slice(-300) // Mantener últimas 300 sesiones
    }

    // Actualizar datos por franja horaria
    this.updateTimeSlotData(sessionEntry)

    // Actualizar carga cognitiva
    this.updateCognitiveLoad(sessionEntry)

    // Re-analizar patrones circadianos
    this.analyzeCircadianPatterns()

    // Generar recomendaciones temporales
    const recommendations = this.generateTemporalRecommendations()

    return {
      optimalTiming: this.getOptimalPracticeTime(),
      currentCognitiveLoad: this.cognitiveLoad.current,
      fatigueLevel: this.estimateCurrentFatigue(),
      sessionRecommendation: this.getSessionTypeRecommendation(),
      recommendations,
      insights: this.generateTemporalInsights(sessionEntry)
    }
  }

  /**
   * Calcula la carga cognitiva de una sesión
   */
  calculateSessionCognitiveLoad(sessionData) {
    const { responses, averageResponseTime, sessionType } = sessionData

    let cognitiveLoad = 0.5 // Base neutral

    // Factor de complejidad por tipo de sesión
    const typeFactors = {
      review: 0.3,
      mixed: 0.6,
      specific: 0.7,
      challenge: 0.9,
      speed: 0.8
    }
    cognitiveLoad *= (typeFactors[sessionType] || 0.6)

    // Factor de tiempo de respuesta (respuestas lentas = más carga)
    if (averageResponseTime > 6000) cognitiveLoad += 0.2
    if (averageResponseTime > 10000) cognitiveLoad += 0.3

    // Factor de errores consecutivos (aumenta carga)
    let consecutiveErrors = 0
    let maxConsecutiveErrors = 0
    responses.forEach(r => {
      if (!r.isCorrect) {
        consecutiveErrors++
        maxConsecutiveErrors = Math.max(maxConsecutiveErrors, consecutiveErrors)
      } else {
        consecutiveErrors = 0
      }
    })

    cognitiveLoad += Math.min(0.3, maxConsecutiveErrors * 0.1)

    return Math.max(0, Math.min(1, cognitiveLoad))
  }

  /**
   * Calcula el rendimiento general de una sesión
   */
  calculateSessionPerformance(sessionData) {
    const { averageAccuracy, averageResponseTime, fatigueLevel, interruptions } = sessionData

    let performance = averageAccuracy // Base: precisión

    // Penalizar respuestas muy lentas o muy rápidas
    if (averageResponseTime > 8000) performance *= 0.9
    if (averageResponseTime < 1000) performance *= 0.8 // Posible adivinanza

    // Penalizar fatiga e interrupciones
    performance *= (1 - fatigueLevel * 0.3)
    performance *= Math.max(0.7, 1 - interruptions * 0.1)

    return Math.max(0, Math.min(1, performance))
  }

  /**
   * Actualiza datos de rendimiento por franja horaria
   */
  updateTimeSlotData(sessionEntry) {
    const hour = sessionEntry.hour
    
    if (!this.timeSlots.has(hour)) {
      this.timeSlots.set(hour, {
        totalSessions: 0,
        totalPerformance: 0,
        averagePerformance: 0,
        totalAccuracy: 0,
        averageAccuracy: 0,
        totalCognitiveLoad: 0,
        averageCognitiveLoad: 0,
        bestPerformance: 0,
        worstPerformance: 1,
        sessionTypes: new Map(),
        lastUpdated: Date.now()
      })
    }

    const slot = this.timeSlots.get(hour)
    
    // Actualizar estadísticas con peso exponencial
    const alpha = 0.3 // Factor de aprendizaje
    slot.totalSessions += 1
    slot.averagePerformance = alpha * sessionEntry.performance + (1 - alpha) * slot.averagePerformance
    slot.averageAccuracy = alpha * sessionEntry.averageAccuracy + (1 - alpha) * slot.averageAccuracy
    slot.averageCognitiveLoad = alpha * sessionEntry.cognitiveLoad + (1 - alpha) * slot.averageCognitiveLoad
    
    // Actualizar extremos
    slot.bestPerformance = Math.max(slot.bestPerformance, sessionEntry.performance)
    slot.worstPerformance = Math.min(slot.worstPerformance, sessionEntry.performance)
    
    // Contar tipos de sesión
    const sessionType = sessionEntry.sessionType
    if (!slot.sessionTypes.has(sessionType)) {
      slot.sessionTypes.set(sessionType, 0)
    }
    slot.sessionTypes.set(sessionType, slot.sessionTypes.get(sessionType) + 1)
    
    slot.lastUpdated = Date.now()
  }

  /**
   * Actualiza la carga cognitiva actual
   */
  updateCognitiveLoad(sessionEntry) {
    // La carga cognitiva se acumula durante las sesiones y se reduce con el tiempo
    const timeSinceLastSession = sessionEntry.timestamp - (this.cognitiveLoad.lastUpdate || sessionEntry.timestamp)
    const minutesSince = timeSinceLastSession / (1000 * 60)
    
    // Recuperación natural
    this.cognitiveLoad.current = Math.max(0, this.cognitiveLoad.current - minutesSince * this.cognitiveLoad.recoveryRate)
    
    // Agregar carga de la sesión actual
    this.cognitiveLoad.current = Math.min(1, this.cognitiveLoad.current + sessionEntry.cognitiveLoad * 0.5)
    
    // Agregar a historial
    this.cognitiveLoad.history.push({
      timestamp: sessionEntry.timestamp,
      load: this.cognitiveLoad.current,
      sessionLoad: sessionEntry.cognitiveLoad
    })
    
    if (this.cognitiveLoad.history.length > 100) {
      this.cognitiveLoad.history = this.cognitiveLoad.history.slice(-50)
    }
    
    this.cognitiveLoad.lastUpdate = sessionEntry.timestamp
  }

  /**
   * Analiza patrones circadianos del usuario
   */
  analyzeCircadianPatterns() {
    if (this.sessionPatterns.length < 10) return

    // Agrupar sesiones por hora
    const hourlyStats = new Map()
    
    this.sessionPatterns.forEach(session => {
      if (!hourlyStats.has(session.hour)) {
        hourlyStats.set(session.hour, {
          sessions: [],
          avgPerformance: 0,
          avgAccuracy: 0
        })
      }
      hourlyStats.get(session.hour).sessions.push(session)
    })

    // Calcular promedios por hora
    hourlyStats.forEach((stats, hour) => {
      stats.avgPerformance = stats.sessions.reduce((sum, s) => sum + s.performance, 0) / stats.sessions.length
      stats.avgAccuracy = stats.sessions.reduce((sum, s) => sum + s.averageAccuracy, 0) / stats.sessions.length
    })

    // Identificar horas pico y bajas
    const sortedHours = Array.from(hourlyStats.entries())
      .filter(([_, stats]) => stats.sessions.length >= 2) // Al menos 2 sesiones
      .sort((a, b) => b[1].avgPerformance - a[1].avgPerformance)

    if (sortedHours.length >= 4) {
      this.circadianProfile.peakHours = sortedHours.slice(0, 2).map(([hour, _]) => hour)
      this.circadianProfile.lowHours = sortedHours.slice(-2).map(([hour, _]) => hour)
    }

    // Determinar tipo de ritmo circadiano
    this.circadianProfile.learningRhythm = this.determineCircadianType(sortedHours)

    // Calcular duración óptima de sesión basado en rendimiento vs fatiga
    this.circadianProfile.optimalSessionLength = this.calculateOptimalSessionLength()
  }

  /**
   * Determina el tipo circadiano del usuario
   */
  determineCircadianType(sortedHours) {
    if (sortedHours.length < 3) return 'neutral'

    const topHours = sortedHours.slice(0, 3).map(([hour, _]) => hour)
    const morningHours = topHours.filter(h => h >= 6 && h <= 11).length
    const eveningHours = topHours.filter(h => h >= 18 && h <= 23).length
    const afternoonHours = topHours.filter(h => h >= 12 && h <= 17).length

    if (morningHours >= 2) return 'morning_person'
    if (eveningHours >= 2) return 'night_owl'
    if (afternoonHours >= 2) return 'afternoon_peak'
    return 'consistent'
  }

  /**
   * Calcula la duración óptima de sesión
   */
  calculateOptimalSessionLength() {
    const sessionsWithDuration = this.sessionPatterns.filter(s => s.duration > 300000) // Al menos 5 min

    if (sessionsWithDuration.length < 5) return 20 // Default 20 min

    // Agrupar por duración y analizar rendimiento
    const durationGroups = {
      short: [], // 5-15 min
      medium: [], // 15-30 min
      long: [], // 30-60 min
      veryLong: [] // 60+ min
    }

    sessionsWithDuration.forEach(session => {
      const minutes = session.duration / (1000 * 60)
      if (minutes <= 15) durationGroups.short.push(session)
      else if (minutes <= 30) durationGroups.medium.push(session)
      else if (minutes <= 60) durationGroups.long.push(session)
      else durationGroups.veryLong.push(session)
    })

    // Calcular rendimiento promedio por grupo
    let bestDuration = 20 // Default
    let bestPerformance = 0

    Object.entries(durationGroups).forEach(([type, sessions]) => {
      if (sessions.length >= 2) {
        const avgPerformance = sessions.reduce((sum, s) => sum + s.performance, 0) / sessions.length
        if (avgPerformance > bestPerformance) {
          bestPerformance = avgPerformance
          bestDuration = type === 'short' ? 12 : type === 'medium' ? 22 : type === 'long' ? 45 : 30
        }
      }
    })

    return bestDuration
  }

  /**
   * Estima el nivel actual de fatiga
   */
  estimateCurrentFatigue() {
    const now = Date.now()
    const hour = new Date(now).getHours()

    // Fatiga base según hora del día (curva circadiana típica)
    let baseFatigue = 0.3
    if (hour >= 13 && hour <= 15) baseFatigue = 0.6 // Post-lunch dip
    if (hour >= 22 || hour <= 6) baseFatigue = 0.7 // Night hours
    if (hour >= 9 && hour <= 11) baseFatigue = 0.2 // Morning peak

    // Ajustar según patrón personal
    const slot = this.timeSlots.get(hour)
    if (slot) {
      baseFatigue = (baseFatigue + slot.averageCognitiveLoad) / 2
    }

    // Factor de carga cognitiva actual
    const loadFatigue = this.cognitiveLoad.current * 0.4

    // Factor de sesiones recientes
    const recentSessions = this.sessionPatterns.filter(s => now - s.timestamp < 3600000) // Última hora
    const sessionFatigue = Math.min(0.3, recentSessions.length * 0.1)

    return Math.min(1, baseFatigue + loadFatigue + sessionFatigue)
  }

  /**
   * Obtiene el tiempo óptimo para practicar
   */
  getOptimalPracticeTime() {
    const now = new Date()
    const currentHour = now.getHours()

    // Si estamos en una hora pico, recomendar ahora
    if (this.circadianProfile.peakHours.includes(currentHour)) {
      return {
        recommendation: 'now',
        reason: 'Estás en tu ventana óptima de rendimiento',
        confidence: 0.9
      }
    }

    // Encontrar la próxima ventana óptima
    let nextOptimalHour = null
    let hoursUntil = 24

    for (const peakHour of this.circadianProfile.peakHours) {
      let distance = peakHour - currentHour
      if (distance < 0) distance += 24 // Próximo día

      if (distance < hoursUntil) {
        hoursUntil = distance
        nextOptimalHour = peakHour
      }
    }

    if (nextOptimalHour !== null) {
      return {
        recommendation: 'later',
        nextOptimalTime: nextOptimalHour,
        hoursUntil,
        reason: `Tu rendimiento suele ser mejor a las ${nextOptimalHour}:00`,
        confidence: this.circadianProfile.peakHours.length >= 2 ? 0.8 : 0.6
      }
    }

    return {
      recommendation: 'now',
      reason: 'Cualquier momento es bueno para practicar',
      confidence: 0.5
    }
  }

  /**
   * Recomienda tipo de sesión según contexto temporal
   */
  getSessionTypeRecommendation() {
    const fatigue = this.estimateCurrentFatigue()
    const cognitiveLoad = this.cognitiveLoad.current
    const hour = new Date().getHours()

    // Determinar intensidad recomendada
    if (fatigue > 0.7 || cognitiveLoad > 0.8) {
      return {
        type: 'review',
        intensity: 'light',
        duration: Math.min(this.circadianProfile.optimalSessionLength, 15),
        reason: 'Alto nivel de fatiga - sesión de repaso ligera recomendada'
      }
    }

    if (this.circadianProfile.peakHours.includes(hour) && fatigue < 0.4) {
      return {
        type: 'challenge',
        intensity: 'high',
        duration: this.circadianProfile.optimalSessionLength,
        reason: 'Ventana óptima - momento perfecto para desafíos'
      }
    }

    if (this.circadianProfile.lowHours.includes(hour)) {
      return {
        type: 'specific',
        intensity: 'medium',
        duration: Math.min(this.circadianProfile.optimalSessionLength, 20),
        reason: 'Hora de bajo rendimiento - práctica enfocada recomendada'
      }
    }

    return {
      type: 'mixed',
      intensity: 'medium',
      duration: this.circadianProfile.optimalSessionLength,
      reason: 'Condiciones normales - sesión equilibrada'
    }
  }

  /**
   * Genera recomendaciones temporales generales
   */
  generateTemporalRecommendations() {
    const recommendations = []
    const fatigue = this.estimateCurrentFatigue()
    const hour = new Date().getHours()

    // Recomendaciones de fatiga
    if (fatigue > 0.8) {
      recommendations.push({
        type: 'rest',
        priority: 'high',
        message: 'Nivel alto de fatiga - considera un descanso',
        action: 'suggest_break'
      })
    }

    // Recomendaciones circadianas
    if (this.circadianProfile.learningRhythm === 'morning_person' && hour > 14) {
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        message: 'Tu rendimiento suele ser mejor por las mañanas',
        action: 'suggest_morning_practice'
      })
    }

    if (this.circadianProfile.learningRhythm === 'night_owl' && hour < 12) {
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        message: 'Tu rendimiento suele mejorar por las tardes',
        action: 'suggest_evening_practice'
      })
    }

    // Recomendaciones de duración
    if (this.cognitiveLoad.current > 0.6) {
      recommendations.push({
        type: 'duration',
        priority: 'medium',
        message: 'Considera sesiones más cortas para mantener la concentración',
        action: 'suggest_shorter_sessions'
      })
    }

    return recommendations
  }

  /**
   * Genera insights temporales específicos
   */
  generateTemporalInsights(sessionEntry) {
    const insights = []
    const hour = sessionEntry.hour

    // Insights de rendimiento por hora
    const slot = this.timeSlots.get(hour)
    if (slot && slot.totalSessions > 3) {
      if (sessionEntry.performance > slot.averagePerformance + 0.1) {
        insights.push('🚀 Rendimiento excepcional para esta hora del día')
      } else if (sessionEntry.performance < slot.averagePerformance - 0.1) {
        insights.push('📉 Rendimiento por debajo de tu promedio habitual para esta hora')
      }
    }

    // Insights de fatiga
    if (sessionEntry.fatigueLevel < 0.3 && sessionEntry.performance > 0.8) {
      insights.push('⚡ Excelente combinación: baja fatiga y alto rendimiento')
    }

    // Insights de duración
    const sessionMinutes = sessionEntry.duration / (1000 * 60)
    if (sessionMinutes > this.circadianProfile.optimalSessionLength * 1.5 && sessionEntry.performance < 0.6) {
      insights.push('⏰ Sesión larga detectada - considera sesiones más cortas')
    }

    return insights
  }

  /**
   * Obtiene estadísticas temporales actuales
   */
  getCurrentTemporalStats() {
    return {
      circadianProfile: this.circadianProfile,
      currentFatigue: this.estimateCurrentFatigue(),
      currentCognitiveLoad: this.cognitiveLoad.current,
      optimalPracticeTime: this.getOptimalPracticeTime(),
      sessionRecommendation: this.getSessionTypeRecommendation(),
      hourlyStats: Array.from(this.timeSlots.entries())
        .map(([hour, data]) => ({
          hour,
          averagePerformance: Math.round(data.averagePerformance * 100),
          sessions: data.totalSessions
        }))
        .sort((a, b) => a.hour - b.hour),
      totalSessions: this.sessionPatterns.length,
      last7DaysAvg: this.calculateRecentAverage(7)
    }
  }

  /**
   * Calcula promedio de rendimiento reciente
   */
  calculateRecentAverage(days) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
    const recentSessions = this.sessionPatterns.filter(s => s.timestamp >= cutoff)
    
    if (recentSessions.length === 0) return 0

    return recentSessions.reduce((sum, s) => sum + s.performance, 0) / recentSessions.length
  }

  /**
   * Analiza patrones históricos al inicializar
   */
  analyzeHistoricalPatterns() {
    if (this.sessionPatterns.length >= 10) {
      this.analyzeCircadianPatterns()
    }
  }

  /**
   * Cargar datos temporales desde almacenamiento
   */
  async loadTemporalData() {
    try {
      const stored = localStorage.getItem('temporal-intelligence-data')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.timeSlots) {
          this.timeSlots = new Map(data.timeSlots)
        }
        if (data.sessionPatterns) {
          this.sessionPatterns = data.sessionPatterns
        }
        if (data.circadianProfile) {
          this.circadianProfile = { ...this.circadianProfile, ...data.circadianProfile }
        }
        if (data.cognitiveLoad) {
          this.cognitiveLoad = { ...this.cognitiveLoad, ...data.cognitiveLoad }
        }
      }
    } catch (e) {
      console.warn('Failed to load temporal data:', e)
    }
  }

  /**
   * Guardar datos temporales
   */
  async saveTemporalData() {
    try {
      const data = {
        timeSlots: Array.from(this.timeSlots.entries()),
        sessionPatterns: this.sessionPatterns,
        circadianProfile: this.circadianProfile,
        cognitiveLoad: this.cognitiveLoad,
        lastSaved: Date.now()
      }
      localStorage.setItem('temporal-intelligence-data', JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save temporal data:', e)
    }
  }

  /**
   * Reiniciar sistema temporal
   */
  reset() {
    this.timeSlots.clear()
    this.sessionPatterns = []
    this.circadianProfile = {
      peakHours: [],
      lowHours: [],
      optimalSessionLength: 20,
      fatigueTolerance: 0.7,
      learningRhythm: 'neutral'
    }
    this.cognitiveLoad = {
      current: 0.5,
      history: [],
      threshold: 0.8,
      recoveryRate: 0.1
    }
    this.saveTemporalData()
  }
}

// Instancia global del sistema temporal
export const temporalIntelligence = new TemporalIntelligence()

/**
 * Función de procesamiento para el hook principal
 */
export const processSessionForTempo = (sessionData) => {
  return temporalIntelligence.processSession(sessionData)
}

/**
 * Función para obtener estado temporal actual
 */
export const getCurrentTemporalState = () => {
  return temporalIntelligence.getCurrentTemporalStats()
}

// Guardar datos cada minuto
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    temporalIntelligence.saveTemporalData()
  }, 60000)
}

// Testing/Debug en navegador
if (typeof window !== 'undefined') {
  window.TemporalIntelligence = {
    engine: temporalIntelligence,
    processSession: processSessionForTempo,
    getState: getCurrentTemporalState,
    reset: () => temporalIntelligence.reset()
  }
}

export default temporalIntelligence