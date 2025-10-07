/**
 * PromptsExercise - Ejercicio basado en prompts
 *
 * Ejercicio donde el usuario completa oraciones o responde a prompts específicos
 * usando el tiempo verbal objetivo. Ideal para práctica estructurada y específica.
 *
 * @class PromptsExercise
 * @extends ExerciseBase
 */

import { ExerciseBase } from '../core/ExerciseBase.js';
import { createLogger } from '../../utils/logger.js';
import { EXERCISE_TYPES } from '../core/constants.js';

const logger = createLogger('PromptsExercise');

export class PromptsExercise extends ExerciseBase {
  /**
   * Constructor del ejercicio de prompts
   * @param {Object} config - Configuración del ejercicio
   */
  constructor(config) {
    super({
      ...config,
      type: EXERCISE_TYPES.PROMPTS
    });

    this.prompts = config.prompts || [];
    this.currentPromptIndex = 0;
    this.promptResponses = [];
    this.completedPrompts = 0;

    logger.debug(`PromptsExercise created: ${this.id} with ${this.prompts.length} prompts`);
  }

  /**
   * Inicializa el ejercicio de prompts
   */
  async initialize() {
    await super.initialize();

    if (!this.prompts || this.prompts.length === 0) {
      throw new Error('Prompts exercise requires prompts');
    }

    logger.info(`Prompts exercise initialized with ${this.prompts.length} prompts`);
  }

  /**
   * Obtiene el siguiente paso del ejercicio
   * @returns {Object|null} Información del paso actual
   */
  getNextStep() {
    if (this.isComplete()) {
      return null;
    }

    const currentPrompt = this.prompts[this.currentPromptIndex];

    return {
      type: 'prompt_input',
      title: this.title,
      description: this.description,
      currentPrompt: {
        ...currentPrompt,
        index: this.currentPromptIndex + 1,
        total: this.prompts.length
      },
      progress: {
        current: this.currentPromptIndex + 1,
        total: this.prompts.length,
        percentage: Math.round(((this.currentPromptIndex + 1) / this.prompts.length) * 100)
      },
      instructions: this.getInstructions()
    };
  }

