// Level Assessment Engine
// Determines user level through placement test and continuous evaluation

import { getCurrentUserProfile } from './userLevelProfile.js'
import { verbs } from '../../data/verbs.js'
import { IRREGULAR_FAMILIES } from '../data/irregularFamilies.js'
import { buildFormsForRegion } from '../core/eligibility.js'

// Professional CEFR-aligned placement test questions based on Cervantes Institute standards
function generateProfessionalQuestionPool() {
  // Curated professional questions following CEFR standards
  const professionalQuestions = [
    // A1 Level - Basic present tense and high-frequency verbs
    {
      id: 'a1_ser_1',
      targetLevel: 'A1',
      difficulty: 1,
      prompt: '¿Cuál es la forma correcta? María ____ profesora.',
      options: ['es', 'está', 'tiene', 'hace'],
      expectedAnswer: 'es',
      explanation: 'Usamos "ser" para profesiones permanentes',
      verb: 'ser',
      tense: 'presente',
      testsFocus: 'ser_vs_estar'
    },
    {
      id: 'a1_estar_1',
      targetLevel: 'A1',
      difficulty: 1,
      prompt: '¿Dónde está Juan? Juan ____ en casa.',
      options: ['es', 'está', 'tiene', 'va'],
      expectedAnswer: 'está',
      explanation: 'Usamos "estar" para ubicación',
      verb: 'estar',
      tense: 'presente',
      testsFocus: 'ser_vs_estar'
    },
    {
      id: 'a1_tener_1',
      targetLevel: 'A1',
      difficulty: 1,
      prompt: 'Complete: Nosotros ____ hambre.',
      options: ['tenemos', 'somos', 'estamos', 'hacemos'],
      expectedAnswer: 'tenemos',
      explanation: 'Expresión idiomática con "tener"',
      verb: 'tener',
      tense: 'presente',
      testsFocus: 'expressions_with_tener'
    },
    {
      id: 'a1_regular_ar',
      targetLevel: 'A1',
      difficulty: 1,
      prompt: 'Conjugación: Yo ____ español todos los días.',
      options: ['hablo', 'habla', 'hablas', 'hablan'],
      expectedAnswer: 'hablo',
      explanation: 'Primera persona singular de verbos -ar',
      verb: 'hablar',
      tense: 'presente',
      testsFocus: 'regular_ar_conjugation'
    },

    // A2 Level - Past tenses and irregular verbs
    {
      id: 'a2_preterite_1',
      targetLevel: 'A2',
      difficulty: 2,
      prompt: 'Ayer Juan ____ al cine.',
      options: ['va', 'fue', 'iba', 'iría'],
      expectedAnswer: 'fue',
      explanation: 'Pretérito indefinido para acciones terminadas',
      verb: 'ir',
      tense: 'pretérito_indefinido',
      testsFocus: 'preterite_vs_imperfect'
    },
    {
      id: 'a2_imperfect_1',
      targetLevel: 'A2',
      difficulty: 2,
      prompt: 'Cuando era niño, yo ____ mucho.',
      options: ['jugué', 'jugaba', 'juego', 'jugaré'],
      expectedAnswer: 'jugaba',
      explanation: 'Imperfecto para acciones habituales del pasado',
      verb: 'jugar',
      tense: 'imperfecto',
      testsFocus: 'preterite_vs_imperfect'
    },
    {
      id: 'a2_future_1',
      targetLevel: 'A2',
      difficulty: 2,
      prompt: 'Mañana nosotros ____ a Madrid.',
      options: ['viajamos', 'viajábamos', 'viajaremos', 'viajamos'],
      expectedAnswer: 'viajaremos',
      explanation: 'Futuro simple para planes futuros',
      verb: 'viajar',
      tense: 'futuro',
      testsFocus: 'future_tense'
    },
    {
      id: 'a2_stem_change',
      targetLevel: 'A2',
      difficulty: 2,
      prompt: '¿A qué hora ____ el restaurante?',
      options: ['cierra', 'ciera', 'cierre', 'cerrará'],
      expectedAnswer: 'cierra',
      explanation: 'Cambio vocálico e→ie en presente',
      verb: 'cerrar',
      tense: 'presente',
      testsFocus: 'stem_changing_verbs'
    },

    // B1 Level - Perfect tenses and subjunctive introduction
    {
      id: 'b1_perfect_1',
      targetLevel: 'B1',
      difficulty: 3,
      prompt: 'Este año nosotros ____ tres veces a París.',
      options: ['fuimos', 'íbamos', 'hemos ido', 'iremos'],
      expectedAnswer: 'hemos ido',
      explanation: 'Pretérito perfecto para experiencias con relevancia presente',
      verb: 'ir',
      tense: 'pretérito_perfecto',
      testsFocus: 'perfect_tenses'
    },
    {
      id: 'b1_subjunctive_1',
      targetLevel: 'B1',
      difficulty: 3,
      prompt: 'Es importante que tú ____ temprano.',
      options: ['llegas', 'llegues', 'llegabas', 'llegarás'],
      expectedAnswer: 'llegues',
      explanation: 'Subjuntivo presente después de expresiones de necesidad',
      verb: 'llegar',
      tense: 'subjuntivo_presente',
      testsFocus: 'subjunctive_present'
    },
    {
      id: 'b1_conditional_1',
      targetLevel: 'B1',
      difficulty: 3,
      prompt: 'En tu lugar, yo ____ con el jefe.',
      options: ['hablo', 'hablé', 'hablaría', 'hable'],
      expectedAnswer: 'hablaría',
      explanation: 'Condicional para consejos y situaciones hipotéticas',
      verb: 'hablar',
      tense: 'condicional',
      testsFocus: 'conditional_mood'
    },
    {
      id: 'b1_pluperfect',
      targetLevel: 'B1',
      difficulty: 3,
      prompt: 'Cuando llegué, ellos ya ____.',
      options: ['se fueron', 'se iban', 'se habían ido', 'se van'],
      expectedAnswer: 'se habían ido',
      explanation: 'Pluscuamperfecto para acciones anteriores a otra del pasado',
      verb: 'irse',
      tense: 'pluscuamperfecto',
      testsFocus: 'pluperfect_tense'
    },

    // B2 Level - Advanced subjunctive and complex tenses
    {
      id: 'b2_subjunctive_past',
      targetLevel: 'B2',
      difficulty: 4,
      prompt: 'Si yo ____ más dinero, viajaría por el mundo.',
      options: ['tengo', 'tenía', 'tuviera', 'tendré'],
      expectedAnswer: 'tuviera',
      explanation: 'Subjuntivo imperfecto en oraciones condicionales irreales',
      verb: 'tener',
      tense: 'subjuntivo_imperfecto',
      testsFocus: 'conditional_sentences'
    },
    {
      id: 'b2_perfect_subjunctive',
      targetLevel: 'B2',
      difficulty: 4,
      prompt: 'Dudo que él ____ la verdad.',
      options: ['dijo', 'decía', 'haya dicho', 'dirá'],
      expectedAnswer: 'haya dicho',
      explanation: 'Subjuntivo perfecto para acciones pasadas con duda',
      verb: 'decir',
      tense: 'subjuntivo_perfecto',
      testsFocus: 'perfect_subjunctive'
    },
    {
      id: 'b2_conditional_perfect',
      targetLevel: 'B2',
      difficulty: 4,
      prompt: 'Con más tiempo, ____ terminado el proyecto.',
      options: ['habría', 'habríamos', 'habremos', 'hemos'],
      expectedAnswer: 'habríamos',
      explanation: 'Condicional perfecto para situaciones hipotéticas del pasado',
      verb: 'haber',
      tense: 'condicional_perfecto',
      testsFocus: 'conditional_perfect'
    },

    // A2 Additional questions
    {
      id: 'a2_irregular_poder',
      targetLevel: 'A2',
      difficulty: 2,
      prompt: 'No ____ venir ayer porque estaba enfermo.',
      options: ['podía', 'pude', 'puedo', 'podré'],
      expectedAnswer: 'pude',
      explanation: 'Pretérito indefinido de "poder" para expresar imposibilidad específica',
      verb: 'poder',
      tense: 'pretérito_indefinido',
      testsFocus: 'irregular_preterite'
    },
    {
      id: 'a2_conocer_saber',
      targetLevel: 'A2',
      difficulty: 2,
      prompt: '¿____ dónde está la estación de tren?',
      options: ['Sabes', 'Conoces', 'Tienes', 'Puedes'],
      expectedAnswer: 'Sabes',
      explanation: 'Usamos "saber" para información específica',
      verb: 'saber',
      tense: 'presente',
      testsFocus: 'saber_vs_conocer'
    },

    // B1 Additional questions
    {
      id: 'b1_imperative_negative',
      targetLevel: 'B1',
      difficulty: 3,
      prompt: 'No ____ tan fuerte, por favor.',
      options: ['hablas', 'hables', 'habla', 'hablaste'],
      expectedAnswer: 'hables',
      explanation: 'Imperativo negativo usa subjuntivo presente',
      verb: 'hablar',
      tense: 'imperativo_negativo',
      testsFocus: 'imperative_forms'
    },
    {
      id: 'b1_present_perfect_experience',
      targetLevel: 'B1',
      difficulty: 3,
      prompt: '¿Alguna vez ____ paella?',
      options: ['comiste', 'comías', 'has comido', 'comerás'],
      expectedAnswer: 'has comido',
      explanation: 'Pretérito perfecto para experiencias pasadas con relevancia presente',
      verb: 'comer',
      tense: 'pretérito_perfecto',
      testsFocus: 'perfect_tenses_experience'
    },
    {
      id: 'b1_subjunctive_emotion',
      targetLevel: 'B1',
      difficulty: 3,
      prompt: 'Me alegra que ____ tiempo para visitarnos.',
      options: ['tienes', 'tengas', 'tenías', 'tendrás'],
      expectedAnswer: 'tengas',
      explanation: 'Subjuntivo presente después de expresiones de emoción',
      verb: 'tener',
      tense: 'subjuntivo_presente',
      testsFocus: 'subjunctive_emotion'
    },

    // B2 Additional questions
    {
      id: 'b2_conditional_courtesy',
      targetLevel: 'B2',
      difficulty: 4,
      prompt: '¿____ ayudarme con este problema?',
      options: ['Puedes', 'Podrías', 'Pudiste', 'Puedas'],
      expectedAnswer: 'Podrías',
      explanation: 'Condicional para peticiones corteses',
      verb: 'poder',
      tense: 'condicional',
      testsFocus: 'conditional_courtesy'
    },
    {
      id: 'b2_pluperfect_subjunctive',
      targetLevel: 'B2',
      difficulty: 4,
      prompt: 'Si ____ llegado antes, habríamos cenado juntos.',
      options: ['hubieras', 'habrías', 'habías', 'hubieses'],
      expectedAnswer: 'hubieras',
      explanation: 'Subjuntivo pluscuamperfecto en oraciones condicionales',
      verb: 'haber',
      tense: 'subjuntivo_pluscuamperfecto',
      testsFocus: 'pluperfect_subjunctive'
    },
    {
      id: 'b2_reported_speech',
      targetLevel: 'B2',
      difficulty: 4,
      prompt: 'María dijo que ____ al médico la semana siguiente.',
      options: ['va', 'iría', 'fue', 'vaya'],
      expectedAnswer: 'iría',
      explanation: 'Condicional en estilo indirecto para futuro del pasado',
      verb: 'ir',
      tense: 'condicional',
      testsFocus: 'reported_speech'
    },

    // C1 Level - Complex syntax and advanced irregulars
    {
      id: 'c1_advanced_subjunctive',
      targetLevel: 'C1',
      difficulty: 5,
      prompt: 'Aunque ____ mucho dinero, no sería feliz.',
      options: ['tuviera', 'tenía', 'tenga', 'tendría'],
      expectedAnswer: 'tuviera',
      explanation: 'Subjuntivo imperfecto con "aunque" para situaciones hipotéticas',
      verb: 'tener',
      tense: 'subjuntivo_imperfecto',
      testsFocus: 'concessive_clauses'
    },
    {
      id: 'c1_future_subjunctive',
      targetLevel: 'C1',
      difficulty: 5,
      prompt: 'Quien ____ interesado, que se ponga en contacto.',
      options: ['esté', 'está', 'estuviere', 'estaría'],
      expectedAnswer: 'esté',
      explanation: 'Subjuntivo presente en oraciones de relativo con antecedente indefinido',
      verb: 'estar',
      tense: 'subjuntivo_presente',
      testsFocus: 'relative_clauses'
    },
    {
      id: 'c1_gerund_perfect',
      targetLevel: 'C1',
      difficulty: 5,
      prompt: '____ terminado el trabajo, se fue a casa.',
      options: ['Habiendo', 'Haber', 'Había', 'Ha'],
      expectedAnswer: 'Habiendo',
      explanation: 'Gerundio compuesto para acciones anteriores',
      verb: 'haber',
      tense: 'gerundio_compuesto',
      testsFocus: 'perfect_gerund'
    },

    // C2 Level - Highly advanced
    {
      id: 'c2_archaic_subjunctive',
      targetLevel: 'C2',
      difficulty: 6,
      prompt: 'Si ____ sabido la verdad, no habría venido.',
      options: ['hubiera', 'hubiese', 'habría', 'había'],
      expectedAnswer: 'hubiese',
      explanation: 'Forma alternativa del subjuntivo pluscuamperfecto (registro culto)',
      verb: 'haber',
      tense: 'subjuntivo_pluscuamperfecto',
      testsFocus: 'archaic_forms'
    },
    {
      id: 'c2_literary_inversion',
      targetLevel: 'C2',
      difficulty: 6,
      prompt: 'Apenas ____ el sol cuando empezó a llover.',
      options: ['salió', 'había salido', 'hubo salido', 'salía'],
      expectedAnswer: 'hubo salido',
      explanation: 'Pretérito anterior en construcciones temporales literarias',
      verb: 'salir',
      tense: 'pretérito_anterior',
      testsFocus: 'literary_tenses'
    }
  ]

  console.log(`Professional question pool generated: ${professionalQuestions.length} questions`)
  return professionalQuestions
}

