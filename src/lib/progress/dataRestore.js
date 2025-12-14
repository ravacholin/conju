// Sistema de restauración de datos de progreso
// Parte de la Fase 5: Exportación y respaldo de datos

import { saveToDB, getFromDB, getByIndex, getOneByIndex, getAllFromDB } from './database.js'
import { STORAGE_CONFIG } from './config.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:dataRestore')


const STORE_MAP = {
  attempts: STORAGE_CONFIG.STORES.ATTEMPTS,
  mastery: STORAGE_CONFIG.STORES.MASTERY,
  schedules: STORAGE_CONFIG.STORES.SCHEDULES
}

async function resolveUserId(userIdOverride = null) {
  if (userIdOverride) return userIdOverride

  try {
    const module = await import('./userManager/index.js')
    if (typeof module.getCurrentUserId === 'function') {
      return module.getCurrentUserId() || null
    }
  } catch (error) {
    logger.warn('⚠️ No se pudo obtener el userId actual:', error?.message || error)
  }

  return null
}

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

    logger.debug('📥 Iniciando restauración de datos de progreso...')

    // Validar formato de datos
    if (validateData && !isValidExportFormat(importData)) {
      throw new Error('Formato de datos inválido')
    }

    const targetUserId = await resolveUserId(userId)
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
      logger.debug(`📝 Restaurando ${data.attempts.length} intentos...`)
      const attemptsResult = await restoreDataType('attempts', data.attempts, targetUserId, overwriteExisting)
      results.attempts = attemptsResult
      results.totalProcessed += attemptsResult.imported
    }

    // Restaurar registros de mastery
    if (data.mastery?.length) {
      logger.debug(`🎯 Restaurando ${data.mastery.length} registros de dominio...`)
      const masteryResult = await restoreDataType('mastery', data.mastery, targetUserId, overwriteExisting)
      results.mastery = masteryResult
      results.totalProcessed += masteryResult.imported
    }

    // Restaurar horarios
    if (data.schedules?.length) {
      logger.debug(`⏰ Restaurando ${data.schedules.length} horarios...`)
      const schedulesResult = await restoreDataType('schedules', data.schedules, targetUserId, overwriteExisting)
      results.schedules = schedulesResult
      results.totalProcessed += schedulesResult.imported
    }

    logger.debug(`✅ Restauración completada: ${results.totalProcessed} registros importados`)
    return results
  } catch (error) {
    logger.error('❌ Error al restaurar datos de progreso:', error)
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
  const storeName = STORE_MAP[dataType]

  if (!storeName) {
    logger.warn(`⚠️ Tipo de datos no soportado para restauración: ${dataType}`)
    return result
  }
  
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
      await saveToDB(storeName, recordWithUserId)
      result.imported++
      
    } catch (error) {
      logger.warn(`⚠️ Error al restaurar registro ${dataType}:`, error)
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
  try {
    const storeName = STORE_MAP[dataType]
    if (!storeName) return false

    if (record.id) {
      const existingById = await getFromDB(storeName, record.id)
      if (existingById) return true
    }

    if (dataType === 'attempts') {
      const { itemId, timestamp, createdAt, userId } = record
      const targetTimestamp = normalizeTimestamp(timestamp || createdAt)

      if (itemId && targetTimestamp !== null) {
        const attempts = await getByIndex(storeName, 'itemId', itemId)
        return attempts.some(attempt => {
          const attemptTimestamp = normalizeTimestamp(attempt.timestamp || attempt.createdAt)
          const sameUser = !userId || attempt.userId === userId
          return sameUser && attempt.itemId === itemId && attemptTimestamp === targetTimestamp
        })
      }
      return false
    }

    if (dataType === 'mastery') {
      const { mood, tense, person, userId } = record
      if (mood && tense && person) {
        const mastery = await getOneByIndex(storeName, 'mood-tense-person', [mood, tense, person])
        return Boolean(mastery && (!userId || mastery.userId === userId))
      }
      return false
    }

    if (dataType === 'schedules') {
      const { itemId, userId } = record
      if (itemId) {
        const schedules = userId
          ? await getByIndex(storeName, 'userId', userId)
          : await getAllFromDB(storeName)

        return schedules.some(schedule =>
          schedule.itemId === itemId && (!userId || schedule.userId === userId)
        )
      }
      return false
    }

    return false
  } catch (error) {
    logger.warn('Error al verificar existencia de registro:', error)
    return false
  }
}

function normalizeTimestamp(value) {
  if (!value) return null
  if (value instanceof Date) {
    return value.getTime()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
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
    if (!sampleAttempt.id && !sampleAttempt.itemId) {
      return false
    }
  }

  return true
}

