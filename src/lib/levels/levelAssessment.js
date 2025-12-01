// Simple Level Test for Spanish Verb Conjugation
// Professional but simple implementation - no complex CAT algorithms
// Enhanced with dynamic evaluation integration

import { getCurrentUserProfile, setGlobalPlacementTestBaseline } from './userLevelProfile.js'
import { trackAttemptStarted, trackAttemptSubmitted } from '../progress/tracking.js'

// Curated question pool: 15 questions per CEFR level (A1-C1)
// Explicit metadata for precise competency tracking
const QUESTION_POOL = {
  A1: [
    {
      id: 'a1_1',
      prompt: 'Yo ____ estudiante de español.',
      options: ['soy', 'estoy', 'tengo', 'hago'],
      correct: 'soy',
      explanation: 'Usamos "ser" para profesiones o características permanentes.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'ser_vs_estar' }
    },
    {
      id: 'a1_2',
      prompt: 'Nosotros ____ en casa.',
      options: ['somos', 'estamos', 'tenemos', 'hacemos'],
      correct: 'estamos',
      explanation: 'Usamos "estar" para ubicación.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'ser_vs_estar' }
    },
    {
      id: 'a1_3',
      prompt: 'Ella ____ español todos los días.',
      options: ['habla', 'hablas', 'hablo', 'hablan'],
      correct: 'habla',
      explanation: 'Tercera persona singular de verbos regulares -ar.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'regular_ar' }
    },
    {
      id: 'a1_4',
      prompt: 'Ustedes ____ mucha agua.',
      options: ['beben', 'bebe', 'bebo', 'bebes'],
      correct: 'beben',
      explanation: 'Tercera persona plural de verbos regulares -er.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'regular_er' }
    },
    {
      id: 'a1_5',
      prompt: 'Tú ____ en Argentina.',
      options: ['vive', 'vivo', 'vives', 'viven'],
      correct: 'vives',
      explanation: 'Segunda persona singular de verbos regulares -ir.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'regular_ir' }
    },
    {
      id: 'a1_6',
      prompt: 'Mi hermana ____ 25 años.',
      options: ['tiene', 'tienes', 'tengo', 'tenemos'],
      correct: 'tiene',
      explanation: 'Expresión de edad con "tener".',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'tener_age' }
    },
    {
      id: 'a1_7',
      prompt: 'Nosotros ____ al trabajo en colectivo.',
      options: ['vamos', 'van', 'va', 'voy'],
      correct: 'vamos',
      explanation: 'Primera persona plural del verbo irregular "ir".',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'irregular_ir' }
    },
    {
      id: 'a1_8',
      prompt: 'Ellos ____ la tarea.',
      options: ['hacen', 'hace', 'hago', 'haces'],
      correct: 'hacen',
      explanation: 'Tercera persona plural del verbo irregular "hacer".',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'irregular_hacer' }
    },
    {
      id: 'a1_9',
      prompt: '¿Tú ____ café o té?',
      options: ['quieres', 'quiere', 'queremos', 'quieren'],
      correct: 'quieres',
      explanation: 'Verbo irregular "querer" (e->ie) en segunda persona.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'stem_change_e_ie' }
    },
    {
      id: 'a1_10',
      prompt: 'Yo no ____ la respuesta.',
      options: ['sé', 'sabes', 'sabe', 'sabemos'],
      correct: 'sé',
      explanation: 'Primera persona singular del verbo irregular "saber".',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'irregular_yo' }
    },
    {
      id: 'a1_11',
      prompt: 'Mis padres ____ muy simpáticos.',
      options: ['son', 'están', 'tienen', 'van'],
      correct: 'son',
      explanation: '"Ser" para descripciones de personalidad.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'ser_description' }
    },
    {
      id: 'a1_12',
      prompt: '¿A qué hora ____ tú?',
      options: ['sales', 'salgo', 'sale', 'salen'],
      correct: 'sales',
      explanation: 'Verbo "salir" en segunda persona singular.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'irregular_yo_derivative' }
    },
    {
      id: 'a1_13',
      prompt: 'Yo ____ música todos los días.',
      options: ['escucho', 'escucha', 'escuchas', 'escuchan'],
      correct: 'escucho',
      explanation: 'Primera persona singular regular -ar.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'regular_ar' }
    },
    {
      id: 'a1_14',
      prompt: '¿Dónde ____ el baño?',
      options: ['está', 'es', 'hay', 'tiene'],
      correct: 'está',
      explanation: '"Estar" para ubicación de cosas.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'ser_vs_estar' }
    },
    {
      id: 'a1_15',
      prompt: 'Nosotros ____ hambre.',
      options: ['tenemos', 'somos', 'estamos', 'hacemos'],
      correct: 'tenemos',
      explanation: 'Expresiones con "tener" (tener hambre/sed/frío).',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'tener_idioms' }
    }
  ],

  A2: [
    {
      id: 'a2_1',
      prompt: 'Ayer yo ____ al cine.',
      options: ['fui', 'iba', 'voy', 'iré'],
      correct: 'fui',
      explanation: 'Pretérito indefinido para acciones específicas del pasado.',
      competencyInfo: { mood: 'indicative', tense: 'pretIndef', rule: 'irregular_ir_ser' }
    },
    {
      id: 'a2_2',
      prompt: 'Cuando era niño ____ mucho.',
      options: ['jugaba', 'jugué', 'juego', 'jugaré'],
      correct: 'jugaba',
      explanation: 'Imperfecto para acciones habituales del pasado.',
      competencyInfo: { mood: 'indicative', tense: 'imp', rule: 'habitual_past' }
    },
    {
      id: 'a2_3',
      prompt: 'Mañana nosotros ____ a la playa.',
      options: ['iremos', 'fuimos', 'íbamos', 'vamos'],
      correct: 'iremos',
      explanation: 'Futuro simple para planes futuros.',
      competencyInfo: { mood: 'indicative', tense: 'fut', rule: 'regular_future' }
    },
    {
      id: 'a2_4',
      prompt: 'Ellos ____ la película anoche.',
      options: ['vieron', 'veían', 'ven', 'verán'],
      correct: 'vieron',
      explanation: 'Pretérito indefinido del verbo irregular "ver".',
      competencyInfo: { mood: 'indicative', tense: 'pretIndef', rule: 'irregular_ver' }
    },
    {
      id: 'a2_5',
      prompt: 'No ____ terminar el trabajo ayer.',
      options: ['pude', 'podía', 'puedo', 'podré'],
      correct: 'pude',
      explanation: 'Pretérito indefinido de "poder" para imposibilidad específica.',
      competencyInfo: { mood: 'indicative', tense: 'pretIndef', rule: 'irregular_u_stem' }
    },
    {
      id: 'a2_6',
      prompt: 'Antes yo ____ en Madrid.',
      options: ['vivía', 'viví', 'vivo', 'viviré'],
      correct: 'vivía',
      explanation: 'Imperfecto para situaciones habituales del pasado.',
      competencyInfo: { mood: 'indicative', tense: 'imp', rule: 'habitual_past' }
    },
    {
      id: 'a2_7',
      prompt: 'La tienda ____ a las 9 de la mañana.',
      options: ['abre', 'abría', 'abrió', 'abrirá'],
      correct: 'abre',
      explanation: 'Presente para horarios y rutinas.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'routine_present' }
    },
    {
      id: 'a2_8',
      prompt: 'El año pasado ____ a Francia.',
      options: ['viajé', 'viajaba', 'viajo', 'viajaré'],
      correct: 'viajé',
      explanation: 'Pretérito indefinido para eventos específicos.',
      competencyInfo: { mood: 'indicative', tense: 'pretIndef', rule: 'regular_ar' }
    },
    {
      id: 'a2_9',
      prompt: '¿A qué hora ____ el restaurante?',
      options: ['cierra', 'cerraba', 'cerró', 'cerrará'],
      correct: 'cierra',
      explanation: 'Cambio vocálico e→ie en presente.',
      competencyInfo: { mood: 'indicative', tense: 'pres', rule: 'stem_change_e_ie' }
    },
    {
      id: 'a2_10',
      prompt: 'Los niños ____ en el parque todos los días.',
      options: ['jugaban', 'jugaron', 'juegan', 'jugarán'],
      correct: 'jugaban',
      explanation: 'Imperfecto para acciones repetidas en el pasado.',
      competencyInfo: { mood: 'indicative', tense: 'imp', rule: 'habitual_past' }
    },
    {
      id: 'a2_11',
      prompt: 'Anoche ____ una pizza.',
      options: ['comí', 'comía', 'como', 'comeré'],
      correct: 'comí',
      explanation: 'Pretérito indefinido para acción puntual terminada.',
      competencyInfo: { mood: 'indicative', tense: 'pretIndef', rule: 'regular_er' }
    },
    {
      id: 'a2_12',
      prompt: 'Mientras yo leía, ella ____ la tele.',
      options: ['miraba', 'miró', 'mira', 'mirará'],
      correct: 'miraba',
      explanation: 'Imperfecto para acciones simultáneas en el pasado.',
      competencyInfo: { mood: 'indicative', tense: 'imp', rule: 'simultaneous_past' }
    },
    {
      id: 'a2_13',
      prompt: '¿Qué ____ tú el próximo verano?',
      options: ['harás', 'haces', 'hiciste', 'hacías'],
      correct: 'harás',
      explanation: 'Futuro simple irregular de "hacer".',
      competencyInfo: { mood: 'indicative', tense: 'fut', rule: 'irregular_future' }
    },
    {
      id: 'a2_14',
      prompt: 'Ayer ____ mucho frío.',
      options: ['hizo', 'hacía', 'hace', 'hará'],
      correct: 'hizo',
      explanation: 'Pretérito indefinido para clima en momento específico.',
      competencyInfo: { mood: 'indicative', tense: 'pretIndef', rule: 'irregular_hacer' }
    },
    {
      id: 'a2_15',
      prompt: 'Nunca ____ a ese restaurante.',
      options: ['he ido', 'fui', 'iba', 'voy'],
      correct: 'he ido',
      explanation: 'Pretérito perfecto para experiencias de vida (sin tiempo específico).',
      competencyInfo: { mood: 'indicative', tense: 'pretPerf', rule: 'life_experience' }
    }
  ],

  B1: [
    {
      id: 'b1_1',
      prompt: 'Espero que ____ tiempo para visitarnos.',
      options: ['tengas', 'tienes', 'tenías', 'tendrás'],
      correct: 'tengas',
      explanation: 'Subjuntivo presente después de expresiones de esperanza.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'wishes_hopes' }
    },
    {
      id: 'b1_2',
      prompt: 'Si tuviera dinero, ____ un viaje.',
      options: ['haría', 'hago', 'hice', 'haré'],
      correct: 'haría',
      explanation: 'Condicional simple en oraciones hipotéticas.',
      competencyInfo: { mood: 'indicative', tense: 'cond', rule: 'conditional_hypothetical' }
    },
    {
      id: 'b1_3',
      prompt: 'Este año ____ tres veces a París.',
      options: ['he ido', 'fui', 'iba', 'iré'],
      correct: 'he ido',
      explanation: 'Pretérito perfecto para experiencias con relevancia presente.',
      competencyInfo: { mood: 'indicative', tense: 'pretPerf', rule: 'present_relevance' }
    },
    {
      id: 'b1_4',
      prompt: 'Es importante que tú ____ temprano.',
      options: ['llegues', 'llegas', 'llegabas', 'llegarás'],
      correct: 'llegues',
      explanation: 'Subjuntivo presente después de expresiones de importancia/necesidad.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'impersonal_expressions' }
    },
    {
      id: 'b1_5',
      prompt: 'Cuando llegué, ellos ya ____.',
      options: ['se habían ido', 'se fueron', 'se iban', 'se van'],
      correct: 'se habían ido',
      explanation: 'Pluscuamperfecto para acciones anteriores a otra del pasado.',
      competencyInfo: { mood: 'indicative', tense: 'pretPlus', rule: 'past_of_past' }
    },
    {
      id: 'b1_6',
      prompt: 'No creo que él ____ la verdad.',
      options: ['diga', 'dice', 'decía', 'dirá'],
      correct: 'diga',
      explanation: 'Subjuntivo presente después de expresiones de duda.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'doubts' }
    },
    {
      id: 'b1_7',
      prompt: 'En tu lugar, yo ____ con el jefe.',
      options: ['hablaría', 'hablo', 'hablé', 'hable'],
      correct: 'hablaría',
      explanation: 'Condicional para consejos y situaciones hipotéticas.',
      competencyInfo: { mood: 'indicative', tense: 'cond', rule: 'advice' }
    },
    {
      id: 'b1_8',
      prompt: 'Dudo que ____ terminado a tiempo.',
      options: ['hayan', 'han', 'habían', 'habrán'],
      correct: 'hayan',
      explanation: 'Subjuntivo perfecto para acciones pasadas con duda.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPerf', rule: 'past_doubt' }
    },
    {
      id: 'b1_9',
      prompt: '¿Alguna vez ____ paella?',
      options: ['has comido', 'comiste', 'comías', 'comerás'],
      correct: 'has comido',
      explanation: 'Pretérito perfecto para experiencias pasadas.',
      competencyInfo: { mood: 'indicative', tense: 'pretPerf', rule: 'life_experience' }
    },
    {
      id: 'b1_10',
      prompt: 'Me alegra que ____ bien.',
      options: ['estés', 'estás', 'estabas', 'estarás'],
      correct: 'estés',
      explanation: 'Subjuntivo presente después de expresiones de emoción.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'emotions' }
    },
    {
      id: 'b1_11',
      prompt: 'Busco una secretaria que ____ inglés.',
      options: ['hable', 'habla', 'habló', 'hablará'],
      correct: 'hable',
      explanation: 'Subjuntivo en oraciones relativas con antecedente desconocido.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'unknown_antecedent' }
    },
    {
      id: 'b1_12',
      prompt: 'Cuando ____ mayor, seré astronauta.',
      options: ['sea', 'soy', 'fui', 'seré'],
      correct: 'sea',
      explanation: 'Subjuntivo en oraciones temporales con referencia al futuro.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'temporal_future' }
    },
    {
      id: 'b1_13',
      prompt: 'Te llamaré en cuanto ____ a casa.',
      options: ['llegue', 'llego', 'llegué', 'llegaré'],
      correct: 'llegue',
      explanation: 'Subjuntivo con "en cuanto" refiriéndose al futuro.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'temporal_future' }
    },
    {
      id: 'b1_14',
      prompt: 'Es probable que ____ mañana.',
      options: ['llueva', 'llueve', 'llovía', 'lloverá'],
      correct: 'llueva',
      explanation: 'Subjuntivo con expresiones de probabilidad.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'probability' }
    },
    {
      id: 'b1_15',
      prompt: '¡No ____ eso!',
      options: ['hagas', 'haces', 'haz', 'hiciste'],
      correct: 'hagas',
      explanation: 'Imperativo negativo usa forma de subjuntivo.',
      competencyInfo: { mood: 'imperative', tense: 'impNeg', rule: 'negative_command' }
    }
  ],

  B2: [
    {
      id: 'b2_1',
      prompt: 'Si ____ más dinero, viajaría por el mundo.',
      options: ['tuviera', 'tengo', 'tenía', 'tendré'],
      correct: 'tuviera',
      explanation: 'Subjuntivo imperfecto en oraciones condicionales irreales.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'conditional_if' }
    },
    {
      id: 'b2_2',
      prompt: '¿____ ayudarme con este problema?',
      options: ['Podrías', 'Puedes', 'Pudiste', 'Puedas'],
      correct: 'Podrías',
      explanation: 'Condicional para peticiones corteses.',
      competencyInfo: { mood: 'indicative', tense: 'cond', rule: 'politeness' }
    },
    {
      id: 'b2_3',
      prompt: 'Si ____ llegado antes, habríamos cenado juntos.',
      options: ['hubieras', 'habrías', 'habías', 'hubieses'],
      correct: 'hubieras',
      explanation: 'Subjuntivo pluscuamperfecto en oraciones condicionales pasadas.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPlus', rule: 'conditional_past' }
    },
    {
      id: 'b2_4',
      prompt: 'Con más tiempo, ____ terminado el proyecto.',
      options: ['habríamos', 'habría', 'habremos', 'hemos'],
      correct: 'habríamos',
      explanation: 'Condicional perfecto para situaciones hipotéticas del pasado.',
      competencyInfo: { mood: 'indicative', tense: 'condPerf', rule: 'hypothetical_past' }
    },
    {
      id: 'b2_5',
      prompt: 'María dijo que ____ al médico la semana siguiente.',
      options: ['iría', 'va', 'fue', 'vaya'],
      correct: 'iría',
      explanation: 'Condicional en estilo indirecto para futuro del pasado.',
      competencyInfo: { mood: 'indicative', tense: 'cond', rule: 'reported_speech' }
    },
    {
      id: 'b2_6',
      prompt: 'Aunque ____ cansado, siguió trabajando.',
      options: ['estuviera', 'está', 'estaba', 'estaría'],
      correct: 'estuviera',
      explanation: 'Subjuntivo imperfecto con "aunque" en situaciones hipotéticas/concesivas.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'concessive' }
    },
    {
      id: 'b2_7',
      prompt: 'No pensé que ____ tan difícil.',
      options: ['fuera', 'es', 'era', 'sería'],
      correct: 'fuera',
      explanation: 'Subjuntivo imperfecto en estilo indirecto del pasado.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'past_opinion' }
    },
    {
      id: 'b2_8',
      prompt: 'Te habría llamado si ____ tu número.',
      options: ['hubiera tenido', 'tenía', 'tuve', 'tendría'],
      correct: 'hubiera tenido',
      explanation: 'Subjuntivo pluscuamperfecto en condicionales del pasado.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPlus', rule: 'conditional_past' }
    },
    {
      id: 'b2_9',
      prompt: 'Ojalá ____ más tiempo para estudiar.',
      options: ['tuviera', 'tengo', 'tenía', 'tendré'],
      correct: 'tuviera',
      explanation: 'Subjuntivo imperfecto para deseos poco probables o imposibles.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'wishes_impossible' }
    },
    {
      id: 'b2_10',
      prompt: 'Para cuando llegues, ya ____ la cena.',
      options: ['habré preparado', 'preparo', 'preparé', 'prepararé'],
      correct: 'habré preparado',
      explanation: 'Futuro perfecto para acciones completadas antes de un momento futuro.',
      competencyInfo: { mood: 'indicative', tense: 'futPerf', rule: 'future_completed' }
    },
    {
      id: 'b2_11',
      prompt: 'Me pidió que ____ la puerta.',
      options: ['cerrara', 'cierre', 'cerré', 'cerraría'],
      correct: 'cerrara',
      explanation: 'Subjuntivo imperfecto tras petición en pasado.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'request_past' }
    },
    {
      id: 'b2_12',
      prompt: 'Como no ____ pronto, perderemos el tren.',
      options: ['vengas', 'vienes', 'venías', 'vendrás'],
      correct: 'vengas',
      explanation: 'Subjuntivo con "como" condicional/causal.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'conditional_como' }
    },
    {
      id: 'b2_13',
      prompt: 'No era verdad que ____ enfermo.',
      options: ['estuviera', 'estaba', 'estuvo', 'estaría'],
      correct: 'estuviera',
      explanation: 'Subjuntivo imperfecto tras negación de verdad en pasado.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'denial_past' }
    },
    {
      id: 'b2_14',
      prompt: '¡Quién ____ rico!',
      options: ['fuera', 'es', 'era', 'sería'],
      correct: 'fuera',
      explanation: 'Subjuntivo imperfecto para deseos imposibles (¡Quién...!).',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'wishes_quien' }
    },
    {
      id: 'b2_15',
      prompt: 'Les aconsejé que no ____ nada.',
      options: ['dijeran', 'digan', 'dijeron', 'dirían'],
      correct: 'dijeran',
      explanation: 'Subjuntivo imperfecto tras consejo en pasado.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'advice_past' }
    }
  ],

  C1: [
    {
      id: 'c1_1',
      prompt: 'Aunque ____ mucho dinero, no sería feliz.',
      options: ['tuviera', 'tenía', 'tenga', 'tendría'],
      correct: 'tuviera',
      explanation: 'Subjuntivo imperfecto con "aunque" para situaciones hipotéticas muy improbables.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjImp', rule: 'concessive_hypothetical' }
    },
    {
      id: 'c1_2',
      prompt: '____ terminado el trabajo, se fue a casa.',
      options: ['Habiendo', 'Haber', 'Había', 'Ha'],
      correct: 'Habiendo',
      explanation: 'Gerundio compuesto para acciones anteriores.',
      competencyInfo: { mood: 'indicative', tense: 'gerundComp', rule: 'gerund_anteriority' }
    },
    {
      id: 'c1_3',
      prompt: 'Quien ____ interesado, que se ponga en contacto.',
      options: ['esté', 'está', 'estuviere', 'estaría'],
      correct: 'esté',
      explanation: 'Subjuntivo presente en oraciones de relativo con antecedente indefinido.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'relative_indefinite' }
    },
    {
      id: 'c1_4',
      prompt: 'De ____ sabido la verdad, no habría venido.',
      options: ['haber', 'haber', 'había', 'hubiera'],
      correct: 'haber',
      explanation: 'Infinitivo compuesto en construcciones condicionales ("De haber...").',
      competencyInfo: { mood: 'indicative', tense: 'infComp', rule: 'conditional_infinitive' }
    },
    {
      id: 'c1_5',
      prompt: 'Por mucho que ____, no conseguirás convencerlo.',
      options: ['insistas', 'insistes', 'insistías', 'insistirás'],
      correct: 'insistas',
      explanation: 'Subjuntivo presente en oraciones concesivas con "por mucho que".',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'concessive_structure' }
    },
    {
      id: 'c1_6',
      prompt: 'No es que no ____, sino que no puede.',
      options: ['quiera', 'quiere', 'querría', 'quisiera'],
      correct: 'quiera',
      explanation: 'Subjuntivo presente en construcciones con "no es que".',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'contrastive_negation' }
    },
    {
      id: 'c1_7',
      prompt: 'Apenas ____ el sol cuando empezó a llover.',
      options: ['hubo salido', 'salió', 'había salido', 'salía'],
      correct: 'hubo salido',
      explanation: 'Pretérito anterior en construcciones temporales literarias.',
      competencyInfo: { mood: 'indicative', tense: 'pretAnt', rule: 'literary_past' }
    },
    {
      id: 'c1_8',
      prompt: 'Fuera como ____, hay que seguir adelante.',
      options: ['fuere', 'fuera', 'sea', 'sería'],
      correct: 'fuere',
      explanation: 'Subjuntivo futuro en expresiones fijas (registro formal).',
      competencyInfo: { mood: 'subjunctive', tense: 'subjFut', rule: 'fixed_expression_future_subj' }
    },
    {
      id: 'c1_9',
      prompt: 'A no ser que ____ problemas, llegaremos a tiempo.',
      options: ['surjan', 'surgen', 'surgían', 'surgirán'],
      correct: 'surjan',
      explanation: 'Subjuntivo presente después de "a no ser que".',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'conditional_connector' }
    },
    {
      id: 'c1_10',
      prompt: 'Mal que ____, tendremos que aceptar.',
      options: ['nos pese', 'nos pesa', 'nos pesaba', 'nos pesará'],
      correct: 'nos pese',
      explanation: 'Subjuntivo presente en expresiones fijas concesivas.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'fixed_concessive' }
    },
    {
      id: 'c1_11',
      prompt: 'Si ____ hubieras dicho antes...',
      options: ['me lo', 'te lo', 'se lo', 'nos lo'],
      correct: 'me lo',
      explanation: 'Colocación de pronombres dobles.',
      competencyInfo: { mood: 'indicative', tense: 'pretPlus', rule: 'pronoun_placement' }
    },
    {
      id: 'c1_12',
      prompt: 'El hecho de que ____ tarde no es excusa.',
      options: ['hayas llegado', 'has llegado', 'llegaste', 'llegabas'],
      correct: 'hayas llegado',
      explanation: 'Subjuntivo perfecto tras "el hecho de que".',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPerf', rule: 'fact_clause' }
    },
    {
      id: 'c1_13',
      prompt: 'No ____ ser que se haya equivocado.',
      options: ['vaya a', 'va a', 'fue a', 'iría a'],
      correct: 'vaya a',
      explanation: 'Perífrasis de probabilidad con subjuntivo.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'probability_periphrasis' }
    },
    {
      id: 'c1_14',
      prompt: 'Sea quien ____, no abras la puerta.',
      options: ['sea', 'es', 'fuera', 'será'],
      correct: 'sea',
      explanation: 'Subjuntivo en oraciones concesivas indefinidas.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'indefinite_concessive' }
    },
    {
      id: 'c1_15',
      prompt: '____ lo que ____, te apoyaré.',
      options: ['Hagas / hagas', 'Haces / haces', 'Hicieras / hicieras', 'Harás / harás'],
      correct: 'Hagas / hagas',
      explanation: 'Subjuntivo en estructura reduplicativa concesiva.',
      competencyInfo: { mood: 'subjunctive', tense: 'subjPres', rule: 'reduplicative_subjunctive' }
    }
  ]
}

