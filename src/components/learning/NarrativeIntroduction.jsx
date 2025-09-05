import React, { useState, useEffect } from 'react';
import { TENSE_LABELS, MOOD_LABELS } from '../../lib/utils/verbLabels.js';
import './NarrativeIntroduction.css';
import { useSettings } from '../../state/settings.js';
import { verbs } from '../../data/verbs.js';

// Verbos paradigmáticos por familia irregular
const PARADIGMATIC_VERBS = {
  // Diptongación
  'DIPHT_E_IE': ['pensar', 'cerrar', 'empezar', 'perder', 'entender', 'querer'],
  'DIPHT_O_UE': ['volver', 'poder', 'contar', 'encontrar', 'recordar', 'llover'], 
  'DIPHT_U_UE': ['jugar'],
  'E_I_IR': ['pedir', 'servir', 'repetir', 'elegir', 'seguir', 'vestir'],
  'O_U_GER_IR': ['dormir', 'morir'],
  
  // Irregulares en YO
  'G_VERBS': ['tener', 'poner', 'salir', 'venir', 'hacer', 'traer'],
  'JO_VERBS': ['proteger', 'elegir', 'dirigir', 'exigir'],
  'GU_DROP': ['seguir', 'distinguir', 'conseguir'],
  'ZCO_VERBS': ['conocer', 'parecer', 'conducir', 'traducir', 'producir', 'crecer'],
  'ZO_VERBS': ['vencer', 'ejercer', 'torcer', 'convencer'],
  'UIR_Y': ['construir', 'huir', 'destruir', 'incluir', 'concluir', 'sustituir'],
  
  // Pretéritos fuertes
  'PRET_UV': ['andar', 'estar', 'tener'],
  'PRET_U': ['poder', 'poner', 'saber', 'caber', 'haber'],
  'PRET_I': ['querer', 'venir', 'hacer'],
  'PRET_J': ['decir', 'traer', 'conducir', 'traducir', 'producir'],
  'PRET_SUPPL': ['ir', 'ser', 'dar', 'ver'],
  'HIATUS_Y': ['leer', 'creer', 'construir', 'caer', 'oír'],
  
  // Ortográficos
  'ORTH_CAR': ['buscar', 'sacar', 'tocar', 'explicar', 'practicar', 'aplicar'],
  'ORTH_GAR': ['llegar', 'pagar', 'jugar', 'entregar', 'negar', 'apagar'],
  'ORTH_ZAR': ['empezar', 'almorzar', 'organizar', 'comenzar', 'alcanzar', 'abrazar'],
  'ORTH_GUAR': ['averiguar', 'apaciguar'],
  
  // Acentuación -iar/-uar
  'IAR_VERBS': ['enviar', 'confiar', 'variar', 'estudiar', 'cambiar'],
  'UAR_VERBS': ['continuar', 'actuar', 'graduar', 'efectuar'],
  
  // Otros irregulares
  'MISC_IRREG': ['oír', 'caer', 'ver', 'dar', 'ir', 'ser', 'estar', 'haber'],
  'DEFECTIVE': ['soler', 'abolir', 'blandir'],
  
  // Futuros/condicionales irregulares
  'FUT_IRREG_DROP_E': ['poder', 'querer', 'saber', 'caber', 'haber'],
  'FUT_IRREG_DROP_ER': ['hacer', 'decir'],
  'FUT_IRREG_D': ['poner', 'tener', 'venir', 'salir'],
  
  // Subjuntivos especiales
  'SUBJ_IRREG': ['ser', 'estar', 'dar', 'ir', 'saber', 'haber']
};

// Seleccionar verbos apropiados según el tipo y familias
function selectAppropriateVerbs(verbType, selectedFamilies, tense) {
  if (verbType === 'regular') {
    // Usar verbos regulares clásicos
    return ['hablar', 'comer', 'vivir'];
  }
  
  if (selectedFamilies && selectedFamilies.length > 0) {
    // Seleccionar verbos paradigmáticos de las familias elegidas
    const selectedVerbs = [];
    
    // Tomar hasta 3 verbos de las familias seleccionadas
    for (const familyId of selectedFamilies) {
      const familyVerbs = PARADIGMATIC_VERBS[familyId] || [];
      // Agregar el primer verbo de cada familia
      if (familyVerbs.length > 0 && selectedVerbs.length < 3) {
        selectedVerbs.push(familyVerbs[0]);
      }
    }
    
    // Completar con verbos adicionales si es necesario
    while (selectedVerbs.length < 3) {
      for (const familyId of selectedFamilies) {
        const familyVerbs = PARADIGMATIC_VERBS[familyId] || [];
        for (const verb of familyVerbs) {
          if (!selectedVerbs.includes(verb) && selectedVerbs.length < 3) {
            selectedVerbs.push(verb);
          }
        }
      }
      break; // Evitar bucle infinito
    }
    
    return selectedVerbs.slice(0, 3);
  }
  
  // Fallback a verbos regulares
  return ['hablar', 'comer', 'vivir'];
}

// Generar contenido dinámico según el tipo de verbo seleccionado
function generateStoryContent(tense, verbType, selectedFamilies) {
  const selectedVerbs = selectAppropriateVerbs(verbType, selectedFamilies, tense);
  
  // Obtener información de los verbos desde la base de datos
  const verbObjects = selectedVerbs.map(lemma => 
    verbs.find(v => v.lemma === lemma)
  ).filter(Boolean);
  
  if (verbType === 'regular') {
    return generateRegularContent(tense, selectedVerbs, verbObjects);
  } else {
    return generateIrregularContent(tense, selectedVerbs, verbObjects, selectedFamilies);
  }
}