function findVerbForm(verb, mood, tense, person, region) {
  for (const paradigm of verb.paradigms) {
    if (paradigm.regionTags.includes(region)) {
      const form = paradigm.forms.find(f =>
        f.mood === mood && f.tense === tense && f.person === person
      )
      if (form) return form
    }
  }
  return null
}

function createQuestionFromForm(verb, form, tenseConfig, level, person) {
  // Generate contextual prompts based on verb, tense, and person
  const prompts = generateContextualPrompts(verb.lemma, form, person, tenseConfig.tense, tenseConfig.mood)
  if (prompts.length === 0) return null

  // Select random prompt
  const prompt = prompts[Math.floor(Math.random() * prompts.length)]

  return {
    id: `${verb.lemma}_${tenseConfig.mood}_${tenseConfig.tense}_${person}`,
    targetLevel: level,
    verb: verb.lemma,
    mood: tenseConfig.mood,
    tense: tenseConfig.tense,
    person: person,
    expectedAnswer: form.value,
    difficulty: tenseConfig.difficulty,
    prompt: prompt,
    verbType: verb.type,
    irregularityInfo: getIrregularityInfo(verb.lemma)
  }
}

function generateContextualPrompts(lemma, form, person, tense, mood) {
  // ALWAYS include the verb infinitive in the prompt for clarity
  const verbInstruction = `Conjugá el verbo "${lemma}"`

  // Context templates that ALWAYS show the verb being tested
  const templates = {
    '1s': {
      'ser': [`${verbInstruction}: Yo ____ estudiante.`, `${verbInstruction}: Yo ____ de Argentina.`],
      'estar': [`${verbInstruction}: Yo ____ en casa.`, `${verbInstruction}: Yo ____ muy cansado/a.`],
      'tener': [`${verbInstruction}: Yo ____ hambre.`, `${verbInstruction}: Yo ____ 25 años.`],
      'haber': [`${verbInstruction}: Yo ____ estado aquí antes.`],
      'hacer': [`${verbInstruction}: Yo ____ ejercicio todos los días.`],
      'ir': [`${verbInstruction}: Yo ____ al trabajo en colectivo.`],
      'venir': [`${verbInstruction}: Yo ____ de muy lejos.`],
      'decir': [`${verbInstruction}: Yo siempre ____ la verdad.`],
      'poder': [`${verbInstruction}: Yo ____ ayudarte con eso.`],
      'querer': [`${verbInstruction}: Yo ____ viajar a Europa.`],
      'default': [`${verbInstruction}: Yo ____ ${getContextForVerb(lemma)}.`]
    },
    '2s_tu': {
      'ser': [`${verbInstruction}: Tú ____ muy inteligente.`, `${verbInstruction}: ¿Tú ____ médico?`],
      'estar': [`${verbInstruction}: Tú ____ en el trabajo.`, `${verbInstruction}: ¿Tú ____ bien?`],
      'tener': [`${verbInstruction}: Tú ____ razón.`, `${verbInstruction}: ¿Tú ____ tiempo?`],
      'hacer': [`${verbInstruction}: Tú ____ muy buen trabajo.`],
      'ir': [`${verbInstruction}: ¿Tú ____ al cine esta noche?`],
      'venir': [`${verbInstruction}: Tú ____ conmigo, ¿verdad?`],
      'default': [`${verbInstruction}: Tú ____ ${getContextForVerb(lemma)}.`]
    },
    '3s': {
      'ser': [`${verbInstruction}: Él ____ profesor.`, `${verbInstruction}: Ella ____ muy simpática.`],
      'estar': [`${verbInstruction}: Él ____ en el parque.`, `${verbInstruction}: Ella ____ estudiando.`],
      'haber': [`${verbInstruction}: ____ muchas personas aquí.`, `${verbInstruction}: No ____ problemas.`],
      'tener': [`${verbInstruction}: Él ____ mucha experiencia.`],
      'hacer': [`${verbInstruction}: Ella ____ la tarea todas las noches.`],
      'ir': [`${verbInstruction}: Él ____ a la universidad.`],
      'default': [`${verbInstruction}: Él/Ella ____ ${getContextForVerb(lemma)}.`]
    },
    '1p': {
      'ser': [`${verbInstruction}: Nosotros ____ amigos.`, `${verbInstruction}: Nosotras ____ estudiantes.`],
      'estar': [`${verbInstruction}: Nosotros ____ listos.`, `${verbInstruction}: Nosotras ____ aquí.`],
      'tener': [`${verbInstruction}: Nosotros ____ que estudiar.`],
      'hacer': [`${verbInstruction}: Nosotros ____ deportes los fines de semana.`],
      'ir': [`${verbInstruction}: Nosotros ____ de vacaciones en enero.`],
      'default': [`${verbInstruction}: Nosotros ____ ${getContextForVerb(lemma)}.`]
    },
    '3p': {
      'ser': [`${verbInstruction}: Ellos ____ hermanos.`, `${verbInstruction}: Ellas ____ profesoras.`],
      'estar': [`${verbInstruction}: Ellos ____ cansados.`, `${verbInstruction}: Ellas ____ trabajando.`],
      'tener': [`${verbInstruction}: Ellos ____ muchos libros.`],
      'hacer': [`${verbInstruction}: Ellas ____ la cena juntas.`],
      'ir': [`${verbInstruction}: Ellos ____ al mercado.`],
      'default': [`${verbInstruction}: Ellos/Ellas ____ ${getContextForVerb(lemma)}.`]
    }
  }

  // Get appropriate templates
  const personTemplates = templates[person] || templates['3s']
  const verbTemplates = personTemplates[lemma] || personTemplates['default']

  return verbTemplates
}

