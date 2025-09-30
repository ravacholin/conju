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
import { debugLevelPrioritization } from '../lib/core/levelDrivenPrioritizer.js'
import { getCurrentFlowState } from '../lib/progress/flowStateDetection.js'
import { createLogger } from '../lib/utils/logger.js'
import { sessionManager } from '../lib/progress/sessionManager.js'

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
   * Handle session-based item generation
   * @param {Object} itemToExclude - Previous item to exclude
   * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
   * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
   * @returns {Promise<void>}
   */
  const handleSessionGeneration = async (
    itemToExclude,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood
  ) => {
    // Initialize session if needed
    if (!sessionManager.hasActiveSession() && settings.currentSession) {
      sessionManager.startSession(settings.currentSession)
    }

    const currentActivity = sessionManager.getCurrentActivity()

    if (!currentActivity) {
      logger.info('handleSessionGeneration', 'No current activity, session may be completed')
      // Session completed or no session - fallback to normal generation
      settings.set({ practiceMode: 'mixed' })
      return await generateNormalItem(itemToExclude, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
    }

    logger.info('handleSessionGeneration', 'Generating item for session activity', {
      activityType: currentActivity.type,
      activityTitle: currentActivity.title,
      targetCombination: currentActivity.targetCombination
    })

    // Configure settings based on current activity
    const activitySettings = {
      verbType: settings.verbType || 'all',
      selectedFamily: settings.selectedFamily,
      level: settings.level,
      useVoseo: settings.useVoseo,
      useVosotros: settings.useVosotros
    }

    // Set specific practice mode based on activity
    if (currentActivity.targetCombination) {
      activitySettings.practiceMode = 'specific'
      activitySettings.specificMood = currentActivity.targetCombination.mood
      activitySettings.specificTense = currentActivity.targetCombination.tense
    } else {
      // For non-specific activities, use mixed mode with activity focus
      activitySettings.practiceMode = 'mixed'

      // Apply activity-specific filters
      if (currentActivity.type === 'weak_area_practice') {
        // Focus on areas with lower mastery
        activitySettings.verbType = 'irregular' // Tend to be more challenging
      } else if (currentActivity.type === 'spaced_review') {
        // Focus on review items
        activitySettings.practiceMode = 'review'
      } else if (currentActivity.type === 'new_content') {
        // Focus on appropriate level content
        activitySettings.verbType = 'regular' // Start with regular verbs for new content
      }
    }

    // Temporarily apply activity settings
    const originalSettings = { ...settings }
    settings.set(activitySettings)

    try {
      // Generate item with activity-specific settings
      const newItem = await generateNextItemInternal(
        itemToExclude,
        getAvailableMoodsForLevel,
        getAvailableTensesForLevelAndMood,
        history
      )

      if (newItem) {
        const validation = validateItem(newItem)
        if (!validation.valid) {
          logger.warn('handleSessionGeneration', 'Generated session item failed validation', validation)
        }

        setCurrentItem(newItem)
        logger.info('handleSessionGeneration', 'Session item generated successfully', {
          lemma: newItem.lemma,
          mood: newItem.mood,
          tense: newItem.tense,
          activityType: currentActivity.type
        })
      } else {
        logger.error('handleSessionGeneration', 'Failed to generate session item')
      }
    } finally {
      // Restore original settings (except practiceMode)
      settings.set({ ...originalSettings, practiceMode: 'personalized_session' })
    }
  }

  /**
   * Generate normal (non-session) item - extracted for reuse
   */
  const generateNormalItem = async (itemToExclude, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood) => {
    logger.info('generateNormalItem', 'Starting normal item generation', {
      verbType: settings.verbType,
      selectedFamily: settings.selectedFamily,
      practiceMode: settings.practiceMode,
      specificMood: settings.specificMood,
      specificTense: settings.specificTense,
      level: settings.level,
      itemToExclude: itemToExclude?.lemma,
      dialect: { useVoseo: settings.useVoseo, useVosotros: settings.useVosotros }
    })

    const newItem = await generateNextItemInternal(
      itemToExclude,
      getAvailableMoodsForLevel,
      getAvailableTensesForLevelAndMood,
      history
    )

    if (newItem) {
      const validation = validateItem(newItem)
      if (!validation.valid) {
        logger.warn('generateNormalItem', 'Generated item failed validation', validation)
      }

      setCurrentItem(newItem)

      // Show coaching insights periodically (10% chance)
      if (Math.random() < 0.1 && settings.level) {
        try {
          const insights = await getMotivationalInsights(settings.level)
          if (insights.length > 0) {
            logger.info('generateNormalItem', 'Coaching insight', insights[0])
          }
        } catch (error) {
          logger.warn('generateNormalItem', 'Coaching insights failed', error)
        }
      }
    } else {
      logger.error('generateNormalItem', 'Failed to generate item')
    }
  }

  /**
   * Generate next drill item - updated to use dynamic forms generation
   * @param {Object} itemToExclude - Previous item to exclude
   * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
   * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
   * @returns {Promise<void>}
   */
  const generateNextItem = async (
    itemToExclude = null,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood
  ) => {
    // Handle personalized session mode
    if (settings.practiceMode === 'personalized_session') {
      return await handleSessionGeneration(
        itemToExclude,
        getAvailableMoodsForLevel,
        getAvailableTensesForLevelAndMood
      )
    }

    // Default to normal generation
    return await generateNormalItem(itemToExclude, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
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

    // Normalize result format: grader produces result.correct, but progress system expects result.isCorrect
    // Priority: preserve existing isCorrect if present, otherwise use correct
    const normalizedResult = {
      ...result,
      isCorrect: result.isCorrect !== undefined ? result.isCorrect : result.correct
    }

    logger.debug('handleDrillResult', 'Processing drill result', {
      itemId: currentItem.id,
      lemma: currentItem.lemma,
      isCorrect: normalizedResult.isCorrect,
      hasHints: !!normalizedResult.hintsUsed
    })

    // Update history for variety tracking
    const key = `${currentItem.lemma}-${currentItem.mood}-${currentItem.tense}`
    setHistory(prev => ({
      ...prev,
      [key]: {
        count: (prev[key]?.count || 0) + 1,
        lastSeen: Date.now(),
        accuracy: normalizedResult.isCorrect ? 1 : 0
      }
    }))

    // Track session progress if in session mode
    if (settings.practiceMode === 'personalized_session' && sessionManager.hasActiveSession()) {
      sessionManager.recordItemResult(normalizedResult)

      // Check if should advance to next activity
      if (sessionManager.shouldAutoAdvance() || sessionManager.shouldConsiderAdvancing()) {
        const nextActivity = sessionManager.nextActivity()
        logger.info('handleDrillResult', 'Session activity advanced', {
          hasNext: !!nextActivity,
          nextActivityType: nextActivity?.type
        })

        if (!nextActivity) {
          // Session completed
          const finalMetrics = sessionManager.endSession()
          logger.info('handleDrillResult', 'Session completed', finalMetrics)

          // Reset to normal mode
          settings.set({
            practiceMode: 'mixed',
            currentSession: null,
            currentActivityIndex: 0,
            sessionStartTime: null
          })
        }
      }
    }

    // Use the specialized progress handler with normalized result
    await handleResponse(currentItem, normalizedResult, (processedResult) => {
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
    _allFormsForRegion,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood
  ) => {
    logger.debug('handleContinue', 'Continuing to next item')
    
    // Correct argument order: (itemToExclude, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
    await generateNextItem(currentItem, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
  }

  /**
   * Clear history and regenerate current item
   * @param {Array} allFormsForRegion - All available forms
   * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
   * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
   * @returns {Promise<void>}
   */
  const clearHistoryAndRegenerate = async (
    _allFormsForRegion,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood
  ) => {
    logger.info('clearHistoryAndRegenerate', 'Clearing history and regenerating')
    
    setHistory({})
    resetProgressStats()
    
    await generateNextItem(null, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
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

    // Session management functions
    getCurrentSessionProgress: () => sessionManager.getSessionProgress(),
    hasActiveSession: () => sessionManager.hasActiveSession(),
    endCurrentSession: () => sessionManager.endSession(),

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
