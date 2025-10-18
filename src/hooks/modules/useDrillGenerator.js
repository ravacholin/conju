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
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('useDrillGenerator')

const devDebug = (...args) => {
  if (import.meta?.env?.DEV) {
    logger.debug(...args)
  }
}

const devInfo = (...args) => {
  if (import.meta?.env?.DEV) {
    logger.info(...args)
  }
}

const devWarn = (...args) => {
  if (import.meta?.env?.DEV) {
    logger.warn(...args)
  }
}

const fallbackResultsCache = new Map()

const getFallbackCacheKey = (region, mood, tense) =>
  `${region || 'la_general'}|${mood}|${tense}`

const buildDrillItemFromForm = (form, method) => ({
  id: `${method}_${Date.now()}`,
  lemma: form.lemma,
  mood: form.mood,
  tense: form.tense,
  person: form.person,
  value: form.value,
  type: form.type,
  isEmergencyFallback: false,
  prompt: `Conjugar ${form.lemma} en ${form.person}`,
  answer: form.value,
  selectionMethod: method
})

const respectsAllowedPersons = (form, allowedPersons) =>
  form.mood === 'nonfinite' || !allowedPersons || allowedPersons.has(form.person)

const filterFormsByConstraints = (forms, mood, tense, allowedPersons) =>
  (forms || []).filter(form =>
    form.mood === mood &&
    form.tense === tense &&
    form.value &&
    respectsAllowedPersons(form, allowedPersons)
  )

const computeUrgencyLevel = (nextDue, now) => {
  if (!nextDue) return 1
  const dueDate = new Date(nextDue)
  const diffHours = (dueDate - now) / (1000 * 60 * 60)

  if (Number.isNaN(diffHours)) return 1
  if (diffHours < 0) return 4
  if (diffHours < 6) return 3
  if (diffHours < 24) return 2
  return 1
}

const applyReviewSessionFilter = (
  dueCells,
  reviewSessionType,
  reviewSessionFilter,
  now
) => {
  if (!Array.isArray(dueCells) || dueCells.length === 0) return []

  const filter = reviewSessionFilter || {}
  let filtered = dueCells.filter(Boolean)

  const targetMood = filter.mood
  const targetTense = filter.tense
  const targetPerson = filter.person

  if (targetMood) {
    filtered = filtered.filter(cell => cell?.mood === targetMood)
  }

  if (targetTense) {
    filtered = filtered.filter(cell => cell?.tense === targetTense)
  }

  if (targetPerson) {
    filtered = filtered.filter(cell => cell?.person === targetPerson)
  }

  const urgencyFilter = filter.urgency
  if (urgencyFilter && urgencyFilter !== 'all') {
    filtered = filtered.filter(cell => {
      const urgency = computeUrgencyLevel(cell?.nextDue, now)

      if (urgencyFilter === 'urgent') return urgency >= 3
      if (urgencyFilter === 'overdue') return urgency === 4

      const numericUrgency = Number(urgencyFilter)
      if (!Number.isNaN(numericUrgency)) {
        return urgency === numericUrgency
      }

      return true
    })
  }

  const limit = filter.limit
  if (limit === 'light') {
    filtered = filtered.slice(0, Math.max(1, filter.limitCount || 10))
  } else if (typeof limit === 'number' && limit > 0) {
    filtered = filtered.slice(0, Math.floor(limit))
  }

  // Specific review sessions should still honour mood/tense even if filter removed all
  if (reviewSessionType === 'specific' && filtered.length === 0) {
    filtered = dueCells.filter(cell => {
      if (!cell) return false
      if (targetMood && cell.mood !== targetMood) return false
      if (targetTense && cell.tense !== targetTense) return false
      if (targetPerson && cell.person !== targetPerson) return false
      return true
    })
  }

  return filtered
}

const selectDueCandidate = (dueCells, reviewSessionType) => {
  if (!Array.isArray(dueCells) || dueCells.length === 0) return null

  switch (reviewSessionType) {
    case 'specific':
    case 'urgent':
    case 'light':
    case 'due':
    case 'today':
      return dueCells.find(Boolean) || null
    default:
      return dueCells.find(Boolean) || null
  }
}

/**
 * Specialized hook for drill item generation
 * @returns {Object} - Generator functions and state
 */
