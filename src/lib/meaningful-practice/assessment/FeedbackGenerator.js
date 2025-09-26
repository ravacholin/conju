/**
 * FeedbackGenerator - Generación de retroalimentación contextual y personalizada
 *
 * Este módulo genera feedback inteligente basado en el análisis lingüístico,
 * clasificación de errores y el contexto del ejercicio. Proporciona mensajes
 * motivadores, sugerencias específicas y planes de mejora personalizados.
 *
 * @module FeedbackGenerator
 */

import { createLogger } from '../../utils/logger.js';
import { MESSAGES, ASSESSMENT_CONFIG, DIFFICULTY_LEVELS } from '../core/constants.js';

const logger = createLogger('FeedbackGenerator');

/**
 * Plantillas de feedback por tipo de ejercicio
 */
const FEEDBACK_TEMPLATES = {
  timeline: {
    excellent: [
      '¡Excelente narrativa! Has seguido perfectamente la línea de tiempo usando {tense}.',
      '¡Increíble! Tu historia fluye naturalmente y usa todos los verbos correctamente.',
      '¡Perfecto! Has demostrado un dominio excelente del {tense} en contexto narrativo.'
    ],
    good: [
      '¡Muy bien! Tu historia sigue la línea de tiempo, solo necesitas ajustar: {improvements}.',
      '¡Buen trabajo! Has usado la mayoría de los verbos correctamente. Puedes mejorar: {improvements}.',
      '¡Bien hecho! Tu narrativa está en el camino correcto. Considera: {improvements}.'
    ],
    fair: [
      'Tu historia tiene una buena base. Para mejorar, enfócate en: {improvements}.',
      'Vas por buen camino. Sigue practicando especialmente: {improvements}.',
      'Has hecho un esfuerzo sólido. Las siguientes áreas necesitan atención: {improvements}.'
    ],
    needs_improvement: [
      'Tu respuesta muestra esfuerzo, pero necesita trabajo en: {improvements}.',
      'Para mejorar tu historia, concéntrate en: {improvements}.',
      'Sigue intentando. Las áreas clave para practicar son: {improvements}.'
    ]
  },

  prompts: {
    excellent: [
      '¡Perfecto! Has completado todos los prompts con excelente uso del {tense}.',
      '¡Excelente trabajo! Tus respuestas demuestran un dominio sólido del tiempo verbal.',
      '¡Increíble! Has manejado todos los prompts con precisión y creatividad.'
    ],
    good: [
      '¡Muy bien! Has completado la mayoría de prompts correctamente. Revisa: {improvements}.',
      '¡Buen progreso! Solo necesitas pulir algunos aspectos: {improvements}.',
      '¡Bien hecho! Tus respuestas son buenas, puedes mejorar: {improvements}.'
    ],
    fair: [
      'Has respondido bien varios prompts. Para mejorar, enfócate en: {improvements}.',
      'Buen esfuerzo en los prompts. Las siguientes áreas necesitan práctica: {improvements}.',
      'Vas progresando. Continúa trabajando en: {improvements}.'
    ],
    needs_improvement: [
      'Tus respuestas muestran esfuerzo, pero necesitas practicar: {improvements}.',
      'Para mejorar en los prompts, concéntrate en: {improvements}.',
      'Sigue practicando, especialmente en: {improvements}.'
    ]
  },

  chat: {
    excellent: [
      '¡Excelente conversación! Has mantenido el tiempo verbal {tense} durante todo el chat.',
      '¡Increíble! Tus respuestas fueron naturales y usaron el vocabulario apropiado.',
      '¡Perfecto! Has demostrado excelentes habilidades comunicativas en {tense}.'
    ],
    good: [
      '¡Buena conversación! Solo necesitas ajustar: {improvements}.',
      '¡Bien! Has mantenido la conversación fluida. Puedes mejorar: {improvements}.',
      '¡Buen trabajo comunicativo! Considera trabajar en: {improvements}.'
    ],
    fair: [
      'Tu conversación fue adecuada. Para mejorar, practica: {improvements}.',
      'Has participado bien en la conversación. Enfócate en: {improvements}.',
      'Buen intento conversacional. Las áreas de mejora son: {improvements}.'
    ],
    needs_improvement: [
      'Tu participación muestra esfuerzo, pero necesitas trabajar en: {improvements}.',
      'Para mejorar tus habilidades conversacionales, practica: {improvements}.',
      'Sigue intentando. Concéntrate especialmente en: {improvements}.'
    ]
  },

  daily_routine: {
    excellent: [
      '¡Excelente descripción! Has pintado un cuadro completo de la rutina usando {tense}.',
      '¡Increíble! Tu descripción es detallada y usa todos los verbos apropiadamente.',
      '¡Perfecto! Has demostrado excelente manejo del {tense} en rutinas diarias.'
    ],
    good: [
      '¡Muy bien! Tu descripción es clara, solo ajusta: {improvements}.',
      '¡Buen trabajo! Has descrito la rutina bien. Puedes mejorar: {improvements}.',
      '¡Bien hecho! Tu rutina está bien estructurada. Considera: {improvements}.'
    ],
    fair: [
      'Tu descripción de rutina es adecuada. Para mejorar, trabaja en: {improvements}.',
      'Has descrito bien varios aspectos. Enfócate en: {improvements}.',
      'Buen intento con la rutina. Las áreas de mejora son: {improvements}.'
    ],
    needs_improvement: [
      'Tu descripción muestra esfuerzo, pero necesitas practicar: {improvements}.',
      'Para mejorar tu descripción de rutinas, enfócate en: {improvements}.',
      'Sigue intentando. Trabaja especialmente en: {improvements}.'
    ]
  }
};

