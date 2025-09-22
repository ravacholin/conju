/**
 * DrillFallbackStrategies.js - Fallback strategy logic extracted from useDrillMode
 * 
 * This module handles all fallback mechanisms when primary form generation fails:
 * - Intelligent multi-strategy fallback system
 * - Mixed practice fallback as last resort
 * - Verb type filtering for fallback attempts
 * - Similar tense substitution strategies
 * - Progressive relaxation of constraints
 */

import { gateFormsByCurriculumAndDialect } from '../../lib/core/curriculumGate.js'
import { verbs } from '../../data/verbs.js'
import {
  matchesSpecific,
  allowsPerson,
  allowsLevel,
  getAllowedCombosForLevel
} from './DrillFormFilters.js'
import { categorizeVerb } from '../../lib/data/irregularFamilies.js'
import { getSimilarTenses } from './DrillValidationSystem.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('DrillFallback')

/**
 * Apply pedagogical filtering for third-person irregular pretérito
 * @param {Array} forms - Forms to filter
 * @param {Object} settings - User settings
 * @returns {Array} - Filtered forms
 */
const applyPedagogicalFiltering = (forms, settings) => {
  return forms.filter(f => {
    // Only apply pedagogical filtering for third person irregular pretérito practice
    if (f.tense === 'pretIndef' && ['3s', '3p'].includes(f.person) && settings.verbType === 'irregular') {
      // Find the verb in the dataset to get its complete definition
      const verb = verbs.find(v => v.lemma === f.lemma)
      if (!verb) return true // If verb not found, allow it through (defensive)

      const verbFamilies = categorizeVerb(f.lemma, verb)
      const pedagogicalThirdPersonFamilies = ['E_I_IR', 'O_U_GER_IR', 'HIATUS_Y']
      const isPedagogicallyRelevant = verbFamilies.some(family => pedagogicalThirdPersonFamilies.includes(family))

      if (!isPedagogicallyRelevant) {
        return false
      }

      // Additional filter: exclude verbs with strong pretérito irregularities
      // These are verbs that are irregular throughout, not just in 3rd person
      const strongPreteriteIrregularities = ['PRET_UV', 'PRET_U', 'PRET_I', 'PRET_J', 'PRET_SUPPL']
      const hasStrongPreteriteIrregularities = verbFamilies.some(family => strongPreteriteIrregularities.includes(family))
      if (hasStrongPreteriteIrregularities) {
        return false // Exclude verbs like saber, querer, haber, etc.
      }
    }

    return true // Allow all other forms through
  })
}

/**
 * Apply verb type filter to forms
 * @param {Array} forms - Forms to filter
 * @param {string} verbType - 'regular', 'irregular', 'all', or null/undefined
 * @returns {Array} - Filtered forms
 */
const applyVerbTypeFilter = (forms, verbType) => {
  if (!verbType || verbType === 'all') return forms
  
  return forms.filter(f => {
    const verb = verbs.find(v => v.lemma === f.lemma)
    if (!verb) return false
    
    if (verbType === 'regular') {
      return verb.type === 'regular'
    } else if (verbType === 'irregular') {
      return verb.type === 'irregular'
    }
    return true
  })
}

/**
 * Enhanced intelligent fallback with multiple strategies
 * @param {Object} settings - User settings
 * @param {Array} eligibleForms - Forms that were eligible for selection
 * @param {Object} context - Validation context with constraint functions
 * @returns {Object|null} - Selected form or null if all strategies fail
 */
