/**
 * ErrorClassifier - Clasificación sofisticada de errores lingüísticos
 *
 * Este módulo clasifica errores detectados en las respuestas del usuario,
 * proporcionando análisis detallado y categorizaciones específicas para
 * generar feedback personalizado y tracking de progreso.
 *
 * @module ErrorClassifier
 */

import { createLogger } from '../../utils/logger.js';
import { ERROR_TYPES, ERROR_SEVERITY, TENSE_PATTERNS } from '../core/constants.js';

const logger = createLogger('ErrorClassifier');

/**
 * Patrones específicos de errores comunes en español
 */
const ERROR_PATTERNS = {
  // Errores de conjugación por tiempo verbal
  conjugationErrors: {
    pres: {
      // Confusión presente-pretérito
      wrongPreterite: {
        pattern: /\b\w+(é|aste|ó|amos|asteis|aron|í|iste|ió|imos|isteis|ieron)\b/g,
        description: 'Uso de pretérito en lugar de presente',
        suggestion: 'Usa la forma presente: hablo, comes, vive'
      },
      // Confusión con imperfecto
      wrongImperfect: {
        pattern: /\b\w+(aba|abas|ábamos|abais|aban|ía|ías|íamos|íais|ían)\b/g,
        description: 'Uso de imperfecto en lugar de presente',
        suggestion: 'Usa la forma presente sin terminaciones de pasado'
      }
    },
    pretIndef: {
      // Confusión pretérito-presente
      wrongPresent: {
        pattern: /\b\w+[oaes]\b(?!\w)/g,
        description: 'Uso de presente en lugar de pretérito',
        suggestion: 'Usa la forma de pretérito: hablé, comí, viví'
      },
      // Confusión con imperfecto
      wrongImperfect: {
        pattern: /\b\w+(aba|abas|ábamos|abais|aban|ía|ías|íamos|íais|ían)\b/g,
        description: 'Uso de imperfecto en lugar de pretérito',
        suggestion: 'El pretérito expresa acciones completadas: terminé, llegué, hice'
      }
    },
    fut: {
      // Uso de presente en lugar de futuro
      wrongPresent: {
        pattern: /\b(?:voy a|va a|vamos a|van a)\s+\w+/g,
        description: 'Uso de futuro perifrástico en lugar de futuro simple',
        suggestion: 'Usa el futuro simple: hablaré, comeré, viviré'
      },
      // Confusión con condicional
      wrongConditional: {
        pattern: /\b\w+(ría|rías|ríamos|ríais|rían)\b/g,
        description: 'Uso de condicional en lugar de futuro',
        suggestion: 'El futuro expresa certeza: será, haré, tendremos'
      }
    }
  },

  // Errores de concordancia
  agreementErrors: {
    // Concordancia de género
    gender: {
      pattern: /\b(un|el)\s+(casa|mesa|silla|puerta|ventana|ciudad|universidad)\b|\b(una|la)\s+(problema|programa|sistema|día|mapa)\b/g,
      description: 'Error de concordancia de género',
      suggestion: 'Verifica el género del sustantivo: la casa, el problema'
    },
    // Concordancia de número
    number: {
      pattern: /\b(el|la|un|una)\s+\w+s\b|\b(los|las|unos|unas)\s+\w+(?!s)\b/g,
      description: 'Error de concordancia de número',
      suggestion: 'Singular con singular, plural con plural: los libros, la mesa'
    }
  },

  // Errores de verbos reflexivos
  reflexiveErrors: {
    missingPronoun: {
      pattern: /\b(levantar|acostar|duchar|vestir|sentar|despertar)\b(?!\s+(me|te|se|nos|os))/g,
      description: 'Falta pronombre reflexivo',
      suggestion: 'Verbos como levantarse necesitan pronombre: me levanto, se ducha'
    },
    wrongPronoun: {
      pattern: /\b(me|te|se|nos|os)\s+(levantar|acostar|duchar|vestir|sentar|despertar)\b/g,
      description: 'Pronombre reflexivo en posición incorrecta',
      suggestion: 'El pronombre va antes del verbo conjugado: me levanto, no levanto me'
    }
  },

  // Errores de verbos ser/estar
  serEstarErrors: {
    wrongSer: {
      pattern: /\bes\s+(enfermo|cansado|contento|triste|ocupado|aburrido)\b/g,
      description: 'Uso incorrecto de SER con estados temporales',
      suggestion: 'Usa ESTAR para estados temporales: está enfermo, está cansado'
    },
    wrongEstar: {
      pattern: /\bestá\s+(médico|profesor|estudiante|español|alto|inteligente)\b/g,
      description: 'Uso incorrecto de ESTAR con características permanentes',
      suggestion: 'Usa SER para características: es médico, es alto, es inteligente'
    }
  },

  // Errores de preposiciones
  prepositionErrors: {
    wrongPreposition: {
      pattern: /\b(en la mañana|en la tarde|en la noche)\b/g,
      description: 'Uso incorrecto de preposición temporal',
      suggestion: 'Usa POR: por la mañana, por la tarde, por la noche'
    },
    missingPreposition: {
      pattern: /\bvoy\s+(casa|escuela|trabajo|cine)\b/g,
      description: 'Falta preposición de lugar',
      suggestion: 'Voy A casa, voy AL trabajo (a + el = al)'
    }
  }
};

