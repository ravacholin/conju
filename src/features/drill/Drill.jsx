import { useState, useEffect, useRef } from 'react';
import { grade } from '../../lib/core/grader.js';
// Removed unused imports to satisfy lint
import { useProgressTracking } from './useProgressTracking.js';
import MasteryIndicator from './MasteryIndicator.jsx';
import FeedbackNotification from './FeedbackNotification.jsx';
import './progress-feedback.css';
import Diff from './Diff.jsx';

export default function Drill({ 
  currentItem, 
  onResult, 
  onContinue
}) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed unused hint state
  const [showDiff, setShowDiff] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const inputRef = useRef(null);

  const { handleResult } = useProgressTracking(currentItem, onResult);

  const getCanonicalTarget = () => {
    // ... (same as before)
  };

  useEffect(() => {
    setInput('');
    setResult(null);
    setShowDiff(false);
    setShowAnimation(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    const timer = setTimeout(() => setShowAnimation(false), 500);
    return () => clearTimeout(timer);
  }, [currentItem]);

  const handleShowAnswer = () => {
    const correctForm = getCanonicalTarget();
    const resultObj = {
      correct: false,
      isAccentError: false,
      targets: [correctForm?.value || currentItem.form.value],
      note: `La forma correcta es "${correctForm?.value || currentItem.form.value}"`,
      accepted: null,
      hintsUsed: 0,
      errorTags: ['idk']
    };
    setResult(resultObj);
    handleResult(resultObj);
    setShowDiff(false);
  };

  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setShowDiff(false);

    const canonicalForm = getCanonicalTarget();
    const gradeResult = grade(input.trim(), canonicalForm, currentItem.settings || {});

    if (!gradeResult.correct) {
      setShowDiff(true);
    }

    const extendedResult = {
      ...gradeResult,
      userAnswer: input.trim(),
      correctAnswer: canonicalForm?.value || currentItem?.form?.value,
    };

    setResult(extendedResult);
    handleResult(extendedResult);
    setIsSubmitting(false);
  };

  const handleContinue = () => {
    onContinue();
  };

  const getPersonText = () => {
    // ... (same as before)
  };

  const getContextText = () => {
    // ... (same as before)
  };

  return (
    <div className={`drill-container ${showAnimation ? 'fade-in' : ''}`}>
      <div className="verb-lemma">
        {currentItem?.lemma}
      </div>
      <div className="conjugation-context">
        {getContextText()}
      </div>
      <div className="person-display">
        {getPersonText()}
      </div>
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          className={`conjugation-input ${result ? (result.correct ? 'correct' : 'incorrect') : ''}`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              // Cmd/Ctrl+Enter: mostrar respuesta (o continuar si ya hay resultado)
              e.preventDefault();
              if (!result) {
                handleShowAnswer();
              } else {
                handleContinue();
              }
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!result) {
                handleSubmit();
              } else {
                handleContinue();
              }
              return;
            }
            if (e.key === 'Escape') {
              // Esc: limpiar o continuar
              e.preventDefault();
              if (!result) {
                setInput('');
              } else {
                handleContinue();
              }
              return;
            }
            if (!result && (e.key === 'd' || e.key === 'D')) {
              // Toggle de diff solo cuando ya hay resultado incorrecto
              if (result && !result.correct) {
                setShowDiff((v) => !v);
              }
            }
          }}
          placeholder="Escribe la conjugación..."
          readOnly={result !== null}
          autoFocus
        />
      </div>

      {/* Atajos de teclado para eficiencia */}
      <div className="shortcut-hint" aria-hidden>
        <span>Enter: Verificar/Continuar</span>
        <span>·</span>
        <span>Cmd/Ctrl+Enter: No sé</span>
        <span>·</span>
        <span>Esc: Limpiar/Continuar</span>
        {result && !result.correct && <><span>·</span><span>D: Ver diferencias</span></>}
      </div>

      <div className="action-buttons">
        {!result ? (
          <>
            <button 
              className="btn" 
              onClick={handleSubmit}
              disabled={isSubmitting || !input.trim()}
            >
              {isSubmitting ? 'Verificando...' : 'Verificar'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={handleShowAnswer}
              disabled={isSubmitting}
            >
              No sé
            </button>
          </>
        ) : (
          <button className="btn" onClick={handleContinue}>
            Continuar
          </button>
        )}
      </div>

      {result && (
        <div className={`result ${result.correct ? 'correct' : 'incorrect'} slide-in`}>
          <p>{result.note}</p>
          {showDiff && !result.correct && (
            <Diff string1={input} string2={result.targets[0]} />
          )}
        </div>
      )}
    </div>
  );
} 
