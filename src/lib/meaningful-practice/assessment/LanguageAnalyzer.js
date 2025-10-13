/**
 * LanguageAnalyzer - Análisis avanzado de lenguaje para ejercicios
 *
 * Este módulo proporciona análisis lingüístico sofisticado de las respuestas del usuario,
 * incluyendo detección de verbos, análisis de tiempos verbales, evaluación gramatical
 * y detección de patrones de error.
 *
 * @module LanguageAnalyzer
 */

import { createLogger } from '../../utils/logger.js';
import { TENSE_PATTERNS, ERROR_TYPES } from '../core/constants.js';

const logger = createLogger('LanguageAnalyzer');

/**
 * Patrones regex para diferentes elementos gramaticales
 */
const GRAMMAR_PATTERNS = {
  // Verbos por terminación
  verbs: {
    ar: /\b\w+(ar|amos|áis|an|aba|abas|ábamos|abais|aban|é|aste|ó|asteis|aron|aré|arás|ará|aremos|aréis|arán|aría|arías|aríamos|aríais|arían)\b/g,
    er: /\b\w+(er|emos|éis|en|ía|ías|íamos|íais|ían|í|iste|ió|isteis|ieron|eré|erás|erá|eremos|eréis|erán|ería|erías|eríamos|eríais|erían)\b/g,
    ir: /\b\w+(ir|imos|ís|en|ía|ías|íamos|íais|ían|í|iste|ió|isteis|ieron|iré|irás|irá|iremos|iréis|irán|iría|irías|iríamos|iríais|irían)\b/g
  },

  // Pronombres reflexivos
  reflexivePronouns: /\b(me|te|se|nos|os)\b/g,

  // Artículos
  articles: /\b(el|la|los|las|un|una|unos|unas)\b/g,

  // Preposiciones comunes
  prepositions: /\b(a|ante|bajo|con|contra|de|desde|durante|en|entre|hacia|hasta|para|por|según|sin|sobre|tras)\b/g,

  // Conjunciones
  conjunctions: /\b(y|e|ni|o|u|pero|mas|sino|aunque|si|porque|cuando|mientras|donde|como|que)\b/g,

  // Números
  numbers: /\b(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciséis|diecisiete|dieciocho|diecinueve|veinte|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|mil)\b/g
};

/**
 * Verbos irregulares comunes y sus formas
 */
