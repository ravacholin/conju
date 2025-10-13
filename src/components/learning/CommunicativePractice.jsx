import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatMoodTense } from '../../lib/utils/verbLabels.js';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';
import { useProgressTracking } from '../../features/drill/useProgressTracking.js';
import { ERROR_TAGS } from '../../lib/progress/dataModels.js';
// import { grade } from '../../lib/core/grader.js';
// import { classifyError } from '../../features/drill/tracking.js';
import './CommunicativePractice.css';

const PARTICIPLE_SUFFIXES = ['ado', 'ido', 'to', 'so', 'cho'];

const removeDiacritics = (text) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const buildEndingRegex = (endings) => {
  if (!endings.length) return null;
  const uniqueEndings = Array.from(new Set(endings));
  return new RegExp(`\\b[a-z]{2,}(?:${uniqueEndings.join('|')})\\b`, 'g');
};

const buildWordRegex = (words) => {
  if (!words.length) return null;
  const sanitized = Array.from(new Set(words.map(removeDiacritics)));
  return new RegExp(`\\b(?:${sanitized.join('|')})\\b`, 'g');
};

const buildCompoundRegex = (auxiliaries, participleSuffixes = PARTICIPLE_SUFFIXES) => {
  if (!auxiliaries.length) return null;
  const auxPattern = auxiliaries.map(removeDiacritics).join('|');
  const suffixPattern = participleSuffixes.join('|');
  return new RegExp(`\\b(?:${auxPattern})\\b\\s+\\b[a-z]+(?:${suffixPattern})\\b`, 'g');
};

const buildTriggeredRegex = (triggers, endings) => {
  if (!triggers.length || !endings.length) return null;
  const triggerPattern = triggers
    .map(trigger => trigger.replace(/\s+/g, '\\s+'))
    .join('|');
  const endingPattern = endings.join('|');
  return new RegExp(`(?:${triggerPattern})[a-z]{2,}(?:${endingPattern})\\b`, 'g');
};

const createPatternEntry = (mood, regexes) => ({
  mood,
  patterns: regexes.filter(Boolean)
});

