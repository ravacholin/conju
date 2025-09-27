/**
 * ContextualExercise.jsx - Ejercicio de conjugación con contexto
 *
 * Ejercicio que presenta verbos en situaciones contextuales breves,
 * ayudando al usuario a entender el uso práctico de las conjugaciones.
 */

import React, { useState, useEffect, useRef } from 'react';
import { grade } from '../../../../lib/core/grader.js';
import { useSettings } from '../../../../state/settings.js';
import { CONTEXT_TEMPLATES, DIFFICULTY_LEVELS } from '../utils/constants.js';
import { createLogger } from '../../../../lib/utils/logger.js';

const logger = createLogger('ContextualExercise');

/**
 * Componente de ejercicio contextual
 */
function ContextualExercise({
  exercise,
  onResult,
  onContinue,
  showHints,
  feedbackMessage
}) {
  // Estado del ejercicio
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showAccentKeys, setShowAccentKeys] = useState(false);
  const [startTime] = useState(Date.now());

  // Referencias
  const inputRef = useRef(null);

  // Hooks
  const settings = useSettings();

  // Obtener configuración del ejercicio
  const { verb, person, context, showMeaning: configShowMeaning, difficulty } = exercise.config;

  // Generar contexto y obtener respuesta correcta
  const contextSentence = React.useMemo(() => {
    return generateContextSentence(context, verb, person);
  }, [context, verb, person]);

  const correctAnswer = React.useMemo(() => {
    return getCorrectForm(verb, person, exercise);
  }, [verb, person, exercise]);

  const verbMeaning = React.useMemo(() => {
    return getVerbMeaning(verb);
  }, [verb]);

  // Efectos
  useEffect(() => {
    inputRef.current?.focus();
    setShowMeaning(configShowMeaning || difficulty === DIFFICULTY_LEVELS.EASY);
  }, [configShowMeaning, difficulty]);

  /**
   * Genera la oración contextual con el espacio en blanco
   */
  function generateContextSentence(context, verb, person) {
    if (!context) {
      // Generar contexto automático basado en la persona
      return generateAutomaticContext(verb, person);
    }

    // Usar contexto proporcionado
    return context.replace('___', '___ (' + verb.lemma + ')');
  }

  /**
   * Genera contexto automático basado en el verbo y persona
   */
  function generateAutomaticContext(verb, person) {
    const contexts = {
      '1s': [
        `Todos los días yo ___ (${verb.lemma})`,
        `En este momento yo ___ (${verb.lemma})`,
        `Generalmente yo ___ (${verb.lemma})`
      ],
      '2s_tu': [
        `¿Tú ___ (${verb.lemma}) frecuentemente?`,
        `Cuando tú ___ (${verb.lemma})...`,
        `Tú siempre ___ (${verb.lemma})`
      ],
      '2s_vos': [
        `¿Vos ___ (${verb.lemma}) seguido?`,
        `Cuando vos ___ (${verb.lemma})...`,
        `Vos siempre ___ (${verb.lemma})`
      ],
      '3s': [
        `Mi amigo ___ (${verb.lemma}) cada día`,
        `Ella ___ (${verb.lemma}) muy bien`,
        `Él nunca ___ (${verb.lemma})`
      ],
      '1p': [
        `Nosotros ___ (${verb.lemma}) juntos`,
        `En familia nosotros ___ (${verb.lemma})`,
        `Los fines de semana nosotros ___ (${verb.lemma})`
      ],
      '2p_vosotros': [
        `¿Vosotros ___ (${verb.lemma}) en grupo?`,
        `Cuando vosotros ___ (${verb.lemma})...`,
        `Vosotros nunca ___ (${verb.lemma})`
      ],
      '3p': [
        `Mis amigos ___ (${verb.lemma}) mucho`,
        `Ellos ___ (${verb.lemma}) los domingos`,
        `En vacaciones ellos ___ (${verb.lemma})`
      ]
    };

    const personContexts = contexts[person] || contexts['3s'];
    return personContexts[Math.floor(Math.random() * personContexts.length)];
  }

  /**
   * Obtiene la forma correcta del verbo
   */
  function getCorrectForm(verb, person, exercise) {
    const verbForms = getVerbForms(verb, exercise);
    const form = verbForms?.find(f => f.person === person);
    return form?.value || '';
  }

  /**
   * Obtiene formas verbales
   */
  function getVerbForms(verb, exercise) {
    if (!verb?.paradigms) return [];

    // Obtener tiempo y modo del ejercicio o configuración por defecto
    const tense = exercise.stage?.tense || 'pres';
    const mood = exercise.stage?.mood || 'indicative';

    const paradigm = verb.paradigms.find(p =>
      p.forms?.some(f => f.mood === mood && f.tense === tense)
    );

    return paradigm?.forms?.filter(f => f.mood === mood && f.tense === tense) || [];
  }

  /**
   * Obtiene el significado del verbo
   */
  function getVerbMeaning(verb) {
    // En implementación real, obtener de base de datos de significados
    const meanings = {
      'hablar': 'to speak, to talk',
      'comer': 'to eat',
      'vivir': 'to live',
      'estudiar': 'to study',
      'trabajar': 'to work',
      'caminar': 'to walk',
      'pensar': 'to think',
      'dormir': 'to sleep',
      'jugar': 'to play',
      'leer': 'to read'
    };

    return meanings[verb.lemma] || `(${verb.lemma})`;
  }

  /**
   * Maneja el envío de la respuesta
   */
  const handleSubmit = () => {
    if (isSubmitted || !userAnswer.trim()) return;

    const responseTime = Date.now() - startTime;

    // Evaluar respuesta
    const gradeResult = grade(userAnswer.trim(), {
      value: correctAnswer,
      alt: [], // Los ejercicios contextuales son más estrictos
      accepts: {}
    });

    // Generar feedback contextual
    const feedback = generateContextualFeedback(gradeResult, contextSentence);

    // Crear resultado
    const result = {
      correct: gradeResult.correct,
      userAnswer: userAnswer.trim(),
      correctAnswer,
      responseTime,
      feedback,
      confidence: calculateConfidence(gradeResult, responseTime),
      errorTags: gradeResult.errorTags || [],
      exerciseType: 'contextual',
      context: contextSentence
    };

    setIsSubmitted(true);
    onResult(result);

    logger.debug('Contextual exercise completed:', {
      verb: verb.lemma,
      person,
      correct: result.correct,
      context: contextSentence.substring(0, 50) + '...'
    });
  };

  /**
   * Genera feedback específico para ejercicios contextuales
   */
  function generateContextualFeedback(gradeResult, context) {
    if (gradeResult.correct) {
      return '¡Excelente! La conjugación es correcta en este contexto.';
    }

    let feedback = `En este contexto, la forma correcta es "${correctAnswer}".`;

    // Agregar explicación contextual
    const personExplanation = getPersonContextExplanation(person);
    if (personExplanation) {
      feedback += ` ${personExplanation}`;
    }

    return feedback;
  }

  /**
   * Obtiene explicación específica por persona
   */
  function getPersonContextExplanation(person) {
    const explanations = {
      '1s': 'Recuerda que "yo" requiere la forma de primera persona singular.',
      '2s_tu': 'Para "tú" usa la forma de segunda persona singular.',
      '2s_vos': 'Con "vos" usa la forma específica de voseo.',
      '3s': 'Para tercera persona singular (él/ella/usted).',
      '1p': 'Con "nosotros" usa la forma de primera persona plural.',
      '2p_vosotros': 'Para "vosotros" usa la forma de segunda persona plural.',
      '3p': 'Para tercera persona plural (ellos/ellas/ustedes).'
    };

    return explanations[person] || '';
  }

  /**
   * Calcula nivel de confianza
   */
  function calculateConfidence(gradeResult, responseTime) {
    let confidence = gradeResult.correct ? 0.9 : 0.3;

    // Ajustar por tiempo (ejercicios contextuales pueden tomar más tiempo)
    if (responseTime < 8000) confidence += 0.1;
    if (responseTime > 30000) confidence -= 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Maneja la continuación
   */
  const handleContinueClick = () => {
    setUserAnswer('');
    setIsSubmitted(false);
    onContinue();
  };

  /**
   * Maneja las teclas
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
   * Maneja caracteres especiales
   */
  const insertSpecialChar = (char) => {
    setUserAnswer(prev => prev + char);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  /**
   * Maneja pronunciación
   */
  const handleSpeak = () => {
    if (!correctAnswer) return;

    try {
      const synth = window.speechSynthesis;
      const fullSentence = contextSentence.replace('___', '').replace(`(${verb.lemma})`, correctAnswer);
      const utter = new SpeechSynthesisUtterance(fullSentence);
      utter.lang = settings?.region === 'rioplatense' ? 'es-AR' : 'es-ES';
      utter.rate = 0.8; // Más lento para contexto

      synth.cancel();
      synth.speak(utter);
    } catch (error) {
      logger.warn('TTS not available:', error);
    }
  };

  // Caracteres especiales
  const specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'];

  return (
    <div className="contextual-exercise">
      {/* Contexto y situación */}
      <div className="exercise-context">
        <div className="context-scenario">
          <h3>Completa la oración:</h3>
          <div className="context-sentence">
            {contextSentence.split('___').map((part, index) => (
              <React.Fragment key={index}>
                {part}
                {index === 0 && (
                  <span className="blank-space">
                    {isSubmitted ? (
                      <span className={feedbackMessage?.type === 'success' ? 'correct-answer' : 'user-answer'}>
                        {userAnswer || correctAnswer}
                      </span>
                    ) : (
                      <span className="input-placeholder">___</span>
                    )}
                  </span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Ayuda con significado */}
        {showMeaning && (
          <div className="verb-meaning">
            <strong>{verb.lemma}</strong>: {verbMeaning}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="input-section">
        <div className="conjugation-input-container">
          <label htmlFor="contextual-input" className="input-label">
            Tu respuesta:
          </label>
          <input
            id="contextual-input"
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitted}
            placeholder={`Conjugación de "${verb.lemma}"`}
            className={`conjugation-input ${
              isSubmitted ? (feedbackMessage?.type === 'success' ? 'correct' : 'incorrect') : ''
            }`}
            autoComplete="off"
            autoFocus
          />
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

      {/* Feedback */}
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
              title="Escuchar oración completa"
            >
              🔊 Escuchar
            </button>
          )}
        </div>
      )}

      {/* Controles */}
      <div className="exercise-controls">
        {/* Ayudas */}
        <button
          type="button"
          className="helper-button accent-toggle"
          onClick={() => setShowAccentKeys(!showAccentKeys)}
          title="Teclado de acentos"
        >
          ñ
        </button>

        {difficulty === DIFFICULTY_LEVELS.EASY && (
          <button
            type="button"
            className="helper-button meaning-toggle"
            onClick={() => setShowMeaning(!showMeaning)}
            title="Mostrar/ocultar significado"
          >
            📖
          </button>
        )}

        {/* Botón principal */}
        <button
          type="button"
          className="primary-button"
          onClick={isSubmitted ? handleContinueClick : handleSubmit}
          disabled={!isSubmitted && !userAnswer.trim()}
        >
          {isSubmitted ? 'Continuar' : 'Comprobar'}
        </button>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{ fontSize: '0.8em', color: '#666', marginTop: '1rem' }}>
          <details>
            <summary>Debug Info</summary>
            <div>Correct Answer: {correctAnswer}</div>
            <div>Difficulty: {difficulty}</div>
            <div>Person: {person}</div>
            <div>Context: {contextSentence}</div>
          </details>
        </div>
      )}
    </div>
  );
}

export default ContextualExercise;