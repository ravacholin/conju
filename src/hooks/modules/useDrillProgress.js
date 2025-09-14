/**
 * useDrillProgress.js - Specialized hook for drill progress tracking
 * 
 * This hook provides a clean interface for progress tracking and SRS management:
 * - Response processing with comprehensive error handling
 * - Mastery calculation and tracking
 * - Flow state detection and momentum tracking
 * - Confidence engine integration
 * - Progress analytics and insights
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { validateDrillItemStructure } from './DrillItemGenerator.js'
import { createLogger } from '../../lib/utils/logger.js'
import { onProgressSystemReady, isProgressSystemReady } from '../../lib/progress/index.js'

// Import progress system modules with error handling
let processUserResponse, flowDetector, momentumTracker, confidenceEngine, dynamicGoalsSystem
let recordAttempt, updateMastery, scheduleNextReview

try {
  const progressModule = await import('../../features/drill/useProgressTracking.js')
  processUserResponse = progressModule.processUserResponse
} catch (error) {
  console.warn('Progress tracking module not available:', error)
}

try {
  const flowModule = await import('../../lib/progress/flowStateDetection.js')
  flowDetector = flowModule.flowDetector
} catch (error) {
  console.warn('Flow detection module not available:', error)
}

try {
  const momentumModule = await import('../../lib/progress/momentumTracker.js')
  momentumTracker = momentumModule.momentumTracker
} catch (error) {
  console.warn('Momentum tracking module not available:', error)
}

try {
  const confidenceModule = await import('../../lib/progress/confidenceEngine.js')
  confidenceEngine = confidenceModule.confidenceEngine
} catch (error) {
  console.warn('Confidence engine module not available:', error)
}

try {
  const goalsModule = await import('../../lib/progress/dynamicGoals.js')
  dynamicGoalsSystem = goalsModule.dynamicGoalsSystem
} catch (error) {
  console.warn('Dynamic goals module not available:', error)
}

try {
  const srsModule = await import('../../lib/progress/srs.js')
  recordAttempt = srsModule.recordAttempt
  updateMastery = srsModule.updateMastery
  scheduleNextReview = srsModule.scheduleNextReview
} catch (error) {
  console.warn('SRS system module not available:', error)
}

const logger = createLogger('useDrillProgress')

/**
 * Specialized hook for drill progress tracking
 * @returns {Object} - Progress tracking functions and state
 */
