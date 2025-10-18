// Conversation Engine - Dialog-based practice with real scenarios
// Generates conversational exercises with context and NPC interactions

import { createLogger } from '../utils/logger.js'

const logger = createLogger('learning:conversationEngine')

/**
 * Conversation scenario structure
 * Each scenario has context, NPC prompts, and expected user responses
 */
export class ConversationScenario {
  constructor(config) {
    this.id = config.id
    this.title = config.title
    this.context = config.context
    this.difficulty = config.difficulty // A1, A2, B1, B2, C1, C2
    this.exchanges = config.exchanges || []
    this.vocabulary = config.vocabulary || []
    this.culturalNotes = config.culturalNotes || []
  }

  /**
   * Get next exchange in conversation
   */
  getExchange(index) {
    if (index >= this.exchanges.length) return null
    return this.exchanges[index]
  }

  /**
   * Get total number of exchanges
   */
  getTotalExchanges() {
    return this.exchanges.length
  }

  /**
   * Check if conversation is complete
   */
  isComplete(currentIndex) {
    return currentIndex >= this.exchanges.length
  }
}

/**
 * Conversation Engine - Manages dialog flow and validation
 */
export class ConversationEngine {
  constructor() {
    this.scenarios = new Map()
    this.loadDefaultScenarios()
  }

