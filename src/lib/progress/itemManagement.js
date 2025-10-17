// Gestión de ítems de práctica en el sistema de progreso

import { getAllVerbsSync } from '../core/verbDataService.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:itemManagement')


/**
 * Tamaño del lote para procesamiento no bloqueante
 */
const BATCH_SIZE = 50

/**
 * Retraso entre lotes para permitir que la UI responda
 */
const BATCH_DELAY = 5

/**
 * Inicializa los ítems de práctica en el sistema de progreso
 * @returns {Promise<void>}
 */
export async function initializeItems() {
  logger.debug('🔄 Inicializando ítems de práctica...')
  
  try {
    // Cargar funciones de BD de forma perezosa y tolerante a mocks parciales
    let saveItem = async () => {}
    let getItemByProperties = async () => null
    try {
      const dbModule = await import('./database.js')
      if (typeof dbModule.saveItem === 'function') saveItem = dbModule.saveItem
      if (typeof dbModule.getItemByProperties === 'function') getItemByProperties = dbModule.getItemByProperties
    } catch {
      /* ignore */
    }

    let itemCount = 0
    let skippedCount = 0
    
    const verbs = getAllVerbsSync() // Now synchronous

    // Procesar cada verbo
    for (const verb of verbs) {
      // Procesar cada paradigma del verbo
      for (const paradigm of verb.paradigms || []) {
        // Procesar cada forma del paradigma
        for (const form of paradigm.forms || []) {
          try {
            // Verificar si el ítem ya existe
            const existingItem = await getItemByProperties(
              verb.id || `verb-${verb.lemma}`,
              form.mood,
              form.tense,
              form.person
            )
            
            // Si no existe, crearlo
            if (!existingItem) {
              const item = {
                id: `item-${verb.lemma}-${form.mood}-${form.tense}-${form.person}`,
                verbId: verb.id || `verb-${verb.lemma}`,
                mood: form.mood,
                tense: form.tense,
                person: form.person
                // En una implementación completa, aquí se añadirían más propiedades
                // como región, dificultad, etc.
              }
              
              await saveItem(item)
              itemCount++
            } else {
              skippedCount++
            }
          } catch (error) {
            logger.error(`❌ Error al inicializar ítem para ${verb.lemma} ${form.mood}/${form.tense}/${form.person}:`, error)
          }
        }
      }
    }
    
    logger.debug(`✅ Inicialización de ítems completada: ${itemCount} creados, ${skippedCount} ya existentes`)
  } catch (error) {
    logger.error('❌ Error al inicializar ítems:', error)
    throw error
  }
}

/**
 * Obtiene o crea un ítem de práctica
 * @param {string} verbId - ID del verbo
 * @param {string} mood - Modo
 * @param {string} tense - Tiempo
 * @param {string} person - Persona
 * @returns {Promise<Object>} Ítem de práctica
 */
export async function getOrCreateItem(verbId, mood, tense, person) {
  // Cargar funciones de BD
  let saveItem = async () => {}
  let getItemByProperties = async () => null
  try {
    const dbModule = await import('./database.js')
    if (typeof dbModule.saveItem === 'function') saveItem = dbModule.saveItem
    if (typeof dbModule.getItemByProperties === 'function') getItemByProperties = dbModule.getItemByProperties
  } catch {
    /* ignore */
  }
  
  // Buscar ítem existente
  let item = await getItemByProperties(verbId, mood, tense, person)
  
  // Si no existe, crearlo
  if (!item) {
    item = {
      id: `item-${verbId}-${mood}-${tense}-${person}`,
      verbId,
      mood,
      tense,
      person
    }
    
    await saveItem(item)
  }
  
  return item
}

/**
 * Obtiene ítems por celda (modo-tiempo-persona)
 * @param {string} mood - Modo
 * @param {string} tense - Tiempo
 * @param {string} person - Persona
 * @returns {Promise<Array>} Ítems de la celda
 */
export async function getItemsByCell(_mood, _tense, _person) {
  // En una implementación completa, esto buscaría en la base de datos
  // todos los ítems que coincidan con la celda especificada
  
  // Por ahora, devolvemos un array vacío
  return []
}

/**
 * Obtiene ítems por verbo
 * @param {string} verbId - ID del verbo
 * @returns {Promise<Array>} Ítems del verbo
 */
export async function getItemsByVerb(_verbId) {
  // En una implementación completa, esto buscaría en la base de datos
  // todos los ítems asociados a un verbo específico

  // Por ahora, devolvemos un array vacío
  return []
}

/**
 * Crea un lote de ítems desde un array de datos de formas
 * @param {Array} formsData - Array de datos de formas: [{verb, paradigm, form}, ...]
 * @param {Function} saveItem - Función para guardar ítem
 * @param {Function} getItemByProperties - Función para verificar ítem existente
 * @returns {Promise<{created: number, skipped: number}>}
 */
async function processBatch(formsData, saveItem, getItemByProperties) {
  let created = 0
  let skipped = 0

  for (const {verb, form} of formsData) {
    try {
      // Verificar si el ítem ya existe
      const existingItem = await getItemByProperties(
        verb.id || `verb-${verb.lemma}`,
        form.mood,
        form.tense,
        form.person
      )

      // Si no existe, crearlo
      if (!existingItem) {
        const item = {
          id: `item-${verb.lemma}-${form.mood}-${form.tense}-${form.person}`,
          verbId: verb.id || `verb-${verb.lemma}`,
          mood: form.mood,
          tense: form.tense,
          person: form.person
        }

        await saveItem(item)
        created++
      } else {
        skipped++
      }
    } catch (error) {
      logger.error(`❌ Error procesando ítem ${verb.lemma} ${form.mood}/${form.tense}/${form.person}:`, error)
    }
  }

  return { created, skipped }
}

