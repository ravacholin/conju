// Simple Level Test for Spanish Verb Conjugation
// Professional but simple implementation - no complex CAT algorithms

import { getCurrentUserProfile } from './userLevelProfile.js'

// Curated question pool: 10 questions per CEFR level (A1-C1)
const QUESTION_POOL = {
  A1: [
    {
      id: 'a1_1',
      prompt: 'Yo ____ estudiante de español.',
      options: ['soy', 'estoy', 'tengo', 'hago'],
      correct: 'soy',
      explanation: 'Usamos "ser" para profesiones o características permanentes'
    },
    {
      id: 'a1_2',
      prompt: 'Nosotros ____ en casa.',
      options: ['somos', 'estamos', 'tenemos', 'hacemos'],
      correct: 'estamos',
      explanation: 'Usamos "estar" para ubicación'
    },
    {
      id: 'a1_3',
      prompt: 'Ella ____ español todos los días.',
      options: ['habla', 'hablas', 'hablo', 'hablan'],
      correct: 'habla',
      explanation: 'Tercera persona singular de verbos regulares -ar'
    },
    {
      id: 'a1_4',
      prompt: 'Ustedes ____ mucha agua.',
      options: ['beben', 'bebe', 'bebo', 'bebes'],
      correct: 'beben',
      explanation: 'Tercera persona plural de verbos regulares -er'
    },
    {
      id: 'a1_5',
      prompt: 'Tú ____ en Argentina.',
      options: ['vive', 'vivo', 'vives', 'viven'],
      correct: 'vives',
      explanation: 'Segunda persona singular de verbos regulares -ir'
    },
    {
      id: 'a1_6',
      prompt: 'Mi hermana ____ 25 años.',
      options: ['tiene', 'tienes', 'tengo', 'tenemos'],
      correct: 'tiene',
      explanation: 'Expresión de edad con "tener"'
    },
    {
      id: 'a1_7',
      prompt: 'Nosotros ____ al trabajo en colectivo.',
      options: ['vamos', 'van', 'va', 'voy'],
      correct: 'vamos',
      explanation: 'Primera persona plural del verbo irregular "ir"'
    },
    {
      id: 'a1_8',
      prompt: 'Ellos ____ la tarea.',
      options: ['hacen', 'hace', 'hago', 'haces'],
      correct: 'hacen',
      explanation: 'Tercera persona plural del verbo irregular "hacer"'
    },
    {
      id: 'a1_9',
      prompt: '¿Tú ____ café o té?',
      options: ['quieres', 'quiere', 'queremos', 'quieren'],
      correct: 'quieres',
      explanation: 'Verbo irregular "querer" en segunda persona'
    },
    {
      id: 'a1_10',
      prompt: 'Yo no ____ la respuesta.',
      options: ['sé', 'sabes', 'sabe', 'sabemos'],
      correct: 'sé',
      explanation: 'Primera persona singular del verbo irregular "saber"'
    }
  ],

  A2: [
    {
      id: 'a2_1',
      prompt: 'Ayer yo ____ al cine.',
      options: ['fui', 'iba', 'voy', 'iré'],
      correct: 'fui',
      explanation: 'Pretérito indefinido para acciones específicas del pasado'
    },
    {
      id: 'a2_2',
      prompt: 'Cuando era niño ____ mucho.',
      options: ['jugaba', 'jugué', 'juego', 'jugaré'],
      correct: 'jugaba',
      explanation: 'Imperfecto para acciones habituales del pasado'
    },
    {
      id: 'a2_3',
      prompt: 'Mañana nosotros ____ a la playa.',
      options: ['iremos', 'fuimos', 'íbamos', 'vamos'],
      correct: 'iremos',
      explanation: 'Futuro simple para planes futuros'
    },
    {
      id: 'a2_4',
      prompt: 'Ellos ____ la película anoche.',
      options: ['vieron', 'veían', 'ven', 'verán'],
      correct: 'vieron',
      explanation: 'Pretérito indefinido del verbo irregular "ver"'
    },
    {
      id: 'a2_5',
      prompt: 'No ____ terminar el trabajo ayer.',
      options: ['pude', 'podía', 'puedo', 'podré'],
      correct: 'pude',
      explanation: 'Pretérito indefinido de "poder" para imposibilidad específica'
    },
    {
      id: 'a2_6',
      prompt: 'Antes yo ____ en Madrid.',
      options: ['vivía', 'viví', 'vivo', 'viviré'],
      correct: 'vivía',
      explanation: 'Imperfecto para situaciones habituales del pasado'
    },
    {
      id: 'a2_7',
      prompt: 'La tienda ____ a las 9 de la mañana.',
      options: ['abre', 'abría', 'abrió', 'abrirá'],
      correct: 'abre',
      explanation: 'Presente para horarios y rutinas'
    },
    {
      id: 'a2_8',
      prompt: 'El año pasado ____ a Francia.',
      options: ['viajé', 'viajaba', 'viajo', 'viajaré'],
      correct: 'viajé',
      explanation: 'Pretérito indefinido para eventos específicos'
    },
    {
      id: 'a2_9',
      prompt: '¿A qué hora ____ el restaurante?',
      options: ['cierra', 'cerraba', 'cerró', 'cerrará'],
      correct: 'cierra',
      explanation: 'Cambio vocálico e→ie en presente'
    },
    {
      id: 'a2_10',
      prompt: 'Los niños ____ en el parque todos los días.',
      options: ['jugaban', 'jugaron', 'juegan', 'jugarán'],
      correct: 'jugaban',
      explanation: 'Imperfecto para acciones repetidas en el pasado'
    }
  ],

  B1: [
    {
      id: 'b1_1',
      prompt: 'Espero que ____ tiempo para visitarnos.',
      options: ['tengas', 'tienes', 'tenías', 'tendrás'],
      correct: 'tengas',
      explanation: 'Subjuntivo presente después de expresiones de esperanza'
    },
    {
      id: 'b1_2',
      prompt: 'Si tuviera dinero, ____ un viaje.',
      options: ['haría', 'hago', 'hice', 'haré'],
      correct: 'haría',
      explanation: 'Condicional simple en oraciones hipotéticas'
    },
    {
      id: 'b1_3',
      prompt: 'Este año ____ tres veces a París.',
      options: ['he ido', 'fui', 'iba', 'iré'],
      correct: 'he ido',
      explanation: 'Pretérito perfecto para experiencias con relevancia presente'
    },
    {
      id: 'b1_4',
      prompt: 'Es importante que tú ____ temprano.',
      options: ['llegues', 'llegas', 'llegabas', 'llegarás'],
      correct: 'llegues',
      explanation: 'Subjuntivo presente después de expresiones de importancia'
    },
    {
      id: 'b1_5',
      prompt: 'Cuando llegué, ellos ya ____.',
      options: ['se habían ido', 'se fueron', 'se iban', 'se van'],
      correct: 'se habían ido',
      explanation: 'Pluscuamperfecto para acciones anteriores a otra del pasado'
    },
    {
      id: 'b1_6',
      prompt: 'No creo que él ____ la verdad.',
      options: ['diga', 'dice', 'decía', 'dirá'],
      correct: 'diga',
      explanation: 'Subjuntivo presente después de expresiones de duda'
    },
    {
      id: 'b1_7',
      prompt: 'En tu lugar, yo ____ con el jefe.',
      options: ['hablaría', 'hablo', 'hablé', 'hable'],
      correct: 'hablaría',
      explanation: 'Condicional para consejos y situaciones hipotéticas'
    },
    {
      id: 'b1_8',
      prompt: 'Dudo que ____ terminado a tiempo.',
      options: ['hayan', 'han', 'habían', 'habrán'],
      correct: 'hayan',
      explanation: 'Subjuntivo perfecto para acciones pasadas con duda'
    },
    {
      id: 'b1_9',
      prompt: '¿Alguna vez ____ paella?',
      options: ['has comido', 'comiste', 'comías', 'comerás'],
      correct: 'has comido',
      explanation: 'Pretérito perfecto para experiencias pasadas'
    },
    {
      id: 'b1_10',
      prompt: 'Me alegra que ____ bien.',
      options: ['estés', 'estás', 'estabas', 'estarás'],
      correct: 'estés',
      explanation: 'Subjuntivo presente después de expresiones de emoción'
    }
  ],

  B2: [
    {
      id: 'b2_1',
      prompt: 'Si ____ más dinero, viajaría por el mundo.',
      options: ['tuviera', 'tengo', 'tenía', 'tendré'],
      correct: 'tuviera',
      explanation: 'Subjuntivo imperfecto en oraciones condicionales irreales'
    },
    {
      id: 'b2_2',
      prompt: '¿____ ayudarme con este problema?',
      options: ['Podrías', 'Puedes', 'Pudiste', 'Puedas'],
      correct: 'Podrías',
      explanation: 'Condicional para peticiones corteses'
    },
    {
      id: 'b2_3',
      prompt: 'Si ____ llegado antes, habríamos cenado juntos.',
      options: ['hubieras', 'habrías', 'habías', 'hubieses'],
      correct: 'hubieras',
      explanation: 'Subjuntivo pluscuamperfecto en oraciones condicionales'
    },
    {
      id: 'b2_4',
      prompt: 'Con más tiempo, ____ terminado el proyecto.',
      options: ['habríamos', 'habría', 'habremos', 'hemos'],
      correct: 'habríamos',
      explanation: 'Condicional perfecto para situaciones hipotéticas del pasado'
    },
    {
      id: 'b2_5',
      prompt: 'María dijo que ____ al médico la semana siguiente.',
      options: ['iría', 'va', 'fue', 'vaya'],
      correct: 'iría',
      explanation: 'Condicional en estilo indirecto para futuro del pasado'
    },
    {
      id: 'b2_6',
      prompt: 'Aunque ____ cansado, siguió trabajando.',
      options: ['estuviera', 'está', 'estaba', 'estaría'],
      correct: 'estuviera',
      explanation: 'Subjuntivo imperfecto con "aunque" en situaciones hipotéticas'
    },
    {
      id: 'b2_7',
      prompt: 'No pensé que ____ tan difícil.',
      options: ['fuera', 'es', 'era', 'sería'],
      correct: 'fuera',
      explanation: 'Subjuntivo imperfecto en estilo indirecto del pasado'
    },
    {
      id: 'b2_8',
      prompt: 'Te habría llamado si ____ tu número.',
      options: ['hubiera tenido', 'tenía', 'tuve', 'tendría'],
      correct: 'hubiera tenido',
      explanation: 'Subjuntivo pluscuamperfecto en condicionales del pasado'
    },
    {
      id: 'b2_9',
      prompt: 'Ojalá ____ más tiempo para estudiar.',
      options: ['tuviera', 'tengo', 'tenía', 'tendré'],
      correct: 'tuviera',
      explanation: 'Subjuntivo imperfecto para deseos poco probables'
    },
    {
      id: 'b2_10',
      prompt: 'Para cuando llegues, ya ____ la cena.',
      options: ['habré preparado', 'preparo', 'preparé', 'prepararé'],
      correct: 'habré preparado',
      explanation: 'Futuro perfecto para acciones completadas antes de un momento futuro'
    }
  ],

  C1: [
    {
      id: 'c1_1',
      prompt: 'Aunque ____ mucho dinero, no sería feliz.',
      options: ['tuviera', 'tenía', 'tenga', 'tendría'],
      correct: 'tuviera',
      explanation: 'Subjuntivo imperfecto con "aunque" para situaciones hipotéticas'
    },
    {
      id: 'c1_2',
      prompt: '____ terminado el trabajo, se fue a casa.',
      options: ['Habiendo', 'Haber', 'Había', 'Ha'],
      correct: 'Habiendo',
      explanation: 'Gerundio compuesto para acciones anteriores'
    },
    {
      id: 'c1_3',
      prompt: 'Quien ____ interesado, que se ponga en contacto.',
      options: ['esté', 'está', 'estuviere', 'estaría'],
      correct: 'esté',
      explanation: 'Subjuntivo presente en oraciones de relativo con antecedente indefinido'
    },
    {
      id: 'c1_4',
      prompt: 'De ____ sabido la verdad, no habría venido.',
      options: ['haber', 'haber', 'había', 'hubiera'],
      correct: 'haber',
      explanation: 'Infinitivo compuesto en construcciones condicionales'
    },
    {
      id: 'c1_5',
      prompt: 'Por mucho que ____, no conseguirás convencerlo.',
      options: ['insistas', 'insistes', 'insistías', 'insistirás'],
      correct: 'insistas',
      explanation: 'Subjuntivo presente en oraciones concesivas con "por mucho que"'
    },
    {
      id: 'c1_6',
      prompt: 'No es que no ____, sino que no puede.',
      options: ['quiera', 'quiere', 'querría', 'quisiera'],
      correct: 'quiera',
      explanation: 'Subjuntivo presente en construcciones con "no es que"'
    },
    {
      id: 'c1_7',
      prompt: 'Apenas ____ el sol cuando empezó a llover.',
      options: ['hubo salido', 'salió', 'había salido', 'salía'],
      correct: 'hubo salido',
      explanation: 'Pretérito anterior en construcciones temporales literarias'
    },
    {
      id: 'c1_8',
      prompt: 'Fuera como ____, hay que seguir adelante.',
      options: ['fuere', 'fuera', 'sea', 'sería'],
      correct: 'fuere',
      explanation: 'Subjuntivo futuro en expresiones fijas (registro formal)'
    },
    {
      id: 'c1_9',
      prompt: 'A no ser que ____ problemas, llegaremos a tiempo.',
      options: ['surjan', 'surgen', 'surgían', 'surgirán'],
      correct: 'surjan',
      explanation: 'Subjuntivo presente después de "a no ser que"'
    },
    {
      id: 'c1_10',
      prompt: 'Mal que ____, tendremos que aceptar.',
      options: ['nos pese', 'nos pesa', 'nos pesaba', 'nos pesará'],
      correct: 'nos pese',
      explanation: 'Subjuntivo presente en expresiones fijas concesivas'
    }
  ]
}

