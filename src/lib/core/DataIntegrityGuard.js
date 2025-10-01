/**
 * DataIntegrityGuard.js - Sistema de validación y auto-sanación de datos
 *
 * Este sistema garantiza la integridad de los datos de verbos mediante:
 * - Validación estructural profunda
 * - Checksums y verificación de integridad
 * - Auto-sanación de datos corruptos
 * - Monitoreo en tiempo real
 * - Reporting de anomalías
 * - Recovery automático
 */

import { createLogger } from '../utils/logger.js'

const logger = createLogger('DataIntegrityGuard')

// Validation levels
const VALIDATION_LEVELS = {
  BASIC: 'basic',           // Structure and required fields
  STANDARD: 'standard',     // Basic + content validation
  COMPREHENSIVE: 'comprehensive', // Standard + linguistic validation
  STRICT: 'strict'          // Comprehensive + cross-references
}

// Error types
const ERROR_TYPES = {
  STRUCTURE: 'structure',
  CONTENT: 'content',
  LINGUISTIC: 'linguistic',
  REFERENCE: 'reference',
  CORRUPTION: 'corruption'
}

// Severity levels
const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

class DataIntegrityGuard {
  constructor() {
    this.validationRules = new Map()
    this.healingStrategies = new Map()
    this.validationCache = new Map()
    this.errorHistory = []
    this.healingHistory = []
    this.checksums = new Map()
    this.monitoringActive = false
    this.lastValidation = null
    this.validationMetrics = {
      totalValidations: 0,
      passedValidations: 0,
      failedValidations: 0,
      healingAttempts: 0,
      successfulHealings: 0,
      averageValidationTime: 0
    }

    this.initializeValidationRules()
    this.initializeHealingStrategies()
  }

