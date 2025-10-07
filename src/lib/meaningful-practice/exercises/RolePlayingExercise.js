/**
 * RolePlayingExercise - Ejercicio de interpretación de roles
 *
 * Permite a los usuarios participar en escenarios comunicativos simulados
 * donde deben asumir un rol específico y responder a situaciones contextualizadas.
 *
 * @class RolePlayingExercise
 * @extends ExerciseBase
 */

import { ExerciseBase } from '../core/ExerciseBase.js';
import { createLogger } from '../../utils/logger.js';
import { EXERCISE_TYPES } from '../core/constants.js';

const logger = createLogger('RolePlayingExercise');

export class RolePlayingExercise extends ExerciseBase {
  constructor(config) {
    super({
      ...config,
      type: EXERCISE_TYPES.ROLE_PLAYING
    });

    this.scenario = config.scenario || {};
    this.phases = config.phases || [];
    this.evaluationCriteria = config.evaluationCriteria || {};

    this.currentPhase = 0;
    this.phaseResponses = [];
    this.conversationHistory = [];
    this.npcPersonality = this.generateNPCPersonality();

    logger.debug(`RolePlayingExercise created: ${this.id} with ${this.phases.length} phases`);
  }

  async initialize() {
    await super.initialize();

    if (!this.scenario || !this.scenario.context) {
      throw new Error('Role playing exercise requires scenario context');
    }

    if (!this.phases || this.phases.length === 0) {
      throw new Error('Role playing exercise requires phases');
    }

    // Inicializar la conversación con el contexto
    this.conversationHistory.push({
      type: 'system',
      content: this.scenario.context,
      timestamp: Date.now()
    });

    logger.info(`Role playing exercise initialized: ${this.scenario.context}`);
  }

  generateNPCPersonality() {
    // Generar personalidad básica para el NPC basada en el rol
    const personalities = {
      'entrevistador': { formal: true, tone: 'professional', patience: 'medium' },
      'médico': { formal: true, tone: 'caring', patience: 'high' },
      'recepcionista': { formal: false, tone: 'friendly', patience: 'medium' },
      'vendedor': { formal: false, tone: 'enthusiastic', patience: 'high' }
    };

    const roleKey = Object.keys(personalities).find(key =>
      this.scenario.npcRole.toLowerCase().includes(key)
    );

    return personalities[roleKey] || { formal: false, tone: 'neutral', patience: 'medium' };
  }

  getNextStep() {
    if (this.isComplete()) {
      return {
        type: 'role_playing_complete',
        title: this.title,
        summary: this.generateSummary(),
        evaluation: this.evaluatePerformance(),
        nextStep: null
      };
    }

    const phase = this.phases[this.currentPhase];
    if (!phase) {
      return null;
    }

    return {
      type: 'role_playing_interaction',
      title: this.title,
      phaseTitle: phase.title,
      scenario: this.scenario,
      npcMessage: this.adaptNPCMessage(phase.npcMessage),
      expectedElements: phase.expectedElements,
      targetVerbs: phase.targetVerbs,
      phase: this.currentPhase + 1,
      totalPhases: this.phases.length,
      conversationHistory: this.conversationHistory.slice(-10), // Últimas 10 interacciones
      instructions: this.getPhaseInstructions(phase),
      minLength: phase.minLength || 50
    };
  }

  adaptNPCMessage(baseMessage) {
    // Adaptar el mensaje del NPC según su personalidad y el historial de conversación
    let adaptedMessage = baseMessage;

    // Reemplazar placeholders con nombres aleatorios apropiados
    const names = {
      'entrevistador': ['García', 'Rodríguez', 'López', 'Martínez'],
      'médico': ['Dr. Silva', 'Dra. Morales', 'Dr. Herrera', 'Dra. Vega'],
      'recepcionista': ['Carmen', 'Andrea', 'Sofía', 'Elena'],
      'vendedor': ['Miguel', 'Laura', 'Carlos', 'Ana']
    };

    const roleKey = Object.keys(names).find(key =>
      this.scenario.npcRole.toLowerCase().includes(key)
    );

    if (roleKey && names[roleKey]) {
      const randomName = names[roleKey][Math.floor(Math.random() * names[roleKey].length)];
      adaptedMessage = adaptedMessage.replace('[NOMBRE]', randomName);
    }

    // Ajustar formalidad según la personalidad
    if (this.npcPersonality.formal && !adaptedMessage.includes('usted')) {
      adaptedMessage = this.makeMoreFormal(adaptedMessage);
    }

    return adaptedMessage;
  }

