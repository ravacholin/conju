/**
 * FormFilterService - Service for filtering verb forms based on user settings
 *
 * Extracted from generator.js to reduce complexity and improve maintainability.
 * Handles all form filtering logic including:
 * - Level-based filtering (CEFR A1-C2)
 * - Verb type filtering (regular/irregular)
 * - Dialect filtering (rioplatense, peninsular, la_general)
 * - Practice mode filtering (specific, theme, mixed)
 * - Family filtering for irregular verbs
 *
 * @module FormFilterService
 */

import { categorizeVerb } from '../data/irregularFamilies.js'
import { expandSimplifiedGroup } from '../data/simplifiedFamilyGroups.js'
import { shouldFilterVerbByLevel } from './levelVerbFiltering.js'
import {
  isRegularFormForMood,
  isRegularNonfiniteForm
} from './conjugationRules.js'
import { gateFormsByCurriculumAndDialect, getAllowedCombosForLevel } from './curriculumGate.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('core:FormFilterService')

/**
 * Filter forms based on comprehensive user settings
 *
 * @param {Array} forms - Array of all available forms
 * @param {Object} settings - User settings object
 * @param {Object} context - Additional context (verbLookupMap, etc.)
 * @returns {Array} Filtered array of eligible forms
 */
export function filterEligibleForms(forms, settings, context = {}) {
  const {
    level,
    region,
    practiceMode,
    specificMood,
    specificTense,
    practicePronoun,
    verbType,
    currentBlock,
    selectedFamily,
    enableFuturoSubjProd,
    allowedLemmas,
    cameFromTema,
    shouldApplyLevelFiltering,
    levelForFiltering
  } = settings

  const { verbLookupMap } = context
  const blockCellFilter = Array.isArray(currentBlock?.cells) && currentBlock.cells.length > 0
    ? new Set(
        currentBlock.cells
          .map(cell => `${cell.mood}|${cell.tense}|${cell.person}`)
          .filter(Boolean)
      )
    : null

  // Step 1: Gate sistemático por curriculum y dialecto
  const preFiltered = gateFormsByCurriculumAndDialect(forms, settings)

  // Step 2: Apply additional filters
  const eligible = preFiltered.filter(form => {
    // Basic value validation
    if (!form.value && !form.form) {
      return false
    }

    // Level filtering
    if (!applyLevelFilter(form, {level, practiceMode, currentBlock})) {
      return false
    }

    // Futuro de subjuntivo gate
    if (!applyFuturoSubjuntivoGate(form, enableFuturoSubjProd)) {
      return false
    }

    // Pronoun filtering
    if (!applyPronounFilter(form, {
      practiceMode,
      specificMood,
      specificTense,
      practicePronoun,
      blockCellFilter
    })) {
      return false
    }

    // Verb type and level restrictions
    const verb = verbLookupMap?.get(form.lemma) || { type: 'regular', lemma: form.lemma }

    if (!applyVerbLevelRestrictions(form, verb, {
      verbType,
      level,
      selectedFamily,
      shouldApplyLevelFiltering,
      levelForFiltering
    })) {
      return false
    }

    // Lemma restrictions
    if (!applyLemmaRestrictions(form, {
      allowedLemmas,
      verbType,
      practiceMode,
      cameFromTema
    })) {
      return false
    }

    // Verb type filtering (regular/irregular)
    if (!applyVerbTypeFilter(form, verb, {
      verbType,
      verbLookupMap
    })) {
      return false
    }

    // Irregular family filtering
    if (!applyFamilyFilter(form, verb, {
      verbType,
      selectedFamily,
      practiceMode,
      cameFromTema,
      shouldApplyLevelFiltering,
      levelForFiltering
    })) {
      return false
    }

    // Specific practice filtering
    if (!applySpecificPracticeFilter(form, {
      practiceMode,
      specificMood,
      specificTense,
      verbType,
      verbLookupMap
    })) {
      return false
    }

    // Filter out infinitives
    if (form.mood === 'nonfinite' && (form.tense === 'inf' || form.tense === 'infPerf')) {
      return false
    }

    return true
  })

  return eligible
}

/**
 * Apply level-based filtering for mood/tense combinations
 */
