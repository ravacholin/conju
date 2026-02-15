// Sistema de agrupación simplificada para la interfaz de usuario
// Agrupa las familias técnicas en categorías más simples para el usuario

export const SIMPLIFIED_GROUPS = {
  // GRUPOS PARA PRESENTE INDICATIVO Y SUBJUNTIVO
  
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
    relevantTenses: ['pres', 'subjPres'],
    // Verbos ejemplares para mostrar
    exampleVerbs: ['pensar', 'volver', 'jugar', 'pedir'],
    color: '#4CAF50' // Verde para cambios de raíz
  },

  // Grupo 2: Irregulares en primera persona que se propagan
  'FIRST_PERSON_IRREGULAR': {
    id: 'FIRST_PERSON_IRREGULAR',
    name: 'Irregulares en YO',
    description: 'conozco, salgo, hago',
    explanation: 'Verbos irregulares en 1ª persona que afectan todo el subjuntivo',
    // Familias técnicas que incluye
    includedFamilies: [
      'G_VERBS',       // tener→tengo, poner→pongo, salir→salgo
      'ZCO_VERBS',     // conocer→conozco, parecer→parezco, conducir→conduzco
      'ZO_VERBS',      // vencer→venzo, ejercer→ejerzo
      'JO_VERBS',      // proteger→protejo, elegir→elijo
      'GU_DROP',       // seguir→sigo, distinguir→distingo
      'YO_OY'          // estar→estoy, ser→soy, dar→doy, ir→voy
    ],
    // Tiempos donde este grupo es relevante
    relevantTenses: ['pres', 'subjPres'],
    // Verbos ejemplares para mostrar
    exampleVerbs: ['conocer', 'salir', 'hacer', 'estar'],
    color: '#2196F3' // Azul para irregulares en yo
  },

  // GRUPOS ESPECÍFICOS PARA PRETÉRITO INDEFINIDO
  
  // Grupo 3: Irregulares en terceras personas (diptongación -ir + hiatos con y)
  'PRETERITE_THIRD_PERSON': {
    id: 'PRETERITE_THIRD_PERSON',
    name: 'Irregulares en 3ª persona',
    description: 'pidió/pidieron, leyó/leyeron, durmió/durmieron',
    explanation: 'Verbos -ir que diptongan (e→i, o→u) y verbos con raíz vocal + y en 3ª',
    // Familias técnicas que incluye
    includedFamilies: [
      'E_I_IR',        // pedir→pidió, servir→sirvió
      'O_U_GER_IR',    // dormir→durmió, morir→murió  
      'HIATUS_Y'       // leer→leyó, caer→cayó, oír→oyó
    ],
    // Tiempos donde este grupo es relevante
    relevantTenses: ['pretIndef'],
    // Verbos ejemplares para mostrar
    exampleVerbs: ['pedir', 'dormir', 'leer', 'caer', 'oír'],
    color: '#FF9800' // Naranja para terceras personas
  },

  // Grupo 4: Muy irregulares con raíces y terminaciones completamente irregulares
  'PRETERITE_STRONG_STEM': {
    id: 'PRETERITE_STRONG_STEM',
    name: 'Muy Irregulares (raíz fuerte)',
    description: 'tuve, dije, hice, puse, vine, fue',
    explanation: 'Verbos con raíces completamente irregulares y terminaciones especiales',
    // Familias técnicas que incluye
    includedFamilies: [
      'PRET_UV',       // andar→anduve, estar→estuve, tener→tuve
      'PRET_U',        // poder→pude, poner→puse, saber→supe
      'PRET_I',        // querer→quise, venir→vine, hacer→hice
      'PRET_J',        // decir→dije, traer→traje, conducir→conduje
      'PRET_SUPPL'     // ir/ser→fue, dar→dio, ver→vio
    ],
    // Tiempos donde este grupo es relevante
    relevantTenses: ['pretIndef'],
    // Verbos ejemplares para mostrar
    exampleVerbs: ['tener', 'decir', 'hacer', 'poner', 'venir', 'ir', 'ser'],
    color: '#E91E63' // Rosa para muy irregulares
  }
}

// Función para obtener el grupo simplificado de un verbo para tiempos específicos
// Nota: Esta función requiere que se pase el resultado de categorizeVerb externamente
export function getSimplifiedGroupForVerb(verbFamilies, tense) {
  // Solo aplicar agrupación simplificada para tiempos soportados
  if (!shouldUseSimplifiedGrouping(tense)) {
    return null // Para otros tiempos, usar clasificación completa
  }
  
  // Para pretérito indefinido, priorizar irregulares fuertes sobre terceras personas
  if (['pretIndef', 'subjImpf'].includes(tense)) {
    // Primero verificar si es irregular fuerte (prioridad alta)
    const strongStemGroup = SIMPLIFIED_GROUPS['PRETERITE_STRONG_STEM']
    const hasStrongStemFamily = verbFamilies.some(family => 
      strongStemGroup.includedFamilies.includes(family)
    )
    if (hasStrongStemFamily && strongStemGroup.relevantTenses.includes(tense)) {
      return 'PRETERITE_STRONG_STEM'
    }
    
    // Luego verificar si es irregular de 3ª persona
    const thirdPersonGroup = SIMPLIFIED_GROUPS['PRETERITE_THIRD_PERSON']
    const hasThirdPersonFamily = verbFamilies.some(family => 
      thirdPersonGroup.includedFamilies.includes(family)
    )
    if (hasThirdPersonFamily && thirdPersonGroup.relevantTenses.includes(tense)) {
      return 'PRETERITE_THIRD_PERSON'
    }
  } else {
    // Para otros tiempos, usar orden original
    for (const group of Object.values(SIMPLIFIED_GROUPS)) {
      const hasMatchingFamily = verbFamilies.some(family => 
        group.includedFamilies.includes(family)
      )
      if (hasMatchingFamily && group.relevantTenses.includes(tense)) {
        return group.id
      }
    }
  }
  
  return null
}

// Función para obtener grupos disponibles para un tiempo específico
export function getSimplifiedGroupsForTense(tense) {
  // Tiempos que usan agrupación simplificada
  const supportedTenses = ['pres', 'subjPres', 'impAff', 'impNeg', 'pretIndef', 'subjImpf']
  
  if (!supportedTenses.includes(tense)) {
    return [] // Solo para tiempos con agrupación simplificada
  }
  
  return Object.values(SIMPLIFIED_GROUPS).filter(group => 
    group.relevantTenses.includes(tense)
  )
}

// Función para obtener grupos disponibles para un modo específico
export function getSimplifiedGroupsForMood(mood) {
  const relevantTenses = {
    'indicative': ['pres', 'pretIndef'],
    'subjunctive': ['subjPres', 'subjImpf'], 
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
  return ['pres', 'subjPres', 'impAff', 'impNeg', 'pretIndef', 'subjImpf'].includes(tense)
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