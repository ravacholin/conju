// Level Assessment Engine
// Determines user level through placement test and continuous evaluation

import { getCurrentUserProfile } from './userLevelProfile.js'

// Strategic assessment questions based on curriculum.json progression
export const PLACEMENT_TEST_QUESTIONS = [
  // A1 Level Tests - Basic present tense
  {
    targetLevel: 'A1',
    verb: 'ser',
    mood: 'indicative',
    tense: 'pres',
    person: '3s',
    expectedAnswer: 'es',
    difficulty: 1,
    prompt: 'Él _____ médico.'
  },
  {
    targetLevel: 'A1',
    verb: 'estar',
    mood: 'indicative',
    tense: 'pres',
    person: '1s',
    expectedAnswer: 'estoy',
    difficulty: 1,
    prompt: 'Yo _____ en casa.'
  },
  {
    targetLevel: 'A1',
    verb: 'tener',
    mood: 'indicative',
    tense: 'pres',
    person: '2s_tu',
    expectedAnswer: 'tienes',
    difficulty: 1,
    prompt: 'Tú _____ hambre.'
  },

  // A2 Level Tests - Past tenses and basic irregulars
  {
    targetLevel: 'A2',
    verb: 'hacer',
    mood: 'indicative',
    tense: 'pretIndef',
    person: '3s',
    expectedAnswer: 'hizo',
    difficulty: 2,
    prompt: 'Ella _____ la tarea ayer.'
  },
  {
    targetLevel: 'A2',
    verb: 'ir',
    mood: 'indicative',
    tense: 'impf',
    person: '1p',
    expectedAnswer: 'íbamos',
    difficulty: 2,
    prompt: 'Nosotros _____ al parque cada día.'
  },
  {
    targetLevel: 'A2',
    verb: 'hablar',
    mood: 'imperative',
    tense: 'impAff',
    person: '2s_tu',
    expectedAnswer: 'habla',
    difficulty: 2,
    prompt: '_____ más despacio, por favor.'
  },

  // B1 Level Tests - Subjunctive and compound tenses
  {
    targetLevel: 'B1',
    verb: 'poder',
    mood: 'indicative',
    tense: 'pretPerf',
    person: '2s_tu',
    expectedAnswer: 'has podido',
    difficulty: 3,
    prompt: '¿_____ terminar el proyecto?'
  },
  {
    targetLevel: 'B1',
    verb: 'querer',
    mood: 'subjunctive',
    tense: 'subjPres',
    person: '3s',
    expectedAnswer: 'quiera',
    difficulty: 3,
    prompt: 'Espero que él _____ venir.'
  },
  {
    targetLevel: 'B1',
    verb: 'vivir',
    mood: 'conditional',
    tense: 'cond',
    person: '1s',
    expectedAnswer: 'viviría',
    difficulty: 3,
    prompt: 'Me _____ en París si pudiera.'
  },

  // B2 Level Tests - Complex subjunctives
  {
    targetLevel: 'B2',
    verb: 'decir',
    mood: 'subjunctive',
    tense: 'subjImpf',
    person: '3p',
    expectedAnswer: 'dijeran',
    difficulty: 4,
    prompt: 'No creía que ellos _____ la verdad.'
  },
  {
    targetLevel: 'B2',
    verb: 'haber',
    mood: 'subjunctive',
    tense: 'subjPlusc',
    person: '1s',
    expectedAnswer: 'hubiera tenido',
    difficulty: 4,
    prompt: 'Si _____ dinero, habría viajado.'
  },
  {
    targetLevel: 'B2',
    verb: 'comer',
    mood: 'conditional',
    tense: 'condPerf',
    person: '2s_tu',
    expectedAnswer: 'habrías comido',
    difficulty: 4,
    prompt: '_____ más si hubieras tenido tiempo.'
  },

  // C1 Level Tests - Advanced and rare forms
  {
    targetLevel: 'C1',
    verb: 'venir',
    mood: 'subjunctive',
    tense: 'subjFut',
    person: '3s',
    expectedAnswer: 'viniere',
    difficulty: 5,
    prompt: 'Cualquiera que _____ será bienvenido.'
  },
  {
    targetLevel: 'C1',
    verb: 'distinguir',
    mood: 'indicative',
    tense: 'pres',
    person: '1s',
    expectedAnswer: 'distingo',
    difficulty: 5,
    prompt: 'Yo _____ entre el bien y el mal.'
  },

  // C2 Level Tests - Very advanced/rare verbs
  {
    targetLevel: 'C2',
    verb: 'yacer',
    mood: 'indicative',
    tense: 'pres',
    person: '3s',
    expectedAnswer: 'yace',
    difficulty: 6,
    prompt: 'Aquí _____ un gran héroe.'
  }
]

