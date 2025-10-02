// Level Assessment Engine
// Determines user level through placement test and continuous evaluation

import { getCurrentUserProfile } from './userLevelProfile.js'
import { verbs } from '../../data/verbs.js'
import { IRREGULAR_FAMILIES } from '../data/irregularFamilies.js'
import { buildFormsForRegion } from '../core/eligibility.js'

// Advanced question pool generator based on verbs database and curriculum
function generateAdvancedQuestionPool() {
  const questionPool = []
  const region = 'la_general' // Use neutral region for level testing

  // Level-based configurations with verb priorities and tenses
  const levelConfigs = {
    A1: {
      verbs: ['ser', 'estar', 'tener', 'haber', 'ir', 'venir', 'hablar', 'comer', 'vivir', 'trabajar', 'estudiar'],
      tenses: [
        { mood: 'indicative', tense: 'pres', difficulty: 1 }
      ],
      persons: ['1s', '2s_tu', '3s', '1p', '3p']
    },
    A2: {
      verbs: ['hacer', 'decir', 'poder', 'querer', 'poner', 'dar', 'saber', 'ver', 'salir', 'valer', 'hablar', 'comer', 'vivir'],
      tenses: [
        { mood: 'indicative', tense: 'pretIndef', difficulty: 2 },
        { mood: 'indicative', tense: 'impf', difficulty: 2 },
        { mood: 'indicative', tense: 'fut', difficulty: 2 },
        { mood: 'imperative', tense: 'impAff', difficulty: 2 }
      ],
      persons: ['1s', '2s_tu', '3s', '1p', '3p']
    },
    B1: {
      verbs: ['hacer', 'decir', 'poder', 'querer', 'poner', 'venir', 'tener', 'haber', 'conocer', 'producir', 'traducir', 'ofrecer'],
      tenses: [
        { mood: 'indicative', tense: 'pretPerf', difficulty: 3 },
        { mood: 'indicative', tense: 'plusc', difficulty: 3 },
        { mood: 'indicative', tense: 'futPerf', difficulty: 3 },
        { mood: 'subjunctive', tense: 'subjPres', difficulty: 3 },
        { mood: 'subjunctive', tense: 'subjPerf', difficulty: 3 },
        { mood: 'conditional', tense: 'cond', difficulty: 3 },
        { mood: 'imperative', tense: 'impNeg', difficulty: 3 }
      ],
      persons: ['1s', '2s_tu', '3s', '1p', '3p']
    },
    B2: {
      verbs: ['decir', 'hacer', 'haber', 'tener', 'venir', 'poner', 'saber', 'poder', 'traer', 'oír', 'caer', 'leer', 'creer'],
      tenses: [
        { mood: 'subjunctive', tense: 'subjImpf', difficulty: 4 },
        { mood: 'subjunctive', tense: 'subjPlusc', difficulty: 4 },
        { mood: 'conditional', tense: 'condPerf', difficulty: 4 }
      ],
      persons: ['1s', '2s_tu', '3s', '1p', '3p']
    },
    C1: {
      verbs: ['distinguir', 'conducir', 'traducir', 'producir', 'construir', 'destruir', 'huir', 'incluir', 'concluir', 'yacer'],
      tenses: [
        { mood: 'subjunctive', tense: 'subjFut', difficulty: 5 },
        { mood: 'subjunctive', tense: 'subjFutPerf', difficulty: 5 }
      ],
      persons: ['1s', '2s_tu', '3s', '1p', '3p']
    },
    C2: {
      verbs: ['yacer', 'abolir', 'balbucir', 'blandir', 'colorir', 'empedernir', 'argüir', 'erguir', 'aullar', 'gruñir'],
      tenses: [
        { mood: 'subjunctive', tense: 'subjFut', difficulty: 6 },
        { mood: 'subjunctive', tense: 'subjFutPerf', difficulty: 6 }
      ],
      persons: ['1s', '2s_tu', '3s', '1p', '3p']
    }
  }

  // Generate questions for each level
  Object.entries(levelConfigs).forEach(([level, config]) => {
    config.verbs.forEach(verbLemma => {
      // Find verb in database
      const verb = verbs.find(v => v.lemma === verbLemma)
      if (!verb) return

      config.tenses.forEach(tenseConfig => {
        config.persons.forEach(person => {
          // Find the form for this verb/tense/person combination
          const form = findVerbForm(verb, tenseConfig.mood, tenseConfig.tense, person, region)
          if (!form) return

          // Create question with contextual prompt
          const question = createQuestionFromForm(verb, form, tenseConfig, level, person)
          if (question) {
            questionPool.push(question)
          }
        })
      })
    })
  })

  // Add questions from irregular families for better coverage
  addIrregularFamilyQuestions(questionPool)

  // Filter out null questions and validate each question has required properties
  const validQuestions = questionPool.filter(q =>
    q &&
    q.id &&
    q.expectedAnswer &&
    q.prompt &&
    q.difficulty &&
    q.targetLevel
  )

  console.log(`Question pool generated: ${questionPool.length} total, ${validQuestions.length} valid`)
  return validQuestions
}

