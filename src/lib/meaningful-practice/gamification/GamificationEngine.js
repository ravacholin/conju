/**
 * GamificationEngine - Sistema de gamificación y logros para práctica significativa
 *
 * Este módulo gestiona el sistema de puntos, logros, rachas y elementos de gamificación
 * que motivan y comprometen a los usuarios en su proceso de aprendizaje.
 *
 * @module GamificationEngine
 */

import { getCurrentUserId } from '../../progress/userManager/index.js';
import { createLogger } from '../../utils/logger.js';
import { GAMIFICATION_CONFIG, DIFFICULTY_LEVELS } from '../core/constants.js';

const logger = createLogger('GamificationEngine');

/**
 * Sistema de gamificación para ejercicios de práctica significativa
 */
export class GamificationEngine {
  constructor() {
    this.userId = null;
    this.userStats = {
      totalPoints: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      exercisesCompleted: 0,
      perfectExercises: 0,
      totalTimeSpent: 0,
      achievements: [],
      badges: [],
      lastActivityDate: null
    };
    this.sessionStats = {
      pointsEarned: 0,
      exercisesCompleted: 0,
      streakActive: false,
      newAchievements: [],
      sessionStartTime: Date.now()
    };
  }

  /**
   * Inicializar sistema de gamificación para un usuario
   * @param {string} userId - ID del usuario
   */
  async initialize(userId = null) {
    try {
      this.userId = userId || getCurrentUserId();
      if (!this.userId) {
        throw new Error('No user ID provided for gamification');
      }

      await this.loadUserStats();
      this.resetSessionStats();

      logger.info(`GamificationEngine initialized for user: ${this.userId}`);
      return true;

    } catch (error) {
      logger.error('Failed to initialize GamificationEngine:', error);
      return false;
    }
  }

  /**
   * Cargar estadísticas del usuario desde almacenamiento local
   */
  async loadUserStats() {
    try {
      const storedStats = localStorage.getItem(`gamification_stats_${this.userId}`);
      if (storedStats) {
        this.userStats = { ...this.userStats, ...JSON.parse(storedStats) };
      }

      // Verificar racha basada en la última actividad
      this.checkStreakContinuity();

      logger.debug('User gamification stats loaded:', this.userStats);

    } catch (error) {
      logger.error('Failed to load user stats:', error);
    }
  }

