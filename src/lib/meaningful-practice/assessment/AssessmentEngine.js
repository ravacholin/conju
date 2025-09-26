/**
 * AssessmentEngine - Motor de evaluación integrado
 *
 * Este módulo integra todos los componentes de evaluación (LanguageAnalyzer,
 * ErrorClassifier, FeedbackGenerator) para proporcionar una evaluación
 * completa y coherente de las respuestas del usuario.
 *
 * @module AssessmentEngine
 */

import { createLogger } from '../../utils/logger.js';
import languageAnalyzer from './LanguageAnalyzer.js';
import errorClassifier from './ErrorClassifier.js';
import feedbackGenerator from './FeedbackGenerator.js';

const logger = createLogger('AssessmentEngine');

/**
 * Motor de evaluación principal
 */
export class AssessmentEngine {
  constructor() {
    this.assessmentCount = 0;
    this.performanceHistory = new Map();

    logger.info('AssessmentEngine initialized');
  }

  /**
   * Evalúa una respuesta del usuario de manera completa
   * @param {string} userResponse - Respuesta del usuario
   * @param {Object} context - Contexto del ejercicio
   * @param {string} context.expectedTense - Tiempo verbal esperado
   * @param {string[]} context.expectedVerbs - Verbos esperados
   * @param {string} context.exerciseType - Tipo de ejercicio
   * @param {string} context.difficulty - Nivel de dificultad
   * @param {string} context.category - Categoría del ejercicio
   * @param {Object} [userProfile] - Perfil del usuario para personalización
   * @returns {Promise<Object>} Evaluación completa
   */
  async assessResponse(userResponse, context, userProfile = null) {
    try {
      const startTime = Date.now();

      logger.debug('Starting response assessment', {
        responseLength: userResponse.length,
        exerciseType: context.exerciseType,
        expectedTense: context.expectedTense
      });

      // Paso 1: Análisis lingüístico
      const languageAnalysis = await languageAnalyzer.analyzeText(userResponse, context);

      // Paso 2: Clasificación de errores
      const errorClassification = await errorClassifier.classifyErrors(languageAnalysis, context);

      // Paso 3: Generación de feedback
      const feedback = await feedbackGenerator.generateFeedback(
        languageAnalysis,
        errorClassification,
        context,
        userProfile
      );

      // Paso 4: Compilar evaluación completa
      const assessment = this.compileAssessment(
        languageAnalysis,
        errorClassification,
        feedback,
        context,
        startTime
      );

      // Paso 5: Actualizar historial de rendimiento
      if (userProfile && userProfile.userId) {
        this.updatePerformanceHistory(userProfile.userId, assessment);
      }

      this.assessmentCount++;

      logger.info('Response assessment completed', {
        score: assessment.overallScore,
        level: assessment.performanceLevel,
        processingTime: assessment.processingTime
      });

      return assessment;
    } catch (error) {
      logger.error('Error in response assessment:', error);
      return this.getDefaultAssessment(userResponse, context);
    }
  }

  /**
   * Compila la evaluación completa
   * @param {Object} languageAnalysis - Análisis lingüístico
   * @param {Object} errorClassification - Clasificación de errores
   * @param {Object} feedback - Feedback generado
   * @param {Object} context - Contexto del ejercicio
   * @param {number} startTime - Tiempo de inicio del procesamiento
   * @returns {Object} Evaluación completa
   */
  compileAssessment(languageAnalysis, errorClassification, feedback, context, startTime) {
    const assessment = {
      // Información básica
      userResponse: languageAnalysis.originalText,
      exerciseContext: context,

      // Resultados principales
      overallScore: feedback.performance.score,
      performanceLevel: feedback.performance.level,

      // Análisis detallado
      linguisticAnalysis: {
        wordCount: languageAnalysis.wordCount,
        verbCount: languageAnalysis.verbCount,
        tenseConsistency: languageAnalysis.tenseConsistency,
        dominantTense: languageAnalysis.dominantTense,
        expectedTenseUsage: languageAnalysis.expectedTenseUsage,
        complexity: languageAnalysis.complexity,
        coherence: languageAnalysis.coherence
      },

      // Clasificación de errores
      errorAnalysis: {
        totalErrors: errorClassification.totalErrors,
        errorsByCategory: errorClassification.errorsByCategory,
        errorsByType: errorClassification.errorsByType,
        errorsBySeverity: errorClassification.errorsBySeverity,
        criticalErrors: errorClassification.specificErrors.filter(e => e.severity >= 4),
        improvementAreas: errorClassification.progressIndicators.improvementAreas,
        strengths: errorClassification.progressIndicators.strengths
      },

      // Feedback para el usuario
      userFeedback: {
        primaryMessage: feedback.primaryMessage,
        encouragement: feedback.encouragement,
        corrections: feedback.corrections,
        suggestions: feedback.suggestions,
        nextSteps: feedback.nextSteps,
        resources: feedback.resources
      },

      // Métricas de rendimiento
      metrics: {
        accuracy: feedback.metrics.accuracy,
        completeness: feedback.metrics.completeness,
        appropriateness: feedback.metrics.appropriateness,
        complexity: feedback.metrics.complexity,
        errorDensity: errorClassification.progressIndicators.errorDensity,
        severityIndex: errorClassification.progressIndicators.severityIndex
      },

      // Resultados para integración con SRS
      srsData: this.generateSRSData(languageAnalysis, errorClassification, context),

      // Metadatos
      processingTime: Date.now() - startTime,
      assessmentTimestamp: Date.now(),
      assessmentVersion: '1.0.0'
    };

    return assessment;
  }