function getContextForVerb(lemma) {
  const contexts = {
    'hablar': 'todos los días',
    'comer': 'en el restaurante',
    'vivir': 'en Madrid',
    'trabajar': 'mucho',
    'estudiar': 'medicina',
    'hacer': 'ejercicio',
    'decir': 'la verdad',
    'poder': 'ayudarte',
    'querer': 'viajar',
    'venir': 'mañana',
    'ir': 'al cine',
    'salir': 'temprano',
    'ver': 'televisión',
    'dar': 'un regalo',
    'saber': 'la respuesta',
    'conocer': 'bien la ciudad'
  }
  return contexts[lemma] || 'siempre'
}

function getIrregularityInfo(lemma) {
  for (const family of Object.values(IRREGULAR_FAMILIES)) {
    if (family.examples && family.examples.includes(lemma)) {
      return {
        family: family.id,
        pattern: family.pattern,
        description: family.description
      }
    }
  }
  return null
}

function addIrregularFamilyQuestions(questionPool) {
  // Add specific questions for irregular patterns to ensure good coverage
  const priorityIrregulars = [
    { family: 'DIPHT_E_IE', verbs: ['pensar', 'cerrar', 'empezar'], level: 'A2' },
    { family: 'DIPHT_O_UE', verbs: ['volver', 'poder', 'contar'], level: 'A2' },
    { family: 'E_I_IR', verbs: ['pedir', 'servir', 'repetir'], level: 'B1' },
    { family: 'STRONG_PRETERITE', verbs: ['poder', 'poner', 'saber', 'tener', 'venir'], level: 'B1' }
  ]

  priorityIrregulars.forEach(({ family, verbs: familyVerbs, level }) => {
    familyVerbs.forEach(verbLemma => {
      const verb = verbs.find(v => v.lemma === verbLemma)
      if (!verb) return

      // Add specific forms that test the irregularity
      const testForms = [
        { mood: 'indicative', tense: 'pres', person: '3s', difficulty: 2 },
        { mood: 'subjunctive', tense: 'subjPres', person: '1s', difficulty: 3 }
      ]

      testForms.forEach(formConfig => {
        const form = findVerbForm(verb, formConfig.mood, formConfig.tense, formConfig.person, 'la_general')
        if (form) {
          const question = createQuestionFromForm(verb, form, formConfig, level, formConfig.person)
          if (question) {
            question.id += '_irregular'
            question.irregularFocus = family
            questionPool.push(question)
          }
        }
      })
    })
  })
}