  /**
   * Initialize validation rules
   */
  initializeValidationRules() {
    // Basic structure validation
    this.addValidationRule('verb_structure', VALIDATION_LEVELS.BASIC, (verb) => {
      if (!verb || typeof verb !== 'object') {
        return { valid: false, error: 'Verb is not an object', severity: SEVERITY.CRITICAL }
      }

      if (!verb.lemma || typeof verb.lemma !== 'string') {
        return { valid: false, error: 'Missing or invalid lemma', severity: SEVERITY.CRITICAL }
      }

      if (!verb.paradigms || !Array.isArray(verb.paradigms)) {
        return { valid: false, error: 'Missing or invalid paradigms array', severity: SEVERITY.CRITICAL }
      }

      return { valid: true }
    })

    // Paradigm structure validation
    this.addValidationRule('paradigm_structure', VALIDATION_LEVELS.BASIC, (verb) => {
      for (let i = 0; i < verb.paradigms.length; i++) {
        const paradigm = verb.paradigms[i]

        if (!paradigm.regionTags || !Array.isArray(paradigm.regionTags)) {
          return {
            valid: false,
            error: `Paradigm ${i} missing regionTags`,
            severity: SEVERITY.HIGH,
            context: { verbLemma: verb.lemma, paradigmIndex: i }
          }
        }

        if (!paradigm.forms || !Array.isArray(paradigm.forms)) {
          return {
            valid: false,
            error: `Paradigm ${i} missing forms array`,
            severity: SEVERITY.CRITICAL,
            context: { verbLemma: verb.lemma, paradigmIndex: i }
          }
        }

        if (paradigm.forms.length === 0) {
          return {
            valid: false,
            error: `Paradigm ${i} has empty forms array`,
            severity: SEVERITY.HIGH,
            context: { verbLemma: verb.lemma, paradigmIndex: i }
          }
        }
      }

      return { valid: true }
    })

    // Form structure validation
    this.addValidationRule('form_structure', VALIDATION_LEVELS.STANDARD, (verb) => {
      for (const paradigm of verb.paradigms) {
        for (let i = 0; i < paradigm.forms.length; i++) {
          const form = paradigm.forms[i]

          if (!form.mood || typeof form.mood !== 'string') {
            return {
              valid: false,
              error: `Form ${i} missing or invalid mood`,
              severity: SEVERITY.HIGH,
              context: { verbLemma: verb.lemma, formIndex: i }
            }
          }

          if (!form.tense || typeof form.tense !== 'string') {
            return {
              valid: false,
              error: `Form ${i} missing or invalid tense`,
              severity: SEVERITY.HIGH,
              context: { verbLemma: verb.lemma, formIndex: i }
            }
          }

          if (!form.value || typeof form.value !== 'string') {
            return {
              valid: false,
              error: `Form ${i} missing or invalid value`,
              severity: SEVERITY.CRITICAL,
              context: { verbLemma: verb.lemma, formIndex: i }
            }
          }

          // Person validation (not required for nonfinite forms)
          if (form.mood !== 'nonfinite' && (!form.person || typeof form.person !== 'string')) {
            return {
              valid: false,
              error: `Form ${i} missing person for finite form`,
              severity: SEVERITY.HIGH,
              context: { verbLemma: verb.lemma, formIndex: i, mood: form.mood }
            }
          }
        }
      }

      return { valid: true }
    })

    // Content validation
    this.addValidationRule('content_validation', VALIDATION_LEVELS.STANDARD, (verb) => {
      const validMoods = ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
      const validRegions = ['rioplatense', 'la_general', 'peninsular']

      for (const paradigm of verb.paradigms) {
        // Validate region tags
        for (const region of paradigm.regionTags) {
          if (!validRegions.includes(region)) {
            return {
              valid: false,
              error: `Invalid region tag: ${region}`,
              severity: SEVERITY.MEDIUM,
              context: { verbLemma: verb.lemma, region }
            }
          }
        }

        // Validate moods
        for (const form of paradigm.forms) {
          if (!validMoods.includes(form.mood)) {
            return {
              valid: false,
              error: `Invalid mood: ${form.mood}`,
              severity: SEVERITY.HIGH,
              context: { verbLemma: verb.lemma, mood: form.mood }
            }
          }
        }
      }

      return { valid: true }
    })

    // Linguistic validation
    this.addValidationRule('linguistic_validation', VALIDATION_LEVELS.COMPREHENSIVE, (verb) => {
      // Check for duplicate forms within paradigms
      for (const paradigm of verb.paradigms) {
        const formKeys = new Set()
        for (const form of paradigm.forms) {
          const key = `${form.mood}|${form.tense}|${form.person || ''}`
          if (formKeys.has(key)) {
            return {
              valid: false,
              error: `Duplicate form detected: ${key}`,
              severity: SEVERITY.MEDIUM,
              context: { verbLemma: verb.lemma, duplicateKey: key }
            }
          }
          formKeys.add(key)
        }
      }

      // Basic Spanish orthography check
      for (const paradigm of verb.paradigms) {
        for (const form of paradigm.forms) {
          if (!/^[a-záéíóúüñ]+$/i.test(form.value)) {
            return {
              valid: false,
              error: `Invalid characters in form value: ${form.value}`,
              severity: SEVERITY.LOW,
              context: { verbLemma: verb.lemma, value: form.value }
            }
          }
        }
      }

      return { valid: true }
    })

    // Reference validation
    this.addValidationRule('reference_validation', VALIDATION_LEVELS.STRICT, (verb, allVerbs) => {
      // Cross-reference validation with other verbs
      if (allVerbs) {
        const duplicateLemmas = allVerbs.filter(v => v.lemma === verb.lemma && v !== verb)
        if (duplicateLemmas.length > 0) {
          return {
            valid: false,
            error: `Duplicate lemma found: ${verb.lemma}`,
            severity: SEVERITY.HIGH,
            context: { verbLemma: verb.lemma, duplicateCount: duplicateLemmas.length }
          }
        }
      }

      return { valid: true }
    })
  }