export const tryIntelligentFallback = async (settings, eligibleForms, context) => {
  const { specificMood, specificTense, isSpecific } = context
  const specificConstraints = { isSpecific, specificMood, specificTense };
  
  logger.info('tryIntelligentFallback', 'Starting intelligent fallback with multiple strategies')
  
  // Apply verb type filter before processing
  const verbTypeFiltered = applyVerbTypeFilter(eligibleForms, settings.verbType)
  logger.debug('tryIntelligentFallback', `Verb type filter applied`, {
    verbType: settings.verbType,
    originalCount: eligibleForms.length,
    filteredCount: verbTypeFiltered.length
  })
  
  // Strategy 1: Try direct filtering with basic forms
  logger.debug('tryIntelligentFallback', 'Attempting Strategy 1: Direct filtering')
  const gated = gateFormsByCurriculumAndDialect(verbTypeFiltered, settings)
  const compliant = gated.filter(f => matchesSpecific(f, specificConstraints) && allowsPerson(f.person, settings) && allowsLevel(f, settings))
  
  if (compliant.length > 0) {
    const selected = compliant[Math.floor(Math.random() * compliant.length)]
    logger.info('tryIntelligentFallback', 'Strategy 1 succeeded: Direct filtering', {
      candidateCount: compliant.length,
      selected: `${selected.lemma}-${selected.mood}-${selected.tense}`
    })
    return selected
  }
  
  // Strategy 2: Relax person constraints if region is causing issues
  if (specificMood && specificTense) {
    logger.debug('tryIntelligentFallback', 'Attempting Strategy 2: Relaxed person constraints')
    const relaxedPerson = gated.filter(f => 
      f.mood === specificMood && 
      f.tense === specificTense && 
      allowsLevel(f, settings)
    )
    
    if (relaxedPerson.length > 0) {
      const selected = relaxedPerson[Math.floor(Math.random() * relaxedPerson.length)]
      logger.info('tryIntelligentFallback', 'Strategy 2 succeeded: Relaxed person constraints', {
        candidateCount: relaxedPerson.length,
        selected: `${selected.lemma}-${selected.mood}-${selected.tense}`
      })
      return selected
    }
  }
  
  // Strategy 3: Try similar tenses within the same mood
  if (specificMood) {
    logger.debug('tryIntelligentFallback', 'Attempting Strategy 3: Similar tenses')
    const similarTenses = getSimilarTenses(specificTense)
    
    for (const altTense of similarTenses) {
      logger.debug('tryIntelligentFallback', `Trying similar tense: ${altTense}`)
      const altForms = gated.filter(f => 
        f.mood === specificMood && 
        f.tense === altTense && 
        allowsPerson(f.person, settings) && 
        allowsLevel(f, settings)
      )
      
      if (altForms.length > 0) {
        const selected = altForms[Math.floor(Math.random() * altForms.length)]
        logger.info('tryIntelligentFallback', `Strategy 3 succeeded: Similar tense substitution`, {
          originalTense: specificTense,
          substituteTense: altTense,
          candidateCount: altForms.length,
          selected: `${selected.lemma}-${selected.mood}-${selected.tense}`
        })
        return selected
      }
    }
  }
  
  // Strategy 4: Try relaxing verb type constraints if specified
  if (settings.verbType && settings.verbType !== 'all') {
    logger.debug('tryIntelligentFallback', 'Attempting Strategy 4: Relaxed verb type constraints')
    const allTypesGated = gateFormsByCurriculumAndDialect(eligibleForms, settings)
    const relaxedType = allTypesGated.filter(f => 
      matchesSpecific(f, specificConstraints) && 
      allowsPerson(f.person, settings) && 
      allowsLevel(f, settings)
    )
    
    if (relaxedType.length > 0) {
      const selected = relaxedType[Math.floor(Math.random() * relaxedType.length)]
      logger.info('tryIntelligentFallback', 'Strategy 4 succeeded: Relaxed verb type constraints', {
        originalVerbType: settings.verbType,
        candidateCount: relaxedType.length,
        selected: `${selected.lemma}-${selected.mood}-${selected.tense}`
      })
      return selected
    }
  }
  
  logger.warn('tryIntelligentFallback', 'All fallback strategies failed')
  return null
}

/**
 * Last resort fallback to mixed practice when specific practice completely fails
 * @param {Array} allForms - All available forms for the region
 * @param {Object} settings - User settings
 * @returns {Object|null} - Selected form or null if even mixed practice fails
 */
export const fallbackToMixedPractice = (allForms, settings) => {
  logger.warn('fallbackToMixedPractice', 'Switching to mixed practice as final fallback')
  
  // Force mixed practice settings
  const fallbackSettings = {
    ...settings,
    practiceMode: 'mixed',
    specificMood: null,
    specificTense: null
  }
  
  try {
    // Try to get any valid form for the user's level
    const gated = gateFormsByCurriculumAndDialect(allForms, fallbackSettings)

    // Apply pedagogical filtering even in fallback
    const pedagogicallyFiltered = applyPedagogicalFiltering(gated, settings)

    const levelValid = pedagogicallyFiltered.filter(f => {
      const userLevel = settings.level || 'B1'
      const allowed = getAllowedCombosForLevel(userLevel)
      return allowed.has(`${f.mood}|${f.tense}`)
    })
    
    if (levelValid.length > 0) {
      const form = levelValid[Math.floor(Math.random() * levelValid.length)]
      logger.info('fallbackToMixedPractice', 'Mixed fallback succeeded', {
        candidateCount: levelValid.length,
        selected: `${form.lemma}-${form.mood}-${form.tense}`,
        originalSettings: {
          practiceMode: settings.practiceMode,
          specificMood: settings.specificMood,
          specificTense: settings.specificTense
        }
      })
      
      return {
        id: Date.now(),
        lemma: form.lemma,
        mood: form.mood,
        tense: form.tense,
        person: form.person,
        form: {
          value: form.value || form.form,
          lemma: form.lemma,
          mood: form.mood,
          tense: form.tense,
          person: form.person,
          alt: form.alt || [],
          accepts: form.accepts || {}
        },
        settings: fallbackSettings,
        fallbackMode: 'mixed_practice',
        originalMode: settings.practiceMode
      }
    }
    
    logger.error('fallbackToMixedPractice', 'No valid forms found even with mixed practice fallback', {
      gatedCount: gated.length,
      levelValidCount: levelValid.length,
      userLevel: settings.level
    })
    
  } catch (error) {
    logger.error('fallbackToMixedPractice', 'Error during mixed practice fallback', error)
  }
  
  return null
}

