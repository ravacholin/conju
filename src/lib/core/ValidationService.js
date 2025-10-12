/**
 * ValidationService.js
 *
 * Validation utilities for verb forms, moods, and tenses.
 * Extracted from generator.js to improve maintainability.
 *
 * Responsibilities:
 * - Validate mood/tense combinations
 * - Check curriculum compatibility
 * - Validate form structures
 * - Provide validation error messages
 */

import { VALID_MOODS, VALID_TENSES, MOOD_TENSE_MAP } from '../data/moodTenseDefinitions.js'
import { getAllowedCombosForLevel } from './curriculumGate.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('ValidationService')

/**
 * Validation result class
 */
export class ValidationResult {
  constructor(isValid, errors = []) {
    this.isValid = isValid
    this.errors = errors
  }

  /**
   * Add an error to the validation result
   */
  addError(error) {
    this.errors.push(error)
    this.isValid = false
  }

  /**
   * Merge another validation result into this one
   */
  merge(other) {
    if (!other.isValid) {
      this.isValid = false
      this.errors.push(...other.errors)
    }
  }

  /**
   * Get first error message
   */
  getFirstError() {
    return this.errors.length > 0 ? this.errors[0] : null
  }
}

/**
 * Validation service class
 */
export class ValidationService {
  constructor() {
    this.stats = {
      validations: 0,
      failures: 0
    }
  }

  /**
   * Validate a verb form object
   * @param {Object} form - Form to validate
   * @returns {ValidationResult} Validation result
   */
  validateForm(form) {
    this.stats.validations++

    const result = new ValidationResult(true)

    // Check required fields
    if (!form) {
      result.addError('Form object is null or undefined')
      this.stats.failures++
      return result
    }

    if (!form.lemma) {
      result.addError('Form is missing lemma')
    }

    if (!form.mood) {
      result.addError('Form is missing mood')
    }

    if (!form.tense) {
      result.addError('Form is missing tense')
    }

    if (!form.value && !form.form) {
      result.addError('Form is missing value/form')
    }

    // Validate mood
    if (form.mood) {
      const moodResult = this.validateMood(form.mood)
      result.merge(moodResult)
    }

    // Validate tense
    if (form.tense) {
      const tenseResult = this.validateTense(form.tense)
      result.merge(tenseResult)
    }

    // Validate mood/tense combination
    if (form.mood && form.tense) {
      const comboResult = this.validateMoodTenseCombination(form.mood, form.tense)
      result.merge(comboResult)
    }

    // Validate person (if conjugated form)
    if (form.mood !== 'nonfinite' && !form.person) {
      result.addError('Conjugated form is missing person')
    }

    if (!result.isValid) {
      this.stats.failures++
    }

    return result
  }

  /**
   * Validate a mood
   * @param {string} mood - Mood to validate
   * @returns {ValidationResult} Validation result
   */
  validateMood(mood) {
    const result = new ValidationResult(true)

    if (!mood || typeof mood !== 'string') {
      result.addError('Mood must be a non-empty string')
      return result
    }

    if (!VALID_MOODS.includes(mood)) {
      result.addError(`Invalid mood: ${mood}. Valid moods: ${VALID_MOODS.join(', ')}`)
    }

    return result
  }

  /**
   * Validate a tense
   * @param {string} tense - Tense to validate
   * @returns {ValidationResult} Validation result
   */
  validateTense(tense) {
    const result = new ValidationResult(true)

    if (!tense || typeof tense !== 'string') {
      result.addError('Tense must be a non-empty string')
      return result
    }

    if (!VALID_TENSES.includes(tense)) {
      result.addError(`Invalid tense: ${tense}. Valid tenses: ${VALID_TENSES.join(', ')}`)
    }

    return result
  }

  /**
   * Validate mood/tense combination
   * @param {string} mood - Mood
   * @param {string} tense - Tense
   * @returns {ValidationResult} Validation result
   */
  validateMoodTenseCombination(mood, tense) {
    const result = new ValidationResult(true)

    if (!mood || !tense) {
      result.addError('Both mood and tense are required')
      return result
    }

    // Check if this mood/tense combination is valid
    const validTensesForMood = MOOD_TENSE_MAP[mood]

    if (!validTensesForMood) {
      result.addError(`Unknown mood: ${mood}`)
      return result
    }

    if (!validTensesForMood.includes(tense)) {
      result.addError(`Invalid tense ${tense} for mood ${mood}. Valid tenses: ${validTensesForMood.join(', ')}`)
    }

    return result
  }

