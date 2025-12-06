// Adaptive Level Test for Spanish Verb Conjugation
// Implements a "Binary Search" style adaptive algorithm for efficient placement
// CEFR Levels: A1, A2, B1, B2, C1, C2

import { getCurrentUserProfile, setGlobalPlacementTestBaseline } from './userLevelProfile.js'

// Curated question pool: CEFR levels (A1-C2)
export const QUESTION_POOL = {
  A1: [
    {
      id: 'a1_1',
      prompt: 'Yo ____ estudiante de español.',
      options: ['soy', 'estoy', 'tengo', 'hago'],
      correct: 'soy',
      explanation: 'Usamos "ser" para profesiones o características permanentes.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'ser_vs_estar' }
    },
    {
      id: 'a1_2',
      prompt: 'Ella ____ español todos los días.',
      options: ['habla', 'hablas', 'hablo', 'hablan'],
      correct: 'habla',
      explanation: 'Tercera persona singular de verbos regulares -ar.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'regular_ar' }
    },
    {
      id: 'a1_3',
      prompt: 'Tú ____ en Argentina.',
      options: ['vives', 'vive', 'vivo', 'viven'],
      correct: 'vives',
      explanation: 'Segunda persona singular de verbos regulares -ir.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'regular_ir' }
    },
    {
      id: 'a1_4',
      prompt: 'Nosotros ____ hambre.',
      options: ['tenemos', 'somos', 'estamos', 'hacemos'],
      correct: 'tenemos',
      explanation: 'Expresiones con "tener" (tener hambre/sed/frío).',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'tener_idioms' }
    },
    {
      id: 'a1_5',
      prompt: 'Ellos ____ al cine los viernes.',
      options: ['van', 'imaginan', 'son', 'están'],
      correct: 'van',
      explanation: 'Verbo irregular "ir" (ellos van).',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'irregular_ir' }
    }
  ],
  A2: [
    {
      id: 'a2_1',
      prompt: 'Ayer yo ____ al cine.',
      options: ['fui', 'yendo', 'ir', 'sido'],
      correct: 'fui',
      explanation: 'Pretérito indefinido para acciones específicas del pasado.',
      competencyInfo: { mood: 'indicative', tense: 'pretIndef', rule: 'irregular_ir_ser' }
    },
    {
      id: 'a2_2',
      prompt: 'Cuando era niño, siempre ____ mucho.',
      options: ['jugaba', 'jugado', 'jugar', 'jugando'],
      correct: 'jugaba',
      explanation: 'Imperfecto para acciones habituales del pasado ("siempre").',
      competencyInfo: { mood: 'indicative', tense: 'imp', rule: 'habitual_past' }
    },
    {
      id: 'a2_3',
      prompt: 'Mañana nosotros ____ a la playa.',
      options: ['iremos', 'fuimos', 'vayamos', 'ido'],
      correct: 'iremos',
      explanation: 'Futuro simple para planes futuros.',
      competencyInfo: { mood: 'indicative', tense: 'fut', rule: 'regular_future' }
    },
    {
      id: 'a2_4',
      prompt: 'He ____ la tarea.',
      options: ['terminado', 'terminé', 'terminaba', 'terminar'],
      correct: 'terminado',
      explanation: 'Pretérito Perfecto Compuesto (haber + participio).',
      competencyInfo: { mood: 'indicative', tense: 'pretPerf', rule: 'perfect_tense' }
    },
    {
      id: 'a2_5',
      prompt: 'Mientras comía, de repente ____ el teléfono.',
      options: ['sonó', 'sonando', 'sonar', 'sonado'],
      correct: 'sonó',
      explanation: 'Interrupción repentina (Indefinido) de una acción en curso.',
      competencyInfo: { mood: 'indicative', tense: 'pretIndef', rule: 'interruption' }
    }
  ],
  B1: [
    {
      id: 'b1_1',
      prompt: 'Espero que ____ tiempo para visitarnos.',
      options: ['tengas', 'tienes', 'tenías', 'tendrás'],
      correct: 'tengas',
      explanation: 'Subjuntivo presente después de expresiones de esperanza (WEIRDO).',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'wishes_hopes' }
    },
    {
      id: 'b1_2',
      prompt: 'Si tuviera dinero, ____ un viaje ahora mismo.',
      options: ['haría', 'hago', 'hice', 'haré'],
      correct: 'haría',
      explanation: 'Condicional simple en oraciones hipotéticas (Type 2 Conditional).',
      competencyInfo: { mood: 'indicative', tense: 'cond', rule: 'conditional_hypothetical' }
    },
    {
      id: 'b1_3',
      prompt: 'No creo que eso ____ verdad hoy.',
      options: ['sea', 'es', 'era', 'fuiste'],
      correct: 'sea',
      explanation: 'Subjuntivo tras negación de creencia/pensamiento en presente.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'doubts_denial' }
    },
    {
      id: 'b1_4',
      prompt: 'No hay nadie en el grupo que ____ hablar chino.',
      options: ['sepa', 'sabe', 'sabía', 'sabrá'],
      correct: 'sepa',
      explanation: 'Subjuntivo obligatorio tras antecedente negativo ("nadie").',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'unknown_antecedent' }
    },
    {
      id: 'b1_5',
      prompt: 'Te llamaré en cuanto ____ a casa.',
      options: ['llegues', 'llegas', 'llegarás', 'llegaste'],
      correct: 'llegues',
      explanation: 'Subjuntivo en cláusulas temporales "En cuanto..." referidas al futuro.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'temporal_future' }
    }
  ],
  B2: [
    {
      id: 'b2_1',
      prompt: 'Yo no sabía nada. Si tú ____ hubieras dicho antes, te habría ayudado.',
      options: ['me lo', 'te lo', 'se lo', 'nos lo'],
      correct: 'me lo',
      explanation: 'Colocación de pronombres dobles (tú a mí -> me lo).',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPlus', rule: 'conditional_past' }
    },
    {
      id: 'b2_2',
      prompt: 'Me extrañó mucho que Juan no ____ a la fiesta ayer.',
      options: ['viniera', 'viene', 'vendrá', 'venga'],
      correct: 'viniera',
      explanation: 'Imperfecto de Subjuntivo tras reacción emocional en el pasado.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'past_emotion' }
    },
    {
      id: 'b2_3',
      prompt: 'Es imposible que ____ tan tarde.',
      options: ['sea', 'es', 'era', 'fui'],
      correct: 'sea',
      explanation: 'Expresiones de imposibilidad + que exigen Subjuntivo.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'impersonal_expressions' }
    },
    {
      id: 'b2_4',
      prompt: '¡Qué error cometí! Ojalá ____ aceptado la oferta.',
      options: ['hubiera', 'haya', 'habría', 'había'],
      correct: 'hubiera',
      explanation: 'Pluscuamperfecto Subjuntivo para expresar arrepentimiento pasado.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPlus', rule: 'past_regret' }
    },
    {
      id: 'b2_5',
      prompt: 'Necesito un gerente que ____ experiencia en ventas.',
      options: ['tenga', 'tenía', 'tuvo', 'tenido'],
      correct: 'tenga',
      explanation: 'Antecedente indefinido ("Necesito un...") con pre-requisito.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'formal_requirement' }
    }
  ],
  C1: [
    {
      id: 'c1_1',
      prompt: 'De ____ sabido esto, no habría venido.',
      options: ['haber', 'habiendo', 'tener', 'tenido'],
      correct: 'haber',
      explanation: 'Infinitivo compuesto "De haber + participio" en condicionales.',
      competencyInfo: { mood: 'indicative', tense: 'infComp', rule: 'conditional_infinitive' }
    },
    {
      id: 'c1_2',
      prompt: 'No es que no ____, es que no puedo.',
      options: ['quiera', 'quiero', 'querría', 'quise'],
      correct: 'quiera',
      explanation: 'Fórmula de corrección "No es que + Subjuntivo".',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'corrective_formula' }
    },
    {
      id: 'c1_3',
      prompt: 'Te advierto: como no ____ pronto, nos vamos sin ti.',
      options: ['llegues', 'llegado', 'llegarás', 'llegabas'],
      correct: 'llegues',
      explanation: 'Amenaza/Advertencia con "Como + Subjuntivo".',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'conditional_threat' }
    },
    {
      id: 'c1_4',
      prompt: 'No firmaré el contrato a no ser que ____ las condiciones.',
      options: ['mejoren', 'mejoran', 'mejoraron', 'mejorarían'],
      correct: 'mejoren',
      explanation: '"A no ser que" es un conector condicional que siempre exige Subjuntivo.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'conditional_connector' }
    },
    {
      id: 'c1_5',
      prompt: 'Quienquiera que ____ ahora, dile que no estoy.',
      options: ['sea', 'es', 'fue', 'era'],
      correct: 'sea',
      explanation: 'Idenfinitud en el presente ("ahora") -> Subjuntivo Presente.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'indefinite_relative' }
    }
  ],
  C2: [
    {
      id: 'c2_1',
      prompt: 'Me ignoró completamente, como si no me ____.',
      options: ['conociera', 'conoce', 'conocía', 'ha conocido'],
      correct: 'conociera',
      explanation: '"Como si" introduce una comparación irreal que exige Imperfecto de Subjuntivo.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'unreal_comparison' }
    },
    {
      id: 'c2_2',
      prompt: 'Perdió el tren, de ahí que ____ tarde a la reunión.',
      options: ['llegara', 'llegó', 'llegaba', 'ha llegado'],
      correct: 'llegara',
      explanation: '"De ahí que" es un conector consecutivo que rige Subjuntivo.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'consecutive_subjunctive' }
    },
    {
      id: 'c2_3',
      prompt: 'El criminal fue ____ por la policía.',
      options: ['aprehendido', 'aprendido', 'apreso', 'aprensivo'],
      correct: 'aprehendido',
      explanation: 'Participio culto irregular de "aprehender" (capturar).',
      competencyInfo: { mood: 'indicative', tense: 'participle', rule: 'cult_vocabulary' }
    },
    {
      id: 'c2_4',
      prompt: 'No imaginé que la situación ____ a derivar en esto.',
      options: ['fuera', 'vaya', 'va', 'fue'],
      correct: 'fuera',
      explanation: 'Subjuntivo Imperfecto en subordinada sustantiva tras verbo de opinión negado en pasado.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'periphrasis_shifts' }
    },
    {
      id: 'c2_5',
      prompt: 'Hágase su voluntad, así en la tierra como en el cielo.',
      options: ['Hágase', 'Hárrase', 'Hace', 'Haga'],
      correct: 'Hágase',
      explanation: 'Imperativo de tercera persona + pronombre enclítico (Voz Pasiva Refleja).',
      competencyInfo: { mood: 'imperative', tense: 'imper', rule: 'enclitic_formal' }
    }
  ]
}

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

