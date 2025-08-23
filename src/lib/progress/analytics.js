// Vistas analíticas para el sistema de progreso

import { getMasteryByUser } from './database.js'
import { getCurrentUserId } from './index.js'
import { formatPercentage, getMasteryColorClass } from './uiUtils.js'

/**
 * Obtiene datos para el mapa de calor de mastery
 * @returns {Promise<Object>} Datos para el mapa de calor
 */
export async function getHeatMapData() {
  const userId = getCurrentUserId()
  if (!userId) return []
  
  try {
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
 * Obtiene datos para el radar de competencias
 * @returns {Promise<Object>} Datos para el radar de competencias
 */
export async function getCompetencyRadarData() {
  const userId = getCurrentUserId()
  if (!userId) return {}
  
  try {
    // En una implementación completa, esto calcularía valores reales
    // basados en los datos del usuario
    return {
      accuracy: 75,
      speed: 68,
      consistency: 72,
      lexicalBreadth: 65,
      transfer: 60
    }
  } catch (error) {
    console.error('Error al obtener datos para el radar de competencias:', error)
    return {}
  }
}

/**
 * Obtiene datos para la línea de progreso temporal
 * @returns {Promise<Array>} Datos para la línea de progreso
 */
export async function getProgressLineData() {
  const userId = getCurrentUserId()
  if (!userId) return []
  
  try {
    // En una implementación completa, esto obtendría datos históricos
    // del progreso del usuario a lo largo del tiempo
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
 * @returns {Promise<Object>} Estadísticas generales
 */
export async function getUserStats() {
  const userId = getCurrentUserId()
  if (!userId) return {}
  
  try {
    const masteryRecords = await getMasteryByUser(userId)
    
    if (masteryRecords.length === 0) {
      return {
        totalMastery: 0,
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
    
    return {
      totalMastery: Math.round(avgScore),
      masteredCells: mastered,
      inProgressCells: inProgress,
      strugglingCells: struggling,
      avgLatency: 0, // En una implementación completa, esto se calcularía
      totalAttempts: masteryRecords.reduce((sum, record) => sum + record.n, 0)
    }
  } catch (error) {
    console.error('Error al obtener estadísticas del usuario:', error)
    return {}
  }
}