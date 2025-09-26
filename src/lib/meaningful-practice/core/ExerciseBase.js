/**
 * ExerciseBase - Clase base para todos los tipos de ejercicio
 *
 * Esta clase proporciona la funcionalidad común para todos los ejercicios,
 * incluyendo validación, configuración básica y métodos utilitarios.
 *
 * @abstract
 * @class ExerciseBase
 */

import { createLogger } from '../../utils/logger.js';
import { EXERCISE_TYPES, DIFFICULTY_LEVELS, VALIDATION_LIMITS } from './constants.js';

const logger = createLogger('ExerciseBase');

/**
 * Clase base abstracta para ejercicios
 */
export class ExerciseBase {
  /**
   * Constructor de la clase base
   * @param {Object} config - Configuración del ejercicio
   * @param {string} config.id - ID único del ejercicio
   * @param {string} config.type - Tipo de ejercicio
   * @param {string} config.title - Título del ejercicio
   * @param {string} config.description - Descripción del ejercicio
   * @param {string} config.tense - Tiempo verbal a practicar
   * @param {string} config.difficulty - Nivel de dificultad
   * @param {string} config.category - Categoría temática
   */
  constructor(config) {
    this.validateConfig(config);

    this.id = config.id;
    this.type = config.type;
    this.title = config.title;
    this.description = config.description;
    this.tense = config.tense;
    this.difficulty = config.difficulty || DIFFICULTY_LEVELS.INTERMEDIATE;
    this.category = config.category;
    this.metadata = config.metadata || {};

    // Estado del ejercicio
    this.initialized = false;
    this.startTime = null;
    this.endTime = null;
    this.userResponses = [];
    this.currentStep = 0;

    logger.debug(`Exercise created: ${this.id} (${this.type})`);
  }

  /**
   * Valida la configuración del ejercicio
   * @param {Object} config - Configuración a validar
   * @throws {Error} Si la configuración es inválida
   */
  validateConfig(config) {
    const required = ['id', 'type', 'title', 'description', 'tense'];

    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!Object.values(EXERCISE_TYPES).includes(config.type)) {
      throw new Error(`Invalid exercise type: ${config.type}`);
    }

