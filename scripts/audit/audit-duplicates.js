#!/usr/bin/env node
import { loadAllVerbs, eachForm } from './utils.js'
import fs from 'node:fs'
import path from 'node:path'

const all = loadAllVerbs()
const findings = []
const APPLY = process.argv.includes('--apply')

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
