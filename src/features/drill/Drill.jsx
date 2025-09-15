import { useState, useEffect, useRef } from 'react';
import { grade } from '../../lib/core/grader.js';
// Removed unused imports to satisfy lint
import { useProgressTracking } from './useProgressTracking.js';
import Diff from './Diff.jsx';
import { useSettings } from '../../state/settings.js';
import { getSafeMoodTenseLabels } from '../../lib/utils/moodTenseValidator.js';
import ReverseInputs from './ReverseInputs.jsx';
import ResistanceHUD from './ResistanceHUD.jsx';
import { useSpeech } from './useSpeech';
import { useResistanceTimer } from './useResistanceTimer';

export default function Drill({ 
  currentItem, 
  onResult, 
  onContinue,
  showAccentKeys = true
}) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed unused hint state
  const [showDiff, setShowDiff] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const { showExplosion, urgentTick, clockClickFeedback, handleClockClick } = useResistanceTimer();
  const [secondInput, setSecondInput] = useState('');

  const inputRef = useRef(null);
  const firstRef = useRef(null);
  const secondRef = useRef(null);
  const settings = useSettings();

  const { handleResult } = useProgressTracking(currentItem, onResult);

  const getCanonicalTarget = () => {
    if (!currentItem) return null;
    
    // NEW IRREGULARITY SYSTEM: Return complete verb information including irregularity data
    return {
      value: currentItem.value || currentItem.form?.value || '',
      lemma: currentItem.lemma || '',
      mood: currentItem.mood || '',
      tense: currentItem.tense || '',
      person: currentItem.person || '',
      // Include complete verb information for new irregularity system
      type: currentItem.type,
      irregularTenses: currentItem.irregularTenses || [],
      irregularityMatrix: currentItem.irregularityMatrix || {},
      // Include additional form information
      alt: currentItem.form?.alt || [],
      accepts: currentItem.form?.accepts || {}
    };
  };

  useEffect(() => {
    setInput('');
    setSecondInput('');
    setResult(null);
    setShowDiff(false);
    setShowAnimation(true);
    if (inputRef.current && !settings.doubleActive && !settings.reverseActive) {
      inputRef.current.focus();
    } else if (settings.doubleActive && firstRef.current) {
      firstRef.current.focus();
    }
    const timer = setTimeout(() => setShowAnimation(false), 500);
    return () => clearTimeout(timer);
  }, [currentItem]);

  // Resistance countdown moved to useResistanceTimer hook

  // Game mode helpers and configuration
  const isReverse = !!settings.reverseActive;
  const isDouble = !!settings.doubleActive;
  const inSpecific = settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense;

  // Reverse inputs and options moved to ReverseInputs component


  const handleSubmit = async () => {
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setShowDiff(false);

    let gradeResult;
    let extendedResult;

    if (settings.reverseActive) {
      // Reverse mode: check against lemma
      const correctAnswer = currentItem?.lemma || '';
      const isCorrect = input.trim().toLowerCase() === correctAnswer.toLowerCase();
      gradeResult = {
        correct: isCorrect,
        targets: [correctAnswer],
        note: isCorrect ? '¡Correcto!' : `Incorrecto. El infinitivo es: ${correctAnswer}`
      };
      extendedResult = {
        ...gradeResult,
        userAnswer: input.trim(),
        correctAnswer: correctAnswer
      };
    } else if (settings.doubleActive && currentItem?.secondForm) {
      // Double mode: expect both forms separated by space
      const form1 = currentItem?.value || currentItem?.form?.value || '';
      const form2 = currentItem?.secondForm?.value || '';
      const correctAnswer = `${form1} ${form2}`;
      
      const userParts = input.trim().split(/\s+/);
      const isCorrect = userParts.length === 2 && 
                       userParts[0].toLowerCase() === form1.toLowerCase() &&
                       userParts[1].toLowerCase() === form2.toLowerCase();
      
      gradeResult = {
        correct: isCorrect,
        targets: [correctAnswer],
        note: isCorrect ? '¡Correcto!' : `Incorrecto. Las formas son: ${correctAnswer}`
      };
      extendedResult = {
        ...gradeResult,
        userAnswer: input.trim(),
        correctAnswer: correctAnswer
      };
    } else {
      // Normal mode: use standard grading
      const canonicalForm = getCanonicalTarget();
      gradeResult = grade(input.trim(), canonicalForm, currentItem.settings || {});
      extendedResult = {
        ...gradeResult,
        userAnswer: input.trim(),
        correctAnswer: canonicalForm?.value || currentItem?.form?.value,
      };
    }

    // Resistance: add time on correct answer
    if (gradeResult.correct && settings.resistanceActive) {
      const lvl = useSettings.getState().level || 'A1';
      // Incrementos por nivel: A1 +6s, A2 +5s, B1 +4s, B2 +3s, C1 +2.5s, C2 +2s
      const inc = lvl==='C2'?2000: lvl==='C1'?2500: lvl==='B2'?3000: lvl==='B1'?4000: lvl==='A2'?5000:6000;
      settings.set({ resistanceMsLeft: Math.min(useSettings.getState().resistanceMsLeft + inc, 120000) });
    }

    if (!gradeResult.correct) {
      setShowDiff(true);
    }

    setResult(extendedResult);
    
    try {
      await handleResult(extendedResult);
    } catch (error) {
      console.error('Error tracking progress for attempt:', error);
    }
    
    setIsSubmitting(false);
  };

  // Double mode submit function
  const doubleSubmit = async () => {
    if (!input.trim() || !secondInput.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const firstRes = grade(input.trim(), getCanonicalTarget(), currentItem.settings || {});
      // Use explicit second target from secondForm if present, otherwise fall back to same as first
      const secondTarget = currentItem.secondForm ? { 
        value: currentItem.secondForm.value,
        lemma: currentItem.secondForm.lemma,
        mood: currentItem.secondForm.mood,
        tense: currentItem.secondForm.tense,
        person: currentItem.secondForm.person,
        // Include complete verb information for new irregularity system  
        type: currentItem.type,
        irregularTenses: currentItem.irregularTenses || [],
        irregularityMatrix: currentItem.irregularityMatrix || {},
        alt: currentItem.secondForm.alt || [],
        accepts: currentItem.secondForm.accepts || {}
      } : getCanonicalTarget();
      const secondRes = secondTarget ? grade(secondInput.trim(), secondTarget, currentItem.settings || {}) : { correct: false };
      const correct = firstRes.correct && secondRes.correct;
      const resultObj = {
        correct,
        isAccentError: firstRes.isAccentError || secondRes.isAccentError,
        targets: [getCanonicalTarget()?.value || '', secondTarget?.value || '']
      };
      setResult(resultObj);
      
      try {
        await handleResult(resultObj);
      } catch (error) {
        console.error('Error tracking progress for double mode attempt:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reverse mode UI and submission handled in ReverseInputs component

  const handleContinue = () => {
    onContinue();
  };

  // Accent keys functionality
  const specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'];
  
  const insertChar = (char) => {
    if (isDouble) {
      // In double mode, check which input is focused or default to first
      const activeElement = document.activeElement;
      if (activeElement === secondRef.current) {
        setSecondInput(prev => prev + char);
      } else {
        setInput(prev => prev + char);
      }
    } else {
      // Normal mode
      setInput(prev => prev + char);
    }
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
    
    const { moodLabel, tenseLabel } = getSafeMoodTenseLabels(currentItem.mood, currentItem.tense);
    const sample = getHablarSample(currentItem.mood, currentItem.tense, settings);
    
    return sample ? `${moodLabel} - ${tenseLabel}: ${sample}` : `${moodLabel} - ${tenseLabel}`;
  };

  // Provide a compact example using the verb "hablar" adapted to the current mood/tense
  function getHablarSample(mood, tense, settings) {
    const region = settings?.region || 'la_general'
    const voseo = settings?.useVoseo && region === 'rioplatense'
    
    if (mood === 'indicative') {
      switch (tense) {
        case 'pres': return 'hablo' // yo
        case 'pretIndef': return 'hablé' // yo
        case 'impf': return 'hablaba' // yo
        case 'fut': return 'hablaré' // yo
        case 'pretPerf': return 'he hablado' // yo
        case 'plusc': return 'había hablado' // yo
        case 'futPerf': return 'habré hablado' // yo
        default: return ''
      }
    }
    if (mood === 'subjunctive') {
      switch (tense) {
        case 'subjPres': return 'hable' // yo
        case 'subjImpf': return 'hablara' // choose -ra variant
        case 'subjPerf': return 'haya hablado' // yo
        case 'subjPlusc': return 'hubiera hablado' // yo
        default: return ''
      }
    }
    if (mood === 'imperative') {
      // No "yo" in imperative; show 2s example per region
      if (tense === 'impAff') {
        return voseo ? 'hablá' : 'habla'
      }
      if (tense === 'impNeg') {
        // Vos and tú share negative base for -ar
        return 'no hables'
      }
      return ''
    }
    if (mood === 'conditional') {
      switch (tense) {
        case 'cond': return 'hablaría' // yo
        case 'condPerf': return 'habría hablado' // yo
        default: return ''
      }
    }
    if (mood === 'nonfinite') {
      if (tense === 'ger') return 'hablando'
      if (tense === 'part') return 'hablado'
    }
    return ''
  }

  // Helper functions for game modes
  const getMoodLabel = (mood) => {
    return getSafeMoodTenseLabels(mood, 'dummy').moodLabel;
  };

  const getTenseLabel = (tense) => {
    return getSafeMoodTenseLabels('dummy', tense).tenseLabel;
  };

  const getPersonLabel = (person) => {
    const PERSON_LABELS = {
      '1s': 'yo',
      '2s_tu': 'tú',
      '2s_vos': 'vos',
      '3s': 'él/ella',
      '1p': 'nosotros',
      '2p_vosotros': 'vosotros', 
      '3p': 'ellos'
    };
    return PERSON_LABELS[person] || person;
  };

  // TTS extracted to hook
  const { getSpeakText, speak } = useSpeech();

  const handleSpeak = () => {
    const text = getSpeakText({ currentItem, result, isReverse, isDouble });
    if (text) speak(text);
  };

  
  return (
    <div className={`drill-container ${showAnimation ? 'fade-in' : ''}`}>
      {/* Verb lemma (infinitive) - TOP */}
      <div className="verb-lemma">
        {isReverse ? currentItem?.value || currentItem?.form?.value : currentItem?.lemma}
      </div>

      {/* Conjugation context - MIDDLE */}
      {!isReverse && !isDouble && (
        <div className="conjugation-context">
          {getContextText()}
        </div>
      )}


      {/* Person/pronoun display - BOTTOM (hide for nonfinite forms) */}
      {!isReverse && !isDouble && currentItem?.mood !== 'nonfinite' && (
        <div className="person-display">
          {getPersonText()}
        </div>
      )}

      {/* Regular mode input */}
      {!isReverse && !isDouble && (
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
              if (e.key === 'Escape') {
                e.preventDefault();
                if (!result) {
                  setInput('');
                } else {
                  handleContinue();
                }
              }
            }}
            placeholder="Escribe la conjugación..."
            readOnly={result !== null}
            autoFocus
          />
          
          {/* Accent keypad for normal mode */}
          {showAccentKeys && (
            <div className="accent-keypad" style={{ marginTop: '1rem' }}>
              {specialChars.map(ch => (
                <button
                  key={ch}
                  type="button"
                  className="accent-key"
                  onClick={() => insertChar(ch)}
                  tabIndex={-1}
                >{ch}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reverse mode interface */}
      {isReverse && (
        <ReverseInputs
          currentItem={currentItem}
          inSpecific={inSpecific}
          showAccentKeys={showAccentKeys}
          result={result}
          onContinue={handleContinue}
          onSubmit={async (reverseResult) => {
            setResult(reverseResult)
            try {
              await handleResult(reverseResult)
            } catch (err) {
              console.error('Error tracking progress for reverse mode attempt:', err)
            }
          }}
        />
      )}

      {/* Double mode interface */}
      {isDouble && (
        <div className="double-container">
          <div className="conjugation-context" style={{marginBottom: '10px'}}>
            <strong>Dos verbos dos: {currentItem?.lemma}</strong>
          </div>
          <div className="double-grid">
            <div className="double-field">
              <div className="person-display" style={{marginBottom: '6px'}}>
                {getMoodLabel(currentItem?.mood)} · {getTenseLabel(currentItem?.tense)} · {getPersonText()}
              </div>
              <input
                ref={firstRef}
                className="conjugation-input"
                value={input}
                onChange={(e)=>setInput(e.target.value)}
                placeholder="Escribí la primera forma..."
                onKeyDown={(e)=>{
                  if(e.key==='Enter'){
                    e.preventDefault();
                    if (result) { handleContinue(); return; }
                    if(secondRef.current){ secondRef.current.focus(); }
                  }
                }}
                autoFocus
              />
            </div>
            <div className="double-field">
              <div className="person-display" style={{marginBottom: '6px'}}>
                {getMoodLabel(currentItem?.secondForm?.mood || currentItem?.mood)} · {getTenseLabel(currentItem?.secondForm?.tense || currentItem?.tense)} · {getPersonLabel(currentItem?.secondForm?.person || currentItem?.person)}
              </div>
              <input
                ref={secondRef}
                className="conjugation-input"
                value={secondInput}
                onChange={(e)=>setSecondInput(e.target.value)}
                placeholder="Escribí la segunda forma..."
                onKeyDown={(e)=>{
                  if(e.key==='Enter'){
                    e.preventDefault();
                    if (result) { handleContinue(); return; }
                    doubleSubmit();
                  }
                }}
              />
            </div>
          </div>
          
          {/* Accent keypad for double mode */}
          {showAccentKeys && (
            <div className="accent-keypad" style={{ marginTop: '1rem' }}>
              {specialChars.map(ch => (
                <button
                  key={ch}
                  type="button"
                  className="accent-key"
                  onClick={() => insertChar(ch)}
                  tabIndex={-1}
                >{ch}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="action-buttons">
        {!isReverse && !isDouble ? (
          !result ? (
            <button 
              className="btn" 
              onClick={handleSubmit}
              disabled={isSubmitting || !input.trim()}
            >
              {isSubmitting ? 'Verificando...' : 'Verificar'}
            </button>
          ) : (
            <button className="btn" onClick={handleContinue}>
              Continuar
            </button>
          )
        ) : isReverse ? null : (
          !result ? (
            <button 
              className="btn" 
              onClick={doubleSubmit}
              disabled={!(input.trim() && secondInput.trim())}
            >
              Verificar
            </button>
          ) : (
            <button className="btn" onClick={handleContinue}>
              Continuar
            </button>
          )
        )}
      </div>

      {/* Result feedback */}
      {result && (
        <div className={`result ${result.correct ? 'correct' : 'incorrect'} slide-in`}>
          <div className="result-top">
            <p>{result.correct ? '¡Correcto!' : (result.isAccentError ? 'Error de Tilde' : 'Incorrecto')}</p>
            <button 
              type="button" 
              className="tts-btn" 
              onClick={handleSpeak}
              title="Pronunciar"
              aria-label="Pronunciar"
            >
              <img src="/megaf-imperat.png" alt="Pronunciar" />
            </button>
          </div>
          {result.correct && result.note && result.note.trim() !== '¡Correcto!' && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              {result.note}
            </p>
          )}
          {!result.correct && result.targets && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
              Respuesta correcta: <strong>{result.targets.join(' / ')}</strong>
            </p>
          )}
          {showDiff && !result.correct && (
            <Diff string1={input} string2={result.targets[0]} />
          )}
        </div>
      )}

      {/* Resistance HUD */}
      {(settings.resistanceActive || showExplosion) && (
        <ResistanceHUD
          isActive={settings.resistanceActive}
          msLeft={settings.resistanceMsLeft}
          showExplosion={showExplosion}
          urgentTick={urgentTick}
          clockClickFeedback={clockClickFeedback}
          onClockClick={handleClockClick}
        />
      )}
    </div>
  );
} 
