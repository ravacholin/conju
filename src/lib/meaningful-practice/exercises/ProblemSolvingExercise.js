/**
 * ProblemSolvingExercise - Ejercicio de resolución de problemas
 *
 * Presenta situaciones problemáticas complejas que requieren análisis crítico,
 * evaluación de opciones y toma de decisiones utilizando el español en contextos
 * profesionales y personales realistas.
 *
 * @class ProblemSolvingExercise
 * @extends ExerciseBase
 */

import { ExerciseBase } from '../core/ExerciseBase.js';
import { createLogger } from '../../utils/logger.js';
import { EXERCISE_TYPES } from '../core/constants.js';

const logger = createLogger('ProblemSolvingExercise');

export class ProblemSolvingExercise extends ExerciseBase {
  constructor(config) {
    super({
      ...config,
      type: EXERCISE_TYPES.PROBLEM_SOLVING
    });

    this.problemContext = config.problemContext || {};
    this.decisionPoints = config.decisionPoints || [];
    this.evaluationCriteria = config.evaluationCriteria || {};

    this.currentDecisionPoint = 0;
    this.decisions = [];
    this.analysis = {
      comprehensiveness: 0,
      creativity: 0,
      feasibility: 0,
      reasoning: 0
    };

    logger.debug(`ProblemSolvingExercise created: ${this.id} with ${this.decisionPoints.length} decision points`);
  }

  async initialize() {
    await super.initialize();

    if (!this.problemContext || !this.problemContext.situation) {
      throw new Error('Problem solving exercise requires problem context');
    }

    if (!this.decisionPoints || this.decisionPoints.length === 0) {
      throw new Error('Problem solving exercise requires decision points');
    }

    logger.info(`Problem solving exercise initialized: ${this.problemContext.situation.substring(0, 100)}...`);
  }

  getNextStep() {
    if (this.isComplete()) {
      return {
        type: 'problem_solving_complete',
        title: this.title,
        summary: this.generateSolutionSummary(),
        evaluation: this.evaluateCompleteSolution(),
        nextStep: null
      };
    }

    const decisionPoint = this.decisionPoints[this.currentDecisionPoint];
    if (!decisionPoint) {
      return null;
    }

    return {
      type: 'problem_solving_decision',
      title: this.title,
      problemContext: this.problemContext,
      decisionPoint: {
        ...decisionPoint,
        number: this.currentDecisionPoint + 1,
        total: this.decisionPoints.length
      },
      previousDecisions: this.decisions,
      instructions: this.getDecisionInstructions(decisionPoint),
      analysisFramework: this.getAnalysisFramework(decisionPoint)
    };
  }

  getDecisionInstructions(decisionPoint) {
    const baseInstructions = `Analiza cuidadosamente este aspecto del problema y proporciona una respuesta detallada. `;
    const factorsInstruction = decisionPoint.factors && decisionPoint.factors.length > 0
      ? `Considera estos factores: ${decisionPoint.factors.join(', ')}. `
      : '';
    const elementsInstruction = decisionPoint.expectedElements && decisionPoint.expectedElements.length > 0
      ? `Asegúrate de incluir: ${decisionPoint.expectedElements.join(', ')}. `
      : '';
    const verbsInstruction = decisionPoint.targetVerbs && decisionPoint.targetVerbs.length > 0
      ? `Utiliza verbos como: ${decisionPoint.targetVerbs.join(', ')}.`
      : '';

    return baseInstructions + factorsInstruction + elementsInstruction + verbsInstruction;
  }

