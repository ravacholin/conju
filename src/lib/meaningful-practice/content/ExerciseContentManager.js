/**
 * ExerciseContentManager - Gestión centralizada de contenido para ejercicios de práctica significativa
 *
 * Este módulo gestiona toda la carga, caché y filtrado de contenido de ejercicios,
 * proporcionando una interfaz única para acceder a ejercicios organizados por tipo y tiempo verbal.
 *
 * @module ExerciseContentManager
 */

const timelineExercises = (await import('../../../data/meaningful-practice/exercises/timeline-exercises.json', { assert: { type: 'json' } })).default;
const promptExercises = (await import('../../../data/meaningful-practice/exercises/prompt-exercises.json', { assert: { type: 'json' } })).default;
const perfectTenseExercises = (await import('../../../data/meaningful-practice/exercises/perfect-tense-exercises.json', { assert: { type: 'json' } })).default;
const communicativeExercises = (await import('../../../data/meaningful-practice/exercises/communicative-exercises.json', { assert: { type: 'json' } })).default;
const storyBuildingExercises = (await import('../../../data/meaningful-practice/exercises/story-building-exercises.json', { assert: { type: 'json' } })).default;
const rolePlayingExercises = (await import('../../../data/meaningful-practice/exercises/role-playing-exercises.json', { assert: { type: 'json' } })).default;
const problemSolvingExercises = (await import('../../../data/meaningful-practice/exercises/problem-solving-exercises.json', { assert: { type: 'json' } })).default;
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ExerciseContentManager');

/**
 * Tipos de ejercicio disponibles
 */
export const EXERCISE_TYPES = {
  TIMELINE: 'timeline',
  DAILY_ROUTINE: 'daily_routine',
  PROMPTS: 'prompts',
  CHAT: 'chat',
  STORY_BUILDING: 'story_building',
  ROLE_PLAYING: 'role_playing',
  PROBLEM_SOLVING: 'problem_solving',
  MEDIA_BASED: 'media_based',
  CREATIVE_EXPRESSION: 'creative_expression',
  GAMIFIED_CHALLENGES: 'gamified_challenges'
};

/**
 * Niveles de dificultad
 */
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
};

/**
 * Categorías de ejercicios
 */
export const EXERCISE_CATEGORIES = {
  DAILY_LIFE: 'daily_life',
  WORK_LIFE: 'work_life',
  FAMILY: 'family',
  TRAVEL: 'travel',
  SOCIAL_EVENTS: 'social_events',
  MYSTERY: 'mystery',
  PREDICTIONS: 'predictions',
  PERSONAL_GOALS: 'personal_goals',
  HYPOTHETICAL: 'hypothetical',
  CHILDHOOD_MEMORIES: 'childhood_memories',
  PAST_EVENTS: 'past_events',
  RECENT_PAST: 'recent_past',
  FUTURE_PLANS: 'future_plans',
  ADVICE_GIVING: 'advice_giving',
  EVENT_PLANNING: 'event_planning',
  PAST_SEQUENCES: 'past_sequences',
  FUTURE_COMPLETION: 'future_completion',
  HOPES_DOUBTS: 'hopes_doubts',
  WISHES_HYPOTHETICAL: 'wishes_hypothetical',
  REGRETS_PAST_HYPOTHETICAL: 'regrets_past_hypothetical',
  DEEP_REGRETS: 'deep_regrets',
  FANTASY: 'fantasy'
};

/**
 * Cache de ejercicios para optimizar el rendimiento
 */
class ExerciseCache {
  constructor() {
    this.cache = new Map();
    this.lastAccess = new Map();
    this.maxSize = 100;
    this.ttl = 5 * 60 * 1000; // 5 minutos
  }

  set(key, value) {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, value);
    this.lastAccess.set(key, Date.now());
  }

  get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      const lastAccess = this.lastAccess.get(key);
      if (Date.now() - lastAccess < this.ttl) {
        this.lastAccess.set(key, Date.now());
        return value;
      } else {
        // Expirado
        this.cache.delete(key);
        this.lastAccess.delete(key);
      }
    }
    return undefined;
  }

  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, time] of this.lastAccess.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.lastAccess.delete(oldestKey);
    }
  }

  clear() {
    this.cache.clear();
    this.lastAccess.clear();
  }
}

/**
 * Gestor principal de contenido de ejercicios
 */
