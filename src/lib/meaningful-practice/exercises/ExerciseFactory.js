/**
 * ExerciseFactory - Fábrica para crear ejercicios dinámicamente
 *
 * Esta clase se encarga de crear diferentes tipos de ejercicios basándose en
 * la configuración proporcionada, el progreso del usuario y las preferencias.
 *
 * @class ExerciseFactory
 */

import { createLogger } from '../../utils/logger.js';
import exerciseContentManager from '../content/ExerciseContentManager.js';
import { EXERCISE_TYPES, DIFFICULTY_LEVELS, DEFAULTS } from '../core/constants.js';

// Importar clases de ejercicios específicos
import { TimelineExercise } from './TimelineExercise.js';
import { PromptsExercise } from './PromptsExercise.js';
import { ChatExercise } from './ChatExercise.js';
import { DailyRoutineExercise } from './DailyRoutineExercise.js';
import { StoryBuildingExercise } from './StoryBuildingExercise.js';
import { RolePlayingExercise } from './RolePlayingExercise.js';
import { ProblemSolvingExercise } from './ProblemSolvingExercise.js';

const logger = createLogger('ExerciseFactory');

/**
 * Registro de tipos de ejercicio y sus clases correspondientes
 */
const EXERCISE_REGISTRY = {
  [EXERCISE_TYPES.TIMELINE]: TimelineExercise,
  [EXERCISE_TYPES.PROMPTS]: PromptsExercise,
  [EXERCISE_TYPES.CHAT]: ChatExercise,
  [EXERCISE_TYPES.DAILY_ROUTINE]: DailyRoutineExercise,
  [EXERCISE_TYPES.STORY_BUILDING]: StoryBuildingExercise,
  [EXERCISE_TYPES.ROLE_PLAYING]: RolePlayingExercise,
  [EXERCISE_TYPES.PROBLEM_SOLVING]: ProblemSolvingExercise,
};

/**
 * Configuraciones por defecto para diferentes contextos
 */
const DEFAULT_CONFIGURATIONS = {
  learning: {
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    includeAlternatives: true,
    adaptiveDifficulty: true
  },
  practice: {
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    includeAlternatives: true,
    randomSelection: true
  },
  assessment: {
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    includeAlternatives: false,
    strictEvaluation: true
  }
};

/**
 * Fábrica de ejercicios
 */
export class ExerciseFactory {
  constructor() {
    this.cache = new Map();
    this.creationCount = 0;
    this.logger = logger;

    this.logger.info('ExerciseFactory initialized');
  }

  /**
   * Crea un ejercicio basado en los parámetros especificados
   * @param {Object} params - Parámetros para crear el ejercicio
   * @param {string} params.tense - Tiempo verbal requerido
   * @param {string} [params.type] - Tipo específico de ejercicio
   * @param {string} [params.difficulty] - Nivel de dificultad
   * @param {string} [params.category] - Categoría temática
   * @param {string} [params.context] - Contexto de uso (learning, practice, assessment)
   * @param {Object} [params.userProfile] - Perfil del usuario para personalización
   * @param {Array} [params.eligibleForms] - Formas verbales elegibles para SRS
   * @param {boolean} [params.random] - Selección aleatoria de ejercicio
   * @returns {Promise<Object|null>} Instancia del ejercicio creado o null
   */
  async createExercise(params) {
    try {
      this.validateParams(params);

      const config = this.buildExerciseConfig(params);
      const exerciseData = await this.getExerciseData(config);

      if (!exerciseData) {
        this.logger.warn('No exercise data found for params', params);
        return null;
      }

      const ExerciseClass = this.getExerciseClass(exerciseData.type);
      if (!ExerciseClass) {
        this.logger.error(`No exercise class found for type: ${exerciseData.type}`);
        return null;
      }

      const exercise = new ExerciseClass({
        ...exerciseData,
        tense: params.tense,
        eligibleForms: params.eligibleForms,
        userProfile: params.userProfile
      });

      await exercise.initialize();

      this.creationCount++;
      this.logger.info(`Exercise created: ${exercise.id}`, {
        type: exercise.type,
        tense: params.tense,
        difficulty: exercise.difficulty,
        creationCount: this.creationCount
      });

      return exercise;
    } catch (error) {
      this.logger.error('Error creating exercise:', error, params);
      return null;
    }
  }

  /**
   * Valida los parámetros de entrada
   * @param {Object} params - Parámetros a validar
   * @throws {Error} Si los parámetros son inválidos
   */
  validateParams(params) {
    if (!params || typeof params !== 'object') {
      throw new Error('Exercise parameters are required');
    }

    if (!params.tense || typeof params.tense !== 'string') {
      throw new Error('Tense parameter is required and must be a string');
    }

    if (params.type && !Object.values(EXERCISE_TYPES).includes(params.type)) {
      throw new Error(`Invalid exercise type: ${params.type}`);
    }

    if (params.difficulty && !Object.values(DIFFICULTY_LEVELS).includes(params.difficulty)) {
      throw new Error(`Invalid difficulty level: ${params.difficulty}`);
    }
  }

