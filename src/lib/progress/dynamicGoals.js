// Sistema de Micro-objetivos Dinámicos
// Genera y adapta objetivos granulares basados en el progreso del usuario

import { PROGRESS_CONFIG } from './config.js'
import { logger } from './logger.js'
import { memoryManager, registerInterval } from './memoryManager.js'

/**
 * Sistema de Micro-objetivos que se adapta dinámicamente
 */
export class DynamicGoalsSystem {
  constructor() {
    this.activeGoals = new Map() // goalId -> goal data
    this.completedGoals = []
    this.goalTemplates = this.initializeGoalTemplates()
    this.userProfile = {
      level: 'B1',
      interests: [], // Tipos de objetivos que más motivan
      achievementStyle: 'balanced', // explorer, achiever, socializer, killer
      preferredChallenge: 'medium',
      streak: 0,
      totalPoints: 0,
      badges: []
    }
    this.goalMetrics = {
      totalGoalsGenerated: 0,
      totalGoalsCompleted: 0,
      avgCompletionTime: 0,
      completionRate: 0,
      preferredGoalTypes: new Map()
    }
    this.init()
  }

  async init() {
    await this.loadGoalsData()
    this.generateInitialGoals()
  }

  /**
   * Inicializa plantillas de objetivos
   */
  initializeGoalTemplates() {
    return {
      // Objetivos de precisión
      accuracy: {
        name: 'Maestro de la Precisión',
        description: 'Logra {target}% de precisión en {category}',
        type: 'accuracy',
        difficulty: 'medium',
        points: 100,
        timeLimit: null,
        requirements: {
          minAttempts: 10,
          targetAccuracy: 0.8
        },
        variations: [
          { category: 'presente indicativo', target: 85, points: 80 },
          { category: 'pretérito perfecto', target: 90, points: 120 },
          { category: 'subjuntivo presente', target: 75, points: 150 },
          { category: 'verbos irregulares', target: 80, points: 100 }
        ]
      },

      // Objetivos de velocidad
      speed: {
        name: 'Respuesta Rápida',
        description: 'Responde en menos de {time} segundos con {accuracy}% precisión',
        type: 'speed',
        difficulty: 'high',
        points: 150,
        timeLimit: null,
        requirements: {
          maxResponseTime: 3000,
          minAccuracy: 0.8,
          minAttempts: 15
        },
        variations: [
          { time: 5, accuracy: 80, points: 100 },
          { time: 3, accuracy: 75, points: 150 },
          { time: 2, accuracy: 70, points: 200 }
        ]
      },

      // Objetivos de consistencia
      streak: {
        name: 'Racha Imparable',
        description: 'Consigue una racha de {count} respuestas correctas consecutivas',
        type: 'streak',
        difficulty: 'medium',
        points: 200,
        timeLimit: null,
        requirements: {
          targetStreak: 10
        },
        variations: [
          { count: 5, points: 75 },
          { count: 10, points: 150 },
          { count: 20, points: 300 },
          { count: 50, points: 500 }
        ]
      },

      // Objetivos de exploración
      exploration: {
        name: 'Explorador Verbal',
        description: 'Practica {count} verbos diferentes en {timeframe}',
        type: 'exploration',
        difficulty: 'easy',
        points: 100,
        timeLimit: 7 * 24 * 60 * 60 * 1000, // 1 semana
        requirements: {
          uniqueVerbs: 25
        },
        variations: [
          { count: 10, timeframe: '3 días', points: 50 },
          { count: 25, timeframe: '1 semana', points: 100 },
          { count: 50, timeframe: '2 semanas', points: 200 }
        ]
      },

      // Objetivos de dominio
      mastery: {
        name: 'Dominio Completo',
        description: 'Domina completamente {category} (95% precisión en 20+ intentos)',
        type: 'mastery',
        difficulty: 'very_high',
        points: 500,
        timeLimit: null,
        requirements: {
          minAccuracy: 0.95,
          minAttempts: 20,
          consistency: 0.9 // Baja varianza
        },
        variations: [
          { category: 'presente indicativo', points: 300 },
          { category: 'pretérito indefinido', points: 400 },
          { category: 'subjuntivo imperfecto', points: 600 }
        ]
      },

      // Objetivos de recuperación
      recovery: {
        name: 'Fénix Resiliente',
        description: 'Recupera tu precisión después de una mala racha',
        type: 'recovery',
        difficulty: 'medium',
        points: 100,
        timeLimit: null,
        requirements: {
          recoveryFromAccuracy: 0.5, // Desde 50%
          targetAccuracy: 0.8, // Hasta 80%
          minAttempts: 10
        }
      },

      // Objetivos de sesión
      session: {
        name: 'Maratón de Aprendizaje',
        description: 'Completa una sesión de {duration} minutos con {accuracy}% precisión',
        type: 'session',
        difficulty: 'medium',
        points: 150,
        timeLimit: null,
        requirements: {
          sessionDuration: 20 * 60 * 1000, // 20 minutos
          minAccuracy: 0.75
        },
        variations: [
          { duration: 15, accuracy: 70, points: 100 },
          { duration: 30, accuracy: 75, points: 200 },
          { duration: 60, accuracy: 80, points: 400 }
        ]
      }
    }
  }