// Simple Level Test Class - no complex algorithms
class SimpleLevelTest {
  constructor() {
    this.currentLevel = 'A1'
    this.currentQuestionIndex = 0
    this.results = []
    this.isActive = false
    this.questionsUsed = new Set()
    this.maxQuestionsPerLevel = 5 // Increased from 3 to 5 for better accuracy
    this.levelProgression = ['A1', 'A2', 'B1', 'B2', 'C1']
    this.currentLevelIndex = 0
    this.questionsInCurrentLevel = 0
    this.consecutiveFailures = 0
    this.maxTotalQuestions = 20 // Increased from 15 to 20
    this.trackingEnabled = true // Enable tracking integration
    this.currentAttemptId = null // Track current attempt for progress system
    this.testStartTime = null // Track test duration
  }

  startTest() {
    this.currentLevel = 'A1'
    this.currentLevelIndex = 0
    this.currentQuestionIndex = 0
    this.results = []
    this.isActive = true
    this.questionsUsed = new Set()
    this.questionsInCurrentLevel = 0
    this.consecutiveFailures = 0
    this.testStartTime = Date.now()

    const firstQuestion = this.getNextQuestion()

    // Start tracking for the first question if tracking is enabled
    if (this.trackingEnabled && firstQuestion) {
      this.startQuestionTracking(firstQuestion)
    }

    return {
      active: true,
      currentQuestion: firstQuestion,
      currentIndex: this.currentQuestionIndex - 1,
      maxQuestions: this.maxTotalQuestions,
      progress: this.getProgress(),
      currentEstimate: this.getCurrentEstimate()
    }
  }

