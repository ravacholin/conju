#!/usr/bin/env node

import { verbs } from './src/data/verbs.js'
import { categorizeVerb } from './src/lib/data/irregularFamilies.js'

console.log('🔍 CATEGORIZATION DIAGNOSTIC')
console.log('============================\n')

// Test specific verbs that should have diphthongization
const testVerbs = [
  { lemma: 'pensar', family: 'DIPHT_E_IE' },
  { lemma: 'volver', family: 'DIPHT_O_UE' },
  { lemma: 'poder', family: 'DIPHT_O_UE' },
  { lemma: 'pedir', family: 'E_I_IR' },
  { lemma: 'tener', family: 'G_VERBS' },
  { lemma: 'hacer', family: 'G_VERBS' },
  { lemma: 'ser', family: 'MONOSYLLABIC_IRREG' },
  { lemma: 'hablar', expected: 'regular' }
]

console.log('1️⃣ VERB CATEGORIZATION TEST')
console.log('============================')

for (const test of testVerbs) {
  const verb = verbs.find(v => v.lemma === test.lemma)
  
  if (!verb) {
    console.log(`❌ ${test.lemma}: NOT FOUND`)
    continue
  }
  
  const families = categorizeVerb(test.lemma, verb)
  console.log(`📝 ${test.lemma}:`)
  console.log(`   Type: ${verb.type || 'undefined'}`)
  console.log(`   Families: ${families.length > 0 ? families.join(', ') : 'NONE'}`)
  
  if (test.family) {
    if (families.includes(test.family)) {
      console.log(`   ✅ Correctly categorized as ${test.family}`)
    } else {
      console.log(`   ❌ Expected ${test.family}, got: ${families.join(', ') || 'NONE'}`)
    }
  } else if (test.expected === 'regular') {
    if (families.length === 0 || families.every(f => f.startsWith('ORTH_'))) {
      console.log(`   ✅ Correctly identified as regular`)
    } else {
      console.log(`   ❌ Expected regular, but has families: ${families.join(', ')}`)
    }
  }
  
  // Check subjunctive forms
  const subjForms = []
  verb.paradigms.forEach(p => {
    p.forms.forEach(f => {
      if (f.mood === 'subjunctive' && f.tense === 'subjPres') {
        subjForms.push(f)
      }
    })
  })
  
  console.log(`   Subjunctive present forms: ${subjForms.length}`)
  if (subjForms.length > 0) {
    console.log(`   Sample: ${subjForms.slice(0, 3).map(f => `${f.person}=${f.value}`).join(', ')}`)
  }
  console.log('')
}

console.log('2️⃣ AUDIT FILTER TEST')
console.log('=====================')

// Test the same filtering logic the audit script uses
import { chooseNext } from './src/lib/core/generator.js'
import { useSettings } from './src/state/settings.js'

// Set settings for testing
useSettings.getState().set({
  level: 'B1',
  useVoseo: false,
  useTuteo: true,
  useVosotros: false,
  practiceMode: 'specific',
  specificMood: 'subjunctive',
  specificTense: 'subjPres',
  verbType: 'irregular',
  selectedFamily: 'DIPHT_E_IE'
})

// Get all forms
const allForms = []
verbs.forEach(verb => {
  verb.paradigms.forEach(paradigm => {
    paradigm.forms.forEach(form => {
      allForms.push({
        ...form,
        lemma: verb.lemma,
        type: verb.type || 'regular'
      })
    })
  })
})

console.log('Testing subjunctive present with DIPHT_E_IE family...')

const subjPresent = allForms.filter(f => 
  f.mood === 'subjunctive' && 
  f.tense === 'subjPres'
)
console.log(`Total subjunctive present forms: ${subjPresent.length}`)

// Test which verbs have DIPHT_E_IE categorization
const diphtEIE = []
subjPresent.forEach(form => {
  const verb = verbs.find(v => v.lemma === form.lemma)
  if (verb) {
    const families = categorizeVerb(form.lemma, verb)
    if (families.includes('DIPHT_E_IE')) {
      diphtEIE.push(form)
    }
  }
})

console.log(`Forms categorized as DIPHT_E_IE: ${diphtEIE.length}`)
if (diphtEIE.length > 0) {
  const uniqueVerbs = [...new Set(diphtEIE.map(f => f.lemma))]
  console.log(`Verbs: ${uniqueVerbs.join(', ')}`)
} else {
  console.log('❌ No verbs found with DIPHT_E_IE categorization!')
}

console.log('\n3️⃣ RECOMMENDATIONS')
console.log('==================')

if (diphtEIE.length === 0) {
  console.log('❌ PROBLEM IDENTIFIED: Verb categorization is not working correctly')
  console.log('   - Verbs like "pensar" should be categorized as DIPHT_E_IE')
  console.log('   - But the categorizeVerb function is not assigning families correctly')
  console.log('   - This explains why the audit shows 0 verbs for irregular families')
  
  console.log('\n🔧 SOLUTION: Fix the categorizeVerb function to properly detect:')
  console.log('   - Diphthongization patterns (e→ie, o→ue)')
  console.log('   - Irregular present tense patterns')
  console.log('   - Stem changes based on actual verb forms, not just lemma patterns')
}