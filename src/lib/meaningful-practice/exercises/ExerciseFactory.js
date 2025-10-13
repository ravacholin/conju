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

const DEFAULT_SESSION_TYPES = [
  EXERCISE_TYPES.DAILY_ROUTINE,
  EXERCISE_TYPES.TIMELINE,
  EXERCISE_TYPES.STORY_BUILDING,
  EXERCISE_TYPES.ROLE_PLAYING,
  EXERCISE_TYPES.PROBLEM_SOLVING,
  EXERCISE_TYPES.PROMPTS,
  EXERCISE_TYPES.CHAT
];

const DEFAULT_TENSE_TYPE_MAP = {
  pres: EXERCISE_TYPES.DAILY_ROUTINE,
  pretIndef: EXERCISE_TYPES.TIMELINE,
  impf: EXERCISE_TYPES.STORY_BUILDING,
  fut: EXERCISE_TYPES.PROBLEM_SOLVING,
  cond: EXERCISE_TYPES.ROLE_PLAYING,
  subjPres: EXERCISE_TYPES.ROLE_PLAYING,
  subjImpf: EXERCISE_TYPES.STORY_BUILDING,
  subjPerf: EXERCISE_TYPES.CHAT,
  subjPlusc: EXERCISE_TYPES.STORY_BUILDING,
  pretPerf: EXERCISE_TYPES.CHAT,
  plusc: EXERCISE_TYPES.STORY_BUILDING,
  ger: EXERCISE_TYPES.CHAT,
  part: EXERCISE_TYPES.STORY_BUILDING
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
   * @param {string|Object} typeOrParams - Tipo de ejercicio o configuración completa
   * @param {Object} [config] - Configuración adicional cuando se pasa el tipo como primer parámetro
   * @returns {Promise<Object>} Instancia del ejercicio creado
   */
  async createExercise(typeOrParams, config = {}) {
    const params = typeof typeOrParams === 'string'
      ? { ...config, type: typeOrParams }
      : { ...typeOrParams };

    try {
      this.validateParams(params);

      const builtConfig = this.buildExerciseConfig(params);
      const exerciseData = await this.getExerciseData(builtConfig);

      if (!exerciseData) {
        throw new Error(`No exercise data available for tense "${builtConfig.tense}"`);
      }

      const resolvedType = exerciseData.type || builtConfig.type;
      const ExerciseClass = this.getExerciseClass(resolvedType);

      if (!ExerciseClass) {
        throw new Error(`Unknown exercise type: ${resolvedType}`);
      }

      const exercise = new ExerciseClass({
        ...exerciseData,
        tense: builtConfig.tense,
        eligibleForms: params.eligibleForms,
        userProfile: params.userProfile
      });

      await exercise.initialize();

      if (builtConfig.difficulty && exercise.difficulty !== builtConfig.difficulty) {
        exercise.difficulty = builtConfig.difficulty;
      }

      this.creationCount++;
      this.logger.info(`Exercise created: ${exercise.id}`, {
        type: exercise.type,
        tense: builtConfig.tense,
        difficulty: exercise.difficulty,
        creationCount: this.creationCount
      });

      return exercise;
    } catch (error) {
      this.logger.error('Error creating exercise:', error, { typeOrParams, config });
      throw error;
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

    if (!params.type || typeof params.type !== 'string') {
      throw new Error('Exercise type is required');
    }

    if (!Object.values(EXERCISE_TYPES).includes(params.type)) {
      throw new Error(`Unknown exercise type: ${params.type}`);
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

    if (exerciseData && config.type && exerciseData.type !== config.type) {
      this.logger.debug('Discarding content manager exercise due to type mismatch', {
        requested: config.type,
        received: exerciseData.type
      });
      exerciseData = null;
    }

    if (exerciseData) {
      // Almacenar en cache
      this.cache.set(cacheKey, exerciseData);
      this.logger.debug('Exercise data cached', { cacheKey, exerciseId: exerciseData.id });
      return exerciseData;
    }

    const fallback = this.buildFallbackExerciseData(config.type, config);
    if (fallback) {
      this.logger.warn('Using fallback exercise template', {
        type: config.type,
        tense: config.tense
      });
      this.cache.set(cacheKey, fallback);
      return fallback;
    }

    return null;
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
  async createExerciseSession(sessionParams = {}) {
    const constraints = sessionParams.constraints || {};
    const targetCount = Number.isInteger(sessionParams.exerciseCount)
      ? Math.max(1, sessionParams.exerciseCount)
      : Number.isInteger(sessionParams.count)
        ? Math.max(1, sessionParams.count)
        : 3;

    const tenses = Array.isArray(sessionParams.tenses) && sessionParams.tenses.length > 0
      ? sessionParams.tenses
      : sessionParams.tense
        ? [sessionParams.tense]
        : ['pres'];

    const typeSequence = Array.isArray(sessionParams.types) && sessionParams.types.length > 0
      ? sessionParams.types
      : DEFAULT_SESSION_TYPES;

    const sessionId = `exercise_session_${Date.now()}`;
    const exercises = [];

    try {
      for (let i = 0; i < targetCount; i++) {
        const tense = tenses[i % tenses.length];
        const fallbackType = typeSequence[i % typeSequence.length] || this.getDefaultTypeForTense(tense);
        const requestedType = constraints.type || fallbackType;

        try {
          const exercise = await this.createExercise(requestedType, {
            tense,
            random: true,
            ...constraints,
            userProfile: sessionParams.userProfile
          });

          if (exercise) {
            exercises.push(exercise);
          }
        } catch (iterationError) {
          this.logger.warn('Exercise creation skipped during session build', {
            error: iterationError.message,
            type: requestedType,
            tense
          });
        }
      }

      this.logger.info(`Exercise session created with ${exercises.length} exercises`);
      return {
        sessionId,
        requestedCount: targetCount,
        exercises,
        completed: exercises.length
      };
    } catch (error) {
      this.logger.error('Error creating exercise session:', error);
      return {
        sessionId,
        requestedCount: targetCount,
        exercises,
        completed: exercises.length,
        error: error.message
      };
    }
  }

  validateExerciseConfig(config = {}) {
    const errors = [];

    if (!config || typeof config !== 'object') {
      return { valid: false, errors: ['Config must be an object'] };
    }

    if (!config.tense || typeof config.tense !== 'string') {
      errors.push('tense is required');
    }

    if (config.type && !this.isExerciseTypeAvailable(config.type)) {
      errors.push(`Unsupported exercise type: ${config.type}`);
    }

    if (config.difficulty && !Object.values(DIFFICULTY_LEVELS).includes(config.difficulty)) {
      errors.push(`difficulty level is invalid: ${config.difficulty}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getDefaultTypeForTense(tense) {
    return DEFAULT_TENSE_TYPE_MAP[tense] || DEFAULT_SESSION_TYPES[0];
  }

  buildFallbackExerciseData(type, config) {
    if (!type || !this.isExerciseTypeAvailable(type)) {
      return null;
    }

    const base = {
      id: `fallback_${type}_${config.tense || 'generic'}`,
      type,
      title: `Práctica de ${type.replace(/_/g, ' ')}`,
      description: `Ejercicio generado automáticamente para practicar ${config.tense || 'el tiempo objetivo'}.`,
      difficulty: config.difficulty || DIFFICULTY_LEVELS.INTERMEDIATE,
      category: config.category || 'general',
      targetTenses: [config.tense || 'pres']
    };

    switch (type) {
      case EXERCISE_TYPES.TIMELINE:
        return {
          ...base,
          events: [
            { time: '08:00', icon: '☀️', prompt: 'Describe cómo empieza tu día', context: 'morning' },
            { time: '14:00', icon: '🍽️', prompt: 'Cuenta qué hiciste a mediodía', context: 'afternoon' },
            { time: '21:00', icon: '🌙', prompt: 'Explica cómo terminó tu día', context: 'evening' }
          ],
          expectedVerbs: ['desperté', 'almorcé', 'descansé'],
          verbInstructions: `Incluye al menos tres verbos en ${config.tense || 'el tiempo indicado'}.`
        };
      case EXERCISE_TYPES.STORY_BUILDING:
        return {
          ...base,
          elements: {
            characters: [
              { name: 'Lucía', description: 'una exploradora curiosa' },
              { name: 'Mateo', description: 'su compañero ingenioso' }
            ],
            settings: ['una biblioteca antigua', 'un puerto misterioso'],
            objects: ['un mapa secreto', 'una llave oxidada'],
            events: ['descubre una pista', 'resuelve un misterio', 'enfrenta un obstáculo']
          },
          requiredElements: 4,
          targetVerbs: ['descubrir', 'investigar', 'resolver', 'recordar'],
          expectedVerbs: ['descubrió', 'investigó', 'resolvió', 'recordó'],
          minLength: 150,
          maxLength: 280
        };
      case EXERCISE_TYPES.DAILY_ROUTINE:
        return {
          ...base,
          prompts: [
            { icon: '🌅', text: 'Mañana - Describe tu rutina al despertar', expected: ['me despierto', 'desayuno'] },
            { icon: '🏢', text: 'Tarde - Explica tus actividades principales', expected: ['trabajo', 'estudio'] },
            { icon: '🌃', text: 'Noche - Cuenta cómo finalizas el día', expected: ['ceno', 'duermo'] }
          ]
        };
      case EXERCISE_TYPES.PROMPTS:
        return {
          ...base,
          prompts: [
            { prompt: 'Completa: Ayer yo ____ (visitar) a mis abuelos.', expected: ['visité'] },
            { prompt: 'Responde: ¿Qué ____ (hacer) después de estudiar?', expected: ['hice', 'realicé'] },
            { prompt: 'Describe una meta usando el tiempo objetivo.', expected: ['lograré', 'planeo', 'quiero'] }
          ]
        };
      case EXERCISE_TYPES.CHAT:
        return {
          ...base,
          initialMessage: '¡Hola! Me encantaría saber sobre tus planes. ¿Qué te gustaría hacer esta semana?',
          script: [
            {
              id: 'saludo',
              npcMessage: '¿Tienes algún plan especial para hoy?',
              botResponse: '¡Qué interesante! Me alegra escuchar eso.',
              userKeywords: ['plan', 'ir', 'hacer']
            },
            {
              id: 'detalle',
              npcMessage: '¿Con quién piensas hacerlo?',
              botResponse: '¡Espero que lo pasen muy bien!',
              userKeywords: ['amigo', 'familia', 'solo']
            }
          ]
        };
      case EXERCISE_TYPES.ROLE_PLAYING:
        return {
          ...base,
          scenario: {
            context: 'Te encuentras en una entrevista laboral para un puesto remoto. El entrevistador quiere conocerte mejor.',
            userRole: 'candidato',
            npcRole: 'entrevistador'
          },
          phases: [
            {
              title: 'Presentación personal',
              npcMessage: 'Hola, cuéntame un poco sobre ti y tu experiencia.',
              expectedElements: ['experiencia', 'fortalezas'],
              targetVerbs: ['trabajar', 'lograr'],
              minLength: 60
            },
            {
              title: 'Trabajo remoto',
              npcMessage: '¿Cómo manejas los retos de trabajar desde casa?',
              expectedElements: ['organización', 'comunicación'],
              targetVerbs: ['organizar', 'coordinar'],
              minLength: 60
            }
          ],
          evaluationCriteria: {
            coherence: 0.35,
            vocabulary: 0.3,
            adaptability: 0.35
          }
        };
      case EXERCISE_TYPES.PROBLEM_SOLVING:
        return {
          ...base,
          problemContext: {
            situation: 'Eres líder de un proyecto que presenta retrasos significativos.',
            goal: 'Elabora un plan para recuperar el cronograma y motivar al equipo.'
          },
          decisionPoints: [
            {
              id: 'analisis_inicio',
              title: 'Identificar causas',
              question: '¿Qué factores están provocando el retraso?',
              factors: ['recursos', 'comunicación'],
              expectedElements: ['causa', 'impacto'],
              targetVerbs: ['analizar', 'evaluar']
            },
            {
              id: 'plan_accion',
              title: 'Plan de acción',
              question: 'Propón dos acciones concretas para normalizar el proyecto.',
              factors: ['prioridades', 'seguimiento'],
              expectedElements: ['acciones', 'responsables'],
              targetVerbs: ['implementar', 'coordinar']
            }
          ],
          evaluationCriteria: {
            feasibility: 0.4,
            clarity: 0.3,
            innovation: 0.3
          }
        };
      default:
        return {
          ...base
        };
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
        const resolvedType = this.getDefaultTypeForTense(tense);
        const exercise = await this.createExercise(resolvedType, {
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