  getNextQuestion() {
    if (!this.isActive) return null

    // Safety check: prevent infinite loops
    if (this.currentQuestionIndex >= this.maxTotalQuestions) {
      console.log('🛑 Reached maximum questions, completing test')
      return null
    }

    const levelQuestions = QUESTION_POOL[this.currentLevel]
    if (!levelQuestions || levelQuestions.length === 0) {
      console.log('🛑 No questions available for level', this.currentLevel)
      return null
    }

    const availableQuestions = levelQuestions.filter(q => !this.questionsUsed.has(q.id))

    if (availableQuestions.length === 0) {
      // No more questions in this level, move to next
      console.log('📚 No more questions in level', this.currentLevel, 'moving to next')
      const nextResult = this.moveToNextLevel()
      return nextResult?.nextQuestion || null
    }

    // Select random question from available ones
    const randomIndex = Math.floor(Math.random() * availableQuestions.length)
    const question = availableQuestions[randomIndex]

    this.questionsUsed.add(question.id)
    this.currentQuestionIndex++

    return {
      id: question.id,
      prompt: question.prompt,
      options: question.options,
      expectedAnswer: question.correct,
      explanation: question.explanation,
      targetLevel: this.currentLevel,
      questionNumber: this.currentQuestionIndex,
      difficulty: Math.min(this.currentLevelIndex + 1, 5),
      // Enhanced metadata for dynamic evaluation
      competencyInfo: question.competencyInfo, // Use explicit metadata
      startTime: Date.now()
    }
  }

