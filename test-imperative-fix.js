#!/usr/bin/env node

// Test script to verify imperative conjugation fixes
import { verbs } from './src/data/verbs.js'

console.log('🧪 TESTING IMPERATIVE FIXES')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const testCases = [
  { lemma: 'subir', person: '3s', expected: 'suba', description: 'subir (usted)' },
  { lemma: 'subir', person: '1p', expected: 'subamos', description: 'subir (nosotros)' },
  { lemma: 'aprender', person: '3s', expected: 'aprenda', description: 'aprender (usted)' },
  { lemma: 'aprender', person: '1p', expected: 'aprendamos', description: 'aprender (nosotros)' },
  { lemma: 'vender', person: '3s', expected: 'venda', description: 'vender (usted)' },
  { lemma: 'vender', person: '1p', expected: 'vendamos', description: 'vender (nosotros)' },
]

let passed = 0
let failed = 0

testCases.forEach(testCase => {
  const verb = verbs.find(v => v.lemma === testCase.lemma)
  
  if (!verb) {
    console.log(`❌ ${testCase.description}: Verb not found`)
    failed++
    return
  }
  
  // Find the imperative form
  let found = false
  for (const paradigm of verb.paradigms) {
    const imperativeForm = paradigm.forms?.find(f => 
      f.mood === 'imperative' && 
      f.tense === 'impAff' && 
      f.person === testCase.person
    )
    
    if (imperativeForm) {
      if (imperativeForm.value === testCase.expected) {
        console.log(`✅ ${testCase.description}: "${imperativeForm.value}" ✅`)
        passed++
      } else {
        console.log(`❌ ${testCase.description}: Expected "${testCase.expected}", got "${imperativeForm.value}"`)
        failed++
      }
      found = true
      break
    }
  }
  
  if (!found) {
    console.log(`❌ ${testCase.description}: Form not found`)
    failed++
  }
})

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('🎉 ALL CRITICAL IMPERATIVE BUGS FIXED!')
} else {
  console.log('🚨 Some issues remain - needs further investigation')
}