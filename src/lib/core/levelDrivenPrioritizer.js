// Advanced Level-Driven Tense Prioritization Engine
// Comprehensive analysis of curriculum.json for intelligent verb/tense selection

import curriculum from '../../data/curriculum.json'

/**
 * Advanced prioritization weights derived from curriculum analysis
 * These weights are now based on the actual curriculum structure and progression
 */
const LEVEL_PRIORITY_WEIGHTS = {
  A1: {
    core: 0.90,     // 90% focus on A1 basics (present + nonfinite only)
    review: 0.10,   // 10% reinforcement  
    exploration: 0.0, // No exploration - master basics first
    consolidation: 0.8 // High consolidation need for fundamentals
  },
  A2: {
    core: 0.75,     // 75% focus on A2 expansion (past, future, imperative)
    review: 0.20,   // 20% A1 review
    exploration: 0.05, // 5% B1 preview
    consolidation: 0.6 // Good consolidation for new tenses
  },
  B1: {
    core: 0.65,     // 65% focus on B1 complexity (subjunctive, perfect tenses)
    review: 0.25,   // 25% A1-A2 review
    exploration: 0.10, // 10% B2 preview
    consolidation: 0.5 // Moderate consolidation, more exploration
  },
  B2: {
    core: 0.50,     // 50% focus on B2 advanced (subjunctive imperfect, complex)
    review: 0.35,   // 35% previous levels review
    exploration: 0.15, // 15% C1 preview
    consolidation: 0.4 // Less consolidation, more variety
  },
  C1: {
    core: 0.35,     // 35% focus on C1 mastery
    review: 0.45,   // 45% comprehensive review for fluency
    exploration: 0.20, // 20% C2 preview
    consolidation: 0.3 // Low consolidation, high variety
  },
  C2: {
    core: 0.25,     // 25% focus on C2 perfection
    review: 0.55,   // 55% comprehensive mastery practice
    exploration: 0.20, // 20% advanced/rare combinations
    consolidation: 0.2 // Minimal consolidation, maximum variety
  }
}

/**
 * Curriculum-derived tense introduction order and complexity analysis
 * This maps exactly to the curriculum.json structure
 */
const CURRICULUM_ANALYSIS = {
  // When each tense is first introduced (curriculum order)
  introduction_levels: {
    'indicative|pres': 'A1',        // Foundation
    'nonfinite|part': 'A1',         // Basic participles 
    'nonfinite|ger': 'A1',          // Basic gerunds
    'indicative|pretIndef': 'A2',   // Past actions
    'indicative|impf': 'A2',        // Past descriptions
    'indicative|fut': 'A2',         // Future
    'imperative|impAff': 'A2',      // Commands
    'indicative|plusc': 'B1',       // Pluperfect
    'indicative|pretPerf': 'B1',    // Present perfect
    'indicative|futPerf': 'B1',     // Future perfect  
    'subjunctive|subjPres': 'B1',   // Present subjunctive
    'subjunctive|subjPerf': 'B1',   // Perfect subjunctive
    'imperative|impNeg': 'B1',      // Negative commands
    'conditional|cond': 'B1',       // Conditional
    'subjunctive|subjImpf': 'B2',   // Imperfect subjunctive
    'subjunctive|subjPlusc': 'B2',  // Pluperfect subjunctive  
    'conditional|condPerf': 'B2'    // Conditional perfect
  },

  // Complexity scores based on curriculum progression
  complexity_scores: {
    'indicative|pres': 1,        // Simplest
    'nonfinite|ger': 2,
    'nonfinite|part': 2,
    'indicative|pretIndef': 3,
    'indicative|impf': 3,
    'indicative|fut': 3,
    'imperative|impAff': 4,
    'indicative|pretPerf': 5,   // Perfect tenses jump in complexity
    'conditional|cond': 5,
    'indicative|plusc': 6,
    'indicative|futPerf': 6,
    'subjunctive|subjPres': 7,   // Subjunctive is major complexity jump
    'subjunctive|subjPerf': 7,
    'imperative|impNeg': 7,
    'subjunctive|subjImpf': 8,   // Advanced subjunctive
    'conditional|condPerf': 8,
    'subjunctive|subjPlusc': 9   // Most complex
  },

  // Pedagogical relationships (what should be learned together)
  tense_families: {
    'basic_present': ['indicative|pres'],
    'nonfinite_basics': ['nonfinite|ger', 'nonfinite|part'],
    'past_narrative': ['indicative|pretIndef', 'indicative|impf'],
    'future_planning': ['indicative|fut'],
    'command_forms': ['imperative|impAff', 'imperative|impNeg'],
    'perfect_system': ['indicative|pretPerf', 'indicative|plusc', 'indicative|futPerf'],
    'subjunctive_present': ['subjunctive|subjPres', 'subjunctive|subjPerf'],
    'subjunctive_past': ['subjunctive|subjImpf', 'subjunctive|subjPlusc'],
    'conditional_system': ['conditional|cond', 'conditional|condPerf']
  },

  // Learning prerequisites (what must be solid before advancing)
  prerequisites: {
    'subjunctive|subjPres': ['indicative|pres', 'indicative|pretIndef'],
    'subjunctive|subjImpf': ['subjunctive|subjPres', 'indicative|impf'],
    'indicative|pretPerf': ['indicative|pres'],
    'indicative|plusc': ['indicative|pretPerf', 'indicative|impf'],
    'conditional|condPerf': ['conditional|cond', 'indicative|pretPerf'],
    'subjunctive|subjPlusc': ['subjunctive|subjImpf', 'indicative|plusc']
  },

  // Mixed practice combinations from curriculum
  mixed_combinations: {
    'imperative|impMixed': ['imperative|impAff', 'imperative|impNeg'],
    'nonfinite|nonfiniteMixed': ['nonfinite|ger', 'nonfinite|part']
  }
}

/**
 * Class for managing level-driven tense prioritization
 */
export class LevelDrivenPrioritizer {
  constructor() {
    this.curriculumData = this.processCurriculumData()
    this.levelHierarchy = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  }

