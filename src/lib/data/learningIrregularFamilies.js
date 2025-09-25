// Sistema pedagógico de familias irregulares EXCLUSIVO para el learning module
// Diseñado para ser claro, progresivo y sin mezclar conceptos

// Import del sistema original para mapear familias existentes
import { categorizeVerb, getFamiliesForTense } from './irregularFamilies.js'

export const LEARNING_IRREGULAR_FAMILIES = {
  // ========================================
  // FAMILIAS REORGANIZADAS PARA EL PRESENTE
  // Criterio pedagógico: patrones útiles y frecuentes
  // ========================================
  
  // 1) IRREGULARES EN YO (primera persona con -g)
  'LEARNING_YO_G_PRESENT': {
    id: 'LEARNING_YO_G_PRESENT',
    name: 'Irregulares en YO (presente)',
    description: 'Verbos muy frecuentes que añaden -g en la primera persona: salgo, pongo, hago',
    paradigmatic: 'salir',
    examples: ['salir', 'poner', 'hacer', 'tener', 'venir', 'valer', 'caer', 'traer', 'oír', 'decir', 'seguir', 'conseguir', 'perseguir', 'distinguir'], // Más variedad para drills libres
    priorityExamples: ['salir', 'poner', 'hacer'], // Verbos más representativos y pedagógicos
    pattern: 'salir: salgo, sales, sale, salimos, salís, salen (solo YO cambia)',
    affectedTenses: ['pres', 'subjPres'],
    level: 'A2',
    concept: 'yo_irregular_g',
    pedagogicalNote: 'La irregularidad en YO se extiende a todo el subjuntivo. Patrón muy productivo.'
  },

  // 2) VERBOS QUE DIPTONGAN (cambios vocálicos sistemáticos)
  'LEARNING_DIPHTHONGS': {
    id: 'LEARNING_DIPHTHONGS',
    name: 'Verbos que diptongan',
    description: 'Cambios vocálicos sistemáticos: e→ie (querer), e→i (pedir), o→ue (poder)',
    paradigmatic: 'querer',
    // Priorizar un ejemplo por cada grupo: o→ue (poder), e→ie (querer), e→i (pedir)
    examples: ['poder', 'querer', 'pedir', 'volver', 'pensar', 'servir', 'contar', 'encontrar', 'recordar', 'mostrar', 'costar', 'sonar', 'volar', 'cerrar', 'empezar', 'despertar', 'comenzar', 'sentarse', 'acostarse', 'entender', 'perder', 'defender', 'encender', 'mentir', 'sentir', 'convertir', 'divertir', 'preferir', 'referir', 'sugerir', 'advertir', 'repetir', 'competir', 'impedir', 'medir', 'reír', 'freír', 'sonreír', 'vestir', 'elegir', 'corregir', 'dormir', 'morir', 'jugar'], // Jugar al final para no aparecer en presentación
    priorityExamples: ['poder', 'querer', 'pedir'], // Casos más representativos: o→ue, e→ie, e→i (NO jugar u→ue que es excepcional)
    pattern: 'querer: quiero, quieres, quiere, queremos, queréis, quieren (nosotros/vosotros no diptongan)',
    affectedTenses: ['pres', 'subjPres'],
    level: 'A2',
    concept: 'diphthongs_all',
    pedagogicalNote: 'Tres tipos principales: o→ue (poder), e→ie (querer), e→i (pedir). Solo en sílabas tónicas (acentuadas).'
  },

  // 3) MUY IRREGULARES (casos especiales frecuentes)
  'LEARNING_VERY_IRREGULAR': {
    id: 'LEARNING_VERY_IRREGULAR',
    name: 'Muy irregulares',
    description: 'Verbos súper frecuentes con formas completamente irregulares: ser, estar, ir, dar',
    paradigmatic: 'ser',
    examples: ['ser', 'estar', 'ir', 'dar', 'saber', 'caber', 'haber'], // Incluir todos los muy irregulares fundamentales
    priorityExamples: ['ser', 'estar', 'ir'], // Los 3 más fundamentales y pedagógicos
    pattern: 'ser: soy, eres, es, somos, sois, son (formas únicas que hay que memorizar)',
    affectedTenses: ['pres', 'subjPres'],
    level: 'A1', // Los más básicos y frecuentes
    concept: 'very_irregular',
    pedagogicalNote: 'Sin patrón regular. Hay que memorizar las formas completas. Súper frecuentes en conversación.'
  },

  // ========================================
  // FAMILIAS PARA OTROS TIEMPOS VERBALES
  // (Mantenidas del sistema anterior)
  // ========================================

  // Cambios ortográficos (para pretérito y subjuntivo)
  'LEARNING_ORTH_CAR': {
    id: 'LEARNING_ORTH_CAR',
    name: 'Ortográfico: -car → -qu',
    description: 'Verbos -car súper frecuentes: c → qu delante de e',
    paradigmatic: 'buscar',
    examples: ['buscar', 'sacar', 'tocar'],
    priorityExamples: ['buscar', 'sacar', 'tocar'], // Todos son igualmente representativos
    pattern: 'buscar: busqué, busque (conservar sonido /k/)',
    affectedTenses: ['pretIndef', 'subjPres'],
    level: 'A2',
    concept: 'orthographic',
    pedagogicalNote: 'Solo verbos esenciales para aprender la regla ortográfica.'
  },

  'LEARNING_ORTH_GAR': {
    id: 'LEARNING_ORTH_GAR',
    name: 'Ortográfico: -gar → -gu', 
    description: 'Verbos -gar súper frecuentes: g → gu delante de e',
    paradigmatic: 'llegar',
    examples: ['llegar', 'pagar', 'apagar'],
    priorityExamples: ['llegar', 'pagar', 'apagar'], // Todos son igualmente representativos
    pattern: 'llegar: llegué, llegue (conservar sonido /g/)',
    affectedTenses: ['pretIndef', 'subjPres'],
    level: 'A2',
    concept: 'orthographic',
    pedagogicalNote: 'Solo verbos esenciales. Jugar se enseña aparte por ser único u→ue.'
  },

  // Pretéritos muy irregulares (raíces completamente nuevas)
  'LEARNING_PRET_MUY_IRREGULARES': {
    id: 'LEARNING_PRET_MUY_IRREGULARES',
    name: 'Muy irregulares del pretérito',
    description: 'Verbos frecuentes con raíces completamente irregulares en pretérito: estar, querer, hacer',
    paradigmatic: 'estar',
    examples: ['estar', 'querer', 'hacer', 'tener', 'poder', 'poner', 'venir', 'saber', 'caber', 'haber', 'andar', 'conducir', 'producir', 'traducir', 'reducir', 'introducir', 'decir', 'traer'], // Muchos más pretéritos fuertes para variedad
    priorityExamples: ['estar', 'hacer', 'querer'], // Más frecuentes y pedagógicos: estuv-, hic-, quis-
    pattern: 'estar: estuve, estuviste, estuvo (raíz nueva + terminaciones sin acento)',
    affectedTenses: ['pretIndef', 'subjImpf'],
    level: 'B1',
    concept: 'strong_preterite',
    pedagogicalNote: 'Verbos muy frecuentes con raíces irregulares: estuv-, quis-, hic-, tuv-, pud-, pus-, vin-.'
  },

  // Irregulares solo en terceras personas (cambios vocálicos)
  'LEARNING_PRET_3AS_PERSONAS': {
    id: 'LEARNING_PRET_3AS_PERSONAS', 
    name: 'Irregulares en 3ª persona',
    description: 'Verbos que cambian solo en 3ª persona: e→i (pidió), o→u (durmió), i→y (leyó)',
    paradigmatic: 'pedir',
    examples: ['pedir', 'preferir', 'dormir', 'leer', 'servir', 'morir', 'oír', 'repetir', 'competir', 'impedir', 'medir', 'seguir', 'conseguir', 'perseguir', 'vestir', 'mentir', 'sentir', 'convertir', 'divertir', 'advertir', 'sugerir', 'referir', 'construir', 'destruir', 'instruir', 'sustituir', 'distribuir', 'contribuir', 'huir', 'incluir', 'concluir', 'excluir', 'influir', 'creer', 'poseer', 'proveer', 'caer'], // Verbos e→i, o→u, i→y que cambian solo en 3ª persona
    priorityExamples: ['pedir', 'dormir', 'leer'], // Tres patrones más claros: e→i, o→u, i→y
    pattern: 'pedir: pedí, pediste, pidió, pedimos, pedisteis, pidieron (solo 3ª persona cambia)',
    affectedTenses: ['pretIndef', 'ger'],
    level: 'B1',
    concept: 'third_person_changes',
    pedagogicalNote: 'Cambios vocálicos limitados a 3ª persona singular y plural: e→i, o→u, i→y en hiato.'
  },


  // ========================================
  // NIVEL 6: IRREGULARES DEL IMPERFECTO
  // Solo 3 verbos en todo el español tienen imperfecto irregular
  // ========================================

  'LEARNING_IMPF_IRREGULAR': {
    id: 'LEARNING_IMPF_IRREGULAR',
    name: 'Imperfecto irregular (ser, ir, ver)',
    description: 'Los únicos 3 verbos con imperfecto irregular en español',
    paradigmatic: 'ser',
    examples: ['ser', 'ir', 'ver'],
    priorityExamples: ['ser', 'ir', 'ver'], // Los únicos 3, todos igualmente importantes
    pattern: 'ser: era, eras, era / ir: iba, ibas, iba / ver: veía, veías, veía',
    affectedTenses: ['impf'],
    level: 'A2',
    concept: 'imperfect_irregular',
    pedagogicalNote: 'Solo 3 verbos irregulares en imperfecto. Memorizar las formas completas.'
  },

  'LEARNING_FUT_COND_IRREGULAR': {
    id: 'LEARNING_FUT_COND_IRREGULAR',
    name: 'Raíces irregulares (futuro y condicional)',
    description: 'tener→tendr-, decir→dir-, poder→podr-, saber→sabr-',
    paradigmatic: 'tener',
    examples: ['tener', 'salir', 'venir', 'poner', 'valer', 'poder', 'saber', 'haber', 'hacer', 'decir', 'querer', 'caber'],
    priorityExamples: ['tener', 'decir', 'poder'],
    pattern: 'tener: tendré, tendrás, tendrá / tendría, tendrías, tendría',
    affectedTenses: ['fut', 'cond'],
    level: 'B1',
    concept: 'future_cond_irregular',
    pedagogicalNote: 'Los 12 verbos de raíz irregular comparten las mismas terminaciones regulares pero con cambios en la raíz (tendr-, dir-, podr-, sabr-).' 
  },

  'LEARNING_IRREG_GERUNDS': {
    id: 'LEARNING_IRREG_GERUNDS',
    name: 'Gerundios irregulares',
    description: 'yendo, pudiendo, viniendo: raíces y cambios ortográficos claves',
    paradigmatic: 'ir',
    examples: ['ir', 'poder', 'venir', 'decir', 'traer', 'dormir', 'morir', 'sentir', 'leer', 'oír'],
    priorityExamples: ['ir', 'decir', 'dormir'],
    pattern: 'ir → yendo / decir → diciendo / dormir → durmiendo',
    affectedTenses: ['ger'],
    level: 'B1',
    concept: 'nonfinite_irregular',
    pedagogicalNote: 'Practica los cambios vocálicos y la aparición de -y- en los gerundios más frecuentes.'
  },

  'LEARNING_IRREG_PARTICIPLES': {
    id: 'LEARNING_IRREG_PARTICIPLES',
    name: 'Participios irregulares',
    description: 'hecho, visto, escrito, puesto, vuelto, muerto…',
    paradigmatic: 'hacer',
    examples: ['hacer', 'ver', 'escribir', 'poner', 'volver', 'morir', 'abrir', 'cubrir', 'decir', 'romper', 'resolver'],
    priorityExamples: ['hacer', 'ver', 'poner'],
    pattern: 'hacer → hecho / ver → visto / poner → puesto',
    affectedTenses: ['part'],
    level: 'B1',
    concept: 'nonfinite_irregular',
    pedagogicalNote: 'Memoriza los participios más usados; muchos se combinan para formar tiempos compuestos.'
  }
}

