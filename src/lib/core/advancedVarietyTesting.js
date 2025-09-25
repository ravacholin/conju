// Advanced Variety Engine Testing Suite
// Comprehensive tests for the enhanced mixed practice algorithms

import { varietyEngine } from './advancedVarietyEngine.js'
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
  console.log('\n === ANTI-REPETITION SYSTEM TEST ===')
  
  varietyEngine.resetSession()
  const testForms = generateTestForms()
  const mockHistory = {}
  
  console.log('Testing 20 selections for repetition patterns...')
  
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
  
  console.log('\nVerb distribution:')
  Array.from(verbCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([verb, count]) => {
      console.log(`  ${verb}: ${count} times (${Math.round(count/20*100)}%)`)
    })
  
  console.log('\nTense distribution:')
  Array.from(tenseCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([tense, count]) => {
      console.log(`  ${tense}: ${count} times (${Math.round(count/20*100)}%)`)
    })
  
  console.log('\nPerson distribution:')
  Array.from(personCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([person, count]) => {
      console.log(`  ${person}: ${count} times (${Math.round(count/20*100)}%)`)
    })
  
  // Check for good variety (no single item should dominate)
  const maxVerbCount = Math.max(...verbCounts.values())
  const maxTenseCount = Math.max(...tenseCounts.values())
  const hasGoodVariety = maxVerbCount <= 4 && maxTenseCount <= 5 // Allow some repetition but not dominance
  
  console.log(`\n✅ Variety Assessment: ${hasGoodVariety ? 'GOOD' : 'POOR'} (max verb: ${maxVerbCount}, max tense: ${maxTenseCount})`)
  
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
  console.log('\n === LEVEL-SPECIFIC PRIORITIES TEST ===')
  
  const testForms = generateTestForms()
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const results = {}
  
  levels.forEach(level => {
    console.log(`\nTesting ${level} level priorities...`)
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
    
    console.log(`  Top verbs: ${topVerbs.join(', ')}`)
    console.log(`  Top tenses: ${topTenses.join(', ')}`)
    
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
  
  console.log(`\n✅ Level Differentiation:`)
  console.log(`   A1 focuses on basics: ${a1HasBasics}`)
  console.log(`   B1 includes subjunctive: ${b1HasSubjunctive}`) 
  console.log(`   C1 shows variety: ${c1HasAdvanced}`)
  
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
  console.log('\n === PROGRESSIVE DIFFICULTY TEST ===')
  
  varietyEngine.resetSession()
  const testForms = generateTestForms()
  const mockHistory = {}
  
  console.log('Testing difficulty progression over 30 selections...')
  
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
  
  console.log(`Early session avg difficulty: ${avgEarly.toFixed(2)}`)
  console.log(`Late session avg difficulty: ${avgLate.toFixed(2)}`)
  console.log(`Progressive difficulty: ${showsProgression ? 'YES' : 'NO'}`)
  
  const sessionStats = varietyEngine.getSessionStats()
  console.log('Session stats:', sessionStats)
  
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
  console.log('\n === SEMANTIC DIVERSITY TEST ===')
  
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
  
  console.log('Testing semantic diversity over 24 selections...')
  
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
  
  console.log('\nSemantic category distribution:')
  Array.from(semanticCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count} selections (${Math.round(count/selections.length*100)}%)`)
    })
  
  const categoriesUsed = semanticCounts.size
  const hasGoodDiversity = categoriesUsed >= 4 // Should use at least 4 different categories
  
  console.log(`\n✅ Semantic diversity: ${hasGoodDiversity ? 'GOOD' : 'POOR'} (${categoriesUsed}/6 categories)`)
  
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
  console.log('\n === ADVANCED VARIETY ENGINE TEST SUITE ===')
  console.log('Testing the enhanced mixed practice algorithms\n')
  
  const antiRepetitionTest = testAntiRepetition()
  const levelPrioritiesTest = testLevelSpecificPriorities()
  const progressiveDifficultyTest = testProgressiveDifficulty()
  const semanticDiversityTest = testSemanticDiversity()
  
  console.log('\n === COMPREHENSIVE TEST RESULTS ===')
  console.log(`Anti-Repetition System: ${antiRepetitionTest.success ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Level-Specific Priorities: ${levelPrioritiesTest.success ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Progressive Difficulty: ${progressiveDifficultyTest.success ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Semantic Diversity: ${semanticDiversityTest.success ? '✅ PASSED' : '❌ FAILED'}`)
  
  const overallSuccess = antiRepetitionTest.success && 
                         levelPrioritiesTest.success && 
                         progressiveDifficultyTest.success && 
                         semanticDiversityTest.success
  
  if (overallSuccess) {
    console.log('\n ALL ADVANCED VARIETY TESTS PASSED!')
    console.log(' The enhanced mixed practice algorithm is working correctly:')
    console.log('   • Effective anti-repetition prevents boring patterns')
    console.log('   • Level-specific priorities ensure appropriate content')
    console.log('   • Progressive difficulty keeps sessions challenging')
    console.log('   • Semantic diversity provides engaging variety')
  } else {
    console.log('\n️  Some advanced variety tests failed. Check the details above.')
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
  
  console.log(`
 Advanced Variety Testing Available!

Run in browser console:
  window.testAdvancedVariety.runAll()           // Run all variety tests
  window.testAdvancedVariety.testAntiRepetition() // Test anti-repetition only
  window.testAdvancedVariety.testLevelPriorities() // Test level-specific logic only
  window.testAdvancedVariety.testProgression()   // Test difficulty progression only
  window.testAdvancedVariety.testDiversity()     // Test semantic diversity only
`)
}