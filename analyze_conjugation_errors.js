#!/usr/bin/env node
/**
 * Script to analyze all conjugation errors from the CSV file
 * and create a comprehensive plan for fixing them systematically
 */

import fs from 'fs'
// import path from 'path' // UNUSED

const CSV_FILE = './verbos_mismatches_TODOS.csv'
const OUTPUT_FILE = './conjugation_errors_analysis.json'

console.log('🔍 Analyzing conjugation errors from CSV file...')

function parseCsvLine(line) {
  // Handle CSV parsing with potential commas in values
  const parts = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  parts.push(current.trim())
  return parts
}

function analyzeErrors() {
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8')
  const lines = csvContent.split('\n').filter(line => line.trim())
  
  // Skip header line
  const dataLines = lines.slice(1)
  
  const analysis = {
    total: 0,
    byStatus: {
      'Mismatch': 0,
      'Unknown-tense': 0
    },
    byVerb: {},
    byMoodTense: {},
    byPerson: {},
    mismatchPatterns: {},
    unknownTenseDetails: {},
    errorExamples: {
      mismatch: [],
      unknownTense: []
    }
  }
  
  console.log(`📊 Processing ${dataLines.length} error records...`)
  
  for (const line of dataLines) {
    if (!line.trim()) continue
    
    const parts = parseCsvLine(line)
    if (parts.length < 6) continue
    
    const [lemma, mood, tense, person, value, status, note] = parts
    analysis.total++
    
    // Count by status
    if (status in analysis.byStatus) {
      analysis.byStatus[status]++
    }
    
    // Count by verb
    if (!analysis.byVerb[lemma]) {
      analysis.byVerb[lemma] = { total: 0, mismatch: 0, unknownTense: 0 }
    }
    analysis.byVerb[lemma].total++
    
    // Count by mood/tense combination
    const moodTenseKey = `${mood}-${tense}`
    if (!analysis.byMoodTense[moodTenseKey]) {
      analysis.byMoodTense[moodTenseKey] = 0
    }
    analysis.byMoodTense[moodTenseKey]++
    
    // Count by person
    if (!analysis.byPerson[person]) {
      analysis.byPerson[person] = 0
    }
    analysis.byPerson[person]++
    
    if (status === 'Mismatch') {
      analysis.byVerb[lemma].mismatch++
      
      // Extract expected value from note
      const expectedMatch = note.match(/Esperado: (.+)/)
      if (expectedMatch) {
        const expected = expectedMatch[1]
        const patternKey = `${value} → ${expected}`
        if (!analysis.mismatchPatterns[patternKey]) {
          analysis.mismatchPatterns[patternKey] = []
        }
        analysis.mismatchPatterns[patternKey].push({
          lemma, mood, tense, person, value, expected
        })
      }
      
      // Save examples
      if (analysis.errorExamples.mismatch.length < 20) {
        analysis.errorExamples.mismatch.push({
          lemma, mood, tense, person, value, note
        })
      }
      
    } else if (status === 'Unknown-tense') {
      analysis.byVerb[lemma].unknownTense++
      
      // Details for unknown tense
      if (!analysis.unknownTenseDetails[moodTenseKey]) {
        analysis.unknownTenseDetails[moodTenseKey] = {
          count: 0,
          verbs: new Set(),
          persons: new Set()
        }
      }
      analysis.unknownTenseDetails[moodTenseKey].count++
      analysis.unknownTenseDetails[moodTenseKey].verbs.add(lemma)
      analysis.unknownTenseDetails[moodTenseKey].persons.add(person)
      
      // Save examples
      if (analysis.errorExamples.unknownTense.length < 20) {
        analysis.errorExamples.unknownTense.push({
          lemma, mood, tense, person, value, note
        })
      }
    }
  }
  
  // Convert Sets to Arrays for JSON serialization
  Object.keys(analysis.unknownTenseDetails).forEach(key => {
    analysis.unknownTenseDetails[key].verbs = Array.from(analysis.unknownTenseDetails[key].verbs)
    analysis.unknownTenseDetails[key].persons = Array.from(analysis.unknownTenseDetails[key].persons)
  })
  
  // Sort results for better readability
  analysis.topVerbsWithErrors = Object.entries(analysis.byVerb)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 20)
    .map(([lemma, counts]) => ({ lemma, ...counts }))
    
  analysis.topMoodTenseCombinations = Object.entries(analysis.byMoodTense)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15)
    .map(([combination, count]) => ({ combination, count }))
  
  return analysis
}

function main() {
  try {
    const analysis = analyzeErrors()
    
    // Save detailed analysis
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(analysis, null, 2))
    
    // Print summary
    console.log('\n📈 CONJUGATION ERRORS ANALYSIS SUMMARY')
    console.log('=====================================')
    console.log(`Total errors: ${analysis.total}`)
    console.log(`Mismatch errors: ${analysis.byStatus.Mismatch}`)
    console.log(`Unknown-tense errors: ${analysis.byStatus['Unknown-tense']}`)
    
    console.log('\n🔝 Top 10 verbs with most errors:')
    analysis.topVerbsWithErrors.slice(0, 10).forEach((verb, i) => {
      console.log(`${i+1}. ${verb.lemma}: ${verb.total} errors (${verb.mismatch} mismatch, ${verb.unknownTense} unknown-tense)`)
    })
    
    console.log('\n🎯 Most problematic mood/tense combinations:')
    analysis.topMoodTenseCombinations.slice(0, 8).forEach((combo, i) => {
      console.log(`${i+1}. ${combo.combination}: ${combo.count} errors`)
    })
    
    console.log('\n📄 Detailed analysis saved to:', OUTPUT_FILE)
    console.log('✅ Analysis complete!')
    
  } catch (error) {
    console.error('❌ Error analyzing conjugation errors:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}