#!/usr/bin/env node
/**
 * Script to systematically fix Mismatch errors in the verb database
 * by correcting wrong conjugations based on the CSV analysis
 */

import fs from 'fs'
import { verbs } from './src/data/verbs.js'

const CSV_FILE = './verbos_mismatches_TODOS.csv'
const VERBS_FILE = './src/data/verbs.js'

console.log('🔧 Starting systematic fix of Mismatch errors...')

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

function loadMismatchErrors() {
  const csvContent = fs.readFileSync(CSV_FILE, 'utf8')
  const lines = csvContent.split('\n').filter(line => line.trim())
  const dataLines = lines.slice(1) // Skip header
  
  const mismatchErrors = []
  
  for (const line of dataLines) {
    if (!line.trim()) continue
    
    const parts = parseCsvLine(line)
    if (parts.length < 6) continue
    
    const [lemma, mood, tense, person, value, status, note] = parts
    
    if (status === 'Mismatch') {
      // Extract expected value from note
      const expectedMatch = note.match(/Esperado: (.+)/)
      if (expectedMatch) {
        const expected = expectedMatch[1]
        mismatchErrors.push({
          lemma, mood, tense, person, 
          currentValue: value, 
          expectedValue: expected,
          note
        })
      }
    }
  }
  
  console.log(`📊 Loaded ${mismatchErrors.length} mismatch errors to fix`)
  return mismatchErrors
}

function groupErrorsByPattern(errors) {
  const patterns = {}
  
  for (const error of errors) {
    // Group by lemma and mood/tense
    const key = `${error.lemma}|${error.mood}|${error.tense}`
    if (!patterns[key]) {
      patterns[key] = []
    }
    patterns[key].push(error)
  }
  
  return patterns
}

function findVerbInData(lemma) {
  return verbs.find(v => v.lemma === lemma)
}

function findConjugationInVerb(verb, mood, tense, person) {
  if (!verb || !verb.paradigms) return null
  
  for (const paradigm of verb.paradigms) {
    if (!paradigm.forms) continue
    
    const form = paradigm.forms.find(f => 
      f.mood === mood && 
      f.tense === tense && 
      f.person === person
    )
    
    if (form) {
      return { form, paradigmIndex: verb.paradigms.indexOf(paradigm) }
    }
  }
  
  return null
}

function previewFixes(errors) {
  console.log('\n🔍 PREVIEW OF FIXES TO BE APPLIED:')
  console.log('==================================')
  
  const patterns = groupErrorsByPattern(errors)
  const summary = {
    totalErrors: errors.length,
    verbsAffected: new Set(),
    fixableErrors: 0,
    unfixableErrors: 0,
    examples: []
  }
  
  for (const [patternKey, patternErrors] of Object.entries(patterns)) {
    const [lemma, mood, tense] = patternKey.split('|')
    const verb = findVerbInData(lemma)
    
    summary.verbsAffected.add(lemma)
    
    if (!verb) {
      console.log(`❌ Verb "${lemma}" not found in database`)
      summary.unfixableErrors += patternErrors.length
      continue
    }
    
    console.log(`\\n📝 ${lemma} (${mood}-${tense}): ${patternErrors.length} errors`)
    
    for (const error of patternErrors) {
      const found = findConjugationInVerb(verb, error.mood, error.tense, error.person)
      
      if (found) {
        console.log(`   ${error.person}: "${error.currentValue}" → "${error.expectedValue}"`)
        summary.fixableErrors++
        
        if (summary.examples.length < 10) {
          summary.examples.push({
            lemma: error.lemma,
            mood: error.mood,
            tense: error.tense,
            person: error.person,
            current: error.currentValue,
            expected: error.expectedValue
          })
        }
      } else {
        console.log(`   ❌ ${error.person}: conjugation not found in database`)
        summary.unfixableErrors++
      }
    }
  }
  
  console.log('\\n📊 SUMMARY:')
  console.log(`Total errors to fix: ${summary.totalErrors}`)
  console.log(`Verbs affected: ${summary.verbsAffected.size}`)
  console.log(`Fixable errors: ${summary.fixableErrors}`)
  console.log(`Unfixable errors: ${summary.unfixableErrors}`)
  
  return summary
}

function main() {
  try {
    const mismatchErrors = loadMismatchErrors()
    const summary = previewFixes(mismatchErrors)
    
    console.log('\\n✅ Preview complete!')
    console.log('\\nNext steps:')
    console.log('1. Review the preview above')
    console.log('2. Run this script with --apply flag to make the changes')
    console.log('3. Test the fixes thoroughly')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}