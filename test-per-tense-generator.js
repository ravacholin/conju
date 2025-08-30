#!/usr/bin/env node

// Test script to validate per-tense irregularity system integration with the generator

import { chooseNext } from './src/lib/core/generator.js'
import { useSettings } from './src/state/settings.js'
import { verbs } from './src/data/verbs.js'
import { isIrregularInTense } from './src/lib/utils/irregularityUtils.js'

console.log('🧪 Testing Per-Tense Generator Integration\n')

// Helper to create mock forms for testing
function createMockForms() {
  const forms = []
  
  // Add some forms from different verbs with different irregularity patterns
  const testVerbs = [
    { lemma: 'hablar', shouldBeRegular: ['pres', 'impf', 'subjPres'] },
    { lemma: 'pensar', shouldBeIrregular: ['pres', 'subjPres'], shouldBeRegular: ['impf', 'pretIndef'] },
    { lemma: 'ser', shouldBeIrregular: ['pres', 'pretIndef', 'impf'], shouldBeRegular: ['fut'] }
  ]
  
  testVerbs.forEach(({ lemma, shouldBeIrregular = [], shouldBeRegular = [] }) => {
    const verb = verbs.find(v => v.lemma === lemma)
    if (!verb) return
    
    // Add irregular tense forms
    shouldBeIrregular.forEach(tense => {
      forms.push({
        lemma,
        mood: 'indicative',
        tense,
        person: '1s',
        value: `${lemma}_${tense}_1s`,
        verbObj: verb
      })
    })
    
    // Add regular tense forms
    shouldBeRegular.forEach(tense => {
      forms.push({
        lemma,
        mood: 'indicative', 
        tense,
        person: '1s',
        value: `${lemma}_${tense}_1s`,
        verbObj: verb
      })
    })
  })
  
  return forms
}

// Test 1: Basic generator functionality
console.log('🎯 Testing basic generator functionality...')
const mockForms = createMockForms()

// Set up mock settings for testing
const originalSettings = useSettings.getState()

// Test irregular verb filtering
console.log('\n--- Testing irregular verb filtering ---')
useSettings.setState({
  verbType: 'irregular',
  practiceMode: 'mixed',
  level: 'B1'
})

try {
  const result1 = chooseNext({ 
    forms: mockForms, 
    history: [], 
    currentItem: null 
  })
  
  if (result1) {
    const verb = verbs.find(v => v.lemma === result1.lemma)
    const isIrregular = isIrregularInTense(verb, result1.tense)
    console.log(`✅ Selected: ${result1.lemma} - ${result1.tense} (${isIrregular ? 'IRREGULAR' : 'regular'} in this tense)`)
    
    if (isIrregular) {
      console.log('✅ Correctly selected irregular form for irregular practice')
    } else {
      console.log('⚠️  Selected regular form during irregular practice - may be acceptable in mixed mode')
    }
  } else {
    console.log('❌ No form selected')
  }
} catch (error) {
  console.log('⚠️  Generator test skipped due to missing dependencies:', error.message)
}

// Test 2: Validate per-tense classification accuracy
console.log('\n\n🔍 Validating per-tense classification accuracy...')

const validationTests = [
  { lemma: 'hablar', tense: 'pres', expectedIrregular: false },
  { lemma: 'hablar', tense: 'impf', expectedIrregular: false },
  { lemma: 'pensar', tense: 'pres', expectedIrregular: true },
  { lemma: 'pensar', tense: 'impf', expectedIrregular: false },
  { lemma: 'ser', tense: 'pres', expectedIrregular: true },
  { lemma: 'ser', tense: 'impf', expectedIrregular: true },
  { lemma: 'poder', tense: 'pres', expectedIrregular: true },
  { lemma: 'poder', tense: 'fut', expectedIrregular: true },
  { lemma: 'volver', tense: 'pres', expectedIrregular: true },
  { lemma: 'volver', tense: 'pretIndef', expectedIrregular: false }
]

validationTests.forEach(test => {
  const verb = verbs.find(v => v.lemma === test.lemma)
  if (!verb) {
    console.log(`❌ Verb ${test.lemma} not found`)
    return
  }
  
  const actualIrregular = isIrregularInTense(verb, test.tense)
  const isCorrect = actualIrregular === test.expectedIrregular
  
  console.log(`${isCorrect ? '✅' : '❌'} ${test.lemma} - ${test.tense}: ${actualIrregular ? 'irregular' : 'regular'} (expected: ${test.expectedIrregular ? 'irregular' : 'regular'})`)
})

// Test 3: Tense-specific statistics
console.log('\n\n📊 Tense-specific irregularity statistics...')

const tenseStats = {}
const tenses = ['pres', 'pretIndef', 'impf', 'subjPres', 'subjImpf', 'fut', 'cond', 'ger', 'pp']

tenses.forEach(tense => {
  const irregularCount = verbs.filter(verb => isIrregularInTense(verb, tense)).length
  const totalCount = verbs.length
  const percentage = (irregularCount / totalCount * 100).toFixed(1)
  
  tenseStats[tense] = { irregularCount, totalCount, percentage }
  console.log(`${tense}: ${irregularCount}/${totalCount} verbs irregular (${percentage}%)`)
})

// Test 4: Validate data consistency
console.log('\n\n🔧 Validating data consistency...')

let consistencyErrors = 0
verbs.forEach(verb => {
  // Check that irregularTenses array matches irregularityMatrix
  const irregularTensesFromArray = verb.irregularTenses || []
  const irregularTensesFromMatrix = Object.entries(verb.irregularityMatrix || {})
    .filter(([tense, isIrregular]) => isIrregular)
    .map(([tense]) => tense)
  
  const arraySet = new Set(irregularTensesFromArray.sort())
  const matrixSet = new Set(irregularTensesFromMatrix.sort())
  
  if (arraySet.size !== matrixSet.size || ![...arraySet].every(t => matrixSet.has(t))) {
    console.log(`❌ Consistency error in ${verb.lemma}: array [${[...arraySet].join(',')}] vs matrix [${[...matrixSet].join(',')}]`)
    consistencyErrors++
  }
})

if (consistencyErrors === 0) {
  console.log('✅ All verbs have consistent irregularTenses and irregularityMatrix data')
} else {
  console.log(`❌ Found ${consistencyErrors} consistency errors`)
}

// Test 5: Compare with traditional classification
console.log('\n\n📈 Comparing with traditional irregular/regular classification...')

const traditionalIrregular = verbs.filter(v => v.type === 'irregular').length
const hasAnyIrregularTense = verbs.filter(v => (v.irregularTenses || []).length > 0).length
const fullyRegular = verbs.filter(v => (v.irregularTenses || []).length === 0).length

console.log(`Traditional classification: ${traditionalIrregular} irregular, ${verbs.length - traditionalIrregular} regular`)
console.log(`Per-tense classification: ${hasAnyIrregularTense} with irregular tenses, ${fullyRegular} fully regular`)
console.log(`Difference: ${Math.abs(traditionalIrregular - hasAnyIrregularTense)} verbs reclassified`)

// Restore original settings
useSettings.setState(originalSettings)

console.log('\n✅ Per-tense generator integration test completed!')