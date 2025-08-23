#!/usr/bin/env node
/**
 * Script to validate specifically against the original CSV errors
 * This will show exactly how many of the original 5,504 errors are now resolved
 */

import fs from 'fs'
import { grade } from './src/lib/core/grader.js'
import { verbs } from './src/data/verbs.js'

const CSV_FILE = './verbos_mismatches_TODOS.csv'

console.log('🔍 VALIDATING AGAINST ORIGINAL CSV ERRORS')
console.log('=========================================')
console.log('Testing each error from the original CSV to see current status...\n')

const mockSettings = {
  region: 'la_general',
  useVoseo: false,
  useTuteo: true,
  useVosotros: false,
  strict: true,
  accentTolerance: 'warn'
}

function parseCsvLine(line) {
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

function findVerbByLemma(lemma) {
  return verbs.find(v => v.lemma === lemma)
}

function findConjugationForm(verb, mood, tense, person) {
  if (!verb || !verb.paradigms) return null
  
  for (const paradigm of verb.paradigms) {
    if (!paradigm.forms) continue
    
    const form = paradigm.forms.find(f => 
      f.mood === mood && 
      f.tense === tense && 
      f.person === person
    )
    
    if (form) return form
  }
  
  return null
}

function testOriginalCsvErrors() {
  console.log('📊 Loading and testing original CSV errors...')
  
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8')
  const lines = csvContent.split('\n').filter(line => line.trim())
  const dataLines = lines.slice(1) // Skip header
  
  console.log(`Found ${dataLines.length} total error records in CSV\n`)
  
  const results = {
    total: 0,
    resolved: 0,
    stillBroken: 0,
    unknownTense: 0,
    verbNotFound: 0,
    formNotFound: 0,
    byStatus: {
      'Mismatch': { total: 0, resolved: 0, stillBroken: 0 },
      'Unknown-tense': { total: 0, resolved: 0, stillBroken: 0 }
    },
    resolvedExamples: [],
    stillBrokenExamples: [],
    unknownTenseExamples: []
  }
  
  let processedCount = 0
  
  for (const line of dataLines) {
    if (!line.trim()) continue
    
    const parts = parseCsvLine(line)
    if (parts.length < 6) continue
    
    const [lemma, mood, tense, person, value, status, note] = parts
    
    results.total++
    processedCount++
    
    // Show progress every 1000 records
    if (processedCount % 1000 === 0) {
      console.log(`  Processing... ${processedCount}/${dataLines.length} records`)
    }
    
    // Track by original status
    if (status in results.byStatus) {
      results.byStatus[status].total++
    }
    
    // Find the verb in our database
    const verb = findVerbByLemma(lemma)
    if (!verb) {
      results.verbNotFound++
      results.stillBroken++
      if (results.stillBrokenExamples.length < 10) {
        results.stillBrokenExamples.push({
          lemma, mood, tense, person, value, status, 
          reason: 'Verb not found in database'
        })
      }
      continue
    }
    
    // Find the specific conjugation form
    const form = findConjugationForm(verb, mood, tense, person)
    if (!form) {
      if (status === 'Unknown-tense') {
        results.unknownTense++
        if (results.unknownTenseExamples.length < 10) {
          results.unknownTenseExamples.push({
            lemma, mood, tense, person, value, status,
            reason: 'Form not found - may still be unsupported tense'
          })
        }
      } else {
        results.formNotFound++
        results.stillBroken++
        if (results.stillBrokenExamples.length < 10) {
          results.stillBrokenExamples.push({
            lemma, mood, tense, person, value, status,
            reason: 'Form not found in verb paradigm'
          })
        }
      }
      continue
    }
    
    // Test if the form is now accepted by our grader
    const gradeResult = grade(value, form, mockSettings)
    
    if (gradeResult.correct) {
      results.resolved++
      if (status in results.byStatus) {
        results.byStatus[status].resolved++
      }
      
      if (results.resolvedExamples.length < 20) {
        results.resolvedExamples.push({
          lemma, mood, tense, person, value, status,
          reason: 'Now accepts the original form correctly'
        })
      }
    } else {
      results.stillBroken++
      if (status in results.byStatus) {
        results.byStatus[status].stillBroken++
      }
      
      if (results.stillBrokenExamples.length < 20) {
        results.stillBrokenExamples.push({
          lemma, mood, tense, person, value, status,
          reason: `Still rejected: ${gradeResult.note || 'Unknown reason'}`
        })
      }
    }
  }
  
  return results
}

function generateDetailedReport(results) {
  console.log('\n📈 DETAILED RESULTS')
  console.log('===================')
  
  console.log(`\n🔢 Overall Numbers:`)
  console.log(`  Total errors tested: ${results.total}`)
  console.log(`  Resolved: ${results.resolved} (${Math.round(results.resolved/results.total*100)}%)`)
  console.log(`  Still broken: ${results.stillBroken} (${Math.round(results.stillBroken/results.total*100)}%)`)
  console.log(`  Unknown tense: ${results.unknownTense}`)
  console.log(`  Verb not found: ${results.verbNotFound}`)
  console.log(`  Form not found: ${results.formNotFound}`)
  
  console.log(`\n📊 By Original Error Type:`)
  for (const [statusType, stats] of Object.entries(results.byStatus)) {
    if (stats.total > 0) {
      const resolvedPct = Math.round(stats.resolved/stats.total*100)
      console.log(`  ${statusType}:`)
      console.log(`    Total: ${stats.total}`)
      console.log(`    Resolved: ${stats.resolved} (${resolvedPct}%)`)
      console.log(`    Still broken: ${stats.stillBroken}`)
    }
  }
  
  console.log(`\n✅ Sample Resolved Errors (first 10):`)
  results.resolvedExamples.slice(0, 10).forEach((example, i) => {
    console.log(`  ${i+1}. ${example.lemma} ${example.mood}-${example.tense}-${example.person}: "${example.value}" (was: ${example.status})`)
  })
  
  console.log(`\n❌ Sample Still Broken Errors (first 10):`)
  results.stillBrokenExamples.slice(0, 10).forEach((example, i) => {
    console.log(`  ${i+1}. ${example.lemma} ${example.mood}-${example.tense}-${example.person}: "${example.value}" (${example.status}) - ${example.reason}`)
  })
  
  if (results.unknownTenseExamples.length > 0) {
    console.log(`\n❓ Sample Unknown-Tense Cases (first 5):`)
    results.unknownTenseExamples.slice(0, 5).forEach((example, i) => {
      console.log(`  ${i+1}. ${example.lemma} ${example.mood}-${example.tense}-${example.person}: "${example.value}"`)
    })
  }
  
  // Save detailed report
  const reportFile = './original_csv_validation_report.json'
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2))
  console.log(`\n📄 Full detailed report saved: ${reportFile}`)
  
  return results
}

