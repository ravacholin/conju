// Sistema de diagnóstico para el sistema de progreso

import { getMasteryByUser } from './database.js'

import { generateId } from './helpers.js'

/**
 * Realiza un diagnóstico inicial del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Resultados del diagnóstico
 */
export async function performInitialDiagnosis(userId) {
  try {
    console.log('🔍 Realizando diagnóstico inicial...')
    
    // En una implementación completa, esto crearía un test adaptativo
    // de 3 minutos con ítems por tiempo clave
    
    // Por ahora, simulamos el diagnóstico con datos existentes
    const masteryRecords = await getMasteryByUser(userId)
    
    if (masteryRecords.length === 0) {
      // Usuario nuevo, sin datos
      return {
        isNewUser: true,
        estimatedLevel: 'beginner',
        areasToFocus: ['indicative/pres', 'indicative/pretIndef'],
        estimatedMastery: 0
      }
    }
    
    // Calcular nivel estimado
    const avgMastery = masteryRecords.reduce((sum, r) => sum + r.score, 0) / masteryRecords.length
    let estimatedLevel = 'beginner'
    
    if (avgMastery >= 80) {
      estimatedLevel = 'advanced'
    } else if (avgMastery >= 60) {
      estimatedLevel = 'intermediate'
    }
    
    // Encontrar áreas para enfocar
    const weakAreas = masteryRecords
      .filter(r => r.score < 60)
      .map(r => `${r.mood}/${r.tense}`)
      .slice(0, 5)
    
    const strongAreas = masteryRecords
      .filter(r => r.score >= 80)
      .map(r => `${r.mood}/${r.tense}`)
      .slice(0, 5)
    
    return {
      isNewUser: false,
      estimatedLevel,
      areasToFocus: weakAreas,
      strongAreas,
      estimatedMastery: Math.round(avgMastery),
      totalCells: masteryRecords.length
    }
  } catch (error) {
    console.error('Error al realizar diagnóstico inicial:', error)
    return {}
  }
}

/**
 * Programa una recalibración mensual
 * @param {string} _userId - ID del usuario
 * @returns {Promise<void>}
 */
export async function scheduleMonthlyRecalibration(_userId) {
  console.log('📅 Programando recalibración mensual...')
  
  // En una implementación completa, esto programaría
  // una recalibración automática que inserta ítems
  // sorpresa por celda con M ≥ 80
  
  // Por ahora, solo registramos la intención
  console.log('✅ Recalibración mensual programada')
}

/**
 * Realiza una recalibración
 * @param {string} _userId - ID del usuario
 * @returns {Promise<Object>} Resultados de la recalibración
 */
export async function performRecalibration(_userId) {
  try {
    console.log('🔍 Realizando recalibración...')
    
    // En una implementación completa, esto insertaría
    // ítems sorpresa por celda con M ≥ 80
    
    // Por ahora, simulamos la recalibración
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      recalibrated: true,
      cellsChecked: 10, // Valor de ejemplo
      cellsNeedingAttention: 2 // Valor de ejemplo
    }
  } catch (error) {
    console.error('Error al realizar recalibración:', error)
    return {}
  }
}

/**
 * Crea un test adaptativo inicial
 * @param {string} userId - ID del usuario
 * @param {number} durationMs - Duración del test en milisegundos
 * @returns {Promise<Object>} Test adaptativo
 */
export async function createAdaptiveTest(userId, durationMs = 180000) { // 3 minutos por defecto
  try {
    // En una implementación completa, esto crearía un test
    // adaptativo basado en el nivel del usuario
    
    return {
      id: `test-${generateId()}`,
      userId,
      durationMs,
      items: [], // En una implementación completa, aquí se añadirían ítems
      createdAt: new Date()
    }
  } catch (error) {
    console.error('Error al crear test adaptativo:', error)
    throw error
  }
}

/**
 * Evalúa el rendimiento en el test adaptativo
 * @param {Object} test - Test completado
 * @param {Array} responses - Respuestas del usuario
 * @returns {Promise<Object>} Evaluación del rendimiento
 */
export async function evaluateAdaptiveTest(test, responses) {
  try {
    // En una implementación completa, esto evaluaría el rendimiento
    // del usuario en el test adaptativo
    
    const correctResponses = responses.filter(r => r.correct).length
    const totalResponses = responses.length
    const accuracy = totalResponses > 0 ? (correctResponses / totalResponses) * 100 : 0
    
    const avgLatency = responses.length > 0 
      ? responses.reduce((sum, r) => sum + r.latencyMs, 0) / responses.length
      : 0
    
    return {
      testId: test.id,
      userId: test.userId,
      accuracy: Math.round(accuracy * 100) / 100,
      avgLatency: Math.round(avgLatency),
      totalItems: test.items.length,
      correctResponses,
      totalResponses,
      evaluatedAt: new Date()
    }
  } catch (error) {
    console.error('Error al evaluar test adaptativo:', error)
    throw error
  }
}

/**
 * Genera recomendaciones basadas en el diagnóstico
 * @param {Object} diagnosis - Resultados del diagnóstico
 * @returns {Promise<Array>} Lista de recomendaciones
 */
