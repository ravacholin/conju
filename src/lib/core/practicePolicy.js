// Centralized practice policy configuration to avoid hardcoded logic scattered around
// - Person weights by level
// - Level-based form weighting rules (compound tenses, subjunctive, imperative, etc.)

import { isIrregularInTense as IS_IRREGULAR_IN_TENSE } from '../utils/irregularityUtils.js'

// Person weights per CEFR level (easy to tune and extend)
export const PERSON_WEIGHTS_BY_LEVEL = {
  A1: { '1s':3, '2s_tu':3, '2s_vos':3, '3s':3, '1p':1, '2p_vosotros':0.2, '3p':0.2 },
  A2: { '1s':2, '2s_tu':2, '2s_vos':2, '3s':2, '1p':1, '2p_vosotros':1, '3p':1 },
  B1: { '1s':1.5, '2s_tu':1.5, '2s_vos':1.5, '3s':1.2, '1p':1, '2p_vosotros':1, '3p':1 },
  B2: (settings) => ({ '1s':1.2, '2s_tu':1.2, '2s_vos':1.2, '3s':1.2, '1p':1, '2p_vosotros': settings?.useVosotros ? 1 : 0.2, '3p':1 }),
  C1: (settings) => ({ '1s':1, '2s_tu':1, '2s_vos':1, '3s':1, '1p':1, '2p_vosotros': settings?.useVosotros ? 1 : 0.2, '3p':1 }),
  C2: (settings) => ({ '1s':1, '2s_tu':1, '2s_vos':1, '3s':1, '1p':1, '2p_vosotros': settings?.useVosotros ? 1 : 0.2, '3p':1 })
}

export function getPersonWeightsForLevel(settings) {
  const level = settings?.level || 'B1'
  const base = { '1s':1,'2s_tu':1,'2s_vos':1,'3s':1,'1p':1,'2p_vosotros':0.5,'3p':0.5 }
  const cfg = PERSON_WEIGHTS_BY_LEVEL[level]
  if (!cfg) return base
  if (typeof cfg === 'function') return cfg(settings)
  return cfg
}

// Level form weighting rules
const COMPOUND_TENSES = new Set(['pretPerf','plusc','futPerf','condPerf','subjPerf','subjPlusc'])

export function applyLevelFormWeighting(forms, settings) {
  const level = settings?.level || 'B1'
  const practiceMode = settings?.practiceMode
  const boosted = []
  const isLevelBasedPractice = practiceMode !== 'specific' && practiceMode !== 'theme'
  const COMPOUND_REDUCTION_FACTOR = 0.4

  const pushN = (f, n) => { for (let i=0;i<n;i++) boosted.push(f) }

  for (const f of forms) {
    let weight = 1
    const lemma = f.lemma
    const val = (f.value || '').toLowerCase()
    const isCompoundTense = COMPOUND_TENSES.has(f.tense)

    if (level === 'A2') {
      if (f.mood === 'indicative' && f.tense === 'pretIndef' && f.person === '1s') {
        if (/(qué|gué|cé)$/.test(val)) weight = 2
      }
      if (f.mood === 'indicative' && f.tense === 'pretIndef' && ['poder','venir','decir','hacer','poner','traer','estar','tener','andar','querer'].includes(lemma)) {
        weight = Math.max(weight, 2)
      }
      if (f.mood === 'indicative' && f.tense === 'pretIndef' && (f.person === '3s' || f.person === '3p') && ['dormir','pedir','seguir','servir','preferir'].includes(lemma)) {
        weight = Math.max(weight, 2)
      }
      if (f.mood === 'imperative' && f.tense === 'impAff' && (f.person === '2s_tu' || f.person === '2s_vos')) {
        weight = Math.max(weight, 2)
      }
    } else if (level === 'B1') {
      if (isCompoundTense) {
        weight = isLevelBasedPractice ? Math.max(1, Math.round(2 * COMPOUND_REDUCTION_FACTOR)) : 2
      }
      if (f.mood === 'subjunctive' && f.tense === 'subjPres') weight = Math.max(weight, 2)
      if (f.mood === 'imperative' && f.tense === 'impNeg') weight = Math.max(weight, 2)
    } else if (level === 'B2') {
      if (isCompoundTense) weight = isLevelBasedPractice ? Math.max(1, Math.round(2 * COMPOUND_REDUCTION_FACTOR)) : 2
      if (f.mood === 'subjunctive' && f.tense === 'subjImpf') weight = 2
    } else if (level === 'C1' || level === 'C2') {
      if (isCompoundTense && isLevelBasedPractice) weight = Math.max(1, Math.round(2 * COMPOUND_REDUCTION_FACTOR))
      if (f.mood === 'imperative' && f.tense === 'impAff' && /(me|te|se|lo|la|le|nos|los|las|les)$/.test(val.replace(/\s+/g,''))) weight = 2
      if (level === 'C2') {
        const rare = settings?.c2RareBoostLemmas || []
        if (rare.includes(lemma)) weight = Math.max(weight, 3)
      }
    }
    pushN(f, weight)
  }
  return boosted
}
