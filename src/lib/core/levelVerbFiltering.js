// Sistema de filtrado de verbos por nivel MCER
// Algunos verbos irregulares solo aparecen en niveles avanzados

// ===== SISTEMA COMPLETO DE FILTRADO POR NIVEL =====

// Verbos que SOLO pueden aparecer en niveles A1-A2 (muy básicos)
export const A1_A2_ONLY_VERBS = [
  // Verbos súper básicos A1 (regulares e irregulares esenciales)
  'ser', 'estar', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber', 'querer',
  'poder', 'venir', 'poner', 'salir', 'hablar', 'comer', 'vivir', 'trabajar',
  'estudiar', 'llamar', 'llevar', 'encontrar', 'llegar', 'pasar',
  'quedar', 'deber', 'seguir', 'preguntar',
  
  // IRREGULARES BÁSICOS A1 que estaban mal clasificados como B1
  'pensar',    // e→ie - "¿Qué piensas?" es súper básico
  'cerrar',    // e→ie - cerrar la puerta/ventana, esencial
  'empezar',   // e→ie - empezar clase/trabajo, muy común
  'comenzar',  // e→ie - sinónimo de empezar
  'despertar', // e→ie - rutina diaria básica
  'volver',    // o→ue - volver a casa, muy básico
  'contar',    // o→ue - contar números, fundamental A1
  'mostrar',   // o→ue - mostrar/enseñar, básico
  'dormir',    // o→ue→u - rutina diaria esencial
  'jugar',     // u→ue - actividad básica, único u→ue común
  'conocer',   // -zco - conocer personas, súper básico
  
  // Verbos básicos regulares que FALTABAN 
  'escuchar', 'caminar', 'leer', 'escribir', 'beber', 'abrir', 'mirar', 
  'comprar', 'vender', 'aprender', 'enseñar', 'ayudar', 'usar', 'subir',
  'bajar', 'entrar', 'esperar', 'ganar', 'perder', 'cantar',
  'bailar', 'cocinar', 'limpiar', 'lavar', 'correr', 'nadar', 'manejar', 'viajar',
  'descansar', 'levantar', 'sentar', 'acostar', 'ducharse', 'vestirse',
  
  // Verbos de emociones y estados básicos A1  
  'gustar', 'amar', 'odiar', 'necesitar', 'desear', 'preferir', 'sentir',
  
  // Verbos de comunicación básica A1
  'entender', 'repetir', 'explicar', 'contestar', 'responder',
  
  // Verbos de ubicación y movimiento A1
  'buscar', 'tocar', 'tomar', 'dejar', 'traer', 'tirar', 'empujar'
]

// Verbos irregulares que pueden aparecer desde B1 (intermedios)
export const B1_ALLOWED_IRREGULAR_VERBS = [
  // Diptongación o→ue menos común
  'morir', 'recordar', 'soñar', 'almorzar', 'costar', 'probar', 'encontrar',
  'volar', 'sonar', 'llorar', 'rogar',
  
  // e→i comunes (más complejos que A1)
  'pedir', 'servir', 'repetir', 'seguir', 'sentir', 'preferir', 'mentir',
  'competir', 'impedir', 'medir', 'vestir',
  
  // -zco más complejos que "conocer"
  'parecer', 'crecer', 'nacer', 'establecer', 'ofrecer', 'agradecer',
  'merecer', 'pertenecer', 'reconocer', 'desconocer',
  
  // Cambios ortográficos básicos
  'coger', 'proteger', 'elegir', 'dirigir', 'corregir', 'recoger'
]

// Verbos irregulares raros que SOLO aparecen en B2+ (avanzados)
export const B2_PLUS_ONLY_VERBS = [
  // Verbos ZO (consonante + cer → -zo)
  'vencer', 'ejercer', 'torcer', 'cocer', 'mecer', 'retorcer', 'convencer',
  
  // Diptongación u→ue raros (excepto jugar)
  'amuar', 'desaguar', 'menguar', 'fraguar', 'atestiguar', 'apaciguar',
  
  // Verbos -ir con cambios complicados
  'adormir', 'adormecerse', 'redormir', 'competir', 'concebir', 'impedir',
  
  // -guir/-gir raros
  'distinguir', 'extinguir', 'conseguir', 'perseguir', 'proseguir', 'subsidir',
  
  // Hiatos y construcciones raras
  'poseer', 'proveer', 'releer', 'sobreleer', 'instruir', 'reconstruir', 
  'construir', 'sustituir', 'atribuir', 'contribuir', 'retribuir', 'distribuir',
  'excluir', 'incluir', 'concluir', 'diluir', 'huir', 'rehuir', 'argüir',
  
  // O→U raros
  'podrir', 'gruñir', 'engullir', 'bullir', 'zambullir', 'escabullir',
  
  // Verbos defectivos y muy raros
  'soler', 'prever', 'entrever', 'antever', 'yacer', 'raer', 'roer'
]

