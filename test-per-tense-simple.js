#!/usr/bin/env node

// Simple test for per-tense irregularity system core functions

import { verbs } from './src/data/verbs.js'
import { 
  isIrregularInTense, 
  hasAnyIrregularTense,
  getIrregularTenses,
  getVerbIrregularityStats,
  getEffectiveVerbType
} from './src/lib/utils/irregularityUtils.js'

console.log('🧪 Testing Per-Tense Core Functions\n')

// Test 1: Basic functionality
console.log('🔧 Testing basic irregularity functions...')

const testCases = [
  { lemma: 'hablar', tense: 'pres', expected: false },
  { lemma: 'pensar', tense: 'pres', expected: true },
  { lemma: 'pensar', tense: 'impf', expected: false },
  { lemma: 'ser', tense: 'pres', expected: true },
  { lemma: 'ser', tense: 'impf', expected: true },
  { lemma: 'poder', tense: 'pres', expected: true },
  { lemma: 'poder', tense: 'ger', expected: true }
]

testCases.forEach(test => {
  const verb = verbs.find(v => v.lemma === test.lemma)
  if (verb) {
    const result = isIrregularInTense(verb, test.tense)
    const status = result === test.expected ? '✅' : '❌'
    console.log(`${status} ${test.lemma} - ${test.tense}: ${result} (expected: ${test.expected})`)
  } else {
    console.log(`❌ Verb ${test.lemma} not found`)
  }
})

// Test 2: Comprehensive verb analysis
console.log('\n📊 Comprehensive verb analysis...')

const analysisVerbs = ['hablar', 'pensar', 'ser', 'decir', 'poder']
analysisVerbs.forEach(lemma => {
  const verb = verbs.find(v => v.lemma === lemma)
  if (!verb) {
    console.log(`❌ ${lemma}: not found`)
    return
  }
  
  const hasIrregular = hasAnyIrregularTense(verb)
  const irregularTenses = getIrregularTenses(verb)
  const stats = getVerbIrregularityStats(verb)
  const effectiveType = getEffectiveVerbType(verb)
  
  console.log(`\n🔍 ${lemma} (${verb.type} → ${effectiveType}):`)
  console.log(`   Has irregular tenses: ${hasIrregular}`)
  console.log(`   Irregular tenses (${irregularTenses.length}): [${irregularTenses.join(', ')}]`)
  console.log(`   Irregularity: ${stats.irregularTenseCount}/${stats.totalTenses} (${stats.irregularityPercentage.toFixed(1)}%)`)
  console.log(`   Complexity: ${stats.irregularTenseCount <= 2 ? 'low' : stats.irregularTenseCount <= 5 ? 'medium' : stats.irregularTenseCount <= 8 ? 'high' : 'very high'}`)
})

// Test 3: Dataset statistics
console.log('\n\n📈 Dataset statistics...')

const totalVerbs = verbs.length
const verbsWithNewData = verbs.filter(v => v.irregularTenses && v.irregularityMatrix).length
const fullyRegular = verbs.filter(v => !hasAnyIrregularTense(v)).length
const hasIrregularVerbs = verbs.filter(v => hasAnyIrregularTense(v)).length

console.log(`Total verbs: ${totalVerbs}`)
console.log(`Verbs with per-tense data: ${verbsWithNewData} (${(verbsWithNewData/totalVerbs*100).toFixed(1)}%)`)
console.log(`Fully regular verbs: ${fullyRegular} (${(fullyRegular/totalVerbs*100).toFixed(1)}%)`)
console.log(`Verbs with irregular tenses: ${hasIrregularVerbs} (${(hasIrregularVerbs/totalVerbs*100).toFixed(1)}%)`)

// Test 4: Most common irregular tenses
console.log('\n🎯 Most common irregular tenses:')
const tenseFrequency = {}

verbs.forEach(verb => {
  const irregularTenses = getIrregularTenses(verb)
  irregularTenses.forEach(tense => {
    tenseFrequency[tense] = (tenseFrequency[tense] || 0) + 1
  })
})

const sortedTenses = Object.entries(tenseFrequency)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)

sortedTenses.forEach(([tense, count]) => {
  const percentage = (count / totalVerbs * 100).toFixed(1)
  console.log(`   ${tense}: ${count} verbs (${percentage}%)`)
})

// Test 5: Data integrity checks
console.log('\n🔧 Data integrity checks...')

let integrityIssues = 0
verbs.forEach(verb => {
  // Check for missing data
  if (!verb.irregularTenses) {
    console.log(`❌ ${verb.lemma}: missing irregularTenses`)
    integrityIssues++
  }
  
  if (!verb.irregularityMatrix) {
    console.log(`❌ ${verb.lemma}: missing irregularityMatrix`)
    integrityIssues++
  }
  
  // Check for consistency
  if (verb.irregularTenses && verb.irregularityMatrix) {
    const matrixCount = Object.values(verb.irregularityMatrix).filter(Boolean).length
    const arrayCount = verb.irregularTenses.length
    
    if (matrixCount !== arrayCount) {
      console.log(`❌ ${verb.lemma}: inconsistent data (matrix: ${matrixCount}, array: ${arrayCount})`)
      integrityIssues++
    }
  }
})

if (integrityIssues === 0) {
  console.log('✅ All verbs have consistent per-tense data')
} else {
  console.log(`❌ Found ${integrityIssues} integrity issues`)
}

console.log('\n✅ Per-tense core functions test completed!')