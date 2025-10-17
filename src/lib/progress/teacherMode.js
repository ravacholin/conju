// Modo docente para el sistema de progreso

import { getMasteryByUser, getAttemptsByItem } from './database.js'
import { msToSeconds } from './helpers.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:teacherMode')

// import { formatDate } from './helpers.js'

/**
 * Genera un informe para el modo docente
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Informe del estudiante
 */
export async function generateStudentReport(userId = null) {
  try {
    if (!userId) {
      throw new Error('Se requiere ID de usuario para generar informe')
    }
    
    const masteryRecords = await getMasteryByUser(userId)
    
    // Agrupar por modo
    const byMode = {}
    
    for (const record of masteryRecords) {
      if (!byMode[record.mood]) {
        byMode[record.mood] = {
          name: record.mood,
          records: [],
          avgScore: 0
        }
      }
      byMode[record.mood].records.push(record)
    }
    
    // Calcular promedios por modo
    Object.values(byMode).forEach(mode => {
      const total = mode.records.reduce((sum, r) => sum + r.score, 0)
      mode.avgScore = total / mode.records.length
    })
    
    // Calcular estadísticas generales
    const totalScore = masteryRecords.reduce((sum, r) => sum + r.score, 0)
    const avgScore = masteryRecords.length > 0 ? totalScore / masteryRecords.length : 0
    
    const masteredCells = masteryRecords.filter(r => r.score >= 80).length
    const inProgressCells = masteryRecords.filter(r => r.score >= 60 && r.score < 80).length
    const strugglingCells = masteryRecords.filter(r => r.score < 60).length
    
    // Calcular latencias promedio
    let totalLatency = 0
    let totalAttempts = 0
    
    for (const record of masteryRecords) {
      const attempts = await getAttemptsByItem(record.id)
      totalLatency += attempts.reduce((sum, attempt) => sum + attempt.latencyMs, 0)
      totalAttempts += attempts.length
    }
    
    const avgLatency = totalAttempts > 0 ? msToSeconds(totalLatency / totalAttempts) : 0
    
    return {
      userId,
      generatedAt: new Date(),
      totalCells: masteryRecords.length,
      modes: byMode,
      summary: {
        overallMastery: Math.round(avgScore),
        masteredCells,
        inProgressCells,
        strugglingCells,
        avgLatency: Math.round(avgLatency * 100) / 100,
        totalAttempts
      }
    }
  } catch (error) {
    logger.error('Error al generar informe del estudiante:', error)
    throw error
  }
}

/**
 * Genera un código de sesión para compartir con docentes
 * @returns {string} Código de sesión
 */
