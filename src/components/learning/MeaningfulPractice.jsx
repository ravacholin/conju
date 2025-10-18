import React, { useState, useEffect, useMemo } from 'react';
import { formatMoodTense } from '../../lib/utils/verbLabels.js';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager/index.js';
import { useProgressTracking } from '../../features/drill/useProgressTracking.js';
import { grade as GRADE } from '../../lib/core/grader.js';
import { ERROR_TAGS } from '../../lib/progress/dataModels.js';
import { getAllVerbsSync } from '../../lib/core/verbDataService.js';
import { FORM_LOOKUP_MAP, warmupCaches as warmOptimizedCaches } from '../../lib/core/optimizedCache.js';
import { createLogger } from '../../lib/utils/logger.js';

// Importar el nuevo sistema de práctica significativa
import exerciseFactory from '../../lib/meaningful-practice/exercises/ExerciseFactory.js';
import assessmentEngine from '../../lib/meaningful-practice/assessment/AssessmentEngine.js';
import { EXERCISE_TYPES } from '../../lib/meaningful-practice/core/constants.js';

import './MeaningfulPractice.css';

const logger = createLogger('learning:MeaningfulPractice');

/**
 * Obtiene el lemma (infinitivo) de una forma conjugada usando datos morfológicos reales
 * @param {string} conjugatedForm - Forma verbal conjugada
 * @returns {string|null} - Lemma del verbo o null si no se encuentra
 */
const lemmaCacheByForm = new Map();
let lemmaCachePrimed = false;
let cacheMode = 'uninitialized'; // 'uninitialized' | 'optimized' | 'manual'
let cacheSignature = null;

function getOptimizedCacheSignature() {
  try {
    return FORM_LOOKUP_MAP?.size ?? null;
  } catch (error) {
    logger.warn('No se pudo obtener la firma de FORM_LOOKUP_MAP', error);
    return null;
  }
}

function primeLemmaCache() {
  const currentSignature = getOptimizedCacheSignature();

  if (
    lemmaCachePrimed &&
    ((cacheMode === 'optimized' && cacheSignature === currentSignature) ||
      (cacheMode === 'manual' && (!currentSignature || currentSignature === 0)))
  ) {
    return;
  }

  lemmaCacheByForm.clear();

  if (FORM_LOOKUP_MAP && currentSignature && currentSignature > 0) {
    for (const form of FORM_LOOKUP_MAP.values()) {
      if (!form?.value || !form?.lemma) continue;

      const normalizedValue = form.value.trim().toLowerCase();
      if (!normalizedValue) continue;

      lemmaCacheByForm.set(normalizedValue, form.lemma);
    }

    lemmaCachePrimed = true;
    cacheMode = 'optimized';
    cacheSignature = currentSignature;
    return;
  }

  try {
    const allVerbs = getAllVerbsSync();

    for (const verb of allVerbs || []) {
      if (!verb?.paradigms) continue;

      for (const paradigm of verb.paradigms) {
        if (!paradigm?.forms) continue;

        for (const form of paradigm.forms) {
          if (!form?.value) continue;

          const normalizedValue = form.value.trim().toLowerCase();
          if (!normalizedValue) continue;

          if (!lemmaCacheByForm.has(normalizedValue)) {
            lemmaCacheByForm.set(normalizedValue, verb.lemma || null);
          }
        }
      }
    }
  } catch (error) {
    logger.warn('Error al precalentar la caché de lemmas', error);
  }

  lemmaCachePrimed = true;
  cacheMode = 'manual';
  cacheSignature = currentSignature;
}

function findLemmaAndCache(normalizedForm) {
  try {
    const allVerbs = getAllVerbsSync();

    for (const verb of allVerbs || []) {
      if (!verb?.paradigms) continue;

      for (const paradigm of verb.paradigms) {
        if (!paradigm?.forms) continue;

        for (const form of paradigm.forms) {
          if (!form?.value) continue;

          if (form.value.trim().toLowerCase() === normalizedForm) {
            lemmaCacheByForm.set(normalizedForm, verb.lemma || null);
            return verb.lemma || null;
          }
        }
      }
    }
  } catch (error) {
    logger.warn('Error al buscar lemma para forma conjugada', { normalizedForm, error });
  }

  lemmaCacheByForm.set(normalizedForm, null);
  return null;
}

export function invalidateLemmaCache(options = {}) {
  lemmaCacheByForm.clear();
  lemmaCachePrimed = false;
  cacheMode = 'uninitialized';
  cacheSignature = null;

  if (options?.warm && typeof warmOptimizedCaches === 'function') {
    try {
      warmOptimizedCaches();
    } catch (error) {
      logger.warn('No se pudo recalentar las cachés globales', error);
    }
  }
}