    if (config.difficulty && !Object.values(DIFFICULTY_LEVELS).includes(config.difficulty)) {
      throw new Error(`Invalid difficulty level: ${config.difficulty}`);
    }
  }

  /**
   * Inicializa el ejercicio
   * @abstract
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      logger.warn(`Exercise ${this.id} already initialized`);
      return;
    }

    this.startTime = Date.now();
    this.initialized = true;

    logger.info(`Exercise ${this.id} initialized`);
  }

  /**
   * Obtiene el siguiente paso del ejercicio
   * @abstract
   * @returns {Object|null} Siguiente paso o null si terminó
   */
  getNextStep() {
    throw new Error('getNextStep must be implemented by subclass');
  }

  /**
   * Procesa una respuesta del usuario
   * @abstract
   * @param {string} response - Respuesta del usuario
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processResponse(response) {
    throw new Error('processResponse must be implemented by subclass');
  }

  /**
   * Verifica si el ejercicio está completo
   * @abstract
   * @returns {boolean} True si está completo
   */
  isComplete() {
    throw new Error('isComplete must be implemented by subclass');
  }

  /**
   * Obtiene el progreso actual del ejercicio
   * @returns {Object} Información de progreso
   */
  getProgress() {
    return {
      exerciseId: this.id,
      currentStep: this.currentStep,
      totalSteps: this.getTotalSteps(),
      percentage: this.getCompletionPercentage(),
      timeSpent: this.getTimeSpent(),
      responses: this.userResponses.length
    };
  }

  /**
   * Obtiene el número total de pasos
   * @abstract
   * @returns {number} Número total de pasos
   */
  getTotalSteps() {
    return 1; // Override en subclases
  }

  /**
   * Calcula el porcentaje de completitud
   * @returns {number} Porcentaje (0-100)
   */
  getCompletionPercentage() {
    const total = this.getTotalSteps();
    if (total === 0) return 100;
    return Math.round((this.currentStep / total) * 100);
  }

  /**
   * Obtiene el tiempo transcurrido en el ejercicio
   * @returns {number} Tiempo en milisegundos
   */
  getTimeSpent() {
    if (!this.startTime) return 0;
    const endTime = this.endTime || Date.now();
    return endTime - this.startTime;
  }

  /**
   * Agrega una respuesta del usuario
   * @param {string} response - Respuesta del usuario
   * @param {Object} metadata - Metadatos adicionales
   */
  addUserResponse(response, metadata = {}) {
    this.userResponses.push({
      text: response,
      timestamp: Date.now(),
      step: this.currentStep,
      metadata
    });

    logger.debug(`User response added to exercise ${this.id}`, {
      step: this.currentStep,
      responseLength: response.length
    });
  }

  /**
   * Valida una respuesta del usuario
   * @param {string} response - Respuesta a validar
   * @returns {Object} Resultado de validación
   */
  validateResponse(response) {
    const validation = {
      valid: true,
      errors: []
    };

    // Validar longitud
    if (response.length < VALIDATION_LIMITS.MIN_RESPONSE_LENGTH) {
      validation.valid = false;
      validation.errors.push({
        type: 'length',
        message: `La respuesta debe tener al menos ${VALIDATION_LIMITS.MIN_RESPONSE_LENGTH} caracteres`
      });
    }

    if (response.length > VALIDATION_LIMITS.MAX_RESPONSE_LENGTH) {
      validation.valid = false;
      validation.errors.push({
        type: 'length',
        message: `La respuesta no puede exceder ${VALIDATION_LIMITS.MAX_RESPONSE_LENGTH} caracteres`
      });
    }

    // Validar número de palabras
    const words = response.trim().split(/\s+/).filter(word => word.length > 0);
    if (words.length < VALIDATION_LIMITS.MIN_WORDS_IN_RESPONSE) {
      validation.valid = false;
      validation.errors.push({
        type: 'content',
        message: `La respuesta debe contener al menos ${VALIDATION_LIMITS.MIN_WORDS_IN_RESPONSE} palabras`
      });
    }

    return validation;
  }

  /**
   * Finaliza el ejercicio
   * @returns {Object} Resumen final del ejercicio
   */
  finalize() {
    if (!this.initialized) {
      throw new Error('Exercise not initialized');
    }

    this.endTime = Date.now();

    const summary = {
      exerciseId: this.id,
      type: this.type,
      tense: this.tense,
      difficulty: this.difficulty,
      category: this.category,
      completed: this.isComplete(),
      duration: this.getTimeSpent(),
      totalResponses: this.userResponses.length,
      progress: this.getProgress()
    };

    logger.info(`Exercise ${this.id} finalized`, summary);
    return summary;
  }

  /**
   * Obtiene metadatos del ejercicio
   * @returns {Object} Metadatos completos
   */
  getMetadata() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      description: this.description,
      tense: this.tense,
      difficulty: this.difficulty,
      category: this.category,
      initialized: this.initialized,
      completed: this.isComplete(),
      progress: this.getProgress(),
      customMetadata: this.metadata
    };
  }

  /**
   * Reinicia el ejercicio
   */
  reset() {
    this.initialized = false;
    this.startTime = null;
    this.endTime = null;
    this.userResponses = [];
    this.currentStep = 0;

    logger.info(`Exercise ${this.id} reset`);
  }

  /**
   * Serializa el estado del ejercicio
   * @returns {Object} Estado serializado
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      description: this.description,
      tense: this.tense,
      difficulty: this.difficulty,
      category: this.category,
      metadata: this.metadata,
      initialized: this.initialized,
      startTime: this.startTime,
      endTime: this.endTime,
      userResponses: this.userResponses,
      currentStep: this.currentStep
    };
  }

  /**
   * Restaura el estado desde datos serializados
   * @param {Object} data - Datos serializados
   */
  deserialize(data) {
    this.initialized = data.initialized || false;
    this.startTime = data.startTime || null;
    this.endTime = data.endTime || null;
    this.userResponses = data.userResponses || [];
    this.currentStep = data.currentStep || 0;

    logger.debug(`Exercise ${this.id} state restored`);
  }

  /**
   * Obtiene configuración para el renderizador
   * @abstract
   * @returns {Object} Configuración de renderizado
   */
  getRenderConfig() {
    return {
      type: this.type,
      title: this.title,
      description: this.description,
      difficulty: this.difficulty,
      progress: this.getProgress()
    };
  }
}