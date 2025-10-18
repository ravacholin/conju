/**
 * PersonalizationEngine - Motor de personalización para ejercicios de práctica significativa
 *
 * Este módulo analiza el comportamiento, preferencias y progreso del usuario para
 * adaptar automáticamente la selección de ejercicios, dificultad y contenido.
 *
 * @module PersonalizationEngine
 */

import { getCurrentUserId } from '../../progress/userManager/index.js';
import { getProgress } from '../../progress/progressRepository.js';
import { createLogger } from '../../utils/logger.js';
import { EXERCISE_TYPES, DIFFICULTY_LEVELS, PERSONALIZATION_CONFIG } from '../core/constants.js';

const logger = createLogger('PersonalizationEngine');

/**
 * Motor de personalización para experiencias de aprendizaje adaptativas
 */
export class PersonalizationEngine {
  constructor() {
    this.userId = null;
    this.userProfile = null;
    this.learningHistory = [];
    this.preferences = {
      exerciseTypes: {},
      categories: {},
      difficultyPreference: DIFFICULTY_LEVELS.INTERMEDIATE,
      sessionLength: 'medium',
      feedback: 'detailed'
    };
    this.adaptationMetrics = {
      performanceByType: {},
      engagementByType: {},
      difficultyTrends: [],
      learningVelocity: 0.5
    };
  }

  /**
   * Inicializar el motor de personalización para un usuario
   * @param {string} userId - ID del usuario
   */
  async initialize(userId = null) {
    try {
      this.userId = userId || getCurrentUserId();
      if (!this.userId) {
        throw new Error('No user ID provided for personalization');
      }

      await this.loadUserProfile();
      await this.loadLearningHistory();
      await this.calculateAdaptationMetrics();

      logger.info(`PersonalizationEngine initialized for user: ${this.userId}`);
      return true;

    } catch (error) {
      logger.error('Failed to initialize PersonalizationEngine:', error);
      return false;
    }
  }