function findVerbForm(verb, mood, tense, person, region) {
  for (const paradigm of verb.paradigms) {
    if (paradigm.regionTags.includes(region)) {
      const form = paradigm.forms.find(f =>
        f.mood === mood && f.tense === tense && f.person === person
      )
      if (form) return form
    }
  }
  return null
}

function createQuestionFromForm(verb, form, tenseConfig, level, person) {
  // Generate contextual prompts based on verb, tense, and person
  const prompts = generateContextualPrompts(verb.lemma, form, person, tenseConfig.tense, tenseConfig.mood)
  if (prompts.length === 0) return null

  // Select random prompt
  const prompt = prompts[Math.floor(Math.random() * prompts.length)]

  return {
    id: `${verb.lemma}_${tenseConfig.mood}_${tenseConfig.tense}_${person}`,
    targetLevel: level,
    verb: verb.lemma,
    mood: tenseConfig.mood,
    tense: tenseConfig.tense,
    person: person,
    expectedAnswer: form.value,
    difficulty: tenseConfig.difficulty,
    prompt: prompt,
    verbType: verb.type,
    irregularityInfo: getIrregularityInfo(verb.lemma)
  }
}

function generateContextualPrompts(lemma, form, person, tense, mood) {
  const prompts = []

  // Context templates based on person and common verbs
  const templates = {
    '1s': {
      'ser': ['Yo ____ estudiante.', 'Yo ____ de Argentina.'],
      'estar': ['Yo ____ en casa.', 'Yo ____ muy cansado/a.'],
      'tener': ['Yo ____ hambre.', 'Yo ____ 25 años.'],
      'hablar': ['Yo ____ español.', 'Yo ____ con mi familia.'],
      'default': [`Yo ____ ${getContextForVerb(lemma)}.`]
    },
    '2s_tu': {
      'ser': ['Tú ____ muy inteligente.', '¿Tú ____ médico?'],
      'estar': ['Tú ____ en el trabajo.', '¿Tú ____ bien?'],
      'tener': ['Tú ____ razón.', '¿Tú ____ tiempo?'],
      'default': [`Tú ____ ${getContextForVerb(lemma)}.`]
    },
    '3s': {
      'ser': ['Él ____ profesor.', 'Ella ____ muy simpática.'],
      'estar': ['Él ____ en el parque.', 'Ella ____ estudiando.'],
      'haber': ['____ muchas personas aquí.', 'No ____ problemas.'],
      'default': [`Él/Ella ____ ${getContextForVerb(lemma)}.`]
    },
    '1p': {
      'ser': ['Nosotros ____ amigos.', 'Nosotras ____ estudiantes.'],
      'estar': ['Nosotros ____ listos.', 'Nosotras ____ aquí.'],
      'default': [`Nosotros ____ ${getContextForVerb(lemma)}.`]
    },
    '3p': {
      'ser': ['Ellos ____ hermanos.', 'Ellas ____ profesoras.'],
      'estar': ['Ellos ____ cansados.', 'Ellas ____ trabajando.'],
      'default': [`Ellos/Ellas ____ ${getContextForVerb(lemma)}.`]
    }
  }

  // Get appropriate templates
  const personTemplates = templates[person] || templates['3s']
  const verbTemplates = personTemplates[lemma] || personTemplates['default']

  return verbTemplates
}