// Generar contenido para verbos regulares
function generateRegularContent(tense, selectedVerbs, verbObjects) {
  const templates = {
    pres: {
      title: 'La rutina de Ana',
      sentences: [
        { text: `Todos los días, Ana __${getConjugation(verbObjects[0], 'pres', '3s')}__ con alegría.`, verb: getConjugation(verbObjects[0], 'pres', '3s') },
        { text: `Siempre __${getConjugation(verbObjects[1], 'pres', '3s')}__ algo nuevo.`, verb: getConjugation(verbObjects[1], 'pres', '3s') },
        { text: `Ella __${getConjugation(verbObjects[2], 'pres', '3s')}__ cerca del trabajo.`, verb: getConjugation(verbObjects[2], 'pres', '3s') },
      ],
      explanation: 'Los verbos regulares siguen patrones predecibles. La raíz no cambia, solo se agregan las terminaciones correspondientes.'
    },
    pretIndef: {
      title: 'Una tarde ocupada',
      sentences: [
        { text: `Ayer, Luis __${getConjugation(verbObjects[0], 'pretIndef', '3s')}__ tranquilamente.`, verb: getConjugation(verbObjects[0], 'pretIndef', '3s') },
        { text: `Después __${getConjugation(verbObjects[1], 'pretIndef', '3s')}__ su comida favorita.`, verb: getConjugation(verbObjects[1], 'pretIndef', '3s') },
        { text: `Finalmente __${getConjugation(verbObjects[2], 'pretIndef', '3s')}__ una carta.`, verb: getConjugation(verbObjects[2], 'pretIndef', '3s') },
      ],
      explanation: 'En pretérito indefinido, los verbos regulares mantienen su raíz y toman las terminaciones características de cada conjugación.'
    },
    impf: {
      title: 'Recuerdos de la infancia',
      sentences: [
        { text: `Cuando era niño, Carlos __${getConjugation(verbObjects[0], 'impf', '3s')}__ todos los días.`, verb: getConjugation(verbObjects[0], 'impf', '3s') },
        { text: `Su madre siempre __${getConjugation(verbObjects[1], 'impf', '3s')}__ historias.`, verb: getConjugation(verbObjects[1], 'impf', '3s') },
        { text: `Ellos __${getConjugation(verbObjects[2], 'impf', '3p')}__ en una casa pequeña.`, verb: getConjugation(verbObjects[2], 'impf', '3p') },
      ],
      explanation: 'En imperfecto, los verbos regulares expresan acciones habituales en el pasado con terminaciones predecibles.'
    },
    fut: {
      title: 'Planes para mañana',
      sentences: [
        { text: `Mañana, Elena __${getConjugation(verbObjects[0], 'fut', '3s')}__ con sus amigos.`, verb: getConjugation(verbObjects[0], 'fut', '3s') },
        { text: `También __${getConjugation(verbObjects[1], 'fut', '3s')}__ algo especial.`, verb: getConjugation(verbObjects[1], 'fut', '3s') },
        { text: `Después __${getConjugation(verbObjects[2], 'fut', '3s')}__ en casa.`, verb: getConjugation(verbObjects[2], 'fut', '3s') },
      ],
      explanation: 'En futuro, los verbos regulares conservan todo el infinitivo y agregan las terminaciones de futuro.'
    },
    cond: {
      title: 'En un mundo ideal',
      sentences: [
        { text: `Si fuera posible, María __${getConjugation(verbObjects[0], 'cond', '3s')}__ más tiempo con familia.`, verb: getConjugation(verbObjects[0], 'cond', '3s') },
        { text: `También __${getConjugation(verbObjects[1], 'cond', '3s')}__ comida más saludable.`, verb: getConjugation(verbObjects[1], 'cond', '3s') },
        { text: `Y __${getConjugation(verbObjects[2], 'cond', '3s')}__ en un lugar tranquilo.`, verb: getConjugation(verbObjects[2], 'cond', '3s') },
      ],
      explanation: 'En condicional, los verbos regulares usan el infinitivo completo más las terminaciones de condicional.'
    },
    subjPres: {
      title: 'Deseos y recomendaciones',
      sentences: [
        { text: `Espero que Juan __${getConjugation(verbObjects[0], 'subjPres', '3s', 'subjunctive')}__ bien en el trabajo.`, verb: getConjugation(verbObjects[0], 'subjPres', '3s', 'subjunctive') },
        { text: `Es importante que __${getConjugation(verbObjects[1], 'subjPres', '3s', 'subjunctive')}__ comida saludable.`, verb: getConjugation(verbObjects[1], 'subjPres', '3s', 'subjunctive') },
        { text: `Ojalá que __${getConjugation(verbObjects[2], 'subjPres', '3s', 'subjunctive')}__ feliz.`, verb: getConjugation(verbObjects[2], 'subjPres', '3s', 'subjunctive') },
      ],
      explanation: 'En presente de subjuntivo, los verbos regulares intercambian las vocales: -ar usa -e, -er/-ir usan -a.'
    }
  };
  
  const content = templates[tense] || templates.pres;
  return {
    ...content,
    deconstructions: generateRegularDeconstructions(selectedVerbs, verbObjects, tense)
  };
}

// Generar contenido para verbos irregulares
function generateIrregularContent(tense, selectedVerbs, verbObjects, selectedFamilies) {
  const familyTypes = selectedFamilies || [];
  
  // Determinar el tipo principal de irregularidad
  const irregularityType = determineIrregularityType(familyTypes, tense);
  
  // Generar título, explicación y template según el tipo y tiempo
  const { title, explanation, sentenceTemplate } = getIrregularContentTemplate(irregularityType, tense, familyTypes);
  
  const sentences = generateIrregularSentences(verbObjects, tense, sentenceTemplate, irregularityType);
  
  return {
    title,
    sentences,
    explanation,
    deconstructions: generateIrregularDeconstructions(selectedVerbs, verbObjects, tense, selectedFamilies)
  };
}