  /**
   * Construye la configuración del ejercicio
   * @param {Object} params - Parámetros originales
   * @returns {Object} Configuración completa
   */
  buildExerciseConfig(params) {
    const context = params.context || 'practice';
    const defaults = DEFAULT_CONFIGURATIONS[context] || DEFAULT_CONFIGURATIONS.practice;

    const config = {
      tense: params.tense,
      type: params.type,
      difficulty: params.difficulty || defaults.difficulty,
      category: params.category,
      includeAlternatives: params.includeAlternatives !== undefined
        ? params.includeAlternatives
        : defaults.includeAlternatives,
      random: params.random !== undefined ? params.random : defaults.randomSelection
    };

    // Aplicar personalización si hay perfil de usuario
    if (params.userProfile) {
      this.applyPersonalization(config, params.userProfile);
    }

    return config;
  }

  /**
   * Aplica personalización basada en el perfil del usuario
   * @param {Object} config - Configuración a personalizar
   * @param {Object} userProfile - Perfil del usuario
   */
  applyPersonalization(config, userProfile) {
    // Ajustar dificultad basada en rendimiento
    if (userProfile.strengths && userProfile.strengths[config.tense]) {
      const strength = userProfile.strengths[config.tense];
      if (strength > 0.8 && config.difficulty === DIFFICULTY_LEVELS.BEGINNER) {
        config.difficulty = DIFFICULTY_LEVELS.INTERMEDIATE;
      } else if (strength > 0.9 && config.difficulty === DIFFICULTY_LEVELS.INTERMEDIATE) {
        config.difficulty = DIFFICULTY_LEVELS.ADVANCED;
      }
    }

    // Usar categorías preferidas
    if (!config.category && userProfile.preferredCategories?.length > 0) {
      const randomCategory = userProfile.preferredCategories[
        Math.floor(Math.random() * userProfile.preferredCategories.length)
      ];
      config.category = randomCategory;
    }

    // Ajustar tipo de ejercicio basado en preferencias
    if (!config.type && userProfile.preferredTypes?.length > 0) {
      const randomType = userProfile.preferredTypes[
        Math.floor(Math.random() * userProfile.preferredTypes.length)
      ];
      config.type = randomType;
    }

    this.logger.debug('Personalization applied', { config, userProfile });
  }

  /**
   * Obtiene datos de ejercicio del gestor de contenido
   * @param {Object} config - Configuración del ejercicio
   * @returns {Promise<Object|null>} Datos del ejercicio
   */
  async getExerciseData(config) {
    const cacheKey = this.generateCacheKey(config);

    // Verificar cache
    if (this.cache.has(cacheKey)) {
      this.logger.debug('Exercise data retrieved from cache', { cacheKey });
      return this.cache.get(cacheKey);
    }

    // Obtener del gestor de contenido
    let exerciseData;
    if (config.random) {
      exerciseData = exerciseContentManager.getRandomExerciseForTense(config.tense, config);
    } else {
      exerciseData = exerciseContentManager.getExerciseForTense(config.tense, config);
    }

    if (exerciseData) {
      // Almacenar en cache
      this.cache.set(cacheKey, exerciseData);
      this.logger.debug('Exercise data cached', { cacheKey, exerciseId: exerciseData.id });
    }

    return exerciseData;
  }

  /**
   * Obtiene la clase de ejercicio correspondiente al tipo
   * @param {string} type - Tipo de ejercicio
   * @returns {Function|null} Clase del ejercicio
   */
  getExerciseClass(type) {
    return EXERCISE_REGISTRY[type] || null;
  }

  /**
   * Registra un nuevo tipo de ejercicio
   * @param {string} type - Tipo de ejercicio
   * @param {Function} ExerciseClass - Clase del ejercicio
   */
  registerExerciseType(type, ExerciseClass) {
    if (typeof type !== 'string' || typeof ExerciseClass !== 'function') {
      throw new Error('Invalid exercise type registration');
    }

    EXERCISE_REGISTRY[type] = ExerciseClass;
    this.logger.info(`Exercise type registered: ${type}`);
  }

  /**
   * Verifica si un tipo de ejercicio está disponible
   * @param {string} type - Tipo de ejercicio
   * @returns {boolean} True si está disponible
   */
  isExerciseTypeAvailable(type) {
    return type in EXERCISE_REGISTRY;
  }

  /**
   * Obtiene todos los tipos de ejercicio disponibles
   * @returns {string[]} Lista de tipos disponibles
   */
  getAvailableExerciseTypes() {
    return Object.keys(EXERCISE_REGISTRY);
  }