// Strategic assessment questions based on curriculum.json progression
export const PLACEMENT_TEST_QUESTIONS = [
  // A1 Level Tests - Basic present tense
  {
    targetLevel: 'A1',
    verb: 'ser',
    mood: 'indicative',
    tense: 'pres',
    person: '3s',
    expectedAnswer: 'es',
    difficulty: 1,
    prompt: 'Él _____ médico.'
  },
  {
    targetLevel: 'A1',
    verb: 'estar',
    mood: 'indicative',
    tense: 'pres',
    person: '1s',
    expectedAnswer: 'estoy',
    difficulty: 1,
    prompt: 'Yo _____ en casa.'
  },
  {
    targetLevel: 'A1',
    verb: 'tener',
    mood: 'indicative',
    tense: 'pres',
    person: '2s_tu',
    expectedAnswer: 'tienes',
    difficulty: 1,
    prompt: 'Tú _____ hambre.'
  },

  // A2 Level Tests - Past tenses and basic irregulars
  {
    targetLevel: 'A2',
    verb: 'hacer',
    mood: 'indicative',
    tense: 'pretIndef',
    person: '3s',
    expectedAnswer: 'hizo',
    difficulty: 2,
    prompt: 'Ella _____ la tarea ayer.'
  },
  {
    targetLevel: 'A2',
    verb: 'ir',
    mood: 'indicative',
    tense: 'impf',
    person: '1p',
    expectedAnswer: 'íbamos',
    difficulty: 2,
    prompt: 'Nosotros _____ al parque cada día.'
  },
  {
    targetLevel: 'A2',
    verb: 'hablar',
    mood: 'imperative',
    tense: 'impAff',
    person: '2s_tu',
    expectedAnswer: 'habla',
    difficulty: 2,
    prompt: '_____ más despacio, por favor.'
  },

  // B1 Level Tests - Subjunctive and compound tenses
  {
    targetLevel: 'B1',
    verb: 'poder',
    mood: 'indicative',
    tense: 'pretPerf',
    person: '2s_tu',
    expectedAnswer: 'has podido',
    difficulty: 3,
    prompt: '¿_____ terminar el proyecto?'
  },
  {
    targetLevel: 'B1',
    verb: 'querer',
    mood: 'subjunctive',
    tense: 'subjPres',
    person: '3s',
    expectedAnswer: 'quiera',
    difficulty: 3,
    prompt: 'Espero que él _____ venir.'
  },
  {
    targetLevel: 'B1',
    verb: 'vivir',
    mood: 'conditional',
    tense: 'cond',
    person: '1s',
    expectedAnswer: 'viviría',
    difficulty: 3,
    prompt: 'Me _____ en París si pudiera.'
  },

  // B2 Level Tests - Complex subjunctives
  {
    targetLevel: 'B2',
    verb: 'decir',
    mood: 'subjunctive',
    tense: 'subjImpf',
    person: '3p',
    expectedAnswer: 'dijeran',
    difficulty: 4,
    prompt: 'No creía que ellos _____ la verdad.'
  },
  {
    targetLevel: 'B2',
    verb: 'haber',
    mood: 'subjunctive',
    tense: 'subjPlusc',
    person: '1s',
    expectedAnswer: 'hubiera tenido',
    difficulty: 4,
    prompt: 'Si _____ dinero, habría viajado.'
  },
  {
    targetLevel: 'B2',
    verb: 'comer',
    mood: 'conditional',
    tense: 'condPerf',
    person: '2s_tu',
    expectedAnswer: 'habrías comido',
    difficulty: 4,
    prompt: '_____ más si hubieras tenido tiempo.'
  },

  // C1 Level Tests - Advanced and rare forms
  {
    targetLevel: 'C1',
    verb: 'venir',
    mood: 'subjunctive',
    tense: 'subjFut',
    person: '3s',
    expectedAnswer: 'viniere',
    difficulty: 5,
    prompt: 'Cualquiera que _____ será bienvenido.'
  },
  {
    targetLevel: 'C1',
    verb: 'distinguir',
    mood: 'indicative',
    tense: 'pres',
    person: '1s',
    expectedAnswer: 'distingo',
    difficulty: 5,
    prompt: 'Yo _____ entre el bien y el mal.'
  },

  // C2 Level Tests - Very advanced/rare verbs
  {
    targetLevel: 'C2',
    verb: 'yacer',
    mood: 'indicative',
    tense: 'pres',
    person: '3s',
    expectedAnswer: 'yace',
    difficulty: 6,
    prompt: 'Aquí _____ un gran héroe.'
  }
]