  /**
   * Genera datos para integración con SRS
   * @param {Object} languageAnalysis - Análisis lingüístico
   * @param {Object} errorClassification - Clasificación de errores
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object} Datos para SRS
   */
  generateSRSData(languageAnalysis, errorClassification, context) {
    // Determinar si la respuesta fue correcta globalmente
    const isCorrect = errorClassification.totalErrors === 0 &&
                     languageAnalysis.accuracy > 0.8 &&
                     languageAnalysis.completeness > 0.7;

    // Calcular número de pistas equivalentes basado en errores
    const hintsUsed = Math.min(errorClassification.totalErrors, 3);

    // Generar etiquetas de error para el sistema existente
    const errorTags = this.mapErrorsToSRSTags(errorClassification);

    // Determinar si es un verbo irregular (análisis básico)
    const isIrregular = languageAnalysis.irregularVerbs &&
                       languageAnalysis.irregularVerbs.length > 0;

    return {
      correct: isCorrect,
      userAnswer: languageAnalysis.originalText,
      correctAnswer: context.expectedVerbs ? context.expectedVerbs.join(', ') : 'respuesta apropiada',
      hintsUsed,
      errorTags,
      latencyMs: 0, // No aplicable para este tipo de ejercicio
      isIrregular,

      // Datos adicionales para análisis avanzado
      partialCredit: languageAnalysis.completeness,
      complexityBonus: languageAnalysis.complexity > 0.6 ? 0.1 : 0,
      consistencyScore: languageAnalysis.tenseConsistency,

      // Metadatos para tracking avanzado
      metadata: {
        wordCount: languageAnalysis.wordCount,
        verbCount: languageAnalysis.verbCount,
        errorCount: errorClassification.totalErrors,
        dominantTense: languageAnalysis.dominantTense,
        exerciseType: context.exerciseType
      }
    };
  }

  /**
   * Mapea errores a etiquetas del sistema SRS existente
   * @param {Object} errorClassification - Clasificación de errores
   * @returns {string[]} Etiquetas de error para SRS
   */
  mapErrorsToSRSTags(errorClassification) {
    const tags = [];

    // Mapear categorías de error a etiquetas SRS
    const categoryToTag = {
      conjugation: 'CONJUGATION_ERROR',
      agreement: 'GENDER_AGREEMENT',
      vocabulary: 'VOCABULARY_ERROR',
      grammar: 'GRAMMAR_ERROR',
      content: 'MISSING_VERBS',
      orthography: 'SPELLING_ERROR'
    };

    // Agregar etiquetas basadas en categorías de error
    for (const [category, count] of Object.entries(errorClassification.errorsByCategory)) {
      if (count > 0 && categoryToTag[category]) {
        tags.push(categoryToTag[category]);
      }
    }

    // Agregar etiquetas especiales
    if (errorClassification.totalErrors === 0) {
      tags.push('PERFECT_RESPONSE');
    } else if (errorClassification.totalErrors > 5) {
      tags.push('MULTIPLE_ERRORS');
    }

    // Agregar etiqueta de tiempo verbal si hay problemas
    if (errorClassification.errorsByType.wrong_tense > 0) {
      tags.push('WRONG_TENSE_DETECTED');
    }

    return tags;
  }

