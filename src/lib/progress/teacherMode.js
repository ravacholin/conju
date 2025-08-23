// Modo docente para el sistema de progreso

import { getMasteryByUser } from './database.js'
import { getCurrentUserId } from './index.js'
import { formatPercentage, formatRelativeDate } from './uiUtils.js'

/**
 * Genera un informe para el modo docente
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Informe del estudiante
 */
export async function generateStudentReport(userId = null) {
  const targetUserId = userId || getCurrentUserId()
  if (!targetUserId) return {}
  
  try {
    const masteryRecords = await getMasteryByUser(targetUserId)
    
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
    
    return {
      userId: targetUserId,
      generatedAt: new Date(),
      totalCells: masteryRecords.length,
      modes: byMode,
      summary: {
        overallMastery: masteryRecords.length > 0 
          ? masteryRecords.reduce((sum, r) => sum + r.score, 0) / masteryRecords.length 
          : 0,
        masteredCells: masteryRecords.filter(r => r.score >= 80).length,
        inProgressCells: masteryRecords.filter(r => r.score >= 60 && r.score < 80).length,
        strugglingCells: masteryRecords.filter(r => r.score < 60).length
      }
    }
  } catch (error) {
    console.error('Error al generar informe del estudiante:', error)
    return {}
  }
}

/**
 * Exporta datos como CSV
 * @param {Array} data - Datos a exportar
 * @param {string} filename - Nombre del archivo
 * @returns {string} Datos en formato CSV
 */
export function exportToCSV(data, filename = 'progress_data.csv') {
  if (!data || data.length === 0) return ''
  
  // Crear encabezados
  const headers = Object.keys(data[0]).join(',')
  
  // Crear filas
  const rows = data.map(row => 
    Object.values(row).map(value => 
      `"${String(value).replace(/"/g, '""')}"`
    ).join(',')
  )
  
  // Combinar todo
  const csv = [headers, ...rows].join('\n')
  
  // En una implementación completa, esto crearía un archivo descargable
  // Por ahora, solo devolvemos el contenido CSV
  return csv
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
  if (!userIds || userIds.length === 0) return {}
  
  try {
    const classData = []
    
    // Obtener datos de cada estudiante
    for (const userId of userIds) {
      const masteryRecords = await getMasteryByUser(userId)
      if (masteryRecords.length > 0) {
        const avgScore = masteryRecords.reduce((sum, r) => sum + r.score, 0) / masteryRecords.length
        classData.push({
          userId,
          avgScore,
          totalCells: masteryRecords.length,
          masteredCells: masteryRecords.filter(r => r.score >= 80).length
        })
      }
    }
    
    // Calcular estadísticas de clase
    const classAvg = classData.reduce((sum, student) => sum + student.avgScore, 0) / classData.length
    
    return {
      classData,
      classAverage: classAvg,
      totalStudents: classData.length,
      generatedAt: new Date()
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de clase:', error)
    return {}
  }
}