  submitAnswer(questionId, userAnswer) {
    if (!this.isActive) return { error: 'Test not active' }

    const question = this.findQuestionById(questionId)
    if (!question) return { error: 'Question not found' }

    const isCorrect = userAnswer === question.correct
    const responseTime = Date.now() - (question.startTime || Date.now())

    // Enhanced result with tracking metadata
    const result = {
      questionId,
      userAnswer,
      correctAnswer: question.correct,
      isCorrect,
      level: this.currentLevel,
      responseTime,
      competencyInfo: question.competencyInfo,
      difficulty: Math.min(this.currentLevelIndex + 1, 5),
      timestamp: Date.now()
    }

    this.results.push(result)

    // Track with progress system if enabled
    if (this.trackingEnabled && this.currentAttemptId) {
      this.completeQuestionTracking(result)
    }

    this.questionsInCurrentLevel++

    // Adaptive Logic
    if (isCorrect) {
      this.consecutiveFailures = 0

      // Fast-track: If first 3 questions of a level are correct, assume mastery and move up
      if (this.questionsInCurrentLevel === 3 && this.results.slice(-3).every(r => r.isCorrect)) {
        console.log(`🚀 Fast-tracking out of ${this.currentLevel} due to perfect performance`)
        return this.moveToNextLevel()
      }

      // Special case: if in highest level (C1) and answered enough questions correctly, complete test
      if (this.currentLevel === 'C1' && this.questionsInCurrentLevel >= this.maxQuestionsPerLevel) {
        console.log('🏆 Completed C1 level questions, finishing test')
        return this.completeTest()
      }

      // If answered enough questions in this level, try next level
      if (this.questionsInCurrentLevel >= this.maxQuestionsPerLevel) {
        return this.moveToNextLevel()
      }
    } else {
      this.consecutiveFailures++
      // Failure logic:
      // - 3 consecutive failures -> End test
      // - 2 failures in A1 (first level) -> End test (likely A1)
      if (this.consecutiveFailures >= 3 ||
        (this.currentLevel === 'A1' && this.questionsInCurrentLevel >= 3 && this.consecutiveFailures >= 2)) {
        return this.completeTest()
      }
    }

    // Check if we've reached maximum questions
    if (this.currentQuestionIndex >= this.maxTotalQuestions) {
      return this.completeTest()
    }

    const nextQuestion = this.getNextQuestion()
    if (!nextQuestion) {
      return this.completeTest()
    }

    // Start tracking for next question
    if (this.trackingEnabled && nextQuestion) {
      this.startQuestionTracking(nextQuestion)
    }

    return {
      completed: false,
      nextQuestion,
      currentIndex: this.currentQuestionIndex - 1,
      maxQuestions: this.maxTotalQuestions,
      progress: this.getProgress(),
      currentEstimate: this.getCurrentEstimate(),
      feedback: {
        isCorrect,
        explanation: question.explanation,
        responseTime
      }
    }
  }

