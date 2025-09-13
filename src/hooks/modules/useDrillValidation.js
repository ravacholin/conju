/**
 * useDrillValidation.js - Specialized hook for drill validation and integrity checks
 * 
 * This hook provides a clean interface for validation operations:
 * - Real-time validation of drill items and responses
 * - Integrity monitoring and reporting
 * - Configuration validation
 * - Error detection and logging
 * - Performance monitoring for validation operations
 */

import { useState, useCallback, useEffect } from 'react'
import { useSettings } from '../../state/settings.js'
import {
  validateEligibleForms as VALIDATE_ELIGIBLE_FORMS,
  performIntegrityGuard,
  validateSpecificPracticeConfig,
  validateFinalFormSelection as VALIDATE_FINAL_FORM_SELECTION,
  validateVerbTypeFiltering,
  validateDrillItem
} from './DrillValidationSystem.js'
import {
  passesIntegrityChecks as PASSES_INTEGRITY_CHECKS,
  getFilteringStats
} from './DrillFormFilters.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('useDrillValidation')

/**
 * Specialized hook for drill validation and integrity checks
 * @returns {Object} - Validation functions and state
 */
export const useDrillValidation = () => {
  const settings = useSettings()
  const [validationHistory, setValidationHistory] = useState([])
  const [integrityStats, setIntegrityStats] = useState({
    totalChecks: 0,
    failedChecks: 0,
    successRate: 100
  })
  const [isValidating, setIsValidating] = useState(false)

  /**
   * Validate drill item comprehensively
   * @param {Object} item - Drill item to validate
   * @returns {Object} - Comprehensive validation result
   */
  const validateItem = useCallback((item) => {
    if (isValidating) {
      logger.warn('validateItem', 'Validation already in progress')
      return { valid: false, reason: 'Validation in progress' }
    }

    setIsValidating(true)

    try {
      logger.debug('validateItem', 'Starting comprehensive item validation', {
        itemId: item?.id,
        lemma: item?.lemma
      })

      // Basic structure validation
      const structureValidation = validateDrillItem(item)
      
      if (!structureValidation.valid) {
        logger.warn('validateItem', 'Item structure validation failed', structureValidation)
        return {
          valid: false,
          reason: 'Structure validation failed',
          details: structureValidation,
          timestamp: new Date().toISOString()
        }
      }

      // Integrity checks
      const specificConstraints = {
        isSpecific: (settings.practiceMode === 'specific' || settings.practiceMode === 'theme') && 
                    settings.specificMood && settings.specificTense,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense
      }

      const integrityResult = performIntegrityGuard(item, settings, specificConstraints, 'validation')
      
      if (!integrityResult.success) {
        logger.warn('validateItem', 'Integrity validation failed', integrityResult)
        
        // Update integrity stats
        setIntegrityStats(prev => {
          const newStats = {
            totalChecks: prev.totalChecks + 1,
            failedChecks: prev.failedChecks + 1,
            successRate: 0
          }
          newStats.successRate = Math.round(((newStats.totalChecks - newStats.failedChecks) / newStats.totalChecks) * 100)
          return newStats
        })

        return {
          valid: false,
          reason: 'Integrity checks failed',
          details: integrityResult,
          timestamp: new Date().toISOString()
        }
      }

      // Update integrity stats (success)
      setIntegrityStats(prev => {
        const newStats = {
          totalChecks: prev.totalChecks + 1,
          failedChecks: prev.failedChecks,
          successRate: 0
        }
        newStats.successRate = Math.round(((newStats.totalChecks - newStats.failedChecks) / newStats.totalChecks) * 100)
        return newStats
      })

      logger.debug('validateItem', 'Item validation passed', {
        itemId: item.id,
        lemma: item.lemma
      })

      return {
        valid: true,
        reason: 'All validations passed',
        details: {
          structure: structureValidation,
          integrity: integrityResult
        },
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      logger.error('validateItem', 'Error during item validation', error)
      return {
        valid: false,
        reason: 'Validation error',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    } finally {
      setIsValidating(false)
    }
  }, [settings, isValidating])

  /**
   * Validate current settings configuration
   * @returns {Object} - Settings validation result
   */
  const validateSettings = useCallback(() => {
    logger.debug('validateSettings', 'Validating current settings configuration')

    const validations = []

    // Validate specific practice configuration
    const specificValidation = validateSpecificPracticeConfig(settings)
    validations.push({
      type: 'specific_practice',
      ...specificValidation
    })

    // Validate dialect consistency
    const dialectValidation = validateDialectSettings(settings)
    validations.push({
      type: 'dialect',
      ...dialectValidation
    })

    // Validate level configuration
    const levelValidation = validateLevelSettings(settings)
    validations.push({
      type: 'level',
      ...levelValidation
    })

    const overallValid = validations.every(v => v.valid)

    return {
      valid: overallValid,
      validations,
      summary: {
        total: validations.length,
        passed: validations.filter(v => v.valid).length,
        failed: validations.filter(v => !v.valid).length
      },
      timestamp: new Date().toISOString()
    }
  }, [settings])

  /**
   * Validate forms filtering results
   * @param {Array} originalForms - Original forms before filtering
   * @param {Array} filteredForms - Forms after filtering
   * @returns {Object} - Filtering validation result
   */
  const validateFiltering = useCallback((originalForms, filteredForms) => {
    logger.debug('validateFiltering', 'Validating filtering results', {
      original: originalForms.length,
      filtered: filteredForms.length
    })

    // Check for excessive filtering
    const reductionPercent = originalForms.length > 0 
      ? Math.round(((originalForms.length - filteredForms.length) / originalForms.length) * 100)
      : 0

    const stats = getFilteringStats(originalForms, filteredForms, settings)
    
    // Validate verb type filtering if applicable
    let verbTypeValidation = null
    if (settings.verbType && settings.verbType !== 'all') {
      verbTypeValidation = validateVerbTypeFiltering(originalForms, filteredForms, settings.verbType)
    }

    const warnings = []
    const errors = []

    // Check for concerning patterns
    if (filteredForms.length === 0) {
      errors.push('Filtering removed all available forms')
    } else if (reductionPercent > 90) {
      warnings.push(`Excessive filtering: ${reductionPercent}% of forms removed`)
    } else if (reductionPercent > 75) {
      warnings.push(`High filtering: ${reductionPercent}% of forms removed`)
    }

    return {
      valid: errors.length === 0,
      stats,
      verbTypeValidation,
      warnings,
      errors,
      reductionPercent,
      timestamp: new Date().toISOString()
    }
  }, [settings])

  /**
   * Monitor integrity over time
   * @param {Object} validationResult - Latest validation result
   */
  const recordValidation = useCallback((validationResult) => {
    setValidationHistory(prev => {
      const newHistory = [...prev, validationResult].slice(-100) // Keep last 100
      return newHistory
    })
  }, [])

  /**
   * Get validation insights and trends
   * @returns {Object} - Validation insights
   */
  const getValidationInsights = useCallback(() => {
    const recentValidations = validationHistory.slice(-20) // Last 20 validations
    const recentFailures = recentValidations.filter(v => !v.valid).length
    const recentSuccessRate = recentValidations.length > 0 
      ? Math.round(((recentValidations.length - recentFailures) / recentValidations.length) * 100)
      : 100

    return {
      integrityStats,
      recentSuccessRate,
      totalValidations: validationHistory.length,
      recentFailures,
      trends: {
        improving: recentSuccessRate > integrityStats.successRate,
        stable: Math.abs(recentSuccessRate - integrityStats.successRate) <= 5,
        declining: recentSuccessRate < integrityStats.successRate - 5
      },
      lastValidation: validationHistory[validationHistory.length - 1] || null
    }
  }, [validationHistory, integrityStats])

  /**
   * Reset validation statistics
   */
  const resetValidationStats = useCallback(() => {
    setValidationHistory([])
    setIntegrityStats({
      totalChecks: 0,
      failedChecks: 0,
      successRate: 100
    })
  }, [])

  // Helper validation functions
  const validateDialectSettings = (settings) => {
    const { region, useVoseo, useTuteo, useVosotros } = settings

    const errors = []
    const warnings = []

    // Check for dialect conflicts
    if (region === 'rioplatense' && useTuteo) {
      warnings.push('Tuteo enabled in Rioplatense region (uses voseo)')
    }
    if (region === 'rioplatense' && useVosotros) {
      warnings.push('Vosotros enabled in Rioplatense region (not commonly used)')
    }
    if (region === 'peninsular' && useVoseo) {
      warnings.push('Voseo enabled in Peninsular region (uses tuteo)')
    }
    if (region === 'la_general' && (useVoseo || useVosotros)) {
      warnings.push('Regional dialect options enabled in Latin American General')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      details: { region, useVoseo, useTuteo, useVosotros }
    }
  }

  const validateLevelSettings = (settings) => {
    const { level, practiceMode } = settings
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'ALL']

    const errors = []
    const warnings = []

    if (level && !validLevels.includes(level)) {
      errors.push(`Invalid level: ${level}`)
    }

    if (practiceMode === 'theme' && !level) {
      warnings.push('Theme practice without level setting may be too broad')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      details: { level, practiceMode }
    }
  }

  // Auto-record validation results
  useEffect(() => {
    const interval = setInterval(() => {
      if (validationHistory.length > 0) {
        const insights = getValidationInsights()
        logger.debug('useDrillValidation', 'Validation insights', insights)
      }
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [validationHistory, getValidationInsights])

  return {
    validateItem,
    validateSettings,
    validateFiltering,
    recordValidation,
    getValidationInsights,
    resetValidationStats,
    isValidating,
    integrityStats,
    validationHistory: validationHistory.slice(-10) // Return last 10 for UI
  }
}

export default useDrillValidation