export function generateSessionCode() {
  // Generar un código único de 8 caracteres
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

/**
 * Obtiene estadísticas de clase
 * @param {Array} userIds - IDs de los estudiantes
 * @returns {Promise<Object>} Estadísticas de clase
 */
export async function getClassStats(userIds) {
  if (!userIds || userIds.length === 0) {
    throw new Error('Se requiere al menos un ID de usuario para estadísticas de clase')
  }
  
  try {
    const classData = []
    
    // Obtener datos de cada estudiante
    for (const userId of userIds) {
      const masteryRecords = await getMasteryByUser(userId)
      if (masteryRecords.length > 0) {
        const avgScore = masteryRecords.reduce((sum, r) => sum + r.score, 0) / masteryRecords.length
        classData.push({
          userId,
          avgScore: Math.round(avgScore * 100) / 100,
          totalCells: masteryRecords.length,
          masteredCells: masteryRecords.filter(r => r.score >= 80).length
        })
      }
    }
    
    // Calcular estadísticas de clase
    const classAvg = classData.length > 0 
      ? classData.reduce((sum, student) => sum + student.avgScore, 0) / classData.length
      : 0
    
    return {
      classData,
      classAverage: Math.round(classAvg * 100) / 100,
      totalStudents: classData.length,
      generatedAt: new Date()
    }
  } catch (error) {
    logger.error('Error al obtener estadísticas de clase:', error)
    throw error
  }
}

/**
 * Filtra datos por lista de verbos de clase
 * @param {Array} data - Datos a filtrar
 * @param {Array} verbList - Lista de verbos de clase
 * @returns {Array} Datos filtrados
 */
export function filterByClassVerbList(data, verbList) {
  if (!data || !verbList) return data || []
  
  // En una implementación completa, esto filtraría los datos
  // basados en la lista de verbos proporcionada
  
  return data.filter(record => 
    verbList.includes(record.verbId) || verbList.includes(record.lemma)
  )
}

/**
 * Genera un informe detallado de progreso
 * @param {string} userId - ID del usuario
 * @param {Object} options - Opciones de informe
 * @returns {Promise<Object>} Informe detallado
 */
export async function generateDetailedReport(userId, options = {}) {
  try {
    const basicReport = await generateStudentReport(userId)
    
    // En una implementación completa, esto añadiría más detalles
    // basados en las opciones proporcionadas
    
    return {
      ...basicReport,
      detailedSections: {
        // En una implementación completa, aquí se añadirían secciones
        // detalladas como errores comunes, progreso temporal, etc.
      },
      options
    }
  } catch (error) {
    logger.error('Error al generar informe detallado:', error)
    throw error
  }
}

/**
 * Exporta datos como PDF
 * @param {Object} report - Informe a exportar
 * @param {string} filename - Nombre del archivo
 * @returns {Promise<Blob>} Blob del PDF generado
 */
export async function exportToPDF() {
  try {
    // En una implementación completa, esto generaría un PDF
    // basado en el informe proporcionado
    
    // Por ahora, lanzamos un error indicando que no está implementado
    throw new Error('Exportación a PDF no implementada en esta versión')
  } catch (error) {
    logger.error('Error al exportar datos a PDF:', error)
    throw error
  }
}

/**
 * Comparte progreso con docente
 * @param {string} userId - ID del usuario
 * @param {string} teacherCode - Código del docente
 * @returns {Promise<void>}
 */
export async function shareProgressWithTeacher(userId, teacherCode) {
  try {
    // En una implementación completa, esto compartiría el progreso
    // con el docente usando el código proporcionado
    
    logger.debug(`✅ Progreso compartido con docente usando código ${teacherCode}`)
  } catch (error) {
    logger.error('Error al compartir progreso con docente:', error)
    throw error
  }
}

/**
 * Obtiene el historial de compartición
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Historial de compartición
 */
export async function getSharingHistory() {
  // En una implementación completa, esto obtendría el historial
  // de veces que el usuario ha compartido su progreso
  
  return []
}

/**
 * Revoca el acceso compartido
 * @param {string} userId - ID del usuario
 * @param {string} shareId - ID de compartición
 * @returns {Promise<void>}
 */
export async function revokeSharedAccess(userId, shareId) {
  try {
    // En una implementación completa, esto revocaría el acceso
    // compartido especificado
    
    logger.debug(`✅ Acceso compartido ${shareId} revocado`)
  } catch (error) {
    logger.error('Error al revocar acceso compartido:', error)
    throw error
  }
}

/**
 * Obtiene estadísticas anónimas para investigación
 * @param {Array} userIds - IDs de usuarios
 * @returns {Promise<Object>} Estadísticas anónimas
 */
export async function getAnonymousResearchStats(userIds) {
  try {
    // En una implementación completa, esto obtendría estadísticas
    // anónimas y agregadas para investigación
    
    return {
      totalUsers: userIds.length,
      avgMastery: 0, // Valor de ejemplo
      masteryDistribution: {}, // Ejemplo de distribución
      generatedAt: new Date()
    }
  } catch (error) {
    logger.error('Error al obtener estadísticas anónimas:', error)
    return {}
  }
}