// Pre-compiled tense patterns for performance
const TENSE_PATTERNS = {
  pres: createPatternEntry('indicative', [
    buildEndingRegex(['o', 'as', 'a', 'amos', 'ais', 'an', 'es', 'e', 'emos', 'eis', 'en']),
    buildWordRegex(['soy', 'eres', 'es', 'somos', 'sois', 'son', 'estoy', 'estas', 'esta', 'estamos', 'estais', 'estan', 'voy', 'vas', 'va', 'vamos', 'vais', 'van'])
  ]),
  pretIndef: createPatternEntry('indicative', [
    buildEndingRegex(['e', 'aste', 'o', 'amos', 'asteis', 'aron', 'i', 'iste', 'io', 'imos', 'isteis', 'ieron']),
    buildWordRegex([
      'fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron',
      'tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron',
      'hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron',
      'dije', 'dijiste', 'dijo', 'dijimos', 'dijisteis', 'dijeron',
      'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron',
      'pude', 'pudiste', 'pudo', 'pudimos', 'pudisteis', 'pudieron',
      'quise', 'quisiste', 'quiso', 'quisimos', 'quisisteis', 'quisieron',
      'vine', 'viniste', 'vino', 'vinimos', 'vinisteis', 'vinieron',
      'supe', 'supiste', 'supo', 'supimos', 'supisteis', 'supieron'
    ])
  ]),
  impf: createPatternEntry('indicative', [
    buildEndingRegex(['aba', 'abas', 'abamos', 'abais', 'aban', 'ia', 'ias', 'iamos', 'iais', 'ian']),
    buildWordRegex([
      'era', 'eras', 'eramos', 'erais', 'eran',
      'iba', 'ibas', 'ibamos', 'ibais', 'iban',
      'veia', 'veias', 'veiamos', 'veiais', 'veian',
      'estaba', 'estabas', 'estabamos', 'estabais', 'estaban'
    ])
  ]),
  fut: createPatternEntry('indicative', [
    buildEndingRegex(['re', 'ras', 'ra', 'remos', 'reis', 'ran']),
    buildWordRegex([
      'sere', 'seras', 'sera', 'seremos', 'sereis', 'seran',
      'estare', 'estaras', 'estara', 'estaremos', 'estareis', 'estaran',
      'hare', 'haras', 'hara', 'haremos', 'hareis', 'haran',
      'podre', 'podras', 'podra', 'podremos', 'podreis', 'podran',
      'ire', 'iras', 'ira', 'iremos', 'ireis', 'iran'
    ])
  ]),
  pretPerf: createPatternEntry('indicative', [
    buildCompoundRegex(['he', 'has', 'ha', 'hemos', 'habeis', 'han'])
  ]),
  cond: createPatternEntry('conditional', [
    buildEndingRegex(['ria', 'rias', 'ria', 'riamos', 'riais', 'rian']),
    buildWordRegex(['seria', 'haria', 'podria', 'iria', 'daria', 'vendria', 'saldria', 'tendria', 'querria'])
  ]),
  plusc: createPatternEntry('indicative', [
    buildCompoundRegex(['habia', 'habias', 'habia', 'habiamos', 'habiais', 'habian'])
  ]),
  futPerf: createPatternEntry('indicative', [
    buildCompoundRegex(['habre', 'habras', 'habra', 'habremos', 'habreis', 'habran'])
  ]),
  subjPres: createPatternEntry('subjunctive', [
    buildTriggeredRegex(
      [
        'que\\s+',
        'ojala(?:\\s+que)?\\s+',
        'espero\\s+que\\s+',
        'quiero\\s+que\\s+',
        'necesito\\s+que\\s+',
        'sugiero\\s+que\\s+',
        'dudo\\s+que\\s+',
        'para\\s+que\\s+',
        'antes\\s+de\\s+que\\s+',
        'tal\\s+vez\\s+',
        'quizas\\s+'
      ],
      ['e', 'es', 'emos', 'eis', 'en', 'a', 'as', 'amos', 'ais', 'an']
    ),
    buildWordRegex([
      'sea', 'seas', 'seamos', 'seais', 'sean',
      'vaya', 'vayas', 'vayamos', 'vayais', 'vayan',
      'haya', 'hayas', 'hayamos', 'hayais', 'hayan',
      'de', 'des', 'demos', 'deis', 'den',
      'este', 'estes', 'estemos', 'esteis', 'esten',
      'haga', 'hagas', 'hagamos', 'hagais', 'hagan',
      'traiga', 'traigas', 'traigamos', 'traigais', 'traigan',
      'venga', 'vengas', 'vengamos', 'vengais', 'vengan'
    ])
  ]),
  subjImpf: createPatternEntry('subjunctive', [
    buildTriggeredRegex(
      [
        'si\\s+',
        'ojala\\s+',
        'como\\s+si\\s+',
        'queria\\s+que\\s+',
        'esperaba\\s+que\\s+',
        'necesitaba\\s+que\\s+',
        'dudaba\\s+que\\s+'
      ],
      ['ra', 'ras', 'ra', 'ramos', 'rais', 'ran', 'se', 'ses', 'se', 'semos', 'seis', 'sen']
    ),
    buildWordRegex([
      'fuera', 'fueras', 'fueramos', 'fuerais', 'fueran',
      'tuviera', 'tuvieras', 'tuvieramos', 'tuvierais', 'tuvieran',
      'pudiera', 'pudieras', 'pudieramos', 'pudierais', 'pudieran',
      'supiera', 'supieras', 'supieramos', 'supierais', 'supieran',
      'hiciera', 'hicieras', 'hicieramos', 'hicierais', 'hicieran',
      'dijera', 'dijeras', 'dijeramos', 'dijerais', 'dijeran',
      'viviera', 'vivieras', 'vivieramos', 'vivierais', 'vivieran',
      'volara', 'volaras', 'volaramos', 'volarais', 'volaran'
    ])
  ]),
  condPerf: createPatternEntry('conditional', [
    buildCompoundRegex(['habria', 'habrias', 'habria', 'habriamos', 'habriais', 'habrian'])
  ]),
  subjPerf: createPatternEntry('subjunctive', [
    buildCompoundRegex(['haya', 'hayas', 'haya', 'hayamos', 'hayais', 'hayan'])
  ]),
  subjPlusc: createPatternEntry('subjunctive', [
    buildCompoundRegex([
      'hubiera', 'hubieras', 'hubiera', 'hubieramos', 'hubierais', 'hubieran',
      'hubiese', 'hubieses', 'hubiese', 'hubiesemos', 'hubieseis', 'hubiesen'
    ])
  ])
};

