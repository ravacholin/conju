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
import fs from 'node:fs'
import path from 'node:path'

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
const APPLY = process.argv.includes('--apply')

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

if (APPLY) {
  // Apply only safe suggestions (have suggested, and not flagged for irregular review)
  const safe = findings.filter(f => f.suggested && !f.needs_irregular_review)
  if (safe.length === 0) {
    console.log('\nℹ️  --apply: no safe fixes to apply')
    process.exit(0)
  }
  console.log(`\n🛠  Applying ${safe.length} safe fixes to src/data/verbs.js ...`)
  const verbsPath = path.resolve('src/data/verbs.js')
  // Load fresh copy to mutate
  const { verbs } = await import(path.resolve('src/data/verbs.js') + '?t=' + Date.now())
  let applied = 0
  const indexByLemma = new Map(verbs.map((v, i) => [v.lemma, i]))
  for (const fx of safe) {
    const vi = indexByLemma.get(fx.lemma)
    if (vi == null) continue
    const verb = verbs[vi]
    const par = verb.paradigms?.[fx.pIndex]
    const frm = par?.forms?.[fx.fIndex]
    if (!frm) continue
    // Confirm slot matches (defensive)
    if (frm.mood === fx.mood && frm.tense === fx.tense && frm.person === fx.person) {
      // Only change if current value still equals the truncated one we detected
      const current = (frm.value || '').trim()
      if (current === fx.value) {
        frm.value = fx.suggested
        applied++
      }
    }
  }
  if (applied > 0) {
    // Backup
    const backup = verbsPath + '.backup-' + Date.now()
    fs.copyFileSync(verbsPath, backup)
    // Preserve leading comments if any
    const original = fs.readFileSync(verbsPath, 'utf8')
    const prefixMatch = original.match(/^[\s\S]*?(?=export const verbs\s*=)/)
    const prefix = prefixMatch ? prefixMatch[0] : ''
    const out = prefix + 'export const verbs = ' + JSON.stringify(verbs, null, 2) + '\n'
    fs.writeFileSync(verbsPath, out, 'utf8')
    console.log(`✅ Applied ${applied} fixes. Backup: ${path.basename(backup)}`)
    // Propagate to derived datasets
    await propagateDerived(safe)
  } else {
    console.log('\nℹ️  --apply: nothing changed (data already fixed?)')
  }
}

async function propagateDerived(fixes) {
  const targets = [
    path.resolve('src/data/verbs-enriched.js'),
    path.resolve('src/data/chunks/irregulars.js')
  ]
  for (const file of targets) {
    try {
      const mod = await import(file + '?t=' + Date.now())
      const arr = Array.isArray(mod.verbs) ? mod.verbs : null
      if (!arr) continue
      let changed = 0
      const idxByLemma = new Map(arr.map((v,i)=>[v.lemma,i]))
      for (const fx of fixes) {
        const vi = idxByLemma.get(fx.lemma)
        if (vi == null) continue
        const verb = arr[vi]
        const par = verb.paradigms?.[fx.pIndex]
        const frm = par?.forms?.[fx.fIndex]
        if (frm && frm.mood === fx.mood && frm.tense === fx.tense && frm.person === fx.person) {
          const current = (frm.value || '').trim()
          if (current === fx.value) { frm.value = fx.suggested; changed++ }
        } else {
          // Fallback: search form by slot and current truncated value
          outer: for (const p of verb.paradigms || []) {
            for (const f of p.forms || []) {
              if (f.mood === fx.mood && f.tense === fx.tense && f.person === fx.person) {
                if ((f.value || '').trim() === fx.value) { f.value = fx.suggested; changed++; break outer }
              }
            }
          }
        }
      }
      if (changed > 0) {
        const backup = file + '.backup-' + Date.now()
        fs.copyFileSync(file, backup)
        const original = fs.readFileSync(file, 'utf8')
        const prefixMatch = original.match(/^[\s\S]*?(?=export const verbs\s*=)/)
        const prefix = prefixMatch ? prefixMatch[0] : ''
        const out = prefix + 'export const verbs = ' + JSON.stringify(arr, null, 2) + '\n'
        fs.writeFileSync(file, out, 'utf8')
        console.log(`↪️  Propagated ${changed} fixes to ${path.basename(file)} (backup: ${path.basename(backup)})`)
      }
    } catch (e) {
      console.warn('Propagation skipped for', file, e?.message)
    }
  }
}