/**
 * Patrones de errores según el nivel de dificultad
 */
const DIFFICULTY_ERROR_PATTERNS = {
  beginner: ['conjugationErrors.pres', 'agreementErrors.gender', 'serEstarErrors'],
  intermediate: ['conjugationErrors.pretIndef', 'conjugationErrors.impf', 'reflexiveErrors', 'prepositionErrors'],
  advanced: ['conjugationErrors.fut', 'conjugationErrors.subjPres', 'agreementErrors.number'],
  expert: ['conjugationErrors.subjImpf', 'conjugationErrors.condPerf']
};

/**
 * Clasificador de errores
 */
export class ErrorClassifier {
  constructor() {
    this.classificationCount = 0;
    this.errorStatistics = new Map();

    logger.info('ErrorClassifier initialized');
  }

  /**
   * Clasifica errores en un análisis de texto
   * @param {Object} languageAnalysis - Análisis del LanguageAnalyzer
   * @param {Object} context - Contexto del ejercicio
   * @param {string} context.expectedTense - Tiempo verbal esperado
   * @param {string} context.difficulty - Nivel de dificultad
   * @param {string} context.exerciseType - Tipo de ejercicio
   * @returns {Promise<Object>} Clasificación detallada de errores
   */
  async classifyErrors(languageAnalysis, context = {}) {
    try {
      const classification = {
        totalErrors: languageAnalysis.errorCount || 0,
        errorsByCategory: {},
        errorsByType: {},
        errorsBySeverity: {},
        specificErrors: [],
        suggestions: [],
        learningOpportunities: [],
        progressIndicators: {},
        classificationTimestamp: Date.now()
      };

      // Clasificar errores existentes del análisis
      if (languageAnalysis.errors && languageAnalysis.errors.length > 0) {
        await this.processExistingErrors(languageAnalysis.errors, classification, context);
      }

      // Detectar errores adicionales específicos
      await this.detectSpecificErrors(languageAnalysis, classification, context);

      // Calcular métricas de progreso
      this.calculateProgressMetrics(classification, context);

      // Generar oportunidades de aprendizaje
      this.generateLearningOpportunities(classification, context);

      // Actualizar estadísticas
      this.updateStatistics(classification);

      this.classificationCount++;

      logger.debug('Error classification completed', {
        totalErrors: classification.totalErrors,
        categories: Object.keys(classification.errorsByCategory).length,
        suggestions: classification.suggestions.length
      });

      return classification;
    } catch (error) {
      logger.error('Error in error classification:', error);
      return this.getDefaultClassification();
    }
  }

