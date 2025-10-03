import { gateFormsByCurriculumAndDialect, getAllowedCombosForLevel } from './curriculumGate.js'
import { getFormsForRegion } from './verbDataService.js'
import { createLogger } from '../utils/logger.js'

// Create logger directly
const logger = createLogger('Eligibility')

// Enhanced error handling imports - initialize properly
let handleErrorWithRecovery, getIntegrityGuard

// Initialize error handling asynchronously
function initializeErrorHandling() {
  if (!handleErrorWithRecovery) {
    import('./AutoRecoverySystem.js').then(module => {
      handleErrorWithRecovery = module.handleErrorWithRecovery
    }).catch(() => {
      handleErrorWithRecovery = (error, context) => {
        logger.warn('handleErrorWithRecovery', 'AutoRecovery not available, using fallback', { error: error.message, context })
      }
    })
  }
}

// Initialize on first use
initializeErrorHandling()

// Initialize DataIntegrityGuard asynchronously
function initializeIntegrityGuard() {
  if (!getIntegrityGuard) {
    import('./DataIntegrityGuard.js').then(module => {
      getIntegrityGuard = module.getIntegrityGuard
    }).catch(() => {
      getIntegrityGuard = () => null
    })
  }
}

initializeIntegrityGuard()

// Enhanced returns forms eligible for the given settings and precomputed region forms
export function getEligibleFormsForSettings(allFormsForRegion, settings) {
  if (!Array.isArray(allFormsForRegion)) {
    logger.warn('getEligibleFormsForSettings', 'Invalid allFormsForRegion parameter - not an array', {
      allFormsForRegion: typeof allFormsForRegion,
      settings
    })
    return []
  }

  if (allFormsForRegion.length === 0) {
    logger.debug('getEligibleFormsForSettings', 'Empty forms array provided')
    return []
  }

  if (!settings || typeof settings !== 'object') {
    logger.warn('getEligibleFormsForSettings', 'Invalid settings parameter', { settings })
    settings = {} // fallback to empty settings
  }

  try {
    // Apply curriculum and dialect filtering with comprehensive error handling
    const eligibleForms = gateFormsByCurriculumAndDialect(allFormsForRegion, settings)

    if (!Array.isArray(eligibleForms)) {
      logger.error('getEligibleFormsForSettings', 'gateFormsByCurriculumAndDialect returned invalid result', {
        result: typeof eligibleForms,
        inputFormsCount: allFormsForRegion.length,
        settings
      })

      // Trigger recovery
      handleErrorWithRecovery(new Error('Invalid result from curriculum gating'), {
        component: 'eligibility',
        function: 'getEligibleFormsForSettings',
        inputFormsCount: allFormsForRegion.length,
        severity: 'high'
      })

      // Return original forms as fallback
      logger.warn('getEligibleFormsForSettings', 'Returning unfiltered forms as fallback')
      return allFormsForRegion
    }

    // Validate result quality
    const filteringRatio = eligibleForms.length / allFormsForRegion.length
    if (filteringRatio < 0.01 && allFormsForRegion.length > 100) {
      logger.warn('getEligibleFormsForSettings', 'Extremely restrictive filtering detected', {
        originalCount: allFormsForRegion.length,
        eligibleCount: eligibleForms.length,
        filteringRatio: `${(filteringRatio * 100).toFixed(2)}%`,
        settings
      })

      // This might indicate overly restrictive settings
      handleErrorWithRecovery(new Error(`Overly restrictive filtering: ${eligibleForms.length}/${allFormsForRegion.length}`), {
        component: 'eligibility',
        function: 'getEligibleFormsForSettings',
        filteringRatio,
        originalCount: allFormsForRegion.length,
        severity: 'medium'
      })
    }

    // Log successful filtering
    logger.debug('getEligibleFormsForSettings', 'Form filtering completed successfully', {
      originalCount: allFormsForRegion.length,
      eligibleCount: eligibleForms.length,
      filteringRatio: `${(filteringRatio * 100).toFixed(1)}%`
    })

    return eligibleForms

  } catch (error) {
    logger.error('getEligibleFormsForSettings', 'Critical error during form filtering', error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'eligibility',
      function: 'getEligibleFormsForSettings',
      inputFormsCount: allFormsForRegion.length,
      settings,
      severity: 'high'
    })

    // Return original forms as emergency fallback
    logger.warn('getEligibleFormsForSettings', 'Using emergency fallback - returning unfiltered forms')
    return allFormsForRegion
  }
}

