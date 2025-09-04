
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import './LearningDrill.css'; // Reusing styles from main drill
import './EndingsDrill.css'; // Own specific styles

const PRONOUNS_DISPLAY = [
  { key: '1s', text: 'yo' },
  { key: '2s_tu', text: 'tú' },
  { key: '3s', text: 'él/ella/usted' },
  { key: '1p', text: 'nosotros/nosotras' },
  { key: '2p_vosotros', text: 'vosotros/vosotras' },
  { key: '3p', text: 'ellos/ellas/ustedes' },
];

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

const storyData = {
  pres: {
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['o', 'as', 'a', 'amos', 'áis', 'an'] },
      { group: '-er', verb: 'aprender', stem: 'aprend', endings: ['o', 'es', 'e', 'emos', 'éis', 'en'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['o', 'es', 'e', 'imos', 'ís', 'en'] },
    ],
  },
  pretIndef: {
    deconstructions: [
        { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'] },
        { group: '-er', verb: 'comer', stem: 'com', endings: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
        { group: '-ir', verb: 'escribir', stem: 'escrib', endings: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
    ],
  },
  impf: {
    deconstructions: [
      { group: '-ar', verb: 'cantar', stem: 'cant', endings: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'] },
      { group: '-er', verb: 'leer', stem: 'le', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    ],
  },
  fut: {
    deconstructions: [
      { group: '-ar', verb: 'visitar', stem: 'visitar', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
      { group: '-er', verb: 'aprender', stem: 'aprender', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
      { group: '-ir', verb: 'vivir', stem: 'vivir', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
    ],
  },
   cond: {
    deconstructions: [
      { group: '-ar', verb: 'viajar', stem: 'viajar', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-er', verb: 'comer', stem: 'comer', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-ir', verb: 'vivir', stem: 'vivir', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    ],
  },
  subjPres: {
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['e', 'es', 'e', 'emos', 'éis', 'en'] },
      { group: '-er', verb: 'beber', stem: 'beb', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
    ],
  },
};

function EndingsDrill({ verb, tense, onComplete, onBack }) {
  const [drillQueue, setDrillQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null); // null | { correct: boolean, ... }
  const inputRef = useRef(null);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const initialQueue = [...PRONOUNS_DISPLAY, ...PRONOUNS_DISPLAY];
    setDrillQueue(shuffle(initialQueue));
    setCurrentIndex(0);
    setResult(null);
    setInputValue('');
    inputRef.current?.focus();
  }, [verb]);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, [verb]);

  const currentPronoun = drillQueue[currentIndex];

  const verbForms = useMemo(() => {
    if (!verb || !tense) return [];
    const paradigm = verb.paradigms.find(p =>
        p.forms.some(f => f.mood === tense.mood && f.tense === tense.tense)
    );
    if (!paradigm) return [];
    return paradigm.forms.filter(f => f.mood === tense.mood && f.tense === tense.tense);
  }, [verb, tense]);

  const currentForm = useMemo(() => {
    if (verbForms.length === 0 || !currentPronoun) return null;
    const key = currentPronoun.key;
    let form = verbForms.find(f => f.person === key);
    if (form) return form;
    if (key === '2s_tu') form = verbForms.find(f => f.person === '2s_vos');
    if (key === '2s_vos') form = verbForms.find(f => f.person === '2s_tu');
    if (form) return form;
    const genericKey = key.substring(0, 2);
    form = verbForms.find(f => f.person === genericKey);
    if (form) return form;
    if (genericKey === '2s') form = verbForms.find(f => f.person.startsWith('2s'));
    if (form) return form;
    return null;
  }, [verbForms, currentPronoun]);

  const deconstruction = useMemo(() => {
    if (!verb || !tense) return null;
    const tenseData = storyData[tense.tense];
    if (!tenseData) return null;
    const verbEnding = verb.lemma.slice(-2);
    const group = ['ar', 'er', 'ir'].includes(verbEnding) ? `-${verbEnding}` : null;
    if (!group) return null;
    return tenseData.deconstructions.find(d => d.group === group);
  }, [tense, verb]);

  const handleSubmit = () => {
    if (!currentForm || inputValue.trim() === '') return;
    const correctAnswer = currentForm.value;
    const altAnswers = currentForm.alt || [];
    const userAnswer = inputValue.trim();
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase() || 
                     (Array.isArray(altAnswers) && altAnswers.map(a => a.toLowerCase()).includes(userAnswer.toLowerCase()));

    setResult({ correct: isCorrect, value: correctAnswer });

    if (!isCorrect) {
      setDrillQueue(prevQueue => [...prevQueue, currentPronoun]);
    }
  };

  const handleContinue = () => {
    setResult(null);
    setInputValue('');
    const nextIndex = currentIndex + 1;
    if (nextIndex >= drillQueue.length) {
      // Animate out when finishing this guided block
      setLeaving(true);
      setTimeout(() => {
        onComplete();
      }, 320);
    } else {
      setCurrentIndex(nextIndex);
      // Ensure focus is set for the next item
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleGlobalKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!result) {
        handleSubmit();
      } else {
        handleContinue();
      }
    }
  };

  const getCorrectAnswerWithHighlight = () => {
      if (!result || !result.correct) return null;
      const correctAnswer = result.value;
      const ending = deconstruction.endings[PRONOUNS_DISPLAY.findIndex(p => p.key === currentPronoun.key)];
      
      if (correctAnswer && ending && correctAnswer.endsWith(ending)) {
          const stem = correctAnswer.slice(0, -ending.length);
          return <span className="correct-answer-display">{stem}<span className="ending-highlight">{ending}</span></span>;
      }
      return <span className="correct-answer-display">{correctAnswer}</span>;
  }
  
  if (!verb || !deconstruction || !currentPronoun) {
    return (
      <div className="App">
        <div className="drill-container learning-drill">
          <p>Cargando ejercicio...</p>
        </div>
      </div>
    );
  }

  const tenseName = TENSE_LABELS[tense.tense] || tense.tense;
  const groupKey = (verb.lemma || '').endsWith('ar') ? 'ar' : (verb.lemma || '').endsWith('er') ? 'er' : (verb.lemma || '').endsWith('ir') ? 'ir' : 'x';

  return (
    <div className="App" onKeyDown={handleGlobalKeyDown} tabIndex={-1}>
      <div className="main-content">
        <div className={`drill-container learning-drill page-transition ${entered ? 'page-in' : ''} ${leaving ? 'page-out' : ''} group-${groupKey}`}>
          <div className="drill-header">
             <button onClick={() => { setLeaving(true); setTimeout(() => onBack && onBack(), 300); }} className="back-to-menu-btn">
                <img src="/back.png" alt="Volver" className="back-icon" />
                Volver
            </button>
            <h2>Drill de Terminaciones: {tenseName}</h2>
          </div>

          <div className="verb-lemma">{verb.lemma}</div>
          <div className="person-display">{currentPronoun.text}</div>

          <div className="input-container">
            <input 
              ref={inputRef}
              type="text" 
              className={`conjugation-input ${result ? (result.correct ? 'correct' : 'incorrect') : ''}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              readOnly={result !== null}
              autoFocus
              placeholder="Escribe la conjugación..."
            />
          </div>
          
          <div className="action-buttons">
            {!result ? (
                <button className="btn" onClick={handleSubmit} disabled={!inputValue.trim()}>Revisar</button>
            ) : (
                <button className="btn" onClick={handleContinue}>Continuar</button>
            )}
          </div>

          {result && (
            <div className={`result ${result.correct ? 'correct' : 'incorrect'}`}>
                {result.correct ? (
                    <p>{getCorrectAnswerWithHighlight()} ¡Correcto!</p>
                ) : (
                    <p>La respuesta correcta es: <strong>{result.value}</strong></p>
                )}
            </div>
          )}

          <div className="endings-reference">
            <h4>Terminaciones de Referencia</h4>
            <div className="endings-reference-table">
                {PRONOUNS_DISPLAY.map((pronoun, index) => (
                    <div key={pronoun.key} className={`ending-row ${pronoun.key === currentPronoun.key ? 'highlighted' : ''}`}>
                        <span className="ending-person">{pronoun.text}</span>
                        <span className="ending-value">{deconstruction.endings[index]}</span>
                    </div>
                ))}
            </div>
          </div>

          <div className="round-counter">Restantes en la cola: {drillQueue.length - currentIndex}</div>

        </div>
      </div>
    </div>
  );
}

export default EndingsDrill;