// Helper function to detect tense usage patterns in conversational text
function collectMatches(patterns, text) {
  if (!patterns?.length) return [];
  const matches = new Set();

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.add(match[0].trim());
    }
  }

  return Array.from(matches);
}

function detectTenseUsage(userText, expectedTense) {
  const normalizedText = removeDiacritics(userText.toLowerCase());

  const expectedEntry = TENSE_PATTERNS[expectedTense];
  const expectedMatches = collectMatches(expectedEntry?.patterns, normalizedText);

  const wrongTenses = new Set();

  const isCoveredByExpected = (candidate) => {
    if (!expectedMatches.length) return false;
    return expectedMatches.some(expected =>
      expected === candidate ||
      expected.includes(candidate) ||
      candidate.includes(expected)
    );
  };

  const expectedHasMatches = expectedMatches.length > 0;

  for (const [tense, entry] of Object.entries(TENSE_PATTERNS)) {
    if (!entry || tense === expectedTense) continue;
    if (expectedHasMatches) continue;
    const matches = collectMatches(entry.patterns, normalizedText);
    if (!matches.length) continue;

    const hasDistinctMatch = matches.some(match => !isCoveredByExpected(match));
    if (hasDistinctMatch) {
      wrongTenses.add(tense);
    }
  }

  return {
    hasExpectedTense: expectedMatches.length > 0,
    wrongTenseUsed: wrongTenses.size > 0,
    wrongTenses: Array.from(wrongTenses)
  };
}

