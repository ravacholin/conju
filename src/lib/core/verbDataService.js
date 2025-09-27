import { verbChunkManager } from './verbChunkManager.js'
import { FORM_LOOKUP_MAP, VERB_LOOKUP_MAP, getVerbByLemma, getVerbsByLemmas } from './optimizedCache.js'
import { buildNonfiniteFormsForLemma } from './nonfiniteBuilder.js'
import { categorizeVerb } from '../data/irregularFamilies.js'
import { expandSimplifiedGroup } from '../data/simplifiedFamilyGroups.js'
import { determineVerbFrequency } from '../progress/verbInitialization.js'
import { gateFormsByCurriculumAndDialect } from './curriculumGate.js'

const regionFormsCache = new Map()
const lemmaFormsCache = new Map()
const metadataCache = new Map()

function getFormCacheKey({ lemma, mood, tense, person }) {
  return `${lemma}|${mood}|${tense}|${person || ''}`
}

function cacheForms(forms) {
  for (const form of forms) {
    const key = getFormCacheKey(form)
    if (!FORM_LOOKUP_MAP.has(key)) {
      FORM_LOOKUP_MAP.set(key, { ...form, id: key })
    }
  }
}

function cacheVerbs(verbs) {
  for (const verb of verbs) {
    if (!verb?.lemma) continue
    if (!VERB_LOOKUP_MAP.has(verb.lemma)) {
      VERB_LOOKUP_MAP.set(verb.lemma, verb)
    }
    if (verb.id && !VERB_LOOKUP_MAP.has(verb.id)) {
      VERB_LOOKUP_MAP.set(verb.id, verb)
    }
  }
}

async function loadVerbsForContext(region, settings = {}) {
  if (settings.enableChunks === false) {
    const allVerbs = await verbChunkManager.ensureGlobalFallbackVerbs()
    cacheVerbs(allVerbs)
    return allVerbs
  }

  try {
    if (settings.practiceMode === 'theme' || settings.selectedFamily) {
      const theme = settings.selectedFamily || 'mixed'
      const families = settings.selectedFamily ? [settings.selectedFamily] : []
      const verbs = await verbChunkManager.getVerbsByTheme(theme, families)
      if (verbs?.length) {
        cacheVerbs(verbs)
        return verbs
      }
    }

    let preferredChunks = ['core']
    if (settings.level && ['A1', 'A2'].includes(settings.level)) {
      preferredChunks = ['core', 'common']
    } else if (settings.verbType === 'irregular' || (settings.level && ['B1', 'B2', 'C1', 'C2'].includes(settings.level))) {
      preferredChunks = ['core', 'common', 'irregulars']
    } else {
      preferredChunks = ['core', 'common']
    }

    const verbs = await verbChunkManager.getVerbsWithRobustFailsafe(preferredChunks)
    if (verbs?.length) {
      cacheVerbs(verbs)
      return verbs
    }
  } catch (error) {
    console.warn('verbDataService: chunk loading failed, using fallback', error)
    if (verbChunkManager.fetchAvailable) {
      await verbChunkManager.handleCriticalFailure(error)
    }
  }

  const allVerbs = await verbChunkManager.ensureGlobalFallbackVerbs()
  cacheVerbs(allVerbs)
  return allVerbs
}

function buildFormsFromVerbs(verbs, region) {
  const forms = []
  const lemmas = new Set()
  for (const verb of verbs) {
    if (!verb?.paradigms) continue
    for (const paradigm of verb.paradigms) {
      if (region && region !== 'global' && region !== 'ALL') {
        if (!paradigm.regionTags?.includes(region)) continue
      }
      for (const form of paradigm.forms || []) {
        const enriched = {
          ...form,
          lemma: verb.lemma,
          verbId: verb.id,
          verbType: verb.type || 'regular'
        }
        forms.push(enriched)
      }
    }
    lemmas.add(verb.lemma)
  }

  for (const lemma of lemmas) {
    const nfForms = buildNonfiniteFormsForLemma(lemma)
    for (const nf of nfForms) {
      forms.push({ ...nf, lemma })
    }
  }

  const deduped = []
  const seen = new Set()
  for (const form of forms) {
    const key = getFormCacheKey(form)
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(form)
  }

  cacheForms(deduped)
  return deduped
}

export async function getFormsForRegion(region = 'la_general', settings = {}) {
  if (!region) return []
  const cacheKey = JSON.stringify({ region, settings: {
    level: settings.level || null,
    practiceMode: settings.practiceMode || null,
    selectedFamily: settings.selectedFamily || null,
    verbType: settings.verbType || null,
    enableChunks: settings.enableChunks !== false
  } })

  if (regionFormsCache.has(cacheKey)) {
    return regionFormsCache.get(cacheKey)
  }

  const verbs = await loadVerbsForContext(region, settings)
  const forms = buildFormsFromVerbs(verbs, region)
  regionFormsCache.set(cacheKey, forms)
  return forms
}

export function clearRegionFormsCache() {
  regionFormsCache.clear()
}

