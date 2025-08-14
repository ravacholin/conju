// Sistema de filtrado de verbos por nivel MCER
// Algunos verbos irregulares solo aparecen en niveles avanzados

// Verbos ZO (consonante + cer → -zo) que solo aparecen en B2+
export const ZO_VERBS_LIST = [
  'vencer',     // venzo
  'ejercer',    // ejerzo  
  'torcer',     // tuerzo
  'cocer',      // cuezo
  'mecer',      // mezo
  'retorcer',   // retuerzo
  'convencer',  // convenzo
]

// Verbos irregulares de 3ª persona menos comunes (B2+)
export const ADVANCED_THIRD_PERSON_VERBS = [
  // Hiatos menos comunes
  'poseer',       // poseyó, poseyeron
  'proveer',      // proveyó, proveyeron
  'releer',       // releyó, releyeron
  'instruir',     // instruyó, instruyeron
  'reconstruir',  // reconstruyó, reconstruyeron
  'sustituir',    // sustituyó, sustituyeron
  'atribuir',     // atribuyó, atribuyeron
  'excluir',      // excluyó, excluyeron
  // O→U menos comunes
  'podrir',       // pudrió, pudrieron (solo en B2+)
  'gruñir',       // gruñó, gruñeron (muy poco frecuente)
]

// Función para determinar si un verbo es ZO_VERBS (consonante + cer → -zo)
export function isZOVerb(lemma) {
  return ZO_VERBS_LIST.includes(lemma)
}

// Función para determinar si un verbo es de terceras personas avanzado
export function isAdvancedThirdPersonVerb(lemma) {
  return ADVANCED_THIRD_PERSON_VERBS.includes(lemma)
}

// Función para determinar si un verbo debería filtrarse por nivel
export function shouldFilterVerbByLevel(lemma, verbFamilies, userLevel, tense) {
  const basicLevels = ['A1', 'A2', 'B1']
  
  // Filtrado para presente indicativo y subjuntivo
  if (['pres', 'subjPres', 'impAff', 'impNeg'].includes(tense)) {
    // Filtrar verbos ZO_VERBS para niveles básicos (temporalmente comentado)
    // if (isZOVerb(lemma) && verbFamilies.includes('ZO_VERBS')) {
    //   return basicLevels.includes(userLevel)
    // }
  }
  
  // Filtrado para pretérito indefinido (verbos de 3ª persona avanzados)
  if (['pretIndef', 'subjImpf'].includes(tense)) {
    // Filtrar verbos de terceras personas menos comunes
    if (isAdvancedThirdPersonVerb(lemma)) {
      const hasThirdPersonFamily = verbFamilies.some(family => 
        ['HIATUS_Y', 'O_U_GER_IR'].includes(family)
      )
      if (hasThirdPersonFamily) {
        return basicLevels.includes(userLevel)
      }
    }
  }
  
  return false // No filtrar por defecto
}

// Función para obtener la razón del filtrado (para debugging)
export function getFilterReason(lemma, verbFamilies, userLevel, tense) {
  if (shouldFilterVerbByLevel(lemma, verbFamilies, userLevel, tense)) {
    // if (isZOVerb(lemma)) {
    //   return `Verbo ZO_VERBS "${lemma}" filtrado para nivel ${userLevel} (solo B2+)`
    // }
    if (isAdvancedThirdPersonVerb(lemma)) {
      return `Verbo de 3ª persona avanzado "${lemma}" filtrado para nivel ${userLevel} (solo B2+)`
    }
  }
  return null
}

// Lista de niveles avanzados que pueden ver todos los verbos
export const ADVANCED_LEVELS = ['B2', 'C1', 'C2', 'ALL']

// Función para verificar si un nivel es avanzado
export function isAdvancedLevel(level) {
  return ADVANCED_LEVELS.includes(level)
}

// Función para obtener verbos ZO disponibles por nivel
export function getZOVerbsForLevel(level) {
  if (isAdvancedLevel(level)) {
    return ZO_VERBS_LIST
  }
  return [] // Niveles básicos no ven verbos ZO
}

// Función para obtener verbos de 3ª persona avanzados disponibles por nivel
export function getAdvancedThirdPersonVerbsForLevel(level) {
  if (isAdvancedLevel(level)) {
    return ADVANCED_THIRD_PERSON_VERBS
  }
  return [] // Niveles básicos no ven estos verbos
}

// Estadísticas de filtrado para debugging
export function getFilteringStats(level) {
  const totalZOVerbs = ZO_VERBS_LIST.length
  const availableZOVerbs = getZOVerbsForLevel(level).length
  const totalAdvancedThirdPerson = ADVANCED_THIRD_PERSON_VERBS.length
  const availableAdvancedThirdPerson = getAdvancedThirdPersonVerbsForLevel(level).length
  
  return {
    level,
    isAdvanced: isAdvancedLevel(level),
    zoVerbs: {
      total: totalZOVerbs,
      available: availableZOVerbs,
      filtered: totalZOVerbs - availableZOVerbs
    },
    thirdPersonAdvanced: {
      total: totalAdvancedThirdPerson,
      available: availableAdvancedThirdPerson,
      filtered: totalAdvancedThirdPerson - availableAdvancedThirdPerson
    },
    totalFiltered: (totalZOVerbs - availableZOVerbs) + (totalAdvancedThirdPerson - availableAdvancedThirdPerson),
    filteringActive: !isAdvancedLevel(level)
  }
}