  moveToNextLevel() {
    if (this.currentLevelIndex >= this.levelProgression.length - 1) {
      // Reached highest level - should complete after demonstrating competency
      console.log('🏆 Already at highest level (C1), completing test')
      return this.completeTest()
    }

    // Safety check: prevent infinite loops
    if (this.currentQuestionIndex >= this.maxTotalQuestions) {
      console.log('🛑 Max questions reached during level move, completing test')
      return this.completeTest()
    }

    this.currentLevelIndex++
    this.currentLevel = this.levelProgression[this.currentLevelIndex]
    this.questionsInCurrentLevel = 0
    this.consecutiveFailures = 0

    console.log('📈 Moved to level', this.currentLevel, 'question', this.currentQuestionIndex + 1)

    const nextQuestion = this.getNextQuestion()
    if (!nextQuestion) {
      console.log('🛑 No next question available, completing test')
      return this.completeTest()
    }

    return {
      completed: false,
      nextQuestion,
      currentIndex: this.currentQuestionIndex - 1,
      maxQuestions: this.maxTotalQuestions,
      progress: this.getProgress(),
      currentEstimate: this.getCurrentEstimate()
    }
  }

  completeTest() {
    this.isActive = false

    // Determine final level based on performance
    let determinedLevel = this.calculateFinalLevel()

    return {
      completed: true,
      determinedLevel,
      totalQuestions: this.currentQuestionIndex,
      correctAnswers: this.results.filter(r => r.isCorrect).length,
      results: this.results,
      progress: 100,
      currentEstimate: { level: determinedLevel, confidence: 85 }
    }
  }