/**
 * Mensajes motivacionales por nivel de dificultad
 */
const MOTIVATIONAL_MESSAGES = {
  [DIFFICULTY_LEVELS.BEGINNER]: [
    '¡Estás dando grandes pasos en tu aprendizaje!',
    '¡Cada error es una oportunidad de aprender!',
    '¡Sigue así, lo estás haciendo muy bien!',
    '¡El progreso es más importante que la perfección!'
  ],
  [DIFFICULTY_LEVELS.INTERMEDIATE]: [
    '¡Tu progreso es notable!',
    '¡Estás desarrollando buenas habilidades!',
    '¡Sigue desafiándote a ti mismo!',
    '¡Cada práctica te acerca a la fluidez!'
  ],
  [DIFFICULTY_LEVELS.ADVANCED]: [
    '¡Tu nivel avanzado se nota!',
    '¡Estás refinando tu dominio del español!',
    '¡Sigue puliendo los detalles!',
    '¡La precisión viene con la práctica!'
  ],
  [DIFFICULTY_LEVELS.EXPERT]: [
    '¡Tu expertise es impresionante!',
    '¡Estás alcanzando niveles de maestría!',
    '¡Los matices del idioma están a tu alcance!',
    '¡La excelencia es tu estándar!'
  ]
};

/**
 * Sugerencias específicas por tipo de error
 */
const ERROR_SPECIFIC_SUGGESTIONS = {
  conjugation: [
    'Practica la conjugación de verbos regulares en {tense}',
    'Repasa las terminaciones verbales para {tense}',
    'Intenta conjugar verbos similares para crear patrones mentales'
  ],
  agreement: [
    'Recuerda la concordancia de género: el/la, un/una',
    'Practica la concordancia de número: singular/plural',
    'Verifica que artículos y sustantivos concuerden'
  ],
  vocabulary: [
    'Amplía tu vocabulario en el tema de {category}',
    'Practica el uso de ser vs estar en diferentes contextos',
    'Estudia preposiciones comunes y sus usos'
  ],
  grammar: [
    'Revisa las reglas gramaticales básicas',
    'Practica la estructura de oraciones en español',
    'Estudia el orden de palabras en español'
  ],
  orthography: [
    'Revisa las reglas de acentuación',
    'Practica la puntuación en español',
    'Verifica las mayúsculas al inicio de oraciones'
  ]
};

/**
 * Generador de feedback
 */