  /**
   * Process curriculum.json into a comprehensive pedagogical structure
   */
  processCurriculumData() {
    const processed = {
      byLevel: {},
      levelIntroductions: {},
      levelOrder: {},
      tenseFamilies: {},
      complexityMapping: {},
      prerequisiteChains: {}
    }

    // Group curriculum by level with enhanced analysis
    this.levelHierarchy.forEach((level, levelIndex) => {
      processed.byLevel[level] = curriculum
        .filter(item => item.level === level)
        .map(item => {
          const key = `${item.mood}|${item.tense}`
          return {
            mood: item.mood,
            tense: item.tense,
            target: item.target,
            key,
            // Enhanced metadata from curriculum analysis
            complexity: CURRICULUM_ANALYSIS.complexity_scores[key] || 5,
            introducedAt: CURRICULUM_ANALYSIS.introduction_levels[key] || level,
            isCore: CURRICULUM_ANALYSIS.introduction_levels[key] === level,
            isMixed: item.tense.includes('Mixed'),
            family: this.getTenseFamily(key)
          }
        })
    })

    // Create detailed level introduction mapping
    curriculum.forEach((item, index) => {
      const key = `${item.mood}|${item.tense}`
      
      if (!processed.levelIntroductions[key]) {
        processed.levelIntroductions[key] = {
          level: item.level,
          order: index,
          complexity: CURRICULUM_ANALYSIS.complexity_scores[key] || 5,
          family: this.getTenseFamily(key),
          prerequisites: CURRICULUM_ANALYSIS.prerequisites[key] || []
        }
      }
    })

    // Build learning progression order within each level
    this.levelHierarchy.forEach(level => {
      processed.levelOrder[level] = this.buildLevelProgression(level, processed.byLevel[level])
    })

    // Create tense family relationships
    Object.entries(CURRICULUM_ANALYSIS.tense_families).forEach(([family, tenses]) => {
      processed.tenseFamilies[family] = tenses.map(key => {
        const [mood, tense] = key.split('|')
        return {
          mood,
          tense,
          key,
          introducedAt: CURRICULUM_ANALYSIS.introduction_levels[key],
          complexity: CURRICULUM_ANALYSIS.complexity_scores[key]
        }
      })
    })

    // Build prerequisite chains for dependency analysis
    Object.entries(CURRICULUM_ANALYSIS.prerequisites).forEach(([tenseKey, prereqs]) => {
      processed.prerequisiteChains[tenseKey] = this.buildPrerequisiteChain(tenseKey, prereqs)
    })

    console.log('📚 Enhanced Curriculum processed:', {
      levels: Object.keys(processed.byLevel).length,
      totalCombinations: Object.keys(processed.levelIntroductions).length,
      tenseFamilies: Object.keys(processed.tenseFamilies).length,
      prerequisiteChains: Object.keys(processed.prerequisiteChains).length,
      sampleProgression: processed.levelOrder.B1?.slice(0, 3)
    })

    return processed
  }

  /**
   * Get the pedagogical family for a tense
   */
  getTenseFamily(tenseKey) {
    for (const [family, tenses] of Object.entries(CURRICULUM_ANALYSIS.tense_families)) {
      if (tenses.includes(tenseKey)) {
        return family
      }
    }
    return 'independent'
  }

  /**
   * Build optimal learning progression within a level
   */
  buildLevelProgression(level, levelTenses) {
    // Sort tenses within level by pedagogical order
    return levelTenses.sort((a, b) => {
      // 1. Prerequisites first
      const aHasPrereqs = CURRICULUM_ANALYSIS.prerequisites[a.key]
      const bHasPrereqs = CURRICULUM_ANALYSIS.prerequisites[b.key]
      
      if (aHasPrereqs && !bHasPrereqs) return 1
      if (!aHasPrereqs && bHasPrereqs) return -1
      
      // 2. Core tenses before review tenses
      if (a.isCore && !b.isCore) return -1
      if (!a.isCore && b.isCore) return 1
      
      // 3. Complexity order
      if (a.complexity !== b.complexity) {
        return a.complexity - b.complexity
      }
      
      // 4. Family grouping (learn related tenses together)
      if (a.family !== b.family) {
        const familyOrder = ['basic_present', 'nonfinite_basics', 'past_narrative', 'perfect_system', 'subjunctive_present', 'conditional_system', 'command_forms', 'subjunctive_past']
        const aFamilyIndex = familyOrder.indexOf(a.family)
        const bFamilyIndex = familyOrder.indexOf(b.family)
        
        if (aFamilyIndex !== -1 && bFamilyIndex !== -1) {
          return aFamilyIndex - bFamilyIndex
        }
      }
      
      return 0
    })
  }

  /**
   * Build complete prerequisite chain for a tense
   */
  buildPrerequisiteChain(tenseKey, directPrereqs) {
    const chain = new Set()
    const visited = new Set()
    
    const addPrereqs = (key) => {
      if (visited.has(key)) return // Avoid circular dependencies
      visited.add(key)
      
      const prereqs = CURRICULUM_ANALYSIS.prerequisites[key] || []
      prereqs.forEach(prereq => {
        chain.add(prereq)
        addPrereqs(prereq) // Recursive chain building
      })
    }
    
    addPrereqs(tenseKey)
    return Array.from(chain)
  }

  /**
   * Get prioritized tense combinations for a given level using comprehensive curriculum analysis
   * @param {string} userLevel - CEFR level (A1, A2, B1, B2, C1, C2)
   * @param {Object} userProgress - User's mastery data (optional)
   * @returns {Object} Categorized tense combinations with comprehensive priorities
   */
  getPrioritizedTenses(userLevel, userProgress = null) {
    const weights = LEVEL_PRIORITY_WEIGHTS[userLevel] || LEVEL_PRIORITY_WEIGHTS.B1
    const levelData = this.curriculumData.levelOrder[userLevel] || []
    
    const categorized = {
      // Enhanced categorization with curriculum intelligence
      core: this.getEnhancedCoreTenses(userLevel, userProgress),
      review: this.getEnhancedReviewTenses(userLevel, userProgress), 
      exploration: this.getEnhancedExplorationTenses(userLevel, userProgress),
      
      // New categories based on curriculum analysis
      prerequisites: this.getPrerequisiteGaps(userLevel, userProgress),
      familyGroups: this.getTenseFamilyGroups(userLevel, userProgress),
      progression: this.getProgressionPath(userLevel, userProgress),
      
      weights: {
        ...weights,
        // Dynamic weight adjustments based on user progress
        ...this.calculateDynamicWeights(userLevel, userProgress)
      }
    }

    // Apply curriculum-driven priority adjustments
    if (userProgress) {
      categorized.adjusted = this.applyAdvancedProgressAdjustments(categorized, userProgress, userLevel)
    }

    console.log(`🎯 Enhanced Level ${userLevel} prioritization:`, {
      core: categorized.core.length,
      review: categorized.review.length,
      exploration: categorized.exploration.length,
      prerequisites: categorized.prerequisites.length,
      familyGroups: Object.keys(categorized.familyGroups).length,
      progression: categorized.progression.length,
      weights: categorized.weights
    })

    return categorized
  }

  /**
   * Get enhanced core tenses using curriculum progression logic
   */
  getEnhancedCoreTenses(userLevel, userProgress = null) {
    const levelProgression = this.curriculumData.levelOrder[userLevel] || []
    const masteryMap = this.createMasteryMap(userProgress)
    
    return levelProgression
      .filter(tense => tense.isCore) // Only tenses introduced at this level
      .map(tense => ({
        ...tense,
        priority: this.calculateAdvancedPriority(tense, userLevel, masteryMap),
        readiness: this.assessReadiness(tense, masteryMap),
        urgency: this.calculateUrgency(tense, userLevel, masteryMap),
        pedagogicalValue: this.calculatePedagogicalValue(tense, userLevel)
      }))
      .sort((a, b) => {
        // Multi-factor sorting for optimal learning sequence
        if (a.readiness !== b.readiness) return b.readiness - a.readiness
        if (a.urgency !== b.urgency) return b.urgency - a.urgency
        return b.priority - a.priority
      })
  }

