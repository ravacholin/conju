// Sistema de exportación de datos de progreso
// Parte de la Fase 5: Exportación y respaldo de datos

import { getAllFromDB } from './database.js'
import { getCurrentUserId } from './userManager.js'
import { formatDate } from './helpers.js'

/**
 * Exporta los datos de progreso del usuario en formato JSON
 * @param {string} userId - ID del usuario (opcional)
 * @returns {Promise<Object>} Datos de progreso exportados
 */
export async function exportProgressData(userId = null) {
  try {
    const actualUserId = userId || getCurrentUserId()
    if (!actualUserId) {
      throw new Error('No se encontró ID de usuario para exportar')
    }

    console.log(` Exportando datos de progreso para usuario ${actualUserId}...`)

    // Obtener todos los datos del usuario
    const attempts = await getAllFromDB('attempts', actualUserId)
    const mastery = await getAllFromDB('mastery', actualUserId) 
    const schedules = await getAllFromDB('schedules', actualUserId)
    
    const exportData = {
      metadata: {
        userId: actualUserId,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        totalAttempts: attempts.length,
        totalMasteryRecords: mastery.length,
        totalSchedules: schedules.length
      },
      data: {
        attempts,
        mastery,
        schedules
      }
    }

    console.log(`✅ Datos exportados: ${attempts.length} intentos, ${mastery.length} registros de dominio`)
    return exportData
  } catch (error) {
    console.error('❌ Error al exportar datos de progreso:', error)
    throw error
  }
}

/**
 * Exporta los datos en formato CSV
 * @param {string} userId - ID del usuario
 * @param {string} dataType - Tipo de datos a exportar ('attempts', 'mastery', 'schedules')
 * @returns {Promise<string>} Datos en formato CSV
 */
export async function exportToCSV(userId = null, dataType = 'attempts') {
  try {
    const actualUserId = userId || getCurrentUserId()
    if (!actualUserId) {
      throw new Error('No se encontró ID de usuario para exportar CSV')
    }

    console.log(` Exportando ${dataType} en formato CSV...`)
    
    const data = await getAllFromDB(dataType, actualUserId)
    
    if (!data.length) {
      return `No hay datos de ${dataType} para exportar`
    }

    // Generar headers del CSV basado en el primer registro
    const headers = Object.keys(data[0])
    
    // Convertir datos a CSV
    const csvLines = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escapar comillas y envolver en comillas si contiene comas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        }).join(',')
      )
    ]

    const csvContent = csvLines.join('\n')
    console.log(`✅ CSV generado con ${data.length} registros`)
    return csvContent
  } catch (error) {
    console.error(`❌ Error al exportar CSV de ${dataType}:`, error)
    throw error
  }
}

/**
 * Guarda los datos exportados como archivo descargable
 * @param {Object|string} data - Datos a guardar
 * @param {string} filename - Nombre del archivo
 * @param {string} type - Tipo MIME del archivo
 */
export function downloadExportedData(data, filename, type = 'application/json') {
  try {
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log(` Archivo descargado: ${filename}`)
  } catch (error) {
    console.error('❌ Error al descargar archivo:', error)
    throw error
  }
}

/**
 * Genera un reporte completo de progreso del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Reporte completo
 */
export async function generateProgressReport(userId = null) {
  try {
    const actualUserId = userId || getCurrentUserId()
    const exportData = await exportProgressData(actualUserId)
    
    const { attempts, mastery, schedules: _schedules } = exportData.data
    
    // Calcular estadísticas
    const stats = {
      totalPracticeTime: attempts.reduce((sum, attempt) => sum + (attempt.latencyMs || 0), 0),
      averageAccuracy: attempts.length ? 
        (attempts.filter(a => a.correct).length / attempts.length * 100).toFixed(1) : 0,
      masteryDistribution: calculateMasteryDistribution(mastery),
      practiceFrequency: calculatePracticeFrequency(attempts),
      strongestAreas: getTopMasteryAreas(mastery, true),
      weakestAreas: getTopMasteryAreas(mastery, false),
      totalSessions: new Set(attempts.map(a => a.sessionId)).size
    }
    
    const report = {
      ...exportData,
      statistics: stats,
      reportGenerated: formatDate(new Date())
    }
    
    console.log(' Reporte de progreso generado exitosamente')
    return report
  } catch (error) {
    console.error('❌ Error al generar reporte de progreso:', error)
    throw error
  }
}

// Funciones auxiliares para el reporte
function calculateMasteryDistribution(masteryData) {
  const distribution = { low: 0, medium: 0, high: 0 }
  
  masteryData.forEach(record => {
    const score = record.masteryScore || 0
    if (score < 40) distribution.low++
    else if (score < 70) distribution.medium++
    else distribution.high++
  })
  
  return distribution
}

function calculatePracticeFrequency(attempts) {
  const daysWithPractice = new Set(
    attempts.map(a => new Date(a.timestamp).toDateString())
  ).size
  
  return {
    totalDays: daysWithPractice,
    averageAttemptsPerDay: daysWithPractice ? (attempts.length / daysWithPractice).toFixed(1) : 0
  }
}

function getTopMasteryAreas(masteryData, highest = true) {
  return masteryData
    .sort((a, b) => highest ? b.masteryScore - a.masteryScore : a.masteryScore - b.masteryScore)
    .slice(0, 5)
    .map(record => ({
      area: `${record.mood}-${record.tense}`,
      score: record.masteryScore || 0
    }))
}