/**
 * DrillFormFilters.js - Form filtering logic extracted from useDrillMode
 * 
 * This module handles all form filtering operations including:
 * - Specific practice filtering (mood/tense constraints)
 * - Verb type filtering (regular/irregular)
 * - Level-based filtering (CEFR level constraints)
 * - Person/pronoun filtering (dialect constraints)
 * - Mixed tense handling (imperative mixed, nonfinite mixed)
 */

import { verbs } from '../../data/verbs.js'
import { LEVELS } from '../../lib/data/levels.js'

/**
 * Get allowed mood/tense combinations for a specific CEFR level.
 * The inventory for each level in `levels.js` is cumulative.
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1, C2, ALL)
 * @returns {Set} - Set of allowed "mood|tense" combinations
 */
const getAllowedCombosForLevel = (level) => {
  if (!level) return new Set()

  if (level === 'ALL') {
    const allCombos = new Set()
    Object.values(LEVELS).forEach(levelConfig => {
      levelConfig.inventory.forEach(combo => {
        allCombos.add(`${combo.mood}|${combo.tense}`)
      })
    })
    return allCombos
  }

  if (LEVELS[level]) {
    return new Set(LEVELS[level].inventory.map(g => `${g.mood}|${g.tense}`))
  }

  return new Set()
}

/**
 * Check if a person/pronoun is allowed based on dialect settings
 * @param {string} person - Person identifier (e.g., '2s_tu', '2s_vos', '2p_vosotros')
 * @param {Object} settings - User settings containing dialect preferences
 * @returns {boolean} - Whether the person is allowed
 */
export const allowsPerson = (person, settings) => {
  const { region, practicePronoun } = settings
  
  // Always enforce dialectal constraints regardless of pronounMode
  if (region === 'rioplatense') return person !== '2s_tu' && person !== '2p_vosotros'
  if (region === 'la_general') return person !== '2s_vos' && person !== '2p_vosotros'
  if (region === 'peninsular') return person !== '2s_vos'
  
  // If region not set, optionally apply pronoun filters
  if (practicePronoun === 'tu_only') return person === '2s_tu'
  if (practicePronoun === 'vos_only') return person === '2s_vos'
  
  return true
}

/**
 * Check if a form matches specific practice constraints
 * @param {Object} form - Form object with mood, tense, person properties
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {boolean} - Whether the form matches the constraints
 */
export const matchesSpecific = (form, specificConstraints) => {
  const { isSpecific, specificMood, specificTense } = specificConstraints
  
  if (!isSpecific) return true
  
  // Handle mixed tenses
  if (specificTense === 'impMixed') {
    return form.mood === specificMood && (form.tense === 'impAff' || form.tense === 'impNeg')
  }
  if (specificTense === 'nonfiniteMixed') {
    return form.mood === specificMood && (form.tense === 'ger' || form.tense === 'part')
  }
  
  // Standard specific filtering
  return form.mood === specificMood && form.tense === specificTense
}

/**
 * Check if a form's tense is allowed for the current CEFR level
 * @param {Object} form - Form object with mood, tense properties
 * @param {Object} settings - User settings containing level and practice mode
 * @returns {boolean} - Whether the form is allowed for the level
 */
export const allowsLevel = (form, settings) => {
  // Skip level validation for specific and theme-based practice
  if (settings.practiceMode === 'specific' || settings.practiceMode === 'theme') return true
  
  const userLevel = settings.level || 'A1'
  const allowed = getAllowedCombosForLevel(userLevel)
  return allowed.has(`${form.mood}|${form.tense}`)
}

/**
 * Filter forms for specific practice mode
 * @param {Array} allForms - All available forms for the region
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {Array} - Filtered forms matching specific practice
 */
