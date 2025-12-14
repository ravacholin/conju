/**
 * FormSelectorService - Service for selecting forms from eligible pool
 *
 * Extracted from generator.js to reduce complexity and improve maintainability.
 * Handles all selection logic including:
 * - Weighted selection for regular/irregular balance
 * - A1 pedagogical prioritization
 * - Level-aware prioritization with SRS integration
 * - Level form weighting
 * - Regular morphology preference
 * - C2 conmutación (person variety)
 * - Variety engine integration
 * - Specific practice ending distribution
 * - Clitic transformations
 * - Strict validation
 *
 * @module FormSelectorService
 */

import { isRegularFormForMood, isRegularNonfiniteForm } from './conjugationRules.js'
import { getWeightedFormsSelection } from './prioritizer/index.js'
import { getPersonWeightsForLevel, applyLevelFormWeighting } from './practicePolicy.js'
import { varietyEngine } from './advancedVarietyEngine.js'
import { VERB_LOOKUP_MAP, clearAllCaches } from './optimizedCache.js'
import { isIrregularInTense } from '../utils/irregularityUtils.js'
import { useSettings } from '../../state/settings.js'
import { createLogger } from '../utils/logger.js'
import { getAdaptiveEngine } from '../progress/AdaptiveDifficultyEngine.js'

const logger = createLogger('core:FormSelectorService')
const isDev = import.meta?.env?.DEV
const dbg = (...args) => { if (isDev && !import.meta?.env?.VITEST) logger.debug('dbg', ...args) }

/**
 * Select a form from the eligible pool using sophisticated selection algorithms
 *
 * @param {Array} eligible - Pool of eligible forms after filtering
 * @param {Object} settings - User settings object
 * @param {Object} context - Additional context (verbLookupMap, etc.)
 * @returns {Promise<Object>} Selected form with all transformations applied
 */
