/**
 * ChatExercise - Ejercicio de conversación
 *
 * Ejercicio conversacional donde el usuario interactúa con un chatbot
 * siguiendo un script predefinido, ideal para práctica comunicativa.
 *
 * @class ChatExercise
 * @extends ExerciseBase
 */

import { ExerciseBase } from '../core/ExerciseBase.js';
import { createLogger } from '../../utils/logger.js';
import { EXERCISE_TYPES } from '../core/constants.js';

const logger = createLogger('ChatExercise');

export class ChatExercise extends ExerciseBase {
  constructor(config) {
    super({
      ...config,
      type: EXERCISE_TYPES.CHAT
    });

    this.initialMessage = config.initialMessage || '';
    this.script = config.script || [];
    this.messages = [];
    this.scriptIndex = 0;
    this.chatEnded = false;

    logger.debug(`ChatExercise created: ${this.id} with ${this.script.length} script nodes`);
  }

  async initialize() {
    await super.initialize();

    if (!this.initialMessage) {
      throw new Error('Chat exercise requires initial message');
    }

    // Agregar mensaje inicial
    this.messages.push({
      author: 'bot',
      text: this.initialMessage,
      timestamp: Date.now()
    });

    logger.info(`Chat exercise initialized`);
  }

  getNextStep() {
    if (this.isComplete()) {
      return null;
    }

    return {
      type: 'chat_interface',
      title: this.title,
      description: this.description,
      messages: this.messages,
      chatEnded: this.chatEnded,
      currentScript: this.script[this.scriptIndex],
      instructions: this.getInstructions()
    };
  }

  getInstructions() {
    return `Responde al chatbot usando ${this.getTenseDescription()}. Intenta usar las palabras clave apropiadas.`;
  }

  getTenseDescription() {
    const tenseDescriptions = {
      pres: 'presente',
      pretIndef: 'pretérito indefinido',
      impf: 'imperfecto',
      fut: 'futuro',
      pretPerf: 'pretérito perfecto',
      cond: 'condicional',
      subjPres: 'subjuntivo presente'
    };
    return tenseDescriptions[this.tense] || this.tense;
  }

  async processResponse(response) {
    const validation = this.validateResponse(response);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        feedback: 'Por favor, escribe una respuesta más completa.'
      };
    }

    // Agregar mensaje del usuario
    this.addUserMessage(response);
    this.addUserResponse(response, { scriptIndex: this.scriptIndex });

    // Analizar respuesta
    const analysis = await this.analyzeResponse(response);

    if (analysis.keywordMatched) {
      // Respuesta correcta, avanzar script
      const botResponse = this.script[this.scriptIndex].botResponse;
      this.addBotMessage(botResponse);

      this.scriptIndex++;
      this.currentStep = this.scriptIndex;

      if (this.scriptIndex >= this.script.length) {
        this.chatEnded = true;
      }

      return {
        success: true,
        analysis,
        feedback: null, // El bot response es el feedback
        nextStep: this.getNextStep()
      };
    } else {
      // Dar pista
      const hint = this.generateHint();
      this.addBotMessage(hint);

      return {
        success: false,
        analysis,
        feedback: null, // El hint es el feedback
        nextStep: this.getNextStep()
      };
    }
  }

  async analyzeResponse(response) {
    const userText = response.toLowerCase();
    const currentScript = this.script[this.scriptIndex];

    if (!currentScript) {
      return { keywordMatched: false, keywords: [] };
    }

    const foundKeywords = [];

    for (const keyword of currentScript.userKeywords) {
      const normalizedKeyword = this.normalizeText(keyword);
      const normalizedUser = this.normalizeText(userText);

      if (normalizedUser.includes(normalizedKeyword)) {
        foundKeywords.push(keyword);
      }
    }

    return {
      keywordMatched: foundKeywords.length > 0,
      keywords: foundKeywords,
      expectedKeywords: currentScript.userKeywords,
      responseLength: response.length
    };
  }

  normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  generateHint() {
    const hints = {
      pres: 'Cuéntame usando verbos en presente. Por ejemplo: "Yo trabajo en..." o "Normalmente voy a..."',
      pretIndef: 'Usa verbos en pretérito. Por ejemplo: "Ayer fui a..." o "El fin de semana hice..."',
      fut: 'Habla sobre el futuro. Por ejemplo: "El próximo año haré..." o "Viajaré a..."'
    };

    return hints[this.tense] || `Intenta usar un verbo en ${this.getTenseDescription()}.`;
  }

  addUserMessage(text) {
    this.messages.push({
      author: 'user',
      text,
      timestamp: Date.now()
    });
  }

  addBotMessage(text) {
    this.messages.push({
      author: 'bot',
      text,
      timestamp: Date.now()
    });
  }

  isComplete() {
    return this.chatEnded;
  }

  getTotalSteps() {
    return this.script.length;
  }

  getRenderConfig() {
    const baseConfig = super.getRenderConfig();

    return {
      ...baseConfig,
      chatInterface: true,
      messages: this.messages,
      inputPlaceholder: 'Escribe tu respuesta...',
      showTypingIndicator: false,
      allowEmojis: true,
      maxMessageLength: 200
    };
  }

  reset() {
    super.reset();
    this.messages = [{
      author: 'bot',
      text: this.initialMessage,
      timestamp: Date.now()
    }];
    this.scriptIndex = 0;
    this.chatEnded = false;
  }
}