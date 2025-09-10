/**
 * DrillValidationSystem.js - Validation and integrity guard logic extracted from useDrillMode
 * 
 * This module handles all validation operations including:
 * - Integrity guards for form validation
 * - Critical validation checks during form generation
 * - Form compliance verification
 * - Error detection and reporting
 * - Similar tense mapping for fallback strategies
 */

import { 
  allowsPerson, 
  matchesSpecific, 
  allowsLevel, 
  passesIntegrityChecks 
} from './DrillFormFilters.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('DrillValidation')

/**
 * Validate that eligible forms exist for specific practice mode
 * @param {Array} eligibleForms - Forms available for practice
 * @param {Object} specificConstraints - Specific practice constraints
 * @throws {Error} - If no forms are available for specific practice
 */
export const validateEligibleForms = (eligibleForms, specificConstraints) => {
  const { isSpecific, specificMood, specificTense } = specificConstraints
  
  if (!isSpecific) return
  
  if (eligibleForms.length === 0) {
    const error = `No forms available for ${specificMood} ${specificTense}. Check your configuration.`
    logger.error('validateEligibleForms', 'CRITICAL: No forms found for specific practice', {
      specificMood,
      specificTense,
      error
    })
    throw new Error(error)
  }
  
  logger.debug('validateEligibleForms', 'Eligible forms validation passed', {
    specificMood,
    specificTense,
    count: eligibleForms.length
  })
}

/**
 * Perform comprehensive integrity checks on a generated form
 * @param {Object} form - Generated form to validate
 * @param {Object} settings - User settings
 * @param {Object} specificConstraints - Specific practice constraints
 * @param {string} selectionMethod - Method used to select the form
 * @returns {Object} - Validation result with success flag and details
 */
export const performIntegrityGuard = (form, settings, specificConstraints, selectionMethod) => {
  if (!form) {
    return {
      success: false,
      reason: 'Form is null or undefined',
      details: { form: null }
    }
  }
  
  const checks = {
    matchesSpecific: matchesSpecific(form, specificConstraints),
    allowsPerson: allowsPerson(form.person, settings),
    allowsLevel: allowsLevel(form, settings)
  }
  
  const allPassed = Object.values(checks).every(Boolean)
  
  if (!allPassed) {
    const { isSpecific, specificMood, specificTense } = specificConstraints
    
    logger.error('performIntegrityGuard', 'INTEGRITY GUARD TRIGGERED - Algorithm produced invalid form!', {
      selected: `${form.mood}/${form.tense}/${form.person}`,
      expected: isSpecific ? `${specificMood}/${specificTense}` : 'any',
      method: selectionMethod,
      level: settings.level,
      checks,
      form: {
        lemma: form.lemma,
        mood: form.mood,
        tense: form.tense,
        person: form.person
      }
    })
    
    return {
      success: false,
      reason: 'Form failed integrity checks',
      details: {
        form: {
          lemma: form.lemma,
          mood: form.mood,
          tense: form.tense,
          person: form.person
        },
        checks,
        expected: isSpecific ? { mood: specificMood, tense: specificTense } : 'any',
        settings: {
          level: settings.level,
          region: settings.region,
          verbType: settings.verbType
        }
      }
    }
  }
  
  return {
    success: true,
    reason: 'All integrity checks passed',
    details: { checks }
  }
}

/**
 * Validate specific practice configuration
 * @param {Object} settings - User settings
 * @returns {Object} - Validation result for specific practice setup
 */
export const validateSpecificPracticeConfig = (settings) => {
  if (settings.practiceMode !== 'specific') {
    return { valid: true, reason: 'Not in specific practice mode' }
  }
  
  const hasValidConfig = !!(settings.specificMood && settings.specificTense)
  
  if (!hasValidConfig) {
    logger.warn('validateSpecificPracticeConfig', 'Invalid specific practice configuration', {
      practiceMode: settings.practiceMode,
      specificMood: settings.specificMood,
      specificTense: settings.specificTense
    })
    
    return {
      valid: false,
      reason: 'Missing specific mood or tense configuration',
      details: {
        practiceMode: settings.practiceMode,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense
      }
    }
  }
  
  return {
    valid: true,
    reason: 'Specific practice configuration is valid',
    details: {
      specificMood: settings.specificMood,
      specificTense: settings.specificTense
    }
  }
}

/**
 * Validate final form selection against specific practice requirements
 * @param {Object} form - Selected form
 * @param {Object} settings - User settings
 * @returns {Object} - Validation result for final form
 */
export const validateFinalFormSelection = (form, settings) => {
  if (settings.practiceMode !== 'specific' || !form) {
    return { valid: true, reason: 'Not applicable' }
  }
  
  const moodMatches = form.mood === settings.specificMood
  const tenseMatches = form.tense === settings.specificTense
  
  logger.debug('validateFinalFormSelection', 'Final form check for specific practice', {
    returnedMood: form.mood,
    expectedMood: settings.specificMood,
    moodMatches,
    returnedTense: form.tense,
    expectedTense: settings.specificTense,
    tenseMatches
  })
  
  if (!moodMatches || !tenseMatches) {
    return {
      valid: false,
      reason: 'Generated form does not match specific practice requirements',
      details: {
        expected: {
          mood: settings.specificMood,
          tense: settings.specificTense
        },
        actual: {
          mood: form.mood,
          tense: form.tense
        },
        matches: { moodMatches, tenseMatches }
      }
    }
  }
  
  return {
    valid: true,
    reason: 'Form matches specific practice requirements',
    details: {
      mood: form.mood,
      tense: form.tense
    }
  }
}

