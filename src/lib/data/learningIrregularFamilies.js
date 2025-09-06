// Sistema pedagógico de familias irregulares EXCLUSIVO para el learning module
// Diseñado para ser claro, progresivo y sin mezclar conceptos

// Import del sistema original para mapear familias existentes
import { categorizeVerb, getFamiliesForTense } from './irregularFamilies.js'

export const LEARNING_IRREGULAR_FAMILIES = {
  // ========================================
  // NIVEL 1: CAMBIOS VOCÁLICOS FUNDAMENTALES
  // Solo verbos MUY frecuentes, UNA irregularidad, patrones claros
  // ========================================
  
  'LEARNING_E_IE': {
    id: 'LEARNING_E_IE',
    name: 'Diptongo e → ie',
    description: 'La vocal e se convierte en ie cuando lleva el acento',
    paradigmatic: 'pensar',
    examples: ['pensar', 'cerrar', 'querer'], // Solo 3 súper frecuentes, sin mezclas
    pattern: 'pensar: pienso, piensas, piensa (nosotros pensamos)',
    affectedTenses: ['pres', 'subjPres'],
    level: 'A2',
    concept: 'diphthong',
    pedagogicalNote: 'Solo en formas tónicas. Verbos súper frecuentes con patrón claro.'
  },

  'LEARNING_O_UE': {
    id: 'LEARNING_O_UE', 
    name: 'Diptongo o → ue',
    description: 'La vocal o se convierte en ue cuando lleva el acento',
    paradigmatic: 'poder',
    examples: ['poder', 'volver', 'contar'], // Solo 3 súper frecuentes, limpios
    pattern: 'poder: puedo, puedes, puede (nosotros podemos)',
    affectedTenses: ['pres', 'subjPres'],
    level: 'A2',
    concept: 'diphthong',
    pedagogicalNote: 'Solo en formas tónicas. Patrón idéntico a e→ie.'
  },

  'LEARNING_E_I': {
    id: 'LEARNING_E_I',
    name: 'Cambio e → i (verbos -ir)',
    description: 'La vocal e se convierte en i en verbos -ir',
    paradigmatic: 'pedir',
    examples: ['pedir', 'servir'], // Solo 2 súper frecuentes y limpios
    pattern: 'pedir: pido, pides, pide (también gerundio: pidiendo)',
    affectedTenses: ['pres', 'subjPres', 'pretIndef', 'ger'],
    level: 'A2', // Más temprano porque son verbos esenciales
    concept: 'vowel_change',
    pedagogicalNote: 'Más extenso que diptongos. Solo verbos -ir muy frecuentes.'
  },

  // ========================================
  // NIVEL 2: PRIMERA PERSONA IRREGULAR  
  // Solo los MÁS frecuentes y pedagógicamente claros
  // ========================================

  'LEARNING_YO_G': {
    id: 'LEARNING_YO_G',
    name: 'YO irregular: añade -g',
    description: 'Verbos súper frecuentes que añaden -g en YO',
    paradigmatic: 'tener',
    examples: ['tener', 'poner'], // Solo 2 súper esenciales, sin confusión
    pattern: 'tener: tengo (pero tienes, tiene) + subjuntivo: tenga',
    affectedTenses: ['pres', 'subjPres'],
    level: 'A2', 
    concept: 'yo_irregular',
    pedagogicalNote: 'Solo verbos esenciales. YO irregular = subjuntivo irregular.'
  },

  'LEARNING_YO_ZCO': {
    id: 'LEARNING_YO_ZCO',
    name: 'YO irregular: añade -zco',
    description: 'Verbos frecuentes vocal + cer que añaden -zco',
    paradigmatic: 'conocer',
    examples: ['conocer'], // Solo 1 súper claro y frecuente
    pattern: 'conocer: conozco (pero conoces, conoce) + subjuntivo: conozca',
    affectedTenses: ['pres', 'subjPres'],
    level: 'A2', // Más temprano - conocer es esencial
    concept: 'yo_irregular',
    pedagogicalNote: 'Vocal + cer = -zco. Solo el más frecuente para aprender el patrón.'
  },

  // ========================================
  // NIVEL 3: CAMBIOS ORTOGRÁFICOS (solo esenciales)
  // Solo verbos súper frecuentes para aprender la regla básica
  // ========================================

  'LEARNING_ORTH_CAR': {
    id: 'LEARNING_ORTH_CAR',
    name: 'Ortográfico: -car → -qu',
    description: 'Verbos -car súper frecuentes: c → qu delante de e',
    paradigmatic: 'buscar',
    examples: ['buscar', 'sacar'], // Solo 2 súper frecuentes
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
    examples: ['llegar', 'pagar'], // Solo 2 súper frecuentes, SIN jugar (es excepción)
    pattern: 'llegar: llegué, llegue (conservar sonido /g/)',
    affectedTenses: ['pretIndef', 'subjPres'],
    level: 'A2',
    concept: 'orthographic',
    pedagogicalNote: 'Solo verbos esenciales. Jugar se enseña aparte por ser único u→ue.'
  },

  // ========================================
  // NIVEL 4: PRETÉRITOS FUERTES (solo esenciales)
  // Solo los MÁS frecuentes para aprender el concepto
  // ========================================

  'LEARNING_PRET_FUERTE': {
    id: 'LEARNING_PRET_FUERTE',
    name: 'Pretéritos fuertes básicos',
    description: 'Solo los pretéritos fuertes más esenciales',
    paradigmatic: 'tener',
    examples: ['tener', 'estar'], // Solo 2 súper esenciales para aprender el patrón
    pattern: 'tener: tuve, tuviste, tuvo (sin acentos en 1ª y 3ª)',
    affectedTenses: ['pretIndef', 'subjImpf'],
    level: 'B1', // Más temprano - son verbos esenciales
    concept: 'strong_preterite',
    pedagogicalNote: 'Solo los más frecuentes para entender que existe el patrón.'
  },

  // ========================================
  // NIVEL 5: CASOS ÚNICOS (memorización)
  // ========================================

  'LEARNING_SER_IR': {
    id: 'LEARNING_SER_IR',
    name: 'Casos únicos (ser/ir)', 
    description: 'Verbos que hay que memorizar completos',
    paradigmatic: 'ser',
    examples: ['ser', 'ir'],
    pattern: 'ser: soy, eres, es / era, eras, era / fui, fuiste, fue',
    affectedTenses: ['pres', 'pretIndef', 'impf', 'subjPres'],
    level: 'A1', // Temprano porque son súper frecuentes
    concept: 'memorization',
    pedagogicalNote: 'No hay patrón - memorizar completo. Súper frecuentes.'
  },

  'LEARNING_JUGAR_UNICO': {
    id: 'LEARNING_JUGAR_UNICO',
    name: 'Caso único (jugar u→ue)',
    description: 'El único verbo u→ue en español',
    paradigmatic: 'jugar',
    examples: ['jugar'],
    pattern: 'jugar: juego, juegas, juega (único verbo con este cambio)',
    affectedTenses: ['pres', 'subjPres'],
    level: 'A2',
    concept: 'unique_case',
    pedagogicalNote: 'Excepción única. Enseñar separado de diptongos normales.'
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

// Mapeo de verbos a familias pedagógicas (solo casos paradigmáticos súper frecuentes)
export const LEARNING_VERB_TO_FAMILIES = {
  // Diptongos e→ie (solo 3 súper frecuentes)
  'pensar': ['LEARNING_E_IE'],
  'cerrar': ['LEARNING_E_IE'], 
  'querer': ['LEARNING_E_IE'],

  // Diptongos o→ue (solo 3 súper frecuentes)
  'poder': ['LEARNING_O_UE'],
  'volver': ['LEARNING_O_UE'],
  'contar': ['LEARNING_O_UE'],

  // Único u→ue (solo jugar - caso especial)
  'jugar': ['LEARNING_JUGAR_UNICO'],

  // Cambio e→i (solo 2 súper frecuentes)
  'pedir': ['LEARNING_E_I'],
  'servir': ['LEARNING_E_I'],

  // YO añade -g (solo 2 súper esenciales)
  'tener': ['LEARNING_YO_G', 'LEARNING_PRET_FUERTE'],
  'poner': ['LEARNING_YO_G', 'LEARNING_PRET_FUERTE'],

  // YO añade -zco (solo 1 súper claro)
  'conocer': ['LEARNING_YO_ZCO'],

  // Ortográficos -car (solo 2 súper frecuentes)
  'buscar': ['LEARNING_ORTH_CAR'],
  'sacar': ['LEARNING_ORTH_CAR'],

  // Ortográficos -gar (solo 2 súper frecuentes)
  'llegar': ['LEARNING_ORTH_GAR'],
  'pagar': ['LEARNING_ORTH_GAR'],

  // Pretéritos fuertes (solo 2 súper esenciales para aprender el patrón)
  'tener': ['LEARNING_YO_G', 'LEARNING_PRET_FUERTE'], // Ya incluido arriba
  'estar': ['LEARNING_PRET_FUERTE'],

  // Casos especiales (memorización completa)
  'ser': ['LEARNING_SER_IR'],
  'ir': ['LEARNING_SER_IR']
}

// MAPEO DE FAMILIAS ANTIGUAS A PEDAGÓGICAS (solo familias que usamos)
const OLD_TO_LEARNING_FAMILY_MAP = {
  'DIPHT_E_IE': 'LEARNING_E_IE',
  'DIPHT_O_UE': 'LEARNING_O_UE', 
  'DIPHT_U_UE': 'LEARNING_JUGAR_UNICO',
  'E_I_IR': 'LEARNING_E_I',
  'G_VERBS': 'LEARNING_YO_G',
  'ZCO_VERBS': 'LEARNING_YO_ZCO',
  'ORTH_CAR': 'LEARNING_ORTH_CAR',
  'ORTH_GAR': 'LEARNING_ORTH_GAR',
  'PRET_UV': 'LEARNING_PRET_FUERTE',
  'PRET_U': 'LEARNING_PRET_FUERTE',
  'PRET_I': 'LEARNING_PRET_FUERTE',
  'PRET_J': 'LEARNING_PRET_FUERTE',
  'PRET_SUPPL': 'LEARNING_SER_IR'
  // Eliminadas: ZO_VERBS, ORTH_ZAR (no tienen verbos pedagógicamente útiles)
}

// MAPEO INVERSO: PEDAGÓGICAS A ANTIGUAS (para el generator)
const LEARNING_TO_OLD_FAMILY_MAP = {
  'LEARNING_E_IE': 'DIPHT_E_IE',
  'LEARNING_O_UE': 'DIPHT_O_UE',
  'LEARNING_JUGAR_UNICO': 'DIPHT_U_UE',
  'LEARNING_E_I': 'E_I_IR',
  'LEARNING_YO_G': 'G_VERBS',
  'LEARNING_YO_ZCO': 'ZCO_VERBS',
  'LEARNING_ORTH_CAR': 'ORTH_CAR',
  'LEARNING_ORTH_GAR': 'ORTH_GAR',
  'LEARNING_PRET_FUERTE': 'PRET_UV', // Usar la primera para el generator
  'LEARNING_SER_IR': 'PRET_SUPPL'
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