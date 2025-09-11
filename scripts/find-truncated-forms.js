#!/usr/bin/env node
/**
 * Scan dataset for truncated forms (e.g., "respond", "no respond") and propose fixes.
 * - Uses the same stem rule as the validator (lemma without -ar/-er/-ir)
 * - Suggests regular subjPres/impAff/impNeg 3p fixes for common cases
 * - Marks entries that likely need irregular review (e.g., -cer/-cir, -ger/-gir, -guir)
 *
 * Usage:
 *   node scripts/find-truncated-forms.js
 */

import { verbs as mainVerbs } from '../src/data/verbs.js'
import { getAllVerbsWithPriority } from '../src/data/priorityVerbs.js'

const allVerbs = getAllVerbsWithPriority(mainVerbs)

function isTruncated(lemma, value) {
  if (!lemma || !value) return false
  if (!/(?:ar|er|ir)$/.test(lemma)) return false
  const stem = lemma.slice(0, -2)
  const val = value.trim().toLowerCase()
  return val === stem || val === `no ${stem}`
}

function computeRegularSuggestions(lemma, mood, tense, person) {
  const ending = lemma.slice(-2)
  const stem = lemma.slice(0, -2)
  const result = {}

  // Present subjunctive 3p (regular baseline)
  if (mood === 'subjunctive' && tense === 'subjPres' && person === '3p') {
    result.suggested = ending === 'ar' ? `${stem}en` : `${stem}an`
  }

  // Imperative affirmative 3p (mirrors subjunctive 3p)
  if (mood === 'imperative' && tense === 'impAff' && person === '3p') {
    result.suggested = ending === 'ar' ? `${stem}en` : `${stem}an`
  }

  // Imperative negative 3p ("no " + subjunctive 3p)
  if (mood === 'imperative' && tense === 'impNeg' && person === '3p') {
    result.suggested = `no ${ending === 'ar' ? `${stem}en` : `${stem}an`}`
  }

  return result
}

function needsIrregularReview(lemma) {
  // Heuristics: these families often mutate the stem in present subjunctive
  return (
    /(?:cer|cir)$/.test(lemma) || // conocer -> conozcan, conducir -> conduzcan
    /(?:ger|gir)$/.test(lemma) || // proteger -> protejan (g->j)
    /(?:guir)$/.test(lemma)       // distinguir -> distingan (gu->g)
  )
}

const findings = []

allVerbs.forEach((verb) => {
  verb.paradigms?.forEach((paradigm, pIndex) => {
    paradigm.forms?.forEach((form, fIndex) => {
      if (!form?.value || !form?.mood || !form?.tense) return
      if (!isTruncated(verb.lemma, form.value)) return

      const base = {
        lemma: verb.lemma,
        id: verb.id,
        pIndex,
        fIndex,
        mood: form.mood,
        tense: form.tense,
        person: form.person,
        value: form.value
      }

      const suggestion = computeRegularSuggestions(verb.lemma, form.mood, form.tense, form.person)
      findings.push({
        ...base,
        suggested: suggestion.suggested || null,
        needs_irregular_review: needsIrregularReview(verb.lemma)
      })
    })
  })
})

// Output
if (findings.length === 0) {
  console.log('✅ No truncated forms found.')
  process.exit(0)
}

console.log(`🚨 Truncated forms detected: ${findings.length}`)

// Group by lemma for easier review
const byLemma = new Map()
for (const f of findings) {
  if (!byLemma.has(f.lemma)) byLemma.set(f.lemma, [])
  byLemma.get(f.lemma).push(f)
}

for (const [lemma, items] of byLemma.entries()) {
  const flag = items.some(i => i.needs_irregular_review) ? ' (needs irregular review)' : ''
  console.log(`\n— ${lemma}${flag}`)
  items.forEach(i => {
    console.log(`  ${i.mood}|${i.tense}|${i.person}: "${i.value}"` + (i.suggested ? ` → suggest: "${i.suggested}"` : ''))
  })
}

// Also print machine-readable JSON for tooling
console.log('\nJSON:\n' + JSON.stringify(findings, null, 2))