// Verbos que SOLO aparecen en C1+ (muy avanzados)
export const C1_PLUS_ONLY_VERBS = [
  // Verbos extremadamente raros o arcaicos
  'asir', 'balbucir', 'desvaír', 'garrir', 'aterir', 'concernir', 'discernir',
  'uncir', 'zurcir', 'hembrear', 'desleír', 'reír', 'sonreír', 'freír', 'sofreír',
  
  // Defectivos muy específicos
  'blandir', 'embair', 'empedernir', 'garantir', 'preterir', 'transgredir',
  'aborrir', 'colorir', 'descolorir', 
  
  // Variantes muy específicas
  'placer', 'complacer', 'desplacer', 'yacir'
]

// ===== FUNCIONES DE CLASIFICACIÓN POR NIVEL =====

// Función para determinar el nivel mínimo requerido para un verbo
export function getMinimumLevelForVerb(lemma) {
  if (A1_A2_ONLY_VERBS.includes(lemma)) return 'A1'
  if (B1_ALLOWED_IRREGULAR_VERBS.includes(lemma)) return 'B1' 
  if (B2_PLUS_ONLY_VERBS.includes(lemma)) return 'B2'
  if (C1_PLUS_ONLY_VERBS.includes(lemma)) return 'C1'
  
  // Verbos no clasificados - por defecto permitidos desde B1
  return 'B1'
}

// ===== SISTEMA DE PRIORIZACIÓN PARA PRÁCTICA POR TEMA =====

// Función para obtener la prioridad de un verbo (menor número = mayor prioridad)
export function getVerbPriority(lemma) {
  if (A1_A2_ONLY_VERBS.includes(lemma)) return 1 // Máxima prioridad - verbos básicos
  if (B1_ALLOWED_IRREGULAR_VERBS.includes(lemma)) return 2 // Alta prioridad - irregulares comunes
  if (B2_PLUS_ONLY_VERBS.includes(lemma)) return 3 // Baja prioridad - irregulares avanzados
  if (C1_PLUS_ONLY_VERBS.includes(lemma)) return 4 // Mínima prioridad - verbos muy raros
  
  // Verbos no clasificados - prioridad media-alta (como B1)
  return 2
}

// Función para obtener el peso de selección de un verbo basado en su prioridad
export function getVerbSelectionWeight(lemma, userLevel) {
  const priority = getVerbPriority(lemma)
  const levelOrder = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6, 'ALL': 7 }
  const userLevelNum = levelOrder[userLevel] || 3
  
  // Pesos base por prioridad
  const baseWeights = {
    1: 10, // A1/A2 verbos - peso máximo
    2: 8,  // B1 irregulares comunes - peso alto  
    3: 3,  // B2+ irregulares avanzados - peso bajo
    4: 1   // C1+ verbos raros - peso mínimo
  }
  
  let weight = baseWeights[priority] || 5
  
  // Boost adicional para verbos del nivel actual o inferior
  const verbLevel = getMinimumLevelForVerb(lemma)
  const verbLevelNum = levelOrder[verbLevel] || 3
  
  // Si el verbo es exactamente del nivel del usuario, darle boost extra
  if (verbLevelNum === userLevelNum) {
    weight *= 1.5
  }
  // Si el verbo es de nivel inferior, darle boost moderado
  else if (verbLevelNum < userLevelNum) {
    weight *= 1.2
  }
  
  return Math.round(weight * 10) // Multiplicar por 10 para tener enteros más grandes
}

// Función para verificar si un verbo es de alta prioridad (A1/A2 o B1)
export function isHighPriorityVerb(lemma) {
  const priority = getVerbPriority(lemma)
  return priority <= 2 // Prioridades 1 (A1/A2) y 2 (B1)
}

// Función para determinar si un verbo está permitido en un nivel específico
export function isVerbAllowedForLevel(lemma, userLevel) {
  const requiredLevel = getMinimumLevelForVerb(lemma)
  const levelOrder = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6, 'ALL': 7 }
  
  const userLevelNum = levelOrder[userLevel] || 3 // Default B1
  const requiredLevelNum = levelOrder[requiredLevel] || 3
  
  return userLevelNum >= requiredLevelNum
}

// Función principal para determinar si un verbo debería filtrarse por nivel
export function shouldFilterVerbByLevel(lemma, verbFamilies, userLevel, _tense) {
  // Si el verbo no está permitido para este nivel, debe filtrarse
  if (!isVerbAllowedForLevel(lemma, userLevel)) {
    return true // Filtrar (excluir) este verbo
  }
  
  return false // No filtrar, permitir el verbo
}

// Funciones legacy para compatibilidad (mantener por ahora)
export function isZOVerb(lemma) {
  return B2_PLUS_ONLY_VERBS.includes(lemma) && 
         ['vencer', 'ejercer', 'torcer', 'cocer', 'mecer', 'retorcer', 'convencer'].includes(lemma)
}

