/**
 * useDrillGenerator.js - Specialized hook for drill item generation
 * 
 * This hook provides a clean interface for generating drill items by orchestrating
 * the various modules:
 * - Form filtering based on user settings and constraints
 * - Selection algorithm coordination (SRS, adaptive, standard)
 * - Item generation with proper structure
 * - Fallback strategies when generation fails
 * - Double mode support
 */

import { useState, useCallback, useRef } from 'react'
import { useSettings } from '../../state/settings.js'
import { getDueItems } from '../../lib/progress/srs.js'
import { gateDueItemsByCurriculum } from '../../lib/core/curriculumGate.js'
import { getCurrentUserId } from '../../lib/progress/userManager/index.js'
import { chooseNext } from '../../lib/core/generator.js'
import { varietyEngine } from '../../lib/core/advancedVarietyEngine.js'
import { getNextRecommendedItem } from '../../lib/progress/AdaptivePracticeEngine.js'
import {
  filterForSpecificPractice as FILTER_FOR_SPECIFIC_PRACTICE,
  filterByVerbType,
  applyComprehensiveFiltering,
  filterDueForSpecific,
  matchesSpecific as MATCHES_SPECIFIC,
  allowsPerson as ALLOWS_PERSON,
  allowsLevel as ALLOWS_LEVEL,
  generateAllFormsForRegion,
  getFormsCacheKey
} from './DrillFormFilters.js'
import {
  validateEligibleForms,
  performIntegrityGuard,
  validateSpecificPracticeConfig
} from './DrillValidationSystem.js'
import {
  tryIntelligentFallback,
  fallbackToMixedPractice
} from './DrillFallbackStrategies.js'
import { generateDrillItem } from './DrillItemGenerator.js'
import {
  generateDoubleModeItem,
  isDoubleModeViable
} from './DoubleModeManager.js'
import { resolveFormsPool } from './formsPoolService.js'
import {
  getReviewSessionContext,
  buildSpecificConstraints,
  applyReviewSessionFilter,
  selectDueCandidate
} from './specificConstraints.js'
import { selectNextForm } from './hierarchicalSelection.js'
import { buildEligibleFormsKey, shouldCacheEligibleForms } from './drillCacheKey.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('useDrillGenerator')

/**
 * Specialized hook for drill item generation
 * @returns {Object} - Generator functions and state
 */
