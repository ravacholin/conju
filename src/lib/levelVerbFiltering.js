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
  'vencer',     // venzo
]

// Función para determinar si un verbo es ZO_VERBS (consonante + cer → -zo)
export function isZOVerb(lemma) {
  return ZO_VERBS_LIST.includes(lemma)
}

// Función para determinar si un verbo debería filtrarse por nivel
export function shouldFilterVerbByLevel(lemma, verbFamilies, userLevel, tense) {
  // Solo aplicar filtrado por nivel para presente indicativo y subjuntivo
  if (!['pres', 'subjPres', 'impAff', 'impNeg'].includes(tense)) {
    return false // No filtrar otros tiempos
  }
  
  // Filtrar verbos ZO_VERBS para niveles básicos
  if (isZOVerb(lemma) && verbFamilies.includes('ZO_VERBS')) {
    const basicLevels = ['A1', 'A2', 'B1']
    return basicLevels.includes(userLevel)
  }
  
  return false // No filtrar por defecto
}

// Función para obtener la razón del filtrado (para debugging)
export function getFilterReason(lemma, verbFamilies, userLevel, tense) {
  if (shouldFilterVerbByLevel(lemma, verbFamilies, userLevel, tense)) {
    if (isZOVerb(lemma)) {
      return `Verbo ZO_VERBS "${lemma}" filtrado para nivel ${userLevel} (solo B2+)`
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

// Estadísticas de filtrado para debugging
export function getFilteringStats(level) {
  const totalZOVerbs = ZO_VERBS_LIST.length
  const availableZOVerbs = getZOVerbsForLevel(level).length
  
  return {
    level,
    isAdvanced: isAdvancedLevel(level),
    totalZOVerbs,
    availableZOVerbs,
    filteredZOVerbs: totalZOVerbs - availableZOVerbs,
    filteringActive: !isAdvancedLevel(level)
  }
}