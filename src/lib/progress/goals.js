// Manejo de objetivos semanales en el sistema de progreso

import { getMasteryByUser } from './database.js'
import { getCurrentUserId } from './index.js'

/**
 * Obtiene los objetivos semanales del usuario
 * @returns {Promise<Object>} Objetivos semanales
 */
export async function getWeeklyGoals() {
  const userId = getCurrentUserId()
  if (!userId) return {}
  
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
    return {}
  }
}

/**
 * Verifica el progreso hacia los objetivos semanales
 * @returns {Promise<Object>} Progreso hacia los objetivos
 */
export async function checkWeeklyProgress() {
  const userId = getCurrentUserId()
  if (!userId) return {}
  
  try {
    const goals = await getWeeklyGoals()
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
    return {}
  }
}

/**
 * Genera recomendaciones basadas en el progreso
 * @returns {Promise<Array>} Lista de recomendaciones
 */
export async function getRecommendations() {
  const userId = getCurrentUserId()
  if (!userId) return []
  
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