  /**
   * Evalúa múltiples respuestas en batch (para ejercicios de múltiples pasos)
   * @param {Object[]} responses - Lista de respuestas con contexto
   * @param {Object} globalContext - Contexto global del ejercicio
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Promise<Object>} Evaluación agregada
   */
  async assessMultipleResponses(responses, globalContext, userProfile = null) {
    try {
      const individualAssessments = [];

      // Evaluar cada respuesta individualmente
      for (const responseData of responses) {
        const context = { ...globalContext, ...responseData.context };
        const assessment = await this.assessResponse(
          responseData.response,
          context,
          userProfile
        );
        individualAssessments.push(assessment);
      }

      // Compilar evaluación agregada
      return this.compileAggregatedAssessment(individualAssessments, globalContext);
    } catch (error) {
      logger.error('Error in batch assessment:', error);
      return this.getDefaultAssessment('', globalContext);
    }
  }

  /**
   * Compila evaluación agregada de múltiples respuestas
   * @param {Object[]} assessments - Lista de evaluaciones individuales
   * @param {Object} globalContext - Contexto global
   * @returns {Object} Evaluación agregada
   */
  compileAggregatedAssessment(assessments, globalContext) {
    const totalResponses = assessments.length;

    // Calcular métricas promedio
    const avgScore = assessments.reduce((sum, a) => sum + a.overallScore, 0) / totalResponses;
    const avgAccuracy = assessments.reduce((sum, a) => sum + a.metrics.accuracy, 0) / totalResponses;
    const totalErrors = assessments.reduce((sum, a) => sum + a.errorAnalysis.totalErrors, 0);

    // Determinar nivel de rendimiento general
    const performanceLevel = this.determineAggregatedPerformanceLevel(avgScore);

    // Compilar errores más frecuentes
    const aggregatedErrors = this.aggregateErrorCategories(assessments);

    // Generar feedback agregado
    const aggregatedFeedback = this.generateAggregatedFeedback(
      assessments,
      performanceLevel,
      globalContext
    );

    return {
      totalResponses,
      overallScore: avgScore,
      performanceLevel,

      aggregatedMetrics: {
        averageAccuracy: avgAccuracy,
        totalErrors,
        errorRate: totalErrors / totalResponses,
        consistencyScore: this.calculateConsistencyScore(assessments)
      },

      errorAnalysis: aggregatedErrors,
      userFeedback: aggregatedFeedback,

      individualAssessments: assessments.map(a => ({
        score: a.overallScore,
        errors: a.errorAnalysis.totalErrors,
        level: a.performanceLevel
      })),

      srsData: this.generateAggregatedSRSData(assessments, globalContext),

      assessmentTimestamp: Date.now()
    };
  }

  /**
   * Determina nivel de rendimiento agregado
   * @param {number} avgScore - Puntuación promedio
   * @returns {string} Nivel de rendimiento
   */
  determineAggregatedPerformanceLevel(avgScore) {
    if (avgScore >= 90) return 'excellent';
    if (avgScore >= 75) return 'good';
    if (avgScore >= 60) return 'fair';
    return 'needs_improvement';
  }

