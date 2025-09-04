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
  
  // Gamification states
  const [points, setPoints] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [averageTime, setAverageTime] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [errorPatterns, setErrorPatterns] = useState({});
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);

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
    setStartTime(Date.now()); // Track response time
  }, [eligibleForms]);

  useEffect(() => {
    generateNextItem();
  }, [generateNextItem]);

  // Calculate points based on difficulty and performance
  const calculatePoints = (isCorrect, responseTime, isIrregular = false) => {
    if (!isCorrect) return 0;
    
    let basePoints = isIrregular ? 15 : 10;
    let multiplier = 1;
    
    // Speed bonus (under 2 seconds)
    if (responseTime < 2000) multiplier *= 1.5;
    
    // Streak bonus
    if (correctStreak >= 5) multiplier *= 1.2;
    if (correctStreak >= 10) multiplier *= 1.4;
    if (correctStreak >= 15) multiplier *= 1.6;
    
    return Math.round(basePoints * multiplier);
  };

  // Analyze error patterns
  const analyzeError = (correct, userAnswer) => {
    const correctLower = correct.toLowerCase();
    const userLower = userAnswer.toLowerCase();
    
    // Check for accent errors
    if (correctLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 
        userLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) {
      return 'accent_error';
    }
    
    // Check if wrong tense (using present instead of past, etc.)
    if (userAnswer === currentItem?.lemma) {
      return 'wrong_tense';
    }
    
    // Check for person confusion (comparing endings)
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
                     altAnswers.map(a => a.toLowerCase()).includes(userAnswerLower);

    // Update analytics
    setTotalAttempts(prev => prev + 1);
    setResponseTimes(prev => [...prev, responseTime]);

    if (isCorrect) {
      setResult('correct');
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      setCorrectAnswers(prev => prev + 1);
      
      // Calculate and add points
      const isIrregular = currentItem.type === 'irregular'; // Assuming this exists
      const earnedPoints = calculatePoints(true, responseTime, isIrregular);
      setPoints(prev => prev + earnedPoints);
      
      // Show streak animation for milestones
      if (newStreak === 5 || newStreak === 10 || newStreak === 15 || newStreak % 20 === 0) {
        setShowStreakAnimation(true);
        setTimeout(() => setShowStreakAnimation(false), 2000);
      }
      
    } else {
      setResult('incorrect');
      setCorrectStreak(0); // Reset streak on incorrect answer
      
      // Analyze error pattern
      const errorType = analyzeError(correctAnswer, userAnswer);
      setErrorPatterns(prev => ({
        ...prev,
        [errorType]: (prev[errorType] || 0) + 1
      }));
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

  // Generate session summary with grade
  const generateSessionSummary = () => {
    const accuracy = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
    const avgTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    const maxStreak = Math.max(correctStreak, 0);
    
    // Calculate grade based on performance
    let grade = 'F';
    if (accuracy >= 95) grade = 'A+';
    else if (accuracy >= 90) grade = 'A';
    else if (accuracy >= 85) grade = 'B+';
    else if (accuracy >= 80) grade = 'B';
    else if (accuracy >= 75) grade = 'C+';
    else if (accuracy >= 70) grade = 'C';
    else if (accuracy >= 65) grade = 'D+';
    else if (accuracy >= 60) grade = 'D';
    
    // Bonus for speed
    if (avgTime < 1500 && accuracy >= 80) {
      if (grade === 'A') grade = 'A+';
      else if (grade === 'B+') grade = 'A-';
      else if (grade === 'B') grade = 'B+';
    }
    
    return {
      grade,
      accuracy: Math.round(accuracy),
      averageTime: Math.round(avgTime / 1000 * 10) / 10, // in seconds
      maxStreak,
      points,
      totalAttempts,
      correctAnswers,
      errorPatterns,
      recommendations: generateRecommendations()
    };
  };

  // Generate personalized recommendations
  const generateRecommendations = () => {
    const recommendations = [];
    const totalErrors = Object.values(errorPatterns).reduce((a, b) => a + b, 0);
    
    if (errorPatterns.accent_error > totalErrors * 0.3) {
      recommendations.push("Enfócate en los acentos. Recuerda: 'habló' (pasado) vs 'hablo' (presente)");
    }
    
    if (errorPatterns.person_error > totalErrors * 0.3) {
      recommendations.push("Practica las terminaciones por persona: yo (-é), tú (-aste), él (-ó)");
    }
    
    if (errorPatterns.wrong_tense > totalErrors * 0.2) {
      recommendations.push("Revisa los indicadores temporales: 'ayer' = pretérito, 'siempre' = presente");
    }
    
    const avgTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    if (avgTime > 4000) {
      recommendations.push("Practica más para mejorar tu velocidad de respuesta");
    }
    
    if (correctStreak < 5) {
      recommendations.push("Intenta mantener una racha de 5+ respuestas correctas seguidas");
    }
    
    return recommendations.slice(0, 3); // Max 3 recommendations
  };

  const getStreakTierClass = (streak) => {
    if (streak === 0) return 'streak-tier-0';
    if (streak >= 1 && streak <= 2) return 'streak-tier-1';
    if (streak >= 3 && streak <= 4) return 'streak-tier-2';
    if (streak >= 5 && streak <= 9) return 'streak-tier-3';
    if (streak >= 10 && streak <= 14) return 'streak-tier-4';
    if (streak >= 15 && streak <= 19) return 'streak-tier-5';
    return 'streak-tier-6';
  };

  const getAccuracyClass = (accuracy) => {
    if (accuracy >= 95) return 'accuracy-excellent';
    if (accuracy >= 85) return 'accuracy-good';
    if (accuracy >= 70) return 'accuracy-fair';
    return 'accuracy-poor';
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
    const summary = generateSessionSummary();
    return <SessionSummary onFinish={onFinish} summary={summary} />;
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

          {/* Stats panel matching main app chrono-panel */}
          <div className="chrono-panel">
            <div className="chrono-item">
              <div className="chrono-value">{points.toLocaleString()}</div>
              <div className="chrono-label">Puntos</div>
            </div>
            
            <div className="chrono-item">
              <div className="chrono-value streak-value">
                🔥 <span className={`${getStreakTierClass(correctStreak)} ${showStreakAnimation ? 'streak-shake' : ''}`}>{correctStreak}</span>
              </div>
              <div className="chrono-label">Racha</div>
            </div>
            
            <div className="chrono-item">
              <div className="chrono-value">{totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0}%</div>
              <div className="chrono-label">Precisión</div>
            </div>
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
                  {result === 'correct' ? (
                    <div className="correct-feedback">
                      <div className="feedback-icon">✨</div>
                      <div className="feedback-text">¡Correcto!</div>
                      {correctStreak >= 5 && (
                        <div className="streak-bonus">
                          +{Math.round(10 * (correctStreak >= 5 ? 1.2 : 1))} puntos
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="incorrect-feedback">
                      <div className="feedback-text">
                        La respuesta correcta es: <span className="correct-answer">{currentItem.value}</span>
                      </div>
                      {/* Show helpful hint based on error type */}
                      {(() => {
                        const errorType = analyzeError(currentItem.value, inputValue);
                        if (errorType === 'accent_error') {
                          return <div className="hint">💡 Recuerda el acento: marca la diferencia entre tiempos</div>;
                        } else if (errorType === 'person_error') {
                          return <div className="hint">💡 Revisa la terminación para la persona correcta</div>;
                        } else if (errorType === 'wrong_tense') {
                          return <div className="hint">💡 Verifica el tiempo verbal que estás practicando</div>;
                        }
                        return null;
                      })()}
                    </div>
                  )}
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
