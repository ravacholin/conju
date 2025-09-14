// Sistema de restauración de datos de progreso
// Parte de la Fase 5: Exportación y respaldo de datos

import { saveToDB } from './database.js'
import { getCurrentUserId } from './userManager.js'

/**
 * Restaura datos de progreso desde un archivo exportado
 * @param {Object} importData - Datos importados
 * @param {Object} options - Opciones de importación
 * @returns {Promise<Object>} Resultado de la importación
 */
export async function restoreProgressData(importData, options = {}) {
  try {
    const { 
      overwriteExisting = false, 
      userId = null,
      validateData = true 
    } = options

    console.log('📥 Iniciando restauración de datos de progreso...')

    // Validar formato de datos
    if (validateData && !isValidExportFormat(importData)) {
      throw new Error('Formato de datos inválido')
    }

    const targetUserId = userId || getCurrentUserId()
    if (!targetUserId) {
      throw new Error('No se encontró ID de usuario para restaurar datos')
    }

    const { data } = importData
    const results = {
      attempts: { imported: 0, skipped: 0, errors: 0 },
      mastery: { imported: 0, skipped: 0, errors: 0 },
      schedules: { imported: 0, skipped: 0, errors: 0 },
      totalProcessed: 0,
      errors: []
    }

    // Restaurar intentos
    if (data.attempts?.length) {
      console.log(`📝 Restaurando ${data.attempts.length} intentos...`)
      const attemptsResult = await restoreDataType('attempts', data.attempts, targetUserId, overwriteExisting)
      results.attempts = attemptsResult
      results.totalProcessed += attemptsResult.imported
    }

    // Restaurar registros de mastery
    if (data.mastery?.length) {
      console.log(`🎯 Restaurando ${data.mastery.length} registros de dominio...`)
      const masteryResult = await restoreDataType('mastery', data.mastery, targetUserId, overwriteExisting)
      results.mastery = masteryResult
      results.totalProcessed += masteryResult.imported
    }

    // Restaurar horarios
    if (data.schedules?.length) {
      console.log(`⏰ Restaurando ${data.schedules.length} horarios...`)
      const schedulesResult = await restoreDataType('schedules', data.schedules, targetUserId, overwriteExisting)
      results.schedules = schedulesResult
      results.totalProcessed += schedulesResult.imported
    }

    console.log(`✅ Restauración completada: ${results.totalProcessed} registros importados`)
    return results
  } catch (error) {
    console.error('❌ Error al restaurar datos de progreso:', error)
    throw error
  }
}

/**
 * Restaura un tipo específico de datos
 * @param {string} dataType - Tipo de datos ('attempts', 'mastery', 'schedules')
 * @param {Array} records - Registros a restaurar
 * @param {string} userId - ID del usuario
 * @param {boolean} overwriteExisting - Si sobrescribir datos existentes
 * @returns {Promise<Object>} Resultado de la restauración
 */
async function restoreDataType(dataType, records, userId, overwriteExisting) {
  const result = { imported: 0, skipped: 0, errors: 0 }
  
  for (const record of records) {
    try {
      // Asignar el userId correcto
      const recordWithUserId = { ...record, userId }
      
      // Si no se permite sobrescribir, verificar si ya existe
      if (!overwriteExisting) {
        const exists = await checkRecordExists(dataType, recordWithUserId)
        if (exists) {
          result.skipped++
          continue
        }
      }
      
      // Guardar el registro
      await saveToDB(dataType, recordWithUserId)
      result.imported++
      
    } catch (error) {
      console.warn(`⚠️ Error al restaurar registro ${dataType}:`, error)
      result.errors++
    }
  }
  
  return result
}

/**
 * Verifica si un registro ya existe en la base de datos
 * @param {string} dataType - Tipo de datos
 * @param {Object} record - Registro a verificar
 * @returns {Promise<boolean>} Si el registro existe
 */
async function checkRecordExists(dataType, record) {
  // Implementación simplificada - en producción sería más robusta
  try {
    // Para attempts, verificar por timestamp e itemId
    if (dataType === 'attempts' && record.timestamp && record.itemId) {
      // Verificación básica por timestamp (podría mejorarse)
      return false // Por ahora, permitir duplicados
    }
    
    // Para mastery, verificar por mood, tense, person
    if (dataType === 'mastery' && record.mood && record.tense) {
      return false // Por ahora, permitir duplicados
    }
    
    // Para schedules, verificar por itemId
    if (dataType === 'schedules' && record.itemId) {
      return false // Por ahora, permitir duplicados
    }
    
    return false
  } catch (error) {
    console.warn('Error al verificar existencia de registro:', error)
    return false
  }
}

/**
 * Valida que los datos importados tengan el formato correcto
 * @param {Object} importData - Datos a validar
 * @returns {boolean} Si los datos son válidos
 */
function isValidExportFormat(importData) {
  if (!importData || typeof importData !== 'object') {
    return false
  }

  // Verificar metadata
  if (!importData.metadata || !importData.metadata.userId || !importData.metadata.exportDate) {
    return false
  }

  // Verificar estructura de datos
  if (!importData.data || typeof importData.data !== 'object') {
    return false
  }

  const { data } = importData
  
  // Verificar que al menos un tipo de datos esté presente
  const hasAttempts = Array.isArray(data.attempts)
  const hasMastery = Array.isArray(data.mastery)
  const hasSchedules = Array.isArray(data.schedules)
  
  if (!hasAttempts && !hasMastery && !hasSchedules) {
    return false
  }

  // Validar estructura básica de attempts
  if (hasAttempts && data.attempts.length > 0) {
    const sampleAttempt = data.attempts[0]
    if (!sampleAttempt.timestamp || !sampleAttempt.itemId) {
      return false
    }
  }

  return true
}

/**
 * Importa datos desde un archivo subido por el usuario
 * @param {File} file - Archivo a importar
 * @param {Object} options - Opciones de importación
 * @returns {Promise<Object>} Resultado de la importación
 */
export async function importFromFile(file, options = {}) {
  try {
    console.log(`📂 Importando datos desde archivo: ${file.name}`)
    
    const text = await file.text()
    let importData
    
    try {
      importData = JSON.parse(text)
    } catch (_parseError) {
      throw new Error('El archivo no contiene JSON válido')
    }
    
    const result = await restoreProgressData(importData, options)
    
    console.log(`📥 Importación desde archivo completada exitosamente`)
    return result
    
  } catch (error) {
    console.error('❌ Error al importar desde archivo:', error)
    throw error
  }
}

/**
 * Crea un respaldo automático de los datos actuales
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Datos de respaldo
 */
export async function createBackup(userId = null) {
  try {
    const actualUserId = userId || getCurrentUserId()
    console.log(`💾 Creando respaldo automático para usuario ${actualUserId}...`)
    
    // Usar el sistema de exportación existente
    const { exportProgressData } = await import('./dataExport.js')
    const backupData = await exportProgressData(actualUserId)
    
    // Agregar metadatos de respaldo
    backupData.metadata.backupType = 'automatic'
    backupData.metadata.backupId = `backup_${Date.now()}`
    
    // Guardar en localStorage como respaldo de emergencia
    const backupKey = `progress_backup_${actualUserId}`
    localStorage.setItem(backupKey, JSON.stringify(backupData))
    
    console.log(`✅ Respaldo creado con ID: ${backupData.metadata.backupId}`)
    return backupData
    
  } catch (error) {
    console.error('❌ Error al crear respaldo:', error)
    throw error
  }
}