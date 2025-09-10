import { useState, useEffect, useRef } from 'react';
import { grade } from '../../lib/core/grader.js';
// Removed unused imports to satisfy lint
import { useProgressTracking } from './useProgressTracking.js';
import Diff from './Diff.jsx';
import { useSettings } from '../../state/settings.js';
import { getSafeMoodTenseLabels } from '../../lib/utils/moodTenseValidator.js';

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

  // Resistance countdown - Original implementation
  useEffect(() => {
    if (!settings.resistanceActive) return;
    if (settings.resistanceMsLeft <= 0) return;
    const id = setInterval(() => {
      const left = Math.max(0, useSettings.getState().resistanceMsLeft - 100);
      settings.set({ resistanceMsLeft: left });
      
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

  // Reverse mode submit function
  const reverseSubmit = async () => {
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
    
    try {
      await handleResult(resultObj);
    } catch (error) {
      console.error('Error tracking progress for reverse mode attempt:', error);
    }
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

  // Accent keys functionality
  const specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'];
  
  const insertChar = (char) => {
    if (isReverse) {
      // In reverse mode, insert into the infinitive input
      setInfinitiveGuess(prev => prev + char);
    } else if (isDouble) {
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

  // Text-to-Speech: pronounce the correct form
  const getSpeakText = () => {
    if (!currentItem) return '';
    // Reverse mode: pronounce the actual target form on screen
    if (isReverse) {
      return currentItem?.value || currentItem?.form?.value || '';
    }
    // Double mode: pronounce both targets if available
    if (isDouble && result?.targets?.length) {
      // Join with a short connector for clarity
      return result.targets.filter(Boolean).join(' y ');
    }
    // Normal mode: prefer the computed correct answer, else the target form
    if (result?.correctAnswer) return result.correctAnswer;
    return currentItem?.form?.value || currentItem?.value || '';
  };

  const speak = (text) => {
    try {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(text);
      const region = settings?.region || 'la_general';
      utter.lang = region === 'rioplatense' ? 'es-AR' : 'es-ES';
      utter.rate = 0.95; // slightly slower for clarity

      const pickPreferredSpanishVoice = (voices, targetLang) => {
        const lower = (s) => (s || '').toLowerCase()
        const spanish = voices.filter(v => lower(v.lang).startsWith('es'))
        if (spanish.length === 0) return null
        const prefNames = ['mónica','monica','paulina','luciana','helena','elvira','google español','google us español','google español de estados','microsoft sabina','microsoft helena']
        const preferOrder = (region === 'rioplatense')
          ? ['es-ar','es-419','es-mx','es-es']
          : ['es-es','es-mx','es-419','es-us']
        const byLangExact = spanish.find(v => lower(v.lang) === lower(targetLang))
        if (byLangExact) return byLangExact
        for (const lang of preferOrder) {
          const femaleByName = spanish.find(v => lower(v.lang).startsWith(lang) && prefNames.some(n => lower(v.name).includes(n)))
          if (femaleByName) return femaleByName
          const anyByLang = spanish.find(v => lower(v.lang).startsWith(lang))
          if (anyByLang) return anyByLang
        }
        // As last resort, any Spanish voice with preferred name
        const anyFemale = spanish.find(v => prefNames.some(n => lower(v.name).includes(n)))
        return anyFemale || spanish[0]
      };

      const pickAndSpeak = () => {
        const voices = synth.getVoices ? synth.getVoices() : [];
        const chosen = pickPreferredSpanishVoice(voices, utter.lang)
        if (chosen) {
          utter.voice = chosen
          // sync utter.lang to chosen to avoid engine mismatches
          utter.lang = chosen.lang || utter.lang
        }
        synth.cancel(); // ensure clean start
        synth.speak(utter);
      };

      // Some browsers load voices asynchronously
      if (synth.getVoices && synth.getVoices().length === 0) {
        let hasSpoken = false;
        const onVoices = () => {
          if (!hasSpoken) {
            hasSpoken = true;
            pickAndSpeak();
          }
          synth.removeEventListener('voiceschanged', onVoices);
        };
        synth.addEventListener('voiceschanged', onVoices);
        // Fallback speak after a short delay in case event doesn't fire
        setTimeout(() => {
          if (!hasSpoken) {
            hasSpoken = true;
            pickAndSpeak();
          }
        }, 500);
      } else {
        pickAndSpeak();
      }
    } catch (e) {
      console.warn('TTS unavailable:', e);
    }
  };

  const handleSpeak = () => {
    const text = getSpeakText();
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
          
          {/* Accent keypad for reverse mode */}
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
