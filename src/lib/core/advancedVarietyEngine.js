// Advanced Variety Engine for Enhanced Mixed Practice
// Implements sophisticated anti-repetition and variety algorithms

// Advanced Variety Engine - does not currently use verbs import directly

/**
 * Session Memory for Anti-Repetition
 * Tracks recently used selections to ensure variety
 */
class SessionMemory {
  constructor() {
    this.recentVerbs = new Map() // verb -> timestamp
    this.recentTenses = new Map() // tense -> count
    this.recentPersons = new Map() // person -> count
    this.recentCategories = new Map() // semantic category -> count
    this.sessionStartTime = Date.now()
    this.selectionCount = 0
    this.lastDifficultyLevel = 1
    
    // Sliding window sizes
    this.verbMemorySize = 8   // Remember last 8 verbs
    this.tenseMemorySize = 6  // Remember last 6 tenses
    this.personMemorySize = 5 // Remember last 5 persons
    this.categoryMemorySize = 4 // Remember last 4 categories
  }

  // Record a selection
  recordSelection(form, semanticCategory) {
    this.selectionCount++
    const now = Date.now()
    
    // Record verb with timestamp
    this.recentVerbs.set(form.lemma, now)
    
    // Record tense with count
    const tenseKey = `${form.mood}|${form.tense}`
    this.recentTenses.set(tenseKey, (this.recentTenses.get(tenseKey) || 0) + 1)
    
    // Record person with count
    this.recentPersons.set(form.person, (this.recentPersons.get(form.person) || 0) + 1)
    
    // Record semantic category
    if (semanticCategory) {
      this.recentCategories.set(semanticCategory, (this.recentCategories.get(semanticCategory) || 0) + 1)
    }
    
    // Clean old entries
    this.cleanup()
  }

  // Clean old entries from memory
  cleanup() {
    const now = Date.now()
    const verbTimeout = 30000 // 30 seconds for verb repetition avoidance
    
    // Clean old verbs
    for (const [verb, timestamp] of this.recentVerbs.entries()) {
      if (now - timestamp > verbTimeout) {
        this.recentVerbs.delete(verb)
      }
    }
    
    // Keep only recent tenses (sliding window)
    if (this.recentTenses.size > this.tenseMemorySize) {
      const entries = Array.from(this.recentTenses.entries())
      entries.sort((a, b) => b[1] - a[1]) // Sort by count desc
      this.recentTenses.clear()
      entries.slice(0, this.tenseMemorySize).forEach(([key, count]) => {
        this.recentTenses.set(key, count)
      })
    }
    
    // Clean persons and categories similarly
    this.cleanupMap(this.recentPersons, this.personMemorySize)
    this.cleanupMap(this.recentCategories, this.categoryMemorySize)
  }

  cleanupMap(map, maxSize) {
    if (map.size > maxSize) {
      const entries = Array.from(map.entries())
      entries.sort((a, b) => b[1] - a[1])
      map.clear()
      entries.slice(0, maxSize).forEach(([key, count]) => {
        map.set(key, count)
      })
    }
  }

  // Calculate anti-repetition penalty (0-1, where 1 = heavily penalize)
  getRepetitionPenalty(form, semanticCategory) {
    let penalty = 0
    
    // Verb repetition penalty
    if (this.recentVerbs.has(form.lemma)) {
      const age = Date.now() - this.recentVerbs.get(form.lemma)
      penalty += Math.max(0, 0.8 - (age / 30000)) // Decay over 30 seconds
    }
    
    // Tense repetition penalty
    const tenseKey = `${form.mood}|${form.tense}`
    const tenseCount = this.recentTenses.get(tenseKey) || 0
    if (tenseCount > 0) {
      penalty += Math.min(0.6, tenseCount * 0.2) // Up to 0.6 penalty
    }
    
    // Person repetition penalty
    const personCount = this.recentPersons.get(form.person) || 0
    if (personCount > 0) {
      penalty += Math.min(0.4, personCount * 0.15) // Up to 0.4 penalty
    }
    
    // Category repetition penalty
    if (semanticCategory) {
      const categoryCount = this.recentCategories.get(semanticCategory) || 0
      if (categoryCount > 0) {
        penalty += Math.min(0.3, categoryCount * 0.1) // Up to 0.3 penalty
      }
    }
    
    return Math.min(1, penalty) // Cap at 1.0
  }

