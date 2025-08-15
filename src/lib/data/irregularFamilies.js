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
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['pensar', 'cerrar', 'empezar']
  },
  
  'DIPHT_O_UE': {
    id: 'DIPHT_O_UE',
    name: 'Diptongación o→ue',
    description: 'volver, poder, contar',
    examples: ['volver', 'poder', 'contar', 'mostrar', 'dormir', 'morir'],
    pattern: 'o→ue en presente (todas menos nosotros/vosotros), presente subjuntivo, imperativo',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['volver', 'poder', 'contar']
  },
  
  'DIPHT_U_UE': {
    id: 'DIPHT_U_UE',
    name: 'Diptongación u→ue',
    description: 'jugar, amuar, desaguar, menguar, fraguar, atestiguar',
    examples: ['jugar', 'amuar', 'desaguar', 'menguar', 'fraguar', 'atestiguar'],
    pattern: 'u→ue en presente (todas menos nosotros/vosotros), presente subjuntivo, imperativo',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['jugar']
  },
  
  'E_I_IR': {
    id: 'E_I_IR',
    name: 'e→i (verbos -ir)',
    description: 'pedir, servir, repetir, seguir, sentir, preferir',
    examples: ['pedir', 'servir', 'repetir', 'seguir', 'sentir', 'preferir', 'mentir', 'competir', 'medir', 'vestir'],
    pattern: 'e→i en presente (todas menos nosotros/vosotros), presente subjuntivo, imperativo, gerundio, pretérito 3ª personas',
    affectedTenses: ['pres', 'subjPres', 'pretIndef'],
    paradigmaticVerbs: ['pedir', 'servir', 'repetir']
  },
  
  'O_U_GER_IR': {
    id: 'O_U_GER_IR',
    name: 'o→u en gerundio y pretérito (-ir)',
    description: 'dormir, morir, adormecerse, gruñir, podrir, promorir',
    examples: ['dormir', 'morir', 'adormir', 'adormecerse', 'redormir', 'gruñir'],
    pattern: 'o→u en gerundio y pretérito 3ª personas de verbos -ir que diptongan',
    affectedTenses: ['pretIndef'],
    paradigmaticVerbs: ['dormir', 'morir']
  },
  
  // 2) Alternancias de consonante en 1.ª sing. (presente) + subjuntivo
  'G_VERBS': {
    id: 'G_VERBS',
    name: 'Irregulares en YO',
    description: 'tener, poner, salir, hacer, venir, decir, oír, traer, conocer, conducir, vencer',
    examples: ['tener', 'poner', 'salir', 'hacer', 'venir', 'decir', 'oír', 'traer', 'caer', 'valer', 'conocer', 'nacer', 'conducir', 'producir', 'traducir', 'reducir', 'parecer', 'crecer', 'vencer', 'ejercer', 'torcer', 'cocer'],
    pattern: '1ª persona presente irregular (tengo, conozco, venzo), propagación a todo el subjuntivo',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['tener', 'poner', 'salir', 'hacer', 'venir', 'conocer', 'conducir', 'vencer']
  },
  
  
  'JO_VERBS': {
    id: 'JO_VERBS',
    name: 'Verbos -ger/-gir → -jo',
    description: 'proteger, elegir, coger',
    examples: ['proteger', 'elegir', 'coger', 'recoger', 'dirigir', 'corregir'],
    pattern: '-ger/-gir → -jo en 1ª persona, propagación a subjuntivo',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['proteger', 'elegir', 'coger']
  },
  
  'GU_DROP': {
    id: 'GU_DROP',
    name: 'Verbos -guir (pérdida de u)',
    description: 'seguir, distinguir, extinguir, conseguir, perseguir, proseguir',
    examples: ['seguir', 'distinguir', 'extinguir', 'conseguir', 'perseguir', 'proseguir'],
    pattern: 'pérdida de "u" en 1ª persona: -guir → -go, propagación a subjuntivo',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['seguir', 'distinguir']
  },

  'ZCO_VERBS': {
    id: 'ZCO_VERBS',
    name: 'Verbos -cer/-cir → -zco',
    description: 'conocer, nacer, parecer, conducir',
    examples: ['conocer', 'nacer', 'parecer', 'crecer', 'conducir', 'traducir', 'producir', 'reducir'],
    pattern: 'vocal + cer/cir → -zco en 1ª persona: conozco, nazco, parezco, conduzco',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['conocer', 'parecer', 'conducir']
  },

  'ZO_VERBS': {
    id: 'ZO_VERBS',
    name: 'Verbos -cer → -zo',
    description: 'vencer, ejercer, torcer, cocer',
    examples: ['vencer', 'ejercer', 'torcer', 'cocer', 'convencer', 'retorcer'],
    pattern: 'consonante + cer → -zo en 1ª persona: venzo, ejerzo, tuerzo, cuezo',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['vencer', 'ejercer', 'torcer']
  },
  
  // 3) Inserción de -y- y fenómenos vocálicos con hiato
  'UIR_Y': {
    id: 'UIR_Y',
    name: 'Verbos -uir (inserción de y)',
    description: 'construir, huir, destruir',
    examples: ['construir', 'huir', 'destruir', 'incluir', 'excluir', 'concluir', 'sustituir'],
    pattern: 'inserción de -y- en presente (todas menos nosotros/vosotros), subjuntivo',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['construir', 'huir', 'destruir']
  },
  
  'HIATUS_Y': {
    id: 'HIATUS_Y',
    name: 'Hiatos con -y- (3ª persona)',
    description: 'leer, creer, construir, destruir, huir',
    examples: ['leer', 'creer', 'construir', 'destruir', 'huir', 'incluir', 'concluir', 'contribuir', 'distribuir'],
    pattern: 'verbos con raíz vocal: i→y solo en pretérito 3ª personas (leyó, leyeron)',
    affectedTenses: ['pretIndef'],
    paradigmaticVerbs: ['leer', 'creer', 'construir']
  },
  
  // 4) Cambios ortográficos para conservar sonido
  'ORTH_CAR': {
    id: 'ORTH_CAR',
    name: 'Verbos -car → -qu',
    description: 'buscar, sacar, tocar',
    examples: ['buscar', 'sacar', 'tocar', 'practicar', 'explicar', 'atacar'],
    pattern: '-car → -qu ante e (pretérito 1ª, subjuntivo, imperativo)',
    affectedTenses: ['pretIndef', 'subjPres'],
    paradigmaticVerbs: ['buscar', 'sacar', 'tocar']
  },
  
  'ORTH_GAR': {
    id: 'ORTH_GAR',
    name: 'Verbos -gar → -gu',
    description: 'llegar, pagar, jugar',
    examples: ['llegar', 'pagar', 'jugar', 'entregar', 'apagar', 'obligar'],
    pattern: '-gar → -gu ante e (pretérito 1ª, subjuntivo, imperativo)',
    affectedTenses: ['pretIndef', 'subjPres'],
    paradigmaticVerbs: ['llegar', 'pagar', 'obligar']
  },
  
  'ORTH_ZAR': {
    id: 'ORTH_ZAR',
    name: 'Verbos -zar → -c',
    description: 'empezar, almorzar, organizar',
    examples: ['empezar', 'almorzar', 'organizar', 'comenzar', 'realizar', 'utilizar'],
    pattern: '-zar → -c ante e (pretérito 1ª, subjuntivo, imperativo)',
    affectedTenses: ['pretIndef', 'subjPres'],
    paradigmaticVerbs: ['empezar', 'almorzar', 'organizar']
  },
  
  'ORTH_GUAR': {
    id: 'ORTH_GUAR',
    name: 'Verbos -guar (diéresis)',
    description: 'averiguar, apaciguar, aguar, fraguar, menguar',
    examples: ['averiguar', 'apaciguar', 'aguar', 'fraguar', 'menguar', 'santiguar'],
    pattern: '-guar con diéresis: averigüé, averigüe',
    affectedTenses: ['pretIndef', 'subjPres'],
    paradigmaticVerbs: ['averiguar', 'apaciguar']
  },
  
  // 5) Pretérito indefinido de tema fuerte
  'PRET_UV': {
    id: 'PRET_UV',
    name: 'Pretérito fuerte -uv-',
    description: 'andar, estar, tener',
    examples: ['andar', 'estar', 'tener', 'mantener', 'obtener', 'contener', 'sostener'],
    pattern: 'raíz -uv- en pretérito: anduve, estuve, tuve. Propagación a subjuntivo imperfecto',
    affectedTenses: ['pretIndef'],
    paradigmaticVerbs: ['andar', 'estar', 'tener']
  },
  
  'PRET_U': {
    id: 'PRET_U',
    name: 'Pretérito fuerte -u-',
    description: 'poder, poner, saber, caber, haber, deber',
    examples: ['poder', 'poner', 'saber', 'caber', 'haber', 'deber'],
    pattern: 'raíz -u- en pretérito: pude, puse, supe, cupe, hube, debí (aunque deber es regular, sigue el patrón en algunos dialectos)',
    affectedTenses: ['pretIndef'],
    paradigmaticVerbs: ['poder', 'poner', 'saber', 'caber']
  },
  
  'PRET_I': {
    id: 'PRET_I',
    name: 'Pretérito fuerte -i-',
    description: 'querer, venir, hacer',
    examples: ['querer', 'venir', 'hacer', 'convenir', 'prevenir', 'rehacer', 'deshacer'],
    pattern: 'raíz -i- en pretérito: quise, vine, hice. Propagación a subjuntivo imperfecto',
    affectedTenses: ['pretIndef'],
    paradigmaticVerbs: ['querer', 'venir', 'hacer']
  },
  
  'PRET_J': {
    id: 'PRET_J',
    name: 'Pretérito fuerte -j-',
    description: 'decir, traer, conducir',
    examples: ['decir', 'traer', 'conducir', 'traducir', 'producir', 'reducir'],
    pattern: 'raíz -j- en pretérito: dije, traje, conduje. 3ª plural -eron (no -ieron)',
    affectedTenses: ['pretIndef'],
    paradigmaticVerbs: ['decir', 'traer', 'conducir']
  },
  
  'PRET_SUPPL': {
    id: 'PRET_SUPPL',
    name: 'Pretéritos supletivos',
    description: 'ir/ser, dar, ver, haber, estar',
    examples: ['ir', 'ser', 'dar', 'ver', 'haber', 'estar'],
    pattern: 'formas completamente irregulares: fui, di, vi, hubo, estuve',
    affectedTenses: ['pretIndef'],
    paradigmaticVerbs: ['ir', 'ser', 'dar', 'ver']
  },
  
  // 6) Otros patrones especiales
  'IAR_VERBS': {
    id: 'IAR_VERBS',
    name: 'Verbos -iar (algunos con tilde)',
    description: 'enviar, confiar, guiar',
    examples: ['enviar', 'confiar', 'guiar', 'fiar', 'criar', 'ampliar'],
    pattern: 'algunos -iar llevan tilde: envío, confío (no todos: cambiar→cambio)',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['enviar', 'confiar', 'guiar']
  },
  
  'UAR_VERBS': {
    id: 'UAR_VERBS',
    name: 'Verbos -uar (algunos con tilde)',
    description: 'continuar, actuar, evaluar, graduar, situar, fluctuar',
    examples: ['continuar', 'actuar', 'evaluar', 'graduar', 'situar', 'fluctuar'],
    pattern: 'algunos -uar llevan tilde: continúo, actúo (no todos: averiguar→averiguo)',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['continuar', 'actuar', 'evaluar']
  },

  // 7) Categorías específicas para formas no conjugadas
  'IRREG_GERUNDS': {
    id: 'IRREG_GERUNDS',
    name: 'Gerundios irregulares',
    description: 'ir, poder, venir, decir, traer',
    examples: ['ir', 'poder', 'venir', 'decir', 'traer', 'caer', 'leer', 'creer', 'oír', 'huir'],
    pattern: 'gerundios con formas especiales: yendo, pudiendo, viniendo, diciendo, trayendo',
    affectedTenses: ['ger'],
    paradigmaticVerbs: ['ir', 'poder', 'venir', 'decir']
  },

  'IRREG_PARTICIPLES': {
    id: 'IRREG_PARTICIPLES',
    name: 'Participios irregulares',
    description: 'hacer, ver, escribir, poner, volver',
    examples: ['hacer', 'ver', 'escribir', 'poner', 'volver', 'morir', 'abrir', 'cubrir', 'descubrir', 'romper'],
    pattern: 'participios irregulares: hecho, visto, escrito, puesto, vuelto, muerto',
    affectedTenses: ['part'],
    paradigmaticVerbs: ['hacer', 'ver', 'escribir', 'poner', 'volver']
  },

  // 8) Categorías para condicional (irregulares de futuro)
  'IRREG_CONDITIONAL': {
    id: 'IRREG_CONDITIONAL',
    name: 'Condicional irregular',
    description: 'tener, venir, poner, salir, valer, poder, saber, haber, hacer, decir, querer, caber',
    examples: ['tener', 'venir', 'poner', 'salir', 'valer', 'poder', 'saber', 'haber', 'hacer', 'decir', 'querer', 'caber'],
    pattern: 'misma raíz irregular que el futuro: tendría, vendría, pondría, sabría',
    affectedTenses: ['cond', 'fut'],
    paradigmaticVerbs: ['tener', 'venir', 'poner', 'salir', 'poder', 'saber']
  },

  // 9) Categorías para imperativo
  'IMPERATIVE_IRREG': {
    id: 'IMPERATIVE_IRREG',
    name: 'Imperativo irregular',
    description: 'tener, venir, poner, salir, hacer, decir, ir, ser',
    examples: ['tener', 'venir', 'poner', 'salir', 'hacer', 'decir', 'ir', 'ser', 'haber', 'saber'],
    pattern: 'formas especiales de imperativo: ten, ven, pon, sal, haz, di, ve, sé',
    affectedTenses: ['impAff', 'impNeg'],
    paradigmaticVerbs: ['tener', 'venir', 'poner', 'salir', 'hacer', 'decir']
  },

  // 10) Categorías especializadas adicionales
  'DEFECTIVE_VERBS': {
    id: 'DEFECTIVE_VERBS',
    name: 'Verbos defectivos',
    description: 'soler, abolir, blandir, agredir, empedernir, desvaír',
    examples: ['soler', 'abolir', 'blandir', 'agredir', 'empedernir', 'desvaír'],
    pattern: 'verbos que carecen de algunas formas (solo 3ª persona, infinitivo, etc.)',
    affectedTenses: ['pres', 'subjPres', 'impAff'],
    paradigmaticVerbs: ['soler', 'abolir', 'blandir']
  },

  'DOUBLE_PARTICIPLES': {
    id: 'DOUBLE_PARTICIPLES',
    name: 'Doble participio',
    description: 'freír, imprimir, proveer, elegir, prender, suspender',
    examples: ['freír', 'imprimir', 'proveer', 'elegir', 'prender', 'suspender'],
    pattern: 'verbos con doble participio: frito/freído, impreso/imprimido, electo/elegido',
    affectedTenses: ['part'],
    paradigmaticVerbs: ['freír', 'imprimir', 'proveer']
  },

  'ACCENT_CHANGES': {
    id: 'ACCENT_CHANGES',
    name: 'Cambios de acentuación',
    description: 'prohibir, reunir, aislar, aullar, maullar, rehusar',
    examples: ['prohibir', 'reunir', 'aislar', 'aullar', 'maullar', 'rehusar'],
    pattern: 'verbos con cambios de acento prosódico: prohíbo, reúno, aíslo',
    affectedTenses: ['pres', 'subjPres'],
    paradigmaticVerbs: ['prohibir', 'reunir', 'aislar']
  },

  'MONOSYLLABIC_IRREG': {
    id: 'MONOSYLLABIC_IRREG',
    name: 'Monosílabos irregulares',
    description: 'ir, ser, dar, ver, haber, estar',
    examples: ['ir', 'ser', 'dar', 'ver', 'haber', 'estar'],
    pattern: 'verbos monosílabos altamente irregulares en múltiples tiempos',
    affectedTenses: ['pres', 'pretIndef', 'subjPres', 'impAff'],
    paradigmaticVerbs: ['ir', 'ser', 'dar', 'ver']
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
    'venir': ['G_VERBS', 'DIPHT_E_IE', 'PRET_I', 'IMPERATIVE_IRREG', 'IRREG_CONDITIONAL', 'IRREG_GERUNDS'],
    'decir': ['G_VERBS', 'E_I_IR', 'PRET_J', 'IRREG_GERUNDS', 'IRREG_CONDITIONAL', 'IMPERATIVE_IRREG'],
    'oír': ['G_VERBS', 'PRET_J'],
    'traer': ['G_VERBS', 'PRET_J', 'IRREG_GERUNDS'],
    'caer': ['G_VERBS', 'PRET_J'],
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
    'poder': ['DIPHT_O_UE', 'PRET_U', 'IRREG_GERUNDS', 'IRREG_CONDITIONAL'],
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
    'sentir': ['DIPHT_E_IE', 'E_I_IR'],
    'preferir': ['DIPHT_E_IE', 'E_I_IR'],
    'mentir': ['DIPHT_E_IE', 'E_I_IR'],
    'competir': ['E_I_IR'],
    'vestir': ['E_I_IR'],
    
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
    
    // Hiatos (solo irregulares en 3ª persona)
    'leer': ['HIATUS_Y'],
    'creer': ['HIATUS_Y'],
    'construir': ['UIR_Y', 'HIATUS_Y'],
    'destruir': ['UIR_Y', 'HIATUS_Y'],
    'huir': ['UIR_Y', 'HIATUS_Y'],
    'incluir': ['UIR_Y', 'HIATUS_Y'],
    'concluir': ['UIR_Y', 'HIATUS_Y'],
    'contribuir': ['UIR_Y', 'HIATUS_Y'],
    'distribuir': ['UIR_Y', 'HIATUS_Y'],
    // Verbos más avanzados (B2+)
    'poseer': ['HIATUS_Y'],
    'proveer': ['HIATUS_Y'],
    'releer': ['HIATUS_Y'],
    'instruir': ['UIR_Y', 'HIATUS_Y'],
    'reconstruir': ['UIR_Y', 'HIATUS_Y'],
    'sustituir': ['UIR_Y', 'HIATUS_Y'],
    'atribuir': ['UIR_Y', 'HIATUS_Y'],
    'excluir': ['UIR_Y', 'HIATUS_Y'],
    
    // Verbos menos comunes para B2+ (o→u en pretérito)
    'podrir': ['DIPHT_O_UE', 'O_U_GER_IR'],
    'gruñir': ['O_U_GER_IR'],
    
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
    'cocer': ['ZO_VERBS'],
    
    // Cambios de acentuación
    'prohibir': ['ACCENT_CHANGES'],
    'reunir': ['ACCENT_CHANGES'],
    'aislar': ['ACCENT_CHANGES'],
    'aullar': ['ACCENT_CHANGES'],
    'maullar': ['ACCENT_CHANGES'],
    'rehusar': ['ACCENT_CHANGES'],
    
    // DIPHT_U_UE y ORTH_GUAR combinados
    'fraguar': ['DIPHT_U_UE', 'ORTH_GUAR'],
    'menguar': ['DIPHT_U_UE', 'ORTH_GUAR'],
    
    // GU_DROP y E_I_IR combinados
    'conseguir': ['GU_DROP', 'E_I_IR'],
    'perseguir': ['GU_DROP', 'E_I_IR'],
    
    // O_U_GER_IR y DIPHT_O_UE combinados
    'podrir': ['O_U_GER_IR', 'DIPHT_O_UE'],
    
    // ORTH_CAR específicos
    'tocar': ['ORTH_CAR'],
    'practicar': ['ORTH_CAR'],
    'explicar': ['ORTH_CAR'],
    
    // Imperativos irregulares
    'tener': ['G_VERBS', 'DIPHT_E_IE', 'PRET_UV', 'IMPERATIVE_IRREG', 'IRREG_CONDITIONAL'],
    'poner': ['G_VERBS', 'PRET_U', 'IMPERATIVE_IRREG', 'IRREG_CONDITIONAL', 'IRREG_PARTICIPLES'],
    'salir': ['G_VERBS', 'IMPERATIVE_IRREG', 'IRREG_CONDITIONAL'],
    'venir': ['G_VERBS', 'DIPHT_E_IE', 'PRET_I', 'IMPERATIVE_IRREG', 'IRREG_CONDITIONAL'],
    'hacer': ['G_VERBS', 'PRET_I', 'IMPERATIVE_IRREG', 'IRREG_CONDITIONAL', 'IRREG_PARTICIPLES'],
    'decir': ['G_VERBS', 'E_I_IR', 'PRET_J', 'IMPERATIVE_IRREG', 'IRREG_CONDITIONAL', 'IRREG_PARTICIPLES'],
    
    // Monosílabos irregulares y formas especiales
    'ir': ['PRET_SUPPL', 'IMPERATIVE_IRREG', 'IRREG_GERUNDS', 'MONOSYLLABIC_IRREG'],
    'ser': ['PRET_SUPPL', 'IMPERATIVE_IRREG', 'MONOSYLLABIC_IRREG'],
    'dar': ['PRET_SUPPL', 'MONOSYLLABIC_IRREG'],
    'ver': ['PRET_SUPPL', 'IRREG_PARTICIPLES', 'MONOSYLLABIC_IRREG'],
    
    // Familias finales
    'freír': ['E_I_IR', 'DOUBLE_PARTICIPLES'],
    'soler': ['DIPHT_O_UE', 'DEFECTIVE_VERBS'],
    
    // Nuevos verbos agregados en optimización nocturna
    'abolir': ['DEFECTIVE_VERBS'],
    'blandir': ['DEFECTIVE_VERBS'],
    'imprimir': ['DOUBLE_PARTICIPLES'],
    'proveer': ['HIATUS_Y', 'DOUBLE_PARTICIPLES'],
    'entregar': ['ORTH_GAR'],
    'obligar': ['ORTH_GAR'],
    'almorzar': ['DIPHT_O_UE', 'ORTH_ZAR'],
    'utilizar': ['ORTH_ZAR'],
    
    // Expansión DIPHT_U_UE
    'amuar': ['DIPHT_U_UE'],
    'desaguar': ['DIPHT_U_UE', 'ORTH_GUAR'],
    'atestiguar': ['DIPHT_U_UE', 'ORTH_GUAR'],
    'aguar': ['DIPHT_U_UE', 'ORTH_GUAR'],
    'santiguar': ['DIPHT_U_UE', 'ORTH_GUAR'],
    
    // Expansión O_U_GER_IR
    'gruñir': ['O_U_GER_IR'],
    'adormir': ['DIPHT_O_UE', 'O_U_GER_IR'],
    'redormir': ['DIPHT_O_UE', 'O_U_GER_IR'],
    
    // Expansión JO_VERBS
    'dirigir': ['JO_VERBS'],
    'corregir': ['JO_VERBS', 'E_I_IR'],
    'recoger': ['JO_VERBS'],
    'escoger': ['JO_VERBS'],
    
    // Expansión GU_DROP
    'extinguir': ['GU_DROP'],
    'proseguir': ['GU_DROP', 'E_I_IR'],
    
    // Expansión PRET_UV
    'obtener': ['G_VERBS', 'DIPHT_E_IE', 'PRET_UV', 'IRREG_CONDITIONAL'],
    'contener': ['G_VERBS', 'DIPHT_E_IE', 'PRET_UV', 'IRREG_CONDITIONAL'],
    'sostener': ['G_VERBS', 'DIPHT_E_IE', 'PRET_UV', 'IRREG_CONDITIONAL'],
    
    // Expansión PRET_U
    'haber': ['PRET_U', 'MONOSYLLABIC_IRREG', 'IRREG_CONDITIONAL'],
    'deber': ['PRET_U'],
    
    // Expansión PRET_I
    'convenir': ['G_VERBS', 'DIPHT_E_IE', 'PRET_I', 'IRREG_CONDITIONAL', 'IRREG_GERUNDS'],
    'prevenir': ['G_VERBS', 'DIPHT_E_IE', 'PRET_I', 'IRREG_CONDITIONAL', 'IRREG_GERUNDS'],
    'rehacer': ['G_VERBS', 'PRET_I', 'IRREG_CONDITIONAL', 'IMPERATIVE_IRREG', 'IRREG_PARTICIPLES'],
    
    // Expansión IRREG_GERUNDS
    'caer': ['G_VERBS', 'PRET_J', 'IRREG_GERUNDS', 'HIATUS_Y'],
    'leer': ['HIATUS_Y', 'IRREG_GERUNDS'],
    'creer': ['HIATUS_Y', 'IRREG_GERUNDS'],
    
    // Expansión IRREG_PARTICIPLES
    'abrir': ['IRREG_PARTICIPLES'],
    'cubrir': ['IRREG_PARTICIPLES'],
    'romper': ['IRREG_PARTICIPLES'],
    
    // Expansión DEFECTIVE_VERBS
    'agredir': ['DEFECTIVE_VERBS'],
    'empedernir': ['DEFECTIVE_VERBS'],
    'blandir': ['DEFECTIVE_VERBS'],
    
    // Expansión DOUBLE_PARTICIPLES
    'prender': ['DOUBLE_PARTICIPLES'],
    'suspender': ['DOUBLE_PARTICIPLES']
  }
  
  if (knownVerbs[lemma]) {
    families.push(...knownVerbs[lemma])
  }
  
  // Remover duplicados
  return [...new Set(families)]
}