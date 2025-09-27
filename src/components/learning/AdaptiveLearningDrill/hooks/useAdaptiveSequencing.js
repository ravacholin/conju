/**
 * useAdaptiveSequencing.js - Hook para secuenciamiento inteligente de verbos
 *
 * Implementa un algoritmo sofisticado para determinar qué verbo mostrar siguiente
 * basado en el progreso del usuario, la etapa actual, y principios pedagógicos.
 */

import { useState, useEffect, useMemo } from 'react';
import { verbs } from '../../../../data/verbs.js';
import { FORM_LOOKUP_MAP } from '../../../../lib/core/optimizedCache.js';
import { convertLearningFamilyToOld } from '../../../../lib/data/learningIrregularFamilies.js';
import { PROGRESSION_STAGES, PERSON_PROGRESSION } from '../utils/constants.js';
import { createLogger } from '../../../../lib/utils/logger.js';

const logger = createLogger('useAdaptiveSequencing');

/**
 * Hook para secuenciamiento adaptativo de verbos
 */
export function useAdaptiveSequencing({
  tense,
  verbType,
  selectedFamilies = [],
  excludeLemmas = [],
  exampleVerbs = [],
  currentStage
}) {
  // Estado del secuenciador
  const [verbPool, setVerbPool] = useState([]);
  const [currentVerbSequence, setCurrentVerbSequence] = useState([]);
  const [completedVerbs, setCompletedVerbs] = useState(new Set());
  const [currentVerbIndex, setCurrentVerbIndex] = useState(0);
  const [personProgression, setPersonProgression] = useState([]);

  // Configurar pool inicial de verbos cuando cambian las props
  useEffect(() => {
    const pool = buildVerbPool();
    setVerbPool(pool);
    setCurrentVerbIndex(0);
    setCompletedVerbs(new Set());

    logger.debug('Verb pool initialized:', {
      totalVerbs: pool.length,
      stage: currentStage,
      verbType,
      families: selectedFamilies.length
    });
  }, [tense, verbType, selectedFamilies, excludeLemmas]);

  // Configurar secuencia cuando cambia la etapa o el pool
  useEffect(() => {
    if (verbPool.length > 0) {
      const sequence = buildSequenceForStage(currentStage, verbPool);
      setCurrentVerbSequence(sequence);
      setCurrentVerbIndex(0);

      logger.debug('Sequence built for stage:', {
        stage: currentStage,
        sequenceLength: sequence.length
      });
    }
  }, [currentStage, verbPool]);

  // Configurar progresión de personas basada en dialecto
  useEffect(() => {
    const progression = buildPersonProgression();
    setPersonProgression(progression);
  }, []);

  /**
   * Construye el pool inicial de verbos filtrado y priorizado
   */
  const buildVerbPool = () => {
    const excludeSet = new Set(excludeLemmas);
    let pool = [];

    if (verbType === 'regular') {
      // Para verbos regulares, usar ejemplos estándar
      pool = verbs.filter(v =>
        v.type === 'regular' &&
        !excludeSet.has(v.lemma) &&
        hasFormsForTense(v, tense)
      );
    } else if (verbType === 'irregular' && selectedFamilies.length > 0) {
      // Para irregulares, filtrar por familias seleccionadas
      pool = verbs.filter(v => {
        if (excludeSet.has(v.lemma) || !hasFormsForTense(v, tense)) {
          return false;
        }

        // Verificar si el verbo pertenece a alguna familia seleccionada
        return selectedFamilies.some(familyId => {
          const oldFamilyId = convertLearningFamilyToOld(familyId);
          return v.irregularFamilies?.includes(oldFamilyId);
        });
      });
    } else {
      // Fallback: todos los verbos disponibles
      pool = verbs.filter(v =>
        !excludeSet.has(v.lemma) &&
        hasFormsForTense(v, tense)
      );
    }

    // Priorizar verbos por frecuencia y dificultad pedagógica
    return prioritizeVerbs(pool);
  };

  /**
   * Construye la secuencia específica para la etapa actual
   */
  const buildSequenceForStage = (stage, pool) => {
    let sequence = [];

    switch (stage) {
      case PROGRESSION_STAGES.WARM_UP:
        // Empezar con verbos de ejemplo para reforzar lo aprendido
        sequence = buildWarmUpSequence(pool);
        break;

      case PROGRESSION_STAGES.BUILDING:
        // Introducir verbos nuevos gradualmente
        sequence = buildBuildingSequence(pool);
        break;

      case PROGRESSION_STAGES.CONSOLIDATION:
        // Mix estratégico de verbos conocidos y nuevos
        sequence = buildConsolidationSequence(pool);
        break;

      case PROGRESSION_STAGES.MASTERY:
        // Verbos más desafiantes y formas complejas
        sequence = buildMasterySequence(pool);
        break;

      default:
        sequence = [...pool];
    }

    return sequence;
  };

  /**
   * Construye secuencia de calentamiento
   */
  const buildWarmUpSequence = (pool) => {
    const sequence = [];

    // Empezar con verbos de ejemplo si están disponibles
    const exampleLemmas = new Set(exampleVerbs.map(v => v.lemma));
    const exampleVerbsInPool = pool.filter(v => exampleLemmas.has(v.lemma));

    if (exampleVerbsInPool.length > 0) {
      sequence.push(...exampleVerbsInPool);
    }

    // Agregar algunos verbos adicionales fáciles
    const easyVerbs = pool
      .filter(v => !exampleLemmas.has(v.lemma))
      .slice(0, 3);

    sequence.push(...easyVerbs);

    return sequence;
  };

  /**
   * Construye secuencia de construcción
   */
  const buildBuildingSequence = (pool) => {
    // Introducir verbos gradualmente por frecuencia
    const sortedByFrequency = [...pool].sort((a, b) => {
      const freqA = getVerbFrequency(a);
      const freqB = getVerbFrequency(b);
      return freqB - freqA; // Más frecuentes primero
    });

    return sortedByFrequency.slice(0, 8);
  };

  /**
   * Construye secuencia de consolidación
   */
  const buildConsolidationSequence = (pool) => {
    // Mix estratégico: alternando conocidos y nuevos
    const knownVerbs = pool.filter(v => completedVerbs.has(v.lemma));
    const newVerbs = pool.filter(v => !completedVerbs.has(v.lemma));

    const sequence = [];
    const maxLength = 12;

    for (let i = 0; i < maxLength && (knownVerbs.length > 0 || newVerbs.length > 0); i++) {
      if (i % 3 === 0 && knownVerbs.length > 0) {
        // Cada tercer ejercicio: reforzar conocidos
        sequence.push(knownVerbs.shift());
      } else if (newVerbs.length > 0) {
        // Introducir nuevos
        sequence.push(newVerbs.shift());
      } else if (knownVerbs.length > 0) {
        // Fallback a conocidos
        sequence.push(knownVerbs.shift());
      }
    }

    return sequence;
  };

  /**
   * Construye secuencia de maestría
   */
  const buildMasterySequence = (pool) => {
    // Verbos más complejos y menos frecuentes
    const complexVerbs = pool
      .filter(v => getVerbComplexity(v) >= 0.7)
      .slice(0, 10);

    return complexVerbs.length > 0 ? complexVerbs : pool.slice(0, 10);
  };

  /**
   * Construye progresión de personas basada en dialecto
   */
  const buildPersonProgression = () => {
    // TODO: Integrar con settings de dialecto
    return PERSON_PROGRESSION.DIFFICULTY_ORDER;
  };

  /**
   * Obtiene el siguiente verbo de la secuencia
   */
  const getNextVerb = () => {
    if (currentVerbIndex >= currentVerbSequence.length) {
      // No hay más verbos en la secuencia actual
      return null;
    }

    const verb = currentVerbSequence[currentVerbIndex];
    setCurrentVerbIndex(prev => prev + 1);

    return verb;
  };

  /**
   * Marca un verbo como completado
   */
  const markVerbCompleted = (verb) => {
    setCompletedVerbs(prev => new Set([...prev, verb.lemma]));

    logger.debug('Verb marked as completed:', verb.lemma);
  };

  /**
   * Funciones de utilidad
   */
  const hasFormsForTense = (verb, tense) => {
    if (!verb.paradigms || !tense) return false;

    return verb.paradigms.some(paradigm =>
      paradigm.forms?.some(form =>
        form.tense === tense.tense && form.mood === mapMoodToEnglish(tense.mood)
      )
    );
  };

  const mapMoodToEnglish = (spanishMood) => {
    const mapping = {
      'indicativo': 'indicative',
      'subjuntivo': 'subjunctive',
      'imperativo': 'imperative',
      'condicional': 'conditional'
    };
    return mapping[spanishMood] || spanishMood;
  };

  const prioritizeVerbs = (pool) => {
    return [...pool].sort((a, b) => {
      // Priorizar por frecuencia y simplicidad pedagógica
      const scoreA = getVerbPedagogicalScore(a);
      const scoreB = getVerbPedagogicalScore(b);
      return scoreB - scoreA;
    });
  };

  const getVerbFrequency = (verb) => {
    // Frecuencias estimadas (en implementación real, usar datos reales)
    const highFrequency = ['ser', 'estar', 'tener', 'hacer', 'ir', 'ver', 'dar', 'saber'];
    const mediumFrequency = ['poder', 'decir', 'llegar', 'pasar', 'quedar', 'poner', 'venir'];

    if (highFrequency.includes(verb.lemma)) return 3;
    if (mediumFrequency.includes(verb.lemma)) return 2;
    return 1;
  };

  const getVerbComplexity = (verb) => {
    let complexity = 0;

    // Basar en número de irregularidades
    if (verb.irregularFamilies?.length > 1) complexity += 0.3;
    if (verb.type === 'irregular') complexity += 0.2;

    // Verbos específicos conocidos por ser complejos
    const complexVerbs = ['ir', 'ser', 'estar', 'haber'];
    if (complexVerbs.includes(verb.lemma)) complexity += 0.4;

    return Math.min(complexity, 1);
  };

  const getVerbPedagogicalScore = (verb) => {
    const frequency = getVerbFrequency(verb);
    const complexity = getVerbComplexity(verb);

    // Balancear frecuencia vs simplicidad para aprendizaje
    return frequency * 0.7 + (1 - complexity) * 0.3;
  };

  // Retornar interface del hook
  return {
    currentVerbSequence,
    verbPool,
    personProgression,
    completedVerbs,
    getNextVerb,
    markVerbCompleted,
    hasMoreVerbs: currentVerbIndex < currentVerbSequence.length
  };
}