export const useDrillGenerator = () => {
  const settings = useSettings()
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGeneratedItem, setLastGeneratedItem] = useState(null)
  const formsPoolRef = useRef({ signature: null, forms: null })
  const eligibleFormsCacheRef = useRef({ key: null, forms: null })

  const getNow = useCallback(() => {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now()
    }
    return Date.now()
  }, [])

  const resolveFormsForStats = useCallback(async (targetSettings) => {
    const poolResult = await resolveFormsPool({
      settings: targetSettings,
      region: targetSettings.region || 'la_general',
      cache: formsPoolRef.current,
      generateAllFormsForRegion,
      getFormsCacheKey,
      now: getNow
    })

    formsPoolRef.current = poolResult.cache
    return poolResult.forms || []
  }, [getNow])

  /**
   * Generate next drill item using comprehensive selection algorithms
   * @param {Object} itemToExclude - Previous item to exclude from selection
   * @param {Function} getAvailableMoodsForLevel - Function to get moods for level
   * @param {Function} getAvailableTensesForLevelAndMood - Function to get tenses for level/mood
   * @param {Array} history - Generation history for variety
   * @returns {Object|null} - Generated drill item or null if failed
   */
  const generateNextItem = useCallback(async (
    itemToExclude = null,
    getAvailableMoodsForLevel,
    getAvailableTensesForLevelAndMood,
    history = {}
  ) => {
    if (isGenerating) {
      logger.warn('generateNextItem', 'Generation already in progress')
      return null
    }

    // CRITICAL FIX: Read fresh settings directly from store to avoid stale closures
    const FRESH_SETTINGS = useSettings.getState()

    const { reviewSessionType, reviewSessionFilter } = getReviewSessionContext(FRESH_SETTINGS)

    setIsGenerating(true)

    try {
      logger.info('generateNextItem', 'Starting item generation', {
        verbType: FRESH_SETTINGS.verbType,
        selectedFamily: FRESH_SETTINGS.selectedFamily,
        practiceMode: FRESH_SETTINGS.practiceMode,
        specificMood: FRESH_SETTINGS.specificMood,
        specificTense: FRESH_SETTINGS.specificTense,
        reviewSessionType,
        reviewSessionFilter,
        level: FRESH_SETTINGS.level,
        excludedItem: itemToExclude?.lemma,
        doubleActive: FRESH_SETTINGS.doubleActive
      })

      const poolResult = await resolveFormsPool({
        settings: FRESH_SETTINGS,
        region: FRESH_SETTINGS.region,
        cache: formsPoolRef.current,
        generateAllFormsForRegion,
        getFormsCacheKey,
        now: getNow
      })

      formsPoolRef.current = poolResult.cache

      if (poolResult.reused) {
        logger.debug('generateNextItem', 'Reusing memoized forms pool', {
          signature: poolResult.signature,
          totalForms: poolResult.forms?.length || 0
        })
      } else {
        logger.debug('generateNextItem', 'Built forms pool for generation', {
          signature: poolResult.signature,
          durationMs: poolResult.durationMs,
          totalForms: poolResult.forms?.length || 0
        })
      }

      const formsPool = poolResult.forms
      if (!formsPool || formsPool.length === 0) {
        logger.error('generateNextItem', 'No forms available for region', FRESH_SETTINGS.region)
        return null
      }

      if (FRESH_SETTINGS.doubleActive) {
        const helpersOk = typeof getAvailableMoodsForLevel === 'function' && typeof getAvailableTensesForLevelAndMood === 'function'
        if (!helpersOk) {
          logger.warn('generateNextItem', 'Double mode helpers missing, skipping double mode path')
        }
        if (
          helpersOk &&
          isDoubleModeViable(formsPool, FRESH_SETTINGS, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)
        ) {
          logger.debug('generateNextItem', 'Attempting double mode generation')
          const doubleItem = await generateDoubleModeItem(
            FRESH_SETTINGS,
            itemToExclude,
            formsPool,
            getAvailableMoodsForLevel,
            getAvailableTensesForLevelAndMood,
            setLastGeneratedItem
          )

          if (doubleItem) {
            setLastGeneratedItem(doubleItem)
            return doubleItem
          }

          logger.warn('generateNextItem', 'Double mode generation failed, falling back to single mode')
        } else if (helpersOk) {
          logger.warn('generateNextItem', 'Double mode not viable with current settings')
        }
      }

      const configValidation = validateSpecificPracticeConfig(FRESH_SETTINGS)
      if (!configValidation.valid) {
        logger.error('generateNextItem', 'Invalid specific practice configuration', configValidation)
        return null
      }

      const specificConstraints = buildSpecificConstraints(FRESH_SETTINGS, reviewSessionType, reviewSessionFilter)

      let eligibleForms
      const canCacheEligible = shouldCacheEligibleForms(FRESH_SETTINGS)
      const eligibleKey = buildEligibleFormsKey(
        poolResult.signature,
        FRESH_SETTINGS,
        specificConstraints,
        reviewSessionType,
        reviewSessionFilter
      )
      if (canCacheEligible && eligibleFormsCacheRef.current.key === eligibleKey) {
        eligibleForms = eligibleFormsCacheRef.current.forms
      } else {
        eligibleForms = applyComprehensiveFiltering(formsPool, FRESH_SETTINGS, specificConstraints)
        if (canCacheEligible) {
          eligibleFormsCacheRef.current = { key: eligibleKey, forms: eligibleForms }
        }
      }

      try {
        validateEligibleForms(eligibleForms, specificConstraints)
      } catch (e) {
        logger.warn('generateNextItem', 'No eligible forms after filtering; attempting graceful fallback', {
          reason: e?.message,
          settings: {
            level: FRESH_SETTINGS.level,
            region: FRESH_SETTINGS.region,
            practiceMode: FRESH_SETTINGS.practiceMode,
            specificMood: FRESH_SETTINGS.specificMood,
            specificTense: FRESH_SETTINGS.specificTense,
            verbType: FRESH_SETTINGS.verbType
          }
        })

        try {
          const { progressiveConstraintRelaxation } = await import('./DrillFallbackStrategies.js')
          const relaxed = progressiveConstraintRelaxation(formsPool, FRESH_SETTINGS, specificConstraints)
          if (relaxed) {
            eligibleForms = [relaxed]
            logger.info('generateNextItem', 'Progressive relaxation produced a candidate')
          }
        } catch (relaxErr) {
          logger.warn('generateNextItem', 'Progressive relaxation failed', relaxErr)
        }

        if (!eligibleForms || eligibleForms.length === 0) {
          const mixedFallbackItem = fallbackToMixedPractice(formsPool, FRESH_SETTINGS)
          if (mixedFallbackItem) {
            setLastGeneratedItem(mixedFallbackItem)
            return mixedFallbackItem
          }

          logger.warn('generateNextItem', 'Mixed fallback failed, using emergency fallback')
          const emergencyItem = await createEmergencyFallbackItem(FRESH_SETTINGS)
          setLastGeneratedItem(emergencyItem)
          return emergencyItem
        }
      }

      const { form: selectedForm, selectionMethod: pipelineMethod, errors } = await selectNextForm({
        eligibleForms,
        settings: FRESH_SETTINGS,
        history,
        itemToExclude,
        specificConstraints,
        reviewSessionType,
        reviewSessionFilter,
        now: new Date(),
        dependencies: {
          getCurrentUserId,
          getDueItems,
          gateDueItemsByCurriculum,
          filterDueForSpecific,
          filterByVerbType,
          selectVariedForm: (forms, level, practiceMode, historyArg) =>
            varietyEngine.selectVariedForm(forms, level, practiceMode, historyArg),
          getNextRecommendedItem,
          chooseNext,
          applyReviewSessionFilter,
          selectDueCandidate
        }
      })

      errors.forEach(({ stage, error }) => {
        if (stage === 'adaptive') {
          logger.warn('generateNextItem', 'Adaptive recommendation failed', error)
        } else {
          logger.warn('generateNextItem', 'Selection stage failed', { stage, error })
        }
      })

      let nextForm = selectedForm
      let selectionMethod = pipelineMethod || 'standard_generator'

      if (nextForm) {
        logger.debug('generateNextItem', 'Selection pipeline produced candidate', {
          method: selectionMethod,
          mood: nextForm.mood,
          tense: nextForm.tense,
          person: nextForm.person
        })
      }

      const integrityCheck = performIntegrityGuard(nextForm, FRESH_SETTINGS, specificConstraints, selectionMethod)

      if (!integrityCheck.success) {
        logger.warn('generateNextItem', 'Integrity check failed, attempting fallback')

        const fallbackForm = await tryIntelligentFallback(FRESH_SETTINGS, eligibleForms, {
          specificMood: specificConstraints.specificMood,
          specificTense: specificConstraints.specificTense,
          isSpecific: specificConstraints.isSpecific
        })

        if (fallbackForm) {
          nextForm = fallbackForm
          selectionMethod = `${selectionMethod}+intelligent_fallback`
          logger.info('generateNextItem', 'Intelligent fallback succeeded')
        } else {
          logger.warn('generateNextItem', 'All fallbacks failed, using mixed practice fallback')
          const mixedFallbackItem = fallbackToMixedPractice(formsPool, FRESH_SETTINGS)
          if (mixedFallbackItem) {
            setLastGeneratedItem(mixedFallbackItem)
            return mixedFallbackItem
          }

          logger.warn('generateNextItem', 'Mixed fallback returned null, using emergency fallback')
          const emergencyItem = await createEmergencyFallbackItem(FRESH_SETTINGS)
          setLastGeneratedItem(emergencyItem)
          return emergencyItem
        }
      }

      if (nextForm) {
        const drillItem = generateDrillItem(nextForm, FRESH_SETTINGS, formsPool)

        if (drillItem) {
          drillItem.selectionMethod = selectionMethod
          setLastGeneratedItem(drillItem)

          logger.info('generateNextItem', 'Item generation completed successfully', {
            lemma: drillItem.lemma,
            mood: drillItem.mood,
            tense: drillItem.tense,
            person: drillItem.person,
            method: selectionMethod
          })

          return drillItem
        }
      }

      logger.error('generateNextItem', 'Failed to generate drill item, attempting mixed fallback')
      const mixedFallbackItem = fallbackToMixedPractice(formsPool, FRESH_SETTINGS)
      if (mixedFallbackItem) {
        setLastGeneratedItem(mixedFallbackItem)
        return mixedFallbackItem
      }

      logger.warn('generateNextItem', 'All fallbacks failed, using emergency fallback')
      const emergencyItem = await createEmergencyFallbackItem(FRESH_SETTINGS)
      setLastGeneratedItem(emergencyItem)
      return emergencyItem

    } catch (error) {
      logger.error('generateNextItem', 'Critical generator error', {
        error,
        stack: error?.stack,
        level: FRESH_SETTINGS.level,
        region: FRESH_SETTINGS.region,
        practiceMode: FRESH_SETTINGS.practiceMode,
        specificMood: FRESH_SETTINGS.specificMood,
        specificTense: FRESH_SETTINGS.specificTense,
        verbType: FRESH_SETTINGS.verbType,
        enableChunks: FRESH_SETTINGS.enableChunks,
        reviewSessionType,
        reviewSessionFilter
      })
      logger.error('generateNextItem', 'Error during item generation', error)

      logger.warn('generateNextItem', 'Creating emergency fallback after critical error')
      const emergencyItem = await createEmergencyFallbackItem(FRESH_SETTINGS)
      setLastGeneratedItem(emergencyItem)
      return emergencyItem
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating])

  /**
   * Check if generation is currently possible
   * @returns {boolean} - Whether generation is viable
   */
  const isGenerationViable = useCallback(async () => {
    try {
      const allFormsForRegion = await resolveFormsForStats(settings)

      if (!allFormsForRegion || allFormsForRegion.length === 0) {
        return false
      }

      const specificConstraints = {
        isSpecific: (settings.practiceMode === 'specific' || settings.practiceMode === 'theme') &&
          settings.specificMood && settings.specificTense,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense
      }

      let eligibleForms
      const poolSignature = getFormsCacheKey(settings.region || 'la_general', settings)
      const canCacheEligible = shouldCacheEligibleForms(settings)
      const eligibleKey = buildEligibleFormsKey(
        poolSignature,
        settings,
        specificConstraints,
        settings.reviewSessionType,
        settings.reviewSessionFilter
      )
      if (canCacheEligible && eligibleFormsCacheRef.current.key === eligibleKey) {
        eligibleForms = eligibleFormsCacheRef.current.forms
      } else {
        eligibleForms = applyComprehensiveFiltering(allFormsForRegion, settings, specificConstraints)
        if (canCacheEligible) {
          eligibleFormsCacheRef.current = { key: eligibleKey, forms: eligibleForms }
        }
      }
      return eligibleForms.length > 0
    } catch (error) {
      logger.warn('isGenerationViable', 'Error checking generation viability', error)
      return false
    }
  }, [resolveFormsForStats, settings])

  /**
   * Get generation statistics for debugging
   * @returns {Object} - Generation statistics
   */
  const getGenerationStats = useCallback(async () => {
    try {
      const allFormsForRegion = await resolveFormsForStats(settings)

      const specificConstraints = {
        isSpecific: (settings.practiceMode === 'specific' || settings.practiceMode === 'theme') &&
          settings.specificMood && settings.specificTense,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense
      }

      let eligibleForms
      const poolSignature = getFormsCacheKey(settings.region || 'la_general', settings)
      const canCacheEligible = shouldCacheEligibleForms(settings)
      const eligibleKey = buildEligibleFormsKey(
        poolSignature,
        settings,
        specificConstraints,
        settings.reviewSessionType,
        settings.reviewSessionFilter
      )
      if (canCacheEligible && eligibleFormsCacheRef.current.key === eligibleKey) {
        eligibleForms = eligibleFormsCacheRef.current.forms
      } else {
        eligibleForms = applyComprehensiveFiltering(allFormsForRegion, settings, specificConstraints)
        if (canCacheEligible) {
          eligibleFormsCacheRef.current = { key: eligibleKey, forms: eligibleForms }
        }
      }

      return {
        totalForms: allFormsForRegion.length,
        eligibleForms: eligibleForms.length,
        filteringEfficiency: allFormsForRegion.length > 0
          ? Math.round((eligibleForms.length / allFormsForRegion.length) * 100)
          : 0,
        settings: {
          practiceMode: settings.practiceMode,
          verbType: settings.verbType,
          level: settings.level,
          region: settings.region
        },
        isSpecific: specificConstraints.isSpecific,
        lastGenerated: lastGeneratedItem ? {
          lemma: lastGeneratedItem.lemma,
          mood: lastGeneratedItem.mood,
          tense: lastGeneratedItem.tense,
          method: lastGeneratedItem.selectionMethod
        } : null
      }
    } catch (error) {
      logger.warn('getGenerationStats', 'Error getting generation stats', error)
      return {
        totalForms: 0,
        eligibleForms: 0,
        filteringEfficiency: 0,
        settings: {
          practiceMode: settings.practiceMode,
          verbType: settings.verbType,
          level: settings.level,
          region: settings.region
        },
        error: error.message
      }
    }
  }, [resolveFormsForStats, settings, lastGeneratedItem])

  return {
    generateNextItem,
    isGenerationViable,
    getGenerationStats,
    isGenerating,
    lastGeneratedItem
  }
}

