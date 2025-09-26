/**
 * TimelineExercise - Ejercicio de línea de tiempo
 *
 * Ejercicio donde el usuario describe eventos siguiendo una línea de tiempo específica.
 * Ideal para practicar secuencias de eventos en pasado o rutinas.
 *
 * @class TimelineExercise
 * @extends ExerciseBase
 */

import { ExerciseBase } from '../core/ExerciseBase.js';
import { createLogger } from '../../utils/logger.js';
import { EXERCISE_TYPES } from '../core/constants.js';

const logger = createLogger('TimelineExercise');

export class TimelineExercise extends ExerciseBase {
  /**
   * Constructor del ejercicio de timeline
   * @param {Object} config - Configuración del ejercicio
   */
  constructor(config) {
    super({
      ...config,
      type: EXERCISE_TYPES.TIMELINE
    });

    this.events = config.events || [];
    this.expectedVerbs = config.expectedVerbs || [];
    this.currentEventIndex = 0;
    this.foundVerbs = [];
    this.userStory = '';

    logger.debug(`TimelineExercise created: ${this.id} with ${this.events.length} events`);
  }

  /**
   * Inicializa el ejercicio de timeline
   */
  async initialize() {
    await super.initialize();

    if (!this.events || this.events.length === 0) {
      throw new Error('Timeline exercise requires events');
    }

    if (!this.expectedVerbs || this.expectedVerbs.length === 0) {
      throw new Error('Timeline exercise requires expected verbs');
    }

    logger.info(`Timeline exercise initialized with ${this.events.length} events`);
  }

  /**
   * Obtiene el siguiente paso del ejercicio
   * @returns {Object|null} Información del paso actual
   */
  getNextStep() {
    if (this.isComplete()) {
      return null;
    }

    return {
      type: 'timeline_input',
      title: this.title,
      description: this.description,
      events: this.events,
      currentStep: this.currentStep,
      totalSteps: this.getTotalSteps(),
      instructions: this.getInstructions()
    };
  }

  /**
   * Obtiene las instrucciones para el usuario
   * @returns {string} Instrucciones formateadas
   */
  getInstructions() {
    return `Describe la historia siguiendo la línea de tiempo. Usa los verbos sugeridos en cada evento y escribe en ${this.getTenseDescription()}.`;
  }

  /**
   * Obtiene la descripción del tiempo verbal
   * @returns {string} Descripción del tiempo verbal
   */
  getTenseDescription() {
    const tenseDescriptions = {
      pres: 'presente',
      pretIndef: 'pretérito indefinido',
      impf: 'imperfecto',
      fut: 'futuro',
      pretPerf: 'pretérito perfecto',
      cond: 'condicional'
    };

    return tenseDescriptions[this.tense] || this.tense;
  }

