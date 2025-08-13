// Sistema de clasificación de familias de verbos irregulares
// Basado en los conceptos morfológicos y patrones de irregularidad del español

export const IRREGULAR_FAMILIES = {
  // 1) Cambios de raíz (vocales tónicas)
  'DIPHT_E_IE': {
    id: 'DIPHT_E_IE',
    name: 'Diptongación e→ie',
    description: 'pensar, cerrar, empezar',
    examples: ['pensar', 'cerrar', 'empezar', 'comenzar', 'despertar', 'sentir'],
    pattern: 'e→ie en presente (todas menos nosotros/vosotros), presente subjuntivo, imperativo',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['pensar', 'cerrar', 'empezar']
  },
  
  'DIPHT_O_UE': {
    id: 'DIPHT_O_UE',
    name: 'Diptongación o→ue',
    description: 'volver, poder, contar',
    examples: ['volver', 'poder', 'contar', 'mostrar', 'dormir', 'morir'],
    pattern: 'o→ue en presente (todas menos nosotros/vosotros), presente subjuntivo, imperativo',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['volver', 'poder', 'contar']
  },
  
  'DIPHT_U_UE': {
    id: 'DIPHT_U_UE',
    name: 'Diptongación u→ue',
    description: 'jugar',
    examples: ['jugar'],
    pattern: 'u→ue en presente (todas menos nosotros/vosotros), presente subjuntivo, imperativo',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['jugar']
  },
  
  'E_I_IR': {
    id: 'E_I_IR',
    name: 'e→i (verbos -ir)',
    description: 'pedir, servir, reír',
    examples: ['pedir', 'servir', 'reír', 'repetir', 'seguir', 'elegir', 'medir'],
    pattern: 'e→i en presente (todas menos nosotros/vosotros), presente subjuntivo, imperativo, gerundio',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg', 'ger', 'pretIndef'],
    paradigmaticVerbs: ['pedir', 'servir', 'repetir']
  },
  
  'O_U_GER_IR': {
    id: 'O_U_GER_IR',
    name: 'o→u en gerundio (-ir)',
    description: 'dormir, morir',
    examples: ['dormir', 'morir'],
    pattern: 'o→u en gerundio de verbos -ir que diptongan',
    affectedTenses: ['ger', 'pretIndef'],
    paradigmaticVerbs: ['dormir', 'morir']
  },
  
  // 2) Alternancias de consonante en 1.ª sing. (presente) + subjuntivo
  'G_VERBS': {
    id: 'G_VERBS',
    name: 'Verbos en -go (1ª persona)',
    description: 'tener, poner, salir, hacer, venir, decir, oír, traer',
    examples: ['tener', 'poner', 'salir', 'hacer', 'venir', 'decir', 'oír', 'traer', 'caer', 'valer'],
    pattern: '1ª persona presente en -go, propagación a todo el subjuntivo e imperativo',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['tener', 'poner', 'salir', 'hacer', 'venir']
  },
  
  'ZCO_VERBS': {
    id: 'ZCO_VERBS',
    name: 'Verbos -cer/-cir → -zco',
    description: 'conocer, nacer, conducir, producir',
    examples: ['conocer', 'nacer', 'conducir', 'producir', 'traducir', 'reducir', 'parecer', 'crecer'],
    pattern: 'vocal + cer/cir → -zco en 1ª persona, propagación a subjuntivo',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['conocer', 'conducir', 'producir']
  },
  
  'ZO_VERBS': {
    id: 'ZO_VERBS',
    name: 'Consonante + -cer → -zo',
    description: 'vencer, ejercer',
    examples: ['vencer', 'ejercer', 'torcer', 'cocer'],
    pattern: 'consonante + cer → -zo en 1ª persona, propagación a subjuntivo',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['vencer', 'ejercer']
  },
  
  'JO_VERBS': {
    id: 'JO_VERBS',
    name: 'Verbos -ger/-gir → -jo',
    description: 'proteger, elegir, coger',
    examples: ['proteger', 'elegir', 'coger', 'recoger', 'dirigir', 'corregir'],
    pattern: '-ger/-gir → -jo en 1ª persona, propagación a subjuntivo',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['proteger', 'elegir', 'coger']
  },
  
  'GU_DROP': {
    id: 'GU_DROP',
    name: 'Verbos -guir (pérdida de u)',
    description: 'seguir, distinguir',
    examples: ['seguir', 'distinguir', 'extinguir', 'conseguir'],
    pattern: 'pérdida de "u" en 1ª persona: -guir → -go, propagación a subjuntivo',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['seguir', 'distinguir']
  },
  
  // 3) Inserción de -y- y fenómenos vocálicos con hiato
  'UIR_Y': {
    id: 'UIR_Y',
    name: 'Verbos -uir (inserción de y)',
    description: 'construir, huir, destruir',
    examples: ['construir', 'huir', 'destruir', 'incluir', 'excluir', 'concluir', 'sustituir'],
    pattern: 'inserción de -y- en presente (todas menos nosotros/vosotros), subjuntivo',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['construir', 'huir', 'destruir']
  },
  
  'HIATUS_Y': {
    id: 'HIATUS_Y',
    name: 'Hiatos con -y-',
    description: 'caer, leer, oír, traer, proveer',
    examples: ['caer', 'leer', 'oír', 'traer', 'proveer', 'creer', 'poseer'],
    pattern: 'vocal + er/ir: i→y en pretérito 3ª (cayó, leyó), gerundio con y',
    affectedTenses: ['pretIndef', 'ger', 'part'],
    paradigmaticVerbs: ['caer', 'leer', 'oír', 'traer']
  },
  
  // 4) Cambios ortográficos para conservar sonido
  'ORTH_CAR': {
    id: 'ORTH_CAR',
    name: 'Verbos -car → -qu',
    description: 'buscar, sacar, tocar',
    examples: ['buscar', 'sacar', 'tocar', 'practicar', 'explicar', 'atacar'],
    pattern: '-car → -qu ante e (pretérito 1ª, subjuntivo, imperativo)',
    affectedTenses: ['pretIndef', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['buscar', 'sacar', 'tocar']
  },
  
  'ORTH_GAR': {
    id: 'ORTH_GAR',
    name: 'Verbos -gar → -gu',
    description: 'llegar, pagar, jugar',
    examples: ['llegar', 'pagar', 'jugar', 'entregar', 'apagar', 'obligar'],
    pattern: '-gar → -gu ante e (pretérito 1ª, subjuntivo, imperativo)',
    affectedTenses: ['pretIndef', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['llegar', 'pagar', 'obligar']
  },
  
  'ORTH_ZAR': {
    id: 'ORTH_ZAR',
    name: 'Verbos -zar → -c',
    description: 'empezar, almorzar, organizar',
    examples: ['empezar', 'almorzar', 'organizar', 'comenzar', 'realizar', 'utilizar'],
    pattern: '-zar → -c ante e (pretérito 1ª, subjuntivo, imperativo)',
    affectedTenses: ['pretIndef', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['empezar', 'almorzar', 'organizar']
  },
  
  'ORTH_GUAR': {
    id: 'ORTH_GUAR',
    name: 'Verbos -guar (diéresis)',
    description: 'averiguar, apaciguar',
    examples: ['averiguar', 'apaciguar', 'aguar'],
    pattern: '-guar con diéresis: averigüé, averigüe',
    affectedTenses: ['pretIndef', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['averiguar', 'apaciguar']
  },
  
  // 5) Pretérito indefinido de tema fuerte
  'PRET_UV': {
    id: 'PRET_UV',
    name: 'Pretérito fuerte -uv-',
    description: 'andar, estar, tener',
    examples: ['andar', 'estar', 'tener'],
    pattern: 'raíz -uv- en pretérito: anduve, estuve, tuve. Propagación a subjuntivo imperfecto',
    affectedTenses: ['pretIndef', 'subjImpf'],
    paradigmaticVerbs: ['andar', 'estar', 'tener']
  },
  
  'PRET_U': {
    id: 'PRET_U',
    name: 'Pretérito fuerte -u-',
    description: 'poder, poner, saber, caber',
    examples: ['poder', 'poner', 'saber', 'caber'],
    pattern: 'raíz -u- en pretérito: pude, puse, supe, cupe. Propagación a subjuntivo imperfecto',
    affectedTenses: ['pretIndef', 'subjImpf'],
    paradigmaticVerbs: ['poder', 'poner', 'saber', 'caber']
  },
  
  'PRET_I': {
    id: 'PRET_I',
    name: 'Pretérito fuerte -i-',
    description: 'querer, venir, hacer',
    examples: ['querer', 'venir', 'hacer'],
    pattern: 'raíz -i- en pretérito: quise, vine, hice. Propagación a subjuntivo imperfecto',
    affectedTenses: ['pretIndef', 'subjImpf'],
    paradigmaticVerbs: ['querer', 'venir', 'hacer']
  },
  
  'PRET_J': {
    id: 'PRET_J',
    name: 'Pretérito fuerte -j-',
    description: 'decir, traer, conducir',
    examples: ['decir', 'traer', 'conducir', 'traducir', 'producir', 'reducir'],
    pattern: 'raíz -j- en pretérito: dije, traje, conduje. 3ª plural -eron (no -ieron)',
    affectedTenses: ['pretIndef', 'subjImpf'],
    paradigmaticVerbs: ['decir', 'traer', 'conducir']
  },
  
  'PRET_SUPPL': {
    id: 'PRET_SUPPL',
    name: 'Pretéritos supletivos',
    description: 'ir/ser, dar, ver, haber',
    examples: ['ir', 'ser', 'dar', 'ver', 'haber'],
    pattern: 'formas completamente irregulares: fui, di, vi, hubo',
    affectedTenses: ['pretIndef', 'subjImpf'],
    paradigmaticVerbs: ['ir', 'ser', 'dar', 'ver']
  },
  
  // 6) Otros patrones especiales
  'IAR_VERBS': {
    id: 'IAR_VERBS',
    name: 'Verbos -iar (algunos con tilde)',
    description: 'enviar, confiar, guiar',
    examples: ['enviar', 'confiar', 'guiar', 'fiar', 'criar', 'ampliar'],
    pattern: 'algunos -iar llevan tilde: envío, confío (no todos: cambiar→cambio)',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['enviar', 'confiar', 'guiar']
  },
  
  'UAR_VERBS': {
    id: 'UAR_VERBS',
    name: 'Verbos -uar (algunos con tilde)',
    description: 'continuar, actuar, evaluar',
    examples: ['continuar', 'actuar', 'evaluar', 'graduar', 'situar'],
    pattern: 'algunos -uar llevan tilde: continúo, actúo (no todos: averiguar→averiguo)',
    affectedTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    paradigmaticVerbs: ['continuar', 'actuar', 'evaluar']
  }
}

// Función para obtener las familias que afectan a un tiempo específico
export function getFamiliesForTense(tense) {
  const families = []
  for (const [id, family] of Object.entries(IRREGULAR_FAMILIES)) {
    if (family.affectedTenses.includes(tense)) {
      families.push(family)
    }
  }
  return families
}

// Función para obtener las familias que afectan a un modo específico
export function getFamiliesForMood(mood) {
  const tensesByMood = {
    'indicative': ['pres', 'pretIndef', 'impf', 'fut', 'pretPerf', 'plusc', 'futPerf'],
    'subjunctive': ['subjPres', 'subjImpf', 'subjPerf', 'subjPlusc'],
    'imperative': ['impAff', 'impNeg'],
    'conditional': ['cond', 'condPerf'],
    'nonfinite': ['ger', 'part']
  }
  
  const relevantTenses = tensesByMood[mood] || []
  const families = []
  
  for (const [id, family] of Object.entries(IRREGULAR_FAMILIES)) {
    const hasRelevantTense = family.affectedTenses.some(t => relevantTenses.includes(t))
    if (hasRelevantTense) {
      families.push(family)
    }
  }
  
  return families
}

// Función para obtener todas las familias disponibles
export function getAllFamilies() {
  return Object.values(IRREGULAR_FAMILIES)
}

// Función para obtener una familia por su ID
export function getFamilyById(id) {
  return IRREGULAR_FAMILIES[id] || null
}

// Función para categorizar un verbo en familias (clasificación automática básica)
export function categorizeVerb(lemma, verbData) {
  const families = []
  
  // Análisis de patrones basado en el lemma y datos del verbo
  // Esta es una clasificación inicial que se puede refinar manualmente
  
  // Verbos -car, -gar, -zar (ortográficos)
  if (lemma.endsWith('car')) families.push('ORTH_CAR')
  if (lemma.endsWith('gar')) families.push('ORTH_GAR')
  if (lemma.endsWith('zar')) families.push('ORTH_ZAR')
  if (lemma.endsWith('guar')) families.push('ORTH_GUAR')
  
  // Verbos -uir
  if (lemma.endsWith('uir') && !lemma.endsWith('guir')) families.push('UIR_Y')
  
  // Verbos -guir
  if (lemma.endsWith('guir')) families.push('GU_DROP')
  
  // Verbos -cer/-cir
  if (lemma.endsWith('cer') || lemma.endsWith('cir')) {
    // Vocal + cer/cir → -zco
    const beforeCer = lemma.slice(-3, -2)
    if (/[aeiou]/.test(beforeCer)) {
      families.push('ZCO_VERBS')
    } else {
      // Consonante + cer → -zo
      families.push('ZO_VERBS')
    }
  }
  
  // Verbos -ger/-gir
  if (lemma.endsWith('ger') || lemma.endsWith('gir')) families.push('JO_VERBS')
  
  // Verbos -iar/-uar (algunos)
  if (lemma.endsWith('iar')) families.push('IAR_VERBS')
  if (lemma.endsWith('uar')) families.push('UAR_VERBS')
  
  // Verbos específicos conocidos (lista manual)
  const knownVerbs = {
    // G-verbs
    'tener': ['G_VERBS', 'DIPHT_E_IE', 'PRET_UV'],
    'poner': ['G_VERBS', 'PRET_U'],
    'salir': ['G_VERBS'],
    'hacer': ['G_VERBS', 'PRET_I'],
    'venir': ['G_VERBS', 'DIPHT_E_IE', 'PRET_I'],
    'decir': ['G_VERBS', 'E_I_IR', 'PRET_J'],
    'oír': ['G_VERBS', 'HIATUS_Y'],
    'traer': ['G_VERBS', 'HIATUS_Y', 'PRET_J'],
    'caer': ['G_VERBS', 'HIATUS_Y'],
    'valer': ['G_VERBS'],
    
    // Diptongación e→ie
    'pensar': ['DIPHT_E_IE'],
    'cerrar': ['DIPHT_E_IE'],
    'empezar': ['DIPHT_E_IE', 'ORTH_ZAR'],
    'comenzar': ['DIPHT_E_IE', 'ORTH_ZAR'],
    'despertar': ['DIPHT_E_IE'],
    'sentir': ['DIPHT_E_IE', 'E_I_IR'],
    'preferir': ['DIPHT_E_IE', 'E_I_IR'],
    
    // Diptongación o→ue
    'volver': ['DIPHT_O_UE'],
    'poder': ['DIPHT_O_UE', 'PRET_U'],
    'contar': ['DIPHT_O_UE'],
    'mostrar': ['DIPHT_O_UE'],
    'dormir': ['DIPHT_O_UE', 'O_U_GER_IR'],
    'morir': ['DIPHT_O_UE', 'O_U_GER_IR'],
    
    // Diptongación u→ue
    'jugar': ['DIPHT_U_UE', 'ORTH_GAR'],
    
    // e→i (-ir)
    'pedir': ['E_I_IR'],
    'servir': ['E_I_IR'],
    'repetir': ['E_I_IR'],
    'seguir': ['E_I_IR', 'GU_DROP'],
    'elegir': ['E_I_IR', 'JO_VERBS'],
    'medir': ['E_I_IR'],
    'reír': ['E_I_IR'],
    
    // Pretéritos fuertes
    'andar': ['PRET_UV'],
    'estar': ['PRET_UV'],
    'saber': ['PRET_U'],
    'caber': ['PRET_U'],
    'querer': ['DIPHT_E_IE', 'PRET_I'],
    'conducir': ['ZCO_VERBS', 'PRET_J'],
    'traducir': ['ZCO_VERBS', 'PRET_J'],
    'producir': ['ZCO_VERBS', 'PRET_J'],
    
    // Supletivos
    'ir': ['PRET_SUPPL'],
    'ser': ['PRET_SUPPL'],
    'dar': ['PRET_SUPPL'],
    'ver': ['PRET_SUPPL'],
    'haber': ['PRET_SUPPL'],
    
    // Hiatos
    'leer': ['HIATUS_Y'],
    'creer': ['HIATUS_Y'],
    'poseer': ['HIATUS_Y'],
    'proveer': ['HIATUS_Y'],
    
    // -zco verbos específicos
    'conocer': ['ZCO_VERBS'],
    'nacer': ['ZCO_VERBS'],
    'parecer': ['ZCO_VERBS'],
    'crecer': ['ZCO_VERBS'],
    
    // Otros específicos
    'proteger': ['JO_VERBS'],
    'coger': ['JO_VERBS'],
    'recoger': ['JO_VERBS'],
    'dirigir': ['JO_VERBS'],
    'vencer': ['ZO_VERBS'],
    'ejercer': ['ZO_VERBS'],
    'torcer': ['ZO_VERBS'],
    'cocer': ['ZO_VERBS']
  }
  
  if (knownVerbs[lemma]) {
    families.push(...knownVerbs[lemma])
  }
  
  // Remover duplicados
  return [...new Set(families)]
}