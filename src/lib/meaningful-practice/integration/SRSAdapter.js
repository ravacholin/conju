/**
 * SRSAdapter - Adaptador para integrar el sistema de práctica significativa con SRS
 *
 * Este módulo proporciona una interfaz unificada entre el nuevo sistema de ejercicios
 * de práctica significativa y el sistema SRS (Spaced Repetition System) existente.
 *
 * @module SRSAdapter
 */

import { updateSchedule, getScheduleForItems } from '../../progress/srs.js';
import { getCurrentUserId } from '../../progress/userManager/index.js';
import { recordAttempt } from '../../progress/progressRepository.js';
import { createLogger } from '../../utils/logger.js';
import { ERROR_TAGS } from '../../progress/dataModels.js';

const logger = createLogger('SRSAdapter');

/**
 * Adaptador para integrar ejercicios de práctica significativa con SRS
 */
export class SRSAdapter {
  constructor() {
    this.userId = null;
    this.sessionMetrics = {
      exercisesCompleted: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      averageScore: 0,
      sessionStartTime: Date.now()
    };
  }

  /**
   * Inicializar adaptador para el usuario actual
   */
  async initialize() {
    try {
      this.userId = getCurrentUserId();
      if (!this.userId) {
        throw new Error('No user ID available for SRS integration');
      }

      this.sessionMetrics.sessionStartTime = Date.now();
      logger.info(`SRSAdapter initialized for user: ${this.userId}`);

      return true;
    } catch (error) {
      logger.error('Failed to initialize SRSAdapter:', error);
      return false;
    }
  }

  /**
   * Crear item SRS virtual para ejercicio de práctica significativa
   * @param {Object} exercise - Ejercicio actual
   * @param {string} tense - Tiempo verbal
   * @param {string} mood - Modo verbal
   * @returns {Object} Item SRS virtual
   */
  createVirtualSRSItem(exercise, tense, mood) {
    return {
      id: `meaningful_practice_${exercise.type}_${tense}_${mood}`,
      verb: exercise.title || 'práctica_significativa',
      form: `${mood}_${tense}`,
      mood,
      tense,
      type: 'meaningful_practice',
      category: exercise.category || 'general',
      difficulty: exercise.difficulty || 'intermediate',
      metadata: {
        exerciseType: exercise.type,
        exerciseId: exercise.id,
        estimatedTime: exercise.estimatedTime || 5
      }
    };
  }

