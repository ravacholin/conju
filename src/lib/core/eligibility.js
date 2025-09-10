import { gateFormsByCurriculumAndDialect, getAllowedCombosForLevel } from './curriculumGate.js'
import { verbs } from '../../data/verbs.js'
import { buildNonfiniteFormsForLemma } from './nonfiniteBuilder.js'

// Returns forms eligible for the given settings and precomputed region forms
export function getEligibleFormsForSettings(allFormsForRegion, settings) {
  return gateFormsByCurriculumAndDialect(allFormsForRegion, settings)
}

// Returns allowed moods for a level (cumulative by curriculum), or for theme practice returns all moods
export function getAllowedMoods(settings) {
  const { level, practiceMode, cameFromTema } = settings || {}
  // Theme shows all; Specific only shows all when coming explicitly from Tema
  if (practiceMode === 'theme' || (practiceMode === 'specific' && cameFromTema === true)) {
    return ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
  }
  const combos = getAllowedCombosForLevel(level || 'A1')
  const moods = new Set()
  for (const combo of combos) {
    const [mood] = combo.split('|')
    moods.add(mood)
  }
  return Array.from(moods)
}

// Returns allowed tenses for a given mood under current settings
export function getAllowedTensesForMood(settings, mood) {
  const { level, practiceMode, cameFromTema } = settings || {}
  // Theme shows all; Specific only shows all when coming explicitly from Tema
  if (practiceMode === 'theme' || (practiceMode === 'specific' && cameFromTema === true)) {
    const map = {
      indicative: ['pres','pretPerf','pretIndef','impf','plusc','fut','futPerf'],
      subjunctive: ['subjPres','subjImpf','subjPerf','subjPlusc'],
      imperative: ['impAff','impNeg','impMixed'],
      conditional: ['cond','condPerf'],
      nonfinite: ['ger','part','nonfiniteMixed']
    }
    return map[mood] || []
  }
  const combos = getAllowedCombosForLevel(level || 'A1')
  const out = new Set()
  combos.forEach((combo) => {
    const [m, t] = combo.split('|')
    if (m === mood) out.add(t)
  })
  return Array.from(out)
}

// Build canonical pool of forms for a given region, including synthesized nonfinite forms
export function buildFormsForRegion(region) {
  if (!region) return []
  const regionForms = []
  const lemmas = new Set()
  for (const verb of verbs) {
    const paradigms = verb.paradigms || []
    let eligible = false
    for (const p of paradigms) {
      if (!p.regionTags || !p.regionTags.includes(region)) continue
      eligible = true
      for (const f of p.forms || []) {
        regionForms.push({ ...f, lemma: verb.lemma })
      }
    }
    if (eligible) lemmas.add(verb.lemma)
  }
  // Add nonfinite synthesized once per lemma
  for (const lemma of lemmas) {
    const nf = buildNonfiniteFormsForLemma(lemma)
    regionForms.push(...nf)
  }
  // Deduplicate
  const seen = new Set()
  const out = []
  for (const f of regionForms) {
    const person = f.mood === 'nonfinite' ? '' : (f.person || '')
    const key = `${f.lemma}|${f.mood}|${f.tense}|${person}|${f.value}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(f)
  }
  return out
}

// One-stop helper: build the pool for region and apply curriculum+dialect gate
export function getEligiblePool(settings) {
  const base = buildFormsForRegion(settings?.region)
  return getEligibleFormsForSettings(base, settings)
}
