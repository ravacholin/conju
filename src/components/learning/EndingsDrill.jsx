
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { diffChars } from 'diff';
import { useSettings } from '../../state/settings.js';
import { TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import { categorizeLearningVerb } from '../../lib/data/learningIrregularFamilies.js';
import './LearningDrill.css'; // Reusing styles from main drill
import './EndingsDrill.css'; // Own specific styles
import './IrregularEndingsDrill.css'; // Irregular verb specific styles

function getPronounsForDialect(settings){
  const arr = [
    { key: '1s', text: 'yo' },
    settings?.useVoseo ? { key: '2s_vos', text: 'vos' } : { key: '2s_tu', text: 'tú' },
    { key: '3s', text: 'él/ella/usted' },
    { key: '1p', text: 'nosotros/nosotras' },
  ];
  if (settings?.useVosotros) {
    arr.push({ key: '2p_vosotros', text: 'vosotros/vosotras' });
  }
  arr.push({ key: '3p', text: 'ellos/ellas/ustedes' });
  return arr;
}

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Helper functions for irregular verb analysis
function getRegularStem(lemma) {
  return lemma.slice(0, -2); // Remove -ar, -er, -ir
}

function getRegularEndings(verbEnding, tense) {
  const endings = {
    'ar': {
      'pres': ['o', 'as', 'a', 'amos', 'áis', 'an'],
      'pretIndef': ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
      'impf': ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
      'fut': ['é', 'ás', 'á', 'emos', 'éis', 'án'],
      'cond': ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      'subjPres': ['e', 'es', 'e', 'emos', 'éis', 'en']
    },
    'er': {
      'pres': ['o', 'es', 'e', 'emos', 'éis', 'en'],
      'pretIndef': ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
      'impf': ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      'fut': ['é', 'ás', 'á', 'emos', 'éis', 'án'],
      'cond': ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      'subjPres': ['a', 'as', 'a', 'amos', 'áis', 'an']
    },
    'ir': {
      'pres': ['o', 'es', 'e', 'imos', 'ís', 'en'],
      'pretIndef': ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
      'impf': ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      'fut': ['é', 'ás', 'á', 'emos', 'éis', 'án'],
      'cond': ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      'subjPres': ['a', 'as', 'a', 'amos', 'áis', 'an']
    }
  };
  return endings[verbEnding]?.[tense] || [];
}

function analyzeIrregularities(verb, actualForms, tense) {
  const lemma = verb.lemma;
  const verbEnding = lemma.slice(-2);
  const stemForTense = (t) => (t === 'fut' || t === 'cond') ? lemma : getRegularStem(lemma);
  const regularStem = stemForTense(tense);
  const regularEndings = getRegularEndings(verbEnding, tense);
  const families = categorizeLearningVerb(lemma, verb);

  const baseOrder = ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'];
  const strip = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizePerson = (p) => (p === '2s_vos' ? '2s_tu' : p);

  const analysis = [];

  actualForms.forEach((form) => {
    const normalized = normalizePerson(form.person);
    const idx = baseOrder.indexOf(normalized);
    const expectedEnding = idx >= 0 ? regularEndings[idx] : '';
    const expectedRegular = (regularStem || '') + (expectedEnding || '');
    const actual = form.value;

    // Consider accent-only differences as regular (esp. voseo)
    const isSameIgnoringAccents = strip(actual) === strip(expectedRegular);

    let isIrregular = actual !== expectedRegular && !isSameIgnoringAccents;
    let irregularity = null;
    let explanation = '';

    if (isIrregular) {
      if (families.includes('LEARNING_YO_G') && form.person === '1s' && actual.endsWith('go')) {
        irregularity = 'yo_irregular';
        explanation = 'YO irregular: añade -g';
      } else if (families.includes('LEARNING_E_IE') && !form.person.includes('p') && form.person !== '2p_vosotros') {
        if (actual.includes('ie') && !expectedRegular.includes('ie')) {
          irregularity = 'diphthong_e_ie';
          explanation = 'Diptongo: e → ie (sílaba tónica)';
        }
      } else if (families.includes('LEARNING_O_UE') && !form.person.includes('p') && form.person !== '2p_vosotros') {
        if (actual.includes('ue') && !expectedRegular.includes('ue')) {
          irregularity = 'diphthong_o_ue';
          explanation = 'Diptongo: o → ue (sílaba tónica)';
        }
      } else if (families.includes('LEARNING_YO_ZCO') && form.person === '1s' && actual.includes('zc')) {
        irregularity = 'zco_verbs';
        explanation = 'YO irregular: añade -zco';
      } else {
        irregularity = 'other';
        explanation = 'Forma irregular';
      }
    }

    analysis.push({
      person: form.person,
      expected: expectedRegular,
      actual,
      irregularity,
      explanation,
      isIrregular
    });
  });

  return {
    verbType: verb.type,
    families,
    analysis,
    hasIrregularities: analysis.some(a => a.isIrregular)
  };
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
  const [entered, setEntered] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const settings = useSettings();

  // console.log('EndingsDrill settings:', { useVoseo: settings.useVoseo, useVosotros: settings.useVosotros });

  const PRONOUNS_DISPLAY = useMemo(() => getPronounsForDialect(settings), [settings?.useVoseo, settings?.useVosotros]);

  useEffect(() => {
    const initialQueue = [...PRONOUNS_DISPLAY, ...PRONOUNS_DISPLAY];
    setDrillQueue(shuffle(initialQueue));
    setCurrentIndex(0);
    setResult(null);
    setInputValue('');
    inputRef.current?.focus();
  }, [verb?.lemma, PRONOUNS_DISPLAY]);

  useEffect(() => {
    // Ensure it's visible immediately
    setEntered(true);
  }, [verb?.lemma]);

  const currentPronoun = drillQueue[currentIndex];

  const verbForms = useMemo(() => {
    if (!verb || !tense) return [];
    const paradigm = verb.paradigms?.find(p =>
        p.forms?.some(f => f.mood === tense.mood && f.tense === tense.tense)
    );
    if (!paradigm) return [];
    const allowed = new Set(PRONOUNS_DISPLAY.map(p=>p.key));
    return paradigm.forms?.filter(f => f.mood === tense.mood && f.tense === tense.tense && allowed.has(f.person)) || [];
  }, [verb?.lemma, tense?.mood, tense?.tense, PRONOUNS_DISPLAY]);

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
  }, [verbForms, currentPronoun?.key]);

  const irregularityAnalysis = useMemo(() => {
    if (!verb || !tense || verbForms.length === 0) return null;
    return analyzeIrregularities(verb, verbForms, tense.tense);
  }, [verb?.lemma, tense?.tense, verbForms]);

  const deconstruction = useMemo(() => {
    if (!verb || !tense) return null;
    
    // For irregular verbs, show custom analysis
    if (irregularityAnalysis?.hasIrregularities) {
      const lemma = verb.lemma;
      const verbEnding = lemma.slice(-2);
      const familyDescriptions = irregularityAnalysis.families.map(family => {
        const familyMap = {
          'LEARNING_YO_G': 'YO irregular con -g',
          'LEARNING_E_IE': 'Diptongo e→ie', 
          'LEARNING_O_UE': 'Diptongo o→ue',
          'LEARNING_YO_ZCO': 'YO irregular con -zco',
          'LEARNING_E_I': 'Cambio e→i',
          'LEARNING_ORTH_CAR': 'Ortográfico -car→-qu',
          'LEARNING_ORTH_GAR': 'Ortográfico -gar→-gu',
          'LEARNING_PRET_FUERTE': 'Pretérito fuerte',
          'LEARNING_SER_IR': 'Muy irregular (ser/ir)'
        };
        return familyMap[family] || family;
      }).join(', ');
      
      return {
        group: `-${verbEnding}`,
        verb: lemma,
        stem: lemma.slice(0, -2),
        endings: verbForms.map(f => f.value.replace(lemma.slice(0, -2), '')),
        isIrregular: true,
        irregularityType: familyDescriptions
      };
    }
    
    // For regular verbs, use original logic
    const tenseData = storyData[tense.tense];
    if (!tenseData) return null;
    const verbEnding = verb.lemma.slice(-2);
    const group = ['ar', 'er', 'ir'].includes(verbEnding) ? `-${verbEnding}` : null;
    if (!group) return null;
    return tenseData.deconstructions.find(d => d.group === group);
  }, [tense?.tense, verb?.lemma, verbForms, irregularityAnalysis]);

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
      // Use setTimeout to avoid synchronous state updates that can cause infinite loops
      setTimeout(() => {
        onComplete();
      }, 0);
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

  const personToFormMap = useMemo(() => {
    const map = {};
    verbForms.forEach(f => { map[f.person] = f.value; });
    return map;
  }, [verbForms]);

  const detectRealStem = (verb, tenseKey) => {
    if (!verb || !verbForms.length) return null;
    
    // For future and conditional, the stem is the infinitive for regular verbs,
    // or an irregular stem that we need to detect
    if (tenseKey === 'fut' || tenseKey === 'cond') {
      const endings = ['é', 'ás', 'á', 'emos', 'éis', 'án']; // future endings
      const condEndings = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían']; // conditional endings
      const expectedEndings = tenseKey === 'fut' ? endings : condEndings;
      
      // Try to find the stem by looking for common prefix
      let candidateStem = '';
      const firstForm = verbForms.find(f => f.person === '1s');
      if (firstForm) {
        const value = firstForm.value;
        // Try different stem lengths
        for (let i = 1; i < value.length; i++) {
          const potentialStem = value.slice(0, i);
          
          // Check if this stem works for all forms
          const worksForAll = verbForms.every(form => {
            const personIndex = ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'].indexOf(form.person);
            if (personIndex === -1) return true; // skip unknown persons
            const expectedEnding = expectedEndings[personIndex];
            return form.value === potentialStem + expectedEnding;
          });
          
          if (worksForAll) {
            candidateStem = potentialStem;
            break;
          }
        }
      }
      return candidateStem || verb.lemma; // fallback to full infinitive
    }
    
    // For other tenses, use simpler logic - remove infinitive ending
    return verb.lemma.slice(0, -2); // remove -ar/-er/-ir
  };

  const endingFor = (group, tenseKey, pronounKey) => {
    const baseOrder = ['1s','2s_tu','3s','1p','2p_vosotros','3p'];
    const idx = baseOrder.indexOf(pronounKey === '2s_vos' ? '2s_tu' : pronounKey);
    const fallback = deconstruction?.endings?.[idx] || '';
    const formVal = personToFormMap[pronounKey];
    
    // Use intelligent stem detection instead of hardcoded stems
    const detectedStem = detectRealStem(verb, tenseKey);
    
    if (formVal && detectedStem && formVal.startsWith(detectedStem)) {
      return formVal.slice(detectedStem.length);
    }
    return fallback;
  };

  const getCorrectAnswerWithHighlight = () => {
      if (!result || !result.correct) return null;
      const correctAnswer = result.value;
      const ending = endingFor(deconstruction?.group, tense?.tense, currentPronoun.key);
      if (correctAnswer && ending && correctAnswer.endsWith(ending)) {
          const stem = correctAnswer.slice(0, -ending.length);
          return <span className="correct-answer-display">{stem}<span className="ending-highlight">{ending}</span></span>;
      }
      return <span className="correct-answer-display">{correctAnswer}</span>;
  }

  // Highlight irregular fragments by diffing expected regular vs actual
  const renderWithHighlights = (actual, expected) => {
    if (!actual || !expected) return actual;
    // If equal ignoring accents, avoid highlighting
    const strip = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (strip(actual) === strip(expected)) return actual;
    const parts = diffChars(expected, actual);
    return parts.map((p, idx) => {
      if (p.added) {
        return <span key={idx} className="irreg-frag">{p.value}</span>;
      }
      if (p.removed) {
        return null; // do not render deletions
      }
      return <span key={idx}>{p.value}</span>;
    });
  };
  
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
             <button onClick={() => { onBack && onBack(); }} className="back-to-menu-btn">
                <img src="/back.png" alt="Volver" className="back-icon" />
                Volver
            </button>
            <h2>Drill de Terminaciones: {tenseName}</h2>
          </div>

          <div className="verb-lemma">{verb.lemma}</div>
          
          {/* No panel extra: mantener el layout idéntico al de regulares */}
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
                <button className="btn" onClick={handleSubmit} disabled={!inputValue.trim()}>Continuar</button>
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
            <h4>Terminaciones de referencia</h4>
            <div className="endings-reference-table">
              {PRONOUNS_DISPLAY.map((pronoun) => {
                const actualForm = personToFormMap[pronoun.key];
                const analysis = irregularityAnalysis?.analysis.find(a => a.person === pronoun.key);
                const isIrregular = analysis?.isIrregular;
                
                return (
                  <div key={pronoun.key} className={`ending-row ${pronoun.key === currentPronoun.key ? 'highlighted' : ''}`}>
                    <span className="ending-person">{pronoun.text}</span>
                    {irregularityAnalysis?.hasIrregularities ? (
                      <div className="form-comparison">
                        <span className="ending-value">
                          {isIrregular && analysis ? renderWithHighlights(actualForm, analysis.expected) : actualForm}
                        </span>
                      </div>
                    ) : (
                      <span className="ending-value">{endingFor(deconstruction.group, tense.tense, pronoun.key)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="round-counter">Faltan: {drillQueue.length - currentIndex}</div>

        </div>
      </div>
    </div>
  );
}

export default EndingsDrill;