function applyLevelFilter(form, {level, practiceMode, currentBlock}) {
  const isSpecificTopicPractice = (practiceMode === 'theme') || (practiceMode === 'specific')

  if (isSpecificTopicPractice) {
    return true // Skip level filtering for targeted practice
  }

  const allowed = currentBlock && currentBlock.combos && currentBlock.combos.length
    ? new Set(currentBlock.combos.map(c => `${c.mood}|${c.tense}`))
    : getAllowedCombosForLevel(level)

  return allowed.has(`${form.mood}|${form.tense}`)
}

/**
 * Gate futuro de subjuntivo by production toggle
 */
function applyFuturoSubjuntivoGate(form, enableFuturoSubjProd) {
  if (form.mood === 'subjunctive' && (form.tense === 'subjFut' || form.tense === 'subjFutPerf')) {
    return enableFuturoSubjProd === true
  }
  return true
}

/**
 * Apply pronoun practice filtering
 */
function applyPronounFilter(form, {practiceMode, specificMood, specificTense, practicePronoun, blockCellFilter}) {
  if (blockCellFilter && blockCellFilter.size > 0) {
    return blockCellFilter.has(`${form.mood}|${form.tense}|${form.person}`)
  }

  // For specific/theme practice, show ALL persons
  if ((practiceMode === 'specific' || practiceMode === 'theme') && specificMood && specificTense) {
    return true
  }

  // For mixed practice, prioritize variety
  if (practiceMode === 'mixed' || practiceMode === 'all' || !practiceMode) {
    return true
  }

  // Apply pronoun filtering for other modes
  if (practicePronoun === 'tu_only') {
    return form.person === '2s_tu'
  } else if (practicePronoun === 'vos_only') {
    return form.person === '2s_vos'
  } else if (practicePronoun === 'all' || practicePronoun === 'both') {
    return true
  }

  return true
}

/**
 * Apply MCER level-based verb restrictions
 */
function applyVerbLevelRestrictions(form, verb, options) {
  const {
    verbType,
    level,
    selectedFamily,
    shouldApplyLevelFiltering,
    levelForFiltering
  } = options

  // Level-based verb filtering
  try {
    const verbFamilies = categorizeVerb(form.lemma, verb)
    const isPedagogicalDrill = selectedFamily === 'PRETERITE_THIRD_PERSON'

    // Bypass level filtering for regular verbs in regular practice mode
    const isRegularPracticeMode = verbType === 'regular'
    const verbIsActuallyRegular = verb?.type === 'regular' || form.type === 'regular'
    const shouldBypassLevelFiltering = isRegularPracticeMode && verbIsActuallyRegular

    if (!shouldBypassLevelFiltering) {
      const shouldFilter = !isPedagogicalDrill &&
                          shouldApplyLevelFiltering &&
                          shouldFilterVerbByLevel(form.lemma, verbFamilies, levelForFiltering, form.tense)
      if (shouldFilter) {
        return false
      }
    }
  } catch {
    // If categorization fails, allow through
  }

  // Compound tense check
  const isCompoundTense = ['pretPerf', 'plusc', 'futPerf', 'condPerf', 'subjPerf', 'subjPlusc'].includes(form.tense)
  if (!isCompoundTense && form.mood !== 'nonfinite') {
    const levelVerbRestrictions = {
      'A1': { regular: true, irregular: true },
      'A2': { regular: true, irregular: true },
      'B1': { regular: true, irregular: true },
      'B2': { regular: true, irregular: true },
      'C1': { regular: true, irregular: true },
      'C2': { regular: true, irregular: true },
      'ALL': { regular: true, irregular: true }
    }
    const restrictions = levelVerbRestrictions[level]
    const verbTypeToCheck = verb?.type || 'regular'
    if (restrictions && !restrictions[verbTypeToCheck]) {
      return false
    }
  }

  // B2+: Block impossible persons for defective/unipersonal verbs
  if (['B2', 'C1', 'C2'].includes(level)) {
    const UNIPERSONALES = new Set(['llover', 'nevar', 'granizar', 'amanecer'])
    if (UNIPERSONALES.has(form.lemma)) {
      return form.person === '3s' || form.person === '3p'
    }
  }

  return true
}

