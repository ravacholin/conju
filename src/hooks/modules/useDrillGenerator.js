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

      const region = settings.region || 'la_general'
      const signature = getFormsCacheKey(region, settings)
      let allFormsForRegion = formsPoolRef.current.forms

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
          console.log('🆘 useDrillGenerator: Mixed fallback failed, using emergency fallback')
          const emergencyItem = await createEmergencyFallbackItem(settings)
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
            console.log('🆘 useDrillGenerator: Mixed fallback returned null, using emergency fallback')
            const emergencyItem = await createEmergencyFallbackItem(settings)
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
      console.log('🆘 useDrillGenerator: All fallbacks failed, using emergency fallback')
      const emergencyItem = await createEmergencyFallbackItem(settings)
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
      console.log('🆘 useDrillGenerator: Creating emergency fallback after critical error')
      const emergencyItem = await createEmergencyFallbackItem(settings)
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
async function createEmergencyFallbackItem(settings) {
  console.log('🔍 REAL FALLBACK: Looking for actual forms for:', settings.specificMood, settings.specificTense, 'region:', settings.region)

  // Define target mood/tense outside try block so it's available throughout function
  const targetMood = settings.specificMood || 'indicative'
  const targetTense = settings.specificTense || 'pres'

  try {
    // Import regional filtering function
    const { getAllowedPersonsForRegion } = await import('../../lib/core/curriculumGate.js')
    const allowedPersons = getAllowedPersonsForRegion(settings.region || 'la_general')

    console.log('🌍 Emergency fallback: filtering by region', settings.region, 'allowed persons:', Array.from(allowedPersons))

    // STEP 1: Try to get forms directly from database, bypassing all caching
    const { getAllVerbs } = await import('../../lib/core/verbDataService.js')
    const allVerbs = await getAllVerbs()

    console.log('📚 Direct database access: got', allVerbs.length, 'verbs')

    console.log('🎯 Looking for forms with mood:', targetMood, 'tense:', targetTense)

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

    console.log('✅ Found', matchingForms.length, 'REAL forms for', targetMood, targetTense, 'respecting regional constraints')

    // STEP 3: If we found real forms, use one randomly
    if (matchingForms.length > 0) {
      const selectedForm = matchingForms[Math.floor(Math.random() * matchingForms.length)]

      console.log('🎉 Using REAL form:', selectedForm.lemma, selectedForm.mood, selectedForm.tense, selectedForm.value)

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
      console.log('⚠️ No exact match found, trying', targetMood, 'presente as fallback')

      const moodForms = []
      for (const verb of allVerbs) {
        if (!verb.paradigms) continue

        for (const paradigm of verb.paradigms) {
          if (!paradigm.forms) continue

          for (const form of paradigm.forms) {
            if (form.mood === targetMood && form.tense === 'pres' && form.value) {
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

        console.log('🔄 Using mood fallback:', selectedForm.lemma, selectedForm.mood, selectedForm.tense, 'respecting regional constraints')

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
    console.error('❌ Error in real fallback system:', error)
  }

  // STEP 5: Only if everything fails, show clear error message
  console.error(`💥 CRITICAL: No forms found for ${targetMood}/${targetTense}. Database may be corrupted.`)

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
