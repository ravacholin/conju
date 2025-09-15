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

// Dynamic verb loading with chunk manager
import { verbChunkManager } from '../../lib/core/verbChunkManager.js'
// Fallback dataset for lemma-type lookups
import { verbs as FULL_VERB_DATASET } from '../../data/verbs.js'
import { 
  isRegularFormForMood, 
  isRegularNonfiniteForm,
  hasIrregularParticiple
} from '../../lib/core/conjugationRules.js'
import { LEVELS } from '../../lib/data/levels.js'
import { getAllowedCombosForLevel as gateCombos } from '../../lib/core/curriculumGate.js'

// Cache for generated forms to avoid regenerating
const formsCache = new Map()

/**
 * Genera dinámicamente todas las formas de verbos para una región específica
 * Optimizado para el sistema de chunks - carga solo los verbos necesarios
 * @param {string} region - Región (rioplatense, la_general, peninsular)
 * @param {Object} settings - Configuración del usuario para optimizar carga
 * @returns {Array} - Array de formas enriquecidas con lemma
 */
export async function generateAllFormsForRegion(region = 'la_general', settings = {}) {
  const cacheKey = `forms:${region}:${settings.level || 'ALL'}:${settings.practiceMode || 'mixed'}:${settings.selectedFamily || 'none'}`
  
  // Check cache first
  if (formsCache.has(cacheKey)) {
    return formsCache.get(cacheKey)
  }
  
  const startTime = performance.now()
  let verbs = []
  
  try {
    // Estrategia de carga inteligente basada en contexto del usuario
    if (settings.enableChunks === false) {
      // FALLBACK SYSTEM: Si chunks están deshabilitados, usar archivo principal
      console.log('🚨 CHUNKS DISABLED - Using fallback to main verbs file')
      const { verbs: allVerbs } = await import('../../data/verbs.js')
      verbs = allVerbs
    } else {
      // Sistema de chunks normal
      if (settings.practiceMode === 'theme' || settings.selectedFamily) {
        // Para práctica por tema, usar getVerbsByTheme
        const theme = settings.selectedFamily || 'mixed'
        const families = settings.selectedFamily ? [settings.selectedFamily] : []
        verbs = await verbChunkManager.getVerbsByTheme(theme, families)
      } else if (settings.level && ['A1', 'A2'].includes(settings.level)) {
        // Para niveles básicos, cargar core + common
        await verbChunkManager.loadChunk('core')
        await verbChunkManager.loadChunk('common')
        
        const coreVerbs = verbChunkManager.loadedChunks.get('core') || []
        const commonVerbs = verbChunkManager.loadedChunks.get('common') || []
        verbs = [...coreVerbs, ...commonVerbs]
      } else if (settings.verbType === 'irregular' || (settings.level && ['B1', 'B2', 'C1', 'C2'].includes(settings.level))) {
        // Para verbos irregulares o niveles avanzados, incluir chunk de irregulares
        await verbChunkManager.loadChunk('core')
        await verbChunkManager.loadChunk('common')
        await verbChunkManager.loadChunk('irregulars')
        
        const loadedChunks = ['core', 'common', 'irregulars']
        verbs = []
        loadedChunks.forEach(chunkName => {
          const chunk = verbChunkManager.loadedChunks.get(chunkName)
          if (chunk) verbs.push(...chunk)
        })
      } else {
        // Fallback: cargar todos los verbos disponibles en chunks actuales
        // Si no hay suficientes, usar fallback rápido
        const currentVerbs = []
        verbChunkManager.loadedChunks.forEach(chunk => {
          currentVerbs.push(...chunk)
        })
        
        if (currentVerbs.length < 50) { // Threshold mínimo
          console.log('⚠️ Pocos verbos en chunks, usando fallback completo')
          verbs = await verbChunkManager.getAllVerbs()
        } else {
          verbs = currentVerbs
        }
      }
    }
  } catch (error) {
    console.error('Error loading verbs for forms generation:', error)
    console.log('🚨 CHUNKS FAILED - Using emergency fallback to main verbs file')
    
    // CRITICAL: Auto-disable chunks if they keep failing
    if (settings.enableChunks !== false) {
      console.log('💥 AUTO-DISABLING CHUNKS DUE TO REPEATED FAILURES')
      try {
        const { useSettings } = await import('../../state/settings.js')
        useSettings.getState().set({ enableChunks: false })
      } catch (settingsError) {
        console.warn('Could not auto-disable chunks:', settingsError.message)
      }
    }
    
    try {
      // Emergency fallback: cargar directamente desde archivo principal
      const { verbs: allVerbs } = await import('../../data/verbs.js')
      verbs = allVerbs
    } catch (fallbackError) {
      console.error('💀 CRITICAL: Emergency fallback also failed:', fallbackError)
      // Last resort: usar verbChunkManager con timeout muy corto
      verbs = await verbChunkManager.getVerbsWithFallback(['ser', 'estar', 'haber', 'tener'], 500)
      
      if (!verbs || verbs.length === 0) {
        throw new Error('CRITICAL: All verb loading methods failed - system cannot continue')
      }
    }
  }
  
  // Generar formas de todos los verbos cargados
  const allForms = []
  
  verbs.forEach(verb => {
    verb.paradigms?.forEach(paradigm => {
      // Filtrar por región si está especificada
      if (region !== 'ALL' && !paradigm.regionTags?.includes(region)) {
        return
      }
      
      paradigm.forms?.forEach(form => {
        // Enriquecer forma con información del verbo
        const enrichedForm = {
          ...form,
          lemma: verb.lemma,
          verbId: verb.id,
          verbType: verb.type || 'regular'
        }
        allForms.push(enrichedForm)
      })
    })
  })
  
  // Log generation statistics
  const loadTime = performance.now() - startTime
  console.log(`📊 Forms generation: ${allForms.length} forms from ${verbs.length} verbs in ${loadTime.toFixed(1)}ms`)
  
  // Cache el resultado
  formsCache.set(cacheKey, allForms)
  
  return allForms
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
  const { region, practicePronoun } = settings
  
  // Always enforce dialectal constraints regardless of pronounMode
  if (region === 'rioplatense') return person !== '2s_tu' && person !== '2p_vosotros'
  if (region === 'la_general') return person !== '2s_vos' && person !== '2p_vosotros'
  if (region === 'peninsular') return person !== '2s_vos'
  
  // If region not set, optionally apply pronoun filters
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
  const mode = verbType === 'regular' ? 'lemma' : (settings?.irregularityFilterMode || 'tense') // 'tense' | 'lemma'

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
      // Prefer embedded verbType if present in any form
      let t = fallback
      if (!t) {
        const v = FULL_VERB_DATASET.find(vb => vb.lemma === lemma)
        t = v?.type || 'regular'
      }
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
  
  // 3. Filter by person/pronoun constraints
  filtered = filtered.filter(form => allowsPerson(form.person, settings))
  
  // 4. Filter by level constraints
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

// Export the helper function for use by other modules
export { getAllowedCombosForLevel }
