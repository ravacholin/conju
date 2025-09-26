import React, { useState, useEffect } from 'react';
import { formatMoodTense } from '../../lib/utils/verbLabels.js';
import { updateSchedule } from '../../lib/progress/srs.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';
import { useProgressTracking } from '../../features/drill/useProgressTracking.js';
import { ERROR_TAGS } from '../../lib/progress/dataModels.js';
// import { classifyError } from '../../features/drill/tracking.js';
import './MeaningfulPractice.css';

const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeText = text =>
  (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const tokenizeText = text => normalizeText(text).split(/[^a-zñü]+/u).filter(Boolean);

const hasNormalizedMatch = (normalizedSource, candidate) => {
  const normalizedCandidate = normalizeText(candidate);
  if (!normalizedCandidate) return false;
  const regex = new RegExp(`\\b${escapeRegex(normalizedCandidate)}\\b`, 'i');
  return regex.test(normalizedSource);
};

const findFormInEligibleForms = (eligibleForms, surfaceForm) => {
  if (!eligibleForms || !surfaceForm) return null;
  const normalizedTarget = normalizeText(surfaceForm);
  return eligibleForms.find(form => {
    if (!form) return false;
    if (normalizeText(form.value) === normalizedTarget) {
      return true;
    }
    if (Array.isArray(form.alt)) {
      return form.alt.some(alt => normalizeText(alt) === normalizedTarget);
    }
    return false;
  }) || null;
};

// Helper function to detect wrong tense patterns in user input
function detectTensePatterns(userText, expectedTense) {
  const text = userText.toLowerCase();
  const wrongTenses = [];

  const tensePatterns = {
    'pres': {
      correct: /\b\w+[oaeáéí]\b/g,
      wrong: {
        'pretIndef': /\b\w+[óé]\b|\b\w+(aste|aron|ieron|amos|asteis)\b/g,
        'impf': /\b\w+(aba|ías|ía|íamos|íais|aban|ía)\b/g,
        'fut': /\b\w+(ré|rás|rá|remos|réis|rán)\b/g
      }
    },
    'pretIndef': {
      correct: /\b\w+[óé]\b|\b\w+(aste|aron|ieron|amos|asteis)\b/g,
      wrong: {
        'pres': /\b\w+[oae]\b/g,
        'impf': /\b\w+(aba|ías|ía|íamos|íais|aban)\b/g,
        'fut': /\b\w+(ré|rás|rá|remos|réis|rán)\b/g
      }
    },
    'impf': {
      correct: /\b\w+(aba|ías|ía|íamos|íais|aban)\b/g,
      wrong: {
        'pres': /\b\w+[oae]\b/g,
        'pretIndef': /\b\w+[óé]\b|\b\w+(aste|aron|ieron|amos|asteis)\b/g,
        'fut': /\b\w+(ré|rás|rá|remos|réis|rán)\b/g
      }
    },
    'fut': {
      correct: /\b\w+(ré|rás|rá|remos|réis|rán)\b/g,
      wrong: {
        'pres': /\b\w+[oae]\b/g,
        'pretIndef': /\b\w+[óé]\b|\b\w+(aste|aron|ieron|amos|asteis)\b/g,
        'impf': /\b\w+(aba|ías|ía|íamos|íais|aban)\b/g
      }
    }
  };

  const patterns = tensePatterns[expectedTense];
  if (!patterns) return { wrongTenses: [] };

  // Check for wrong tense patterns
  for (const [wrongTense, pattern] of Object.entries(patterns.wrong)) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      wrongTenses.push(wrongTense);
    }
  }

  return { wrongTenses: [...new Set(wrongTenses)] };
}