  /**
   * Initialize healing strategies
   */
  initializeHealingStrategies() {
    // Fix missing person in finite forms
    this.addHealingStrategy('fix_missing_person', (verb, error) => {
      if (error.error.includes('missing person for finite form')) {
        const { formIndex } = error.context
        for (const paradigm of verb.paradigms) {
          if (paradigm.forms[formIndex]) {
            const form = paradigm.forms[formIndex]
            // Attempt to infer person from tense patterns
            if (form.mood === 'indicative' && form.tense === 'pres') {
              // Common present tense patterns
              if (form.value.endsWith('o')) {
                form.person = '1s'
              } else if (form.value.endsWith('s') || form.value.endsWith('ás')) {
                form.person = '2s_tu'
              } else if (form.value.endsWith('a') || form.value.endsWith('e')) {
                form.person = '3s'
              }
            }
          }
        }
        return true
      }
      return false
    })

    // Remove duplicate forms
    this.addHealingStrategy('remove_duplicates', (verb, error) => {
      if (error.error.includes('Duplicate form detected')) {
        const { duplicateKey } = error.context
        const [mood, tense, person] = duplicateKey.split('|')

        for (const paradigm of verb.paradigms) {
          const duplicates = paradigm.forms.filter(f =>
            f.mood === mood && f.tense === tense && (f.person || '') === person
          )

          if (duplicates.length > 1) {
            // Keep the first one, remove others
            for (let i = 1; i < duplicates.length; i++) {
              const index = paradigm.forms.indexOf(duplicates[i])
              if (index > -1) {
                paradigm.forms.splice(index, 1)
              }
            }
            return true
          }
        }
      }
      return false
    })

    // Fix character encoding issues
    this.addHealingStrategy('fix_encoding', (verb, error) => {
      if (error.error.includes('Invalid characters in form value')) {
        const { value } = error.context

        // Common encoding fixes
        const fixes = {
          'Ã¡': 'á', 'Ã©': 'é', 'Ã­': 'í', 'Ã³': 'ó', 'Ãº': 'ú',
          'Ã±': 'ñ', 'Ã¼': 'ü'
        }

        for (const paradigm of verb.paradigms) {
          for (const form of paradigm.forms) {
            if (form.value === value) {
              let fixed = form.value
              for (const [bad, good] of Object.entries(fixes)) {
                fixed = fixed.replace(new RegExp(bad, 'g'), good)
              }
              if (fixed !== form.value) {
                form.value = fixed
                return true
              }
            }
          }
        }
      }
      return false
    })

    // Remove invalid forms
    this.addHealingStrategy('remove_invalid_forms', (verb, error) => {
      if (error.severity === SEVERITY.CRITICAL && error.context?.formIndex !== undefined) {
        const { formIndex } = error.context
        for (const paradigm of verb.paradigms) {
          if (paradigm.forms[formIndex]) {
            paradigm.forms.splice(formIndex, 1)
            return true
          }
        }
      }
      return false
    })
  }

  /**
   * Add validation rule
   */
  addValidationRule(name, level, rule) {
    if (!this.validationRules.has(level)) {
      this.validationRules.set(level, new Map())
    }
    this.validationRules.get(level).set(name, rule)
  }

  /**
   * Add healing strategy
   */
  addHealingStrategy(name, strategy) {
    this.healingStrategies.set(name, strategy)
  }