export class LevelAssessment {
  constructor() {
    this.currentTest = null
    this.testResults = []
    this.isRunning = false
    this.questionPool = null

    // CAT algorithm parameters
    this.abilityEstimate = 0.0    // θ (theta) - current ability estimate
    this.standardError = 1.0      // SE of ability estimate
    this.minQuestions = 8         // Minimum questions before stopping
    this.maxQuestions = 20        // Maximum questions
    this.targetSE = 0.3          // Target standard error for stopping
    this.convergenceThreshold = 0.1 // Ability change threshold for convergence
  }

  // Initialize the professional question pool
  initializeQuestionPool() {
    if (!this.questionPool) {
      this.questionPool = generateProfessionalQuestionPool()
      console.log(`Initialized professional question pool with ${this.questionPool.length} questions`)
    }
    return this.questionPool
  }

  // CAT Algorithm: Select optimal next item based on current ability estimate
  selectOptimalQuestion(availableQuestions) {
    if (availableQuestions.length === 0) return null

    // Filter out already used questions to prevent repetition
    const usedQuestionIds = this.currentTest ? this.currentTest.results.map(r => r.questionId) : []
    const unusedQuestions = availableQuestions.filter(q => !usedQuestionIds.includes(q.id))

    // If all questions used, allow reuse (shouldn't happen with enough questions)
    const questionsToConsider = unusedQuestions.length > 0 ? unusedQuestions : availableQuestions

    // For first question, select medium difficulty from A1/A2
    if (!this.currentTest || this.currentTest.currentIndex === 0) {
      const startingQuestions = questionsToConsider.filter(q =>
        (q.targetLevel === 'A1' || q.targetLevel === 'A2') && q.difficulty >= 1 && q.difficulty <= 2
      )
      return startingQuestions.length > 0
        ? startingQuestions[Math.floor(Math.random() * startingQuestions.length)]
        : questionsToConsider[Math.floor(Math.random() * questionsToConsider.length)]
    }

    // Calculate information function for each unused question
    let bestQuestion = null
    let maxInformation = -1

    questionsToConsider.forEach(question => {
      const information = this.calculateItemInformation(question, this.abilityEstimate)
      if (information > maxInformation) {
        maxInformation = information
        bestQuestion = question
      }
    })

    return bestQuestion || questionsToConsider[0]
  }