  getAnalysisFramework(decisionPoint) {
    // Proporcionar marco de análisis específico según el punto de decisión
    const frameworks = {
      'analisis': {
        name: 'Análisis FODA',
        components: ['Fortalezas', 'Oportunidades', 'Debilidades', 'Amenazas']
      },
      'comparar': {
        name: 'Matriz de Decisión',
        components: ['Criterios', 'Pesos', 'Puntuaciones', 'Resultado']
      },
      'evaluar': {
        name: 'Análisis Costo-Beneficio',
        components: ['Costos', 'Beneficios', 'Riesgos', 'ROI']
      },
      'implementar': {
        name: 'Plan de Implementación',
        components: ['Pasos', 'Cronograma', 'Recursos', 'Métricas']
      }
    };

    const decisionId = decisionPoint.id || '';
    const frameworkKey = Object.keys(frameworks).find(key => decisionId.includes(key));

    return frameworks[frameworkKey] || {
      name: 'Análisis Estructurado',
      components: ['Situación Actual', 'Opciones', 'Criterios', 'Recomendación']
    };
  }

  async processResponse(response) {
    const validation = this.validateResponse(response);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        feedback: 'Por favor, proporciona un análisis más detallado y completo.'
      };
    }

    const currentDecisionPoint = this.decisionPoints[this.currentDecisionPoint];

    this.addUserResponse(response, {
      decisionPoint: this.currentDecisionPoint,
      decisionId: currentDecisionPoint.id,
      question: currentDecisionPoint.question
    });

    // Analizar la respuesta
    const analysis = await this.analyzeDecisionResponse(response, currentDecisionPoint);

    // Guardar la decisión
    this.decisions.push({
      decisionPoint: this.currentDecisionPoint,
      id: currentDecisionPoint.id,
      question: currentDecisionPoint.question,
      response,
      analysis,
      timestamp: Date.now()
    });

    // Actualizar análisis global
    this.updateGlobalAnalysis(analysis);

    // Avanzar al siguiente punto de decisión
    this.currentDecisionPoint++;

    return {
      success: analysis.meetsRequirements,
      analysis,
      feedback: this.generateDecisionFeedback(analysis, currentDecisionPoint),
      nextStep: this.getNextStep(),
      decisionComplete: true
    };
  }

  async analyzeDecisionResponse(response, _decisionPoint) {
    const analysis = {
      elementsPresent: [],
      elementsMissing: [],
      factorsAddressed: [],
      factorsIgnored: [],
      verbsUsed: [],
      wordCount: 0,
      detailLevel: 0,
      creativity: 0,
      feasibility: 0,
      reasoning: 0,
      meetsRequirements: false,
      suggestions: []
    };

    const normalizedResponse = this.normalizeText(response);
    analysis.wordCount = response.trim().split(/\s+/).length;

    // Analizar elementos esperados
    if (decisionPoint.expectedElements) {
      decisionPoint.expectedElements.forEach(element => {
        const elementKeywords = this.extractElementKeywords(element);
        const hasElement = elementKeywords.some(keyword =>
          normalizedResponse.includes(this.normalizeText(keyword))
        );

        if (hasElement) {
          analysis.elementsPresent.push(element);
        } else {
          analysis.elementsMissing.push(element);
        }
      });
    }

    // Analizar factores considerados
    if (decisionPoint.factors) {
      decisionPoint.factors.forEach(factor => {
        const factorKeywords = this.extractFactorKeywords(factor);
        const hasFactor = factorKeywords.some(keyword =>
          normalizedResponse.includes(this.normalizeText(keyword))
        );

        if (hasFactor) {
          analysis.factorsAddressed.push(factor);
        } else {
          analysis.factorsIgnored.push(factor);
        }
      });
    }

    // Analizar verbos utilizados
    if (decisionPoint.targetVerbs) {
      analysis.verbsUsed = this.detectTargetVerbs(response, decisionPoint.targetVerbs);
    }

    // Calcular métricas cualitativas
    analysis.detailLevel = this.calculateDetailLevel(response);
    analysis.creativity = this.calculateCreativity(response);
    analysis.feasibility = this.calculateFeasibility(response, _decisionPoint);
    analysis.reasoning = this.calculateReasoning(response);

    // Determinar si cumple requisitos
    const elementsScore = decisionPoint.expectedElements ?
      analysis.elementsPresent.length / decisionPoint.expectedElements.length : 1;
    const factorsScore = decisionPoint.factors ?
      analysis.factorsAddressed.length / decisionPoint.factors.length : 1;

    analysis.meetsRequirements = elementsScore >= 0.7 &&
                               factorsScore >= 0.6 &&
                               analysis.detailLevel >= 0.7 &&
                               analysis.wordCount >= 100;

    // Generar sugerencias
    analysis.suggestions = this.generateDecisionSuggestions(analysis, _decisionPoint);

    return analysis;
  }

  extractElementKeywords(element) {
    // Extraer palabras clave relevantes para elementos esperados
    const stopWords = ['el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'en', 'por', 'para', 'con', 'que', 'se'];
    return element.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
  }

  extractFactorKeywords(factor) {
    // Extraer palabras clave para factores de análisis
    const factorMap = {
      'presupuesto': ['dinero', 'costo', 'precio', 'euro', 'gasto', 'económico'],
      'tiempo': ['tiempo', 'duración', 'cronograma', 'plazo', 'fecha'],
      'calidad': ['calidad', 'excelencia', 'nivel', 'estándar'],
      'riesgo': ['riesgo', 'peligro', 'problema', 'dificultad'],
      'experiencia': ['experiencia', 'conocimiento', 'habilidad', 'competencia'],
      'logística': ['logística', 'organización', 'coordinación', 'planificación']
    };

    const directKeywords = [factor];
    const mappedKeywords = factorMap[factor.toLowerCase()] || [];

    return [...directKeywords, ...mappedKeywords];
  }

  detectTargetVerbs(response, targetVerbs) {
    const detectedVerbs = [];
    const normalizedResponse = this.normalizeText(response);

    targetVerbs.forEach(verb => {
      const patterns = this.generateVerbPatterns(verb);
      const isPresent = patterns.some(pattern => pattern.test(normalizedResponse));

      if (isPresent) {
        detectedVerbs.push(verb);
      }
    });

    return detectedVerbs;
  }

  generateVerbPatterns(verb) {
    const patterns = [new RegExp(`\\b${verb}\\b`, 'i')];

    // Generar patrones de conjugación básicos
    if (verb.endsWith('ar')) {
      const stem = verb.slice(0, -2);
      patterns.push(
        new RegExp(`\\b${stem}(o|as|a|amos|áis|an|aría|arías|aría|aríamos|aríais|arían)\\b`, 'i'),
        new RegExp(`\\b${stem}(é|aste|ó|amos|asteis|aron)\\b`, 'i')
      );
    } else if (verb.endsWith('er')) {
      const stem = verb.slice(0, -2);
      patterns.push(
        new RegExp(`\\b${stem}(o|es|e|emos|éis|en|ería|erías|ería|eríamos|eríais|erían)\\b`, 'i'),
        new RegExp(`\\b${stem}(í|iste|ió|imos|isteis|ieron)\\b`, 'i')
      );
    } else if (verb.endsWith('ir')) {
      const stem = verb.slice(0, -2);
      patterns.push(
        new RegExp(`\\b${stem}(o|es|e|imos|ís|en|iría|irías|iría|iríamos|iríais|irían)\\b`, 'i'),
        new RegExp(`\\b${stem}(í|iste|ió|imos|isteis|ieron)\\b`, 'i')
      );
    }

    return patterns;
  }

  calculateDetailLevel(response) {
    // Evaluar el nivel de detalle basado en varios factores
    const wordCount = response.trim().split(/\s+/).length;
    const sentenceCount = response.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = wordCount / sentenceCount;

    let score = 0;

    // Puntuación por longitud
    if (wordCount >= 200) score += 0.4;
    else if (wordCount >= 150) score += 0.3;
    else if (wordCount >= 100) score += 0.2;

    // Puntuación por estructura
    if (avgWordsPerSentence >= 12 && avgWordsPerSentence <= 25) score += 0.3;

    // Puntuación por presencia de números/datos específicos
    if (/\d/.test(response)) score += 0.2;

    // Puntuación por uso de conectores y estructura argumentativa
    const connectors = ['porque', 'sin embargo', 'además', 'por lo tanto', 'en primer lugar', 'finalmente'];
    const hasConnectors = connectors.some(conn => response.toLowerCase().includes(conn));
    if (hasConnectors) score += 0.1;

    return Math.min(score, 1);
  }

  calculateCreativity(response) {
    // Evaluar creatividad basada en originalidad y enfoque innovador
    let score = 0.5; // Base score

    // Indicadores de pensamiento creativo
    const creativityIndicators = [
      'innovador', 'alternativo', 'diferente', 'original', 'único',
      'combinar', 'fusionar', 'adaptar', 'reinventar', 'personalizar'
    ];

    const hasCreativeTerms = creativityIndicators.some(term =>
      response.toLowerCase().includes(term)
    );

    if (hasCreativeTerms) score += 0.2;

    // Presencia de múltiples opciones o enfoques
    if (response.includes('opción') || response.includes('alternativa')) {
      score += 0.1;
    }

    // Uso de ejemplos o analogías
    if (response.includes('por ejemplo') || response.includes('como') || response.includes('similar a')) {
      score += 0.1;
    }

    // Pensamiento lateral (preguntas o cuestionamientos)
    if (response.includes('¿') || response.includes('qué pasaría si')) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  calculateFeasibility(response, _decisionPoint) {
    // Evaluar viabilidad práctica de las propuestas
    let score = 0.6; // Base score

    // Indicadores de factibilidad
    const feasibilityIndicators = [
      'realista', 'factible', 'posible', 'viable', 'alcanzable',
      'presupuesto', 'tiempo', 'recursos', 'disponible'
    ];

    const hasFeasibilityTerms = feasibilityIndicators.some(term =>
      response.toLowerCase().includes(term)
    );

    if (hasFeasibilityTerms) score += 0.2;

    // Consideración de limitaciones/restricciones
    const constraintTerms = ['limitación', 'restricción', 'problema', 'dificultad', 'obstáculo'];
    const considersConstraints = constraintTerms.some(term =>
      response.toLowerCase().includes(term)
    );

    if (considersConstraints) score += 0.1;

    // Menciona pasos concretos o cronograma
    if (response.includes('paso') || response.includes('etapa') || response.includes('primero')) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  calculateReasoning(response) {
    // Evaluar calidad del razonamiento y justificación
    let score = 0.4; // Base score

    // Indicadores de buen razonamiento
    const reasoningIndicators = [
      'porque', 'debido a', 'ya que', 'dado que', 'por tanto',
      'en consecuencia', 'esto significa', 'implica', 'resulta en'
    ];

    const reasoningCount = reasoningIndicators.reduce((count, indicator) => {
      return count + (response.toLowerCase().split(indicator).length - 1);
    }, 0);

    score += Math.min(reasoningCount * 0.1, 0.3);

    // Presencia de argumentos con estructura causa-efecto
    if (response.includes('si') && response.includes('entonces')) {
      score += 0.1;
    }

    // Consideración de pros y contras
    if ((response.includes('ventaja') || response.includes('beneficio')) &&
        (response.includes('desventaja') || response.includes('riesgo'))) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  updateGlobalAnalysis(decisionAnalysis) {
    // Actualizar el análisis global del ejercicio
    const weight = 1 / this.decisionPoints.length;

    this.analysis.comprehensiveness += (decisionAnalysis.elementsPresent.length /
      (decisionAnalysis.elementsPresent.length + decisionAnalysis.elementsMissing.length || 1)) * weight;

    this.analysis.creativity += decisionAnalysis.creativity * weight;
    this.analysis.feasibility += decisionAnalysis.feasibility * weight;
    this.analysis.reasoning += decisionAnalysis.reasoning * weight;
  }

  generateDecisionSuggestions(analysis, _decisionPoint) {
    const suggestions = [];

    if (analysis.elementsMissing.length > 0) {
      suggestions.push(`Considera incluir: ${analysis.elementsMissing.slice(0, 2).join(', ')}`);
    }

    if (analysis.factorsIgnored.length > 0) {
      suggestions.push(`Analiza también: ${analysis.factorsIgnored.slice(0, 2).join(', ')}`);
    }

    if (analysis.detailLevel < 0.7) {
      suggestions.push('Proporciona más detalles específicos y ejemplos concretos');
    }

    if (analysis.reasoning < 0.6) {
      suggestions.push('Explica mejor el razonamiento detrás de tus decisiones');
    }

    if (analysis.feasibility < 0.6) {
      suggestions.push('Considera la viabilidad práctica de tus propuestas');
    }

    return suggestions;
  }

  generateDecisionFeedback(analysis, _decisionPoint) {
    let feedback = '';

    if (analysis.meetsRequirements) {
      feedback = '¡Excelente análisis! Has considerado los aspectos clave del problema. ';

      if (analysis.creativity > 0.7) {
        feedback += 'Tu enfoque es muy creativo e innovador. ';
      }

      if (analysis.feasibility > 0.7) {
        feedback += 'Tus propuestas son realistas y viables. ';
      }
    } else {
      feedback = 'Tu análisis está bien encaminado, pero puedes profundizar más. ';

      if (analysis.elementsMissing.length > 0) {
        feedback += `Considera incluir: ${analysis.elementsMissing.slice(0, 2).join(', ')}. `;
      }

      if (analysis.detailLevel < 0.7) {
        feedback += 'Añade más detalles específicos y ejemplos concretos. ';
      }
    }

    if (analysis.verbsUsed.length > 0) {
      feedback += `Buen uso de vocabulario: ${analysis.verbsUsed.slice(0, 3).join(', ')}.`;
    }

    return feedback;
  }

  generateSolutionSummary() {
    const summary = {
      problem: this.title,
      totalDecisions: this.decisions.length,
      averageWordCount: this.decisions.reduce((sum, d) => sum + d.analysis.wordCount, 0) / this.decisions.length,
      overallAnalysis: this.analysis,
      keyDecisions: this.decisions.map(d => ({
        id: d.id,
        question: d.question,
        wordCount: d.analysis.wordCount,
        quality: d.analysis.meetsRequirements
      })),
      strengthAreas: this.identifyStrengths(),
      improvementAreas: this.identifyImprovements()
    };

    return summary;
  }

  identifyStrengths() {
    const strengths = [];

    if (this.analysis.creativity > 0.7) strengths.push('Creatividad e innovación');
    if (this.analysis.feasibility > 0.7) strengths.push('Viabilidad práctica');
    if (this.analysis.reasoning > 0.7) strengths.push('Razonamiento lógico');
    if (this.analysis.comprehensiveness > 0.8) strengths.push('Análisis comprehensivo');

    return strengths;
  }

  identifyImprovements() {
    const improvements = [];

    if (this.analysis.creativity < 0.6) improvements.push('Pensamiento creativo');
    if (this.analysis.feasibility < 0.6) improvements.push('Consideración de viabilidad');
    if (this.analysis.reasoning < 0.6) improvements.push('Justificación de decisiones');
    if (this.analysis.comprehensiveness < 0.6) improvements.push('Completitud del análisis');

    return improvements;
  }

  evaluateCompleteSolution() {
    const evaluation = {
      overall: (this.analysis.comprehensiveness + this.analysis.creativity +
                this.analysis.feasibility + this.analysis.reasoning) / 4,
      criteria: {},
      recommendations: []
    };

    // Evaluar según criterios específicos
    Object.keys(this.evaluationCriteria).forEach(criterion => {
      const score = this.calculateCriterionScore(criterion);
      evaluation.criteria[criterion] = {
        score,
        description: this.evaluationCriteria[criterion]
      };
    });

    // Generar recomendaciones
    evaluation.recommendations = this.generateFinalRecommendations();

    return evaluation;
  }

  calculateCriterionScore(criterion) {
    // Mapear criterios a métricas del análisis
    const criterionMap = {
      'realismo': 'feasibility',
      'creatividad': 'creativity',
      'detalle': 'comprehensiveness',
      'organización': 'reasoning',
      'análisis': 'comprehensiveness',
      'lógica': 'reasoning',
      'practicidad': 'feasibility'
    };

    const metric = criterionMap[criterion] || 'comprehensiveness';
    return this.analysis[metric] || 0.7;
  }

  generateFinalRecommendations() {
    const recommendations = [];
    const overallScore = (this.analysis.comprehensiveness + this.analysis.creativity +
                         this.analysis.feasibility + this.analysis.reasoning) / 4;

    if (overallScore > 0.8) {
      recommendations.push('Excelente capacidad de resolución de problemas');
      recommendations.push('Continúa desarrollando tu pensamiento estratégico');
    } else if (overallScore > 0.6) {
      recommendations.push('Buen nivel de análisis, con potencial de mejora');
      if (this.analysis.creativity < 0.6) {
        recommendations.push('Practica técnicas de pensamiento lateral');
      }
      if (this.analysis.feasibility < 0.6) {
        recommendations.push('Considera más las limitaciones prácticas');
      }
    } else {
      recommendations.push('Desarrolla habilidades de análisis sistemático');
      recommendations.push('Practica la estructuración de argumentos');
    }

    return recommendations;
  }

  normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  validateResponse(response) {
    const errors = [];

    if (!response || typeof response !== 'string') {
      errors.push('La respuesta debe ser un texto válido');
    }

    if (response && response.trim().length < 50) {
      errors.push('La respuesta debe tener al menos 50 caracteres');
    }

    const wordCount = response ? response.trim().split(/\s+/).length : 0;
    if (wordCount < 30) {
      errors.push('Proporciona un análisis más detallado (mínimo 30 palabras)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  isComplete() {
    return this.currentDecisionPoint >= this.decisionPoints.length;
  }

  getTotalSteps() {
    return this.decisionPoints.length;
  }

  getCurrentStep() {
    return Math.min(this.currentDecisionPoint + 1, this.decisionPoints.length);
  }

  getRenderConfig() {
    const baseConfig = super.getRenderConfig();

    return {
      ...baseConfig,
      problemContext: this.problemContext,
      currentDecisionPoint: this.currentDecisionPoint,
      totalDecisionPoints: this.decisionPoints.length,
      inputType: 'textarea',
      placeholder: 'Desarrolla tu análisis y propuesta aquí...',
      minLength: 100,
      showWordCount: true,
      showAnalysisFramework: true,
      showProgressIndicator: true
    };
  }

  reset() {
    super.reset();
    this.currentDecisionPoint = 0;
    this.decisions = [];
    this.analysis = {
      comprehensiveness: 0,
      creativity: 0,
      feasibility: 0,
      reasoning: 0
    };
  }

  // Método para obtener estadísticas del ejercicio
  getExerciseStats() {
    return {
      ...super.getExerciseStats(),
      decisionPoints: this.decisionPoints.length,
      decisionsCompleted: this.decisions.length,
      averageWordCount: this.decisions.length > 0 ?
        this.decisions.reduce((sum, d) => sum + d.analysis.wordCount, 0) / this.decisions.length : 0,
      overallQuality: (this.analysis.comprehensiveness + this.analysis.creativity +
                      this.analysis.feasibility + this.analysis.reasoning) / 4
    };
  }
}