async function readFileAsText(file) {
  if (!file) return ''
  if (typeof file === 'string') return file

  const candidates = []

  const addCandidate = (value) => {
    if (typeof value === 'string') {
      candidates.push(value)
    }
  }

  if (typeof file.text === 'function') {
    try {
      const raw = await file.text()
      if (typeof raw === 'string') addCandidate(raw)
      else if (raw instanceof ArrayBuffer) addCandidate(new TextDecoder('utf-8').decode(raw))
      else if (raw && typeof raw.arrayBuffer === 'function') {
        const buffer = await raw.arrayBuffer()
        addCandidate(new TextDecoder('utf-8').decode(buffer))
      }
    } catch {/* ignore */}
  }

  if (typeof file.arrayBuffer === 'function') {
    try {
      const buffer = await file.arrayBuffer()
      addCandidate(new TextDecoder('utf-8').decode(buffer))
    } catch {/* ignore */}
  }

  if (typeof globalThis.Response === 'function') {
    try {
      addCandidate(await new Response(file).text())
    } catch {
      if (typeof globalThis.Blob === 'function') {
        try {
          addCandidate(await new Response(new Blob([file])).text())
        } catch {/* ignore */}
      }
    }
  }

  if (typeof file?.content === 'string') {
    addCandidate(file.content)
  }

  const implSymbol = Object.getOwnPropertySymbols(file || {}).find(sym => sym.toString() === 'Symbol(impl)')
  if (implSymbol) {
    const impl = file[implSymbol]
    if (impl?._buffer && typeof globalThis.Buffer !== 'undefined') {
      addCandidate(globalThis.Buffer.from(impl._buffer).toString('utf-8'))
    }
  }

  const validCandidate = candidates.find(candidate => candidate && !/^\[object\s.+\]$/.test(candidate.trim()))
  if (validCandidate) {
    return validCandidate
  }

  const placeholder = candidates.find(candidate => candidate && /^\[object\s.+\]$/.test(candidate.trim()))
  if (placeholder && implSymbol) {
    const impl = file[implSymbol]
    if (impl?._buffer && typeof globalThis.Buffer !== 'undefined') {
      return globalThis.Buffer.from(impl._buffer).toString('utf-8')
    }
  }

  logger.warn('dataRestore: falling back to string conversion', {
    keys: file ? Object.getOwnPropertyNames(file) : null,
    constructor: file?.constructor?.name
  })
  return String((candidates[0] ?? file) ?? '')
}

/**
 * Importa datos desde un archivo subido por el usuario
 * @param {File} file - Archivo a importar
 * @param {Object} options - Opciones de importación
 * @returns {Promise<Object>} Resultado de la importación
 */
export async function importFromFile(file, options = {}) {
  try {
    logger.debug(`📂 Importando datos desde archivo: ${file.name}`)
    
    const text = await readFileAsText(file)
    let importData
    
    try {
      importData = JSON.parse(text)
    } catch (parseError) {
      if (file && typeof file.arrayBuffer === 'function') {
        try {
          const retryBuffer = await file.arrayBuffer()
          const retryText = new TextDecoder('utf-8').decode(retryBuffer)
          importData = JSON.parse(retryText)
        } catch (retryError) {
          throw new Error(`El archivo no contiene JSON válido${retryError?.message ? `: ${retryError.message}` : ''}`)
        }
      } else {
        throw new Error(`El archivo no contiene JSON válido${parseError?.message ? `: ${parseError.message}` : ''}`)
      }
    }
    
    const resolvedOptions = {
      ...options,
      userId: options.userId || importData?.metadata?.userId || null
    }

    const result = await restoreProgressData(importData, resolvedOptions)
    
    logger.debug(`📥 Importación desde archivo completada exitosamente`)
    return result
    
  } catch (error) {
    logger.error('❌ Error al importar desde archivo:', error)
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
    const resolvedUserId = await resolveUserId(userId)
    const actualUserId = resolvedUserId || 'anonymous'
    logger.debug(`💾 Creando respaldo automático para usuario ${actualUserId}...`)

    // Usar el sistema de exportación existente
    const { exportProgressData } = await import('./dataExport.js')
    const backupData = (await exportProgressData(actualUserId)) || {}

    // Asegurar estructura básica
    backupData.metadata = {
      ...(backupData.metadata || {}),
      backupType: 'automatic',
      backupId: `backup_${Date.now()}`
    }
    backupData.data = backupData.data || {}

    // Intentar guardar en localStorage como respaldo de emergencia (si está disponible)
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const backupKey = `progress_backup_${actualUserId}`
        localStorage.setItem(backupKey, JSON.stringify(backupData))
        logger.debug(`💾 Respaldo guardado en localStorage con clave: ${backupKey}`)
      } else {
        logger.warn('⚠️ localStorage no disponible - respaldo no persistido localmente')
      }
    } catch (localStorageError) {
      logger.warn('⚠️ No se pudo guardar el respaldo en localStorage:', localStorageError.message)
    }

    logger.debug(`✅ Respaldo creado con ID: ${backupData.metadata.backupId}`)
    return backupData

  } catch (error) {
    logger.error('❌ Error al crear respaldo:', error)
    throw error
  }
}
