import React, { useState, useEffect } from 'react';
import { TENSE_LABELS, MOOD_LABELS } from '../../lib/utils/verbLabels.js';
import { storyData } from '../../data/narrativeStories.js';

// Función para seleccionar una historia aleatoria (principal o alternativa)
function selectRandomStory(tenseStoryData) {
  if (!tenseStoryData) return null;
  
  // Si no hay historias alternativas, usar la principal
  if (!tenseStoryData.alternativeStories || tenseStoryData.alternativeStories.length === 0) {
    return {
      title: tenseStoryData.title,
      sentences: tenseStoryData.sentences,
      deconstructions: tenseStoryData.deconstructions,
      theme: 'principal'
    };
  }
  
  // Crear array con todas las opciones (principal + alternativas)
  const allStories = [
    {
      title: tenseStoryData.title,
      sentences: tenseStoryData.sentences,
      deconstructions: tenseStoryData.deconstructions,
      theme: 'principal'
    },
    ...tenseStoryData.alternativeStories
  ];
  
  // Seleccionar una historia aleatoriamente
  const randomIndex = Math.floor(Math.random() * allStories.length);
  return allStories[randomIndex];
}
import './NarrativeIntroduction.css';
import { useSettings } from '../../state/settings.js';
import { verbs } from '../../data/verbs.js';

// Verbos paradigmáticos REORGANIZADOS por familia
const PARADIGMATIC_VERBS = {
  // ========================================
  // NUEVAS FAMILIAS DEL PRESENTE
  // ========================================
  
  // 1) Irregulares en YO (con -g)
  'LEARNING_YO_G_PRESENT': ['tener', 'poner', 'hacer', 'salir', 'venir', 'valer'],
  
  // 2) Verbos que diptongan (unificados - orden específico para drill)
  'LEARNING_DIPHTHONGS': ['poder', 'querer', 'pedir', 'volver', 'pensar', 'servir'],
  
  // 3) Muy irregulares del presente
  'LEARNING_VERY_IRREGULAR': ['ser', 'estar', 'ir', 'dar'],
  
  // ========================================
  // FAMILIAS PARA OTROS TIEMPOS (mantenidas)
  // ========================================
  
  // Cambios ortográficos
  'LEARNING_ORTH_CAR': ['buscar', 'sacar'],
  'LEARNING_ORTH_GAR': ['llegar', 'pagar'],
  
  // Pretéritos irregulares
  'LEARNING_PRET_MUY_IRREGULARES': ['estar', 'querer', 'hacer', 'tener', 'poder'],
  'LEARNING_PRET_3AS_PERSONAS': ['pedir', 'dormir', 'leer', 'preferir', 'servir'],
  
  // Irregulares del imperfecto
  'LEARNING_IMPF_IRREGULAR': ['ser', 'ir', 'ver']
};