// Función para seleccionar ejercicio aleatorio (principal o alternativo)
function selectRandomExercise(tenseData) {
  if (!tenseData) return null;

  const { alternativeExercises = [], ...baseExercise } = tenseData;

  const normalizedBase = {
    ...baseExercise,
    layout: baseExercise.layout,
    variant: baseExercise.variant || 'default'
  };

  const normalizedAlternatives = alternativeExercises.map(altExercise => {
    const { variant, layout, ...rest } = altExercise;
    return {
      ...rest,
      layout: layout || baseExercise.layout,
      variant: variant || altExercise.type || 'alternate'
    };
  });

  const allExercises = [normalizedBase, ...normalizedAlternatives];

  const randomIndex = Math.floor(Math.random() * allExercises.length);
  return allExercises[randomIndex];
}

const timelineData = {
  pres: {
    layout: 'daily_routine',
    variant: 'default',
    title: 'La rutina diaria de Carlos',
    description: 'Describe un día típico de Carlos usando los verbos indicados en presente.',
    prompts: [
      { icon: '⏰', text: 'Por la mañana (despertarse, levantarse)', expected: ['despierta', 'levanta'] },
      { icon: '🍳', text: 'En el desayuno (comer, beber)', expected: ['come', 'bebe'] },
      { icon: '💼', text: 'En el trabajo (trabajar, escribir)', expected: ['trabaja', 'escribe'] },
      { icon: '🏠', text: 'Al llegar a casa (cocinar, ver televisión)', expected: ['cocina', 've'] },
      { icon: '🌙', text: 'Por la noche (leer, dormir)', expected: ['lee', 'duerme'] },
    ],
    // Ejercicios alternativos para mayor variedad
    alternativeExercises: [
      {
        layout: 'daily_routine',
        variant: 'workplace_scenario',
        title: 'Un día en la oficina',
        description: 'Completa las frases sobre lo que pasa en una oficina típica.',
        prompts: [
          { icon: '💻', text: 'Los programadores _____ código todo el día', expected: ['escriben', 'programan'] },
          { icon: '📧', text: 'La secretaria _____ emails importantes', expected: ['envía', 'responde'] },
          { icon: '📊', text: 'El jefe _____ las reuniones semanales', expected: ['dirige', 'organiza'] },
          { icon: '☕', text: 'Todos _____ café en la máquina', expected: ['toman', 'beben'] },
          { icon: '🏃‍♂️', text: 'A las 6 PM, everyone _____ a casa', expected: ['vuelve', 'regresa'] },
        ]
      },
      {
        layout: 'daily_routine',
        variant: 'family_life',
        title: 'La vida familiar',
        description: 'Describe las actividades de una familia típica.',
        prompts: [
          { icon: '👶', text: 'El bebé _____ mucho por las noches', expected: ['llora', 'duerme'] },
          { icon: '👨‍🍳', text: 'Papá _____ la cena los domingos', expected: ['prepara', 'cocina'] },
          { icon: '🎯', text: 'Los niños _____ con sus juguetes', expected: ['juegan', 'se divierten'] },
          { icon: '📺', text: 'La abuela _____ sus telenovelas', expected: ['ve', 'mira'] },
          { icon: '🐕', text: 'El perro _____ en el jardín', expected: ['corre', 'juega'] },
        ]
      }
    ]
  },
  pretIndef: {
    layout: 'timeline',
    variant: 'default',
    title: 'El día de ayer de María',
    events: [
      { time: '7:00', icon: '☕️', prompt: 'tomar café' },
      { time: '12:00', icon: '🍽️', prompt: 'comer' },
      { time: '18:00', icon: '🏋️', prompt: 'ir al gimnasio' },
      { time: '22:00', icon: '🛏️', prompt: 'acostarse' },
    ],
    expectedVerbs: ['tomó', 'comió', 'fue', 'se acostó'],
    // Ejercicios alternativos más diversos
    alternativeExercises: [
      {
        layout: 'daily_routine',
        variant: 'travel_story',
        title: 'Las vacaciones de verano',
        description: 'Completa la historia del viaje de Luis a Barcelona.',
        prompts: [
          { icon: '✈️', text: 'Luis _____ a Barcelona en avión', expected: ['viajó', 'fue'] },
          { icon: '🏨', text: 'Se _____ en un hotel cerca de la playa', expected: ['quedó', 'alojó'] },
          { icon: '🏛️', text: '_____ la Sagrada Familia y el Park Güell', expected: ['visitó', 'vio'] },
          { icon: '🥘', text: '_____ paella en un restaurante típico', expected: ['comió', 'probó'] },
          { icon: '📸', text: '_____ muchas fotos de los monumentos', expected: ['tomó', 'sacó'] },
        ]
      },
      {
        layout: 'daily_routine',
        variant: 'party_night',
        title: 'La fiesta de anoche',
        description: 'Cuenta lo que pasó en la fiesta de cumpleaños de Ana.',
        prompts: [
          { icon: '🎉', text: 'Ana _____ una fiesta increíble para sus 25 años', expected: ['organizó', 'hizo'] },
          { icon: '👥', text: '_____ más de 50 personas a celebrar', expected: ['vinieron', 'llegaron'] },
          { icon: '🍰', text: 'Todos _____ "Cumpleaños feliz" a medianoche', expected: ['cantaron', 'dijeron'] },
          { icon: '💃', text: 'La gente _____ hasta las 3 de la mañana', expected: ['bailó', 'se divirtió'] },
          { icon: '🏠', text: 'Los últimos invitados _____ a las 4 AM', expected: ['se fueron', 'salieron'] },
        ]
      },
      {
        layout: 'daily_routine',
        variant: 'mystery_story',
        title: 'El misterio del libro perdido',
        description: 'Resuelve el misterio completando lo que pasó.',
        prompts: [
          { icon: '📚', text: 'El libro _____ de la biblioteca sin explicación', expected: ['desapareció', 'se perdió'] },
          { icon: '🔍', text: 'La bibliotecaria _____ por toda la biblioteca', expected: ['buscó', 'investigó'] },
          { icon: '👮‍♂️', text: 'Un detective _____ a hacer preguntas', expected: ['llegó', 'vino'] },
          { icon: '💡', text: 'Finalmente _____ la verdad: un estudiante lo tenía', expected: ['descubrió', 'encontró'] },
          { icon: '😅', text: 'El estudiante se lo _____ por accidente', expected: ['llevó', 'olvidó'] },
        ]
      }
    ]
  },
  subjPres: {
    layout: 'prompts',
    variant: 'default',
    title: 'Dando Consejos',
    prompts: [
        { prompt: 'Tu amigo está cansado. (recomendar que...)', expected: ['descanse', 'duerma'] },
        { prompt: 'Tu hermana quiere aprender español. (sugerir que...)', expected: ['practique', 'estudie'] },
        { prompt: 'Tus padres van a viajar. (esperar que...)', expected: ['disfruten', 'viajen'] },
    ],
  },
  impf: {
    layout: 'daily_routine',
    variant: 'default',
    title: 'Los recuerdos de la infancia',
    description: 'Describe cómo era la vida cuando eras pequeño usando los verbos en imperfecto.',
    prompts: [
      { icon: '🏠', text: 'Donde vivías de niño (vivir, tener)', expected: ['vivía', 'tenía'] },
      { icon: '🎮', text: 'Con qué jugabas (jugar, divertirse)', expected: ['jugaba', 'divertía'] },
      { icon: '📚', text: 'Qué estudiabas (estudiar, aprender)', expected: ['estudiaba', 'aprendía'] },
      { icon: '👨‍👩‍👧‍👦', text: 'Cómo era tu familia (ser, estar)', expected: ['era', 'estaba'] },
      { icon: '🌞', text: 'Qué hacías los veranos (ir, hacer)', expected: ['iba', 'hacía'] },
    ],
  },
  fut: {
    layout: 'prompts',
    variant: 'default',
    title: 'Planes para el futuro',
    prompts: [
        { prompt: 'El próximo año... (viajar, conocer)', expected: ['viajaré', 'conoceré', 'viajarás', 'conocerás'] },
        { prompt: 'En mis próximas vacaciones... (descansar, visitar)', expected: ['descansaré', 'visitaré', 'descansarás', 'visitarás'] },
        { prompt: 'Cuando termine mis estudios... (trabajar, ser)', expected: ['trabajaré', 'seré', 'trabajarás', 'serás'] },
        { prompt: 'En el futuro... (tener, hacer)', expected: ['tendré', 'haré', 'tendrás', 'harás'] },
    ],
    alternativeExercises: [
      {
        layout: 'daily_routine',
        variant: 'predictions',
        title: 'Predicciones para el año 2030',
        description: 'Haz predicciones sobre el futuro usando el futuro simple.',
        prompts: [
          { icon: '🚗', text: 'Los coches _____ completamente autónomos', expected: ['serán', 'estarán'] },
          { icon: '🌍', text: 'La gente _____ más conciencia ecológica', expected: ['tendrá', 'mostrará'] },
          { icon: '🏠', text: 'Las casas _____ con energía solar', expected: ['funcionarán', 'trabajarán'] },
          { icon: '💻', text: 'Todo el mundo _____ desde casa', expected: ['trabajará', 'estudiará'] },
          { icon: '🎮', text: 'Los videojuegos _____ más realistas que nunca', expected: ['serán', 'parecerán'] },
        ]
      },
      {
        layout: 'daily_routine',
        variant: 'life_goals',
        title: 'Mis metas personales',
        description: 'Completa tus planes y metas para el futuro.',
        prompts: [
          { icon: '🏆', text: 'En cinco años _____ mis objetivos profesionales', expected: ['conseguiré', 'alcanzaré'] },
          { icon: '❤️', text: '_____ a alguien especial y me enamoraré', expected: ['conoceré', 'encontraré'] },
          { icon: '🏡', text: '_____ mi propia casa con jardín', expected: ['compraré', 'tendré'] },
          { icon: '🌎', text: '_____ por todo el mundo', expected: ['viajaré', 'recorreré'] },
          { icon: '👨‍👩‍👧‍👦', text: '_____ una familia hermosa', expected: ['formaré', 'tendré'] },
        ]
      }
    ]
  },
  pretPerf: {
    layout: 'timeline',
    variant: 'default',
    title: 'Lo que he hecho hoy',
    events: [
      { time: '8:00', icon: '🌅', prompt: 'levantarse temprano' },
      { time: '10:00', icon: '☕️', prompt: 'desayunar bien' },
      { time: '14:00', icon: '💻', prompt: 'trabajar en el proyecto' },
      { time: '19:00', icon: '👥', prompt: 'quedar con amigos' },
    ],
    expectedVerbs: ['me he levantado', 'he desayunado', 'he trabajado', 'he quedado'],
  },
  cond: {
    layout: 'prompts',
    variant: 'default',
    title: 'Situaciones hipotéticas',
    prompts: [
        { prompt: 'Si tuviera mucho dinero... (comprar, viajar)', expected: ['compraría', 'viajaría'] },
        { prompt: 'Si fuera invisible por un día... (hacer, ir)', expected: ['haría', 'iría'] },
        { prompt: 'Si pudiera cambiar algo del mundo... (cambiar, mejorar)', expected: ['cambiaría', 'mejoraría'] },
        { prompt: 'En tu lugar yo... (decir, hacer)', expected: ['diría', 'haría'] },
    ],
  },
  plusc: {
    layout: 'prompts',
    variant: 'default',
    title: 'Cuando llegué, ya había pasado...',
    prompts: [
        { prompt: 'Cuando llegué a casa, mi hermana ya... (cocinar, limpiar)', expected: ['había cocinado', 'había limpiado'] },
        { prompt: 'Cuando empezó la película, nosotros ya... (comprar, buscar)', expected: ['habíamos comprado', 'habíamos buscado'] },
        { prompt: 'Cuando se despertaron, el sol ya... (salir, calentar)', expected: ['había salido', 'había calentado'] },
        { prompt: 'Cuando llegaste, ellos ya... (terminar, irse)', expected: ['habían terminado', 'se habían ido'] },
    ],
  },
  futPerf: {
    layout: 'prompts',
    variant: 'default',
    title: 'Lo que habrá pasado para entonces',
    prompts: [
        { prompt: 'Para el viernes, yo ya... (terminar, enviar)', expected: ['habré terminado', 'habré enviado'] },
        { prompt: 'Para diciembre, tú... (aprender, mejorar)', expected: ['habrás aprendido', 'habrás mejorado'] },
        { prompt: 'Para el año que viene, nosotros... (ahorrar, decidir)', expected: ['habremos ahorrado', 'habremos decidido'] },
        { prompt: 'Para entonces, ellos ya... (mudarse, adaptarse)', expected: ['se habrán mudado', 'se habrán adaptado'] },
    ],
  },
  subjImpf: {
    layout: 'prompts',
    variant: 'default',
    title: 'Si fuera diferente...',
    prompts: [
        { prompt: 'Si tuviera más tiempo, yo... (estudiar, viajar)', expected: ['estudiaría', 'viajaría', 'estudiara', 'viajara'] },
        { prompt: 'Si fueras más paciente, tú... (entender, lograr)', expected: ['entenderías', 'lograrías', 'entendieras', 'lograras'] },
        { prompt: 'Si viviéramos cerca del mar, nosotros... (nadar, pescar)', expected: ['nadaríamos', 'pescaríamos', 'nadáramos', 'pescáramos'] },
        { prompt: 'Ojalá que ellos... (venir, quedarse)', expected: ['vinieran', 'se quedaran', 'vendrían', 'se quedarían'] },
    ],
  },
  condPerf: {
    layout: 'prompts',
    variant: 'default',
    title: 'Lo que habría pasado si...',
    prompts: [
        { prompt: 'Si hubiera estudiado más, yo... (aprobar, conseguir)', expected: ['habría aprobado', 'habría conseguido'] },
        { prompt: 'Si hubieras venido antes, tú... (conocer, disfrutar)', expected: ['habrías conocido', 'habrías disfrutado'] },
        { prompt: 'Si hubiéramos salido temprano, nosotros... (llegar, evitar)', expected: ['habríamos llegado', 'habríamos evitado'] },
        { prompt: 'Si hubieran avisado, ellos... (preparar, organizar)', expected: ['habrían preparado', 'habrían organizado'] },
    ],
  },
  subjPerf: {
    layout: 'prompts',
    variant: 'default',
    title: 'Espero que haya...',
    prompts: [
        { prompt: 'Espero que ya... (llegar, encontrar)', expected: ['haya llegado', 'haya encontrado', 'hayas llegado', 'hayas encontrado'] },
        { prompt: 'Es posible que él... (terminar, decidir)', expected: ['haya terminado', 'haya decidido'] },
        { prompt: 'Dudo que nosotros... (cometer, olvidar)', expected: ['hayamos cometido', 'hayamos olvidado'] },
        { prompt: 'No creo que ellos... (resolver, comprender)', expected: ['hayan resuelto', 'hayan comprendido'] },
    ],
  },
  subjPlusc: {
    layout: 'prompts',
    variant: 'default',
    title: 'Si hubiera sabido que...',
    prompts: [
        { prompt: 'Si hubiera sabido que vendrías, yo... (preparar, comprar)', expected: ['hubiera preparado', 'hubiera comprado', 'habría preparado', 'habría comprado'] },
        { prompt: 'Si hubieras estudiado más, tú... (aprobar, entender)', expected: ['hubieras aprobado', 'hubieras entendido', 'habrías aprobado', 'habrías entendido'] },
        { prompt: 'Si hubiéramos salido antes, nosotros... (llegar, conseguir)', expected: ['hubiéramos llegado', 'hubiéramos conseguido', 'habríamos llegado', 'habríamos conseguido'] },
        { prompt: 'Ojalá que ellos... (venir, avisar)', expected: ['hubieran venido', 'hubieran avisado'] },
    ],
  },
};