  /**
   * Agrega categorías de error de múltiples evaluaciones
   * @param {Object[]} assessments - Lista de evaluaciones
   * @returns {Object} Errores agregados
   */
  aggregateErrorCategories(assessments) {
    const aggregated = {
      totalErrors: 0,
      errorsByCategory: {},
      mostFrequentCategories: []
    };

    for (const assessment of assessments) {
      aggregated.totalErrors += assessment.errorAnalysis.totalErrors;

      for (const [category, count] of Object.entries(assessment.errorAnalysis.errorsByCategory)) {
        aggregated.errorsByCategory[category] = (aggregated.errorsByCategory[category] || 0) + count;
      }
    }

    // Determinar categorías más frecuentes
    aggregated.mostFrequentCategories = Object.entries(aggregated.errorsByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    return aggregated;
  }

  /**
   * Calcula puntuación de consistencia entre respuestas
   * @param {Object[]} assessments - Lista de evaluaciones
   * @returns {number} Puntuación de consistencia (0-1)
   */
  calculateConsistencyScore(assessments) {
    if (assessments.length < 2) return 1;

    const scores = assessments.map(a => a.overallScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Calcular desviación estándar
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Convertir a puntuación de consistencia (0-1, donde 1 es máxima consistencia)
    return Math.max(0, 1 - (stdDev / 50)); // Normalizar considerando rango de puntuación 0-100
  }

  /**
   * Genera feedback agregado
   * @param {Object[]} assessments - Lista de evaluaciones
   * @param {string} performanceLevel - Nivel de rendimiento general
   * @param {Object} globalContext - Contexto global
   * @returns {Object} Feedback agregado
   */
  generateAggregatedFeedback(assessments, performanceLevel, globalContext) {
    const successfulResponses = assessments.filter(a => a.performanceLevel === 'excellent' || a.performanceLevel === 'good').length;
    const totalResponses = assessments.length;
    const successRate = successfulResponses / totalResponses;

    let primaryMessage = '';
    if (successRate >= 0.8) {
      primaryMessage = `¡Excelente trabajo! Has completado ${successfulResponses} de ${totalResponses} respuestas exitosamente.`;
    } else if (successRate >= 0.6) {
      primaryMessage = `¡Buen trabajo! Has tenido éxito en ${successfulResponses} de ${totalResponses} respuestas.`;
    } else {
      primaryMessage = `Has completado el ejercicio. ${successfulResponses} de ${totalResponses} respuestas fueron exitosas.`;
    }

    return {
      primaryMessage,
      encouragement: this.getAggregatedEncouragement(performanceLevel, successRate),
      overallSuggestions: this.getAggregatedSuggestions(assessments),
      progressSummary: {
        successRate: Math.round(successRate * 100),
        totalResponses,
        strongAreas: this.identifyStrongAreas(assessments),
        improvementAreas: this.identifyImprovementAreas(assessments)
      }
    };
  }

  /**
   * Obtiene mensaje de aliento agregado
   * @param {string} performanceLevel - Nivel de rendimiento
   * @param {number} successRate - Tasa de éxito
   * @returns {string} Mensaje de aliento
   */
  getAggregatedEncouragement(performanceLevel, successRate) {
    if (successRate >= 0.9) {
      return '¡Tu consistencia es impresionante! Estás demostrando un dominio sólido.';
    } else if (successRate >= 0.7) {
      return '¡Vas muy bien! Tu progreso es constante y positivo.';
    } else {
      return '¡Sigue practicando! Cada ejercicio te ayuda a mejorar.';
    }
  }

  /**
   * Genera sugerencias agregadas
   * @param {Object[]} assessments - Lista de evaluaciones
   * @returns {string[]} Lista de sugerencias
   */
  getAggregatedSuggestions(assessments) {
    const allSuggestions = assessments.flatMap(a => a.userFeedback.suggestions);
    const suggestionCounts = {};

    // Contar frecuencia de sugerencias similares
    for (const suggestion of allSuggestions) {
      const key = suggestion.category || suggestion.type;
      suggestionCounts[key] = (suggestionCounts[key] || 0) + 1;
    }

    // Retornar sugerencias más frecuentes
    return Object.entries(suggestionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) =>
        `Enfócate en mejorar: ${category} (mencionado en ${count} respuestas)`
      );
  }

  /**
   * Identifica áreas fuertes
   * @param {Object[]} assessments - Lista de evaluaciones
   * @returns {string[]} Áreas fuertes
   */
  identifyStrongAreas(assessments) {
    // Análisis básico de fortalezas
    const allStrengths = assessments.flatMap(a => a.errorAnalysis.strengths || []);
    const strengthCounts = {};

    for (const strength of allStrengths) {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    }

    return Object.entries(strengthCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([strength]) => strength);
  }

  /**
   * Identifica áreas de mejora
   * @param {Object[]} assessments - Lista de evaluaciones
   * @returns {string[]} Áreas de mejora
   */
  identifyImprovementAreas(assessments) {
    const allImprovements = assessments.flatMap(a => a.errorAnalysis.improvementAreas || []);
    const improvementCounts = {};

    for (const improvement of allImprovements) {
      improvementCounts[improvement] = (improvementCounts[improvement] || 0) + 1;
    }

    return Object.entries(improvementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([improvement]) => improvement);
  }

  /**
   * Genera datos SRS agregados
   * @param {Object[]} assessments - Lista de evaluaciones
   * @param {Object} globalContext - Contexto global
   * @returns {Object} Datos SRS agregados
   */
  generateAggregatedSRSData(assessments, globalContext) {
    const correctCount = assessments.filter(a => a.srsData.correct).length;
    const totalCount = assessments.length;
    const overallCorrect = correctCount / totalCount >= 0.7; // 70% o más correcto

    return {
      correct: overallCorrect,
      userAnswer: `${correctCount}/${totalCount} respuestas correctas`,
      correctAnswer: 'ejercicio completo',
      hintsUsed: Math.round(assessments.reduce((sum, a) => sum + a.srsData.hintsUsed, 0) / totalCount),
      errorTags: [...new Set(assessments.flatMap(a => a.srsData.errorTags))],
      latencyMs: 0,
      isIrregular: assessments.some(a => a.srsData.isIrregular),
      partialCredit: correctCount / totalCount,
      metadata: {
        totalResponses: totalCount,
        successRate: correctCount / totalCount,
        aggregatedAssessment: true
      }
    };
  }

  /**
   * Actualiza historial de rendimiento del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} assessment - Evaluación completa
   */
  updatePerformanceHistory(userId, assessment) {
    if (!this.performanceHistory.has(userId)) {
      this.performanceHistory.set(userId, []);
    }

    const history = this.performanceHistory.get(userId);
    history.push({
      timestamp: assessment.assessmentTimestamp,
      score: assessment.overallScore,
      level: assessment.performanceLevel,
      exerciseType: assessment.exerciseContext.exerciseType,
      tense: assessment.exerciseContext.expectedTense,
      errorCount: assessment.errorAnalysis.totalErrors
    });

    // Mantener solo los últimos 50 registros
    if (history.length > 50) {
      history.shift();
    }

    logger.debug(`Performance history updated for user ${userId}`, {
      totalEntries: history.length,
      latestScore: assessment.overallScore
    });
  }

  /**
   * Obtiene historial de rendimiento de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Object[]} Historial de rendimiento
   */
  getPerformanceHistory(userId) {
    return this.performanceHistory.get(userId) || [];
  }

  /**
   * Genera evaluación por defecto en caso de error
   * @param {string} userResponse - Respuesta del usuario
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object} Evaluación básica
   */
  getDefaultAssessment(userResponse, context) {
    return {
      userResponse,
      exerciseContext: context,
      overallScore: 50,
      performanceLevel: 'fair',

      linguisticAnalysis: {
        wordCount: userResponse.split(/\s+/).length,
        verbCount: 0,
        tenseConsistency: 0.5,
        dominantTense: null,
        expectedTenseUsage: 0,
        complexity: 0.5,
        coherence: 0.5
      },

      errorAnalysis: {
        totalErrors: 0,
        errorsByCategory: {},
        errorsByType: {},
        errorsBySeverity: {},
        criticalErrors: [],
        improvementAreas: [],
        strengths: []
      },

      userFeedback: {
        primaryMessage: 'Has completado el ejercicio. ¡Sigue practicando!',
        encouragement: '¡Cada práctica te acerca más a la fluidez!',
        corrections: [],
        suggestions: [],
        nextSteps: [],
        resources: []
      },

      metrics: {
        accuracy: 0.5,
        completeness: 0.5,
        appropriateness: 0.5,
        complexity: 0.5,
        errorDensity: 0,
        severityIndex: 0
      },

      srsData: {
        correct: false,
        userAnswer: userResponse,
        correctAnswer: 'respuesta apropiada',
        hintsUsed: 1,
        errorTags: ['ASSESSMENT_ERROR'],
        latencyMs: 0,
        isIrregular: false,
        partialCredit: 0.5
      },

      processingTime: 0,
      assessmentTimestamp: Date.now(),
      error: true
    };
  }

  /**
   * Obtiene estadísticas del motor de evaluación
   * @returns {Object} Estadísticas de uso
   */
  getStats() {
    return {
      totalAssessments: this.assessmentCount,
      usersWithHistory: this.performanceHistory.size,
      componentsStatus: {
        languageAnalyzer: languageAnalyzer.getStats(),
        errorClassifier: errorClassifier.getStats(),
        feedbackGenerator: feedbackGenerator.getStats()
      }
    };
  }

  /**
   * Limpia el historial de rendimiento
   */
  clearPerformanceHistory() {
    this.performanceHistory.clear();
    logger.info('Performance history cleared');
  }
}

// Instancia singleton
const assessmentEngine = new AssessmentEngine();

export default assessmentEngine;
export { AssessmentEngine };