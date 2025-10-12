/**
 * EmergencyFallback.js
 *
 * Emergency fallback system for when no valid forms are available.
 * Extracted from generator.js to improve maintainability.
 *
 * Responsibilities:
 * - Provide fallback forms when filtering is too restrictive
 * - Search database directly for matching forms
 * - Create emergency minimal forms as last resort
 * - Log fallback usage for debugging
 */

import { getAllowedCombosForLevel } from './curriculumGate.js'
import { VERB_LOOKUP_MAP } from './optimizedCache.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('EmergencyFallback')

/**
 * Emergency fallback provider
 */
export class EmergencyFallback {
  constructor(config = {}) {
    this.config = config
    this.stats = {
      fallbacksUsed: 0,
      databaseSearches: 0,
      emergencyMinimalUsed: 0
    }
  }

  /**
   * Try to find a fallback form when no eligible forms are found
   * @param {Array} allForms - All available forms
   * @param {Object} preferences - Preferred mood/tense
   * @returns {Object|null} Fallback form or null
   */
  async findFallback(allForms, preferences = {}) {
    const { specificMood, specificTense, level, verbType, practiceMode } = preferences

    logger.info('findFallback', 'Attempting emergency fallback', {
      mood: specificMood,
      tense: specificTense,
      level,
      totalForms: allForms?.length || 0
    })

    this.stats.fallbacksUsed++

    // Strategy 1: Relax filters progressively
    const relaxedFallback = this.tryRelaxedFilters(allForms, preferences)
    if (relaxedFallback) {
      logger.info('findFallback', 'Found relaxed filter fallback')
      return relaxedFallback
    }

    // Strategy 2: Search database directly
    const databaseFallback = await this.tryDatabaseSearch(preferences)
    if (databaseFallback) {
      logger.info('findFallback', 'Found database search fallback')
      this.stats.databaseSearches++
      return databaseFallback
    }

    // Strategy 3: Create emergency minimal form
    logger.warn('findFallback', 'Using emergency minimal form')
    this.stats.emergencyMinimalUsed++
    return this.createEmergencyForm(preferences)
  }

  /**
   * Try relaxed filters
   */
  tryRelaxedFilters(forms, preferences) {
    if (!Array.isArray(forms) || forms.length === 0) {
      return null
    }

    const { specificMood, specificTense, level, verbType, practiceMode } = preferences

    // Apply same specific topic practice logic
    const isSpecificTopicPractice = (practiceMode === 'specific' || practiceMode === 'theme')
    const allowedCombos = isSpecificTopicPractice ? null : getAllowedCombosForLevel(level)

    // Single pass filtering
    let fallback = forms.filter(f => {
      // Level filter (if not specific practice)
      if (!isSpecificTopicPractice && allowedCombos && !allowedCombos.has(`${f.mood}|${f.tense}`)) {
        return false
      }

      // Mood filter
      if (specificMood && f.mood !== specificMood) {
        return false
      }

      // Tense filter
      if (specificTense && f.tense !== specificTense) {
        return false
      }

      // Respect verbType restriction even in fallback
      const isMixedPractice = !verbType || verbType === 'mixed' || verbType === 'all'
      const verb = VERB_LOOKUP_MAP.get(f.lemma)

      if (verb && verbType === 'regular' && !isMixedPractice) {
        if (verb.type !== 'regular') {
          return false
        }
      } else if (verb && verbType === 'irregular' && !isMixedPractice) {
        if (verb.type !== 'irregular') {
          return false
        }
      }

      return true
    })

    // Respect dialect minimally for conjugated forms
    fallback = fallback.filter(f => {
      if (f.mood === 'nonfinite') return true

      // Apply dialect filtering
      const { region } = preferences
      if (region === 'rioplatense') {
        return !['2s_tu', '2p_vosotros'].includes(f.person)
      } else if (region === 'peninsular') {
        return f.person !== '2s_vos'
      } else if (region === 'la_general') {
        return !['2s_vos', '2p_vosotros'].includes(f.person)
      } else {
        return ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p'].includes(f.person)
      }
    })

    // If still empty, drop tense constraint
    if (fallback.length === 0 && specificTense) {
      fallback = forms.filter(f => f.mood === specificMood)
    }

    // If still empty, drop mood constraint
    if (fallback.length === 0 && specificMood) {
      fallback = forms
    }

    // Return random element instead of always first to prevent repetition
    if (fallback.length > 0) {
      const randomIndex = Math.floor(Math.random() * fallback.length)
      return fallback[randomIndex]
    }

    return null
  }