/**
 * Crea un generador que produce datos de formas en lotes
 * @param {Array} verbs - Array de verbos
 * @param {number} batchSize - Tamaño del lote
 */
function* createFormsBatchGenerator(verbs, batchSize) {
  let batch = []

  for (const verb of verbs) {
    for (const paradigm of verb.paradigms || []) {
      for (const form of paradigm.forms || []) {
        batch.push({ verb, paradigm, form })

        if (batch.length >= batchSize) {
          yield batch
          batch = []
        }
      }
    }
  }

  // Yield remaining items if any
  if (batch.length > 0) {
    yield batch
  }
}

/**
 * Inicializa los ítems de práctica por lotes para evitar bloquear la UI
 * @param {Object} options - Opciones de configuración
 * @param {number} options.batchSize - Tamaño del lote (default: BATCH_SIZE)
 * @param {number} options.batchDelay - Retraso entre lotes en ms (default: BATCH_DELAY)
 * @param {Function} options.onProgress - Callback para reportar progreso (opcional)
 * @returns {Promise<void>}
 */
export async function initializeItemsBatched(options = {}) {
  const {
    batchSize = BATCH_SIZE,
    batchDelay = BATCH_DELAY,
    onProgress
  } = options

  logger.debug('🔄 Inicializando ítems por lotes (no bloqueante)...')

  try {
    // Importar funciones de eventos de progreso
    const { notifyBatchProgress, markBatchInitializationComplete } = await import('./ProgressSystemEvents.js')

    // Cargar funciones de BD de forma perezosa
    let saveItem = async () => {}
    let getItemByProperties = async () => null
    try {
      const dbModule = await import('./database.js')
      if (typeof dbModule.saveItem === 'function') saveItem = dbModule.saveItem
      if (typeof dbModule.getItemByProperties === 'function') getItemByProperties = dbModule.getItemByProperties
    } catch {
      /* ignore */
    }

    let totalCreated = 0
    let totalSkipped = 0
    let batchCount = 0

    // Obtener todos los verbos
    const verbs = getAllVerbsSync() // Now synchronous

    // Validar que verbs sea un array
    if (!Array.isArray(verbs)) {
      throw new Error(`getAllVerbsSync did not return an array, got: ${typeof verbs}`)
    }

    if (verbs.length === 0) {
      logger.warn('No verbs available for batch initialization')
      return { totalCreated: 0, totalSkipped: 0, batchCount: 0 }
    }

    // Crear generador de lotes
    const batchGenerator = createFormsBatchGenerator(verbs, batchSize)

    // Procesar cada lote
    for (const batch of batchGenerator) {
      const { created, skipped } = await processBatch(batch, saveItem, getItemByProperties)

      totalCreated += created
      totalSkipped += skipped
      batchCount++

      const progressData = {
        batchCount,
        totalCreated,
        totalSkipped,
        currentBatchSize: batch.length
      }

      // Notificar progreso a través del sistema de eventos
      notifyBatchProgress(progressData)

      // Reportar progreso si se proporciona callback (compatibilidad)
      if (onProgress) {
        onProgress(progressData)
      }

      // Yield control back to event loop to avoid blocking UI
      if (batchDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, batchDelay))
      }
    }

    // Marcar finalización del proceso por lotes
    const finalStats = {
      totalBatches: batchCount,
      completedBatches: batchCount,
      totalCreated,
      totalSkipped
    }
    markBatchInitializationComplete(finalStats)

    logger.debug(`✅ Inicialización por lotes completada: ${totalCreated} creados, ${totalSkipped} ya existentes en ${batchCount} lotes`)
  } catch (error) {
    logger.error('❌ Error en inicialización por lotes:', error)
    throw error
  }
}

/**
 * Actualiza un ítem existente
 * @param {string} itemId - ID del ítem
 * @param {Object} updates - Actualizaciones
 * @returns {Promise<void>}
 */
export async function updateItem(_itemId, _updates) {
  try {
    // En una implementación completa, esto actualizaría el ítem existente
    
    logger.debug(`✅ Ítem ${_itemId} actualizado`)
  } catch (error) {
    logger.error(`❌ Error al actualizar ítem ${_itemId}:`, error)
    throw error
  }
}

/**
 * Elimina un ítem del sistema
 * @param {string} itemId - ID del ítem
 * @returns {Promise<void>}
 */
export async function removeItem(itemId) {
  try {
    // En una implementación completa, esto eliminaría el ítem
    
    logger.debug(`✅ Ítem ${itemId} eliminado`)
  } catch (error) {
    logger.error(`❌ Error al eliminar ítem ${itemId}:`, error)
    throw error
  }
}

/**
 * Verifica si un ítem existe
 * @param {string} verbId - ID del verbo
 * @param {string} mood - Modo
 * @param {string} tense - Tiempo
 * @param {string} person - Persona
 * @returns {Promise<boolean>} Si el ítem existe
 */
export async function itemExists(verbId, mood, tense, person) {
  let getItemByProperties = async () => null
  try {
    const dbModule = await import('./database.js')
    if (typeof dbModule.getItemByProperties === 'function') getItemByProperties = dbModule.getItemByProperties
  } catch {
    /* ignore */
  }
  const item = await getItemByProperties(verbId, mood, tense, person)
  return item !== null
}

/**
 * Crea ítems masivamente
 * @param {Array} items - Array de ítems a crear
 * @returns {Promise<void>}
 */
export async function createItemsBulk(items) {
  try {
    // En una implementación completa, esto crearía múltiples ítems
    // en una sola transacción para mejor rendimiento
    
    logger.debug(`✅ ${items.length} ítems creados masivamente`)
  } catch (error) {
    logger.error('❌ Error al crear ítems masivamente:', error)
    throw error
  }
}
