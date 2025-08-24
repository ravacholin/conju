// Análisis de progreso para el sistema de progreso

import { getMasteryByUser, getAttemptsByItem } from './database.js'
import { calculateMasteryForCell, calculateMasteryForItem } from './mastery.js'

/**
 * Obtiene datos para el mapa de calor
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Datos para el mapa de calor
 */
export async function getHeatMapData(userId) {
  try {
    // Obtener todos los mastery scores del usuario
    const masteryRecords = await getMasteryByUser(userId)
    
    // Agrupar por modo y tiempo
    const groupedData = {}
    
    for (const record of masteryRecords) {
      const key = `${record.mood}|${record.tense}`
      if (!groupedData[key]) {
        groupedData[key] = {
          mood: record.mood,
          tense: record.tense,
          scores: [],
          count: 0
        }
      }
      
      groupedData[key].scores.push(record.score)
      groupedData[key].count++
    }
    
    // Calcular promedios
    const heatMapData = Object.values(groupedData).map(group => ({
      mood: group.mood,
      tense: group.tense,
      score: group.scores.reduce((a, b) => a + b, 0) / group.scores.length,
      count: group.count,
      colorClass: getMasteryColorClass(group.scores.reduce((a, b) => a + b, 0) / group.scores.length)
    }))
    
    return heatMapData
  } catch (error) {
    console.error('Error al obtener datos para el mapa de calor:', error)
    return []
  }
}

/**
 * Determina el color para un valor de mastery
 * @param {number} score - Valor de mastery
 * @returns {string} Clase CSS para el color
 */
function getMasteryColorClass(score) {
  if (score >= 80) return 'mastery-high'
  if (score >= 60) return 'mastery-medium'
  return 'mastery-low'
}

/**
 * Obtiene datos para el radar de competencias
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Datos para el radar de competencias
 */
export async function getCompetencyRadarData(userId) {
  try {
    // En una implementación completa, esto calcularía valores reales
    // basados en los datos del usuario
    
    // Por ahora, simulamos los datos
    const masteryRecords = await getMasteryByUser(userId)
    
    if (masteryRecords.length === 0) {
      return {
        accuracy: 50,
        speed: 50,
        consistency: 50,
        lexicalBreadth: 50,
        transfer: 50
      }
    }
    
    // Calcular estadísticas reales
    const totalScore = masteryRecords.reduce((sum, record) => sum + record.score, 0)
    const avgScore = totalScore / masteryRecords.length
    
    // Calcular latencias promedio
    let totalLatency = 0
    let totalAttempts = 0
    
    for (const record of masteryRecords) {
      const attempts = await getAttemptsByItem(record.id)
      totalLatency += attempts.reduce((sum, attempt) => sum + attempt.latencyMs, 0)
      totalAttempts += attempts.length
    }
    
    const avgLatency = totalAttempts > 0 ? totalLatency / totalAttempts : 0
    
    // Determinar nivel de consistencia basado en variabilidad
    const scores = masteryRecords.map(r => r.score)
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    const stdDev = Math.sqrt(variance)
    const consistency = Math.max(0, 100 - (stdDev / 100 * 100))
    
    // Determinar amplitud léxica basada en número de verbos diferentes
    const uniqueVerbs = new Set(masteryRecords.map(r => r.verbId)).size
    const lexicalBreadth = Math.min(100, uniqueVerbs * 2) // Ajustar escala
    
    // Determinar transferencia basada en intentos sin pistas
    let totalWithoutHints = 0
    let correctWithoutHints = 0
    
    for (const record of masteryRecords) {
      const attempts = await getAttemptsByItem(record.id)
      const withoutHints = attempts.filter(a => a.hintsUsed === 0)
      totalWithoutHints += withoutHints.length
      correctWithoutHints += withoutHints.filter(a => a.correct).length
    }
    
    const transfer = totalWithoutHints > 0 
      ? (correctWithoutHints / totalWithoutHints) * 100 
      : 50
    
    return {
      accuracy: Math.round(avgScore),
      speed: Math.round(Math.max(0, 100 - (avgLatency / 10000 * 100))), // Ajustar escala
      consistency: Math.round(consistency),
      lexicalBreadth: Math.round(lexicalBreadth),
      transfer: Math.round(transfer)
    }
  } catch (error) {
    console.error('Error al obtener datos para el radar de competencias:', error)
    return {
      accuracy: 50,
      speed: 50,
      consistency: 50,
      lexicalBreadth: 50,
      transfer: 50
    }
  }
}