// Enhanced returns allowed moods for a level with comprehensive error handling
export function getAllowedMoods(settings) {
  if (!settings || typeof settings !== 'object') {
    logger.warn('getAllowedMoods', 'Invalid settings parameter', { settings })
    settings = {} // fallback to empty settings
  }

  try {
    const { level, practiceMode, cameFromTema } = settings

    // Theme shows all; Specific only shows all when coming explicitly from Tema
    if (practiceMode === 'theme' || (practiceMode === 'specific' && cameFromTema === true)) {
      const allMoods = ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
      logger.debug('getAllowedMoods', 'Returning all moods for theme/specific practice', {
        practiceMode,
        cameFromTema,
        moodCount: allMoods.length
      })
      return allMoods
    }

    // Get level-specific combinations with error handling
    const effectiveLevel = level || 'A1'
    let combos

    try {
      combos = getAllowedCombosForLevel(effectiveLevel)
    } catch (combosError) {
      logger.error('getAllowedMoods', `Error getting combinations for level ${effectiveLevel}`, combosError)

      // Trigger recovery
      handleErrorWithRecovery(combosError, {
        component: 'eligibility',
        function: 'getAllowedMoods',
        level: effectiveLevel,
        severity: 'medium'
      })

      // Fallback to A1 level
      logger.warn('getAllowedMoods', 'Falling back to A1 level combinations')
      try {
        combos = getAllowedCombosForLevel('A1')
      } catch (fallbackError) {
        logger.error('getAllowedMoods', 'Failed to get even A1 combinations', fallbackError)

        // Emergency fallback - return basic moods
        const emergencyMoods = ['indicative']
        logger.warn('getAllowedMoods', 'Using emergency fallback moods')
        return emergencyMoods
      }
    }

    if (!Array.isArray(combos)) {
      logger.error('getAllowedMoods', 'getAllowedCombosForLevel returned invalid result', {
        level: effectiveLevel,
        result: typeof combos
      })

      // Trigger recovery
      handleErrorWithRecovery(new Error(`Invalid combos result for level ${effectiveLevel}`), {
        component: 'eligibility',
        function: 'getAllowedMoods',
        level: effectiveLevel,
        severity: 'high'
      })

      // Emergency fallback
      return ['indicative']
    }

    if (combos.length === 0) {
      logger.warn('getAllowedMoods', `No combinations found for level ${effectiveLevel}`)

      // Trigger recovery
      handleErrorWithRecovery(new Error(`No combinations for level ${effectiveLevel}`), {
        component: 'eligibility',
        function: 'getAllowedMoods',
        level: effectiveLevel,
        severity: 'medium'
      })

      // Fallback to basic mood
      return ['indicative']
    }

    // Extract moods from combinations with error handling
    const moods = new Set()
    let errorCount = 0

    for (const combo of combos) {
      try {
        if (!combo || typeof combo !== 'string') {
          logger.warn('getAllowedMoods', 'Invalid combo in array', { combo })
          errorCount++
          continue
        }

        const parts = combo.split('|')
        if (parts.length === 0) {
          logger.warn('getAllowedMoods', 'Empty combo after split', { combo })
          errorCount++
          continue
        }

        const mood = parts[0]
        if (mood) {
          moods.add(mood)
        } else {
          logger.warn('getAllowedMoods', 'Empty mood in combo', { combo })
          errorCount++
        }
      } catch (comboError) {
        logger.warn('getAllowedMoods', `Error processing combo: ${combo}`, comboError)
        errorCount++
      }
    }

    // Check for excessive errors
    if (errorCount > combos.length * 0.3) {
      logger.warn('getAllowedMoods', 'High error rate processing combinations', {
        errorRate: `${((errorCount / combos.length) * 100).toFixed(1)}%`,
        errorCount,
        totalCombos: combos.length,
        level: effectiveLevel
      })

      // Trigger recovery for potential data corruption
      handleErrorWithRecovery(new Error(`High error rate in mood extraction: ${errorCount}/${combos.length}`), {
        component: 'eligibility',
        function: 'getAllowedMoods',
        errorRate: errorCount / combos.length,
        level: effectiveLevel,
        severity: 'medium'
      })
    }

    const moodArray = Array.from(moods)

    // Validate we have at least some moods
    if (moodArray.length === 0) {
      logger.error('getAllowedMoods', `No valid moods extracted for level ${effectiveLevel}`, {
        combosCount: combos.length,
        errorCount
      })

      // Trigger recovery
      handleErrorWithRecovery(new Error(`No valid moods for level ${effectiveLevel}`), {
        component: 'eligibility',
        function: 'getAllowedMoods',
        level: effectiveLevel,
        combosCount: combos.length,
        severity: 'high'
      })

      // Emergency fallback
      return ['indicative']
    }

    logger.debug('getAllowedMoods', `Retrieved moods for level ${effectiveLevel}`, {
      level: effectiveLevel,
      moodCount: moodArray.length,
      moods: moodArray,
      errorCount
    })

    return moodArray

  } catch (error) {
    logger.error('getAllowedMoods', 'Critical error getting allowed moods', error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'eligibility',
      function: 'getAllowedMoods',
      settings,
      severity: 'high'
    })

    // Emergency fallback
    logger.warn('getAllowedMoods', 'Using emergency fallback - returning indicative mood only')
    return ['indicative']
  }
}

