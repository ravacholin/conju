// Objetivos semanales para el sistema de progreso

import { getMasteryByUser, getAttemptsByUser } from './database.js'
import { getUserSettings } from './userManager.js'

// Configuración de objetivos predeterminados
const DEFAULT_WEEKLY_GOALS = {
  CELLS_TO_IMPROVE: 3,
  MIN_SCORE: 75,
  SESSIONS: 5,
  ATTEMPTS: 50,
  FOCUS_TIME: 60 // minutos
}

/**
 * Obtiene los objetivos semanales del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Objetivos semanales
 */
export async function getWeeklyGoals(userId) {
  try {
    // Obtener configuraciones del usuario desde localStorage
    const userSettings = getUserSettings(userId)
    
    // Devolver objetivos guardados o usar predeterminados
    return userSettings.weeklyGoals || DEFAULT_WEEKLY_GOALS
  } catch (error) {
    console.error('Error al obtener objetivos semanales:', error)
    return DEFAULT_WEEKLY_GOALS
  }
}

/**
 * Verifica el progreso hacia los objetivos semanales
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Progreso hacia los objetivos
 */
export async function checkWeeklyProgress(userId) {
  try {
    const goals = await getWeeklyGoals(userId)
    const masteryRecords = await getMasteryByUser(userId)
    const attempts = await getAttemptsByUser(userId)

    // Calcular progreso real de los últimos 7 días
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const weeklyAttempts = attempts.filter(a => new Date(a.createdAt).getTime() >= weekAgo)
    const sessionsCompleted = new Set(weeklyAttempts.map(a => new Date(a.createdAt).toDateString())).size
    const attemptsMade = weeklyAttempts.length
    const focusTimeMs = weeklyAttempts.reduce((sum, a) => sum + (a.latencyMs || 0), 0)
    const focusTime = Math.round(focusTimeMs / 60000) // minutos

    // Celdas que superan el umbral de dominio
    const masteredCells = masteryRecords.filter(r => r.score >= goals.MIN_SCORE).length
    const cellsToImprove = Math.max(0, goals.CELLS_TO_IMPROVE - masteredCells)

    return {
      cellsToImprove,
      sessionsCompleted,
      attemptsMade,
      focusTime,
      masteredCells,
      goals
    }
  } catch (error) {
    console.error('Error al verificar progreso semanal:', error)
    return {}
  }
}

/**
 * Genera recomendaciones basadas en el progreso
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de recomendaciones
 */
export async function getRecommendations(userId) {
  try {
    const masteryRecords = await getMasteryByUser(userId)
    
    // Encontrar celdas con bajo mastery
    const strugglingCells = masteryRecords
      .filter(r => r.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
    
    // Generar recomendaciones
    const recommendations = []
    
    if (strugglingCells.length > 0) {
      recommendations.push({
        id: 'focus-struggling',
        title: 'Enfócate en tus puntos débiles',
        description: `Practica estas celdas: ${strugglingCells.map(c => `${c.mood}/${c.tense}`).join(', ')}`
      })
    }
    
    // Recomendación general
    recommendations.push({
      id: 'general-practice',
      title: 'Práctica regular',
      description: 'Dedica 15 minutos diarios a la práctica para mantener tu progreso'
    })
    
    return recommendations
  } catch (error) {
    console.error('Error al generar recomendaciones:', error)
    return []
  }
}

/**
 * Establece objetivos personalizados para el usuario
 * @param {string} userId - ID del usuario
 * @param {Object} customGoals - Objetivos personalizados
 * @returns {Promise<void>}
 */
export async function setCustomWeeklyGoals(userId, customGoals) {
  try {
    // Persistir en localStorage via userSettings
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('progress-user-settings')
      const store = raw ? JSON.parse(raw) : {}
      const key = userId || 'default'
      const base = store[key] || {}
      store[key] = { ...base, weeklyGoals: { ...DEFAULT_WEEKLY_GOALS, ...customGoals } }
      window.localStorage.setItem('progress-user-settings', JSON.stringify(store))
    }
    console.log(`✅ Objetivos personalizados establecidos para usuario ${userId}:`, customGoals)
  } catch (error) {
    console.error('Error al establecer objetivos personalizados:', error)
    throw error
  }
}