  /**
   * Validate a form against a curriculum level
   * @param {Object} form - Form to validate
   * @param {string} level - CEFR level (A1, A2, etc.)
   * @returns {ValidationResult} Validation result
   */
  validateFormForLevel(form, level) {
    const result = this.validateForm(form)

    if (!result.isValid) {
      return result
    }

    // Check if mood/tense is allowed for this level
    const allowedCombos = getAllowedCombosForLevel(level)
    const comboKey = `${form.mood}|${form.tense}`

    if (!allowedCombos.has(comboKey)) {
      result.addError(`Combination ${comboKey} is not allowed for level ${level}`)
    }

    return result
  }

  /**
   * Validate a settings object for form generation
   * @param {Object} settings - Settings object
   * @returns {ValidationResult} Validation result
   */
  validateSettings(settings) {
    const result = new ValidationResult(true)

    if (!settings || typeof settings !== 'object') {
      result.addError('Settings must be an object')
      return result
    }

    // Validate level if present
    if (settings.level) {
      const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL']
      if (!validLevels.includes(settings.level)) {
        result.addError(`Invalid level: ${settings.level}. Valid levels: ${validLevels.join(', ')}`)
      }
    }

    // Validate region if present
    if (settings.region) {
      const validRegions = ['rioplatense', 'la_general', 'peninsular', 'global']
      if (!validRegions.includes(settings.region)) {
        result.addError(`Invalid region: ${settings.region}. Valid regions: ${validRegions.join(', ')}`)
      }
    }

    // Validate practice mode if present
    if (settings.practiceMode) {
      const validModes = ['mixed', 'specific', 'theme', 'by_level', 'all']
      if (!validModes.includes(settings.practiceMode)) {
        result.addError(`Invalid practice mode: ${settings.practiceMode}. Valid modes: ${validModes.join(', ')}`)
      }
    }

    // Validate verb type if present
    if (settings.verbType) {
      const validTypes = ['all', 'regular', 'irregular', 'mixed']
      if (!validTypes.includes(settings.verbType)) {
        result.addError(`Invalid verb type: ${settings.verbType}. Valid types: ${validTypes.join(', ')}`)
      }
    }

    // Validate specific mood/tense if in specific mode
    if (settings.practiceMode === 'specific') {
      if (settings.specificMood) {
        const moodResult = this.validateMood(settings.specificMood)
        result.merge(moodResult)
      }

      if (settings.specificTense) {
        const tenseResult = this.validateTense(settings.specificTense)
        result.merge(tenseResult)
      }

      if (settings.specificMood && settings.specificTense) {
        const comboResult = this.validateMoodTenseCombination(settings.specificMood, settings.specificTense)
        result.merge(comboResult)
      }
    }

    return result
  }

  /**
   * Batch validate multiple forms
   * @param {Array} forms - Array of forms to validate
   * @returns {Object} Validation summary
   */
  batchValidateForms(forms) {
    if (!Array.isArray(forms)) {
      logger.error('batchValidateForms', 'Input must be an array')
      return {
        totalForms: 0,
        validForms: 0,
        invalidForms: 0,
        errors: ['Input must be an array']
      }
    }

    const errors = []
    let validCount = 0
    let invalidCount = 0

    forms.forEach((form, index) => {
      const result = this.validateForm(form)
      if (result.isValid) {
        validCount++
      } else {
        invalidCount++
        errors.push({
          index,
          lemma: form?.lemma || 'unknown',
          errors: result.errors
        })
      }
    })

    return {
      totalForms: forms.length,
      validForms: validCount,
      invalidForms: invalidCount,
      errors,
      validationRate: forms.length > 0 ? ((validCount / forms.length) * 100).toFixed(1) + '%' : '0%'
    }
  }

  /**
   * Get validation statistics
   */
  getStats() {
    return {
      ...this.stats,
      failureRate: this.stats.validations > 0
        ? ((this.stats.failures / this.stats.validations) * 100).toFixed(1) + '%'
        : '0%'
    }
  }
}

/**
 * Singleton instance
 */
let validationServiceInstance = null

/**
 * Get validation service instance
 * @returns {ValidationService} Validation service instance
 */
export function getValidationService() {
  if (!validationServiceInstance) {
    validationServiceInstance = new ValidationService()
  }
  return validationServiceInstance
}

/**
 * Quick validation helper functions
 */
export function isValidForm(form) {
  const service = getValidationService()
  const result = service.validateForm(form)
  return result.isValid
}

export function isValidMood(mood) {
  const service = getValidationService()
  const result = service.validateMood(mood)
  return result.isValid
}

export function isValidTense(tense) {
  const service = getValidationService()
  const result = service.validateTense(tense)
  return result.isValid
}

export function isValidMoodTenseCombination(mood, tense) {
  const service = getValidationService()
  const result = service.validateMoodTenseCombination(mood, tense)
  return result.isValid
}
