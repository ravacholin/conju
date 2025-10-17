// Advanced Variety Engine Testing Suite
// Comprehensive tests for the enhanced mixed practice algorithms

import { varietyEngine } from './advancedVarietyEngine.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('core:advancedVarietyTesting')

// Advanced Variety Testing - verbs not currently used directly

/**
 * Generate test forms for variety testing
 */
function generateTestForms() {
  const testForms = []
  
  // Sample verbs from different categories
  const testVerbs = ['ser', 'estar', 'hablar', 'comer', 'vivir', 'poder', 'querer', 'hacer', 'ir', 'tener']
  const testTenses = [
    { mood: 'indicative', tense: 'pres' },
    { mood: 'indicative', tense: 'pretIndef' },
    { mood: 'indicative', tense: 'impf' },
    { mood: 'indicative', tense: 'pretPerf' },
    { mood: 'subjunctive', tense: 'subjPres' },
    { mood: 'conditional', tense: 'cond' }
  ]
  const testPersons = ['1s', '2s_tu', '3s', '1p', '3p']
  
  testVerbs.forEach(lemma => {
    testTenses.forEach(({ mood, tense }) => {
      testPersons.forEach(person => {
        testForms.push({
          lemma,
          mood,
          tense,
          person,
          value: `${lemma}_${mood}_${tense}_${person}` // Mock value
        })
      })
    })
  })
  
  return testForms
}

/**
 * Test anti-repetition system
 */
export function testAntiRepetition() {
  logger.debug('\n🔬 === ANTI-REPETITION SYSTEM TEST ===')
  
  varietyEngine.resetSession()
  const testForms = generateTestForms()
  const mockHistory = {}
  
  logger.debug('Testing 20 selections for repetition patterns...')
  
  const selections = []
  const verbCounts = new Map()
  const tenseCounts = new Map()
  const personCounts = new Map()
  
  for (let i = 0; i < 20; i++) {
    const selected = varietyEngine.selectVariedForm(testForms, 'B1', 'mixed', mockHistory)
    if (selected) {
      selections.push(selected)
      
      // Count occurrences
      verbCounts.set(selected.lemma, (verbCounts.get(selected.lemma) || 0) + 1)
      const tenseKey = `${selected.mood}|${selected.tense}`
      tenseCounts.set(tenseKey, (tenseCounts.get(tenseKey) || 0) + 1)
      personCounts.set(selected.person, (personCounts.get(selected.person) || 0) + 1)
    }
  }
  
  logger.debug('\nVerb distribution:')
  Array.from(verbCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([verb, count]) => {
      logger.debug(`  ${verb}: ${count} times (${Math.round(count/20*100)}%)`)
    })
  
  logger.debug('\nTense distribution:')
  Array.from(tenseCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([tense, count]) => {
      logger.debug(`  ${tense}: ${count} times (${Math.round(count/20*100)}%)`)
    })
  
  logger.debug('\nPerson distribution:')
  Array.from(personCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, count]) => {
      logger.debug(`  ${person}: ${count} times (${Math.round(count/20*100)}%)`)
    })
  
  // Check for good variety (no single item should dominate)
  const maxVerbCount = Math.max(...verbCounts.values())
  const maxTenseCount = Math.max(...tenseCounts.values())
  const hasGoodVariety = maxVerbCount <= 4 && maxTenseCount <= 5 // Allow some repetition but not dominance
  
  logger.debug(`\n✅ Variety Assessment: ${hasGoodVariety ? 'GOOD' : 'POOR'} (max verb: ${maxVerbCount}, max tense: ${maxTenseCount})`)
  
  return {
    success: hasGoodVariety,
    maxVerbCount,
    maxTenseCount,
    totalSelections: selections.length,
    uniqueVerbs: verbCounts.size,
    uniqueTenses: tenseCounts.size
  }
}

/**
 * Test level-specific priorities
 */