  /**
   * Get enhanced review tenses with prerequisite analysis
   */
  getEnhancedReviewTenses(userLevel, userProgress = null) {
    const levelIndex = this.levelHierarchy.indexOf(userLevel)
    if (levelIndex <= 0) return []

    const masteryMap = this.createMasteryMap(userProgress)
    const reviewTenses = []
    
    // Get tenses from all previous levels
    for (let i = 0; i < levelIndex; i++) {
      const prevLevel = this.levelHierarchy[i]
      const prevProgression = this.curriculumData.levelOrder[prevLevel] || []
      
      prevProgression.forEach(tense => {
        const mastery = masteryMap.get(tense.key) || 0
        
        // Include if not fully mastered or if it's a prerequisite for current level
        const isPrerequisite = this.isPrerequisiteForLevel(tense.key, userLevel)
        const needsReview = mastery < 80 || isPrerequisite
        
        if (needsReview) {
          reviewTenses.push({
            ...tense,
            originalLevel: prevLevel,
            priority: this.calculateReviewPriority(tense, userLevel, mastery),
            isPrerequisite,
            masteryGap: 80 - mastery,
            reviewUrgency: isPrerequisite ? 'high' : (mastery < 60 ? 'medium' : 'low')
          })
        }
      })
    }
    
    return reviewTenses.sort((a, b) => {
      // Prerequisites first, then by mastery gap
      if (a.isPrerequisite && !b.isPrerequisite) return -1
      if (!a.isPrerequisite && b.isPrerequisite) return 1
      return b.masteryGap - a.masteryGap
    })
  }

  /**
   * Get enhanced exploration tenses with readiness assessment
   */
  getEnhancedExplorationTenses(userLevel, userProgress = null) {
    const levelIndex = this.levelHierarchy.indexOf(userLevel)
    if (levelIndex >= this.levelHierarchy.length - 1) return []

    const nextLevel = this.levelHierarchy[levelIndex + 1]
    const nextProgression = this.curriculumData.levelOrder[nextLevel] || []
    const masteryMap = this.createMasteryMap(userProgress)
    
    return nextProgression
      .filter(tense => tense.isCore) // Only new tenses from next level
      .map(tense => {
        const readiness = this.assessExplorationReadiness(tense, userLevel, masteryMap)
        return {
          ...tense,
          originalLevel: nextLevel,
          priority: this.calculateExplorationPriority(tense, readiness),
          readiness,
          prerequisites: this.curriculumData.prerequisiteChains[tense.key] || [],
          explorationRisk: readiness < 0.6 ? 'high' : (readiness < 0.8 ? 'medium' : 'low')
        }
      })
      .filter(tense => tense.readiness >= 0.4) // Only include if reasonably ready
      .sort((a, b) => b.readiness - a.readiness)
      .slice(0, 3) // Limit exploration to top 3 most ready tenses
  }

