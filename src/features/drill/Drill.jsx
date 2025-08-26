import { useState, useEffect, useRef } from 'react';
import { grade } from '../../lib/core/grader.js';
import { getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js';
import { useSettings } from '../../state/settings.js';
import { useProgressTracking } from './useProgressTracking.js';
import { classifyError } from './tracking.js';
import MasteryIndicator from './MasteryIndicator.jsx';
import FeedbackNotification from './FeedbackNotification.jsx';
import './progress-feedback.css';
import { FlowIndicator } from '../progress/FlowIndicator.jsx';
import orchestrator from '../../lib/progress/progressOrchestrator.js';
import { verbs } from '../../data/verbs.js';
import Diff from './Diff.jsx';

export default function Drill({ 
  currentItem, 
  onResult, 
  onContinue,
  showChallenges = false,
  showAccentKeys = true
}) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hint, setHint] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const inputRef = useRef(null);

  const { handleResult, handleHintShown } = useProgressTracking(currentItem, onResult);

  const getCanonicalTarget = (item) => {
    // ... (same as before)
  };

  useEffect(() => {
    setInput('');
    setResult(null);
    setHint('');
    setShowDiff(false);
    setShowAnimation(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    const timer = setTimeout(() => setShowAnimation(false), 500);
    return () => clearTimeout(timer);
  }, [currentItem]);

  const handleShowAnswer = () => {
    const correctForm = getCanonicalTarget(currentItem);
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

    const canonicalForm = getCanonicalTarget(currentItem);
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

  const getPersonText = (formObj = currentItem) => {
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
            if (e.key === 'Enter') {
              e.preventDefault();
              if (!result) {
                handleSubmit();
              } else {
                handleContinue();
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
