#!/usr/bin/env node
/**
 * Fix the remaining 18 errors to achieve 100% completion
 * Based on the specific errors identified in the validation report
 */

import fs from 'fs'

console.log('🎯 FIXING REMAINING 18 ERRORS FOR 100% COMPLETION')
console.log('=================================================\n')

const VERBS_FILE = './src/data/verbs.js'

// Based on the validation report, these are the specific remaining errors
const remainingErrors = [
  // vivir paradigm errors that weren't fully corrected
  { lemma: 'vivir', mood: 'subjunctive', tense: 'subjPres', person: '3s', incorrectValue: 'vivamos', correctValue: 'viva' },
  { lemma: 'vivir', mood: 'subjunctive', tense: 'subjPres', person: '1p', incorrectValue: 'viváis', correctValue: 'vivamos' },
  { lemma: 'vivir', mood: 'subjunctive', tense: 'subjPres', person: '2p_vosotros', incorrectValue: 'vivan', correctValue: 'viváis' },
  { lemma: 'vivir', mood: 'subjunctive', tense: 'subjPres', person: '3p', incorrectValue: 'viv', correctValue: 'vivan' },
  { lemma: 'vivir', mood: 'imperative', tense: 'impAff', person: '3s', incorrectValue: 'vivamos', correctValue: 'viva' },
  { lemma: 'vivir', mood: 'imperative', tense: 'impAff', person: '1p', incorrectValue: 'viváis', correctValue: 'vivamos' },
  { lemma: 'vivir', mood: 'imperative', tense: 'impAff', person: '3p', incorrectValue: 'viv', correctValue: 'vivan' },
  { lemma: 'vivir', mood: 'imperative', tense: 'impNeg', person: '2s_vos', incorrectValue: 'no viva', correctValue: 'no vivas' },
  { lemma: 'vivir', mood: 'imperative', tense: 'impNeg', person: '3s', incorrectValue: 'no vivamos', correctValue: 'no viva' },
  { lemma: 'vivir', mood: 'imperative', tense: 'impNeg', person: '1p', incorrectValue: 'no viváis', correctValue: 'no vivamos' },
  { lemma: 'vivir', mood: 'imperative', tense: 'impNeg', person: '2p_vosotros', incorrectValue: 'no vivan', correctValue: 'no viváis' },
  { lemma: 'vivir', mood: 'imperative', tense: 'impNeg', person: '3p', incorrectValue: 'no viv', correctValue: 'no vivan' },
  
  // Specific conjugation errors from previous fixes
  { lemma: 'vivir', mood: 'subjunctive', tense: 'subjImpf', person: '1p', incorrectValue: 'viváramos', correctValue: 'viviéramos' },
  { lemma: 'llegar', mood: 'subjunctive', tense: 'subjImpf', person: '1p', incorrectValue: 'llégramos', correctValue: 'llegáramos' },
  { lemma: 'buscar', mood: 'subjunctive', tense: 'subjImpf', person: '1p', incorrectValue: 'búscramos', correctValue: 'buscáramos' }
]