  makeMoreFormal(message) {
    // Convertir tuteo a usted cuando sea apropiado
    const formalReplacements = {
      'puedes': 'puede',
      'tienes': 'tiene',
      'eres': 'es',
      'tu ': 'su ',
      'contarme': 'contarme',
      'cuénteme': 'cuénteme'
    };

    let formalMessage = message;
    Object.entries(formalReplacements).forEach(([informal, formal]) => {
      const regex = new RegExp(`\\b${informal}\\b`, 'gi');
      formalMessage = formalMessage.replace(regex, formal);
    });

    return formalMessage;
  }

  getPhaseInstructions(phase) {
    const baseInstructions = `Responde como ${this.scenario.userRole} en esta situación. `;
    const elementsInstruction = phase.expectedElements && phase.expectedElements.length > 0
      ? `Asegúrate de incluir: ${phase.expectedElements.join(', ')}. `
      : '';
    const verbsInstruction = phase.targetVerbs && phase.targetVerbs.length > 0
      ? `Intenta usar algunos de estos verbos: ${phase.targetVerbs.join(', ')}.`
      : '';

    return baseInstructions + elementsInstruction + verbsInstruction;
  }

  async processResponse(response) {
    const validation = this.validateResponse(response);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        feedback: 'Por favor, proporciona una respuesta más completa para continuar la conversación.'
      };
    }

    const currentPhase = this.phases[this.currentPhase];

    // Registrar la respuesta del usuario
    this.conversationHistory.push({
      type: 'user',
      content: response,
      phase: this.currentPhase,
      timestamp: Date.now()
    });

    this.addUserResponse(response, {
      phase: this.currentPhase,
      phaseTitle: currentPhase.title
    });

    // Analizar la respuesta
    const analysis = await this.analyzePhaseResponse(response, currentPhase);

    // Guardar análisis de la fase
    this.phaseResponses.push({
      phase: this.currentPhase,
      response,
      analysis,
      timestamp: Date.now()
    });

    // Generar respuesta del NPC si no es la última fase
    const npcResponse = this.generateNPCResponse(response, analysis, currentPhase);
    if (npcResponse) {
      this.conversationHistory.push({
        type: 'npc',
        content: npcResponse,
        phase: this.currentPhase,
        timestamp: Date.now()
      });
    }

    // Avanzar a la siguiente fase
    this.currentPhase++;

    return {
      success: analysis.meetsCriteria,
      analysis,
      npcResponse,
      feedback: this.generatePhaseFeedback(analysis, currentPhase),
      nextStep: this.getNextStep(),
      phaseComplete: true
    };
  }

  async analyzePhaseResponse(response, phase) {
    const analysis = {
      elementsPresent: [],
      elementsMissing: [],
      verbsUsed: [],
      verbsMissing: [],
      lengthScore: 0,
      appropriatenessScore: 0,
      grammarScore: 0,
      meetsCriteria: false,
      suggestions: []
    };

    const normalizedResponse = this.normalizeText(response);

    // Analizar elementos esperados
    if (phase.expectedElements) {
      phase.expectedElements.forEach(element => {
        const elementKeywords = this.extractKeywords(element);
        const hasElement = elementKeywords.some(keyword =>
          normalizedResponse.includes(this.normalizeText(keyword))
        );

        if (hasElement) {
          analysis.elementsPresent.push(element);
        } else {
          analysis.elementsMissing.push(element);
        }
      });
    }

    // Analizar verbos objetivo
    if (phase.targetVerbs) {
      analysis.verbsUsed = this.detectTargetVerbs(response, phase.targetVerbs);
      analysis.verbsMissing = phase.targetVerbs.filter(verb =>
        !analysis.verbsUsed.includes(verb)
      );
    }

    // Calcular puntuaciones
    analysis.lengthScore = this.calculateLengthScore(response, phase.minLength || 50);
    analysis.appropriatenessScore = this.calculateAppropriatenessScore(response);
    analysis.grammarScore = this.calculateBasicGrammarScore(response);

    // Determinar si cumple criterios
    const elementsScore = phase.expectedElements ?
      analysis.elementsPresent.length / phase.expectedElements.length : 1;
    const verbsScore = phase.targetVerbs ?
      Math.min(analysis.verbsUsed.length / Math.min(phase.targetVerbs.length, 3), 1) : 1;

    analysis.meetsCriteria = elementsScore >= 0.7 &&
                            verbsScore >= 0.5 &&
                            analysis.lengthScore >= 0.7 &&
                            analysis.appropriatenessScore >= 0.6;

    // Generar sugerencias
    analysis.suggestions = this.generatePhaseSuggestions(analysis, phase);

    return analysis;
  }

  extractKeywords(element) {
    // Extraer palabras clave de elementos esperados
    const commonWords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'por', 'para', 'con'];
    return element.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
  }

  detectTargetVerbs(response, targetVerbs) {
    const detectedVerbs = [];
    const normalizedResponse = this.normalizeText(response);

    targetVerbs.forEach(verb => {
      // Generar patrones de conjugación para el verbo
      const patterns = this.generateVerbPatterns(verb);
      const isPresent = patterns.some(pattern => pattern.test(normalizedResponse));

      if (isPresent) {
        detectedVerbs.push(verb);
      }
    });

    return detectedVerbs;
  }

  generateVerbPatterns(verb) {
    const patterns = [new RegExp(`\\b${verb}\\b`, 'i')];

    // Patrones básicos de conjugación
    if (verb.endsWith('ar')) {
      const stem = verb.slice(0, -2);
      patterns.push(
        new RegExp(`\\b${stem}(o|as|a|amos|áis|an)\\b`, 'i'),
        new RegExp(`\\b${stem}(é|aste|ó|amos|asteis|aron)\\b`, 'i'),
        new RegExp(`\\b${stem}(aba|abas|aba|ábamos|abais|aban)\\b`, 'i')
      );
    } else if (verb.endsWith('er')) {
      const stem = verb.slice(0, -2);
      patterns.push(
        new RegExp(`\\b${stem}(o|es|e|emos|éis|en)\\b`, 'i'),
        new RegExp(`\\b${stem}(í|iste|ió|imos|isteis|ieron)\\b`, 'i'),
        new RegExp(`\\b${stem}(ía|ías|ía|íamos|íais|ían)\\b`, 'i')
      );
    } else if (verb.endsWith('ir')) {
      const stem = verb.slice(0, -2);
      patterns.push(
        new RegExp(`\\b${stem}(o|es|e|imos|ís|en)\\b`, 'i'),
        new RegExp(`\\b${stem}(í|iste|ió|imos|isteis|ieron)\\b`, 'i'),
        new RegExp(`\\b${stem}(ía|ías|ía|íamos|íais|ían)\\b`, 'i')
      );
    }

    return patterns;
  }

  calculateLengthScore(response, minLength) {
    const wordCount = response.trim().split(/\s+/).length;
    if (wordCount >= minLength) {
      return 1;
    }
    return wordCount / minLength;
  }

  calculateAppropriatenessScore(response) {
    // Evaluar si la respuesta es apropiada para el contexto
    let score = 0.5; // Base score

    // Penalizar respuestas muy cortas o irrelevantes
    if (response.trim().length < 10) {
      score -= 0.3;
    }

    // Bonificar cortesía y formalidad cuando sea apropiado
    const courtesyMarkers = ['por favor', 'gracias', 'disculpe', 'perdón', 'buenos días', 'buenas tardes'];
    const hasCourtesy = courtesyMarkers.some(marker =>
      response.toLowerCase().includes(marker)
    );

    if (hasCourtesy && this.npcPersonality.formal) {
      score += 0.2;
    }

    // Bonificar coherencia contextual
    const contextKeywords = this.getContextKeywords();
    const hasContextual = contextKeywords.some(keyword =>
      response.toLowerCase().includes(keyword)
    );

    if (hasContextual) {
      score += 0.3;
    }

    return Math.min(score, 1);
  }

  getContextKeywords() {
    // Obtener palabras clave relevantes según el escenario
    const keywordMap = {
      'entrevista': ['trabajo', 'experiencia', 'empresa', 'puesto', 'objetivo'],
      'médico': ['síntoma', 'dolor', 'médico', 'salud', 'medicamento'],
      'restaurante': ['mesa', 'reserva', 'comida', 'restaurante', 'cena'],
      'tienda': ['ropa', 'talla', 'precio', 'comprar', 'probar']
    };

    for (const [context, keywords] of Object.entries(keywordMap)) {
      if (this.scenario.context.toLowerCase().includes(context) ||
          this.title.toLowerCase().includes(context)) {
        return keywords;
      }
    }

    return [];
  }

  calculateBasicGrammarScore(response) {
    // Análisis básico de gramática
    let score = 1.0;

    // Penalizar errores obvios
    const ERRORS = [
      /\b(soy|eres|es|somos|son)\s+(trabajando|comiendo|viviendo)\b/gi, // Error ser + gerundio
      /\b(tengo|tienes|tiene|tenemos|tienen)\s+\d+\s+años?\b/gi, // Buen uso de tener edad
      /\bme llamo\s+\w+/gi // Uso correcto de presentación
    ];

    // Este es un análisis muy básico; el LanguageAnalyzer haría uno más sofisticado
    const wordCount = response.trim().split(/\s+/).length;
    if (wordCount < 5) {
      score -= 0.4;
    }

    return Math.max(score, 0.2);
  }

  generateNPCResponse(userResponse, analysis, phase) {
    if (this.currentPhase >= this.phases.length) {
      return null; // No más respuestas, ejercicio completo
    }

    // Generar respuesta contextual del NPC
    let npcResponse = '';

    // Respuesta de reconocimiento
    if (analysis.meetsCriteria) {
      const positiveResponses = [
        'Muy bien, entiendo.',
        'Perfecto, gracias por la información.',
        'Excelente, eso es muy útil.',
        'Muy interesante.'
      ];
      npcResponse = positiveResponses[Math.floor(Math.random() * positiveResponses.length)] + ' ';
    } else {
      const neutralResponses = [
        'Entiendo.',
        'Ya veo.',
        'Comprendo.',
        'Muy bien.'
      ];
      npcResponse = neutralResponses[Math.floor(Math.random() * neutralResponses.length)] + ' ';
    }

    // Pregunta de seguimiento si está disponible
    if (phase.followUpQuestions && phase.followUpQuestions.length > 0) {
      const randomFollowUp = phase.followUpQuestions[Math.floor(Math.random() * phase.followUpQuestions.length)];
      npcResponse += randomFollowUp;
    }

    return npcResponse;
  }

  generatePhaseSuggestions(analysis, phase) {
    const suggestions = [];

    if (analysis.elementsMissing.length > 0) {
      suggestions.push(`Considera incluir: ${analysis.elementsMissing.slice(0, 2).join(', ')}`);
    }

    if (analysis.verbsMissing.length > 0 && analysis.verbsUsed.length === 0) {
      suggestions.push(`Intenta usar verbos como: ${analysis.verbsMissing.slice(0, 3).join(', ')}`);
    }

    if (analysis.lengthScore < 0.7) {
      suggestions.push('Proporciona más detalles en tu respuesta');
    }

    if (analysis.appropriatenessScore < 0.6) {
      suggestions.push('Mantén un tono apropiado para la situación');
    }

    return suggestions;
  }

  generatePhaseFeedback(analysis, phase) {
    let feedback = '';

    if (analysis.meetsCriteria) {
      feedback = '¡Excelente respuesta! Has abordado bien la situación. ';

      if (analysis.elementsPresent.length > 0) {
        feedback += `Has incluido elementos importantes: ${analysis.elementsPresent.slice(0, 2).join(', ')}. `;
      }
    } else {
      feedback = 'Tu respuesta está bien, pero puedes mejorarla. ';

      if (analysis.elementsMissing.length > 0) {
        feedback += `Considera incluir: ${analysis.elementsMissing.slice(0, 2).join(', ')}. `;
      }
    }

    if (analysis.verbsUsed.length > 0) {
      feedback += `Buen uso de verbos: ${analysis.verbsUsed.join(', ')}.`;
    }

    return feedback;
  }

  generateSummary() {
    const totalPhases = this.phases.length;
    const successfulPhases = this.phaseResponses.filter(r => r.analysis.meetsCriteria).length;

    const allVerbsUsed = [...new Set(
      this.phaseResponses.flatMap(r => r.analysis.verbsUsed)
    )];

    const allElementsUsed = [...new Set(
      this.phaseResponses.flatMap(r => r.analysis.elementsPresent)
    )];

    return {
      scenario: this.title,
      totalPhases,
      successfulPhases,
      completionRate: successfulPhases / totalPhases,
      verbsUsed: allVerbsUsed,
      elementsUsed: allElementsUsed,
      conversationLength: this.conversationHistory.length
    };
  }

  evaluatePerformance() {
    const summary = this.generateSummary();
    const criteria = this.evaluationCriteria;

    const evaluation = {
      overall: summary.completionRate,
      strengths: [],
      improvements: [],
      criteria: {}
    };

    // Evaluar cada criterio
    Object.keys(criteria).forEach(criterion => {
      const score = this.calculateCriterionScore(criterion);
      evaluation.criteria[criterion] = {
        score,
        description: criteria[criterion]
      };

      if (score > 0.8) {
        evaluation.strengths.push(criterion);
      } else if (score < 0.6) {
        evaluation.improvements.push(criterion);
      }
    });

    return evaluation;
  }

  calculateCriterionScore(criterion) {
    // Calcular puntuación para cada criterio específico
    const responses = this.phaseResponses;

    switch (criterion) {
      case 'profesionalismo':
      case 'cortesía':
        return responses.reduce((sum, r) => sum + r.analysis.appropriatenessScore, 0) / responses.length;

      case 'coherencia':
      case 'organización':
        return responses.reduce((sum, r) => sum + (r.analysis.elementsPresent.length / (r.analysis.elementsPresent.length + r.analysis.elementsMissing.length || 1)), 0) / responses.length;

      case 'completitud':
      case 'precisión':
        return responses.reduce((sum, r) => sum + (r.analysis.meetsCriteria ? 1 : 0.5), 0) / responses.length;

      case 'gramática':
        return responses.reduce((sum, r) => sum + r.analysis.grammarScore, 0) / responses.length;

      default:
        return 0.7; // Puntuación por defecto
    }
  }

  normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  validateResponse(response) {
    const ERRORS = [];

    if (!response || typeof response !== 'string') {
      errors.push('La respuesta debe ser un texto válido');
    }

    if (response && response.trim().length < 10) {
      errors.push('La respuesta debe tener al menos 10 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  isComplete() {
    return this.currentPhase >= this.phases.length;
  }

  getTotalSteps() {
    return this.phases.length;
  }

  getCurrentStep() {
    return Math.min(this.currentPhase + 1, this.phases.length);
  }

  getRenderConfig() {
    const baseConfig = super.getRenderConfig();

    return {
      ...baseConfig,
      scenario: this.scenario,
      currentPhase: this.currentPhase,
      totalPhases: this.phases.length,
      conversationHistory: this.conversationHistory,
      inputType: 'textarea',
      placeholder: 'Escribe tu respuesta aquí...',
      showCharacterCount: true,
      showPhaseProgress: true,
      enableVoiceInput: true // Para práctica de pronunciación
    };
  }

  reset() {
    super.reset();
    this.currentPhase = 0;
    this.phaseResponses = [];
    this.conversationHistory = [
      {
        type: 'system',
        content: this.scenario.context,
        timestamp: Date.now()
      }
    ];
  }

  // Método para obtener estadísticas del ejercicio
  getExerciseStats() {
    const summary = this.generateSummary();

    return {
      ...super.getExerciseStats(),
      phases: this.phases.length,
      successfulPhases: summary.successfulPhases,
      completionRate: summary.completionRate,
      verbsUsed: summary.verbsUsed.length,
      conversationTurns: this.conversationHistory.filter(h => h.type === 'user').length
    };
  }
}