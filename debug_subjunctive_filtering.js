// DEBUG SCRIPT - Subjunctive Filtering Problem
// This script will test the exact filtering logic to find the bug

import { verbs } from './src/data/verbs.js'
import { chooseNext } from './src/lib/core/generator.js'

console.log('🔍 DEBUGGING SUBJUNCTIVE FILTERING PROBLEM')
console.log('==========================================')

// Prepare all forms from all verbs
const allForms = []
verbs.forEach(verb => {
  verb.paradigms.forEach(paradigm => {
    paradigm.forms.forEach(form => {
      allForms.push({
        ...form,
        lemma: verb.lemma,
        type: verb.type
      })
    })
  })
})

console.log(`📊 Total forms in database: ${allForms.length}`)

// Find subjunctive present forms specifically
const subjPresentForms = allForms.filter(f => 
  f.mood === 'subjunctive' && f.tense === 'subjPres'
)

console.log(`📊 Subjunctive present forms found: ${subjPresentForms.length}`)
console.log(`📊 Sample subjunctive forms:`)
subjPresentForms.slice(0, 10).forEach(f => {
  console.log(`  - ${f.lemma}: ${f.value} (${f.person})`)
})

// Test the chooseNext function with subjunctive settings
console.log('\n🧪 TESTING CHOOSENEXT WITH SUBJUNCTIVE SETTINGS')
console.log('================================================')

// Mock the settings store to simulate user selecting subjunctive present
const mockSettings = {
  level: 'B1',
  useVoseo: true,
  useTuteo: true,
  useVosotros: false,
  practiceMode: 'specific',
  specificMood: 'subjunctive',
  specificTense: 'subjPres',
  practicePronoun: 'all',
  verbType: 'all',
  region: 'rioplatense',
  enableFuturoSubjProd: false,
  allowedLemmas: null,
  enableC2Conmutacion: false,
  conmutacionSeq: null,
  conmutacionIdx: 0,
  rotateSecondPerson: false,
  nextSecondPerson: '2s_tu',
  cliticsPercent: 0
}

// Mock the useSettings store
const originalUseSettings = global.useSettings || {}
global.useSettings = {
  getState: () => mockSettings
}

console.log('🎯 Settings for test:', {
  practiceMode: mockSettings.practiceMode,
  specificMood: mockSettings.specificMood,
  specificTense: mockSettings.specificTense,
  level: mockSettings.level
})

// Test multiple times to see what we get
console.log('\n🔬 RUNNING CHOOSENEXT 10 TIMES:')
for (let i = 0; i < 10; i++) {
  try {
    const result = chooseNext({
      forms: allForms,
      history: {},
      currentItem: null
    })
    
    if (result) {
      console.log(`Test ${i+1}: ${result.lemma} - ${result.mood}/${result.tense} - ${result.person} - "${result.value}"`)
      
      // Check if it's actually subjunctive present
      if (result.mood !== 'subjunctive') {
        console.log(`  ❌ ERROR: Expected subjunctive, got ${result.mood}`)
      } else if (result.tense !== 'subjPres') {
        console.log(`  ❌ ERROR: Expected subjPres, got ${result.tense}`)
      } else {
        console.log(`  ✅ CORRECT: Subjunctive present form`)
      }
    } else {
      console.log(`Test ${i+1}: NULL (no forms found)`)
    }
  } catch (error) {
    console.log(`Test ${i+1}: ERROR - ${error.message}`)
  }
}

// Additional debug: manually test the filtering logic
console.log('\n🔍 MANUAL FILTERING TEST')
console.log('========================')

// Test the same filtering logic that should happen in chooseNext
const testForms = allForms.filter(f => {
  // Should only allow subjunctive mood
  if (f.mood !== 'subjunctive') {
    return false
  }
  
  // Should only allow subjPres tense
  if (f.tense !== 'subjPres') {
    return false
  }
  
  return true
})

console.log(`📊 Manual filtering result: ${testForms.length} forms`)
console.log('Sample manually filtered forms:')
testForms.slice(0, 10).forEach(f => {
  console.log(`  - ${f.lemma}: ${f.value} (${f.person})`)
})

if (testForms.length === 0) {
  console.log('❌ CRITICAL: Manual filtering returned zero forms!')
} else {
  console.log('✅ Manual filtering found subjunctive present forms')
}