  /**
   * Get core (new) tenses for the specified level
   */
  getCoreTensesForLevel(level) {
    const levelData = this.curriculumData.byLevel[level] || []
    
    // For each level, prioritize tenses that are newly introduced at that level
    return levelData
      .filter(item => this.curriculumData.levelIntroductions[`${item.mood}|${item.tense}`] === level)
      .map(item => ({
        ...item,
        priority: this.calculateTensePriority(level, item.mood, item.tense, 'core')
      }))
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get review tenses (from previous levels)
   */
  getReviewTensesForLevel(level) {
    const levelIndex = this.levelHierarchy.indexOf(level)
    if (levelIndex <= 0) return []

    const previousTenses = []
    
    // Collect tenses from all previous levels
    for (let i = 0; i < levelIndex; i++) {
      const prevLevel = this.levelHierarchy[i]
      const prevData = this.curriculumData.byLevel[prevLevel] || []
      
      prevData.forEach(item => {
        previousTenses.push({
          ...item,
          originalLevel: prevLevel,
          priority: this.calculateTensePriority(level, item.mood, item.tense, 'review')
        })
      })
    }

    // Remove duplicates and sort by priority
    const unique = this.removeDuplicateTenses(previousTenses)
    return unique.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get exploration tenses (from upcoming levels)  
   */
  getExplorationTensesForLevel(level) {
    const levelIndex = this.levelHierarchy.indexOf(level)
    if (levelIndex >= this.levelHierarchy.length - 1) return []

    const nextLevel = this.levelHierarchy[levelIndex + 1]
    const nextData = this.curriculumData.byLevel[nextLevel] || []

    return nextData
      .filter(item => this.curriculumData.levelIntroductions[`${item.mood}|${item.tense}`] === nextLevel)
      .map(item => ({
        ...item,
        originalLevel: nextLevel,
        priority: this.calculateTensePriority(level, item.mood, item.tense, 'exploration')
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 3) // Limit exploration to top 3 upcoming tenses
  }

  // ===== NEW ADVANCED CURRICULUM METHODS =====

  /**
   * Create mastery map from user progress data
   */
  createMasteryMap(userProgress) {
    const map = new Map()
    if (userProgress && Array.isArray(userProgress)) {
      userProgress.forEach(record => {
        const key = `${record.mood}|${record.tense}`
        map.set(key, record.score || 0)
      })
    }
    return map
  }

  /**
   * Calculate advanced priority using comprehensive curriculum analysis
   */
  calculateAdvancedPriority(tense, userLevel, masteryMap) {
    let priority = 50

    // 1. Curriculum-based complexity weighting
    const complexityBonus = tense.complexity * 5

    // 2. Introduction level appropriateness  
    const isNewAtLevel = tense.introducedAt === userLevel
    const levelAppropriateBonus = isNewAtLevel ? 30 : 10

    // 3. Pedagogical family importance
    const familyBonuses = {
      'subjunctive_present': 25, // Critical for B1
      'perfect_system': 20,      // Important for B1
      'past_narrative': 15,      // Important for A2
      'subjunctive_past': 30,    // Critical for B2
      'conditional_system': 15   
    }
    const familyBonus = familyBonuses[tense.family] || 0

    // 4. Prerequisite chain length (more dependencies = higher priority)
    const prereqChain = this.curriculumData.prerequisiteChains[tense.key] || []
    const prereqBonus = prereqChain.length * 3

    // 5. Current mastery adjustment
    const currentMastery = masteryMap.get(tense.key) || 0
    const masteryAdjustment = Math.max(0, 100 - currentMastery) * 0.2

    priority = complexityBonus + levelAppropriateBonus + familyBonus + prereqBonus + masteryAdjustment

    return Math.round(priority)
  }

  /**
   * Assess readiness for a tense based on prerequisites
   */
  assessReadiness(tense, masteryMap) {
    const prereqChain = this.curriculumData.prerequisiteChains[tense.key] || []
    
    if (prereqChain.length === 0) return 1.0 // No prerequisites, fully ready

    // Calculate average mastery of prerequisites
    let totalMastery = 0
    let validPrereqs = 0

    prereqChain.forEach(prereqKey => {
      const mastery = masteryMap.get(prereqKey)
      if (mastery !== undefined) {
        totalMastery += mastery
        validPrereqs++
      }
    })

    if (validPrereqs === 0) return 0.5 // No data, moderate readiness

    const avgPrereqMastery = totalMastery / validPrereqs
    return Math.min(1.0, avgPrereqMastery / 75) // 75% mastery = full readiness
  }

  /**
   * Calculate urgency based on curriculum position and user level
   */
  calculateUrgency(tense, userLevel, masteryMap) {
    let urgency = 50

    // 1. Level-critical tenses get higher urgency
    const levelCritical = {
      'B1': ['subjunctive|subjPres', 'indicative|pretPerf'],
      'B2': ['subjunctive|subjImpf'],
      'A2': ['indicative|pretIndef', 'indicative|impf']
    }
    
    const criticalTenses = levelCritical[userLevel] || []
    if (criticalTenses.includes(tense.key)) {
      urgency += 30
    }

    // 2. Family completion urgency (complete families faster)
    const familyTenses = this.curriculumData.tenseFamilies[tense.family] || []
    const familyMastery = familyTenses.map(ft => masteryMap.get(ft.key) || 0)
    const avgFamilyMastery = familyMastery.length > 0 ? 
      familyMastery.reduce((sum, m) => sum + m, 0) / familyMastery.length : 0

    if (avgFamilyMastery > 40 && avgFamilyMastery < 80) {
      urgency += 15 // Push to complete partially learned families
    }

    // 3. Current mastery level urgency
    const currentMastery = masteryMap.get(tense.key) || 0
    if (currentMastery > 30 && currentMastery < 70) {
      urgency += 10 // Prioritize partially learned tenses
    }

    return Math.min(100, urgency)
  }

  /**
   * Calculate pedagogical value based on curriculum analysis
   */
  calculatePedagogicalValue(tense, userLevel) {
    let value = 50

    // 1. Complexity appropriateness for level
    const levelComplexityRanges = {
      'A1': [1, 3], 'A2': [2, 4], 'B1': [4, 7], 
      'B2': [6, 8], 'C1': [7, 9], 'C2': [8, 9]
    }
    
    const [minComp, maxComp] = levelComplexityRanges[userLevel] || [1, 9]
    const complexityFit = tense.complexity >= minComp && tense.complexity <= maxComp
    if (complexityFit) value += 20

    // 2. Foundation value (some tenses are particularly foundational)
    const foundationalTenses = {
      'indicative|pres': 30,
      'subjunctive|subjPres': 25,
      'indicative|pretIndef': 20,
      'indicative|pretPerf': 20
    }
    value += foundationalTenses[tense.key] || 0

    // 3. Family completeness value
    const familySizes = {
      'perfect_system': 15,        // Large family
      'subjunctive_present': 12,   // Important family
      'subjunctive_past': 15,      // Complex family
      'conditional_system': 10     // Moderate family
    }
    value += familySizes[tense.family] || 5

    return value
  }

  /**
   * Check if a tense is prerequisite for current level
   */
  isPrerequisiteForLevel(tenseKey, userLevel) {
    const levelTenses = this.curriculumData.levelOrder[userLevel] || []
    
    return levelTenses.some(levelTense => {
      const prereqChain = this.curriculumData.prerequisiteChains[levelTense.key] || []
      return prereqChain.includes(tenseKey)
    })
  }

  /**
   * Calculate review priority with curriculum intelligence
   */
  calculateReviewPriority(tense, userLevel, mastery) {
    let priority = 30 // Base review priority

    // Higher priority for prerequisites
    if (this.isPrerequisiteForLevel(tense.key, userLevel)) {
      priority += 40
    }

    // Priority based on mastery gap
    const masteryGap = Math.max(0, 75 - mastery)
    priority += masteryGap * 0.3

    // Family consolidation priority
    const familySizes = {
      'perfect_system': 10,
      'subjunctive_present': 15,
      'past_narrative': 12
    }
    priority += familySizes[tense.family] || 0

    return Math.round(priority)
  }

  /**
   * Assess exploration readiness for advanced tenses
   */
  assessExplorationReadiness(tense, userLevel, masteryMap) {
    // Base readiness from prerequisites
    let readiness = this.assessReadiness(tense, masteryMap)

    // Level gap penalty (exploring too far ahead is risky)
    const levelIndex = this.levelHierarchy.indexOf(userLevel)
    const tenseLevel = this.levelHierarchy.indexOf(tense.introducedAt)
    const levelGap = tenseLevel - levelIndex

    if (levelGap > 1) {
      readiness *= 0.5 // Heavy penalty for jumping levels
    }

    // Complexity readiness (user level vs tense complexity)
    const levelComplexityMax = {
      'A1': 3, 'A2': 4, 'B1': 7, 'B2': 8, 'C1': 9, 'C2': 9
    }
    
    const maxComplexity = levelComplexityMax[userLevel] || 5
    if (tense.complexity > maxComplexity + 1) {
      readiness *= 0.7 // Penalty for excessive complexity
    }

    return Math.min(1.0, readiness)
  }

  /**
   * Calculate exploration priority
   */
  calculateExplorationPriority(tense, readiness) {
    let priority = 20 // Base exploration priority

    // Readiness bonus
    priority += readiness * 30

    // Complexity adjustment (moderate complexity preferred for exploration)
    if (tense.complexity >= 5 && tense.complexity <= 7) {
      priority += 10 // Sweet spot for exploration
    }

    return Math.round(priority)
  }

  // ===== NEW CURRICULUM-DRIVEN CATEGORIES =====

  /**
   * Get prerequisite gaps - tenses that are prerequisites but not yet mastered
   */
  getPrerequisiteGaps(userLevel, userProgress = null) {
    const masteryMap = this.createMasteryMap(userProgress)
    const levelTenses = this.curriculumData.levelOrder[userLevel] || []
    const gaps = new Set()

    // Find all prerequisites for current level tenses
    levelTenses.forEach(tense => {
      const prereqChain = this.curriculumData.prerequisiteChains[tense.key] || []
      prereqChain.forEach(prereqKey => {
        const mastery = masteryMap.get(prereqKey) || 0
        if (mastery < 70) { // Not mastered
          gaps.add({
            key: prereqKey,
            mood: prereqKey.split('|')[0],
            tense: prereqKey.split('|')[1],
            mastery,
            urgency: 100 - mastery, // Lower mastery = higher urgency
            requiredFor: tense.key,
            priority: 90 + (70 - mastery) // High base priority + mastery gap
          })
        }
      })
    })

    return Array.from(gaps).sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get tense family groups with completion analysis
   */
  getTenseFamilyGroups(userLevel, userProgress = null) {
    const masteryMap = this.createMasteryMap(userProgress)
    const levelTenses = this.curriculumData.levelOrder[userLevel] || []
    const groups = {}

    // Group tenses by family for current level
    levelTenses.forEach(tense => {
      const family = tense.family
      if (!groups[family]) {
        groups[family] = {
          name: family,
          tenses: [],
          avgMastery: 0,
          completionStatus: 'not_started',
          priority: 0,
          readiness: 0
        }
      }
      groups[family].tenses.push({
        ...tense,
        mastery: masteryMap.get(tense.key) || 0
      })
    })

    // Calculate group statistics
    Object.values(groups).forEach(group => {
      const masteries = group.tenses.map(t => t.mastery)
      group.avgMastery = masteries.reduce((sum, m) => sum + m, 0) / masteries.length
      
      const mastered = masteries.filter(m => m >= 75).length
      const total = masteries.length
      
      if (mastered === total) group.completionStatus = 'completed'
      else if (mastered > 0) group.completionStatus = 'in_progress'
      else if (group.avgMastery > 30) group.completionStatus = 'started'
      else group.completionStatus = 'not_started'

      // Priority based on partial completion (prioritize completing started families)
      if (group.completionStatus === 'in_progress') {
        group.priority = 80 + group.avgMastery * 0.2
      } else if (group.completionStatus === 'started') {
        group.priority = 70 + group.avgMastery * 0.3
      } else {
        group.priority = 60
      }

      // Readiness based on prerequisites of family tenses
      const readinesses = group.tenses.map(t => this.assessReadiness(t, masteryMap))
      group.readiness = readinesses.reduce((sum, r) => sum + r, 0) / readinesses.length
    })

    return groups
  }

  /**
   * Get optimal progression path for the user's current level
   */
  getProgressionPath(userLevel, userProgress = null) {
    const masteryMap = this.createMasteryMap(userProgress)
    const levelProgression = this.curriculumData.levelOrder[userLevel] || []
    
    // Filter to tenses that are ready to learn (prerequisites met)
    const readyTenses = levelProgression.filter(tense => {
      const readiness = this.assessReadiness(tense, masteryMap)
      const mastery = masteryMap.get(tense.key) || 0
      return readiness >= 0.7 && mastery < 80 // Ready and not mastered
    })

    // Sort by optimal learning order
    return readyTenses
      .map(tense => ({
        ...tense,
        mastery: masteryMap.get(tense.key) || 0,
        readiness: this.assessReadiness(tense, masteryMap),
        learningPriority: this.calculateLearningPriority(tense, masteryMap)
      }))
      .sort((a, b) => {
        // 1. Readiness first (must have prerequisites)
        if (a.readiness !== b.readiness) return b.readiness - a.readiness
        // 2. Family grouping (learn families together) 
        if (a.family !== b.family) return this.compareFamilyPriority(a.family, b.family)
        // 3. Complexity order within family
        if (a.complexity !== b.complexity) return a.complexity - b.complexity
        // 4. Learning priority
        return b.learningPriority - a.learningPriority
      })
      .slice(0, 8) // Limit to top 8 tenses in progression path
  }

  /**
   * Calculate learning priority for progression path
   */
  calculateLearningPriority(tense, masteryMap) {
    let priority = 50

    // Foundation tenses get higher priority
    const foundationBonus = {
      'indicative|pres': 30,
      'subjunctive|subjPres': 25,
      'indicative|pretPerf': 20,
      'indicative|pretIndef': 15
    }
    priority += foundationBonus[tense.key] || 0

    // Current mastery adjustment (prioritize partially learned)
    const mastery = masteryMap.get(tense.key) || 0
    if (mastery > 20 && mastery < 60) {
      priority += 15 // Push to complete partially learned
    }

    // Family completion bonus
    const familyTenses = this.curriculumData.tenseFamilies[tense.family] || []
    const familyMasteries = familyTenses.map(ft => masteryMap.get(ft.key) || 0)
    const familyAvg = familyMasteries.reduce((sum, m) => sum + m, 0) / familyMasteries.length

    if (familyAvg > 30 && familyAvg < 70) {
      priority += 10 // Complete partially learned families
    }

    return priority
  }

  /**
   * Compare family priority for sorting
   */
  compareFamilyPriority(familyA, familyB) {
    const familyOrder = [
      'basic_present', 'nonfinite_basics', 'past_narrative', 
      'perfect_system', 'subjunctive_present', 'conditional_system',
      'command_forms', 'subjunctive_past'
    ]
    
    const indexA = familyOrder.indexOf(familyA)
    const indexB = familyOrder.indexOf(familyB)
    
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }
    
    return familyA.localeCompare(familyB)
  }

  /**
   * Calculate dynamic weights based on user progress
   */
  calculateDynamicWeights(userLevel, userProgress = null) {
    const baseWeights = LEVEL_PRIORITY_WEIGHTS[userLevel] || LEVEL_PRIORITY_WEIGHTS.B1
    
    if (!userProgress || userProgress.length === 0) {
      return {} // No adjustments without progress data
    }

    const masteryMap = this.createMasteryMap(userProgress)
    const adjustments = {}

    // Calculate overall mastery level
    const masteries = Array.from(masteryMap.values())
    const avgMastery = masteries.reduce((sum, m) => sum + m, 0) / masteries.length

    // Adjust consolidation need based on performance
    if (avgMastery < 40) {
      adjustments.consolidation = Math.min(0.9, baseWeights.consolidation + 0.2)
      adjustments.core = Math.max(0.1, baseWeights.core - 0.1)
    } else if (avgMastery > 80) {
      adjustments.exploration = Math.min(0.4, baseWeights.exploration + 0.1)
      adjustments.review = Math.max(0.1, baseWeights.review - 0.1)
    }

    // Family completion adjustments
    const familyGroups = this.getTenseFamilyGroups(userLevel, userProgress)
    const inProgressFamilies = Object.values(familyGroups).filter(g => g.completionStatus === 'in_progress').length

    if (inProgressFamilies > 2) {
      adjustments.familyFocus = 0.15 // Boost family completion
      adjustments.exploration = Math.max(0.0, (baseWeights.exploration || 0.1) - 0.1)
    }

    return adjustments
  }

  /**
   * Apply advanced progress adjustments using comprehensive curriculum data
   */
  applyAdvancedProgressAdjustments(categorized, userProgress, userLevel) {
    const masteryMap = this.createMasteryMap(userProgress)

    const adjustCategory = (tenses, categoryType) => {
      return tenses.map(tense => {
        const key = `${tense.mood}|${tense.tense}`
        const mastery = masteryMap.get(key) || 0

        let adjustedPriority = tense.priority || 50

        // Curriculum-driven adjustments
        switch (categoryType) {
          case 'core':
            // Boost unmastered core tenses significantly
            if (mastery < 50) adjustedPriority *= 1.8
            else if (mastery < 75) adjustedPriority *= 1.4
            else adjustedPriority *= 0.7
            break
            
          case 'review':
            // Focus on prerequisite gaps
            if (tense.isPrerequisite && mastery < 70) adjustedPriority *= 2.0
            else if (mastery < 60) adjustedPriority *= 1.3
            else if (mastery > 85) adjustedPriority *= 0.5
            break
            
          case 'exploration':
            // Only if prerequisites are solid
            if (tense.readiness < 0.6) adjustedPriority *= 0.3
            else if (tense.readiness > 0.8) adjustedPriority *= 1.2
            break
        }

        // Family completion bonus
        const family = tense.family || 'independent'
        const familyGroup = categorized.familyGroups[family]
        if (familyGroup && familyGroup.completionStatus === 'in_progress') {
          adjustedPriority *= 1.3 // Boost partially completed families
        }

        return {
          ...tense,
          originalPriority: tense.priority,
          adjustedPriority: Math.round(adjustedPriority),
          mastery,
          adjustmentReason: this.getAdjustmentReason(mastery, categoryType, tense)
        }
      })
    }

    return {
      core: adjustCategory(categorized.core, 'core'),
      review: adjustCategory(categorized.review, 'review'), 
      exploration: adjustCategory(categorized.exploration, 'exploration'),
      prerequisites: categorized.prerequisites, // Already prioritized
      familyGroups: categorized.familyGroups,   // Already calculated
      progression: categorized.progression      // Already optimized
    }
  }

  /**
   * Get human-readable adjustment reason
   */
  getAdjustmentReason(mastery, category, tense) {
    if (mastery < 30) return 'struggling_area'
    if (mastery < 60) return 'developing_skill'
    if (mastery > 85) return 'well_mastered'
    if (category === 'review' && tense.isPrerequisite) return 'prerequisite_gap'
    if (category === 'exploration' && tense.readiness > 0.8) return 'ready_for_challenge'
    return 'standard_priority'
  }

  /**
   * Get advanced weighted selection using comprehensive curriculum analysis
   * @param {Array} forms - Available forms to choose from
   * @param {string} userLevel - User's CEFR level  
   * @param {Object} userProgress - User's progress data
   * @returns {Array} Intelligently weighted forms array
   */
  getWeightedSelection(forms, userLevel, userProgress = null) {
    const prioritizedTenses = this.getPrioritizedTenses(userLevel, userProgress)
    const weights = prioritizedTenses.weights
    
    console.log(`🧠 Advanced curriculum weighting for ${userLevel}:`, {
      totalForms: forms.length,
      coreCount: prioritizedTenses.core.length,
      prerequisiteGaps: prioritizedTenses.prerequisites.length,
      familyGroups: Object.keys(prioritizedTenses.familyGroups).length,
      progressionPath: prioritizedTenses.progression.length
    })

    // Enhanced categorization with curriculum intelligence
    const categorizedForms = {
      prerequisiteGaps: [],  // Forms that fill prerequisite gaps (highest priority)
      coreReady: [],         // Core forms that are ready to learn
      coreNotReady: [],      // Core forms that need prerequisites  
      familyCompletion: [],  // Forms that complete partially learned families
      review: [],            // Review forms with mastery adjustments
      progression: [],       // Forms in optimal progression path
      exploration: [],       // Exploration forms with readiness check
      other: []              // Everything else
    }

    // Create lookup maps for efficient categorization
    const prereqGapKeys = new Set(prioritizedTenses.prerequisites.map(p => p.key))
    const coreKeys = new Map(prioritizedTenses.core.map(c => [c.key, c]))
    const reviewKeys = new Map(prioritizedTenses.review.map(r => [r.key, r]))
    const explorationKeys = new Map(prioritizedTenses.exploration.map(e => [e.key, e]))
    const progressionKeys = new Set(prioritizedTenses.progression.map(p => p.key))
    
    // Get family completion targets
    const familyCompletionKeys = new Set()
    Object.values(prioritizedTenses.familyGroups).forEach(group => {
      if (group.completionStatus === 'in_progress') {
        group.tenses.filter(t => t.mastery < 75).forEach(t => {
          familyCompletionKeys.add(t.key)
        })
      }
    })

    // Categorize each form using comprehensive analysis
    forms.forEach(form => {
      const key = `${form.mood}|${form.tense}`
      
      // Priority 1: Prerequisite gaps (highest priority)
      if (prereqGapKeys.has(key)) {
        categorizedForms.prerequisiteGaps.push(form)
        return
      }

      // Priority 2: Family completion
      if (familyCompletionKeys.has(key)) {
        categorizedForms.familyCompletion.push(form)
        return
      }

      // Priority 3: Core forms (check readiness)
      const coreData = coreKeys.get(key)
      if (coreData) {
        if (coreData.readiness >= 0.7) {
          categorizedForms.coreReady.push(form)
        } else {
          categorizedForms.coreNotReady.push(form)
        }
        return
      }

      // Priority 4: Progression path
      if (progressionKeys.has(key)) {
        categorizedForms.progression.push(form)
        return
      }

      // Priority 5: Review forms
      if (reviewKeys.has(key)) {
        categorizedForms.review.push(form)
        return
      }

      // Priority 6: Exploration (if ready)
      const explorationData = explorationKeys.get(key)
      if (explorationData && explorationData.readiness >= 0.4) {
        categorizedForms.exploration.push(form)
        return
      }

      // Everything else
      categorizedForms.other.push(form)
    })

    // Create weighted selection with curriculum-driven multipliers
    const weightedForms = []
    
    const addCurriculumWeightedForms = (forms, baseWeight, multiplier, category) => {
      if (forms.length === 0) return
      
      const totalRepetitions = Math.max(1, Math.round(forms.length * baseWeight * multiplier))
      const repetitionsPerForm = Math.max(1, Math.round(totalRepetitions / forms.length))
      
      for (let i = 0; i < repetitionsPerForm; i++) {
        weightedForms.push(...forms)
      }
      
      console.log(`  📊 ${category}: ${forms.length} forms × ${repetitionsPerForm} = ${forms.length * repetitionsPerForm} weighted forms`)
    }

    // Apply sophisticated weighting based on curriculum priorities
    addCurriculumWeightedForms(categorizedForms.prerequisiteGaps, 1.0, 6, 'prerequisite_gaps')     // Highest priority
    addCurriculumWeightedForms(categorizedForms.familyCompletion, weights.core, 4, 'family_completion')
    addCurriculumWeightedForms(categorizedForms.coreReady, weights.core, 3, 'core_ready')
    addCurriculumWeightedForms(categorizedForms.progression, weights.core, 3, 'progression_path')
    addCurriculumWeightedForms(categorizedForms.review, weights.review, 2, 'review')
    addCurriculumWeightedForms(categorizedForms.coreNotReady, weights.core, 1, 'core_not_ready')    // Lower priority until ready
    addCurriculumWeightedForms(categorizedForms.exploration, weights.exploration, 1, 'exploration')
    addCurriculumWeightedForms(categorizedForms.other, 0.05, 1, 'other')                           // Minimal weight

    // Apply consolidation weighting if needed
    if (weights.consolidation > 0.7) {
      // High consolidation need - boost review and reduce exploration  
      const consolidationBoost = Math.round(categorizedForms.review.length * weights.consolidation)
      for (let i = 0; i < consolidationBoost; i++) {
        weightedForms.push(...categorizedForms.review)
      }
      console.log(`  🔄 Consolidation boost: +${consolidationBoost * categorizedForms.review.length} review forms`)
    }

    console.log(`⚖️  Enhanced weighted selection for ${userLevel}:`, {
      totalWeighted: weightedForms.length,
      originalForms: forms.length,
      weightingRatio: Math.round(weightedForms.length / forms.length * 10) / 10,
      categories: {
        prerequisiteGaps: categorizedForms.prerequisiteGaps.length,
        familyCompletion: categorizedForms.familyCompletion.length,
        coreReady: categorizedForms.coreReady.length,
        progression: categorizedForms.progression.length,
        review: categorizedForms.review.length,
        exploration: categorizedForms.exploration.length,
        other: categorizedForms.other.length
      }
    })

    return weightedForms.length > 0 ? weightedForms : forms // Fallback to original forms if weighting fails
  }

  /**
   * Remove duplicate tenses from an array
   */
  removeDuplicateTenses(tenses) {
    const seen = new Set()
    return tenses.filter(tense => {
      const key = `${tense.mood}|${tense.tense}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Get next recommended tense for a user based on their level and progress
   */
  getNextRecommendedTense(userLevel, userProgress = null) {
    const prioritized = this.getPrioritizedTenses(userLevel, userProgress)
    
    // Use adjusted priorities if user progress is available
    const categories = prioritized.adjusted || prioritized
    
    // Try core tenses first
    if (categories.core && categories.core.length > 0) {
      return categories.core[0] // Highest priority core tense
    }
    
    // Fallback to review tenses
    if (categories.review && categories.review.length > 0) {
      return categories.review[0]
    }
    
    // Last resort: exploration
    if (categories.exploration && categories.exploration.length > 0) {
      return categories.exploration[0]
    }
    
    return null
  }

  /**
   * Comprehensive debug method with full curriculum analysis
   */
  debugPrioritization(userLevel, userProgress = null) {
    const prioritized = this.getPrioritizedTenses(userLevel, userProgress)
    const levelData = this.curriculumData.levelOrder[userLevel] || []
    
    console.log(`\n📚 === ENHANCED LEVEL ${userLevel} CURRICULUM DEBUG ===`)
    
    // 1. Level Overview
    console.log(`\n🎯 LEVEL OVERVIEW:`)
    console.log(`  Total tenses in level: ${levelData.length}`)
    console.log(`  Core (new): ${prioritized.core.length}`)
    console.log(`  Review (previous): ${prioritized.review.length}`)
    console.log(`  Exploration (next): ${prioritized.exploration.length}`)
    console.log(`  Prerequisite gaps: ${prioritized.prerequisites.length}`)
    console.log(`  Tense families: ${Object.keys(prioritized.familyGroups).length}`)
    console.log(`  Progression path: ${prioritized.progression.length}`)
    
    // 2. Core Tenses with Enhanced Analysis
    console.log(`\n🆕 CORE TENSES (New for ${userLevel}):`)
    prioritized.core.slice(0, 5).forEach(t => {
      const readiness = Math.round(t.readiness * 100)
      const urgency = Math.round(t.urgency)
      console.log(`  • ${t.mood}/${t.tense}`)
      console.log(`    Priority: ${t.priority} | Readiness: ${readiness}% | Urgency: ${urgency} | Family: ${t.family}`)
      console.log(`    Complexity: ${t.complexity} | Pedagogical Value: ${t.pedagogicalValue || 'N/A'}`)
    })
    
    // 3. Prerequisite Gaps
    if (prioritized.prerequisites.length > 0) {
      console.log(`\n⚠️  PREREQUISITE GAPS (Must master first):`)
      prioritized.prerequisites.slice(0, 3).forEach(gap => {
        console.log(`  • ${gap.mood}/${gap.tense}`)
        console.log(`    Current mastery: ${gap.mastery}% | Required for: ${gap.requiredFor} | Urgency: ${gap.urgency}`)
      })
    }
    
    // 4. Family Analysis
    console.log(`\n👨‍👩‍👧‍👦 TENSE FAMILIES:`)
    Object.entries(prioritized.familyGroups).forEach(([family, group]) => {
      const statusEmoji = {
        'completed': '✅',
        'in_progress': '🔄', 
        'started': '🟡',
        'not_started': '⚪'
      }
      console.log(`  ${statusEmoji[group.completionStatus]} ${family}: ${Math.round(group.avgMastery)}% avg mastery (${group.tenses.length} tenses)`)
      if (group.completionStatus === 'in_progress') {
        const remaining = group.tenses.filter(t => t.mastery < 75)
        console.log(`    Still need: ${remaining.map(t => `${t.mood}/${t.tense}`).join(', ')}`)
      }
    })
    
    // 5. Optimal Progression Path
    console.log(`\n🛤️  OPTIMAL PROGRESSION PATH:`)
    prioritized.progression.slice(0, 5).forEach((tense, i) => {
      const readiness = Math.round(tense.readiness * 100)
      console.log(`  ${i + 1}. ${tense.mood}/${tense.tense} (${readiness}% ready, ${tense.mastery}% mastered)`)
    })
    
    // 6. Review Priorities  
    if (prioritized.review.length > 0) {
      console.log(`\n📚 REVIEW PRIORITIES:`)
      prioritized.review.slice(0, 5).forEach(t => {
        const prereqIcon = t.isPrerequisite ? '🔗' : '📖'
        console.log(`  ${prereqIcon} ${t.mood}/${t.tense} (${t.originalLevel}) - Priority: ${t.priority}`)
        if (t.isPrerequisite) {
          console.log(`    ⚡ Prerequisite for current level!`)
        }
      })
    }
    
    // 7. Dynamic Weights
    console.log(`\n⚖️  DYNAMIC WEIGHTS:`)
    Object.entries(prioritized.weights).forEach(([category, weight]) => {
      const percentage = Math.round(weight * 100)
      console.log(`  ${category}: ${percentage}%`)
    })
    
    // 8. Curriculum Insights
    console.log(`\n🧠 CURRICULUM INSIGHTS:`)
    const masteryMap = this.createMasteryMap(userProgress)
    const totalMasteries = Array.from(masteryMap.values())
    const avgMastery = totalMasteries.length > 0 ? 
      totalMasteries.reduce((sum, m) => sum + m, 0) / totalMasteries.length : 0
    
    console.log(`  Overall mastery: ${Math.round(avgMastery)}%`)
    console.log(`  Learning stage: ${this.determineLearningStage(avgMastery, prioritized)}`)
    console.log(`  Recommended focus: ${this.getRecommendedFocus(prioritized, userLevel)}`)
    
    // 9. Next Recommendations
    const nextRec = this.getNextRecommendedTense(userLevel, userProgress)
    if (nextRec) {
      console.log(`\n🎯 NEXT RECOMMENDED:`)
      console.log(`  ${nextRec.mood}/${nextRec.tense}`)
      console.log(`  Reason: ${this.getRecommendationReason(nextRec, prioritized)}`)
    }
    
    console.log(`\n=== END ENHANCED DEBUG ===\n`)
  }

  /**
   * Determine learning stage based on mastery and priorities
   */
  determineLearningStage(avgMastery, prioritized) {
    if (avgMastery < 30) return 'foundation_building'
    if (avgMastery < 60) return 'skill_development'
    if (avgMastery < 80) return 'competency_building'
    return 'mastery_refinement'
  }

  /**
   * Get recommended focus based on prioritization analysis
   */
  getRecommendedFocus(prioritized, userLevel) {
    if (prioritized.prerequisites.length > 2) return 'prerequisite_gaps'
    
    const inProgressFamilies = Object.values(prioritized.familyGroups)
      .filter(g => g.completionStatus === 'in_progress').length
    
    if (inProgressFamilies > 2) return 'family_completion'
    if (prioritized.core.length > 0) return 'core_learning'
    if (prioritized.progression.length > 3) return 'systematic_progression'
    return 'comprehensive_review'
  }

  /**
   * Get human-readable recommendation reason
   */
  getRecommendationReason(tense, prioritized) {
    const key = `${tense.mood}|${tense.tense}`
    
    if (prioritized.prerequisites.some(p => p.key === key)) {
      return 'prerequisite_gap'
    }
    
    const coreData = prioritized.core.find(c => c.key === key)
    if (coreData && coreData.readiness >= 0.8) {
      return 'core_skill_ready'
    }
    
    const familyGroup = Object.values(prioritized.familyGroups).find(g => 
      g.tenses.some(t => t.key === key) && g.completionStatus === 'in_progress'
    )
    if (familyGroup) {
      return 'family_completion'
    }
    
    return 'curriculum_progression'
  }
}

// Singleton instance for global use
export const levelPrioritizer = new LevelDrivenPrioritizer()

/**
 * Level-specific verb pool management for enhanced variety
 */
const ENHANCED_LEVEL_VERB_POOLS = {
  A1: {
    priority: ['ser', 'estar', 'tener', 'hacer', 'ir', 'venir', 'hablar', 'comer', 'vivir', 'dar'],
    frequency_boost: ['ser', 'estar', 'tener', 'hacer'],
    max_irregular_ratio: 0.4,
    complexity_cap: 3
  },
  A2: {
    priority: ['poder', 'querer', 'decir', 'ver', 'saber', 'conocer', 'poner', 'salir', 'llegar'],
    frequency_boost: ['poder', 'querer', 'decir'],
    max_irregular_ratio: 0.5,
    complexity_cap: 4
  },
  B1: {
    priority: ['parecer', 'seguir', 'sentir', 'creer', 'recordar', 'olvidar', 'preocupar', 'conseguir'],
    frequency_boost: ['haber', 'parecer'],
    max_irregular_ratio: 0.6,
    complexity_cap: 7
  },
  B2: {
    priority: ['lograr', 'evitar', 'sugerir', 'proponer', 'convencer', 'manifestar', 'expresar'],
    frequency_boost: ['resultar', 'implicar'],
    max_irregular_ratio: 0.7,
    complexity_cap: 8
  },
  C1: {
    priority: ['evidenciar', 'demostrar', 'constatar', 'corroborar', 'refutar', 'suscitar'],
    frequency_boost: ['concernir', 'atañer'],
    max_irregular_ratio: 0.8,
    complexity_cap: 9
  },
  C2: {
    priority: ['concernir', 'atañer', 'incumbir', 'yacer', 'asir', 'raer', 'roer', 'abolir'],
    frequency_boost: ['yacer', 'asir', 'raer'],
    max_irregular_ratio: 1.0,
    complexity_cap: 10
  }
}

/**
 * Apply level-specific verb filtering and prioritization
 */
function applyLevelVerbFiltering(forms, levelConfig) {
  const filtered = []
  const verbCounts = new Map()
  
  // Count verbs and apply priorities
  forms.forEach(form => {
    verbCounts.set(form.lemma, (verbCounts.get(form.lemma) || 0) + 1)
  })
  
  forms.forEach(form => {
    let weight = 1
    
    // Priority verb boosting
    if (levelConfig.priority.includes(form.lemma)) {
      weight *= 2
    }
    
    // High-frequency verb boosting
    if (levelConfig.frequency_boost.includes(form.lemma)) {
      weight *= 1.5
    }
    
    // Add multiple copies based on weight
    for (let i = 0; i < Math.ceil(weight); i++) {
      filtered.push(form)
    }
  })
  
  return filtered
}

/**
 * Apply tense family balancing for variety
 */
function applyTenseVarietyBalancing(forms, level) {
  const familyGroups = new Map()
  
  // Group by tense family
  forms.forEach(form => {
    const family = getTenseFamily(form.mood, form.tense)
    if (!familyGroups.has(family)) {
      familyGroups.set(family, [])
    }
    familyGroups.get(family).push(form)
  })
  
  // Balance representation from each family
  const balanced = []
  const maxFromFamily = Math.max(5, Math.floor(forms.length / Math.max(1, familyGroups.size)))
  
  familyGroups.forEach((familyForms, family) => {
    // Shuffle and take up to maxFromFamily
    const shuffled = familyForms.sort(() => Math.random() - 0.5)
    balanced.push(...shuffled.slice(0, maxFromFamily))
  })
  
  return balanced
}

/**
 * Apply progressive difficulty weighting within sessions
 */
function applyProgressiveDifficultyWeighting(forms, level, sessionHistory) {
  if (!sessionHistory || sessionHistory.selectionCount < 5) {
    // Early session - prefer easier forms
    return forms.filter(form => {
      const complexity = getFormComplexity(form, level)
      const levelBase = getLevelBaseComplexity(level)
      return complexity <= levelBase + 1 // Stay within level + 1
    })
  }
  
  // Later session - allow more complex forms
  const boosted = []
  const sessionDifficulty = Math.min(3, Math.floor(sessionHistory.selectionCount / 10))
  
  forms.forEach(form => {
    const complexity = getFormComplexity(form, level)
    const levelBase = getLevelBaseComplexity(level)
    const targetComplexity = levelBase + sessionDifficulty
    
    let weight = 1
    if (Math.abs(complexity - targetComplexity) <= 1) {
      weight = 2 // Prefer forms near target complexity
    } else if (complexity < targetComplexity - 1) {
      weight = 1.5 // Slightly boost easier forms
    }
    
    for (let i = 0; i < weight; i++) {
      boosted.push(form)
    }
  })
  
  return boosted
}

/**
 * Apply semantic category rotation for verb variety
 */
function applySemanticCategoryRotation(forms, level) {
  // This would integrate with the semantic categories from advancedVarietyEngine
  // For now, return forms as-is but this is where verb semantic balancing would occur
  return forms
}

/**
 * Helper functions
 */
function getTenseFamily(mood, tense) {
  const families = {
    'present': ['indicative|pres'],
    'past': ['indicative|pretIndef', 'indicative|impf'],
    'future': ['indicative|fut', 'conditional|cond'],
    'perfect': ['indicative|pretPerf', 'indicative|plusc', 'indicative|futPerf'],
    'subjunctive_pres': ['subjunctive|subjPres', 'subjunctive|subjPerf'],
    'subjunctive_past': ['subjunctive|subjImpf', 'subjunctive|subjPlusc'],
    'commands': ['imperative|impAff', 'imperative|impNeg'],
    'nonfinite': ['nonfinite|ger', 'nonfinite|part']
  }
  
  const tenseKey = `${mood}|${tense}`
  for (const [family, tenses] of Object.entries(families)) {
    if (tenses.includes(tenseKey)) return family
  }
  return 'other'
}

function getFormComplexity(form, level) {
  const complexityScores = {
    'indicative|pres': 1,
    'nonfinite|ger': 2,
    'nonfinite|part': 2,
    'indicative|pretIndef': 3,
    'indicative|impf': 3,
    'indicative|fut': 3,
    'imperative|impAff': 4,
    'indicative|pretPerf': 5,
    'conditional|cond': 5,
    'subjunctive|subjPres': 7,
    'subjunctive|subjImpf': 8
  }
  return complexityScores[`${form.mood}|${form.tense}`] || 5
}

function getLevelBaseComplexity(level) {
  const baseComplexity = {
    'A1': 1.5, 'A2': 3.0, 'B1': 5.0, 'B2': 7.0, 'C1': 8.0, 'C2': 9.0
  }
  return baseComplexity[level] || 5.0
}

// Convenience functions for easy access
export function getPrioritizedTensesForLevel(level, userProgress = null) {
  return levelPrioritizer.getPrioritizedTenses(level, userProgress)
}

export function getWeightedFormsSelection(forms, level, userProgress = null) {
  return levelPrioritizer.getWeightedSelection(forms, level, userProgress)  
}

/**
 * Enhanced mixed practice selection with sophisticated variety algorithms
 */
export function getEnhancedMixedPracticeSelection(forms, level, sessionHistory = null) {
  if (!forms || forms.length === 0) return []
  
  console.log(`🎯 Enhanced mixed practice selection for ${level}:`, forms.length, 'forms')
  
  const levelConfig = ENHANCED_LEVEL_VERB_POOLS[level] || ENHANCED_LEVEL_VERB_POOLS.B1
  
  // Apply level-specific verb filtering
  const levelFilteredForms = applyLevelVerbFiltering(forms, levelConfig)
  
  // Apply tense variety balancing
  const varietyBalancedForms = applyTenseVarietyBalancing(levelFilteredForms, level)
  
  // Apply progressive difficulty weighting
  const difficultyWeightedForms = applyProgressiveDifficultyWeighting(varietyBalancedForms, level, sessionHistory)
  
  // Apply semantic category rotation
  const semanticBalancedForms = applySemanticCategoryRotation(difficultyWeightedForms, level)
  
  console.log(`🎯 Enhanced selection pipeline: ${forms.length} → ${levelFilteredForms.length} → ${varietyBalancedForms.length} → ${difficultyWeightedForms.length} → ${semanticBalancedForms.length}`)
  
  return semanticBalancedForms
}

export function debugLevelPrioritization(level, userProgress = null) {
  return levelPrioritizer.debugPrioritization(level, userProgress)
}