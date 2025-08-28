import { gateFormsByCurriculumAndDialect, getAllowedCombosForLevel } from './curriculumGate.js'

// Returns forms eligible for the given settings and precomputed region forms
export function getEligibleFormsForSettings(allFormsForRegion, settings) {
  return gateFormsByCurriculumAndDialect(allFormsForRegion, settings)
}

// Returns allowed moods for a level (cumulative by curriculum), or for theme practice returns all moods
export function getAllowedMoods(settings) {
  const { level, practiceMode, cameFromTema } = settings || {}
  if (practiceMode === 'specific' && cameFromTema) {
    // By theme: allow all moods
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
  if (practiceMode === 'specific' && cameFromTema) {
    // By theme: allow all tenses for the mood
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