  // Calculate Fisher Information for an item at given ability level
  calculateItemInformation(question, theta) {
    // Convert difficulty level to IRT parameters
    const difficulty = this.difficultyToTheta(question.difficulty) // b parameter
    const discrimination = this.getDiscrimination(question) // a parameter
    const guessing = 0.0 // c parameter (no guessing for production tasks)

    // Calculate probability of correct response using 3PL model
    const probability = guessing + (1 - guessing) / (1 + Math.exp(-discrimination * (theta - difficulty)))

    // Fisher Information = a² * P * (1-P) / (1-c)² for 3PL model
    const information = Math.pow(discrimination, 2) * probability * (1 - probability) / Math.pow(1 - guessing, 2)

    return information
  }

  // Convert discrete difficulty (1-6) to continuous theta scale
  difficultyToTheta(difficulty) {
    // Map difficulty levels to theta scale (-3 to +3)
    const mapping = {
      1: -2.0,  // A1
      2: -1.0,  // A2
      3: 0.0,   // B1
      4: 1.0,   // B2
      5: 2.0,   // C1
      6: 3.0    // C2
    }
    return mapping[difficulty] || 0.0
  }

  // Get discrimination parameter based on question characteristics
  getDiscrimination(question) {
    let discrimination = 1.0

    // Higher discrimination for irregular verbs (more informative)
    if (question.irregularityInfo) {
      discrimination += 0.3
    }

    // Adjust based on verb frequency/complexity
    if (['ser', 'estar', 'tener', 'haber'].includes(question.verb)) {
      discrimination += 0.2 // High-frequency verbs are more discriminating
    }

    // Subjunctive and conditional are more discriminating
    if (question.mood === 'subjunctive' || question.mood === 'conditional') {
      discrimination += 0.4
    }

    return Math.min(discrimination, 2.5) // Cap at reasonable maximum
  }

  // Update ability estimate using Maximum Likelihood Estimation
  updateAbilityEstimate(isCorrect, question) {
    const previousTheta = this.abilityEstimate

    // Simplified Newton-Raphson method for MLE
    const difficulty = this.difficultyToTheta(question.difficulty)
    const discrimination = this.getDiscrimination(question)
    const stepSize = 0.3

    if (isCorrect) {
      // Increase ability if correct, more so if item was difficult
      this.abilityEstimate += stepSize * (1 + (difficulty - this.abilityEstimate) * 0.1)
    } else {
      // Decrease ability if incorrect, more so if item was easy
      this.abilityEstimate -= stepSize * (1 + (this.abilityEstimate - difficulty) * 0.1)
    }

    // Update standard error (simplified)
    const responses = this.currentTest.results.length
    this.standardError = 1.0 / Math.sqrt(responses + 1)

    // Track convergence
    const abilityChange = Math.abs(this.abilityEstimate - previousTheta)

    return {
      theta: this.abilityEstimate,
      standardError: this.standardError,
      converged: abilityChange < this.convergenceThreshold && responses >= this.minQuestions
    }
  }

