// Análisis en tiempo real basado en datos reales del usuario

import { getMasteryByUser, getAttemptsByUser } from './database.js'
import { getCurrentUserId, getUserSettings } from './userManager.js'

/**
 * Obtiene estadísticas precisas del usuario basadas en datos reales
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas detalladas del usuario
 */
export async function getRealUserStats(userId) {
  try {
    const masteryRecords = await getMasteryByUser(userId)
    const userSettings = getUserSettings(userId)
    const attempts = await getAttemptsByUser(userId)

    if (masteryRecords.length === 0) {
      return {
        totalMastery: 0,
        masteredCells: 0,
        inProgressCells: 0,
        strugglingCells: 0,
        avgLatency: 0,
        totalAttempts: attempts.length,
        totalSessions: userSettings.totalSessions || 0,
        accuracy: 0,
        bestStreak: 0,
        currentSessionStreak: 0,
        sessionBestStreak: 0
      }
    }
    
    // Calcular estadísticas básicas
    const totalScore = masteryRecords.reduce((sum, record) => sum + record.score, 0)
    const avgScore = totalScore / masteryRecords.length
    
    // Clasificar celdas por nivel de dominio
    const mastered = masteryRecords.filter(r => r.score >= 80).length
    const inProgress = masteryRecords.filter(r => r.score >= 60 && r.score < 80).length
    const struggling = masteryRecords.filter(r => r.score < 60).length
    
    // Calcular latencias y precisión agregadas desde intentos reales del usuario
    let totalLatency = 0
    let totalAttempts = 0
    let correctAttempts = 0
    // Rachas: por sesión y global
    let bestStreak = 0
    let sessionBestStreak = 0
    let currentSessionStreak = 0

    // Ordenar intentos por fecha
    const attemptsSorted = [...attempts].sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt))
    // Agrupar por sesión y calcular rachas
    const sessions = new Map()
    for (const a of attemptsSorted) {
      const sid = a.sessionId || 'unknown'
      if (!sessions.has(sid)) sessions.set(sid, [])
      sessions.get(sid).push(a)
    }
    // Determinar sesión actual (la más reciente por createdAt)
    let latestSessionId = null
    let latestSessionTime = 0
    sessions.forEach((arr, sid) => {
      const t = new Date(arr[arr.length-1]?.createdAt || 0).getTime()
      if (t >= latestSessionTime) { latestSessionTime = t; latestSessionId = sid }
    })

    for (const attempt of attempts) {
      totalLatency += attempt.latencyMs || 0
      totalAttempts++
      if (attempt.correct) correctAttempts++
    }

    // Calcular mejor racha global y racha actual/mejor de la sesión más reciente
    const calcBest = (arr) => {
      let best = 0, cur = 0
      for (const a of arr) {
        if (a.correct) { cur += 1; best = Math.max(best, cur) }
        else { cur = 0 }
      }
      return { best, cur }
    }
    // Global
    const g = calcBest(attemptsSorted)
    bestStreak = g.best
    // Sesión actual
    const latestArr = sessions.get(latestSessionId) || []
    const s = calcBest(latestArr)
    sessionBestStreak = s.best
    currentSessionStreak = s.cur
    
    const avgLatency = totalAttempts > 0 ? totalLatency / totalAttempts : 0
    const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0
    
    return {
      totalMastery: Math.round(avgScore),
      masteredCells: mastered,
      inProgressCells: inProgress,
      strugglingCells: struggling,
      avgLatency: Math.round(avgLatency),
      totalAttempts: totalAttempts,
      totalSessions: userSettings.totalSessions || 0,
      accuracy: Math.round(accuracy),
      bestStreak,
      sessionBestStreak,
      currentSessionStreak
    }
  } catch (error) {
    console.error('Error al obtener estadísticas reales del usuario:', error)
    return {
      totalMastery: 0,
      masteredCells: 0,
      inProgressCells: 0,
      strugglingCells: 0,
      avgLatency: 0,
      totalAttempts: 0,
      totalSessions: 0,
      accuracy: 0,
      bestStreak: 0
    }
  }
}

/**
 * Obtiene datos de competencias reales basados en análisis de rendimiento
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Datos del radar de competencias
 */