  /**
   * Genera objetivos iniciales basado en el perfil del usuario
   */
  generateInitialGoals() {
    const { ACTIVE_GOALS_MIN } = PROGRESS_CONFIG.EMOTIONAL_INTELLIGENCE.GOALS
    while (this.activeGoals.size < ACTIVE_GOALS_MIN + 1) {
      const goal = this.generateGoal()
      if (goal) {
        this.activeGoals.set(goal.id, goal)
      }
    }
  }

  /**
   * Genera un objetivo basado en el contexto actual del usuario
   */
  generateGoal(context = {}) {
    const {
      userPerformance = {},
      recentActivity = {},
      _currentWeakness = null,
      _currentStrength = null,
      _sessionData = {}
    } = context

    // Seleccionar tipo de objetivo basado en contexto
    const goalType = this.selectGoalType(userPerformance, recentActivity)
    const template = this.goalTemplates[goalType]
    if (!template) return null

    // Generar objetivo específico
    const goal = this.createGoalFromTemplate(template, context)
    
    this.goalMetrics.totalGoalsGenerated++
    return goal
  }

  /**
   * Selecciona el tipo de objetivo más apropiado
   */
  selectGoalType(performance, activity) {
    const weights = {
      accuracy: 1.0,
      speed: 1.0,
      streak: 1.0,
      exploration: 1.0,
      mastery: 0.5,
      recovery: 0.1,
      session: 0.8
    }

    // Ajustar pesos según contexto
    if (performance.recentAccuracy && performance.recentAccuracy < 0.6) {
      weights.recovery = 2.0 // Priorizar recuperación
      weights.accuracy = 1.5
      weights.speed = 0.3 // Menos énfasis en velocidad
    }

    if (performance.averageResponseTime && performance.averageResponseTime > 8000) {
      weights.speed = 2.0 // Priorizar velocidad
    }

    if (performance.currentStreak && performance.currentStreak > 15) {
      weights.streak = 2.0 // Aprovechar buena racha
    }

    if (activity.uniqueVerbsRecent && activity.uniqueVerbsRecent < 10) {
      weights.exploration = 1.8 // Promover variedad
    }

    // Selección ponderada aleatoria
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
    let random = Math.random() * totalWeight
    
    for (const [type, weight] of Object.entries(weights)) {
      random -= weight
      if (random <= 0) {
        return type
      }
    }

    return 'accuracy' // Fallback
  }

  /**
   * Crea un objetivo específico desde una plantilla
   */
  createGoalFromTemplate(template, _context) {
    const variations = template.variations || [{}]
    const variation = variations[Math.floor(Math.random() * variations.length)]
    
    const goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      name: template.name,
      description: this.formatDescription(template.description, variation),
      difficulty: template.difficulty,
      points: variation.points || template.points,
      timeLimit: template.timeLimit,
      requirements: this.mergeRequirements(template.requirements, variation),
      progress: this.initializeProgress(template.type),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active', // active, completed, failed, paused
      motivationalBonus: this.calculateMotivationalBonus(template.type)
    }