export class FeedbackGenerator {
  constructor() {
    this.feedbackCount = 0;
    this.userPreferences = new Map();

    logger.info('FeedbackGenerator initialized');
  }

  /**
   * Genera feedback completo basado en análisis y clasificación
   * @param {Object} languageAnalysis - Análisis del LanguageAnalyzer
   * @param {Object} errorClassification - Clasificación del ErrorClassifier
   * @param {Object} context - Contexto del ejercicio
   * @param {Object} userProfile - Perfil del usuario (opcional)
   * @returns {Promise<Object>} Feedback completo
   */
  async generateFeedback(languageAnalysis, errorClassification, context, userProfile = null) {
    try {
      const feedback = {
        // Mensaje principal
        primaryMessage: '',

        // Tipos de feedback
        encouragement: '',
        corrections: [],
        suggestions: [],

        // Análisis de rendimiento
        performance: {
          score: 0,
          level: '',
          breakdown: {}
        },

        // Próximos pasos
        nextSteps: [],
        resources: [],

        // Métricas
        metrics: {
          accuracy: languageAnalysis.accuracy || 0,
          completeness: languageAnalysis.completeness || 0,
          appropriateness: languageAnalysis.appropriateness || 0,
          complexity: languageAnalysis.complexity || 0
        },

        // Metadatos
        feedbackTimestamp: Date.now(),
        personalizedForUser: !!userProfile
      };

      // Calcular puntuación general
      feedback.performance.score = this.calculateOverallScore(languageAnalysis, errorClassification);
      feedback.performance.level = this.determinePerformanceLevel(feedback.performance.score);

      // Generar mensaje principal
      feedback.primaryMessage = await this.generatePrimaryMessage(
        feedback.performance.level,
        context,
        errorClassification
      );

      // Generar aliento/motivación
      feedback.encouragement = this.generateEncouragement(
        feedback.performance.level,
        context,
        userProfile
      );

      // Generar correcciones específicas
      feedback.corrections = await this.generateCorrections(
        errorClassification,
        context
      );

      // Generar sugerencias de mejora
      feedback.suggestions = await this.generateSuggestions(
        languageAnalysis,
        errorClassification,
        context,
        userProfile
      );

      // Generar próximos pasos
      feedback.nextSteps = this.generateNextSteps(
        errorClassification,
        feedback.performance,
        userProfile
      );

      // Generar recursos recomendados
      feedback.resources = this.generateResources(
        errorClassification,
        context,
        feedback.performance.level
      );

      // Desglose detallado de rendimiento
      feedback.performance.breakdown = this.generatePerformanceBreakdown(
        languageAnalysis,
        errorClassification
      );

      this.feedbackCount++;

      logger.debug('Feedback generated', {
        score: feedback.performance.score,
        level: feedback.performance.level,
        corrections: feedback.corrections.length,
        suggestions: feedback.suggestions.length
      });

      return feedback;
    } catch (error) {
      logger.error('Error generating feedback:', error);
      return this.getDefaultFeedback();
    }
  }

  /**
   * Calcula puntuación general
   * @param {Object} languageAnalysis - Análisis lingüístico
   * @param {Object} errorClassification - Clasificación de errores
   * @returns {number} Puntuación (0-100)
   */
  calculateOverallScore(languageAnalysis, errorClassification) {
    const accuracy = languageAnalysis.accuracy || 0;
    const completeness = languageAnalysis.completeness || 0;
    const appropriateness = languageAnalysis.appropriateness || 0;

    // Penalización por errores
    const errorPenalty = Math.min(errorClassification.totalErrors * 0.1, 0.5);

    // Puntuación base
    let score = (accuracy * 0.4 + completeness * 0.3 + appropriateness * 0.3) - errorPenalty;

    // Bonificación por complejidad apropiada
    const complexity = languageAnalysis.complexity || 0;
    if (complexity > 0.3 && complexity < 0.8) {
      score += 0.1; // Bonificación por complejidad apropiada
    }

    return Math.max(0, Math.min(1, score)) * 100; // Convertir a escala 0-100
  }

