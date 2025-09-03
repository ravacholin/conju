// Sistema de validación automática de integridad mood/tense
// Previene problemas de mapeo como "Undefined - undefined"

import { MOOD_LABELS, TENSE_LABELS } from './verbLabels.js'

/**
 * Valida que un mood/tense tenga mapeo correcto
 * @param {string} mood - Modo gramatical
 * @param {string} tense - Tiempo verbal  
 * @returns {{isValid: boolean, errors: string[]}}
 */
export function validateMoodTenseMapping(mood, tense) {
  const errors = []
  
  if (!mood) {
    errors.push('Mood is undefined or empty')
  } else if (!MOOD_LABELS[mood]) {
    errors.push(`Mood '${mood}' not found in MOOD_LABELS mapping`)
  }
  
  if (!tense) {
    errors.push('Tense is undefined or empty')
  } else if (!TENSE_LABELS[tense]) {
    errors.push(`Tense '${tense}' not found in TENSE_LABELS mapping`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Obtiene etiquetas seguras con fallback
 * @param {string} mood - Modo gramatical
 * @param {string} tense - Tiempo verbal
 * @returns {{moodLabel: string, tenseLabel: string, hasWarnings: boolean}}
 */
export function getSafeMoodTenseLabels(mood, tense) {
  const validation = validateMoodTenseMapping(mood, tense)
  
  const moodLabel = MOOD_LABELS[mood] || `[${mood || 'undefined'}]`
  const tenseLabel = TENSE_LABELS[tense] || `[${tense || 'undefined'}]`
  
  if (!validation.isValid) {
    console.warn('MoodTense mapping issues:', validation.errors, { mood, tense })
  }
  
  return {
    moodLabel,
    tenseLabel,
    hasWarnings: !validation.isValid
  }
}

/**
 * Formatea mood/tense con validación automática
 * @param {string} mood - Modo gramatical
 * @param {string} tense - Tiempo verbal
 * @returns {string} Nombre amigable formateado
 */
export function formatMoodTenseSafe(mood, tense) {
  const { moodLabel, tenseLabel, hasWarnings } = getSafeMoodTenseLabels(mood, tense)
  
  // Para subjuntivo, el tiempo ya incluye "de subjuntivo"
  if (mood === 'subjunctive' && tenseLabel.includes('subjuntivo')) {
    return tenseLabel
  }
  
  // Para otros casos, combinar modo y tiempo
  if (mood === 'indicative') {
    return tenseLabel
  }
  
  const formatted = `${tenseLabel} (${moodLabel})`
  
  // En desarrollo, mostrar advertencias visuales
  if (hasWarnings && process.env.NODE_ENV === 'development') {
    return `⚠️ ${formatted}`
  }
  
  return formatted
}

/**
 * Audita todos los mood/tense en un dataset
 * @param {Array} dataset - Array de objetos con propiedades mood/tense
 * @returns {{valid: Array, invalid: Array}}
 */
export function auditMoodTenseMappings(dataset) {
  const valid = []
  const invalid = []
  
  for (const item of dataset) {
    const validation = validateMoodTenseMapping(item.mood, item.tense)
    if (validation.isValid) {
      valid.push(item)
    } else {
      invalid.push({
        item,
        errors: validation.errors
      })
    }
  }
  
  return { valid, invalid }
}

/**
 * Encuentra todos los mood/tense únicos en un dataset
 * @param {Array} dataset - Array de objetos con propiedades mood/tense
 * @returns {Array} Array de {mood, tense} únicos
 */
export function extractUniqueMoodTenseCombinations(dataset) {
  const combinations = new Set()
  
  for (const item of dataset) {
    if (item.mood && item.tense) {
      combinations.add(`${item.mood}|${item.tense}`)
    }
  }
  
  return Array.from(combinations).map(combo => {
    const [mood, tense] = combo.split('|')
    return { mood, tense }
  })
}

/**
 * Genera reporte de integridad completo
 * @param {Array} dataset - Array de objetos con propiedades mood/tense
 * @returns {Object} Reporte detallado
 */
export function generateIntegrityReport(dataset) {
  const uniqueCombos = extractUniqueMoodTenseCombinations(dataset)
  const audit = auditMoodTenseMappings(uniqueCombos)
  
  const report = {
    totalCombinations: uniqueCombos.length,
    validCombinations: audit.valid.length,
    invalidCombinations: audit.invalid.length,
    integrityScore: Math.round((audit.valid.length / uniqueCombos.length) * 100),
    invalidDetails: audit.invalid.map(inv => ({
      mood: inv.item.mood,
      tense: inv.item.tense,
      errors: inv.errors
    })),
    missingMappings: {
      moods: [...new Set(audit.invalid
        .filter(inv => inv.errors.some(e => e.includes('Mood')))
        .map(inv => inv.item.mood)
      )],
      tenses: [...new Set(audit.invalid
        .filter(inv => inv.errors.some(e => e.includes('Tense')))
        .map(inv => inv.item.tense)
      )]
    }
  }
  
  return report
}