export async function getRealCompetencyRadarData(userId) {
  try {
    const masteryRecords = await getMasteryByUser(userId)
    
    if (masteryRecords.length === 0) {
      return {
        accuracy: 0,
        speed: 0,
        consistency: 0,
        lexicalBreadth: 0,
        transfer: 0
      }
    }
    
    // Calcular métricas reales
    const totalScore = masteryRecords.reduce((sum, record) => sum + record.score, 0)
    const avgScore = totalScore / masteryRecords.length
    
    // Precisión: basado en puntaje promedio de mastery
    const accuracy = Math.round(avgScore)
    
    // Velocidad: basado en latencias promedio de intentos reales del usuario
    const attempts = await getAttemptsByUser(userId)
    let totalLatency = 0
    let attemptCount = 0
    attempts.forEach(attempt => {
      if (attempt.latencyMs) {
        totalLatency += attempt.latencyMs
        attemptCount++
      }
    })
    
    // Velocidad inversa: menos latencia = mayor velocidad
    const avgLatency = attemptCount > 0 ? totalLatency / attemptCount : 10000
    const speed = Math.round(Math.max(0, 100 - (avgLatency / 100)))
    
    // Consistencia: basado en variabilidad de scores
    const scores = masteryRecords.map(r => r.score)
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
    const stdDev = Math.sqrt(variance)
    const consistency = Math.round(Math.max(0, 100 - (stdDev * 2))) // Escalar la variabilidad
    
    // Amplitud léxica: basado en número de verbos únicos practicados en intentos
    const uniqueVerbs = new Set(attempts.map(a => a.verbId)).size
    const lexicalBreadth = Math.round(Math.min(100, uniqueVerbs * 3)) // Escalar apropiadamente
    
    // Transferencia: analizar rendimiento en diferentes contextos
    const moodVariety = new Set(masteryRecords.map(r => r.mood)).size
    const tenseVariety = new Set(masteryRecords.map(r => r.tense)).size
    const contextVariety = moodVariety * tenseVariety
    const transfer = Math.round(Math.min(100, (contextVariety / 10) * avgScore))
    
    return {
      accuracy,
      speed,
      consistency,
      lexicalBreadth,
      transfer
    }
  } catch (error) {
    console.error('Error al obtener datos del radar de competencias:', error)
    return {
      accuracy: 0,
      speed: 0,
      consistency: 0,
      lexicalBreadth: 0,
      transfer: 0
    }
  }
}

/**
 * Obtiene recomendaciones inteligentes basadas en análisis de datos reales
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de recomendaciones personalizadas
 */
export async function getIntelligentRecommendations(userId) {
  try {
    const masteryRecords = await getMasteryByUser(userId)
    const userStats = await getRealUserStats(userId)
    const recommendations = []
    
    if (masteryRecords.length === 0) {
      recommendations.push({
        id: 'get-started',
        title: '¡Comienza tu práctica!',
        description: 'Realiza algunas conjugaciones para comenzar a generar datos de progreso',
        priority: 'high'
      })
      return recommendations
    }
    
    // Analizar puntos débiles
    const strugglingCells = masteryRecords
      .filter(r => r.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
    
    if (strugglingCells.length > 0) {
      recommendations.push({
        id: 'focus-struggling',
        title: 'Refuerza tus áreas débiles',
        description: `Enfócate en: ${strugglingCells.map(c => `${c.mood}/${c.tense}`).join(', ')}`,
        priority: 'high'
      })
    }
    
    // Analizar consistencia
    if (userStats.accuracy < 70) {
      recommendations.push({
        id: 'improve-accuracy',
        title: 'Mejora tu precisión',
        description: `Tu precisión actual es ${userStats.accuracy}%. Practica más lentamente para mejorar`,
        priority: 'medium'
      })
    }
    
    // Analizar velocidad
    if (userStats.avgLatency > 8000) { // 8 segundos
      recommendations.push({
        id: 'improve-speed',
        title: 'Aumenta tu velocidad',
        description: 'Practica respuestas más rápidas. Tiempo promedio actual: ' + 
                    Math.round(userStats.avgLatency / 1000) + 's',
        priority: 'low'
      })
    }
    
    // Análizar variedad
    const uniqueMoods = new Set(masteryRecords.map(r => r.mood)).size
    if (uniqueMoods < 3) {
      recommendations.push({
        id: 'expand-variety',
        title: 'Amplía tu práctica',
        description: 'Prueba diferentes modos gramaticales para una práctica más completa',
        priority: 'medium'
      })
    }
    
    // Recomendación de mantenimiento
    if (userStats.masteredCells > 5) {
      const masteredCells = masteryRecords.filter(r => r.score >= 80)
      const oldestMastered = masteredCells
        .sort((a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0))
        .slice(0, 2)
      
      if (oldestMastered.length > 0) {
        recommendations.push({
          id: 'maintain-mastery',
          title: 'Mantén tu dominio',
          description: `Repasa: ${oldestMastered.map(c => `${c.mood}/${c.tense}`).join(', ')} para mantener el nivel`,
          priority: 'low'
        })
      }
    }
    
    // Recomendación motivacional
    if (recommendations.length === 0 || userStats.accuracy > 80) {
      recommendations.push({
        id: 'keep-going',
        title: '¡Excelente progreso!',
        description: 'Continúa con tu práctica regular para mantener tu alto nivel',
        priority: 'low'
      })
    }
    
    return recommendations.slice(0, 4) // Limitar a 4 recomendaciones máximo
  } catch (error) {
    console.error('Error al generar recomendaciones inteligentes:', error)
    return [
      {
        id: 'general-practice',
        title: 'Práctica regular',
        description: 'Dedica 15 minutos diarios a la práctica para mejorar constantemente',
        priority: 'medium'
      }
    ]
  }
}

/**
 * Obtiene un resumen ejecutivo del progreso del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Resumen del progreso
 */
export async function getProgressSummary(userId) {
  const [userStats, competencyData, recommendations] = await Promise.all([
    getRealUserStats(userId),
    getRealCompetencyRadarData(userId),
    getIntelligentRecommendations(userId)
  ])
  
  const userSettings = getUserSettings(userId)
  const isNewUser = userStats.totalSessions < 3
  
  return {
    userStats,
    competencyData,
    recommendations,
    isNewUser,
    createdAt: userSettings.createdAt,
    lastActiveAt: userSettings.lastActiveAt,
    weeklyGoals: userSettings.weeklyGoals
  }
}