  /**
   * Determina nivel de rendimiento
   * @param {number} score - Puntuación (0-100)
   * @returns {string} Nivel de rendimiento
   */
  determinePerformanceLevel(score) {
    if (score >= ASSESSMENT_CONFIG.EXCELLENT_THRESHOLD * 100) return 'excellent';
    if (score >= ASSESSMENT_CONFIG.GOOD_THRESHOLD * 100) return 'good';
    if (score >= ASSESSMENT_CONFIG.FAIR_THRESHOLD * 100) return 'fair';
    return 'needs_improvement';
  }

  /**
   * Genera mensaje principal de feedback
   * @param {string} performanceLevel - Nivel de rendimiento
   * @param {Object} context - Contexto del ejercicio
   * @param {Object} errorClassification - Clasificación de errores
   * @returns {string} Mensaje principal
   */
  async generatePrimaryMessage(performanceLevel, context, errorClassification) {
    const exerciseType = context.exerciseType || 'timeline';
    const tense = context.expectedTense || context.tense || 'presente';

    const templates = FEEDBACK_TEMPLATES[exerciseType] || FEEDBACK_TEMPLATES.timeline;
    const levelTemplates = templates[performanceLevel] || templates.fair;

    // Seleccionar plantilla aleatoria
    const template = levelTemplates[Math.floor(Math.random() * levelTemplates.length)];

    // Generar mejoras específicas si es necesario
    let improvements = '';
    if (performanceLevel !== 'excellent') {
      improvements = this.generateImprovementSummary(errorClassification);
    }

    // Reemplazar placeholders
    return template
      .replace('{tense}', this.getTenseDisplayName(tense))
      .replace('{improvements}', improvements);
  }