// Determinar el tipo principal de irregularidad
function determineIrregularityType(familyTypes, tense) {
  if (familyTypes.includes('DIPHT_E_IE') || familyTypes.includes('DIPHT_O_UE') || familyTypes.includes('DIPHT_U_UE')) {
    return 'diphthong';
  } else if (familyTypes.includes('E_I_IR')) {
    return 'e-i-change';
  } else if (familyTypes.some(f => ['G_VERBS', 'ZCO_VERBS', 'ZO_VERBS', 'JO_VERBS', 'GU_DROP', 'UIR_Y'].includes(f))) {
    return 'yo-irregular';
  } else if (familyTypes.some(f => ['PRET_UV', 'PRET_U', 'PRET_I', 'PRET_J', 'PRET_SUPPL'].includes(f))) {
    return 'strong-preterite';
  } else if (familyTypes.includes('HIATUS_Y')) {
    return 'hiatus-y';
  } else if (familyTypes.some(f => ['ORTH_CAR', 'ORTH_GAR', 'ORTH_ZAR', 'ORTH_GUAR'].includes(f))) {
    return 'orthographic';
  } else if (familyTypes.includes('IAR_VERBS') || familyTypes.includes('UAR_VERBS')) {
    return 'accent-verbs';
  }
  return 'general';
}

// Obtener template de contenido según el tipo de irregularidad
function getIrregularContentTemplate(irregularityType, tense, familyTypes) {
  const templates = {
    diphthong: {
      pres: {
        title: 'Un día especial',
        explanation: 'Estos verbos cambian su vocal de la raíz cuando está acentuada: e→ie, o→ue, u→ue.',
        sentenceTemplate: 'diphthong'
      },
      subjPres: {
        title: 'Deseos con cambio vocálico',
        explanation: 'En presente de subjuntivo, estos verbos mantienen la diptongación: e→ie, o→ue.',
        sentenceTemplate: 'diphthong-subjunctive'
      }
    },
    'e-i-change': {
      pres: {
        title: 'Acciones con cambio e→i',
        explanation: 'Estos verbos -ir cambian e→i en todas las personas excepto nosotros y vosotros.',
        sentenceTemplate: 'e-i-change'
      },
      pretIndef: {
        title: 'Acciones pasadas con cambio e→i',
        explanation: 'En pretérito, estos verbos cambian e→i en las terceras personas y en el gerundio.',
        sentenceTemplate: 'e-i-preterite'
      }
    },
    'yo-irregular': {
      pres: {
        title: 'Lo que hago yo',
        explanation: 'Estos verbos son irregulares en la primera persona del singular (yo), pero regulares en las demás.',
        sentenceTemplate: 'yo-irregular'
      },
      subjPres: {
        title: 'Que yo haga cosas especiales',
        explanation: 'En subjuntivo, la irregularidad de la 1ª persona se extiende a todas las formas.',
        sentenceTemplate: 'yo-irregular-subjunctive'
      }
    },
    'strong-preterite': {
      pretIndef: {
        title: 'Lo que hicieron ayer',
        explanation: 'Estos verbos tienen raíces especiales en pretérito indefinido y terminaciones sin acentos.',
        sentenceTemplate: 'strong-preterite'
      }
    },
    'hiatus-y': {
      pretIndef: {
        title: 'Lecturas del pasado',
        explanation: 'Estos verbos cambian la "i" por "y" en las terceras personas: leyó, leyeron.',
        sentenceTemplate: 'hiatus-y'
      }
    },
    'orthographic': {
      pretIndef: {
        title: 'Cambios de escritura',
        explanation: 'Estos verbos cambian su ortografía para mantener el sonido: -car→-qué, -gar→-gué, -zar→-cé.',
        sentenceTemplate: 'orthographic'
      },
      subjPres: {
        title: 'Subjuntivo con cambios ortográficos',
        explanation: 'En subjuntivo, estos verbos mantienen los cambios ortográficos en todas las formas.',
        sentenceTemplate: 'orthographic-subjunctive'
      }
    },
    general: {
      pres: {
        title: 'Formas especiales',
        explanation: 'Estos verbos tienen patrones irregulares únicos que los distinguen de los regulares.',
        sentenceTemplate: 'general'
      }
    }
  };
  
  const typeTemplate = templates[irregularityType] || templates.general;
  const tenseTemplate = typeTemplate[tense] || typeTemplate.pres || templates.general.pres;
  
  return tenseTemplate;
}

// Obtener conjugación específica de un verbo
function getConjugation(verbObj, tense, person, mood = 'indicative') {
  if (!verbObj || !verbObj.paradigms) return '';
  
  // Buscar el paradigma que contiene las formas para el mood y tense especificados
  const paradigm = verbObj.paradigms.find(p => 
    p.forms?.some(f => f.mood === mood && f.tense === tense)
  );
  
  if (!paradigm || !paradigm.forms) return '';
  
  // Buscar la forma específica
  const form = paradigm.forms.find(f => 
    f.mood === mood && f.tense === tense && f.person === person
  );
  
  if (form && form.value) {
    return form.value;
  }
  
  // Fallback: si no encuentra la forma exacta, buscar formas alternativas
  // Por ejemplo, si busca 2s_tu pero solo existe 2s_vos
  if (person === '2s_tu') {
    const vosForm = paradigm.forms.find(f => 
      f.mood === mood && f.tense === tense && f.person === '2s_vos'
    );
    if (vosForm && vosForm.accepts && vosForm.accepts.tu) {
      return vosForm.accepts.tu;
    }
  }
  
  if (person === '2s_vos') {
    const tuForm = paradigm.forms.find(f => 
      f.mood === mood && f.tense === tense && f.person === '2s_tu'
    );
    if (tuForm && tuForm.accepts && tuForm.accepts.vos) {
      return tuForm.accepts.vos;
    }
  }
  
  // Si no se encuentra nada, devolver cadena vacía
  return '';
}