  calculateFinalLevel() {
    const correctByLevel = {}
    const totalByLevel = {}

    // Initialize counts
    this.levelProgression.forEach(level => {
      correctByLevel[level] = 0
      totalByLevel[level] = 0
    })

    this.results.forEach(result => {
      totalByLevel[result.level]++
      if (result.isCorrect) {
        correctByLevel[result.level]++
      }
    })

    // Find highest level where user got majority correct (threshold 70%)
    // Iterate from highest to lowest
    for (let i = this.levelProgression.length - 1; i >= 0; i--) {
      const level = this.levelProgression[i]
      if (totalByLevel[level] > 0) {
        const accuracy = correctByLevel[level] / totalByLevel[level]
        // If they took at least 2 questions and got >= 70% correct
        if (totalByLevel[level] >= 2 && accuracy >= 0.7) {
          return level
        }
        // Special case: Fast-tracked (e.g. 3/3 correct) implies 100% accuracy
        if (totalByLevel[level] < 2 && accuracy === 1 && this.currentLevelIndex > i) {
          return level
        }
      }
    }

    // Default to A1 if no level achieved threshold
    return 'A1'
  }

  findQuestionById(questionId) {
    for (const level of Object.keys(QUESTION_POOL)) {
      const question = QUESTION_POOL[level].find(q => q.id === questionId)
      if (question) return question
    }
    return null
  }