// Simple Level Test Class - no complex algorithms
class SimpleLevelTest {
  constructor() {
    this.currentLevel = 'A1'
    this.currentQuestionIndex = 0
    this.results = []
    this.isActive = false
    this.questionsUsed = new Set()
    this.maxQuestionsPerLevel = 3
    this.levelProgression = ['A1', 'A2', 'B1', 'B2', 'C1']
    this.currentLevelIndex = 0
    this.questionsInCurrentLevel = 0
    this.consecutiveFailures = 0
    this.maxTotalQuestions = 12
  }

  startTest() {
    this.currentLevel = 'A1'
    this.currentLevelIndex = 0
    this.currentQuestionIndex = 0
    this.results = []
    this.isActive = true
    this.questionsUsed = new Set()
    this.questionsInCurrentLevel = 0
    this.consecutiveFailures = 0

    const firstQuestion = this.getNextQuestion()

    return {
      active: true,
      currentQuestion: firstQuestion,
      currentIndex: this.currentQuestionIndex - 1,
      maxQuestions: this.maxTotalQuestions,
      progress: this.getProgress(),
      currentEstimate: this.getCurrentEstimate()
    }
  }

  getNextQuestion() {
    if (!this.isActive) return null

    // Safety check: prevent infinite loops
    if (this.currentQuestionIndex >= this.maxTotalQuestions) {
      console.log('🛑 Reached maximum questions, completing test')
      return null
    }

    const levelQuestions = QUESTION_POOL[this.currentLevel]
    if (!levelQuestions || levelQuestions.length === 0) {
      console.log('🛑 No questions available for level', this.currentLevel)
      return null
    }

    const availableQuestions = levelQuestions.filter(q => !this.questionsUsed.has(q.id))

    if (availableQuestions.length === 0) {
      // No more questions in this level, move to next
      console.log('📚 No more questions in level', this.currentLevel, 'moving to next')
      const nextResult = this.moveToNextLevel()
      return nextResult?.nextQuestion || null
    }

    // Select random question from available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    const question = availableQuestions[randomIndex]

    this.questionsUsed.add(question.id)
    this.currentQuestionIndex++

    return {
      id: question.id,
      prompt: question.prompt,
      options: question.options,
      expectedAnswer: question.correct,
      explanation: question.explanation,
      targetLevel: this.currentLevel,
      questionNumber: this.currentQuestionIndex,
      difficulty: Math.min(this.currentLevelIndex + 1, 5)
    }
  }

