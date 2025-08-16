// Sistema de selección de verbos por nivel MCER
// Cada nivel tiene verbos específicos apropiados para su dificultad pedagógica

// ============================================================================
// A1 - PRINCIPIANTE (Supervivencia básica)
// Solo verbos absolutamente esenciales para comunicación básica
// ============================================================================
export const A1_VERBS = [
  // Verbos de existencia y identidad (súper básicos)
  'ser', 'estar', 'tener', 'haber',
  
  // Verbos de movimiento esencial
  'ir', 'venir', 'llegar', 'salir',
  
  // Verbos de comunicación básica
  'hablar', 'decir', 'preguntar', 'llamar',
  
  // Verbos de acciones diarias
  'hacer', 'trabajar', 'estudiar', 'comer', 'beber',
  
  // Verbos regulares ultra-comunes
  'caminar', 'mirar', 'escuchar', 'vivir', 'escribir'
]

// ============================================================================
// A2 - ELEMENTAL (Comunicación básica expandida)
// Verbos comunes para conversaciones cotidianas
// ============================================================================
export const A2_VERBS = [
  // Todos los de A1
  ...A1_VERBS,
  
  // Verbos modales y de capacidad
  'poder', 'querer', 'saber', 'deber',
  
  // Verbos de percepción
  'ver', 'oír', 'sentir',
  
  // Verbos de transferencia
  'dar', 'recibir', 'enviar', 'traer', 'llevar',
  
  // Verbos de rutina diaria
  'levantarse', 'acostarse', 'ducharse', 'vestirse',
  'desayunar', 'almorzar', 'cenar',
  
  // Verbos de aprendizaje
  'aprender', 'enseñar', 'leer', 'entender', 'recordar',
  
  // Verbos sociales básicos
  'conocer', 'encontrar', 'ayudar', 'invitar', 'visitar',
  
  // Verbos de compras y actividades
  'comprar', 'vender', 'pagar', 'viajar', 'jugar'
]

// ============================================================================
// B1 - INTERMEDIO (Expresión fluida)
// Suficientes verbos para expresarse bien en situaciones comunes
// ============================================================================
export const B1_VERBS = [
  // Todos los de A2
  ...A2_VERBS,
  
  // Verbos de diptongación básica (e→ie)
  'pensar', 'empezar', 'comenzar', 'cerrar', 'despertar',
  'preferir', 'sentir', 'mentir',
  
  // Verbos de diptongación (o→ue)
  'volver', 'contar', 'encontrar', 'mostrar', 'recordar',
  'dormir', 'morir', 'soñar',
  
  // Verbos irregulares comunes
  'poner', 'salir', 'valer', 'caer', 'oír',
  
  // Verbos de opinión y expresión
  'creer', 'opinar', 'explicar', 'describir', 'contar',
  
  // Verbos de actividades y hobbies
  'cocinar', 'bailar', 'cantar', 'correr', 'nadar',
  'dibujar', 'pintar', 'tocar', 'practicar',
  
  // Verbos de emociones
  'amar', 'odiar', 'gustar', 'molestar', 'preocupar',
  'alegrar', 'entristecer', 'enojar',
  
  // Verbos de trabajo y estudio
  'funcionar', 'conseguir', 'lograr', 'intentar', 'tratar',
  'mejorar', 'cambiar', 'crear', 'producir'
]

// ============================================================================
// B2 - INTERMEDIO-AVANZADO (Complejidad moderada)
// Verbos menos frecuentes pero culturalmente importantes
// ============================================================================
export const B2_VERBS = [
  // Todos los de B1
  ...B1_VERBS,
  
  // Verbos ZO (consonante + cer → -zo)
  'vencer', 'convencer', 'ejercer', 'torcer', 'cocer',
  'mecer', 'retorcer',
  
  // Verbos con hiatos complejos (3ª persona)
  'leer', 'creer', 'poseer', 'proveer', 'releer',
  
  // Verbos -uir con y
  'construir', 'destruir', 'instruir', 'sustituir',
  'atribuir', 'contribuir', 'distribuir',
  
  // Verbos irregulares menos comunes
  'caber', 'conducir', 'traducir', 'producir', 'reducir',
  'introducir', 'deducir',
  
  // Verbos de cambio vocal (e→i)
  'pedir', 'servir', 'repetir', 'seguir', 'conseguir',
  'vestir', 'medir', 'competir', 'elegir',
  
  // Verbos de actividades específicas
  'mantener', 'contener', 'obtener', 'detener', 'sostener',
  'proponer', 'suponer', 'componer', 'exponer',
  
  // Verbos académicos y profesionales
  'analizar', 'investigar', 'desarrollar', 'establecer',
  'determinar', 'considerar', 'evaluar', 'comparar'
]