export const filterForSpecificPractice = (allForms, specificConstraints) => {
  const { isSpecific, specificMood, specificTense } = specificConstraints
  
  if (!isSpecific) return allForms
  
  const filtered = allForms.filter(form => {
    // Handle mixed tenses
    if (specificTense === 'impMixed') {
      return form.mood === specificMood && (form.tense === 'impAff' || form.tense === 'impNeg')
    }
    if (specificTense === 'nonfiniteMixed') {
      return form.mood === specificMood && (form.tense === 'ger' || form.tense === 'part')
    }
    
    // Standard specific filtering
    return form.mood === specificMood && form.tense === specificTense
  })
  
  return filtered
}

/**
 * Filter forms by verb type (regular/irregular)
 * @param {Array} forms - Forms to filter
 * @param {string} verbType - 'regular', 'irregular', or null/undefined for all
 * @returns {Array} - Filtered forms
 */
export const filterByVerbType = (forms, verbType) => {
  if (!verbType || verbType === 'all') return forms
  
  return forms.filter(form => {
    const verb = verbs.find(v => v.lemma === form.lemma)
    if (!verb) return false
    return verb.type === verbType
  })
}

/**
 * Apply comprehensive filtering to forms
 * @param {Array} forms - Forms to filter
 * @param {Object} settings - User settings
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {Array} - Comprehensively filtered forms
 */
export const applyComprehensiveFiltering = (forms, settings, specificConstraints = {}) => {
  let filtered = forms
  
  // 1. Filter for specific practice if applicable
  filtered = filterForSpecificPractice(filtered, specificConstraints)
  
  // 2. Filter by verb type
  filtered = filterByVerbType(filtered, settings.verbType)
  
  // 3. Filter by person/pronoun constraints
  filtered = filtered.filter(form => allowsPerson(form.person, settings))
  
  // 4. Filter by level constraints
  filtered = filtered.filter(form => allowsLevel(form, settings))
  
  return filtered
}

/**
 * Filter due items for specific practice constraints
 * @param {Array} dueCells - Due items from SRS system
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {Array} - Filtered due items
 */
export const filterDueForSpecific = (dueCells, specificConstraints) => {
  const { isSpecific, specificMood, specificTense } = specificConstraints
  
  if (!isSpecific) return dueCells
  
  return dueCells.filter(dc => {
    if (!dc) return false
    
    // Handle mixed tenses
    if (specificTense === 'impMixed') {
      return dc.mood === specificMood && (dc.tense === 'impAff' || dc.tense === 'impNeg')
    }
    if (specificTense === 'nonfiniteMixed') {
      return dc.mood === specificMood && (dc.tense === 'ger' || dc.tense === 'part')
    }
    
    return dc.mood === specificMood && dc.tense === specificTense
  })
}

/**
 * Validate that a form passes all integrity checks
 * @param {Object} form - Form to validate
 * @param {Object} settings - User settings
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {boolean} - Whether the form passes all checks
 */
export const passesIntegrityChecks = (form, settings, specificConstraints = {}) => {
  if (!form) return false
  
  return (
    matchesSpecific(form, specificConstraints) &&
    allowsPerson(form.person, settings) &&
    allowsLevel(form, settings)
  )
}

/**
 * Get filtering statistics for debugging
 * @param {Array} originalForms - Original form array
 * @param {Array} filteredForms - Filtered form array
 * @param {Object} settings - User settings
 * @returns {Object} - Filtering statistics
 */
export const getFilteringStats = (originalForms, filteredForms, settings) => {
  return {
    original: originalForms.length,
    filtered: filteredForms.length,
    reduction: originalForms.length - filteredForms.length,
    reductionPercent: originalForms.length > 0 
      ? Math.round(((originalForms.length - filteredForms.length) / originalForms.length) * 100)
      : 0,
    settings: {
      verbType: settings.verbType,
      level: settings.level,
      region: settings.region,
      practiceMode: settings.practiceMode
    }
  }
}

// Export the helper function for use by other modules
export { getAllowedCombosForLevel }