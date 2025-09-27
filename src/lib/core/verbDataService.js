// Simplified, synchronous verb data service
// Eliminates complex chunk management in favor of direct imports

import { verbs } from '../../data/verbs.js'
import { buildNonfiniteFormsForLemma } from './nonfiniteBuilder.js'
import { categorizeVerb } from '../data/irregularFamilies.js'
import { expandSimplifiedGroup } from '../data/simplifiedFamilyGroups.js'
import { gateFormsByCurriculumAndDialect } from './curriculumGate.js'

// Get all available verbs (synchronous)
export function getAllVerbs() {
  return verbs
}

// Get single verb by lemma (synchronous)
export function getVerbByLemma(lemma) {
  return verbs.find(verb => verb.lemma === lemma) || null
}

// Get multiple verbs by lemmas (synchronous)
export function getVerbsByLemmas(lemmas) {
  if (!Array.isArray(lemmas)) return []
  const lemmaSet = new Set(lemmas)
  return verbs.filter(verb => lemmaSet.has(verb.lemma))
}

// Build forms for a specific region (synchronous)
export function getFormsForRegion(region, settings = {}) {
  const forms = []

  for (const verb of verbs) {
    if (!verb?.paradigms) continue

    for (const paradigm of verb.paradigms) {
      // Check if paradigm matches region
      if (!paradigm.regionTags?.includes(region)) continue
      if (!paradigm.forms) continue

      for (const form of paradigm.forms) {
        const enrichedForm = {
          ...form,
          lemma: verb.lemma,
          id: `${verb.lemma}|${form.mood}|${form.tense}|${form.person || ''}`,
          type: verb.type || 'regular',
          verbType: verb.type || 'regular'
        }
        forms.push(enrichedForm)
      }
    }
  }

  return forms
}

// Get example verbs for learning (synchronous)
export function getExampleVerbs({ verbType = 'all', families = [], tense = null, region = 'la_general' } = {}) {
  let candidateVerbs = verbs

  // Filter by verb type
  if (verbType === 'regular') {
    candidateVerbs = candidateVerbs.filter(verb => verb.type === 'regular' || !verb.type)
  } else if (verbType === 'irregular') {
    candidateVerbs = candidateVerbs.filter(verb => verb.type === 'irregular')
  }

  // Filter by families if specified
  if (families.length > 0) {
    candidateVerbs = candidateVerbs.filter(verb => {
      try {
        const verbFamilies = categorizeVerb(verb.lemma, verb)
        return families.some(selectedFamily => {
          const expandedFamilies = expandSimplifiedGroup(selectedFamily)
          if (expandedFamilies.length > 0) {
            return verbFamilies.some(vf => expandedFamilies.includes(vf))
          } else {
            return verbFamilies.includes(selectedFamily)
          }
        })
      } catch (error) {
        console.warn(`Failed to categorize verb ${verb.lemma}:`, error)
        return false
      }
    })
  }

  // For learning purposes, prioritize common verbs
  const priorityVerbs = [
    'ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber',
    'querer', 'poner', 'parecer', 'creer', 'seguir', 'venir', 'pensar', 'salir', 'volver',
    'conocer', 'vivir', 'sentir', 'empezar', 'hablar', 'comer'
  ]

  // Sort by priority
  candidateVerbs.sort((a, b) => {
    const aPriority = priorityVerbs.indexOf(a.lemma)
    const bPriority = priorityVerbs.indexOf(b.lemma)

    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority
    } else if (aPriority !== -1) {
      return -1
    } else if (bPriority !== -1) {
      return 1
    } else {
      return a.lemma.localeCompare(b.lemma)
    }
  })

  return candidateVerbs.slice(0, 15)
}

// Get verb forms for display (synchronous)
export function getVerbForms(lemma, region = 'la_general') {
  const verb = getVerbByLemma(lemma)
  if (!verb?.paradigms) return []

  const forms = []
  for (const paradigm of verb.paradigms) {
    if (!paradigm.regionTags?.includes(region)) continue
    if (!paradigm.forms) continue

    for (const form of paradigm.forms) {
      forms.push({
        ...form,
        lemma: verb.lemma,
        verbType: verb.type || 'regular'
      })
    }
  }

  return forms
}

// Preload nonfinite sets (simplified, synchronous)
export function preloadNonfiniteSets(lemmas) {
  if (!Array.isArray(lemmas) || lemmas.length === 0) return []

  const results = []
  for (const lemma of lemmas) {
    const forms = buildNonfiniteFormsForLemma(lemma)
    if (forms.length > 0) {
      results.push({ lemma, forms })
    }
  }
  return results
}

// Get eligible forms for settings (synchronous)
export function getEligibleFormsForSettings(region, settings) {
  const forms = getFormsForRegion(region, settings)
  return gateFormsByCurriculumAndDialect(forms, settings)
}

// Get verb metadata (synchronous)
export function getVerbMetadata(lemma) {
  const verb = getVerbByLemma(lemma)
  if (!verb) return null

  return {
    lemma: verb.lemma,
    type: verb.type || 'regular',
    families: categorizeVerb(verb.lemma, verb) || []
  }
}

// Cache stats (simplified)
export function getVerbDataCacheStats() {
  return {
    totalVerbs: verbs.length,
    cacheType: 'direct_import'
  }
}

// Clear caches (no-op since we're using direct imports)
export function clearVerbDataCaches() {
  // No-op for direct import strategy
}