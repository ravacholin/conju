/**
 * DrillFormFilters.js - Form filtering logic extracted from useDrillMode
 * 
 * This module handles all form filtering operations including:
 * - Specific practice filtering (mood/tense constraints)
 * - Verb type filtering (regular/irregular)
 * - Level-based filtering (CEFR level constraints)
 * - Person/pronoun filtering (dialect constraints)
 * - Mixed tense handling (imperative mixed, nonfinite mixed)
 */

import { getFormsForRegion } from '../../lib/core/verbDataService.js'
import { VERB_LOOKUP_MAP } from '../../lib/core/optimizedCache.js'
import { 
  isRegularFormForMood, 
  isRegularNonfiniteForm,
  hasIrregularParticiple
} from '../../lib/core/conjugationRules.js'
import { LEVELS } from '../../lib/data/levels.js'
import { getAllowedCombosForLevel as gateCombos } from '../../lib/core/curriculumGate.js'
import { categorizeVerb } from '../../lib/data/irregularFamilies.js'
import { expandSimplifiedGroup } from '../../lib/data/simplifiedFamilyGroups.js'

// Cache for generated forms to avoid regenerating
const formsCache = new Map()

function deduplicateForms(forms = []) {
  const seen = new Set()
  const out = []
  for (const form of forms) {
    const person = form.mood === 'nonfinite' ? '' : (form.person || '')
    const key = `${form.lemma}|${form.mood}|${form.tense}|${person}|${form.value}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(form)
  }
  return out
}

const lookupVerb = (lemma) => VERB_LOOKUP_MAP.get(lemma)

/**
 * Genera dinámicamente todas las formas de verbos para una región específica
 * Optimizado para el sistema de chunks - carga solo los verbos necesarios
 * @param {string} region - Región (rioplatense, la_general, peninsular)
 * @param {Object} settings - Configuración del usuario para optimizar carga
 * @returns {Array} - Array de formas enriquecidas con lemma
 */
export async function generateAllFormsForRegion(region = 'la_general', settings = {}) {
  const cacheKey = `forms:${region}:${settings.level || 'ALL'}:${settings.practiceMode || 'mixed'}:${settings.selectedFamily || 'none'}:${settings.verbType || 'all'}:${settings.enableChunks !== false ? 'chunks' : 'nochunks'}`
  
  // Check cache first
  if (formsCache.has(cacheKey)) {
    return formsCache.get(cacheKey)
  }
  
  const normalizeForms = (forms = []) => forms.map(form => ({ ...form }))

  try {
    let forms
    if (region === 'global') {
      const [rioplatense, peninsular] = await Promise.all([
        getFormsForRegion('rioplatense', settings),
        getFormsForRegion('peninsular', settings)
      ])
      const combined = [...normalizeForms(rioplatense), ...normalizeForms(peninsular)]
      const dedup = deduplicateForms(combined)
      forms = dedup
    } else {
      forms = normalizeForms(await getFormsForRegion(region, settings))
    }

    if ((!forms || forms.length === 0) && settings.enableChunks !== false) {
      console.warn('generateAllFormsForRegion', 'Primary form load returned empty, retrying with chunks disabled')
      const fallbackSettings = { ...settings, enableChunks: false }
      const fallbackForms = region === 'global'
        ? deduplicateForms([
            ...normalizeForms(await getFormsForRegion('rioplatense', fallbackSettings)),
            ...normalizeForms(await getFormsForRegion('peninsular', fallbackSettings))
          ])
        : normalizeForms(await getFormsForRegion(region, fallbackSettings))
      if (fallbackForms?.length) {
        forms = fallbackForms
      }
    }

    if (!forms || forms.length === 0) {
      console.error('generateAllFormsForRegion', 'No forms available after all fallbacks', { region, settings })
      formsCache.set(cacheKey, [])
      return []
    }

    formsCache.set(cacheKey, forms)
    return forms
  } catch (error) {
    console.error('generateAllFormsForRegion', 'Failed to build forms for region', { region, settings, error })
    formsCache.set(cacheKey, [])
    return []
  }
}

/**
 * Limpia el cache de formas - útil cuando se cambian configuraciones importantes
 */
export function clearFormsCache() {
  formsCache.clear()
}

/**
 * Get allowed mood/tense combinations for a specific CEFR level.
 * The inventory for each level in `levels.js` is cumulative.
 * @param {string} level - CEFR level (A1, A2, B1, B2, C1, C2, ALL)
 * @returns {Set} - Set of allowed "mood|tense" combinations
 */
// Delegate to core gating to avoid mood-name mismatches
const getAllowedCombosForLevel = (level) => gateCombos(level)

/**
 * Check if a person/pronoun is allowed based on dialect settings
 * @param {string} person - Person identifier (e.g., '2s_tu', '2s_vos', '2p_vosotros')
 * @param {Object} settings - User settings containing dialect preferences
 * @returns {boolean} - Whether the person is allowed
 */
export const allowsPerson = (person, settings) => {
  const { region, practicePronoun, useVoseo, useVosotros } = settings

  // Handle explicit pronoun selection overrides first
  if (practicePronoun === 'all') {
    // 'all' explicitly requests all pronouns regardless of region
    return true
  }

  // Handle specific dialect forms - only allow if explicitly enabled
  if (person === '2s_vos' && !useVoseo) return false
  if (person === '2p_vosotros' && !useVosotros) return false

  // If explicitly enabled, allow the specific dialect forms
  if (person === '2s_vos' && useVoseo) return true
  if (person === '2p_vosotros' && useVosotros) return true

  // Strict regional constraints (only apply if not in hybrid mode)
  if (!practicePronoun || practicePronoun === 'mixed') {
    if (region === 'rioplatense') {
      // Rioplatense: only 2s_vos, no tu, no vosotros
      return person !== '2s_tu' && person !== '2p_vosotros'
    }
    if (region === 'la_general') {
      // La General: only 2s_tu, no vos, no vosotros
      return person !== '2s_vos' && person !== '2p_vosotros'
    }
    if (region === 'peninsular') {
      // Peninsular: 2s_tu and 2p_vosotros, no vos
      return person !== '2s_vos'
    }
  }

  // Specific pronoun filters
  if (practicePronoun === 'tu_only') return person === '2s_tu'
  if (practicePronoun === 'vos_only') return person === '2s_vos'

  return true
}

/**
 * Check if a form matches specific practice constraints
 * @param {Object} form - Form object with mood, tense, person properties
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {boolean} - Whether the form matches the constraints
 */
export const matchesSpecific = (form, specificConstraints) => {
  const { isSpecific, specificMood, specificTense } = specificConstraints
  
  if (!isSpecific) return true
  
  // Handle mixed tenses
  if (specificTense === 'impMixed') {
    return form.mood === specificMood && (form.tense === 'impAff' || form.tense === 'impNeg')
  }
  if (specificTense === 'nonfiniteMixed') {
    return form.mood === specificMood && (form.tense === 'ger' || form.tense === 'part')
  }
  
  // Standard specific filtering
  return form.mood === specificMood && form.tense === specificTense
}

/**
 * Check if a form's tense is allowed for the current CEFR level
 * @param {Object} form - Form object with mood, tense properties
 * @param {Object} settings - User settings containing level and practice mode
 * @returns {boolean} - Whether the form is allowed for the level
 */
export const allowsLevel = (form, settings) => {
  // Theme practice always shows all topics across levels
  if (settings.practiceMode === 'theme') return true
  // Specific practice: only bypass level gating when explicitly coming from Tema
  if (settings.practiceMode === 'specific' && settings.cameFromTema === true) return true

  const userLevel = settings.level || 'A1'
  const allowed = getAllowedCombosForLevel(userLevel)
  return allowed.has(`${form.mood}|${form.tense}`)
}

/**
 * Filter forms for specific practice mode
 * @param {Array} allForms - All available forms for the region
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {Array} - Filtered forms matching specific practice
 */
export const filterForSpecificPractice = (allForms, specificConstraints) => {
  const { isSpecific, specificMood, specificTense } = specificConstraints
  
  if (!isSpecific) return allForms
  
  const filtered = allForms.filter(form => {
    // Handle mixed tenses
    if (specificTense === 'impMixed') {
      return form.mood === specificMood && (form.tense === 'impAff' || form.tense === 'impNeg')
    }
    if (specificTense === 'nonfiniteMixed') {
      return form.mood === specificMood && (form.tense === 'ger' || form.tense === 'part')
    }
    
    // Standard specific filtering
    return form.mood === specificMood && form.tense === specificTense
  })
  
  return filtered
}

/**
 * Filter forms by verb type (regular/irregular)
 * @param {Array} forms - Forms to filter
 * @param {string} verbType - 'regular', 'irregular', or null/undefined for all
 * @returns {Array} - Filtered forms
 */
export const filterByVerbType = (forms, verbType, settings = null) => {
  if (!verbType || verbType === 'all') return forms
  
  // Enforce: when user asks for 'regular', we filter by lemma (pure regular verbs only),
  // regardless of the global irregularityFilterMode. This matches user expectation.
  // For 'irregular', respect per-form detection (tense mode) unless explicitly overridden.
  let mode = verbType === 'regular' ? 'lemma' : (settings?.irregularityFilterMode || 'tense') // 'tense' | 'lemma'

  // Override: For third-person preterite irregulars, force lemma mode to keep all persons
  if (settings?.selectedFamily === 'PRETERITE_THIRD_PERSON' && verbType === 'irregular') {
    mode = 'lemma'
  }

  const isIrregularForm = (f) => {
    if (!f || !f.value) return false
    if (f.mood === 'nonfinite') {
      // Gerund/Participle irregularity by morphology
      return !isRegularNonfiniteForm(f.lemma, f.tense, f.value)
    }
    // Simple/compound tenses: detect irregular surface form
    if (f.tense === 'pretPerf' || f.tense === 'plusc' || f.tense === 'futPerf' || f.tense === 'condPerf' || f.tense === 'subjPerf' || f.tense === 'subjPlusc') {
      // Compound: participle must be irregular to count as irregular form
      // If the participle is regular, consider the whole periphrasis regular
      // Detect regularity from surface string
      return !isRegularNonfiniteForm(f.lemma, 'part', (f.value || '').split(/\s+/).pop()) && hasIrregularParticiple(f.lemma)
    }
    return !isRegularFormForMood(f.lemma, f.mood, f.tense, f.person, f.value)
  }
  if (mode === 'lemma') {
    // Build quick lookup maps once
    const lemmaTypeCache = new Map()
    const getLemmaType = (lemma, fallback) => {
      if (!lemma) return fallback || 'regular'
      if (lemmaTypeCache.has(lemma)) return lemmaTypeCache.get(lemma)
      const verb = lookupVerb(lemma)
      const t = verb?.type || fallback || 'regular'
      lemmaTypeCache.set(lemma, t)
      return t
    }
    if (verbType === 'irregular') return forms.filter(f => (f.verbType || getLemmaType(f.lemma)) === 'irregular')
    // verbType === 'regular'
    // Primary set: forms whose LEMMA is regular (pure regular verbs)
    const pureRegularForms = forms.filter(f => (f.verbType || getLemmaType(f.lemma)) === 'regular')

    // Secondary set: forms that are morphologically regular even if the lemma is irregular
    const isIrregularForm = (f) => {
      if (!f || !f.value) return false
      if (f.mood === 'nonfinite') {
        return !isRegularNonfiniteForm(f.lemma, f.tense, f.value)
      }
      if (f.tense === 'pretPerf' || f.tense === 'plusc' || f.tense === 'futPerf' || f.tense === 'condPerf' || f.tense === 'subjPerf' || f.tense === 'subjPlusc') {
        return !isRegularNonfiniteForm(f.lemma, 'part', (f.value || '').split(/\s+/).pop()) && hasIrregularParticiple(f.lemma)
      }
      return !isRegularFormForMood(f.lemma, f.mood, f.tense, f.person, f.value)
    }
    const regularFormsOfIrregularLemmas = forms.filter(f => (f.verbType || getLemmaType(f.lemma)) === 'irregular' && !isIrregularForm(f))

    // Bias: keep majority pure regulars; allow up to 25% spill-in from irregular lemmas
    const spillRatio = 0.25
    const quota = Math.max(0, Math.floor(pureRegularForms.length * spillRatio))
    let spill = []
    if (quota > 0 && regularFormsOfIrregularLemmas.length > 0) {
      // Random sample without replacement up to quota
      const pool = regularFormsOfIrregularLemmas.slice()
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp
      }
      spill = pool.slice(0, quota)
    } else if (pureRegularForms.length === 0) {
      // Fallback: if no pure regular lemmas available, at least allow regular-by-morphology forms
      spill = regularFormsOfIrregularLemmas
    }
    return [...pureRegularForms, ...spill]
  }
  // mode === 'tense' (default): decide per-form by morphology/tense
  if (verbType === 'irregular') {
    return forms.filter(isIrregularForm)
  }
  // verbType === 'regular'
  const regularForms = forms.filter(f => {
    return !isIrregularForm(f)
  })
  return regularForms
}

/**
 * Apply comprehensive filtering to forms
 * @param {Array} forms - Forms to filter
 * @param {Object} settings - User settings
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {Array} - Comprehensively filtered forms
 */
export const applyComprehensiveFiltering = (forms, settings, specificConstraints = {}) => {
  let filtered = forms

  // 1. Filter for specific practice if applicable
  filtered = filterForSpecificPractice(filtered, specificConstraints)

  // 2. Filter by verb type
  filtered = filterByVerbType(filtered, settings.verbType, settings)

  // 3. Apply pedagogical filtering for third-person irregular pretérito
  filtered = applyPedagogicalFiltering(filtered, settings)

  // 4. Filter by irregular family if specified (for theme practice)
  filtered = applyFamilyFiltering(filtered, settings)

  // 5. Filter by person/pronoun constraints
  filtered = filtered.filter(form => allowsPerson(form.person, settings))

  // 6. Filter by level constraints
  filtered = filtered.filter(form => allowsLevel(form, settings))

  return filtered
}

/**
 * Filter due items for specific practice constraints
 * @param {Array} dueCells - Due items from SRS system
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {Array} - Filtered due items
 */
export const filterDueForSpecific = (dueCells, specificConstraints) => {
  const { isSpecific, specificMood, specificTense } = specificConstraints
  
  if (!isSpecific) return dueCells
  
  return dueCells.filter(dc => {
    if (!dc) return false
    
    // Handle mixed tenses
    if (specificTense === 'impMixed') {
      return dc.mood === specificMood && (dc.tense === 'impAff' || dc.tense === 'impNeg')
    }
    if (specificTense === 'nonfiniteMixed') {
      return dc.mood === specificMood && (dc.tense === 'ger' || dc.tense === 'part')
    }
    
    return dc.mood === specificMood && dc.tense === specificTense
  })
}

/**
 * Validate that a form passes all integrity checks
 * @param {Object} form - Form to validate
 * @param {Object} settings - User settings
 * @param {Object} specificConstraints - Specific practice constraints
 * @returns {boolean} - Whether the form passes all checks
 */
export const passesIntegrityChecks = (form, settings, specificConstraints = {}) => {
  if (!form) return false
  
  return (
    matchesSpecific(form, specificConstraints) &&
    allowsPerson(form.person, settings) &&
    allowsLevel(form, settings)
  )
}

/**
 * Get filtering statistics for debugging
 * @param {Array} originalForms - Original form array
 * @param {Array} filteredForms - Filtered form array
 * @param {Object} settings - User settings
 * @returns {Object} - Filtering statistics
 */
export const getFilteringStats = (originalForms, filteredForms, settings) => {
  return {
    original: originalForms.length,
    filtered: filteredForms.length,
    reduction: originalForms.length - filteredForms.length,
    reductionPercent: originalForms.length > 0 
      ? Math.round(((originalForms.length - filteredForms.length) / originalForms.length) * 100)
      : 0,
    settings: {
      verbType: settings.verbType,
      level: settings.level,
      region: settings.region,
      practiceMode: settings.practiceMode
    }
  }
}

/**
 * Apply pedagogical filtering for third-person irregular pretérito
 * This ensures only appropriate verbs appear in third-person irregular practice
 * @param {Array} forms - Forms to filter
 * @param {Object} settings - User settings
 * @returns {Array} - Filtered forms
 */
const applyPedagogicalFiltering = (forms, settings) => {
  return forms.filter(f => {
    // Only apply pedagogical filtering for "Irregulares en 3ª persona" drill (all persons)
    if (f.tense === 'pretIndef' && settings.verbType === 'irregular' && settings.selectedFamily === 'PRETERITE_THIRD_PERSON') {
      // Find the verb in the dataset to get its complete definition
      const verb = lookupVerb(f.lemma)
      if (!verb) return true // If verb not found, allow it through (defensive)

      const verbFamilies = categorizeVerb(f.lemma, verb)
      const pedagogicalThirdPersonFamilies = ['E_I_IR', 'O_U_GER_IR', 'HIATUS_Y']
      const isPedagogicallyRelevant = verbFamilies.some(family => pedagogicalThirdPersonFamilies.includes(family))

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

    return true // Allow all other forms through
  })
}

/**
 * Apply irregular family filtering for theme practice
 * @param {Array} forms - Forms to filter
 * @param {Object} settings - User settings
 * @returns {Array} - Filtered forms
 */
const applyFamilyFiltering = (forms, settings) => {
  // Only apply family filtering when specifically requested (theme practice with selectedFamily)
  if (!settings.selectedFamily || settings.practiceMode !== 'theme') {
    return forms // No family filtering needed
  }

  return forms.filter(form => {
    try {
      // Find the verb in the dataset to get its complete definition
      const verb = lookupVerb(form.lemma)
      if (!verb) return true // If verb not found, allow it through (defensive)

      const verbFamilies = categorizeVerb(form.lemma, verb)

      // Check if it's a simplified group that needs expansion
      const expandedFamilies = expandSimplifiedGroup(settings.selectedFamily)
      if (expandedFamilies.length > 0) {
        // It's a simplified group - check if the verb belongs to ANY of the included families
        return verbFamilies.some(vf => expandedFamilies.includes(vf))
      } else {
        // It's a regular family - check direct match
        return verbFamilies.includes(settings.selectedFamily)
      }
    } catch (error) {
      console.warn(`Failed to categorize verb ${form.lemma} for family filtering:`, error)
      return false // Exclude verbs that can't be categorized
    }
  })
}

// Export the helper function for use by other modules
export { getAllowedCombosForLevel }