  /**
   * Procesa errores existentes del análisis de lenguaje
   * @param {Object[]} errors - Lista de errores del LanguageAnalyzer
   * @param {Object} classification - Clasificación en construcción
   * @param {Object} context - Contexto del ejercicio
   */
  async processExistingErrors(errors, classification, context) {
    for (const error of errors) {
      // Clasificar por categoría
      const category = this.categorizeError(error);
      classification.errorsByCategory[category] = (classification.errorsByCategory[category] || 0) + 1;

      // Clasificar por tipo
      classification.errorsByType[error.type] = (classification.errorsByType[error.type] || 0) + 1;

      // Clasificar por severidad
      const severity = this.determineSeverity(error, context);
      classification.errorsBySeverity[severity] = (classification.errorsBySeverity[severity] || 0) + 1;

      // Agregar error específico con análisis mejorado
      const enhancedError = await this.enhanceError(error, context);
      classification.specificErrors.push(enhancedError);

      // Generar sugerencias específicas
      const suggestions = this.generateErrorSuggestions(enhancedError, context);
      classification.suggestions.push(...suggestions);
    }
  }

  /**
   * Detecta errores específicos adicionales
   * @param {Object} languageAnalysis - Análisis de lenguaje
   * @param {Object} classification - Clasificación en construcción
   * @param {Object} context - Contexto del ejercicio
   */
  async detectSpecificErrors(languageAnalysis, classification, context) {
    const text = languageAnalysis.normalizedText || languageAnalysis.originalText || '';

    // Detectar errores de conjugación específicos
    const conjugationErrors = await this.detectConjugationErrors(text, context);
    this.addErrorsToClassification(conjugationErrors, classification, 'conjugation');

    // Detectar errores de concordancia
    const agreementErrors = await this.detectAgreementErrors(text, context);
    this.addErrorsToClassification(agreementErrors, classification, 'agreement');

    // Detectar errores de verbos reflexivos
    const reflexiveErrors = await this.detectReflexiveErrors(text, context);
    this.addErrorsToClassification(reflexiveErrors, classification, 'reflexive');

    // Detectar errores ser/estar
    const serEstarErrors = await this.detectSerEstarErrors(text, context);
    this.addErrorsToClassification(serEstarErrors, classification, 'ser_estar');

    // Detectar errores de preposiciones
    const prepositionErrors = await this.detectPrepositionErrors(text, context);
    this.addErrorsToClassification(prepositionErrors, classification, 'preposition');

    // Detectar errores de nivel específico
    const levelSpecificErrors = await this.detectLevelSpecificErrors(text, context);
    this.addErrorsToClassification(levelSpecificErrors, classification, 'level_specific');
  }

  /**
   * Detecta errores de conjugación específicos
   * @param {string} text - Texto a analizar
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object[]} Lista de errores detectados
   */
  async detectConjugationErrors(text, context) {
    const errors = [];
    const expectedTense = context.expectedTense;

    if (!expectedTense || !ERROR_PATTERNS.conjugationErrors[expectedTense]) {
      return errors;
    }

    const tensePatterns = ERROR_PATTERNS.conjugationErrors[expectedTense];

    for (const [errorType, patternInfo] of Object.entries(tensePatterns)) {
      const matches = text.match(patternInfo.pattern) || [];

      for (const match of matches) {
        errors.push({
          type: ERROR_TYPES.WRONG_TENSE,
          subtype: errorType,
          severity: ERROR_SEVERITY.HIGH,
          description: patternInfo.description,
          suggestion: patternInfo.suggestion,
          detectedText: match,
          position: text.indexOf(match),
          expectedTense,
          category: 'conjugation'
        });
      }
    }

    return errors;
  }

  /**
   * Detecta errores de concordancia
   * @param {string} text - Texto a analizar
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object[]} Lista de errores detectados
   */
  async detectAgreementErrors(text, context) {
    const errors = [];

    for (const [errorType, patternInfo] of Object.entries(ERROR_PATTERNS.agreementErrors)) {
      const matches = text.match(patternInfo.pattern) || [];

      for (const match of matches) {
        errors.push({
          type: ERROR_TYPES.GENDER_AGREEMENT,
          subtype: errorType,
          severity: ERROR_SEVERITY.MEDIUM,
          description: patternInfo.description,
          suggestion: patternInfo.suggestion,
          detectedText: match,
          position: text.indexOf(match),
          category: 'agreement'
        });
      }
    }

    return errors;
  }

