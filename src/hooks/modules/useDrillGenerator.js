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

import { useState, useCallback } from 'react'
import { useSettings } from '../../state/settings.js'
import { getDueItems } from '../../lib/progress/srs.js'
import { gateDueItemsByCurriculum } from '../../lib/core/curriculumGate.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
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
  generateAllFormsForRegion
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

/**
 * Specialized hook for drill item generation
 * @returns {Object} - Generator functions and state
 */
export const useDrillGenerator = () => {
  const settings = useSettings()
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGeneratedItem, setLastGeneratedItem] = useState(null)

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
      logger.info('generateNextItem', 'Starting item generation', {
        verbType: settings.verbType,
        selectedFamily: settings.selectedFamily,
        practiceMode: settings.practiceMode,
        specificMood: settings.specificMood,
        specificTense: settings.specificTense,
        level: settings.level,
        excludedItem: itemToExclude?.lemma,
        doubleActive: settings.doubleActive
      })
      
      // Generar formas dinámicamente basado en configuración del usuario
      const allFormsForRegion = await generateAllFormsForRegion(settings.region || 'la_general', settings)
      
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
      const isSpecific = (settings.practiceMode === 'specific' || settings.practiceMode === 'theme') && 
                        settings.specificMood && settings.specificTense
      const specificConstraints = {
        isSpecific,
        specificMood: isSpecific ? settings.specificMood : null,
        specificTense: isSpecific ? settings.specificTense : null
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
          // If even mixed fallback failed, abort
          return null
        }
      }

      let nextForm = null
      let selectionMethod = 'standard'

      // Tier 1: SRS due items
      const userId = getCurrentUserId()
      if (userId) {
        let dueCells = await getDueItems(userId, new Date())
        dueCells = gateDueItemsByCurriculum(dueCells, settings)
        dueCells = filterDueForSpecific(dueCells, specificConstraints)
        
        const pickFromDue = dueCells.find(Boolean)
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
          const recommendation = await getNextRecommendedItem(userId, settings)
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
        nextForm = await chooseNext({ forms: eligibleForms, history, currentItem: itemToExclude })
        selectionMethod = 'standard_generator'
        
        logger.debug('generateNextItem', 'Standard generator used', {
          eligibleFormsCount: eligibleForms.length
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
          setLastGeneratedItem(mixedFallbackItem)
          return mixedFallbackItem
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
      return null

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
      return null
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
