// Utility functions for working with per-tense irregularity data

// Mapping from form tense names to irregularityMatrix keys
const TENSE_NAME_MAPPING = {
  'presente': 'pres',
  'preterito_perfecto_simple': 'pretIndef',  
  'preterito_imperfecto': 'impf',
  'futuro_simple': 'fut',
  'preterito_perfecto_compuesto': 'pretPerf',
  'preterito_pluscuamperfecto': 'plusc',
  'futuro_compuesto': 'futPerf',
  'presente_subjuntivo': 'subjPres',
  'imperfecto_subjuntivo': 'subjImpf',
  'preterito_perfecto_subjuntivo': 'subjPretPerf',
  'pluscuamperfecto_subjuntivo': 'subjPlusc',
  'futuro_perfecto_subjuntivo': 'subjFutPerf',
  'condicional_simple': 'cond',
  'condicional_compuesto': 'condPerf',
  'imperativo_afirmativo': 'impAff',
  'imperativo_negativo': 'impNeg',
  'infinitivo': 'inf',
  'gerundio': 'ger',
  'participio': 'pp'
}

/**
 * Check if a verb is irregular in a specific tense
 * @param {Object} verb - Verb object with irregularityMatrix
 * @param {string} tense - Tense to check
 * @returns {boolean} - true if verb is irregular in that tense
 */
export function isIrregularInTense(verb, tense) {
  if (!verb || !verb.irregularityMatrix) {
    // Fallback to old global type system
    return verb?.type === 'irregular'
  }
  
  // Map form tense name to irregularityMatrix key
  const matrixKey = TENSE_NAME_MAPPING[tense] || tense
  return verb.irregularityMatrix[matrixKey] === true
}

/**
 * Check if a verb has any irregular tenses
 * @param {Object} verb - Verb object
 * @returns {boolean} - true if verb has any irregular tenses
 */
export function hasAnyIrregularTense(verb) {
  if (!verb.irregularTenses) {
    // Fallback to old global type system
    return verb.type === 'irregular'
  }
  return verb.irregularTenses.length > 0
}

/**
 * Get all irregular tenses for a verb
 * @param {Object} verb - Verb object
 * @returns {Array} - Array of irregular tense names
 */
export function getIrregularTenses(verb) {
  return verb.irregularTenses || []
}

/**
 * Filter verbs by tense-specific irregularity
 * @param {Array} verbs - Array of verbs
 * @param {string} tense - Target tense
 * @param {boolean} wantIrregular - true for irregular, false for regular
 * @returns {Array} - Filtered verbs
 */
export function filterVerbsByTenseIrregularity(verbs, tense, wantIrregular = true) {
  return verbs.filter(verb => {
    const isIrregular = isIrregularInTense(verb, tense)
    return wantIrregular ? isIrregular : !isIrregular
  })
}

/**
 * Get irregularity statistics for a verb
 * @param {Object} verb - Verb object
 * @returns {Object} - Statistics object
 */
export function getVerbIrregularityStats(verb) {
  const irregularTenses = getIrregularTenses(verb)
  const totalTenses = verb.irregularityMatrix ? Object.keys(verb.irregularityMatrix).length : 0
  
  return {
    irregularTenses,
    irregularTenseCount: irregularTenses.length,
    totalTenses,
    irregularityPercentage: totalTenses > 0 ? (irregularTenses.length / totalTenses * 100) : 0,
    globalType: verb.type,
    isFullyRegular: irregularTenses.length === 0,
    isFullyIrregular: irregularTenses.length === totalTenses
  }
}

/**
 * Check if current practice settings should target irregular forms
 * @param {Object} settings - Practice settings
 * @param {Object} verb - Verb object
 * @returns {boolean} - true if should target irregular forms
 */
export function shouldTargetIrregularForSettings(settings, verb) {
  const { practiceMode, specificTense, verbType } = settings
  
  // If specifically practicing irregular verbs
  if (verbType === 'irregular' && hasAnyIrregularTense(verb)) {
    return true
  }
  
  // If practicing a specific tense, check if verb is irregular in that tense
  if (practiceMode === 'specific' && specificTense) {
    return isIrregularInTense(verb, specificTense)
  }
  
  // For mixed practice, consider global irregularity
  return hasAnyIrregularTense(verb)
}

/**
 * Backward compatibility function - maps new system to old binary classification
 * @param {Object} verb - Verb object
 * @returns {string} - 'regular' or 'irregular'
 */
export function getEffectiveVerbType(verb) {
  // Use explicit type if available
  if (verb.type) {
    return verb.type
  }
  
  // Determine from irregularity data
  return hasAnyIrregularTense(verb) ? 'irregular' : 'regular'
}

// Export commonly used tense groups for filtering
export const TENSE_GROUPS = {
  PRESENT: ['pres', 'subjPres'],
  PAST: ['pretIndef', 'impf', 'pretPerf', 'plusc'],
  FUTURE: ['fut', 'futPerf'],
  CONDITIONAL: ['cond', 'condPerf'],
  SUBJUNCTIVE: ['subjPres', 'subjImpf', 'subjPretPerf', 'subjPlusc', 'subjFutPerf'],
  IMPERATIVE: ['impAff', 'impNeg'],
  NONFINITE: ['inf', 'ger', 'pp']
}

/**
 * Check if verb is irregular in any tense from a group
 * @param {Object} verb - Verb object
 * @param {Array} tenseGroup - Array of tense names
 * @returns {boolean} - true if irregular in any tense from group
 */
export function isIrregularInTenseGroup(verb, tenseGroup) {
  return tenseGroup.some(tense => isIrregularInTense(verb, tense))
}