/**
 * Get similar tenses for fallback attempts
 * @param {string} tense - Original tense
 * @returns {Array} - Array of similar tenses
 */
export const getSimilarTenses = (tense) => {
  const tenseGroups = {
    'pretIndef': ['impf'],
    'impf': ['pretIndef'],
    'subjPres': ['subjImpf'],
    'subjImpf': ['subjPres'],
    'pretPerf': ['plusc'],
    'plusc': ['pretPerf'],
    'fut': ['cond'],
    'cond': ['fut']
  }
  
  return tenseGroups[tense] || []
}

/**
 * Validate forms for compliance with all constraints
 * @param {Array} forms - Forms to validate
 * @param {Object} settings - User settings
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {Array} - Forms that pass validation
 */
export const getCompliantForms = (forms, settings, specificConstraints) => {
  return forms.filter(form => passesIntegrityChecks(form, settings, specificConstraints))
}

/**
 * Validate verb type filtering results
 * @param {Array} originalForms - Forms before verb type filtering
 * @param {Array} filteredForms - Forms after verb type filtering
 * @param {string} verbType - Applied verb type filter
 * @returns {Object} - Validation results for verb type filtering
 */
export const validateVerbTypeFiltering = (originalForms, filteredForms, verbType) => {
  if (!verbType || verbType === 'all') {
    return {
      valid: true,
      reason: 'No verb type filter applied',
      stats: { original: originalForms.length, filtered: filteredForms.length }
    }
  }
  
  const reductionPercent = originalForms.length > 0 
    ? Math.round(((originalForms.length - filteredForms.length) / originalForms.length) * 100)
    : 0
  
  // Warn if filtering removes too many forms
  if (filteredForms.length === 0) {
    logger.warn('validateVerbTypeFiltering', `Verb type filter '${verbType}' removed all forms`, {
      verbType,
      originalCount: originalForms.length,
      filteredCount: filteredForms.length
    })
    
    return {
      valid: false,
      reason: 'Verb type filter removed all available forms',
      stats: {
        original: originalForms.length,
        filtered: filteredForms.length,
        reductionPercent
      }
    }
  }
  
  // Log significant reductions
  if (reductionPercent > 75) {
    logger.warn('validateVerbTypeFiltering', `Verb type filter '${verbType}' caused significant reduction`, {
      verbType,
      originalCount: originalForms.length,
      filteredCount: filteredForms.length,
      reductionPercent
    })
  }
  
  return {
    valid: true,
    reason: 'Verb type filtering completed successfully',
    stats: {
      original: originalForms.length,
      filtered: filteredForms.length,
      reductionPercent
    }
  }
}

/**
 * Comprehensive validation for generated drill items
 * @param {Object} item - Generated drill item
 * @param {Object} settings - User settings
 * @returns {Object} - Comprehensive validation result
 */
export const validateDrillItem = (item, settings) => {
  if (!item) {
    return {
      valid: false,
      reason: 'Item is null or undefined',
      errors: ['MISSING_ITEM']
    }
  }
  
  const errors = []
  const warnings = []
  
  // Check required properties
  const requiredProps = ['lemma', 'mood', 'tense', 'person', 'form']
  for (const prop of requiredProps) {
    if (!item[prop]) {
      errors.push(`MISSING_${prop.toUpperCase()}`)
    }
  }
  
  // Check form structure
  if (item.form && typeof item.form === 'object') {
    if (!item.form.value) {
      errors.push('MISSING_FORM_VALUE')
    }
  } else {
    errors.push('INVALID_FORM_STRUCTURE')
  }
  
  // Check settings compatibility
  if (item.settings) {
    // Validate dialect consistency
    const hasVoseo = item.person?.includes('vos') || item.person === '2s_vos'
    const hasTuteo = item.person?.includes('tu') || item.person === '2s_tu'
    const hasVosotros = item.person?.includes('vosotros') || item.person === '2p_vosotros'
    
    if (hasVoseo && !item.settings.useVoseo) {
      warnings.push('VOSEO_INCONSISTENCY')
    }
    if (hasTuteo && !item.settings.useTuteo) {
      warnings.push('TUTEO_INCONSISTENCY')
    }
    if (hasVosotros && !item.settings.useVosotros) {
      warnings.push('VOSOTROS_INCONSISTENCY')
    }
  }
  
  return {
    valid: errors.length === 0,
    reason: errors.length === 0 ? 'Item validation passed' : 'Item validation failed',
    errors,
    warnings,
    item: {
      lemma: item.lemma,
      mood: item.mood,
      tense: item.tense,
      person: item.person
    }
  }
}