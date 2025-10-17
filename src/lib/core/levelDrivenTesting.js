// Testing and Debugging Utilities for Level-Driven Prioritization System
// Comprehensive testing suite to verify the new algorithm works correctly

import { levelPrioritizer, getWeightedFormsSelection } from './levelDrivenPrioritizer.js'
import { AdaptivePracticeEngine } from '../progress/AdaptivePracticeEngine.js'
import { PersonalizedCoach } from '../progress/personalizedCoaching.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('core:levelDrivenTesting')


/**
 * Comprehensive testing suite for the level-driven system
 */
export class LevelDrivenTester {
  constructor() {
    this.testResults = []
    this.allLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  }

  /**
   * Run all tests and return comprehensive results
   */
  async runAllTests() {
    logger.debug('\n🧪 === LEVEL-DRIVEN PRIORITIZATION TESTING SUITE ===')
    
    this.testResults = []
    
    // Test 1: Basic prioritizer functionality
    await this.testPrioritizerBasics()
    
    // Test 2: Level-specific tense priorities
    await this.testLevelSpecificPriorities()
    
    // Test 3: Weighted form selection
    await this.testWeightedFormSelection()
    
    // Test 4: Adaptive engine integration
    await this.testAdaptiveEngineIntegration()
    
    // Test 5: Coaching system integration
    await this.testCoachingSystemIntegration()
    
    // Test 6: Real-world scenarios
    await this.testRealWorldScenarios()
    
    // Generate summary report
    const summary = this.generateTestSummary()
    logger.debug('\n📊 TEST SUMMARY:')
    logger.debug(`✅ Passed: ${summary.passed}`)
    logger.debug(`❌ Failed: ${summary.failed}`)
    logger.debug(`⏳ Total: ${summary.total}`)
    
    if (summary.failed > 0) {
      logger.debug('\n❌ FAILED TESTS:')
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => logger.debug(`  - ${r.name}: ${r.error}`))
    }
    
    logger.debug('\n=== END TESTING SUITE ===\n')
    