export class LevelAssessment {
  constructor() {
    this.currentTest = null
    this.testResults = []
    this.isRunning = false
  }

  generatePlacementTest(questionCount = 15) {
    // Select diverse questions across levels
    const questionsPerLevel = Math.ceil(questionCount / 6)
    const selectedQuestions = []

    ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].forEach(level => {
      const levelQuestions = PLACEMENT_TEST_QUESTIONS.filter(q => q.targetLevel === level)
      const shuffled = levelQuestions.sort(() => Math.random() - 0.5)
      selectedQuestions.push(...shuffled.slice(0, questionsPerLevel))
    })

    // Shuffle final selection and trim to exact count
    return selectedQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, questionCount)
      .map((q, index) => ({ ...q, id: index + 1 }))
  }

  async startPlacementTest(questionCount = 15) {
    this.currentTest = {
      questions: this.generatePlacementTest(questionCount),
      currentIndex: 0,
      startTime: Date.now(),
      results: []
    }
    this.isRunning = true
    return this.currentTest
  }

  async submitAnswer(questionId, userAnswer) {
    if (!this.isRunning || !this.currentTest) {
      throw new Error('No active placement test')
    }

    const question = this.currentTest.questions[this.currentIndex]
    if (question.id !== questionId) {
      throw new Error('Question ID mismatch')
    }

    const isCorrect = this.normalizeAnswer(userAnswer) === this.normalizeAnswer(question.expectedAnswer)
    const responseTime = Date.now() - (this.currentTest.questionStartTime || Date.now())

    const result = {
      questionId,
      targetLevel: question.targetLevel,
      difficulty: question.difficulty,
      isCorrect,
      responseTime,
      userAnswer: userAnswer.trim(),
      expectedAnswer: question.expectedAnswer
    }

    this.currentTest.results.push(result)
    this.currentIndex++

    // Prepare next question
    if (this.currentIndex < this.currentTest.questions.length) {
      this.currentTest.questionStartTime = Date.now()
      return {
        completed: false,
        nextQuestion: this.currentTest.questions[this.currentIndex],
        progress: (this.currentIndex / this.currentTest.questions.length) * 100
      }
    } else {
      // Test completed
      return await this.completePlacementTest()
    }
  }

  async completePlacementTest() {
    if (!this.currentTest) {
      throw new Error('No active test to complete')
    }

    const analysis = this.analyzePlacementResults()
    const determinedLevel = this.determineLevelFromResults(analysis)

    // Save to user profile
    const profile = await getCurrentUserProfile()
    await profile.setLevel(determinedLevel, 'placement_test')

    this.isRunning = false
    const completedTest = {
      ...this.currentTest,
      completed: true,
      analysis,
      determinedLevel,
      completionTime: Date.now() - this.currentTest.startTime
    }

    this.testResults.push(completedTest)
    this.currentTest = null

    return completedTest
  }

  analyzePlacementResults() {
    const results = this.currentTest.results
    const analysis = {
      totalQuestions: results.length,
      totalCorrect: results.filter(r => r.isCorrect).length,
      overallAccuracy: 0,
      levelBreakdown: {},
      avgResponseTime: 0
    }

    analysis.overallAccuracy = analysis.totalCorrect / analysis.totalQuestions

    // Analyze by level
    ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].forEach(level => {
      const levelResults = results.filter(r => r.targetLevel === level)
      if (levelResults.length > 0) {
        analysis.levelBreakdown[level] = {
          total: levelResults.length,
          correct: levelResults.filter(r => r.isCorrect).length,
          accuracy: levelResults.filter(r => r.isCorrect).length / levelResults.length
        }
      }
    })

    analysis.avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length

    return analysis
  }

  determineLevelFromResults(analysis) {
    // Find highest level with 70%+ accuracy
    const levels = ['C2', 'C1', 'B2', 'B1', 'A2', 'A1']

    for (const level of levels) {
      const levelData = analysis.levelBreakdown[level]
      if (levelData && levelData.accuracy >= 0.70) {
        return level
      }
    }

    // Default to A1 if no level meets threshold
    return 'A1'
  }

  normalizeAnswer(answer) {
    return answer.toLowerCase().trim()
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
      .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
      .replace(/ü/g, 'u')
  }

  getCurrentQuestion() {
    if (!this.currentTest || !this.isRunning) return null
    return this.currentTest.questions[this.currentIndex]
  }

  getTestProgress() {
    if (!this.currentTest) return 0
    return (this.currentIndex / this.currentTest.questions.length) * 100
  }

  isTestActive() {
    return this.isRunning && this.currentTest !== null
  }

  abortTest() {
    this.isRunning = false
    this.currentTest = null
  }
}

