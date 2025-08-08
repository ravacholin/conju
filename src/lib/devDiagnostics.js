// Development-only diagnostics runner. Loaded dynamically in dev builds.
import { testNonfiniteVerbs } from './testNonfinite.js'
import { comprehensiveVerbTest, testSpecificCategories } from './comprehensiveTest.js'
import { cleanDuplicateVerbs, addMissingForms, validateVerbStructure } from './cleanDuplicateVerbs.js'
import { generateImprovementReport } from './bugFixes.js'
import { testNonfiniteSelection } from './testNonfiniteSelection.js'
import { debugGerundioIssue } from './debugGerundioIssue.js'
import { fixGerundioIssue } from './fixGerundioIssue.js'
import { testGerundioDirect } from './testGerundioDirect.js'

export function runDevDiagnostics() {
  // Keep console logs inside this function; it only runs in dev
  console.log('=== RUNNING COMPREHENSIVE APP DIAGNOSTICS (DEV) ===')
  validateVerbStructure()
  testNonfiniteVerbs()
  comprehensiveVerbTest()
  testSpecificCategories()
  cleanDuplicateVerbs()
  generateImprovementReport()
  testNonfiniteSelection()
  debugGerundioIssue()
  fixGerundioIssue()
  testGerundioDirect()
  console.log('=== DIAGNOSTICS COMPLETE (DEV) ===')
}