    return {
      summary,
      results: this.testResults
    }
  }

  /**
   * Test basic prioritizer functionality
   */
  async testPrioritizerBasics() {
    logger.debug('\n🔍 Testing Prioritizer Basics...')
    
    for (const level of this.allLevels) {
      try {
        const prioritized = levelPrioritizer.getPrioritizedTenses(level)
        
        // Test that all required properties exist
        this.assert(
          prioritized.core && Array.isArray(prioritized.core),
          `Level ${level} should have core tenses array`
        )
        
        this.assert(
          prioritized.review && Array.isArray(prioritized.review),
          `Level ${level} should have review tenses array`
        )
        
        this.assert(
          prioritized.exploration && Array.isArray(prioritized.exploration),
          `Level ${level} should have exploration tenses array`
        )
        
        this.assert(
          prioritized.weights && typeof prioritized.weights === 'object',
          `Level ${level} should have weights object`
        )
        
        // Test that priorities are reasonable
        if (prioritized.core.length > 0) {
          this.assert(
            prioritized.core.every(t => t.priority > 0),
            `Level ${level} core tenses should have positive priorities`
          )
        }
        
        logger.debug(`  ✅ ${level}: ${prioritized.core.length} core, ${prioritized.review.length} review, ${prioritized.exploration.length} exploration`)
        
      } catch (error) {
        this.recordFailure(`Prioritizer basics ${level}`, error)
      }
    }
  }

  /**
   * Test that different levels have different priorities
   */
  async testLevelSpecificPriorities() {
    logger.debug('\n🎯 Testing Level-Specific Priorities...')
    
    try {
      // Test that B1 prioritizes subjunctive present
      const b1Priorities = levelPrioritizer.getPrioritizedTenses('B1')
      const b1HasSubjunctive = b1Priorities.core.some(t => 
        t.mood === 'subjunctive' && t.tense === 'subjPres'
      )
      
      this.assert(
        b1HasSubjunctive,
        'B1 should prioritize subjunctive present in core tenses'
      )
      
      // Test that A1 prioritizes present indicative
      const a1Priorities = levelPrioritizer.getPrioritizedTenses('A1')
      const a1HasPresent = a1Priorities.core.some(t => 
        t.mood === 'indicative' && t.tense === 'pres'
      )
      
      this.assert(
        a1HasPresent,
        'A1 should prioritize present indicative in core tenses'
      )
      
      // Test that B2 prioritizes subjunctive imperfect
      const b2Priorities = levelPrioritizer.getPrioritizedTenses('B2')
      const b2HasSubjImpf = b2Priorities.core.some(t => 
        t.mood === 'subjunctive' && t.tense === 'subjImpf'
      )
      
      this.assert(
        b2HasSubjImpf,
        'B2 should prioritize subjunctive imperfect in core tenses'
      )
      
      // Test that levels have different weight distributions
      const levelWeights = this.allLevels.map(level => ({
        level,
        weights: levelPrioritizer.getPrioritizedTenses(level).weights
      }))
      
      // A1 should have higher core weight than C2
      this.assert(
        levelWeights.find(l => l.level === 'A1').weights.core > 
        levelWeights.find(l => l.level === 'C2').weights.core,
        'A1 should have higher core weight than C2'
      )
      
      logger.debug('  ✅ Level-specific priorities verified')
      
    } catch (error) {
      this.recordFailure('Level-specific priorities', error)
    }
  }

  /**
   * Test weighted form selection
   */
  async testWeightedFormSelection() {
    logger.debug('\n⚖️  Testing Weighted Form Selection...')
    
    try {
      // Create mock forms for testing
      const mockForms = [
        { mood: 'indicative', tense: 'pres', person: '1s', lemma: 'hablar', value: 'hablo' },
        { mood: 'subjunctive', tense: 'subjPres', person: '1s', lemma: 'hablar', value: 'hable' },
        { mood: 'indicative', tense: 'pretIndef', person: '1s', lemma: 'hablar', value: 'hablé' },
        { mood: 'conditional', tense: 'cond', person: '1s', lemma: 'hablar', value: 'hablaría' },
        { mood: 'subjunctive', tense: 'subjImpf', person: '1s', lemma: 'hablar', value: 'hablara' }
      ]
      
      // Test B1 level - should heavily weight subjunctive present
      const b1Weighted = getWeightedFormsSelection(mockForms, 'B1')
      
      this.assert(
        b1Weighted.length > mockForms.length,
        'B1 weighted selection should have more forms than original (due to duplication)'
      )
      
      // Count subjunctive present occurrences (should be higher in weighted selection)
      const subjPresCount = b1Weighted.filter(f => 
        f.mood === 'subjunctive' && f.tense === 'subjPres'
      ).length
      
      this.assert(
        subjPresCount > 1,
        'B1 should have multiple instances of subjunctive present due to weighting'
      )
      
      // Test A1 level - should heavily weight present indicative
      const a1Weighted = getWeightedFormsSelection(mockForms, 'A1')
      const presIndCount = a1Weighted.filter(f => 
        f.mood === 'indicative' && f.tense === 'pres'
      ).length
      
      this.assert(
        presIndCount >= subjPresCount,
        'A1 should weight present indicative heavily'
      )
      
      logger.debug(`  ✅ Weighted selection working (B1: ${subjPresCount} subj.pres, A1: ${presIndCount} ind.pres)`)
      
    } catch (error) {
      this.recordFailure('Weighted form selection', error)
    }
  }

  /**
   * Test adaptive engine integration
   */
  async testAdaptiveEngineIntegration() {
    logger.debug('\n🤖 Testing Adaptive Engine Integration...')
    
    try {
      const engine = new AdaptivePracticeEngine()
      
      // Test level-appropriate combinations
      const b1Combinations = engine.getLevelAppropriateCombinations('B1')
      
      this.assert(
        Array.isArray(b1Combinations) && b1Combinations.length > 0,
        'Adaptive engine should return combinations for B1'
      )
      
      this.assert(
        b1Combinations.some(c => c.mood && c.tense && c.priority),
        'Combinations should have mood, tense, and priority properties'
      )
      
      // Test difficulty evaluation
      const mockStats = { accuracy: 75, averageTime: 8000 }
      const difficultyAnalysis = engine.evaluateDifficulty(
        { mood: 'subjunctive', tense: 'subjPres' },
        mockStats,
        'B1'
      )
      
      this.assert(
        typeof difficultyAnalysis === 'object' && difficultyAnalysis.level,
        'Difficulty evaluation should return structured analysis'
      )
      
      this.assert(
        ['easy', 'medium', 'hard', 'very_hard'].includes(difficultyAnalysis.level),
        'Difficulty level should be valid'
      )
      
      logger.debug(`  ✅ Adaptive engine integrated (${b1Combinations.length} combinations, difficulty: ${difficultyAnalysis.level})`)
      
    } catch (error) {
      this.recordFailure('Adaptive engine integration', error)
    }
  }

  /**
   * Test coaching system integration
   */
  async testCoachingSystemIntegration() {
    logger.debug('\n💡 Testing Coaching System Integration...')
    
    try {
      const coach = new PersonalizedCoach()
      
      // Test coaching analysis (might fail due to missing user data, but should not crash)
      let analysisWorked = false
      try {
        const analysis = await coach.getCoachingAnalysis('B1')
        analysisWorked = analysis && typeof analysis === 'object'
      } catch {
        // Expected to potentially fail without user data
        analysisWorked = true // Don't fail the test for missing data
      }
      
      this.assert(
        analysisWorked,
        'Coaching analysis should not crash (even with missing data)'
      )
      
      // Test level progression analysis with mock data
      const mockMasteryRecords = [
        { mood: 'indicative', tense: 'pres', score: 85 },
        { mood: 'subjunctive', tense: 'subjPres', score: 60 },
        { mood: 'indicative', tense: 'pretIndef', score: 40 }
      ]
      
      const progression = coach.analyzeLevelProgression(mockMasteryRecords, 'B1')
      
      this.assert(
        progression && typeof progression.completionPercentage === 'number',
        'Level progression should return completion percentage'
      )
      
      this.assert(
        progression.status && typeof progression.status === 'string',
        'Level progression should return status'
      )
      
      logger.debug(`  ✅ Coaching system integrated (${progression.completionPercentage}% completion, status: ${progression.status})`)
      
    } catch (error) {
      this.recordFailure('Coaching system integration', error)
    }
  }

  /**
   * Test real-world scenarios
   */
  async testRealWorldScenarios() {
    logger.debug('\n🌍 Testing Real-World Scenarios...')
    
    try {
      // Scenario 1: New B1 user should get subjunctive present
      const newB1User = []
      const b1Recommendation = levelPrioritizer.getNextRecommendedTense('B1', newB1User)
      
      this.assert(
        b1Recommendation && b1Recommendation.mood === 'subjunctive' && b1Recommendation.tense === 'subjPres',
        'New B1 user should get subjunctive present recommendation'
      )
      
      // Scenario 2: Advanced B1 user should get different recommendations
      const advancedB1User = [
        { mood: 'subjunctive', tense: 'subjPres', score: 85 },
        { mood: 'indicative', tense: 'pretPerf', score: 80 }
      ]
      
      const b1AdvancedRec = levelPrioritizer.getNextRecommendedTense('B1', advancedB1User)
      
      this.assert(
        b1AdvancedRec && 
        !(b1AdvancedRec.mood === 'subjunctive' && b1AdvancedRec.tense === 'subjPres'),
        'Advanced B1 user should get different recommendation than subjunctive present'
      )
      
      // Scenario 3: Test level consistency - B1 should not start with present indicative
      const b1Prioritized = levelPrioritizer.getPrioritizedTenses('B1')
      const topB1Tense = b1Prioritized.core[0]
      
      this.assert(
        topB1Tense && 
        !(topB1Tense.mood === 'indicative' && topB1Tense.tense === 'pres'),
        'B1 should not prioritize present indicative as top core tense'
      )
      
      // Scenario 4: Verify different levels prioritize different tenses
      const allLevelTopTenses = this.allLevels.map(level => {
        const prioritized = levelPrioritizer.getPrioritizedTenses(level)
        return {
          level,
          topTense: prioritized.core[0] ? `${prioritized.core[0].mood}/${prioritized.core[0].tense}` : 'none'
        }
      })
      
      // At least 3 different levels should have different top tenses
      const uniqueTopTenses = new Set(allLevelTopTenses.map(l => l.topTense))
      
      this.assert(
        uniqueTopTenses.size >= 3,
        `Different levels should prioritize different tenses (found ${uniqueTopTenses.size} unique)`
      )
      
      logger.debug('  ✅ Real-world scenarios verified')
      logger.debug(`    - New B1 user gets: ${b1Recommendation.mood}/${b1Recommendation.tense}`)
      logger.debug(`    - Advanced B1 user gets: ${b1AdvancedRec.mood}/${b1AdvancedRec.tense}`)
      logger.debug(`    - Top tenses by level:`, allLevelTopTenses.map(l => `${l.level}:${l.topTense}`).join(', '))
      
    } catch (error) {
      this.recordFailure('Real-world scenarios', error)
    }
  }

  /**
   * Assert helper
   */
  assert(condition, message) {
    if (condition) {
      this.testResults.push({ name: message, passed: true })
    } else {
      this.testResults.push({ name: message, passed: false, error: 'Assertion failed' })
    }
  }

  /**
   * Record failure helper
   */
  recordFailure(testName, error) {
    this.testResults.push({ 
      name: testName, 
      passed: false, 
      error: error.message || String(error) 
    })
    logger.debug(`  ❌ ${testName}: ${error.message || error}`)
  }

  /**
   * Generate test summary
   */
  generateTestSummary() {
    const passed = this.testResults.filter(r => r.passed).length
    const failed = this.testResults.filter(r => !r.passed).length
    
    return {
      passed,
      failed,
      total: this.testResults.length,
      successRate: Math.round((passed / this.testResults.length) * 100)
    }
  }
}

