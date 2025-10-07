#!/usr/bin/env node

/**
 * Data Validation Script
 *
 * This script validates the integrity of verb data and related structures.
 * Used by CI/CD pipeline to ensure data consistency.
 */

import { validateIntegrity } from '../scripts/validateIntegrity.mjs'

async function main() {
  console.log('🔍 Running data validation...')

  try {
    const { errors, warnings, stats } = await validateIntegrity({ verbose: true })

    if (stats) {
      console.log(`📊 Dataset Stats:`)
      console.log(`  - Verbs: ${stats.verbs}`)
      console.log(`  - Curriculum entries: ${stats.curriculumEntries}`)
      console.log(`  - Mood/Tense combinations: ${stats.combinations}`)
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings found:')
      warnings.forEach(warning => console.log(`  - ${warning}`))
    }

    if (errors.length > 0) {
      console.error('\n❌ Validation errors found:')
      errors.forEach(error => console.error(`  - ${error}`))
      console.error('\n💥 Data validation failed!')
      process.exit(1)
    }

    console.log('\n✅ Data validation passed successfully!')

  } catch (error) {
    console.error('❌ Unexpected error during validation:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

// Only run if called directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main as validateData }