// Función para obtener familias por nivel pedagógico
export function getLearningFamiliesByLevel(level) {
  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const maxIndex = levelOrder.indexOf(level)
  if (maxIndex === -1) return Object.values(LEARNING_IRREGULAR_FAMILIES)
  
  return Object.values(LEARNING_IRREGULAR_FAMILIES).filter(family => {
    const familyIndex = levelOrder.indexOf(family.level)
    return familyIndex <= maxIndex
  })
}

// Función para obtener familias por concepto
export function getLearningFamiliesByConcept(concept) {
  return Object.values(LEARNING_IRREGULAR_FAMILIES).filter(
    family => family.concept === concept
  )
}

// Función para obtener familia por ID
export function getLearningFamilyById(id) {
  return LEARNING_IRREGULAR_FAMILIES[id] || null
}

// Mapeo de verbos a familias pedagógicas REORGANIZADO
export const LEARNING_VERB_TO_FAMILIES = {
  // ========================================
  // 1) IRREGULARES EN YO (presente con -g)
  // ========================================
  'tener': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_FUT_COND_IRREGULAR'],
  'poner': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_FUT_COND_IRREGULAR', 'LEARNING_IRREG_PARTICIPLES'],
  'hacer': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_FUT_COND_IRREGULAR', 'LEARNING_IRREG_PARTICIPLES'],
  'salir': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],
  'venir': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_FUT_COND_IRREGULAR'],
  'valer': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],
  'caer': ['LEARNING_YO_G_PRESENT'],
  'traer': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_IRREG_GERUNDS'],
  'oír': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'decir': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_FUT_COND_IRREGULAR', 'LEARNING_IRREG_GERUNDS', 'LEARNING_IRREG_PARTICIPLES'],
  'seguir': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_DIPHTHONGS', 'LEARNING_IRREG_GERUNDS'],
  'conseguir': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'], 
  'perseguir': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'distinguir': ['LEARNING_YO_G_PRESENT'],
  // Verbos compuestos también tienen -g
  'obtener': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],
  'mantener': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],
  'contener': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],
  'sostener': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],
  'componer': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],
  'proponer': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],
  'disponer': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],
  'exponer': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],
  'suponer': ['LEARNING_YO_G_PRESENT', 'LEARNING_FUT_COND_IRREGULAR'],

  // ========================================
  // 2) VERBOS QUE DIPTONGAN (e→ie, o→ue, e→i)
  // ========================================
  // e→ie
  'pensar': ['LEARNING_DIPHTHONGS'],
  'cerrar': ['LEARNING_DIPHTHONGS'],
  'querer': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_FUT_COND_IRREGULAR'],
  'empezar': ['LEARNING_DIPHTHONGS'],
  'entender': ['LEARNING_DIPHTHONGS'],
  'perder': ['LEARNING_DIPHTHONGS'],
  'sentir': ['LEARNING_DIPHTHONGS', 'LEARNING_IRREG_GERUNDS'],
  'preferir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  
  // o→ue  
  'poder': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_FUT_COND_IRREGULAR', 'LEARNING_IRREG_GERUNDS'],
  'volver': ['LEARNING_DIPHTHONGS', 'LEARNING_IRREG_PARTICIPLES'],
  'contar': ['LEARNING_DIPHTHONGS'],
  'encontrar': ['LEARNING_DIPHTHONGS'],
  'recordar': ['LEARNING_DIPHTHONGS'],
  'dormir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'morir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS', 'LEARNING_IRREG_PARTICIPLES'],
  
  // e→i (verbos -ir)
  'pedir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'servir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'repetir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  
  // Más verbos e→i 
  'competir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'impedir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'medir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'reír': ['LEARNING_DIPHTHONGS'],
  'freír': ['LEARNING_DIPHTHONGS', 'LEARNING_IRREG_GERUNDS', 'LEARNING_IRREG_PARTICIPLES'],
  'sonreír': ['LEARNING_DIPHTHONGS'],
  'vestir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'elegir': ['LEARNING_DIPHTHONGS'],
  'corregir': ['LEARNING_DIPHTHONGS'],
  
  // Más verbos o→ue
  'mostrar': ['LEARNING_DIPHTHONGS'],
  'costar': ['LEARNING_DIPHTHONGS'],
  'sonar': ['LEARNING_DIPHTHONGS'],
  'volar': ['LEARNING_DIPHTHONGS'],
  
  // Más verbos e→ie
  'despertar': ['LEARNING_DIPHTHONGS'],
  'comenzar': ['LEARNING_DIPHTHONGS'],
  'sentarse': ['LEARNING_DIPHTHONGS'],
  'acostarse': ['LEARNING_DIPHTHONGS'],
  'defender': ['LEARNING_DIPHTHONGS'],
  'encender': ['LEARNING_DIPHTHONGS'],
  'mentir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  'convertir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  'divertir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  'advertir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  'referir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  'sugerir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  
  // u→ue (incluido en diptongos)
  'jugar': ['LEARNING_DIPHTHONGS'],

  // ========================================
  // 3) MUY IRREGULARES (formas completamente irregulares)
  // ========================================
  'ser': ['LEARNING_VERY_IRREGULAR', 'LEARNING_IMPF_IRREGULAR'],
  'estar': ['LEARNING_VERY_IRREGULAR', 'LEARNING_PRET_MUY_IRREGULARES'],
  'ir': ['LEARNING_VERY_IRREGULAR', 'LEARNING_IMPF_IRREGULAR', 'LEARNING_IRREG_GERUNDS'], 
  'dar': ['LEARNING_VERY_IRREGULAR'],
  'saber': ['LEARNING_VERY_IRREGULAR', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_FUT_COND_IRREGULAR'],
  'caber': ['LEARNING_VERY_IRREGULAR', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_FUT_COND_IRREGULAR'],
  'haber': ['LEARNING_VERY_IRREGULAR', 'LEARNING_PRET_MUY_IRREGULARES', 'LEARNING_FUT_COND_IRREGULAR'],

  // ========================================
  // FAMILIAS PARA OTROS TIEMPOS (mantenidas)
  // ========================================
  
  // Verbos de pretérito fuerte adicionales
  'andar': ['LEARNING_PRET_MUY_IRREGULARES'],
  'conducir': ['LEARNING_PRET_MUY_IRREGULARES'],
  'producir': ['LEARNING_PRET_MUY_IRREGULARES'],
  'traducir': ['LEARNING_PRET_MUY_IRREGULARES'],
  'reducir': ['LEARNING_PRET_MUY_IRREGULARES'],
  'introducir': ['LEARNING_PRET_MUY_IRREGULARES'],
  
  // Verbos con hiatos y otros cambios en 3ª persona
  'construir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'destruir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'instruir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'sustituir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'distribuir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'contribuir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'huir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'incluir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'concluir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'excluir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'influir': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'leer': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'creer': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'poseer': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  'proveer': ['LEARNING_PRET_3AS_PERSONAS', 'LEARNING_IRREG_GERUNDS'],
  
  // Ortográficos
  'buscar': ['LEARNING_ORTH_CAR'],
  'sacar': ['LEARNING_ORTH_CAR'],
  'tocar': ['LEARNING_ORTH_CAR'],
  'llegar': ['LEARNING_ORTH_GAR'],
  'pagar': ['LEARNING_ORTH_GAR'],
  'apagar': ['LEARNING_ORTH_GAR'],

  // Imperfecto irregular (ver se añade aquí)
  'ver': ['LEARNING_VERY_IRREGULAR', 'LEARNING_IMPF_IRREGULAR', 'LEARNING_IRREG_PARTICIPLES'],
  'escribir': ['LEARNING_IRREG_PARTICIPLES'],
  'abrir': ['LEARNING_IRREG_PARTICIPLES'],
  'cubrir': ['LEARNING_IRREG_PARTICIPLES'],
  'romper': ['LEARNING_IRREG_PARTICIPLES'],
  'resolver': ['LEARNING_IRREG_PARTICIPLES']
}

// MAPEO DE FAMILIAS ANTIGUAS A PEDAGÓGICAS REORGANIZADO
const OLD_TO_LEARNING_FAMILY_MAP = {
  // Diptongos → nueva familia unificada
  'DIPHT_E_IE': 'LEARNING_DIPHTHONGS',
  'DIPHT_O_UE': 'LEARNING_DIPHTHONGS',

  // YO irregular → nueva familia de YO con -g
  'G_VERBS': 'LEARNING_YO_G_PRESENT',

  // Muy irregulares → nueva familia para ser/estar/ir/dar
  'PRET_SUPPL': 'LEARNING_VERY_IRREGULAR', // ser, ir, estar, dar

  // Casos especiales mantenidos
  'DIPHT_U_UE': 'LEARNING_DIPHTHONGS', // jugar incluido en diptongos

  // Familias para otros tiempos (mantenidas)
  'ORTH_CAR': 'LEARNING_ORTH_CAR',
  'ORTH_GAR': 'LEARNING_ORTH_GAR',
  'PRET_UV': 'LEARNING_PRET_MUY_IRREGULARES',
  'PRET_U': 'LEARNING_PRET_MUY_IRREGULARES',
  'PRET_I': 'LEARNING_PRET_MUY_IRREGULARES',
  'PRET_J': 'LEARNING_PRET_MUY_IRREGULARES',
  // Mapear familias reales que afectan 3ª persona a LEARNING_PRET_3AS_PERSONAS
  'E_I_IR': 'LEARNING_PRET_3AS_PERSONAS',     // pedir, servir (también 3ª persona en pretérito)
  'O_U_GER_IR': 'LEARNING_PRET_3AS_PERSONAS', // dormir, morir
  'HIATUS_Y': 'LEARNING_PRET_3AS_PERSONAS',   // leer, caer, oír
  'IMPERFECT_IRREG': 'LEARNING_IMPF_IRREGULAR',
  'IRREG_CONDITIONAL': 'LEARNING_FUT_COND_IRREGULAR',
  'IRREG_GERUNDS': 'LEARNING_IRREG_GERUNDS',
  'IRREG_PARTICIPLES': 'LEARNING_IRREG_PARTICIPLES'
}

// MAPEO INVERSO: PEDAGÓGICAS A ANTIGUAS (para el generator)
const LEARNING_TO_OLD_FAMILY_MAP = {
  // Nuevas familias del presente
  'LEARNING_YO_G_PRESENT': 'G_VERBS',
  'LEARNING_DIPHTHONGS': 'DIPHT_E_IE', // Usar la más común como representante
  'LEARNING_VERY_IRREGULAR': 'PRET_SUPPL',


  // Familias para otros tiempos (mantenidas)
  'LEARNING_ORTH_CAR': 'ORTH_CAR',
  'LEARNING_ORTH_GAR': 'ORTH_GAR',
  'LEARNING_PRET_MUY_IRREGULARES': 'PRET_UV', // usar la más común como representante
  'LEARNING_PRET_3AS_PERSONAS': 'PRETERITE_THIRD_PERSON', // usar grupo simplificado
  'LEARNING_IMPF_IRREGULAR': 'IMPERFECT_IRREG',
  'LEARNING_FUT_COND_IRREGULAR': 'IRREG_CONDITIONAL',
  'LEARNING_IRREG_GERUNDS': 'IRREG_GERUNDS',
  'LEARNING_IRREG_PARTICIPLES': 'IRREG_PARTICIPLES'
}

// Función para categorizar un verbo usando el sistema pedagógico
export function categorizeLearningVerb(lemma, verbData) {
  // CRÍTICO: Usar el sistema original para obtener TODAS las familias
  const originalFamilies = categorizeVerb(lemma, verbData)
  
  // Mapear a familias pedagógicas
  const learningFamilies = []
  originalFamilies.forEach(oldFamily => {
    const newFamily = OLD_TO_LEARNING_FAMILY_MAP[oldFamily]
    if (newFamily && !learningFamilies.includes(newFamily)) {
      learningFamilies.push(newFamily)
    }
  })
  
  return learningFamilies
}

// Función para convertir familia pedagógica a antigua (para el generator)
export function convertLearningFamilyToOld(learningFamilyId) {
  const result = LEARNING_TO_OLD_FAMILY_MAP[learningFamilyId] || null

  // Si el resultado es un grupo simplificado (como 'PRETERITE_THIRD_PERSON'),
  // retornarlo tal como está - el generator ya sabe cómo expandirlo
  if (result && result.startsWith('PRETERITE_') || result && result.startsWith('STEM_') || result && result.startsWith('FIRST_PERSON_')) {
    return result // Grupo simplificado - será expandido por el generator
  }

  return result // Familia individual normal
}

// Función para obtener familias para un tiempo específico
export function getLearningFamiliesForTense(tense) {
  // Obtener familias originales para el tiempo
  const originalFamilies = getFamiliesForTense(tense)
  
  // Mapear a familias pedagógicas
  const learningFamilies = []
  originalFamilies.forEach(originalFamily => {
    const learningFamilyId = OLD_TO_LEARNING_FAMILY_MAP[originalFamily.id]
    if (learningFamilyId && LEARNING_IRREGULAR_FAMILIES[learningFamilyId]) {
      const learningFamily = LEARNING_IRREGULAR_FAMILIES[learningFamilyId]
      if (!learningFamilies.find(f => f.id === learningFamily.id)) {
        learningFamilies.push(learningFamily)
      }
    }
  })
  
  return learningFamilies
}