  /**
   * Genera resumen de mejoras
   * @param {Object} errorClassification - Clasificación de errores
   * @returns {string} Resumen de mejoras
   */
  generateImprovementSummary(errorClassification) {
    const improvements = [];
    const topCategories = Object.entries(errorClassification.errorsByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    for (const [category, count] of topCategories) {
      if (count > 0) {
        const categoryName = this.getCategoryDisplayName(category);
        improvements.push(categoryName);
      }
    }

    if (improvements.length === 0) {
      return 'algunos detalles menores';
    }

    if (improvements.length === 1) {
      return improvements[0];
    }

    return improvements.slice(0, -1).join(', ') + ' y ' + improvements[improvements.length - 1];
  }

  /**
   * Genera mensaje de aliento
   * @param {string} performanceLevel - Nivel de rendimiento
   * @param {Object} context - Contexto del ejercicio
   * @param {Object} userProfile - Perfil del usuario
   * @returns {string} Mensaje motivacional
   */
  generateEncouragement(performanceLevel, context, userProfile) {
    const difficulty = context.difficulty || DIFFICULTY_LEVELS.INTERMEDIATE;
    const messages = MOTIVATIONAL_MESSAGES[difficulty] || MOTIVATIONAL_MESSAGES[DIFFICULTY_LEVELS.INTERMEDIATE];

    // Personalizar mensaje si hay perfil de usuario
    if (userProfile && performanceLevel !== 'excellent') {
      const streakMessages = [
        '¡Mantén tu racha de práctica!',
        '¡La consistencia es la clave del éxito!',
        '¡Cada día practicando es un paso adelante!'
      ];

      if (userProfile.streakDays > 3) {
        return streakMessages[Math.floor(Math.random() * streakMessages.length)];
      }
    }

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Genera correcciones específicas
   * @param {Object} errorClassification - Clasificación de errores
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object[]} Lista de correcciones
   */
  async generateCorrections(errorClassification, context) {
    const corrections = [];

    // Procesar errores específicos
    for (const error of errorClassification.specificErrors.slice(0, 3)) { // Máximo 3 correcciones
      const correction = {
        type: error.type,
        category: error.category,
        description: error.description,
        suggestion: error.suggestion,
        severity: error.severity,
        example: this.generateCorrectionExample(error, context)
      };

      corrections.push(correction);
    }

    return corrections;
  }

  /**
   * Genera ejemplo de corrección
   * @param {Object} error - Error específico
   * @param {Object} context - Contexto del ejercicio
   * @returns {string} Ejemplo de corrección
   */
  generateCorrectionExample(error, context) {
    if (error.examples && error.examples.length > 0) {
      return error.examples[0];
    }

    // Generar ejemplo básico según tipo de error
    const examples = {
      wrong_tense: `Correcto: "Ayer comí pizza" (no "Ayer como pizza")`,
      gender_agreement: `Correcto: "La mesa está limpia" (no "El mesa está limpia")`,
      missing_verbs: `Incluye todos los verbos sugeridos en tu respuesta`,
      conjugation_error: `Verifica la conjugación: "yo hablo", "tú hablas", "él habla"`
    };

    return examples[error.type] || 'Revisa esta construcción en tu respuesta';
  }

  /**
   * Genera sugerencias de mejora
   * @param {Object} languageAnalysis - Análisis lingüístico
   * @param {Object} errorClassification - Clasificación de errores
   * @param {Object} context - Contexto del ejercicio
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Object[]} Lista de sugerencias
   */
  async generateSuggestions(languageAnalysis, errorClassification, context, userProfile) {
    const suggestions = [];

    // Sugerencias basadas en clasificación de errores existentes
    suggestions.push(...errorClassification.suggestions);

    // Sugerencias adicionales basadas en análisis
    if (languageAnalysis.complexity < 0.3) {
      suggestions.push({
        type: 'complexity',
        message: 'Intenta usar oraciones más elaboradas y vocabulario variado',
        category: 'improvement',
        priority: 'medium'
      });
    }

    if (languageAnalysis.coherence < 0.6) {
      suggestions.push({
        type: 'coherence',
        message: 'Usa más conectores para mejorar la fluidez: entonces, después, porque',
        category: 'improvement',
        priority: 'medium'
      });
    }

    // Sugerencias específicas por categoría de error
    const topErrorCategories = Object.entries(errorClassification.errorsByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    for (const [category, count] of topErrorCategories) {
      if (count > 0 && ERROR_SPECIFIC_SUGGESTIONS[category]) {
        const categoryMessages = ERROR_SPECIFIC_SUGGESTIONS[category];
        const message = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];

        suggestions.push({
          type: 'error_specific',
          message: message
            .replace('{tense}', context.expectedTense || 'este tiempo verbal')
            .replace('{category}', context.category || 'esta área'),
          category: category,
          priority: count > 2 ? 'high' : 'medium'
        });
      }
    }

    // Personalizar sugerencias basadas en perfil de usuario
    if (userProfile) {
      suggestions.push(...this.generatePersonalizedSuggestions(userProfile, context));
    }

    // Eliminar duplicados y ordenar por prioridad
    return this.dedupAndPrioritizeSuggestions(suggestions);
  }

  /**
   * Genera sugerencias personalizadas
   * @param {Object} userProfile - Perfil del usuario
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object[]} Sugerencias personalizadas
   */
  generatePersonalizedSuggestions(userProfile, context) {
    const suggestions = [];

    // Sugerencias basadas en debilidades del usuario
    if (userProfile.weaknesses) {
      for (const [area, weakness] of Object.entries(userProfile.weaknesses)) {
        if (weakness > 0.6) {
          suggestions.push({
            type: 'weakness_focused',
            message: `Dedica tiempo extra a practicar ${area}`,
            category: 'personalized',
            priority: 'high'
          });
        }
      }
    }

    // Sugerencias basadas en preferencias
    if (userProfile.preferredCategories && userProfile.preferredCategories.length > 0) {
      suggestions.push({
        type: 'preference_based',
        message: `Practica más ejercicios de ${userProfile.preferredCategories[0]}`,
        category: 'personalized',
        priority: 'low'
      });
    }

    return suggestions;
  }

  /**
   * Elimina duplicados y prioriza sugerencias
   * @param {Object[]} suggestions - Lista de sugerencias
   * @returns {Object[]} Sugerencias optimizadas
   */
  dedupAndPrioritizeSuggestions(suggestions) {
    // Eliminar duplicados por mensaje
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.message === suggestion.message)
    );