  submitAnswer(questionId, userAnswer) {
    if (!this.isActive) return { error: 'Test not active' }

    const question = this.findQuestionById(questionId)
    if (!question) return { error: 'Question not found' }

    const isCorrect = userAnswer === question.correct

    this.results.push({
      questionId,
      userAnswer,
      correctAnswer: question.correct,
      isCorrect,
      level: this.currentLevel
    })

    this.questionsInCurrentLevel++

    // Simple adaptive logic
    if (isCorrect) {
      this.consecutiveFailures = 0
      // If answered enough questions in this level correctly, try next level
      if (this.questionsInCurrentLevel >= this.maxQuestionsPerLevel) {
        return this.moveToNextLevel()
      }
    } else {
      this.consecutiveFailures++
      // More forgiving failure logic - complete test only after 3 consecutive failures
      // or after failing 2 questions in the first level (A1)
      if (this.consecutiveFailures >= 3 ||
          (this.currentLevel === 'A1' && this.questionsInCurrentLevel >= 2 && this.consecutiveFailures >= 2)) {
        return this.completeTest()
      }
    }

    // Check if we've reached maximum questions
    if (this.currentQuestionIndex >= this.maxTotalQuestions) {
      return this.completeTest()
    }

    const nextQuestion = this.getNextQuestion()
    if (!nextQuestion) {
      return this.completeTest()
    }

    return {
      completed: false,
      nextQuestion,
      currentIndex: this.currentQuestionIndex - 1,
      maxQuestions: this.maxTotalQuestions,
      progress: this.getProgress(),
      currentEstimate: this.getCurrentEstimate(),
      feedback: {
        isCorrect,
        explanation: question.explanation
      }
    }
  }