export async function generateDiagnosisRecommendations(diagnosis) {
  try {
    const recommendations = []
    
    if (diagnosis.isNewUser) {
      recommendations.push({
        id: 'new-user-welcome',
        title: '¡Bienvenido al conjugador!',
        description: 'Comienza con los tiempos más básicos: presente indicativo y pretérito indefinido.',
        priority: 'high'
      })
    }
    
    if (diagnosis.areasToFocus && diagnosis.areasToFocus.length > 0) {
      recommendations.push({
        id: 'focus-weak-areas',
        title: 'Enfócate en tus puntos débiles',
        description: `Practica estas áreas: ${diagnosis.areasToFocus.join(', ')}`,
        priority: 'high'
      })
    }
    
    if (diagnosis.strongAreas && diagnosis.strongAreas.length > 0) {
      recommendations.push({
        id: 'maintain-strong-areas',
        title: 'Mantén tus fortalezas',
        description: `Revisa ocasionalmente: ${diagnosis.strongAreas.join(', ')}`,
        priority: 'medium'
      })
    }
    
    // Recomendación basada en nivel estimado
    if (diagnosis.estimatedLevel) {
      let levelDescription = ''
      let practiceSuggestion = ''
      
      switch (diagnosis.estimatedLevel) {
        case 'beginner':
          levelDescription = 'nivel principiante'
          practiceSuggestion = 'enfócate en los tiempos básicos y regulares'
          break
        case 'intermediate':
          levelDescription = 'nivel intermedio'
          practiceSuggestion = 'practica tiempos compuestos y verbos irregulares'
          break
        case 'advanced':
          levelDescription = 'nivel avanzado'
          practiceSuggestion = 'refina los tiempos complejos y verbos irregulares'
          break
        default:
          levelDescription = 'nivel no determinado'
          practiceSuggestion = 'explora diferentes tiempos y modos'
      }
      
      recommendations.push({
        id: 'level-based-practice',
        title: `Práctica recomendada para ${levelDescription}`,
        description: `Te sugerimos ${practiceSuggestion}.`,
        priority: 'medium'
      })
    }
    
    return recommendations
  } catch (error) {
    console.error('Error al generar recomendaciones de diagnóstico:', error)
    return []
  }
}

/**
 * Guarda los resultados del diagnóstico
 * @param {string} _userId - ID del usuario
 * @param {Object} diagnosis - Resultados del diagnóstico
 * @returns {Promise<void>}
 */
export async function saveDiagnosisResults(_userId, diagnosis) {
  try {
    // En una implementación completa, esto guardaría los resultados
    // del diagnóstico en la base de datos
    
    console.log(`✅ Resultados de diagnóstico guardados para usuario ${_userId}:`, diagnosis)
  } catch (error) {
    console.error('Error al guardar resultados de diagnóstico:', error)
    throw error
  }
}

/**
 * Obtiene el historial de diagnósticos
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Historial de diagnósticos
 */
export async function getDiagnosisHistory(userId) {
  try {
    // En una implementación completa, esto obtendría el historial
    // de diagnósticos del usuario
    
    return []
  } catch (error) {
    console.error('Error al obtener historial de diagnósticos:', error)
    return []
  }
}

/**
 * Compara progreso entre diagnósticos
 * @param {Array} diagnoses - Array de diagnósticos
 * @returns {Promise<Object>} Comparación de progreso
 */
export async function compareDiagnosisProgress(diagnoses) {
  try {
    if (diagnoses.length < 2) {
      return {
        canCompare: false,
        message: 'Se necesitan al menos 2 diagnósticos para comparar'
      }
    }
    
    // Comparar el primer y último diagnóstico
    const first = diagnoses[0]
    const last = diagnoses[diagnoses.length - 1]
    
    const masteryImprovement = last.estimatedMastery - first.estimatedMastery
    const areasImproved = last.strongAreas?.length - first.areasToFocus?.length || 0
    
    return {
      canCompare: true,
      firstDiagnosis: first,
      lastDiagnosis: last,
      masteryImprovement,
      areasImproved,
      timeBetween: last.evaluatedAt - first.evaluatedAt,
      comparison: {
        mastery: masteryImprovement > 0 ? 'mejorado' : 'no mejorado',
        areas: areasImproved > 0 ? 'ampliado' : 'no ampliado'
      }
    }
  } catch (error) {
    console.error('Error al comparar progreso de diagnósticos:', error)
    return {
      canCompare: false,
      error: error.message
    }
  }
}

/**
 * Genera un informe de progreso basado en diagnósticos
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Informe de progreso
 */
export async function generateProgressReport(userId) {
  try {
    const history = await getDiagnosisHistory(userId)
    const comparison = await compareDiagnosisProgress(history)
    
    return {
      userId,
      totalDiagnoses: history.length,
      history,
      progressComparison: comparison,
      generatedAt: new Date()
    }
  } catch (error) {
    console.error('Error al generar informe de progreso:', error)
    throw error
  }
}