  /**
   * Detecta errores de verbos reflexivos
   * @param {string} text - Texto a analizar
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object[]} Lista de errores detectados
   */
  async detectReflexiveErrors(text, context) {
    const errors = [];

    for (const [errorType, patternInfo] of Object.entries(ERROR_PATTERNS.reflexiveErrors)) {
      const matches = text.match(patternInfo.pattern) || [];

      for (const match of matches) {
        errors.push({
          type: ERROR_TYPES.PRONOUN_ERROR,
          subtype: errorType,
          severity: ERROR_SEVERITY.MEDIUM,
          description: patternInfo.description,
          suggestion: patternInfo.suggestion,
          detectedText: match,
          position: text.indexOf(match),
          category: 'reflexive'
        });
      }
    }

    return errors;
  }

  /**
   * Detecta errores de ser/estar
   * @param {string} text - Texto a analizar
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object[]} Lista de errores detectados
   */
  async detectSerEstarErrors(text, context) {
    const errors = [];

    for (const [errorType, patternInfo] of Object.entries(ERROR_PATTERNS.serEstarErrors)) {
      const matches = text.match(patternInfo.pattern) || [];

      for (const match of matches) {
        errors.push({
          type: ERROR_TYPES.VOCABULARY_ERROR,
          subtype: errorType,
          severity: ERROR_SEVERITY.HIGH,
          description: patternInfo.description,
          suggestion: patternInfo.suggestion,
          detectedText: match,
          position: text.indexOf(match),
          category: 'ser_estar'
        });
      }
    }

    return errors;
  }

  /**
   * Detecta errores de preposiciones
   * @param {string} text - Texto a analizar
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object[]} Lista de errores detectados
   */
  async detectPrepositionErrors(text, context) {
    const errors = [];

    for (const [errorType, patternInfo] of Object.entries(ERROR_PATTERNS.prepositionErrors)) {
      const matches = text.match(patternInfo.pattern) || [];

      for (const match of matches) {
        errors.push({
          type: ERROR_TYPES.VOCABULARY_ERROR,
          subtype: errorType,
          severity: ERROR_SEVERITY.MEDIUM,
          description: patternInfo.description,
          suggestion: patternInfo.suggestion,
          detectedText: match,
          position: text.indexOf(match),
          category: 'preposition'
        });
      }
    }

    return errors;
  }

  /**
   * Detecta errores específicos del nivel de dificultad
   * @param {string} text - Texto a analizar
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object[]} Lista de errores detectados
   */
  async detectLevelSpecificErrors(text, context) {
    const errors = [];
    const difficulty = context.difficulty || 'intermediate';

    const relevantPatterns = DIFFICULTY_ERROR_PATTERNS[difficulty] || [];

    // Por ahora, retornamos array vacío
    // Se puede expandir para detectar errores específicos del nivel
    return errors;
  }

  /**
   * Agrega errores a la clasificación
   * @param {Object[]} errors - Lista de errores
   * @param {Object} classification - Clasificación en construcción
   * @param {string} category - Categoría de los errores
   */
  addErrorsToClassification(errors, classification, category) {
    for (const error of errors) {
      // Actualizar contadores
      classification.totalErrors++;
      classification.errorsByCategory[category] = (classification.errorsByCategory[category] || 0) + 1;
      classification.errorsByType[error.type] = (classification.errorsByType[error.type] || 0) + 1;
      classification.errorsBySeverity[error.severity] = (classification.errorsBySeverity[error.severity] || 0) + 1;

      // Agregar error específico
      classification.specificErrors.push(error);

      // Generar sugerencia
      if (error.suggestion) {
        classification.suggestions.push({
          type: 'correction',
          message: error.suggestion,
          category: error.category,
          priority: this.getSuggestionPriority(error.severity)
        });
      }
    }
  }

