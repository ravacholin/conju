import { useSettings, PRACTICE_MODES } from '../../state/settings.js'
import { categorizeVerb } from '../data/irregularFamilies.js'
import { expandSimplifiedGroup } from '../data/simplifiedFamilyGroups.js'
import { shouldFilterVerbByLevel } from './levelVerbFiltering.js'
import { isRegularFormForMood, isRegularNonfiniteForm, hasIrregularParticiple as HAS_IRREGULAR_PARTICIPLE } from './conjugationRules.js'
import { levelPrioritizer as LEVEL_PRIORITIZER, getWeightedFormsSelection } from './levelDrivenPrioritizer.js'
import { gateFormsByCurriculumAndDialect, getAllowedCombosForLevel as GET_ALLOWED_COMBOS } from './curriculumGate.js'
import { varietyEngine } from './advancedVarietyEngine.js'
import { getPersonWeightsForLevel, applyLevelFormWeighting } from './practicePolicy.js'
import {
  isIrregularInTense,
  hasAnyIrregularTense as HAS_ANY_IRREGULAR_TENSE,
  getEffectiveVerbType,
  shouldTargetIrregularForSettings as SHOULD_TARGET_IRREGULAR_FOR_SETTINGS
} from '../utils/irregularityUtils.js'

// Extracted services for cleaner architecture
import { filterEligibleForms, createFallbackPool, excludeCurrentItem } from './FormFilterService.js'
import { selectForm } from './FormSelectorService.js'

// Imports optimizados
import {
  VERB_LOOKUP_MAP,
  FORM_LOOKUP_MAP,
  formFilterCache,
  warmupCaches as WARMUP_CACHES,
  clearAllCaches,
  initializeMaps
} from './optimizedCache.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('core:generator')
const isDev = import.meta?.env?.DEV

// Quiet debug logging during tests; keep in dev runtime
const dbg = (...args) => { if (isDev && !import.meta?.env?.VITEST) logger.debug('dbg', ...args) }

// Ensure maps are initialized
async function ensureMapsInitialized() {
  if (VERB_LOOKUP_MAP.size === 0) {
    try {
      await initializeMaps()
    } catch (error) {
      logger.error('ensureMapsInitialized', 'Failed to initialize verb maps', error)
      throw new Error('Generator cannot function without initialized verb maps')
    }
  }
}

// CRITICAL FIX: Clear corrupted cache data from refactoring
// This was caused by incompatible compression format changes
function clearCorruptedCache() {
  try {
    if (typeof localStorage !== 'undefined') {
      // Clear corrupted form filter cache
      localStorage.removeItem('formFilterCache')
      // Clear corrupted verb lookup cache
      localStorage.removeItem('verbLookupCache')
      if (isDev) {
        logger.info('clearCorruptedCache', 'Cleared corrupted cache from localStorage')
      }
    }
  } catch (error) {
    logger.warn('clearCorruptedCache', 'Failed to clear corrupted cache', error)
  }
}

// Clear corrupted cache on module load (only once per session)
if (typeof window !== 'undefined' && !window.__generatorCacheCleared) {
  clearCorruptedCache()
  window.__generatorCacheCleared = true
}

// Fast lookups (ahora usando cache optimizado)
const LEMMA_TO_VERB = VERB_LOOKUP_MAP
// Use canonical gate from curriculumGate (handles Spanish/English key normalization)
const getAllowedCombosForLevel = (level) => GET_ALLOWED_COMBOS(level)

const REGULAR_MOOD_MEMO = new Map() // key: lemma|mood|tense|person|value
const REGULAR_NONFINITE_MEMO = new Map() // key: lemma|tense|value

const VALID_LEVELS = new Set(['A1','A2','B1','B2','C1','C2','ALL'])
const VALID_PRACTICE_MODES = new Set(['mixed','specific','theme','all'])
const VALID_VERB_TYPES = new Set(['all','regular','irregular','mixed'])
const VALID_REGIONS = new Set(['rioplatense','la_general','peninsular'])

// MCER Level verb type restrictions
const levelVerbRestrictions = {
  'A1': { regular: true, irregular: true },
  'A2': { regular: true, irregular: true },
  'B1': { regular: true, irregular: true },
  'B2': { regular: true, irregular: true },
  'C1': { regular: true, irregular: true }, // Allow all verb types for C1 (was incorrectly restricted)
  'C2': { regular: true, irregular: true },
  'ALL': { regular: true, irregular: true } // Allow all verb types for ALL level
}

