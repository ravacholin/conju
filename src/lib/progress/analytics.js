// Análisis de progreso para el sistema de progreso

import { getMasteryByUser, getAttemptsByUser } from './database.js'
// Mastery and goals utilities are imported where needed or re-exported below
import { getRealUserStats, getRealCompetencyRadarData, getIntelligentRecommendations } from './realTimeAnalytics.js'

/**
 * Obtiene datos para el mapa de calor
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Datos para el mapa de calor
 */
export async function getHeatMapData(userId, person = null) {
  try {
    // Obtener mastery y distribución de intentos para ponderar promedios
    const [masteryRecords, attempts] = await Promise.all([
      getMasteryByUser(userId),
      getAttemptsByUser(userId)
    ])
    
    // Agrupar por modo y tiempo
    const groupedData = {}
    
    // Precompute attempt counts per mood|tense|person
    const attemptCounts = new Map()
    attempts.forEach(a => {
      if (!a || !a.mood || !a.tense) return
      if (person && a.person && a.person !== person) return
      const key = `${a.mood}|${a.tense}|${a.person || ''}`
      attemptCounts.set(key, (attemptCounts.get(key) || 0) + 1)
    })

    for (const record of masteryRecords) {
      if (person && record.person && record.person !== person) continue
      const key = `${record.mood}|${record.tense}`
      if (!groupedData[key]) {
        groupedData[key] = {
          mood: record.mood,
          tense: record.tense,
          weightedSum: 0,
          weight: 0,
          count: 0 // total attempts contributing
        }
      }
      // Determine weight for this person cell: attempts in window (fallback to 1)
      const wKey = `${record.mood}|${record.tense}|${record.person || ''}`
      const w = attemptCounts.get(wKey) || 1
      groupedData[key].weightedSum += record.score * w
      groupedData[key].weight += w
      groupedData[key].count += attemptCounts.get(wKey) || 0
    }
    
    // Calcular promedios
    const heatMapData = Object.values(groupedData).map(group => {
      const score = group.weight > 0
        ? (group.weightedSum / group.weight)
        : 0
      return {
        mood: group.mood,
        tense: group.tense,
        score,
        count: group.count, // total attempts across persons (0 if no attempt yet)
        colorClass: getMasteryColorClass(score)
      }
    })
    
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
// Use real-time analytics for competency radar data
export const getCompetencyRadarData = getRealCompetencyRadarData

/**
 * Obtiene datos para la línea de progreso temporal
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Datos para la línea de progreso
 */
export async function getProgressLineData(userId) {
  try {
    // Obtener todos los mastery records del usuario
    const masteryRecords = await getMasteryByUser(userId)
    
    if (masteryRecords.length === 0) {
      return []
    }
    
    // Agrupar por fecha
    const dataByDate = {}
    
    masteryRecords.forEach(record => {
      // Asumir que hay un campo updatedAt o timestamp
      const dateKey = record.updatedAt 
        ? new Date(record.updatedAt).toDateString()
        : new Date().toDateString()
      
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = {
          date: new Date(dateKey),
          scores: []
        }
      }
      
      dataByDate[dateKey].scores.push(record.score)
    })
    
    // Calcular promedios por día y ordenar
    const progressData = Object.values(dataByDate)
      .map(dayData => ({
        date: dayData.date,
        score: Math.round(dayData.scores.reduce((sum, score) => sum + score, 0) / dayData.scores.length)
      }))
      .sort((a, b) => a.date - b.date)
    
    // Si hay pocos datos, llenar con datos de los últimos 30 días
    if (progressData.length < 7) {
      const today = new Date()
      const avgScore = progressData.length > 0 
        ? progressData.reduce((sum, item) => sum + item.score, 0) / progressData.length
        : 50
      
      const filledData = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        // Buscar si hay dato real para esta fecha
        const realData = progressData.find(item => 
          item.date.toDateString() === date.toDateString()
        )
        
        filledData.push(realData || {
          date,
          score: Math.round(avgScore + (Math.random() - 0.5) * 10) // Ligera variación
        })
      }
      
      return filledData
    }
    
    return progressData
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
// Use real-time analytics for user statistics
export const getUserStats = getRealUserStats

// Re-export functions from goals.js for backward compatibility
export { getWeeklyGoals, checkWeeklyProgress } from './goals.js'

/**
 * Genera recomendaciones basadas en el progreso
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de recomendaciones
 */
// Use intelligent recommendations from real-time analytics
export const getRecommendations = getIntelligentRecommendations

/**
 * Obtiene estadísticas resumidas de SRS (debidos ahora y hoy)
 * @param {string} userId - ID del usuario
 * @param {Date} now - Fecha de referencia
 * @returns {Promise<{dueNow:number,dueToday:number}>}
 */
export async function getSRSStats(userId, now = new Date()) {
  try {
    const { getDueSchedules } = await import('./database.js')
    const allDue = await getDueSchedules(userId, now)
    // dueToday: items con nextDue hasta fin del día
    const endOfDay = new Date(now)
    endOfDay.setHours(23,59,59,999)
    const dueToday = allDue.length
    // For simplicity, consider dueNow same as dueToday (no time granularity in UI yet)
    return { dueNow: allDue.length, dueToday }
  } catch (e) {
    console.warn('SRS stats unavailable:', e)
    return { dueNow: 0, dueToday: 0 }
  }
}