  moveToNextLevel() {
    if (this.currentLevelIndex >= this.levelProgression.length - 1) {
      // Reached highest level
      console.log('🏆 Reached highest level, completing test')
      return this.completeTest()
    }

    // Safety check: prevent infinite loops
    if (this.currentQuestionIndex >= this.maxTotalQuestions) {
      console.log('🛑 Max questions reached during level move, completing test')
      return this.completeTest()
    }

    this.currentLevelIndex++
    this.currentLevel = this.levelProgression[this.currentLevelIndex]
    this.questionsInCurrentLevel = 0
    this.consecutiveFailures = 0

    console.log('📈 Moved to level', this.currentLevel, 'question', this.currentQuestionIndex + 1)

    const nextQuestion = this.getNextQuestion()
    if (!nextQuestion) {
      console.log('🛑 No next question available, completing test')
      return this.completeTest()
    }

    return {
      completed: false,
      nextQuestion,
      currentIndex: this.currentQuestionIndex - 1,
      maxQuestions: this.maxTotalQuestions,
      progress: this.getProgress(),
      currentEstimate: this.getCurrentEstimate()
    }
  }

  completeTest() {
    this.isActive = false

    // Determine final level based on performance
    let determinedLevel = this.calculateFinalLevel()

    return {
      completed: true,
      determinedLevel,
      totalQuestions: this.currentQuestionIndex,
      correctAnswers: this.results.filter(r => r.isCorrect).length,
      results: this.results,
      progress: 100,
      currentEstimate: { level: determinedLevel, confidence: 85 }
    }
  }