  // Get current session difficulty level (1-5, increases over time)
  getCurrentDifficultyLevel() {
    // Progressive difficulty: start at 1, gradually increase
    const baseLevel = Math.min(5, 1 + Math.floor(this.selectionCount / 10))
    
    // Add some randomness to avoid predictability
    const variance = Math.random() * 0.5 - 0.25 // ±0.25
    
    this.lastDifficultyLevel = Math.max(1, Math.min(5, baseLevel + variance))
    return this.lastDifficultyLevel
  }

  // Reset for new session
  reset() {
    this.recentVerbs.clear()
    this.recentTenses.clear()
    this.recentPersons.clear()
    this.recentCategories.clear()
    this.sessionStartTime = Date.now()
    this.selectionCount = 0
    this.lastDifficultyLevel = 1
  }
}

/**
 * Verb Semantic Categorization
 * Categorizes verbs by meaning for variety
 */
const VERB_SEMANTIC_CATEGORIES = {
  // High-frequency basics (A1-A2)
  'basic_actions': ['ser', 'estar', 'tener', 'hacer', 'ir', 'venir', 'dar', 'ver', 'hablar', 'comer', 'vivir'],
  
  // Movement and travel
  'movement': ['ir', 'venir', 'llegar', 'salir', 'entrar', 'subir', 'bajar', 'correr', 'caminar', 'viajar', 'volver'],
  
  // Communication
  'communication': ['hablar', 'decir', 'contar', 'preguntar', 'responder', 'explicar', 'gritar', 'llamar', 'escuchar'],
  
  // Emotions and feelings
  'emotions': ['amar', 'querer', 'odiar', 'gustar', 'sentir', 'emocionar', 'alegrar', 'entristecer', 'preocupar'],
  
  // Cognitive actions
  'mental': ['pensar', 'creer', 'saber', 'conocer', 'recordar', 'olvidar', 'entender', 'comprender', 'estudiar'],
  
  // Physical actions
  'physical': ['comer', 'beber', 'dormir', 'trabajar', 'jugar', 'cortar', 'construir', 'limpiar', 'cocinar'],
  
  // States and conditions
  'states': ['estar', 'ser', 'parecer', 'resultar', 'quedar', 'permanecer', 'continuar', 'seguir'],
  
  // Possession and exchange
  'possession': ['tener', 'dar', 'recibir', 'comprar', 'vender', 'prestar', 'devolver', 'conseguir'],
  
  // Irregular high-frequency (special attention)
  'irregular_common': ['ser', 'estar', 'tener', 'hacer', 'ir', 'poder', 'querer', 'decir', 'ver', 'dar'],
  
  // Advanced/literary (C1-C2)
  'advanced': ['concernir', 'atañer', 'yacer', 'asir', 'raer', 'roer', 'soler', 'abolir']
}

// Reverse mapping: verb -> categories
const VERB_TO_CATEGORIES = new Map()
Object.entries(VERB_SEMANTIC_CATEGORIES).forEach(([category, verbList]) => {
  verbList.forEach(verb => {
    if (!VERB_TO_CATEGORIES.has(verb)) {
      VERB_TO_CATEGORIES.set(verb, [])
    }
    VERB_TO_CATEGORIES.get(verb).push(category)
  })
})

/**
 * Level-specific verb frequency rankings
 */