class ExerciseContentManager {
  constructor() {
    this.cache = new ExerciseCache();
    this.exerciseData = {
      timeline: timelineExercises,
      prompts: promptExercises,
      perfect: perfectTenseExercises,
      communicative: communicativeExercises,
      storyBuilding: storyBuildingExercises,
      rolePlaying: rolePlayingExercises,
      problemSolving: problemSolvingExercises
    };

    logger.info('ExerciseContentManager initialized with exercise data');
  }

  /**
   * Obtiene ejercicios para un tiempo verbal específico
   * @param {string} tense - Tiempo verbal (ej: 'pres', 'pretIndef', etc.)
   * @param {Object} options - Opciones de filtrado
   * @param {string} options.type - Tipo de ejercicio específico
   * @param {string} options.difficulty - Nivel de dificultad
   * @param {string} options.category - Categoría del ejercicio
   * @param {boolean} options.includeAlternatives - Incluir ejercicios alternativos
   * @returns {Object|null} Ejercicio encontrado o null
   */
  getExerciseForTense(tense, options = {}) {
    const cacheKey = this.generateCacheKey(tense, options);

    // Verificar cache primero
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit for tense: ${tense}`);
      return cached;
    }

    try {
      const exercise = this.findExercise(tense, options);

      if (exercise) {
        // Almacenar en cache
        this.cache.set(cacheKey, exercise);
        logger.debug(`Exercise found and cached for tense: ${tense}`, { exerciseId: exercise.id });
        return exercise;
      }

      logger.warn(`No exercise found for tense: ${tense}`, options);
      return null;
    } catch (error) {
      logger.error('Error getting exercise for tense:', error, { tense, options });
      return null;
    }
  }

  /**
   * Busca ejercicio en las fuentes de datos
   * @private
   */
  findExercise(tense, options) {
    const { type, difficulty, category, includeAlternatives = true } = options;

    // Buscar en diferentes fuentes de datos
    for (const [sourceName, sourceData] of Object.entries(this.exerciseData)) {
      const tenseData = sourceData[tense];
      if (!tenseData) continue;

      // Verificar ejercicio principal
      if (this.matchesFilters(tenseData.main, { type, difficulty, category })) {
        return tenseData.main;
      }

      // Verificar ejercicios alternativos si está habilitado
      if (includeAlternatives && tenseData.alternatives) {
        for (const alt of tenseData.alternatives) {
          if (this.matchesFilters(alt, { type, difficulty, category })) {
            return alt;
          }
        }
      }
    }

    // Si no se encontró con filtros específicos, devolver ejercicio principal disponible
    for (const [sourceName, sourceData] of Object.entries(this.exerciseData)) {
      const tenseData = sourceData[tense];
      if (tenseData && tenseData.main) {
        return tenseData.main;
      }
    }

    return null;
  }

  /**
   * Verifica si un ejercicio coincide con los filtros especificados
   * @private
   */
  matchesFilters(exercise, filters) {
    if (!exercise) return false;

    const { type, difficulty, category } = filters;

    if (type && exercise.type !== type) return false;
    if (difficulty && exercise.difficulty !== difficulty) return false;
    if (category && exercise.category !== category) return false;

    return true;
  }

  /**
   * Obtiene ejercicio aleatorio para un tiempo verbal
   * @param {string} tense - Tiempo verbal
   * @param {Object} options - Opciones de filtrado
   * @returns {Object|null} Ejercicio aleatorio o null
   */
  getRandomExerciseForTense(tense, options = {}) {
    const exercises = this.getAllExercisesForTense(tense, options);

    if (exercises.length === 0) {
      return this.getExerciseForTense(tense, { ...options, includeAlternatives: true });
    }

    const randomIndex = Math.floor(Math.random() * exercises.length);
    const selectedExercise = exercises[randomIndex];

    logger.debug(`Random exercise selected for tense: ${tense}`, {
      exerciseId: selectedExercise.id,
      totalOptions: exercises.length
    });

    return selectedExercise;
  }

  /**
   * Obtiene todos los ejercicios disponibles para un tiempo verbal
   * @param {string} tense - Tiempo verbal
   * @param {Object} options - Opciones de filtrado
   * @returns {Array} Lista de ejercicios
   */
  getAllExercisesForTense(tense, options = {}) {
    const exercises = [];
    const { includeAlternatives = true } = options;

    for (const [sourceName, sourceData] of Object.entries(this.exerciseData)) {
      const tenseData = sourceData[tense];
      if (!tenseData) continue;

      // Agregar ejercicio principal
      if (this.matchesFilters(tenseData.main, options)) {
        exercises.push(tenseData.main);
      }

      // Agregar ejercicios alternativos
      if (includeAlternatives && tenseData.alternatives) {
        for (const alt of tenseData.alternatives) {
          if (this.matchesFilters(alt, options)) {
            exercises.push(alt);
          }
        }
      }
    }

    return exercises;
  }

  /**
   * Obtiene ejercicios por categoría
   * @param {string} category - Categoría del ejercicio
   * @param {Object} options - Opciones adicionales
   * @returns {Array} Lista de ejercicios de la categoría
   */
  getExercisesByCategory(category, options = {}) {
    const exercises = [];
    const { difficulty, tense } = options;

    for (const [sourceName, sourceData] of Object.entries(this.exerciseData)) {
      for (const [tenseName, tenseData] of Object.entries(sourceData)) {
        if (tense && tenseName !== tense) continue;

        // Verificar ejercicio principal
        if (tenseData.main && tenseData.main.category === category) {
          if (!difficulty || tenseData.main.difficulty === difficulty) {
            exercises.push({ ...tenseData.main, tense: tenseName });
          }
        }

        // Verificar alternativos
        if (tenseData.alternatives) {
          for (const alt of tenseData.alternatives) {
            if (alt.category === category) {
              if (!difficulty || alt.difficulty === difficulty) {
                exercises.push({ ...alt, tense: tenseName });
              }
            }
          }
        }
      }
    }

    return exercises;
  }

  /**
   * Obtiene estadísticas del contenido disponible
   * @returns {Object} Estadísticas del contenido
   */
  getContentStats() {
    const stats = {
      totalExercises: 0,
      exercisesByTense: {},
      exercisesByType: {},
      exercisesByDifficulty: {},
      exercisesByCategory: {}
    };

    for (const [sourceName, sourceData] of Object.entries(this.exerciseData)) {
      for (const [tense, tenseData] of Object.entries(sourceData)) {
        stats.exercisesByTense[tense] = stats.exercisesByTense[tense] || 0;

        if (tenseData.main) {
          stats.totalExercises++;
          stats.exercisesByTense[tense]++;
          this.updateStats(stats, tenseData.main);
        }

        if (tenseData.alternatives) {
          stats.totalExercises += tenseData.alternatives.length;
          stats.exercisesByTense[tense] += tenseData.alternatives.length;

          for (const alt of tenseData.alternatives) {
            this.updateStats(stats, alt);
          }
        }
      }
    }

    return stats;
  }

  /**
   * Actualiza contadores de estadísticas
   * @private
   */
  updateStats(stats, exercise) {
    // Por tipo
    const type = exercise.type;
    stats.exercisesByType[type] = (stats.exercisesByType[type] || 0) + 1;

    // Por dificultad
    const difficulty = exercise.difficulty;
    if (difficulty) {
      stats.exercisesByDifficulty[difficulty] = (stats.exercisesByDifficulty[difficulty] || 0) + 1;
    }

    // Por categoría
    const category = exercise.category;
    if (category) {
      stats.exercisesByCategory[category] = (stats.exercisesByCategory[category] || 0) + 1;
    }
  }

  /**
   * Genera clave de cache
   * @private
   */
  generateCacheKey(tense, options) {
    const keyParts = [tense];
    if (options.type) keyParts.push(`type:${options.type}`);
    if (options.difficulty) keyParts.push(`diff:${options.difficulty}`);
    if (options.category) keyParts.push(`cat:${options.category}`);
    if (options.includeAlternatives === false) keyParts.push('no-alt');

    return keyParts.join('|');
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Exercise content cache cleared');
  }

  /**
   * Verifica si el contenido está disponible para un tiempo verbal
   * @param {string} tense - Tiempo verbal
   * @returns {boolean} True si hay contenido disponible
   */
  hasContentForTense(tense) {
    for (const sourceData of Object.values(this.exerciseData)) {
      if (sourceData[tense]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtiene tiempos verbales disponibles
   * @returns {Array} Lista de tiempos verbales con contenido
   */
  getAvailableTenses() {
    const tenses = new Set();

    for (const sourceData of Object.values(this.exerciseData)) {
      for (const tense of Object.keys(sourceData)) {
        tenses.add(tense);
      }
    }

    return Array.from(tenses).sort();
  }
}

// Instancia singleton
const exerciseContentManager = new ExerciseContentManager();

export default exerciseContentManager;
export { ExerciseContentManager };