  /**
   * Verificar continuidad de la racha
   */
  checkStreakContinuity() {
    if (!this.userStats.lastActivityDate) return;

    const lastActivity = new Date(this.userStats.lastActivityDate);
    const today = new Date();
    const daysDifference = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));

    // Si han pasado más de 1 día, resetear racha
    if (daysDifference > 1) {
      this.userStats.currentStreak = 0;
      logger.debug('Streak reset due to inactivity');
    }
  }

  /**
   * Procesar resultado de ejercicio y otorgar puntos/logros
   * @param {Object} exercise - Ejercicio completado
   * @param {Object} result - Resultado del ejercicio
   * @returns {Object} Resultados de gamificación
   */
  async processExerciseResult(exercise, result) {
    try {
      const gamificationResult = {
        pointsEarned: 0,
        bonusPoints: 0,
        newAchievements: [],
        levelUp: false,
        streakBonus: false,
        badges: []
      };

      // Calcular puntos base
      const basePoints = this.calculateBasePoints(exercise, result);
      gamificationResult.pointsEarned += basePoints;

      // Aplicar multiplicadores de dificultad
      const difficultyBonus = this.applyDifficultyMultiplier(basePoints, exercise.difficulty);
      gamificationResult.bonusPoints += difficultyBonus;

      // Verificar bonus de racha
      const streakBonus = this.processStreak(result.success);
      if (streakBonus > 0) {
        gamificationResult.bonusPoints += streakBonus;
        gamificationResult.streakBonus = true;
      }

      // Bonus por ejercicio perfecto
      if (this.isPerfectExercise(result)) {
        const perfectBonus = GAMIFICATION_CONFIG.BASE_POINTS.PERFECT_SCORE;
        gamificationResult.bonusPoints += perfectBonus;
        this.userStats.perfectExercises++;
      }

      // Actualizar estadísticas
      const totalPoints = gamificationResult.pointsEarned + gamificationResult.bonusPoints;
      this.updateUserStats(exercise, result, totalPoints);

      // Verificar subida de nivel
      const newLevel = this.calculateLevel(this.userStats.totalPoints);
      if (newLevel > this.userStats.level) {
        this.userStats.level = newLevel;
        gamificationResult.levelUp = true;
      }

      // Verificar logros
      const newAchievements = await this.checkAchievements();
      gamificationResult.newAchievements = newAchievements;

      // Actualizar estadísticas de sesión
      this.updateSessionStats(gamificationResult);

      // Guardar estadísticas
      await this.saveUserStats();

      logger.info(`Exercise processed for gamification: +${totalPoints} points, level ${this.userStats.level}`);
      return gamificationResult;

    } catch (error) {
      logger.error('Failed to process exercise result:', error);
      return { pointsEarned: 0, bonusPoints: 0, newAchievements: [] };
    }
  }

  /**
   * Calcular puntos base por ejercicio
   * @param {Object} exercise - Ejercicio completado
   * @param {Object} result - Resultado del ejercicio
   * @returns {number} Puntos base
   */
  calculateBasePoints(exercise, result) {
    let points = GAMIFICATION_CONFIG.BASE_POINTS.EXERCISE_COMPLETED;

    // Bonus por calidad de la respuesta
    if (result.analysis && result.analysis.qualityScore) {
      points += Math.floor(result.analysis.qualityScore * 10);
    }

    // Bonus por longitud de respuesta
    if (result.userResponse) {
      const wordCount = result.userResponse.split(/\s+/).length;
      if (wordCount > 100) points += 5;
      if (wordCount > 200) points += 5;
    }

    // Bonus por tiempo empleado (ni muy rápido ni muy lento)
    if (result.timeSpent) {
      const optimalTime = exercise.estimatedTime * 60; // Convertir a segundos
      const timeDiff = Math.abs(result.timeSpent - optimalTime);
      if (timeDiff < optimalTime * 0.3) { // Dentro del 30% del tiempo óptimo
        points += 3;
      }
    }

    return points;
  }

  /**
   * Aplicar multiplicador de dificultad
   * @param {number} basePoints - Puntos base
   * @param {string} difficulty - Nivel de dificultad
   * @returns {number} Puntos de bonus
   */
  applyDifficultyMultiplier(basePoints, difficulty) {
    const multiplier = GAMIFICATION_CONFIG.DIFFICULTY_MULTIPLIERS[difficulty] || 1.0;
    return Math.floor(basePoints * (multiplier - 1.0));
  }

  /**
   * Procesar racha de ejercicios
   * @param {boolean} isCorrect - Si el ejercicio fue correcto
   * @returns {number} Puntos de bonus por racha
   */
  processStreak(isCorrect) {
    const today = new Date().toDateString();
    const lastActivity = this.userStats.lastActivityDate ?
      new Date(this.userStats.lastActivityDate).toDateString() : null;

    if (isCorrect) {
      // Si es el primer ejercicio del día, incrementar racha
      if (lastActivity !== today) {
        this.userStats.currentStreak++;
        this.userStats.longestStreak = Math.max(
          this.userStats.longestStreak,
          this.userStats.currentStreak
        );
        this.sessionStats.streakActive = true;

        // Bonus por racha
        if (this.userStats.currentStreak >= 3) {
          return GAMIFICATION_CONFIG.BASE_POINTS.STREAK_BONUS *
                 Math.floor(this.userStats.currentStreak / 3);
        }
      }
    } else {
      // Ejercicio incorrecto: puede romper la racha dependiendo de la configuración
      if (this.userStats.currentStreak > 0 && Math.random() < 0.3) {
        this.userStats.currentStreak = 0;
      }
    }

    return 0;
  }

  /**
   * Verificar si el ejercicio es perfecto
   * @param {Object} result - Resultado del ejercicio
   * @returns {boolean} True si es perfecto
   */
  isPerfectExercise(result) {
    return result.success &&
           result.analysis &&
           (result.analysis.qualityScore >= 0.95 ||
            (result.analysis.isCorrect && result.analysis.completionPercentage >= 1.0));
  }

  /**
   * Actualizar estadísticas del usuario
   * @param {Object} exercise - Ejercicio completado
   * @param {Object} result - Resultado del ejercicio
   * @param {number} totalPoints - Puntos totales ganados
   */
  updateUserStats(exercise, result, totalPoints) {
    this.userStats.totalPoints += totalPoints;
    this.userStats.exercisesCompleted++;
    this.userStats.totalTimeSpent += result.timeSpent || 0;
    this.userStats.lastActivityDate = Date.now();
  }

  /**
   * Calcular nivel basado en puntos totales
   * @param {number} totalPoints - Puntos totales
   * @returns {number} Nivel calculado
   */
  calculateLevel(totalPoints) {
    // Fórmula de nivel: cada nivel requiere 100 puntos más que el anterior
    // Nivel 1: 0-99, Nivel 2: 100-299, Nivel 3: 300-599, etc.
    return Math.floor(Math.sqrt(totalPoints / 50)) + 1;
  }

  /**
   * Verificar y otorgar logros
   * @returns {Array} Nuevos logros obtenidos
   */
  async checkAchievements() {
    const newAchievements = [];
    const achievements = this.getAchievementDefinitions();

    for (const achievement of achievements) {
      // Solo verificar logros que no se han obtenido
      if (!this.userStats.achievements.includes(achievement.id)) {
        if (await achievement.checkCondition(this.userStats)) {
          this.userStats.achievements.push(achievement.id);
          newAchievements.push(achievement);
          logger.info(`New achievement unlocked: ${achievement.id}`);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Obtener definiciones de logros
   * @returns {Array} Array de definiciones de logros
   */
  getAchievementDefinitions() {
    return [
      {
        id: 'first_exercise',
        title: 'Primer Paso',
        description: 'Completa tu primer ejercicio de práctica significativa',
        icon: '/diana.png',
        points: 20,
        checkCondition: (stats) => stats.exercisesCompleted >= 1
      },
      {
        id: 'streak_3',
        title: 'Constancia',
        description: 'Mantén una racha de 3 días consecutivos',
        icon: '/crono.png',
        points: 50,
        checkCondition: (stats) => stats.currentStreak >= 3
      },
      {
        id: 'streak_7',
        title: 'Dedicación',
        description: 'Mantén una racha de 7 días consecutivos',
        icon: '/crono.png',
        points: 100,
        checkCondition: (stats) => stats.currentStreak >= 7
      },
      {
        id: 'perfectionist',
        title: 'Perfeccionista',
        description: 'Completa 10 ejercicios de manera perfecta',
        icon: '/diana.png',
        points: 75,
        checkCondition: (stats) => stats.perfectExercises >= 10
      },
      {
        id: 'hundred_exercises',
        title: 'Centurión',
        description: 'Completa 100 ejercicios',
        icon: '/verbosverbos.png',
        points: 200,
        checkCondition: (stats) => stats.exercisesCompleted >= 100
      },
      {
        id: 'level_5',
        title: 'Estudiante Avanzado',
        description: 'Alcanza el nivel 5',
        icon: '/openbook.png',
        points: 150,
        checkCondition: (stats) => stats.level >= 5
      },
      {
        id: 'time_master',
        title: 'Maestro del Tiempo',
        description: 'Acumula 10 horas de práctica',
        icon: '/crono.png',
        points: 120,
        checkCondition: (stats) => stats.totalTimeSpent >= 36000 // 10 horas en segundos
      },
      {
        id: 'story_teller',
        title: 'Narrador',
        description: 'Completa 20 ejercicios de Story Building',
        icon: '/books.png',
        points: 80,
        checkCondition: async (stats) => {
          return this.getExerciseTypeCount('story_building') >= 20;
        }
      },
      {
        id: 'problem_solver',
        title: 'Solucionador',
        description: 'Completa 15 ejercicios de Problem Solving',
        icon: '/dice.png',
        points: 90,
        checkCondition: async (stats) => {
          return this.getExerciseTypeCount('problem_solving') >= 15;
        }
      },
      {
        id: 'role_player',
        title: 'Actor',
        description: 'Completa 25 ejercicios de Role Playing',
        icon: '/play.png',
        points: 85,
        checkCondition: async (stats) => {
          return this.getExerciseTypeCount('role_playing') >= 25;
        }
      }
    ];
  }

  /**
   * Obtener conteo de ejercicios por tipo
   * @param {string} exerciseType - Tipo de ejercicio
   * @returns {number} Conteo de ejercicios
   */
  getExerciseTypeCount(exerciseType) {
    const storedCounts = localStorage.getItem(`exercise_counts_${this.userId}`);
    if (storedCounts) {
      const counts = JSON.parse(storedCounts);
      return counts[exerciseType] || 0;
    }
    return 0;
  }

  /**
   * Incrementar conteo de ejercicios por tipo
   * @param {string} exerciseType - Tipo de ejercicio
   */
  incrementExerciseTypeCount(exerciseType) {
    const storedCounts = localStorage.getItem(`exercise_counts_${this.userId}`);
    const counts = storedCounts ? JSON.parse(storedCounts) : {};

    counts[exerciseType] = (counts[exerciseType] || 0) + 1;

    localStorage.setItem(`exercise_counts_${this.userId}`, JSON.stringify(counts));
  }

  /**
   * Actualizar estadísticas de sesión
   * @param {Object} gamificationResult - Resultado de gamificación
   */
  updateSessionStats(gamificationResult) {
    this.sessionStats.pointsEarned += gamificationResult.pointsEarned + gamificationResult.bonusPoints;
    this.sessionStats.exercisesCompleted++;

    if (gamificationResult.newAchievements.length > 0) {
      this.sessionStats.newAchievements.push(...gamificationResult.newAchievements);
    }
  }

  /**
   * Resetear estadísticas de sesión
   */
  resetSessionStats() {
    this.sessionStats = {
      pointsEarned: 0,
      exercisesCompleted: 0,
      streakActive: false,
      newAchievements: [],
      sessionStartTime: Date.now()
    };
  }

  /**
   * Guardar estadísticas del usuario
   */
  async saveUserStats() {
    try {
      localStorage.setItem(`gamification_stats_${this.userId}`, JSON.stringify(this.userStats));
      logger.debug('User gamification stats saved');
    } catch (error) {
      logger.error('Failed to save user stats:', error);
    }
  }

  /**
   * Obtener estadísticas completas del usuario
   * @returns {Object} Estadísticas completas
   */
  getUserStats() {
    return {
      ...this.userStats,
      session: this.sessionStats,
      nextLevelPoints: this.getPointsForNextLevel(),
      progressToNextLevel: this.getProgressToNextLevel()
    };
  }

  /**
   * Calcular puntos necesarios para el siguiente nivel
   * @returns {number} Puntos necesarios
   */
  getPointsForNextLevel() {
    const nextLevel = this.userStats.level + 1;
    const pointsForNextLevel = Math.pow(nextLevel - 1, 2) * 50;
    return pointsForNextLevel - this.userStats.totalPoints;
  }

  /**
   * Calcular progreso hacia el siguiente nivel
   * @returns {number} Progreso (0-1)
   */
  getProgressToNextLevel() {
    const currentLevelPoints = Math.pow(this.userStats.level - 1, 2) * 50;
    const nextLevelPoints = Math.pow(this.userStats.level, 2) * 50;
    const progressPoints = this.userStats.totalPoints - currentLevelPoints;
    const levelRange = nextLevelPoints - currentLevelPoints;

    return Math.min(progressPoints / levelRange, 1);
  }

  /**
   * Obtener logros disponibles y su estado
   * @returns {Array} Logros con estado
   */
  getAchievementsWithStatus() {
    const achievements = this.getAchievementDefinitions();

    return achievements.map(achievement => ({
      ...achievement,
      unlocked: this.userStats.achievements.includes(achievement.id),
      progress: this.getAchievementProgress(achievement)
    }));
  }

  /**
   * Calcular progreso de un logro específico
   * @param {Object} achievement - Definición del logro
   * @returns {number} Progreso (0-1)
   */
  getAchievementProgress(achievement) {
    if (this.userStats.achievements.includes(achievement.id)) {
      return 1.0;
    }

    // Calcular progreso basado en el tipo de condición
    if (achievement.id.includes('streak')) {
      const targetStreak = parseInt(achievement.id.split('_')[1]);
      return Math.min(this.userStats.currentStreak / targetStreak, 1);
    }

    if (achievement.id === 'perfectionist') {
      return Math.min(this.userStats.perfectExercises / 10, 1);
    }

    if (achievement.id === 'hundred_exercises') {
      return Math.min(this.userStats.exercisesCompleted / 100, 1);
    }

    if (achievement.id === 'level_5') {
      return Math.min(this.userStats.level / 5, 1);
    }

    if (achievement.id === 'time_master') {
      return Math.min(this.userStats.totalTimeSpent / 36000, 1);
    }

    return 0;
  }

  /**
   * Generar resumen de sesión
   * @returns {Object} Resumen de sesión
   */
  generateSessionSummary() {
    const sessionDuration = Date.now() - this.sessionStats.sessionStartTime;

    return {
      duration: sessionDuration,
      exercisesCompleted: this.sessionStats.exercisesCompleted,
      pointsEarned: this.sessionStats.pointsEarned,
      newAchievements: this.sessionStats.newAchievements,
      streakActive: this.sessionStats.streakActive,
      currentStreak: this.userStats.currentStreak,
      currentLevel: this.userStats.level,
      totalPoints: this.userStats.totalPoints
    };
  }
}

// Instancia singleton del motor de gamificación
const gamificationEngine = new GamificationEngine();

export default gamificationEngine;