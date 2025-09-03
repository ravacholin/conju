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

  const generateNextItem = () => {
    if (eligibleForms.length === 0) {
      setCurrentItem(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * eligibleForms.length);
    setCurrentItem(eligibleForms[randomIndex]);
    setInputValue('');
    setResult('idle');
  };

  useEffect(() => {
    generateNextItem();
  }, [eligibleForms]);

  const handleCheckAnswer = async () => {
    if (!currentItem) return;

    const correctAnswer = currentItem.value;
    const altAnswers = currentItem.alt || [];
    const userAnser = inputValue.trim().toLowerCase();
    const isCorrect = userAnser === correctAnswer.toLowerCase() || altAnswers.map(a => a.toLowerCase()).includes(userAnser);

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

  if (!eligibleForms || eligibleForms.length === 0) {
    return <div className="center-column">Generando ejercicios...</div>;
  }

  if (sessionState === 'finished') {
    return <SessionSummary onFinish={onFinish} />;
  }

  const tenseName = TENSE_LABELS[eligibleForms[0].tense] || eligibleForms[0].tense;

  return (
    <div className="App learn-flow">
      <div className="center-column">
        <div className="drill-header-learning">
          <button onClick={onBack} className="back-btn-drill">
            <img src="/back.png" alt="Volver" className="back-icon" />
          </button>
          <h2>Practicando: {tenseName}</h2>
        </div>

        {currentItem ? (
          <div className={`drill-card-learning ${result}`}>
            <div className="prompt">
              {currentItem.lemma} - {currentItem.person}
            </div>
            <input 
              type="text" 
              className="answer-input"
              placeholder="Escribe la conjugación..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={result !== 'idle'}
            />
            {result !== 'idle' && (
              <div className="feedback-message">
                {result === 'correct' ? '¡Correcto!' : `La respuesta correcta es: ${currentItem.value}`}
              </div>
            )}
            {result === 'idle' ? (
              <button className="btn-primary" onClick={handleCheckAnswer}>Revisar</button>
            ) : (
              <button className="btn-primary" onClick={handleContinue}>Continuar</button>
            )}
          </div>
        ) : (
          <p>No hay ejercicios disponibles para este tiempo verbal.</p>
        )}
      </div>
    </div>
  );
}

export default LearningDrill;