  /**
   * Validate single verb
   */
  validateVerb(verb, level = VALIDATION_LEVELS.STANDARD, allVerbs = null) {
    const startTime = performance.now()
    this.validationMetrics.totalValidations++

    try {
      const errors = []
      const cacheKey = this.generateCacheKey(verb, level)

      // Check cache first
      if (this.validationCache.has(cacheKey)) {
        const cached = this.validationCache.get(cacheKey)
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes
          return cached.result
        }
      }

      // Run validation rules for this level and all lower levels
      const levelsToRun = this.getLevelsToRun(level)

      for (const currentLevel of levelsToRun) {
        const rules = this.validationRules.get(currentLevel)
        if (rules) {
          for (const [ruleName, rule] of rules) {
            try {
              const result = rule(verb, allVerbs)
              if (!result.valid) {
                errors.push({
                  ...result,
                  rule: ruleName,
                  level: currentLevel,
                  type: this.getErrorType(ruleName)
                })
              }
            } catch (error) {
              logger.warn('validateVerb', `Rule ${ruleName} threw error`, error)
              errors.push({
                valid: false,
                error: `Validation rule ${ruleName} failed: ${error.message}`,
                severity: SEVERITY.MEDIUM,
                rule: ruleName,
                level: currentLevel,
                type: ERROR_TYPES.CORRUPTION
              })
            }
          }
        }
      }

      const result = {
        valid: errors.length === 0,
        errors,
        verb: verb.lemma,
        level,
        timestamp: Date.now(),
        checksum: this.calculateChecksum(verb)
      }

      // Cache result
      this.validationCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      })

      // Update metrics
      if (result.valid) {
        this.validationMetrics.passedValidations++
      } else {
        this.validationMetrics.failedValidations++
        this.errorHistory.push(...errors.map(e => ({ ...e, timestamp: Date.now() })))
      }

      this.updateValidationMetrics(startTime)

      return result

    } catch (error) {
      logger.error('validateVerb', 'Critical validation error', error)
      this.validationMetrics.failedValidations++
      return {
        valid: false,
        errors: [{
          error: `Critical validation failure: ${error.message}`,
          severity: SEVERITY.CRITICAL,
          type: ERROR_TYPES.CORRUPTION
        }],
        verb: verb?.lemma || 'unknown',
        level,
        timestamp: Date.now()
      }
    }
  }

  /**
   * Validate array of verbs
   */
  validateVerbs(verbs, level = VALIDATION_LEVELS.STANDARD) {
    if (!Array.isArray(verbs)) {
      return {
        valid: false,
        error: 'Input is not an array',
        severity: SEVERITY.CRITICAL
      }
    }

    const results = []
    const summary = {
      total: verbs.length,
      valid: 0,
      invalid: 0,
      errors: [],
      criticalErrors: 0,
      healable: 0
    }

    for (let i = 0; i < verbs.length; i++) {
      const verb = verbs[i]
      const result = this.validateVerb(verb, level, verbs)

      results.push(result)

      if (result.valid) {
        summary.valid++
      } else {
        summary.invalid++
        summary.errors.push(...result.errors)

        const criticalErrors = result.errors.filter(e => e.severity === SEVERITY.CRITICAL)
        summary.criticalErrors += criticalErrors.length

        const healableErrors = result.errors.filter(e => this.isHealable(e))
        summary.healable += healableErrors.length
      }
    }

    return {
      valid: summary.invalid === 0,
      results,
      summary,
      timestamp: Date.now()
    }
  }

  /**
   * Attempt to heal corrupted verb data
   */
  healVerb(verb, validationResult) {
    if (!validationResult || validationResult.valid) {
      return { healed: false, reason: 'No healing needed' }
    }

    this.validationMetrics.healingAttempts++
    const healingLog = {
      verb: verb.lemma,
      timestamp: Date.now(),
      originalErrors: validationResult.errors.length,
      healingAttempts: []
    }

    let healed = false
    const originalVerb = JSON.parse(JSON.stringify(verb)) // Deep copy for rollback

    try {
      for (const error of validationResult.errors) {
        if (this.isHealable(error)) {
          for (const [strategyName, strategy] of this.healingStrategies) {
            try {
              const attemptResult = strategy(verb, error)
              healingLog.healingAttempts.push({
                strategy: strategyName,
                error: error.error,
                success: attemptResult
              })

              if (attemptResult) {
                healed = true
                logger.info('healVerb', `Successfully healed error with strategy ${strategyName}`, {
                  verb: verb.lemma,
                  error: error.error
                })
                break
              }
            } catch (healingError) {
              logger.warn('healVerb', `Healing strategy ${strategyName} failed`, healingError)
              healingLog.healingAttempts.push({
                strategy: strategyName,
                error: error.error,
                success: false,
                healingError: healingError.message
              })
            }
          }
        }
      }

      if (healed) {
        // Re-validate to confirm healing
        const revalidation = this.validateVerb(verb, VALIDATION_LEVELS.STANDARD)
        if (revalidation.valid || revalidation.errors.length < validationResult.errors.length) {
          this.validationMetrics.successfulHealings++
          healingLog.finalValidation = revalidation
          this.healingHistory.push(healingLog)

          return {
            healed: true,
            originalErrors: validationResult.errors.length,
            remainingErrors: revalidation.errors?.length || 0,
            healingLog
          }
        } else {
          // Healing didn't improve things, rollback
          Object.assign(verb, originalVerb)
          return {
            healed: false,
            reason: 'Healing did not improve validation results',
            healingLog
          }
        }
      }

      return {
        healed: false,
        reason: 'No applicable healing strategies found',
        healingLog
      }

    } catch (error) {
      // Critical error during healing, rollback
      Object.assign(verb, originalVerb)
      logger.error('healVerb', 'Critical error during healing, rolled back', error)
      return {
        healed: false,
        reason: `Critical healing error: ${error.message}`,
        healingLog
      }
    }
  }

  /**
   * Validate and heal array of verbs
   */
  validateAndHealVerbs(verbs, level = VALIDATION_LEVELS.STANDARD) {
    const validationResult = this.validateVerbs(verbs, level)

    if (validationResult.valid) {
      return {
        ...validationResult,
        healingPerformed: false
      }
    }

    const healingResults = []
    let totalHealed = 0

    for (let i = 0; i < verbs.length; i++) {
      const verb = verbs[i]
      const verbValidation = validationResult.results[i]

      if (!verbValidation.valid) {
        const healingResult = this.healVerb(verb, verbValidation)
        healingResults.push(healingResult)

        if (healingResult.healed) {
          totalHealed++
        }
      }
    }

    // Re-validate after healing
    const finalValidation = this.validateVerbs(verbs, level)

    return {
      ...finalValidation,
      healingPerformed: true,
      healingResults,
      totalHealed,
      improvementRatio: totalHealed / validationResult.summary.invalid
    }
  }

  /**
   * Check if error is healable
   */
  isHealable(error) {
    const healablePatterns = [
      'missing person for finite form',
      'Duplicate form detected',
      'Invalid characters in form value'
    ]

    return healablePatterns.some(pattern => error.error.includes(pattern)) ||
           error.severity !== SEVERITY.CRITICAL
  }

  /**
   * Calculate checksum for verb data
   */
  calculateChecksum(verb) {
    const str = JSON.stringify(verb, Object.keys(verb).sort())
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  /**
   * Generate cache key for validation result
   */
  generateCacheKey(verb, level) {
    const checksum = this.calculateChecksum(verb)
    return `${verb.lemma}:${level}:${checksum}`
  }

  /**
   * Get error type based on rule name
   */
  getErrorType(ruleName) {
    if (ruleName.includes('structure')) return ERROR_TYPES.STRUCTURE
    if (ruleName.includes('content')) return ERROR_TYPES.CONTENT
    if (ruleName.includes('linguistic')) return ERROR_TYPES.LINGUISTIC
    if (ruleName.includes('reference')) return ERROR_TYPES.REFERENCE
    return ERROR_TYPES.CORRUPTION
  }

  /**
   * Get validation levels to run
   */
  getLevelsToRun(targetLevel) {
    const levelOrder = [
      VALIDATION_LEVELS.BASIC,
      VALIDATION_LEVELS.STANDARD,
      VALIDATION_LEVELS.COMPREHENSIVE,
      VALIDATION_LEVELS.STRICT
    ]

    const targetIndex = levelOrder.indexOf(targetLevel)
    return levelOrder.slice(0, targetIndex + 1)
  }

  /**
   * Update validation metrics
   */
  updateValidationMetrics(startTime) {
    const responseTime = performance.now() - startTime
    const alpha = 0.1
    this.validationMetrics.averageValidationTime =
      this.validationMetrics.averageValidationTime * (1 - alpha) + responseTime * alpha
  }

  /**
   * Get integrity statistics
   */
  getIntegrityStats() {
    return {
      validationMetrics: { ...this.validationMetrics },
      errorHistory: this.errorHistory.slice(-100), // Last 100 errors
      healingHistory: this.healingHistory.slice(-50), // Last 50 healings
      cacheSize: this.validationCache.size,
      lastValidation: this.lastValidation,
      monitoringActive: this.monitoringActive
    }
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear()
    logger.info('clearCache', 'Validation cache cleared')
  }

  /**
   * Start monitoring mode
   */
  startMonitoring(interval = 60000) { // 1 minute default
    if (this.monitoringActive) {
      return
    }

    this.monitoringActive = true
    this.monitoringInterval = setInterval(() => {
      this.performRoutineValidation()
    }, interval)

    logger.info('startMonitoring', 'Data integrity monitoring started')
  }

  /**
   * Stop monitoring mode
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.monitoringActive = false
    logger.info('stopMonitoring', 'Data integrity monitoring stopped')
  }

  /**
   * Perform routine validation (used by monitoring)
   */
  performRoutineValidation() {
    // This would be called with current verb data
    // Implementation depends on how it integrates with the main system
    logger.debug('performRoutineValidation', 'Routine validation check performed')
    this.lastValidation = new Date()
  }

  /**
   * Export integrity report
   */
  exportIntegrityReport() {
    return {
      timestamp: new Date().toISOString(),
      stats: this.getIntegrityStats(),
      recentErrors: this.errorHistory.slice(-20),
      recentHealings: this.healingHistory.slice(-10),
      recommendations: this.generateRecommendations()
    }
  }

  /**
   * Generate recommendations based on error patterns
   */
  generateRecommendations() {
    const recommendations = []
    const recentErrors = this.errorHistory.slice(-50)

    // Analyze error patterns
    const errorCounts = {}
    recentErrors.forEach(error => {
      errorCounts[error.error] = (errorCounts[error.error] || 0) + 1
    })

    // Generate recommendations based on patterns
    for (const [error, count] of Object.entries(errorCounts)) {
      if (count > 5) {
        recommendations.push({
          type: 'high_frequency_error',
          error,
          frequency: count,
          recommendation: `Consider adding specific validation or healing for: ${error}`
        })
      }
    }

    return recommendations
  }
}

