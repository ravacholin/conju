// Inicialización de verbos en el sistema de progreso

import { saveVerb } from './database.js'
import { verbs } from '../../data/verbs.js'
import { IRREGULAR_FAMILIES } from '../data/irregularFamilies.js'

/**
 * Inicializa los verbos en el sistema de progreso
 * @returns {Promise<void>}
 */
export async function initializeVerbs() {
  console.log('🔄 Inicializando verbos en el sistema de progreso...')
  
  try {
    // Contadores
    let regularCount = 0
    let irregularCount = 0
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
        }
      } catch (error) {
        console.error(`❌ Error al inicializar verbo ${verb.lemma}:`, error)
        errorCount++
      }
    }
    
    console.log(`✅ Inicialización completada: ${regularCount} regulares, ${irregularCount} irregulares, ${errorCount} errores`)
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
 * Inicializa las familias irregulares en el sistema de progreso
 * @returns {Promise<void>}
 */
export async function initializeIrregularFamilies() {
  console.log('🔄 Inicializando familias irregulares...')
  
  try {
    // En una implementación completa, aquí se guardarían las familias irregulares
    // en la base de datos con sus propiedades para cálculos de dificultad
    console.log(`✅ ${Object.keys(IRREGULAR_FAMILIES).length} familias irregulares identificadas`)
  } catch (error) {
    console.error('❌ Error al inicializar familias irregulares:', error)
    throw error
  }
}

/**
 * Inicialización completa del sistema de verbos
 * @returns {Promise<void>}
 */
export async function initializeProgressVerbs() {
  await initializeVerbs()
  await initializeIrregularFamilies()
}