// Continuous assessment based on practice performance
export class ContinuousAssessment {
  static async evaluateUserProgress() {
    const profile = await getCurrentUserProfile()
    const stats = profile.competencyStats

    if (Object.keys(stats).length === 0) {
      return { recommendation: 'no_data', confidence: 0 }
    }

    const currentLevel = profile.getCurrentLevel()
    const analysis = this.analyzeCompetencyStats(stats, currentLevel)

    return {
      currentLevel,
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
      readyForPromotion: analysis.readyForPromotion,
      suggestedActions: analysis.suggestedActions
    }
  }

  static analyzeCompetencyStats(stats, currentLevel) {
    const allStats = Object.values(stats)
    const overallAccuracy = allStats.reduce((sum, stat) => sum + stat.accuracy, 0) / allStats.length
    const totalAttempts = allStats.reduce((sum, stat) => sum + stat.attempts, 0)

    // Minimum data requirement
    if (totalAttempts < 50) {
      return {
        recommendation: 'more_practice',
        confidence: 0.3,
        readyForPromotion: false,
        suggestedActions: ['Continúa practicando para generar más datos']
      }
    }

    const promotionThreshold = 0.85
    const demotionThreshold = 0.60
    const confidenceThreshold = 100 // minimum attempts for high confidence

    const confidence = Math.min(totalAttempts / confidenceThreshold, 1.0)

    if (overallAccuracy >= promotionThreshold && totalAttempts >= confidenceThreshold) {
      return {
        recommendation: 'promote',
        confidence,
        readyForPromotion: true,
        suggestedActions: ['Listo para avanzar al siguiente nivel']
      }
    }

    if (overallAccuracy < demotionThreshold && totalAttempts >= confidenceThreshold) {
      return {
        recommendation: 'consider_demotion',
        confidence,
        readyForPromotion: false,
        suggestedActions: ['Considera practicar en un nivel más básico']
      }
    }

    return {
      recommendation: 'maintain',
      confidence,
      readyForPromotion: false,
      suggestedActions: ['Continúa practicando en tu nivel actual']
    }
  }
}

// Global assessment instance
let globalAssessment = null

export function getGlobalAssessment() {
  if (!globalAssessment) {
    globalAssessment = new LevelAssessment()
  }
  return globalAssessment
}

export async function runQuickAssessment() {
  const assessment = getGlobalAssessment()
  return await assessment.startPlacementTest(10) // Shorter test
}

export async function runFullAssessment() {
  const assessment = getGlobalAssessment()
  return await assessment.startPlacementTest(15) // Full test
}