  /**
   * Procesa la respuesta del usuario
   * @param {string} response - Respuesta del usuario
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processResponse(response) {
    // Validar respuesta
    const validation = this.validateResponse(response);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        feedback: 'Por favor, revisa tu respuesta e inténtalo de nuevo.'
      };
    }

    // Agregar respuesta del usuario
    this.addUserResponse(response, { step: 'timeline_completion' });
    this.userStory = response;

    // Analizar la respuesta
    const analysis = await this.analyzeResponse(response);

    // Avanzar paso
    this.currentStep = 1;

    return {
      success: analysis.isCorrect,
      analysis,
      feedback: this.generateFeedback(analysis),
      nextStep: this.getNextStep()
    };
  }

  /**
   * Analiza la respuesta del usuario
   * @param {string} response - Respuesta a analizar
   * @returns {Object} Análisis de la respuesta
   */
  async analyzeResponse(response) {
    const userText = response.toLowerCase();
    const foundVerbs = [];
    const missingVerbs = [];

    // Analizar cada verbo esperado
    for (const verb of this.expectedVerbs) {
      const normalizedUser = this.normalizeText(userText);
      const normalizedVerb = this.normalizeText(verb);

      // Buscar el verbo usando expresión regular con límites de palabra
      const regex = new RegExp(`\\b${normalizedVerb.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');

      if (regex.test(normalizedUser)) {
        foundVerbs.push(verb);
      } else {
        missingVerbs.push(verb);
      }
    }

    const isCorrect = missingVerbs.length === 0;
    const completionPercentage = foundVerbs.length / this.expectedVerbs.length;

    // Almacenar resultados
    this.foundVerbs = foundVerbs;

    return {
      isCorrect,
      foundVerbs,
      missingVerbs,
      completionPercentage,
      responseLength: response.length,
      wordCount: response.trim().split(/\s+/).length,
      verbUsageRate: foundVerbs.length / this.expectedVerbs.length
    };
  }

  /**
   * Normaliza texto para comparación
   * @param {string} text - Texto a normalizar
   * @returns {string} Texto normalizado
   */
  normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  /**
   * Genera feedback basado en el análisis
   * @param {Object} analysis - Análisis de la respuesta
   * @returns {string} Mensaje de feedback
   */
  generateFeedback(analysis) {
    if (analysis.isCorrect) {
      return this.getPositiveFeedback(analysis);
    } else {
      return this.getCorrectiveFeedback(analysis);
    }
  }

  /**
   * Genera feedback positivo
   * @param {Object} analysis - Análisis de la respuesta
   * @returns {string} Feedback positivo
   */
  getPositiveFeedback(analysis) {
    const messages = [
      '¡Excelente! Has usado todos los verbos correctamente en tu historia.',
      '¡Muy bien! Tu narrativa sigue perfectamente la línea de tiempo.',
      '¡Perfecto! Has demostrado un buen dominio del tiempo verbal.'
    ];

    let feedback = messages[Math.floor(Math.random() * messages.length)];

    // Agregar comentario sobre la calidad del texto
    if (analysis.wordCount > 50) {
      feedback += ' Tu respuesta es detallada y completa.';
    }

    return feedback;
  }

  /**
   * Genera feedback correctivo
   * @param {Object} analysis - Análisis de la respuesta
   * @returns {string} Feedback correctivo
   */
  getCorrectiveFeedback(analysis) {
    let feedback = '';

    if (analysis.missingVerbs.length === 1) {
      feedback = `Falta usar correctamente: ${analysis.missingVerbs[0]}. Revisa la conjugación.`;
    } else if (analysis.missingVerbs.length > 1) {
      feedback = `Faltan ${analysis.missingVerbs.length} verbos: ${analysis.missingVerbs.join(', ')}. `;
      feedback += 'Revisa las conjugaciones y asegúrate de usar todos los verbos sugeridos.';
    }

    // Agregar sugerencias específicas
    if (analysis.foundVerbs.length > 0) {
      feedback += ` Has usado correctamente: ${analysis.foundVerbs.join(', ')}.`;
    }

    // Sugerencia sobre el tiempo verbal
    feedback += ` Recuerda usar ${this.getTenseDescription()} para contar la historia.`;

    return feedback;
  }

  /**
   * Verifica si el ejercicio está completo
   * @returns {boolean} True si está completo
   */
  isComplete() {
    return this.currentStep >= this.getTotalSteps();
  }

  /**
   * Obtiene el número total de pasos
   * @returns {number} Número total de pasos
   */
  getTotalSteps() {
    return 1; // Timeline es un solo paso
  }

  /**
   * Obtiene configuración para el renderizador
   * @returns {Object} Configuración de renderizado
   */
  getRenderConfig() {
    const baseConfig = super.getRenderConfig();

    return {
      ...baseConfig,
      events: this.events,
      expectedVerbs: this.expectedVerbs,
      showTimeline: true,
      inputType: 'textarea',
      placeholder: 'Escribe tu historia siguiendo la línea de tiempo...',
      minLength: 50,
      maxLength: 500,
      showWordCount: true,
      instructions: this.getInstructions()
    };
  }

  /**
   * Obtiene el resumen del ejercicio
   * @returns {Object} Resumen completo
   */
  getExerciseSummary() {
    return {
      ...this.getMetadata(),
      events: this.events,
      expectedVerbs: this.expectedVerbs,
      foundVerbs: this.foundVerbs,
      userStory: this.userStory,
      analysis: this.lastAnalysis,
      timelineData: {
        totalEvents: this.events.length,
        eventsCompleted: this.isComplete() ? this.events.length : 0,
        verbsExpected: this.expectedVerbs.length,
        verbsFound: this.foundVerbs.length
      }
    };
  }

  /**
   * Obtiene pistas para ayudar al usuario
   * @returns {string[]} Lista de pistas
   */
  getHints() {
    const hints = [];

    // Pista sobre verbos faltantes
    if (this.expectedVerbs.length > 0) {
      hints.push(`Asegúrate de usar estos verbos: ${this.expectedVerbs.join(', ')}`);
    }

    // Pista sobre el tiempo verbal
    hints.push(`Recuerda escribir en ${this.getTenseDescription()}`);

    // Pista sobre la estructura
    hints.push('Sigue el orden de los eventos mostrados en la línea de tiempo');

    // Pista sobre la longitud
    hints.push('Escribe al menos 3-4 oraciones para contar una historia completa');

    return hints;
  }

  /**
   * Reinicia el ejercicio específico
   */
  reset() {
    super.reset();
    this.currentEventIndex = 0;
    this.foundVerbs = [];
    this.userStory = '';
    this.lastAnalysis = null;
  }
}