function fixRemainingErrors() {
  console.log('📝 Reading verbs.js file...')
  
  let verbsContent = fs.readFileSync(VERBS_FILE, 'utf8')
  let fixesApplied = 0
  
  console.log('\\n🔧 Applying final fixes...')
  
  for (const error of remainingErrors) {
    console.log(`\\n  🔍 Looking for: ${error.lemma} ${error.mood}-${error.tense}-${error.person}`)
    console.log(`      "${error.incorrectValue}" → "${error.correctValue}"`)
    
    // Create specific regex patterns to find and fix each error
    // We need to be very precise to avoid false matches
    
    if (error.incorrectValue === 'viv' && error.correctValue === 'vivan') {
      // Special case for incomplete "viv" forms
      const pattern = new RegExp(
        `(\\{[^}]*"tense":\\s*"${error.tense}"[^}]*"mood":\\s*"${error.mood}"[^}]*"person":\\s*"${error.person}"[^}]*"value":\\s*")viv(")`
      )
      
      const matches = verbsContent.match(pattern)
      if (matches) {
        verbsContent = verbsContent.replace(pattern, `$1vivan$2`)
        fixesApplied++
        console.log(`      ✅ Fixed incomplete "viv" → "vivan"`)
      }
    } else if (error.incorrectValue.startsWith('no ')) {
      // Handle negative imperative forms
      const baseForm = error.incorrectValue.replace('no ', '')
      const correctBase = error.correctValue.replace('no ', '')
      
      const pattern = new RegExp(
        `(\\{[^}]*"tense":\\s*"${error.tense}"[^}]*"mood":\\s*"${error.mood}"[^}]*"person":\\s*"${error.person}"[^}]*"value":\\s*")no\\s+${baseForm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}(")`
      )
      
      const matches = verbsContent.match(pattern)
      if (matches) {
        verbsContent = verbsContent.replace(pattern, `$1no ${correctBase}$2`)
        fixesApplied++
        console.log(`      ✅ Fixed "${error.incorrectValue}" → "${error.correctValue}"`)
      }
    } else {
      // Regular form replacement
      const pattern = new RegExp(
        `(\\{[^}]*"tense":\\s*"${error.tense}"[^}]*"mood":\\s*"${error.mood}"[^}]*"person":\\s*"${error.person}"[^}]*"value":\\s*")${error.incorrectValue.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}(")`
      )
      
      const matches = verbsContent.match(pattern)
      if (matches) {
        verbsContent = verbsContent.replace(pattern, `$1${error.correctValue}$2`)
        fixesApplied++
        console.log(`      ✅ Fixed "${error.incorrectValue}" → "${error.correctValue}"`)
      } else {
        console.log(`      ⚠️  Pattern not found, trying alternative search...`)
        
        // Try a more flexible search
        const flexiblePattern = new RegExp(
          `"value":\\s*"${error.incorrectValue.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}"`
        )
        
        if (verbsContent.includes(`"value": "${error.incorrectValue}"`)) {
          // Use a more targeted approach - look for the lemma section first
          const lemmaRegex = new RegExp(`"lemma":\\s*"${error.lemma}"[\\s\\S]*?(?="lemma":|$)`)
          const lemmaMatch = verbsContent.match(lemmaRegex)
          
          if (lemmaMatch && lemmaMatch[0].includes(`"value": "${error.incorrectValue}"`)) {
            verbsContent = verbsContent.replace(`"value": "${error.incorrectValue}"`, `"value": "${error.correctValue}"`)
            fixesApplied++
            console.log(`      ✅ Fixed with flexible search "${error.incorrectValue}" → "${error.correctValue}"`)
          }
        }
      }
    }
  }
  
  console.log(`\\n📊 FINAL FIX SUMMARY:`)
  console.log(`Total fixes applied: ${fixesApplied}`)
  console.log(`Expected fixes: ${remainingErrors.length}`)
  
  if (fixesApplied > 0) {
    // Create backup
    const backupFile = VERBS_FILE + '.backup-final-' + Date.now()
    fs.writeFileSync(backupFile, fs.readFileSync(VERBS_FILE))
    console.log(`\\n📦 Backup created: ${backupFile}`)
    
    // Write updated content
    fs.writeFileSync(VERBS_FILE, verbsContent)
    console.log(`✅ Updated ${VERBS_FILE}`)
  }
  
  return fixesApplied
}

function validateFinalResult() {
  console.log('\\n🔍 Running final validation...')
  
  // We'll run a simple validation by checking if our fixes are in the file
  const verbsContent = fs.readFileSync(VERBS_FILE, 'utf8')
  
  const correctForms = [
    'viviéramos', // instead of viváramos 
    'llegáramos', // instead of llégramos
    'buscáramos', // instead of búscramos
    'viva',       // vivir 3s subjPres (should be multiple instances)
    'vivamos',    // vivir 1p subjPres 
    'viváis',     // vivir 2p_vosotros subjPres
    'vivan',      // vivir 3p subjPres
    'no vivas',   // vivir impNeg 2s_vos
    'no viva',    // vivir impNeg 3s
    'no vivamos', // vivir impNeg 1p
    'no viváis',  // vivir impNeg 2p_vosotros
    'no vivan'    // vivir impNeg 3p
  ]
  
  let foundCorrectForms = 0
  
  for (const form of correctForms) {
    if (verbsContent.includes(`"value": "${form}"`)) {
      foundCorrectForms++
      console.log(`  ✅ Found correct form: "${form}"`)
    } else {
      console.log(`  ❓ Missing form: "${form}"`)
    }
  }
  
  console.log(`\\n📊 Validation: ${foundCorrectForms}/${correctForms.length} correct forms found`)
  
  return foundCorrectForms
}

function main() {
  try {
    console.log('Starting final fixes to achieve 100% completion...\\n')
    
    const fixesApplied = fixRemainingErrors()
    const correctFormsFound = validateFinalResult()
    
    console.log('\\n🎯 FINAL COMPLETION STATUS')
    console.log('===========================')
    
    if (fixesApplied >= 15 && correctFormsFound >= 10) {
      console.log('✅ SUCCESS: Final fixes applied successfully!')
      console.log('✅ Ready to achieve 100% error resolution!')
    } else if (fixesApplied > 0) {
      console.log('⚠️  PARTIAL SUCCESS: Some fixes applied, but may need manual review')
      console.log(`Applied: ${fixesApplied} fixes`)
      console.log(`Found: ${correctFormsFound} correct forms`)
    } else {
      console.log('❌ No fixes applied. Manual intervention may be needed.')
    }
    
    console.log('\\n📋 Next steps:')
    console.log('1. Run the validation script again to verify 100% completion')
    console.log('2. Test the application to ensure all fixes work correctly')
    console.log('3. Commit the final changes')
    
    return fixesApplied > 0 ? 0 : 1
    
  } catch (error) {
    console.error('❌ Error during final fixes:', error)
    return 1
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main())
}