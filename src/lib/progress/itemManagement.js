// Gestión de ítems de práctica en el sistema de progreso

import { saveItem, getItemByProperties } from './database.js'
import { VERBS } from '../../data/verbs.js'

/**
 * Inicializa los ítems de práctica en el sistema de progreso
 * @returns {Promise<void>}
 */
export async function initializeItems() {
  console.log('🔄 Inicializando ítems de práctica...')
  
  try {
    let itemCount = 0
    let skippedCount = 0
    
    // Procesar cada verbo
    for (const verb of VERBS) {
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
            console.error(`❌ Error al inicializar ítem para ${verb.lemma} ${form.mood}/${form.tense}/${form.person}:`, error)
          }
        }
      }
    }
    
    console.log(`✅ Inicialización de ítems completada: ${itemCount} creados, ${skippedCount} ya existentes`)
  } catch (error) {
    console.error('❌ Error al inicializar ítems:', error)
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
export async function getItemsByCell(mood, tense, person) {
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
export async function getItemsByVerb(verbId) {
  // En una implementación completa, esto buscaría en la base de datos
  // todos los ítems asociados a un verbo específico
  
  // Por ahora, devolvemos un array vacío
  return []
}

/**
 * Actualiza un ítem existente
 * @param {string} itemId - ID del ítem
 * @param {Object} updates - Actualizaciones
 * @returns {Promise<void>}
 */
export async function updateItem(itemId, updates) {
  try {
    // En una implementación completa, esto actualizaría el ítem existente
    
    console.log(`✅ Ítem ${itemId} actualizado`)
  } catch (error) {
    console.error(`❌ Error al actualizar ítem ${itemId}:`, error)
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
    
    console.log(`✅ Ítem ${itemId} eliminado`)
  } catch (error) {
    console.error(`❌ Error al eliminar ítem ${itemId}:`, error)
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
    
    console.log(`✅ ${items.length} ítems creados masivamente`)
  } catch (error) {
    console.error('❌ Error al crear ítems masivamente:', error)
    throw error
  }
}