  /**
   * Load default conversation scenarios
   */
  loadDefaultScenarios() {
    // Restaurant scenario (A1-A2)
    this.registerScenario({
      id: 'restaurant_ordering',
      title: 'En el Restaurante',
      context: 'Estás en un restaurante en Barcelona. El camarero se acerca a tu mesa.',
      difficulty: 'A2',
      exchanges: [
        {
          npc: 'Buenas tardes. ¿Qué desea tomar?',
          expectedPatterns: [
            { pattern: /quiero|quisiera|me gustaría/i, verbs: ['querer'], mood: 'indicative', tense: 'pres' },
            { pattern: /un|una|el|la/i, partOfSpeech: 'article' }
          ],
          hints: ['Usa "quiero" o "quisiera" para pedir', 'Di qué plato o bebida deseas'],
          goodExamples: ['Quiero una paella', 'Quisiera un café con leche', 'Me gustaría el menú del día'],
          targetMood: 'indicative',
          targetTense: 'pres'
        },
        {
          npc: 'Perfecto. ¿Y para beber?',
          expectedPatterns: [
            { pattern: /agua|vino|cerveza|jugo|refresco/i, category: 'beverages' },
            { pattern: /traer|dar|poner/i, verbs: ['traer', 'dar'], mood: 'indicative' }
          ],
          hints: ['Menciona una bebida', 'Puedes usar "para beber"'],
          goodExamples: ['Agua, por favor', 'Una cerveza', 'Vino tinto'],
          targetMood: 'indicative',
          targetTense: 'pres'
        },
        {
          npc: '¿Algo más?',
          expectedPatterns: [
            { pattern: /no|nada|eso es todo/i, negation: true },
            { pattern: /sí|también/i, affirmation: true }
          ],
          hints: ['Di si necesitas algo más o no'],
          goodExamples: ['No, eso es todo', 'Nada más, gracias', 'Sí, también pan'],
          targetMood: 'indicative',
          targetTense: 'pres'
        }
      ],
      vocabulary: ['querer', 'quisiera', 'tomar', 'beber', 'plato', 'menú', 'cuenta'],
      culturalNotes: ['En España es común usar "quisiera" en lugar de "quiero" para ser más cortés']
    })

    // Hotel check-in (A2-B1)
    this.registerScenario({
      id: 'hotel_checkin',
      title: 'Registro en el Hotel',
      context: 'Llegas a un hotel en Madrid para hacer check-in.',
      difficulty: 'B1',
      exchanges: [
        {
          npc: 'Buenas tardes. ¿Tiene una reserva?',
          expectedPatterns: [
            { pattern: /sí|tengo|hice|reservé/i, affirmation: true },
            { pattern: /nombre|apellido/i, identification: true }
          ],
          hints: ['Confirma que tienes reserva', 'Menciona tu nombre'],
          goodExamples: ['Sí, tengo una reserva a nombre de García', 'Hice una reserva para dos noches'],
          targetMood: 'indicative',
          targetTense: 'pretPerf'
        },
        {
          npc: '¿Para cuántas noches?',
          expectedPatterns: [
            { pattern: /\\d+|una|dos|tres|cuatro|cinco/i, number: true },
            { pattern: /noche|noches/i, duration: true }
          ],
          hints: ['Di el número de noches'],
          goodExamples: ['Para tres noches', 'Dos noches', 'Una semana'],
          targetMood: 'indicative',
          targetTense: 'pres'
        },
        {
          npc: 'Perfecto. ¿Prefiere habitación con vista al mar o a la ciudad?',
          expectedPatterns: [
            { pattern: /prefiero|quisiera|me gustaría/i, verbs: ['preferir'], mood: 'indicative' },
            { pattern: /mar|ciudad/i, choice: true }
          ],
          hints: ['Expresa tu preferencia', 'Elige entre mar o ciudad'],
          goodExamples: ['Prefiero con vista al mar', 'Quisiera la habitación con vista a la ciudad'],
          targetMood: 'indicative',
          targetTense: 'pres'
        }
      ],
      vocabulary: ['reserva', 'habitación', 'noche', 'preferir', 'vista'],
      culturalNotes: ['Los hoteles en España suelen ofrecer desayuno incluido']
    })

    // Doctor appointment (B1-B2)
    this.registerScenario({
      id: 'doctor_appointment',
      title: 'Consulta Médica',
      context: 'Estás en el consultorio médico porque no te sientes bien.',
      difficulty: 'B2',
      exchanges: [
        {
          npc: 'Buenas. ¿Qué le pasa?',
          expectedPatterns: [
            { pattern: /me duele|tengo dolor|siento/i, symptoms: true },
            { pattern: /cabeza|estómago|garganta|fiebre/i, bodyParts: true }
          ],
          hints: ['Describe tus síntomas', 'Usa "me duele" o "tengo"'],
          goodExamples: ['Me duele la cabeza', 'Tengo fiebre y dolor de garganta', 'Siento náuseas'],
          targetMood: 'indicative',
          targetTense: 'pres'
        },
        {
          npc: '¿Desde cuándo tiene estos síntomas?',
          expectedPatterns: [
            { pattern: /desde|hace|ayer|hoy/i, timeReference: true },
            { pattern: /días|horas|semana/i, duration: true }
          ],
          hints: ['Di cuándo empezaron los síntomas', 'Usa "desde" o "hace"'],
          goodExamples: ['Desde ayer', 'Hace tres días', 'Desde esta mañana'],
          targetMood: 'indicative',
          targetTense: 'pres'
        },
        {
          npc: 'Entiendo. Voy a recetarle un medicamento. Tómelo dos veces al día.',
          expectedPatterns: [
            { pattern: /gracias|entendido|de acuerdo/i, acknowledgment: true },
            { pattern: /cuándo|cómo|con comida/i, questions: true }
          ],
          hints: ['Agradece o pregunta sobre el medicamento'],
          goodExamples: ['Gracias, doctor', '¿Lo tomo con comida?', 'Entendido, gracias'],
          targetMood: 'indicative',
          targetTense: 'pres'
        }
      ],
      vocabulary: ['doler', 'síntoma', 'fiebre', 'recetar', 'medicamento'],
      culturalNotes: ['En países hispanohablantes, las farmacias a menudo dan consejos médicos básicos']
    })

    // Job interview (B2-C1)
    this.registerScenario({
      id: 'job_interview',
      title: 'Entrevista de Trabajo',
      context: 'Estás en una entrevista para un puesto de gerente de proyectos.',
      difficulty: 'C1',
      exchanges: [
        {
          npc: 'Cuénteme sobre su experiencia laboral.',
          expectedPatterns: [
            { pattern: /he trabajado|trabajé|estuve/i, verbs: ['trabajar'], mood: 'indicative', tense: 'pretPerf' },
            { pattern: /años|empresa|puesto/i, experience: true }
          ],
          hints: ['Describe tu experiencia profesional', 'Usa pretérito perfecto o indefinido'],
          goodExamples: [
            'He trabajado cinco años en gestión de proyectos',
            'Trabajé como analista en una empresa tecnológica'
          ],
          targetMood: 'indicative',
          targetTense: 'pretPerf'
        },
        {
          npc: '¿Por qué está interesado en este puesto?',
          expectedPatterns: [
            { pattern: /me interesa|busco|quiero/i, motivation: true },
            { pattern: /desarrollo|crecimiento|desafío/i, careerGoals: true }
          ],
          hints: ['Explica tu motivación', 'Menciona tus objetivos'],
          goodExamples: [
            'Me interesa porque busco nuevos desafíos',
            'Quiero desarrollar mis habilidades de liderazgo'
          ],
          targetMood: 'indicative',
          targetTense: 'pres'
        },
        {
          npc: 'Si lo contratáramos, ¿qué haría en los primeros 90 días?',
          expectedPatterns: [
            { pattern: /haría|comenzaría|me enfocaría/i, verbs: ['hacer', 'comenzar'], mood: 'conditional', tense: 'cond' }
          ],
          hints: ['Usa condicional para responder', 'Describe tus prioridades'],
          goodExamples: [
            'Comenzaría conociendo al equipo',
            'Me enfocaría en entender los procesos actuales',
            'Haría un análisis de las necesidades del proyecto'
          ],
          targetMood: 'conditional',
          targetTense: 'cond'
        }
      ],
      vocabulary: ['experiencia', 'puesto', 'contratar', 'desarrollar', 'habilidades'],
      culturalNotes: ['En entrevistas formales en España, es apropiado usar "usted"']
    })

    logger.debug('Loaded default conversation scenarios', { count: this.scenarios.size })
  }