function isVerbTypeAllowedForLevel(verbType, level) {
  const restrictions = levelVerbRestrictions[level]
  if (!restrictions) return true // Default to allowing all if level not found
  return restrictions[verbType] || false
}

// New helper function for per-tense verb filtering
function IS_VERB_ALLOWED_FOR_TENSE_AND_LEVEL(verb, tense, verbType, level) {
  // Check level restrictions first
  const effectiveVerbType = getEffectiveVerbType(verb)
  if (!isVerbTypeAllowedForLevel(effectiveVerbType, level)) {
    return false
  }
  
  // If practicing specific verb type, check tense-specific irregularity
  if (verbType === 'irregular') {
    return isIrregularInTense(verb, tense)
  } else if (verbType === 'regular') {
    return !isIrregularInTense(verb, tense)
  }
  
  // For 'all' or undefined verbType, allow all
  return true
}

export async function chooseNext({forms, history: _history, currentItem, sessionSettings}){
  // Ensure maps are initialized before proceeding
  await ensureMapsInitialized()

  // Support passing a promise that resolves to forms (common in async builders)
  let resolvedForms
  try {
    resolvedForms = await forms
  } catch (error) {
    logger.error('chooseNext', 'Failed to resolve forms promise', error)
    return null
  }

  // CRITICAL FIX: Validate forms is an array
  // Cache no longer compresses data - it uses transparent JSON serialization
  if (!Array.isArray(resolvedForms)) {
    logger.error('chooseNext', 'Invalid forms parameter - not an array', {
      type: typeof forms,
      isNull: forms === null,
      isCompressed: forms?.__compressed === true
    })

    // If it's still compressed data from old cache, clear it and return null
    if (forms && typeof forms === 'object' && forms.__compressed === true) {
      logger.warn('chooseNext', 'Detected old compressed format - clearing cache')
      clearAllCaches()
    }

    return null
  }

  // Ensure we operate on the resolved array from this point
  forms = resolvedForms

  // Additional validation: ensure forms has elements
  if (forms.length === 0) {
    logger.warn('chooseNext', 'Empty forms array provided')
    return null
  }

  // Use sessionSettings if provided, otherwise fallback to global settings
  const allSettings = sessionSettings || useSettings.getState()
  const {
    level: rawLevel, useVoseo, useTuteo, useVosotros,
    practiceMode: rawPracticeMode, specificMood, specificTense, practicePronoun, verbType: rawVerbType,
    currentBlock, selectedFamily, region: rawRegion, enableFuturoSubjProd, allowedLemmas,
    cameFromTema,
    enableC2Conmutacion, conmutacionSeq, conmutacionIdx, rotateSecondPerson,
    nextSecondPerson, cliticsPercent, enableProgressIntegration,
    userLevel, levelPracticeMode
  } = allSettings

  const level = VALID_LEVELS.has(rawLevel) ? rawLevel : 'B1'
  const practiceMode = VALID_PRACTICE_MODES.has(rawPracticeMode) ? rawPracticeMode : 'mixed'
  const verbType = VALID_VERB_TYPES.has(rawVerbType) ? rawVerbType : 'all'
  const region = VALID_REGIONS.has(rawRegion) ? rawRegion : 'la_general'

  // Determine effective level filtering based on new practice mode system
  const effectiveUserLevel = userLevel || 'A2'
  const effectiveLevelPracticeMode = levelPracticeMode || PRACTICE_MODES.BY_LEVEL
  const shouldApplyLevelFiltering = effectiveLevelPracticeMode === PRACTICE_MODES.BY_LEVEL
  const levelForFiltering = shouldApplyLevelFiltering ? level : 'ALL'
  


  
  
  
  // Crear cache key para este filtrado
  // Include region and allowedLemmas signature in the cache key to avoid stale pools
  const allowedSig = (() => {
    try {
      if (!allowedLemmas) return 'none'
      // Create a compact, deterministic signature of the allowed lemmas set
      const arr = Array.from(allowedLemmas)
      arr.sort()
      return `len:${arr.length}|${arr.slice(0, 20).join(',')}`
    } catch {
      return 'err'
    }
  })()

  const filterKey = `filter|${level}|${region}|${useVoseo}|${useTuteo}|${useVosotros}|${practiceMode}|${specificMood}|${specificTense}|${practicePronoun}|${verbType}|${selectedFamily}|${currentBlock?.id || 'none'}|allowed:${allowedSig}|levelMode:${effectiveLevelPracticeMode}|userLevel:${effectiveUserLevel}`

  // CACHE CLEARING: Force fresh calculation for specific practice navigation from progress module
  if (practiceMode === 'specific' && specificMood && specificTense) {
    formFilterCache.delete(filterKey)
  }

  // Intentar obtener del cache
  let eligible = formFilterCache.get(filterKey)

  if (!eligible) {
    // Use FormFilterService for all filtering logic
    const filterContext = {
      verbLookupMap: VERB_LOOKUP_MAP,
      categorizeVerb,
      expandSimplifiedGroup,
      shouldFilterVerbByLevel,
      getAllowedCombosForLevel
    }

    eligible = filterEligibleForms(forms, allSettings, filterContext)

    // Guardar en cache para futuros usos - ensure we only cache arrays
    if (Array.isArray(eligible)) {
      formFilterCache.set(filterKey, eligible)
    } else {
      logger.warn('Not caching non-array eligible value')
      eligible = []
      formFilterCache.set(filterKey, eligible)
    }
  }


  // If no eligible forms remain, try emergency fallbacks instead of failing
  if (!eligible) {
    eligible = []
  }

  // Exclude the exact same item from the list of candidates using service
  eligible = excludeCurrentItem(eligible, currentItem, practiceMode)

  // Defensive check: ensure eligible is an array before calling .map()
  if (!Array.isArray(eligible)) {
    logger.warn('eligible is not an array - resetting to empty')
    // Reset to empty array to prevent crash
    eligible = []
  }

  // Show which persons were included
  const INCLUDED_PERSONS = [...new Set(eligible.map(f => f.person))]
  
  // Check if we have any eligible forms
  if (eligible.length === 0) {
    if (practiceMode === 'specific' && specificMood && specificTense) {
      const detail = `${specificMood}/${specificTense}`
      logger.error('chooseNext', `No eligible forms found for specific practice ${detail}`, {
        mood: specificMood,
        tense: specificTense,
        verbType,
        region
      })
      throw new Error(`No hay formas disponibles para ${detail}`)
    }

    // Use FormFilterService to create fallback pool
    const fallbackContext = {
      verbLookupMap: VERB_LOOKUP_MAP
    }
    const fallback = createFallbackPool(forms, allSettings, fallbackContext)

    // FIX: Return random element instead of always first to prevent repetition
    if (fallback.length > 0) {
      const randomIndex = Math.floor(Math.random() * fallback.length)
      return fallback[randomIndex]
    }

    // ULTIMATE FALLBACK: If even this fails, use emergency fallback
    logger.error('All fallback strategies failed, using emergency fallback')
    return await createEmergencyFallback(specificMood, specificTense, forms)
  }

  // Use FormSelectorService for all selection logic
  const selectorContext = {
    verbLookupMap: VERB_LOOKUP_MAP
  }

  return await selectForm(eligible, allSettings, selectorContext)
}

