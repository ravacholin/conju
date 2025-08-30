#!/usr/bin/env node

// Quick test script to validate the per-tense irregularity system

import { verbs } from './src/data/verbs.js'
import { 
  isIrregularInTense, 
  hasAnyIrregularTense, 
  getIrregularTenses,
  getVerbIrregularityStats,
  TENSE_GROUPS
} from './src/lib/utils/irregularityUtils.js'

console.log('🧪 Testing Per-Tense Irregularity System\n')

// Test specific verbs
const testVerbs = ['hablar', 'pensar', 'ser', 'estar', 'poder']

testVerbs.forEach(lemma => {
  const verb = verbs.find(v => v.lemma === lemma)
  if (!verb) {
    console.log(`❌ Verb ${lemma} not found`)
    return
  }
  
  console.log(`📖 Testing: ${lemma} (${verb.type})`)
  console.log(`   Has irregular tenses: ${hasAnyIrregularTense(verb)}`)
  console.log(`   Irregular tenses: [${getIrregularTenses(verb).join(', ')}]`)
  
  // Test specific tenses
  const testTenses = ['pres', 'pretIndef', 'subjPres', 'ger']
  testTenses.forEach(tense => {
    console.log(`   ${tense}: ${isIrregularInTense(verb, tense) ? 'IRREGULAR' : 'regular'}`)
  })
  
  const stats = getVerbIrregularityStats(verb)
  console.log(`   Stats: ${stats.irregularTenseCount}/${stats.totalTenses} irregular (${stats.irregularityPercentage.toFixed(1)}%)`)
  console.log()
})

// Test dataset-wide statistics
console.log('📊 Dataset Statistics:')

const totalVerbs = verbs.length
const verbsWithIrregularTenses = verbs.filter(hasAnyIrregularTense).length
const fullyRegularVerbs = verbs.filter(v => getIrregularTenses(v).length === 0).length

console.log(`Total verbs: ${totalVerbs}`)
console.log(`Verbs with irregular tenses: ${verbsWithIrregularTenses} (${(verbsWithIrregularTenses/totalVerbs*100).toFixed(1)}%)`)
console.log(`Fully regular verbs: ${fullyRegularVerbs} (${(fullyRegularVerbs/totalVerbs*100).toFixed(1)}%)`)

// Test tense groups
console.log('\n🎯 Tense Group Testing:')
const testVerb = verbs.find(v => v.lemma === 'pensar')
Object.entries(TENSE_GROUPS).forEach(([groupName, tenses]) => {
  const irregularInGroup = tenses.filter(t => isIrregularInTense(testVerb, t))
  console.log(`${groupName}: ${irregularInGroup.length}/${tenses.length} irregular (${irregularInGroup.join(', ')})`)
})

console.log('\n✅ Per-tense irregularity system test completed!')