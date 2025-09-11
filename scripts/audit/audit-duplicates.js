#!/usr/bin/env node
import { loadAllVerbs, eachForm } from './utils.js'

const all = loadAllVerbs()
const findings = []

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

function group(arr, keyFn){
  const m = new Map()
  for (const x of arr){
    const k = keyFn(x)
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(x)
  }
  return m
}