  /**
   * Categoriza un error
   * @param {Object} error - Error a categorizar
   * @returns {string} Categoría del error
   */
  categorizeError(error) {
    const typeToCategory = {
      [ERROR_TYPES.WRONG_TENSE]: 'conjugation',
      [ERROR_TYPES.WRONG_MOOD]: 'conjugation',
      [ERROR_TYPES.CONJUGATION_ERROR]: 'conjugation',
      [ERROR_TYPES.MISSING_VERBS]: 'content',
      [ERROR_TYPES.IRREGULAR_VERB_ERROR]: 'conjugation',
      [ERROR_TYPES.WORD_ORDER]: 'syntax',
      [ERROR_TYPES.GENDER_AGREEMENT]: 'agreement',
      [ERROR_TYPES.NUMBER_AGREEMENT]: 'agreement',
      [ERROR_TYPES.PRONOUN_ERROR]: 'grammar',
      [ERROR_TYPES.OFF_TOPIC]: 'content',
      [ERROR_TYPES.INSUFFICIENT_CONTENT]: 'content',
      [ERROR_TYPES.TOO_SIMPLE]: 'complexity',
      [ERROR_TYPES.VOCABULARY_ERROR]: 'vocabulary',
      [ERROR_TYPES.SPELLING_ERROR]: 'orthography',
      [ERROR_TYPES.PUNCTUATION_ERROR]: 'orthography',
      [ERROR_TYPES.CAPITALIZATION_ERROR]: 'orthography'
    };

    return typeToCategory[error.type] || 'general';
  }

  /**
   * Determina la severidad de un error en contexto
   * @param {Object} error - Error a evaluar
   * @param {Object} context - Contexto del ejercicio
   * @returns {number} Nivel de severidad
   */
  determineSeverity(error, context) {
    let baseSeverity = error.severity || ERROR_SEVERITY.MEDIUM;

    // Ajustar severidad según el contexto
    if (context.difficulty === 'beginner' && error.type === ERROR_TYPES.WRONG_TENSE) {
      baseSeverity = Math.min(baseSeverity + 1, ERROR_SEVERITY.CRITICAL);
    }

    if (context.difficulty === 'expert' && error.type === ERROR_TYPES.SPELLING_ERROR) {
      baseSeverity = Math.max(baseSeverity - 1, ERROR_SEVERITY.LOW);
    }

    return baseSeverity;
  }

  /**
   * Mejora un error con análisis adicional
   * @param {Object} error - Error original
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object} Error mejorado
   */
  async enhanceError(error, context) {
    const enhanced = {
      ...error,
      context: context.exerciseType,
      learningImpact: this.calculateLearningImpact(error, context),
      remediation: this.generateRemediation(error, context),
      examples: this.getCorrectExamples(error, context),
      relatedConcepts: this.getRelatedConcepts(error)
    };

    return enhanced;
  }

  /**
   * Calcula el impacto en el aprendizaje
   * @param {Object} error - Error a evaluar
   * @param {Object} context - Contexto del ejercicio
   * @returns {string} Nivel de impacto
   */
  calculateLearningImpact(error, context) {
    if (error.severity >= ERROR_SEVERITY.CRITICAL) return 'high';
    if (error.severity >= ERROR_SEVERITY.HIGH) return 'medium';
    return 'low';
  }

  /**
   * Genera plan de remediación
   * @param {Object} error - Error a remediar
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object} Plan de remediación
   */
  generateRemediation(error, context) {
    const remediation = {
      immediate: [],
      practice: [],
      review: []
    };

    // Remediación inmediata
    if (error.suggestion) {
      remediation.immediate.push(error.suggestion);
    }

    // Práctica recomendada
    if (error.type === ERROR_TYPES.WRONG_TENSE) {
      remediation.practice.push(`Practica más ejercicios de ${context.expectedTense}`);
    }

    // Revisión conceptual
    if (error.category === 'agreement') {
      remediation.review.push('Revisa las reglas de concordancia en español');
    }

    return remediation;
  }