const chatData = {
  pres: {
    title: 'Rutina diaria',
    initialMessage: '¡Hola! Me gusta conocer la rutina de las personas. ¿Qué haces normalmente durante la semana?',
    script: [
      {
        userKeywords: ['trabajo', 'estudio', 'voy', 'como', 'duermo', 'hago', 'veo', 'hablo', 'vivo', 'tengo', 'soy', 'estoy'],
        botResponse: '¡Qué interesante! ¿Y en tu tiempo libre? ¿Cómo te gusta relajarte?',
      },
      {
        userKeywords: ['leo', 'escucho', 'veo', 'juego', 'salgo', 'camino', 'cocino', 'escribo', 'practico', 'visito'],
        botResponse: '¡Me parece genial! Es importante tener actividades que nos gusten. ¡Tienes una rutina muy equilibrada!',
      },
    ],
  },
  pretIndef: {
    title: 'Charla sobre el finde',
    initialMessage: '¡Hola! ¿Qué tal tu fin de semana? ¿Hiciste algo interesante?',
    script: [
      {
        userKeywords: ['fui', 'visité', 'comí', 'vi', 'jugué', 'tuve', 'vimos', 'caminé', 'leí', 'cociné', 'hice', 'salí', 'llegué'], // Verbs in preterite
        botResponse: '¡Suena genial! ¿Y con quién fuiste?',
      },
      {
        userKeywords: ['amigos', 'familia', 'novia', 'novio', 'solo'],
        botResponse: '¡Qué bueno! A mí también me gusta salir con gente. La próxima vez podríamos hacer algo.',
      },
    ],
  },
  subjPres: {
    title: 'Planeando una fiesta',
    initialMessage: '¡Hola! Estoy organizando una fiesta el sábado. Para que todo salga bien, necesito que me ayudes.',
    script: [
      {
        userKeywords: ['quieres que', 'necesitas que', 'dime qué'],
        botResponse: 'Perfecto. Sugiero que tú __traigas__ las bebidas. ¿Te parece?',
      },
      {
        userKeywords: ['traiga', 'compre', 'lleve', 'de acuerdo', 'claro'],
        botResponse: '¡Genial! Y ojalá que tus amigos __vengan__ también. ¡Será divertido!',
      },
    ],
  },
  impf: {
    title: 'Recordando la infancia',
    initialMessage: '¡Qué nostalgia! ¿Cómo era tu vida cuando eras pequeño? Me encanta escuchar historias de la infancia.',
    script: [
      {
        userKeywords: ['vivía', 'tenía', 'era', 'estaba', 'jugaba', 'iba', 'hacía', 'estudiaba'],
        botResponse: '¡Qué interesante! ¿Y qué era lo que más te gustaba hacer en esa época?',
      },
      {
        userKeywords: ['gustaba', 'encantaba', 'divertía', 'jugaba', 'veía', 'leía'],
        botResponse: '¡Qué bonitos recuerdos! La infancia siempre deja memorias especiales.',
      },
    ],
  },
  fut: {
    title: 'Hablando del futuro',
    initialMessage: '¡Hola! Me gusta planificar el futuro. ¿Qué planes tienes para el próximo año?',
    script: [
      {
        userKeywords: ['viajaré', 'estudiaré', 'trabajaré', 'haré', 'seré', 'tendré', 'iré'],
        botResponse: '¡Suena genial! ¿Y cómo crees que lograrás esos objetivos?',
      },
      {
        userKeywords: ['estudiaré', 'prepararé', 'practicaré', 'esforzaré', 'dedicaré'],
        botResponse: 'Me parece un plan excelente. ¡Seguro que lo conseguirás!',
      },
    ],
  },
  pretPerf: {
    title: 'Lo que has hecho hoy',
    initialMessage: '¡Hola! ¿Qué tal ha ido tu día? ¿Has hecho algo especial hoy?',
    script: [
      {
        userKeywords: ['he hecho', 'he trabajado', 'he estudiado', 'he quedado', 'he ido', 'he visto'],
        botResponse: '¡Qué productivo! ¿Y has tenido tiempo para relajarte un poco?',
      },
      {
        userKeywords: ['he descansado', 'he visto', 'he leído', 'he escuchado', 'he salido'],
        botResponse: 'Perfecto, es importante encontrar el equilibrio entre trabajo y descanso.',
      },
    ],
  },
  cond: {
    title: 'Situaciones hipotéticas',
    initialMessage: 'Me encantan las preguntas hipotéticas. Si fueras millonario, ¿qué harías?',
    script: [
      {
        userKeywords: ['compraría', 'viajaría', 'haría', 'ayudaría', 'donaría', 'invertiría'],
        botResponse: '¡Qué interesante! ¿Y si pudieras vivir en cualquier época de la historia?',
      },
      {
        userKeywords: ['viviría', 'sería', 'estaría', 'conocería', 'aprendería', 'experimentaría'],
        botResponse: '¡Qué respuesta tan reflexiva! Me gusta cómo piensas.',
      },
    ],
  },
  plusc: {
    title: 'Hablando del pasado',
    initialMessage: '¡Hola! Me encanta escuchar historias del pasado. ¿Te acuerdas de alguna vez que llegaste tarde y ya había pasado algo importante?',
    script: [
      {
        userKeywords: ['había terminado', 'había empezado', 'habían ido', 'había salido', 'había llegado', 'había comido', 'había visto'],
        botResponse: '¡Qué situación! Seguro que fue frustrante. ¿Y qué hiciste después?',
      },
      {
        userKeywords: ['me quedé', 'volví', 'esperé', 'pregunté', 'llamé', 'buscá'],
        botResponse: '¡Qué bien que encontraras una solución! A veces las cosas pasan por algo.',
      },
    ],
  },
  futPerf: {
    title: 'Planes a largo plazo',
    initialMessage: '¡Hola! Me gusta hablar del futuro. Para el año que viene, ¿qué cosas habrás logrado?',
    script: [
      {
        userKeywords: ['habré terminado', 'habré aprendido', 'habré viajado', 'habré conseguido', 'me habré mudado', 'habré ahorrado'],
        botResponse: '¡Qué planes tan ambiciosos! ¿Y para dentro de 5 años, qué habrás logrado?',
      },
      {
        userKeywords: ['habré construido', 'habré creado', 'habré fundado', 'habré escrito', 'me habré casado', 'habré tenido'],
        botResponse: '¡Me encanta tu visión del futuro! Estoy seguro de que lo lograrás.',
      },
    ],
  },
  subjImpf: {
    title: 'Mundo de fantasía',
    initialMessage: '¡Hola! Me gustan las historias de fantasía. Si fueras un personaje mágico, ¿qué podrías hacer?',
    script: [
      {
        userKeywords: ['volara', 'fuera', 'tuviera', 'pudiera', 'supiera', 'hiciera', 'dijera', 'viviera'],
        botResponse: '¡Qué fantástico! Si yo fuera mágico, me gustaría poder teletransportarme. ¿Y qué harías para ayudar a los demás?',
      },
      {
        userKeywords: ['ayudara', 'curara', 'salvara', 'protegiera', 'diera', 'compartiera', 'enseñara'],
        botResponse: '¡Qué noble! El mundo sería mejor si todos pensáramos así.',
      },
    ],
  },
  condPerf: {
    title: 'Reflexiones sobre el pasado',
    initialMessage: '¡Hola! A veces pienso en el pasado. Si hubieras sabido lo que sabes ahora, ¿qué habrías hecho diferente?',
    script: [
      {
        userKeywords: ['habría estudiado', 'habría viajado', 'habría ahorrado', 'me habría mudado', 'habría aprendido', 'habría dicho'],
        botResponse: 'Es interesante pensar en esas posibilidades. ¿Crees que habría cambiado mucho tu vida?',
      },
      {
        userKeywords: ['habría sido', 'habría tenido', 'habría estado', 'habrían sido', 'habría conocido', 'habría hecho'],
        botResponse: 'Al final, todas nuestras experiencias nos han traído hasta donde estamos hoy.',
      },
    ],
  },
  subjPerf: {
    title: 'Esperanzas y dudas',
    initialMessage: '¡Hola! Estoy un poco preocupado. Espero que mi amigo haya llegado bien a su destino. ¿Tú también te preocupas por tus seres queridos cuando viajan?',
    script: [
      {
        userKeywords: ['haya llegado', 'haya encontrado', 'se haya adaptado', 'haya comido', 'haya descansado', 'haya llamado'],
        botResponse: 'Sí, es normal preocuparse. Espero que todo haya salido bien. ¿Sueles enviar mensajes para saber cómo están?',
      },
      {
        userKeywords: ['haya respondido', 'haya visto', 'haya contestado', 'se haya comunicado', 'haya escrito'],
        botResponse: 'Qué bueno que te mantengas en contacto. La comunicación es muy importante.',
      },
    ],
  },
  subjPlusc: {
    title: 'Lamentos del pasado',
    initialMessage: '¡Hola! Ayer me arrepentí de algo. Ojalá que hubiera estudiado más para el examen. ¿Tú también tienes cosas de las que te arrepientes?',
    script: [
      {
        userKeywords: ['hubiera estudiado', 'hubiera trabajado', 'hubiera ahorrado', 'hubiera dicho', 'hubiera hecho', 'me hubiera esforzado'],
        botResponse: 'Todos tenemos esos momentos. Lo importante es aprender de ellos. ¿Qué harías diferente la próxima vez?',
      },
      {
        userKeywords: ['estudiaría', 'trabajaría', 'ahorraría', 'diría', 'haría', 'me esforzaría'],
        botResponse: 'Excelente actitud. Los errores nos enseñan y nos hacen crecer.',
      },
    ],
  },
};