    return goal
  }

  /**
   * Formatea la descripción del objetivo con variables
   */
  formatDescription(template, variation) {
    let description = template
    
    // Reemplazar variables comunes
    const replacements = {
      '{target}': variation.target,
      '{category}': variation.category,
      '{time}': variation.time,
      '{accuracy}': variation.accuracy,
      '{count}': variation.count,
      '{timeframe}': variation.timeframe,
      '{duration}': variation.duration
    }

    Object.entries(replacements).forEach(([key, value]) => {
      if (value !== undefined) {
        description = description.replace(new RegExp(key, 'g'), value)
      }
    })

    return description
  }

  /**
   * Combina requisitos de plantilla con variación
   */
  mergeRequirements(templateReqs, variation) {
    return {
      ...templateReqs,
      ...variation
    }
  }

  /**
   * Inicializa el progreso según el tipo de objetivo
   */
  initializeProgress(goalType) {
    switch (goalType) {
      case 'accuracy':
        return { attempts: 0, correct: 0, currentAccuracy: 0 }
      case 'speed':
        return { fastResponses: 0, totalResponses: 0, averageTime: 0 }
      case 'streak':
        return { currentStreak: 0, bestStreak: 0 }
      case 'exploration':
        return { uniqueVerbs: new Set(), totalVerbs: 0 }
      case 'mastery':
        return { attempts: 0, correct: 0, recentAccuracy: [], variance: 0 }
      case 'recovery':
        return { startingAccuracy: 0, currentAccuracy: 0, attempts: 0, improving: false }
      case 'session':
        return { sessionStart: null, sessionDuration: 0, sessionAccuracy: 0, sessionAttempts: 0 }
      default:
        return {}
    }
  }

  /**
   * Calcula bonus motivacional basado en preferencias del usuario
   */
  calculateMotivationalBonus(goalType) {
    const bonuses = {
      accuracy: this.userProfile.achievementStyle === 'achiever' ? 1.2 : 1.0,
      speed: this.userProfile.achievementStyle === 'killer' ? 1.3 : 1.0,
      exploration: this.userProfile.achievementStyle === 'explorer' ? 1.4 : 1.0,
      mastery: this.userProfile.achievementStyle === 'achiever' ? 1.5 : 1.0
    }

    return bonuses[goalType] || 1.0
  }

  /**
   * Procesa una respuesta del usuario para actualizar objetivos
   */
  processResponse(response) {
    const {
      _isCorrect,
      _responseTime,
      _verb,
      _mood,
      _tense,
      _person,
      _sessionStartTime = null,
      _currentStreak = 0
    } = response

    const updates = []

    // Actualizar todos los objetivos activos
    this.activeGoals.forEach((goal, _goalId) => {
      const update = this.updateGoal(goal, response)
      if (update) {
        updates.push(update)
        goal.updatedAt = Date.now()
      }
    })

    // Verificar objetivos completados
    const completedGoals = this.checkCompletedGoals()
    
    // Generar nuevos objetivos si es necesario
    this.maintainGoalPool()

    return {
      goalUpdates: updates,
      completedGoals,
      newGoals: Array.from(this.activeGoals.values()).filter(g => 
        Date.now() - g.createdAt < 1000 // Nuevos en el último segundo
      ),
      totalActiveGoals: this.activeGoals.size
    }
  }

  /**
   * Actualiza un objetivo específico con una respuesta
   */
  updateGoal(goal, response) {
    switch (goal.type) {
      case 'accuracy':
        return this.updateAccuracyGoal(goal, response)
      case 'speed':
        return this.updateSpeedGoal(goal, response)
      case 'streak':
        return this.updateStreakGoal(goal, response)
      case 'exploration':
        return this.updateExplorationGoal(goal, response)
      case 'mastery':
        return this.updateMasteryGoal(goal, response)
      case 'recovery':
        return this.updateRecoveryGoal(goal, response)
      case 'session':
        return this.updateSessionGoal(goal, response)
      default:
        return null
    }
  }

  /**
   * Actualiza objetivo de precisión
   */
  updateAccuracyGoal(goal, response) {
    goal.progress.attempts++
    if (response.isCorrect) {
      goal.progress.correct++
    }
    
    goal.progress.currentAccuracy = goal.progress.correct / goal.progress.attempts

    if (goal.progress.attempts >= goal.requirements.minAttempts) {
      const targetMet = goal.progress.currentAccuracy >= goal.requirements.targetAccuracy

      return {
        goalId: goal.id,
        type: 'accuracy_update',
        progress: Math.round(goal.progress.currentAccuracy * 100),
        target: Math.round(goal.requirements.targetAccuracy * 100),
        isComplete: targetMet,
        message: targetMet ? 
          `¡Objetivo logrado! ${Math.round(goal.progress.currentAccuracy * 100)}% de precisión` :
          `Progreso: ${Math.round(goal.progress.currentAccuracy * 100)}%/${Math.round(goal.requirements.targetAccuracy * 100)}%`
      }
    }

    return null
  }

  /**
   * Actualiza objetivo de velocidad
   */
  updateSpeedGoal(goal, response) {
    goal.progress.totalResponses++
    
    if (response.isCorrect && response.responseTime <= goal.requirements.maxResponseTime) {
      goal.progress.fastResponses++
    }

    const currentRate = goal.progress.fastResponses / goal.progress.totalResponses
    const targetRate = goal.requirements.minAccuracy || 0.8

    if (goal.progress.totalResponses >= goal.requirements.minAttempts) {
      const targetMet = currentRate >= targetRate

      return {
        goalId: goal.id,
        type: 'speed_update',
        progress: Math.round(currentRate * 100),
        target: Math.round(targetRate * 100),
        isComplete: targetMet,
        message: targetMet ?
          '⚡ ¡Velocidad dominada! Respuestas rápidas y precisas' :
          `Respuestas rápidas: ${Math.round(currentRate * 100)}%`
      }
    }

    return null
  }

  /**
   * Actualiza objetivo de racha
   */
  updateStreakGoal(goal, response) {
    if (response.isCorrect) {
      goal.progress.currentStreak++
      goal.progress.bestStreak = Math.max(goal.progress.bestStreak, goal.progress.currentStreak)
    } else {
      goal.progress.currentStreak = 0
    }

    const targetMet = goal.progress.currentStreak >= goal.requirements.targetStreak

    return {
      goalId: goal.id,
      type: 'streak_update',
      progress: goal.progress.currentStreak,
      target: goal.requirements.targetStreak,
      isComplete: targetMet,
      message: targetMet ?
        `🔥 ¡Racha increíble! ${goal.progress.currentStreak} consecutivas` :
        `🔥 Racha actual: ${goal.progress.currentStreak}/${goal.requirements.targetStreak}`
    }
  }

  /**
   * Actualiza objetivo de exploración
   */
  updateExplorationGoal(goal, response) {
    goal.progress.uniqueVerbs.add(response.verb)
    goal.progress.totalVerbs = goal.progress.uniqueVerbs.size

    const targetMet = goal.progress.totalVerbs >= goal.requirements.uniqueVerbs

    // Verificar límite de tiempo si existe
    let timeExpired = false
    if (goal.timeLimit) {
      timeExpired = Date.now() - goal.createdAt > goal.timeLimit
    }

    return {
      goalId: goal.id,
      type: 'exploration_update',
      progress: goal.progress.totalVerbs,
      target: goal.requirements.uniqueVerbs,
      isComplete: targetMet,
      timeExpired,
      message: targetMet ?
        `🗺️ ¡Explorador consumado! ${goal.progress.totalVerbs} verbos dominados` :
        `🗺️ Verbos explorados: ${goal.progress.totalVerbs}/${goal.requirements.uniqueVerbs}`
    }
  }

  /**
   * Actualiza objetivo de dominio/maestría
   */
  updateMasteryGoal(goal, response) {
    goal.progress.attempts++
    if (response.isCorrect) {
      goal.progress.correct++
    }

    const currentAccuracy = goal.progress.correct / goal.progress.attempts
    
    // Mantener historial de precisión reciente para calcular consistencia
    goal.progress.recentAccuracy.push(response.isCorrect ? 1 : 0)
    if (goal.progress.recentAccuracy.length > 20) {
      goal.progress.recentAccuracy = goal.progress.recentAccuracy.slice(-20)
    }

    if (goal.progress.attempts >= goal.requirements.minAttempts) {
      const accuracyMet = currentAccuracy >= goal.requirements.minAccuracy
      
      // Calcular varianza (consistencia)
      const mean = goal.progress.recentAccuracy.reduce((sum, val) => sum + val, 0) / goal.progress.recentAccuracy.length
      const variance = goal.progress.recentAccuracy.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / goal.progress.recentAccuracy.length
      const consistencyMet = (1 - variance) >= goal.requirements.consistency

      const targetMet = accuracyMet && consistencyMet

      return {
        goalId: goal.id,
        type: 'mastery_update',
        progress: Math.round(currentAccuracy * 100),
        consistency: Math.round((1 - variance) * 100),
        target: Math.round(goal.requirements.minAccuracy * 100),
        isComplete: targetMet,
        message: targetMet ?
          '👑 ¡MAESTRÍA ALCANZADA! Dominio completo demostrado' :
          `Precisión: ${Math.round(currentAccuracy * 100)}% | Consistencia: ${Math.round((1 - variance) * 100)}%`
      }
    }

    return null
  }

  /**
   * Actualiza objetivo de recuperación
   */
  updateRecoveryGoal(goal, response) {
    goal.progress.attempts++
    
    // Establecer precisión inicial si es la primera actualización
    if (goal.progress.startingAccuracy === 0 && goal.progress.attempts === 1) {
      goal.progress.startingAccuracy = response.recentAccuracy || 0.5
    }

    // Calcular precisión actual
    if (response.recentAccuracy) {
      goal.progress.currentAccuracy = response.recentAccuracy
    }

    const improvement = goal.progress.currentAccuracy - goal.progress.startingAccuracy
    const targetImprovement = goal.requirements.targetAccuracy - goal.requirements.recoveryFromAccuracy
    const targetMet = improvement >= targetImprovement && goal.progress.attempts >= goal.requirements.minAttempts

    return {
      goalId: goal.id,
      type: 'recovery_update',
      startAccuracy: Math.round(goal.progress.startingAccuracy * 100),
      currentAccuracy: Math.round(goal.progress.currentAccuracy * 100),
      improvement: Math.round(improvement * 100),
      target: Math.round(targetImprovement * 100),
      isComplete: targetMet,
      message: targetMet ?
        '🔥 ¡Recuperación épica! Has vuelto más fuerte que antes' :
        `Mejora: +${Math.round(improvement * 100)}% (objetivo: +${Math.round(targetImprovement * 100)}%)`
    }
  }

  /**
   * Actualiza objetivo de sesión
   */
  updateSessionGoal(goal, response) {
    if (goal.progress.sessionStart === null) {
      goal.progress.sessionStart = response.sessionStartTime || Date.now()
    }

    goal.progress.sessionAttempts++
    if (response.isCorrect) {
      goal.progress.sessionCorrect = (goal.progress.sessionCorrect || 0) + 1
    }

    goal.progress.sessionDuration = Date.now() - goal.progress.sessionStart
    goal.progress.sessionAccuracy = goal.progress.sessionCorrect / goal.progress.sessionAttempts

    const durationMet = goal.progress.sessionDuration >= goal.requirements.sessionDuration
    const accuracyMet = goal.progress.sessionAccuracy >= goal.requirements.minAccuracy
    const targetMet = durationMet && accuracyMet

    return {
      goalId: goal.id,
      type: 'session_update',
      duration: Math.round(goal.progress.sessionDuration / (1000 * 60)), // minutos
      targetDuration: Math.round(goal.requirements.sessionDuration / (1000 * 60)),
      accuracy: Math.round(goal.progress.sessionAccuracy * 100),
      targetAccuracy: Math.round(goal.requirements.minAccuracy * 100),
      isComplete: targetMet,
      message: targetMet ?
        '🏃 ¡Maratón completado! Sesión larga con excelente rendimiento' :
        `${Math.round(goal.progress.sessionDuration / (1000 * 60))}min @ ${Math.round(goal.progress.sessionAccuracy * 100)}%`
    }
  }

  /**
   * Verifica objetivos completados
   */
  checkCompletedGoals() {
    const completed = []

    this.activeGoals.forEach((goal, goalId) => {
      if (this.isGoalCompleted(goal)) {
        goal.status = 'completed'
        goal.completedAt = Date.now()
        
        // Otorgar puntos y actualizar perfil
        const points = Math.round(goal.points * goal.motivationalBonus)
        this.userProfile.totalPoints += points
        
        // Agregar badge si es especial
        const badge = this.getBadgeForGoal(goal)
        if (badge) {
          this.userProfile.badges.push(badge)
        }

        completed.push({
          ...goal,
          pointsAwarded: points,
          badge
        })

        // Mover a completados y remover de activos
        this.completedGoals.push(goal)
        this.activeGoals.delete(goalId)
        
        this.goalMetrics.totalGoalsCompleted++
      }
    })

    // Actualizar métricas
    if (this.goalMetrics.totalGoalsGenerated > 0) {
      this.goalMetrics.completionRate = this.goalMetrics.totalGoalsCompleted / this.goalMetrics.totalGoalsGenerated
    }

    return completed
  }

  /**
   * Determina si un objetivo está completado
   */
  isGoalCompleted(goal) {
    switch (goal.type) {
      case 'accuracy': {
        return goal.progress.attempts >= goal.requirements.minAttempts &&
               goal.progress.currentAccuracy >= goal.requirements.targetAccuracy
      }
      case 'speed': {
        const speedRate = goal.progress.fastResponses / goal.progress.totalResponses
        return goal.progress.totalResponses >= goal.requirements.minAttempts &&
               speedRate >= (goal.requirements.minAccuracy || 0.8)
      }
      case 'streak': {
        return goal.progress.currentStreak >= goal.requirements.targetStreak
      }
      case 'exploration': {
        const withinTimeLimit = !goal.timeLimit || (Date.now() - goal.createdAt) <= goal.timeLimit
        return goal.progress.totalVerbs >= goal.requirements.uniqueVerbs && withinTimeLimit
      }
      case 'mastery': {
        if (goal.progress.attempts < goal.requirements.minAttempts) return false
        const accuracy = goal.progress.correct / goal.progress.attempts
        const mean = goal.progress.recentAccuracy.reduce((sum, val) => sum + val, 0) / goal.progress.recentAccuracy.length
        const variance = goal.progress.recentAccuracy.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / goal.progress.recentAccuracy.length
        return accuracy >= goal.requirements.minAccuracy && (1 - variance) >= goal.requirements.consistency
      }
      case 'recovery': {
        const improvement = goal.progress.currentAccuracy - goal.progress.startingAccuracy
        const targetImprovement = goal.requirements.targetAccuracy - goal.requirements.recoveryFromAccuracy
        return improvement >= targetImprovement && goal.progress.attempts >= goal.requirements.minAttempts
      }
      case 'session': {
        return goal.progress.sessionDuration >= goal.requirements.sessionDuration &&
               goal.progress.sessionAccuracy >= goal.requirements.minAccuracy
      }
      default:
        return false
    }
  }

  /**
   * Obtiene badge especial para objetivo completado
   */
  getBadgeForGoal(goal) {
    const specialBadges = {
      mastery: { name: '👑 Maestro', description: 'Dominio completo alcanzado' },
      streak_50: { name: '🔥 Imparable', description: 'Racha de 50+ respuestas' },
      speed_expert: { name: '⚡ Relámpago', description: 'Velocidad y precisión extrema' },
      explorer_100: { name: '🗺️ Gran Explorador', description: '100+ verbos diferentes' }
    }

    // Lógica para badges especiales
    if (goal.type === 'mastery') return specialBadges.mastery
    if (goal.type === 'streak' && goal.requirements.targetStreak >= 50) return specialBadges.streak_50
    if (goal.type === 'speed' && goal.requirements.maxResponseTime <= 2000) return specialBadges.speed_expert
    if (goal.type === 'exploration' && goal.requirements.uniqueVerbs >= 100) return specialBadges.explorer_100

    return null
  }

  /**
   * Mantiene el pool de objetivos activos
   */
  maintainGoalPool() {
    const { ACTIVE_GOALS_MIN, ACTIVE_GOALS_MAX } = PROGRESS_CONFIG.EMOTIONAL_INTELLIGENCE.GOALS
    
    // Generar nuevos objetivos para mantener el mínimo
    while (this.activeGoals.size < ACTIVE_GOALS_MIN + 1) {
      const context = this.buildCurrentContext()
      const newGoal = this.generateGoal(context)
      if (newGoal) {
        this.activeGoals.set(newGoal.id, newGoal)
      }
    }
    
    // Remover exceso si hay demasiados
    if (this.activeGoals.size > ACTIVE_GOALS_MAX) {
      const oldestGoals = Array.from(this.activeGoals.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt)
        .slice(0, this.activeGoals.size - ACTIVE_GOALS_MAX)
      
      oldestGoals.forEach(([goalId]) => {
        this.activeGoals.delete(goalId)
      })
    }

    // Remover objetivos expirados
    const now = Date.now()
    this.activeGoals.forEach((goal, goalId) => {
      if (goal.timeLimit && (now - goal.createdAt) > goal.timeLimit) {
        if (!this.isGoalCompleted(goal)) {
          goal.status = 'expired'
          this.activeGoals.delete(goalId)
        }
      }
    })
  }

  /**
   * Construye contexto actual para generación de objetivos
   */
  buildCurrentContext() {
    // Este método sería llamado con datos reales del sistema de progreso
    return {
      userPerformance: {
        recentAccuracy: 0.75, // Placeholder
        averageResponseTime: 5000,
        currentStreak: 3
      },
      recentActivity: {
        uniqueVerbsRecent: 15,
        sessionsToday: 2
      },
      sessionData: {
        startTime: Date.now()
      }
    }
  }

  /**
   * Obtiene el estado actual del sistema de objetivos
   */
  getCurrentGoalsState() {
    return {
      activeGoals: Array.from(this.activeGoals.values()),
      recentCompleted: this.completedGoals.slice(-5),
      userProfile: this.userProfile,
      metrics: this.goalMetrics,
      progressSummary: this.generateProgressSummary()
    }
  }

  /**
   * Genera resumen de progreso
   */
  generateProgressSummary() {
    const activeGoalsArray = Array.from(this.activeGoals.values())
    
    return {
      totalActive: activeGoalsArray.length,
      nearCompletion: activeGoalsArray.filter(g => this.isNearCompletion(g)).length,
      pointsThisSession: this.calculateSessionPoints(),
      nextMilestone: this.getNextMilestone(),
      motivationalMessage: this.getMotivationalMessage()
    }
  }

  /**
   * Determina si un objetivo está cerca de completarse
   */
  isNearCompletion(goal) {
    // Lógica simple: más del 80% de progreso
    switch (goal.type) {
      case 'accuracy':
        return goal.progress.attempts >= goal.requirements.minAttempts * 0.8
      case 'streak':
        return goal.progress.currentStreak >= goal.requirements.targetStreak * 0.8
      default:
        return false
    }
  }

  /**
   * Calcula puntos ganados en la sesión actual
   */
  calculateSessionPoints() {
    return this.completedGoals
      .filter(g => Date.now() - g.completedAt < 3600000) // Última hora
      .reduce((sum, g) => sum + (g.pointsAwarded || g.points), 0)
  }

  /**
   * Obtiene el próximo hito/milestone
   */
  getNextMilestone() {
    const milestones = [100, 500, 1000, 2500, 5000, 10000]
    const currentPoints = this.userProfile.totalPoints
    
    const nextMilestone = milestones.find(m => m > currentPoints)
    if (nextMilestone) {
      return {
        points: nextMilestone,
        remaining: nextMilestone - currentPoints,
        progress: currentPoints / nextMilestone
      }
    }
    
    return null
  }

  /**
   * Genera mensaje motivacional
   */
  getMotivationalMessage() {
    const messages = [
      '¡Vas excelente! Sigue así',
      'Cada respuesta te acerca a tus objetivos',
      'Tu progreso es impresionante',
      'Un paso más hacia la maestría',
      'El esfuerzo constante da frutos'
    ]

    return messages[Math.floor(Math.random() * messages.length)]
  }

  /**
   * Cargar datos de objetivos desde almacenamiento
   */
  async loadGoalsData() {
    try {
      const stored = localStorage.getItem('dynamic-goals-data')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.activeGoals) {
          this.activeGoals = new Map(data.activeGoals)
        }
        if (data.completedGoals) {
          this.completedGoals = data.completedGoals
        }
        if (data.userProfile) {
          this.userProfile = { ...this.userProfile, ...data.userProfile }
        }
        if (data.goalMetrics) {
          this.goalMetrics = { ...this.goalMetrics, ...data.goalMetrics }
        }
      }
    } catch (e) {
      console.warn('Failed to load goals data:', e)
    }
  }

  /**
   * Guardar datos de objetivos
   */
  async saveGoalsData() {
    try {
      const data = {
        activeGoals: Array.from(this.activeGoals.entries()),
        completedGoals: this.completedGoals,
        userProfile: this.userProfile,
        goalMetrics: this.goalMetrics,
        lastSaved: Date.now()
      }
      localStorage.setItem('dynamic-goals-data', JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save goals data:', e)
    }
  }

  /**
   * Reiniciar sistema de objetivos
   */
  reset() {
    this.activeGoals.clear()
    this.completedGoals = []
    this.userProfile = {
      level: 'B1',
      interests: [],
      achievementStyle: 'balanced',
      preferredChallenge: 'medium',
      streak: 0,
      totalPoints: 0,
      badges: []
    }
    this.goalMetrics = {
      totalGoalsGenerated: 0,
      totalGoalsCompleted: 0,
      avgCompletionTime: 0,
      completionRate: 0,
      preferredGoalTypes: new Map()
    }
    this.saveGoalsData()
  }
}

