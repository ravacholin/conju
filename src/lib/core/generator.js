import gates from '../../data/curriculum.json'
import { useSettings } from '../../state/settings.js'
import { verbs } from '../../data/verbs.js'
import { categorizeVerb } from '../data/irregularFamilies.js'
import { expandSimplifiedGroup } from '../data/simplifiedFamilyGroups.js'
import { shouldFilterVerbByLevel } from './levelVerbFiltering.js'
import { isRegularFormForMood, isRegularNonfiniteForm, hasIrregularParticiple as HAS_IRREGULAR_PARTICIPLE } from './conjugationRules.js'
import { levelPrioritizer as LEVEL_PRIORITIZER, getWeightedFormsSelection } from './levelDrivenPrioritizer.js'
import { gateFormsByCurriculumAndDialect } from './curriculumGate.js'
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
  // verbCategorizationCache,  // UNUSED
  formFilterCache,
  // combinationCache,        // UNUSED
  warmupCaches as WARMUP_CACHES,
  clearAllCaches
} from './optimizedCache.js'

// Quiet debug logging during tests; keep in dev runtime
const dbg = (...args) => { if (import.meta?.env?.DEV && !import.meta?.env?.VITEST) console.log(...args) }

// Fast lookups (ahora usando cache optimizado)
const LEMMA_TO_VERB = VERB_LOOKUP_MAP
const allowedCombosCache = new Map() // level -> Set("mood|tense")
function getAllowedCombosForLevel(level) {
  if (allowedCombosCache.has(level)) return allowedCombosCache.get(level)
  if (level === 'ALL') {
    const all = new Set(gates.map(g => `${g.mood}|${g.tense}`))
    allowedCombosCache.set(level, all)
    return all
  }
  const maxIdx = levelOrder(level)
  const set = new Set(
    gates
      .filter(g => levelOrder(g.level) <= maxIdx)
      .map(g => `${g.mood}|${g.tense}`)
  )
  allowedCombosCache.set(level, set)
  return set
}

const REGULAR_MOOD_MEMO = new Map() // key: lemma|mood|tense|person|value
const REGULAR_NONFINITE_MEMO = new Map() // key: lemma|tense|value

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