// Generar oraciones para verbos irregulares
function generateIrregularSentences(verbObjects, tense, template, irregularityType) {
  const sentences = [];
  
  // Templates específicos según el tipo de irregularidad y tiempo
  switch (template) {
    case 'diphthong':
      sentences.push(
        { text: `María __${getConjugation(verbObjects[0], tense, '3s')}__ mucho en el trabajo.`, verb: getConjugation(verbObjects[0], tense, '3s') },
        { text: `Ella __${getConjugation(verbObjects[1], tense, '3s')}__ a casa temprano.`, verb: getConjugation(verbObjects[1], tense, '3s') },
        { text: `Nosotros __${getConjugation(verbObjects[2], tense, '1p')}__ juntos.`, verb: getConjugation(verbObjects[2], tense, '1p') }
      );
      break;
      
    case 'diphthong-subjunctive':
      sentences.push(
        { text: `Espero que María __${getConjugation(verbObjects[0], tense, '3s', 'subjunctive')}__ bien.`, verb: getConjugation(verbObjects[0], tense, '3s', 'subjunctive') },
        { text: `Es bueno que __${getConjugation(verbObjects[1], tense, '3s', 'subjunctive')}__ pronto.`, verb: getConjugation(verbObjects[1], tense, '3s', 'subjunctive') },
        { text: `Ojalá que __${getConjugation(verbObjects[2], tense, '1p', 'subjunctive')}__ juntos.`, verb: getConjugation(verbObjects[2], tense, '1p', 'subjunctive') }
      );
      break;
      
    case 'e-i-change':
      sentences.push(
        { text: `El camarero __${getConjugation(verbObjects[0], tense, '3s')}__ la comida rápido.`, verb: getConjugation(verbObjects[0], tense, '3s') },
        { text: `Ella __${getConjugation(verbObjects[1], tense, '3s')}__ muy bien a los clientes.`, verb: getConjugation(verbObjects[1], tense, '3s') },
        { text: `Nosotros __${getConjugation(verbObjects[2], tense, '1p')}__ la lección.`, verb: getConjugation(verbObjects[2], tense, '1p') }
      );
      break;
      
    case 'yo-irregular':
      sentences.push(
        { text: `Yo __${getConjugation(verbObjects[0], tense, '1s')}__ cosas importantes.`, verb: getConjugation(verbObjects[0], tense, '1s') },
        { text: `También __${getConjugation(verbObjects[1], tense, '1s')}__ nuevas ideas.`, verb: getConjugation(verbObjects[1], tense, '1s') },
        { text: `Siempre __${getConjugation(verbObjects[2], tense, '1s')}__ temprano.`, verb: getConjugation(verbObjects[2], tense, '1s') }
      );
      break;
      
    case 'yo-irregular-subjunctive':
      sentences.push(
        { text: `Es importante que yo __${getConjugation(verbObjects[0], tense, '1s', 'subjunctive')}__ esto bien.`, verb: getConjugation(verbObjects[0], tense, '1s', 'subjunctive') },
        { text: `Esperas que __${getConjugation(verbObjects[1], tense, '1s', 'subjunctive')}__ la verdad.`, verb: getConjugation(verbObjects[1], tense, '1s', 'subjunctive') },
        { text: `Ojalá que __${getConjugation(verbObjects[2], tense, '1s', 'subjunctive')}__ a tiempo.`, verb: getConjugation(verbObjects[2], tense, '1s', 'subjunctive') }
      );
      break;
      
    case 'strong-preterite':
      sentences.push(
        { text: `Ayer, Pedro __${getConjugation(verbObjects[0], tense, '3s')}__ una experiencia única.`, verb: getConjugation(verbObjects[0], tense, '3s') },
        { text: `También __${getConjugation(verbObjects[1], tense, '3s')}__ algo importante.`, verb: getConjugation(verbObjects[1], tense, '3s') },
        { text: `Finalmente __${getConjugation(verbObjects[2], tense, '3s')}__ lo que quería.`, verb: getConjugation(verbObjects[2], tense, '3s') }
      );
      break;
      
    case 'hiatus-y':
      sentences.push(
        { text: `Ana __${getConjugation(verbObjects[0], tense, '3s')}__ un libro interesante.`, verb: getConjugation(verbObjects[0], tense, '3s') },
        { text: `Él __${getConjugation(verbObjects[1], tense, '3s')}__ en las noticias.`, verb: getConjugation(verbObjects[1], tense, '3s') },
        { text: `Ellos __${getConjugation(verbObjects[2], tense, '3p')}__ una casa nueva.`, verb: getConjugation(verbObjects[2], tense, '3p') }
      );
      break;
      
    case 'orthographic':
      sentences.push(
        { text: `Ayer, yo __${getConjugation(verbObjects[0], tense, '1s')}__ algo importante.`, verb: getConjugation(verbObjects[0], tense, '1s') },
        { text: `También __${getConjugation(verbObjects[1], tense, '1s')}__ temprano.`, verb: getConjugation(verbObjects[1], tense, '1s') },
        { text: `Finalmente __${getConjugation(verbObjects[2], tense, '1s')}__ el trabajo.`, verb: getConjugation(verbObjects[2], tense, '1s') }
      );
      break;
      
    case 'orthographic-subjunctive':
      sentences.push(
        { text: `Espero que __${getConjugation(verbObjects[0], tense, '1s', 'subjunctive')}__ bien.`, verb: getConjugation(verbObjects[0], tense, '1s', 'subjunctive') },
        { text: `Es importante que __${getConjugation(verbObjects[1], tense, '3s', 'subjunctive')}__ a tiempo.`, verb: getConjugation(verbObjects[1], tense, '3s', 'subjunctive') },
        { text: `Ojalá que __${getConjugation(verbObjects[2], tense, '1s', 'subjunctive')}__ el trabajo.`, verb: getConjugation(verbObjects[2], tense, '1s', 'subjunctive') }
      );
      break;
      
    default:
      // Template general
      sentences.push(
        { text: `El protagonista __${getConjugation(verbObjects[0], tense, '3s')}__ algo especial.`, verb: getConjugation(verbObjects[0], tense, '3s') },
        { text: `También __${getConjugation(verbObjects[1], tense, '3s')}__ de manera única.`, verb: getConjugation(verbObjects[1], tense, '3s') },
        { text: `Finalmente __${getConjugation(verbObjects[2], tense, '3s')}__ el proceso.`, verb: getConjugation(verbObjects[2], tense, '3s') }
      );
      break;
  }
  
  return sentences;
}

