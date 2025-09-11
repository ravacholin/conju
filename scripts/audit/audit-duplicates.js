#!/usr/bin/env node
import { loadAllVerbs, eachForm, isTruncated, allowedShortImperatives } from './utils.js'
import fs from 'node:fs'
import path from 'node:path'

const all = loadAllVerbs()
const findings = []
const APPLY = process.argv.includes('--apply')
const RESOLVE = process.argv.includes('--resolve-conflicts')
const FAIL = process.argv.includes('--fail-on-findings')

for (const verb of all) {
  const slotMap = new Map() // mood|tense|person -> values[]
  const exactSet = new Set() // mood|tense|person|value
  eachForm(verb, (form, pIndex, fIndex) => {
    const slotKey = `${form.mood}|${form.tense}|${form.person}`
    if (!slotMap.has(slotKey)) slotMap.set(slotKey, [])
    slotMap.get(slotKey).push({ value: form.value, pIndex, fIndex })
    const ek = `${slotKey}|${form.value}`
    if (exactSet.has(ek)) {
      findings.push({ lemma: verb.lemma, type: 'exact_duplicate', slotKey, value: form.value, pIndex, fIndex })
    } else exactSet.add(ek)
  })
  for (const [slotKey, entries] of slotMap.entries()) {
    if (entries.length > 1) {
      const values = [...new Set(entries.map(e => e.value))]
      if (values.length > 1) {
        findings.push({ lemma: verb.lemma, type: 'slot_conflict', slotKey, values, count: entries.length })
      } else {
        findings.push({ lemma: verb.lemma, type: 'slot_duplicate', slotKey, value: values[0], count: entries.length })
      }
    }
  }
}

if (findings.length === 0) {
  console.log('✅ No duplicates detected')
  process.exit(0)
}

console.log(`🧪 Duplicate audit: ${findings.length} issues`)
const byLemma = group(findings, f => f.lemma)
for (const [lemma, list] of byLemma) {
  console.log(`\n— ${lemma}`)
  list.forEach(i => {
    if (i.type === 'exact_duplicate') console.log(`  exact: ${i.slotKey} -> "${i.value}" (p${i.pIndex}#${i.fIndex})`)
    else if (i.type === 'slot_conflict') console.log(`  conflict: ${i.slotKey} -> [${i.values.join(', ')}] (${i.count})`)
    else console.log(`  duplicate: ${i.slotKey} -> "${i.value}" (${i.count})`)
  })
}
console.log('\nJSON:\n' + JSON.stringify(findings, null, 2))

if (FAIL) {
  process.exit(1)
}

