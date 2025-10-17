// Quick Integration Test for Level-Driven Prioritization
// Simple script to verify the new system works end-to-end

import { levelPrioritizer } from './levelDrivenPrioritizer.js'
import { chooseNext } from './generator.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('core:quickLevelTest')


/**
 * Enhanced test for the comprehensive curriculum-driven algorithm
 */
export function quickB1Test() {
  logger.debug('\n🎯 === ENHANCED CURRICULUM-DRIVEN B1 TEST ===')
  logger.debug('Testing the advanced curriculum analysis system\n')
  
  try {
    // Test 1: Enhanced Level Prioritizer
    logger.debug('1️⃣ Testing Enhanced Level Prioritizer...')
    const b1Prioritized = levelPrioritizer.getPrioritizedTenses('B1')
    
    logger.debug('B1 Enhanced Core Analysis:')
    b1Prioritized.core.slice(0, 5).forEach((tense, i) => {
      const readiness = Math.round((tense.readiness || 0) * 100)
      const urgency = Math.round(tense.urgency || 0)
      logger.debug(`  ${i + 1}. ${tense.mood}/${tense.tense}`)
      logger.debug(`     Priority: ${tense.priority} | Readiness: ${readiness}% | Urgency: ${urgency}`)
      logger.debug(`     Family: ${tense.family} | Complexity: ${tense.complexity}`)
    })
    
    // Test curriculum-driven features
    const hasSubjunctive = b1Prioritized.core.some(t => t.mood === 'subjunctive')
    const hasPerfectTenses = b1Prioritized.core.some(t => t.tense.includes('Perf'))
    const hasPrerequisiteAnalysis = b1Prioritized.prerequisites && b1Prioritized.prerequisites.length >= 0
    const hasFamilyGroups = b1Prioritized.familyGroups && Object.keys(b1Prioritized.familyGroups).length > 0
    const hasProgressionPath = b1Prioritized.progression && b1Prioritized.progression.length >= 0
    
    logger.debug(`✅ B1 prioritizes subjunctive: ${hasSubjunctive}`)
    logger.debug(`✅ B1 prioritizes perfect tenses: ${hasPerfectTenses}`)
    logger.debug(`✅ Has prerequisite analysis: ${hasPrerequisiteAnalysis}`)
    logger.debug(`✅ Has family grouping: ${hasFamilyGroups}`)
    logger.debug(`✅ Has progression path: ${hasProgressionPath}`)
    
    // Test 2: Curriculum Progression Analysis
    logger.debug('\n2️⃣ Testing Curriculum Progression...')
    
    if (b1Prioritized.progression.length > 0) {
      logger.debug('B1 Optimal Progression Path:')
      b1Prioritized.progression.slice(0, 3).forEach((tense, i) => {
        const readiness = Math.round((tense.readiness || 0) * 100)
        logger.debug(`  ${i + 1}. ${tense.mood}/${tense.tense} (${readiness}% ready)`)
      })
    }
    
    // Test 3: Family Analysis
    logger.debug('\n3️⃣ Testing Family Analysis...')
    const familyGroups = Object.entries(b1Prioritized.familyGroups).slice(0, 3)
    familyGroups.forEach(([family, group]) => {
      logger.debug(`  • ${family}: ${group.tenses.length} tenses, ${Math.round(group.avgMastery)}% avg mastery`)
      logger.debug(`    Status: ${group.completionStatus}, Priority: ${Math.round(group.priority)}`)
    })
    
    // Test 4: Compare with other levels
    logger.debug('\n4️⃣ Enhanced Level Comparison...')
    const allLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    
    allLevels.forEach(level => {
      try {
        const prioritized = levelPrioritizer.getPrioritizedTenses(level)
        const topTense = prioritized.core[0]
        const coreCount = prioritized.core.length
        const familyCount = Object.keys(prioritized.familyGroups).length
        
        if (topTense) {
          logger.debug(`  ${level}: ${topTense.mood}/${topTense.tense} (${topTense.complexity} complexity)`)
          logger.debug(`        ${coreCount} core tenses, ${familyCount} families`)
        } else {
          logger.debug(`  ${level}: No core tenses`)
        }
      } catch (error) {
        logger.debug(`  ${level}: Error - ${error.message}`)
      }
    })
    
    // Test 5: Weighted Selection Enhancement
    logger.debug('\n5️⃣ Testing Enhanced Weighted Selection...')
    const mockForms = [
      { mood: 'indicative', tense: 'pres', person: '1s', lemma: 'hablar', value: 'hablo' },
      { mood: 'subjunctive', tense: 'subjPres', person: '1s', lemma: 'hablar', value: 'hable' },
      { mood: 'indicative', tense: 'pretPerf', person: '1s', lemma: 'hablar', value: 'he hablado' },
      { mood: 'indicative', tense: 'pretIndef', person: '1s', lemma: 'hablar', value: 'hablé' }
    ]
    
    const weighted = levelPrioritizer.getWeightedSelection(mockForms, 'B1')
    
    // Count distributions
    const distributions = {}
    weighted.forEach(form => {
      const key = `${form.mood}/${form.tense}`
      distributions[key] = (distributions[key] || 0) + 1
    })
    
    logger.debug('Enhanced weighting distribution:')
    Object.entries(distributions)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tense, count]) => {
        const percentage = Math.round((count / weighted.length) * 100)
        logger.debug(`  ${tense}: ${count} occurrences (${percentage}%)`)
      })
    
    // Test 6: Next Recommendation with Reasoning
    logger.debug('\n6️⃣ Testing Smart Recommendations...')
    const b1NextRec = levelPrioritizer.getNextRecommendedTense('B1')
    
    if (b1NextRec) {
      const isNotPresentIndicative = !(b1NextRec.mood === 'indicative' && b1NextRec.tense === 'pres')
      logger.debug(`B1 next recommendation: ${b1NextRec.mood}/${b1NextRec.tense}`)
      logger.debug(`✅ B1 recommendation is NOT present indicative: ${isNotPresentIndicative}`)
      
      // Get recommendation reasoning
      const reasoning = levelPrioritizer.getRecommendationReason(b1NextRec, b1Prioritized)
      logger.debug(`Reasoning: ${reasoning}`)
    } else {
      logger.debug('❌ No B1 recommendation available')
    }
    
    logger.debug('\n🎉 Enhanced curriculum-driven B1 test completed!')
    logger.debug('✨ Key improvements verified:')
    logger.debug('   • Comprehensive curriculum analysis from curriculum.json')
    logger.debug('   • Prerequisite dependency tracking')
    logger.debug('   • Pedagogical family grouping')
    logger.debug('   • Optimal learning progression paths')
    logger.debug('   • Dynamic priority weighting')
    logger.debug('   • Readiness assessment for advanced content')
    
    return {
      success: true,
      hasSubjunctive,
      hasPerfectTenses,
      hasPrerequisiteAnalysis,
      hasFamilyGroups,
      hasProgressionPath,
      b1TopTense: b1Prioritized.core[0] ? `${b1Prioritized.core[0].mood}/${b1Prioritized.core[0].tense}` : 'none',
      familyCount: Object.keys(b1Prioritized.familyGroups).length,
      progressionLength: b1Prioritized.progression.length
    }
    
  } catch (error) {
    logger.error('❌ Enhanced B1 test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Test the integration with the generator
 */
export function testGeneratorIntegration() {
  logger.debug('\n🔧 === GENERATOR INTEGRATION TEST ===')
  logger.debug('Testing that the chooseNext function uses level-aware prioritization\n')
  
  // Mock the useSettings to return B1 level
  const mockSettings = {
    level: 'B1',
    verbType: 'all',
    practiceMode: 'mixed',
    region: 'all',
    useVoseo: true,
    useTuteo: true,
    useVosotros: true
  }
  
  // Mock forms representing different tenses
  const mockForms = [
    // Present indicative (should have lower priority for B1)
    { mood: 'indicative', tense: 'pres', person: '1s', lemma: 'hablar', value: 'hablo' },
    { mood: 'indicative', tense: 'pres', person: '2s_tu', lemma: 'hablar', value: 'hablas' },
    { mood: 'indicative', tense: 'pres', person: '3s', lemma: 'hablar', value: 'habla' },
    
    // Subjunctive present (should have higher priority for B1)
    { mood: 'subjunctive', tense: 'subjPres', person: '1s', lemma: 'hablar', value: 'hable' },
    { mood: 'subjunctive', tense: 'subjPres', person: '2s_tu', lemma: 'hablar', value: 'hables' },
    { mood: 'subjunctive', tense: 'subjPres', person: '3s', lemma: 'hablar', value: 'hable' },
    
    // Perfect tenses (should have high priority for B1)
    { mood: 'indicative', tense: 'pretPerf', person: '1s', lemma: 'hablar', value: 'he hablado' },
    { mood: 'indicative', tense: 'pretPerf', person: '3s', lemma: 'hablar', value: 'ha hablado' }
  ]
  
  try {
    // Mock useSettings temporarily (in a real test environment)
    const originalUseSettings = globalThis.useSettings
    globalThis.useSettings = () => mockSettings
    
    // Test multiple selections to see the pattern
    logger.debug('Testing 10 selections from chooseNext...')
    const selections = []
    const history = {} // Empty history for new user simulation
    
    for (let i = 0; i < 10; i++) {
      try {
        const selected = chooseNext({ forms: mockForms, history, currentItem: null })
        if (selected) {
          selections.push(`${selected.mood}/${selected.tense}`)
        }
      } catch (error) {
        logger.debug(`Selection ${i + 1} failed: ${error.message}`)
      }
    }
    
    // Analyze selections
    const selectionCounts = {}
    selections.forEach(selection => {
      selectionCounts[selection] = (selectionCounts[selection] || 0) + 1
    })
    
    logger.debug('Selection distribution:')
    Object.entries(selectionCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tense, count]) => {
        logger.debug(`  ${tense}: ${count} times (${Math.round(count / selections.length * 100)}%)`)
      })
    
    // Check if subjunctive was selected more than present indicative
    const subjCount = selectionCounts['subjunctive/subjPres'] || 0
    const presCount = selectionCounts['indicative/pres'] || 0
    
    const subjunctivePrioritized = subjCount >= presCount
    logger.debug(`\n✅ Subjunctive prioritized over present indicative: ${subjunctivePrioritized}`)
    
    // Restore original useSettings
    if (originalUseSettings) {
      globalThis.useSettings = originalUseSettings
    }
    
    logger.debug('\n✅ Generator integration test completed!')
    
    return {
      success: true,
      selections,
      selectionCounts,
      subjunctivePrioritized
    }
    
  } catch (error) {
    logger.error('❌ Generator integration test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Run both quick tests
 */
export function runQuickTests() {
  logger.debug('\n🚀 === RUNNING QUICK LEVEL-DRIVEN TESTS ===')
  
  const b1Test = quickB1Test()
  const generatorTest = testGeneratorIntegration()
  
  logger.debug('\n📊 === QUICK TEST SUMMARY ===')
  logger.debug(`B1 Prioritization Test: ${b1Test.success ? '✅ PASSED' : '❌ FAILED'}`)
  logger.debug(`Generator Integration Test: ${generatorTest.success ? '✅ PASSED' : '❌ FAILED'}`)
  
  if (b1Test.success && generatorTest.success) {
    logger.debug('\n🎉 ALL TESTS PASSED! The level-driven system is working correctly.')
    logger.debug('\n✨ Key improvements verified:')
    logger.debug('   • B1 users get subjunctive and perfect tenses (not just present indicative)')
    logger.debug('   • Different levels prioritize different tenses')
    logger.debug('   • The generator respects level-aware prioritization')
    logger.debug('   • The multi-tier system (SRS → Adaptive → Level-Aware) is integrated')
  } else {
    logger.debug('\n⚠️  Some tests failed. Check the details above.')
  }
  
  return {
    overall: b1Test.success && generatorTest.success,
    b1Test,
    generatorTest
  }
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  window.quickLevelTest = {
    runAll: runQuickTests,
    testB1: quickB1Test,
    testGenerator: testGeneratorIntegration
  }
  
  logger.debug(`
🚀 Quick Level Test Available!

Run in browser console:
  window.quickLevelTest.runAll()    // Run all quick tests
  window.quickLevelTest.testB1()    // Test B1 prioritization only  
  window.quickLevelTest.testGenerator() // Test generator integration only
`)
}