/**
 * Progressive constraint relaxation strategy
 * @param {Array} forms - Available forms
 * @param {Object} settings - User settings
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {Object|null} - Selected form after progressive relaxation
 */
export const progressiveConstraintRelaxation = (forms, settings, specificConstraints) => {
  const { isSpecific, specificMood, specificTense } = specificConstraints
  
  if (!isSpecific) return null
  
  logger.debug('progressiveConstraintRelaxation', 'Starting progressive constraint relaxation')
  
  // Level 1: Exact match with all constraints
  let candidates = forms.filter(f => 
    f.mood === specificMood && 
    f.tense === specificTense && 
    allowsPerson(f.person, settings) && 
    allowsLevel(f, settings)
  )
  
  if (candidates.length > 0) {
    logger.debug('progressiveConstraintRelaxation', 'Level 1: Exact match found')
    return candidates[Math.floor(Math.random() * candidates.length)]
  }
  
  // Level 2: Relax person constraints
  candidates = forms.filter(f => 
    f.mood === specificMood && 
    f.tense === specificTense && 
    allowsLevel(f, settings)
  )
  
  if (candidates.length > 0) {
    logger.debug('progressiveConstraintRelaxation', 'Level 2: Relaxed person constraints')
    return candidates[Math.floor(Math.random() * candidates.length)]
  }
  
  // Level 3: Try similar tenses
  const similarTenses = getSimilarTenses(specificTense)
  for (const altTense of similarTenses) {
    candidates = forms.filter(f => 
      f.mood === specificMood && 
      f.tense === altTense && 
      allowsLevel(f, settings)
    )
    
    if (candidates.length > 0) {
      logger.debug('progressiveConstraintRelaxation', `Level 3: Similar tense ${altTense}`)
      return candidates[Math.floor(Math.random() * candidates.length)]
    }
  }
  
  // Level 4: Same mood, any valid tense for level
  candidates = forms.filter(f => 
    f.mood === specificMood && 
    allowsLevel(f, settings)
  )
  
  if (candidates.length > 0) {
    logger.debug('progressiveConstraintRelaxation', 'Level 4: Same mood, any tense')
    return candidates[Math.floor(Math.random() * candidates.length)]
  }
  
  logger.warn('progressiveConstraintRelaxation', 'All relaxation levels failed')
  return null
}

/**
 * Emergency fallback for when all other strategies fail
 * @param {Array} allForms - All available forms
 * @param {Object} settings - User settings
 * @returns {Object|null} - Emergency fallback form
 */
export const emergencyFallback = (allForms, settings) => {
  logger.warn('emergencyFallback', 'Using emergency fallback - returning any valid form')
  
  // Just get any form that satisfies basic level constraints
  const basicValid = allForms.filter(f => allowsLevel(f, settings))
  
  if (basicValid.length > 0) {
    const form = basicValid[Math.floor(Math.random() * basicValid.length)]
    logger.warn('emergencyFallback', 'Emergency fallback succeeded', {
      selected: `${form.lemma}-${form.mood}-${form.tense}`,
      candidateCount: basicValid.length
    })
    return form
  }
  
  // Absolute last resort: any form at all
  if (allForms.length > 0) {
    const form = allForms[Math.floor(Math.random() * allForms.length)]
    logger.error('emergencyFallback', 'Absolute emergency: returning random form', {
      selected: `${form.lemma}-${form.mood}-${form.tense}`,
      totalForms: allForms.length
    })
    return form
  }
  
  logger.error('emergencyFallback', 'CRITICAL: No forms available at all')
  return null
}

/**
 * Get fallback statistics for debugging
 * @param {string} strategy - Strategy name that succeeded
 * @param {Object} result - Result of fallback attempt
 * @param {Object} originalConstraints - Original constraints that failed
 * @returns {Object} - Fallback statistics
 */
export const getFallbackStats = (strategy, result, originalConstraints) => {
  return {
    strategy,
    success: !!result,
    originalConstraints,
    result: result ? {
      lemma: result.lemma,
      mood: result.mood,
      tense: result.tense,
      person: result.person
    } : null,
    timestamp: new Date().toISOString()
  }
}