export const useDrillGenerator = () => {
  const settings = useSettings()
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGeneratedItem, setLastGeneratedItem] = useState(null)
  const formsPoolRef = useRef({ signature: null, forms: null })

  const getNow = () => {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now()
    }
    return Date.now()
  }

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

    setIsGenerating(true)
    
    const region = settings.region || 'la_general'
    let signature = null
    let allFormsForRegion = formsPoolRef.current.forms

    try {
      const reviewSessionType = settings.reviewSessionType || 'due'
      const reviewSessionFilter = settings.reviewSessionFilter || {}

      logger.info('generateNextItem', 'Starting item generation', {
        verbType: settings.verbType,
        selectedFamily: settings.selectedFamily,
        practiceMode: settings.practiceMode,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense,
        reviewSessionType,
        reviewSessionFilter,
        level: settings.level,
        excludedItem: itemToExclude?.lemma,
        doubleActive: settings.doubleActive
      })
      
      // Trigger smart preloading before form generation for better performance
      // Note: Verb preloading is no longer needed as all verbs are directly imported

      signature = getFormsCacheKey(region, settings)

      if (!allFormsForRegion || formsPoolRef.current.signature !== signature) {
        const startTime = getNow()
        allFormsForRegion = await generateAllFormsForRegion(region, settings)
        const endTime = getNow()
        const durationMs = Number((endTime - startTime).toFixed(2))

        logger.debug('generateNextItem', 'Built forms pool for generation', {
          signature,
          durationMs,
          totalForms: allFormsForRegion?.length || 0
        })

        formsPoolRef.current = {
          signature,
          forms: allFormsForRegion
        }
      } else {
        logger.debug('generateNextItem', 'Reusing memoized forms pool', {
          signature,
          totalForms: allFormsForRegion.length
        })
      }

      if (!allFormsForRegion || allFormsForRegion.length === 0) {
        logger.error('generateNextItem', 'No forms available for region', settings.region)
        return null
      }

      logger.debug('generateNextItem', `Generated ${allFormsForRegion.length} forms for processing`)

      // Check if double mode is requested and viable
      if (settings.doubleActive) {
        // Defensive: ensure helper functions exist before attempting double mode
        const helpersOk = typeof getAvailableMoodsForLevel === 'function' && typeof getAvailableTensesForLevelAndMood === 'function'
        if (!helpersOk) {
          logger.warn('generateNextItem', 'Double mode helpers missing, skipping double mode path')
        }
        if (isDoubleModeViable(allFormsForRegion, settings, getAvailableMoodsForLevel, getAvailableTensesForLevelAndMood)) {
          logger.debug('generateNextItem', 'Attempting double mode generation')
          // Note: DoubleModeManager handles setCurrentItem internally
          const doubleItem = await generateDoubleModeItem(
            settings,
            itemToExclude,
            allFormsForRegion,
            getAvailableMoodsForLevel,
            getAvailableTensesForLevelAndMood,
            setLastGeneratedItem
          )
          
          if (doubleItem) {
            setLastGeneratedItem(doubleItem)
            return doubleItem
          }
          
          logger.warn('generateNextItem', 'Double mode generation failed, falling back to single mode')
        } else {
          logger.warn('generateNextItem', 'Double mode not viable with current settings')
        }
      }

      // Validate specific practice configuration
      const configValidation = validateSpecificPracticeConfig(settings)
      if (!configValidation.valid) {
        logger.error('generateNextItem', 'Invalid specific practice configuration', configValidation)
        return null
      }

      // Set up specific practice constraints
      const isPracticeSpecificActive = Boolean(
        (settings.practiceMode === 'specific' || settings.practiceMode === 'theme') &&
        settings.specificMood &&
        settings.specificTense
      )
      const isReviewSpecificActive = Boolean(
        settings.practiceMode === 'review' &&
        reviewSessionType === 'specific' &&
        reviewSessionFilter?.mood &&
        reviewSessionFilter?.tense
      )

      const isSpecific = isPracticeSpecificActive || isReviewSpecificActive
      const resolvedMood = isReviewSpecificActive
        ? reviewSessionFilter.mood
        : (isPracticeSpecificActive ? settings.specificMood : null)
      const resolvedTense = isReviewSpecificActive
        ? reviewSessionFilter.tense
        : (isPracticeSpecificActive ? settings.specificTense : null)
      const specificConstraints = {
        isSpecific,
        specificMood: isSpecific ? resolvedMood : null,
        specificTense: isSpecific ? resolvedTense : null
      }

      // Apply comprehensive filtering
      let eligibleForms = applyComprehensiveFiltering(allFormsForRegion, settings, specificConstraints)

      // Validate that we have eligible forms. If none, try graceful fallbacks
      try {
        validateEligibleForms(eligibleForms, specificConstraints)
      } catch (e) {
        logger.warn('generateNextItem', 'No eligible forms after filtering; attempting graceful fallback', {
          reason: e?.message,
          settings: {
            level: settings.level,
            region: settings.region,
            practiceMode: settings.practiceMode,
            specificMood: settings.specificMood,
            specificTense: settings.specificTense,
            verbType: settings.verbType
          }
        })

        // First attempt: progressively relax constraints within the same pool
        try {
          const { progressiveConstraintRelaxation } = await import('./DrillFallbackStrategies.js')
          const relaxed = progressiveConstraintRelaxation(allFormsForRegion, settings, specificConstraints)
          if (relaxed) {
            eligibleForms = [relaxed]
            logger.info('generateNextItem', 'Progressive relaxation produced a candidate')
          }
        } catch (relaxErr) {
          logger.warn('generateNextItem', 'Progressive relaxation failed', relaxErr)
        }

        // If still no candidates, last resort: mixed practice fallback
        if (!eligibleForms || eligibleForms.length === 0) {
          const mixedFallbackItem = fallbackToMixedPractice(allFormsForRegion, settings)
          if (mixedFallbackItem) {
            setLastGeneratedItem(mixedFallbackItem)
            return mixedFallbackItem
          }
          // If even mixed fallback failed, use emergency fallback
          devWarn('generateNextItem', 'Mixed fallback failed, using emergency fallback')
          const emergencyItem = await createEmergencyFallbackItem(settings, {
            precomputedForms: allFormsForRegion,
            formsSignature: signature
          })
          setLastGeneratedItem(emergencyItem)
          return emergencyItem
        }
      }

      let nextForm = null
      let selectionMethod = 'standard'

      // Tier 1: SRS due items
      const userId = getCurrentUserId()
      if (userId) {
        const now = new Date()
        let dueCells = await getDueItems(userId, now)
        dueCells = gateDueItemsByCurriculum(dueCells, settings)
        dueCells = filterDueForSpecific(dueCells, specificConstraints)

        if (settings.practiceMode === 'review') {
          dueCells = applyReviewSessionFilter(
            dueCells,
            reviewSessionType,
            reviewSessionFilter,
            now
          )
        }

        const pickFromDue = selectDueCandidate(dueCells, reviewSessionType)
        if (pickFromDue) {
          // In práctica específica (tema fijo), NO fijar la persona desde SRS.
          // Queremos variedad de pronombres dentro del mismo modo/tiempo.
          // Seguimos usando el due item para priorizar el mood/tense, pero dejamos flotar la persona.
          let candidateForms = eligibleForms.filter(f =>
            f.mood === pickFromDue.mood &&
            f.tense === pickFromDue.tense &&
            // Solo fijamos la persona cuando NO es práctica específica.
            (!isSpecific ? (f.person === pickFromDue.person) : true)
          )
          
          candidateForms = filterByVerbType(candidateForms, settings.verbType, settings)
          
          if (candidateForms.length > 0) {
            nextForm = varietyEngine.selectVariedForm(candidateForms, settings.level, settings.practiceMode, history) ||
                      candidateForms[Math.floor(Math.random() * candidateForms.length)]
            selectionMethod = 'srs_due_with_variety'
            
            logger.debug('generateNextItem', 'SRS due item selected', {
              mood: nextForm.mood,
              tense: nextForm.tense,
              person: nextForm.person
            })
          }
        }
      }

      // Tier 2: Adaptive recommendations
      if (!nextForm) {
        try {
          const recommendation = await getNextRecommendedItem(settings.level || 'B1')
          if (recommendation) {
            const { mood, tense, verbId } = recommendation
            
            logger.debug('generateNextItem', 'Adaptive recommendation received', {
              type: recommendation.type,
              mood,
              tense,
              verbId,
              reason: recommendation.reason
            })
            
            let candidateForms = eligibleForms.filter(f => f.mood === mood && f.tense === tense)
            
            if (verbId) {
              const specificVerbForms = candidateForms.filter(f => f.lemma === verbId)
              if (specificVerbForms.length > 0) {
                candidateForms = specificVerbForms
              }
            }
            
            candidateForms = filterByVerbType(candidateForms, settings.verbType, settings)
            
            if (candidateForms.length > 0) {
              nextForm = varietyEngine.selectVariedForm(candidateForms, settings.level, settings.practiceMode, history) ||
                        candidateForms[Math.floor(Math.random() * candidateForms.length)]
              selectionMethod = 'adaptive_recommendation_with_variety'
              
              logger.debug('generateNextItem', 'Adaptive recommendation selected', {
                mood: nextForm.mood,
                tense: nextForm.tense
              })
            }
          }
        } catch (error) {
          logger.warn('generateNextItem', 'Adaptive recommendation failed', error)
        }
      }

      // Tier 3: Standard generator
      if (!nextForm) {
        nextForm = await chooseNext({
          forms: eligibleForms,
          history,
          currentItem: itemToExclude,
          sessionSettings: settings
        })
        selectionMethod = 'standard_generator'

        logger.debug('generateNextItem', 'Standard generator used', {
          eligibleFormsCount: eligibleForms.length,
          passedSettings: {
            practiceMode: settings.practiceMode,
            specificMood: settings.specificMood,
            specificTense: settings.specificTense
          }
        })
      }

      // Perform integrity validation
      const integrityCheck = performIntegrityGuard(nextForm, settings, specificConstraints, selectionMethod)
      
      if (!integrityCheck.success) {
        logger.warn('generateNextItem', 'Integrity check failed, attempting fallback')
        
        // Try intelligent fallback
        const fallbackForm = await tryIntelligentFallback(settings, eligibleForms, {
          specificMood: specificConstraints.specificMood,
          specificTense: specificConstraints.specificTense,
          isSpecific: specificConstraints.isSpecific
        })
        
        if (fallbackForm) {
          nextForm = fallbackForm
          selectionMethod += '+intelligent_fallback'
          logger.info('generateNextItem', 'Intelligent fallback succeeded')
        } else {
          // Last resort: mixed practice fallback
          logger.warn('generateNextItem', 'All fallbacks failed, using mixed practice fallback')
          const mixedFallbackItem = fallbackToMixedPractice(allFormsForRegion, settings)
          if (mixedFallbackItem) {
            setLastGeneratedItem(mixedFallbackItem)
            return mixedFallbackItem
          } else {
            // Even mixed fallback failed - use emergency
            devWarn('generateNextItem', 'Mixed fallback returned null, using emergency fallback')
            const emergencyItem = await createEmergencyFallbackItem(settings, {
              precomputedForms: allFormsForRegion,
              formsSignature: signature
            })
            setLastGeneratedItem(emergencyItem)
            return emergencyItem
          }
        }
      }

      // Generate final drill item
      if (nextForm) {
        const drillItem = generateDrillItem(nextForm, settings, eligibleForms)
        
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
      const mixedFallbackItem = fallbackToMixedPractice(allFormsForRegion, settings)
      if (mixedFallbackItem) {
        setLastGeneratedItem(mixedFallbackItem)
        return mixedFallbackItem
      }

      // NEVER return null - use emergency fallback as absolute last resort
      devWarn('generateNextItem', 'All fallbacks failed, using emergency fallback')
      const emergencyItem = await createEmergencyFallbackItem(settings, {
        precomputedForms: allFormsForRegion,
        formsSignature: signature
      })
      setLastGeneratedItem(emergencyItem)
      return emergencyItem

    } catch (error) {
      console.error('💥 CRITICAL ERROR in useDrillGenerator:', error)
      console.error('💥 Error stack:', error.stack)
      console.error('💥 Settings causing error:', {
        level: settings.level,
        region: settings.region,
        practiceMode: settings.practiceMode,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense,
        verbType: settings.verbType,
        enableChunks: settings.enableChunks
      })
      logger.error('generateNextItem', 'Error during item generation', error)

      // NEVER return null - always provide an emergency fallback
      devWarn('generateNextItem', 'Creating emergency fallback after critical error')
      const emergencyItem = await createEmergencyFallbackItem(settings, {
        precomputedForms: allFormsForRegion,
        formsSignature: signature
      })
      setLastGeneratedItem(emergencyItem)
      return emergencyItem
    } finally {
      setIsGenerating(false)
    }
  }, [settings, isGenerating])

  /**
   * Check if generation is currently possible
   * @returns {boolean} - Whether generation is viable
   */
  const isGenerationViable = useCallback(async () => {
    try {
      const allFormsForRegion = await generateAllFormsForRegion(settings.region || 'la_general', settings)
      
      if (!allFormsForRegion || allFormsForRegion.length === 0) {
        return false
      }

      const specificConstraints = {
        isSpecific: (settings.practiceMode === 'specific' || settings.practiceMode === 'theme') && 
                    settings.specificMood && settings.specificTense,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense
      }

      const eligibleForms = applyComprehensiveFiltering(allFormsForRegion, settings, specificConstraints)
      return eligibleForms.length > 0
    } catch (error) {
      logger.warn('isGenerationViable', 'Error checking generation viability', error)
      return false
    }
  }, [settings])

  /**
   * Get generation statistics for debugging
   * @returns {Object} - Generation statistics
   */
  const getGenerationStats = useCallback(async () => {
    try {
      const allFormsForRegion = await generateAllFormsForRegion(settings.region || 'la_general', settings)
      
      const specificConstraints = {
        isSpecific: (settings.practiceMode === 'specific' || settings.practiceMode === 'theme') && 
                    settings.specificMood && settings.specificTense,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense
      }

      const eligibleForms = applyComprehensiveFiltering(allFormsForRegion, settings, specificConstraints)
      
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
  }, [settings, lastGeneratedItem])

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
async function createEmergencyFallbackItem(settings, options = {}) {
  const { precomputedForms = null, formsSignature = null } = options
  const region = settings.region || 'la_general'
  const targetMood = settings.specificMood || 'indicative'
  const targetTense = settings.specificTense || 'pres'
  const cacheKey = getFallbackCacheKey(region, targetMood, targetTense)
  const expectedSignature = getFormsCacheKey(region, settings)

  const selectFromCache = (entry) => {
    if (!entry) return null

    if (entry.signature && entry.signature !== expectedSignature) {
      return null
    }

    const pools = [entry.direct, entry.relaxedMood]
    for (const pool of pools) {
      if (!pool?.forms?.length) continue
      const selectedForm = pool.forms[Math.floor(Math.random() * pool.forms.length)]
      if (selectedForm) {
        devInfo('createEmergencyFallbackItem', 'Reusing cached fallback result', {
          mood: selectedForm.mood,
          tense: selectedForm.tense,
          method: pool.method,
          cachedAt: entry.cachedAt
        })
        return buildDrillItemFromForm(selectedForm, pool.method)
      }
    }
    return null
  }

  try {
    const cachedEntry = fallbackResultsCache.get(cacheKey)
    if (cachedEntry) {
      const cachedItem = selectFromCache(cachedEntry)
      if (cachedItem) {
        return cachedItem
      }
    }

    const { getAllowedPersonsForRegion } = await import('../../lib/core/curriculumGate.js')
    const allowedPersons = getAllowedPersonsForRegion(region)

    if (import.meta?.env?.DEV) {
      devDebug('createEmergencyFallbackItem', 'Computed allowed persons for region', {
        region,
        allowed: Array.from(allowedPersons || [])
      })
    }

    const canUsePrecomputed = Array.isArray(precomputedForms) &&
      precomputedForms.length > 0 &&
      (!formsSignature || formsSignature === expectedSignature)

    if (canUsePrecomputed) {
      const directMatches = filterFormsByConstraints(precomputedForms, targetMood, targetTense, allowedPersons)
      if (directMatches.length > 0) {
        const method = 'precomputed_forms_fallback'
        fallbackResultsCache.set(cacheKey, {
          direct: { forms: directMatches, method },
          relaxedMood: cachedEntry?.relaxedMood || null,
          cachedAt: Date.now(),
          signature: expectedSignature
        })

        const selectedForm = directMatches[Math.floor(Math.random() * directMatches.length)]
        devInfo('createEmergencyFallbackItem', 'Using precomputed forms pool for fallback', {
          mood: selectedForm.mood,
          tense: selectedForm.tense,
          forms: directMatches.length
        })
        return buildDrillItemFromForm(selectedForm, method)
      }
    }

    const { getAllVerbs } = await import('../../lib/core/verbDataService.js')
    const allVerbs = await getAllVerbs()

    devDebug('createEmergencyFallbackItem', 'Scanning raw verbs for fallback forms', {
      verbs: allVerbs.length,
      targetMood,
      targetTense
    })

    const matchingForms = []
    const MAX_MATCHES = 150
    const MAX_VERB_SCAN = 800
    let scannedVerbs = 0

    outer: for (const verb of allVerbs) {
      if (!verb?.paradigms) continue
      scannedVerbs += 1

      for (const paradigm of verb.paradigms) {
        if (!paradigm?.forms) continue

        for (const form of paradigm.forms) {
          if (form.mood === targetMood && form.tense === targetTense && form.value &&
              respectsAllowedPersons(form, allowedPersons)) {
            matchingForms.push({
              lemma: verb.lemma,
              mood: form.mood,
              tense: form.tense,
              person: form.person,
              value: form.value,
              type: verb.type || 'regular'
            })

            if (matchingForms.length >= MAX_MATCHES) {
              break outer
            }
          }
        }
      }

      if (scannedVerbs >= MAX_VERB_SCAN && matchingForms.length > 0) {
        break
      }
    }

    if (matchingForms.length > 0) {
      const method = 'direct_database_fallback'
      fallbackResultsCache.set(cacheKey, {
        direct: { forms: matchingForms, method },
        relaxedMood: cachedEntry?.relaxedMood || null,
        cachedAt: Date.now(),
        signature: expectedSignature
      })

      const selectedForm = matchingForms[Math.floor(Math.random() * matchingForms.length)]
      devInfo('createEmergencyFallbackItem', 'Using direct database fallback', {
        mood: selectedForm.mood,
        tense: selectedForm.tense,
        totalMatches: matchingForms.length,
        scannedVerbs
      })
      return buildDrillItemFromForm(selectedForm, method)
    }

    if (targetTense !== 'pres') {
      const relaxedForms = []
      let relaxedScanned = 0

      outerRelaxed: for (const verb of allVerbs) {
        if (!verb?.paradigms) continue
        relaxedScanned += 1

        for (const paradigm of verb.paradigms) {
          if (!paradigm?.forms) continue

          for (const form of paradigm.forms) {
            if (form.mood === targetMood && form.tense === 'pres' && form.value &&
                respectsAllowedPersons(form, allowedPersons)) {
              relaxedForms.push({
                lemma: verb.lemma,
                mood: form.mood,
                tense: form.tense,
                person: form.person,
                value: form.value,
                type: verb.type || 'regular'
              })

              if (relaxedForms.length >= MAX_MATCHES) {
                break outerRelaxed
              }
            }
          }
        }

        if (relaxedScanned >= MAX_VERB_SCAN && relaxedForms.length > 0) {
          break
        }
      }

      if (relaxedForms.length > 0) {
        const method = 'mood_fallback'
        fallbackResultsCache.set(cacheKey, {
          direct: cachedEntry?.direct || null,
          relaxedMood: { forms: relaxedForms, method },
          cachedAt: Date.now(),
          signature: expectedSignature
        })

        const selectedForm = relaxedForms[Math.floor(Math.random() * relaxedForms.length)]
        devWarn('createEmergencyFallbackItem', 'No exact tense match found, using mood fallback', {
          fallbackTense: 'pres',
          targetMood,
          requestedTense: targetTense,
          candidates: relaxedForms.length
        })
        return buildDrillItemFromForm(selectedForm, method)
      }
    }

  } catch (error) {
    logger.error('createEmergencyFallbackItem', 'Error in real fallback system', error)
  }

  logger.error(
    'createEmergencyFallbackItem',
    `No forms found for ${targetMood}/${targetTense}. Database may be corrupted.`,
    {
      mood: targetMood,
      tense: targetTense,
      region
    }
  )

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