// Generar descomposiciones para verbos regulares
function generateRegularDeconstructions(selectedVerbs, verbObjects, tense) {
  const deconstructions = [];
  const endings = {
    pres: {
      ar: ['o', 'ás', 'a', 'amos', 'áis', 'an'],
      er: ['o', 'es', 'e', 'emos', 'éis', 'en'],
      ir: ['o', 'es', 'e', 'imos', 'ís', 'en']
    },
    pretIndef: {
      ar: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
      er: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
      ir: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron']
    },
    impf: {
      ar: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
      er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían']
    },
    fut: {
      ar: ['é', 'ás', 'á', 'emos', 'éis', 'án'],
      er: ['é', 'ás', 'á', 'emos', 'éis', 'án'],
      ir: ['é', 'ás', 'á', 'emos', 'éis', 'án']
    },
    cond: {
      ar: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      er: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
      ir: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían']
    },
    subjPres: {
      ar: ['e', 'es', 'e', 'emos', 'éis', 'en'],
      er: ['a', 'as', 'a', 'amos', 'áis', 'an'],
      ir: ['a', 'as', 'a', 'amos', 'áis', 'an']
    }
  };
  
  selectedVerbs.forEach((verb, index) => {
    const verbObj = verbObjects[index];
    if (!verbObj) return;
    
    const group = verb.endsWith('ar') ? 'ar' : verb.endsWith('er') ? 'er' : 'ir';
    let stem = verb.slice(0, -2);
    
    // Para futuro y condicional, la raíz incluye el infinitivo completo
    if (tense === 'fut' || tense === 'cond') {
      stem = verb;
    }
    
    const verbEndings = endings[tense]?.[group] || endings.pres[group];
    
    deconstructions.push({
      group: `-${group}`,
      verb: verb,
      stem: stem,
      endings: verbEndings
    });
  });
  
  return deconstructions;
}

// Generar descomposiciones para verbos irregulares
function generateIrregularDeconstructions(selectedVerbs, verbObjects, tense, selectedFamilies) {
  const deconstructions = [];
  
  selectedVerbs.forEach((verb, index) => {
    const verbObj = verbObjects[index];
    if (!verbObj) return;
    
    const group = verb.endsWith('ar') ? 'ar' : verb.endsWith('er') ? 'er' : 'ir';
    
    // Para verbos irregulares, extraer las formas conjugadas reales
    const realForms = extractRealConjugatedForms(verbObj, tense);
    
    deconstructions.push({
      group: `-${group}`,
      verb: verb,
      isIrregular: true,
      realForms: realForms, // Formas conjugadas reales
      irregularPattern: getIrregularPattern(verb, selectedFamilies)
    });
  });
  
  return deconstructions;
}

// Extraer formas conjugadas reales de la base de datos
function extractRealConjugatedForms(verbObj, tense) {
  if (!verbObj || !verbObj.paradigms) return [];
  
  // Buscar paradigma correcto
  const paradigm = verbObj.paradigms.find(p => 
    p.forms?.some(f => f.mood === 'indicative' && f.tense === tense)
  );
  
  if (!paradigm || !paradigm.forms) return [];
  
  // Extraer formas para el dialecto rioplatense (orden: 1s, 2s_vos, 3s, 1p, 3p)
  const persons = ['1s', '2s_vos', '3s', '1p', '3p'];
  const forms = [];
  
  persons.forEach(person => {
    const form = paradigm.forms.find(f => 
      f.mood === 'indicative' && f.tense === tense && f.person === person
    );
    
    if (form && form.value) {
      forms.push(form.value);
    } else {
      // Fallback a forma alternativa si existe
      if (person === '2s_vos') {
        const tuForm = paradigm.forms.find(f => 
          f.mood === 'indicative' && f.tense === tense && f.person === '2s_tu'
        );
        if (tuForm && tuForm.accepts && tuForm.accepts.vos) {
          forms.push(tuForm.accepts.vos);
        } else if (tuForm && tuForm.value) {
          // Si no hay forma vos específica, usar la forma tú como fallback
          forms.push(tuForm.value.replace(/as$/, 'ás').replace(/es$/, 'és'));
        } else {
          forms.push(''); // Placeholder
        }
      } else {
        forms.push(''); // Placeholder
      }
    }
  });
  
  return forms;
}

// Detectar raíz irregular específica
function detectIrregularStem(verbObj, tense, selectedFamilies) {
  if (!verbObj || !selectedFamilies || selectedFamilies.length === 0) return null;
  
  // Buscar paradigma correcto
  const paradigm = verbObj.paradigms?.find(p => 
    p.forms?.some(f => f.mood === 'indicative' && f.tense === tense)
  );
  if (!paradigm) return null;
  
  const forms = paradigm.forms.filter(f => 
    f.mood === 'indicative' && f.tense === tense
  );
  if (forms.length === 0) return null;
  
  // Analizar según el tipo de irregularidad
  for (const familyId of selectedFamilies) {
    const irregularStem = analyzeIrregularityPattern(verbObj, forms, familyId, tense);
    if (irregularStem) return irregularStem;
  }
  
  // Si no se detecta irregularidad específica, usar análisis general
  return analyzeGeneralStem(verbObj, forms, tense);
}