// Enhanced returns allowed tenses for a given mood with comprehensive error handling
export function getAllowedTensesForMood(settings, mood) {
  if (!settings || typeof settings !== 'object') {
    logger.warn('getAllowedTensesForMood', 'Invalid settings parameter', { settings, mood })
    settings = {} // fallback to empty settings
  }

  if (!mood || typeof mood !== 'string') {
    logger.warn('getAllowedTensesForMood', 'Invalid mood parameter', { mood, settings })
    return []
  }

  try {
    const { level, practiceMode, cameFromTema } = settings

    // Theme shows all; Specific only shows all when coming explicitly from Tema
    if (practiceMode === 'theme' || (practiceMode === 'specific' && cameFromTema === true)) {
      const tenseMap = {
        indicative: ['pres','pretPerf','pretIndef','impf','plusc','fut','futPerf'],
        subjunctive: ['subjPres','subjImpf','subjPerf','subjPlusc'],
        imperative: ['impAff','impNeg','impMixed'],
        conditional: ['cond','condPerf'],
        nonfinite: ['ger','part','nonfiniteMixed']
      }

      const tenses = tenseMap[mood] || []

      if (tenses.length === 0) {
        logger.warn('getAllowedTensesForMood', `No tenses found for mood ${mood} in theme mode`)

        // Trigger recovery for unknown mood
        handleErrorWithRecovery(new Error(`Unknown mood in theme mode: ${mood}`), {
          component: 'eligibility',
          function: 'getAllowedTensesForMood',
          mood,
          practiceMode,
          severity: 'medium'
        })

        return []
      }

      logger.debug('getAllowedTensesForMood', `Retrieved all tenses for mood ${mood} in theme mode`, {
        mood,
        practiceMode,
        tenseCount: tenses.length
      })

      return tenses
    }

    // Get level-specific combinations with error handling
    const effectiveLevel = level || 'A1'
    let combos

    try {
      combos = getAllowedCombosForLevel(effectiveLevel)
    } catch (combosError) {
      logger.error('getAllowedTensesForMood', `Error getting combinations for level ${effectiveLevel}`, combosError)

      // Trigger recovery
      handleErrorWithRecovery(combosError, {
        component: 'eligibility',
        function: 'getAllowedTensesForMood',
        level: effectiveLevel,
        mood,
        severity: 'medium'
      })

      // Fallback to A1 level
      logger.warn('getAllowedTensesForMood', 'Falling back to A1 level combinations')
      try {
        combos = getAllowedCombosForLevel('A1')
      } catch (fallbackError) {
        logger.error('getAllowedTensesForMood', 'Failed to get even A1 combinations', fallbackError)

        // Emergency fallback based on mood
        const emergencyTenses = mood === 'indicative' ? ['pres'] : []
        logger.warn('getAllowedTensesForMood', `Using emergency fallback tenses for mood ${mood}`)
        return emergencyTenses
      }
    }

    if (!Array.isArray(combos)) {
      logger.error('getAllowedTensesForMood', 'getAllowedCombosForLevel returned invalid result', {
        level: effectiveLevel,
        mood,
        result: typeof combos
      })

      // Trigger recovery
      handleErrorWithRecovery(new Error(`Invalid combos result for level ${effectiveLevel}`), {
        component: 'eligibility',
        function: 'getAllowedTensesForMood',
        level: effectiveLevel,
        mood,
        severity: 'high'
      })

      // Emergency fallback
      return mood === 'indicative' ? ['pres'] : []
    }

    if (combos.length === 0) {
      logger.warn('getAllowedTensesForMood', `No combinations found for level ${effectiveLevel}`)

      // Trigger recovery
      handleErrorWithRecovery(new Error(`No combinations for level ${effectiveLevel}`), {
        component: 'eligibility',
        function: 'getAllowedTensesForMood',
        level: effectiveLevel,
        mood,
        severity: 'medium'
      })

      // Fallback to basic tense if indicative mood
      return mood === 'indicative' ? ['pres'] : []
    }

    // Extract tenses for the specific mood with error handling
    const tenses = new Set()
    let errorCount = 0
    let foundMoodCombos = 0

    for (const combo of combos) {
      try {
        if (!combo || typeof combo !== 'string') {
          logger.warn('getAllowedTensesForMood', 'Invalid combo in array', { combo, mood })
          errorCount++
          continue
        }

        const parts = combo.split('|')
        if (parts.length < 2) {
          logger.warn('getAllowedTensesForMood', 'Incomplete combo format', { combo, mood })
          errorCount++
          continue
        }

        const [m, t] = parts
        if (m === mood) {
          foundMoodCombos++
          if (t) {
            tenses.add(t)
          } else {
            logger.warn('getAllowedTensesForMood', 'Empty tense in combo', { combo, mood })
            errorCount++
          }
        }
      } catch (comboError) {
        logger.warn('getAllowedTensesForMood', `Error processing combo: ${combo}`, comboError)
        errorCount++
      }
    }

    // Check for excessive errors
    if (errorCount > combos.length * 0.3) {
      logger.warn('getAllowedTensesForMood', 'High error rate processing combinations', {
        errorRate: `${((errorCount / combos.length) * 100).toFixed(1)}%`,
        errorCount,
        totalCombos: combos.length,
        mood,
        level: effectiveLevel
      })

      // Trigger recovery for potential data corruption
      handleErrorWithRecovery(new Error(`High error rate in tense extraction: ${errorCount}/${combos.length}`), {
        component: 'eligibility',
        function: 'getAllowedTensesForMood',
        errorRate: errorCount / combos.length,
        mood,
        level: effectiveLevel,
        severity: 'medium'
      })
    }

    const tenseArray = Array.from(tenses)

    // Check if we found any combinations for this mood
    if (foundMoodCombos === 0) {
      logger.warn('getAllowedTensesForMood', `No combinations found for mood ${mood} at level ${effectiveLevel}`, {
        mood,
        level: effectiveLevel,
        totalCombos: combos.length
      })

      // This might be expected for some mood/level combinations
      return []
    }

    // Validate we have at least some tenses for this mood
    if (tenseArray.length === 0 && foundMoodCombos > 0) {
      logger.error('getAllowedTensesForMood', `No valid tenses extracted for mood ${mood}`, {
        mood,
        level: effectiveLevel,
        foundCombos: foundMoodCombos,
        errorCount
      })

      // Trigger recovery
      handleErrorWithRecovery(new Error(`No valid tenses for mood ${mood} at level ${effectiveLevel}`), {
        component: 'eligibility',
        function: 'getAllowedTensesForMood',
        mood,
        level: effectiveLevel,
        foundCombos: foundMoodCombos,
        severity: 'medium'
      })

      // Emergency fallback based on mood
      if (mood === 'indicative') {
        return ['pres']
      }
      return []
    }

    logger.debug('getAllowedTensesForMood', `Retrieved tenses for mood ${mood} at level ${effectiveLevel}`, {
      mood,
      level: effectiveLevel,
      tenseCount: tenseArray.length,
      tenses: tenseArray,
      foundCombos: foundMoodCombos,
      errorCount
    })

    return tenseArray

  } catch (error) {
    logger.error('getAllowedTensesForMood', 'Critical error getting allowed tenses', error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'eligibility',
      function: 'getAllowedTensesForMood',
      settings,
      mood,
      severity: 'high'
    })

    // Emergency fallback
    const emergencyTenses = mood === 'indicative' ? ['pres'] : []
    logger.warn('getAllowedTensesForMood', `Using emergency fallback for mood ${mood}`)
    return emergencyTenses
  }
}