/**
 * Creates an emergency fallback drill item when all else fails
 * This ensures the generator NEVER returns null
 * IMPORTANT: Respects regional filtering to ensure correct person forms
 * @param {Object} settings - User settings for context
 * @returns {Object} A valid drill item that always works
 */
async function createEmergencyFallbackItem(settings) {
  logger.debug('createEmergencyFallbackItem', 'Searching fallback form', {
    specificMood: settings.specificMood,
    specificTense: settings.specificTense,
    region: settings.region
  })

  // Define target mood/tense outside try block so it's available throughout function
  const targetMood = settings.specificMood || 'indicative'
  const targetTense = settings.specificTense || 'pres'

  try {
    // Import regional filtering function
    const { getAllowedPersonsForRegion } = await import('../../lib/core/curriculumGate.js')
    const allowedPersons = getAllowedPersonsForRegion(settings.region || 'la_general')

    logger.debug('createEmergencyFallbackItem', 'Applying regional constraints in fallback', {
      region: settings.region,
      allowedPersons: Array.from(allowedPersons)
    })

    // STEP 1: Try to get forms directly from database, bypassing all caching
    const { getAllVerbs } = await import('../../lib/core/verbDataService.js')
    const allVerbs = await getAllVerbs()

    logger.debug('createEmergencyFallbackItem', 'Loaded verbs for fallback', { verbs: allVerbs.length })

    logger.debug('createEmergencyFallbackItem', 'Searching exact mood/tense fallback', {
      targetMood,
      targetTense
    })

    const matchingForms = []

    for (const verb of allVerbs) {
      if (!verb.paradigms) continue

      for (const paradigm of verb.paradigms) {
        if (!paradigm.forms) continue

        for (const form of paradigm.forms) {
          // EXACT MATCH for requested mood and tense
          if (form.mood === targetMood && form.tense === targetTense && form.value) {
            // CRITICAL FIX: Only include forms with persons allowed for this region
            // For nonfinite forms (infinitive, gerund, participle), person filtering doesn't apply
            if (form.mood === 'nonfinite' || allowedPersons.has(form.person)) {
              matchingForms.push({
                lemma: verb.lemma,
                mood: form.mood,
                tense: form.tense,
                person: form.person,
                value: form.value,
                type: verb.type || 'regular'
              })
            }
          }
        }
      }
    }

    logger.debug('createEmergencyFallbackItem', 'Exact fallback candidates found', {
      count: matchingForms.length,
      targetMood,
      targetTense
    })

    // STEP 3: If we found real forms, use one randomly
    if (matchingForms.length > 0) {
      const selectedForm = matchingForms[Math.floor(Math.random() * matchingForms.length)]

      logger.info('createEmergencyFallbackItem', 'Using exact fallback form', {
        lemma: selectedForm.lemma,
        mood: selectedForm.mood,
        tense: selectedForm.tense,
        person: selectedForm.person
      })

      const realItem = {
        id: `real_fallback_${Date.now()}`,
        lemma: selectedForm.lemma,
        mood: selectedForm.mood,
        tense: selectedForm.tense,
        person: selectedForm.person,
        value: selectedForm.value,
        type: selectedForm.type,
        isEmergencyFallback: false, // This is NOT emergency, it's REAL
        prompt: `Conjugar ${selectedForm.lemma} en ${selectedForm.person}`,
        answer: selectedForm.value,
        selectionMethod: 'direct_database_fallback'
      }

      return realItem
    }

    // STEP 4: If no exact match, try relaxing tense but keeping mood
    if (targetTense !== 'pres') {
      // Smart fallback: if subjunctive, fall back to present subjunctive, not indicative
      const fallbackTense = targetMood === 'subjunctive' ? 'subjPres' : 'pres'

      logger.warn('createEmergencyFallbackItem', 'No exact fallback match, trying relaxed tense', {
        targetMood,
        fallbackTense
      })

      const moodForms = []

      for (const verb of allVerbs) {
        if (!verb.paradigms) continue

        for (const paradigm of verb.paradigms) {
          if (!paradigm.forms) continue

          for (const form of paradigm.forms) {
            // Use fallbackTense instead of hardcoded 'pres'
            if (form.mood === targetMood && form.tense === fallbackTense && form.value) {
              // CRITICAL FIX: Only include forms with persons allowed for this region
              if (form.mood === 'nonfinite' || allowedPersons.has(form.person)) {
                moodForms.push({
                  lemma: verb.lemma,
                  mood: form.mood,
                  tense: form.tense,
                  person: form.person,
                  value: form.value,
                  type: verb.type || 'regular'
                })
              }
            }
          }
        }
      }

      if (moodForms.length > 0) {
        const selectedForm = moodForms[Math.floor(Math.random() * moodForms.length)]

        logger.info('createEmergencyFallbackItem', 'Using mood-level fallback', {
          lemma: selectedForm.lemma,
          mood: selectedForm.mood,
          tense: selectedForm.tense,
          person: selectedForm.person
        })

        return {
          id: `mood_fallback_${Date.now()}`,
          lemma: selectedForm.lemma,
          mood: selectedForm.mood,
          tense: selectedForm.tense,
          person: selectedForm.person,
          value: selectedForm.value,
          type: selectedForm.type,
          isEmergencyFallback: false,
          prompt: `Conjugar ${selectedForm.lemma} en ${selectedForm.person}`,
          answer: selectedForm.value,
          selectionMethod: 'mood_fallback'
        }
      }
    }

  } catch (error) {
    logger.error('createEmergencyFallbackItem', 'Error in fallback search', error)
  }

  // STEP 5: Only if everything fails, show clear error message
  logger.error('createEmergencyFallbackItem', 'No forms found for fallback criteria', {
    targetMood,
    targetTense
  })

  return {
    id: `critical_error_${Date.now()}`,
    lemma: 'ERROR',
    mood: 'ERROR',
    tense: 'ERROR',
    person: 'ERROR',
    value: `No ${targetTense} forms available`,
    type: 'error',
    isEmergencyFallback: true,
    prompt: `ERROR: No ${targetMood} ${targetTense} forms found`,
    answer: 'ERROR',
    selectionMethod: 'critical_error'
  }
}
