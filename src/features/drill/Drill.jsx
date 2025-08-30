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
  const [resistTick, setResistTick] = useState(0);
  const [clockClickFeedback, setClockClickFeedback] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [urgentTick, setUrgentTick] = useState(false);
  const [secondInput, setSecondInput] = useState('');
  
  // Reverse mode state variables
  const [infinitiveGuess, setInfinitiveGuess] = useState('');
  const [personGuess, setPersonGuess] = useState('');
  const [moodGuess, setMoodGuess] = useState('');
  const [tenseGuess, setTenseGuess] = useState('');

  const inputRef = useRef(null);
  const firstRef = useRef(null);
  const secondRef = useRef(null);
  const settings = useSettings();

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

  // Resistance countdown - Original implementation
  useEffect(() => {
    if (!settings.resistanceActive) return;
    if (settings.resistanceMsLeft <= 0) return;
    const id = setInterval(() => {
      const left = Math.max(0, useSettings.getState().resistanceMsLeft - 100);
      settings.set({ resistanceMsLeft: left });
      setResistTick(t=>t+1);
      
      // Vibración ligera en modo urgente (últimos 5 segundos)
      if (left <= 5000 && left > 0) {
        setUrgentTick(true);
        setTimeout(() => setUrgentTick(false), 150);
      }
      
      if (left === 0) {
        // Activar animación de explosión
        setShowExplosion(true);
        
        // Mantener la explosión visible por 2 segundos
        setTimeout(() => {
          setShowExplosion(false);
          // update best by level
          const lvl = settings.level || 'A1';
          const best = useSettings.getState().resistanceBestMsByLevel || {};
          const survived = (Date.now() - (useSettings.getState().resistanceStartTs||Date.now()));
          if (!best[lvl] || survived > best[lvl]) {
            best[lvl] = survived;
            settings.set({ resistanceBestMsByLevel: { ...best } });
          }
          settings.set({ resistanceActive: false });
        }, 2000);
      }
    }, 100);
    return () => clearInterval(id);
  }, [settings.resistanceActive, settings.resistanceMsLeft]);

  // Game mode helpers and configuration
  const isReverse = !!settings.reverseActive;
  const isDouble = !!settings.doubleActive;
  const inSpecific = settings.practiceMode === 'specific' && settings.specificMood && settings.specificTense;

  // Reverse mode field visibility
  const showInfinitiveField = isReverse;
  const showPersonField = isReverse && currentItem?.mood !== 'nonfinite';
  const showMoodField = isReverse && !inSpecific;
  const showTenseField = isReverse && !inSpecific;

  // Reset reverse inputs when new item or mode changes
  const resetReverseInputs = () => {
    setInfinitiveGuess('');
    setPersonGuess('');
    setMoodGuess('');
    setTenseGuess('');
  };
  
  useEffect(() => { 
    if (isReverse) resetReverseInputs();
  }, [currentItem?.id, isReverse]);

  // Options for dropdowns
  const personOptions = [
    { v:'1s', l:'yo' },
    { v:'2s_tu', l:'tú' },
    { v:'2s_vos', l:'vos' },
    { v:'3s', l:'él/ella/usted' },
    { v:'1p', l:'nosotros' },
    { v:'2p_vosotros', l:'vosotros' },
    { v:'3p', l:'ellos/ustedes' }
  ];

  const moodOptions = [
    { v:'indicative', l:'Indicativo' },
    { v:'subjunctive', l:'Subjuntivo' },
    { v:'imperative', l:'Imperativo' },
    { v:'conditional', l:'Condicional' },
    { v:'nonfinite', l:'No Finito' }
  ];

  const tenseOptionsByMood = {
    indicative: ['pres','pretPerf','pretIndef','impf','plusc','fut','futPerf'],
    subjunctive: ['subjPres','subjImpf','subjPerf','subjPlusc'],
    imperative: ['impAff','impNeg','impMixed'],
    conditional: ['cond','condPerf'],
    nonfinite: ['ger','part','nonfiniteMixed']
  };


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
    handleResult(extendedResult);
    setIsSubmitting(false);
  };

  // Double mode submit function
  const doubleSubmit = () => {
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
        person: currentItem.secondForm.person
      } : getCanonicalTarget();
      const secondRes = secondTarget ? grade(secondInput.trim(), secondTarget, currentItem.settings || {}) : { correct: false };
      const correct = firstRes.correct && secondRes.correct;
      const resultObj = {
        correct,
        isAccentError: firstRes.isAccentError || secondRes.isAccentError,
        targets: [getCanonicalTarget()?.value || '', secondTarget?.value || '']
      };
      setResult(resultObj);
      handleResult(resultObj);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reverse mode submit function
  const reverseSubmit = () => {
    // Validate required fields
    if (!infinitiveGuess.trim()) return;
    if (showPersonField && !personGuess) return;
    if (showMoodField && !moodGuess) return;
    if (showTenseField && !tenseGuess) return;

    // Check against currentItem
    const expected = getCanonicalTarget();
    const okInf = expected.lemma ? expected.lemma.toLowerCase() === infinitiveGuess.trim().toLowerCase() : false;
    
    // Accept syncretisms for identical forms (e.g., 1s/3s in subjunctive)
    const key = `${expected.mood}|${expected.tense}`;
    const EQUIV = {
      'subjunctive|subjImpf': [['1s','3s']],
      'subjunctive|subjPres': [['1s','3s']],
      'subjunctive|subjPerf': [['1s','3s']],
      'subjunctive|subjPlusc': [['1s','3s']],
      'indicative|impf': [['1s','3s']],
      'indicative|plusc': [['1s','3s']],
      'conditional|cond': [['1s','3s']],
      'conditional|condPerf': [['1s','3s']]
    };
    const groups = EQUIV[key] || [];
    const sameGroup = groups.some(g => g.includes(expected.person) && g.includes(personGuess));
    const okPerson = showPersonField ? (expected.person ? (expected.person === personGuess || sameGroup) : false) : true;
    const okMood = showMoodField ? expected.mood === moodGuess : true;
    const okTense = showTenseField ? expected.tense === tenseGuess : true;
    const correct = okInf && okPerson && okMood && okTense;

    const resultObj = {
      correct,
      isAccentError: false,
      targets: [`${expected.lemma} · ${expected.mood}/${expected.tense} · ${expected.person}`]
    };
    setResult(resultObj);
    handleResult(resultObj);
  };

  // Handle keyboard events for reverse mode
  const handleReverseKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!result) {
        reverseSubmit();
      } else {
        handleContinue();
      }
    }
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

  // Helper functions for game modes
  const getMoodLabel = (mood) => {
    const MOOD_LABELS = {
      'indicative': 'Indicativo',
      'subjunctive': 'Subjuntivo', 
      'imperative': 'Imperativo',
      'conditional': 'Condicional',
      'nonfinite': 'Formas no conjugadas'
    };
    return MOOD_LABELS[mood] || mood;
  };

  const getTenseLabel = (tense) => {
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
    return TENSE_LABELS[tense] || tense;
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
            disabled={result !== null}
            autoFocus
          />
        </div>
      )}

      {/* Reverse mode interface */}
      {isReverse && (
        <div className="reverse-container">
          <div className="reverse-badge">Invertí la consigna</div>
          <div className="reverse-subtle">
            {inSpecific ? 'Decí el infinitivo y la persona' : 'Decí el infinitivo, la persona, el modo y el tiempo'}
          </div>
          <div className="reverse-divider" />

          <div className="reverse-grid">
            <div className="reverse-field">
              <label className="reverse-label">Infinitivo</label>
              <input 
                className="reverse-input" 
                value={infinitiveGuess} 
                onChange={(e)=>setInfinitiveGuess(e.target.value)} 
                onKeyDown={handleReverseKeyDown} 
                placeholder="escribir, tener..." 
                autoFocus
              />
            </div>

            {showPersonField && (
              <div className="reverse-field">
                <label className="reverse-label">Persona</label>
                <select 
                  className="reverse-select" 
                  value={personGuess} 
                  onChange={(e)=>setPersonGuess(e.target.value)} 
                  onKeyDown={handleReverseKeyDown}
                >
                  <option value="">Seleccioná persona...</option>
                  {personOptions.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </div>
            )}

            {showMoodField && (
              <div className="reverse-field">
                <label className="reverse-label">Modo</label>
                <select 
                  className="reverse-select" 
                  value={moodGuess} 
                  onChange={(e)=>{ setMoodGuess(e.target.value); setTenseGuess(''); }} 
                  onKeyDown={handleReverseKeyDown}
                >
                  <option value="">Seleccioná modo...</option>
                  {moodOptions.map(m => <option key={m.v} value={m.v}>{getMoodLabel(m.v)}</option>)}
                </select>
              </div>
            )}

            {showTenseField && (
              <div className="reverse-field">
                <label className="reverse-label">Tiempo</label>
                <select 
                  className="reverse-select" 
                  value={tenseGuess} 
                  onChange={(e)=>setTenseGuess(e.target.value)} 
                  onKeyDown={handleReverseKeyDown} 
                  disabled={!moodGuess}
                >
                  <option value="">Seleccioná tiempo...</option>
                  {(tenseOptionsByMood[moodGuess]||[]).map(t => <option key={t} value={t}>{getTenseLabel(t)}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
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
        ) : isReverse ? (
          !result ? (
            <button 
              className="btn" 
              onClick={reverseSubmit}
              disabled={!(infinitiveGuess.trim() && (!showPersonField || personGuess) && (!showMoodField || moodGuess) && (!showTenseField || tenseGuess))}
            >
              Verificar
            </button>
          ) : (
            <button className="btn" onClick={handleContinue}>
              Continuar
            </button>
          )
        ) : (
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
          <p>{result.correct ? '¡Correcto!' : (result.isAccentError ? 'Error de Tilde' : 'Incorrecto')}</p>
          {result.correct && result.note && (
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

      {/* Resistance HUD - Original timer implementation */}
      {(settings.resistanceActive || showExplosion) && (
        <div className="resistance-hud">
          <div 
            className={`digit-clock ${
              settings.resistanceMsLeft <= 5000 ? 'urgent' : ''
            } ${
              showExplosion ? 'shake' : ''
            } ${
              clockClickFeedback ? 'click-feedback' : ''
            } ${
              urgentTick ? 'urgent-tick' : ''
            }`}
            onClick={() => {
              // Solo permitir clicks si el modo está activo
              if (settings.resistanceActive && settings.resistanceMsLeft > 0) {
                // Add 5 seconds (5000ms) when clicking the clock
                const currentMs = settings.resistanceMsLeft;
                settings.set({ resistanceMsLeft: currentMs + 5000 });
                
                // Show visual feedback
                setClockClickFeedback(true);
                setTimeout(() => setClockClickFeedback(false), 300);
              }
            }}
            style={{ cursor: settings.resistanceActive && settings.resistanceMsLeft > 0 ? 'pointer' : 'default' }}
            title={settings.resistanceActive && settings.resistanceMsLeft > 0 ? "Click para agregar 5 segundos" : "¡Tiempo agotado!"}
          >
            {(() => {
              const ms = Math.max(0, settings.resistanceMsLeft);
              const s = Math.floor(ms/1000);
              const d2 = (n) => String(n).padStart(2,'0');
              const str = `${d2(Math.floor(s/60))}:${d2(s%60)}`;
              return str.split('').map((ch, i) => (
                <span key={i} className={`digit ${ch === ':' ? 'colon' : ''}`}>{ch}</span>
              ));
            })()}
          </div>
          <div className="resistance-caption">
            {showExplosion ? '¡Tiempo agotado!' : 'Modo Supervivencia'}
          </div>
        </div>
      )}
    </div>
  );
} 