export function getLemmaFromConjugatedForm(conjugatedForm) {
  if (!conjugatedForm || typeof conjugatedForm !== 'string') {
    return null;
  }

  primeLemmaCache();

  const normalizedForm = conjugatedForm.trim().toLowerCase();
  if (!normalizedForm) {
    return null;
  }

  if (!lemmaCacheByForm.has(normalizedForm)) {
    const lemma = findLemmaAndCache(normalizedForm);
    return lemma;
  }

  return lemmaCacheByForm.get(normalizedForm) || null;
}

/**
 * Fallback para derivar lemma usando regex (SOLO para casos extremos)
 * @param {string} conjugatedForm - Forma verbal conjugada
 * @returns {string} - Lemma estimado (puede ser incorrecto para verbos irregulares)
 */
export function deriveLemmaFallback(conjugatedForm) {
  // ADVERTENCIA: Este método es impreciso y solo se usa como último recurso
  // cuando no hay datos morfológicos disponibles

  let lemma = conjugatedForm;

  // Remover terminaciones de pretérito (orden importa: más específico primero)
  if (lemma.endsWith('ieron')) {
    // Puede ser -ir (vivieron -> vivir) o -er (comieron -> comer)
    // Heurística: si la raíz termina en vocal + consonante, probablemente es -er
    const root = lemma.substring(0, lemma.length - 5); // Quitar "ieron"
    if (root.length > 0 && /[aeiou][^aeiou]$/i.test(root)) {
      // comieron -> com + er = comer
      lemma = root + 'er';
    } else {
      // vivieron -> viv + ir = vivir
      lemma = root + 'ir';
    }
  } else if (lemma.endsWith('ió')) {
    // vivió -> vivir
    lemma = lemma.replace(/ió$/, 'ir');
  } else if (lemma.endsWith('ó')) {
    // cantó -> cantar
    lemma = lemma.replace(/ó$/, 'ar');
  } else if (lemma.endsWith('aron')) {
    // cantaron -> cantar
    lemma = lemma.replace(/aron$/, 'ar');
  } else if (lemma.endsWith('ía')) {
    // vivía -> vivir
    lemma = lemma.replace(/ía$/, 'ir');
  } else if (lemma.endsWith('an')) {
    // cantan -> cantar
    lemma = lemma.replace(/an$/, 'ar');
  } else if (lemma.endsWith('en')) {
    // comen -> comer
    lemma = lemma.replace(/en$/, 'er');
  }

  return lemma;
}

const derivePrimaryForms = (eligibleForms = []) => {
  if (!Array.isArray(eligibleForms)) return [];
  return eligibleForms.filter((_, index) => index % 2 === 0);
};

function createFallbackStep(options = {}) {
  const { eligibleForms = [], tense = 'pres', mood = 'indicativo' } = options;
  const primaryForms = derivePrimaryForms(eligibleForms);

  const prompts = primaryForms.length > 0
    ? primaryForms.map(form => ({
        icon: '📝',
        text: `Incluye la forma "${form.value}" (${form.person}) en tu historia.`
      }))
    : [
        {
          icon: '🕒',
          text: 'Comparte al menos tres actividades de una rutina diaria usando presente.'
        }
      ];

  return {
    type: 'default',
    title: 'Preparando ejercicio...',
    instructions: 'Escribe brevemente cómo es una rutina usando verbos en presente.',
    placeholder: 'Escribe aquí tus respuestas...',
    prompts,
    expectedVerbs: primaryForms.map(form => form.value),
    submitLabel: 'Revisar Historia',
    mood,
    tense
  };
}