// Analizar patrones específicos de irregularidad
function analyzeIrregularityPattern(verbObj, forms, familyId, tense) {
  const lemma = verbObj.lemma;
  const regularStem = lemma.slice(0, -2);
  
  // Diptongación e→ie, o→ue, u→ue
  if (['DIPHT_E_IE', 'DIPHT_O_UE', 'DIPHT_U_UE'].includes(familyId)) {
    // La diptongación ocurre en formas acentuadas
    const thirdPersonForm = forms.find(f => f.person === '3s');
    if (thirdPersonForm && thirdPersonForm.value) {
      // Buscar el cambio vocálico
      if (familyId === 'DIPHT_E_IE' && thirdPersonForm.value.includes('ie')) {
        return thirdPersonForm.value.split('ie')[0] + 'ie';
      } else if (familyId === 'DIPHT_O_UE' && thirdPersonForm.value.includes('ue')) {
        return thirdPersonForm.value.split('ue')[0] + 'ue';
      } else if (familyId === 'DIPHT_U_UE' && thirdPersonForm.value.includes('ue')) {
        return thirdPersonForm.value.split('ue')[0] + 'ue';
      }
    }
  }
  
  // Cambio e→i en verbos -ir
  if (familyId === 'E_I_IR') {
    const thirdPersonForm = forms.find(f => f.person === '3s');
    if (thirdPersonForm && thirdPersonForm.value) {
      // Buscar patrón e→i
      const expectedRegular = regularStem + getEndingForPerson('3s', tense);
      if (thirdPersonForm.value !== expectedRegular) {
        return extractStemFromForm(thirdPersonForm.value, getEndingForPerson('3s', tense));
      }
    }
  }
  
  // Verbos irregulares en YO
  if (['G_VERBS', 'ZCO_VERBS', 'ZO_VERBS', 'JO_VERBS', 'GU_DROP', 'UIR_Y'].includes(familyId)) {
    const firstPersonForm = forms.find(f => f.person === '1s');
    if (firstPersonForm && firstPersonForm.value && tense === 'pres') {
      // Extraer raíz irregular de la forma yo
      const yoEnding = 'o';
      if (firstPersonForm.value.endsWith(yoEnding)) {
        return firstPersonForm.value.slice(0, -1);
      }
    }
  }
  
  // Pretéritos fuertes
  if (['PRET_UV', 'PRET_U', 'PRET_I', 'PRET_J'].includes(familyId) && tense === 'pretIndef') {
    const thirdPersonForm = forms.find(f => f.person === '3s');
    if (thirdPersonForm && thirdPersonForm.value) {
      // Los pretéritos fuertes tienen terminaciones especiales
      const strongEndings = ['o', 'iste', 'o', 'imos', 'isteis', 'ieron'];
      return extractStemFromForm(thirdPersonForm.value, 'o');
    }
  }
  
  // Cambios ortográficos
  if (['ORTH_CAR', 'ORTH_GAR', 'ORTH_ZAR'].includes(familyId)) {
    if (tense === 'pretIndef') {
      const firstPersonForm = forms.find(f => f.person === '1s');
      if (firstPersonForm && firstPersonForm.value) {
        // -car→-qu, -gar→-gu, -zar→-c
        return extractStemFromForm(firstPersonForm.value, 'é');
      }
    }
  }
  
  return null;
}

// Análisis general de raíz
function analyzeGeneralStem(verbObj, forms, tense) {
  // Para futuro y condicional
  if (tense === 'fut' || tense === 'cond') {
    const firstPersonForm = forms.find(f => f.person === '1s');
    if (firstPersonForm && firstPersonForm.value) {
      const expectedEndings = tense === 'fut' ? 
        ['é', 'ás', 'á', 'emos', 'éis', 'án'] : 
        ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'];
      
      // Intentar encontrar la raíz común
      for (let stemLength = 1; stemLength < firstPersonForm.value.length; stemLength++) {
        const candidateStem = firstPersonForm.value.slice(0, stemLength);
        const testEndingIndex = 0; // primera persona
        if (firstPersonForm.value === candidateStem + expectedEndings[testEndingIndex]) {
          return candidateStem;
        }
      }
    }
  }
  
  // Fallback: usar raíz regular
  return null;
}

// Extraer raíz quitando terminación conocida
function extractStemFromForm(formValue, ending) {
  if (typeof formValue === 'string' && typeof ending === 'string' && formValue.endsWith(ending)) {
    return formValue.slice(0, -ending.length);
  }
  return null;
}

// Obtener terminación esperada para una persona en un tiempo
function getEndingForPerson(person, tense) {
  const endings = {
    pres: {
      '1s': 'o', '2s_tu': 'es', '3s': 'e', 
      '1p': 'emos', '2p_vosotros': 'éis', '3p': 'en'
    },
    pretIndef: {
      '1s': 'é', '2s_tu': 'aste', '3s': 'ó',
      '1p': 'amos', '2p_vosotros': 'asteis', '3p': 'aron'
    }
  };
  
  return endings[tense]?.[person] || '';
}

// Obtener terminaciones específicas para un verbo
function getEndingsForVerb(verbObj, tense) {
  // Por simplicidad, usar terminaciones regulares por ahora
  const endings = {
    pres: ['o', 'es', 'e', 'emos', 'éis', 'en'],
    pretIndef: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron']
  };
  
  return endings[tense] || endings.pres;
}

// Obtener patrón irregular
function getIrregularPattern(verb, selectedFamilies) {
  if (!selectedFamilies) return '';
  
  if (selectedFamilies.includes('DIPHT_E_IE')) return 'e→ie';
  if (selectedFamilies.includes('DIPHT_O_UE')) return 'o→ue';
  if (selectedFamilies.includes('G_VERBS')) return 'irregular en yo';
  
  return 'irregular';
}

