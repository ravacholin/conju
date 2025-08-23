#!/usr/bin/env node
/**
 * Final targeted fix for the specific remaining errors
 * Using exact search and replace for the problematic forms
 */

import fs from 'fs'

console.log('🎯 FINAL TARGETED FIX - ACHIEVING 100%')
console.log('=====================================\n')

const VERBS_FILE = './src/data/verbs.js'

function applyTargetedFixes() {
  console.log('📝 Loading verbs.js file...')
  
  let verbsContent = fs.readFileSync(VERBS_FILE, 'utf8')
  let fixesApplied = 0
  
  // Based on the validation errors, these are the exact problematic forms
  const exactFixes = [
    // vivir subjunctive problems - these seem to be persisting
    { find: '"value": "vivamos"', replace: '"value": "viva"', context: 'subjPres.*3s', description: 'vivir subjPres 3s' },
    { find: '"value": "viváis"', replace: '"value": "vivamos"', context: 'subjPres.*1p', description: 'vivir subjPres 1p' },
    { find: '"value": "vivan"', replace: '"value": "viváis"', context: 'subjPres.*2p_vosotros', description: 'vivir subjPres 2p_vosotros' },
    
    // Incomplete "viv" forms
    { find: '"value": "viv"', replace: '"value": "vivan"', context: '', description: 'incomplete viv forms' },
    
    // Imperative problems
    { find: '"value": "no viv"', replace: '"value": "no vivan"', context: 'impNeg', description: 'incomplete impNeg forms' },
    
    // Specific subjImpf errors we saw earlier
    { find: '"value": "imprímramos"', replace: '"value": "imprimiéramos"', context: '', description: 'imprimir subjImpf 1p accent fix' }
  ]
  
  console.log('🔧 Applying targeted fixes...\n')
  
  for (const fix of exactFixes) {
    console.log(`  🔍 Fixing: ${fix.description}`)
    console.log(`      "${fix.find}" → "${fix.replace}"`)
    
    const beforeCount = (verbsContent.match(new RegExp(fix.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
    
    if (beforeCount > 0) {
      verbsContent = verbsContent.replace(new RegExp(fix.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace)
      const afterCount = (verbsContent.match(new RegExp(fix.replace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      
      fixesApplied += beforeCount
      console.log(`      ✅ Applied ${beforeCount} replacements`)
    } else {
      console.log(`      ⚠️  No instances found`)
    }
  }
  
  // Additional manual fixes for patterns that might be more complex
  console.log(`\n🔧 Applying additional pattern-based fixes...`)
  
  // Fix any remaining problematic vivir patterns
  const vivirPatterns = [
    // Pattern: find vivir with wrong subjPres forms and fix them
    { 
      pattern: /"lemma": "vivir"[\s\S]*?"tense": "subjPres"[\s\S]*?"person": "3s"[\s\S]*?"value": "vivamos"/g,
      replacement: (match) => match.replace('"value": "vivamos"', '"value": "viva"'),
      description: 'vivir subjPres 3s pattern fix'
    },
    {
      pattern: /"lemma": "vivir"[\s\S]*?"tense": "subjPres"[\s\S]*?"person": "1p"[\s\S]*?"value": "viváis"/g, 
      replacement: (match) => match.replace('"value": "viváis"', '"value": "vivamos"'),
      description: 'vivir subjPres 1p pattern fix'
    },
    {
      pattern: /"lemma": "vivir"[\s\S]*?"tense": "subjPres"[\s\S]*?"person": "2p_vosotros"[\s\S]*?"value": "vivan"/g,
      replacement: (match) => match.replace('"value": "vivan"', '"value": "viváis"'),
      description: 'vivir subjPres 2p_vosotros pattern fix'
    }
  ]
  
  for (const pattern of vivirPatterns) {
    const matches = verbsContent.match(pattern.pattern)
    if (matches) {
      verbsContent = verbsContent.replace(pattern.pattern, pattern.replacement)
      fixesApplied += matches.length
      console.log(`  ✅ ${pattern.description}: ${matches.length} fixes applied`)
    }
  }
  
  console.log(`\n📊 Total fixes applied: ${fixesApplied}`)
  
  if (fixesApplied > 0) {
    // Create backup
    const backupFile = VERBS_FILE + '.backup-targeted-' + Date.now()
    fs.writeFileSync(backupFile, fs.readFileSync(VERBS_FILE))
    console.log(`📦 Backup created: ${backupFile}`)
    
    // Write updated content
    fs.writeFileSync(VERBS_FILE, verbsContent)
    console.log(`✅ Updated ${VERBS_FILE}`)
  }
  
  return fixesApplied
}

function main() {
  try {
    console.log('Starting final targeted fixes...\n')
    
    const fixesApplied = applyTargetedFixes()
    
    console.log('\n🎯 TARGETED FIX RESULTS')
    console.log('=======================')
    
    if (fixesApplied > 0) {
      console.log(`✅ Applied ${fixesApplied} targeted fixes`)
      console.log('✅ Ready for final validation')
    } else {
      console.log('⚠️  No additional fixes were applied')
      console.log('⚠️  Manual inspection may be needed')
    }
    
    console.log('\n📋 Next step:')
    console.log('Run the validation script one more time to check for 100% completion')
    
    return fixesApplied > 0 ? 0 : 1
    
  } catch (error) {
    console.error('❌ Error during targeted fixes:', error)
    return 1
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main())
}