// Global singleton instance
let integrityGuardInstance = null

/**
 * Get or create the global integrity guard instance
 */
export function getIntegrityGuard() {
  if (!integrityGuardInstance) {
    integrityGuardInstance = new DataIntegrityGuard()
  }
  return integrityGuardInstance
}

/**
 * Validate single verb with integrity guard
 */
export function validateVerbIntegrity(verb, level = VALIDATION_LEVELS.STANDARD, allVerbs = null) {
  const guard = getIntegrityGuard()
  return guard.validateVerb(verb, level, allVerbs)
}

/**
 * Validate and heal array of verbs
 */
export function validateAndHealVerbs(verbs, level = VALIDATION_LEVELS.STANDARD) {
  const guard = getIntegrityGuard()
  return guard.validateAndHealVerbs(verbs, level)
}

/**
 * Get integrity statistics
 */
export function getIntegrityStats() {
  const guard = getIntegrityGuard()
  return guard.getIntegrityStats()
}

/**
 * Start integrity monitoring
 */
export function startIntegrityMonitoring(interval) {
  const guard = getIntegrityGuard()
  guard.startMonitoring(interval)
}

/**
 * Stop integrity monitoring
 */
export function stopIntegrityMonitoring() {
  const guard = getIntegrityGuard()
  guard.stopMonitoring()
}

/**
 * Export integrity report
 */
export function exportIntegrityReport() {
  const guard = getIntegrityGuard()
  return guard.exportIntegrityReport()
}

// Export validation levels and constants
export { VALIDATION_LEVELS, ERROR_TYPES, SEVERITY }