function MeaningfulPractice({ tense, eligibleForms, onBack, onPhaseComplete }) {
  const [story, setStory] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  
  // Create a dummy currentItem for progress tracking
  const currentItem = {
    id: `meaningful-practice-${tense?.tense}`,
    lemma: 'meaningful-practice',
    tense: tense?.tense,
    mood: tense?.mood
  };
  
  const { handleResult } = useProgressTracking(currentItem, (result) => {
    console.log('Meaningful practice progress tracking result:', result);
  });

  // Debug logging
  console.log('MeaningfulPractice received tense:', tense);
  console.log('Available exercises:', Object.keys(timelineData));
  
  // Seleccionar ejercicio aleatorio cuando cambie el tense
  useEffect(() => {
    if (tense?.tense) {
      const tenseData = timelineData[tense.tense];
      const randomExercise = selectRandomExercise(tenseData);
      setSelectedExercise(randomExercise);
      console.log('Selected exercise:', randomExercise);
    }
  }, [tense]);

  const exercise = selectedExercise;

  const handleCheckStory = async () => {
    if (!exercise || !story.trim()) return;

    setIsProcessing(true);
    setFeedback(null);

    const normalizedUserText = normalizeText(story);
    const userTokens = new Set(tokenizeText(story));

    const missingMessages = [];
    const missingFormsSet = new Set();
    const foundFormsSet = new Set();

    const registerMissing = (expectedForms, message) => {
      if (message) {
        missingMessages.push(message);
      }
      expectedForms.forEach(form => {
        if (form) {
          missingFormsSet.add(form);
        }
      });
    };

    const registerFound = form => {
      if (form) {
        foundFormsSet.add(form);
      }
    };

    const findMatchForExpected = expectedForms => {
      for (const candidate of expectedForms) {
        if (hasNormalizedMatch(normalizedUserText, candidate)) {
          return candidate;
        }
        const candidateTokens = tokenizeText(candidate);
        if (candidateTokens.length > 0 && candidateTokens.every(token => userTokens.has(token))) {
          return candidate;
        }
      }
      return null;
    };

    if (exercise.layout === 'timeline') {
      exercise.expectedVerbs.forEach(verb => {
        if (hasNormalizedMatch(normalizedUserText, verb)) {
          registerFound(verb);
        } else {
          registerMissing([verb], verb);
        }
      });
    } else if (exercise.layout === 'prompts') {
      exercise.prompts.forEach(prompt => {
        const match = findMatchForExpected(prompt.expected);
        if (match) {
          registerFound(match);
        } else {
          registerMissing(prompt.expected, prompt.expected.join(' o '));
        }
      });
    } else if (exercise.layout === 'daily_routine') {
      exercise.prompts.forEach(prompt => {
        const match = findMatchForExpected(prompt.expected);
        if (match) {
          registerFound(match);
        } else {
          registerMissing(prompt.expected, prompt.expected.join(' o '));
        }
      });
    }

    const missingMessagesUnique = Array.from(new Set(missingMessages));
    const missingForms = Array.from(missingFormsSet);
    const foundVerbs = Array.from(foundFormsSet);
    const isCorrect = missingForms.length === 0;

    if (isCorrect) {
      setFeedback({ type: 'correct', message: '¡Excelente! Usaste todos los verbos necesarios.' });

      // Use official progress tracking system
      await handleResult({
        correct: true,
        userAnswer: story,
        correctAnswer: foundVerbs.join(', '),
        hintsUsed: 0,
        errorTags: [],
        latencyMs: 0, // Not applicable for this type of exercise
        isIrregular: false,
        itemId: currentItem.id
      });
      
      // Keep SRS scheduling for found verbs
      try {
        const userId = getCurrentUserId();
        if (userId) {
          console.log('Analytics: Updating schedule for meaningful practice...');
          for (const verbStr of foundVerbs) {
            const formObject = findFormInEligibleForms(eligibleForms, verbStr);
            if (formObject) {
              await updateSchedule(userId, formObject, true, 0);
              console.log(`  - Updated ${formObject.lemma} (${verbStr})`);
            }
          }
        }
      } catch (error) {
        console.error("Failed to update SRS schedule:", error);
      }
    } else {
      // Enhanced error analysis for better feedback and tracking
      const errorTags = [ERROR_TAGS.MISSING_VERBS];
      let detailedFeedback = `Faltaron algunos verbos o no están bien conjugados: ${missingMessagesUnique.join(', ')}`;

      // Analyze found verbs for error classification
      if (foundVerbs.length > 0 && eligibleForms) {
        for (const verb of foundVerbs) {
          const formObject = findFormInEligibleForms(eligibleForms, verb);
          if (formObject) {
            // Track individual correct verb usage for SRS (for partial credit)
            try {
              const userId = getCurrentUserId();
              if (userId) {
                await updateSchedule(userId, formObject, true, 0);
                console.log(`Analytics: Updated schedule for partially correct verb: ${formObject.lemma} - ${verb}`);
              }
            } catch (error) {
              console.error("Failed to update SRS schedule for partial credit:", error);
            }
          }
        }
      }

      // Try to provide more specific feedback and classification
      if (missingMessagesUnique.length === 1) {
        detailedFeedback = `Falta usar correctamente: ${missingMessagesUnique[0]}. Revisa la conjugación.`;
        errorTags.push(ERROR_TAGS.CONJUGATION_ERROR);
      } else if (missingMessagesUnique.length > 1) {
        detailedFeedback = `Faltan ${missingMessagesUnique.length} verbos: ${missingMessagesUnique.join(', ')}. Revisa las conjugaciones y asegúrate de usar todos los verbos sugeridos.`;
        errorTags.push(ERROR_TAGS.MULTIPLE_MISSING);
      }

      // Enhanced error classification for learning context
      if (foundVerbs.length === 0) {
        errorTags.push(ERROR_TAGS.NO_TARGET_VERBS_USED);
      } else if (foundVerbs.length > 0 && missingForms.length > 0) {
        errorTags.push(ERROR_TAGS.PARTIAL_COMPLETION);
      }

      // Analyze user's text for potential tense errors
      const currentTense = tense?.tense;
      if (currentTense && story.length > 10) { // Only for substantial answers
        // Simple heuristic to detect wrong tense usage
        const tensePatternsFound = detectTensePatterns(story, currentTense);
        if (tensePatternsFound.wrongTenses.length > 0) {
          errorTags.push(ERROR_TAGS.WRONG_TENSE_DETECTED);
          detailedFeedback += ` Detectamos verbos en otros tiempos: ${tensePatternsFound.wrongTenses.join(', ')}.`;
        }

        const wrongTenseHints = {
          'pres': 'Recuerda usar el presente: yo hablo, tú comes, él vive',
          'pretIndef': 'Usa el pretérito: yo hablé, tú comiste, él vivió',
          'impf': 'Usa el imperfecto: yo hablaba, tú comías, él vivía',
          'fut': 'Usa el futuro: yo hablaré, tú comerás, él vivirá',
          'pretPerf': 'Usa el perfecto: yo he hablado, tú has comido, él ha vivido'
        };

        if (wrongTenseHints[currentTense]) {
          detailedFeedback += ` ${wrongTenseHints[currentTense]}.`;
        }
      }

      setFeedback({ type: 'incorrect', message: detailedFeedback });

      // Track incorrect attempt with comprehensive error classification
      await handleResult({
        correct: false,
        userAnswer: story,
        correctAnswer: missingMessagesUnique.join(', '),
        hintsUsed: 0,
        errorTags,
        latencyMs: 0,
        isIrregular: false,
        itemId: currentItem.id,
        partialCredit: (foundVerbs.length + missingForms.length) > 0
          ? foundVerbs.length / (foundVerbs.length + missingForms.length)
          : 0
      });

      // Update SRS for missed verbs (negative reinforcement)
      try {
        const userId = getCurrentUserId();
        if (userId && eligibleForms) {
          for (const missedVerb of missingForms) {
            const formObject = findFormInEligibleForms(eligibleForms, missedVerb);
            if (formObject) {
              await updateSchedule(userId, formObject, false, 1); // Mark as incorrect with hint
              console.log(`Analytics: Updated schedule for missed verb: ${formObject.lemma} - ${missedVerb}`);
            }
          }
        }
      } catch (error) {
        console.error("Failed to update SRS schedule for missed verbs:", error);
      }
    }
    
    setIsProcessing(false);
  };

  if (!exercise) {
    return (
      <div className="meaningful-practice">
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
            <h2>Práctica Significativa: {formatMoodTense(tense.mood, tense.tense)}</h2>
        </div>

        {exercise.layout === 'timeline' && (
            <div className="timeline-container">
              <h3>{exercise.title}</h3>
              {exercise.variant && exercise.variant !== 'default' && (
                <p className="exercise-variant">🎯 Ejercicio temático: {exercise.variant.replace('_', ' ')}</p>
              )}
              <div className="timeline">
                {exercise.events.map(event => (
                  <div key={event.time} className="timeline-event">
                    <span className="icon">{event.icon}</span>
                    <span className="time">{event.time}</span>
                    <span className="prompt">({event.prompt})</span>
                  </div>
                ))}
              </div>
            </div>
        )}

        {exercise.layout === 'prompts' && (
            <div className="prompts-container">
                <h3>{exercise.title}</h3>
                {exercise.variant && exercise.variant !== 'default' && (
                  <p className="exercise-variant">🎯 Ejercicio temático: {exercise.variant.replace('_', ' ')}</p>
                )}
                <ul>
                    {exercise.prompts.map((p, i) => <li key={i}>{p.prompt}</li>)}
                </ul>
            </div>
        )}

        {exercise.layout === 'daily_routine' && (
            <div className="daily-routine-container">
                <h3>{exercise.title}</h3>
                {exercise.variant && exercise.variant !== 'default' && (
                  <p className="exercise-variant">🎯 Ejercicio temático: {exercise.variant.replace('_', ' ')}</p>
                )}
                <p className="description">{exercise.description}</p>
                <div className="routine-prompts">
                    {exercise.prompts.map((prompt, i) => (
                        <div key={i} className="routine-prompt">
                            <span className="icon">{prompt.icon}</span>
                            <span className="text">{prompt.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <textarea
          className="story-textarea"
          placeholder="Escribe aquí tus respuestas..."
          value={story}
          onChange={(e) => setStory(e.target.value)}
        />

        {feedback && (
          <div className={`feedback-message ${feedback.type}`}>
            {feedback.message}
          </div>
        )}

        {feedback?.type === 'correct' ? (
            <button onClick={onPhaseComplete} className="btn-primary">Siguiente Fase</button>
        ) : (
            <button 
              onClick={handleCheckStory} 
              className="btn-primary"
              disabled={isProcessing || !story.trim()}
            >
              {isProcessing ? 'Revisando...' : 'Revisar Historia'}
            </button>
        )}
      </div>
    </div>
  );
}

export default MeaningfulPractice;