  calculateFinalLevel() {
    const correctByLevel = {}
    const totalByLevel = {}

    // Count correct answers by level
    this.levelProgression.forEach(level => {
      correctByLevel[level] = 0
      totalByLevel[level] = 0
    })

    this.results.forEach(result => {
      totalByLevel[result.level]++
      if (result.isCorrect) {
        correctByLevel[result.level]++
      }
    })

    // Find highest level where user got majority correct
    for (let i = this.levelProgression.length - 1; i >= 0; i--) {
      const level = this.levelProgression[i]
      if (totalByLevel[level] > 0) {
        const accuracy = correctByLevel[level] / totalByLevel[level]
        if (accuracy >= 0.5) { // 50% accuracy threshold
          return level
        }
      }
    }

    // Default to A1 if no level achieved 50%
    return 'A1'
  }

  findQuestionById(questionId) {
    for (const level of Object.keys(QUESTION_POOL)) {
      const question = QUESTION_POOL[level].find(q => q.id === questionId)
      if (question) return question
    }
    return null
  }

  getProgress() {
    return Math.min((this.currentQuestionIndex / this.maxTotalQuestions) * 100, 100)
  }

  getCurrentEstimate() {
    if (this.results.length === 0) {
      return { level: 'A1', confidence: 0 }
    }

    const recentResults = this.results.slice(-3) // Last 3 answers
    const correctRate = recentResults.filter(r => r.isCorrect).length / recentResults.length

    let estimatedLevel = this.currentLevel
    if (correctRate < 0.3) {
      // Struggling with current level
      const currentIndex = this.levelProgression.indexOf(this.currentLevel)
      if (currentIndex > 0) {
        estimatedLevel = this.levelProgression[currentIndex - 1]
      }
    }

    const confidence = Math.min(50 + (this.results.length * 8), 90)

    return { level: estimatedLevel, confidence }
  }

  abortTest() {
    this.isActive = false
    this.results = []
    this.questionsUsed = new Set()
  }

  isTestActive() {
    return this.isActive
  }

  getTestProgress() {
    return this.getProgress()
  }
}

// Global instance
let globalAssessment = null

export function getGlobalAssessment() {
  if (!globalAssessment) {
    globalAssessment = new SimpleLevelTest()
  }
  return globalAssessment
}

export class LevelAssessment extends SimpleLevelTest {
  // For compatibility with existing code
  async startPlacementTest(questionCount = 12) {
    return this.startTest()
  }
}