  /**
   * Obtiene ejemplos correctos
   * @param {Object} error - Error para el cual generar ejemplos
   * @param {Object} context - Contexto del ejercicio
   * @returns {string[]} Lista de ejemplos correctos
   */
  getCorrectExamples(error, context) {
    const examples = [];

    if (error.type === ERROR_TYPES.WRONG_TENSE && context.expectedTense) {
      const tenseExamples = {
        pres: ['Yo hablo español', 'Ella come fruta', 'Nosotros vivimos aquí'],
        pretIndef: ['Ayer hablé con mi amigo', 'Ella comió pizza', 'Fuimos al cine'],
        impf: ['Cuando era niño, jugaba fútbol', 'Ella siempre comía verduras', 'Vivíamos en Madrid'],
        fut: ['Mañana hablaré contigo', 'Ella comerá sushi', 'Viviremos en Barcelona']
      };

      examples.push(...(tenseExamples[context.expectedTense] || []));
    }

    return examples;
  }

  /**
   * Obtiene conceptos relacionados
   * @param {Object} error - Error para analizar
   * @returns {string[]} Lista de conceptos relacionados
   */
  getRelatedConcepts(error) {
    const concepts = [];

    const conceptMap = {
      [ERROR_TYPES.WRONG_TENSE]: ['tiempos verbales', 'conjugación', 'aspecto verbal'],
      [ERROR_TYPES.GENDER_AGREEMENT]: ['género gramatical', 'concordancia', 'sustantivos'],
      [ERROR_TYPES.PRONOUN_ERROR]: ['pronombres', 'verbos reflexivos', 'clíticos'],
      [ERROR_TYPES.VOCABULARY_ERROR]: ['vocabulario', 'ser vs estar', 'preposiciones']
    };

    return conceptMap[error.type] || [];
  }

  /**
   * Genera sugerencias específicas para un error
   * @param {Object} error - Error para generar sugerencias
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object[]} Lista de sugerencias
   */
  generateErrorSuggestions(error, context) {
    const suggestions = [];

    // Sugerencia principal del error
    if (error.suggestion) {
      suggestions.push({
        type: 'correction',
        message: error.suggestion,
        category: error.category,
        priority: this.getSuggestionPriority(error.severity)
      });
    }

    // Sugerencias adicionales basadas en tipo
    const additionalSuggestions = this.getAdditionalSuggestions(error, context);
    suggestions.push(...additionalSuggestions);

    return suggestions;
  }

  /**
   * Obtiene sugerencias adicionales
   * @param {Object} error - Error a analizar
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object[]} Sugerencias adicionales
   */
  getAdditionalSuggestions(error, context) {
    const suggestions = [];

    if (error.type === ERROR_TYPES.WRONG_TENSE) {
      suggestions.push({
        type: 'practice',
        message: 'Practica más con este tiempo verbal',
        category: 'practice',
        priority: 'medium'
      });
    }

    if (error.category === 'agreement') {
      suggestions.push({
        type: 'study',
        message: 'Revisa las reglas de concordancia',
        category: 'grammar',
        priority: 'high'
      });
    }

    return suggestions;
  }

  /**
   * Obtiene prioridad de sugerencia basada en severidad
   * @param {number} severity - Severidad del error
   * @returns {string} Prioridad de la sugerencia
   */
  getSuggestionPriority(severity) {
    if (severity >= ERROR_SEVERITY.CRITICAL) return 'critical';
    if (severity >= ERROR_SEVERITY.HIGH) return 'high';
    if (severity >= ERROR_SEVERITY.MEDIUM) return 'medium';
    return 'low';
  }

  /**
   * Calcula métricas de progreso
   * @param {Object} classification - Clasificación de errores
   * @param {Object} context - Contexto del ejercicio
   */
  calculateProgressMetrics(classification, context) {
    classification.progressIndicators = {
      errorDensity: classification.totalErrors / Math.max(context.wordCount || 50, 1),
      severityIndex: this.calculateSeverityIndex(classification),
      improvementAreas: this.identifyImprovementAreas(classification),
      strengths: this.identifyStrengths(classification)
    };
  }