  /**
   * Obtiene las instrucciones para el usuario
   * @returns {string} Instrucciones formateadas
   */
  getInstructions() {
    const promptsLeft = this.prompts.length - this.currentPromptIndex;
    const tenseDescription = this.getTenseDescription();

    if (promptsLeft === 1) {
      return `Completa el último prompt usando ${tenseDescription}.`;
    } else {
      return `Completa cada prompt usando ${tenseDescription}. Te quedan ${promptsLeft} prompts.`;
    }
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
      cond: 'condicional',
      subjPres: 'subjuntivo presente',
      subjImpf: 'subjuntivo imperfecto',
      plusc: 'pluscuamperfecto',
      futPerf: 'futuro perfecto',
      condPerf: 'condicional perfecto',
      subjPerf: 'subjuntivo perfecto',
      subjPlusc: 'subjuntivo pluscuamperfecto'
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
        feedback: 'Por favor, revisa tu respuesta e inténtalo de nuevo.',
        currentStep: this.getNextStep()
      };
    }

    // Obtener prompt actual
    const currentPrompt = this.prompts[this.currentPromptIndex];

    // Agregar respuesta del usuario
    this.addUserResponse(response, {
      promptIndex: this.currentPromptIndex,
      prompt: currentPrompt.prompt || currentPrompt.text,
      expected: currentPrompt.expected
    });

    // Analizar la respuesta
    const analysis = await this.analyzeResponse(response, currentPrompt);

    // Guardar resultado del prompt
    this.promptResponses[this.currentPromptIndex] = {
      prompt: currentPrompt,
      response,
      analysis,
      correct: analysis.isCorrect,
      timestamp: Date.now()
    };

    // Actualizar progreso
    if (analysis.isCorrect) {
      this.completedPrompts++;
    }

    // Avanzar al siguiente prompt
    this.currentPromptIndex++;
    this.currentStep = this.currentPromptIndex;

    const isLastPrompt = this.currentPromptIndex >= this.prompts.length;

    return {
      success: analysis.isCorrect,
      analysis,
      feedback: this.generateFeedback(analysis, currentPrompt),
      nextStep: isLastPrompt ? null : this.getNextStep(),
      isComplete: isLastPrompt,
      progressUpdate: {
        completed: this.completedPrompts,
        total: this.prompts.length,
        current: this.currentPromptIndex
      }
    };
  }

  /**
   * Analiza la respuesta del usuario para un prompt específico
   * @param {string} response - Respuesta a analizar
   * @param {Object} prompt - Prompt correspondiente
   * @returns {Object} Análisis de la respuesta
   */
  async analyzeResponse(response, _prompt) {
    const userText = response.toLowerCase();
    const expectedVerbs = prompt.expected || [];
    const foundVerbs = [];
    const missingVerbs = [];

    // Analizar cada verbo esperado
    for (const expectedVerb of expectedVerbs) {
      const normalizedUser = this.normalizeText(userText);
      const normalizedVerb = this.normalizeText(expectedVerb);

      // Buscar el verbo usando expresión regular
      const regex = new RegExp(`\\b${normalizedVerb.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');

      if (regex.test(normalizedUser)) {
        foundVerbs.push(expectedVerb);
      } else {
        // También verificar coincidencias parciales para retroalimentación
        if (normalizedUser.includes(normalizedVerb.substring(0, 4))) {
          missingVerbs.push({
            verb: expectedVerb,
            reason: 'partial_match',
            suggestion: 'Verifica la conjugación'
          });
        } else {
          missingVerbs.push({
            verb: expectedVerb,
            reason: 'not_found',
            suggestion: 'Asegúrate de incluir este verbo'
          });
        }
      }
    }

    // Determinar si es correcto (encontró al menos uno de los verbos esperados)
    const isCorrect = foundVerbs.length > 0;
    const completionPercentage = foundVerbs.length / expectedVerbs.length;

    return {
      isCorrect,
      foundVerbs,
      missingVerbs,
      completionPercentage,
      expectedCount: expectedVerbs.length,
      foundCount: foundVerbs.length,
      responseLength: response.length,
      wordCount: response.trim().split(/\s+/).length,
      verbUsageRate: foundVerbs.length / Math.max(expectedVerbs.length, 1)
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
   * @param {Object} prompt - Prompt correspondiente
   * @returns {string} Mensaje de feedback
   */
  generateFeedback(analysis, _prompt) {
    if (analysis.isCorrect) {
      return this.getPositiveFeedback(analysis, _prompt);
    } else {
      return this.getCorrectiveFeedback(analysis, _prompt);
    }
  }

  /**
   * Genera feedback positivo
   * @param {Object} analysis - Análisis de la respuesta
   * @param {Object} prompt - Prompt correspondiente
   * @returns {string} Feedback positivo
   */
  getPositiveFeedback(analysis, _prompt) {
    const messages = [
      '¡Excelente! Has completado el prompt correctamente.',
      '¡Muy bien! Tu respuesta usa el tiempo verbal adecuado.',
      '¡Perfecto! Has demostrado buen dominio del tiempo verbal.'
    ];

    let feedback = messages[Math.floor(Math.random() * messages.length)];

    // Mencionar verbos específicos encontrados
    if (analysis.foundVerbs.length > 0) {
      feedback += ` Has usado correctamente: ${analysis.foundVerbs.join(', ')}.`;
    }

    // Agregar encouragement si queda más de un prompt
    if (this.currentPromptIndex < this.prompts.length - 1) {
      feedback += ' ¡Continúa con el siguiente!';
    }

    return feedback;
  }

  /**
   * Genera feedback correctivo
   * @param {Object} analysis - Análisis de la respuesta
   * @param {Object} prompt - Prompt correspondiente
   * @returns {string} Feedback correctivo
   */
  getCorrectiveFeedback(analysis, _prompt) {
    let feedback = '';

    if (analysis.missingVerbs.length > 0) {
      const missingVerbNames = analysis.missingVerbs.map(mv => mv.verb || mv).join(', ');

      if (analysis.missingVerbs.length === 1) {
        feedback = `Intenta usar: ${missingVerbNames}. `;
      } else {
        feedback = `Intenta usar alguno de estos verbos: ${missingVerbNames}. `;
      }
    }

    // Agregar sugerencia específica del tiempo verbal
    feedback += `Recuerda usar ${this.getTenseDescription()} para completar este prompt.`;

    // Si encontró algunos verbos, mencionarlos positivamente
    if (analysis.foundVerbs.length > 0) {
      feedback += ` Ya has usado correctamente: ${analysis.foundVerbs.join(', ')}.`;
    }

    return feedback;
  }

  /**
   * Verifica si el ejercicio está completo
   * @returns {boolean} True si está completo
   */
  isComplete() {
    return this.currentPromptIndex >= this.prompts.length;
  }

  /**
   * Obtiene el número total de pasos
   * @returns {number} Número total de pasos
   */
  getTotalSteps() {
    return this.prompts.length;
  }

  /**
   * Obtiene configuración para el renderizador
   * @returns {Object} Configuración de renderizado
   */
  getRenderConfig() {
    const baseConfig = super.getRenderConfig();
    const currentPrompt = this.prompts[this.currentPromptIndex];

    return {
      ...baseConfig,
      totalPrompts: this.prompts.length,
      currentPromptIndex: this.currentPromptIndex,
      currentPrompt,
      showProgress: true,
      inputType: 'text',
      placeholder: 'Completa tu respuesta aquí...',
      minLength: 5,
      maxLength: 200,
      showHints: true,
      instructions: this.getInstructions()
    };
  }

  /**
   * Obtiene estadísticas del ejercicio
   * @returns {Object} Estadísticas detalladas
   */
  getExerciseStats() {
    const totalPrompts = this.prompts.length;
    const completedCount = this.promptResponses.filter(r => r && r.correct).length;
    const attemptedCount = this.promptResponses.filter(r => r !== undefined).length;

    return {
      totalPrompts,
      completedCount,
      attemptedCount,
      completionRate: completedCount / totalPrompts,
      attemptRate: attemptedCount / totalPrompts,
      averageResponseLength: this.getAverageResponseLength(),
      verbUsageStats: this.getVerbUsageStats()
    };
  }

  /**
   * Obtiene la longitud promedio de respuestas
   * @returns {number} Longitud promedio
   */
  getAverageResponseLength() {
    const responses = this.promptResponses.filter(r => r && r.response);
    if (responses.length === 0) return 0;

    const totalLength = responses.reduce((sum, r) => sum + r.response.length, 0);
    return totalLength / responses.length;
  }

  /**
   * Obtiene estadísticas de uso de verbos
   * @returns {Object} Estadísticas de verbos
   */
  getVerbUsageStats() {
    const allExpectedVerbs = this.prompts.flatMap(p => p.expected || []);
    const allFoundVerbs = this.promptResponses
      .filter(r => r && r.analysis)
      .flatMap(r => r.analysis.foundVerbs || []);

    return {
      totalExpected: allExpectedVerbs.length,
      totalFound: allFoundVerbs.length,
      uniqueVerbsExpected: [...new Set(allExpectedVerbs)].length,
      uniqueVerbsFound: [...new Set(allFoundVerbs)].length,
      verbUsageRate: allFoundVerbs.length / Math.max(allExpectedVerbs.length, 1)
    };
  }

  /**
   * Obtiene pistas para el prompt actual
   * @returns {string[]} Lista de pistas
   */
  getCurrentHints() {
    if (this.isComplete()) return [];

    const currentPrompt = this.prompts[this.currentPromptIndex];
    const hints = [];

    // Pista sobre verbos esperados
    if (currentPrompt.expected && currentPrompt.expected.length > 0) {
      hints.push(`Verbos sugeridos: ${currentPrompt.expected.join(', ')}`);
    }

    // Pista sobre el tiempo verbal
    hints.push(`Usa ${this.getTenseDescription()}`);

    // Pista específica del contexto si está disponible
    if (currentPrompt.context) {
      const contextHints = {
        advice: 'Da un consejo usando el subjuntivo',
        future_plans: 'Habla sobre planes futuros',
        past_events: 'Describe algo que ya pasó',
        hypothetical: 'Imagina una situación hipotética'
      };

      if (contextHints[currentPrompt.context]) {
        hints.push(contextHints[currentPrompt.context]);
      }
    }

    return hints;
  }

  /**
   * Reinicia el ejercicio específico
   */
  reset() {
    super.reset();
    this.currentPromptIndex = 0;
    this.promptResponses = [];
    this.completedPrompts = 0;
  }

  /**
   * Obtiene el resumen completo del ejercicio
   * @returns {Object} Resumen detallado
   */
  getExerciseSummary() {
    return {
      ...this.getMetadata(),
      prompts: this.prompts,
      responses: this.promptResponses,
      stats: this.getExerciseStats(),
      finalScore: this.calculateFinalScore()
    };
  }

  /**
   * Calcula la puntuación final del ejercicio
   * @returns {number} Puntuación (0-1)
   */
  calculateFinalScore() {
    const stats = this.getExerciseStats();
    return stats.completionRate;
  }
}