// Seleccionar verbos apropiados según el tipo y familias
function selectAppropriateVerbs(verbType, selectedFamilies, tense) {
  if (verbType === 'regular') {
    // Seleccionar verbos regulares de la base de datos
    const regularVerbs = verbs.filter(v => v.type === 'regular');
    const arVerbs = regularVerbs.filter(v => v.lemma.endsWith('ar')).slice(0, 1);
    const erVerbs = regularVerbs.filter(v => v.lemma.endsWith('er')).slice(0, 1);
    const irVerbs = regularVerbs.filter(v => v.lemma.endsWith('ir')).slice(0, 1);
    
    // Combinar representantes de cada conjugación
    const selected = [...arVerbs, ...erVerbs, ...irVerbs];
    return selected.length >= 3 ? selected.slice(0, 3).map(v => v.lemma) : ['hablar', 'comer', 'vivir'];
  }
  
  if (selectedFamilies && selectedFamilies.length > 0) {
    // Seleccionar verbos de la base de datos que pertenezcan a las familias elegidas
    const selectedVerbs = [];
    
    // Para cada familia, buscar verbos reales en la base de datos
    for (const familyId of selectedFamilies) {
      const paradigmaticVerbs = PARADIGMATIC_VERBS[familyId] || [];
      
      for (const verbLemma of paradigmaticVerbs) {
        // Buscar el verbo en la base de datos para verificar que existe
        const verbInDB = verbs.find(v => v.lemma === verbLemma);
        if (verbInDB && !selectedVerbs.includes(verbLemma) && selectedVerbs.length < 3) {
          selectedVerbs.push(verbLemma);
        }
      }
      
      // Si ya tenemos 3 verbos, parar
      if (selectedVerbs.length >= 3) break;
    }
    
    // Si no encontramos suficientes verbos en las familias, buscar más irregulares
    if (selectedVerbs.length < 3) {
      const irregularVerbs = verbs.filter(v => v.type === 'irregular').slice(0, 3 - selectedVerbs.length);
      irregularVerbs.forEach(v => {
        if (!selectedVerbs.includes(v.lemma)) {
          selectedVerbs.push(v.lemma);
        }
      });
    }
    
    return selectedVerbs.slice(0, 3);
  }
  
  // Fallback: seleccionar verbos regulares de la base de datos
  const regularVerbs = verbs.filter(v => v.type === 'regular');
  if (regularVerbs.length >= 3) {
    const selected = regularVerbs.slice(0, 3).map(v => v.lemma);
    return selected;
  }
  
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

// Determinar el tipo principal de irregularidad REORGANIZADO
function determineIrregularityType(familyTypes, tense) {
  // Imperfecto irregular (mantenido)
  if (familyTypes.includes('LEARNING_IMPF_IRREGULAR') && tense === 'impf') {
    return 'imperfect-irregular';
  }
  
  // ========================================
  // NUEVAS FAMILIAS DEL PRESENTE
  // ========================================
  
  // 1) Irregulares en YO (con -g)
  else if (familyTypes.includes('LEARNING_YO_G_PRESENT')) {
    return 'yo-irregular-g';
  }
  
  // 2) Verbos que diptongan (unificados: e→ie, o→ue, e→i)
  else if (familyTypes.includes('LEARNING_DIPHTHONGS')) {
    return 'diphthongs-unified';
  }
  
  // 3) Muy irregulares (ser, estar, ir, dar)
  else if (familyTypes.includes('LEARNING_VERY_IRREGULAR')) {
    return 'very-irregular-present';
  }
  
  // ========================================
  // FAMILIAS PARA OTROS TIEMPOS (mantenidas)
  // ========================================
  
  else if (familyTypes.includes('LEARNING_PRET_MUY_IRREGULARES')) {
    return 'preterite-very-irregular';
  } else if (familyTypes.includes('LEARNING_PRET_3AS_PERSONAS')) {
    return 'preterite-third-person';
  } else if (familyTypes.some(f => ['LEARNING_ORTH_CAR', 'LEARNING_ORTH_GAR'].includes(f))) {
    return 'orthographic';
  }
  
  return 'general';
}

// Obtener template de contenido según el tipo de irregularidad REORGANIZADO
function getIrregularContentTemplate(irregularityType, tense, familyTypes) {
  const templates = {
    // ========================================
    // NUEVAS FAMILIAS DEL PRESENTE
    // ========================================
    
    'yo-irregular-g': {
      pres: {
        title: 'Irregulares en YO (presente)',
        explanation: 'Estos verbos muy frecuentes añaden -g solo en la primera persona (YO): tengo, pongo, hago, salgo, vengo. El resto de las formas son regulares. Esta irregularidad se extiende a todo el subjuntivo.',
        sentenceTemplate: 'yo-irregular-g'
      },
      subjPres: {
        title: 'Irregulares en YO (subjuntivo)',
        explanation: 'En subjuntivo, la irregularidad de la 1ª persona se extiende a todas las formas: tenga, pongas, haga, salgan.',
        sentenceTemplate: 'yo-irregular-g-subjunctive'
      }
    },
    
    'diphthongs-unified': {
      pres: {
        title: 'Verbos que diptongan',
        explanation: 'Estos verbos cambian su vocal de la raíz cuando está acentuada: o→ue (puedo), e→ie (quiero), e→i (pido), u→ue (juego). Solo cambian cuando la vocal lleva el acento - nosotros y vosotros NO diptongan.',
        sentenceTemplate: 'diphthongs-unified'
      },
      subjPres: {
        title: 'Diptongos en subjuntivo',
        explanation: 'En presente de subjuntivo, los diptongos se mantienen igual: pueda, quiera, pida, juegue.',
        sentenceTemplate: 'diphthongs-unified-subjunctive'
      }
    },
    
    'very-irregular-present': {
      pres: {
        title: 'Muy irregulares del presente',
        explanation: 'Estos 4 verbos súper frecuentes tienen formas completamente irregulares en presente: soy/eres/es, estoy/estás/está, voy/vas/va, doy/das/da. No siguen ningún patrón regular y hay que memorizarlos.',
        sentenceTemplate: 'very-irregular-present'
      },
      subjPres: {
        title: 'Muy irregulares en subjuntivo',
        explanation: 'En subjuntivo también son muy irregulares: sea, esté, vaya, dé.',
        sentenceTemplate: 'very-irregular-subjunctive'
      }
    },
    
    // ========================================
    // IMPERFECTO IRREGULAR (mantenido)
    // ========================================
    
    'imperfect-irregular': {
      impf: {
        title: 'Los únicos tres irregulares del imperfecto',
        explanation: 'En el imperfecto, casi todos los verbos son regulares. Solo hay 3 verbos irregulares en todo el español: ser, ir y ver. Sus formas hay que memorizarlas completamente.',
        sentenceTemplate: 'imperfect-irregular'
      }
    },
    
    // ========================================
    // FAMILIAS PARA EL PRETÉRITO INDEFINIDO
    // ========================================
    
    'preterite-very-irregular': {
      pretIndef: {
        title: 'Muy irregulares del pretérito',
        explanation: 'Estos verbos frecuentes cambian completamente la raíz en pretérito: estar → estuve, querer → quise, hacer → hice, tener → tuve, poder → pude. Las terminaciones no llevan acento.',
        sentenceTemplate: 'preterite-very-irregular'
      }
    },
    
    'preterite-third-person': {
      pretIndef: {
        title: 'Irregulares en 3ª persona',
        explanation: 'Estos verbos solo cambian en 3ª persona singular y plural: pedir → pidió/pidieron, dormir → durmió/durmieron, leer → leyó/leyeron. Las otras personas son regulares.',
        sentenceTemplate: 'preterite-third-person'
      }
    },
    
    // ========================================
    // FAMILIAS MANTENIDAS PARA OTROS TIEMPOS
    // ========================================
    
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
    // ========================================
    // NUEVAS FAMILIAS DEL PRESENTE
    // ========================================
    
    case 'yo-irregular-g':
      sentences.push(
        { text: `Yo __${getConjugation(verbObjects[0], tense, '1s')}__ muchas cosas importantes.`, verb: getConjugation(verbObjects[0], tense, '1s') },
        { text: `Siempre __${getConjugation(verbObjects[1], tense, '1s')}__ todo en su lugar correcto.`, verb: getConjugation(verbObjects[1], tense, '1s') },
        { text: `En el trabajo __${getConjugation(verbObjects[2], tense, '1s')}__ mi mejor esfuerzo.`, verb: getConjugation(verbObjects[2], tense, '1s') }
      );
      break;
      
    case 'yo-irregular-g-subjunctive':
      sentences.push(
        { text: `Es importante que yo __${getConjugation(verbObjects[0], tense, '1s', 'subjunctive')}__ tiempo para mi familia.`, verb: getConjugation(verbObjects[0], tense, '1s', 'subjunctive') },
        { text: `Espero que __${getConjugation(verbObjects[1], tense, '1s', 'subjunctive')}__ todo en orden.`, verb: getConjugation(verbObjects[1], tense, '1s', 'subjunctive') },
        { text: `Ojalá que __${getConjugation(verbObjects[2], tense, '1s', 'subjunctive')}__ bien mi trabajo.`, verb: getConjugation(verbObjects[2], tense, '1s', 'subjunctive') }
      );
      break;
      
    case 'diphthongs-unified':
      sentences.push(
        { text: `Todos nosotros __${getConjugation(verbObjects[0], tense, '1p')}__ hacer ejercicio.`, verb: getConjugation(verbObjects[0], tense, '1p') },
        { text: `Mi hermana __${getConjugation(verbObjects[1], tense, '3s')}__ estudiar idiomas.`, verb: getConjugation(verbObjects[1], tense, '3s') },
        { text: `En el restaurante siempre __${getConjugation(verbObjects[2], tense, '1s')}__ el menú del día.`, verb: getConjugation(verbObjects[2], tense, '1s') }
      );
      break;
      
    case 'diphthongs-unified-subjunctive':
      sentences.push(
        { text: `Espero que __${getConjugation(verbObjects[0], tense, '3s', 'subjunctive')}__ en sus sueños.`, verb: getConjugation(verbObjects[0], tense, '3s', 'subjunctive') },
        { text: `Es bueno que __${getConjugation(verbObjects[1], tense, '3s', 'subjunctive')}__ a los demás.`, verb: getConjugation(verbObjects[1], tense, '3s', 'subjunctive') },
        { text: `Ojalá que el chef __${getConjugation(verbObjects[2], tense, '3s', 'subjunctive')}__ bien la comida.`, verb: getConjugation(verbObjects[2], tense, '3s', 'subjunctive') }
      );
      break;
      
    case 'very-irregular-present':
      sentences.push(
        { text: `Mi hermano __${getConjugation(verbObjects[0], tense, '3s')}__ una persona muy amable.`, verb: getConjugation(verbObjects[0], tense, '3s') },
        { text: `Ahora __${getConjugation(verbObjects[1], tense, '3s')}__ muy contento con su trabajo.`, verb: getConjugation(verbObjects[1], tense, '3s') },
        { text: `Los fines de semana __${getConjugation(verbObjects[2], tense, '3s')}__ al parque con sus hijos.`, verb: getConjugation(verbObjects[2], tense, '3s') }
      );
      break;
      
    case 'very-irregular-subjunctive':
      sentences.push(
        { text: `Es importante que __${getConjugation(verbObjects[0], tense, '3s', 'subjunctive')}__ honesto.`, verb: getConjugation(verbObjects[0], tense, '3s', 'subjunctive') },
        { text: `Espero que __${getConjugation(verbObjects[1], tense, '3s', 'subjunctive')}__ bien de salud.`, verb: getConjugation(verbObjects[1], tense, '3s', 'subjunctive') },
        { text: `Ojalá que __${getConjugation(verbObjects[2], tense, '3s', 'subjunctive')}__ de vacaciones.`, verb: getConjugation(verbObjects[2], tense, '3s', 'subjunctive') }
      );
      break;
    
    // ========================================
    // IMPERFECTO IRREGULAR (mantenido)
    // ========================================
    
    case 'imperfect-irregular':
      sentences.push(
        { text: `Mi abuelo __${getConjugation(verbObjects[0], tense, '3s')}__ muy divertido y siempre nos contaba historias.`, verb: getConjugation(verbObjects[0], tense, '3s') },
        { text: `Todos los veranos __${getConjugation(verbObjects[1], tense, '1p')}__ a la playa con toda la familia.`, verb: getConjugation(verbObjects[1], tense, '1p') },
        { text: `Por las noches __${getConjugation(verbObjects[2], tense, '1s')}__ las estrellas desde mi ventana.`, verb: getConjugation(verbObjects[2], tense, '1s') }
      );
      break;
      
    // ========================================
    // FAMILIAS PARA EL PRETÉRITO INDEFINIDO
    // ========================================
    
    case 'preterite-very-irregular':
      sentences.push(
        { text: `Ayer __${getConjugation(verbObjects[0], tense, '3s')}__ en casa todo el día.`, verb: getConjugation(verbObjects[0], tense, '3s') },
        { text: `Mi hermana __${getConjugation(verbObjects[1], tense, '3s')}__ estudiar más para el examen.`, verb: getConjugation(verbObjects[1], tense, '3s') },
        { text: `Ellos __${getConjugation(verbObjects[2], tense, '3p')}__ toda la tarea en una hora.`, verb: getConjugation(verbObjects[2], tense, '3p') }
      );
      break;
      
    case 'preterite-third-person':
      sentences.push(
        { text: `El cliente __${getConjugation(verbObjects[0], tense, '3s')}__ un café y un pastel.`, verb: getConjugation(verbObjects[0], tense, '3s') },
        { text: `Mi abuelo __${getConjugation(verbObjects[1], tense, '3s')}__ profundamente toda la noche.`, verb: getConjugation(verbObjects[1], tense, '3s') },
        { text: `María __${getConjugation(verbObjects[2], tense, '3s')}__ el periódico en el desayuno.`, verb: getConjugation(verbObjects[2], tense, '3s') }
      );
      break;
    
    // ========================================
    // CASOS ESPECIALES Y OTROS TIEMPOS (mantenidos)
    // ========================================
      
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
      
    case 'yo-irregular': {
      const complementFor = (lemma) => {
        switch (lemma) {
          case 'tener': return 'una idea';
          case 'conocer': return 'gente nueva';
          case 'poner': return 'la mesa';
          case 'salir': return 'temprano';
          case 'hacer': return 'ejercicio';
          case 'venir': return 'temprano';
          case 'traer': return 'café';
          case 'decir': return 'la verdad';
          case 'oír': return 'música';
          case 'conducir': return 'despacio';
          case 'traducir': return 'bien';
          case 'producir': return 'resultados';
          case 'vencer': return 'mis miedos';
          case 'ejercer': return 'mi profesión';
          case 'proteger': return 'a mi familia';
          case 'elegir': return 'bien';
          case 'distinguir': return 'colores';
          case 'seguir': return 'el plan';
          default: return '';
        }
      };

      const pickSent = (v) => {
        const conj = getConjugation(v, tense, '1s');
        const comp = complementFor(v?.lemma);
        return {
          text: comp ? `Yo __${conj}__ ${comp}.` : `Yo __${conj}__.`,
          verb: conj
        };
      };

      verbObjects.slice(0, 3).forEach(v => sentences.push(pickSent(v)));
      break;
    }
      
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
  
  // Extraer formas para el dialecto (orden: 1s, 2s_vos, 3s, 1p, 3p)
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
          // Si no hay forma vos específica, usar transformación morfológica en presente; si no, usar forma de tú
          if (tense === 'pres') {
            const grp = (verbObj.lemma?.endsWith('ar') ? 'ar' : verbObj.lemma?.endsWith('er') ? 'er' : 'ir');
            if (/as$/.test(tuForm.value)) forms.push(tuForm.value.replace(/as$/, 'ás'));
            else if (/es$/.test(tuForm.value)) forms.push(grp === 'ir' ? tuForm.value.replace(/es$/, 'ís') : tuForm.value.replace(/es$/, 'és'));
            else forms.push(tuForm.value);
          } else {
            forms.push(tuForm.value);
          }
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
  if (['LEARNING_E_IE', 'LEARNING_O_UE', 'LEARNING_U_UE_JUGAR'].includes(familyId)) {
    // La diptongación ocurre en formas acentuadas
    const thirdPersonForm = forms.find(f => f.person === '3s');
    if (thirdPersonForm && thirdPersonForm.value) {
      // Buscar el cambio vocálico
      if (familyId === 'LEARNING_E_IE' && thirdPersonForm.value.includes('ie')) {
        return thirdPersonForm.value.split('ie')[0] + 'ie';
      } else if (familyId === 'LEARNING_O_UE' && thirdPersonForm.value.includes('ue')) {
        return thirdPersonForm.value.split('ue')[0] + 'ue';
      } else if (familyId === 'LEARNING_U_UE_JUGAR' && thirdPersonForm.value.includes('ue')) {
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
  if (['LEARNING_YO_G', 'LEARNING_YO_ZCO', 'LEARNING_YO_ZO'].includes(familyId)) {
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

// Obtener patrón irregular REORGANIZADO
function getIrregularPattern(verb, selectedFamilies) {
  if (!selectedFamilies) return '';
  
  // ========================================
  // NUEVAS FAMILIAS DEL PRESENTE
  // ========================================
  if (selectedFamilies.includes('LEARNING_YO_G_PRESENT')) return 'irregular en YO: añade -g (tengo, pongo, hago)';
  if (selectedFamilies.includes('LEARNING_DIPHTHONGS')) return 'diptongan: e→ie, o→ue, e→i (pienso, puedo, pido)';
  if (selectedFamilies.includes('LEARNING_VERY_IRREGULAR')) return 'muy irregulares (soy, estoy, voy, doy)';
  
  // ========================================
  // FAMILIAS PARA OTROS TIEMPOS (mantenidas)
  // ========================================
  if (selectedFamilies.includes('LEARNING_PRET_MUY_IRREGULARES')) return 'pretérito muy irregular: raíces nuevas (estuve, quise, hice)';
  if (selectedFamilies.includes('LEARNING_PRET_3AS_PERSONAS')) return 'irregular en 3ª persona: pidió, durmió, leyó';
  if (selectedFamilies.includes('LEARNING_IMPF_IRREGULAR')) return 'imperfecto irregular: era, iba, veía';
  if (selectedFamilies.includes('LEARNING_ORTH_CAR')) return 'ortográfico: c→qu (busqué)';
  if (selectedFamilies.includes('LEARNING_ORTH_GAR')) return 'ortográfico: g→gu (llegué)';
  
  return 'irregular';
}


function NarrativeIntroduction({ tense, exampleVerbs = [], verbType = 'regular', selectedFamilies = [], onBack, onContinue }) {
  const [visibleSentence, setVisibleSentence] = useState(-1);
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const settings = useSettings();

  // console.log('NarrativeIntroduction received tense:', tense);

  useEffect(() => {
    if (!tense) return;
    const tenseStoryData = storyData[tense.tense];
    if (!tenseStoryData) return;
    
    // Seleccionar una historia aleatoria (principal o alternativa)
    const story = selectRandomStory(tenseStoryData);
    setSelectedStory(story);
    if (!story) return;

    // Start showing sentences after the deconstruction finishes (2s delay)
    const initialDelay = setTimeout(() => {
      setVisibleSentence(0); // Show first sentence
      
      const timer = setInterval(() => {
        setVisibleSentence(prev => {
          if (prev < selectedStory.sentences.length - 1) {
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
          {selectedStory ? (
            <>
              <div className="story-placeholder">
                <h3>{selectedStory?.title}</h3>
                {selectedStory?.theme && selectedStory.theme !== 'principal' && (
                  <p className="story-theme">📖 Historia temática: {selectedStory.theme}</p>
                )}
                {selectedStory?.sentences.map((sentence, index) => (
                  <p 
                    key={index} 
                    className={`story-sentence ${index <= visibleSentence ? 'visible' : ''}`}
                    dangerouslySetInnerHTML={{ __html: sentence.text.replace(/__(.*)__/, '<span class="highlight">$1</span>') }}
                  />
                ))}
              </div>

              <div className="deconstruction-placeholder">
                <div className="deconstruction-list">
                  {selectedStory?.deconstructions?.map(({ group, stem, endings, verb, isIrregular, realForms }) => {
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
                      const baseOrder = ['1s','2s_tu','3s','1p','2p_vosotros','3p'];
                      const grp = group?.slice(-2) || (verb?.endsWith('ar') ? 'ar' : verb?.endsWith('er') ? 'er' : 'ir');
                      const key = p === '2s_vos' ? '2s_tu' : p;
                      let base = endings?.[baseOrder.indexOf(key)] || '';
                      // Morphological voseo for present indicative
                      if (p === '2s_vos' && tense.mood === 'indicative' && tense.tense === 'pres') {
                        if (grp === 'ar' && base === 'as') base = 'ás';
                        else if (grp === 'er' && base === 'es') base = 'és';
                        else if (grp === 'ir' && base === 'es') base = 'ís';
                      }
                      if (base) return base;
                      // Fallback: derive from actual form if available
                      const formVal = formMap[p];
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