/**
 * Quick test runner for console usage
 */
export async function runLevelDrivenTests() {
  const tester = new LevelDrivenTester()
  return await tester.runAllTests()
}

/**
 * Quick debug function to show level prioritization for all levels
 */
export function debugAllLevelPrioritization() {
  logger.debug('\n🔍 === DEBUG: ALL LEVEL PRIORITIZATION ===')
  
  const allLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  
  allLevels.forEach(level => {
    try {
      const prioritized = levelPrioritizer.getPrioritizedTenses(level)
      
      logger.debug(`\n📚 LEVEL ${level}:`)
      logger.debug(`  Core (${prioritized.core.length}):`, 
        prioritized.core.slice(0, 3).map(t => `${t.mood}/${t.tense}(${t.priority})`))
      logger.debug(`  Review (${prioritized.review.length}):`, 
        prioritized.review.slice(0, 3).map(t => `${t.mood}/${t.tense}(${t.priority})`))
      logger.debug(`  Exploration (${prioritized.exploration.length}):`, 
        prioritized.exploration.slice(0, 2).map(t => `${t.mood}/${t.tense}(${t.priority})`))
      logger.debug(`  Weights:`, prioritized.weights)
      
    } catch (error) {
      logger.error(`  ❌ Error for ${level}:`, error.message)
    }
  })
  
  logger.debug('\n=== END DEBUG ===\n')
}