// Instancia global del sistema de objetivos
export const dynamicGoalsSystem = new DynamicGoalsSystem()

/**
 * Función de procesamiento para el hook principal
 */
export const processResponseForGoals = (response) => {
  return dynamicGoalsSystem.processResponse(response)
}

/**
 * Función para obtener estado actual de objetivos
 */
export const getCurrentGoalsState = () => {
  return dynamicGoalsSystem.getCurrentGoalsState()
}

// Configurar auto-save con memory management
if (typeof setInterval !== 'undefined') {
  registerInterval(
    'DynamicGoals',
    () => dynamicGoalsSystem.saveGoalsData(),
    PROGRESS_CONFIG.AUTO_SAVE.DYNAMIC_GOALS,
    'Auto-save goals data'
  )
}

// Registrar sistema para cleanup
memoryManager.registerSystem('DynamicGoals', () => {
  dynamicGoalsSystem.reset()
})

// Debugging unificado en navegador
if (typeof window !== 'undefined') {
  window.SpanishConjugator = window.SpanishConjugator || {}
  window.SpanishConjugator.DynamicGoals = {
    getState: getCurrentGoalsState,
    processResponse: processResponseForGoals,
    reset: () => dynamicGoalsSystem.reset()
  }
  
  logger.systemInit('Dynamic Goals Debug Interface')
}

export default dynamicGoalsSystem
