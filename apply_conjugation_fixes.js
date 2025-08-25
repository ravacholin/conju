#!/usr/bin/env node
/**
 * Script to apply systematic corrections to verb conjugation errors
 * This will fix the Mismatch errors by restoring correct irregular forms
 */

import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const CSV_FILE = './verbos_mismatches_TODOS.csv'
const VERBS_FILE = './src/data/verbs.js'

console.log('🔧 Applying systematic corrections to conjugation errors...')

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
  const dataLines = lines.slice(1)
  
  const corrections = []
  
  for (const line of dataLines) {
    if (!line.trim()) continue
    
    const parts = parseCsvLine(line)
    if (parts.length < 6) continue
    
    const [lemma, mood, tense, person, value, status, note] = parts
    
    if (status === 'Mismatch') {
      const expectedMatch = note.match(/Esperado: (.+)/)
      if (expectedMatch) {
        let expected = expectedMatch[1]
        
        // Handle array-like expected values (for subjPlusc -ra/-se forms)
        if (expected.startsWith('[') && expected.endsWith(']')) {
          try {
            const expectedArray = JSON.parse(expected.replace(/'/g, '"'))
            expected = expectedArray[0] // Use -ra form as primary
          } catch (e) {
            // If parsing fails, keep the original
          }
        }
        
        corrections.push({
          lemma, mood, tense, person, 
          currentValue: value, 
          correctValue: expected,
          note
        })
      }
    }
  }
  
  console.log(`📊 Loaded ${corrections.length} corrections to apply`)
  return corrections
}

function applyCorrections(corrections) {
  let verbsFileContent = fs.readFileSync(VERBS_FILE, 'utf8')
  let changesMade = 0
  const changeLog = []
  
  // Group corrections by lemma for efficiency
  const correctionsByVerb = {}
  for (const correction of corrections) {
    if (!correctionsByVerb[correction.lemma]) {
      correctionsByVerb[correction.lemma] = []
    }
    correctionsByVerb[correction.lemma].push(correction)
  }
  
  console.log(`\\n🔧 Processing corrections for ${Object.keys(correctionsByVerb).length} verbs...`)
  
  for (const [lemma, verbCorrections] of Object.entries(correctionsByVerb)) {
    console.log(`\\n📝 Fixing ${lemma} (${verbCorrections.length} corrections)`)
    
    for (const correction of verbCorrections) {
      // Create a specific search pattern for this conjugation
      const searchPattern = `"value": "${correction.currentValue.replace(/"/g, '\\\\"')}"`
      const replaceValue = `"value": "${correction.correctValue.replace(/"/g, '\\\\"')}"`
      
      // Only replace if it's in the correct context (same lemma section)
      const verbSectionRegex = new RegExp(
        `("lemma":\\s*"${lemma}"[\\s\\S]*?})(?=\\s*,\\s*\\{\\s*"id"|\\s*\\]\\s*$)`,
        'g'
      )
      
      const matches = verbsFileContent.match(verbSectionRegex)
      if (matches && matches.length > 0) {
        const verbSection = matches[0]
        
        // Check if the incorrect value exists in this verb's section
        if (verbSection.includes(searchPattern)) {
          // Create a more specific regex to find the exact conjugation
          const conjugationRegex = new RegExp(
            `(\\{[^}]*"tense":\\s*"${correction.tense}"[^}]*"mood":\\s*"${correction.mood}"[^}]*"person":\\s*"${correction.person}"[^}]*)"value":\\s*"[^"]*"`,
            'g'
          )
          
          const updatedVerbSection = verbSection.replace(conjugationRegex, (match, prefix) => {
            if (match.includes(searchPattern)) {
              changeLog.push({
                lemma: correction.lemma,
                mood: correction.mood,
                tense: correction.tense,
                person: correction.person,
                from: correction.currentValue,
                to: correction.correctValue
              })
              changesMade++
              console.log(`  ✓ ${correction.mood}-${correction.tense}-${correction.person}: "${correction.currentValue}" → "${correction.correctValue}"`)
              return match.replace(searchPattern, replaceValue)
            }
            return match
          })
          
          verbsFileContent = verbsFileContent.replace(verbSection, updatedVerbSection)
        }
      }
    }
  }
  
  console.log(`\\n📊 CORRECTION SUMMARY:`)
  console.log(`Total corrections applied: ${changesMade}`)
  console.log(`Verbs modified: ${Object.keys(correctionsByVerb).length}`)
  
  if (changesMade > 0) {
    // Create backup
    const backupFile = VERBS_FILE + '.backup-' + Date.now()
    fs.writeFileSync(backupFile, fs.readFileSync(VERBS_FILE))
    console.log(`📦 Backup created: ${backupFile}`)
    
    // Write updated file
    fs.writeFileSync(VERBS_FILE, verbsFileContent)
    console.log(`✅ Updated verbs file: ${VERBS_FILE}`)
    
    // Save change log
    const logFile = './conjugation_fixes_log.json'
    fs.writeFileSync(logFile, JSON.stringify(changeLog, null, 2))
    console.log(`📋 Change log saved: ${logFile}`)
  }
  
  return { changesMade, changeLog }
}

function main() {
  try {
    const corrections = loadMismatchErrors()
    
    if (corrections.length === 0) {
      console.log('⚠️  No corrections to apply')
      return
    }
    
    console.log('\\n🔍 Preview of corrections to be applied:')
    console.log('=' .repeat(50))
    
    // Show sample corrections
    const sampleCorrections = corrections.slice(0, 10)
    for (const correction of sampleCorrections) {
      console.log(`${correction.lemma} (${correction.mood}-${correction.tense}-${correction.person}): "${correction.currentValue}" → "${correction.correctValue}"`)
    }
    
    if (corrections.length > 10) {
      console.log(`... and ${corrections.length - 10} more corrections`)
    }
    
    // Apply corrections
    console.log('\\n🚀 Starting correction process...')
    const result = applyCorrections(corrections)
    
    console.log('\\n✅ Correction process completed!')
    console.log(`Changes made: ${result.changesMade}`)
    
    if (result.changesMade > 0) {
      console.log('\\nNext steps:')
      console.log('1. Test the application to ensure corrections work properly')
      console.log('2. Run any validation scripts to verify the fixes')
      console.log('3. Commit the changes if everything looks good')
    }
    
  } catch (error) {
    console.error('❌ Error applying corrections:', error)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}