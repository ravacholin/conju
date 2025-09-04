import React, { useState, useEffect, useRef } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import SessionSummary from './SessionSummary.jsx';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';
import './LearningDrill.css';

const PRONOUNS_DISPLAY = {
  '1s': 'yo',
  '2s_tu': 'tú',
  '2s_vos': 'vos',
  '3s': 'él/ella/usted',
  '1p': 'nosotros/nosotras',
  '2p_vosotros': 'vosotros/vosotras',
  '3p': 'ellos/ellas/ustedes',
};

function LearningDrill({ eligibleForms, duration, onBack, onFinish, onPhaseComplete }) {
  const [currentItem, setCurrentItem] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState('idle'); // idle | correct | incorrect
  const [sessionState, setSessionState] = useState('active'); // active | finished
  const [correctStreak, setCorrectStreak] = useState(0);
  
  const [points, setPoints] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [errorPatterns, setErrorPatterns] = useState({});
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [entered, setEntered] = useState(false);
  const [swapAnim, setSwapAnim] = useState(false);

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
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
    setStartTime(Date.now());
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [eligibleForms]);

  useEffect(() => {
    generateNextItem();
  }, [generateNextItem]);

  useEffect(() => {
    // enter animation on mount
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  const calculatePoints = (isCorrect, responseTime, isIrregular = false) => {
    if (!isCorrect) return 0;
    let basePoints = isIrregular ? 15 : 10;
    let multiplier = 1;
    if (responseTime < 2000) multiplier *= 1.5;
    if (correctStreak >= 5) multiplier *= 1.2;
    if (correctStreak >= 10) multiplier *= 1.4;
    if (correctStreak >= 15) multiplier *= 1.6;
    return Math.round(basePoints * multiplier);
  };

  const analyzeError = (correct, userAnswer) => {
    const correctLower = correct.toLowerCase();
    const userLower = userAnswer.toLowerCase();
    if (correctLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 
        userLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) {
      return 'accent_error';
    }
    if (userAnswer === currentItem?.lemma) {
      return 'wrong_tense';
    }
    const correctEnding = correctLower.slice(-2);
    const userEnding = userLower.slice(-2);
    if (correctEnding !== userEnding) {
      return 'person_error';
    }
    return 'complete_error';
  };

  const handleCheckAnswer = async () => {
    if (!currentItem || !startTime) return;
    const correctAnswer = currentItem.value;
    const altAnswers = currentItem.alt || [];
    const userAnswer = inputValue.trim();
    const userAnswerLower = userAnswer.toLowerCase();
    const responseTime = Date.now() - startTime;
    const isCorrect = userAnswerLower === correctAnswer.toLowerCase() || 
                     (Array.isArray(altAnswers) && altAnswers.map(a => a.toLowerCase()).includes(userAnswerLower));

    setTotalAttempts(prev => prev + 1);
    setResponseTimes(prev => [...prev, responseTime]);

    if (isCorrect) {
      setResult('correct');
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      setCorrectAnswers(prev => prev + 1);
      const isIrregular = currentItem.type === 'irregular';
      const earnedPoints = calculatePoints(true, responseTime, isIrregular);
      setPoints(prev => prev + earnedPoints);
      if (newStreak > 0 && newStreak % 5 === 0) {
        setShowStreakAnimation(true);
        setTimeout(() => setShowStreakAnimation(false), 2000);
      }
    } else {
      setResult('incorrect');
      setCorrectStreak(0);
      const errorType = analyzeError(correctAnswer, userAnswer);
      setErrorPatterns(prev => ({ ...prev, [errorType]: (prev[errorType] || 0) + 1 }));
    }
    
    setTimeout(() => containerRef.current?.focus(), 0);

    try {
      const userId = getCurrentUserId();
      if (userId) {
        await updateSchedule(userId, { ...currentItem }, isCorrect, 0);
      }
    } catch (error) {
      console.error("Failed to update SRS schedule:", error);
    }
  };

  const handleContinue = () => {
    if (correctStreak >= 5 && onPhaseComplete) {
        onPhaseComplete();
    } else {
        // subtle swap animation when moving to next random item
        setSwapAnim(true);
        setTimeout(() => setSwapAnim(false), 250);
        generateNextItem();
    }
  };

  const generateSessionSummary = () => {
    const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
    const avgTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    let grade = 'F';
    if (accuracy >= 95) grade = 'A+';
    else if (accuracy >= 90) grade = 'A';
    else if (accuracy >= 80) grade = 'B';
    else if (accuracy >= 70) grade = 'C';
    else if (accuracy >= 60) grade = 'D';
    return { grade, accuracy: Math.round(accuracy), averageTime: Math.round(avgTime / 1000 * 10) / 10, maxStreak: correctStreak, points, totalAttempts, correctAnswers, errorPatterns, recommendations: [] };
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

  const getPersonText = (personCode) => {
      return PRONOUNS_DISPLAY[personCode] || personCode;
  }

  if (!eligibleForms || eligibleForms.length === 0) {
    return (
      <div className="App"><div className="main-content"><div className="drill-container learning-drill">
        <div className="drill-header"><button onClick={onBack} className="back-to-menu-btn"><img src="/back.png" alt="Volver" className="back-icon" />Volver</button><h2>Sin ejercicios</h2></div>
        <div className="center-column"><p>No hay ejercicios disponibles.</p></div>
      </div></div></div>
    );
  }

  if (sessionState === 'finished') {
    const summary = generateSessionSummary();
    return <SessionSummary onFinish={onFinish} summary={summary} />;
  }

  const tenseName = TENSE_LABELS[eligibleForms[0].tense] || eligibleForms[0].tense;

  return (
    <div className="App" onKeyDown={handleKeyDown} tabIndex={-1} ref={containerRef}>
      <div className="main-content">
        <div className={`drill-container learning-drill page-transition ${entered ? 'page-in' : ''}`}>
          <div className="drill-header">
            <button onClick={onBack} className="back-to-menu-btn">
              <img src="/back.png" alt="Volver" className="back-icon" />
              Volver
            </button>
            <h2>Practicando: {tenseName}</h2>
          </div>

          <div className="chrono-panel">
            <div className="chrono-item"><div className="chrono-value">{points.toLocaleString()}</div><div className="chrono-label">Puntos</div></div>
            <div className="chrono-item"><div className="chrono-value streak-value">🔥 <span className={showStreakAnimation ? 'streak-shake' : ''}>{correctStreak}</span></div><div className="chrono-label">Racha</div></div>
            <div className="chrono-item"><div className="chrono-value">{totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0}%</div><div className="chrono-label">Precisión</div></div>
          </div>

          {currentItem ? (
            <>
              <div className={`verb-lemma ${swapAnim ? 'swap' : ''}`}>{currentItem.lemma}</div>
              <div className={`person-display ${swapAnim ? 'swap' : ''}`}>{getPersonText(currentItem.person)}</div>
              
              <div className="input-container">
                <input 
                  ref={inputRef}
                  type="text" 
                  className={`conjugation-input ${result}`}
                  placeholder="Escribe la conjugación..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={result !== 'idle'}
                  autoFocus
                />
              </div>
              
              {result !== 'idle' && (
                <div className={`result ${result}`}>
                  {result === 'correct' ? (
                    <div className="correct-feedback">¡Correcto!</div>
                  ) : (
                    <div className="incorrect-feedback">
                      La respuesta correcta es: <span className="correct-answer">{currentItem.value}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="action-buttons">
                {result === 'idle' ? (
                  <button className="btn" onClick={handleCheckAnswer} disabled={!inputValue.trim()}>Revisar</button>
                ) : (
                  <button className="btn" onClick={handleContinue}>Continuar</button>
                )}
              </div>
            </>
          ) : (
            <div className="loading">Cargando...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LearningDrill;
