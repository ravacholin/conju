/**
 * SentenceBuilding.jsx - Ejercicio de construcción de oraciones
 *
 * Ejercicio avanzado donde el usuario construye oraciones completas
 * usando el verbo conjugado en el contexto apropiado.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../../../state/settings.js';
import { DIFFICULTY_LEVELS, CONTEXT_TEMPLATES } from '../utils/constants.js';
import { createLogger } from '../../../../lib/utils/logger.js';

const logger = createLogger('SentenceBuilding');

/**
 * Componente de construcción de oraciones
 */
function SentenceBuilding({
  exercise,
  onResult,
  onContinue,
  showHints,
  feedbackMessage
}) {
  // Estado del ejercicio
  const [userSentence, setUserSentence] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showWordBank, setShowWordBank] = useState(false);
  const [showAccentKeys, setShowAccentKeys] = useState(false);
  const [helpsUsed, setHelpsUsed] = useState(0);
  const [startTime] = useState(Date.now());

  // Referencias
  const textareaRef = useRef(null);

  // Hooks
  const settings = useSettings();

  // Configuración del ejercicio
  const {
    verb,
    sentence,
    requiredWords,
    minLength,
    allowedHelps,
    difficulty
  } = exercise.config;

  // Datos del ejercicio
  const sentencePrompt = React.useMemo(() => {
    return generateSentencePrompt(sentence, verb);
  }, [sentence, verb]);

  const wordBank = React.useMemo(() => {
    return generateWordBank(verb, difficulty);
  }, [verb, difficulty]);

  const correctForm = React.useMemo(() => {
    return getCorrectVerbForm(verb, exercise);
  }, [verb, exercise]);

  // Efectos
  useEffect(() => {
    textareaRef.current?.focus();
    setShowWordBank(difficulty === DIFFICULTY_LEVELS.EASY);
  }, [difficulty]);

  /**
   * Genera el prompt para la oración
   */
  function generateSentencePrompt(template, verb) {
    if (template) {
      return template.replace('___', `usando "${verb.lemma}"`);
    }

    // Generar prompt automático
    const prompts = [
      `Escribe una oración usando el verbo "${verb.lemma}"`,
      `Describe una situación donde usarías "${verb.lemma}"`,
      `Crea una oración completa con "${verb.lemma}"`
    ];

    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  /**
   * Genera banco de palabras de apoyo
   */
  function generateWordBank(verb, difficulty) {
    if (difficulty >= DIFFICULTY_LEVELS.ADVANCED) {
      return []; // Sin ayudas en niveles avanzados
    }

    const commonWords = [
      'siempre', 'nunca', 'todos', 'días', 'casa', 'trabajo',
      'amigos', 'familia', 'bien', 'mal', 'mucho', 'poco',
      'cuando', 'porque', 'después', 'antes', 'durante'
    ];

    // Agregar palabras específicas del verbo
    const verbSpecificWords = getVerbSpecificWords(verb.lemma);

    return [...verbSpecificWords, ...commonWords.slice(0, 10)];
  }

  /**
   * Obtiene palabras específicas para cada verbo
   */
  function getVerbSpecificWords(lemma) {
    const verbWords = {
      'comer': ['comida', 'restaurante', 'hambre', 'sabroso'],
      'estudiar': ['libros', 'escuela', 'examen', 'aprender'],
      'dormir': ['cama', 'noche', 'cansado', 'sueño'],
      'trabajar': ['oficina', 'empresa', 'dinero', 'jefe'],
      'caminar': ['parque', 'ejercicio', 'salud', 'paseo'],
      'hablar': ['teléfono', 'conversación', 'idioma', 'voz'],
      'vivir': ['ciudad', 'apartamento', 'feliz', 'vida']
    };

    return verbWords[lemma] || [];
  }

  /**
   * Obtiene la forma correcta del verbo
   */
  function getCorrectVerbForm(verb, exercise) {
    // En ejercicios de construcción, el usuario debe elegir la persona
    // Por simplicidad, usar tercera persona singular como sugerencia
    const verbForms = getVerbForms(verb, exercise);
    const form = verbForms?.find(f => f.person === '3s');
    return form?.value || verb.lemma;
  }

  /**
   * Obtiene formas verbales disponibles
   */
  function getVerbForms(verb, exercise) {
    if (!verb?.paradigms) return [];

    const tense = exercise.stage?.tense || 'pres';
    const mood = exercise.stage?.mood || 'indicative';

    const paradigm = verb.paradigms.find(p =>
      p.forms?.some(f => f.mood === mood && f.tense === tense)
    );

    return paradigm?.forms?.filter(f => f.mood === mood && f.tense === tense) || [];
  }

  /**
   * Evalúa la oración construida por el usuario
   */
  function evaluateSentence(sentence, verb) {
    const analysis = {
      containsVerb: false,
      verbForm: null,
      isConjugated: false,
      length: sentence.split(/\s+/).length,
      quality: 0,
      errors: [],
      suggestions: []
    };

    // Verificar que contiene el verbo
    const verbForms = getVerbForms(verb, exercise);
    const foundForm = verbForms.find(form =>
      sentence.toLowerCase().includes(form.value.toLowerCase())
    );

    if (foundForm) {
      analysis.containsVerb = true;
      analysis.verbForm = foundForm.value;
      analysis.isConjugated = true;
      analysis.quality += 0.4;
    } else if (sentence.toLowerCase().includes(verb.lemma.toLowerCase())) {
      analysis.containsVerb = true;
      analysis.verbForm = verb.lemma;
      analysis.errors.push('El verbo debe estar conjugado, no en infinitivo');
    } else {
      analysis.errors.push(`La oración debe incluir el verbo "${verb.lemma}"`);
    }

    // Verificar longitud mínima
    if (analysis.length >= (minLength || 5)) {
      analysis.quality += 0.2;
    } else {
      analysis.errors.push(`La oración debe tener al menos ${minLength || 5} palabras`);
    }

    // Evaluar coherencia básica
    if (hasBasicCoherence(sentence)) {
      analysis.quality += 0.2;
    } else {
      analysis.suggestions.push('Intenta hacer una oración más coherente');
    }

    // Evaluar gramática básica
    if (hasBasicGrammar(sentence)) {
      analysis.quality += 0.2;
    } else {
      analysis.suggestions.push('Revisa la gramática de la oración');
    }

    return analysis;
  }

  /**
   * Verifica coherencia básica de la oración
   */
  function hasBasicCoherence(sentence) {
    // Verificaciones básicas de coherencia
    const words = sentence.toLowerCase().split(/\s+/);

    // Debe tener al menos un sujeto implícito o explícito
    const hasSubject = words.some(word =>
      ['yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas'].includes(word) ||
      sentence.includes('el ') || sentence.includes('la ') || sentence.includes('mi ') ||
      sentence.includes('su ') || sentence.includes('nuestro')
    );

    // Debe parecer una oración (puntuación, orden básico)
    const hasBasicStructure = sentence.length > 10 &&
      (sentence.endsWith('.') || sentence.endsWith('!') || sentence.endsWith('?') ||
       !sentence.endsWith(' '));

    return hasSubject || hasBasicStructure;
  }

  /**
   * Verifica gramática básica
   */
  function hasBasicGrammar(sentence) {
    // Verificaciones muy básicas
    const hasCapitalization = sentence.charAt(0) === sentence.charAt(0).toUpperCase();
    const hasNoBadPatterns = !sentence.includes('  ') && // sin dobles espacios
      !sentence.match(/\b\w\b\s\b\w\b/) && // sin letras sueltas repetidas
      sentence.split(' ').length >= 3; // al menos 3 palabras

    return hasCapitalization && hasNoBadPatterns;
  }

  /**
   * Genera feedback específico para construcción de oraciones
   */
  function generateBuildingFeedback(analysis) {
    let feedback = '';

    if (analysis.quality >= 0.8) {
      feedback = '¡Excelente oración! Muy bien construida y con el verbo conjugado correctamente.';
    } else if (analysis.quality >= 0.6) {
      feedback = '¡Buen trabajo! Tu oración es correcta.';
    } else if (analysis.quality >= 0.4) {
      feedback = 'Bien, pero puede mejorar.';
    } else {
      feedback = 'Necesita trabajo. Revisa los errores.';
    }

    // Agregar errores específicos
    if (analysis.errors.length > 0) {
      feedback += ' ' + analysis.errors.join(' ');
    }

    // Agregar sugerencias
    if (analysis.suggestions.length > 0) {
      feedback += ' ' + analysis.suggestions.join(' ');
    }

    return feedback;
  }

  /**
   * Maneja el envío de la oración
   */
  const handleSubmit = () => {
    if (isSubmitted || !userSentence.trim()) return;

    const responseTime = Date.now() - startTime;
    const analysis = evaluateSentence(userSentence.trim(), verb);

    // Generar feedback
    const feedback = generateBuildingFeedback(analysis);

    // Crear resultado
    const result = {
      correct: analysis.quality >= 0.6, // 60% threshold for success
      userAnswer: userSentence.trim(),
      correctAnswer: `Ejemplo: "Yo ${correctForm} todos los días"`,
      responseTime,
      feedback,
      confidence: analysis.quality,
      errorTags: analysis.errors.map(e => 'sentence_building_error'),
      exerciseType: 'sentence_building',
      analysis,
      helpsUsed
    };

    setIsSubmitted(true);
    onResult(result);

    logger.debug('Sentence building completed:', {
      verb: verb.lemma,
      quality: analysis.quality,
      length: analysis.length,
      containsVerb: analysis.containsVerb
    });
  };

  /**
   * Maneja la continuación
   */
  const handleContinueClick = () => {
    setUserSentence('');
    setIsSubmitted(false);
    setHelpsUsed(0);
    onContinue();
  };

  /**
   * Maneja las teclas
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      if (!isSubmitted) {
        handleSubmit();
      } else {
        handleContinueClick();
      }
    }
  };

  /**
   * Inserta palabra del banco de palabras
   */
  const insertWord = (word) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = userSentence.slice(0, start) + word + ' ' + userSentence.slice(end);

    setUserSentence(newText);

    // Restaurar foco y posición del cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + word.length + 1, start + word.length + 1);
    }, 0);

    if (helpsUsed < allowedHelps) {
      setHelpsUsed(prev => prev + 1);
    }
  };

  /**
   * Maneja caracteres especiales
   */
  const insertSpecialChar = (char) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = userSentence.slice(0, start) + char + userSentence.slice(end);

    setUserSentence(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, start + 1);
    }, 0);
  };

  // Caracteres especiales
  const specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'];

  return (
    <div className="sentence-building-exercise">
      {/* Prompt del ejercicio */}
      <div className="exercise-prompt">
        <h3>{sentencePrompt}</h3>
        {difficulty <= DIFFICULTY_LEVELS.INTERMEDIATE && (
          <div className="exercise-hint">
            Sugerencia: Usa la forma conjugada de "{verb.lemma}", no el infinitivo
          </div>
        )}
      </div>

      {/* Área de escritura */}
      <div className="writing-section">
        <label htmlFor="sentence-textarea" className="writing-label">
          Tu oración:
        </label>
        <textarea
          id="sentence-textarea"
          ref={textareaRef}
          value={userSentence}
          onChange={(e) => setUserSentence(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitted}
          placeholder="Escribe una oración completa aquí..."
          className={`sentence-textarea ${
            isSubmitted ? (feedbackMessage?.type === 'success' ? 'correct' : 'needs-work') : ''
          }`}
          rows={4}
          autoFocus
        />

        {/* Contador de palabras */}
        <div className="word-counter">
          Palabras: {userSentence.trim().split(/\s+/).filter(w => w.length > 0).length}
          {minLength && ` (mínimo: ${minLength})`}
        </div>
      </div>

      {/* Banco de palabras */}
      {showWordBank && wordBank.length > 0 && (
        <div className="word-bank">
          <h4>Palabras que puedes usar:</h4>
          <div className="words-grid">
            {wordBank.map((word, index) => (
              <button
                key={index}
                type="button"
                className="word-button"
                onClick={() => insertWord(word)}
                disabled={isSubmitted || (allowedHelps > 0 && helpsUsed >= allowedHelps)}
              >
                {word}
              </button>
            ))}
          </div>
          {allowedHelps > 0 && (
            <div className="helps-counter">
              Ayudas usadas: {helpsUsed}/{allowedHelps}
            </div>
          )}
        </div>
      )}

      {/* Teclado de caracteres especiales */}
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
        </div>
      )}

      {/* Controles */}
      <div className="exercise-controls">
        {/* Ayudas */}
        <button
          type="button"
          className="helper-button accent-toggle"
          onClick={() => setShowAccentKeys(!showAccentKeys)}
          title="Caracteres especiales"
        >
          ñ¿¡
        </button>

        {difficulty <= DIFFICULTY_LEVELS.INTERMEDIATE && (
          <button
            type="button"
            className="helper-button wordbank-toggle"
            onClick={() => setShowWordBank(!showWordBank)}
            title="Banco de palabras"
          >
            📝
          </button>
        )}

        {/* Botón principal */}
        <button
          type="button"
          className="primary-button"
          onClick={isSubmitted ? handleContinueClick : handleSubmit}
          disabled={!isSubmitted && !userSentence.trim()}
        >
          {isSubmitted ? 'Continuar' : 'Enviar oración'}
        </button>
      </div>

      {/* Instrucciones adicionales */}
      {!isSubmitted && (
        <div className="exercise-instructions">
          <small>
            💡 Tip: Usa Ctrl+Enter para enviar tu oración
          </small>
        </div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={{ fontSize: '0.8em', color: '#666', marginTop: '1rem' }}>
          <details>
            <summary>Debug Info</summary>
            <div>Verb: {verb.lemma}</div>
            <div>Correct Form: {correctForm}</div>
            <div>Min Length: {minLength}</div>
            <div>Difficulty: {difficulty}</div>
          </details>
        </div>
      )}
    </div>
  );
}

export default SentenceBuilding;