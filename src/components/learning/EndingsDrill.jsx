
import React, { useState, useEffect, useMemo, useRef, useCallback, Suspense, lazy } from 'react';
import { diffChars } from 'diff';
import { useSettings } from '../../state/settings.js';
import { categorizeLearningVerb } from '../../lib/data/learningIrregularFamilies.js';
import './LearningDrill.css'; // Reusing styles from main drill
import './EndingsDrill.css'; // Own specific styles
import './IrregularEndingsDrill.css'; // Irregular verb specific styles

const PronunciationPanel = lazy(() => import('../drill/PronunciationPanelSafe.jsx'))

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

    // Treat standard voseo in present indicative as regular (do not flag as irregular)
    const isStandardVos = form.person === '2s_vos' && tense === 'pres';

    let isIrregular = !isStandardVos && (actual !== expectedRegular && !isSameIgnoringAccents);
    let irregularity = null;
    let explanation = '';

    if (isStandardVos) {
      irregularity = null;
      explanation = 'Forma vos regular';
    } else if (isIrregular) {
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

function EndingsDrill({ verb, tense, onComplete, onBack, onHome, onGoToProgress }) {
  const [drillQueue, setDrillQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null); // null | { correct: boolean, ... }
  const inputRef = useRef(null);
  const [entered, setEntered] = useState(true);
  const [leaving] = useState(false);
  const settings = useSettings();
  const [showAccentKeys, setShowAccentKeys] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const pronunciationPanelRef = useRef(null);

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

  // Mood mapping from Spanish to English for verb data lookup
  const moodMapping = {
    'indicativo': 'indicative',
    'subjuntivo': 'subjunctive',
    'imperativo': 'imperative',
    'condicional': 'conditional',
    'nonfinite': 'nonfinite'
  };

  const verbForms = useMemo(() => {
    if (!verb || !tense) return [];
    
    // Map Spanish mood to English mood for data lookup
    const englishMood = moodMapping[tense.mood] || tense.mood;
    
    const paradigm = verb.paradigms?.find(p =>
        p.forms?.some(f => f.mood === englishMood && f.tense === tense.tense)
    );
    
    if (!paradigm) return [];
    const allowed = new Set(PRONOUNS_DISPLAY.map(p=>p.key));
    const filteredForms = paradigm.forms?.filter(f => f.mood === englishMood && f.tense === tense.tense && allowed.has(f.person)) || [];
    
    return filteredForms;
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

  const personToFormMap = useMemo(() => {
    const map = {};
    verbForms.forEach(f => { map[f.person] = f.value; });
    return map;
  }, [verbForms]);

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
          'LEARNING_PRET_MUY_IRREGULARES': 'Pretérito fuerte',
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

    // Si el usuario se equivoca, reintegrar la persona al final de la cola para práctica adicional
    if (!isCorrect) {
      setDrillQueue(prevQueue => [...prevQueue, currentPronoun]);
      console.log(`❌ Error en ${currentPronoun.text} - reintegrando al final de la cola`);
    } else {
      console.log(`✅ Correcto: ${currentPronoun.text} - ${correctAnswer}`);
    }
  };

  // Accent/tilde keypad support
  const specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'];
  const insertChar = (char) => {
    setInputValue(prev => prev + char);
    // keep focus in input
    setTimeout(() => inputRef.current?.focus(), 0);
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

  // --- Text-to-Speech: pronounce the correct form ---
  const getSpeakText = () => {
    if (result && result.value) return result.value;
    return currentForm?.value || '';
  };

  const speak = (text) => {
    try {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
      const synth = window.speechSynthesis;
      const utter = new SpeechSynthesisUtterance(text);
      const region = settings?.region || 'la_general';
      utter.lang = region === 'rioplatense' ? 'es-AR' : 'es-ES';
      utter.rate = 0.95;

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
        const anyFemale = spanish.find(v => prefNames.some(n => lower(v.name).includes(n)))
        return anyFemale || spanish[0]
      };

      const pickAndSpeak = () => {
        const voices = synth.getVoices ? synth.getVoices() : [];
        const chosen = pickPreferredSpanishVoice(voices, utter.lang)
        if (chosen) {
          utter.voice = chosen
          utter.lang = chosen.lang || utter.lang
        }
        synth.cancel();
        synth.speak(utter);
      };

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

  const handleTogglePronunciation = useCallback((show = null) => {
    // Si el show es explícito (desde botón cerrar), úsalo
    if (show !== null) {
      if (show === false) {
        setShowPronunciation(false)
      } else {
        setShowPronunciation(true)
      }
      return
    }

    // Lógica del click en el ícono de boca
    if (!showPronunciation) {
      // Panel cerrado → Abrir panel (la grabación se inicia automáticamente en el panel)
      setShowPronunciation(true)
    } else {
      // Panel abierto → Toggle grabación (NO cerrar panel)
      if (pronunciationPanelRef.current?.toggleRecording) {
        pronunciationPanelRef.current.toggleRecording()
      }
    }
  }, [showPronunciation]);

  // Create current item for pronunciation panel
  const currentItem = useMemo(() => {
    if (!currentForm || !verb || !tense || !currentPronoun) return null;

    return {
      verb: verb.lemma,
      mood: tense.mood,
      tense: tense.tense,
      person: currentPronoun.key,
      expectedValue: currentForm.value,
      prompt: `${currentPronoun.text} ${verb.lemma}`
    };
  }, [currentForm, verb, tense, currentPronoun]);

  const handleDrillResult = (isCorrect, accuracy, _extra = {}) => {
    // Handle pronunciation result similar to typing result
    if (isCorrect) {
      setResult({ correct: true, value: currentForm?.value });
    } else {
      setResult({ correct: false, value: currentForm?.value });
    }
    // Note: EndingsDrill tracks stats internally through other mechanisms
  };

  const handleContinueFromPronunciation = () => {
    // Continue to next item like normal drill flow
    handleContinue();
  };

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

  const endingFor = (tenseKey, pronounKey) => {
    const formVal = personToFormMap[pronounKey];
    
    // Use intelligent stem detection instead of hardcoded stems
    const detectedStem = detectRealStem(verb, tenseKey);
    
    if (formVal && detectedStem && formVal.startsWith(detectedStem)) {
      return formVal.slice(detectedStem.length);
    }
    
    // Fallback: try to extract ending from verb lemma
    if (formVal && verb?.lemma) {
      const basicStem = verb.lemma.slice(0, -2); // Remove -ar/-er/-ir
      if (formVal.startsWith(basicStem)) {
        return formVal.slice(basicStem.length);
      }
    }
    
    return '';
  };

  // For respuestas correctas en el drill guiado, no mostramos la forma; solo feedback.

  // Highlight irregular fragments by diffing expected regular vs actual
  const renderWithHighlights = (actual, expected) => {
    if (!actual || !expected) return actual;
    // If equal ignoring accents, avoid highlighting
    const strip = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (strip(actual) === strip(expected)) return actual;
    const parts = diffChars(expected, actual);
    const nodes = [];
    for (let idx = 0; idx < parts.length; idx++) {
      const p = parts[idx];
      if (p.added) {
        let val = p.value || '';
        // Diptongos: ampliar resaltado a "ie"/"ue" cuando corresponda
        const next = parts[idx + 1];
        if ((val.endsWith('i') || val.endsWith('u')) && next && !next.added && !next.removed && typeof next.value === 'string' && next.value.startsWith('e')) {
          val += 'e';
          parts[idx + 1] = { ...next, value: next.value.slice(1) };
        }
        nodes.push(<span key={idx} className="irreg-frag">{val}</span>);
      } else if (p.removed) {
        // skip deletions
      } else {
        if (!p.value) continue;
        nodes.push(<span key={idx}>{p.value}</span>);
      }
    }
    return nodes;
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

  // const tenseName = TENSE_LABELS[tense.tense] || tense.tense; // header label removed in favor of icon bar
  const groupKey = (verb.lemma || '').endsWith('ar') ? 'ar' : (verb.lemma || '').endsWith('er') ? 'er' : (verb.lemma || '').endsWith('ir') ? 'ir' : 'x';

  return (
    <div className="App" onKeyDown={handleGlobalKeyDown} tabIndex={-1}>
      <header className="header">
        <div className="icon-row">
          <button
            onClick={() => { onBack && onBack(); }}
            className="icon-btn"
            title="Volver"
            aria-label="Volver"
          >
            <img src="/back.png" alt="Volver" className="menu-icon" />
          </button>
          <button
            onClick={() => setShowAccentKeys(v => !v)}
            className="icon-btn"
            title="Tildes"
            aria-label="Tildes"
          >
            <img src="/enie.png" alt="Tildes" className="menu-icon" />
          </button>
          <button
            onClick={() => { onHome && onHome(); }}
            className="icon-btn"
            title="Inicio"
            aria-label="Inicio"
          >
            <img src="/home.png" alt="Inicio" className="menu-icon" />
          </button>
          <button
            onClick={() => handleTogglePronunciation()}
            className="icon-btn"
            title="Práctica de pronunciación"
          >
            <img src="/boca.png" alt="Pronunciación" className="menu-icon" />
          </button>
          <button
            onClick={() => { onGoToProgress && onGoToProgress(); }}
            className="icon-btn"
            title="Métricas"
            aria-label="Métricas"
          >
            <img src="/icons/chart.png" alt="Métricas" className="menu-icon" />
          </button>
        </div>
      </header>

      {showPronunciation && (
        <Suspense fallback={<div className="loading">Cargando pronunciación...</div>}>
          <PronunciationPanel
            ref={pronunciationPanelRef}
            currentItem={currentItem}
            onClose={() => handleTogglePronunciation(false)}
            handleResult={handleDrillResult}
            onContinue={handleContinueFromPronunciation}
          />
        </Suspense>
      )}

      <div className="main-content">
        <div className={`drill-container learning-drill page-transition ${entered ? 'page-in' : ''} ${leaving ? 'page-out' : ''} group-${groupKey}`}>

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
          
          <div className="action-buttons">
            {!result ? (
                <button className="btn" onClick={handleSubmit} disabled={!inputValue.trim()}>Continuar</button>
            ) : (
                <button className="btn" onClick={handleContinue}>Continuar</button>
            )}
          </div>

          {result && (
            <div className={`result ${result.correct ? 'correct' : 'incorrect'}`}>
              <div className="result-top">
                {result.correct ? (
                  <p>¡Correcto!</p>
                ) : (
                  <p>La respuesta correcta es: <strong>{result.value}</strong></p>
                )}
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
            </div>
          )}

          <div className="endings-reference">
            <h4>Terminaciones de referencia</h4>
            <div className="endings-reference-table">
              {PRONOUNS_DISPLAY.map((pronoun) => {
                const actualForm = personToFormMap[pronoun.key];
                const analysis = irregularityAnalysis?.analysis.find(a => a.person === pronoun.key);
                const isIrregular = analysis?.isIrregular;

                // Get the regular ending for this pronoun as reference
                const verbEnding = verb?.lemma?.slice(-2) || 'ar'; // ar, er, or ir
                const regularEndings = getRegularEndings(verbEnding, tense.tense);
                const baseOrder = ['1s', '2s_tu', '3s', '1p', '2p_vosotros', '3p'];
                const normalizedPerson = pronoun.key === '2s_vos' ? '2s_tu' : pronoun.key;
                const idx = baseOrder.indexOf(normalizedPerson);
                let regularEnding = idx >= 0 ? regularEndings[idx] : '';

                // Adjust for voseo in present indicative
                if (pronoun.key === '2s_vos' && tense.tense === 'pres') {
                  if (verbEnding === 'ar' && regularEnding === 'as') regularEnding = 'ás';
                  else if (verbEnding === 'er' && regularEnding === 'es') regularEnding = 'és';
                  else if (verbEnding === 'ir' && regularEnding === 'es') regularEnding = 'ís';
                }

                return (
                  <div key={pronoun.key} className={`ending-row ${pronoun.key === currentPronoun.key ? 'highlighted' : ''} ${isIrregular ? 'irregular' : ''}`}>
                    <span className="ending-person">{pronoun.text}</span>
                    {irregularityAnalysis?.hasIrregularities ? (
                      <div className="form-comparison">
                        <span className="ending-value">
                          {isIrregular && analysis ? (
                            <>
                              <span style={{ textDecoration: 'line-through', opacity: 0.5, marginRight: '0.5rem' }}>
                                {regularEnding}
                              </span>
                              {renderWithHighlights(actualForm, analysis.expected)}
                            </>
                          ) : (
                            <span>{regularEnding}</span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="ending-value">{regularEnding}</span>
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