  getProgress() {
    return Math.min((this.currentQuestionIndex / this.maxTotalQuestions) * 100, 100)
  }

  getCurrentEstimate() {
    if (this.results.length === 0) {
      return { level: 'A1', confidence: 0 }
    }

    const recentResults = this.results.slice(-3) // Last 3 answers
    const correctRate = recentResults.filter(r => r.isCorrect).length / recentResults.length

    let estimatedLevel = this.currentLevel
    if (correctRate < 0.3) {
      // Struggling with current level
      const currentIndex = this.levelProgression.indexOf(this.currentLevel)
      if (currentIndex > 0) {
        estimatedLevel = this.levelProgression[currentIndex - 1]
      }
    }

    const confidence = Math.min(50 + (this.results.length * 8), 90)

    return { level: estimatedLevel, confidence }
  }

  abortTest() {
    this.isActive = false
    this.results = []
    this.questionsUsed = new Set()
    this.currentAttemptId = null
  }

  isTestActive() {
    return this.isActive
  }

  getTestProgress() {
    return this.getProgress()
  }

  /**
   * Starts tracking for a question using the progress system
   */
  startQuestionTracking(question) {
    if (!this.trackingEnabled) return

    try {
      const competencyInfo = question.competencyInfo

      if (competencyInfo) {
        // Create a mock item for tracking purposes
        const mockItem = {
          id: `placement-test-${question.id}`,
          mood: competencyInfo.mood,
          tense: competencyInfo.tense,
          person: '3s', // Default person for placement test
          verbId: 'placement_test',
          lemma: 'placement_test',
          form: {
            mood: competencyInfo.mood,
            tense: competencyInfo.tense,
            person: '3s',
            lemma: 'placement_test'
          }
        }

        this.currentAttemptId = trackAttemptStarted(mockItem)
      }
    } catch (error) {
      console.warn('Error starting question tracking:', error)
      this.currentAttemptId = null
    }
  }