const LEVEL_VERB_PRIORITIES = {
  A1: {
    'essential': ['ser', 'estar', 'tener', 'hacer', 'ir', 'hablar', 'comer', 'vivir', 'dar', 'ver'],
    'important': ['querer', 'poder', 'venir', 'decir', 'llamar', 'trabajar', 'estudiar', 'gustar'],
    'supplementary': ['salir', 'entrar', 'llegar', 'beber', 'dormir', 'jugar']
  },
  
  A2: {
    'essential': ['ser', 'estar', 'tener', 'hacer', 'ir', 'poder', 'querer', 'decir', 'ver', 'dar'],
    'important': ['venir', 'salir', 'llegar', 'poner', 'saber', 'conocer', 'pensar', 'encontrar'],
    'supplementary': ['seguir', 'llevar', 'traer', 'pasar', 'quedar', 'contar', 'preguntar']
  },
  
  B1: {
    'essential': ['ser', 'estar', 'haber', 'tener', 'hacer', 'poder', 'decir', 'ir', 'ver', 'dar'],
    'important': ['querer', 'venir', 'poner', 'saber', 'conocer', 'seguir', 'parecer', 'sentir'],
    'supplementary': ['creer', 'recordar', 'olvidar', 'preocupar', 'intentar', 'conseguir', 'permitir']
  },
  
  B2: {
    'essential': ['ser', 'estar', 'haber', 'hacer', 'poder', 'deber', 'querer', 'parecer', 'resultar'],
    'important': ['conseguir', 'lograr', 'intentar', 'evitar', 'sugerir', 'proponer', 'convencer'],
    'supplementary': ['manifestar', 'expresar', 'comunicar', 'transmitir', 'plantear', 'resolver']
  },
  
  C1: {
    'essential': ['ser', 'estar', 'resultar', 'suponer', 'implicar', 'conllevar', 'plantear'],
    'important': ['manifestar', 'evidenciar', 'demostrar', 'constatar', 'corroborar', 'refutar'],
    'supplementary': ['concernir', 'atañer', 'incumbir', 'suscitar', 'desencadenar', 'propiciar']
  },
  
  C2: {
    'essential': ['ser', 'estar', 'resultar', 'constituir', 'representar', 'significar'],
    'important': ['concernir', 'atañer', 'incumbir', 'suscitar', 'desencadenar', 'propiciar'],
    'supplementary': ['yacer', 'asir', 'raer', 'roer', 'abolir', 'balbucir', 'garantir']
  }
}

/**
 * Advanced Tense Family Rotation
 */
const TENSE_FAMILIES = {
  'present_basics': ['indicative|pres'],
  'past_narrative': ['indicative|pretIndef', 'indicative|impf'],
  'future_planning': ['indicative|fut', 'conditional|cond'],
  'perfect_system': ['indicative|pretPerf', 'indicative|plusc', 'indicative|futPerf', 'conditional|condPerf', 'subjunctive|subjPerf', 'subjunctive|subjPlusc'],
  'subjunctive_present': ['subjunctive|subjPres'],
  'subjunctive_past': ['subjunctive|subjImpf'],
  'commands': ['imperative|impAff', 'imperative|impNeg'],
  'nonfinite': ['nonfinite|ger', 'nonfinite|part'],
  'conditional_system': ['conditional|cond']
}

// Reverse mapping: tense -> family
const TENSE_TO_FAMILY = new Map()
Object.entries(TENSE_FAMILIES).forEach(([family, tenseList]) => {
  tenseList.forEach(tense => {
    TENSE_TO_FAMILY.set(tense, family)
  })
})

/**
 * Main Advanced Variety Engine
 */
export class AdvancedVarietyEngine {
  constructor() {
    this.sessionMemory = new SessionMemory()
    this.tenseRotationIndex = 0
    this.verbCategoryRotationIndex = 0
    this.lastSelectedFamily = null
  }

  /**
   * Enhanced form selection with sophisticated variety algorithms
   */
  selectVariedForm(eligibleForms, level, practiceMode, history = {}) {
    if (eligibleForms.length === 0) return null
    
    // For non-mixed practice, use simpler selection
    if (practiceMode !== 'mixed') {
      return this.selectBasicForm(eligibleForms, history)
    }
    
    // For mixed practice, apply full variety algorithms
    return this.selectMixedPracticeForm(eligibleForms, level, history)
  }