export function testLevelSpecificPriorities() {
  logger.debug('\n🎯 === LEVEL-SPECIFIC PRIORITIES TEST ===')
  
  const testForms = generateTestForms()
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const results = {}
  
  levels.forEach(level => {
    logger.debug(`\nTesting ${level} level priorities...`)
    varietyEngine.resetSession()
    
    const levelSelections = []
    const mockHistory = {}
    
    // Make 15 selections for this level
    for (let i = 0; i < 15; i++) {
      const selected = varietyEngine.selectVariedForm(testForms, level, 'mixed', mockHistory)
      if (selected) {
        levelSelections.push(selected)
      }
    }
    
    // Analyze selections
    const verbCounts = new Map()
    const tenseCounts = new Map()
    
    levelSelections.forEach(form => {
      verbCounts.set(form.lemma, (verbCounts.get(form.lemma) || 0) + 1)
      const tenseKey = `${form.mood}|${form.tense}`
      tenseCounts.set(tenseKey, (tenseCounts.get(tenseKey) || 0) + 1)
    })
    
    const topVerbs = Array.from(verbCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([verb, count]) => `${verb}(${count})`)
    
    const topTenses = Array.from(tenseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tense, count]) => `${tense}(${count})`)
    
    logger.debug(`  Top verbs: ${topVerbs.join(', ')}`)
    logger.debug(`  Top tenses: ${topTenses.join(', ')}`)
    
    results[level] = {
      selections: levelSelections.length,
      uniqueVerbs: verbCounts.size,
      uniqueTenses: tenseCounts.size,
      topVerbs: Array.from(verbCounts.keys()).slice(0, 5),
      topTenses: Array.from(tenseCounts.keys()).slice(0, 3)
    }
  })
  
  // Validate level differences
  const a1HasBasics = results.A1?.topVerbs.includes('ser') && results.A1?.topVerbs.includes('estar')
  const b1HasSubjunctive = results.B1?.topTenses.some(t => t.includes('subjunctive'))
  const c1HasAdvanced = results.C1?.uniqueTenses >= results.A1?.uniqueTenses
  
  logger.debug(`\n✅ Level Differentiation:`)
  logger.debug(`   A1 focuses on basics: ${a1HasBasics}`)
  logger.debug(`   B1 includes subjunctive: ${b1HasSubjunctive}`) 
  logger.debug(`   C1 shows variety: ${c1HasAdvanced}`)
  
  return {
    success: a1HasBasics && b1HasSubjunctive && c1HasAdvanced,
    levelResults: results,
    a1HasBasics,
    b1HasSubjunctive,
    c1HasAdvanced
  }
}

/**
 * Test progressive difficulty within session
 */
export function testProgressiveDifficulty() {
  logger.debug('\n📈 === PROGRESSIVE DIFFICULTY TEST ===')
  
  varietyEngine.resetSession()
  const testForms = generateTestForms()
  const mockHistory = {}
  
  logger.debug('Testing difficulty progression over 30 selections...')
  
  const selections = []
  const difficultyProgression = []
  
  for (let i = 0; i < 30; i++) {
    const selected = varietyEngine.selectVariedForm(testForms, 'B1', 'mixed', mockHistory)
    if (selected) {
      selections.push(selected)
      
      // Estimate difficulty (simplified)
      let difficulty = 1
      if (selected.mood === 'subjunctive') difficulty += 3
      if (selected.tense.includes('Perf')) difficulty += 2
      if (selected.mood === 'conditional') difficulty += 2
      
      difficultyProgression.push(difficulty)
    }
  }
  
  // Check if average difficulty increases over time
  const firstThird = difficultyProgression.slice(0, 10)
  const lastThird = difficultyProgression.slice(-10)
  
  const avgEarly = firstThird.reduce((sum, d) => sum + d, 0) / firstThird.length
  const avgLate = lastThird.reduce((sum, d) => sum + d, 0) / lastThird.length
  
  const showsProgression = avgLate > avgEarly
  
  logger.debug(`Early session avg difficulty: ${avgEarly.toFixed(2)}`)
  logger.debug(`Late session avg difficulty: ${avgLate.toFixed(2)}`)
  logger.debug(`Progressive difficulty: ${showsProgression ? 'YES' : 'NO'}`)
  
  const sessionStats = varietyEngine.getSessionStats()
  logger.debug('Session stats:', sessionStats)
  
  return {
    success: showsProgression,
    avgEarly,
    avgLate,
    progressionAmount: avgLate - avgEarly,
    sessionStats
  }
}

/**
 * Test semantic category diversity
 */