  /**
   * Cargar perfil del usuario desde el almacenamiento local
   */
  async loadUserProfile() {
    try {
      const storedProfile = localStorage.getItem(`user_profile_${this.userId}`);
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        this.userProfile = profile;
        this.preferences = { ...this.preferences, ...profile.preferences };
      } else {
        // Crear perfil por defecto
        this.userProfile = this.createDefaultProfile();
      }

      logger.debug('User profile loaded:', this.userProfile);

    } catch (error) {
      logger.error('Failed to load user profile:', error);
      this.userProfile = this.createDefaultProfile();
    }
  }

  /**
   * Crear perfil por defecto para nuevos usuarios
   */
  createDefaultProfile() {
    return {
      userId: this.userId,
      createdAt: Date.now(),
      lastActive: Date.now(),
      totalSessions: 0,
      totalExercises: 0,
      averageSessionTime: 0,
      preferences: {
        exerciseTypes: {},
        categories: {},
        difficultyPreference: DIFFICULTY_LEVELS.INTERMEDIATE,
        sessionLength: 'medium',
        feedback: 'detailed'
      },
      learningStyle: {
        visual: 0.5,
        auditory: 0.3,
        kinesthetic: 0.2,
        analytical: 0.6,
        creative: 0.4
      },
      motivation: {
        intrinsic: 0.7,
        achievement: 0.5,
        competition: 0.3,
        progress: 0.8
      }
    };
  }

  /**
   * Cargar historial de aprendizaje
   */
  async loadLearningHistory() {
    try {
      // Cargar desde el sistema de progreso existente
      const progressData = await getProgress(this.userId);

      // Transformar datos de progreso a formato de historial de aprendizaje
      this.learningHistory = this.transformProgressToHistory(progressData);

      logger.debug(`Loaded ${this.learningHistory.length} learning history entries`);

    } catch (error) {
      logger.error('Failed to load learning history:', error);
      this.learningHistory = [];
    }
  }

  /**
   * Transformar datos de progreso a historial de aprendizaje
   * @param {Object} progressData - Datos de progreso del usuario
   */
  transformProgressToHistory(progressData) {
    const history = [];

    if (progressData && progressData.attempts) {
      progressData.attempts.forEach(attempt => {
        history.push({
          exerciseType: attempt.metadata?.exerciseType || 'unknown',
          difficulty: attempt.metadata?.difficulty || DIFFICULTY_LEVELS.INTERMEDIATE,
          score: attempt.score || 0,
          timeSpent: attempt.timeSpent || 0,
          isCorrect: attempt.isCorrect || false,
          timestamp: attempt.timestamp || Date.now(),
          tense: attempt.metadata?.tense,
          mood: attempt.metadata?.mood,
          wordCount: attempt.metadata?.wordCount || 0
        });
      });
    }

    return history.sort((a, b) => b.timestamp - a.timestamp); // Más recientes primero
  }

  /**
   * Calcular métricas de adaptación basadas en el historial
   */
  async calculateAdaptationMetrics() {
    try {
      this.calculatePerformanceByType();
      this.calculateEngagementMetrics();
      this.calculateDifficultyTrends();
      this.calculateLearningVelocity();

      logger.debug('Adaptation metrics calculated:', this.adaptationMetrics);

    } catch (error) {
      logger.error('Failed to calculate adaptation metrics:', error);
    }
  }

  /**
   * Calcular rendimiento por tipo de ejercicio
   */
  calculatePerformanceByType() {
    const performanceByType = {};

    this.learningHistory.forEach(entry => {
      const type = entry.exerciseType;
      if (!performanceByType[type]) {
        performanceByType[type] = {
          totalAttempts: 0,
          correctAttempts: 0,
          totalScore: 0,
          averageScore: 0,
          averageTime: 0,
          totalTime: 0
        };
      }

      const stats = performanceByType[type];
      stats.totalAttempts++;
      if (entry.isCorrect) stats.correctAttempts++;
      stats.totalScore += entry.score;
      stats.totalTime += entry.timeSpent;
      stats.averageScore = stats.totalScore / stats.totalAttempts;
      stats.averageTime = stats.totalTime / stats.totalAttempts;
    });

    this.adaptationMetrics.performanceByType = performanceByType;
  }

  /**
   * Calcular métricas de engagement
   */
  calculateEngagementMetrics() {
    const engagementByType = {};
    const recentHistory = this.learningHistory.slice(0, 50); // Últimos 50 ejercicios

    recentHistory.forEach(entry => {
      const type = entry.exerciseType;
      if (!engagementByType[type]) {
        engagementByType[type] = {
          frequency: 0,
          averageWordCount: 0,
          totalWordCount: 0,
          sessionCompletion: 0,
          qualityScore: 0
        };
      }

      const engagement = engagementByType[type];
      engagement.frequency++;
      engagement.totalWordCount += entry.wordCount || 0;
      engagement.averageWordCount = engagement.totalWordCount / engagement.frequency;

      // Calidad basada en tiempo empleado y puntuación
      const qualityFactor = (entry.score * 0.7) + (Math.min(entry.timeSpent / 180, 1) * 0.3);
      engagement.qualityScore = (engagement.qualityScore * (engagement.frequency - 1) + qualityFactor) / engagement.frequency;
    });

    this.adaptationMetrics.engagementByType = engagementByType;
  }

  /**
   * Calcular tendencias de dificultad
   */
  calculateDifficultyTrends() {
    const trends = [];
    const recentHistory = this.learningHistory.slice(0, 20);

    if (recentHistory.length === 0) return;

    // Agrupar por semanas
    const weeklyData = {};
    recentHistory.forEach(entry => {
      const weekKey = Math.floor(entry.timestamp / (7 * 24 * 60 * 60 * 1000));
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          totalScore: 0,
          count: 0,
          difficulties: {}
        };
      }

      weeklyData[weekKey].totalScore += entry.score;
      weeklyData[weekKey].count++;
      weeklyData[weekKey].difficulties[entry.difficulty] =
        (weeklyData[weekKey].difficulties[entry.difficulty] || 0) + 1;
    });

    // Convertir a tendencias
    Object.entries(weeklyData).forEach(([week, data]) => {
      const averageScore = data.totalScore / data.count;
      const dominantDifficulty = Object.entries(data.difficulties)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || DIFFICULTY_LEVELS.INTERMEDIATE;

      trends.push({
        week: parseInt(week),
        averageScore,
        dominantDifficulty,
        volume: data.count
      });
    });

    this.adaptationMetrics.difficultyTrends = trends.sort((a, b) => b.week - a.week);
  }

  /**
   * Calcular velocidad de aprendizaje
   */
  calculateLearningVelocity() {
    const recentHistory = this.learningHistory.slice(0, 30);
    if (recentHistory.length < 2) {
      this.adaptationMetrics.learningVelocity = 0.5;
      return;
    }

    const midpoint = Math.floor(recentHistory.length / 2);
    const recentSegment = recentHistory.slice(0, Math.max(midpoint, 1));
    const olderSegment = recentHistory.slice(Math.max(midpoint, 1));

    const average = (segment) => segment.reduce((sum, entry) => sum + (entry.score || 0), 0) / segment.length;

    const recentAvg = recentSegment.length ? average(recentSegment) : this.learningHistory[0].score || 0.5;
    const olderAvg = olderSegment.length ? average(olderSegment) : recentAvg;

    const improvement = recentAvg - olderAvg;

    // Normalizar velocidad entre 0 y 1
    this.adaptationMetrics.learningVelocity = Math.max(0, Math.min(1, 0.5 + improvement));
  }

  /**
   * Recomendar tipo de ejercicio basado en personalización
   * @param {string} tense - Tiempo verbal actual
   * @param {string} mood - Modo verbal actual
   * @param {Array} availableTypes - Tipos de ejercicio disponibles
   * @returns {string} Tipo de ejercicio recomendado
   */
  recommendExerciseType(tense, mood, availableTypes = Object.values(EXERCISE_TYPES)) {
    const recommendations = [];

    // Puntuar cada tipo de ejercicio disponible
    availableTypes.forEach(type => {
      let score = 0.5; // Puntuación base

      // Factor de rendimiento
      const performance = this.adaptationMetrics.performanceByType[type];
      if (performance) {
        score += (performance.averageScore - 0.5) * PERSONALIZATION_CONFIG.PERFORMANCE_WEIGHT;
      }

      // Factor de engagement
      const engagement = this.adaptationMetrics.engagementByType[type];
      if (engagement) {
        const engagementScore = (engagement.frequency / 50) * 0.5 + (engagement.qualityScore * 0.5);
        score += engagementScore * PERSONALIZATION_CONFIG.ENGAGEMENT_WEIGHT;
      }

      // Factor de preferencia (si existe)
      const preference = this.preferences.exerciseTypes[type] || 0.5;
      score += (preference - 0.5) * PERSONALIZATION_CONFIG.PREFERENCE_WEIGHT;

      // Factor de variedad (penalizar tipos usados recientemente)
      const recentUsageStats = this.getRecentUsage(type);
      score -= recentUsageStats.ratio * PERSONALIZATION_CONFIG.VARIETY_WEIGHT;

      if (recentUsageStats.consecutive >= PERSONALIZATION_CONFIG.MAX_CONSECUTIVE_SAME_TYPE) {
        const excess = recentUsageStats.consecutive - PERSONALIZATION_CONFIG.MAX_CONSECUTIVE_SAME_TYPE + 1;
        score -= excess * 0.1;
      }

      // Bonus por compatibilidad con tiempo verbal
      score += this.getTypeCompatibilityBonus(type, tense, mood);

      recommendations.push({ type, score });
    });

    // Ordenar por puntuación y seleccionar el mejor
    recommendations.sort((a, b) => b.score - a.score);

    const selectedType = recommendations[0]?.type || EXERCISE_TYPES.PROMPTS;

    logger.debug(`Exercise type recommended: ${selectedType} for ${mood}_${tense}`, {
      recommendations: recommendations.slice(0, 3)
    });

    return selectedType;
  }

  /**
   * Obtener uso reciente de un tipo de ejercicio
   * @param {string} type - Tipo de ejercicio
   * @returns {number} Factor de uso reciente (0-1)
   */
  getRecentUsage(type) {
    const recentHistory = this.learningHistory.slice(0, 10);
    const totalUsage = recentHistory.filter(entry => entry.exerciseType === type).length;

    let consecutive = 0;
    for (const entry of recentHistory) {
      if (entry.exerciseType === type) {
        consecutive++;
      } else {
        break;
      }
    }

    return {
      ratio: Math.min(totalUsage / 5, 1),
      total: totalUsage,
      consecutive
    };
  }

  /**
   * Obtener bonus de compatibilidad entre tipo de ejercicio y tiempo verbal
   * @param {string} type - Tipo de ejercicio
   * @param {string} tense - Tiempo verbal
   * @param {string} mood - Modo verbal
   * @returns {number} Bonus de compatibilidad
   */
  getTypeCompatibilityBonus(type, tense, mood) {
    const compatibilityMap = {
      [EXERCISE_TYPES.DAILY_ROUTINE]: ['pres'],
      [EXERCISE_TYPES.TIMELINE]: ['pretIndef', 'impf'],
      [EXERCISE_TYPES.STORY_BUILDING]: ['impf', 'pretIndef', 'plusc'],
      [EXERCISE_TYPES.ROLE_PLAYING]: ['cond', 'subjPres', 'fut'],
      [EXERCISE_TYPES.PROBLEM_SOLVING]: ['fut', 'cond', 'subjPres'],
      [EXERCISE_TYPES.CHAT]: ['pres', 'pretPerf', 'fut']
    };

    const compatibleTenses = compatibilityMap[type] || [];
    return compatibleTenses.includes(tense) ? 0.1 : 0;
  }

  /**
   * Recomendar nivel de dificultad
   * @param {string} exerciseType - Tipo de ejercicio
   * @returns {string} Nivel de dificultad recomendado
   */
  recommendDifficulty(exerciseType) {
    const performance = this.adaptationMetrics.performanceByType[exerciseType];
    const learningVelocity = this.adaptationMetrics.learningVelocity;

    let recommendedLevel = this.preferences.difficultyPreference;

    if (performance) {
      const accuracyRate = performance.correctAttempts / performance.totalAttempts;
      const avgScore = performance.averageScore;

      // Aumentar dificultad si el usuario lo está haciendo bien
      if (accuracyRate > PERSONALIZATION_CONFIG.DIFFICULTY_INCREASE_THRESHOLD && avgScore > 0.8) {
        recommendedLevel = this.increaseDifficulty(recommendedLevel);
      }
      // Disminuir dificultad si está teniendo problemas
      else if (accuracyRate < PERSONALIZATION_CONFIG.DIFFICULTY_DECREASE_THRESHOLD || avgScore < 0.5) {
        recommendedLevel = this.decreaseDifficulty(recommendedLevel);
      }
    }

    // Ajustar por velocidad de aprendizaje
    if (learningVelocity > 0.7) {
      recommendedLevel = this.increaseDifficulty(recommendedLevel);
    } else if (learningVelocity < 0.3) {
      recommendedLevel = this.decreaseDifficulty(recommendedLevel);
    }

    logger.debug(`Difficulty recommended: ${recommendedLevel} for ${exerciseType}`);
    return recommendedLevel;
  }

  /**
   * Aumentar nivel de dificultad
   * @param {string} currentLevel - Nivel actual
   * @returns {string} Nuevo nivel
   */
  increaseDifficulty(currentLevel) {
    const levels = Object.values(DIFFICULTY_LEVELS);
    const currentIndex = levels.indexOf(currentLevel);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }

  /**
   * Disminuir nivel de dificultad
   * @param {string} currentLevel - Nivel actual
   * @returns {string} Nuevo nivel
   */
  decreaseDifficulty(currentLevel) {
    const levels = Object.values(DIFFICULTY_LEVELS);
    const currentIndex = levels.indexOf(currentLevel);
    return levels[Math.max(currentIndex - 1, 0)];
  }

  /**
   * Actualizar preferencias del usuario
   * @param {Object} result - Resultado del ejercicio
   * @param {string} exerciseType - Tipo de ejercicio
   */
  async updatePreferences(result, exerciseType) {
    try {
      // Actualizar preferencia por tipo de ejercicio basada en engagement
      const currentPreference = this.preferences.exerciseTypes[exerciseType] || 0.5;
      const engagementScore = this.calculateEngagementScore(result);

      // Actualización suave de preferencias
      const newPreference = (currentPreference * 0.9) + (engagementScore * 0.1);
      this.preferences.exerciseTypes[exerciseType] = Math.max(0.1, Math.min(0.9, newPreference));

      // Actualizar perfil de usuario
      await this.saveUserProfile();

      logger.debug(`Preferences updated for ${exerciseType}: ${newPreference}`);

    } catch (error) {
      logger.error('Failed to update preferences:', error);
    }
  }

  /**
   * Calcular puntuación de engagement para un resultado
   * @param {Object} result - Resultado del ejercicio
   * @returns {number} Puntuación de engagement (0-1)
   */
  calculateEngagementScore(result) {
    let score = 0.5;

    // Factor tiempo empleado (ni muy rápido ni muy lento)
    if (result.timeSpent) {
      const timeScore = result.timeSpent > 60 && result.timeSpent < 600 ? 0.8 : 0.3;
      score += timeScore * 0.2;
    }

    // Factor longitud de respuesta
    if (result.userResponse) {
      const wordCount = result.userResponse.split(/\s+/).length;
      const lengthScore = wordCount > 50 ? 0.8 : wordCount / 50;
      score += lengthScore * 0.2;
    }

    // Factor calidad de la respuesta
    if (result.success) {
      score += 0.3;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Guardar perfil de usuario
   */
  async saveUserProfile() {
    try {
      this.userProfile.preferences = this.preferences;
      this.userProfile.lastActive = Date.now();

      localStorage.setItem(`user_profile_${this.userId}`, JSON.stringify(this.userProfile));

      logger.debug('User profile saved');

    } catch (error) {
      logger.error('Failed to save user profile:', error);
    }
  }

  /**
   * Obtener recomendaciones personalizadas completas
   * @param {string} tense - Tiempo verbal
   * @param {string} mood - Modo verbal
   * @param {Array} availableTypes - Tipos disponibles
   * @returns {Object} Recomendaciones completas
   */
  getPersonalizedRecommendations(tense, mood, availableTypes) {
    const exerciseType = this.recommendExerciseType(tense, mood, availableTypes);
    const difficulty = this.recommendDifficulty(exerciseType);

    return {
      exerciseType,
      difficulty,
      estimatedTime: this.estimateTimeNeeded(exerciseType, difficulty),
      confidence: this.calculateRecommendationConfidence(exerciseType),
      reasoning: this.generateRecommendationReasoning(exerciseType, difficulty)
    };
  }

  /**
   * Estimar tiempo necesario para un ejercicio
   * @param {string} exerciseType - Tipo de ejercicio
   * @param {string} difficulty - Nivel de dificultad
   * @returns {number} Tiempo estimado en minutos
   */
  estimateTimeNeeded(exerciseType, difficulty) {
    const baseTimeMap = {
      [EXERCISE_TYPES.DAILY_ROUTINE]: 5,
      [EXERCISE_TYPES.TIMELINE]: 7,
      [EXERCISE_TYPES.STORY_BUILDING]: 10,
      [EXERCISE_TYPES.ROLE_PLAYING]: 12,
      [EXERCISE_TYPES.PROBLEM_SOLVING]: 15,
      [EXERCISE_TYPES.CHAT]: 8
    };

    const difficultyMultiplier = {
      [DIFFICULTY_LEVELS.BEGINNER]: 0.8,
      [DIFFICULTY_LEVELS.INTERMEDIATE]: 1.0,
      [DIFFICULTY_LEVELS.ADVANCED]: 1.3,
      [DIFFICULTY_LEVELS.EXPERT]: 1.6
    };

    const baseTime = baseTimeMap[exerciseType] || 8;
    const multiplier = difficultyMultiplier[difficulty] || 1.0;

    return Math.round(baseTime * multiplier);
  }

  /**
   * Calcular confianza en la recomendación
   * @param {string} exerciseType - Tipo de ejercicio
   * @returns {number} Confianza (0-1)
   */
  calculateRecommendationConfidence(exerciseType) {
    const performance = this.adaptationMetrics.performanceByType[exerciseType];
    const historyLength = this.learningHistory.length;

    let confidence = 0.5;

    // Más confianza con más datos
    if (historyLength > 20) confidence += 0.2;
    if (historyLength > 50) confidence += 0.1;

    // Más confianza si tenemos datos específicos del tipo
    if (performance && performance.totalAttempts > 5) {
      confidence += 0.2;
    }

    return Math.min(confidence, 0.9);
  }

  /**
   * Generar explicación de la recomendación
   * @param {string} exerciseType - Tipo de ejercicio
   * @param {string} difficulty - Nivel de dificultad
   * @returns {string} Explicación textual
   */
  generateRecommendationReasoning(exerciseType, difficulty) {
    const performance = this.adaptationMetrics.performanceByType[exerciseType];
    const engagement = this.adaptationMetrics.engagementByType[exerciseType];

    let reasoning = `Recomendamos ${exerciseType} en nivel ${difficulty}`;

    if (performance && performance.averageScore > 0.7) {
      reasoning += ' basado en tu buen rendimiento previo en este tipo';
    } else if (engagement && engagement.qualityScore > 0.6) {
      reasoning += ' porque muestras buen engagement con estos ejercicios';
    } else {
      reasoning += ' para explorar un nuevo formato de práctica';
    }

    return reasoning;
  }
}

// Instancia singleton del motor de personalización
const personalizationEngine = new PersonalizationEngine();

export default personalizationEngine;