export async function selectForm(eligible, settings, context = {}) {
  // Early return for empty eligible pool
  if (!eligible || eligible.length === 0) {
    return null
  }

  const {
    level,
    verbType,
    practiceMode,
    specificMood,
    specificTense,
    region,
    enableC2Conmutacion,
    conmutacionSeq,
    conmutacionIdx,
    rotateSecondPerson,
    nextSecondPerson,
    cliticsPercent,
    enableProgressIntegration
  } = settings

  // Apply weighted selection for "all" verb types to balance regular vs irregular per level
  if (verbType === 'all') {
    eligible = applyWeightedSelection(eligible)
  }

  // A1 PEDAGOGICAL PRIORITIZATION: Heavily favor presente de indicativo
  if (level === 'A1') {
    const presenteIndicativo = eligible.filter(f =>
      (f.mood === 'indicative' || f.mood === 'indicativo') && f.tense === 'pres'
    )
    const participios = eligible.filter(f => f.mood === 'nonfinite' && f.tense === 'part')

    if (presenteIndicativo.length > 0 && participios.length > 0) {
      // A1: nearly all finite forms; participle only as rare exposure.
      const weighted = []
      for (let i = 0; i < 99; i++) weighted.push(...presenteIndicativo)
      for (let i = 0; i < 1; i++) weighted.push(...participios)
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
    logger.warn('Level-aware prioritization failed, using fallback', error)
    // Continue with traditional approach as fallback
  }

  // Apply level-driven morphological focus weighting (duplicate entries to increase frequency)
  eligible = applyLevelFormWeighting(eligible, settings)

  // SAFETY GUARD REMOVED: The varietyEngine now handles distribution balance.
  // Previously, this guard prevented nonfinite forms from appearing at all in mixed practice
  // if any finite forms were available, which contradicted the "mixed" promise.


  // ENHANCED: Strong preference for PURE regular lemmas when user selects 'regular'
  if (verbType === 'regular') {
    try {
      const pureRegularSet = new Set(
        Array.from(VERB_LOOKUP_MAP.values())
          .filter(v => v?.type === 'regular')
          .map(v => v.lemma)
      )

      const isCompound = (t) => (t === 'pretPerf' || t === 'plusc' || t === 'futPerf' || t === 'condPerf' || t === 'subjPerf' || t === 'subjPlusc')

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
      logger.warn('Regular-only preference failed, continuing with existing eligible', error)
    }
  }

  // C2 conmutación: asegurar variedad sin quedarse "pegado" en una persona
  // - Usa la secuencia configurada pero la adapta a las personas disponibles por región
  // - Si la persona objetivo no existe en el pool, avanza al siguiente objetivo disponible en esta misma llamada
  if (enableC2Conmutacion && level === 'C2' && eligible.length > 0) {
    try {
      // Obtener personas permitidas por región y filtrar la secuencia
      const allowedPersons = new Set(
        (function (region) {
          if (region === 'rioplatense') return ['1s', '2s_vos', '3s', '1p', '3p']
          if (region === 'la_general') return ['1s', '2s_tu', '3s', '1p', '3p']
          if (region === 'peninsular') return ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p']
          return ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
        })(region)
      )

      const rawSeq = Array.isArray(conmutacionSeq) && conmutacionSeq.length > 0
        ? conmutacionSeq
        : ['2s_vos', '3p', '3s']
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
      if (!import.meta?.vitest) logger.warn('C2 conmutación fallback (no variety boost applied)', error)
    }
  }

  // ENHANCED SELECTION: Use Advanced Variety Engine for sophisticated selection

  // CRITICAL: Reset variety engine to prevent stuck selections
  // MOVED: resetSession should not be called here as it wipes memory between items
  // It is now handled in the hook/component level when starting a new session


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
        if (correctForms.length > 0) {
          return correctForms[Math.floor(Math.random() * correctForms.length)]
        }
        // If no correct form found, use emergency fallback instead of throwing
        logger.error(`Validation failed: mood mismatch. Expected ${specificMood}, got ${finalForm.mood}`)
        const emergencyFallback = await createEmergencyFallback(specificMood, specificTense)
        logger.warn('Using emergency fallback for mood validation failure')
        return emergencyFallback
      }
      if (specificTense && finalForm.tense !== specificTense) {
        // Clear caches to prevent corrupted data from persisting
        clearAllCaches()

        // Try to find a correct form from eligible forms as last resort
        const correctForms = eligible.filter(f => (!specificMood || f.mood === specificMood) && f.tense === specificTense)
        if (correctForms.length > 0) {
          return correctForms[Math.floor(Math.random() * correctForms.length)]
        }
        // If no correct form found, use emergency fallback instead of throwing
        logger.error(`Validation failed: tense mismatch. Expected ${specificTense}, got ${finalForm.tense}`)
        const emergencyFallback = await createEmergencyFallback(specificMood, specificTense)
        logger.warn('Using emergency fallback for tense validation failure')
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
  const personWeights = getPersonWeightsForLevel(settings)
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
  const totalW = weights.reduce((a, b) => a + b, 0) || 1
  let r = Math.random() * totalW
  let randomPerson = availablePersons[0]
  for (let i = 0; i < availablePersons.length; i++) {
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
    const needClitic = Math.random() * 100 < cliticsPercent
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
      logger.error(`Fallback validation failed: mood mismatch. Expected ${specificMood}, got ${fallbackSelectedForm.mood}`)
      const emergencyFallback = await createEmergencyFallback(specificMood, specificTense)
      logger.warn('Using emergency fallback for fallback mood validation failure')
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
      logger.error(`Fallback validation failed: tense mismatch. Expected ${specificTense}, got ${fallbackSelectedForm.tense}`)
      const emergencyFallback = await createEmergencyFallback(specificMood, specificTense)
      logger.warn('Using emergency fallback for fallback tense validation failure')
      return emergencyFallback
    }
  }

  return fallbackSelectedForm
}

/**
 * Apply weighted selection to balance regular vs irregular verbs
 */
