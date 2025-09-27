/**
 * ConjugationExercise.jsx - Ejercicio de conjugación mejorado
 *
 * Versión mejorada del ejercicio básico de conjugación con:
 * - Ayudas visuales para familias irregulares
 * - Feedback específico por patrón
 * - Interfaz adaptativa según dificultad
 * - Integración con TTS y accesibilidad
 */

import React, { useState, useEffect, useRef } from 'react';
import { grade } from '../../../../lib/core/grader.js';
import { useSettings } from '../../../../state/settings.js';
import { categorizeLearningVerb } from '../../../../lib/data/learningIrregularFamilies.js';
import { DIFFICULTY_LEVELS, IRREGULAR_FAMILY_CONFIG } from '../utils/constants.js';
import { createLogger } from '../../../../lib/utils/logger.js';

const logger = createLogger('ConjugationExercise');

/**
 * Componente de ejercicio de conjugación mejorado
 */
function ConjugationExercise({
  exercise,
  onResult,
  onContinue,
  showHints,
  feedbackMessage
}) {
  // Estado del ejercicio
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPattern, setShowPattern] = useState(false);
  const [showAccentKeys, setShowAccentKeys] = useState(false);
  const [startTime] = useState(Date.now());

  // Referencias
  const inputRef = useRef(null);

  // Hooks
  const settings = useSettings();

  // Obtener datos del verbo y forma específica
  const { verb, person, difficulty, showRoot, showPattern: configShowPattern } = exercise.config;
  const verbForms = getVerbForms(verb, exercise);
  const currentForm = verbForms?.find(f => f.person === person);
  const correctAnswer = currentForm?.value || '';

  // Configurar patrones e irregularidades
  const irregularAnalysis = React.useMemo(() => {
    if (verb?.irregularFamilies?.length > 0) {
      return analyzeIrregularPatterns(verb, verbForms, exercise);
    }
    return null;
  }, [verb, verbForms, exercise]);

  // Efectos
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setShowPattern(configShowPattern && difficulty <= DIFFICULTY_LEVELS.INTERMEDIATE);
  }, [configShowPattern, difficulty]);

  /**
   * Maneja el envío de la respuesta
   */
  const handleSubmit = () => {
    if (isSubmitted || !userAnswer.trim()) return;

    const responseTime = Date.now() - startTime;

    // Evaluar respuesta con el grader sofisticado
    const gradeResult = grade(userAnswer.trim(), {
      value: correctAnswer,
      alt: currentForm?.alt || [],
      accepts: currentForm?.accepts || {}
    });

    // Generar feedback específico
    const feedback = generateSpecificFeedback(gradeResult, irregularAnalysis);

    // Crear resultado completo
    const result = {
      correct: gradeResult.correct,
      userAnswer: userAnswer.trim(),
      correctAnswer,
      responseTime,
      feedback,
      confidence: calculateConfidence(gradeResult, responseTime),
      errorTags: gradeResult.errorTags || [],
      exerciseType: 'conjugation',
      verbPattern: irregularAnalysis?.primaryPattern || 'regular'
    };

    setIsSubmitted(true);
    onResult(result);

    logger.debug('Conjugation exercise completed:', {
      verb: verb.lemma,
      person,
      correct: result.correct,
      pattern: result.verbPattern
    });
  };

  /**
   * Maneja la continuación al siguiente ejercicio
   */
  const handleContinueClick = () => {
    setUserAnswer('');
    setIsSubmitted(false);
    onContinue();
  };

  /**
   * Maneja las teclas de acceso rápido
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitted) {
        handleSubmit();
      } else {
        handleContinueClick();
      }
    }
  };

  /**
   * Obtiene formas verbales para el ejercicio
   */
  function getVerbForms(verb, exercise) {
    if (!verb?.paradigms) return [];

    const tense = exercise.stage?.tense || exercise.config?.tense;
    const mood = exercise.stage?.mood || exercise.config?.mood;

    const paradigm = verb.paradigms.find(p =>
      p.forms?.some(f => f.mood === mood && f.tense === tense)
    );

    return paradigm?.forms?.filter(f => f.mood === mood && f.tense === tense) || [];
  }

  /**
   * Analiza patrones irregulares del verbo
   */
  function analyzeIrregularPatterns(verb, forms, exercise) {
    const families = categorizeLearningVerb(verb.lemma, verb);
    const primaryPattern = families[0];

    if (!primaryPattern || !IRREGULAR_FAMILY_CONFIG[primaryPattern]) {
      return null;
    }

    const familyConfig = IRREGULAR_FAMILY_CONFIG[primaryPattern];
    const analysis = {
      primaryPattern,
      familyConfig,
      affectedPersons: familyConfig.focusPersons || [],
      description: familyConfig.description,
      examples: familyConfig.commonExamples || []
    };

    return analysis;
  }

  /**
   * Genera feedback específico basado en el patrón del verbo
   */
  function generateSpecificFeedback(gradeResult, analysis) {
    if (gradeResult.correct) {
      if (analysis) {
        return `¡Perfecto! Aplicaste correctamente el patrón ${analysis.familyConfig.name}.`;
      }
      return '¡Correcto!';
    }

    // Feedback para errores
    let feedback = `La forma correcta es "${correctAnswer}".`;

    if (analysis && analysis.affectedPersons.includes(person)) {
      feedback += ` Recuerda: ${analysis.description}.`;
    }

    return feedback;
  }

  /**
   * Calcula nivel de confianza de la respuesta
   */
  function calculateConfidence(gradeResult, responseTime) {
    let confidence = gradeResult.correct ? 0.8 : 0.2;

    // Ajustar por tiempo de respuesta
    if (responseTime < 5000) confidence += 0.1;
    if (responseTime > 20000) confidence -= 0.2;

    // Ajustar por tipo de error
    if (!gradeResult.correct && gradeResult.errorTags?.includes('accent_error')) {
      confidence += 0.3; // Error solo de acentos es menos grave
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Obtiene información del pronombre
   */
  function getPersonDisplay(personCode) {
    const pronouns = {
      '1s': 'yo',
      '2s_tu': 'tú',
      '2s_vos': 'vos',
      '3s': 'él/ella/usted',
      '1p': 'nosotros/nosotras',
      '2p_vosotros': 'vosotros/vosotras',
      '3p': 'ellos/ellas/ustedes'
    };
    return pronouns[personCode] || personCode;
  }

  /**
   * Maneja la inserción de caracteres especiales
   */
  const insertSpecialChar = (char) => {
    setUserAnswer(prev => prev + char);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  /**
   * Maneja la pronunciación
   */
  const handleSpeak = () => {
    if (!correctAnswer || typeof window === 'undefined' || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(correctAnswer);
    utter.lang = settings?.region === 'rioplatense' ? 'es-AR' : 'es-ES';
    utter.rate = 0.9;

    synth.cancel();
    synth.speak(utter);
  };

  // Caracteres especiales para el teclado de acentos
  const specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'];

  return (
    <div className="conjugation-exercise">
      {/* Información del verbo y contexto */}
      <div className="exercise-context">
        <div className="verb-info">
          <h3 className="verb-lemma">{verb.lemma}</h3>
          {irregularAnalysis && showPattern && (
            <div className="pattern-hint">
              <span className="pattern-label">{irregularAnalysis.familyConfig.name}</span>
              <span className="pattern-description">{irregularAnalysis.description}</span>
            </div>
          )}
        </div>

        <div className="person-display">
          {getPersonDisplay(person)}
        </div>
      </div>

      {/* Área de input */}
      <div className="input-section">
        <div className="conjugation-input-container">
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitted}
            placeholder="Escribe la conjugación..."
            className={`conjugation-input ${
              isSubmitted ? (feedbackMessage?.type === 'success' ? 'correct' : 'incorrect') : ''
            }`}
            autoComplete="off"
            autoFocus
          />

          {/* Ayudas visuales */}
          {showRoot && !isSubmitted && (
            <div className="root-hint">
              Raíz: {verb.lemma.slice(0, -2)}
            </div>
          )}
        </div>

        {/* Teclado de acentos */}
        {showAccentKeys && (
          <div className="accent-keypad">
            {specialChars.map(char => (
              <button
                key={char}
                type="button"
                className="accent-key"
                onClick={() => insertSpecialChar(char)}
                tabIndex={-1}
              >
                {char}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Feedback y resultados */}
      {feedbackMessage && (
        <div className={`feedback-section ${feedbackMessage.type}`}>
          <div className="feedback-content">
            <div className="feedback-message">
              {feedbackMessage.message}
            </div>
            {feedbackMessage.details && (
              <div className="feedback-details">
                {feedbackMessage.details}
              </div>
            )}
          </div>

          {isSubmitted && (
            <button
              type="button"
              className="tts-button"
              onClick={handleSpeak}
              title="Pronunciar forma correcta"
            >
              🔊
            </button>
          )}
        </div>
      )}

      {/* Controles del ejercicio */}
      <div className="exercise-controls">
        {/* Botón de ayuda con acentos */}
        <button
          type="button"
          className="helper-button accent-toggle"
          onClick={() => setShowAccentKeys(!showAccentKeys)}
          title="Mostrar/ocultar teclado de acentos"
        >
          ñ
        </button>

        {/* Botón de patrón */}
        {irregularAnalysis && difficulty <= DIFFICULTY_LEVELS.INTERMEDIATE && (
          <button
            type="button"
            className="helper-button pattern-toggle"
            onClick={() => setShowPattern(!showPattern)}
            title="Mostrar/ocultar patrón irregular"
          >
            💡
          </button>
        )}

        {/* Botón principal de acción */}
        <button
          type="button"
          className="primary-button"
          onClick={isSubmitted ? handleContinueClick : handleSubmit}
          disabled={!isSubmitted && !userAnswer.trim()}
        >
          {isSubmitted ? 'Continuar' : 'Comprobar'}
        </button>
      </div>

      {/* Información adicional para debuging en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{ fontSize: '0.8em', color: '#666', marginTop: '1rem' }}>
          <details>
            <summary>Debug Info</summary>
            <div>Correct Answer: {correctAnswer}</div>
            <div>Difficulty: {difficulty}</div>
            <div>Pattern: {irregularAnalysis?.primaryPattern || 'regular'}</div>
          </details>
        </div>
      )}
    </div>
  );
}

export default ConjugationExercise;