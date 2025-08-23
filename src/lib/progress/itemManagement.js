// Manejo de ítems de práctica en el sistema de progreso

import { saveItem, getItemByProperties } from './database.js'
import { verbs } from '../../data/verbs.js'

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
    for (const verb of verbs) {
      // Procesar cada paradigma del verbo
      for (const paradigm of verb.paradigms || []) {
        // Procesar cada forma del paradigma
        for (const form of paradigm.forms || []) {
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
        }
      }
    }
    
    console.log(`✅ Inicialización completada: ${itemCount} ítems creados, ${skippedCount} ya existentes`)
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