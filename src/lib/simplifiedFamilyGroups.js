// Sistema de agrupación simplificada para la interfaz de usuario
// Agrupa las familias técnicas en categorías más simples para el usuario

export const SIMPLIFIED_GROUPS = {
  // Grupo 1: Verbos que cambian la raíz (diptongación y e→i)
  'STEM_CHANGES': {
    id: 'STEM_CHANGES',
    name: 'Verbos que Diptongan',
    description: 'pensar→pienso, volver→vuelvo, pedir→pido',
    explanation: 'Verbos que cambian la vocal de la raíz (e→ie, o→ue, e→i)',
    // Familias técnicas que incluye
    includedFamilies: [
      'DIPHT_E_IE',    // pensar, cerrar, empezar
      'DIPHT_O_UE',    // volver, poder, contar  
      'DIPHT_U_UE',    // jugar
      'E_I_IR'         // pedir, servir, repetir
    ],
    // Tiempos donde este grupo es relevante
    relevantTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    // Verbos ejemplares para mostrar
    exampleVerbs: ['pensar', 'volver', 'jugar', 'pedir'],
    color: '#4CAF50' // Verde para cambios de raíz
  },

  // Grupo 2: Irregulares en primera persona que se propagan
  'FIRST_PERSON_IRREGULAR': {
    id: 'FIRST_PERSON_IRREGULAR', 
    name: 'Irregulares en YO',
    description: 'tengo, conozco, salgo, protejo',
    explanation: 'Verbos irregulares en 1ª persona que afectan todo el subjuntivo',
    // Familias técnicas que incluye
    includedFamilies: [
      'G_VERBS',       // tener→tengo, poner→pongo, salir→salgo
      'ZCO_VERBS',     // conocer→conozco, conducir→conduzco  
      'ZO_VERBS',      // vencer→venzo, ejercer→ejerzo
      'JO_VERBS',      // proteger→protejo, elegir→elijo
      'GU_DROP'        // seguir→sigo, distinguir→distingo
    ],
    // Tiempos donde este grupo es relevante
    relevantTenses: ['pres', 'subjPres', 'impAff', 'impNeg'],
    // Verbos ejemplares para mostrar
    exampleVerbs: ['tener', 'conocer', 'proteger', 'seguir'],
    color: '#2196F3' // Azul para irregulares en yo
  }
}

// Función para obtener el grupo simplificado de un verbo para tiempos específicos
// Nota: Esta función requiere que se pase el resultado de categorizeVerb externamente
export function getSimplifiedGroupForVerb(verbFamilies, tense) {
  // Solo aplicar agrupación simplificada para presente indicativo y subjuntivo
  if (!['pres', 'subjPres', 'impAff', 'impNeg'].includes(tense)) {
    return null // Para otros tiempos, usar clasificación completa
  }
  
  // Verificar en qué grupo simplificado encaja
  for (const group of Object.values(SIMPLIFIED_GROUPS)) {
    const hasMatchingFamily = verbFamilies.some(family => 
      group.includedFamilies.includes(family)
    )
    if (hasMatchingFamily && group.relevantTenses.includes(tense)) {
      return group.id
    }
  }
  
  return null
}

// Función para obtener grupos disponibles para un tiempo específico
export function getSimplifiedGroupsForTense(tense) {
  if (!['pres', 'subjPres', 'impAff', 'impNeg'].includes(tense)) {
    return [] // Solo para presente indicativo y subjuntivo
  }
  
  return Object.values(SIMPLIFIED_GROUPS).filter(group => 
    group.relevantTenses.includes(tense)
  )
}

// Función para obtener grupos disponibles para un modo específico
export function getSimplifiedGroupsForMood(mood) {
  const relevantTenses = {
    'indicative': ['pres'],
    'subjunctive': ['subjPres'], 
    'imperative': ['impAff', 'impNeg']
  }
  
  const tenses = relevantTenses[mood] || []
  if (tenses.length === 0) return []
  
  return Object.values(SIMPLIFIED_GROUPS).filter(group =>
    group.relevantTenses.some(t => tenses.includes(t))
  )
}

// Función para expandir un grupo simplificado a sus familias técnicas
export function expandSimplifiedGroup(groupId) {
  const group = SIMPLIFIED_GROUPS[groupId]
  return group ? group.includedFamilies : []
}

// Función para determinar si un tiempo debe usar agrupación simplificada
export function shouldUseSimplifiedGrouping(tense) {
  return ['pres', 'subjPres', 'impAff', 'impNeg'].includes(tense)
}

// Función para determinar si un modo debe usar agrupación simplificada  
export function shouldUseSimplifiedGroupingForMood(mood) {
  return ['indicative', 'subjunctive', 'imperative'].includes(mood) && 
         (['indicative', 'subjunctive'].includes(mood))
}

// Función para obtener todos los grupos simplificados
export function getAllSimplifiedGroups() {
  return Object.values(SIMPLIFIED_GROUPS)
}

// Función para obtener un grupo por su ID
export function getSimplifiedGroupById(id) {
  return SIMPLIFIED_GROUPS[id] || null
}