function createFallbackExercise(options = {}) {
  const { eligibleForms = [], tense = 'pres', mood = 'indicativo' } = options;
  const primaryForms = derivePrimaryForms(eligibleForms);

  const prompts = primaryForms.length > 0
    ? primaryForms.map((form, index) => ({
        icon: ['⏰', '🍳', '💼', '🏠', '🌙'][index] || '📝',
        text: `Describe una escena donde aparezca "${form.value}".`
      }))
    : [
        {
          icon: '🕒',
          text: 'Comparte al menos tres actividades de una rutina diaria usando presente.'
        }
      ];

  return {
    id: 'meaningful_fallback',
    title: 'Práctica en preparación',
    description: 'Configurando un ejercicio personalizado…',
    type: 'daily_routine',
    difficulty: 'intermediate',
    prompts,
    eligibleForms,
    primaryForms,
    mood,
    tense,
    getNextStep() {
      return createFallbackStep({ eligibleForms, tense, mood });
    },
    getTotalSteps() {
      return 1;
    },
    getCurrentStep() {
      return 1;
    },
    getExerciseStats() {
      return {
        totalAttempts: 0,
        averageScore: 0
      };
    },
    async processResponse(response) {
      const normalizedResponse = (response || '').toLowerCase();
      const foundForms = primaryForms.filter(form => normalizedResponse.includes(form.value.toLowerCase()));
      const missingForms = primaryForms.filter(form => !normalizedResponse.includes(form.value.toLowerCase()));
      const success = primaryForms.length === 0 ? true : missingForms.length === 0;

      return {
        success,
        feedback: success
          ? '¡Excelente! Has descrito la rutina usando todos los verbos necesarios.'
          : missingForms.length > 0
            ? `Faltan algunos verbos: ${missingForms.map(form => form.value).join(', ')}.`
            : 'Intenta usar al menos uno de los verbos indicados.',
        nextStep: null,
        analysis: {
          isCorrect: success,
          foundVerbs: foundForms.map(form => form.value),
          missingVerbs: missingForms.map(form => form.value),
          completionPercentage: primaryForms.length === 0
            ? 1
            : foundForms.length / primaryForms.length,
          totalExpected: primaryForms.length,
          responseLength: response?.length || 0,
          wordCount: response ? response.trim().split(/\s+/).length : 0
        }
      };
    }
  };
}

const normalizeForMatch = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * Extrae los verbos requeridos del ejercicio y eligibleForms usando datos morfológicos reales
 * @param {Object} exercise - Ejercicio actual
 * @param {Array} eligibleForms - Formas verbales elegibles del SRS
 * @param {string} tense - Tiempo verbal
 * @param {string} mood - Modo verbal
 * @returns {Object} Objeto con verbos requeridos y ejemplos
 */
export function extractRequiredVerbs(exercise, eligibleForms, tense, mood) {
  const result = {
    lemmas: [],
    conjugatedExamples: [],
    instructions: ''
  };

  // 1. PRIORIDAD: Extraer de eligibleForms (ya tienen lemma correcto)
  if (eligibleForms?.length > 0) {
    // Obtener lemmas únicos de eligibleForms
    const uniqueLemmas = [...new Set(
      eligibleForms
        .filter(form => form.lemma) // Solo formas con lemma
        .map(form => form.lemma)
    )];

    if (uniqueLemmas.length > 0) {
      result.lemmas = uniqueLemmas.slice(0, 8); // Limitar a 8 verbos máximo

      // Obtener ejemplos conjugados del tense/mood actual
      result.conjugatedExamples = eligibleForms
        .filter(form => form.tense === tense && form.mood === mood)
        .map(form => form.value)
        .slice(0, 8);
    }
  }

  // 2. Si el ejercicio tiene expectedVerbs pero no hay lemmas aún,
  //    intentar obtener lemmas reales usando datos morfológicos
  if (result.lemmas.length === 0 && exercise?.expectedVerbs?.length > 0) {
    result.conjugatedExamples = exercise.expectedVerbs;

    result.lemmas = exercise.expectedVerbs.map(verb => {
      // Intentar buscar lemma real en la base de datos
      const realLemma = getLemmaFromConjugatedForm(verb);

      if (realLemma) {
        return realLemma;
      }

      // FALLBACK: Solo usar regex si no se encuentra en datos morfológicos
      logger.warn(
        `⚠️ No se encontró lemma morfológico para "${verb}", usando fallback regex (puede ser incorrecto para irregulares)`
      );
      return deriveLemmaFallback(verb);
    }).filter(Boolean); // Remover nulls
  }

  // 3. ÚLTIMO RECURSO: Si aún no hay verbos, usar verbos comunes para el tiempo verbal
  if (result.lemmas.length === 0) {
    logger.warn('Usando verbos comunes como último recurso - no hay datos de SRS disponibles');

    const commonVerbsByTense = {
      'pres': ['ser', 'estar', 'tener', 'hacer', 'decir', 'ver'],
      'pretIndef': ['ir', 'hacer', 'decir', 'ver', 'dar', 'saber'],
      'impf': ['ser', 'estar', 'tener', 'hacer', 'ir', 'ver'],
      'fut': ['ser', 'estar', 'tener', 'hacer', 'ir', 'poder'],
      'cond': ['ser', 'estar', 'tener', 'hacer', 'poder', 'querer']
    };
    result.lemmas = commonVerbsByTense[tense] || ['ser', 'estar', 'tener'];
  }

  // 4. Generar instrucciones claras
  // PRIORIDAD 1: Si hay instrucciones específicas de verbos, usarlas
  if (exercise?.verbInstructions) {
    result.instructions = exercise.verbInstructions;
  } else {
    // PRIORIDAD 2: Generar instrucciones automáticamente
    const tenseNames = {
      'pres': 'presente',
      'pretIndef': 'pretérito indefinido',
      'impf': 'imperfecto',
      'fut': 'futuro',
      'cond': 'condicional',
      'pretPerf': 'pretérito perfecto'
    };

    const tenseName = tenseNames[tense] || tense;

    if (result.conjugatedExamples.length > 0) {
      result.instructions = `Usa ESTOS verbos en ${tenseName}: ${result.conjugatedExamples.join(', ')}`;
    } else {
      result.instructions = `Usa ESTOS verbos en ${tenseName}: ${result.lemmas.join(', ')}`;
    }
  }

  return result;
}

