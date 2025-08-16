// Clasificación de verbos españoles por frecuencia de uso
// Basado en corpus de español contemporáneo y frecuencia real de uso

// ============================================================================
// FRECUENCIA MUY ALTA (Top 50 - Uso diario esencial)
// ============================================================================
export const VERY_HIGH_FREQUENCY = [
  // Top 10 - Los más usados en español
  'ser', 'estar', 'tener', 'hacer', 'haber', 'ir', 'decir', 'ver', 'dar', 'saber',
  
  // Top 11-30 - Muy frecuentes
  'querer', 'poder', 'venir', 'llegar', 'pasar', 'deber', 'poner', 'parecer',
  'quedar', 'creer', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar',
  'llamar', 'venir', 'pensar', 'salir', 'volver',
  
  // Top 31-50 - Aún muy comunes
  'empezar', 'conocer', 'sentir', 'trabajar', 'vivir', 'estudiar', 'entrar',
  'escribir', 'producir', 'ocurrir', 'conseguir', 'contar', 'pedir', 'recibir',
  'servir', 'abrir', 'caminar', 'preguntar', 'esperar', 'buscar'
]

// ============================================================================
// FRECUENCIA ALTA (Top 51-150 - Uso regular)
// ============================================================================
export const HIGH_FREQUENCY = [
  'mirar', 'comer', 'leer', 'aprender', 'escuchar', 'beber', 'dormir',
  'levantarse', 'comprar', 'vender', 'viajar', 'jugar', 'ganar', 'perder',
  'ayudar', 'enseñar', 'mostrar', 'explicar', 'decidir', 'cambiar',
  'terminar', 'comenzar', 'acabar', 'continuar', 'mantener', 'crear',
  'desarrollar', 'establecer', 'presentar', 'considerar', 'ofrecer',
  'realizar', 'permitir', 'tratar', 'evitar', 'lograr', 'obtener',
  'incluir', 'suponer', 'recordar', 'resultar', 'añadir', 'aparecer',
  'considerar', 'formar', 'dirigir', 'correr', 'mover', 'nadar',
  'cantar', 'bailar', 'tocar', 'cocinar', 'limpiar', 'preparar',
  'organizar', 'planear', 'invitar', 'visitar', 'descansar', 'relajarse'
]

// ============================================================================
// FRECUENCIA MEDIA (Top 151-400 - Uso ocasional pero conocido)
// ============================================================================
export const MEDIUM_FREQUENCY = [
  'construir', 'destruir', 'funcionar', 'operar', 'manejar', 'conducir',
  'traducir', 'reducir', 'producir', 'introducir', 'reproducir',
  'vestirse', 'lavarse', 'ducharse', 'acostarse', 'despertarse',
  'maquillarse', 'peinarse', 'cepillarse', 'afeitarse',
  'comunicar', 'informar', 'anunciar', 'advertir', 'aconsejar',
  'sugerir', 'proponer', 'recomendar', 'insistir', 'exigir',
  'analizar', 'investigar', 'examinar', 'observar', 'comparar',
  'clasificar', 'ordenar', 'organizar', 'separar', 'dividir',
  'multiplicar', 'sumar', 'restar', 'calcular', 'medir',
  'dibujar', 'pintar', 'diseñar', 'construir', 'fabricar',
  'reparar', 'arreglar', 'instalar', 'conectar', 'desconectar'
]

// ============================================================================
// FRECUENCIA BAJA (Top 401-800 - Uso específico o formal)
// ============================================================================
export const LOW_FREQUENCY = [
  'vencer', 'convencer', 'ejercer', 'torcer', 'cocer', 'mecer',
  'poseer', 'proveer', 'releer', 'creer', 'leer', 'crear',
  'instruir', 'construir', 'destruir', 'sustituir', 'constituir',
  'atribuir', 'contribuir', 'distribuir', 'retribuir',
  'caber', 'saber', 'haber', 'deber', 'poder', 'querer',
  'sostener', 'mantener', 'contener', 'obtener', 'detener',
  'entretener', 'retener', 'abstener', 'atenerse',
  'componer', 'descomponer', 'recomponer', 'proponer', 'exponer',
  'suponer', 'imponer', 'disponer', 'oponer', 'anteponer',
  'bendecir', 'maldecir', 'predecir', 'contradecir', 'desdecir'
]

// ============================================================================
// FRECUENCIA MUY BAJA (Especializado, técnico, literario)
// ============================================================================
export const VERY_LOW_FREQUENCY = [
  'yacer', 'placer', 'raer', 'roer', 'asir', 'erguir',
  'oler', 'errar', 'agorar', 'adecuar', 'licuar',
  'soler', 'atañer', 'concernir', 'incumbir', 'acaecer',
  'acontecer', 'ocurrir', 'suceder', 'acaecerse',
  'bullir', 'mullir', 'engullir', 'zambullir', 'escabullir',
  'tañer', 'gruñir', 'ceñir', 'teñir', 'reñir',
  'deshacer', 'rehacer', 'satisfacer', 'contrahacer',
  'malhacer', 'licuefacer', 'putrefacer', 'tumefacer'
]

// ============================================================================
// FRECUENCIA EXTREMADAMENTE BAJA (Defectivos, arcaicos, muy raros)
// ============================================================================
export const EXTREMELY_LOW_FREQUENCY = [
  // Verbos defectivos clásicos
  'abolir', 'balbucir', 'blandir', 'colorir', 'desvaír',
  'empedernir', 'preterir', 'transgredir', 'aterir',
  'agredir', 'aterrir', 'descolorir', 'despavorir',
  
  // Verbos unipersonales meteorológicos
  'granizar', 'nevar', 'llover', 'tronar', 'relampaguear',
  'chispear', 'lloviznar', 'garuar', 'celliscar',
  
  // Verbos unipersonales temporales
  'amanecer', 'anochecer', 'atardecer', 'clarear',
  'oscurecer', 'alborear', 'orear',
  
  // Verbos extremadamente raros
  'manir', 'incoar', 'asonar', 'embair', 'garantir',
  'precaver', 'abater', 'dolar', 'polar', 'demoler'
]