    // Ordenar por prioridad
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    uniqueSuggestions.sort((a, b) =>
      (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
    );

    // Limitar a máximo 5 sugerencias
    return uniqueSuggestions.slice(0, 5);
  }

  /**
   * Genera próximos pasos recomendados
   * @param {Object} errorClassification - Clasificación de errores
   * @param {Object} performance - Información de rendimiento
   * @param {Object} userProfile - Perfil del usuario
   * @returns {Object[]} Lista de próximos pasos
   */
  generateNextSteps(errorClassification, performance, userProfile) {
    const steps = [];

    // Pasos basados en nivel de rendimiento
    if (performance.level === 'excellent') {
      steps.push({
        action: 'advance',
        description: 'Intenta ejercicios de mayor dificultad',
        priority: 'medium'
      });
    } else if (performance.level === 'needs_improvement') {
      steps.push({
        action: 'review',
        description: 'Repasa los conceptos básicos antes de continuar',
        priority: 'high'
      });
    }

    // Pasos basados en áreas de mejora
    const improvementAreas = errorClassification.progressIndicators.improvementAreas || [];
    for (const area of improvementAreas.slice(0, 2)) {
      steps.push({
        action: 'practice',
        description: `Practica ejercicios específicos de ${this.getCategoryDisplayName(area)}`,
        priority: 'high',
        category: area
      });
    }

    // Pasos basados en oportunidades de aprendizaje
    for (const opportunity of errorClassification.learningOpportunities.slice(0, 2)) {
      steps.push({
        action: 'learn',
        description: opportunity.description,
        priority: opportunity.priority,
        type: opportunity.type
      });
    }

    return steps.slice(0, 4); // Máximo 4 pasos
  }

  /**
   * Genera recursos recomendados
   * @param {Object} errorClassification - Clasificación de errores
   * @param {Object} context - Contexto del ejercicio
   * @param {string} performanceLevel - Nivel de rendimiento
   * @returns {Object[]} Lista de recursos
   */
  generateResources(errorClassification, context, performanceLevel) {
    const resources = [];

    // Recursos basados en categorías de error
    const topCategories = Object.keys(errorClassification.errorsByCategory);

    for (const category of topCategories.slice(0, 2)) {
      const resource = this.getCategoryResource(category, context);
      if (resource) {
        resources.push(resource);
      }
    }

    // Recursos generales según nivel
    if (performanceLevel === 'needs_improvement') {
      resources.push({
        type: 'grammar_review',
        title: 'Repaso de gramática básica',
        description: 'Conceptos fundamentales del español',
        difficulty: 'beginner'
      });
    }

    if (performanceLevel === 'excellent') {
      resources.push({
        type: 'advanced_practice',
        title: 'Ejercicios avanzados',
        description: 'Desafíos para estudiantes avanzados',
        difficulty: 'advanced'
      });
    }

    return resources;
  }

  /**
   * Obtiene recurso específico para una categoría
   * @param {string} category - Categoría de error
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object|null} Recurso recomendado
   */
  getCategoryResource(category, context) {
    const resources = {
      conjugation: {
        type: 'verb_practice',
        title: 'Práctica de conjugación',
        description: `Ejercicios de conjugación para ${context.expectedTense || 'diferentes tiempos'}`,
        difficulty: context.difficulty || 'intermediate'
      },
      agreement: {
        type: 'grammar_rules',
        title: 'Reglas de concordancia',
        description: 'Concordancia de género y número en español',
        difficulty: 'beginner'
      },
      vocabulary: {
        type: 'vocabulary_expansion',
        title: 'Ampliación de vocabulario',
        description: `Vocabulario temático: ${context.category || 'general'}`,
        difficulty: context.difficulty || 'intermediate'
      }
    };

    return resources[category] || null;
  }