  /**
   * Try searching database directly
   */
  async tryDatabaseSearch(preferences) {
    const { specificMood, specificTense } = preferences

    try {
      logger.info('tryDatabaseSearch', 'Searching database for forms', {
        mood: specificMood || 'any',
        tense: specificTense || 'any'
      })

      // Import verb data service to access raw database
      const { getAllVerbs } = await import('./verbDataService.js')
      const allVerbs = await getAllVerbs()

      logger.debug('tryDatabaseSearch', `Database access: got ${allVerbs.length} verbs`)

      const targetMood = specificMood || 'indicative'
      const targetTense = specificTense || 'pres'

      const matchingForms = []

      // Extract all forms that match the requested mood/tense
      for (const verb of allVerbs) {
        if (!verb.paradigms) continue

        for (const paradigm of verb.paradigms) {
          if (!paradigm.forms) continue

          for (const form of paradigm.forms) {
            if (form.mood === targetMood && form.tense === targetTense && form.value) {
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

      logger.info('tryDatabaseSearch', `Found ${matchingForms.length} real forms for ${targetMood}/${targetTense}`)

      if (matchingForms.length > 0) {
        const selectedForm = matchingForms[Math.floor(Math.random() * matchingForms.length)]
        logger.info('tryDatabaseSearch', 'Using REAL database form', {
          lemma: selectedForm.lemma,
          mood: selectedForm.mood,
          tense: selectedForm.tense,
          value: selectedForm.value
        })
        return selectedForm
      }

      // If no exact match, try relaxing tense but keeping mood
      if (targetTense !== 'pres') {
        logger.info('tryDatabaseSearch', `No ${targetTense} found, trying ${targetMood}/presente as fallback`)

        const moodForms = []
        for (const verb of allVerbs) {
          if (!verb.paradigms) continue

          for (const paradigm of verb.paradigms) {
            if (!paradigm.forms) continue

            for (const form of paradigm.forms) {
              if (form.mood === targetMood && form.tense === 'pres' && form.value) {
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

        if (moodForms.length > 0) {
          const selectedForm = moodForms[Math.floor(Math.random() * moodForms.length)]
          logger.info('tryDatabaseSearch', 'Using mood fallback', {
            lemma: selectedForm.lemma,
            mood: selectedForm.mood,
            tense: selectedForm.tense,
            value: selectedForm.value
          })
          return selectedForm
        }
      }
    } catch (error) {
      logger.error('tryDatabaseSearch', 'Error accessing database', error)
    }

    return null
  }

  /**
   * Create emergency minimal form
   */
  createEmergencyForm(preferences) {
    const { specificMood, specificTense } = preferences

    logger.error('createEmergencyForm', 'CRITICAL: No forms found, using emergency', {
      mood: specificMood || 'any',
      tense: specificTense || 'any'
    })

    return {
      lemma: 'ERROR',
      mood: specificMood || 'ERROR',
      tense: specificTense || 'ERROR',
      person: '1s',
      value: `No ${specificTense || 'forms'} available`,
      type: 'error'
    }
  }

  /**
   * Get fallback statistics
   */
  getStats() {
    return {
      ...this.stats
    }
  }
}

/**
 * Factory function to create an emergency fallback provider
 * @param {Object} config - Configuration object
 * @returns {EmergencyFallback} Fallback provider instance
 */
export function createEmergencyFallback(config = {}) {
  return new EmergencyFallback(config)
}