export const useDrillProgress = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const processingRef = useRef(false)
  const [systemReady, setSystemReady] = useState(isProgressSystemReady())
  const [progressStats, setProgressStats] = useState({
    totalAttempts: 0,
    correctAttempts: 0,
    currentStreak: 0,
    accuracyRate: 0
  })
  const [flowState, setFlowState] = useState(null)
  const [momentum, setMomentum] = useState(null)
  const [confidence, setConfidence] = useState(null)

  /**
   * Process a drill response with comprehensive progress tracking
   * @param {Object} item - Current drill item
   * @param {Object} response - User response object
   * @param {Function} onResult - Callback for result handling
   * @returns {Promise<Object>} - Processing result
   */
  const handleResponse = useCallback(async (item, response, onResult) => {
    if (processingRef.current) {
      logger.warn('handleResponse', 'Progress processing already in progress')
      return { success: false, reason: 'Processing in progress' }
    }

    processingRef.current = true
    setIsProcessing(true)

    try {
      // Validate drill item structure
      const itemValidation = validateDrillItemStructure(item)
      if (!itemValidation.valid) {
        logger.error('handleResponse', 'Invalid drill item structure', itemValidation)
        return { success: false, reason: 'Invalid item structure', errors: itemValidation.errors }
      }

      // Check if progress system is ready using event-based state
      const progressSystemAvailable = processUserResponse && systemReady
      if (!progressSystemAvailable) {
        logger.warn('handleResponse', 'Progress system not ready, using graceful degradation mode')
      }

      const userId = progressSystemAvailable ? getCurrentUserId() : 'test-user'
      if (progressSystemAvailable && !userId) {
        logger.warn('handleResponse', 'No user ID available')
        if (onResult) {
          onResult(response)
        }
        return { success: true, reason: 'No user ID - progress not tracked' }
      }

      logger.debug('handleResponse', 'Processing response', {
        userId,
        itemId: item.id,
        lemma: item.lemma,
        mood: item.mood,
        tense: item.tense,
        person: item.person,
        isCorrect: response.isCorrect,
        hasHints: !!response.hintsUsed
      })

      // Process with main progress tracking system
      let progressResult = null
      if (progressSystemAvailable && processUserResponse) {
        try {
          progressResult = await processUserResponse(item, response, {
            userId,
            timestamp: new Date(),
            sessionContext: {
              practiceMode: item.settings?.practiceMode,
              level: item.settings?.level
            }
          })

          logger.debug('handleResponse', 'Progress tracking completed', progressResult)
        } catch (error) {
          logger.error('handleResponse', 'Error in progress tracking', error)
        }
      }

      // Record SRS attempt
      if (progressSystemAvailable && recordAttempt) {
        try {
          await recordAttempt(userId, {
            lemma: item.lemma,
            mood: item.mood,
            tense: item.tense,
            person: item.person
          }, response.isCorrect)
        } catch (error) {
          logger.warn('handleResponse', 'SRS attempt recording failed', error)
        }
      }

      // Update mastery if needed
      if (progressSystemAvailable && updateMastery && response.isCorrect) {
        try {
          await updateMastery(userId, {
            lemma: item.lemma,
            mood: item.mood,
            tense: item.tense,
            person: item.person
          }, response.responseTime || 0)
        } catch (error) {
          logger.warn('handleResponse', 'Mastery update failed', error)
        }
      }

      // Schedule next review
      if (progressSystemAvailable && scheduleNextReview) {
        try {
          await scheduleNextReview(userId, {
            lemma: item.lemma,
            mood: item.mood,
            tense: item.tense,
            person: item.person
          }, response.isCorrect)
        } catch (error) {
          logger.warn('handleResponse', 'Next review scheduling failed', error)
        }
      }

      // Process flow state
      if (progressSystemAvailable && flowDetector) {
        try {
          const newFlowState = await flowDetector.processResponse(response, {
            item,
            userId,
            timestamp: new Date()
          })
          setFlowState(newFlowState)
        } catch (error) {
          logger.warn('handleResponse', 'Flow state processing failed', error)
        }
      }

      // Process momentum
      if (progressSystemAvailable && momentumTracker) {
        try {
          const newMomentum = await momentumTracker.processResponse(response, {
            item,
            userId,
            timestamp: new Date()
          })
          setMomentum(newMomentum)
        } catch (error) {
          logger.warn('handleResponse', 'Momentum tracking failed', error)
        }
      }

      // Process confidence
      if (progressSystemAvailable && confidenceEngine) {
        try {
          const newConfidence = await confidenceEngine.processResponse(response, {
            item,
            userId,
            timestamp: new Date()
          })
          setConfidence(newConfidence)
        } catch (error) {
          logger.warn('handleResponse', 'Confidence tracking failed', error)
        }
      }

      // Process dynamic goals
      if (progressSystemAvailable && dynamicGoalsSystem) {
        try {
          await dynamicGoalsSystem.processResponse(response, {
            item,
            userId,
            timestamp: new Date()
          })
        } catch (error) {
          logger.warn('handleResponse', 'Dynamic goals processing failed', error)
        }
      }

      // Update local progress stats
      let updatedStats = null
      setProgressStats(prev => {
        const newStats = {
          totalAttempts: prev.totalAttempts + 1,
          correctAttempts: prev.correctAttempts + (response.isCorrect ? 1 : 0),
          currentStreak: response.isCorrect ? prev.currentStreak + 1 : 0,
          accuracyRate: 0
        }
        newStats.accuracyRate = newStats.totalAttempts > 0
          ? Math.round((newStats.correctAttempts / newStats.totalAttempts) * 100)
          : 0

        updatedStats = newStats
        return newStats
      })

      // Call result handler
      if (onResult) {
        onResult(response)
      }

      return {
        success: true,
        progressResult,
        flowState,
        momentum,
        confidence,
        stats: updatedStats,
        reason: !progressSystemAvailable ? 'Graceful degradation - progress system not ready' : undefined
      }

    } catch (error) {
      logger.error('handleResponse', 'Unexpected error during response processing', error)
      
      // Ensure onResult is still called for UI consistency
      if (onResult) {
        onResult(response)
      }
      
      return { success: false, reason: 'Unexpected error', error }
    } finally {
      processingRef.current = false
      setIsProcessing(false)
    }
  }, [isProcessing, progressStats])

  /**
   * Handle hint usage tracking
   * @param {Object} item - Current drill item
   * @param {string} hintType - Type of hint used
   * @returns {Promise<void>}
   */
  const handleHintShown = useCallback(async (item, hintType = 'generic') => {
    try {
      const userId = getCurrentUserId()
      if (!userId || !processUserResponse || !systemReady) {
        logger.debug('handleHintShown', 'Progress system not available for hint tracking')
        return
      }

      logger.debug('handleHintShown', 'Recording hint usage', {
        userId,
        itemId: item.id,
        lemma: item.lemma,
        hintType
      })

      // Record hint usage in progress system
      if (processUserResponse) {
        await processUserResponse(item, {
          type: 'hint_shown',
          hintType,
          timestamp: new Date()
        }, {
          userId,
          sessionContext: {
            practiceMode: item.settings?.practiceMode,
            level: item.settings?.level
          }
        })
      }

    } catch (error) {
      logger.warn('handleHintShown', 'Error recording hint usage', error)
    }
  }, [])

  /**
   * Get current progress insights
   * @returns {Object} - Progress insights and analytics
   */
  const getProgressInsights = useCallback(() => {
    return {
      stats: progressStats,
      flowState,
      momentum,
      confidence,
      isSystemReady: systemReady && !!processUserResponse,
      userId: getCurrentUserId(),
      insights: {
        needsMorePractice: progressStats.accuracyRate < 70,
        isOnStreak: progressStats.currentStreak >= 5,
        isFlowing: flowState?.state === 'flow',
        hasMomentum: momentum?.level === 'high',
        isConfident: confidence?.level === 'high'
      }
    }
  }, [progressStats, flowState, momentum, confidence, systemReady])

  /**
   * Reset progress stats (for new sessions)
   */
  const resetProgressStats = useCallback(() => {
    setProgressStats({
      totalAttempts: 0,
      correctAttempts: 0,
      currentStreak: 0,
      accuracyRate: 0
    })
    setFlowState(null)
    setMomentum(null)
    setConfidence(null)
  }, [])

  // Subscribe to progress system readiness events
  useEffect(() => {
    // Set initial state
    const initialReady = isProgressSystemReady()
    setSystemReady(initialReady)
    
    if (initialReady && processUserResponse) {
      logger.debug('useDrillProgress', 'Progress system is ready')
    } else {
      logger.debug('useDrillProgress', 'Progress system not ready, will operate in graceful degradation mode')
    }

    // Subscribe to system ready events
    const unsubscribe = onProgressSystemReady((isReady) => {
      setSystemReady(isReady)
      if (isReady && processUserResponse) {
        logger.debug('useDrillProgress', 'Progress system became ready')
      }
    })

    return unsubscribe
  }, [])

  return {
    handleResponse,
    handleHintShown,
    getProgressInsights,
    resetProgressStats,
    isProcessing,
    progressStats,
    flowState,
    momentum,
    confidence,
    isSystemReady: systemReady && !!processUserResponse
  }
}