export function chooseNext({forms, history: HISTORY, currentItem, sessionSettings}){

  // Use sessionSettings if provided, otherwise fallback to global settings
  const allSettings = sessionSettings || useSettings.getState()
  const { 
    level, useVoseo, useTuteo, useVosotros,
    practiceMode, specificMood, specificTense, practicePronoun, verbType,
    currentBlock, selectedFamily, region, enableFuturoSubjProd, allowedLemmas,
    cameFromTema,
    enableC2Conmutacion, conmutacionSeq, conmutacionIdx, rotateSecondPerson, 
    nextSecondPerson, cliticsPercent
  } = allSettings
  
  dbg('🔍 chooseNext called with settings:', {
    level, region, practiceMode, specificMood, specificTense, verbType, formsLength: forms?.length
  })

  
  
  
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

  const filterKey = `filter|${level}|${region}|${useVoseo}|${useTuteo}|${useVosotros}|${practiceMode}|${specificMood}|${specificTense}|${practicePronoun}|${verbType}|${selectedFamily}|${currentBlock?.id || 'none'}|allowed:${allowedSig}`
  
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
      // SKIP level filtering only for Theme, or Specific when explicitly coming from Tema
      const isSpecificTopicPractice = (practiceMode === 'theme') || (practiceMode === 'specific' && cameFromTema === true)
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
    const verb = LEMMA_TO_VERB.get(f.lemma) || verbs.find(v => v.lemma === f.lemma) || { type: 'regular', lemma: f.lemma }

    // Always enforce MCER level-based verb allowances (regular and irregular)
    // Apply before any later branching so A1/A2 never see advanced lemmas
    try {
      const verbFamilies = categorizeVerb(f.lemma, verb)
      if (shouldFilterVerbByLevel(f.lemma, verbFamilies, level, f.tense)) {
        return false
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
    if (allowedLemmas && !shouldBypassLemmaRestrictions) {
      if (!allowedLemmas.has(f.lemma)) {
        return false
      }
    }

    // Then check user's verb type preference  
    // isCompoundTense defined above
    // QUICK FIX: Para práctica mixta (sin verbType específico), permitir todos los verbos
    const isMixedPractice = !verbType || verbType === 'mixed' || verbType === 'all'
    
    
    
    if (verbType === 'regular' && !isMixedPractice) {
      // CRITICAL FIX: First check if the verb is globally regular (verb.type === 'regular')
      // This ensures only pure regular verbs are considered, not just regular forms of irregular verbs
      if (verb.type !== 'regular') {
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
      if (selectedFamily) {
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
        // ALWAYS apply level filtering, including for specific topic practice
        if (shouldFilterVerbByLevel(f.lemma, verbFamilies, level, f.tense)) {
          return false
        }
      } else {
        // Even without family selection, apply level-based filtering for irregulars
        // ALWAYS apply this filtering, including for specific topic practice
        const verbFamilies = categorizeVerb(f.lemma, verb)
        if (shouldFilterVerbByLevel(f.lemma, verbFamilies, level, f.tense)) {
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
  
  
    // Guardar en cache para futuros usos
    formFilterCache.set(filterKey, eligible)
  }
  
  // If no eligible forms remain, fail fast with clear error
  if (!eligible || eligible.length === 0) {
    if (practiceMode === 'specific') {
      const moodText = specificMood || 'any mood'
      const tenseText = specificTense || 'any tense'
      throw new Error(`No valid exercises found for ${moodText} / ${tenseText}`)
    }
    throw new Error('No eligible forms available for current settings')
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
    const randomIndex = Math.floor(Math.random() * fallback.length)
    return fallback[randomIndex] || null
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
      // Try to get mastery data from the progress system if available
      const userId = useSettings.getState().userId
      // Progress system integration disabled for now
      // TODO: Re-enable when progress system is stable
    } catch {
      // Progress system might not be available, continue without it
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

  // ENHANCED: Strong preference for PURE regular lemmas when user selects 'regular'
  if (verbType === 'regular') {
    try {
      const pureRegularSet = new Set(verbs.filter(v => v.type === 'regular').map(v => v.lemma))
      const isCompound = (t) => (t === 'pretPerf' || t === 'plusc' || t === 'futPerf' || t === 'condPerf' || t === 'subjPerf' || t === 'subjPlusc')
      
      
      // Keep only pure regular lemmas and forms that are morphologically regular
      const pureRegularForms = eligible.filter(f => {
        if (!pureRegularSet.has(f.lemma)) {
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
    } catch {
      console.warn('Regular-only preference failed, continuing with existing eligible:', e)
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
      // Fallback robusto
      const seq = effectiveSeq.length > 0 ? effectiveSeq : ['3s','3p']

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
    } catch {
      if (!import.meta?.vitest) console.warn('C2 conmutación fallback (no variety boost applied):', e)
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
        // If no correct form found, throw error to prevent wrong exercise
        throw new Error(`No valid exercises found for ${specificMood}${specificTense ? ` / ${specificTense}` : ''}`)
      }
      if (specificTense && finalForm.tense !== specificTense) {
        // Clear caches to prevent corrupted data from persisting
        clearAllCaches()
        
        // Try to find a correct form from eligible forms as last resort
        const correctForms = eligible.filter(f => (!specificMood || f.mood === specificMood) && f.tense === specificTense)
        if (correctForms.length > 0) {
          return correctForms[Math.floor(Math.random() * correctForms.length)]
        }
        // If no correct form found, throw error to prevent wrong exercise
        throw new Error(`No valid exercises found for ${specificMood ? `${specificMood} / ` : ''}${specificTense}`)
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
      // If no correct form found, throw error to prevent wrong exercise
      throw new Error(`No valid exercises found for ${specificMood}${specificTense ? ` / ${specificTense}` : ''}`)
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
      // If no correct form found, throw error to prevent wrong exercise
      throw new Error(`No valid exercises found for ${specificMood ? `${specificMood} / ` : ''}${specificTense}`)
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
  return verbs.find(v => v.lemma === lemma)
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

// Debug function to test A1 regular filtering specifically
export function debugA1RegularFiltering() {
  console.log('=== A1 REGULAR FILTERING DEBUG ===')
  
  const testForms = [
    { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'hablás' },
    { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'comés' },
    { lemma: 'vivir', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'vivís' },
    { lemma: 'poder', mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'podés' }
  ]
  
  testForms.forEach(form => {
    const verb = LEMMA_TO_VERB.get(form.lemma)
    console.log(`\n${form.lemma}:`)
    console.log(`  - Verb object:`, verb)
    console.log(`  - Verb type:`, verb?.type)
    console.log(`  - Should be included with verbType='regular'?`, verb?.type === 'regular')
  })
}

// Debug function to show available verbs for each combination
export function debugVerbAvailability() {
  console.log('=== VERB AVAILABILITY DEBUG ===')
  
  const moods = ['indicative', 'subjunctive', 'imperative', 'conditional']
  const tenses = ['pres', 'pretIndef', 'impf', 'fut', 'pretPerf', 'plusc', 'futPerf', 'subjPres', 'subjImpf', 'subjPerf', 'subjPlusc', 'impAff', 'impNeg', 'cond', 'condPerf']
  const verbTypes = ['regular', 'irregular', 'all']
  
  // Flatten all forms from all verbs
  const allForms = []
  verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
      paradigm.forms.forEach(form => {
        allForms.push({
          ...form,
          lemma: verb.lemma,
          type: verb.type
        })
      })
    })
  })
  
  console.log('Total forms in database:', allForms.length)
  console.log('Total verbs in database:', verbs.length)
  
  // Check each combination
  moods.forEach(mood => {
    tenses.forEach(tense => {
      verbTypes.forEach(verbType => {
        const filtered = allForms.filter(form => {
          if (form.mood !== mood) return false
          if (form.tense !== tense) return false
          if (verbType === 'regular' && form.type !== 'regular') return false
          if (verbType === 'irregular' && form.type !== 'irregular') return false
          return true
        })
        
        if (filtered.length > 0) {
          const uniqueVerbs = [...new Set(filtered.map(f => f.lemma))]
          console.log(`${mood} ${tense} ${verbType}: ${filtered.length} forms, ${uniqueVerbs.length} verbs (${uniqueVerbs.slice(0, 5).join(', ')}${uniqueVerbs.length > 5 ? '...' : ''})`)
        } else {
          console.log(`${mood} ${tense} ${verbType}: ❌ NO VERBS AVAILABLE`)
        }
      })
    })
  })
  
  console.log('=== END VERB AVAILABILITY DEBUG ===')
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
function levelOrder(L){ return ['A1','A2','B1','B2','C1','C2'].indexOf(L) }

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
        if (!useTuteo && f.person === '2s_tu') return false
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