  /**
   * Completes tracking for a question using the progress system
   */
  async completeQuestionTracking(result) {
    if (!this.trackingEnabled || !this.currentAttemptId) return

    try {
      const competencyInfo = result.competencyInfo

      if (competencyInfo) {
        // Create tracking result
        const trackingResult = {
          correct: result.isCorrect,
          latencyMs: result.responseTime,
          hintsUsed: 0, // Placement test doesn't use hints
          userAnswer: result.userAnswer,
          correctAnswer: result.correctAnswer,
          item: {
            mood: competencyInfo.mood,
            tense: competencyInfo.tense,
            person: '3s',
            verbId: 'placement_test',
            lemma: 'placement_test',
            form: {
              mood: competencyInfo.mood,
              tense: competencyInfo.tense,
              person: '3s',
              lemma: 'placement_test'
            }
          }
        }

        await trackAttemptSubmitted(this.currentAttemptId, trackingResult)
      }
    } catch (error) {
      console.warn('Error completing question tracking:', error)
    } finally {
      this.currentAttemptId = null
    }
  }
}

// Singleton instance
let globalAssessment = null

export function getGlobalAssessment() {
  if (!globalAssessment) {
    globalAssessment = new SimpleLevelTest()
  }
  return globalAssessment
}

export default SimpleLevelTest