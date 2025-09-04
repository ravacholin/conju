import React, { useState, useEffect } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import SessionSummary from './SessionSummary.jsx';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';
import './LearningDrill.css';

function LearningDrill({ eligibleForms, duration, onBack, onFinish, onPhaseComplete }) {
  const [currentItem, setCurrentItem] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState('idle'); // idle | correct | incorrect
  const [sessionState, setSessionState] = useState('active'); // active | finished
  const [correctStreak, setCorrectStreak] = useState(0);

  // Timer effect
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        console.log('Session finished!');
        setSessionState('finished');
      }, duration * 60 * 1000);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const generateNextItem = React.useCallback(() => {
    if (!eligibleForms || eligibleForms.length === 0) {
      setCurrentItem(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * eligibleForms.length);
    setCurrentItem(eligibleForms[randomIndex]);
    setInputValue('');
    setResult('idle');
  }, [eligibleForms]);

  useEffect(() => {
    generateNextItem();
  }, [generateNextItem]);

  const handleCheckAnswer = async () => {
    if (!currentItem) return;

    const correctAnswer = currentItem.value;
    const altAnswers = currentItem.alt || [];
    const userAnswer = inputValue.trim().toLowerCase();
    const isCorrect = userAnswer === correctAnswer.toLowerCase() || altAnswers.map(a => a.toLowerCase()).includes(userAnswer);

    if (isCorrect) {
      setResult('correct');
      setCorrectStreak(prev => prev + 1);
    } else {
      setResult('incorrect');
      setCorrectStreak(0); // Reset streak on incorrect answer
    }

    // --- Analytics Integration ---
    try {
      const userId = getCurrentUserId();
      if (userId) {
        await updateSchedule(userId, {
          mood: currentItem.mood,
          tense: currentItem.tense,
          person: currentItem.person
        }, isCorrect, 0); // 0 hints used for now
        console.log(`Analytics: Updated schedule for ${currentItem.lemma} - ${isCorrect ? 'correct' : 'incorrect'}`);
      }
    } catch (error) {
      console.error("Failed to update SRS schedule:", error);
    }
  };

  const handleContinue = () => {
    if (correctStreak >= 5) {
      onPhaseComplete();
    } else {
      generateNextItem();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (result === 'idle') {
        handleCheckAnswer();
      } else {
        handleContinue();
      }
    }
  };

  if (!eligibleForms || eligibleForms.length === 0) {
    return (
      <div className="App">
        <div className="main-content">
          <div className="drill-container learning-drill">
            <div className="drill-header">
              <button onClick={onBack} className="back-to-menu-btn">
                <img src="/back.png" alt="Volver" className="back-icon" />
                Volver
              </button>
              <h2>Sin ejercicios disponibles</h2>
            </div>
            <div className="center-column">
              <p>No hay ejercicios disponibles para este tiempo verbal.</p>
              <p>Intenta seleccionar un tiempo diferente o verifica la configuración.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionState === 'finished') {
    return <SessionSummary onFinish={onFinish} />;
  }

  const tenseName = TENSE_LABELS[eligibleForms[0].tense] || eligibleForms[0].tense;

  return (
    <div className="App">
      <div className="main-content">
        <div className="drill-container learning-drill">
          <div className="drill-header">
            <button onClick={onBack} className="back-to-menu-btn">
              <img src="/back.png" alt="Volver" className="back-icon" />
              Volver
            </button>
            <h2>Practicando: {tenseName}</h2>
          </div>

          {currentItem ? (
            <>
              <div className="verb-lemma">{currentItem.lemma}</div>
              <div className="person-display">{currentItem.person}</div>
              
              <div className="input-container">
                <input 
                  type="text" 
                  className={`conjugation-input ${result}`}
                  placeholder="Escribe la conjugación..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={result !== 'idle'}
                  autoFocus
                />
              </div>
              
              {result !== 'idle' && (
                <div className={`result ${result}`}>
                  {result === 'correct' ? '¡Correcto!' : `La respuesta correcta es: ${currentItem.value}`}
                </div>
              )}
              
              <div className="action-buttons">
                {result === 'idle' ? (
                  <button className="btn" onClick={handleCheckAnswer}>
                    Revisar Respuesta
                  </button>
                ) : (
                  <button className="btn" onClick={handleContinue}>
                    Continuar
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="loading">No hay ejercicios disponibles para este tiempo verbal.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningDrill;