// Helper function to find a verb by its lemma
function FIND_VERB_BY_LEMMA(lemma) {
  return VERB_LOOKUP_MAP.get(lemma)
}



// Helper function to determine if a verb is irregular (fallback)
function IS_IRREGULAR_VERB(lemma) {
  const irregularVerbs = [
    'ser', 'estar', 'tener', 'hacer', 'ir', 'venir', 'decir', 'dar', 'ver', 'saber',
    'poder', 'querer', 'poner', 'salir', 'traer', 'caer', 'oir', 'valer', 'caber',
    'haber', 'satisfacer', 'hacer', 'deshacer', 'rehacer', 'contrahacer'
  ]
  return irregularVerbs.includes(lemma)
}


function ACC(f, history){
  const k = key(f); const h = history[k]||{seen:0, correct:0}
  return (h.correct + 1) / (h.seen + 2)
}
function key(f){ return `${f.mood}:${f.tense}:${f.person}:${f.value}` }

/**
 * PROGRESS SYSTEM INTEGRATION: Validates if a mood/tense combination has available forms
 * This is crucial for the progress menu to avoid "No forms available" errors
 * @param {string} mood - Target mood (indicative, subjunctive, etc.)
 * @param {string} tense - Target tense (pres, pretIndef, etc.)
 * @param {Object} settings - User settings object with level, region, etc.
 * @param {Array} allForms - Array of all available forms for the region
 * @returns {boolean} true if combination has available forms, false otherwise
 */
