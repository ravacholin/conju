#!/usr/bin/env node

// Test script for the new per-tense analytics system

import { 
  generateVerbAnalytics, 
  getVerbDetailedInfo, 
  compareVerbIrregularity 
} from './src/lib/analytics/verbAnalytics.js'

console.log('🧪 Testing Per-Tense Analytics System\n')

// Test 1: Generate comprehensive analytics
console.log('📊 Generating comprehensive verb analytics...')
const analytics = generateVerbAnalytics()

console.log('\n=== OVERVIEW ===')
console.log(`Total verbs: ${analytics.overview.totalVerbs}`)
console.log(`Fully regular: ${analytics.overview.fullyRegular}`)
console.log(`With irregular tenses: ${analytics.overview.hasIrregularTenses}`)
console.log(`Average irregularity: ${analytics.overview.averageIrregularityPercentage.toFixed(1)}%`)

console.log('\n=== IRREGULARITY DISTRIBUTION ===')
Object.entries(analytics.irregularityDistribution).forEach(([bucket, count]) => {
  const percentage = (count / analytics.overview.totalVerbs * 100).toFixed(1)
  console.log(`${bucket}: ${count} verbs (${percentage}%)`)
})

console.log('\n=== TOP IRREGULAR TENSES ===')
const sortedTenses = Object.entries(analytics.tenseAnalysis)
  .filter(([tense]) => tense !== 'groups')
  .sort(([,a], [,b]) => b.irregularCount - a.irregularCount)
  .slice(0, 5)

sortedTenses.forEach(([tense, stats]) => {
  console.log(`${tense}: ${stats.irregularCount} verbs (${stats.irregularityPercentage}%)`)
})

console.log('\n=== COMPLEXITY ANALYSIS ===')
Object.entries(analytics.complexityAnalysis.distribution).forEach(([level, count]) => {
  const percentage = (count / analytics.overview.totalVerbs * 100).toFixed(1)
  console.log(`${level}: ${count} verbs (${percentage}%)`)
})

console.log('\n=== MOST COMPLEX VERBS ===')
analytics.complexityAnalysis.mostComplexVerbs.slice(0, 5).forEach(verb => {
  console.log(`${verb.lemma}: ${verb.count} irregular tenses [${verb.irregularTenses.join(', ')}]`)
})

console.log('\n=== RECOMMENDATIONS ===')
analytics.recommendations.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec.title}: ${rec.description}`)
})

// Test 2: Detailed verb information
console.log('\n\n🔍 Testing detailed verb information...')
const testVerbs = ['hablar', 'pensar', 'ser', 'poder', 'decir']

testVerbs.forEach(lemma => {
  const info = getVerbDetailedInfo(lemma)
  if (info) {
    console.log(`\n${info.lemma} (${info.traditionalType} → ${info.complexity}):`)
    console.log(`  Irregularity: ${info.stats.irregularTenseCount}/${info.stats.totalTenses} tenses (${info.stats.irregularityPercentage.toFixed(1)}%)`)
    console.log(`  Irregular in: [${info.irregularTenses.join(', ')}]`)
  }
})

// Test 3: Verb comparison
console.log('\n\n⚖️  Testing verb comparison...')
const comparisons = [
  ['pensar', 'cerrar'],  // Both e→ie
  ['poder', 'volver'],   // Both o→ue
  ['ser', 'estar'],      // Very different
  ['hablar', 'caminar']  // Both regular
]

comparisons.forEach(([verb1, verb2]) => {
  const comparison = compareVerbIrregularity(verb1, verb2)
  console.log(`\n${comparison.verb1} vs ${comparison.verb2}:`)
  console.log(`  Common irregular tenses: [${comparison.commonIrregularTenses.join(', ')}]`)
  console.log(`  Complexity difference: ${comparison.complexityDifference}`)
  console.log(`  Recommendation: ${comparison.recommendation}`)
})

console.log('\n✅ Per-tense analytics system test completed!')