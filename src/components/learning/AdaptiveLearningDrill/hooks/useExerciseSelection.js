/**
 * useExerciseSelection.js - Hook para selección inteligente de tipos de ejercicio
 *
 * Selecciona el tipo de ejercicio más apropiado basado en el contexto actual,
 * progreso del usuario, y objetivos pedagógicos.
 */

import { useState, useEffect } from 'react';
import {
  EXERCISE_TYPES,
  DIFFICULTY_LEVELS,
  PROGRESSION_STAGES,
  CONTEXT_TEMPLATES,
  PERSON_PROGRESSION
} from '../utils/constants.js';
import { createLogger } from '../../../../lib/utils/logger.js';

const logger = createLogger('useExerciseSelection');

/**
 * Hook para selección inteligente de ejercicios
 */
export function useExerciseSelection({
  currentStage,
  currentDifficulty,
  sessionStats,
  verbType,
  selectedFamilies = []
}) {
  // Estado del selector
  const [recentExerciseTypes, setRecentExerciseTypes] = useState([]);
  const [personRotation, setPersonRotation] = useState([]);
  const [contextPool, setContextPool] = useState([]);

  // Inicializar pools y rotaciones
  useEffect(() => {
    setPersonRotation(shuffleArray([...PERSON_PROGRESSION.DIFFICULTY_ORDER]));
    setContextPool(buildContextPool());
  }, []);

  /**
   * Selecciona el tipo de ejercicio más apropiado
   */
  const selectExerciseType = () => {
    const stagePreferences = getStageExercisePreferences(currentStage);
    const difficultyConstraints = getDifficultyExerciseConstraints(currentDifficulty);
    const varietyFactor = calculateVarietyNeed();

    // Combinar factores para selección
    const scores = {};

    Object.values(EXERCISE_TYPES).forEach(type => {
      scores[type] = calculateExerciseScore(
        type,
        stagePreferences,
        difficultyConstraints,
        varietyFactor
      );
    });

    // Seleccionar el tipo con mayor puntuación
    const selectedType = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    );

    // Actualizar historial de tipos recientes
    setRecentExerciseTypes(prev => {
      const updated = [selectedType, ...prev.slice(0, 4)];
      return updated;
    });

    logger.debug('Exercise type selected:', {
      type: selectedType,
      scores,
      stage: currentStage,
      difficulty: currentDifficulty
    });

    return selectedType;
  };

  /**
   * Genera configuración específica para un ejercicio
   */
  const getExerciseConfig = (exerciseType, verb) => {
    const baseConfig = {
      verb,
      exerciseType,
      difficulty: currentDifficulty,
      stage: currentStage
    };

    switch (exerciseType) {
      case EXERCISE_TYPES.CONJUGATION:
        return getConjugationConfig(baseConfig);

      case EXERCISE_TYPES.CONTEXTUAL:
        return getContextualConfig(baseConfig);

      case EXERCISE_TYPES.SENTENCE_BUILDING:
        return getSentenceBuildingConfig(baseConfig);

      case EXERCISE_TYPES.PATTERN_RECOGNITION:
        return getPatternRecognitionConfig(baseConfig);

      case EXERCISE_TYPES.FORM_COMPARISON:
        return getFormComparisonConfig(baseConfig);

      case EXERCISE_TYPES.ERROR_CORRECTION:
        return getErrorCorrectionConfig(baseConfig);

      default:
        return baseConfig;
    }
  };

  /**
   * Configuración para ejercicio de conjugación
   */
  const getConjugationConfig = (baseConfig) => {
    const person = selectOptimalPerson();

    return {
      ...baseConfig,
      person,
      showRoot: currentDifficulty === DIFFICULTY_LEVELS.EASY,
      showPattern: verbType === 'irregular' && currentDifficulty <= DIFFICULTY_LEVELS.INTERMEDIATE,
      timeLimit: getDifficultyTimeLimit(),
      hintsAvailable: currentDifficulty <= DIFFICULTY_LEVELS.INTERMEDIATE
    };
  };

  /**
   * Configuración para ejercicio contextual
   */
  const getContextualConfig = (baseConfig) => {
    const person = selectOptimalPerson();
    const context = selectContext();

    return {
      ...baseConfig,
      person,
      context,
      showMeaning: currentDifficulty === DIFFICULTY_LEVELS.EASY,
      requiresTranslation: currentDifficulty >= DIFFICULTY_LEVELS.ADVANCED
    };
  };

  /**
   * Configuración para construcción de oraciones
   */
  const getSentenceBuildingConfig = (baseConfig) => {
    return {
      ...baseConfig,
      sentence: selectSentenceTemplate(),
      requiredWords: selectRequiredWords(baseConfig.verb),
      minLength: currentDifficulty >= DIFFICULTY_LEVELS.ADVANCED ? 8 : 5,
      allowedHelps: currentDifficulty <= DIFFICULTY_LEVELS.INTERMEDIATE ? 2 : 0
    };
  };

  /**
   * Configuración para reconocimiento de patrones
   */
  const getPatternRecognitionConfig = (baseConfig) => {
    return {
      ...baseConfig,
      verbsToCompare: selectVerbsForComparison(baseConfig.verb),
      patternToIdentify: getVerbPattern(baseConfig.verb),
      showExplanation: currentDifficulty <= DIFFICULTY_LEVELS.INTERMEDIATE
    };
  };

  /**
   * Configuración para comparación de formas
   */
  const getFormComparisonConfig = (baseConfig) => {
    const persons = selectPersonsForComparison();

    return {
      ...baseConfig,
      personsToCompare: persons,
      showDifferences: currentDifficulty === DIFFICULTY_LEVELS.EASY,
      explainPattern: currentDifficulty <= DIFFICULTY_LEVELS.INTERMEDIATE
    };
  };

  /**
   * Configuración para corrección de errores
   */
  const getErrorCorrectionConfig = (baseConfig) => {
    return {
      ...baseConfig,
      incorrectForm: generateIncorrectForm(baseConfig.verb),
      errorType: selectErrorType(),
      explainError: currentDifficulty <= DIFFICULTY_LEVELS.ADVANCED
    };
  };

  /**
   * Funciones de cálculo y selección
   */
  const getStageExercisePreferences = (stage) => {
    switch (stage) {
      case PROGRESSION_STAGES.WARM_UP:
        return {
          [EXERCISE_TYPES.CONJUGATION]: 0.7,
          [EXERCISE_TYPES.CONTEXTUAL]: 0.3,
          [EXERCISE_TYPES.SENTENCE_BUILDING]: 0.1,
          [EXERCISE_TYPES.PATTERN_RECOGNITION]: 0.0,
          [EXERCISE_TYPES.FORM_COMPARISON]: 0.1,
          [EXERCISE_TYPES.ERROR_CORRECTION]: 0.0
        };

      case PROGRESSION_STAGES.BUILDING:
        return {
          [EXERCISE_TYPES.CONJUGATION]: 0.5,
          [EXERCISE_TYPES.CONTEXTUAL]: 0.4,
          [EXERCISE_TYPES.SENTENCE_BUILDING]: 0.2,
          [EXERCISE_TYPES.PATTERN_RECOGNITION]: 0.2,
          [EXERCISE_TYPES.FORM_COMPARISON]: 0.2,
          [EXERCISE_TYPES.ERROR_CORRECTION]: 0.1
        };

      case PROGRESSION_STAGES.CONSOLIDATION:
        return {
          [EXERCISE_TYPES.CONJUGATION]: 0.3,
          [EXERCISE_TYPES.CONTEXTUAL]: 0.4,
          [EXERCISE_TYPES.SENTENCE_BUILDING]: 0.4,
          [EXERCISE_TYPES.PATTERN_RECOGNITION]: 0.3,
          [EXERCISE_TYPES.FORM_COMPARISON]: 0.3,
          [EXERCISE_TYPES.ERROR_CORRECTION]: 0.2
        };

      case PROGRESSION_STAGES.MASTERY:
        return {
          [EXERCISE_TYPES.CONJUGATION]: 0.2,
          [EXERCISE_TYPES.CONTEXTUAL]: 0.3,
          [EXERCISE_TYPES.SENTENCE_BUILDING]: 0.5,
          [EXERCISE_TYPES.PATTERN_RECOGNITION]: 0.4,
          [EXERCISE_TYPES.FORM_COMPARISON]: 0.4,
          [EXERCISE_TYPES.ERROR_CORRECTION]: 0.4
        };

      default:
        return {};
    }
  };

  const getDifficultyExerciseConstraints = (difficulty) => {
    switch (difficulty) {
      case DIFFICULTY_LEVELS.EASY:
        return {
          allowsAdvanced: false,
          requiresContext: false,
          maxComplexity: 0.3
        };

      case DIFFICULTY_LEVELS.INTERMEDIATE:
        return {
          allowsAdvanced: true,
          requiresContext: false,
          maxComplexity: 0.6
        };

      case DIFFICULTY_LEVELS.ADVANCED:
        return {
          allowsAdvanced: true,
          requiresContext: true,
          maxComplexity: 0.9
        };

      case DIFFICULTY_LEVELS.EXPERT:
        return {
          allowsAdvanced: true,
          requiresContext: true,
          maxComplexity: 1.0
        };

      default:
        return getDifficultyExerciseConstraints(DIFFICULTY_LEVELS.INTERMEDIATE);
    }
  };

  const calculateVarietyNeed = () => {
    if (recentExerciseTypes.length < 3) return 0.5;

    // Calcular variedad basada en tipos recientes
    const uniqueTypes = new Set(recentExerciseTypes);
    const varietyRatio = uniqueTypes.size / recentExerciseTypes.length;

    // Penalizar repetición excesiva
    return 1 - varietyRatio;
  };

  const calculateExerciseScore = (type, stagePrefs, difficultyConstraints, varietyFactor) => {
    let score = stagePrefs[type] || 0;

    // Ajustar por restricciones de dificultad
    const typeComplexity = getExerciseTypeComplexity(type);
    if (typeComplexity > difficultyConstraints.maxComplexity) {
      score *= 0.3; // Penalizar fuertemente tipos demasiado complejos
    }

    // Promover variedad
    const recentCount = recentExerciseTypes.filter(t => t === type).length;
    if (recentCount > 0) {
      score *= Math.pow(0.7, recentCount); // Penalizar repetición
    }

    // Bonus por variedad necesaria
    score += varietyFactor * 0.2;

    return score;
  };

  const getExerciseTypeComplexity = (type) => {
    const complexities = {
      [EXERCISE_TYPES.CONJUGATION]: 0.2,
      [EXERCISE_TYPES.CONTEXTUAL]: 0.4,
      [EXERCISE_TYPES.SENTENCE_BUILDING]: 0.7,
      [EXERCISE_TYPES.PATTERN_RECOGNITION]: 0.6,
      [EXERCISE_TYPES.FORM_COMPARISON]: 0.5,
      [EXERCISE_TYPES.ERROR_CORRECTION]: 0.8
    };
    return complexities[type] || 0.5;
  };

  /**
   * Funciones de selección específicas
   */
  const selectOptimalPerson = () => {
    // Rotar a través de personas con preferencia por dificultad
    if (personRotation.length === 0) {
      setPersonRotation(shuffleArray([...PERSON_PROGRESSION.DIFFICULTY_ORDER]));
    }

    const person = personRotation[0];
    setPersonRotation(prev => [...prev.slice(1), person]);

    return person;
  };

  const selectPersonsForComparison = () => {
    // Seleccionar par de personas para comparación
    const pairs = PERSON_PROGRESSION.COMPARISON_PAIRS;
    return pairs[Math.floor(Math.random() * pairs.length)];
  };

  const selectContext = () => {
    // Seleccionar contexto apropiado
    if (contextPool.length === 0) {
      setContextPool(buildContextPool());
    }

    const context = contextPool[Math.floor(Math.random() * contextPool.length)];
    return context;
  };

  const buildContextPool = () => {
    // Construir pool de contextos
    return [...CONTEXT_TEMPLATES.SIMPLE];
  };

  const selectSentenceTemplate = () => {
    const templates = CONTEXT_TEMPLATES.SENTENCE_BUILDING;
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const selectRequiredWords = (verb) => {
    // Palabras que deben aparecer en la oración
    return [verb.lemma];
  };

  const selectVerbsForComparison = (verb) => {
    // Para reconocimiento de patrones, seleccionar verbos similares
    return [verb]; // Simplificado por ahora
  };

  const getVerbPattern = (verb) => {
    // Determinar patrón del verbo
    if (verb.irregularFamilies?.length > 0) {
      return verb.irregularFamilies[0];
    }
    return 'regular';
  };

  const generateIncorrectForm = (verb) => {
    // Generar forma incorrecta típica para corrección
    return verb.lemma + 'o'; // Simplificado
  };

  const selectErrorType = () => {
    const errorTypes = ['conjugation', 'agreement', 'tense'];
    return errorTypes[Math.floor(Math.random() * errorTypes.length)];
  };

  const getDifficultyTimeLimit = () => {
    switch (currentDifficulty) {
      case DIFFICULTY_LEVELS.EASY: return 20000;
      case DIFFICULTY_LEVELS.INTERMEDIATE: return 15000;
      case DIFFICULTY_LEVELS.ADVANCED: return 12000;
      case DIFFICULTY_LEVELS.EXPERT: return 10000;
      default: return 15000;
    }
  };

  // Utilidades
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  return {
    selectExerciseType,
    getExerciseConfig,
    recentExerciseTypes
  };
}