// Advanced Adaptive Test Class
class AdaptiveLevelTest {
  constructor() {
    this.isActive = false
    this.results = []
    this.currentQuestion = null
    this.history = [] // Track path taken: ['B1', 'C1', 'C2']

    // Adaptive State
    this.currentLevelIndex = 2 // Start at B1 (Index 2)
    this.blockQuestions = [] // Questions in current analysis block
    this.questionsAnsweredTotal = 0
    this.maxQuestions = 25 // Hard stop
    this.stabilizedLevel = null // If result found
    this.questionsUsed = new Set()
  }

  startTest() {
    this.isActive = true
    this.history = []
    this.results = []
    this.questionsUsed = new Set()

    // Reset to B1 start
    this.currentLevelIndex = 2
    this.blockQuestions = []
    this.questionsAnsweredTotal = 0

    console.log('🚀 Starting Adaptive Test at Level:', LEVEL_ORDER[this.currentLevelIndex])

    return this.generateNextStep()
  }

  generateNextStep() {
    // Check Hard Stop
    if (this.questionsAnsweredTotal >= this.maxQuestions) {
      console.log('🛑 Max questions reached.')
      return this.completeTest()
    }

    // Get Current Level
    const levelStr = LEVEL_ORDER[this.currentLevelIndex]

    // Find next question in this level
    const pool = QUESTION_POOL[levelStr] || []
    const available = pool.filter(q => !this.questionsUsed.has(q.id))

    // If we ran out of questions in this level, force a move or end
    if (available.length === 0) {
      console.warn(`No more questions in ${levelStr}. Forcing completion based on current stats.`)
      return this.completeTest()
    }

    // Pick Random
    const q = available[Math.floor(Math.random() * available.length)]
    this.questionsUsed.add(q.id)

    this.currentQuestion = {
      ...q,
      targetLevel: levelStr,
      questionNumber: this.questionsAnsweredTotal + 1,
      startTime: Date.now()
    }

    return {
      active: true,
      currentQuestion: this.currentQuestion,
      progress: (this.questionsAnsweredTotal / this.maxQuestions) * 100,
      currentEstimate: { level: levelStr, confidence: 50 }, // Dynamic confidence could be improved
      maxQuestions: this.maxQuestions,
      currentIndex: this.questionsAnsweredTotal
    }
  }