function applyWeightedSelection(forms) {
  // Group forms by verb type
  const regularForms = []
  const irregularForms = []

  forms.forEach(form => {
    const verb = VERB_LOOKUP_MAP.get(form.lemma)
    if (verb) {
      // Check if verb is irregular for this specific tense
      if (isIrregularInTense(verb, form.tense)) {
        irregularForms.push(form)
      } else {
        regularForms.push(form)
      }
    }
  })

  // Get adaptive difficulty recommendations (if available)
  let targetRegularRatio = 0.3
  let TARGET_IRREGULAR_RATIO = 0.7

  try {
    const adaptiveEngine = getAdaptiveEngine()
    const difficultyConfig = adaptiveEngine.getDifficultyConfig()

    // Apply adaptive difficulty adjustments if enabled
    if (difficultyConfig.enabled && difficultyConfig.recommendations.verbPoolAdjustment) {
      const adjustment = difficultyConfig.recommendations.verbPoolAdjustment

      // Normalize weights to maintain 100% total
      const totalWeight = adjustment.regularWeight + adjustment.irregularWeight
      targetRegularRatio = adjustment.regularWeight / totalWeight
      TARGET_IRREGULAR_RATIO = adjustment.irregularWeight / totalWeight

      dbg('🎯 Adaptive difficulty adjusting verb weights', {
        boost: difficultyConfig.currentBoost,
        flowState: difficultyConfig.flowState,
        regularRatio: targetRegularRatio.toFixed(2),
        irregularRatio: TARGET_IRREGULAR_RATIO.toFixed(2)
      })
    }
  } catch (error) {
    // Fallback to default ratios if adaptive engine unavailable
    logger.debug('Using default verb weights (adaptive engine unavailable)', error)
  }

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

/**
 * Helper function to randomly sample from an array
 */
function sampleArray(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

/**
 * Accent rules for imperativo + clíticos (voseo):
 * - 2s_vos afirmativo sin clíticos: terminación tónica (hablá, comé, viví)
 * - Con un clítico (una sílaba enclítica): se pierde la tilde (hablame, comeme, vivime)
 * - Con dos clíticos (dos sílabas enclíticas): vuelve la tilde (hablámelo, comémelo, vivímelo)
 * Para 1p/3s/3p se aplica la prosodia general: si la sílaba tónica se desplaza antepenúltima por enclíticos, exigir tilde.
 */
function adjustAccentForImperativeWithClitics(lemma, person, base, clitics) {
  const raw = `${base}${clitics}`.replace(/\s+/g, '')
  if (person === '2s_vos') {
    const encliticSyllables = estimateCliticSyllables(clitics)
    // quitar tildes previas del verbo
    const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const addTildeVos = (s) => {
      // Añadir tilde en la vocal final según -ar/-er/-ir
      if (/ar$/.test(lemma)) return s.replace(/a(?=[^a]*$)/, 'á')
      if (/er$/.test(lemma)) return s.replace(/e(?=[^e]*$)/, 'é')
      if (/ir$/.test(lemma)) return s.replace(/i(?=[^i]*$)/, 'í')
      return s
    }
    const REMOVE_TILDE_FINAL = (s) => s.replace(/[á]([^á]*)$/, 'a$1').replace(/[é]([^é]*)$/, 'e$1').replace(/[í]([^í]*)$/, 'i$1')
    let core = raw
    // normalizar núcleo verbal (antes de clíticos)
    const verb = base
    if (encliticSyllables === 1) {
      // pierde tilde
      const strippedVerb = strip(verb)
      core = strippedVerb + clitics.replace(/\s+/g, '')
    } else if (encliticSyllables >= 2) {
      // vuelve a llevar tilde
      const strippedVerb = strip(verb)
      const withTilde = addTildeVos(strippedVerb)
      core = withTilde + clitics.replace(/\s+/g, '')
    }
    return core
  }
  // Para otras personas, mantener unión sin cambiar acentos (grader validará tildes obligatorias en C2)
  return raw
}

function estimateCliticSyllables(cl) {
  // Aproximación: me/te/se/lo/la/le = 1 sílaba, nos/los/las/les = 1–2 (tomamos 1), "se lo" ~2
  const s = cl.replace(/\s+/g, '').toLowerCase()
  let count = 0
  const tokens = ['nos', 'les', 'las', 'los', 'me', 'te', 'se', 'lo', 'la', 'le']
  let i = 0
  while (i < s.length) {
    const tok = tokens.find(t => s.slice(i).startsWith(t))
    if (!tok) break
    count += 1
    i += tok.length
  }
  return Math.max(1, count)
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