  /**
   * Register a new scenario
   */
  registerScenario(config) {
    const scenario = new ConversationScenario(config)
    this.scenarios.set(scenario.id, scenario)
    logger.debug('Registered scenario', { id: scenario.id })
  }

  /**
   * Get scenario by ID
   */
  getScenario(id) {
    return this.scenarios.get(id)
  }

  /**
   * Get all scenarios for a difficulty level
   */
  getScenariosByLevel(level) {
    return Array.from(this.scenarios.values())
      .filter(s => s.difficulty === level)
  }

  /**
   * Get all available scenarios
   */
  getAllScenarios() {
    return Array.from(this.scenarios.values())
  }

  /**
   * Start a conversation session
   */
  startConversation(scenarioId) {
    const scenario = this.getScenario(scenarioId)
    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`)
    }

    return {
      scenarioId,
      scenario,
      currentExchange: 0,
      responses: [],
      startTime: Date.now(),
      score: 0
    }
  }

  /**
   * Process user response in conversation
   */
  processResponse(session, userResponse) {
    const exchange = session.scenario.getExchange(session.currentExchange)
    if (!exchange) {
      return {
        valid: false,
        complete: true,
        message: 'Conversación completada'
      }
    }

    // Validate response against expected patterns
    const validation = this.validateResponse(userResponse, exchange)

    session.responses.push({
      exchangeIndex: session.currentExchange,
      userResponse,
      validation,
      timestamp: Date.now()
    })

    if (validation.isValid) {
      session.score += validation.score
      session.currentExchange++
    }

    return {
      valid: validation.isValid,
      complete: session.currentExchange >= session.scenario.getTotalExchanges(),
      validation,
      nextNPC: session.currentExchange < session.scenario.getTotalExchanges()
        ? session.scenario.getExchange(session.currentExchange).npc
        : null
    }
  }

  /**
   * Validate user response against expected patterns
   */
  validateResponse(response, exchange) {
    const patterns = exchange.expectedPatterns || []
    let matchCount = 0
    let totalPatterns = patterns.length
    const matched = []
    const missing = []

    patterns.forEach(pattern => {
      if (pattern.pattern && pattern.pattern.test(response)) {
        matchCount++
        matched.push(pattern)
      } else {
        missing.push(pattern)
      }
    })

    const score = totalPatterns > 0 ? Math.round((matchCount / totalPatterns) * 100) : 50
    const isValid = score >= 60 // At least 60% match required

    return {
      isValid,
      score,
      matchCount,
      totalPatterns,
      matched,
      missing,
      feedback: this.generateFeedback(isValid, score, matched, missing, exchange)
    }
  }

  /**
   * Generate feedback for user response
   */
  generateFeedback(isValid, score, matched, missing, exchange) {
    if (score >= 90) {
      return {
        level: 'excellent',
        message: '¡Perfecto! Respuesta muy natural.',
        suggestions: []
      }
    }

    if (score >= 75) {
      return {
        level: 'good',
        message: '¡Bien! Tu respuesta es correcta.',
        suggestions: matched.length > 0 ? [] : exchange.hints.slice(0, 1)
      }
    }

    if (isValid) {
      return {
        level: 'acceptable',
        message: 'Respuesta aceptable, pero podría mejorar.',
        suggestions: exchange.hints.slice(0, 2)
      }
    }

    return {
      level: 'needs_work',
      message: 'Intenta de nuevo. Aquí tienes algunas pistas:',
      suggestions: exchange.hints,
      examples: exchange.goodExamples
    }
  }
}

// Singleton instance
export const conversationEngine = new ConversationEngine()

export default conversationEngine