/**
 * Reinicia los objetivos semanales
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export async function resetWeeklyGoals(userId) {
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('progress-user-settings')
      const store = raw ? JSON.parse(raw) : {}
      const key = userId || 'default'
      const base = store[key] || {}
      store[key] = { ...base, weeklyGoals: { ...DEFAULT_WEEKLY_GOALS } }
      window.localStorage.setItem('progress-user-settings', JSON.stringify(store))
    }
    console.log(`✅ Objetivos semanales reiniciados para usuario ${userId}`)
  } catch (error) {
    console.error('Error al reiniciar objetivos semanales:', error)
    throw error
  }
}

/**
 * Verifica si se han cumplido los objetivos semanales
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estado de los objetivos
 */
export async function checkGoalsCompletion(userId) {
  try {
    const progress = await checkWeeklyProgress(userId)
    const goals = progress.goals || DEFAULT_WEEKLY_GOALS
    
    // Verificar cumplimiento de objetivos
    const completed = {
      cellsToImprove: progress.cellsToImprove <= 0,
      minScore: progress.masteredCells >= goals.CELLS_TO_IMPROVE,
      sessions: progress.sessionsCompleted >= goals.SESSIONS,
      attempts: progress.attemptsMade >= goals.ATTEMPTS,
      focusTime: progress.focusTime >= goals.FOCUS_TIME
    }
    
    // Calcular porcentaje de cumplimiento
    const totalGoals = Object.keys(completed).length
    const completedGoals = Object.values(completed).filter(Boolean).length
    const completionPercentage = (completedGoals / totalGoals) * 100
    
    return {
      completed,
      completionPercentage: Math.round(completionPercentage),
      progress,
      goals
    }
  } catch (error) {
    console.error('Error al verificar cumplimiento de objetivos:', error)
    return {
      completed: {},
      completionPercentage: 0,
      progress: {},
      goals: DEFAULT_WEEKLY_GOALS
    }
  }
}

/**
 * Obtiene el historial de objetivos semanales
 * @param {string} userId - ID del usuario
 * @param {number} _weeks - Número de semanas atrás
 * @returns {Promise<Array>} Historial de objetivos
 */
export async function getGoalsHistory(userId, _weeks = 4) {
  // En una implementación completa, esto obtendría el historial
  // de objetivos semanales del usuario
  
  // Por ahora, devolvemos un historial vacío
  return []
}

/**
 * Envía notificaciones de progreso
 * @param {string} userId - ID del usuario
 * @param {Object} _progress - Progreso actual
 * @returns {Promise<void>}
 */
export async function sendProgressNotifications(userId, _progress) {
  try {
    // En una implementación completa, esto enviaría notificaciones
    // al usuario sobre su progreso
    
    console.log(` Notificaciones de progreso enviadas a usuario ${userId}`)
  } catch (error) {
    console.error('Error al enviar notificaciones de progreso:', error)
    throw error
  }
}

/**
 * Calcula recompensas basadas en el progreso
 * @param {string} userId - ID del usuario
 * @param {Object} completion - Estado de cumplimiento
 * @returns {Promise<Object>} Recompensas obtenidas
 */
export async function calculateRewards(userId, completion) {
  try {
    // En una implementación completa, esto calcularía recompensas
    // basadas en el progreso del usuario
    
    const rewards = []
    
    // Recompensa por cumplir todos los objetivos
    if (completion.completionPercentage >= 100) {
      rewards.push({
        id: 'weekly-goal-master',
        title: 'Maestro Semanal',
        description: '¡Cumpliste todos tus objetivos esta semana!',
        points: 100
      })
    }
    
    // Recompensa por consistencia
    if (completion.completed.sessions && completion.completed.attempts) {
      rewards.push({
        id: 'consistent-practitioner',
        title: 'Practicante Consistente',
        description: 'Mantuviste una práctica regular toda la semana',
        points: 50
      })
    }
    
    // Recompensa por mejora
    if (completion.completed.cellsToImprove) {
      rewards.push({
        id: 'improvement-champion',
        title: 'Campeón de Mejora',
        description: 'Lograste mejorar las celdas objetivo',
        points: 75
      })
    }
    
    return {
      rewards,
      totalPoints: rewards.reduce((sum, reward) => sum + reward.points, 0)
    }
  } catch (error) {
    console.error('Error al calcular recompensas:', error)
    return {
      rewards: [],
      totalPoints: 0
    }
  }
}
