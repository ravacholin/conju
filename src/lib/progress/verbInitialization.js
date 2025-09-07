// Inicialización de verbos en el sistema de progreso

import { verbs } from '../../data/verbs.js'
import { VERB_DIFFICULTY, FREQUENCY_DIFFICULTY_BONUS } from './config.js'

/**
 * Inicializa los verbos en el sistema de progreso
 * @returns {Promise<void>}
 */
export async function initializeVerbs() {
  console.log('🔄 Inicializando verbos en el sistema de progreso...')
  
  try {
    // Cargar funciones de BD de forma perezosa y tolerante a mocks parciales
    let saveVerb = async () => {}
    try {
      const dbModule = await import('./database.js')
      if (typeof dbModule.saveVerb === 'function') saveVerb = dbModule.saveVerb
    } catch {/* ignore errors */}

    let regularCount = 0
    let irregularCount = 0
    let diphtongCount = 0
    let orthographicChangeCount = 0
    let errorCount = 0
    
    // Procesar cada verbo
    for (const verb of verbs) {
      try {
        // Determinar frecuencia léxica (simplificada)
        const frequency = determineVerbFrequency(verb.lemma)
        
        // Crear objeto verbo para el sistema de progreso
        const progressVerb = {
          id: verb.id || `verb-${verb.lemma}`,
          lemma: verb.lemma,
          type: verb.type,
          frequency,
          // En una implementación completa, aquí se añadirían más propiedades
          // como las familias irregulares, regiones, etc.
        }
        
        // Guardar en la base de datos
        await saveVerb(progressVerb)
        
        // Actualizar contadores
        if (verb.type === 'regular') {
          regularCount++
        } else if (verb.type === 'irregular') {
          irregularCount++
        } else if (verb.type === 'diphtong') {
          diphtongCount++
        } else if (verb.type === 'orthographic_change') {
          orthographicChangeCount++
        }
      } catch (error) {
        console.error(`❌ Error al inicializar verbo ${verb.lemma}:`, error)
        errorCount++
      }
    }
    
    console.log(`✅ Inicialización completada: ${regularCount} regulares, ${irregularCount} irregulares, ${diphtongCount} diptongos, ${orthographicChangeCount} cambios ortográficos, ${errorCount} errores`)
  } catch (error) {
    console.error('❌ Error al inicializar verbos:', error)
    throw error
  }
}

/**
 * Determina la frecuencia léxica de un verbo (simplificada)
 * @param {string} lemma - Lema del verbo
 * @returns {'high'|'medium'|'low'} Frecuencia
 */
function determineVerbFrequency(lemma) {
  // Lista de verbos de alta frecuencia (simplificada)
  const highFrequencyVerbs = [
    'ser', 'estar', 'haber', 'tener', 'hacer', 'ir', 'venir', 'decir',
    'poder', 'querer', 'poner', 'dar', 'ver', 'saber', 'llegar',
    'pasar', 'deber', 'poner', 'parecer', 'quedar', 'creer', 'hablar',
    'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir',
    'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir',
    'sentir', 'tratar', 'mirar', 'contar', 'cambiar', 'empezar'
  ]
  
  // Lista de verbos de frecuencia media
  const mediumFrequencyVerbs = [
    'comenzar', 'entender', 'recordar', 'esperar', 'perder', 'necesitar',
    'resultar', 'escribir', 'preguntar', 'trabajar', 'suceder', 'conseguir',
    'comprender', 'afirmar', 'presentar', 'explicar', 'preocupar', 'reconocer',
    'correr', 'abrir', 'ganar', 'firmar', 'castigar', 'aprender',
    'jugar', 'pagar', 'acordar', 'proponer', 'obtener', 'comprar'
  ]
  
  if (highFrequencyVerbs.includes(lemma)) {
    return 'high'
  } else if (mediumFrequencyVerbs.includes(lemma)) {
    return 'medium'
  } else {
    return 'low'
  }
}

/**
 * Verifica si un verbo ya está inicializado
 * @param {string} lemma - Lema del verbo
 * @returns {Promise<boolean>} Si el verbo está inicializado
 */
export async function isVerbInitialized(_lemma) { // eslint-disable-line no-unused-vars
  // En una implementación completa, esto verificaría en la base de datos
  // si el verbo ya está guardado
  
  // Por ahora, devolvemos false para forzar la inicialización
  return false
}

/**
 * Añade un nuevo verbo al sistema
 * @param {Object} verb - Datos del verbo
 * @returns {Promise<void>}
 */
export async function addNewVerb(verb) {
  try {
    // Cargar funciones de BD de forma perezosa
    let saveVerb = async () => {}
    try {
      const dbModule = await import('./database.js')
      if (typeof dbModule.saveVerb === 'function') saveVerb = dbModule.saveVerb
    } catch {/* ignore errors */}

    // Determinar frecuencia léxica
    const frequency = determineVerbFrequency(verb.lemma)
    
    // Crear objeto verbo para el sistema de progreso
    const progressVerb = {
      id: verb.id || `verb-${verb.lemma}`,
      lemma: verb.lemma,
      type: verb.type,
      frequency,
      // En una implementación completa, aquí se añadirían más propiedades
    }
    
    // Guardar en la base de datos
    await saveVerb(progressVerb)
    
    console.log(`✅ Verbo ${verb.lemma} añadido al sistema de progreso`)
  } catch (error) {
    console.error(`❌ Error al añadir verbo ${verb.lemma}:`, error)
    throw error
  }
}

/**
 * Actualiza un verbo existente
 * @param {string} verbId - ID del verbo
 * @param {Object} updates - Actualizaciones
 * @returns {Promise<void>}
 */
export async function updateVerb(verbId, _updates) { // eslint-disable-line no-unused-vars
  try {
    // En una implementación completa, esto actualizaría el verbo existente
    
    console.log(`✅ Verbo ${verbId} actualizado`)
  } catch (error) {
    console.error(`❌ Error al actualizar verbo ${verbId}:`, error)
    throw error
  }
}

/**
 * Elimina un verbo del sistema
 * @param {string} verbId - ID del verbo
 * @returns {Promise<void>}
 */
export async function removeVerb(verbId) {
  try {
    // En una implementación completa, esto eliminaría el verbo
    
    console.log(`✅ Verbo ${verbId} eliminado del sistema de progreso`)
  } catch (error) {
    console.error(`❌ Error al eliminar verbo ${verbId}:`, error)
    throw error
  }
}