  /**
   * Basic form selection (for specific practice modes) - ENHANCED for better variety
   */
  selectBasicForm(forms, history) {
    // ENHANCED: Apply stronger variety algorithms even for basic selection
    console.log('🔄 BASIC SELECTION - Enhancing variety algorithms')
    
    // Group forms by lemma to ensure verb variety
    const verbGroups = new Map()
    forms.forEach(form => {
      if (!verbGroups.has(form.lemma)) {
        verbGroups.set(form.lemma, [])
      }
      verbGroups.get(form.lemma).push(form)
    })
    
    console.log(`🔄 VARIETY DEBUG - ${verbGroups.size} different verbs available:`, Array.from(verbGroups.keys()).slice(0, 10))
    
    const scoredForms = forms.map(form => {
      const accuracyScore = this.getAccuracyScore(form, history)
      const repetitionPenalty = this.sessionMemory.getRepetitionPenalty(form)
      
      // ENHANCED: Strong verb variety bonus
      const recentVerbUse = this.sessionMemory.recentVerbs.has(form.lemma)
      const verbVarietyBonus = recentVerbUse ? 0 : 0.5
      
      // ENHANCED: Person variety bonus
      const personVarietyBonus = this.getPersonVarietyBonus(form.person)
      
      const varietyScore = (1 - repetitionPenalty) + verbVarietyBonus + personVarietyBonus
      
      return {
        form,
        score: accuracyScore * 0.4 + varietyScore * 0.6 // More emphasis on variety
      }
    })
    
    // Select from top candidates with enhanced randomization
    scoredForms.sort((a, b) => b.score - a.score) // Higher score = higher priority
    const topCandidates = scoredForms.slice(0, Math.min(8, Math.ceil(forms.length * 0.4)))
    
    console.log('🔄 TOP CANDIDATES:', topCandidates.slice(0, 5).map(c => `${c.form.lemma}(${c.score.toFixed(2)})`))
    
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)].form
    
    // Record selection
    const category = this.getVerbSemanticCategory(selected.lemma)
    this.sessionMemory.recordSelection(selected, category)
    
    console.log('🔄 SELECTED:', `${selected.lemma} - ${selected.mood}/${selected.tense} - ${selected.person}`)
    
    return selected
  }
  
  /**
   * Get person variety bonus to encourage different pronouns
   */
  getPersonVarietyBonus(person) {
    const recentPersonCount = this.sessionMemory.recentPersons.get(person) || 0
    if (recentPersonCount === 0) return 0.3 // Bonus for unused persons
    if (recentPersonCount === 1) return 0.1 // Small bonus for lightly used
    return -0.2 // Penalty for overused persons
  }

  /**
   * Advanced mixed practice form selection
   */
  selectMixedPracticeForm(forms, level, history) {
    const currentDifficulty = this.sessionMemory.getCurrentDifficultyLevel()
    
    // Score all forms using multiple criteria
    const scoredForms = forms.map(form => {
      const scores = this.calculateAdvancedScores(form, level, history, currentDifficulty)
      
      return {
        form,
        scores,
        totalScore: this.calculateTotalScore(scores, level)
      }
    })
    
    // Apply tense family rotation preference
    const preferredForms = this.applyTenseFamilyRotation(scoredForms)
    
    // Apply verb category balancing
    const balancedForms = this.applyVerbCategoryBalancing(preferredForms)
    
    // Select using weighted random selection
    const selected = this.weightedRandomSelection(balancedForms)
    
    // Record selection and update rotation indices
    const category = this.getVerbSemanticCategory(selected.lemma)
    this.sessionMemory.recordSelection(selected, category)
    this.updateRotationIndices(selected)
    
    return selected
  }

  /**
   * Calculate comprehensive scores for a form
   */
  calculateAdvancedScores(form, level, history, currentDifficulty) {
    const tenseKey = `${form.mood}|${form.tense}`
    const category = this.getVerbSemanticCategory(form.lemma)
    
    return {
      // Accuracy-based priority (lower accuracy = higher priority)
      accuracy: this.getAccuracyScore(form, history),
      
      // Level appropriateness (curriculum-based)
      levelFit: this.getLevelFitnessScore(form, level),
      
      // Difficulty progression (gradual increase)
      difficultyMatch: this.getDifficultyMatchScore(form, level, currentDifficulty),
      
      // Variety promotion (anti-repetition)
      variety: 1 - this.sessionMemory.getRepetitionPenalty(form, category),
      
      // Verb frequency priority (per level)
      verbPriority: this.getVerbPriorityScore(form.lemma, level),
      
      // Tense family balance
      tenseFamilyBalance: this.getTenseFamilyBalanceScore(tenseKey),
      
      // Semantic category diversity
      semanticDiversity: this.getSemanticDiversityScore(category)
    }
  }

  /**
   * Calculate total weighted score
   */
  calculateTotalScore(scores, level) {
    // Level-specific weight preferences
    const weights = this.getScoreWeights(level)
    
    return (
      scores.accuracy * weights.accuracy +
      scores.levelFit * weights.levelFit +
      scores.difficultyMatch * weights.difficultyMatch +
      scores.variety * weights.variety +
      scores.verbPriority * weights.verbPriority +
      scores.tenseFamilyBalance * weights.tenseFamilyBalance +
      scores.semanticDiversity * weights.semanticDiversity
    )
  }

  /**
   * Level-specific scoring weights
   */
  getScoreWeights(level) {
    const baseWeights = {
      accuracy: 0.25,
      levelFit: 0.15,
      difficultyMatch: 0.10,
      variety: 0.20,
      verbPriority: 0.15,
      tenseFamilyBalance: 0.10,
      semanticDiversity: 0.05
    }
    
    switch (level) {
      case 'A1':
        return { ...baseWeights, verbPriority: 0.25, variety: 0.15, levelFit: 0.20 }
      case 'A2':
        return { ...baseWeights, tenseFamilyBalance: 0.15, difficultyMatch: 0.15 }
      case 'B1':
        return { ...baseWeights, accuracy: 0.20, variety: 0.25, tenseFamilyBalance: 0.15 }
      case 'B2':
        return { ...baseWeights, variety: 0.25, semanticDiversity: 0.10 }
      case 'C1':
      case 'C2':
        return { ...baseWeights, variety: 0.30, semanticDiversity: 0.15, accuracy: 0.15 }
      default:
        return baseWeights
    }
  }

  /**
   * Apply tense family rotation to promote variety
   */
  applyTenseFamilyRotation(scoredForms) {
    const familyGroups = new Map()
    
    // Group forms by tense family
    scoredForms.forEach(item => {
      const tenseKey = `${item.form.mood}|${item.form.tense}`
      const family = TENSE_TO_FAMILY.get(tenseKey) || 'other'
      
      if (!familyGroups.has(family)) {
        familyGroups.set(family, [])
      }
      familyGroups.get(family).push(item)
    })
    
    // Apply rotation preference
    const families = Array.from(familyGroups.keys())
    if (families.length > 1 && this.lastSelectedFamily) {
      // Boost forms from different families
      familyGroups.forEach((items, family) => {
        if (family !== this.lastSelectedFamily) {
          items.forEach(item => {
            item.scores.tenseFamilyBalance = Math.min(1, item.scores.tenseFamilyBalance * 1.3)
          })
        }
      })
    }
    
    return scoredForms
  }

  /**
   * Apply verb category balancing for semantic variety
   */
  applyVerbCategoryBalancing(scoredForms) {
    const categoryGroups = new Map()
    
    // Group forms by semantic category
    scoredForms.forEach(item => {
      const category = this.getVerbSemanticCategory(item.form.lemma)
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, [])
      }
      categoryGroups.get(category).push(item)
    })
    
    // Boost underrepresented categories
    const categories = Array.from(categoryGroups.keys())
    if (categories.length > 1) {
      const recentCategories = Array.from(this.sessionMemory.recentCategories.keys())
      
      categoryGroups.forEach((items, category) => {
        if (!recentCategories.includes(category)) {
          items.forEach(item => {
            item.scores.semanticDiversity = Math.min(1, item.scores.semanticDiversity * 1.4)
          })
        }
      })
    }
    
    return scoredForms
  }

  /**
   * Weighted random selection from scored forms
   */
  weightedRandomSelection(scoredForms) {
    // Normalize scores and convert to selection weights (higher score = higher probability)
    const maxScore = Math.max(...scoredForms.map(item => item.totalScore))
    const minScore = Math.min(...scoredForms.map(item => item.totalScore))
    const scoreRange = maxScore - minScore || 1
    
    const weights = scoredForms.map(item => {
      const normalizedScore = (item.totalScore - minScore) / scoreRange
      return Math.pow(normalizedScore + 0.1, 2) // Quadratic weighting with minimum
    })
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let randomValue = Math.random() * totalWeight
    
    for (let i = 0; i < scoredForms.length; i++) {
      randomValue -= weights[i]
      if (randomValue <= 0) {
        return scoredForms[i].form
      }
    }
    
    // Fallback
    return scoredForms[0].form
  }

  /**
   * Update rotation indices after selection
   */
  updateRotationIndices(selectedForm) {
    const tenseKey = `${selectedForm.mood}|${selectedForm.tense}`
    this.lastSelectedFamily = TENSE_TO_FAMILY.get(tenseKey)
    
    this.tenseRotationIndex = (this.tenseRotationIndex + 1) % Object.keys(TENSE_FAMILIES).length
    this.verbCategoryRotationIndex = (this.verbCategoryRotationIndex + 1) % Object.keys(VERB_SEMANTIC_CATEGORIES).length
  }

  /**
   * Helper scoring functions
   */
  getAccuracyScore(form, history) {
    const key = `${form.mood}:${form.tense}:${form.person}:${form.value}`
    const h = history[key] || { seen: 0, correct: 0 }
    return (h.correct + 1) / (h.seen + 2) // Inverse accuracy (lower = higher priority)
  }

  getLevelFitnessScore(form, level) {
    const tenseKey = `${form.mood}|${form.tense}`
    
    // Use curriculum data to determine fitness
    const introductionLevel = this.getCurriculumIntroductionLevel(tenseKey)
    // const complexity = this.getCurriculumComplexity(tenseKey) // Future use for complexity scoring
    
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(level)
    const introOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(introductionLevel)
    
    if (introOrder <= levelOrder) {
      // Appropriate or easier content
      return Math.max(0.3, 1 - ((levelOrder - introOrder) * 0.1))
    } else {
      // Too advanced content
      return Math.max(0.1, 0.5 - ((introOrder - levelOrder) * 0.2))
    }
  }

  getDifficultyMatchScore(form, level, currentDifficulty) {
    const tenseComplexity = this.getCurriculumComplexity(`${form.mood}|${form.tense}`)
    const levelBaseComplexity = this.getLevelBaseComplexity(level)
    
    const targetComplexity = levelBaseComplexity + (currentDifficulty - 1) * 0.5
    const complexityDiff = Math.abs(tenseComplexity - targetComplexity)
    
    return Math.max(0.1, 1 - (complexityDiff / 5))
  }

  getVerbPriorityScore(lemma, level) {
    const priorities = LEVEL_VERB_PRIORITIES[level] || LEVEL_VERB_PRIORITIES['B1']
    
    if (priorities.essential.includes(lemma)) return 1.0
    if (priorities.important.includes(lemma)) return 0.7
    if (priorities.supplementary.includes(lemma)) return 0.4
    
    return 0.2 // Unknown verbs get low priority
  }

  getTenseFamilyBalanceScore(tenseKey) {
    const family = TENSE_TO_FAMILY.get(tenseKey)
    if (!family) return 0.5
    
    // Promote less recently used families
    const recentTenses = Array.from(this.sessionMemory.recentTenses.keys())
    const recentFamilies = recentTenses.map(t => TENSE_TO_FAMILY.get(t)).filter(f => f)
    
    const familyCount = recentFamilies.filter(f => f === family).length
    let score = Math.max(0.1, 1 - (familyCount * 0.2))
    
    // COMPOUND COOLDOWN: Additional penalty for perfect_system (compound tenses)
    if (family === 'perfect_system') {
      // Check if any compound tenses were used recently
      const compoundTenses = ['indicative|pretPerf', 'indicative|plusc', 'indicative|futPerf', 'conditional|condPerf', 'subjunctive|subjPerf', 'subjunctive|subjPlusc']
      const recentCompoundCount = recentTenses.filter(t => compoundTenses.includes(t)).length
      
      if (recentCompoundCount > 0) {
        // Apply stronger penalty for compound tenses to avoid monotony
        const compoundPenalty = Math.min(0.8, recentCompoundCount * 0.25) // Up to 80% penalty
        score = Math.max(0.05, score - compoundPenalty) // Minimum 5% chance
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 COMPOUND COOLDOWN - Recent compounds: ${recentCompoundCount}, penalty: ${(compoundPenalty * 100).toFixed(1)}%, final score: ${(score * 100).toFixed(1)}%`)
        }
      }
    }
    
    return score
  }

  getSemanticDiversityScore(category) {
    if (!category) return 0.5
    
    const categoryCount = this.sessionMemory.recentCategories.get(category) || 0
    return Math.max(0.1, 1 - (categoryCount * 0.15))
  }

  /**
   * Helper utility functions
   */
  getVerbSemanticCategory(lemma) {
    const categories = VERB_TO_CATEGORIES.get(lemma)
    return categories ? categories[0] : 'other' // Return primary category
  }

  getCurriculumIntroductionLevel(tenseKey) {
    const introLevels = {
      'indicative|pres': 'A1',
      'nonfinite|part': 'A1',
      'nonfinite|ger': 'A1',
      'indicative|pretIndef': 'A2',
      'indicative|impf': 'A2',
      'indicative|fut': 'A2',
      'imperative|impAff': 'A2',
      'indicative|pretPerf': 'B1',
      'subjunctive|subjPres': 'B1',
      'conditional|cond': 'B1',
      'subjunctive|subjImpf': 'B2',
      'conditional|condPerf': 'B2'
    }
    return introLevels[tenseKey] || 'B2'
  }

  getCurriculumComplexity(tenseKey) {
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
      'subjunctive|subjImpf': 8,
      'conditional|condPerf': 8
    }
    return complexityScores[tenseKey] || 5
  }

  getLevelBaseComplexity(level) {
    const baseComplexity = {
      'A1': 1.5,
      'A2': 3.0,
      'B1': 5.0,
      'B2': 7.0,
      'C1': 8.0,
      'C2': 9.0
    }
    return baseComplexity[level] || 5.0
  }

  /**
   * Reset session memory (for new sessions)
   */
  resetSession() {
    this.sessionMemory.reset()
    this.tenseRotationIndex = 0
    this.verbCategoryRotationIndex = 0
    this.lastSelectedFamily = null
  }

  /**
   * Get session statistics for debugging
   */
  getSessionStats() {
    return {
      selectionsCount: this.sessionMemory.selectionCount,
      currentDifficulty: this.sessionMemory.getCurrentDifficultyLevel(),
      recentVerbs: Array.from(this.sessionMemory.recentVerbs.keys()),
      recentTenses: Array.from(this.sessionMemory.recentTenses.keys()),
      recentCategories: Array.from(this.sessionMemory.recentCategories.keys()),
      lastFamily: this.lastSelectedFamily
    }
  }
}

// Export singleton instance
export const varietyEngine = new AdvancedVarietyEngine()