  /**
   * Crea múltiples ejercicios para una sesión
   * @param {Object} sessionParams - Parámetros de la sesión
   * @param {string[]} sessionParams.tenses - Tiempos verbales a incluir
   * @param {number} sessionParams.count - Número de ejercicios
   * @param {Object} sessionParams.constraints - Restricciones adicionales
   * @returns {Promise<Object[]>} Lista de ejercicios creados
   */
  async createExerciseSession(sessionParams) {
    const { tenses, count, constraints = {} } = sessionParams;
    const exercises = [];

    try {
      for (let i = 0; i < count; i++) {
        const tense = tenses[i % tenses.length]; // Rotar entre tiempos verbales

        const params = {
          tense,
          random: true,
          ...constraints,
          userProfile: sessionParams.userProfile
        };

        const exercise = await this.createExercise(params);
        if (exercise) {
          exercises.push(exercise);
        }
      }

      this.logger.info(`Exercise session created with ${exercises.length} exercises`);
      return exercises;
    } catch (error) {
      this.logger.error('Error creating exercise session:', error);
      return exercises; // Devolver los que se pudieron crear
    }
  }

  /**
   * Obtiene estadísticas de la fábrica
   * @returns {Object} Estadísticas de uso
   */
  getStats() {
    return {
      totalCreated: this.creationCount,
      cacheSize: this.cache.size,
      availableTypes: this.getAvailableExerciseTypes(),
      registeredTypes: Object.keys(EXERCISE_REGISTRY).length
    };
  }

  /**
   * Genera clave de cache
   * @param {Object} config - Configuración del ejercicio
   * @returns {string} Clave de cache
   */
  generateCacheKey(config) {
    const keyParts = [
      config.tense,
      config.type || 'any',
      config.difficulty || 'default',
      config.category || 'any',
      config.includeAlternatives ? 'alt' : 'main',
      config.random ? 'random' : 'first'
    ];
    return keyParts.join(':');
  }

  /**
   * Limpia el cache de la fábrica
   */
  clearCache() {
    this.cache.clear();
    this.logger.info('ExerciseFactory cache cleared');
  }

  /**
   * Obtiene ejercicios recomendados para un usuario
   * @param {Object} userProfile - Perfil del usuario
   * @param {string[]} tenses - Tiempos verbales de interés
   * @param {number} limit - Límite de recomendaciones
   * @returns {Promise<Object[]>} Lista de ejercicios recomendados
   */
  async getRecommendedExercises(userProfile, tenses, limit = 5) {
    const recommendations = [];

    try {
      for (const tense of tenses) {
        if (recommendations.length >= limit) break;

        // Crear ejercicio personalizado para este tiempo verbal
        const exercise = await this.createExercise({
          tense,
          userProfile,
          random: true,
          context: 'practice'
        });

        if (exercise) {
          recommendations.push({
            exercise: exercise.getMetadata(),
            reason: this.getRecommendationReason(tense, userProfile),
            priority: this.calculatePriority(tense, userProfile)
          });
        }
      }

      // Ordenar por prioridad
      recommendations.sort((a, b) => b.priority - a.priority);

      this.logger.info(`Generated ${recommendations.length} recommendations for user`);
      return recommendations.slice(0, limit);
    } catch (error) {
      this.logger.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Obtiene la razón de recomendación
   * @param {string} tense - Tiempo verbal
   * @param {Object} userProfile - Perfil del usuario
   * @returns {string} Razón de la recomendación
   */
  getRecommendationReason(tense, userProfile) {
    if (userProfile.weaknesses?.[tense] > 0.7) {
      return `Necesitas práctica adicional en ${tense}`;
    }
    if (userProfile.strengths?.[tense] < 0.3) {
      return `Tiempo verbal nuevo para explorar: ${tense}`;
    }
    return `Práctica recomendada para mantener el nivel en ${tense}`;
  }

  /**
   * Calcula la prioridad de recomendación
   * @param {string} tense - Tiempo verbal
   * @param {Object} userProfile - Perfil del usuario
   * @returns {number} Prioridad (0-1)
   */
  calculatePriority(tense, userProfile) {
    let priority = 0.5; // Base

    // Incrementar prioridad para debilidades
    if (userProfile.weaknesses?.[tense]) {
      priority += userProfile.weaknesses[tense] * 0.4;
    }

    // Decrementar prioridad para fortalezas muy altas
    if (userProfile.strengths?.[tense] > 0.9) {
      priority -= 0.2;
    }

    // Incrementar para categorías preferidas
    if (userProfile.preferredCategories?.length > 0) {
      priority += 0.1;
    }

    return Math.max(0, Math.min(1, priority));
  }
}

// Instancia singleton
const exerciseFactory = new ExerciseFactory();

export default exerciseFactory;
export { ExerciseFactory };