  /**
   * Genera desglose detallado de rendimiento
   * @param {Object} languageAnalysis - Análisis lingüístico
   * @param {Object} errorClassification - Clasificación de errores
   * @returns {Object} Desglose de rendimiento
   */
  generatePerformanceBreakdown(languageAnalysis, errorClassification) {
    return {
      accuracy: {
        score: Math.round((languageAnalysis.accuracy || 0) * 100),
        description: 'Precisión en el uso del tiempo verbal'
      },
      completeness: {
        score: Math.round((languageAnalysis.completeness || 0) * 100),
        description: 'Completitud de la respuesta'
      },
      appropriateness: {
        score: Math.round((languageAnalysis.appropriateness || 0) * 100),
        description: 'Adecuación al contexto del ejercicio'
      },
      complexity: {
        score: Math.round((languageAnalysis.complexity || 0) * 100),
        description: 'Complejidad lingüística apropiada'
      },
      errorDensity: {
        score: Math.max(0, 100 - Math.round(errorClassification.progressIndicators.errorDensity * 100)),
        description: 'Control de errores por palabra'
      }
    };
  }

  /**
   * Obtiene nombre de visualización para tiempo verbal
   * @param {string} tense - Código del tiempo verbal
   * @returns {string} Nombre legible
   */
  getTenseDisplayName(tense) {
    const names = {
      pres: 'presente',
      pretIndef: 'pretérito indefinido',
      impf: 'imperfecto',
      fut: 'futuro',
      pretPerf: 'pretérito perfecto',
      cond: 'condicional',
      subjPres: 'subjuntivo presente',
      subjImpf: 'subjuntivo imperfecto'
    };

    return names[tense] || tense;
  }

  /**
   * Obtiene nombre de visualización para categoría
   * @param {string} category - Código de categoría
   * @returns {string} Nombre legible
   */
  getCategoryDisplayName(category) {
    const names = {
      conjugation: 'conjugación verbal',
      agreement: 'concordancia',
      vocabulary: 'vocabulario',
      grammar: 'gramática',
      orthography: 'ortografía',
      content: 'contenido',
      syntax: 'sintaxis',
      complexity: 'complejidad'
    };

    return names[category] || category;
  }

  /**
   * Genera feedback por defecto en caso de error
   * @returns {Object} Feedback básico
   */
  getDefaultFeedback() {
    return {
      primaryMessage: 'Has completado el ejercicio. ¡Sigue practicando!',
      encouragement: '¡Cada práctica te acerca más a la fluidez!',
      corrections: [],
      suggestions: [{
        type: 'general',
        message: 'Continúa practicando para mejorar tus habilidades',
        category: 'general',
        priority: 'medium'
      }],
      performance: {
        score: 50,
        level: 'fair',
        breakdown: {}
      },
      nextSteps: [{
        action: 'continue',
        description: 'Sigue practicando con más ejercicios',
        priority: 'medium'
      }],
      resources: [],
      metrics: {
        accuracy: 0.5,
        completeness: 0.5,
        appropriateness: 0.5,
        complexity: 0.5
      },
      feedbackTimestamp: Date.now(),
      personalizedForUser: false,
      error: true
    };
  }

  /**
   * Obtiene estadísticas del generador
   * @returns {Object} Estadísticas de uso
   */
  getStats() {
    return {
      totalFeedbackGenerated: this.feedbackCount,
      userPreferencesStored: this.userPreferences.size,
      availableTemplates: Object.keys(FEEDBACK_TEMPLATES).length,
      availableMessages: Object.values(MOTIVATIONAL_MESSAGES).flat().length
    };
  }

  /**
   * Configura preferencias de usuario para personalización
   * @param {string} userId - ID del usuario
   * @param {Object} preferences - Preferencias del usuario
   */
  setUserPreferences(userId, preferences) {
    this.userPreferences.set(userId, {
      ...preferences,
      updatedAt: Date.now()
    });

    logger.debug(`User preferences updated for ${userId}`);
  }

  /**
   * Obtiene preferencias de usuario
   * @param {string} userId - ID del usuario
   * @returns {Object|null} Preferencias del usuario
   */
  getUserPreferences(userId) {
    return this.userPreferences.get(userId) || null;
  }
}

// Instancia singleton
const feedbackGenerator = new FeedbackGenerator();

export default feedbackGenerator;