function CommunicativePractice({ tense, eligibleForms, onBack, onFinish }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [chatEnded, setChatEnded] = useState(false);
  const [scriptIndex, setScriptIndex] = useState(0);

  const exercise = tense ? chatData[tense.tense] : null;
  
  // Create a dummy currentItem for progress tracking (memoized)
  const currentItem = useMemo(() => ({
    id: `communicative-practice-${tense?.tense}`,
    lemma: 'communicative-practice',
    tense: tense?.tense,
    mood: tense?.mood
  }), [tense?.tense, tense?.mood]);
  
  const { handleResult } = useProgressTracking(currentItem, (result) => {
    console.log('Communicative practice progress tracking result:', result);
  });

  useEffect(() => {
    if (exercise) {
      setMessages([{ author: 'bot', text: exercise.initialMessage }]);
      setScriptIndex(0);
      setChatEnded(false);
      setInputValue(''); // Reset input when exercise changes
    } else {
      setMessages([]);
      setInputValue('');
      setScriptIndex(0);
      setChatEnded(false);
    }
  }, [exercise]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !exercise) return;

    const currentScriptNode = exercise.script[scriptIndex];
    const userMessage = { author: 'user', text: inputValue };
    const newMessages = [...messages, userMessage];

    const userText = inputValue.toLowerCase();

    let keywordFound = null;
    const keywordMatched = currentScriptNode.userKeywords.some(kw => {
        // Normalize both texts to handle accents properly
        const normalizeText = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const normalizedUser = normalizeText(userText);
        const normalizedKeyword = normalizeText(kw);
        
        const regex = new RegExp(`\\b${normalizedKeyword.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(normalizedUser)) {
            keywordFound = kw;
            return true;
        }
        return false;
    });

    if (keywordMatched) {
      // Correct keyword found, move to next bot response
      const botMessage = { author: 'bot', text: currentScriptNode.botResponse };
      newMessages.push(botMessage);

      // Use official progress tracking system
      await handleResult({
        correct: true,
        userAnswer: inputValue,
        correctAnswer: keywordFound || 'correct usage',
        hintsUsed: 0,
        errorTags: [],
        latencyMs: 0, // Not applicable for chat-based exercise
        isIrregular: false,
        itemId: currentItem.id
      });

      // Keep SRS scheduling for specific verb forms
      if (keywordFound) {
        const formObject = eligibleForms?.find(f => f.value === keywordFound);
        if (formObject) {
          try {
            const userId = getCurrentUserId();
            if (userId) {
              await updateSchedule(userId, formObject, true, 0);
              console.log(`Analytics: Updated schedule for communicative practice: ${formObject.lemma} - ${keywordFound}`);
            }
          } catch (error) {
            console.error("Failed to update SRS schedule:", error);
          }
        }
      }

      if (scriptIndex >= exercise.script.length - 1) {
        setChatEnded(true);
      } else {
        setScriptIndex(prev => prev + 1);
      }
    } else {
      // Enhanced error analysis for communicative practice
      const errorTags = [ERROR_TAGS.INCORRECT_TENSE_OR_VERB];
      const userText = inputValue.toLowerCase();

      // Analyze what type of error the user made
      const hasVerbs = /\b\w+(o|as|a|amos|áis|an|é|aste|ó|amos|asteis|aron|ía|ías|íamos|íais|ían|ré|rás|rá|remos|réis|rán)\b/g.test(userText);

      if (!hasVerbs) {
        errorTags.push(ERROR_TAGS.NO_VERBS_DETECTED);
      } else {
        // Check if user used verbs but in wrong tense
        const expectedTense = tense?.tense;
        if (expectedTense) {
          const tenseAnalysis = detectTenseUsage(userText, expectedTense);
          if (tenseAnalysis.wrongTenseUsed) {
            errorTags.push(ERROR_TAGS.WRONG_TENSE_USED);
            errorTags.push(`expected_${expectedTense}`);
          }
        }
      }

      // Check if user provided a substantial response
      if (userText.trim().length < 5) {
        errorTags.push(ERROR_TAGS.TOO_SHORT_RESPONSE);
      }

      // Provide contextual hint
      const hintText = tense.tense === 'pres'
        ? `Cuéntame usando verbos en presente. Por ejemplo: "Yo trabajo en..." o "Normalmente voy a..."`
        : `Intenta usar un verbo en ${formatMoodTense(tense.mood, tense.tense)} para contarme qué pasó.`;
      const hint = { author: 'bot', text: hintText };
      newMessages.push(hint);

      // Track incorrect attempt with enhanced error classification
      await handleResult({
        correct: false,
        userAnswer: inputValue,
        correctAnswer: currentScriptNode.userKeywords.join(' o '),
        hintsUsed: 1, // Hint was given
        errorTags,
        latencyMs: 0,
        isIrregular: false,
        itemId: currentItem.id,
        conversationContext: {
          scriptIndex,
          expectedKeywords: currentScriptNode.userKeywords,
          botResponse: currentScriptNode.botResponse
        }
      });

    }

    setMessages(newMessages);
    setInputValue('');
  }, [inputValue, exercise, scriptIndex, messages, eligibleForms, tense, currentItem, handleResult]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chatEnded) {
        handleSendMessage();
      } else {
        onFinish();
      }
    }
  };

  if (!exercise) {
    return (
        <div className="center-column">
            <p>Ejercicio no disponible para este tiempo verbal aún.</p>
            <button onClick={onBack} className="btn-secondary">Volver</button>
        </div>
    );
  }

  return (
    <div className="App learn-flow">
      <div className="center-column">
        <div className="drill-header-learning">
            <button onClick={onBack} className="back-btn-drill">
                <img src="/back.png" alt="Volver" className="back-icon" />
            </button>
            <h2>Práctica Comunicativa: {formatMoodTense(tense.mood, tense.tense)}</h2>
        </div>

        <div className="chat-container">
            <div className="message-list">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.author}`}>
                        {msg.text}
                    </div>
                ))}
            </div>
            <div className="input-area">
                <input 
                    type="text"
                    placeholder="Escribe tu respuesta..."
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={chatEnded}
                    autoFocus
                />
                {chatEnded ? (
                    <button onClick={onFinish} className="btn-primary">Finalizar</button>
                ) : (
                    <button onClick={handleSendMessage}>Enviar</button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

export { detectTenseUsage, TENSE_PATTERNS };
export default CommunicativePractice;
