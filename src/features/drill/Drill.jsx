import { useState, useEffect, useRef } from 'react';
import { grade } from '../../lib/core/grader.js';
// Removed unused imports to satisfy lint
import { useProgressTracking } from './useProgressTracking.js';
import MasteryIndicator from './MasteryIndicator.jsx';
import FeedbackNotification from './FeedbackNotification.jsx';
import './progress-feedback.css';
import Diff from './Diff.jsx';
import { useSettings } from '../../state/settings.js';

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
  const settings = useSettings();
  const [remainingTime, setRemainingTime] = useState(0);

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

  // Resistance mode timer
  useEffect(() => {
    if (!settings.resistanceActive) {
      setRemainingTime(0);
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - settings.resistanceStartTs;
      const remaining = Math.max(0, settings.resistanceMsLeft - elapsed);
      setRemainingTime(remaining);
      
      if (remaining <= 0) {
        // Time's up! Force incorrect result
        console.log('⏰ Tiempo agotado en modo supervivencia');
        handleResult(false); // Mark as incorrect
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [settings.resistanceActive, settings.resistanceStartTs, settings.resistanceMsLeft, handleResult]);


  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setShowDiff(false);

    const canonicalForm = getCanonicalTarget();
    let gradeResult;
    let correctAnswer;

    if (settings.reverseActive) {
      // In reverse mode, check if user entered the correct infinitive
      correctAnswer = currentItem?.lemma;
      gradeResult = grade(input.trim(), correctAnswer, currentItem.settings || {});
    } else if (settings.doubleActive) {
      // In double mode, for now just check the main form (can be enhanced later)
      correctAnswer = canonicalForm?.value || currentItem?.form?.value;
      gradeResult = grade(input.trim(), canonicalForm, currentItem.settings || {});
    } else {
      // Normal mode
      correctAnswer = canonicalForm?.value || currentItem?.form?.value;
      gradeResult = grade(input.trim(), canonicalForm, currentItem.settings || {});
    }

    if (!gradeResult.correct) {
      setShowDiff(true);
    }

    const extendedResult = {
      ...gradeResult,
      userAnswer: input.trim(),
      correctAnswer: correctAnswer,
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

  // Format remaining time for display
  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  // Get display content based on active mode
  const getDisplayContent = () => {
    if (!currentItem) return { lemma: '', context: '', person: '', placeholder: '' }
    
    if (settings.reverseActive) {
      // Reverse mode: show conjugation, ask for infinitive
      return {
        lemma: currentItem.value, // Show the conjugated form
        context: `${getContextText()} - ¿Cuál es el infinitivo?`,
        person: getPersonText(),
        placeholder: 'Escribe el infinitivo...'
      }
    } else if (settings.doubleActive) {
      // Double mode: show two forms (simplified for now)
      return {
        lemma: currentItem.lemma,
        context: `${getContextText()} (Modo Doble)`,
        person: `${getPersonText()} + otra forma`,
        placeholder: 'Escribe ambas conjugaciones...'
      }
    } else {
      // Normal mode
      return {
        lemma: currentItem.lemma,
        context: getContextText(),
        person: getPersonText(),
        placeholder: 'Escribe la conjugación...'
      }
    }
  }

  const displayContent = getDisplayContent()

  return (
    <div className={`drill-container ${showAnimation ? 'fade-in' : ''}`}>
      {/* Game mode indicators */}
      {settings.resistanceActive && remainingTime > 0 && (
        <div className="resistance-timer" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: remainingTime < 5000 ? '#ff4444' : '#ff8800',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 1000,
          animation: remainingTime < 5000 ? 'pulse 0.5s infinite' : 'none'
        }}>
          🧟 {formatTime(remainingTime)}
        </div>
      )}
      
      {settings.reverseActive && (
        <div className="game-mode-indicator" style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: '#4CAF50',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 1000
        }}>
          🔄 Modo Reverso
        </div>
      )}
      
      {settings.doubleActive && (
        <div className="game-mode-indicator" style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: '#2196F3',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          zIndex: 1000
        }}>
          👥 Modo Doble
        </div>
      )}

      <div className="verb-lemma">
        {displayContent.lemma}
      </div>
      <div className="conjugation-context">
        {displayContent.context}
      </div>
      <div className="person-display">
        {displayContent.person}
      </div>
      <div className="input-container">
        <input
          ref={inputRef}
          type="text"
          className={`conjugation-input ${result ? (result.correct ? 'correct' : 'incorrect') : ''}`}
          value={input}
          placeholder={displayContent.placeholder}
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