// ============================================================================
// CONFIGURACIÓN POR FRECUENCIA
// ============================================================================
export const VERBS_BY_FREQUENCY = {
  'very_high': VERY_HIGH_FREQUENCY,
  'high': HIGH_FREQUENCY,
  'medium': MEDIUM_FREQUENCY,
  'low': LOW_FREQUENCY,
  'very_low': VERY_LOW_FREQUENCY,
  'extremely_low': EXTREMELY_LOW_FREQUENCY
}

// ============================================================================
// MAPEO FRECUENCIA → NIVEL MCER
// ============================================================================
export const FREQUENCY_TO_LEVEL_MAPPING = {
  'A1': ['very_high'], // Solo los más frecuentes
  'A2': ['very_high', 'high'], // Frecuentes y algo más
  'B1': ['very_high', 'high', 'medium'], // Hasta frecuencia media
  'B2': ['very_high', 'high', 'medium', 'low'], // Incluir menos frecuentes
  'C1': ['medium', 'low', 'very_low'], // Enfoque en menos comunes
  'C2': ['low', 'very_low', 'extremely_low'], // Los más raros y difíciles
  'ALL': ['very_high', 'high', 'medium', 'low', 'very_low', 'extremely_low']
}

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Obtiene la frecuencia de un verbo específico
 */
export function getVerbFrequency(verb) {
  for (const [frequency, verbs] of Object.entries(VERBS_BY_FREQUENCY)) {
    if (verbs.includes(verb)) {
      return frequency
    }
  }
  return 'unknown'
}

/**
 * Obtiene todos los verbos de una frecuencia específica
 */
export function getVerbsByFrequency(frequency) {
  return VERBS_BY_FREQUENCY[frequency] || []
}

/**
 * Obtiene los verbos apropiados para un nivel basado en frecuencia
 */
export function getVerbsByFrequencyForLevel(level) {
  const allowedFrequencies = FREQUENCY_TO_LEVEL_MAPPING[level] || FREQUENCY_TO_LEVEL_MAPPING['ALL']
  
  const verbs = []
  for (const frequency of allowedFrequencies) {
    verbs.push(...getVerbsByFrequency(frequency))
  }
  
  return [...new Set(verbs)] // Eliminar duplicados
}

/**
 * Verifica si un verbo es apropiado para un nivel basado en frecuencia
 */
export function isVerbFrequencyAppropriateForLevel(verb, level) {
  const verbFrequency = getVerbFrequency(verb)
  const allowedFrequencies = FREQUENCY_TO_LEVEL_MAPPING[level] || FREQUENCY_TO_LEVEL_MAPPING['ALL']
  
  return allowedFrequencies.includes(verbFrequency)
}

/**
 * Obtiene estadísticas de frecuencia para un nivel
 */
export function getFrequencyStatsForLevel(level) {
  const allowedFrequencies = FREQUENCY_TO_LEVEL_MAPPING[level] || []
  const verbsByFrequency = {}
  let totalVerbs = 0
  
  for (const frequency of allowedFrequencies) {
    const verbs = getVerbsByFrequency(frequency)
    verbsByFrequency[frequency] = verbs.length
    totalVerbs += verbs.length
  }
  
  return {
    level,
    totalVerbs,
    allowedFrequencies,
    verbsByFrequency,
    mainFocus: allowedFrequencies[0] || 'unknown'
  }
}

/**
 * Clasifica un verbo por su rareza pedagógica
 */
export function getVerbPedagogicalRarity(verb) {
  const frequency = getVerbFrequency(verb)
  
  const rarityMap = {
    'very_high': 'essential',      // Esencial - debe saberse
    'high': 'important',           // Importante - muy útil
    'medium': 'useful',            // Útil - conveniente saber
    'low': 'specialized',          // Especializado - ocasional
    'very_low': 'rare',           // Raro - solo avanzados
    'extremely_low': 'extremely_rare' // Extremadamente raro - maestría
  }
  
  return rarityMap[frequency] || 'unknown'
}

// ============================================================================
// VERBOS POR TEMÁTICA Y FRECUENCIA
// ============================================================================
export const THEMATIC_FREQUENCY_GROUPS = {
  // Supervivencia (A1) - Solo muy alta frecuencia
  survival_verbs: VERY_HIGH_FREQUENCY.filter(v => 
    ['ser', 'estar', 'tener', 'haber', 'ir', 'venir', 'hacer', 'decir'].includes(v)
  ),
  
  // Comunicación básica (A1-A2)
  communication_verbs: [...VERY_HIGH_FREQUENCY, ...HIGH_FREQUENCY].filter(v =>
    ['hablar', 'decir', 'preguntar', 'escuchar', 'leer', 'escribir', 'explicar'].includes(v)
  ),
  
  // Verbos académicos (B2-C1)
  academic_verbs: [...LOW_FREQUENCY, ...VERY_LOW_FREQUENCY].filter(v =>
    ['analizar', 'investigar', 'examinar', 'clasificar', 'evaluar', 'considerar'].includes(v)
  ),
  
  // Verbos defectivos (C2)
  defective_verbs: EXTREMELY_LOW_FREQUENCY.filter(v =>
    ['abolir', 'balbucir', 'blandir', 'colorir', 'empedernir', 'agredir'].includes(v)
  )
}

export default VERBS_BY_FREQUENCY