  // Convert theta to CEFR level
  thetaToLevel(theta) {
    if (theta < -1.5) return 'A1'
    if (theta < -0.5) return 'A2'
    if (theta < 0.5) return 'B1'
    if (theta < 1.5) return 'B2'
    if (theta < 2.5) return 'C1'
    return 'C2'
  }

  // Check if test should terminate
  shouldTerminate() {
    if (!this.currentTest) return false

    const responses = this.currentTest.results.length

    // Minimum questions not reached
    if (responses < this.minQuestions) return false

    // Maximum questions reached
    if (responses >= this.maxQuestions) return true

    // Standard error criterion met
    if (this.standardError <= this.targetSE) return true

    // Convergence criterion met
    if (responses >= this.minQuestions) {
      const recentChanges = this.currentTest.results.slice(-3).map((r, i) =>
        i > 0 ? Math.abs(r.abilityEstimate - this.currentTest.results[this.currentTest.results.length - 3 + i - 1].abilityEstimate) : 0
      ).filter(c => c > 0)

      if (recentChanges.length >= 2 && Math.max(...recentChanges) < this.convergenceThreshold) {
        return true
      }
    }

    return false
  }

  generatePlacementTest(questionCount = 15) {
    // Initialize question pool
    this.initializeQuestionPool()

    // Reset CAT parameters
    this.abilityEstimate = 0.0
    this.standardError = 1.0

    // For adaptive test, we don't pre-select questions
    // Questions will be selected dynamically based on responses
    return {
      mode: 'adaptive',
      maxQuestions: Math.min(questionCount, this.maxQuestions),
      questionPool: this.questionPool,
      startTime: Date.now()
    }
  }

  async startPlacementTest(questionCount = 15) {
    const testConfig = this.generatePlacementTest(questionCount)

    this.currentTest = {
      mode: testConfig.mode,
      questionPool: testConfig.questionPool,
      maxQuestions: testConfig.maxQuestions,
      currentIndex: 0,
      startTime: testConfig.startTime,
      results: [],
      usedQuestions: new Set(),
      currentQuestion: null
    }

    // Select first question
    const firstQuestion = this.selectNextQuestion()
    this.currentTest.currentQuestion = firstQuestion
    this.currentTest.questionStartTime = Date.now()

    this.isRunning = true
    return this.currentTest
  }

  selectNextQuestion() {
    // Filter available questions (not yet used)
    const availableQuestions = this.currentTest.questionPool.filter(q =>
      !this.currentTest.usedQuestions.has(q.id)
    )

    if (availableQuestions.length === 0) {
      return null // No more questions
    }

    // Use CAT algorithm to select optimal question
    const selectedQuestion = this.selectOptimalQuestion(availableQuestions)

    if (selectedQuestion) {
      this.currentTest.usedQuestions.add(selectedQuestion.id)
      selectedQuestion.id = this.currentTest.currentIndex + 1 // Renumber for display
    }

    return selectedQuestion
  }

  async submitAnswer(questionId, userAnswer) {
    if (!this.isRunning || !this.currentTest) {
      throw new Error('No active placement test')
    }

    const question = this.currentTest.currentQuestion
    if (!question || question.id !== questionId) {
      throw new Error('Question ID mismatch')
    }

    const isCorrect = this.normalizeAnswer(userAnswer) === this.normalizeAnswer(question.expectedAnswer)
    const responseTime = Date.now() - (this.currentTest.questionStartTime || Date.now())

    // Update ability estimate using CAT algorithm
    const abilityUpdate = this.updateAbilityEstimate(isCorrect, question)

    const result = {
      questionId,
      targetLevel: question.targetLevel,
      difficulty: question.difficulty,
      isCorrect,
      responseTime,
      userAnswer: userAnswer.trim(),
      expectedAnswer: question.expectedAnswer,
      abilityEstimate: this.abilityEstimate,
      standardError: this.standardError,
      estimatedLevel: this.thetaToLevel(this.abilityEstimate)
    }

    this.currentTest.results.push(result)
    this.currentTest.currentIndex++

    // Check if test should terminate
    if (this.shouldTerminate()) {
      return await this.completePlacementTest()
    }

    // Select next question
    const nextQuestion = this.selectNextQuestion()
    if (!nextQuestion) {
      // No more questions available
      return await this.completePlacementTest()
    }

    this.currentTest.currentQuestion = nextQuestion
    this.currentTest.questionStartTime = Date.now()

    return {
      completed: false,
      nextQuestion: nextQuestion,
      progress: Math.min((this.currentTest.currentIndex / this.currentTest.maxQuestions) * 100, 95),
      currentEstimate: {
        level: this.thetaToLevel(this.abilityEstimate),
        theta: this.abilityEstimate,
        confidence: Math.max(0, Math.min(100, (1 - this.standardError) * 100))
      }
    }
  }