  submitAnswer(questionId, userAnswer) {
    if (!this.isActive) return { error: 'Test not active' }
    if (!this.currentQuestion || this.currentQuestion.id !== questionId) return { error: 'Invalid question' }

    const isCorrect = userAnswer === this.currentQuestion.correct

    const result = {
      questionId,
      userAnswer,
      correctAnswer: this.currentQuestion.correct,
      isCorrect,
      level: this.currentQuestion.targetLevel,
      responseTime: Date.now() - this.currentQuestion.startTime,
      competencyInfo: this.currentQuestion.competencyInfo,
      timestamp: Date.now()
    }

    this.results.push(result)
    this.blockQuestions.push(result)
    this.questionsAnsweredTotal++

    // ADAPTIVE LOGIC EVALUATION
    // Strategy: "Sutil" (Nuanced)
    // 1. Check at 3 questions (Quick check)
    //    - 3/3 Correct (100%) -> CLEAR WIN -> Level Up
    //    - 0/3 Correct (0%)   -> CLEAR FAIL -> Level Down
    //    - 1/3 or 2/3         -> INCONCLUSIVE -> Extend block to 5 questions
    // 2. Check at 5 questions (Confirmation)
    //    - >= 4/5 (80%)       -> GOOD ENOUGH -> Level Up
    //    - <= 2/5 (40%)       -> STRUGGLING  -> Level Down
    //    - 3/5 (60%)          -> STABLE      -> Finish (This is your level)

    let nextAction = 'continue'
    const currentQCount = this.blockQuestions.length
    const correctCount = this.blockQuestions.filter(r => r.isCorrect).length

    if (currentQCount === 3) {
      console.log(`📊 Quick Check [${LEVEL_ORDER[this.currentLevelIndex]}]: ${correctCount}/3`)

      if (correctCount === 3) {
        nextAction = 'level_up'
      } else if (correctCount === 0) {
        nextAction = 'level_down'
      } else {
        // 1 or 2 correct: Extend to 5 to be sure ("rectifying possibility")
        console.log('🤔 Inconclusive. Extending block to 5 questions.')
        nextAction = 'continue'
      }
    } else if (currentQCount >= 5) {
      const accuracy = correctCount / currentQCount

      console.log(`📊 Full Block Check [${LEVEL_ORDER[this.currentLevelIndex]}]: ${correctCount}/${currentQCount} (${(accuracy * 100).toFixed(0)}%)`)

      if (correctCount >= 4) {
        nextAction = 'level_up'
      } else if (correctCount <= 2) {
        nextAction = 'level_down'
      } else {
        // 3/5 (60%) -> Solid "Pass" for this level, but maybe not enough to go up.
        // It means "You are likely this level".
        nextAction = 'finish_stable'
        this.stabilizedLevel = LEVEL_ORDER[this.currentLevelIndex]
      }
    }

    // EXECUTE ACTION
    if (nextAction === 'level_up') {
      if (this.currentLevelIndex < LEVEL_ORDER.length - 1) {
        this.currentLevelIndex++
        this.blockQuestions = [] // Reset for new level
      } else {
        // Already Max (C2)
        nextAction = 'finish_stable'
        this.stabilizedLevel = 'C2'
      }
    } else if (nextAction === 'level_down') {
      if (this.currentLevelIndex > 0) {
        this.currentLevelIndex--
        this.blockQuestions = [] // Reset for new level
      } else {
        // Already Min (A1)
        nextAction = 'finish_stable'
        this.stabilizedLevel = 'A1'
      }
    }

    console.log(`🤖 Adaptive Decision: ${nextAction} -> Next Level: ${LEVEL_ORDER[this.currentLevelIndex]}`)

    if (nextAction === 'finish_stable') {
      const final = this.completeTest()
      return {
        ...final,
        // Include nextQuestion: null to signal frontend loop to stop if it relies on it?
        // But 'completed: true' is the standard signal
      }
    }

    const nextStep = this.generateNextStep()

    // If completeTest was triggered inside generateNextStep (due to running out of questions)
    if (nextStep.completed) return nextStep

    return {
      completed: false,
      nextQuestion: nextStep.currentQuestion,
      currentIndex: this.questionsAnsweredTotal - 1,
      maxQuestions: this.maxQuestions,
      progress: (this.questionsAnsweredTotal / this.maxQuestions) * 100,
      result // Return the result of the submission for UI feedback
    }
  }

  completeTest() {
    this.isActive = false

    // Determine Final Level Logic
    // If stabilizedLevel is set, use it.
    // Else, calculate weighted average or just current level.

    let finalLevel = this.stabilizedLevel
    if (!finalLevel) {
      // Fallback: Level with highest weighted score?
      // Simplification: Current level where test ended is likely the best estimate
      finalLevel = LEVEL_ORDER[this.currentLevelIndex]
    }

    console.log('🏁 Test Completed. Determined Level:', finalLevel)

    return {
      completed: true,
      determinedLevel: finalLevel,
      totalQuestions: this.questionsAnsweredTotal,
      correctAnswers: this.results.filter(r => r.isCorrect).length,
      results: this.results
    }
  }

  abortTest() {
    this.isActive = false
  }

  getTestProgress() {
    return (this.questionsAnsweredTotal / this.maxQuestions) * 100
  }

  getCurrentEstimate() {
    return {
      level: LEVEL_ORDER[this.currentLevelIndex],
      confidence: 50 + (this.blockQuestions.length * 10)
    }
  }
}

// Singleton for global use
let globalAssessment = null

export function getGlobalAssessment() {
  if (!globalAssessment) {
    globalAssessment = new AdaptiveLevelTest()
  }
  return globalAssessment
}