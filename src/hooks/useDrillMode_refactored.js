/**
 * useDrillMode.js - Refactored version using modular architecture
 * 
 * This is the main drill mode hook, now refactored to use specialized modules:
 * - Maintains the same API for backward compatibility
 * - Delegates complex logic to specialized modules
 * - Provides clean separation of concerns
 * - Improves testability and maintainability
 */

import { useState } from 'react'
import { useSettings } from '../state/settings.js'

// Import the new specialized hooks
import { useDrillGenerator } from './modules/useDrillGenerator.js'
import { useDrillProgress } from './modules/useDrillProgress.js'
import { useDrillValidation } from './modules/useDrillValidation.js'

// Import remaining functionality that wasn't modularized
import { getMotivationalInsights } from '../lib/progress/personalizedCoaching.js'
import { debugLevelPrioritization } from '../lib/core/prioritizer/index.js'
import { getCurrentFlowState } from '../lib/progress/flowStateDetection.js'
import { createLogger } from '../lib/utils/logger.js'

const logger = createLogger('useDrillMode')

/**
 * Main drill mode hook - refactored to use modular architecture
 * @returns {Object} - Drill mode interface (maintains backward compatibility)
 */
export function useDrillMode() {
  const [currentItem, setCurrentItem] = useState(null)
  const [history, setHistory] = useState({})
  const settings = useSettings()

  // Use the specialized hooks
  const {
    generateNextItem: generateNextItemInternal,
    isGenerationViable,
    getGenerationStats,
    isGenerating
  } = useDrillGenerator()

  const {
    handleResponse,
    handleHintShown,
    getProgressInsights,
    resetProgressStats,
    isProcessing: isProcessingProgress
  } = useDrillProgress()

  const {
    validateItem,
    validateSettings,
    getValidationInsights,
    isValidating
  } = useDrillValidation()

  /**
   * Generate next drill item - maintains original API
   * @param {Object} itemToExclude - Previous item to exclude
   * @param {Array} allFormsForRegion - All available forms for region
   * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
   * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
   * @returns {Promise<void>}
   */
  const generateNextItem = async (
    itemToExclude = null,
    allFormsForRegion,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood
  ) => {
    logger.info('generateNextItem', 'Starting item generation', {
      verbType: settings.verbType,
      selectedFamily: settings.selectedFamily,
      practiceMode: settings.practiceMode,
      specificMood: settings.specificMood,
      specificTense: settings.specificTense,
      level: settings.level,
      itemToExclude: itemToExclude?.lemma,
      dialect: { useVoseo: settings.useVoseo, useVosotros: settings.useVosotros }
    })

    // Use the specialized generator
    const newItem = await generateNextItemInternal(
      itemToExclude,
      allFormsForRegion,
      getAvailableMoodsForLevel,
      getAvailableTensesForLevelAndMood,
      history
    )

    if (newItem) {
      // Validate the generated item
      const validation = validateItem(newItem)
      if (!validation.valid) {
        logger.warn('generateNextItem', 'Generated item failed validation', validation)
        // Item is still set but validation warnings are logged
      }

      setCurrentItem(newItem)
      
      // Show coaching insights periodically (10% chance)
      if (Math.random() < 0.1 && settings.level) {
        try {
          const insights = await getMotivationalInsights(settings.level)
          if (insights.length > 0) {
            logger.info('generateNextItem', 'Coaching insight', insights[0])
          }
        } catch (error) {
          logger.warn('generateNextItem', 'Coaching insights failed', error)
        }
      }
    } else {
      logger.error('generateNextItem', 'Failed to generate item')
    }
  }

  /**
   * Handle drill result - enhanced with comprehensive progress tracking
   * @param {Object} result - Drill result from grader
   * @returns {Promise<void>}
   */
  const handleDrillResult = async (result) => {
    if (!currentItem) {
      logger.warn('handleDrillResult', 'No current item to process result for')
      return
    }

    logger.debug('handleDrillResult', 'Processing drill result', {
      itemId: currentItem.id,
      lemma: currentItem.lemma,
      isCorrect: result.isCorrect,
      hasHints: !!result.hintsUsed
    })

    // Update history for variety tracking
    const key = `${currentItem.lemma}-${currentItem.mood}-${currentItem.tense}`
    setHistory(prev => ({
      ...prev,
      [key]: {
        count: (prev[key]?.count || 0) + 1,
        lastSeen: Date.now(),
        accuracy: result.isCorrect ? 1 : 0
      }
    }))

    // Use the specialized progress handler
    await handleResponse(currentItem, result, (processedResult) => {
      logger.debug('handleDrillResult', 'Progress processing completed', processedResult)
    })
  }

  /**
   * Handle continue action after reviewing result
   * @param {Array} allFormsForRegion - All available forms
   * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
   * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
   * @returns {Promise<void>}
   */
  const handleContinue = async (
    allFormsForRegion,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood
  ) => {
    logger.debug('handleContinue', 'Continuing to next item')
    
    await generateNextItem(
      currentItem,
      allFormsForRegion,
      getAvailableMoodsForLevel,
      getAvailableTensesForLevelAndMood
    )
  }

  /**
   * Clear history and regenerate current item
   * @param {Array|null} [allFormsForRegion=null] - All available forms (optional)
   * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
   * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
   * @returns {Promise<void>}
   */
  const clearHistoryAndRegenerate = async (
    allFormsForRegion = null,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood
  ) => {
    logger.info('clearHistoryAndRegenerate', 'Clearing history and regenerating')
    
    setHistory({})
    resetProgressStats()
    
    await generateNextItem(
      null,
      allFormsForRegion,
      getAvailableMoodsForLevel,
      getAvailableTensesForLevelAndMood
    )
  }

  /**
   * Clear current item to force regeneration
   */
  const clearCurrentItem = () => {
    logger.info('clearCurrentItem', 'Clearing current item to force regeneration')
    setCurrentItem(null)
  }

  /**
   * Get coaching insights for current level
   * @returns {Promise<Array>} - Coaching insights
   */
  const getCoachingInsights = async () => {
    if (!settings.level) {
      return []
    }

    try {
      return await getMotivationalInsights(settings.level)
    } catch (error) {
      logger.warn('getCoachingInsights', 'Failed to get coaching insights', error)
      return []
    }
  }

  /**
   * Debug current level prioritization
   */
  const debugCurrentLevelPrioritization = () => {
    if (settings.level && import.meta.env?.DEV) {
      try {
        debugLevelPrioritization(settings.level)
      } catch (error) {
        logger.warn('debugCurrentLevelPrioritization', 'Level prioritization debug failed', error)
      }
    }
  }

  /**
   * Get comprehensive drill mode status
   * @returns {Object} - Current status and insights
   */
  const getDrillModeStatus = () => {
    const progressInsights = getProgressInsights()
    const validationInsights = getValidationInsights()
    
    return {
      currentItem,
      history,
      settings: {
        practiceMode: settings.practiceMode,
        verbType: settings.verbType,
        level: settings.level,
        region: settings.region
      },
      state: {
        isGenerating,
        isProcessingProgress,
        isValidating,
        hasCurrentItem: !!currentItem
      },
      progress: progressInsights,
      validation: validationInsights,
      viable: currentItem ? true : false // Will be determined by caller
    }
  }

  /**
   * Enhanced item validation with user feedback
   * @returns {Object} - Validation result for current item
   */
  const validateCurrentItem = () => {
    if (!currentItem) {
      return {
        valid: false,
        reason: 'No current item to validate'
      }
    }

    return validateItem(currentItem)
  }

  /**
   * Validate current settings configuration
   * @returns {Object} - Settings validation result
   */
  const validateCurrentSettings = () => {
    return validateSettings()
  }

  // Maintain backward compatibility with original API
  return {
    // Core state
    currentItem,
    history,
    setCurrentItem,
    setHistory,

    // Core functions (maintain original signatures)
    generateNextItem,
    handleDrillResult,
    handleContinue,
    clearHistoryAndRegenerate,
    clearCurrentItem,

    // Level-driven features
    getCoachingInsights,
    debugCurrentLevelPrioritization,

    // Progress intelligence suite
    getCurrentFlowState,
    handleHintShown, // New: exposed from progress module

    // Enhanced functionality
    getDrillModeStatus,
    validateCurrentItem,
    validateCurrentSettings,
    getProgressInsights,
    getValidationInsights,
    getGenerationStats,
    isGenerationViable,

    // Status flags for UI
    isGenerating,
    isProcessingProgress,
    isValidating,

    // Legacy compatibility (these were internal functions but exported)
    // Note: These now delegate to the new modular system
    tryIntelligentFallback: async (settings, eligibleForms, context) => {
      logger.warn('tryIntelligentFallback', 'Legacy function called - consider using new modular API')
      const { tryIntelligentFallback } = await import('./modules/DrillFallbackStrategies.js')
      return tryIntelligentFallback(settings, eligibleForms, context)
    },
    
    fallbackToMixedPractice: async (allForms, settings) => {
      logger.warn('fallbackToMixedPractice', 'Legacy function called - consider using new modular API')
      const { fallbackToMixedPractice } = await import('./modules/DrillFallbackStrategies.js')
      return fallbackToMixedPractice(allForms, settings)
    }
  }
}