/**
 * Apply lemma restrictions from level/packs
 */
function applyLemmaRestrictions(form, options) {
  const { allowedLemmas, verbType, practiceMode, cameFromTema } = options

  const shouldBypassLemmaRestrictions =
    (verbType === 'all') ||
    (practiceMode === 'theme' || (practiceMode === 'specific' && cameFromTema === true))

  if (allowedLemmas && !shouldBypassLemmaRestrictions) {
    return allowedLemmas.has(form.lemma)
  }

  return true
}

/**
 * Apply verb type filtering (regular/irregular)
 */
function applyVerbTypeFilter(form, verb, {verbType, verbLookupMap}) {
  const isMixedPractice = !verbType || verbType === 'mixed' || verbType === 'all'

  if (isMixedPractice) {
    return true // Allow all types
  }

  const isCompoundTense = ['pretPerf', 'plusc', 'futPerf', 'condPerf', 'subjPerf', 'subjPlusc'].includes(form.tense)

  if (verbType === 'regular') {
    // Use form-level type instead of incomplete verb map
    if (form.type !== 'regular') {
      return false
    }

    // Apply morphology-based filtering
    if (isCompoundTense) {
      const part = (form.value || '').split(/\s+/).pop()
      return isRegularNonfiniteForm(form.lemma, 'part', part)
    } else if (form.mood === 'nonfinite') {
      return isRegularNonfiniteForm(form.lemma, form.tense, form.value)
    } else {
      return isRegularFormForMood(form.lemma, form.mood, form.tense, form.person, form.value)
    }
  } else if (verbType === 'irregular') {
    // Include all forms of irregular lemmas.
    // Use `form.type` as a fallback when `verbLookupMap` is incomplete/uninitialized.
    return form.type === 'irregular' || (verb?.type || 'regular') === 'irregular'
  }

  return true
}

/**
 * Apply irregular family filtering
 */
function applyFamilyFilter(form, verb, options) {
  const {
    verbType,
    selectedFamily,
    practiceMode,
    cameFromTema,
    shouldApplyLevelFiltering,
    levelForFiltering
  } = options

  if (verbType !== 'irregular') {
    return true // Only apply to irregular verb practice
  }

  // Special case: Pedagogical drill for 3rd person preterite
  if (form.tense === 'pretIndef' && selectedFamily === 'PRETERITE_THIRD_PERSON') {
    const verbFamilies = categorizeVerb(form.lemma, verb)
    const pedagogicalThirdPersonFamilies = ['E_I_IR', 'O_U_GER_IR', 'HIATUS_Y']
    const isPedagogicallyRelevant = verbFamilies.some(family =>
      pedagogicalThirdPersonFamilies.includes(family)
    )

    if (!isPedagogicallyRelevant) {
      return false
    }

    // Exclude verbs with strong pretérito irregularities
    const strongPreteriteIrregularities = ['PRET_UV', 'PRET_U', 'PRET_I', 'PRET_J', 'PRET_SUPPL']
    const hasStrongPreteriteIrregularities = verbFamilies.some(family =>
      strongPreteriteIrregularities.includes(family)
    )
    if (hasStrongPreteriteIrregularities) {
      return false
    }
  }

  // Standard family filtering
  if (selectedFamily && (practiceMode === 'theme' || !cameFromTema)) {
    const verbFamilies = categorizeVerb(form.lemma, verb)

    // Check if it's a simplified group
    const expandedFamilies = expandSimplifiedGroup(selectedFamily)
    if (expandedFamilies.length > 0) {
      const isMatch = verbFamilies.some(vf => expandedFamilies.includes(vf))
      if (!isMatch) {
        return false
      }
    } else {
      // Regular family - direct match
      if (!verbFamilies.includes(selectedFamily)) {
        return false
      }
    }

    // Level-based filtering for families
    const isPedagogicalDrill = selectedFamily === 'PRETERITE_THIRD_PERSON'
    const shouldApplyThematicLevelFiltering =
      (practiceMode === 'theme' && selectedFamily) ||
      (!cameFromTema && !isPedagogicalDrill)

    if (shouldApplyThematicLevelFiltering &&
        shouldApplyLevelFiltering &&
        !isPedagogicalDrill &&
        shouldFilterVerbByLevel(form.lemma, verbFamilies, levelForFiltering, form.tense)) {
      return false
    }
  } else if (selectedFamily) {
    // Apply level filtering even without family selection
    const verbFamilies = categorizeVerb(form.lemma, verb)
    const isPedagogicalDrill = selectedFamily === 'PRETERITE_THIRD_PERSON'
    const shouldApplyThematicLevelFiltering =
      (practiceMode === 'theme' && selectedFamily) ||
      (!cameFromTema && !isPedagogicalDrill)

    if (shouldApplyThematicLevelFiltering &&
        shouldApplyLevelFiltering &&
        !isPedagogicalDrill &&
        shouldFilterVerbByLevel(form.lemma, verbFamilies, levelForFiltering, form.tense)) {
      return false
    }
  }

  return true
}

