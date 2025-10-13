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

  // CRITICAL FIX: Validate forms is an array
  // Cache no longer compresses data - it uses transparent JSON serialization
  if (!Array.isArray(forms)) {
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
    // Paso 1: Gate sistemático por curriculum y dialecto
    let pre = gateFormsByCurriculumAndDialect(forms, allSettings)

    
    // Paso 2: Filtros adicionales (valor definido, toggles, pronoun subset)
    eligible = pre.filter(f=>{
      
      
      // Filter out forms with undefined/null values first
      if (!f.value && !f.form) {
        return false
      }
      
      // Level filtering (O(1) with precomputed set)
      // SKIP level filtering for Theme and Specific practice to allow targeted practice
      const isSpecificTopicPractice = (practiceMode === 'theme') || (practiceMode === 'specific')
      if (!isSpecificTopicPractice) {
        // Determine allowed combos: from current block if set, else level
        const allowed = currentBlock && currentBlock.combos && currentBlock.combos.length
          ? new Set(currentBlock.combos.map(c => `${c.mood}|${c.tense}`))
          : getAllowedCombosForLevel(level)
        if(!allowed.has(`${f.mood}|${f.tense}`)) {
          return false
        }
      }
    
    // Gate futuro de subjuntivo por toggle de producción
    if (f.mood === 'subjunctive' && (f.tense === 'subjFut' || f.tense === 'subjFutPerf')) {
      if (!enableFuturoSubjProd) {
        return false
      }
    }

    // Pronoun practice filtering - Subconjunto opcional, nunca puede reintroducir personas bloqueadas por dialecto
    if ((practiceMode === 'specific' || practiceMode === 'theme') && specificMood && specificTense) {
      // For specific/theme practice, show ALL persons of the selected form
      // Don't filter by practicePronoun at all - show variety
    } else {
      // For mixed practice, prioritize variety over strict pronoun filtering
      // Only apply strict pronoun filtering for specific practice modes
      if (practiceMode === 'mixed' || practiceMode === 'all' || !practiceMode) {
        // Mixed practice: show variety of persons, don't restrict to single pronoun
        // Let regional dialect filtering handle person restrictions
      } else {
        // Non-mixed practice: apply pronoun filtering based on practicePronoun setting
        if (practicePronoun === 'tu_only') {
          // Only tú forms
          if (f.person !== '2s_tu') {
            return false
          }
        } else if (practicePronoun === 'vos_only') {
          // Only vos forms
          if (f.person !== '2s_vos') {
            return false
          }
        } else if (practicePronoun === 'all') {
          // ALL forms including vosotros - override region restrictions for 2nd person
          // This means we allow ALL persons regardless of dialect when 'all' is selected
          // No filtering needed - let all forms through (including vosotros)
        } else if (practicePronoun === 'both') {
          // Both tú and vos, but still respect regional vosotros restrictions
          // No additional filtering beyond regional dialect filtering
        }
      }
      // Note: 'both' and 'all' both allow the regional dialect filtering to work normally,
      // but 'all' will override vosotros restrictions later in the dialect filtering
    }
    
    // Verb type filtering - check both user selection and MCER level restrictions
    // Prefer fast lookup map; if empty (e.g., in tests after cache clear), fallback to full dataset
    const verb = LEMMA_TO_VERB.get(f.lemma) || { type: 'regular', lemma: f.lemma }

    // Always enforce MCER level-based verb allowances (regular and irregular)
    // Apply before any later branching so A1/A2 never see advanced lemmas
    // EXCEPT for pedagogical drills like "Irregulares en 3ª persona"
    try {
      const verbFamilies = categorizeVerb(f.lemma, verb)
      const isPedagogicalDrill = selectedFamily === 'PRETERITE_THIRD_PERSON'

      // CRITICAL FIX: Don't apply level filtering for regular verbs when practicing regular verbs
      // This prevents regular -ir verbs from being filtered out due to irregular family classification
      const isRegularPracticeMode = verbType === 'regular'
      const verbIsActuallyRegular = verb?.type === 'regular' || f.type === 'regular'
      const shouldBypassLevelFiltering = isRegularPracticeMode && verbIsActuallyRegular

      if (!shouldBypassLevelFiltering) {
        const shouldFilter = !isPedagogicalDrill && shouldApplyLevelFiltering && shouldFilterVerbByLevel(f.lemma, verbFamilies, levelForFiltering, f.tense)
        if (shouldFilter) {
          if (f.lemma?.endsWith('ir') && verbType === 'regular') {
            console.log('❌ IR VERB FILTERED BY LEVEL:', { lemma: f.lemma, level, verbFamilies });
          }
          return false
        }
      } else {
        console.log('✅ IR VERB BYPASSED LEVEL FILTERING:', { lemma: f.lemma, type: f.type });
      }
    } catch {
      // If categorization fails for any reason, fall through (no extra exclusion)
    }

    
    // Check MCER level restrictions first
    // COMPLETE compound tenses definition: all 6 compound tenses in Spanish
    const isCompoundTense = (f.tense === 'pretPerf' || f.tense === 'plusc' || f.tense === 'futPerf' || f.tense === 'condPerf' || f.tense === 'subjPerf' || f.tense === 'subjPlusc')
    if (!isCompoundTense && f.mood !== 'nonfinite' && !isVerbTypeAllowedForLevel(verb?.type || 'regular', level)) {
      return false
    }

    // Additional per-level constraints  
    // (C1 specific restrictions removed - now allows all verb types)

    // B2+: bloquear personas imposibles para defectivos/unipersonales
    if (level === 'B2' || level === 'C1' || level === 'C2') {
      const UNIPERSONALES = new Set(['llover','nevar','granizar','amanecer'])
      if (UNIPERSONALES.has(f.lemma)) {
        if (!(f.person === '3s' || f.person === '3p')) {
          return false
        }
      }
    }
    
    // Restrict lemmas if configured by level/packs
    // Skip restriction only for Theme, or Specific explicitly coming from Tema
    const shouldBypassLemmaRestrictions = (verbType === 'all') || (practiceMode === 'theme' || (practiceMode === 'specific' && cameFromTema === true))

    // DEBUG: Always log the settings to understand what's happening
    if (verbType === 'regular') {
      console.log('🔍 SETTINGS CHECK:', {
        allowedLemmas: allowedLemmas ? `Set with ${allowedLemmas.size} verbs` : 'null',
        shouldBypass: shouldBypassLemmaRestrictions,
        verbType,
        practiceMode,
        cameFromTema,
        level,
        mood: f.mood,
        tense: f.tense
      });
    }
    if (allowedLemmas && !shouldBypassLemmaRestrictions) {
      // DEBUG: Check what's in allowedLemmas
      if (verbType === 'regular') {
        const allowedArray = Array.from(allowedLemmas);
        const allowedByEnding = {};
        allowedArray.forEach(lemma => {
          const ending = lemma?.slice(-2);
          allowedByEnding[ending] = (allowedByEnding[ending] || 0) + 1;
        });
        console.log('🚫 ALLOWED LEMMAS - Verbs by ending:', allowedByEnding);
        console.log('🚫 ALLOWED LEMMAS - Sample -ir verbs:', allowedArray.filter(l => l?.endsWith('ir')));
      }
      if (!allowedLemmas.has(f.lemma)) {
        if (f.lemma?.endsWith('ir') && verbType === 'regular') {
          console.log('❌ IR VERB BLOCKED BY ALLOWED LEMMAS:', f.lemma);
        }
        return false
      }
    }

    // Then check user's verb type preference  
    // isCompoundTense defined above
    // QUICK FIX: Para práctica mixta (sin verbType específico), permitir todos los verbos
    const isMixedPractice = !verbType || verbType === 'mixed' || verbType === 'all'
    
    
    
    if (verbType === 'regular' && !isMixedPractice) {
      // DEBUG: Log what happens to -ir verbs
      if (f.lemma?.endsWith('ir')) {
        console.log('🔍 IR VERB FILTERING:', { lemma: f.lemma, formType: f.type, verbType: verb.type });
      }
      // CRITICAL FIX: Use form-level type instead of incomplete VERB_LOOKUP_MAP
      // This ensures we don't lose verbs that aren't in the incomplete verb map
      if (f.type !== 'regular') {
        if (f.lemma?.endsWith('ir')) {
          console.log('❌ IR VERB FILTERED OUT:', { lemma: f.lemma, formType: f.type });
        }
        return false
      }
      
      // Then apply morphology-based filtering to ensure the specific form is also regular
      if (isCompoundTense) {
        const part = (f.value || '').split(/\s+/).pop()
        if (!isRegularNonfiniteForm(f.lemma, 'part', part)) {
          return false
        }
      } else if (f.mood === 'nonfinite') {
        if (!isRegularNonfiniteForm(f.lemma, f.tense, f.value)) {
          return false
        }
      } else {
        if (!isRegularFormForMood(f.lemma, f.mood, f.tense, f.person, f.value)) {
          return false
        }
      }
    } else if (verbType === 'irregular' && !isMixedPractice) {
      // When practicing irregular verbs, include all forms of irregular lemmas,
      // regardless of whether the specific form is morphologically irregular.
      if ((verb?.type || 'regular') !== 'irregular') {
        return false
      }
      
      // Family filtering for irregular verbs
      // Special case: For "Irregulares en 3ª persona" drill, apply pedagogical filtering to ALL persons
      // This applies when practicing this specific drill, regardless of cameFromTema
      if (f.tense === 'pretIndef' && verbType === 'irregular' && selectedFamily === 'PRETERITE_THIRD_PERSON') {
        const verbFamilies = categorizeVerb(f.lemma, verb)
        const pedagogicalThirdPersonFamilies = ['E_I_IR', 'O_U_GER_IR', 'HIATUS_Y']
        const isPedagogicallyRelevant = verbFamilies.some(family => pedagogicalThirdPersonFamilies.includes(family))

        // DEBUG LOG

        if (!isPedagogicallyRelevant) {
          return false
        }

        // Additional filter: exclude verbs with strong pretérito irregularities
        // These are verbs that are irregular throughout, not just in 3rd person
        const strongPreteriteIrregularities = ['PRET_UV', 'PRET_U', 'PRET_I', 'PRET_J', 'PRET_SUPPL']
        const hasStrongPreteriteIrregularities = verbFamilies.some(family => strongPreteriteIrregularities.includes(family))
        if (hasStrongPreteriteIrregularities) {
          return false // Exclude verbs like saber, querer, haber, etc.
        }

      }

      // Standard family filtering - apply for theme practice too, except for pedagogical drills
      if (selectedFamily && (practiceMode === 'theme' || !cameFromTema)) {
        const verbFamilies = categorizeVerb(f.lemma, verb)

        // Check if it's a simplified group that needs expansion
        const expandedFamilies = expandSimplifiedGroup(selectedFamily)
        if (expandedFamilies.length > 0) {
          // It's a simplified group. Check if the verb belongs to ANY of the included families.
          const isMatch = verbFamilies.some(vf => expandedFamilies.includes(vf))


          if (!isMatch) {
            return false
          }
        } else {
          // It's a regular family - check direct match
          if (!verbFamilies.includes(selectedFamily)) {
            return false
          }
        }

        // Level-based filtering for specific verb types
        // Apply level filtering when family is specifically selected, even in theme practice
        const isPedagogicalDrill = selectedFamily === 'PRETERITE_THIRD_PERSON'
        const shouldApplyThematicLevelFiltering = (practiceMode === 'theme' && selectedFamily) || (!cameFromTema && !isPedagogicalDrill)
        if (shouldApplyThematicLevelFiltering && shouldApplyLevelFiltering && !isPedagogicalDrill && shouldFilterVerbByLevel(f.lemma, verbFamilies, levelForFiltering, f.tense)) {
          return false
        }
      } else {
        // Even without family selection, apply level-based filtering for irregulars
        // Apply level filtering when family is specifically selected, even in theme practice
        const verbFamilies = categorizeVerb(f.lemma, verb)
        const isPedagogicalDrill = selectedFamily === 'PRETERITE_THIRD_PERSON'
        const shouldApplyThematicLevelFiltering = (practiceMode === 'theme' && selectedFamily) || (!cameFromTema && !isPedagogicalDrill)
        if (shouldApplyThematicLevelFiltering && shouldApplyLevelFiltering && !isPedagogicalDrill && shouldFilterVerbByLevel(f.lemma, verbFamilies, levelForFiltering, f.tense)) {
          return false
        }
      }
    }
    // If verbType is 'all', we only check MCER restrictions (already done above)
    
    // Specific practice filtering
    if(practiceMode === 'specific') {
      if(specificMood && f.mood !== specificMood) {
        return false
      }

      // Handle mixed options for imperative and nonfinite
      if(specificTense) {
        if(specificTense === 'impMixed') {
          // For mixed imperative, include both affirmative and negative
          if(f.mood !== 'imperative' || (f.tense !== 'impAff' && f.tense !== 'impNeg')) {
            return false
          }
        } else if(specificTense === 'nonfiniteMixed') {
          // For mixed nonfinite, include both gerund and participle
          if(f.mood !== 'nonfinite' || (f.tense !== 'ger' && f.tense !== 'part')) {
            return false
          }

          // For irregular verb type, allow all nonfinite forms of irregular lemmas
          if(verbType === 'irregular') {
            const v = LEMMA_TO_VERB.get(f.lemma)
            if ((v?.type || 'regular') !== 'irregular') return false
          }
        } else if(f.tense !== specificTense) {
          return false
        }
      }
    }
    
    // Filter out infinitivos from practice (they're not conjugated forms)
    if(f.mood === 'nonfinite' && (f.tense === 'inf' || f.tense === 'infPerf')) {
      return false
    }
    
    return true
  })
  
  
    // Guardar en cache para futuros usos - ensure we only cache arrays
    if (Array.isArray(eligible)) {
      formFilterCache.set(filterKey, eligible)
    } else {
      console.warn('⚠️ chooseNext: Not caching non-array eligible value:', eligible)
      eligible = []
      formFilterCache.set(filterKey, eligible)
    }
  }


  // If no eligible forms remain, try emergency fallbacks instead of failing
  if (!eligible || eligible.length === 0) {
    if (practiceMode === 'specific') {
      const moodText = specificMood || 'any mood'
      const tenseText = specificTense || 'any tense'
      console.warn(`⚠️ No valid exercises found for ${moodText} / ${tenseText}, attempting emergency fallback`)

      // Emergency fallback: return the first available form that matches mood, ignoring other constraints
      const emergencyFallback = forms.find(f => f.mood === specificMood && f.value)
      if (emergencyFallback) {
        console.log(`🚨 Emergency fallback used: ${emergencyFallback.lemma} ${emergencyFallback.mood}/${emergencyFallback.tense}`)
        return emergencyFallback
      }
    }
    eligible = eligible || []
  }
  
  // Exclude the exact same item from the list of candidates, if possible
  if (currentItem && eligible.length > 1) {
    const { lemma, mood, tense, person } = currentItem

    // CRITICAL FIX: For specific topic practice, prioritize verb variety by excluding the last-used lemma entirely.
    if (practiceMode === 'specific') {
      const filteredByLemma = eligible.filter(f => f.lemma !== lemma)
      if (filteredByLemma.length > 0) {
        eligible = filteredByLemma
      }
    } else {
      const filteredEligible = eligible.filter(f =>
        f.lemma !== lemma || f.mood !== mood || f.tense !== tense || f.person !== person
      )
      if (filteredEligible.length > 0) {
        eligible = filteredEligible
      }
    }
  }

  // Defensive check: ensure eligible is an array before calling .map()
  if (!Array.isArray(eligible)) {
    console.warn('⚠️ chooseNext: eligible is not an array:', eligible)
    // Reset to empty array to prevent crash
    eligible = []
  }

  // Show which persons were included
  const INCLUDED_PERSONS = [...new Set(eligible.map(f => f.person))]
  
  // Check if we have any eligible forms
  if (eligible.length === 0) {
    // Failsafe: relax filters progressively to always return something
    // Apply same specific topic practice logic in fallback
    const isSpecificTopicPractice = (practiceMode === 'specific' || practiceMode === 'theme')
    // Optimized: Single pass filtering instead of multiple iterations
    const allowedCombos = isSpecificTopicPractice ? null : getAllowedCombosForLevel(level)
    let fallback = forms.filter(f => {
      // Level filter (if not specific practice)
      if (!isSpecificTopicPractice && !allowedCombos.has(`${f.mood}|${f.tense}`)) {
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
      
      // CRITICAL FIX: Respect verbType restriction even in fallback!
      // Redefine isMixedPractice for fallback scope
      const isMixedPractice = !verbType || verbType === 'mixed' || verbType === 'all'
      const verb = LEMMA_TO_VERB.get(f.lemma)
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
      
      // Apply dialect filtering - preserve regional selection even with 'all' pronouns
      // 'all' should mean all pronouns WITHIN the selected dialect, not globally
      if (region === 'rioplatense') {
        // Rioplatense: yo, vos, usted/él/ella, nosotros, ustedes/ellas/ellos
        return !['2s_tu', '2p_vosotros'].includes(f.person)
      } else if (region === 'peninsular') {
        // Peninsular: yo, tú, usted/él/ella, nosotros, vosotros, ustedes/ellas/ellos
        return f.person !== '2s_vos'
      } else if (region === 'la_general') {
        // Latin American general: yo, tú, usted/él/ella, nosotros, ustedes/ellas/ellos  
        return !['2s_vos', '2p_vosotros'].includes(f.person)
      } else {
        // No specific region set: allow all variants
        return ['1s','2s_tu','2s_vos','3s','1p','2p_vosotros','3p'].includes(f.person)
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
    
    // FIX: Return random element instead of always first to prevent repetition
    if (fallback.length > 0) {
      const randomIndex = Math.floor(Math.random() * fallback.length)
      return fallback[randomIndex]
    }

    // ULTIMATE FALLBACK: If even this fails, use emergency fallback
    console.error(`🚨 All fallback strategies failed, using emergency fallback`)
    return await createEmergencyFallback(specificMood, specificTense)
  }
  
  // Apply weighted selection for "all" verb types to balance regular vs irregular per level
  if (verbType === 'all') {
    eligible = applyWeightedSelection(eligible)
  }

  // A1 PEDAGOGICAL PRIORITIZATION: Heavily favor presente de indicativo
  if (level === 'A1') {
    const presenteIndicativo = eligible.filter(f => f.mood === 'indicativo' && f.tense === 'pres')
    const participios = eligible.filter(f => f.mood === 'nonfinite' && f.tense === 'part')

    if (presenteIndicativo.length > 0 && participios.length > 0) {
      // 85% presente indicativo, 15% participios for A1
      const weighted = []
      for (let i = 0; i < 85; i++) weighted.push(...presenteIndicativo)
      for (let i = 0; i < 15; i++) weighted.push(...participios)
      eligible = weighted
    } else if (presenteIndicativo.length > 0) {
      // If only presente available, heavily favor it
      eligible = presenteIndicativo
    }
  }

  // LEVEL-AWARE PRIORITIZATION: Apply curriculum-driven tense weighting
  try {
    // Get user's mastery data for context (if available from state)
    let userProgress = null
    try {
      // Only try to get mastery data if progress integration is enabled
      if (enableProgressIntegration !== false) {
        const { getCurrentUserId, getMasteryByUser } = await import('../../lib/progress/all.js')
        const userId = getCurrentUserId()
        if (userId) {
          const masteryData = await getMasteryByUser(userId)
          userProgress = masteryData
          dbg('📊 Progress system data loaded:', { userId, masteryRecords: masteryData?.length || 0 })
        } else {
          dbg('👤 No current user, continuing without mastery data')
        }
      } else {
        dbg('⏸️ Progress integration disabled, continuing without mastery data')
      }
    } catch (error) {
      // Progress system might not be available, continue without it
      dbg('⚠️ Progress system not available, continuing without mastery data:', error.message)
    }

    // Apply level-driven weighted selection (but only for non-A1 to avoid double weighting)
    if (level !== 'A1') {
      const levelWeightedForms = getWeightedFormsSelection(eligible, level, userProgress)

      if (levelWeightedForms.length > 0) {
        eligible = levelWeightedForms
      }
    }
  } catch (error) {
    console.warn('Level-aware prioritization failed, using fallback:', error)
    // Continue with traditional approach as fallback
  }
  
  // Apply level-driven morphological focus weighting (duplicate entries to increase frequency)
  eligible = applyLevelFormWeighting(eligible, allSettings)

  // DEBUG: Check -ir forms after all main filtering
  if (verbType === 'regular') {
    const irFormsAfterMainFiltering = eligible.filter(f => f.lemma?.endsWith('ir'));
    console.log('🔍 AFTER MAIN FILTERING - -ir forms count:', irFormsAfterMainFiltering.length);
    console.log('🔍 AFTER MAIN FILTERING - Sample -ir forms:', irFormsAfterMainFiltering.slice(0, 3).map(f => ({ lemma: f.lemma, type: f.type })));
  }

  // SAFETY GUARD: In mixed practice by level, ensure we don't get stuck
  // serving only nonfinite forms (gerund/participle). If there are finite
  // options available, prefer them by excluding nonfinite from the pool.
  if ((practiceMode === 'mixed' || !practiceMode) && eligible && eligible.length > 0) {
    try {
      const finiteOnly = eligible.filter(f => f && f.mood !== 'nonfinite')
      if (finiteOnly.length > 0) {
        eligible = finiteOnly
      }
    } catch { /* keep existing eligible pool on any error */ }
  }

  // ENHANCED: Strong preference for PURE regular lemmas when user selects 'regular'
  if (verbType === 'regular') {
    try {
      const pureRegularSet = new Set(
        Array.from(VERB_LOOKUP_MAP.values())
          .filter(v => v?.type === 'regular')
          .map(v => v.lemma)
      )

      // DEBUG: Log regular verbs in lookup map
      const regularVerbs = Array.from(VERB_LOOKUP_MAP.values()).filter(v => v?.type === 'regular');
      const regularByEnding = {};
      regularVerbs.forEach(v => {
        const ending = v.lemma?.slice(-2);
        regularByEnding[ending] = (regularByEnding[ending] || 0) + 1;
      });
      console.log('🧩 GENERATOR - Regular verbs in VERB_LOOKUP_MAP by ending:', regularByEnding);
      console.log('🧩 GENERATOR - Sample regular -ir verbs:', regularVerbs.filter(v => v.lemma?.endsWith('ir')).slice(0, 5).map(v => v.lemma));

      // DEBUG: Check what type values the -ir forms actually have
      const irForms = eligible.filter(f => f.lemma?.endsWith('ir'));
      console.log('🔍 FORMS - Sample -ir forms with their type values:', irForms.slice(0, 5).map(f => ({ lemma: f.lemma, type: f.type })));
      const isCompound = (t) => (t === 'pretPerf' || t === 'plusc' || t === 'futPerf' || t === 'condPerf' || t === 'subjPerf' || t === 'subjPlusc')
      
      
      // DEBUG: Log forms going into filtering
      const eligibleIrForms = eligible.filter(f => f.lemma?.endsWith('ir'));
      console.log('🔍 BEFORE FILTER - -ir forms count:', eligibleIrForms.length);
      console.log('🔍 BEFORE FILTER - Sample -ir forms:', eligibleIrForms.slice(0, 3).map(f => ({ lemma: f.lemma, type: f.type })));

      // Keep only pure regular lemmas and forms that are morphologically regular
      const pureRegularForms = eligible.filter(f => {
        // FIX: Don't filter by incomplete VERB_LOOKUP_MAP, use form-level type instead
        if (f.type !== 'regular') {
          return false
        }
        if (f.mood === 'nonfinite') return isRegularNonfiniteForm(f.lemma, f.tense, f.value)
        if (isCompound(f.tense)) {
          const part = (f.value || '').split(/\s+/).pop()
          return isRegularNonfiniteForm(f.lemma, 'part', part)
        }
        return isRegularFormForMood(f.lemma, f.mood, f.tense, f.person, f.value)
      })
      
      if (pureRegularForms.length > 0) {
        eligible = pureRegularForms
      }
    } catch (error) {
      console.warn('Regular-only preference failed, continuing with existing eligible:', error)
    }
  }

  // C2 conmutación: asegurar variedad sin quedarse "pegado" en una persona
  // - Usa la secuencia configurada pero la adapta a las personas disponibles por región
  // - Si la persona objetivo no existe en el pool, avanza al siguiente objetivo disponible en esta misma llamada
  if (enableC2Conmutacion && level === 'C2' && eligible.length > 0) {
    try {
      // Obtener personas permitidas por región y filtrar la secuencia
      const allowedPersons = new Set(
        (function(region){
          if (region === 'rioplatense') return ['1s','2s_vos','3s','1p','3p']
          if (region === 'la_general') return ['1s','2s_tu','3s','1p','3p']
          if (region === 'peninsular') return ['1s','2s_tu','3s','1p','2p_vosotros','3p']
          return ['1s','2s_tu','2s_vos','3s','1p','2p_vosotros','3p']
        })(region)
      )

      const rawSeq = Array.isArray(conmutacionSeq) && conmutacionSeq.length > 0
        ? conmutacionSeq
        : ['2s_vos','3p','3s']
      const effectiveSeq = rawSeq.filter(p => allowedPersons.has(p))
      // Fallback robusto: usar TODAS las personas permitidas por región, no solo 3s/3p
      const seq = effectiveSeq.length > 0 ? effectiveSeq : [...allowedPersons]

      // Elegir índice seguro (evitar || 0 por si es 0 válido)
      const currentIdx = Number.isInteger(conmutacionIdx) ? conmutacionIdx : 0

      // Buscar primera persona de la secuencia que tenga candidatos en el pool
      let usedIdx = currentIdx % seq.length
      let targetPerson = seq[usedIdx]
      let candidatesForTarget = eligible.filter(f => f.person === targetPerson)
      if (candidatesForTarget.length === 0) {
        // Avanzar circularmente hasta encontrar una disponible o dar una vuelta completa
        for (let step = 1; step < seq.length; step++) {
          const tryIdx = (currentIdx + step) % seq.length
          const tryPerson = seq[tryIdx]
          const tryCandidates = eligible.filter(f => f.person === tryPerson)
          if (tryCandidates.length > 0) {
            usedIdx = tryIdx
            targetPerson = tryPerson
            candidatesForTarget = tryCandidates
            break
          }
        }
      }

      // Elegir un lema base que tenga la persona objetivo
      const baseCandidates = candidatesForTarget.length > 0
        ? candidatesForTarget
        : eligible
      const base = baseCandidates[Math.floor(Math.random() * baseCandidates.length)]

      // Boost suave: prioriza lema+persona objetivo, mantiene el resto
      const boosted = []
      eligible.forEach(f => {
        let w = 1
        if (f.lemma === base.lemma && f.person === targetPerson) w = 3
        for (let i = 0; i < w; i++) boosted.push(f)
      })
      eligible = boosted

      // Avanzar el índice solo una posición desde el índice realmente usado
      useSettings.getState().set({ conmutacionIdx: (usedIdx + 1) % seq.length })
    } catch (error) {
      if (!import.meta?.vitest) console.warn('C2 conmutación fallback (no variety boost applied):', error)
    }
  }
  
  // ENHANCED SELECTION: Use Advanced Variety Engine for sophisticated selection
  
  // CRITICAL: Reset variety engine to prevent stuck selections
  dbg('🔄 RESETTING varietyEngine to prevent stuck selections')
  if (typeof varietyEngine.resetSession === 'function') {
    varietyEngine.resetSession()
  }
  
  // Fast path for specific practice: simple random selection from eligible pool
  if (practiceMode === 'specific') {
    // ENHANCED SELECTION: For regular practice, ensure better distribution of verb endings
    if (verbType === 'regular') {
      // Group forms by ending to ensure variety
      const formsByEnding = {
        'ar': eligible.filter(f => f.lemma?.endsWith('ar')),
        'er': eligible.filter(f => f.lemma?.endsWith('er')),
        'ir': eligible.filter(f => f.lemma?.endsWith('ir'))
      };

      // Enhanced selection: favor underrepresented endings
      const endingCounts = {
        'ar': formsByEnding.ar.length,
        'er': formsByEnding.er.length,
        'ir': formsByEnding.ir.length
      };

      // If we have -ir verbs, give them 30% selection chance to ensure they appear
      const random = Math.random();
      let selectedEnding;
      if (formsByEnding.ir.length > 0 && random < 0.3) {
        selectedEnding = 'ir';
      } else if (formsByEnding.er.length > 0 && random < 0.6) {
        selectedEnding = 'er';
      } else {
        selectedEnding = 'ar';
      }

      const selectedForms = formsByEnding[selectedEnding];
      if (selectedForms.length > 0) {
        const idx = Math.floor(Math.random() * selectedForms.length);
        return selectedForms[idx];
      }
    }

    const idx = Math.floor(Math.random() * eligible.length)
    return eligible[idx]
  }

  // Simple selection for mixed practice as well to keep tests fast and deterministic
  const selectedForm = eligible[Math.floor(Math.random() * eligible.length)]

  // DEBUG: Log selection process for regular practice
  if (verbType === 'regular' && selectedForm) {
    const eligibleByEnding = {};
    eligible.forEach(f => {
      const ending = f.lemma?.slice(-2);
      eligibleByEnding[ending] = (eligibleByEnding[ending] || 0) + 1;
    });
    console.log('🎲 GENERATOR - Eligible forms by ending:', eligibleByEnding);
    console.log('🎲 GENERATOR - Selected:', {
      lemma: selectedForm.lemma,
      ending: selectedForm.lemma?.slice(-2),
      totalEligible: eligible.length
    });
  }
  if (selectedForm) {
    
    // Apply any final transformations (clitics, etc.)
    let finalForm = selectedForm
    
    // Enforce clitics percentage in imperativo afirmativo at high levels
    if (finalForm.mood === 'imperative' && finalForm.tense === 'impAff' && cliticsPercent > 0) {
      const needClitic = Math.random() * 100 < cliticsPercent
      if (needClitic) {
        const part = finalForm.value
        const attach = (finalForm.person === '1s' || finalForm.person === '2s_tu' || finalForm.person === '2s_vos') ? 'me' : 'se lo'
        const adjusted = adjustAccentForImperativeWithClitics(finalForm.lemma, finalForm.person, part, attach)
        finalForm = { ...finalForm, value: adjusted }
      }
    }
    
    
    // STRICT VALIDATION: Prevent incorrect exercises from being returned
    if (practiceMode === 'specific') {
      if (specificMood && finalForm.mood !== specificMood) {
        // Clear caches to prevent corrupted data from persisting
        clearAllCaches()
        
        // Try to find a correct form from eligible forms as last resort
        const correctForms = eligible.filter(f => f.mood === specificMood && (!specificTense || f.tense === specificTense))
        console.log('🚨 MOOD VALIDATION FALLBACK - Filtering to', correctForms.length, 'forms');
        if (correctForms.length > 0) {
          return correctForms[Math.floor(Math.random() * correctForms.length)]
        }
        // If no correct form found, use emergency fallback instead of throwing
        console.error(`❌ Validation failed: mood mismatch. Expected ${specificMood}, got ${finalForm.mood}`)
        const emergencyFallback = await createEmergencyFallback(specificMood, specificTense)
        console.log(`🚨 Using emergency fallback for mood validation failure`)
        return emergencyFallback
      }
      if (specificTense && finalForm.tense !== specificTense) {
        // Clear caches to prevent corrupted data from persisting
        clearAllCaches()
        
        // Try to find a correct form from eligible forms as last resort
        const correctForms = eligible.filter(f => (!specificMood || f.mood === specificMood) && f.tense === specificTense)
        console.log('🚨 TENSE VALIDATION FALLBACK - Filtering to', correctForms.length, 'forms');
        if (correctForms.length > 0) {
          return correctForms[Math.floor(Math.random() * correctForms.length)]
        }
        // If no correct form found, use emergency fallback instead of throwing
        console.error(`❌ Validation failed: tense mismatch. Expected ${specificTense}, got ${finalForm.tense}`)
        const emergencyFallback = await createEmergencyFallback(specificMood, specificTense)
        console.log(`🚨 Using emergency fallback for tense validation failure`)
        return emergencyFallback
      }
    }
    
    return finalForm
  }
  
  // Fallback (shouldn't hit): legacy selection scaffolding
  let candidates = eligible
  
  // Balance selection by person to ensure variety
  const personsInCandidates = [...new Set(candidates.map(f => f.person))]
  
  // Group candidates by person
  const candidatesByPerson = {}
  personsInCandidates.forEach(person => {
    candidatesByPerson[person] = candidates.filter(f => f.person === person)
  })
  
  // Select a person using level-based weights, then a random form from that person
  const personWeights = getPersonWeightsForLevel(allSettings)
  const availablePersons = personsInCandidates
  // Optional rotation of second person at high levels
  const rot = rotateSecondPerson
  const next2 = nextSecondPerson
  const weights = availablePersons.map(p => {
    let w = personWeights[p] || 1
    if (rot && (p === '2s_tu' || p === '2s_vos')) {
      if (p === next2) w *= 1.5
      else w *= 0.75
    }
    return w
  })
  const totalW = weights.reduce((a,b)=>a+b,0) || 1
  let r = Math.random() * totalW
  let randomPerson = availablePersons[0]
  for (let i=0;i<availablePersons.length;i++){
    r -= weights[i]
    if (r <= 0) { randomPerson = availablePersons[i]; break }
  }
  const formsForPerson = candidatesByPerson[randomPerson]
  // CRITICAL FIX: For participles, prefer the first (standard) form instead of random selection
  let fallbackSelectedForm
  if (formsForPerson.length > 1 && formsForPerson[0].mood === 'nonfinite' && formsForPerson[0].tense === 'part') {
    // For participles with multiple forms (e.g. provisto/proveído), always choose the first (standard) one
    fallbackSelectedForm = formsForPerson[0]
  } else {
    fallbackSelectedForm = formsForPerson[Math.floor(Math.random() * formsForPerson.length)]
  }
  // Enforce clitics percentage in imperativo afirmativo at high levels
  if (fallbackSelectedForm.mood === 'imperative' && fallbackSelectedForm.tense === 'impAff' && cliticsPercent > 0) {
    const needClitic = Math.random()*100 < cliticsPercent
    if (needClitic) {
      // Simple heuristic: attach 'me' to 1s/2s targets, else 'se lo'
      const part = fallbackSelectedForm.value
      const attach = (fallbackSelectedForm.person === '1s' || fallbackSelectedForm.person === '2s_tu' || fallbackSelectedForm.person === '2s_vos') ? 'me' : 'se lo'
      const adjusted = adjustAccentForImperativeWithClitics(fallbackSelectedForm.lemma, fallbackSelectedForm.person, part, attach)
      fallbackSelectedForm = { ...fallbackSelectedForm, value: adjusted }
    }
  }
  // Update rotation pointer
  if (rot && (randomPerson === '2s_tu' || randomPerson === '2s_vos')) {
    useSettings.getState().set({ nextSecondPerson: randomPerson === '2s_tu' ? '2s_vos' : '2s_tu' })
  }
  
  
  
  // STRICT VALIDATION: Prevent incorrect exercises from being returned
  if (practiceMode === 'specific') {
    const mixedMap = new Map([
      ['impMixed', ['impAff', 'impNeg']],
      ['nonfiniteMixed', ['ger', 'part']]
    ])
    const isMixedTense = specificTense && mixedMap.has(specificTense)
    const mixedAllowed = isMixedTense ? mixedMap.get(specificTense) : null
    if (specificMood && fallbackSelectedForm.mood !== specificMood) {
      // Clear caches to prevent corrupted data from persisting
      clearAllCaches()
      
      // Try to find a correct form from eligible forms as last resort
      const correctForms = eligible.filter(f => f.mood === specificMood && (!specificTense || f.tense === specificTense))
      if (correctForms.length > 0) {
        return correctForms[Math.floor(Math.random() * correctForms.length)]
      }
      // If no correct form found, use emergency fallback instead of throwing
      console.error(`❌ Fallback validation failed: mood mismatch. Expected ${specificMood}, got ${fallbackSelectedForm.mood}`)
      const emergencyFallback = await createEmergencyFallback(specificMood, specificTense)
      console.log(`🚨 Using emergency fallback for fallback mood validation failure`)
      return emergencyFallback
    }
    if (specificTense && (
      (!isMixedTense && fallbackSelectedForm.tense !== specificTense) ||
      (isMixedTense && !mixedAllowed.includes(fallbackSelectedForm.tense))
    )) {
      // Clear caches to prevent corrupted data from persisting
      clearAllCaches()
      
      // Try to find a correct form from eligible forms as last resort
      const correctForms = eligible.filter(f => (
        (!specificMood || f.mood === specificMood) && (
          (!isMixedTense && f.tense === specificTense) ||
          (isMixedTense && mixedAllowed.includes(f.tense))
        )
      ))
      if (correctForms.length > 0) {
        return correctForms[Math.floor(Math.random() * correctForms.length)]
      }
      // If no correct form found, use emergency fallback instead of throwing
      console.error(`❌ Fallback validation failed: tense mismatch. Expected ${specificTense}, got ${fallbackSelectedForm.tense}`)
      const emergencyFallback = await createEmergencyFallback(specificMood, specificTense)
      console.log(`🚨 Using emergency fallback for fallback tense validation failure`)
      return emergencyFallback
    }
  }
  
  return fallbackSelectedForm
}

// Apply weighted selection to balance regular vs irregular verbs
function applyWeightedSelection(forms) {
  // Group forms by verb type
  const regularForms = []
  const irregularForms = []
  
  forms.forEach(form => {
    const verb = LEMMA_TO_VERB.get(form.lemma)
    if (verb) {
      // Check if verb is irregular for this specific tense
      if (isIrregularInTense(verb, form.tense)) {
        irregularForms.push(form)
      } else {
        regularForms.push(form)
      }
    }
  })
  
  
  // Calculate target distribution: 30% regular, 70% irregular
  const targetRegularRatio = 0.3
  const TARGET_IRREGULAR_RATIO = 0.7
  
  // Calculate how many forms we should select from each type
  const totalForms = forms.length
  const targetRegularCount = Math.floor(totalForms * targetRegularRatio)
  const targetIrregularCount = totalForms - targetRegularCount
  
  // Randomly sample from each group to achieve the target distribution
  const selectedForms = []
  
  // Add regular forms (reduced frequency)
  if (regularForms.length > 0) {
    const regularSample = sampleArray(regularForms, Math.min(targetRegularCount, regularForms.length))
    selectedForms.push(...regularSample)
  }
  
  // Add irregular forms (increased frequency)
  if (irregularForms.length > 0) {
    const irregularSample = sampleArray(irregularForms, Math.min(targetIrregularCount, irregularForms.length))
    selectedForms.push(...irregularSample)
  }
  
  // If we don't have enough forms from one type, fill with the other
  if (selectedForms.length < totalForms) {
    const remainingForms = forms.filter(f => !selectedForms.includes(f))
    selectedForms.push(...sampleArray(remainingForms, totalForms - selectedForms.length))
  }
  
  
  return selectedForms
}


// Helper function to randomly sample from an array
function sampleArray(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

// Helper function to find a verb by its lemma
function FIND_VERB_BY_LEMMA(lemma) {
  return VERB_LOOKUP_MAP.get(lemma)
}

// Accent rules for imperativo + clíticos (voseo):
// - 2s_vos afirmativo sin clíticos: terminación tónica (hablá, comé, viví)
// - Con un clítico (una sílaba enclítica): se pierde la tilde (hablame, comeme, vivime)
// - Con dos clíticos (dos sílabas enclíticas): vuelve la tilde (hablámelo, comémelo, vivímelo)
// Para 1p/3s/3p se aplica la prosodia general: si la sílaba tónica se desplaza antepenúltima por enclíticos, exigir tilde.
function adjustAccentForImperativeWithClitics(lemma, person, base, clitics) {
  const raw = `${base}${clitics}`.replace(/\s+/g,'')
  if (person === '2s_vos') {
    const encliticSyllables = estimateCliticSyllables(clitics)
    // quitar tildes previas del verbo
    const strip = (s)=> s.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    const addTildeVos = (s)=> {
      // Añadir tilde en la vocal final según -ar/-er/-ir
      if (/ar$/.test(lemma)) return s.replace(/a(?=[^a]*$)/, 'á')
      if (/er$/.test(lemma)) return s.replace(/e(?=[^e]*$)/, 'é')
      if (/ir$/.test(lemma)) return s.replace(/i(?=[^i]*$)/, 'í')
      return s
    }
    const REMOVE_TILDE_FINAL = (s)=> s.replace(/[á]([^á]*)$/,'a$1').replace(/[é]([^é]*)$/,'e$1').replace(/[í]([^í]*)$/,'i$1')
    let core = raw
    // normalizar núcleo verbal (antes de clíticos)
    const verb = base
    if (encliticSyllables === 1) {
      // pierde tilde
      const strippedVerb = strip(verb)
      core = strippedVerb + clitics.replace(/\s+/g,'')
    } else if (encliticSyllables >= 2) {
      // vuelve a llevar tilde
      const strippedVerb = strip(verb)
      const withTilde = addTildeVos(strippedVerb)
      core = withTilde + clitics.replace(/\s+/g,'')
    }
    return core
  }
  // Para otras personas, mantener unión sin cambiar acentos (grader validará tildes obligatorias en C2)
  return raw
}

function estimateCliticSyllables(cl) {
  // Aproximación: me/te/se/lo/la/le = 1 sílaba, nos/los/las/les = 1–2 (tomamos 1), "se lo" ~2
  const s = cl.replace(/\s+/g,'').toLowerCase()
  let count = 0
  const tokens = ['nos','les','las','los','me','te','se','lo','la','le']
  let i = 0
  while (i < s.length) {
    const tok = tokens.find(t => s.slice(i).startsWith(t))
    if (!tok) break
    count += 1
    i += tok.length
  }
  return Math.max(1, count)
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
    console.error('Error validating mood/tense availability:', error)
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
  console.log(`🔍 REAL GENERATOR FALLBACK: Looking for ${preferredMood || 'any mood'}/${preferredTense || 'any tense'}`)

  // STEP 1: First, try the provided forms if they exist and are valid
  if (Array.isArray(allAvailableForms) && allAvailableForms.length > 0) {
    console.log(`🔍 Searching through ${allAvailableForms.length} available forms`)

    // Filter for exact matches
    let exactMatches = allAvailableForms.filter(f => {
      if (!f.value || !f.lemma) return false
      if (preferredMood && f.mood !== preferredMood) return false
      if (preferredTense && f.tense !== preferredTense) return false
      return true
    })

    if (exactMatches.length > 0) {
      const selectedForm = exactMatches[Math.floor(Math.random() * exactMatches.length)]
      console.log(`✅ Found exact match in available forms: ${selectedForm.lemma} ${selectedForm.mood}/${selectedForm.tense} = ${selectedForm.value}`)
      return selectedForm
    }

    // Try mood-only match
    if (preferredMood) {
      const moodMatches = allAvailableForms.filter(f =>
        f.value && f.lemma && f.mood === preferredMood
      )
      if (moodMatches.length > 0) {
        const selectedForm = moodMatches[Math.floor(Math.random() * moodMatches.length)]
        console.log(`🔄 Found mood match in available forms: ${selectedForm.lemma} ${selectedForm.mood}/${selectedForm.tense} = ${selectedForm.value}`)
        return selectedForm
      }
    }
  }

  // STEP 2: If no good matches in available forms, search database directly
  try {
    console.log('🔍 Searching database directly for forms...')

    // Import verb data service to access raw database
    const { getAllVerbs } = await import('./verbDataService.js')
    const allVerbs = await getAllVerbs()

    console.log(`📚 Database access: got ${allVerbs.length} verbs`)

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

    console.log(`✅ Database search found ${matchingForms.length} real forms for ${targetMood}/${targetTense}`)

    if (matchingForms.length > 0) {
      const selectedForm = matchingForms[Math.floor(Math.random() * matchingForms.length)]
      console.log(`🎉 Using REAL database form: ${selectedForm.lemma} ${selectedForm.mood}/${selectedForm.tense} = ${selectedForm.value}`)
      return selectedForm
    }

    // If no exact match, try relaxing tense but keeping mood
    if (targetTense !== 'pres') {
      console.log(`⚠️ No ${targetTense} found, trying ${targetMood}/presente as fallback`)

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
        console.log(`🔄 Using mood fallback: ${selectedForm.lemma} ${selectedForm.mood}/${selectedForm.tense} = ${selectedForm.value}`)
        return selectedForm
      }
    }

  } catch (error) {
    console.error('❌ Error accessing database in emergency fallback:', error)
  }

  // STEP 3: Only if everything fails, show error
  console.error(`💥 CRITICAL: No forms found for ${preferredMood || 'any'}/${preferredTense || 'any'}. Database may be corrupted.`)

  return {
    lemma: 'ERROR',
    mood: preferredMood || 'ERROR',
    tense: preferredTense || 'ERROR',
    person: '1s',
    value: `No ${preferredTense || 'forms'} available`,
    type: 'error'
  }
}