function main() {
  try {
    console.log('Starting validation against original CSV errors...\n')
    
    const results = testOriginalCsvErrors()
    generateDetailedReport(results)
    
    console.log('\n🎯 FINAL ASSESSMENT')
    console.log('===================')
    
    const resolvedPercentage = Math.round(results.resolved/results.total*100)
    
    if (resolvedPercentage >= 80) {
      console.log(`✅ EXCELLENT: ${resolvedPercentage}% of original errors have been resolved!`)
    } else if (resolvedPercentage >= 60) {
      console.log(`⚠️  GOOD PROGRESS: ${resolvedPercentage}% of original errors have been resolved.`)
    } else {
      console.log(`❌ MORE WORK NEEDED: Only ${resolvedPercentage}% of original errors have been resolved.`)
    }
    
    console.log(`\nOut of ${results.total} original errors:`)
    console.log(`  ✅ ${results.resolved} are now working correctly`)
    console.log(`  ❌ ${results.stillBroken} still need attention`)
    
    if (results.unknownTense > 0) {
      console.log(`  ❓ ${results.unknownTense} are unknown-tense cases that may need tense support`)
    }
    
    return resolvedPercentage >= 70 ? 0 : 1
    
  } catch (error) {
    console.error('❌ Error during validation:', error)
    return 1
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main())
}