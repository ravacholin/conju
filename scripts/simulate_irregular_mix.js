// Simulation: validate irregular ratio rebalancer (~65%) in theme-specific mixed pools
// Run: node scripts/simulate_irregular_mix.js

import { varietyEngine } from '../src/lib/core/advancedVarietyEngine.js'
import { verbs } from '../src/data/verbs.js'

function getAllowedPersons(region) {
  if (region === 'rioplatense') return new Set(['1s','2s_vos','3s','1p','3p'])
  if (region === 'peninsular') return new Set(['1s','2s_tu','3s','1p','2p_vosotros','3p'])
  // la_general (LatAm tú)
  return new Set(['1s','2s_tu','3s','1p','3p'])
}

function buildPresentPool(region = 'la_general') {
  const allowedPersons = getAllowedPersons(region)
  const forms = []
  for (const v of verbs) {
    for (const p of v.paradigms || []) {
      if (!p.regionTags || !p.regionTags.includes(region)) continue
      for (const f of p.forms || []) {
        if (f.mood === 'indicative' && f.tense === 'pres') {
          if (f.mood !== 'nonfinite' && f.person && !allowedPersons.has(f.person)) continue
          forms.push({ ...f, lemma: v.lemma })
        }
      }
    }
  }
  return forms
}

async function main() {
  // Optional quiet mode to suppress engine logs
  const QUIET = process.env.QUIET === '1' || process.env.QUIET === 'true'
  let originalLog, originalWarn
  if (QUIET) {
    originalLog = console.log
    originalWarn = console.warn
    console.log = () => {}
    console.warn = () => {}
  }
  const region = process.env.REGION || 'la_general'
  const picks = parseInt(process.env.PICKS || '400', 10)
  const forms = buildPresentPool(region)
  // Baseline irregular ratio in the pool
  const byLemma = new Map(verbs.map(v => [v.lemma, v]))
  const isIrregular = (lemma) => (byLemma.get(lemma)?.type) === 'irregular'
  const baseIrr = forms.filter(f => isIrregular(f.lemma)).length
  const baseTotal = forms.length || 1
  const baseFrac = baseIrr / baseTotal

  // byLemma/isIrregular already defined

  if (!forms.length) {
    console.error('No forms found for region:', region)
    process.exit(1)
  }

  let irr = 0, reg = 0
  const personCounts = {}

  // Reset engine session memory for clean run
  varietyEngine.resetSession?.()

  const history = {} // keep neutral to isolate ratio behavior
  for (let i = 1; i <= picks; i++) {
    const sel = varietyEngine.selectVariedForm(forms, 'B1', 'specific', history)
    if (!sel) {
      console.error('No selection returned at i=', i)
      break
    }
    if (isIrregular(sel.lemma)) irr++; else reg++
    personCounts[sel.person] = (personCounts[sel.person] || 0) + 1

    if (i % 50 === 0) {
      const frac = irr / (irr + reg)
      console.log(`[${i}] irregulars=${irr} regulars=${reg} -> ${(frac*100).toFixed(1)}%`)
    }
  }

  const total = irr + reg
  const frac = total ? irr / total : 0
  if (QUIET) { console.log = originalLog; console.warn = originalWarn }
  console.log('--- Simulation Result ---')
  console.log('Region:', region, 'Picks:', total)
  console.log('Irregulars:', irr, 'Regulars:', reg, 'Ratio:', (frac*100).toFixed(1) + '%')
  console.log('Baseline pool irregular ratio:', (baseFrac*100).toFixed(1) + `% (${baseIrr}/${baseTotal})`)
  console.log('Persons:', personCounts)
}

main().catch(err => { console.error(err); process.exit(1) })