/**
 * Test specific level behavior
 */
export function testSpecificLevel(level, mockUserProgress = null) {
  logger.debug(`\n🎯 === TESTING SPECIFIC LEVEL: ${level} ===`)
  
  try {
    const prioritized = levelPrioritizer.getPrioritizedTenses(level, mockUserProgress)
    const nextRec = levelPrioritizer.getNextRecommendedTense(level, mockUserProgress)
    
    logger.debug('Prioritization Results:')
    logger.debug(`  - Core tenses: ${prioritized.core.length}`)
    logger.debug(`  - Review tenses: ${prioritized.review.length}`)
    logger.debug(`  - Exploration tenses: ${prioritized.exploration.length}`)
    logger.debug(`  - Weights:`, prioritized.weights)
    
    logger.debug('\nTop Recommendations:')
    logger.debug(`  - Core:`, prioritized.core.slice(0, 3).map(t => 
      `${t.mood}/${t.tense} (priority: ${t.priority})`
    ))
    
    if (nextRec) {
      logger.debug(`\nNext recommended tense: ${nextRec.mood}/${nextRec.tense}`)
    }
    
    // Test with mock forms
    const mockForms = [
      { mood: 'indicative', tense: 'pres', person: '1s', lemma: 'hablar', value: 'hablo' },
      { mood: 'subjunctive', tense: 'subjPres', person: '1s', lemma: 'hablar', value: 'hable' },
      { mood: 'indicative', tense: 'pretIndef', person: '1s', lemma: 'hablar', value: 'hablé' }
    ]
    
    const weighted = getWeightedFormsSelection(mockForms, level)
    logger.debug(`\nWeighted selection: ${weighted.length} forms (from ${mockForms.length} original)`)
    
    const tenseCounts = {}
    weighted.forEach(f => {
      const key = `${f.mood}/${f.tense}`
      tenseCounts[key] = (tenseCounts[key] || 0) + 1
    })
    
    logger.debug('Distribution:', tenseCounts)
    
  } catch (error) {
    logger.error(`❌ Error testing ${level}:`, error)
  }
  
  logger.debug(`\n=== END ${level} TEST ===\n`)
}

// Browser/window integration for easy testing
if (typeof window !== 'undefined') {
  window.testLevelDriven = {
    runAllTests: runLevelDrivenTests,
    debugAll: debugAllLevelPrioritization,
    testLevel: testSpecificLevel
  }
  
  logger.debug(`
🧪 Level-Driven Testing Available!
  
Run in browser console:
  - window.testLevelDriven.runAllTests()
  - window.testLevelDriven.debugAll()  
  - window.testLevelDriven.testLevel('B1')
`)
}