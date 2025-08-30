#!/usr/bin/env node

// Analysis script to determine per-tense irregularity flags for Spanish verbs
// This script examines each verb's forms and determines which tenses contain irregularities

import { verbs } from './src/data/verbs.js'
import { IRREGULAR_FAMILIES, categorizeVerb } from './src/lib/data/irregularFamilies.js'
import { isRegularFormForMood, isRegularNonfiniteForm } from './src/lib/core/conjugationRules.js'

// Core tenses that we care about for irregularity analysis
// Excluding archaic/rare forms like subjFut, and pseudo-tenses like irAInf
const CORE_TENSES = [
  'pres', 'pretIndef', 'impf', 'fut', 'pretPerf', 'plusc', 'futPerf',
  'subjPres', 'subjImpf', 'subjPretPerf', 'subjPlusc', 'subjFutPerf',
  'cond', 'condPerf',
  'impAff', 'impNeg',
  'inf', 'ger', 'pp'
]

// Tenses to ignore in our analysis (archaic, pseudo-tenses, etc.)
const IGNORED_TENSES = ['subjFut', 'irAInf', 'presFuturate', 'infPerf', 'part', 'subjPerf']

// Tenses that are inherently compound/periphrastic (use auxiliary + participle)
const COMPOUND_TENSES = [
  'pretPerf', 'plusc', 'futPerf', 'subjPretPerf', 'subjPlusc', 'subjFutPerf', 'condPerf'
]

// Non-finite forms
const NONFINITE_TENSES = ['inf', 'ger', 'pp']

/**
 * Analyze a single verb to determine which tenses have irregular forms
 * @param {Object} verb - Verb object from the dataset
 * @returns {Object} Analysis results with irregularTenses and irregularityMatrix
 */
function analyzeVerbIrregularities(verb) {
  const results = {
    id: verb.id,
    lemma: verb.lemma,
    currentType: verb.type,
    irregularTenses: [],
    irregularityMatrix: {},
    familyClassification: categorizeVerb(verb.lemma),
    expectedAffectedTenses: [],
    analysis: {}
  }

  // Initialize matrix with false values
  CORE_TENSES.forEach(tense => {
    results.irregularityMatrix[tense] = false
  })

  // Get expected affected tenses from irregular families
  const families = categorizeVerb(verb.lemma)
  families.forEach(familyId => {
    if (IRREGULAR_FAMILIES[familyId] && IRREGULAR_FAMILIES[familyId].affectedTenses) {
      IRREGULAR_FAMILIES[familyId].affectedTenses.forEach(tense => {
        if (!results.expectedAffectedTenses.includes(tense)) {
          results.expectedAffectedTenses.push(tense)
        }
      })
    }
  })

  // Analyze each paradigm
  verb.paradigms.forEach((paradigm, paradigmIdx) => {
    paradigm.forms.forEach(form => {
      const { mood, tense, person, value } = form
      
      if (!value || typeof value !== 'string') return // Skip invalid forms
      if (IGNORED_TENSES.includes(tense)) return // Skip ignored tenses

      let isRegular = false
      
      // Handle non-finite forms separately
      if (NONFINITE_TENSES.includes(tense)) {
        if (tense === 'inf') {
          // Infinitive is always "regular" (it's just the lemma itself)
          isRegular = (value === verb.lemma)
        } else {
          // Handle gerund and participle
          isRegular = isRegularNonfiniteForm(verb.lemma, tense, value)
        }
      } 
      // Handle compound tenses (check participle regularity)
      else if (COMPOUND_TENSES.includes(tense)) {
        isRegular = isRegularFormForMood(verb.lemma, mood, tense, person, value)
      }
      // Handle regular finite forms
      else {
        isRegular = isRegularFormForMood(verb.lemma, mood, tense, person, value)
      }

      // Track analysis per tense
      if (!results.analysis[tense]) {
        results.analysis[tense] = { regular: 0, irregular: 0, total: 0, examples: [] }
      }
      
      results.analysis[tense].total++
      
      if (isRegular) {
        results.analysis[tense].regular++
      } else {
        results.analysis[tense].irregular++
        
        // Store example of irregularity
        if (results.analysis[tense].examples.length < 3) {
          results.analysis[tense].examples.push({
            person,
            value,
            expected: getExpectedRegularForm(verb.lemma, mood, tense, person)
          })
        }
      }
    })
  })

  // Determine irregular tenses based on analysis
  Object.keys(results.analysis).forEach(tense => {
    const analysis = results.analysis[tense]
    
    // A tense is irregular if it has any irregular forms
    // (Even one irregular person makes the whole tense irregular)
    if (analysis.irregular > 0) {
      results.irregularTenses.push(tense)
      results.irregularityMatrix[tense] = true
    }
  })

  return results
}