/**
 * MeaningfulPractice - Componente refactorizado usando la nueva arquitectura
 *
 * Utiliza el sistema modular de ejercicios, análisis avanzado y feedback inteligente
 * para proporcionar experiencias de aprendizaje contextual y significativo.
 */
function MeaningfulPractice({
  tense,
  mood,
  onComplete,
  onBack,
  onHome,
  eligibleForms = [],
  difficulty = 'intermediate',
  exerciseType = null
}) {
  const [currentExercise, setCurrentExercise] = useState(() => createFallbackExercise({ eligibleForms, tense, mood }));
  const [currentStep, setCurrentStep] = useState(() => createFallbackStep({ eligibleForms, tense, mood }));
  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exerciseResults, setExerciseResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Crear item estable con id para tracking
  const currentTrackingItem = useMemo(() => {
    if (!currentStep) return null;

    return {
      id: `meaningful_${tense}_${mood}`,
      verb: currentStep.title || 'meaningful_practice',
      form: `${mood}_${tense}`,
      mood,
      tense,
      type: 'meaningful_practice'
    };
  }, [currentStep, tense, mood]);

  // Usar el hook de seguimiento de progreso
  const { handleResult, handleHintShown } = useProgressTracking(
    currentTrackingItem,
    onComplete
  );

  // Crear configuración del ejercicio basada en props
  const exerciseConfig = useMemo(() => {
    return {
      tense,
      mood,
      difficulty,
      targetTenses: [tense],
      eligibleForms,
      includeProgressTracking: true,
      adaptToUserLevel: true
    };
  }, [tense, mood, difficulty, eligibleForms]);

  // Inicializar ejercicio al cargar el componente
  useEffect(() => {
    initializeExercise();
  }, [tense, mood, exerciseType]);

  function normalizeStep(step, exercise) {
    if (!step) return step;
    const normalized = { ...step };
    const exerciseType = exercise?.type || step.type;

    if (exerciseType === 'daily_routine' || step.type === 'daily_routine_input') {
      normalized.submitLabel = step.submitLabel || 'Revisar Historia';
      normalized.placeholder = step.placeholder || 'Escribe aquí tus respuestas...';
    }

    return normalized;
  }

  async function initializeExercise() {
    try {
      setError(null);

      // Determinar tipo de ejercicio
      const selectedExerciseType = exerciseType || determineExerciseType(tense, mood);

      // Crear ejercicio usando la factory
      const exercise = await exerciseFactory.createExercise(selectedExerciseType, exerciseConfig);

      if (!exercise) {
        throw new Error('No se pudo crear el ejercicio');
      }

      setCurrentExercise(exercise);

      // Obtener el primer paso
      const firstStep = normalizeStep(exercise.getNextStep(), exercise);
      setCurrentStep(firstStep);

      logger.debug('Ejercicio inicializado', {
        type: selectedExerciseType,
        title: exercise.title,
        steps: exercise.getTotalSteps()
      });

    } catch (err) {
      logger.error('Error al inicializar ejercicio', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function determineExerciseType(tense, _mood) {
    // Mapeo inteligente de tiempos verbales a tipos de ejercicio
    const tenseToExerciseMap = {
      'pres': EXERCISE_TYPES.DAILY_ROUTINE,
      'pretIndef': EXERCISE_TYPES.TIMELINE,
      'impf': EXERCISE_TYPES.STORY_BUILDING,
      'fut': EXERCISE_TYPES.PROBLEM_SOLVING,
      'cond': EXERCISE_TYPES.ROLE_PLAYING,
      'subjPres': EXERCISE_TYPES.ROLE_PLAYING,
      'subjImpf': EXERCISE_TYPES.STORY_BUILDING
    };

    return tenseToExerciseMap[tense] || EXERCISE_TYPES.PROMPTS;
  }

  async function handleSubmit() {
    if (isLoading || !currentExercise || !userResponse.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Procesar respuesta con el ejercicio
      const result = await currentExercise.processResponse(userResponse.trim());

      // Realizar análisis avanzado con AssessmentEngine
      const assessment = await assessmentEngine.assessResponse(
        userResponse.trim(),
        {
          exercise: currentExercise,
          step: currentStep,
          tense,
          mood,
          expectedTense: tense,
          exerciseType: currentExercise.type,
          difficulty: currentExercise.difficulty,
          category: currentExercise.category,
          expectedVerbs: Array.isArray(currentExercise?.prompts)
            ? currentExercise.prompts.flatMap(prompt => prompt.expected || [])
            : (currentStep?.expectedVerbs || []),
          eligibleForms,
          expectedElements: currentStep?.expectedElements || []
        }
      );

      // Combinar resultados
      const combinedResult = {
        ...result,
        assessment,
        userResponse: userResponse.trim(),
        timestamp: Date.now()
      };

      // Guardar resultado
      setExerciseResults(prev => [...prev, combinedResult]);

      // Actualizar progreso usando el sistema SRS
      if (combinedResult.success) {
        await handleProgressUpdate(combinedResult);
      }

      // Obtener siguiente paso o completar ejercicio
      if (result.nextStep) {
        setCurrentStep(normalizeStep(result.nextStep, currentExercise));
        setUserResponse('');
      } else {
        // Ejercicio completado
        await completeExercise(combinedResult);
      }

    } catch (err) {
      logger.error('Error al procesar respuesta', err);
      setError('Error al procesar la respuesta. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectFormsForSchedule(result) {
    if (!Array.isArray(eligibleForms) || eligibleForms.length === 0) {
      return [];
    }

    const formsByValue = new Map();
    eligibleForms.forEach(form => {
      if (form?.value) {
        formsByValue.set(normalizeForMatch(form.value), form);
      }
    });

    if (formsByValue.size === 0) {
      return [];
    }

    const foundVerbs = Array.isArray(result?.analysis?.foundVerbs)
      ? result.analysis.foundVerbs.map(normalizeForMatch)
      : [];
    const foundSet = new Set(foundVerbs);
    const matchedForms = [];
    const usedKeys = new Set();

    if (Array.isArray(currentExercise?.prompts)) {
      currentExercise.prompts.forEach(prompt => {
        if (!Array.isArray(prompt?.expected)) return;
        const match = prompt.expected.find(expected => {
          const key = normalizeForMatch(expected);
          return foundSet.has(key) && formsByValue.has(key) && !usedKeys.has(key);
        });
        if (match) {
          const key = normalizeForMatch(match);
          matchedForms.push(formsByValue.get(key));
          usedKeys.add(key);
        }
      });
    }

    if (matchedForms.length === 0) {
      foundSet.forEach(key => {
        if (formsByValue.has(key) && !usedKeys.has(key)) {
          matchedForms.push(formsByValue.get(key));
          usedKeys.add(key);
        }
      });
    }

    return matchedForms;
  }

  async function handleProgressUpdate(result) {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      // Calcular puntuación para el sistema de progreso
      const score = calculateProgressScore(result);
      const isCorrect = score >= 0.7;

      const matchedForms = selectFormsForSchedule(result);

      if (matchedForms.length > 0) {
        for (const form of matchedForms) {
          try {
            await updateSchedule(userId, form, isCorrect, 0);
          } catch (scheduleError) {
            logger.error('Failed to update SRS schedule', scheduleError);
          }
        }
      }

      // Construir objeto de resultado para el hook de tracking
      const trackingResult = {
        correct: isCorrect,
        userAnswer: result.userResponse,
        correctAnswer: result.expectedResponse || 'N/A', // Respuesta esperada si está disponible
        errorTags: extractErrorTags(result.assessment),
        hintsUsed: 0, // MeaningfulPractice no usa hints del mismo modo
        score,
        timeSpent: Date.now() - (result.timestamp || Date.now()),
        // Metadata adicional para análisis
        metadata: {
          exerciseType: currentExercise.type,
          difficulty: currentExercise.difficulty,
          wordCount: result.userResponse.split(/\s+/).length,
          assessmentScores: result.assessment ? {
            grammar: result.assessment.grammarScore,
            creativity: result.assessment.creativityScore,
            content: result.assessment.contentScore
          } : null,
          matchedForms: matchedForms.map(form => form.value)
        }
      };

      // Registrar con el sistema de seguimiento (un solo argumento)
      await handleResult(trackingResult);

    } catch (err) {
      logger.error('Error al actualizar progreso', err);
    }
  }

  function calculateProgressScore(result) {
    let score = 0.5; // Base score

    // Puntuación por éxito del ejercicio
    if (result.success) score += 0.3;

    // Puntuación por calidad del assessment
    if (result.assessment) {
      const { grammarScore, creativityScore, contentScore } = result.assessment;
      score += (grammarScore * 0.1) + (creativityScore * 0.05) + (contentScore * 0.05);
    }

    // Puntuación por análisis específico del ejercicio
    if (result.analysis) {
      if (result.analysis.isCorrect || result.analysis.meetsRequirements) score += 0.2;
      if (result.analysis.qualityScore) score += result.analysis.qualityScore * 0.1;
    }

    return Math.min(score, 1.0);
  }

  function extractErrorTags(assessment) {
    if (!assessment || !assessment.errors) return [];

    const errorTags = [];

    assessment.errors.forEach(error => {
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
        default:
          errorTags.push(ERROR_TAGS.OTHER);
      }
    });

    return [...new Set(errorTags)];
  }

  async function completeExercise(finalResult) {
    try {
      // Generar resumen del ejercicio
      const exerciseStats = currentExercise.getExerciseStats();
      const summary = {
        exercise: currentExercise.title,
        type: currentExercise.type,
        totalSteps: currentExercise.getTotalSteps(),
        results: exerciseResults.length + 1, // +1 for final result
        averageScore: calculateAverageScore([...exerciseResults, finalResult]),
        timeSpent: calculateTotalTime(),
        completedAt: Date.now()
      };

      logger.debug('Ejercicio completado', summary);

      // Llamar callback de completación
      if (onComplete) {
        onComplete({
          success: true,
          summary,
          finalResult,
          stats: exerciseStats
        });
      }

    } catch (err) {
      logger.error('Error al completar ejercicio', err);
    }
  }

  function calculateAverageScore(results) {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => {
      return sum + calculateProgressScore(result);
    }, 0);
    return totalScore / results.length;
  }

  function calculateTotalTime() {
    if (exerciseResults.length === 0) return 0;
    const firstTimestamp = exerciseResults[0]?.timestamp || Date.now();
    return Date.now() - firstTimestamp;
  }

  function handleHint() {
    if (currentStep && currentStep.instructions) {
      handleHintShown();
      // Mostrar hint en UI (implementación específica del tipo de ejercicio)
      alert(currentStep.instructions);
    }
  }

  if (error) {
    return (
      <div className="meaningful-practice-container">
        <div className="error-state">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={initializeExercise} className="retry-button">
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  if (!currentExercise || !currentStep) {
    return (
      <div className="meaningful-practice-container">
        <div className="empty-state">
          <p>No hay ejercicios disponibles para este tiempo verbal.</p>
        </div>
      </div>
    );
  }

  // Renderizado principal del ejercicio
  return (
    <div className="meaningful-practice-container">
      {/* Navigation Header */}
      <div className="drill-header">
        <div className="header-nav">
          {onBack && (
            <button onClick={onBack} className="back-to-menu-btn" aria-label="Volver">
              <img src="/back.png" alt="Volver" className="back-icon" />
            </button>
          )}
          {onHome && (
            <button onClick={onHome} className="icon-btn" aria-label="Inicio" title="Inicio">
              <img src="/home.png" alt="Inicio" className="menu-icon" />
            </button>
          )}
      </div>
      <h2>Práctica Significativa</h2>
    </div>

      {isLoading && (
        <div className="loading-state inline-loading" role="status" aria-live="polite">
          <div className="spinner"></div>
          <p>Preparando ejercicio de práctica...</p>
        </div>
      )}

      <ExerciseHeader
        exercise={currentExercise}
        step={currentStep}
        tense={tense}
        mood={mood}
        eligibleForms={eligibleForms}
      />

      <ExerciseContent
        step={currentStep}
        userResponse={userResponse}
        onResponseChange={setUserResponse}
        onSubmit={handleSubmit}
        onHint={handleHint}
        isSubmitting={isSubmitting}
        isLoading={isLoading}
        results={exerciseResults}
      />

      {exerciseResults.length > 0 && (
        <ExerciseProgress
          results={exerciseResults}
          totalSteps={currentExercise.getTotalSteps()}
        />
      )}
    </div>
  );
}

// Componente para mostrar el encabezado del ejercicio
function ExerciseHeader({ exercise, step, tense, mood, eligibleForms }) {
  const requiredVerbs = extractRequiredVerbs(exercise, eligibleForms, tense, mood);

  return (
    <div className="exercise-header">
      <div className="exercise-info">
        <h2>{exercise.title}</h2>
        <p className="exercise-description">{exercise.description}</p>
        <div className="exercise-meta">
          <span className="tense-label">{formatMoodTense(mood, tense)}</span>
          <span className="difficulty-label">{exercise.difficulty}</span>
          <span className="exercise-type">{exercise.type}</span>
        </div>
      </div>

      {/* INSTRUCCIONES CLARAS CON VERBOS REQUERIDOS */}
      <div className="required-verbs-section">
        <div className="verb-instructions">
          <h3>📝 Instrucciones claras:</h3>
          <p className="verb-instructions-text">
            <strong>{requiredVerbs.instructions}</strong>
          </p>
        </div>

        {requiredVerbs.lemmas.length > 0 && (
          <div className="verb-list">
            <h4>Verbos que debes usar:</h4>
            <div className="verb-tags">
              {requiredVerbs.lemmas.map((verb, index) => (
                <span key={index} className="verb-tag">
                  {verb}
                </span>
              ))}
            </div>
            {requiredVerbs.conjugatedExamples.length > 0 && (
              <div className="conjugated-examples">
                <p><strong>Ejemplos conjugados:</strong> {requiredVerbs.conjugatedExamples.join(', ')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {step && (
        <div className="step-info">
          <h3>{step.title || `Paso ${exercise.getCurrentStep()}`}</h3>
          {step.instructions && (
            <p className="step-instructions">{step.instructions}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Componente para mostrar el contenido del ejercicio
function ExerciseContent({
  step,
  userResponse,
  onResponseChange,
  onSubmit,
  onHint,
  isSubmitting,
  isLoading,
  results
}) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onSubmit();
    }
  };

  const renderStepContent = () => {
    switch (step.type) {
      case 'daily_routine_input':
        return (
          <DailyRoutineStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );

      case 'timeline_input':
        return (
          <TimelineStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );

      case 'story_building_input':
        return (
          <StoryBuildingStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );

      case 'role_playing_interaction':
        return (
          <RolePlayingStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );

      case 'problem_solving_decision':
        return (
          <ProblemSolvingStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );

      default:
        return (
          <DefaultStepContent
            step={step}
            userResponse={userResponse}
            onResponseChange={onResponseChange}
            onKeyPress={handleKeyPress}
          />
        );
    }
  };

  return (
    <div className="exercise-content">
      {renderStepContent()}

      {/* Mostrar resultados anteriores */}
      {results.length > 0 && (
        <div className="previous-results">
          {results.slice(-2).map((result, index) => (
            <div key={index} className="result-feedback">
              <p className={`feedback ${result.success ? 'success' : 'needs-improvement'}`}>
                {result.feedback}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Controles del ejercicio */}
      <div className="exercise-controls">
        <button
          onClick={onHint}
          className="hint-button"
          disabled={isSubmitting}
        >
          Pista
        </button>

        <button
          onClick={onSubmit}
          className="submit-button"
          disabled={!userResponse.trim() || isSubmitting || isLoading}
        >
          {isLoading
            ? 'Preparando...'
            : isSubmitting
              ? 'Procesando...'
              : (step.submitLabel || 'Enviar respuesta')}
        </button>
      </div>
    </div>
  );
}

// Componentes específicos para cada tipo de ejercicio
function DailyRoutineStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="daily-routine-step">
      {Array.isArray(step.prompts) && (
        <div className="routine-prompts">
          {step.prompts.map((prompt, index) => (
            <div key={index} className="routine-prompt">
              <span className="prompt-icon">
                {prompt.icon?.startsWith?.('/') ? (
                  <img src={prompt.icon} alt="" className="icon-image" />
                ) : (
                  prompt.icon || '•'
                )}
              </span>
              <div className="prompt-details">
                <span className="prompt-text">{prompt.text}</span>
                {Array.isArray(prompt.expected) && prompt.expected.length > 0 && (
                  <div className="expected-verbs">
                    {prompt.expected.map((verb, verbIndex) => (
                      <span key={verbIndex} className="verb-tag">
                        {verb}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || 'Escribe aquí tus respuestas...'}
        className="response-textarea daily-routine-textarea"
        rows={8}
      />
    </div>
  );
}

function TimelineStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="timeline-step">
      {/* Mostrar verbos esperados prominentemente */}
      {step.expectedVerbs && step.expectedVerbs.length > 0 && (
        <div className="timeline-verbs-reminder">
          <h4>📝 Verbos que debes usar en esta historia:</h4>
          <div className="timeline-verb-list">
            {step.expectedVerbs.map((verb, index) => (
              <span key={index} className="timeline-verb-tag">
                {verb}
              </span>
            ))}
          </div>
        </div>
      )}

      {step.prompts && (
        <div className="timeline-prompts">
          {step.prompts.map((prompt, index) => (
            <div key={index} className="timeline-prompt">
              <span className="prompt-icon">
                {prompt.icon?.startsWith('/') ? (
                  <img src={prompt.icon} alt="" className="icon-image" />
                ) : (
                  prompt.icon
                )}
              </span>
              <span className="prompt-text">{prompt.text}</span>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || "Describe la línea de tiempo usando los verbos indicados..."}
        className="response-textarea timeline-textarea"
        rows={6}
      />
    </div>
  );
}

function StoryBuildingStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="story-building-step">
      {/* Mostrar verbos esperados prominentemente */}
      {step.expectedVerbs && step.expectedVerbs.length > 0 && (
        <div className="story-verbs-reminder">
          <h4>📝 Verbos que debes usar en tu historia:</h4>
          <div className="story-verb-list">
            {step.expectedVerbs.map((verb, index) => (
              <span key={index} className="story-verb-tag">
                {verb}
              </span>
            ))}
          </div>
        </div>
      )}

      {step.elements && (
        <div className="story-elements">
          <h4>Elementos para tu historia:</h4>
          {Object.entries(step.elements).map(([category, items]) => (
            <div key={category} className="element-category">
              <h5>{category}:</h5>
              <div className="element-items">
                {items.map((item, index) => (
                  <span key={index} className="element-item">
                    {item.name || item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || "Escribe tu historia aquí..."}
        className="response-textarea story-textarea"
        rows={8}
      />

      {step.showWordCount && (
        <div className="word-count">
          Palabras: {userResponse.trim().split(/\s+/).length}
          {step.minLength && ` (mínimo: ${step.minLength})`}
        </div>
      )}
    </div>
  );
}

function RolePlayingStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="role-playing-step">
      {step.scenario && (
        <div className="scenario-info">
          <h4>Situación:</h4>
          <p>{step.scenario.context}</p>
          <p><strong>Tu rol:</strong> {step.scenario.userRole}</p>
        </div>
      )}

      {step.npcMessage && (
        <div className="npc-message">
          <p><strong>{step.scenario?.npcRole || 'Interlocutor'}:</strong></p>
          <p>"{step.npcMessage}"</p>
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || "Escribe tu respuesta..."}
        className="response-textarea roleplay-textarea"
        rows={4}
      />
    </div>
  );
}

function ProblemSolvingStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="problem-solving-step">
      {step.problemContext && (
        <div className="problem-context">
          <h4>Situación:</h4>
          <p>{step.problemContext.situation}</p>

          {step.problemContext.constraints && (
            <div className="constraints">
              <h5>Limitaciones:</h5>
              <ul>
                {step.problemContext.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {step.decisionPoint && (
        <div className="decision-point">
          <h4>{step.decisionPoint.question}</h4>
          {step.decisionPoint.factors && (
            <div className="factors">
              <p><strong>Factores a considerar:</strong></p>
              <ul>
                {step.decisionPoint.factors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || "Desarrolla tu análisis y propuesta..."}
        className="response-textarea problem-solving-textarea"
        rows={8}
      />
    </div>
  );
}

function DefaultStepContent({ step, userResponse, onResponseChange, onKeyPress }) {
  return (
    <div className="default-step">
      {step.prompts && (
        <div className="prompts">
          {step.prompts.map((prompt, index) => (
            <div key={index} className="prompt">
              {prompt.icon && (
                <span className="prompt-icon">
                  {prompt.icon?.startsWith('/') ? (
                    <img src={prompt.icon} alt="" className="icon-image" />
                  ) : (
                    prompt.icon
                  )}
                </span>
              )}
              <span className="prompt-text">{prompt.text || prompt}</span>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={userResponse}
        onChange={(e) => onResponseChange(e.target.value)}
        onKeyPress={onKeyPress}
        placeholder={step.placeholder || "Escribe tu respuesta..."}
        className="response-textarea"
        rows={6}
      />
    </div>
  );
}

// Componente para mostrar el progreso del ejercicio
function ExerciseProgress({ results, totalSteps }) {
  const completedSteps = results.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="exercise-progress">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <p className="progress-text">
        Paso {completedSteps + 1} de {totalSteps}
      </p>
    </div>
  );
}

export default MeaningfulPractice;
