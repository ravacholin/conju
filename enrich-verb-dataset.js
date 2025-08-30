#!/usr/bin/env node

// Script to enrich the verb dataset with per-tense irregularity flags
// Reads analysis results and adds irregularTenses and irregularityMatrix to each verb

import { writeFileSync, readFileSync } from 'fs'
import { verbs } from './src/data/verbs.js'

const ANALYSIS_RESULTS_FILE = './per-tense-analysis-results.json'
const OUTPUT_FILE = './src/data/verbs-enriched.js'

/**
 * Main enrichment function
 */
async function enrichVerbDataset() {
  console.log('Reading analysis results...')
  
  // Read analysis results
  const analysisResults = JSON.parse(readFileSync(ANALYSIS_RESULTS_FILE, 'utf8'))
  
  // Create lookup map by verb lemma
  const analysisMap = new Map()
  analysisResults.forEach(result => {
    analysisMap.set(result.lemma, result)
  })
  
  console.log(`Processing ${verbs.length} verbs...`)
  
  // Enrich each verb with per-tense irregularity data
  const enrichedVerbs = verbs.map(verb => {
    const analysis = analysisMap.get(verb.lemma)
    
    if (!analysis) {
      console.warn(`⚠️ No analysis found for verb: ${verb.lemma}`)
      return {
        ...verb,
        irregularTenses: [],
        irregularityMatrix: {}
      }
    }
    
    // Create enriched verb object
    const enrichedVerb = {
      ...verb,
      irregularTenses: analysis.irregularTenses.sort(), // Sort for consistency
      irregularityMatrix: analysis.irregularityMatrix
    }
    
    // Optional: Add metadata about the analysis
    if (process.env.INCLUDE_ANALYSIS_METADATA === 'true') {
      enrichedVerb._analysis = {
        familyClassification: analysis.familyClassification,
        expectedAffectedTenses: analysis.expectedAffectedTenses,
        generatedAt: new Date().toISOString()
      }
    }
    
    return enrichedVerb
  })
  
  console.log('Generating statistics...')
  
  // Generate statistics
  const stats = {
    totalVerbs: enrichedVerbs.length,
    verbsWithIrregularTenses: enrichedVerbs.filter(v => v.irregularTenses.length > 0).length,
    mostCommonIrregularTenses: {},
    classificationAccuracy: {
      correctlyClassified: 0,
      incorrectlyRegular: 0,
      incorrectlyIrregular: 0
    }
  }
  
  // Count tense frequency
  enrichedVerbs.forEach(verb => {
    verb.irregularTenses.forEach(tense => {
      stats.mostCommonIrregularTenses[tense] = (stats.mostCommonIrregularTenses[tense] || 0) + 1
    })
    
    // Classification accuracy
    const hasIrregularTenses = verb.irregularTenses.length > 0
    if (verb.type === 'irregular' && hasIrregularTenses) {
      stats.classificationAccuracy.correctlyClassified++
    } else if (verb.type === 'regular' && !hasIrregularTenses) {
      stats.classificationAccuracy.correctlyClassified++
    } else if (verb.type === 'regular' && hasIrregularTenses) {
      stats.classificationAccuracy.incorrectlyRegular++
    } else if (verb.type === 'irregular' && !hasIrregularTenses) {
      stats.classificationAccuracy.incorrectlyIrregular++
    }
  })
  
  // Sort tense frequency
  stats.mostCommonIrregularTenses = Object.entries(stats.mostCommonIrregularTenses)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10) // Top 10
    .reduce((obj, [tense, count]) => ({ ...obj, [tense]: count }), {})
  
  console.log('\n=== ENRICHMENT STATISTICS ===')
  console.log(`Total verbs processed: ${stats.totalVerbs}`)
  console.log(`Verbs with irregular tenses: ${stats.verbsWithIrregularTenses} (${(stats.verbsWithIrregularTenses/stats.totalVerbs*100).toFixed(1)}%)`)
  console.log(`Classification accuracy: ${stats.classificationAccuracy.correctlyClassified}/${stats.totalVerbs} (${(stats.classificationAccuracy.correctlyClassified/stats.totalVerbs*100).toFixed(1)}%)`)
  console.log(`Incorrectly marked as regular: ${stats.classificationAccuracy.incorrectlyRegular}`)
  console.log(`Incorrectly marked as irregular: ${stats.classificationAccuracy.incorrectlyIrregular}`)
  
  console.log('\\nMost common irregular tenses:')
  Object.entries(stats.mostCommonIrregularTenses).forEach(([tense, count]) => {
    console.log(`  ${tense}: ${count} verbs`)
  })
  
  console.log(`\\nWriting enriched dataset to: ${OUTPUT_FILE}`)
  
  // Generate the new verbs.js file
  const fileContent = `// Enriched Spanish verb dataset with per-tense irregularity flags
// Generated automatically from analysis results
// Last updated: ${new Date().toISOString()}

export const verbs = ${JSON.stringify(enrichedVerbs, null, 2)}

// Dataset statistics
export const datasetStats = ${JSON.stringify(stats, null, 2)}
`
  
  writeFileSync(OUTPUT_FILE, fileContent, 'utf8')
  
  console.log('✅ Dataset enrichment completed successfully!')
  console.log(`📊 Dataset statistics saved to datasetStats export`)
  
  // Show examples of enriched data
  console.log('\\n=== EXAMPLES ===')
  const examples = [
    enrichedVerbs.find(v => v.lemma === 'hablar'),
    enrichedVerbs.find(v => v.lemma === 'pensar'),
    enrichedVerbs.find(v => v.lemma === 'ser')
  ].filter(Boolean)
  
  examples.forEach(verb => {
    console.log(`${verb.lemma} (${verb.type}): irregular in [${verb.irregularTenses.join(', ')}]`)
  })
  
  return { enrichedVerbs, stats }
}

// Run if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  enrichVerbDataset().catch(console.error)
}

export { enrichVerbDataset }