const IRREGULAR_VERBS = {
  ser: ['soy', 'eres', 'es', 'somos', 'sois', 'son', 'era', 'eras', 'éramos', 'erais', 'eran', 'fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron', 'seré', 'serás', 'será', 'seremos', 'seréis', 'serán'],
  estar: ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están', 'estaba', 'estabas', 'estábamos', 'estabais', 'estaban', 'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'],
  tener: ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen', 'tenía', 'tenías', 'teníamos', 'teníais', 'tenían', 'tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron'],
  hacer: ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen', 'hacía', 'hacías', 'hacíamos', 'hacíais', 'hacían', 'hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
  ir: ['voy', 'vas', 'va', 'vamos', 'vais', 'van', 'iba', 'ibas', 'íbamos', 'ibais', 'iban', 'fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
  venir: ['vengo', 'vienes', 'viene', 'venimos', 'venís', 'vienen', 'venía', 'venías', 'veníamos', 'veníais', 'venían', 'vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron'],
  poder: ['puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden', 'podía', 'podías', 'podíamos', 'podíais', 'podían', 'pude', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron'],
  saber: ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben', 'sabía', 'sabías', 'sabíamos', 'sabíais', 'sabían', 'supe', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron'],
  querer: ['quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren', 'quería', 'querías', 'queríamos', 'queríais', 'querían', 'quise', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron'],
  decir: ['digo', 'dices', 'dice', 'decimos', 'decís', 'dicen', 'decía', 'decías', 'decíamos', 'decíais', 'decían', 'dije', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron']
};

/**
 * Analizador de lenguaje principal
 */
export class LanguageAnalyzer {
  constructor() {
    this.cache = new Map();
    this.analysisCount = 0;

    logger.info('LanguageAnalyzer initialized');
  }

  /**
   * Analiza un texto de respuesta del usuario
   * @param {string} text - Texto a analizar
   * @param {Object} context - Contexto del análisis
   * @param {string} context.expectedTense - Tiempo verbal esperado
   * @param {string[]} context.expectedVerbs - Verbos esperados
   * @param {string} context.exerciseType - Tipo de ejercicio
   * @returns {Promise<Object>} Resultado del análisis
   */
  async analyzeText(text, context = {}) {
    try {
      // Verificar cache
      const cacheKey = this.generateCacheKey(text, context);
      if (this.cache.has(cacheKey)) {
        logger.debug('Analysis retrieved from cache');
        return this.cache.get(cacheKey);
      }

      // Realizar análisis completo
      const analysis = await this.performCompleteAnalysis(text, context);

      // Almacenar en cache
      this.cache.set(cacheKey, analysis);
      this.analysisCount++;

      logger.debug(`Text analysis completed`, {
        textLength: text.length,
        verbsFound: analysis.verbs.length,
        dominantTense: analysis.dominantTense
      });

      return analysis;
    } catch (error) {
      logger.error('Error in text analysis:', error);
      return this.getDefaultAnalysis(text);
    }
  }

  /**
   * Realiza análisis completo del texto
   * @param {string} text - Texto a analizar
   * @param {Object} context - Contexto del análisis
   * @returns {Object} Análisis completo
   */
  async performCompleteAnalysis(text, context) {
    const normalizedText = this.normalizeText(text);

    // Análisis básico
    const basicAnalysis = this.performBasicAnalysis(normalizedText);

    // Análisis de verbos
    const verbAnalysis = this.analyzeVerbs(normalizedText, context.expectedVerbs);

    // Análisis de tiempos verbales
    const tenseAnalysis = this.analyzeTenses(normalizedText, context.expectedTense);

    // Análisis gramatical
    const grammarAnalysis = this.analyzeGrammar(normalizedText);

    // Detección de errores
    const errorAnalysis = this.detectErrors(normalizedText, context);

    // Análisis de complejidad
    const complexityAnalysis = this.analyzeComplexity(normalizedText);

    // Análisis de coherencia
    const coherenceAnalysis = this.analyzeCoherence(normalizedText, context);

    const grammarScore = await this.calculateGrammarScore(text, grammarAnalysis, basicAnalysis);
    const creativityScore = this.calculateCreativityScore(complexityAnalysis, coherenceAnalysis, verbAnalysis);

    return {
      originalText: text,
      normalizedText,
      wordCount: basicAnalysis.wordCount,
      sentenceCount: basicAnalysis.sentenceCount,
      characterCount: text.length,

      verbAnalysis: {
        detectedVerbs: verbAnalysis.detectedVerbs,
        conjugations: verbAnalysis.conjugations,
        irregularVerbs: verbAnalysis.irregularVerbs,
        verbTypes: verbAnalysis.verbTypes,
        foundExpectedVerbs: verbAnalysis.foundExpectedVerbs,
        missingExpectedVerbs: verbAnalysis.missingExpectedVerbs,
        expectedVerbsUsage: verbAnalysis.expectedVerbsUsage
      },

      tenseAnalysis: {
        detectedTenses: tenseAnalysis.detectedTenses,
        dominantTense: tenseAnalysis.dominantTense,
        consistency: tenseAnalysis.consistency,
        correctTenseUsage: tenseAnalysis.expectedTensePercentage,
        tenseErrors: tenseAnalysis.tenseErrors,
        isExpectedTenseDominant: tenseAnalysis.isExpectedTenseDominant
      },

      grammarElements: grammarAnalysis,
      errorAnalysis,
      errors: errorAnalysis.errors,
      errorCount: errorAnalysis.errorCount,
      errorTypes: errorAnalysis.errorTypes,
      complexityAnalysis,
      coherenceAnalysis,

      accuracy: this.calculateAccuracy(verbAnalysis, tenseAnalysis, context),
      completeness: this.calculateCompleteness(verbAnalysis, context),
      appropriateness: this.calculateAppropriateness(tenseAnalysis, grammarAnalysis, context),
      grammarScore,
      creativityScore,

      quality: {
        grammar: grammarScore,
        coherence: coherenceAnalysis.score,
        richness: Math.min(1, basicAnalysis.wordCount / 200),
        creativity: creativityScore
      },

      verbs: verbAnalysis.detectedVerbs,
      tenses: tenseAnalysis.detectedTenses,

      analysisTimestamp: Date.now(),
      analyzerVersion: '1.0.0'
    };
  }

  /**
   * Realiza análisis básico del texto
   * @param {string} text - Texto normalizado
   * @returns {Object} Análisis básico
   */
  performBasicAnalysis(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: words.length / Math.max(sentences.length, 1),
      words,
      sentences
    };
  }

  /**
   * Analiza verbos en el texto
   * @param {string} text - Texto normalizado
   * @param {string[]} expectedVerbs - Verbos esperados
   * @returns {Object} Análisis de verbos
   */
  analyzeVerbs(text, expectedVerbs = []) {
    const verbs = [];
    const irregularVerbs = [];
    const verbTypes = { regular: 0, irregular: 0 };

    // Buscar verbos usando patrones de terminaciones
    for (const [type, pattern] of Object.entries(GRAMMAR_PATTERNS.verbs)) {
      const matches = text.match(pattern) || [];
      verbs.push(...matches.map(verb => ({ verb, type, conjugationType: 'regular' })));
    }

    // Buscar verbos irregulares
    for (const [infinitive, forms] of Object.entries(IRREGULAR_VERBS)) {
      for (const form of forms) {
        const regex = new RegExp(`\\b${form}\\b`, 'gi');
        if (regex.test(text)) {
          const irregularVerb = { verb: form, infinitive, conjugationType: 'irregular' };
          verbs.push(irregularVerb);
          irregularVerbs.push(irregularVerb);
          verbTypes.irregular++;
        }
      }
    }

    const tokens = text.split(/\s+/).filter(Boolean);
    const heuristicEndings = ['o', 'as', 'es', 'a', 'e', 'amos', 'emos', 'imos', 'áis', 'éis', 'ís', 'an', 'en', 'aba', 'abas', 'aban', 'ía', 'ías', 'ían', 'ando', 'iendo', 'yendo'];

    for (const token of tokens) {
      const cleaned = token.replace(/[^a-záéíóúñü]/gi, '').toLowerCase();
      if (!cleaned) continue;
      if (heuristicEndings.some(ending => cleaned.endsWith(ending)) && cleaned.length > 2) {
        verbs.push({ verb: cleaned, type: this.inferVerbGroup(cleaned), conjugationType: 'regular' });
      }
    }

    // Eliminar duplicados y contar regulares
    const uniqueVerbs = this.removeDuplicateVerbs(verbs);
    verbTypes.regular = uniqueVerbs.filter(v => v.conjugationType === 'regular').length;

    // Analizar verbos esperados
    const foundExpectedVerbs = expectedVerbs.filter(expected =>
      uniqueVerbs.some(found => this.normalizeText(found.verb) === this.normalizeText(expected))
    );

    const missingExpectedVerbs = expectedVerbs.filter(expected =>
      !foundExpectedVerbs.includes(expected)
    );

    const detectedVerbs = uniqueVerbs.map(v => v.verb);
    const conjugations = uniqueVerbs.map(v => ({
      form: v.verb,
      infinitive: v.infinitive || v.verb,
      isIrregular: v.conjugationType === 'irregular',
      type: v.type || null
    }));

    return {
      verbs: uniqueVerbs,
      verbCount: uniqueVerbs.length,
      irregularVerbs,
      verbTypes,
      foundExpectedVerbs,
      missingExpectedVerbs,
      expectedVerbsUsage: foundExpectedVerbs.length / Math.max(expectedVerbs.length, 1),
      detectedVerbs,
      conjugations
    };
  }

  /**
   * Analiza tiempos verbales en el texto
   * @param {string} text - Texto normalizado
   * @param {string} expectedTense - Tiempo verbal esperado
   * @returns {Object} Análisis de tiempos verbales
   */
  analyzeTenses(text, expectedTense) {
    const tenseUsage = {};
    let dominantTense = null;
    let maxUsage = 0;

    // Analizar cada tiempo verbal
    for (const [tense, tenseInfo] of Object.entries(TENSE_PATTERNS)) {
      let usageCount = 0;

      for (const pattern of tenseInfo.patterns) {
        const matches = text.match(pattern) || [];
        usageCount += matches.length;
      }

      if (usageCount > 0) {
        tenseUsage[tense] = usageCount;

        if (usageCount > maxUsage) {
          maxUsage = usageCount;
          dominantTense = tense;
        }
      }
    }

    // Calcular consistencia del tiempo verbal
    const totalTenseUsage = Object.values(tenseUsage).reduce((sum, count) => sum + count, 0);
    const consistency = dominantTense ? (tenseUsage[dominantTense] / totalTenseUsage) : 0;

    // Verificar uso del tiempo esperado
    const expectedTenseUsage = expectedTense ? (tenseUsage[expectedTense] || 0) : 0;
    const expectedTensePercentage = expectedTenseUsage / Math.max(totalTenseUsage, 1);

    const detectedTenses = Object.entries(tenseUsage).map(([tense, count]) => ({ tense, count }));

    const tenseErrors = [];
    if (expectedTense && expectedTensePercentage < 0.5) {
      tenseErrors.push({
        expected: expectedTense,
        dominant: dominantTense,
        usage: expectedTensePercentage
      });
    }

    return {
      tenses: tenseUsage,
      dominantTense,
      consistency,
      expectedTenseUsage: expectedTenseUsage,
      expectedTensePercentage,
      tenseVariety: Object.keys(tenseUsage).length,
      isExpectedTenseDominant: dominantTense === expectedTense,
      detectedTenses,
      tenseErrors,
      correctTenseUsage: expectedTensePercentage
    };
  }

  /**
   * Analiza elementos gramaticales
   * @param {string} text - Texto normalizado
   * @returns {Object} Análisis gramatical
   */
  analyzeGrammar(text) {
    const grammarElements = {};

    for (const [element, pattern] of Object.entries(GRAMMAR_PATTERNS)) {
      const matches = text.match(pattern) || [];
      grammarElements[element] = {
        count: matches.length,
        items: [...new Set(matches)] // Eliminar duplicados
      };
    }

    return grammarElements;
  }

  /**
   * Detecta errores en el texto
   * @param {string} text - Texto normalizado
   * @param {Object} context - Contexto del análisis
   * @returns {Object} Análisis de errores
   */
  detectErrors(text, context) {
    const errors = [];

    // Detectar errores de tiempo verbal
    if (context.expectedTense) {
      const wrongTenseError = this.detectWrongTenseUsage(text, context.expectedTense);
      if (wrongTenseError) {
        errors.push(wrongTenseError);
      }
    }

    // Detectar verbos faltantes
    if (context.expectedVerbs && context.expectedVerbs.length > 0) {
      const missingVerbsError = this.detectMissingVerbs(text, context.expectedVerbs);
      if (missingVerbsError) {
        errors.push(missingVerbsError);
      }
    }

    // Detectar errores de longitud
    const lengthError = this.detectLengthIssues(text);
    if (lengthError) {
      errors.push(lengthError);
    }

    // Detectar errores de estructura
    const structureErrors = this.detectStructureIssues(text);
    errors.push(...structureErrors);

    // Agrupar errores por tipo
    const errorTypes = {};
    for (const error of errors) {
      errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
    }

    return {
      errors,
      errorCount: errors.length,
      errorTypes,
      severity: this.calculateErrorSeverity(errors)
    };
  }

  /**
   * Detecta uso incorrecto del tiempo verbal
   * @param {string} text - Texto a analizar
   * @param {string} expectedTense - Tiempo verbal esperado
   * @returns {Object|null} Error detectado o null
   */
  detectWrongTenseUsage(text, expectedTense) {
    const tenseAnalysis = this.analyzeTenses(text, expectedTense);

    if (!tenseAnalysis.isExpectedTenseDominant && tenseAnalysis.expectedTensePercentage < 0.5) {
      return {
        type: ERROR_TYPES.WRONG_TENSE,
        severity: 3,
        description: `Se esperaba ${expectedTense} pero se detectó principalmente ${tenseAnalysis.dominantTense}`,
        suggestion: TENSE_PATTERNS[expectedTense]?.hints[0] || `Usa ${expectedTense}`,
        expectedTense,
        detectedTense: tenseAnalysis.dominantTense
      };
    }

    return null;
  }

  /**
   * Detecta verbos faltantes
   * @param {string} text - Texto a analizar
   * @param {string[]} expectedVerbs - Verbos esperados
   * @returns {Object|null} Error detectado o null
   */
  detectMissingVerbs(text, expectedVerbs) {
    const verbAnalysis = this.analyzeVerbs(text, expectedVerbs);

    if (verbAnalysis.missingExpectedVerbs.length > 0) {
      return {
        type: ERROR_TYPES.MISSING_VERBS,
        severity: 2,
        description: `Faltan verbos esperados: ${verbAnalysis.missingExpectedVerbs.join(', ')}`,
        suggestion: 'Incluye todos los verbos sugeridos en tu respuesta',
        missingVerbs: verbAnalysis.missingExpectedVerbs,
        foundVerbs: verbAnalysis.foundExpectedVerbs
      };
    }

    return null;
  }

  /**
   * Detecta problemas de longitud
   * @param {string} text - Texto a analizar
   * @returns {Object|null} Error detectado o null
   */
  detectLengthIssues(text) {
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

    if (wordCount < 5) {
      return {
        type: ERROR_TYPES.INSUFFICIENT_CONTENT,
        severity: 2,
        description: 'La respuesta es demasiado corta',
        suggestion: 'Proporciona una respuesta más detallada',
        currentLength: wordCount,
        minimumLength: 5
      };
    }

    return null;
  }

  /**
   * Detecta problemas de estructura
   * @param {string} text - Texto a analizar
   * @returns {Object[]} Lista de errores estructurales
   */
  detectStructureIssues(text) {
    const errors = [];

    // Verificar puntuación básica
    if (text.length > 50 && !/[.!?]/.test(text)) {
      errors.push({
        type: ERROR_TYPES.PUNCTUATION_ERROR,
        severity: 1,
        description: 'Falta puntuación al final de las oraciones',
        suggestion: 'Agrega puntos, signos de exclamación o interrogación'
      });
    }

    // Verificar mayúsculas al inicio
    if (text.length > 0 && !/^[A-ZÁÉÍÓÚÜÑ]/.test(text)) {
      errors.push({
        type: ERROR_TYPES.CAPITALIZATION_ERROR,
        severity: 1,
        description: 'Falta mayúscula al inicio del texto',
        suggestion: 'Comienza con mayúscula'
      });
    }

    // Detección simple de errores de concordancia de género
    if (/\bla\s+\w+o\b/i.test(text) || /\bel\s+\w+a\b/i.test(text)) {
      errors.push({
        type: ERROR_TYPES.GENDER_AGREEMENT,
        severity: 2,
        description: 'Posible error de concordancia de género',
        suggestion: 'Asegura que artículos y adjetivos coincidan en género'
      });
    }

    return errors;
  }

  /**
   * Analiza la complejidad del texto
   * @param {string} text - Texto a analizar
   * @returns {Object} Análisis de complejidad
   */
  analyzeComplexity(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);

    // Métricas básicas
    const averageWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const averageCharsPerWord = text.replace(/\s/g, '').length / Math.max(words.length, 1);

    // Calcular complejidad (0-1)
    let complexity = 0;

    // Complejidad por longitud de palabras
    complexity += Math.min(averageCharsPerWord / 10, 0.3);

    // Complejidad por longitud de oraciones
    complexity += Math.min(averageWordsPerSentence / 20, 0.4);

    // Complejidad por variedad de verbos
    const verbAnalysis = this.analyzeVerbs(text);
    complexity += Math.min(verbAnalysis.verbCount / 10, 0.3);

    return {
      complexity: Math.min(complexity, 1),
      averageWordsPerSentence,
      averageCharsPerWord,
      readability: 1 - complexity, // Inversamente proporcional
      textComplexityLevel: this.getComplexityLevel(complexity)
    };
  }

  /**
   * Analiza la coherencia del texto
   * @param {string} text - Texto a analizar
   * @param {Object} context - Contexto del ejercicio
   * @returns {Object} Análisis de coherencia
   */
  analyzeCoherence(text, context) {
    let coherenceScore = 0.5; // Base

    // Verificar coherencia temática (muy básico)
    if (context.exerciseType === 'timeline' && /\b(entonces|después|luego|finalmente)\b/i.test(text)) {
      coherenceScore += 0.2;
    }

    if (context.exerciseType === 'daily_routine' && /\b(mañana|tarde|noche|diario|siempre|normalmente)\b/i.test(text)) {
      coherenceScore += 0.2;
    }

    // Verificar conectores
    const connectors = text.match(/\b(y|pero|porque|cuando|mientras|entonces|después|antes|aunque|si)\b/gi) || [];
    coherenceScore += Math.min(connectors.length * 0.1, 0.3);

    return {
      score: Math.min(coherenceScore, 1),
      connectorsFound: connectors.length,
      isTopical: coherenceScore > 0.7
    };
  }

  calculateCreativityScore(complexityAnalysis, coherenceAnalysis, verbAnalysis) {
    const complexityComponent = Math.min(complexityAnalysis.complexity, 1) * 0.6;
    const coherenceComponent = Math.min(coherenceAnalysis.score, 1) * 0.3;
    const lexicalComponent = Math.min((verbAnalysis.verbCount || 0) / 10, 1) * 0.1;
    return Math.max(0, Math.min(1, complexityComponent + coherenceComponent + lexicalComponent));
  }

  async calculateGrammarScore(text, precomputedGrammar = null, basicAnalysis = null) {
    const normalized = this.normalizeText(text || '');
    const grammarAnalysis = precomputedGrammar || this.analyzeGrammar(normalized);
    const basic = basicAnalysis || this.performBasicAnalysis(normalized);
    const totalWords = Math.max(basic.wordCount, 1);

    const contribution = (
      (grammarAnalysis.verbs?.count || 0) +
      (grammarAnalysis.articles?.count || 0) +
      (grammarAnalysis.conjunctions?.count || 0) +
      (grammarAnalysis.prepositions?.count || 0)
    ) / (totalWords * 1.5);

    const errors = this.detectErrors(normalized, {});
    const penalty = Math.min(0.6, errors.errorCount * 0.1 + errors.severity * 0.05);

    return Math.max(0, Math.min(1, contribution - penalty));
  }

  async evaluateContentQuality(text) {
    const normalized = this.normalizeText(text || '');
    const basic = this.performBasicAnalysis(normalized);
    if (basic.wordCount === 0) {
      return {
        overallScore: 0,
        coherence: 0,
        richness: 0,
        engagement: 0,
        strengths: [],
        improvements: ['Añade contenido a tu respuesta']
      };
    }

    const grammarScore = await this.calculateGrammarScore(text);
    const complexity = this.analyzeComplexity(normalized);
    const coherence = this.analyzeCoherence(normalized, {});
    const verbAnalysis = this.analyzeVerbs(normalized);
    const creativity = this.calculateCreativityScore(complexity, coherence, verbAnalysis);

    const richness = Math.min(1, (basic.wordCount / 200) + (complexity.averageWordsPerSentence / 25));
    const engagement = Math.min(1, (complexity.averageWordsPerSentence / 15) + (coherence.connectorsFound * 0.05));

    const overall = Math.min(1, (grammarScore * 0.35) + (coherence.score * 0.25) + (richness * 0.2) + (engagement * 0.2));

    const strengths = [];
    if (grammarScore > 0.7) strengths.push('Buena estructura gramatical');
    if (coherence.score > 0.7) strengths.push('Ideas coherentes');
    if (richness > 0.6) strengths.push('Contenido rico y variado');

    const improvements = [];
    if (grammarScore < 0.6) improvements.push('Revisa la gramática y concordancia');
    if (coherence.score < 0.6) improvements.push('Añade conectores y ordena tus ideas');
    if (richness < 0.5) improvements.push('Amplía el contenido con más detalles');

    return {
      overallScore: overall,
      coherence: coherence.score,
      richness,
      engagement,
      creativity,
      strengths,
      improvements
    };
  }

  async extractKeyPhrases(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const phrases = new Set();
    const nounPhrasePattern = /\b(el|la|los|las|un|una|unos|unas)\s+[a-záéíóúñü]+(?:\s+[a-záéíóúñü]+){0,2}/gi;
    let match;
    while ((match = nounPhrasePattern.exec(text)) !== null) {
      let phrase = match[0].trim().toLowerCase();
      phrase = phrase.replace(/\b(de|del|la|el|los|las)\s*$/g, '').trim();
      if (phrase) {
        phrases.add(phrase);
        const withoutArticle = phrase.replace(/^(el|la|los|las|un|una|unos|unas)\s+/, '').trim();
        if (withoutArticle) {
          phrases.add(withoutArticle);
        }
      }
    }

    if (phrases.size === 0) {
      const words = text.split(/\s+/).filter(word => word.length > 3);
      if (words.length >= 2) {
        phrases.add(`${words[0]} ${words[1]}`.toLowerCase());
      }
    }

    return Array.from(phrases);
  }

  /**
   * Calcula la precisión general
   * @param {Object} verbAnalysis - Análisis de verbos
   * @param {Object} tenseAnalysis - Análisis de tiempos
   * @param {Object} context - Contexto
   * @returns {number} Precisión (0-1)
   */
  calculateAccuracy(verbAnalysis, tenseAnalysis, context) {
    let accuracy = 0;

    // Precisión de verbos esperados
    if (context.expectedVerbs && context.expectedVerbs.length > 0) {
      accuracy += verbAnalysis.expectedVerbsUsage * 0.6;
    } else {
      accuracy += 0.6; // No se esperaban verbos específicos
    }

    // Precisión de tiempo verbal
    if (context.expectedTense) {
      accuracy += tenseAnalysis.expectedTensePercentage * 0.4;
    } else {
      accuracy += 0.4; // No se esperaba tiempo específico
    }

    return Math.min(accuracy, 1);
  }

  /**
   * Calcula la completitud
   * @param {Object} verbAnalysis - Análisis de verbos
   * @param {Object} context - Contexto
   * @returns {number} Completitud (0-1)
   */
  calculateCompleteness(verbAnalysis, context) {
    if (!context.expectedVerbs || context.expectedVerbs.length === 0) {
      return 1; // No hay expectativas específicas
    }

    return verbAnalysis.expectedVerbsUsage;
  }

  /**
   * Calcula la adecuación
   * @param {Object} tenseAnalysis - Análisis de tiempos
   * @param {Object} grammarAnalysis - Análisis gramatical
   * @param {Object} context - Contexto
   * @returns {number} Adecuación (0-1)
   */
  calculateAppropriateness(tenseAnalysis, grammarAnalysis, context) {
    let appropriateness = 0.5; // Base

    // Adecuación del tiempo verbal
    if (context.expectedTense) {
      appropriateness += tenseAnalysis.expectedTensePercentage * 0.3;
    }

    // Consistencia del tiempo verbal
    appropriateness += tenseAnalysis.consistency * 0.2;

    return Math.min(appropriateness, 1);
  }

  /**
   * Calcula la severidad de errores
   * @param {Object[]} errors - Lista de errores
   * @returns {number} Severidad promedio
   */
  calculateErrorSeverity(errors) {
    if (errors.length === 0) return 0;

    const totalSeverity = errors.reduce((sum, error) => sum + (error.severity || 1), 0);
    return totalSeverity / errors.length;
  }

  /**
   * Obtiene el nivel de complejidad
   * @param {number} complexity - Puntuación de complejidad
   * @returns {string} Nivel de complejidad
   */
  getComplexityLevel(complexity) {
    if (complexity < 0.3) return 'simple';
    if (complexity < 0.6) return 'intermediate';
    if (complexity < 0.8) return 'complex';
    return 'very_complex';
  }

  /**
   * Normaliza texto para análisis
   * @param {string} text - Texto a normalizar
   * @returns {string} Texto normalizado
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos para análisis
      .trim();
  }

  /**
   * Elimina verbos duplicados
   * @param {Object[]} verbs - Lista de verbos
   * @returns {Object[]} Lista sin duplicados
   */
  removeDuplicateVerbs(verbs) {
    const seen = new Set();
    return verbs.filter(verb => {
      const key = verb.verb.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  inferVerbGroup(word) {
    if (word.endsWith('ar')) return 'ar';
    if (word.endsWith('er')) return 'er';
    if (word.endsWith('ir')) return 'ir';
    return 'unknown';
  }

  /**
   * Genera clave de cache
   * @param {string} text - Texto
   * @param {Object} context - Contexto
   * @returns {string} Clave de cache
   */
  generateCacheKey(text, context) {
    const contextStr = JSON.stringify({
      expectedTense: context.expectedTense,
      expectedVerbs: context.expectedVerbs,
      exerciseType: context.exerciseType
    });
    return `${text.length}:${context.expectedTense || 'none'}:${context.expectedVerbs?.length || 0}`;
  }

  /**
   * Obtiene análisis por defecto en caso de error
   * @param {string} text - Texto original
   * @returns {Object} Análisis básico
   */
  getDefaultAnalysis(text) {
    const normalized = this.normalizeText(text || '');
    return {
      originalText: text,
      normalizedText: normalized,
      wordCount: 0,
      sentenceCount: 0,
      characterCount: (text || '').length,
      verbAnalysis: {
        detectedVerbs: [],
        conjugations: [],
        irregularVerbs: [],
        verbTypes: { regular: 0, irregular: 0 },
        foundExpectedVerbs: [],
        missingExpectedVerbs: [],
        expectedVerbsUsage: 0
      },
      tenseAnalysis: {
        detectedTenses: [],
        dominantTense: null,
        consistency: 0,
        correctTenseUsage: 0,
        tenseErrors: [],
        isExpectedTenseDominant: false
      },
      grammarElements: {},
      errorAnalysis: { errors: [], errorCount: 0, errorTypes: {}, severity: 0 },
      complexityAnalysis: { complexity: 0, averageWordsPerSentence: 0, averageCharsPerWord: 0, readability: 1, textComplexityLevel: 'simple' },
      coherenceAnalysis: { score: 0.5, connectorsFound: 0, isTopical: false },
      accuracy: 0,
      completeness: 0,
      appropriateness: 0,
      grammarScore: 0,
      creativityScore: 0,
      quality: { grammar: 0, coherence: 0, richness: 0, creativity: 0 },
      analysisTimestamp: Date.now(),
      error: true
    };
  }

  /**
   * Limpia el cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('LanguageAnalyzer cache cleared');
  }

  /**
   * Obtiene estadísticas del analizador
   * @returns {Object} Estadísticas
   */
  getStats() {
    return {
      totalAnalyses: this.analysisCount,
      cacheSize: this.cache.size,
      availablePatterns: Object.keys(TENSE_PATTERNS).length,
      supportedIrregularVerbs: Object.keys(IRREGULAR_VERBS).length
    };
  }
}

// Instancia singleton
const languageAnalyzer = new LanguageAnalyzer();

export default languageAnalyzer;
