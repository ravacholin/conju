import React, { useState, useEffect, useRef } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import SessionSummary from './SessionSummary.jsx';
import { useProgressTracking } from '../../features/drill/useProgressTracking.js';
import { grade } from '../../lib/core/grader.js';
import { chooseNext } from '../../lib/core/generator.js';
import { FORM_LOOKUP_MAP } from '../../lib/core/optimizedCache.js';
import { useSettings } from '../../state/settings.js';
import { convertLearningFamilyToOld } from '../../lib/data/learningIrregularFamilies.js';
import { calculateAdaptiveDifficulty, adjustRealTimeDifficulty, generateNextSessionRecommendations } from '../../lib/learning/adaptiveEngine.js';
import { recordLearningSession } from '../../lib/learning/analytics.js';
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

function LearningDrill({ tense, verbType, selectedFamilies, duration, onBack, onFinish, onPhaseComplete }) {
  const [currentItem, setCurrentItem] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState('idle'); // idle | correct | incorrect
  const [sessionState, setSessionState] = useState('active'); // active | finished
  const [correctStreak, setCorrectStreak] = useState(0);
  
  // Removed custom points system - now using official progress tracking
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [responseTimes, setResponseTimes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [errorPatterns, setErrorPatterns] = useState({});
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [sessionStats, setSessionStats] = useState({ points: 0, streakCount: 0 });
  const [adaptiveSettings, setAdaptiveSettings] = useState(null);
  const [realTimeDifficulty, setRealTimeDifficulty] = useState({
    hintsDelay: 5000,
    timeLimit: null,
    complexityBoost: false,
    encouragementLevel: 'normal'
  });
  const [allAttempts, setAllAttempts] = useState([]);
  const [sessionStartTimestamp, setSessionStartTimestamp] = useState(null);

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const [entered, setEntered] = useState(false);
  const [swapAnim, setSwapAnim] = useState(false);
  const settings = useSettings();

  const { handleResult, handleStreakIncremented, handleTenseDrillStarted, handleTenseDrillEnded } = useProgressTracking(currentItem, (result) => {
    // Update local session stats based on progress tracking
    console.log('Progress tracking result:', result);
    if (result.correct) {
      setSessionStats(prev => ({
        points: prev.points + (result.isIrregular ? 15 : 10),
        streakCount: prev.streakCount + 1
      }));
    } else {
      setSessionStats(prev => ({ ...prev, streakCount: 0 }));
    }
  });

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setSessionState('finished');
      }, duration * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const generateNextItem = React.useCallback(() => {
    // Get current settings WITHOUT modifying global state
    const currentSettings = settings.getState ? settings.getState() : settings;
    
    // For irregular practice, cycle through families for variety
    let selectedFamilyForGenerator = null;
    if (selectedFamilies && selectedFamilies.length > 0) {
      const familyIndex = (totalAttempts || 0) % selectedFamilies.length;
      const learningFamilyId = selectedFamilies[familyIndex];
      selectedFamilyForGenerator = convertLearningFamilyToOld(learningFamilyId);
    }
    
    // Create temporary settings object for this learning session
    const temporarySettings = {
      ...currentSettings,
      practiceMode: 'specific', 
      specificMood: tense?.mood,
      specificTense: tense?.tense,
      verbType: verbType === 'irregular' ? 'irregular' : verbType,
      selectedFamily: selectedFamilyForGenerator,
      cameFromTema: false
    };
    
    console.log('🎯 Temporary learning settings:', temporarySettings);
    console.log('🔍 Available families:', selectedFamilies); 
    console.log('🎲 Selected family for generator:', selectedFamilyForGenerator);
    console.log('🎯 Verb type:', verbType);
    
    // Store original settings to restore later
    const originalSettings = { ...currentSettings };
    
    try {
      // Temporarily apply learning settings
      settings.set(temporarySettings);
      
      const nextItem = chooseNext({
        forms: Array.from(FORM_LOOKUP_MAP.values()),
        history: [],
        currentItem
      });
      
      // IMMEDIATELY restore original settings
      settings.set(originalSettings);
      
      console.log('📝 Generated item:', nextItem);
      
      if (nextItem) {
        setCurrentItem(nextItem);
        setInputValue('');
        setResult('idle');
        setStartTime(Date.now());
        setTimeout(() => inputRef.current?.focus(), 0);
      } else {
        console.error('❌ No item generated - generator returned null');
        setCurrentItem(null);
      }
    } catch (error) {
      console.error('💥 Error generating next item:', error);
      // Ensure settings are restored even on error
      settings.set(originalSettings);
      setCurrentItem(null);
    }
  }, [tense, verbType, selectedFamilies, settings, totalAttempts]); // REMOVED currentItem to prevent infinite loop

  // Only generate first item on mount, not when currentItem changes
  useEffect(() => {
    if (!currentItem) {
      generateNextItem();
    }
  }, [tense?.tense, verbType, selectedFamilies]); // Don't depend on generateNextItem

  // Track tense drill session and preserve original settings
  useEffect(() => {
    // Store original settings on mount
    const originalSettings = settings.getState ? settings.getState() : settings;
    console.log('💾 Preserved original settings for learning session:', originalSettings);
    
    if (tense?.tense) {
      handleTenseDrillStarted(tense.tense);
      console.log(`🔁 Learning drill started for tense: ${tense.tense}`);
    }
    
    // Return cleanup function to track end of session and restore settings
    return () => {
      if (tense?.tense) {
        handleTenseDrillEnded(tense.tense);
        console.log(`✅ Learning drill ended for tense: ${tense.tense}`);
      }
      // Ensure original settings are restored on unmount
      settings.set(originalSettings);
      console.log('♾️ Restored original settings on component unmount');
    };
  }, [tense?.tense]); // Removed function dependencies to prevent infinite loops

  useEffect(() => {
    // enter animation on mount
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Initialize adaptive settings
  useEffect(() => {
    if (tense?.tense) {
      try {
        const userId = 'default'; // TODO: Get actual user ID
        const adaptive = calculateAdaptiveDifficulty(userId, tense.tense, verbType);
        setAdaptiveSettings(adaptive);
        console.log('🎯 Adaptive settings initialized:', adaptive);
      } catch (error) {
        console.error('Error initializing adaptive settings:', error);
        // Use safe defaults
        setAdaptiveSettings({
          level: 'intermediate',
          practiceIntensity: 'medium',
          skipIntroduction: false,
          extendedPractice: false,
          hintsEnabled: true
        });
      }
    }
  }, [tense?.tense, verbType]);

  // Initialize session analytics tracking
  useEffect(() => {
    if (!sessionStartTimestamp) {
      const startTime = Date.now();
      setSessionStartTimestamp(startTime);
      console.log('📊 Analytics session started:', startTime);
    }
  }, [sessionStartTimestamp]);

  // calculatePoints function removed - now handled by progress tracking system


  const handleCheckAnswer = async () => {
    if (!currentItem || !startTime) return;
    const userAnswer = inputValue.trim();
    const responseTime = Date.now() - startTime;

    // Use the sophisticated grader from the main system
    const gradeResult = grade({
      value: currentItem.value,
      alt: currentItem.alt || [],
      accepts: currentItem.accepts || {}
    }, userAnswer);

    const isCorrect = gradeResult.correct;

    setTotalAttempts(prev => prev + 1);
    setResponseTimes(prev => [...prev, responseTime]);

    // Update real-time difficulty based on current performance
    const avgResponseTime = [...responseTimes, responseTime].reduce((a, b) => a + b, 0) / (responseTimes.length + 1);
    const currentAccuracy = (correctAnswers + (isCorrect ? 1 : 0)) / (totalAttempts + 1);
    
    const newDifficulty = adjustRealTimeDifficulty({
      accuracy: currentAccuracy * 100,
      streak: isCorrect ? correctStreak + 1 : 0,
      avgResponseTime,
      totalAttempts: totalAttempts + 1
    });
    
    setRealTimeDifficulty(newDifficulty);
    console.log('🔄 Real-time difficulty adjusted:', newDifficulty);

    if (isCorrect) {
      setResult('correct');
      const newStreak = correctStreak + 1;
      setCorrectStreak(newStreak);
      setCorrectAnswers(prev => prev + 1);
      
      // Handle streak animations and tracking
      if (newStreak > 0 && newStreak % 5 === 0) {
        setShowStreakAnimation(true);
        setTimeout(() => setShowStreakAnimation(false), 2000);
        await handleStreakIncremented();
      }
    } else {
      setResult('incorrect');
      setCorrectStreak(0);
      // Use grader's error analysis for session stats
      const errorType = gradeResult.errorTags?.[0] || 'complete_error';
      setErrorPatterns(prev => ({ ...prev, [errorType]: (prev[errorType] || 0) + 1 }));
    }
    
    setTimeout(() => containerRef.current?.focus(), 0);

    // Record detailed attempt for analytics
    const detailedAttempt = {
      timestamp: Date.now(),
      correct: isCorrect,
      userAnswer,
      correctAnswer: currentItem.value,
      hintsUsed: 0,
      errorTags: gradeResult.errorTags || [],
      latencyMs: responseTime,
      isIrregular: currentItem.type === 'irregular',
      itemId: currentItem.id,
      verb: currentItem.lemma,
      tense: tense?.tense,
      person: currentItem.person,
      adaptiveDifficulty: adaptiveSettings?.level || 'intermediate',
      phaseType: 'mechanical_practice',
      realTimeDifficulty,
      sessionPhase: 'drill'
    };

    setAllAttempts(prev => [...prev, detailedAttempt]);

    // Use the progress tracking system with complete information
    await handleResult({
      correct: isCorrect,
      userAnswer,
      correctAnswer: currentItem.value,
      hintsUsed: 0,
      errorTags: gradeResult.errorTags || [],
      latencyMs: responseTime,
      isIrregular: currentItem.type === 'irregular',
      itemId: currentItem.id
    });
  };

  const handleContinue = () => {
    if (correctStreak >= 10 && onPhaseComplete) {
        setTimeout(() => onPhaseComplete(), 0);
    } else {
        // subtle swap animation when moving to next random item
        setSwapAnim(true);
        setTimeout(() => {
          setSwapAnim(false);
          generateNextItem();
        }, 250);
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
    
    // Generate next session recommendations
    let recommendations = [];
    try {
      const userId = 'default'; // TODO: Get actual user ID
      const currentSession = {
        tense: tense?.tense,
        verbType,
        accuracy,
        totalAttempts,
        correctAnswers,
        avgResponseTime: avgTime
      };
      
      const nextRec = generateNextSessionRecommendations(userId, currentSession);
      recommendations = [nextRec];
      console.log('🎯 Generated recommendations:', nextRec);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    }

    // Record detailed learning session analytics
    const sessionDuration = sessionStartTimestamp ? Date.now() - sessionStartTimestamp : 0;
    const completionRate = correctStreak >= 10 ? 1 : (totalAttempts / 20); // Assuming 20 attempts for full session
    
    try {
      const userId = 'default'; // TODO: Get actual user ID
      const sessionAnalytics = {
        tense: tense?.tense,
        verbType,
        grade,
        accuracy,
        averageTime: avgTime,
        maxStreak: correctStreak,
        points: sessionStats.points,
        totalAttempts,
        correctAnswers,
        errorPatterns,
        sessionDuration,
        completionRate,
        adaptiveLevel: adaptiveSettings?.level || 'intermediate',
        phaseType: 'mechanical_drill',
        attempts: allAttempts,
        realTimeDifficultyFinal: realTimeDifficulty,
        recommendations
      };

      recordLearningSession(userId, sessionAnalytics);
      console.log('📊 Session analytics recorded:', sessionAnalytics);
    } catch (error) {
      console.error('Error recording session analytics:', error);
    }
    
    return { 
      grade, 
      accuracy: Math.round(accuracy), 
      averageTime: Math.round(avgTime / 1000 * 10) / 10, 
      maxStreak: correctStreak, 
      points: sessionStats.points, 
      totalAttempts, 
      correctAnswers, 
      errorPatterns, 
      recommendations,
      adaptiveLevel: adaptiveSettings?.level || 'intermediate'
    };
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

  if (!currentItem) {
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

  const tenseName = TENSE_LABELS[tense?.tense] || tense?.tense;

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
            <div className="chrono-item"><div className="chrono-value">{sessionStats.points.toLocaleString()}</div><div className="chrono-label">Puntos</div></div>
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