async function hydrateLemmaForms(lemma, options = {}) {
  if (lemmaFormsCache.has(lemma)) {
    return lemmaFormsCache.get(lemma)
  }

  const verb = await getVerbByLemma(lemma)
  if (!verb) return []

  const region = options.region || null
  const forms = []
  for (const paradigm of verb.paradigms || []) {
    if (region && !paradigm.regionTags?.includes(region)) continue
    for (const form of paradigm.forms || []) {
      const enriched = { ...form, lemma }
      forms.push(enriched)
    }
  }

  const nonfinite = buildNonfiniteFormsForLemma(lemma)
  for (const nf of nonfinite) {
    forms.push({ ...nf, lemma })
  }

  cacheForms(forms)
  lemmaFormsCache.set(lemma, forms)
  return forms
}

export async function getVerbForms(lemma, options = {}) {
  return hydrateLemmaForms(lemma, options)
}

function buildMetadataFromVerb(verb) {
  if (!verb) return null
  const cached = metadataCache.get(verb.lemma)
  if (cached) return cached

  const irregularFamilies = (() => {
    try {
      return categorizeVerb(verb.lemma, verb)
    } catch (error) {
      console.warn('verbDataService: categorizeVerb failed', error)
      return []
    }
  })()

  const metadata = {
    lemma: verb.lemma,
    type: verb.type || 'regular',
    frequency: determineVerbFrequency(verb.lemma) || 'medium',
    irregularFamilies,
    tags: verb.tags || [],
    metadata: verb.metadata || {}
  }

  metadataCache.set(verb.lemma, metadata)
  return metadata
}

export async function getVerbMetadata(lemma) {
  if (!lemma) return null
  if (metadataCache.has(lemma)) {
    return metadataCache.get(lemma)
  }

  const verb = await getVerbByLemma(lemma)
  if (!verb) return null
  return buildMetadataFromVerb(verb)
}

export async function getLemmaType(lemma) {
  const metadata = await getVerbMetadata(lemma)
  return metadata?.type || 'regular'
}

export async function getExampleVerbs({ verbType = 'all', families = [], tense = null, region = 'la_general' } = {}) {
  const regionSettings = {
    verbType,
    practiceMode: families.length > 0 ? 'theme' : 'mixed',
    selectedFamily: families[0] || null
  }

  const forms = await getFormsForRegion(region, regionSettings)
  let filtered = forms

  if (verbType && verbType !== 'all') {
    filtered = filtered.filter(form => form.verbType === verbType)
  }

  if (families.length > 0) {
    const expandedFamilies = families.flatMap(family => {
      const expanded = expandSimplifiedGroup(family)
      return Array.isArray(expanded) && expanded.length > 0 ? expanded : [family]
    })
    const lemmas = new Set()
    for (const form of filtered) {
      lemmas.add(form.lemma)
    }
    const verbs = await getVerbsByLemmas(Array.from(lemmas))
    const allowed = new Set()
    for (const verb of verbs) {
      const verbFamilies = categorizeVerb(verb.lemma, verb)
      if (verbFamilies.some(family => expandedFamilies.includes(family))) {
        allowed.add(verb.lemma)
      }
    }
    filtered = filtered.filter(form => allowed.has(form.lemma))
  }

  if (tense) {
    filtered = filtered.filter(form => form.tense === tense)
  }

  const orderedLemmas = []
  const seen = new Set()
  for (const form of filtered) {
    if (!seen.has(form.lemma)) {
      seen.add(form.lemma)
      orderedLemmas.push(form.lemma)
    }
  }

  if (orderedLemmas.length === 0) {
    return []
  }

  const verbs = await getVerbsByLemmas(orderedLemmas)
  const byLemma = new Map(verbs.map(verb => [verb.lemma, verb]))
  const orderedVerbs = orderedLemmas
    .map(lemma => byLemma.get(lemma))
    .filter(Boolean)

  return orderedVerbs.slice(0, 15)
}

export async function preloadNonfiniteSets(lemmas) {
  if (!Array.isArray(lemmas) || lemmas.length === 0) return []
  await getVerbsByLemmas(lemmas)
  const results = []
  for (const lemma of lemmas) {
    const forms = buildNonfiniteFormsForLemma(lemma)
    results.push(...forms.map(form => ({ ...form, lemma })))
  }
  cacheForms(results)
  return results
}

export async function getEligibleFormsForSettings(region, settings) {
  const forms = await getFormsForRegion(region, settings)
  return gateFormsByCurriculumAndDialect(forms, settings)
}

export function clearVerbDataCaches() {
  regionFormsCache.clear()
  lemmaFormsCache.clear()
  metadataCache.clear()
}

export function getVerbDataCacheStats() {
  return {
    regions: regionFormsCache.size,
    lemmas: lemmaFormsCache.size,
    metadata: metadataCache.size,
    formsIndexed: FORM_LOOKUP_MAP.size,
    verbsIndexed: VERB_LOOKUP_MAP.size
  }
}

export { getVerbByLemma } from './optimizedCache.js'

export async function getAllVerbs(options = {}) {
  try {
    const verbs = await verbChunkManager.getAllVerbs(options)
    cacheVerbs(verbs)
    return verbs
  } catch (error) {
    console.error('verbDataService: getAllVerbs failed', error)
    return []
  }
}