export function testSemanticDiversity() {
  logger.debug('\n🌈 === SEMANTIC DIVERSITY TEST ===')
  
  varietyEngine.resetSession()
  
  // Extended test forms with more diverse verbs
  const diverseVerbs = [
    'ser', 'estar', // states
    'ir', 'venir', 'llegar', // movement  
    'hablar', 'decir', 'gritar', // communication
    'amar', 'odiar', 'preocupar', // emotions
    'pensar', 'saber', 'recordar', // mental
    'comer', 'dormir', 'trabajar' // physical
  ]
  
  const testForms = [];
  diverseVerbs.forEach(lemma => {
    ['indicative', 'subjunctive'].forEach(mood => {
      const tense = mood === 'indicative' ? 'pres' : 'subjPres';
      ['1s', '3s'].forEach(person => {
        testForms.push({
          lemma,
          mood,
          tense,
          person,
          value: `${lemma}_${mood}_${tense}_${person}`
        })
      })
    })
  })
  
  logger.debug('Testing semantic diversity over 24 selections...')
  
  const selections = []
  const mockHistory = {}
  
  for (let i = 0; i < 24; i++) {
    const selected = varietyEngine.selectVariedForm(testForms, 'B1', 'mixed', mockHistory)
    if (selected) {
      selections.push(selected)
    }
  }
  
  // Analyze semantic distribution
  const semanticCounts = new Map()
  selections.forEach(form => {
    // Simplified semantic categorization for testing
    let category = 'other'
    if (['ser', 'estar'].includes(form.lemma)) category = 'states'
    else if (['ir', 'venir', 'llegar'].includes(form.lemma)) category = 'movement'
    else if (['hablar', 'decir', 'gritar'].includes(form.lemma)) category = 'communication'
    else if (['amar', 'odiar', 'preocupar'].includes(form.lemma)) category = 'emotions'
    else if (['pensar', 'saber', 'recordar'].includes(form.lemma)) category = 'mental'
    else if (['comer', 'dormir', 'trabajar'].includes(form.lemma)) category = 'physical'
    
    semanticCounts.set(category, (semanticCounts.get(category) || 0) + 1)
  })
  
  logger.debug('\nSemantic category distribution:')
  Array.from(semanticCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      logger.debug(`  ${category}: ${count} selections (${Math.round(count/selections.length*100)}%)`)
    })
  
  const categoriesUsed = semanticCounts.size
  const hasGoodDiversity = categoriesUsed >= 4 // Should use at least 4 different categories
  
  logger.debug(`\n✅ Semantic diversity: ${hasGoodDiversity ? 'GOOD' : 'POOR'} (${categoriesUsed}/6 categories)`)
  
  return {
    success: hasGoodDiversity,
    categoriesUsed,
    totalCategories: 6,
    categoryDistribution: Object.fromEntries(semanticCounts)
  }
}

/**
 * Comprehensive variety engine test suite
 */
export function runAdvancedVarietyTests() {
  logger.debug('\n🚀 === ADVANCED VARIETY ENGINE TEST SUITE ===')
  logger.debug('Testing the enhanced mixed practice algorithms\n')
  
  const antiRepetitionTest = testAntiRepetition()
  const levelPrioritiesTest = testLevelSpecificPriorities()
  const progressiveDifficultyTest = testProgressiveDifficulty()
  const semanticDiversityTest = testSemanticDiversity()
  
  logger.debug('\n📊 === COMPREHENSIVE TEST RESULTS ===')
  logger.debug(`Anti-Repetition System: ${antiRepetitionTest.success ? '✅ PASSED' : '❌ FAILED'}`)
  logger.debug(`Level-Specific Priorities: ${levelPrioritiesTest.success ? '✅ PASSED' : '❌ FAILED'}`)
  logger.debug(`Progressive Difficulty: ${progressiveDifficultyTest.success ? '✅ PASSED' : '❌ FAILED'}`)
  logger.debug(`Semantic Diversity: ${semanticDiversityTest.success ? '✅ PASSED' : '❌ FAILED'}`)
  
  const overallSuccess = antiRepetitionTest.success && 
                         levelPrioritiesTest.success && 
                         progressiveDifficultyTest.success && 
                         semanticDiversityTest.success
  
  if (overallSuccess) {
    logger.debug('\n🎉 ALL ADVANCED VARIETY TESTS PASSED!')
    logger.debug('✨ The enhanced mixed practice algorithm is working correctly:')
    logger.debug('   • Effective anti-repetition prevents boring patterns')
    logger.debug('   • Level-specific priorities ensure appropriate content')
    logger.debug('   • Progressive difficulty keeps sessions challenging')
    logger.debug('   • Semantic diversity provides engaging variety')
  } else {
    logger.debug('\n⚠️  Some advanced variety tests failed. Check the details above.')
  }
  
  return {
    overall: overallSuccess,
    antiRepetitionTest,
    levelPrioritiesTest,
    progressiveDifficultyTest,
    semanticDiversityTest
  }
}

// Browser console integration
if (typeof window !== 'undefined') {
  window.testAdvancedVariety = {
    runAll: runAdvancedVarietyTests,
    testAntiRepetition,
    testLevelPriorities: testLevelSpecificPriorities,
    testProgression: testProgressiveDifficulty,
    testDiversity: testSemanticDiversity
  }
  
  logger.debug(`
🚀 Advanced Variety Testing Available!

Run in browser console:
  window.testAdvancedVariety.runAll()           // Run all variety tests
  window.testAdvancedVariety.testAntiRepetition() // Test anti-repetition only
  window.testAdvancedVariety.testLevelPriorities() // Test level-specific logic only
  window.testAdvancedVariety.testProgression()   // Test difficulty progression only
  window.testAdvancedVariety.testDiversity()     // Test semantic diversity only
`)
}