// Enhanced build canonical pool of forms for a given region with comprehensive error handling
export async function buildFormsForRegion(region, settings = {}) {
  if (!region || typeof region !== 'string') {
    logger.warn('buildFormsForRegion', 'Invalid region parameter', { region, settings })
    return []
  }

  if (!settings || typeof settings !== 'object') {
    logger.warn('buildFormsForRegion', 'Invalid settings parameter', { region, settings })
    settings = {} // fallback to empty settings
  }

  try {
    if (region === 'global') {
      logger.debug('buildFormsForRegion', 'Building global region forms by combining rioplatense and peninsular')

      let rioplatenseForms = []
      let peninsularForms = []
      let errorCount = 0

      // Get rioplatense forms with error handling
      try {
        rioplatenseForms = await getFormsForRegion('rioplatense', settings)
        if (!Array.isArray(rioplatenseForms)) {
          logger.error('buildFormsForRegion', 'Invalid rioplatense forms result', {
            result: typeof rioplatenseForms
          })
          rioplatenseForms = []
          errorCount++
        }
      } catch (rioplatenseError) {
        logger.error('buildFormsForRegion', 'Error getting rioplatense forms', rioplatenseError)
        rioplatenseForms = []
        errorCount++

        // Trigger recovery
        handleErrorWithRecovery(rioplatenseError, {
          component: 'eligibility',
          function: 'buildFormsForRegion',
          region: 'rioplatense',
          settings,
          severity: 'medium'
        })
      }

      // Get peninsular forms with error handling
      try {
        peninsularForms = await getFormsForRegion('peninsular', settings)
        if (!Array.isArray(peninsularForms)) {
          logger.error('buildFormsForRegion', 'Invalid peninsular forms result', {
            result: typeof peninsularForms
          })
          peninsularForms = []
          errorCount++
        }
      } catch (peninsularError) {
        logger.error('buildFormsForRegion', 'Error getting peninsular forms', peninsularError)
        peninsularForms = []
        errorCount++

        // Trigger recovery
        handleErrorWithRecovery(peninsularError, {
          component: 'eligibility',
          function: 'buildFormsForRegion',
          region: 'peninsular',
          settings,
          severity: 'medium'
        })
      }

      // Check if we have any forms
      if (rioplatenseForms.length === 0 && peninsularForms.length === 0) {
        logger.error('buildFormsForRegion', 'No forms available from either region for global')

        // Trigger recovery
        handleErrorWithRecovery(new Error('No forms available for global region'), {
          component: 'eligibility',
          function: 'buildFormsForRegion',
          region: 'global',
          settings,
          severity: 'high'
        })

        return []
      }

      // Combine and deduplicate forms with error handling
      try {
        const allForms = [...rioplatenseForms, ...peninsularForms]
        const seen = new Set()
        const out = []
        let processingErrors = 0

        for (const f of allForms) {
          try {
            if (!f || typeof f !== 'object') {
              processingErrors++
              continue
            }

            const person = f.mood === 'nonfinite' ? '' : (f.person || '')
            const key = `${f.lemma || ''}|${f.mood || ''}|${f.tense || ''}|${person}|${f.value || ''}`

            if (seen.has(key)) {
              continue
            }

            seen.add(key)
            out.push(f)
          } catch (formError) {
            logger.warn('buildFormsForRegion', 'Error processing form in global region', formError)
            processingErrors++
          }
        }

        // Check for excessive processing errors
        if (processingErrors > allForms.length * 0.1) {
          logger.warn('buildFormsForRegion', 'High error rate processing global region forms', {
            errorRate: `${((processingErrors / allForms.length) * 100).toFixed(1)}%`,
            processingErrors,
            totalForms: allForms.length
          })

          // Trigger recovery for potential data corruption
          handleErrorWithRecovery(new Error(`High error rate in global region processing: ${processingErrors}/${allForms.length}`), {
            component: 'eligibility',
            function: 'buildFormsForRegion',
            region: 'global',
            errorRate: processingErrors / allForms.length,
            severity: 'medium'
          })
        }

        logger.debug('buildFormsForRegion', 'Global region forms built successfully', {
          rioplatenseCount: rioplatenseForms.length,
          peninsularCount: peninsularForms.length,
          totalBeforeDedup: allForms.length,
          finalCount: out.length,
          duplicatesRemoved: allForms.length - out.length,
          processingErrors,
          errorCount
        })

        return out

      } catch (combineError) {
        logger.error('buildFormsForRegion', 'Error combining global region forms', combineError)

        // Trigger recovery
        handleErrorWithRecovery(combineError, {
          component: 'eligibility',
          function: 'buildFormsForRegion',
          region: 'global',
          rioplatenseCount: rioplatenseForms.length,
          peninsularCount: peninsularForms.length,
          severity: 'high'
        })

        // Return whichever region has more forms as fallback
        const fallbackForms = rioplatenseForms.length >= peninsularForms.length ? rioplatenseForms : peninsularForms
        logger.warn('buildFormsForRegion', `Using fallback region forms (${fallbackForms === rioplatenseForms ? 'rioplatense' : 'peninsular'})`)
        return fallbackForms
      }
    }

    // Single region handling with error handling
    try {
      const forms = await getFormsForRegion(region, settings)

      if (!Array.isArray(forms)) {
        logger.error('buildFormsForRegion', `Invalid forms result for region ${region}`, {
          region,
          result: typeof forms
        })

        // Trigger recovery
        handleErrorWithRecovery(new Error(`Invalid forms result for region ${region}`), {
          component: 'eligibility',
          function: 'buildFormsForRegion',
          region,
          settings,
          severity: 'high'
        })

        return []
      }

      logger.debug('buildFormsForRegion', `Forms built for region ${region}`, {
        region,
        formsCount: forms.length
      })

      return forms

    } catch (singleRegionError) {
      logger.error('buildFormsForRegion', `Error getting forms for region ${region}`, singleRegionError)

      // Trigger recovery
      handleErrorWithRecovery(singleRegionError, {
        component: 'eligibility',
        function: 'buildFormsForRegion',
        region,
        settings,
        severity: 'high'
      })

      return []
    }

  } catch (error) {
    logger.error('buildFormsForRegion', `Critical error building forms for region ${region}`, error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'eligibility',
      function: 'buildFormsForRegion',
      region,
      settings,
      severity: 'high'
    })

    return []
  }
}