/**
 * Obtiene datos para la línea de progreso temporal
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Datos para la línea de progreso
 */
export async function getProgressLineData(userId) {
  try {
    // En una implementación completa, esto obtendría datos históricos
    // del progreso del usuario a lo largo del tiempo
    
    // Por ahora, generamos datos simulados
    const dates = []
    const today = new Date()
    
    // Generar datos para los últimos 30 días
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      dates.push({
        date,
        score: Math.floor(Math.random() * 30) + 50 // Valor aleatorio para demo
      })
    }
    
    return dates
  } catch (error) {
    console.error('Error al obtener datos para la línea de progreso:', error)
    return []
  }
}

/**
 * Obtiene estadísticas generales del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas generales
 */
export async function getUserStats(userId) {
  try {
    const masteryRecords = await getMasteryByUser(userId)
    
    if (masteryRecords.length === 0) {
      return {
        totalMastery: 50,
        masteredCells: 0,
        inProgressCells: 0,
        strugglingCells: 0,
        avgLatency: 0,
        totalAttempts: 0
      }
    }
    
    // Calcular estadísticas
    const totalScore = masteryRecords.reduce((sum, record) => sum + record.score, 0)
    const avgScore = totalScore / masteryRecords.length
    
    const mastered = masteryRecords.filter(r => r.score >= 80).length
    const inProgress = masteryRecords.filter(r => r.score >= 60 && r.score < 80).length
    const struggling = masteryRecords.filter(r => r.score < 60).length
    
    // Calcular latencias
    let totalLatency = 0
    let totalAttempts = 0
    
    for (const record of masteryRecords) {
      const attempts = await getAttemptsByItem(record.id)
      totalLatency += attempts.reduce((sum, attempt) => sum + attempt.latencyMs, 0)
      totalAttempts += attempts.length
    }
    
    const avgLatency = totalAttempts > 0 ? totalLatency / totalAttempts : 0
    
    return {
      totalMastery: Math.round(avgScore),
      masteredCells: mastered,
      inProgressCells: inProgress,
      strugglingCells: struggling,
      avgLatency: Math.round(avgLatency),
      totalAttempts: totalAttempts
    }
  } catch (error) {
    console.error('Error al obtener estadísticas del usuario:', error)
    return {
      totalMastery: 50,
      masteredCells: 0,
      inProgressCells: 0,
      strugglingCells: 0,
      avgLatency: 0,
      totalAttempts: 0
    }
  }
}

/**
 * Obtiene objetivos semanales del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Objetivos semanales
 */
export async function getWeeklyGoals(userId) {
  try {
    // En una implementación completa, esto obtendría los objetivos
    // guardados para el usuario
    
    return {
      cellsToImprove: 3, // Número de celdas a mejorar
      minScore: 75, // Puntaje mínimo objetivo
      sessions: 5, // Sesiones objetivo
      attempts: 50, // Intentos objetivo
      focusTime: 60 // Minutos de enfoque objetivo
    }
  } catch (error) {
    console.error('Error al obtener objetivos semanales:', error)
    return {
      cellsToImprove: 3,
      minScore: 75,
      sessions: 5,
      attempts: 50,
      focusTime: 60
    }
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
    
    // Calcular progreso
    const currentMastered = masteryRecords.filter(r => r.score >= goals.minScore).length
    const cellsToImprove = Math.max(0, goals.cellsToImprove - currentMastered)
    
    // En una implementación completa, esto calcularía el progreso real
    // basado en datos de sesiones, intentos y tiempo de enfoque
    
    return {
      cellsToImprove,
      sessionsCompleted: 3, // Valor de ejemplo
      attemptsMade: 35, // Valor de ejemplo
      focusTime: 45, // Valor de ejemplo
      goals
    }
  } catch (error) {
    console.error('Error al verificar progreso semanal:', error)
    return {
      cellsToImprove: 0,
      sessionsCompleted: 0,
      attemptsMade: 0,
      focusTime: 0,
      goals: {}
    }
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
    return [
      {
        id: 'general-practice',
        title: 'Práctica regular',
        description: 'Dedica 15 minutos diarios a la práctica para mantener tu progreso'
      }
    ]
  }
}