// ============================================================================
// C1 - AVANZADO (Solo irregulares complejos)
// Desafío con irregularidades complejas y patrones avanzados
// ============================================================================
export const C1_VERBS = [
  // Verbos con irregularidades múltiples
  'andar', 'caber', 'conducir', 'decir', 'estar', 'haber',
  'hacer', 'ir', 'poder', 'poner', 'querer', 'saber',
  'salir', 'ser', 'tener', 'traer', 'valer', 'venir', 'ver',
  
  // Verbos defectivos parciales (solo ciertas formas)
  'soler', 'atañer', 'concernir', 'incumbir',
  
  // Verbos con múltiples familias irregulares
  'oler', 'errar', 'erguir', 'agorar',
  
  // Verbos de 3ª persona muy avanzados
  'gruñir', 'tañer', 'bullir', 'mullir', 'engullir',
  'zambullir', 'escabullir',
  
  // Verbos académicos irregulares
  'bendecir', 'maldecir', 'predecir', 'contradecir',
  'desdecir',
  
  // Verbos compuestos irregulares
  'deshacer', 'rehacer', 'satisfacer', 'contrahacer',
  'malhacer', 'desandar', 'entrever', 'prever',
  
  // Verbos poco comunes pero importantes
  'yacer', 'raer', 'roer', 'asir', 'placer'
]

// ============================================================================
// C2 - MAESTRÍA (Verbos defectivos y extremadamente raros)
// Solo verbos que incluso nativos encuentran difíciles
// ============================================================================
export const C2_VERBS = [
  // Verbos defectivos clásicos (formas muy limitadas)
  'abolir', 'balbucir', 'blandir', 'colorir', 'desvaír',
  'empedernir', 'preterir', 'transgredir', 'aterir',
  
  // Verbos defectivos de 3ª persona únicamente
  'acaecer', 'acontecer', 'atañer', 'concernir',
  'incumbir', 'ocurrir', 'suceder',
  
  // Verbos unipersonales (meteorológicos y naturales)
  'granizar', 'nevar', 'llover', 'tronar', 'relampaguear',
  'amanecer', 'anochecer', 'atardecer', 'clarear',
  
  // Verbos extremadamente raros o arcaicos
  'agredir', 'aterir', 'despavorir', 'manir',
  'aterrir', 'descolorir', 'incoar', 'asonar',
  
  // Verbos con formas muy irregulares
  'pudrir', 'podrir', // Doble infinitivo
  'freír', // Participio doble: frito/freído
  'imprimir', // Participio doble: impreso/imprimido
  
  // Verbos técnicos o especializados
  'abater', 'embair', 'garantir', 'precaver',
  'demoler', 'soler', 'dolar', 'polar'
]

// ============================================================================
// CONFIGURACIÓN DE NIVELES
// ============================================================================
export const VERBS_BY_LEVEL = {
  'A1': A1_VERBS,
  'A2': A2_VERBS,
  'B1': B1_VERBS,
  'B2': B2_VERBS,
  'C1': C1_VERBS,
  'C2': C2_VERBS,
  'ALL': [...new Set([...A1_VERBS, ...A2_VERBS, ...B1_VERBS, ...B2_VERBS, ...C1_VERBS, ...C2_VERBS])]
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Obtiene la lista de verbos permitidos para un nivel específico
 */
export function getAllowedVerbsForLevel(level) {
  return VERBS_BY_LEVEL[level] || VERBS_BY_LEVEL['ALL']
}

/**
 * Verifica si un verbo está permitido en un nivel específico
 */
export function isVerbAllowedInLevel(verb, level) {
  const allowedVerbs = getAllowedVerbsForLevel(level)
  return allowedVerbs.includes(verb)
}

/**
 * Obtiene estadísticas de verbos por nivel
 */
export function getVerbStatsForLevel(level) {
  const verbs = getAllowedVerbsForLevel(level)
  return {
    level,
    verbCount: verbs.length,
    isProgressive: level !== 'ALL', // Los niveles incluyen los anteriores
    examples: verbs.slice(0, 5) // Primeros 5 como ejemplo
  }
}

/**
 * Obtiene todos los niveles con sus estadísticas
 */
export function getAllLevelStats() {
  return Object.keys(VERBS_BY_LEVEL).map(level => getVerbStatsForLevel(level))
}

// ============================================================================
// VERBOS POR CATEGORÍA PEDAGÓGICA
// ============================================================================

export const VERB_CATEGORIES = {
  // Categorías A1-A2
  survival: ['ser', 'estar', 'tener', 'haber', 'ir', 'venir'],
  daily_actions: ['comer', 'beber', 'dormir', 'trabajar', 'estudiar'],
  communication: ['hablar', 'decir', 'preguntar', 'escuchar', 'leer', 'escribir'],
  
  // Categorías B1-B2
  diphthongs_e_ie: ['pensar', 'empezar', 'cerrar', 'preferir', 'sentir'],
  diphthongs_o_ue: ['volver', 'contar', 'dormir', 'encontrar', 'mostrar'],
  change_e_i: ['pedir', 'servir', 'repetir', 'seguir', 'vestir'],
  
  // Categorías C1-C2
  defective: ['abolir', 'balbucir', 'blandir', 'colorir', 'empedernir'],
  unipersonal: ['llover', 'nevar', 'granizar', 'amanecer', 'anochecer'],
  complex_irregular: ['andar', 'caber', 'yacer', 'raer', 'asir']
}

export default VERBS_BY_LEVEL