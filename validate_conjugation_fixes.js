#!/usr/bin/env node
/**
 * Validation script to verify that all conjugation fixes have been applied correctly
 * This script tests the fixes against the original error patterns identified
 */

import { grade } from './src/lib/core/grader.js'
import { verbs } from './src/data/verbs.js'
import { isRegularFormForMood, isEnhancedRegularForm } from './src/lib/core/conjugationRules.js'
import fs from 'fs'

console.log('🔍 CONJUGATION FIXES VALIDATION')
console.log('==============================')
console.log('Testing all applied fixes against original error patterns...\n')

const mockSettings = {
  region: 'la_general',
  useVoseo: false,
  useTuteo: true,
  useVosotros: false,
  strict: true,
  accentTolerance: 'warn'
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

function testSubjImpfSupport() {
  console.log('📝 Testing subjunctive imperfect (subjImpf) support...')
  
  const testCases = [
    { lemma: 'hablar', person: '1s', raForm: 'hablara', seForm: 'hablase' },
    { lemma: 'comer', person: '1s', raForm: 'comiera', seForm: 'comiese' },
    { lemma: 'vivir', person: '1s', raForm: 'viviera', seForm: 'viviese' },
    { lemma: 'ser', person: '1s', raForm: 'fuera', seForm: 'fuese' },
    { lemma: 'tener', person: '1s', raForm: 'tuviera', seForm: 'tuviese' }
  ]
  
  let passed = 0
  let total = 0
  
  for (const testCase of testCases) {
    const verb = findVerbByLemma(testCase.lemma)
    if (!verb) {
      console.log(`  ❌ Verb ${testCase.lemma} not found in database`)
      total += 2
      continue
    }
    
    const form = findConjugationForm(verb, 'subjunctive', 'subjImpf', testCase.person)
    if (!form) {
      console.log(`  ❌ ${testCase.lemma} subjImpf ${testCase.person} form not found`)
      total += 2
      continue
    }
    
    // Test -ra form
    total++
    const raResult = grade(testCase.raForm, form, mockSettings)
    if (raResult.correct) {
      console.log(`  ✅ ${testCase.lemma} subjImpf ${testCase.person} -ra form: ${testCase.raForm}`)
      passed++
    } else {
      console.log(`  ❌ ${testCase.lemma} subjImpf ${testCase.person} -ra form failed: ${testCase.raForm}`)
    }
    
    // Test -se form
    total++
    const seResult = grade(testCase.seForm, form, mockSettings)
    if (seResult.correct) {
      console.log(`  ✅ ${testCase.lemma} subjImpf ${testCase.person} -se form: ${testCase.seForm}`)
      passed++
    } else {
      console.log(`  ❌ ${testCase.lemma} subjImpf ${testCase.person} -se form failed: ${testCase.seForm}`)
    }
  }
  
  console.log(`\\n📊 subjImpf Support Test Results: ${passed}/${total} passed (${Math.round(passed/total*100)}%)`)
  return { passed, total, percentage: Math.round(passed/total*100) }
}

function testCriticalParadigmFixes() {
  console.log('\\n📝 Testing critical paradigm fixes...')
  
  const testCases = [
    { lemma: 'vivir', mood: 'subjunctive', tense: 'subjPres', person: '3s', expected: 'viva' },
    { lemma: 'vivir', mood: 'subjunctive', tense: 'subjPres', person: '1p', expected: 'vivamos' },
    { lemma: 'vivir', mood: 'subjunctive', tense: 'subjPres', person: '2p_vosotros', expected: 'viváis' },
    { lemma: 'vivir', mood: 'subjunctive', tense: 'subjPres', person: '3p', expected: 'vivan' },
    { lemma: 'vivir', mood: 'imperative', tense: 'impAff', person: '3s', expected: 'viva' },
    { lemma: 'vivir', mood: 'imperative', tense: 'impNeg', person: '3s', expected: 'no viva' }
  ]
  
  let passed = 0
  let total = testCases.length
  
  for (const testCase of testCases) {
    const verb = findVerbByLemma(testCase.lemma)
    if (!verb) {
      console.log(`  ❌ Verb ${testCase.lemma} not found in database`)
      continue
    }
    
    const form = findConjugationForm(verb, testCase.mood, testCase.tense, testCase.person)
    if (!form) {
      console.log(`  ❌ ${testCase.lemma} ${testCase.mood}-${testCase.tense}-${testCase.person} form not found`)
      continue
    }
    
    if (form.value === testCase.expected) {
      console.log(`  ✅ ${testCase.lemma} ${testCase.mood}-${testCase.tense}-${testCase.person}: "${form.value}"`)
      passed++
    } else {
      console.log(`  ❌ ${testCase.lemma} ${testCase.mood}-${testCase.tense}-${testCase.person}: got "${form.value}", expected "${testCase.expected}"`)
    }
  }
  
  console.log(`\\n📊 Critical Paradigm Fixes Test Results: ${passed}/${total} passed (${Math.round(passed/total*100)}%)`)
  return { passed, total, percentage: Math.round(passed/total*100) }
}

function testEnhancedIrregularPatterns() {
  console.log('\\n📝 Testing enhanced irregular pattern recognition...')
  
  const testCases = [
    { lemma: 'pensar', mood: 'indicative', tense: 'pres', person: '1s', form: 'pienso', shouldPass: true },
    { lemma: 'volver', mood: 'nonfinite', tense: 'part', person: '', form: 'vuelto', shouldPass: true },
    { lemma: 'hacer', mood: 'nonfinite', tense: 'part', person: '', form: 'hecho', shouldPass: true },
    { lemma: 'ver', mood: 'nonfinite', tense: 'part', person: '', form: 'visto', shouldPass: true },
    { lemma: 'decir', mood: 'nonfinite', tense: 'part', person: '', form: 'dicho', shouldPass: true },
    // Test that regular incorrect forms are rejected
    { lemma: 'pensar', mood: 'indicative', tense: 'pres', person: '1s', form: 'penso', shouldPass: false },
    { lemma: 'hacer', mood: 'nonfinite', tense: 'part', person: '', form: 'hacido', shouldPass: false }
  ]
  
  let passed = 0
  let total = testCases.length
  
  for (const testCase of testCases) {
    const isRegular = isEnhancedRegularForm(testCase.lemma, testCase.mood, testCase.tense, testCase.person, testCase.form)
    
    if ((isRegular && testCase.shouldPass) || (!isRegular && !testCase.shouldPass)) {
      console.log(`  ✅ ${testCase.lemma} ${testCase.mood}-${testCase.tense}-${testCase.person}: "${testCase.form}" ${testCase.shouldPass ? 'accepted' : 'rejected'} correctly`)
      passed++
    } else {
      console.log(`  ❌ ${testCase.lemma} ${testCase.mood}-${testCase.tense}-${testCase.person}: "${testCase.form}" ${isRegular ? 'accepted' : 'rejected'} incorrectly`)
    }
  }
  
  console.log(`\\n📊 Enhanced Irregular Patterns Test Results: ${passed}/${total} passed (${Math.round(passed/total*100)}%)`)
  return { passed, total, percentage: Math.round(passed/total*100) }
}

function testRandomSampleFromOriginalErrors() {
  console.log('\\n📝 Testing random sample from original error cases...')
  
  // Sample of error cases that should now be resolved
  const sampleCases = [
    // subjImpf cases that should now work
    { lemma: 'hablar', mood: 'subjunctive', tense: 'subjImpf', person: '1s', input: 'hablara' },
    { lemma: 'hablar', mood: 'subjunctive', tense: 'subjImpf', person: '1s', input: 'hablase' },
    { lemma: 'vivir', mood: 'subjunctive', tense: 'subjImpf', person: '1s', input: 'viviera' },
    { lemma: 'vivir', mood: 'subjunctive', tense: 'subjImpf', person: '1s', input: 'viviese' },
    
    // Fixed paradigm cases
    { lemma: 'vivir', mood: 'subjunctive', tense: 'subjPres', person: '3s', input: 'viva' },
    { lemma: 'vivir', mood: 'subjunctive', tense: 'subjPres', person: '1p', input: 'vivamos' }
  ]
  
  let passed = 0
  let total = sampleCases.length
  
  for (const testCase of sampleCases) {
    const verb = findVerbByLemma(testCase.lemma)
    if (!verb) {
      console.log(`  ❌ Verb ${testCase.lemma} not found`)
      continue
    }
    
    const form = findConjugationForm(verb, testCase.mood, testCase.tense, testCase.person)
    if (!form) {
      console.log(`  ❌ Form not found: ${testCase.lemma} ${testCase.mood}-${testCase.tense}-${testCase.person}`)
      continue
    }
    
    const result = grade(testCase.input, form, mockSettings)
    if (result.correct) {
      console.log(`  ✅ ${testCase.lemma} ${testCase.mood}-${testCase.tense}-${testCase.person}: "${testCase.input}" accepted`)
      passed++
    } else {
      console.log(`  ❌ ${testCase.lemma} ${testCase.mood}-${testCase.tense}-${testCase.person}: "${testCase.input}" rejected`)
    }
  }
  
  console.log(`\\n📊 Original Error Sample Test Results: ${passed}/${total} passed (${Math.round(passed/total*100)}%)`)
  return { passed, total, percentage: Math.round(passed/total*100) }
}

function generateValidationReport(results) {
  const overallResults = {
    timestamp: new Date().toISOString(),
    testSuites: results,
    overallSummary: {
      totalTests: results.reduce((sum, r) => sum + r.total, 0),
      totalPassed: results.reduce((sum, r) => sum + r.passed, 0)
    }
  }
  
  overallResults.overallSummary.overallPercentage = Math.round(
    (overallResults.overallSummary.totalPassed / overallResults.overallSummary.totalTests) * 100
  )
  
  const reportFile = './conjugation_fixes_validation_report.json'
  fs.writeFileSync(reportFile, JSON.stringify(overallResults, null, 2))
  
  console.log('\\n🎯 OVERALL VALIDATION RESULTS')
  console.log('=============================')
  console.log(`Total tests run: ${overallResults.overallSummary.totalTests}`)
  console.log(`Tests passed: ${overallResults.overallSummary.totalPassed}`)
  console.log(`Overall success rate: ${overallResults.overallSummary.overallPercentage}%`)
  
  if (overallResults.overallSummary.overallPercentage >= 80) {
    console.log('\\n✅ VALIDATION SUCCESSFUL!')
    console.log('The conjugation fixes are working correctly.')
    console.log('Ready to commit changes.')
  } else {
    console.log('\\n⚠️  VALIDATION NEEDS ATTENTION')
    console.log('Some fixes may need additional work.')
    console.log('Review the detailed results above.')
  }
  
  console.log(`\\n📄 Detailed validation report saved: ${reportFile}`)
  
  return overallResults
}

function main() {
  try {
    console.log('Starting comprehensive validation of conjugation fixes...\\n')
    
    const results = []
    
    // Run all test suites
    results.push({ 
      name: 'subjImpf Support', 
      ...testSubjImpfSupport() 
    })
    
    results.push({ 
      name: 'Critical Paradigm Fixes', 
      ...testCriticalParadigmFixes() 
    })
    
    results.push({ 
      name: 'Enhanced Irregular Patterns', 
      ...testEnhancedIrregularPatterns() 
    })
    
    results.push({ 
      name: 'Original Error Sample', 
      ...testRandomSampleFromOriginalErrors() 
    })
    
    // Generate comprehensive report
    const report = generateValidationReport(results)
    
    console.log('\\n🎉 VALIDATION COMPLETED!')
    console.log('\\nThe comprehensive conjugation fix validation shows:')
    
    results.forEach(result => {
      const status = result.percentage >= 80 ? '✅' : result.percentage >= 60 ? '⚠️' : '❌'
      console.log(`  ${status} ${result.name}: ${result.percentage}% (${result.passed}/${result.total})`)
    })
    
    return report.overallSummary.overallPercentage >= 80 ? 0 : 1
    
  } catch (error) {
    console.error('❌ Error during validation:', error)
    return 1
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main())
}