  async completePlacementTest() {
    if (!this.currentTest) {
      throw new Error('No active test to complete')
    }

    const analysis = this.analyzePlacementResults()
    const determinedLevel = this.determineLevelFromResults(analysis)

    // Save to user profile
    const profile = await getCurrentUserProfile()
    await profile.setLevel(determinedLevel, 'placement_test')

    this.isRunning = false
    const completedTest = {
      ...this.currentTest,
      completed: true,
      analysis,
      determinedLevel,
      completionTime: Date.now() - this.currentTest.startTime
    }

    this.testResults.push(completedTest)
    this.currentTest = null

    return completedTest
  }

  analyzePlacementResults() {
    const results = this.currentTest.results
    const analysis = {
      totalQuestions: results.length,
      totalCorrect: results.filter(r => r.isCorrect).length,
      overallAccuracy: 0,
      levelBreakdown: {},
      avgResponseTime: 0
    }

    analysis.overallAccuracy = analysis.totalCorrect / analysis.totalQuestions

    // Analyze by level
    ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].forEach(level => {
      const levelResults = results.filter(r => r.targetLevel === level)
      if (levelResults.length > 0) {
        analysis.levelBreakdown[level] = {
          total: levelResults.length,
          correct: levelResults.filter(r => r.isCorrect).length,
          accuracy: levelResults.filter(r => r.isCorrect).length / levelResults.length
        }
      }
    })

    analysis.avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length

    return analysis
  }

  determineLevelFromResults(analysis) {
    // Find highest level with 70%+ accuracy
    const levels = ['C2', 'C1', 'B2', 'B1', 'A2', 'A1']

    for (const level of levels) {
      const levelData = analysis.levelBreakdown[level]
      if (levelData && levelData.accuracy >= 0.70) {
        return level
      }
    }

    // Default to A1 if no level meets threshold
    return 'A1'
  }

  normalizeAnswer(answer) {
    return answer.toLowerCase().trim()
      .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
      .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
      .replace(/ü/g, 'u')
  }

  getCurrentQuestion() {
    if (!this.currentTest || !this.isRunning) return null
    return this.currentTest.currentQuestion
  }

  getTestProgress() {
    if (!this.currentTest) return 0
    return Math.min((this.currentTest.currentIndex / this.currentTest.maxQuestions) * 100, 95)
  }

  getCurrentEstimate() {
    if (!this.currentTest || this.currentTest.results.length === 0) {
      return {
        level: 'A1',
        theta: 0.0,
        confidence: 0
      }
    }

    return {
      level: this.thetaToLevel(this.abilityEstimate),
      theta: this.abilityEstimate,
      confidence: Math.max(0, Math.min(100, (1 - this.standardError) * 100))
    }
  }

  isTestActive() {
    return this.isRunning && this.currentTest !== null
  }

  abortTest() {
    this.isRunning = false
    this.currentTest = null
  }
}

// Continuous assessment based on practice performance
export class ContinuousAssessment {
  static async evaluateUserProgress() {
    const profile = await getCurrentUserProfile()
    const stats = profile.competencyStats

    if (Object.keys(stats).length === 0) {
      return { recommendation: 'no_data', confidence: 0 }
    }

    const currentLevel = profile.getCurrentLevel()
    const analysis = this.analyzeCompetencyStats(stats, currentLevel)

    return {
      currentLevel,
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
      readyForPromotion: analysis.readyForPromotion,
      suggestedActions: analysis.suggestedActions
    }
  }

  static analyzeCompetencyStats(stats, currentLevel) {
    const allStats = Object.values(stats)
    const overallAccuracy = allStats.reduce((sum, stat) => sum + stat.accuracy, 0) / allStats.length
    const totalAttempts = allStats.reduce((sum, stat) => sum + stat.attempts, 0)

    // Minimum data requirement
    if (totalAttempts < 50) {
      return {
        recommendation: 'more_practice',
        confidence: 0.3,
        readyForPromotion: false,
        suggestedActions: ['Continúa practicando para generar más datos']
      }
    }

    const promotionThreshold = 0.85
    const demotionThreshold = 0.60
    const confidenceThreshold = 100 // minimum attempts for high confidence

    const confidence = Math.min(totalAttempts / confidenceThreshold, 1.0)

    if (overallAccuracy >= promotionThreshold && totalAttempts >= confidenceThreshold) {
      return {
        recommendation: 'promote',
        confidence,
        readyForPromotion: true,
        suggestedActions: ['Listo para avanzar al siguiente nivel']
      }
    }

    if (overallAccuracy < demotionThreshold && totalAttempts >= confidenceThreshold) {
      return {
        recommendation: 'consider_demotion',
        confidence,
        readyForPromotion: false,
        suggestedActions: ['Considera practicar en un nivel más básico']
      }
    }

    return {
      recommendation: 'maintain',
      confidence,
      readyForPromotion: false,
      suggestedActions: ['Continúa practicando en tu nivel actual']
    }
  }
}

// Global assessment instance
let globalAssessment = null

export function getGlobalAssessment() {
  if (!globalAssessment) {
    globalAssessment = new LevelAssessment()
  }
  return globalAssessment
}

export async function runQuickAssessment() {
  const assessment = getGlobalAssessment()
  return await assessment.startPlacementTest(10) // Shorter test
}

export async function runFullAssessment() {
  const assessment = getGlobalAssessment()
  return await assessment.startPlacementTest(15) // Full test
}