/**
 * Apply specific practice mode filtering
 */
function applySpecificPracticeFilter(form, options) {
  const { practiceMode, specificMood, specificTense, verbType, verbLookupMap } = options

  if (practiceMode !== 'specific') {
    return true
  }

  // Mood filter
  if (specificMood && form.mood !== specificMood) {
    return false
  }

  // Tense filter with mixed options
  if (specificTense) {
    if (specificTense === 'impMixed') {
      // Mixed imperative: affirmative and negative
      return form.mood === 'imperative' && (form.tense === 'impAff' || form.tense === 'impNeg')
    } else if (specificTense === 'nonfiniteMixed') {
      // Mixed nonfinite: gerund and participle
      if (form.mood !== 'nonfinite' || (form.tense !== 'ger' && form.tense !== 'part')) {
        return false
      }

      // For irregular verb type, allow all nonfinite forms of irregular lemmas
      if (verbType === 'irregular') {
        const v = verbLookupMap?.get(form.lemma)
        return (v?.type || 'regular') === 'irregular'
      }

      return true
    } else if (form.tense !== specificTense) {
      return false
    }
  }

  return true
}

/**
 * Create fallback pool with relaxed filters
 * Used when no forms pass the strict filtering
 */
export function createFallbackPool(forms, settings, context = {}) {
  const {
    level,
    region,
    practiceMode,
    specificMood,
    specificTense,
    verbType
  } = settings

  const { verbLookupMap } = context

  const isSpecificTopicPractice = (practiceMode === 'specific' || practiceMode === 'theme')
  const allowedCombos = isSpecificTopicPractice ? null : getAllowedCombosForLevel(level)

  // Single pass filtering
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

    // Verb type restriction
    const isMixedPractice = !verbType || verbType === 'mixed' || verbType === 'all'
    const verb = verbLookupMap?.get(f.lemma)

    if (verb && verbType === 'regular' && !isMixedPractice) {
      return verb.type === 'regular'
    } else if (verb && verbType === 'irregular' && !isMixedPractice) {
      return verb.type === 'irregular'
    }

    return true
  })

  // Apply dialect filtering
  fallback = fallback.filter(f => {
    if (f.mood === 'nonfinite') return true

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

  // Progressive relaxation
  if (fallback.length === 0 && specificTense) {
    fallback = forms.filter(f => f.mood === specificMood)
  }

  if (fallback.length === 0 && specificMood) {
    fallback = forms
  }

  return fallback
}

/**
 * Exclude current item from eligible forms to avoid repetition
 */
export function excludeCurrentItem(eligible, currentItem, practiceMode) {
  if (!currentItem || eligible.length <= 1) {
    return eligible
  }

  const { lemma, mood, tense, person } = currentItem

  // For specific practice, prioritize verb variety
  if (practiceMode === 'specific') {
    const filteredByLemma = eligible.filter(f => f.lemma !== lemma)
    return filteredByLemma.length > 0 ? filteredByLemma : eligible
  }

  // For other modes, exclude exact match
  const filtered = eligible.filter(f =>
    f.lemma !== lemma || f.mood !== mood || f.tense !== tense || f.person !== person
  )

  return filtered.length > 0 ? filtered : eligible
}
