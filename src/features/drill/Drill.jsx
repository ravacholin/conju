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
    if (!currentItem) return null;
    
    // For currentItem structure, return the item itself as it contains the canonical form
    return {
      value: currentItem.value || currentItem.form?.value || '',
      lemma: currentItem.lemma || '',
      mood: currentItem.mood || '',
      tense: currentItem.tense || '',
      person: currentItem.person || ''
    };
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
    if (!currentItem) return '';
    
    // Import labels locally to avoid issues
    const PERSON_LABELS = {
      '1s': 'yo',
      '2s_tu': 'tú', 
      '2s_vos': 'vos',
      '3s': 'él/ella',
      '1p': 'nosotros',
      '2p_vosotros': 'vosotros', 
      '3p': 'ellos'
    };
    
    return PERSON_LABELS[currentItem.person] || currentItem.person;
  };

  const getContextText = () => {
    if (!currentItem) return '';
    
    // Import labels locally to avoid issues
    const MOOD_LABELS = {
      'indicative': 'Indicativo',
      'subjunctive': 'Subjuntivo', 
      'imperative': 'Imperativo',
      'conditional': 'Condicional',
      'nonfinite': 'Formas no conjugadas'
    };
    
    const TENSE_LABELS = {
      'pres': 'Presente',
      'pretPerf': 'Pretérito perfecto',
      'pretIndef': 'Pretérito indefinido', 
      'impf': 'Imperfecto',
      'plusc': 'Pluscuamperfecto',
      'fut': 'Futuro',
      'futPerf': 'Futuro perfecto',
      'subjPres': 'Presente',
      'subjImpf': 'Imperfecto',
      'subjPerf': 'Perfecto',
      'subjPlusc': 'Pluscuamperfecto',
      'impAff': 'Afirmativo',
      'impNeg': 'Negativo', 
      'cond': 'Condicional',
      'condPerf': 'Condicional perfecto',
      'ger': 'Gerundio',
      'part': 'Participio'
    };
    
    const moodLabel = MOOD_LABELS[currentItem.mood] || currentItem.mood;
    const tenseLabel = TENSE_LABELS[currentItem.tense] || currentItem.tense;
    
    return `${moodLabel} - ${tenseLabel}`;
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