/**
 * Generate expected regular form for comparison
 * @param {string} lemma - Verb lemma
 * @param {string} mood - Mood
 * @param {string} tense - Tense  
 * @param {string} person - Person
 * @returns {string} Expected regular form
 */
function getExpectedRegularForm(lemma, mood, tense, person) {
  // This is a simplified version - the actual conjugationRules.js has the full logic
  if (lemma.endsWith('ar') && mood === 'indicative' && tense === 'pres') {
    const stem = lemma.slice(0, -2)
    switch (person) {
      case '1s': return stem + 'o'
      case '2s_tu': return stem + 'as'
      case '2s_vos': return stem + 'ás'  
      case '3s': return stem + 'a'
      case '1p': return stem + 'amos'
      case '2p_vosotros': return stem + 'áis'
      case '3p': return stem + 'an'
      default: return '(unknown)'
    }
  }
  return '(pattern not implemented)'
}

/**
 * Generate summary statistics
 * @param {Array} results - Analysis results for all verbs
 */
function generateSummary(results) {
  console.log('\n=== PER-TENSE IRREGULARITY ANALYSIS SUMMARY ===\n')
  
  // Count verbs by current classification
  const currentClassification = results.reduce((acc, r) => {
    acc[r.currentType] = (acc[r.currentType] || 0) + 1
    return acc
  }, {})
  
  console.log('Current verb classification:')
  Object.entries(currentClassification).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} verbs`)
  })
  
  // Count irregular tenses across all verbs
  const tenseIrregularityCount = {}
  CORE_TENSES.forEach(tense => { tenseIrregularityCount[tense] = 0 })
  
  results.forEach(result => {
    result.irregularTenses.forEach(tense => {
      tenseIrregularityCount[tense]++
    })
  })
  
  console.log('\nTense irregularity frequency (# verbs with irregular forms):')
  Object.entries(tenseIrregularityCount)
    .sort(([,a], [,b]) => b - a)
    .forEach(([tense, count]) => {
      if (count > 0) {
        console.log(`  ${tense}: ${count} verbs`)
      }
    })

  // Identify verbs that changed classification
  console.log('\nClassification changes:')
  const regularNowIrregular = results.filter(r => r.currentType === 'regular' && r.irregularTenses.length > 0)
  const irregularNowRegular = results.filter(r => r.currentType === 'irregular' && r.irregularTenses.length === 0)
  
  console.log(`  Regular → Has irregular tenses: ${regularNowIrregular.length}`)
  regularNowIrregular.slice(0, 5).forEach(r => {
    console.log(`    ${r.lemma}: irregular in [${r.irregularTenses.join(', ')}]`)
  })
  
  console.log(`  Irregular → All tenses regular: ${irregularNowRegular.length}`)
  irregularNowRegular.slice(0, 5).forEach(r => {
    console.log(`    ${r.lemma}: classified as irregular but no irregular tenses found`)
  })
  
  // Family classification accuracy
  console.log('\nFamily classification accuracy:')
  results.forEach(result => {
    if (result.expectedAffectedTenses.length > 0) {
      const expected = new Set(result.expectedAffectedTenses)
      const actual = new Set(result.irregularTenses)
      const matches = [...expected].filter(t => actual.has(t)).length
      const accuracy = expected.size > 0 ? (matches / expected.size * 100).toFixed(1) : 'N/A'
      
      if (expected.size > 0 && matches < expected.size) {
        console.log(`    ${result.lemma}: ${accuracy}% accuracy (expected: [${[...expected].join(',')}], found: [${[...actual].join(',')}])`)
      }
    }
  })
}

/**
 * Main analysis function
 */
async function main() {
  console.log(`Analyzing ${verbs.length} verbs for per-tense irregularities...\n`)
  
  const results = verbs.map(verb => {
    console.log(`Analyzing: ${verb.lemma}`)
    return analyzeVerbIrregularities(verb)
  })
  
  // Generate summary
  generateSummary(results)
  
  // Save detailed results to JSON file
  const outputFile = './per-tense-analysis-results.json'
  const fs = await import('fs')
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))
  console.log(`\nDetailed results saved to: ${outputFile}`)
  
  return results
}

// Run analysis if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { analyzeVerbIrregularities, main }