export function isAdvancedThirdPersonVerb(lemma) {
  return B2_PLUS_ONLY_VERBS.includes(lemma) &&
         ['poseer', 'proveer', 'releer', 'instruir', 'reconstruir', 'sustituir', 
          'atribuir', 'excluir', 'podrir', 'gruñir'].includes(lemma)
}

// Función para obtener la razón del filtrado (para debugging)
export function getFilterReason(lemma, verbFamilies, userLevel, tense) {
  if (shouldFilterVerbByLevel(lemma, verbFamilies, userLevel, tense)) {
    const requiredLevel = getMinimumLevelForVerb(lemma)
    return `Verbo "${lemma}" filtrado para nivel ${userLevel} (requiere ${requiredLevel}+)`
  }
  return null
}

// ===== FUNCIONES DE UTILIDAD Y ESTADÍSTICAS =====

// Lista de niveles avanzados que pueden ver todos los verbos
export const ADVANCED_LEVELS = ['B2', 'C1', 'C2', 'ALL']

// Función para verificar si un nivel es avanzado
export function isAdvancedLevel(level) {
  return ADVANCED_LEVELS.includes(level)
}

// Función para obtener verbos permitidos por nivel
export function getVerbsAllowedForLevel(level) {
  const levelOrder = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6, 'ALL': 7 }
  const userLevelNum = levelOrder[level] || 3
  
  let allowedVerbs = []
  
  if (userLevelNum >= 1) allowedVerbs.push(...A1_A2_ONLY_VERBS)
  if (userLevelNum >= 3) allowedVerbs.push(...B1_ALLOWED_IRREGULAR_VERBS)
  if (userLevelNum >= 4) allowedVerbs.push(...B2_PLUS_ONLY_VERBS)  
  if (userLevelNum >= 5) allowedVerbs.push(...C1_PLUS_ONLY_VERBS)
  
  return [...new Set(allowedVerbs)] // Remover duplicados
}

// Función para obtener verbos filtrados (no permitidos) por nivel
export function getVerbsFilteredForLevel(level) {
  const allVerbs = [
    ...A1_A2_ONLY_VERBS,
    ...B1_ALLOWED_IRREGULAR_VERBS, 
    ...B2_PLUS_ONLY_VERBS,
    ...C1_PLUS_ONLY_VERBS
  ]
  const allowedVerbs = getVerbsAllowedForLevel(level)
  
  return allVerbs.filter(verb => !allowedVerbs.includes(verb))
}

// Estadísticas completas de filtrado para debugging
export function getFilteringStats(level) {
  const allowed = getVerbsAllowedForLevel(level)
  const filtered = getVerbsFilteredForLevel(level)
  
  const a1a2Available = A1_A2_ONLY_VERBS.filter(v => allowed.includes(v)).length
  const b1Available = B1_ALLOWED_IRREGULAR_VERBS.filter(v => allowed.includes(v)).length
  const b2Available = B2_PLUS_ONLY_VERBS.filter(v => allowed.includes(v)).length
  const c1Available = C1_PLUS_ONLY_VERBS.filter(v => allowed.includes(v)).length
  
  return {
    level,
    totalVerbsClassified: A1_A2_ONLY_VERBS.length + B1_ALLOWED_IRREGULAR_VERBS.length + B2_PLUS_ONLY_VERBS.length + C1_PLUS_ONLY_VERBS.length,
    allowedVerbs: {
      total: allowed.length,
      a1a2: a1a2Available,
      b1: b1Available, 
      b2: b2Available,
      c1: c1Available
    },
    filteredVerbs: {
      total: filtered.length,
      examples: filtered.slice(0, 10)
    },
    isAdvanced: isAdvancedLevel(level),
    filteringActive: filtered.length > 0
  }
}

// Función de debugging para mostrar estadísticas en consola
export function debugVerbFilteringForLevel(level) {
  const stats = getFilteringStats(level)
  
  console.group(` VERB FILTERING STATS - Nivel ${level}`)
  console.log(' Total verbos clasificados:', stats.totalVerbsClassified)
  console.log('✅ Verbos permitidos:', stats.allowedVerbs.total)
  console.log('  - A1/A2:', stats.allowedVerbs.a1a2)
  console.log('  - B1:', stats.allowedVerbs.b1) 
  console.log('  - B2:', stats.allowedVerbs.b2)
  console.log('  - C1+:', stats.allowedVerbs.c1)
  console.log(' Verbos filtrados:', stats.filteredVerbs.total)
  if (stats.filteredVerbs.examples.length > 0) {
    console.log('  Ejemplos:', stats.filteredVerbs.examples.join(', '))
  }
  console.log('️ Filtrado activo:', stats.filteringActive)
  console.groupEnd()
  
  return stats
}