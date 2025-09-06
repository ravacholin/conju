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
    description: 'Verbos muy frecuentes que añaden -g en la primera persona: tengo, pongo, hago, salgo',
    paradigmatic: 'tener',
    examples: ['tener', 'poner', 'hacer', 'salir', 'venir', 'valer', 'caer'], // Verbos más frecuentes con -g
    pattern: 'tener: tengo, tienes, tiene, tenemos, tenéis, tienen (solo YO cambia)',
    affectedTenses: ['pres', 'subjPres'],
    level: 'A2',
    concept: 'yo_irregular_g',
    pedagogicalNote: 'La irregularidad en YO se extiende a todo el subjuntivo. Patrón muy productivo.'
  },

  // 2) VERBOS QUE DIPTONGAN (cambios vocálicos sistemáticos)
  'LEARNING_DIPHTHONGS': {
    id: 'LEARNING_DIPHTHONGS',
    name: 'Verbos que diptongan',
    description: 'Cambios vocálicos sistemáticos: o→ue (poder), e→ie (querer), e→i (pedir), u→ue (jugar)',
    paradigmatic: 'poder',
    examples: ['poder', 'querer', 'pedir', 'jugar', 'volver', 'pensar', 'servir'], // Incluir jugar con los diptongos
    pattern: 'poder: puedo, puedes, puede, podemos, podéis, pueden (nosotros/vosotros no diptongan)',
    affectedTenses: ['pres', 'subjPres'],
    level: 'A2',
    concept: 'diphthongs_all',
    pedagogicalNote: 'Cuatro tipos: o→ue (poder), e→ie (querer), e→i (pedir), u→ue (jugar). Solo en sílabas tónicas (acentuadas).'
  },

  // 3) MUY IRREGULARES (casos especiales frecuentes)
  'LEARNING_VERY_IRREGULAR': {
    id: 'LEARNING_VERY_IRREGULAR',
    name: 'Muy irregulares',
    description: 'Verbos súper frecuentes con formas completamente irregulares: ser, estar, ir, dar',
    paradigmatic: 'ser',
    examples: ['ser', 'estar', 'ir', 'dar'], // Los 4 más útiles y frecuentes
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
    examples: ['buscar', 'sacar'],
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
    examples: ['llegar', 'pagar'],
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
    examples: ['estar', 'querer', 'hacer', 'tener', 'poder', 'poner', 'venir'], // Pretéritos fuertes principales
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
    examples: ['pedir', 'preferir', 'dormir', 'leer', 'servir', 'morir', 'oír'], // Ejemplos de cada cambio
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
    pattern: 'ser: era, eras, era / ir: iba, ibas, iba / ver: veía, veías, veía',
    affectedTenses: ['impf'],
    level: 'A2',
    concept: 'imperfect_irregular',
    pedagogicalNote: 'Solo 3 verbos irregulares en imperfecto. Memorizar las formas completas.'
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
  'tener': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_MUY_IRREGULARES'],
  'poner': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_MUY_IRREGULARES'],
  'hacer': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_MUY_IRREGULARES'],
  'salir': ['LEARNING_YO_G_PRESENT'],
  'venir': ['LEARNING_YO_G_PRESENT', 'LEARNING_PRET_MUY_IRREGULARES'],
  'valer': ['LEARNING_YO_G_PRESENT'],
  'caer': ['LEARNING_YO_G_PRESENT'],
  // Verbos compuestos también tienen -g
  'obtener': ['LEARNING_YO_G_PRESENT'],
  'mantener': ['LEARNING_YO_G_PRESENT'],
  'contener': ['LEARNING_YO_G_PRESENT'],
  'sostener': ['LEARNING_YO_G_PRESENT'],
  'componer': ['LEARNING_YO_G_PRESENT'],
  'proponer': ['LEARNING_YO_G_PRESENT'],
  'disponer': ['LEARNING_YO_G_PRESENT'],
  'exponer': ['LEARNING_YO_G_PRESENT'],
  'suponer': ['LEARNING_YO_G_PRESENT'],

  // ========================================
  // 2) VERBOS QUE DIPTONGAN (e→ie, o→ue, e→i)
  // ========================================
  // e→ie
  'pensar': ['LEARNING_DIPHTHONGS'],
  'cerrar': ['LEARNING_DIPHTHONGS'],
  'querer': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_MUY_IRREGULARES'],
  'empezar': ['LEARNING_DIPHTHONGS'],
  'entender': ['LEARNING_DIPHTHONGS'],
  'perder': ['LEARNING_DIPHTHONGS'],
  'sentir': ['LEARNING_DIPHTHONGS'],
  'preferir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  
  // o→ue  
  'poder': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_MUY_IRREGULARES'],
  'volver': ['LEARNING_DIPHTHONGS'],
  'contar': ['LEARNING_DIPHTHONGS'],
  'encontrar': ['LEARNING_DIPHTHONGS'],
  'recordar': ['LEARNING_DIPHTHONGS'],
  'dormir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  'morir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  
  // e→i (verbos -ir)
  'pedir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  'servir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  'repetir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  'seguir': ['LEARNING_DIPHTHONGS', 'LEARNING_PRET_3AS_PERSONAS'],
  
  // u→ue (incluido en diptongos)
  'jugar': ['LEARNING_DIPHTHONGS'],

  // ========================================
  // 3) MUY IRREGULARES (formas completamente irregulares)
  // ========================================
  'ser': ['LEARNING_VERY_IRREGULAR', 'LEARNING_IMPF_IRREGULAR'],
  'estar': ['LEARNING_VERY_IRREGULAR', 'LEARNING_PRET_MUY_IRREGULARES'],
  'ir': ['LEARNING_VERY_IRREGULAR', 'LEARNING_IMPF_IRREGULAR'], 
  'dar': ['LEARNING_VERY_IRREGULAR'],

  // ========================================
  // FAMILIAS PARA OTROS TIEMPOS (mantenidas)
  // ========================================
  
  // Verbos con hiatos (solo pretérito)
  'leer': ['LEARNING_PRET_3AS_PERSONAS'],
  'oír': ['LEARNING_PRET_3AS_PERSONAS'],
  
  // Ortográficos
  'buscar': ['LEARNING_ORTH_CAR'],
  'sacar': ['LEARNING_ORTH_CAR'],
  'llegar': ['LEARNING_ORTH_GAR'],
  'pagar': ['LEARNING_ORTH_GAR'],

  // Imperfecto irregular (ver se añade aquí)
  'ver': ['LEARNING_IMPF_IRREGULAR']
}

// MAPEO DE FAMILIAS ANTIGUAS A PEDAGÓGICAS REORGANIZADO
const OLD_TO_LEARNING_FAMILY_MAP = {
  // Diptongos → nueva familia unificada
  'DIPHT_E_IE': 'LEARNING_DIPHTHONGS',
  'DIPHT_O_UE': 'LEARNING_DIPHTHONGS',
  'E_I_IR': 'LEARNING_DIPHTHONGS',
  
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
  'E_I_PRET': 'LEARNING_PRET_3AS_PERSONAS',
  'O_U_PRET': 'LEARNING_PRET_3AS_PERSONAS',
  'HIATUS_Y': 'LEARNING_PRET_3AS_PERSONAS',
  'IMPERFECT_IRREG': 'LEARNING_IMPF_IRREGULAR'
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
  'LEARNING_PRET_3AS_PERSONAS': 'E_I_PRET', // usar la más común como representante
  'LEARNING_IMPF_IRREGULAR': 'IMPERFECT_IRREG'
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
  return LEARNING_TO_OLD_FAMILY_MAP[learningFamilyId] || null
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