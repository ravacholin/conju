import { gateFormsByCurriculumAndDialect, getAllowedCombosForLevel } from './curriculumGate.js'
import { getFormsForRegion } from './verbDataService.js'

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

// Build canonical pool of forms for a given region (now synchronous)
export function buildFormsForRegion(region, settings = {}) {
  if (!region) return []

  if (region === 'global') {
    const rioplatenseForms = getFormsForRegion('rioplatense', settings)
    const peninsularForms = getFormsForRegion('peninsular', settings)

    const allForms = [...rioplatenseForms, ...peninsularForms]
    const seen = new Set()
    const out = []
    for (const f of allForms) {
      const person = f.mood === 'nonfinite' ? '' : (f.person || '')
      const key = `${f.lemma}|${f.mood}|${f.tense}|${person}|${f.value}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(f)
    }
    return out
  }

  return getFormsForRegion(region, settings)
}

// One-stop helper: build the pool for region and apply curriculum+dialect gate (now synchronous)
export function getEligiblePool(settings) {
  const base = buildFormsForRegion(settings?.region, settings)
  return getEligibleFormsForSettings(base, settings)
}
