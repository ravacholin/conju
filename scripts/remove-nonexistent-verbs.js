#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

// List of non-existent verbs to remove
const nonExistentVerbs = [
  'tañir',
  'redormir', 
  'empedernir',
  'colorir',
  'balbucir',
  'amuar',
  'adormir'
]

console.log('🗑️  Removing non-existent verbs from database...')

function removeVerbsFromFile(filePath) {
  console.log(`\nProcessing: ${filePath}`)
  
  const content = fs.readFileSync(filePath, 'utf8')
  let modified = content
  let removedCount = 0
  
  // For each non-existent verb, remove its entire object structure
  nonExistentVerbs.forEach(verb => {
    const verbPattern = new RegExp(
      `\\s*{[^}]*"id":\\s*"${verb}_priority"[^}]*}(?:\\s*,\\s*{[^}]*"lemma":\\s*"${verb}"[\\s\\S]*?})*,?`, 
      'g'
    )
    
    const beforeLength = modified.length
    modified = modified.replace(verbPattern, '')
    
    if (modified.length < beforeLength) {
      console.log(`  ✅ Removed ${verb}`)
      removedCount++
    }
  })
  
  // Clean up any trailing commas or formatting issues
  modified = modified.replace(/,(\s*])/g, '$1')
  modified = modified.replace(/,(\s*,)/g, '$1')
  
  if (removedCount > 0) {
    fs.writeFileSync(filePath, modified)
    console.log(`  📝 Updated ${filePath} (removed ${removedCount} verbs)`)
  } else {
    console.log(`  ℹ️  No changes needed in ${filePath}`)
  }
}

// Process main data files
const dataDir = 'src/data'
const filesToProcess = [
  path.join(dataDir, 'verbs.js'),
  path.join(dataDir, 'priorityVerbs.js')
]

filesToProcess.forEach(file => {
  if (fs.existsSync(file)) {
    removeVerbsFromFile(file)
  } else {
    console.log(`⚠️  File not found: ${file}`)
  }
})

console.log('\n✨ Cleanup complete!')
console.log('\n🔍 Run data validation to confirm cleanup:')
console.log('   node src/validate-data.js')