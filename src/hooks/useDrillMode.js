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
import { useShallow } from 'zustand/react/shallow'
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
import { sessionManager } from '../lib/progress/sessionManager.js'

const logger = createLogger('useDrillMode')

/**
 * Main drill mode hook - refactored to use modular architecture
 * @returns {Object} - Drill mode interface (maintains backward compatibility)
 */
export function useDrillMode() {
  const [currentItem, setCurrentItem] = useState(null)
  const [history, setHistory] = useState({})
  const settings = useSettings(
    useShallow((state) => ({
      set: state.set,
      currentSession: state.currentSession,
      verbType: state.verbType,
      selectedFamily: state.selectedFamily,
      level: state.level,
      useVoseo: state.useVoseo,
      useVosotros: state.useVosotros,
      practiceMode: state.practiceMode,
      specificMood: state.specificMood,
      specificTense: state.specificTense,
      region: state.region
    }))
  )

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
      // Session completed - fallback to normal generation WITHOUT changing practiceMode
      // This preserves specific practice settings from progress navigation
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
    const { set: setSettings, ...originalSettings } = settings
    setSettings(activitySettings)

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
      setSettings({ ...originalSettings, practiceMode: 'personalized_session' })
    }
  }

  /**
   * Generate normal (non-session) item - extracted for reuse
   * Enhanced with timeout and defensive validation
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

    let newItem = null

    try {
      // Add timeout to prevent hanging (and clear it when done)
      let timeoutId = null
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Item generation timeout after 5 seconds')),
          5000
        )
      })

      const generationPromise = generateNextItemInternal(
        itemToExclude,
        getAvailableMoodsForLevel,
        getAvailableTensesForLevelAndMood,
        history
      )

      try {
        newItem = await Promise.race([generationPromise, timeoutPromise])
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
      }
    } catch (error) {
      logger.error('generateNormalItem', 'Generation failed or timed out', error)

      // Create emergency fallback when generation fails completely
      newItem = await createEmergencyFallbackItem(settings)
      logger.warn('generateNormalItem', 'Using emergency fallback due to generation failure')
    }

    // DEFENSIVE VALIDATION: Ensure we always have a valid item
    // Note: drill items have structure { lemma, mood, tense, person, form: { value, ... } }
    if (!newItem || typeof newItem !== 'object' || !newItem.lemma || !newItem.form?.value) {
      logger.error('generateNormalItem', 'Invalid item generated, using emergency fallback', newItem)
      newItem = await createEmergencyFallbackItem(settings)
    }

    // Validate the item
    const validation = validateItem(newItem)
    if (!validation.valid) {
      logger.warn('generateNormalItem', 'Generated item failed validation', validation)
      // Continue anyway - better to have an imperfect item than no item
    }

    setCurrentItem(newItem)
    logger.info('generateNormalItem', 'Item generation completed', {
      lemma: newItem.lemma,
      mood: newItem.mood,
      tense: newItem.tense,
      isEmergency: newItem.isEmergencyFallback
    })

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
   * @param {Array|null} [_allFormsForRegion=null] - All available forms (deprecated; kept for compatibility)
   * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
   * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
   * @returns {Promise<void>}
   */
  const clearHistoryAndRegenerate = async (
    _allFormsForRegion = null,
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

/**
 * Creates an emergency fallback item for useDrillMode by searching for real forms
 * This is used when the generator completely fails
 * IMPORTANT: Respects regional filtering to ensure correct person forms
 */
async function createEmergencyFallbackItem(settings = {}) {
  console.log('🔍 useDrillMode: REAL FALLBACK - Looking for actual forms for:', settings.specificMood, settings.specificTense, 'region:', settings.region)

  try {
    // Import regional filtering function
    const { getAllowedPersonsForRegion } = await import('../lib/core/curriculumGate.js')
    const allowedPersons = getAllowedPersonsForRegion(settings.region || 'la_general')

    console.log('🌍 Emergency fallback: filtering by region', settings.region, 'allowed persons:', Array.from(allowedPersons))

    // Import the main verb database
    const { getVerbs } = await import('../data/verbsLazy.js')
    const allVerbs = await getVerbs()

    // Try to find forms matching the requested mood/tense AND regional constraints
    let targetForms = []

    if (settings.specificMood && settings.specificTense) {
      // Search for the specific mood/tense combination
      for (const verb of allVerbs) {
        for (const paradigm of verb.paradigms || []) {
          for (const form of paradigm.forms || []) {
            if (form.mood === settings.specificMood && form.tense === settings.specificTense) {
              // CRITICAL FIX: Only include forms with persons allowed for this region
              // For nonfinite forms (infinitive, gerund, participle), person filtering doesn't apply
              if (form.mood === 'nonfinite' || allowedPersons.has(form.person)) {
                targetForms.push({
                  ...form,
                  lemma: verb.lemma,
                  id: verb.id,
                  type: verb.type || 'regular'
                })
              }
            }
          }
        }
      }
    }

    // If no forms found for specific mood/tense, try just mood
    if (targetForms.length === 0 && settings.specificMood) {
      for (const verb of allVerbs) {
        for (const paradigm of verb.paradigms || []) {
          for (const form of paradigm.forms || []) {
            if (form.mood === settings.specificMood) {
              // CRITICAL FIX: Only include forms with persons allowed for this region
              if (form.mood === 'nonfinite' || allowedPersons.has(form.person)) {
                targetForms.push({
                  ...form,
                  lemma: verb.lemma,
                  id: verb.id,
                  type: verb.type || 'regular'
                })
              }
            }
          }
        }
      }
    }

    // If still no forms, get any available form (but still respecting regional constraints!)
    if (targetForms.length === 0) {
      for (const verb of allVerbs.slice(0, 5)) { // Just check first 5 verbs
        for (const paradigm of verb.paradigms || []) {
          for (const form of paradigm.forms || []) {
            if (form.value && form.mood && form.tense) {
              // CRITICAL FIX: Only include forms with persons allowed for this region
              if (form.mood === 'nonfinite' || allowedPersons.has(form.person)) {
                targetForms.push({
                  ...form,
                  lemma: verb.lemma,
                  id: verb.id,
                  type: verb.type || 'regular'
                })
              }
            }
          }
        }
      }
    }

    if (targetForms.length > 0) {
      const selectedForm = targetForms[Math.floor(Math.random() * targetForms.length)]
      const emergencyItem = {
        id: `drill_emergency_${Date.now()}`,
        lemma: selectedForm.lemma,
        mood: selectedForm.mood,
        tense: selectedForm.tense,
        person: selectedForm.person,
        value: selectedForm.value,
        type: selectedForm.type,
        isEmergencyFallback: false, // This is NOT emergency, it's REAL
        prompt: `Conjugar ${selectedForm.lemma} en ${selectedForm.mood} ${selectedForm.tense}`,
        answer: selectedForm.value,
        selectionMethod: 'drill_real_fallback'
      }

      console.log('✅ useDrillMode: REAL fallback found:', selectedForm.lemma, selectedForm.mood, selectedForm.tense)
      return emergencyItem
    }
  } catch (error) {
    console.error('❌ useDrillMode: Error searching for real forms:', error)
  }

  // Only if absolutely everything fails, use minimal fallback
  const emergencyItem = {
    id: `drill_emergency_${Date.now()}`,
    lemma: 'ser',
    mood: 'indicative',
    tense: 'pres',
    person: '1s',
    value: 'soy',
    type: 'irregular',
    isEmergencyFallback: true,
    prompt: 'Conjugar ser en primera persona singular',
    answer: 'soy',
    selectionMethod: 'drill_absolute_fallback'
  }

  console.log('🆘 useDrillMode: Absolute fallback used')
  return emergencyItem
}