function getContextForVerb(lemma) {
  const contexts = {
    'hablar': 'todos los días',
    'comer': 'en el restaurante',
    'vivir': 'en Madrid',
    'trabajar': 'mucho',
    'estudiar': 'medicina',
    'hacer': 'ejercicio',
    'decir': 'la verdad',
    'poder': 'ayudarte',
    'querer': 'viajar',
    'venir': 'mañana',
    'ir': 'al cine',
    'salir': 'temprano',
    'ver': 'televisión',
    'dar': 'un regalo',
    'saber': 'la respuesta',
    'conocer': 'bien la ciudad'
  }
  return contexts[lemma] || 'siempre'
}

function getIrregularityInfo(lemma) {
  for (const family of Object.values(IRREGULAR_FAMILIES)) {
    if (family.examples && family.examples.includes(lemma)) {
      return {
        family: family.id,
        pattern: family.pattern,
        description: family.description
      }
    }
  }
  return null
}

function addIrregularFamilyQuestions(questionPool) {
  // Add specific questions for irregular patterns to ensure good coverage
  const priorityIrregulars = [
    { family: 'DIPHT_E_IE', verbs: ['pensar', 'cerrar', 'empezar'], level: 'A2' },
    { family: 'DIPHT_O_UE', verbs: ['volver', 'poder', 'contar'], level: 'A2' },
    { family: 'E_I_IR', verbs: ['pedir', 'servir', 'repetir'], level: 'B1' },
    { family: 'STRONG_PRETERITE', verbs: ['poder', 'poner', 'saber', 'tener', 'venir'], level: 'B1' }
  ]

  priorityIrregulars.forEach(({ family, verbs: familyVerbs, level }) => {
    familyVerbs.forEach(verbLemma => {
      const verb = verbs.find(v => v.lemma === verbLemma)
      if (!verb) return

      // Add specific forms that test the irregularity
      const testForms = [
        { mood: 'indicative', tense: 'pres', person: '3s', difficulty: 2 },
        { mood: 'subjunctive', tense: 'subjPres', person: '1s', difficulty: 3 }
      ]

      testForms.forEach(formConfig => {
        const form = findVerbForm(verb, formConfig.mood, formConfig.tense, formConfig.person, 'la_general')
        if (form) {
          const question = createQuestionFromForm(verb, form, formConfig, level, formConfig.person)
          if (question) {
            question.id += '_irregular'
            question.irregularFocus = family
            questionPool.push(question)
          }
        }
      })
    })
  })
}

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
    this.questionPool = null

    // CAT algorithm parameters
    this.abilityEstimate = 0.0    // θ (theta) - current ability estimate
    this.standardError = 1.0      // SE of ability estimate
    this.minQuestions = 8         // Minimum questions before stopping
    this.maxQuestions = 20        // Maximum questions
    this.targetSE = 0.3          // Target standard error for stopping
    this.convergenceThreshold = 0.1 // Ability change threshold for convergence
  }

  // Initialize the advanced question pool
  initializeQuestionPool() {
    if (!this.questionPool) {
      this.questionPool = generateAdvancedQuestionPool()
      console.log(`Initialized question pool with ${this.questionPool.length} questions`)
    }
    return this.questionPool
  }

  // CAT Algorithm: Select optimal next item based on current ability estimate
  selectOptimalQuestion(availableQuestions) {
    if (availableQuestions.length === 0) return null

    // For first question, select medium difficulty
    if (!this.currentTest || this.currentTest.currentIndex === 0) {
      const mediumQuestions = availableQuestions.filter(q => q.difficulty >= 2 && q.difficulty <= 3)
      return mediumQuestions.length > 0
        ? mediumQuestions[Math.floor(Math.random() * mediumQuestions.length)]
        : availableQuestions[Math.floor(Math.random() * availableQuestions.length)]
    }

    // Calculate information function for each question
    let bestQuestion = null
    let maxInformation = -1

    availableQuestions.forEach(question => {
      const information = this.calculateItemInformation(question, this.abilityEstimate)
      if (information > maxInformation) {
        maxInformation = information
        bestQuestion = question
      }
    })

    return bestQuestion || availableQuestions[0]
  }

  // Calculate Fisher Information for an item at given ability level
  calculateItemInformation(question, theta) {
    // Convert difficulty level to IRT parameters
    const difficulty = this.difficultyToTheta(question.difficulty) // b parameter
    const discrimination = this.getDiscrimination(question) // a parameter
    const guessing = 0.0 // c parameter (no guessing for production tasks)

    // Calculate probability of correct response using 3PL model
    const probability = guessing + (1 - guessing) / (1 + Math.exp(-discrimination * (theta - difficulty)))

    // Fisher Information = a² * P * (1-P) / (1-c)² for 3PL model
    const information = Math.pow(discrimination, 2) * probability * (1 - probability) / Math.pow(1 - guessing, 2)

    return information
  }

  // Convert discrete difficulty (1-6) to continuous theta scale
  difficultyToTheta(difficulty) {
    // Map difficulty levels to theta scale (-3 to +3)
    const mapping = {
      1: -2.0,  // A1
      2: -1.0,  // A2
      3: 0.0,   // B1
      4: 1.0,   // B2
      5: 2.0,   // C1
      6: 3.0    // C2
    }
    return mapping[difficulty] || 0.0
  }

  // Get discrimination parameter based on question characteristics
  getDiscrimination(question) {
    let discrimination = 1.0

    // Higher discrimination for irregular verbs (more informative)
    if (question.irregularityInfo) {
      discrimination += 0.3
    }

    // Adjust based on verb frequency/complexity
    if (['ser', 'estar', 'tener', 'haber'].includes(question.verb)) {
      discrimination += 0.2 // High-frequency verbs are more discriminating
    }

    // Subjunctive and conditional are more discriminating
    if (question.mood === 'subjunctive' || question.mood === 'conditional') {
      discrimination += 0.4
    }

    return Math.min(discrimination, 2.5) // Cap at reasonable maximum
  }

  // Update ability estimate using Maximum Likelihood Estimation
  updateAbilityEstimate(isCorrect, question) {
    const previousTheta = this.abilityEstimate

    // Simplified Newton-Raphson method for MLE
    const difficulty = this.difficultyToTheta(question.difficulty)
    const discrimination = this.getDiscrimination(question)
    const stepSize = 0.3

    if (isCorrect) {
      // Increase ability if correct, more so if item was difficult
      this.abilityEstimate += stepSize * (1 + (difficulty - this.abilityEstimate) * 0.1)
    } else {
      // Decrease ability if incorrect, more so if item was easy
      this.abilityEstimate -= stepSize * (1 + (this.abilityEstimate - difficulty) * 0.1)
    }

    // Update standard error (simplified)
    const responses = this.currentTest.results.length
    this.standardError = 1.0 / Math.sqrt(responses + 1)

    // Track convergence
    const abilityChange = Math.abs(this.abilityEstimate - previousTheta)

    return {
      theta: this.abilityEstimate,
      standardError: this.standardError,
      converged: abilityChange < this.convergenceThreshold && responses >= this.minQuestions
    }
  }

  // Convert theta to CEFR level
  thetaToLevel(theta) {
    if (theta < -1.5) return 'A1'
    if (theta < -0.5) return 'A2'
    if (theta < 0.5) return 'B1'
    if (theta < 1.5) return 'B2'
    if (theta < 2.5) return 'C1'
    return 'C2'
  }

  // Check if test should terminate
  shouldTerminate() {
    if (!this.currentTest) return false

    const responses = this.currentTest.results.length

    // Minimum questions not reached
    if (responses < this.minQuestions) return false

    // Maximum questions reached
    if (responses >= this.maxQuestions) return true

    // Standard error criterion met
    if (this.standardError <= this.targetSE) return true

    // Convergence criterion met
    if (responses >= this.minQuestions) {
      const recentChanges = this.currentTest.results.slice(-3).map((r, i) =>
        i > 0 ? Math.abs(r.abilityEstimate - this.currentTest.results[this.currentTest.results.length - 3 + i - 1].abilityEstimate) : 0
      ).filter(c => c > 0)

      if (recentChanges.length >= 2 && Math.max(...recentChanges) < this.convergenceThreshold) {
        return true
      }
    }

    return false
  }

  generatePlacementTest(questionCount = 15) {
    // Initialize question pool
    this.initializeQuestionPool()

    // Reset CAT parameters
    this.abilityEstimate = 0.0
    this.standardError = 1.0

    // For adaptive test, we don't pre-select questions
    // Questions will be selected dynamically based on responses
    return {
      mode: 'adaptive',
      maxQuestions: Math.min(questionCount, this.maxQuestions),
      questionPool: this.questionPool,
      startTime: Date.now()
    }
  }

  async startPlacementTest(questionCount = 15) {
    const testConfig = this.generatePlacementTest(questionCount)

    this.currentTest = {
      mode: testConfig.mode,
      questionPool: testConfig.questionPool,
      maxQuestions: testConfig.maxQuestions,
      currentIndex: 0,
      startTime: testConfig.startTime,
      results: [],
      usedQuestions: new Set(),
      currentQuestion: null
    }

    // Select first question
    const firstQuestion = this.selectNextQuestion()
    this.currentTest.currentQuestion = firstQuestion
    this.currentTest.questionStartTime = Date.now()

    this.isRunning = true
    return this.currentTest
  }

  selectNextQuestion() {
    // Filter available questions (not yet used)
    const availableQuestions = this.currentTest.questionPool.filter(q =>
      !this.currentTest.usedQuestions.has(q.id)
    )

    if (availableQuestions.length === 0) {
      return null // No more questions
    }

    // Use CAT algorithm to select optimal question
    const selectedQuestion = this.selectOptimalQuestion(availableQuestions)

    if (selectedQuestion) {
      this.currentTest.usedQuestions.add(selectedQuestion.id)
      selectedQuestion.id = this.currentTest.currentIndex + 1 // Renumber for display
    }

    return selectedQuestion
  }

  async submitAnswer(questionId, userAnswer) {
    if (!this.isRunning || !this.currentTest) {
      throw new Error('No active placement test')
    }

    const question = this.currentTest.currentQuestion
    if (!question || question.id !== questionId) {
      throw new Error('Question ID mismatch')
    }

    const isCorrect = this.normalizeAnswer(userAnswer) === this.normalizeAnswer(question.expectedAnswer)
    const responseTime = Date.now() - (this.currentTest.questionStartTime || Date.now())

    // Update ability estimate using CAT algorithm
    const abilityUpdate = this.updateAbilityEstimate(isCorrect, question)

    const result = {
      questionId,
      targetLevel: question.targetLevel,
      difficulty: question.difficulty,
      isCorrect,
      responseTime,
      userAnswer: userAnswer.trim(),
      expectedAnswer: question.expectedAnswer,
      abilityEstimate: this.abilityEstimate,
      standardError: this.standardError,
      estimatedLevel: this.thetaToLevel(this.abilityEstimate)
    }

    this.currentTest.results.push(result)
    this.currentTest.currentIndex++

    // Check if test should terminate
    if (this.shouldTerminate()) {
      return await this.completePlacementTest()
    }

    // Select next question
    const nextQuestion = this.selectNextQuestion()
    if (!nextQuestion) {
      // No more questions available
      return await this.completePlacementTest()
    }

    this.currentTest.currentQuestion = nextQuestion
    this.currentTest.questionStartTime = Date.now()

    return {
      completed: false,
      nextQuestion: nextQuestion,
      progress: Math.min((this.currentTest.currentIndex / this.currentTest.maxQuestions) * 100, 95),
      currentEstimate: {
        level: this.thetaToLevel(this.abilityEstimate),
        theta: this.abilityEstimate,
        confidence: Math.max(0, Math.min(100, (1 - this.standardError) * 100))
      }
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
    return this.currentTest.currentQuestion
  }

  getTestProgress() {
    if (!this.currentTest) return 0
    return Math.min((this.currentTest.currentIndex / this.currentTest.maxQuestions) * 100, 95)
  }

  getCurrentEstimate() {
    if (!this.currentTest || this.currentTest.results.length === 0) {
      return {
        level: 'A1',
        theta: 0.0,
        confidence: 0
      }
    }

    return {
      level: this.thetaToLevel(this.abilityEstimate),
      theta: this.abilityEstimate,
      confidence: Math.max(0, Math.min(100, (1 - this.standardError) * 100))
    }
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