// Enhanced one-stop helper: build the pool for region and apply curriculum+dialect gate with comprehensive error handling
export function getEligiblePool(settings) {
  if (!settings || typeof settings !== 'object') {
    logger.warn('getEligiblePool', 'Invalid settings parameter', { settings })
    settings = {} // fallback to empty settings
  }

  try {
    // Extract region with fallback
    const region = settings.region || 'la_general'

    logger.debug('getEligiblePool', 'Building eligible pool', {
      region,
      hasSettings: !!settings
    })

    // Build base forms pool with error handling
    let base
    try {
      base = buildFormsForRegion(region, settings)
    } catch (buildError) {
      logger.error('getEligiblePool', `Error building forms for region ${region}`, buildError)

      // Trigger recovery
      handleErrorWithRecovery(buildError, {
        component: 'eligibility',
        function: 'getEligiblePool',
        region,
        settings,
        severity: 'high'
      })

      // Try fallback to default region
      if (region !== 'la_general') {
        logger.warn('getEligiblePool', `Falling back to la_general region from ${region}`)
        try {
          base = buildFormsForRegion('la_general', settings)
        } catch (fallbackError) {
          logger.error('getEligiblePool', 'Fallback region also failed', fallbackError)
          return []
        }
      } else {
        return []
      }
    }

    if (!Array.isArray(base)) {
      logger.error('getEligiblePool', 'buildFormsForRegion returned invalid result', {
        region,
        result: typeof base
      })

      // Trigger recovery
      handleErrorWithRecovery(new Error(`Invalid base forms result for region ${region}`), {
        component: 'eligibility',
        function: 'getEligiblePool',
        region,
        settings,
        severity: 'high'
      })

      return []
    }

    if (base.length === 0) {
      logger.warn('getEligiblePool', `No base forms found for region ${region}`)

      // This might be expected for some regions/settings combinations
      return []
    }

    // Apply eligibility filtering with error handling
    try {
      const eligible = getEligibleFormsForSettings(base, settings)

      if (!Array.isArray(eligible)) {
        logger.error('getEligiblePool', 'getEligibleFormsForSettings returned invalid result', {
          region,
          baseFormsCount: base.length,
          result: typeof eligible
        })

        // Trigger recovery
        handleErrorWithRecovery(new Error('Invalid eligible forms result'), {
          component: 'eligibility',
          function: 'getEligiblePool',
          region,
          baseFormsCount: base.length,
          severity: 'high'
        })

        // Return base forms as fallback
        logger.warn('getEligiblePool', 'Returning unfiltered base forms as fallback')
        return base
      }

      // Log success statistics
      const filteringRatio = eligible.length / base.length
      logger.debug('getEligiblePool', 'Eligible pool built successfully', {
        region,
        baseFormsCount: base.length,
        eligibleFormsCount: eligible.length,
        filteringRatio: `${(filteringRatio * 100).toFixed(1)}%`
      })

      // Check for concerning filtering results
      if (eligible.length === 0 && base.length > 0) {
        logger.warn('getEligiblePool', 'All forms filtered out - might indicate restrictive settings', {
          region,
          baseFormsCount: base.length,
          settings
        })

        // Trigger recovery for potential configuration issues
        handleErrorWithRecovery(new Error(`All forms filtered out for region ${region}`), {
          component: 'eligibility',
          function: 'getEligiblePool',
          region,
          baseFormsCount: base.length,
          settings,
          severity: 'medium'
        })
      }

      return eligible

    } catch (filteringError) {
      logger.error('getEligiblePool', 'Error during form filtering', filteringError)

      // Trigger recovery
      handleErrorWithRecovery(filteringError, {
        component: 'eligibility',
        function: 'getEligiblePool',
        region,
        baseFormsCount: base.length,
        settings,
        severity: 'high'
      })

      // Return base forms as emergency fallback
      logger.warn('getEligiblePool', 'Using emergency fallback - returning unfiltered base forms')
      return base
    }

  } catch (error) {
    logger.error('getEligiblePool', 'Critical error building eligible pool', error)

    // Trigger recovery system
    handleErrorWithRecovery(error, {
      component: 'eligibility',
      function: 'getEligiblePool',
      settings,
      severity: 'high'
    })

    return []
  }
}