  /**
   * Calcula índice de severidad
   * @param {Object} classification - Clasificación de errores
   * @returns {number} Índice de severidad
   */
  calculateSeverityIndex(classification) {
    const severityCounts = classification.errorsBySeverity;
    let weightedSum = 0;
    let totalErrors = 0;

    for (const [severity, count] of Object.entries(severityCounts)) {
      weightedSum += parseInt(severity) * count;
      totalErrors += count;
    }

    return totalErrors > 0 ? weightedSum / totalErrors : 0;
  }

  /**
   * Identifica áreas de mejora
   * @param {Object} classification - Clasificación de errores
   * @returns {string[]} Áreas de mejora
   */
  identifyImprovementAreas(classification) {
    const areas = [];
    const categories = classification.errorsByCategory;

    // Ordenar categorías por frecuencia de errores
    const sortedCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3); // Top 3 áreas problemáticas

    for (const [category, count] of sortedCategories) {
      if (count > 0) {
        areas.push(category);
      }
    }

    return areas;
  }

  /**
   * Identifica fortalezas
   * @param {Object} classification - Clasificación de errores
   * @returns {string[]} Fortalezas identificadas
   */
  identifyStrengths(classification) {
    const strengths = [];

    // Si hay pocas categorías de error, las otras son fortalezas
    const allCategories = ['conjugation', 'agreement', 'vocabulary', 'grammar', 'orthography'];
    const problemCategories = Object.keys(classification.errorsByCategory);

    for (const category of allCategories) {
      if (!problemCategories.includes(category)) {
        strengths.push(category);
      }
    }

    return strengths;
  }

  /**
   * Genera oportunidades de aprendizaje
   * @param {Object} classification - Clasificación de errores
   * @param {Object} context - Contexto del ejercicio
   */
  generateLearningOpportunities(classification, context) {
    classification.learningOpportunities = [];

    // Basadas en errores frecuentes
    const frequentErrors = Object.entries(classification.errorsByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    for (const [errorType, count] of frequentErrors) {
      classification.learningOpportunities.push({
        type: 'error_focused',
        description: `Enfócate en mejorar: ${errorType}`,
        priority: 'high',
        frequency: count
      });
    }

    // Basadas en el contexto del ejercicio
    if (context.expectedTense) {
      classification.learningOpportunities.push({
        type: 'tense_practice',
        description: `Practica más ejercicios de ${context.expectedTense}`,
        priority: 'medium'
      });
    }
  }

  /**
   * Actualiza estadísticas del clasificador
   * @param {Object} classification - Clasificación completada
   */
  updateStatistics(classification) {
    for (const [category, count] of Object.entries(classification.errorsByCategory)) {
      const current = this.errorStatistics.get(category) || 0;
      this.errorStatistics.set(category, current + count);
    }
  }

  /**
   * Obtiene clasificación por defecto en caso de error
   * @returns {Object} Clasificación básica
   */
  getDefaultClassification() {
    return {
      totalErrors: 0,
      errorsByCategory: {},
      errorsByType: {},
      errorsBySeverity: {},
      specificErrors: [],
      suggestions: [],
      learningOpportunities: [],
      progressIndicators: {
        errorDensity: 0,
        severityIndex: 0,
        improvementAreas: [],
        strengths: []
      },
      classificationTimestamp: Date.now(),
      error: true
    };
  }

  /**
   * Obtiene estadísticas del clasificador
   * @returns {Object} Estadísticas de uso
   */
  getStats() {
    return {
      totalClassifications: this.classificationCount,
      errorStatistics: Object.fromEntries(this.errorStatistics),
      availablePatterns: Object.keys(ERROR_PATTERNS).length,
      supportedErrorTypes: Object.keys(ERROR_TYPES).length
    };
  }

  /**
   * Limpia estadísticas
   */
  clearStats() {
    this.errorStatistics.clear();
    this.classificationCount = 0;
    logger.info('ErrorClassifier statistics cleared');
  }
}

// Instancia singleton
const errorClassifier = new ErrorClassifier();

export default errorClassifier;
export { ErrorClassifier };