if (APPLY) {
  // Only remove exact duplicates; ignore slot_conflict and slot_duplicate (non-exact) for safety
  const exacts = findings.filter(f => f.type === 'exact_duplicate')
  if (exacts.length === 0) {
    console.log('\nℹ️  --apply: no exact duplicates to remove')
    process.exit(0)
  }
  console.log(`\n🛠  Removing ${exacts.length} exact duplicates in src/data/verbs.js ...`)
  const verbsPath = path.resolve('src/data/verbs.js')
  const { verbs } = await import(path.resolve('src/data/verbs.js') + '?t=' + Date.now())
  // Group removals by lemma and paradigm to handle indices safely
  const removals = new Map() // key: lemma|pIndex -> [fIndex,...]
  exacts.forEach(e => {
    const key = `${e.lemma}|${e.pIndex}`
    if (!removals.has(key)) removals.set(key, [])
    removals.get(key).push(e.fIndex)
  })
  let removed = 0
  const lemmaToIndex = new Map(verbs.map((v,i)=>[v.lemma,i]))
  for (const [key, idxs] of removals.entries()) {
    const [lemma, pStr] = key.split('|')
    const vi = lemmaToIndex.get(lemma)
    if (vi == null) continue
    const pIndex = Number(pStr)
    const forms = verbs[vi]?.paradigms?.[pIndex]?.forms
    if (!Array.isArray(forms)) continue
    // Remove in descending order to keep indices valid
    idxs.sort((a,b)=>b-a).forEach(fi => {
      if (forms[fi]) { forms.splice(fi, 1); removed++ }
    })
  }
  if (removed > 0) {
    const backup = verbsPath + '.backup-' + Date.now()
    fs.copyFileSync(verbsPath, backup)
    const original = fs.readFileSync(verbsPath, 'utf8')
    const prefixMatch = original.match(/^[\s\S]*?(?=export const verbs\s*=)/)
    const prefix = prefixMatch ? prefixMatch[0] : ''
    const out = prefix + 'export const verbs = ' + JSON.stringify(verbs, null, 2) + '\n'
    fs.writeFileSync(verbsPath, out, 'utf8')
    console.log(`✅ Removed ${removed} exact duplicates. Backup: ${path.basename(backup)}`)
    // Propagate removals to derived datasets by removing exact duplicates per (lemma, slot, value)
    const targets = [path.resolve('src/data/verbs-enriched.js'), path.resolve('src/data/chunks/irregulars.js')]
    for (const file of targets) {
      try {
        const mod = await import(file + '?t=' + Date.now())
        const arr = Array.isArray(mod.verbs) ? mod.verbs : null
        if (!arr) continue
        let changed = 0
        const lemmaToIndex = new Map(arr.map((v,i)=>[v.lemma,i]))
        const byLemma = new Map()
        exacts.forEach(e => {
          if (!byLemma.has(e.lemma)) byLemma.set(e.lemma, [])
          byLemma.get(e.lemma).push(e)
        })
        for (const [lemma, items] of byLemma.entries()) {
          const vi2 = lemmaToIndex.get(lemma)
          if (vi2 == null) continue
          const verb = arr[vi2]
          // Build a seen set per paradigm to remove duplicates across all forms
          const seen = new Set()
          for (const p of verb.paradigms || []) {
            if (!Array.isArray(p.forms)) continue
            const newForms = []
            for (const f of p.forms) {
              const slot = `${f.mood}|${f.tense}|${f.person}|${f.value}`
              if (seen.has(slot)) { changed++; continue }
              seen.add(slot); newForms.push(f)
            }
            p.forms = newForms
          }
        }
        if (changed > 0) {
          const backup2 = file + '.backup-' + Date.now()
          fs.copyFileSync(file, backup2)
          const original2 = fs.readFileSync(file, 'utf8')
          const prefixMatch2 = original2.match(/^[\s\S]*?(?=export const verbs\s*=)/)
          const prefix2 = prefixMatch2 ? prefixMatch2[0] : ''
          const out2 = prefix2 + 'export const verbs = ' + JSON.stringify(arr, null, 2) + '\n'
          fs.writeFileSync(file, out2, 'utf8')
          console.log(`↪️  Propagated removal of ${changed} duplicates to ${path.basename(file)} (backup: ${path.basename(backup2)})`)
        }
      } catch (e) {
        console.warn('Propagation skipped for', file, e?.message)
      }
    }
    // Optional: resolve conflicts by removing truncated variants when a correct value exists
    if (RESOLVE) {
      const files = [verbsPath, ...targets]
      for (const file of files) {
        try {
          const mod = await import(file + '?t=' + Date.now())
          const arr = Array.isArray(mod.verbs) ? mod.verbs : null
          if (!arr) continue
          let removedTrunc = 0
          for (const verb of arr) {
            for (const p of verb.paradigms || []) {
              if (!Array.isArray(p.forms)) continue
              // Group by slot
              const slotMap = new Map()
              p.forms.forEach((f, idx) => {
                const k = `${f.mood}|${f.tense}|${f.person}`
                if (!slotMap.has(k)) slotMap.set(k, [])
                slotMap.get(k).push({ f, idx })
              })
              // For each slot, if multiple values and one is truncated → remove truncated
              for (const [slot, entries] of slotMap.entries()) {
                if (entries.length <= 1) continue
                const values = [...new Set(entries.map(e => (e.f.value || '').trim()))]
                if (values.length <= 1) continue
                const truncatedIdxs = entries
                  .filter(e => isTruncated(verb.lemma, e.f.value) && !allowedShortImperatives(verb.lemma, e.f))
                  .map(e => e.idx)
                const hasNonTruncated = entries.some(e => !isTruncated(verb.lemma, e.f.value))
                if (hasNonTruncated && truncatedIdxs.length > 0) {
                  // Remove all truncated variants for this slot
                  // Remove in descending order
                  truncatedIdxs.sort((a,b)=>b-a).forEach(i => { if (p.forms[i]) { p.forms.splice(i,1); removedTrunc++ } })
                }
              }
            }
          }
          if (removedTrunc > 0) {
            const backup3 = file + '.backup-' + Date.now()
            fs.copyFileSync(file, backup3)
            const original3 = fs.readFileSync(file, 'utf8')
            const pref3 = original3.match(/^[\s\S]*?(?=export const verbs\s*=)/)
            const prefix3 = pref3 ? pref3[0] : ''
            const out3 = prefix3 + 'export const verbs = ' + JSON.stringify(arr, null, 2) + '\n'
            fs.writeFileSync(file, out3, 'utf8')
            console.log(`🧹 Resolved ${removedTrunc} truncated conflicts in ${path.basename(file)} (backup: ${path.basename(backup3)})`)
          }
        } catch (e) {
          console.warn('Conflict resolution skipped for', file, e?.message)
        }
      }
    }
  } else {
    console.log('\nℹ️  --apply: nothing changed (data already normalized?)')
  }
}

function group(arr, keyFn){
  const m = new Map()
  for (const x of arr){
    const k = keyFn(x)
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(x)
  }
  return m
}