export function validateMoodTenseAvailability(mood, tense, settings, allForms) {
  try {
    // Get user settings with defaults
    const level = settings.level || 'B1'
    const region = settings.region || 'rioplatense'
    const useVoseo = settings.useVoseo !== false
    const useTuteo = settings.useTuteo !== false
    const useVosotros = settings.useVosotros !== false
    
    
    // Step 1: Check if combination is allowed for the user's level
    const allowedCombos = getAllowedCombosForLevel(level)
    const comboKey = `${mood}|${tense}`
    if (!allowedCombos.has(comboKey)) {
      return false
    }
    
    // Step 2: Filter forms that match the criteria
    const matchingForms = allForms.filter(f => {
      // Must match mood and tense
      if (f.mood !== mood || f.tense !== tense) return false
      
      // Must have a valid value
      if (!f.value && !f.form) return false
      
      // Apply dialect filtering
      if (region === 'rioplatense') {
        if (!useVoseo && f.person === '2s_vos') return false
        // Fixed: When using voseo, filter out tuteo forms (mutually exclusive)
        if (useVoseo && f.person === '2s_tu') return false
        if (!useVoseo && !useTuteo && f.person === '2s_tu') return false
        if (f.person === '2p_vosotros') return false
      } else if (region === 'peninsular') {
        if (f.person === '2s_vos') return false
        if (!useVosotros && f.person === '2p_vosotros') return false
      } else if (region === 'la_general') {
        if (f.person === '2s_vos' || f.person === '2p_vosotros') return false
      }
      
      return true
    })
    
    const isAvailable = matchingForms.length > 0
    
    return isAvailable
  } catch (error) {
    logger.error('Error validating mood/tense availability', error)
    return false
  }
}

/**
 * Creates an emergency fallback item that always works
 * This tries to find real forms from verb data that match the user's request
 * @param {string} preferredMood - Preferred mood if possible
 * @param {string} preferredTense - Preferred tense if possible
 * @param {Array} allAvailableForms - All forms available from the main generator call
 * @returns {Object} A valid drill item
 */
async function createEmergencyFallback(preferredMood = null, preferredTense = null, allAvailableForms = null) {
  logger.debug(`Emergency fallback: Looking for ${preferredMood || 'any mood'}/${preferredTense || 'any tense'}`)

  // STEP 1: First, try the provided forms if they exist and are valid
  if (Array.isArray(allAvailableForms) && allAvailableForms.length > 0) {
    // Filter for exact matches
    let exactMatches = allAvailableForms.filter(f => {
      if (!f.value || !f.lemma) return false
      if (preferredMood && f.mood !== preferredMood) return false
      if (preferredTense && f.tense !== preferredTense) return false
      return true
    })

    if (exactMatches.length > 0) {
      const selectedForm = exactMatches[Math.floor(Math.random() * exactMatches.length)]
      logger.debug('Found exact match in available forms', { lemma: selectedForm.lemma, mood: selectedForm.mood, tense: selectedForm.tense })
      return selectedForm
    }

    // Try mood-only match
    if (preferredMood) {
      const moodMatches = allAvailableForms.filter(f =>
        f.value && f.lemma && f.mood === preferredMood
      )
      if (moodMatches.length > 0) {
        const selectedForm = moodMatches[Math.floor(Math.random() * moodMatches.length)]
        logger.debug('Found mood match in available forms', { lemma: selectedForm.lemma, mood: selectedForm.mood })
        return selectedForm
      }
    }
  }

  // STEP 2: If no good matches in available forms, search database directly
  try {
    // Import verb data service to access raw database
    const { getAllVerbs } = await import('./verbDataService.js')
    const allVerbs = await getAllVerbs()

    const targetMood = preferredMood || 'indicative'
    const targetTense = preferredTense || 'pres'

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

    if (matchingForms.length > 0) {
      const selectedForm = matchingForms[Math.floor(Math.random() * matchingForms.length)]
      logger.debug('Using database form', { lemma: selectedForm.lemma, count: matchingForms.length })
      return selectedForm
    }

    // If no exact match, try relaxing tense but keeping mood
    if (targetTense !== 'pres') {
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
        logger.warn('Using mood fallback with present tense', { lemma: selectedForm.lemma })
        return selectedForm
      }
    }

  } catch (error) {
    logger.error('Error accessing database in emergency fallback', error)
  }

  // STEP 3: Only if everything fails, show error
  logger.error(`CRITICAL: No forms found for ${preferredMood || 'any'}/${preferredTense || 'any'}. Database may be corrupted.`)

  return {
    lemma: 'ERROR',
    mood: preferredMood || 'ERROR',
    tense: preferredTense || 'ERROR',
    person: '1s',
    value: `No ${preferredTense || 'forms'} available`,
    type: 'error'
  }
}
