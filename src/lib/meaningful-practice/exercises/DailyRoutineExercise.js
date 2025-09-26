/**
 * DailyRoutineExercise - Ejercicio de rutina diaria
 *
 * Ejercicio donde el usuario describe rutinas usando prompts visuales
 * organizados por momentos del día o actividades específicas.
 *
 * @class DailyRoutineExercise
 * @extends ExerciseBase
 */

import { ExerciseBase } from '../core/ExerciseBase.js';
import { createLogger } from '../../utils/logger.js';
import { EXERCISE_TYPES } from '../core/constants.js';

const logger = createLogger('DailyRoutineExercise');

export class DailyRoutineExercise extends ExerciseBase {
  constructor(config) {
    super({
      ...config,
      type: EXERCISE_TYPES.DAILY_ROUTINE
    });

    this.prompts = config.prompts || [];
    this.foundVerbs = [];
    this.userDescription = '';

    logger.debug(`DailyRoutineExercise created: ${this.id} with ${this.prompts.length} prompts`);
  }

  async initialize() {
    await super.initialize();

    if (!this.prompts || this.prompts.length === 0) {
      throw new Error('Daily routine exercise requires prompts');
    }

    logger.info(`Daily routine exercise initialized`);
  }

  getNextStep() {
    if (this.isComplete()) {
      return null;
    }

    return {
      type: 'daily_routine_input',
      title: this.title,
      description: this.description,
      prompts: this.prompts,
      instructions: this.getInstructions()
    };
  }

  getInstructions() {
    return `Describe las actividades usando ${this.getTenseDescription()}. Incluye los verbos sugeridos en cada prompt.`;
  }

  getTenseDescription() {
    const tenseDescriptions = {
      pres: 'presente',
      impf: 'imperfecto',
      fut: 'futuro'
    };
    return tenseDescriptions[this.tense] || this.tense;
  }

  async processResponse(response) {
    const validation = this.validateResponse(response);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        feedback: 'Por favor, escribe una descripción más detallada.'
      };
    }

    this.addUserResponse(response, { step: 'routine_description' });
    this.userDescription = response;

    const analysis = await this.analyzeResponse(response);
    this.currentStep = 1;

    return {
      success: analysis.isCorrect,
      analysis,
      feedback: this.generateFeedback(analysis),
      nextStep: this.getNextStep()
    };
  }

  async analyzeResponse(response) {
    const userText = response.toLowerCase();
    const foundVerbs = [];
    const missingVerbs = [];

    // Analizar cada prompt para encontrar verbos
    for (const prompt of this.prompts) {
      const promptFoundVerbs = [];

      for (const expectedVerb of prompt.expected) {
        const normalizedUser = this.normalizeText(userText);
        const normalizedVerb = this.normalizeText(expectedVerb);

        const regex = new RegExp(`\\b${normalizedVerb.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');

        if (regex.test(normalizedUser)) {
          foundVerbs.push(expectedVerb);
          promptFoundVerbs.push(expectedVerb);
        }
      }

      if (promptFoundVerbs.length === 0) {
        missingVerbs.push(...prompt.expected);
      }
    }

    const totalExpected = this.prompts.reduce((sum, p) => sum + p.expected.length, 0);
    const isCorrect = missingVerbs.length === 0;

    this.foundVerbs = foundVerbs;

    return {
      isCorrect,
      foundVerbs,
      missingVerbs: [...new Set(missingVerbs)], // Eliminar duplicados
      completionPercentage: foundVerbs.length / totalExpected,
      totalExpected,
      responseLength: response.length,
      wordCount: response.trim().split(/\s+/).length
    };
  }

  normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  generateFeedback(analysis) {
    if (analysis.isCorrect) {
      return '¡Excelente! Has descrito la rutina usando todos los verbos necesarios.';
    } else {
      let feedback = '';

      if (analysis.missingVerbs.length > 0) {
        feedback = `Faltan algunos verbos: ${analysis.missingVerbs.join(', ')}. `;
      }

      if (analysis.foundVerbs.length > 0) {
        feedback += `Has usado correctamente: ${analysis.foundVerbs.join(', ')}. `;
      }

      feedback += `Recuerda usar ${this.getTenseDescription()} para describir las actividades.`;

      return feedback;
    }
  }

  isComplete() {
    return this.currentStep >= 1;
  }

  getTotalSteps() {
    return 1;
  }

  getRenderConfig() {
    const baseConfig = super.getRenderConfig();

    return {
      ...baseConfig,
      prompts: this.prompts,
      showPromptIcons: true,
      inputType: 'textarea',
      placeholder: 'Describe la rutina diaria...',
      minLength: 100,
      maxLength: 500,
      showWordCount: true
    };
  }

  reset() {
    super.reset();
    this.foundVerbs = [];
    this.userDescription = '';
  }
}