const storyData = {
  pres: {
    title: 'La rutina de Juan',
    sentences: [
      { text: 'Todos los días, Juan __habla__ con sus amigos.', verb: 'habla' },
      { text: 'Siempre __aprende__ algo nuevo.', verb: 'aprende' },
      { text: 'Él __vive__ en el centro de la ciudad.', verb: 'vive' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['o', 'as', 'a', 'amos', 'áis', 'an'] },
      { group: '-er', verb: 'aprender', stem: 'aprend', endings: ['o', 'es', 'e', 'emos', 'éis', 'en'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['o', 'es', 'e', 'imos', 'ís', 'en'] },
    ],
  },
  pretIndef: {
    title: 'Una tarde ocupada',
    sentences: [
      { text: 'Ayer, María __caminó__ por el parque.', verb: 'caminó' },
      { text: 'Luego, __comió__ un helado de fresa.', verb: 'comió' },
      { text: 'Finalmente, __escribió__ una carta a su abuela.', verb: 'escribió' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'caminar', stem: 'camin', endings: ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'] },
      { group: '-er', verb: 'comer', stem: 'com', endings: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
      { group: '-ir', verb: 'escribir', stem: 'escrib', endings: ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'] },
    ],
  },
  impf: {
    title: 'Recuerdos de la infancia',
    sentences: [
      { text: 'Cuando era niño, __jugaba__ en el parque.', verb: 'jugaba' },
      { text: 'Mi madre siempre me __leía__ un cuento.', verb: 'leía' },
      { text: 'Nosotros __vivíamos__ en una casa pequeña.', verb: 'vivíamos' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'jugar', stem: 'jug', endings: ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'] },
      { group: '-er', verb: 'leer', stem: 'le', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    ],
  },
  fut: {
    title: 'Planes para el futuro',
    sentences: [
      { text: 'Mañana, __hablaré__ con mi jefe.', verb: 'hablaré' },
      { text: 'Pronto __haré__ mi tarea.', verb: 'haré' },
      { text: 'Después __saldré__ con mis amigos.', verb: 'saldré' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'hablar', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
      { group: '-er', verb: 'hacer', stem: 'har', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
      { group: '-ir', verb: 'salir', stem: 'saldr', endings: ['é', 'ás', 'á', 'emos', 'éis', 'án'] },
    ],
  },
  cond: {
    title: 'Un mundo ideal',
    sentences: [
      { text: 'Si tuviera tiempo, __hablaría__ con mi familia más.', verb: 'hablaría' },
      { text: 'Nosotros __haríamos__ un viaje increíble.', verb: 'haríamos' },
      { text: '¿Tú qué __dirías__ en esa situación?', verb: 'dirías' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'hablar', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-er', verb: 'hacer', stem: 'har', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
      { group: '-ir', verb: 'decir', stem: 'dir', endings: ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'] },
    ],
  },
  subjPres: {
    title: 'Deseos y Recomendaciones',
    sentences: [
      { text: 'Espero que __tengas__ un buen día.', verb: 'tengas' },
      { text: 'El doctor recomienda que __bebas__ más agua.', verb: 'bebas' },
      { text: 'Quiero que __seamos__ buenos amigos.', verb: 'seamos' },
    ],
    deconstructions: [
      { group: '-ar', verb: 'hablar', stem: 'habl', endings: ['e', 'es', 'e', 'emos', 'éis', 'en'] },
      { group: '-er', verb: 'beber', stem: 'beb', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
      { group: '-ir', verb: 'vivir', stem: 'viv', endings: ['a', 'as', 'a', 'amos', 'áis', 'an'] },
    ],
  },
  // Add more tenses here
};

function NarrativeIntroduction({ tense, exampleVerbs = [], verbType = 'regular', selectedFamilies = [], onBack, onContinue }) {
  const [visibleSentence, setVisibleSentence] = useState(-1);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const settings = useSettings();

  // console.log('NarrativeIntroduction received tense:', tense);

  useEffect(() => {
    if (!tense) return;
    const story = storyData[tense.tense];
    if (!story) return;

    // Start showing sentences after the deconstruction finishes (2s delay)
    const initialDelay = setTimeout(() => {
      setVisibleSentence(0); // Show first sentence
      
      const timer = setInterval(() => {
        setVisibleSentence(prev => {
          if (prev < story.sentences.length - 1) {
            return prev + 1;
          }
          clearInterval(timer);
          return prev;
        });
      }, 1200); // Faster between sentences

      return () => clearInterval(timer);
    }, 2000);

    return () => clearTimeout(initialDelay);
  }, [tense]);

  useEffect(() => {
    // trigger enter animation on mount
    const t = setTimeout(() => setEntered(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleAnimatedContinue = () => {
    // play leave animation then continue
    setLeaving(true);
    setTimeout(() => {
      onContinue && onContinue();
    }, 350);
  };

  const handleAnimatedBack = () => {
    setLeaving(true);
    setTimeout(() => {
      onBack && onBack();
    }, 300);
  };

  if (!tense) {
    return (
      <div className="App learn-flow">
        <div className="center-column">
          <p>No tense selected.</p>
          <button onClick={handleAnimatedBack} className="back-btn">
            <img src="/back.png" alt="Volver" className="back-icon" />
          </button>
        </div>
      </div>
    );
  }

  // Usar contenido dinámico en lugar del estático
  const story = generateStoryContent(tense.tense, verbType, selectedFamilies);
  const tenseName = TENSE_LABELS[tense.tense] || tense.tense;
  const moodName = MOOD_LABELS[tense.mood] || tense.mood;

  const pronounsForDialect = () => {
    const arr = ['1s', settings?.useVoseo ? '2s_vos' : '2s_tu', '3s', '1p'];
    if (settings?.useVosotros) arr.push('2p_vosotros');
    arr.push('3p');
    return arr;
  };

  const getFormMapForVerb = (verbObj) => {
    if (!verbObj) return {};
    const map = {};
    const para = verbObj.paradigms?.find(p => p.forms?.some(f => f.mood === tense.mood && f.tense === tense.tense));
    if (!para) return map;
    para.forms.filter(f => f.mood === tense.mood && f.tense === tense.tense).forEach(f => { map[f.person] = f.value; });
    return map;
  };

  const detectRealStem = (verbObj, tense, mood) => {
    if (!verbObj) return null;
    const para = verbObj.paradigms?.find(p => p.forms?.some(f => f.mood === mood && f.tense === tense));
    if (!para) return null;
    
    const forms = para.forms.filter(f => f.mood === mood && f.tense === tense);
    if (forms.length === 0) return null;
    
    // For future and conditional, the stem is the infinitive for regular verbs, 
    // or an irregular stem that we need to detect
    if (tense === 'fut' || tense === 'cond') {
      const endings = ['é', 'ás', 'á', 'emos', 'éis', 'án']; // future endings
      const condEndings = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían']; // conditional endings
      const expectedEndings = tense === 'fut' ? endings : condEndings;
      
      // Try to find the stem by looking for common prefix
      let candidateStem = '';
      const firstForm = forms.find(f => f.person === '1s');
      if (firstForm) {
        const value = firstForm.value;
        // Try different stem lengths
        for (let i = 1; i < value.length; i++) {
          const potentialStem = value.slice(0, i);
          
          // Check if this stem works for all forms
          const worksForAll = forms.every(form => {
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
      return candidateStem || verbObj.lemma; // fallback to full infinitive
    }
    
    // For other tenses, use simpler logic - remove infinitive ending
    return verbObj.lemma.slice(0, -2); // remove -ar/-er/-ir
  };

  const endingFromForm = (formValue, detectedStem, fallback) => {
    if (typeof formValue === 'string' && detectedStem && formValue.startsWith(detectedStem)) {
      return formValue.slice(detectedStem.length);
    }
    return fallback || '';
  };

  return (
    <div className="App">
      <div className="onboarding learn-flow narrative-intro">
        <div className="narrative-header">
          <button onClick={onBack} className="back-btn">
            <img src="/back.png" alt="Volver" className="back-icon" />
          </button>
          <h1>{tenseName}</h1>
          <p className="subtitle">{moodName}</p>
        </div>

        <div className={`narrative-content page-transition ${entered ? 'page-in' : ''} ${leaving ? 'page-out' : ''}`}>
          {story ? (
            <>
              <div className="story-placeholder">
                <h3>{story.title}</h3>
                {story.sentences.map((sentence, index) => (
                  <p 
                    key={index} 
                    className={`story-sentence ${index <= visibleSentence ? 'visible' : ''}`}
                    dangerouslySetInnerHTML={{ __html: sentence.text.replace(/__(.*)__/, '<span class="highlight">$1</span>') }}
                  />
                ))}
                {story.explanation && (
                  <div className="explanation-box">
                    <p className="explanation-text">{story.explanation}</p>
                  </div>
                )}
              </div>

              <div className="deconstruction-placeholder">
                <div className="deconstruction-list">
                  {story.deconstructions?.map(({ group, stem, endings, verb, isIrregular, realForms }) => {
                    const pronouns = pronounsForDialect();
                    const verbObj = exampleVerbs?.find(v => v.lemma === verb);
                    const lemmaStem = (v) => {
                      if (typeof v !== 'string') return '';
                      if (v.endsWith('ar') || v.endsWith('er') || v.endsWith('ir')) {
                        return v.slice(0, -2);
                      }
                      return v;
                    };
                    
                    // Para verbos irregulares, mostrar las formas conjugadas reales
                    if (isIrregular && realForms && realForms.length > 0) {
                      return (
                        <div key={group} className="deconstruction-item">
                          <div className="verb-lemma"><span className="lemma-stem">{lemmaStem(verb)}</span><span className="group-label">{group}</span></div>
                          <div className="verb-deconstruction irregular">
                            <span className="irregular-forms">
                              {realForms.map((form, idx) => (
                                <span key={`${group}-${idx}-${form}`} className="conjugated-form">
                                  {form}
                                  {idx < realForms.length - 1 && <span className="form-separator"> • </span>}
                                </span>
                              ))}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    
                    // Para verbos regulares, mantener el sistema de raíz + terminaciones
                    const formMap = getFormMapForVerb(verbObj);
                    const realStem = detectRealStem(verbObj, tense.tense, tense.mood) || stem;
                    const dialectEndings = pronouns.map(p => {
                      const formVal = formMap[p];
                      const baseOrder = ['1s','2s_tu','3s','1p','2p_vosotros','3p'];
                      const base = endings?.[baseOrder.indexOf(p)] || '';
                      return endingFromForm(formVal, realStem, base);
                    });
                    return (
                      <div key={group} className="deconstruction-item">
                        <div className="verb-lemma"><span className="lemma-stem">{lemmaStem(verb)}</span><span className="group-label">{group}</span></div>
                        <div className="verb-deconstruction">
                          <span className="verb-stem">{realStem}-</span>
                          <span className="verb-endings">
                            <span className="ending-carousel">
                              {dialectEndings.map((ending, idx) => (
                                <span key={`${group}-${idx}-${ending}`} className="ending-item">{ending}</span>
                              ))}
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="story-placeholder">
              <p>Introducción para "{tenseName}" no implementada aún.</p>
            </div>
          )}
        </div>

        <button className="btn" onClick={handleAnimatedContinue}>
          <img src="/play.png" alt="Comenzar" className="play-icon" />
          ¡Entendido, a practicar!
        </button>
      </div>
    </div>
  );
}

export default NarrativeIntroduction;