  /**
   * Registrar resultado de ejercicio con el sistema SRS
   * @param {Object} exercise - Ejercicio completado
   * @param {Object} result - Resultado del ejercicio
   * @param {string} tense - Tiempo verbal
   * @param {string} mood - Modo verbal
   */
  async recordExerciseResult(exercise, result, tense, mood) {
    try {
      if (!this.userId) {
        await this.initialize();
      }

      const virtualItem = this.createVirtualSRSItem(exercise, tense, mood);
      const score = this.calculateSRSScore(result);
      const isCorrect = score >= 0.7;

      // Actualizar SRS
      await this.updateSRSSchedule(virtualItem.id, isCorrect);

      // Registrar intento detallado
      await this.recordDetailedAttempt(virtualItem, result, score, isCorrect);

      // Actualizar métricas de sesión
      this.updateSessionMetrics(score, isCorrect);

      logger.info(`Exercise result recorded for SRS: ${virtualItem.id}, score: ${score}, correct: ${isCorrect}`);

      return {
        srsUpdated: true,
        score,
        isCorrect,
        virtualItem
      };

    } catch (error) {
      logger.error('Failed to record exercise result:', error);
      return {
        srsUpdated: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar schedule SRS
   * @param {string} itemId - ID del item
   * @param {boolean} isCorrect - Si la respuesta fue correcta
   */
  async updateSRSSchedule(itemId, isCorrect) {
    try {
      await updateSchedule(this.userId, itemId, isCorrect);
      logger.debug(`SRS schedule updated for item: ${itemId}`);
    } catch (error) {
      logger.error('Failed to update SRS schedule:', error);
      throw error;
    }
  }

  /**
   * Registrar intento detallado
   * @param {Object} virtualItem - Item SRS virtual
   * @param {Object} result - Resultado del ejercicio
   * @param {number} score - Puntuación calculada
   * @param {boolean} isCorrect - Si fue correcto
   */
  async recordDetailedAttempt(virtualItem, result, score, isCorrect) {
    try {
      const attemptData = {
        itemId: virtualItem.id,
        userAnswer: result.userResponse || '',
        isCorrect,
        score,
        timeSpent: this.calculateTimeSpent(result),
        errorTags: this.extractErrorTags(result),
        metadata: {
          exerciseType: virtualItem.metadata.exerciseType,
          exerciseId: virtualItem.metadata.exerciseId,
          difficulty: virtualItem.difficulty,
          wordCount: result.userResponse ? result.userResponse.split(/\s+/).length : 0,
          analysisData: this.sanitizeAnalysisData(result.analysis),
          assessmentData: this.sanitizeAssessmentData(result.assessment)
        }
      };

      await recordAttempt(this.userId, attemptData);
      logger.debug(`Detailed attempt recorded for: ${virtualItem.id}`);

    } catch (error) {
      logger.error('Failed to record detailed attempt:', error);
      // No re-throw para no bloquear el flujo principal
    }
  }

  /**
   * Calcular puntuación para SRS basada en el resultado del ejercicio
   * @param {Object} result - Resultado del ejercicio
   * @returns {number} Puntuación entre 0 y 1
   */
  calculateSRSScore(result) {
    let score = 0.5; // Base score

    // Puntuación por éxito básico del ejercicio
    if (result.success) score += 0.3;

    // Puntuación por calidad del assessment
    if (result.assessment) {
      const { grammarScore = 0.7, creativityScore = 0.7, contentScore = 0.7 } = result.assessment;
      score += (grammarScore * 0.1) + (creativityScore * 0.05) + (contentScore * 0.05);
    }

    // Puntuación por análisis específico del ejercicio
    if (result.analysis) {
      if (result.analysis.isCorrect || result.analysis.meetsRequirements) {
        score += 0.2;
      }
      if (result.analysis.qualityScore) {
        score += result.analysis.qualityScore * 0.1;
      }
      if (result.analysis.completionPercentage) {
        score += result.analysis.completionPercentage * 0.1;
      }
    }

    // Bonus por respuestas largas y detalladas
    if (result.userResponse && result.userResponse.length > 200) {
      score += 0.05;
    }

    return Math.min(Math.max(score, 0), 1.0);
  }

  /**
   * Calcular tiempo empleado en el ejercicio
   * @param {Object} result - Resultado del ejercicio
   * @returns {number} Tiempo en segundos
   */
  calculateTimeSpent(result) {
    if (result.timeSpent) return result.timeSpent;
    if (result.timestamp && result.startTime) {
      return Math.floor((result.timestamp - result.startTime) / 1000);
    }
    return 60; // Default: 1 minuto
  }

  /**
   * Extraer etiquetas de error del resultado
   * @param {Object} result - Resultado del ejercicio
   * @returns {Array} Array de etiquetas de error
   */
  extractErrorTags(result) {
    const errorTags = [];

    if (result.assessment && result.assessment.errors) {
      result.assessment.errors.forEach(error => {
        switch (error.category) {
          case 'conjugation':
            errorTags.push(ERROR_TAGS.CONJUGATION_ERROR);
            break;
          case 'tense':
            errorTags.push(ERROR_TAGS.WRONG_TENSE);
            break;
          case 'agreement':
            errorTags.push(ERROR_TAGS.AGREEMENT_ERROR);
            break;
          case 'vocabulary':
            errorTags.push(ERROR_TAGS.VOCABULARY_ERROR);
            break;
          case 'structure':
            errorTags.push(ERROR_TAGS.GRAMMAR_ERROR);
            break;
          default:
            errorTags.push(ERROR_TAGS.OTHER);
        }
      });
    }

    // Agregar etiquetas basadas en el tipo de ejercicio
    if (result.analysis && !result.analysis.isCorrect) {
      if (result.analysis.elementsMissing?.length > 0) {
        errorTags.push(ERROR_TAGS.INCOMPLETE_RESPONSE);
      }
      if (result.analysis.verbsMissing?.length > 0) {
        errorTags.push(ERROR_TAGS.MISSING_VERBS);
      }
    }

    return [...new Set(errorTags)];
  }

  /**
   * Sanitizar datos de análisis para almacenamiento
   * @param {Object} analysis - Datos de análisis
   * @returns {Object} Datos sanitizados
   */
  sanitizeAnalysisData(analysis) {
    if (!analysis) return {};

    return {
      isCorrect: analysis.isCorrect,
      meetsRequirements: analysis.meetsRequirements,
      qualityScore: analysis.qualityScore,
      completionPercentage: analysis.completionPercentage,
      elementsUsed: analysis.elementsUsed?.length || 0,
      verbsDetected: analysis.verbsDetected?.length || 0,
      wordCount: analysis.wordCount || 0
    };
  }

  /**
   * Sanitizar datos de assessment para almacenamiento
   * @param {Object} assessment - Datos de assessment
   * @returns {Object} Datos sanitizados
   */
  sanitizeAssessmentData(assessment) {
    if (!assessment) return {};

    return {
      grammarScore: assessment.grammarScore,
      creativityScore: assessment.creativityScore,
      contentScore: assessment.contentScore,
      overallScore: assessment.overallScore,
      errorCount: assessment.errors?.length || 0,
      suggestionCount: assessment.suggestions?.length || 0
    };
  }

  /**
   * Actualizar métricas de sesión
   * @param {number} score - Puntuación del ejercicio
   * @param {boolean} isCorrect - Si fue correcto
   */
  updateSessionMetrics(score, isCorrect) {
    this.sessionMetrics.totalAttempts++;
    if (isCorrect) {
      this.sessionMetrics.correctAttempts++;
    }

    // Actualizar promedio de puntuación
    const currentAverage = this.sessionMetrics.averageScore;
    const totalAttempts = this.sessionMetrics.totalAttempts;
    this.sessionMetrics.averageScore = (currentAverage * (totalAttempts - 1) + score) / totalAttempts;
  }

  /**
   * Obtener items SRS recomendados para práctica
   * @param {Array} eligibleForms - Formas elegibles del generador
   * @param {number} limit - Límite de items a retornar
   * @returns {Array} Items SRS recomendados
   */
  async getRecommendedSRSItems(eligibleForms = [], limit = 10) {
    try {
      if (!this.userId) {
        await this.initialize();
      }

      // Crear items virtuales para formas elegibles
      const virtualItems = eligibleForms.slice(0, limit).map(form => ({
        id: `meaningful_practice_${form.mood}_${form.tense}`,
        verb: 'práctica_significativa',
        form: `${form.mood}_${form.tense}`,
        mood: form.mood,
        tense: form.tense,
        type: 'meaningful_practice'
      }));

      // Obtener schedules SRS para los items
      const schedules = await getScheduleForItems(this.userId, virtualItems.map(item => item.id));

      // Combinar items con sus schedules
      const itemsWithSchedules = virtualItems.map(item => {
        const schedule = schedules.find(s => s.itemId === item.id);
        return {
          ...item,
          schedule: schedule || {
            itemId: item.id,
            userId: this.userId,
            dueDate: Date.now(), // Inmediatamente disponible para nuevos items
            interval: 1,
            repetitions: 0,
            easiness: 2.5
          }
        };
      });

      // Ordenar por prioridad SRS (items vencidos primero)
      itemsWithSchedules.sort((a, b) => {
        const aDue = a.schedule.dueDate <= Date.now();
        const bDue = b.schedule.dueDate <= Date.now();

        if (aDue && !bDue) return -1;
        if (!aDue && bDue) return 1;

        // Si ambos están vencidos o no vencidos, ordenar por fecha de vencimiento
        return a.schedule.dueDate - b.schedule.dueDate;
      });

      logger.debug(`Retrieved ${itemsWithSchedules.length} recommended SRS items`);
      return itemsWithSchedules;

    } catch (error) {
      logger.error('Failed to get recommended SRS items:', error);
      return [];
    }
  }

  /**
   * Obtener métricas de la sesión actual
   * @returns {Object} Métricas de sesión
   */
  getSessionMetrics() {
    const sessionDuration = Date.now() - this.sessionMetrics.sessionStartTime;
    const accuracyRate = this.sessionMetrics.totalAttempts > 0
      ? this.sessionMetrics.correctAttempts / this.sessionMetrics.totalAttempts
      : 0;

    return {
      ...this.sessionMetrics,
      sessionDuration,
      accuracyRate,
      exercisesPerMinute: this.sessionMetrics.exercisesCompleted / (sessionDuration / 60000)
    };
  }

  /**
   * Reiniciar métricas de sesión
   */
  resetSessionMetrics() {
    this.sessionMetrics = {
      exercisesCompleted: 0,
      totalAttempts: 0,
      correctAttempts: 0,
      averageScore: 0,
      sessionStartTime: Date.now()
    };
  }

  /**
   * Verificar si el usuario necesita ejercicios de repaso
   * @returns {boolean} True si necesita repaso
   */
  async needsReview() {
    try {
      const sessionMetrics = this.getSessionMetrics();

      // Necesita repaso si:
      // - Tasa de acierto < 70%
      // - Puntuación promedio < 0.6
      // - Ha pasado más de una hora sin ejercicios correctos

      return sessionMetrics.accuracyRate < 0.7 ||
             sessionMetrics.averageScore < 0.6 ||
             (sessionMetrics.sessionDuration > 3600000 && sessionMetrics.correctAttempts === 0);

    } catch (error) {
      logger.error('Failed to check review needs:', error);
      return false;
    }
  }
}

// Instancia singleton del adaptador
const srsAdapter = new SRSAdapter();

export default srsAdapter;