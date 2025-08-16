// Sistema avanzado de filtrado de verbos por nivel MCER
// Lógica pedagógica completa: A1 básicos → C2 defectivos/raros

import { VERBS_BY_LEVEL, getAllowedVerbsForLevel, isVerbAllowedInLevel } from '../data/verbsByLevel.js'
import { 
  getVerbFrequency, 
  isVerbFrequencyAppropriateForLevel,
  getVerbPedagogicalRarity 
} from '../data/verbFrequency.js'

// ============================================================================
// CONFIGURACIÓN DE FILTRADO POR NIVEL
// ============================================================================

// Niveles que usan whitelist estricta (solo verbos permitidos)
export const STRICT_WHITELIST_LEVELS = ['A1', 'A2', 'B1']

// Niveles que usan blacklist (todos menos los prohibidos)
export const BLACKLIST_LEVELS = ['B2', 'C1', 'C2']

// Lista de niveles avanzados
export const ADVANCED_LEVELS = ['B2', 'C1', 'C2', 'ALL']

// ============================================================================
// CONFIGURACIÓN DE MODOS DE FILTRADO
// ============================================================================

// Modo extensivo: usa todo el repertorio con fallback inteligente
export const EXTENSIVE_MODE_CONFIG = {
  enabled: true, // Por defecto habilitado para aprovechar todo el repertorio
  fallbackToHigherLevels: true,
  includeCategorizedFirst: true,
  autoCategorizationEnabled: true
}

// ============================================================================
// FUNCIÓN PRINCIPAL DE FILTRADO
// ============================================================================

/**
 * Determina si un verbo debe ser filtrado (excluido) para un nivel específico
 * @param {string} lemma - El infinitivo del verbo
 * @param {Array} verbFamilies - Familias irregulares del verbo
 * @param {string} userLevel - Nivel MCER del usuario (A1, A2, B1, B2, C1, C2, ALL)
 * @param {string} tense - Tiempo verbal
 * @param {boolean} extensiveMode - Si usar modo extensivo (por defecto true)
 * @returns {boolean} true si debe filtrarse (excluirse), false si debe incluirse
 */
export function shouldFilterVerbByLevel(lemma, verbFamilies, userLevel, tense, extensiveMode = true) {
  // Si es nivel ALL, nunca filtrar
  if (userLevel === 'ALL') {
    return false
  }
  
  // MODO EXTENSIVO: Usar todo el repertorio con priorización inteligente
  if (extensiveMode && EXTENSIVE_MODE_CONFIG.enabled) {
    return shouldFilterVerbExtensive(lemma, verbFamilies, userLevel, tense)
  }
  
  // MODO ESTRICTO ORIGINAL: Mantener lógica anterior para compatibilidad
  return shouldFilterVerbStrict(lemma, verbFamilies, userLevel, tense)
}

/**
 * Filtrado extensivo: prioriza verbos categorizados pero incluye todos con fallback
 */
function shouldFilterVerbExtensive(lemma, verbFamilies, userLevel, tense) {
  // Para niveles avanzados, permitir todo
  if (['C1', 'C2'].includes(userLevel)) {
    return false // Usar todo el repertorio en niveles avanzados
  }
  
  // Para niveles básicos e intermedios, usar estrategia progresiva
  if (STRICT_WHITELIST_LEVELS.includes(userLevel)) {
    // Si está en la whitelist del nivel actual, siempre incluir
    if (isVerbAllowedInLevel(lemma, userLevel)) {
      return false
    }
    
    // Fallback progresivo: permitir verbos de niveles inmediatamente superiores
    if (EXTENSIVE_MODE_CONFIG.fallbackToHigherLevels) {
      const nextLevelAllowed = shouldAllowAsNextLevelFallback(lemma, userLevel)
      return nextLevelAllowed // Si nextLevelAllowed es false, significa que SÍ se debe incluir
    }
    
    return true // Filtrar solo si no hay fallback disponible
  }
  
  // B2: Estrategia más permisiva - usar casi todo
  if (userLevel === 'B2') {
    const rarity = getVerbPedagogicalRarity(lemma)
    // Solo filtrar verbos defectivos extremos en B2
    return rarity === 'extremely_rare' && lemma.includes('defectiv')
  }
  
  return false
}

/**
 * Filtrado estricto original (modo de compatibilidad)
 */
function shouldFilterVerbStrict(lemma, verbFamilies, userLevel, tense) {
  // ESTRATEGIA WHITELIST: A1, A2, B1 - Solo verbos específicamente permitidos
  if (STRICT_WHITELIST_LEVELS.includes(userLevel)) {
    return !isVerbAllowedInLevel(lemma, userLevel)
  }
  
  // ESTRATEGIA BLACKLIST: B2, C1, C2 - Todos menos específicamente prohibidos
  if (BLACKLIST_LEVELS.includes(userLevel)) {
    return shouldBlacklistVerbForLevel(lemma, verbFamilies, userLevel, tense)
  }
  
  // Fallback: no filtrar
  return false
}

/**
 * Determina si un verbo debe permitirse como fallback del siguiente nivel
 */
function shouldAllowAsNextLevelFallback(lemma, currentLevel) {
  const levelHierarchy = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const currentIndex = levelHierarchy.indexOf(currentLevel)
  
  if (currentIndex === -1 || currentIndex >= levelHierarchy.length - 1) {
    return false // Permitir (no filtrar) si no hay nivel superior
  }
  
  // Verificar los próximos 2 niveles inmediatos para progresión suave
  const checkLevels = levelHierarchy.slice(currentIndex + 1, currentIndex + 3)
  
  for (const higherLevel of checkLevels) {
    if (isVerbAllowedInLevel(lemma, higherLevel)) {
      return false // Permitir (no filtrar) - está en un nivel cercano
    }
  }
  
  // Si no está categorizado explícitamente, usar categorización automática
  if (EXTENSIVE_MODE_CONFIG.autoCategorizationEnabled) {
    const shouldAllow = shouldAllowUncategorizedVerb(lemma, currentLevel)
    return !shouldAllow // Invertir porque shouldAllowUncategorizedVerb devuelve si debe permitirse
  }
  
  // Por defecto, permitir verbos no categorizados en modo extensivo
  return false // Permitir (no filtrar) para máximo aprovechamiento
}

/**
 * Determina si permitir un verbo no categorizado basado en heurísticas
 */
function shouldAllowUncategorizedVerb(lemma, level) {
  const frequency = getVerbFrequency(lemma)
  const rarity = getVerbPedagogicalRarity(lemma)
  
  // Mapeo heurístico de niveles a rareza apropiada
  const levelRarityMap = {
    'A1': ['essential'],
    'A2': ['essential', 'important'],
    'B1': ['essential', 'important', 'useful'],
    'B2': ['essential', 'important', 'useful', 'specialized'],
    'C1': ['useful', 'specialized', 'rare'],
    'C2': ['specialized', 'rare', 'extremely_rare']
  }
  
  const appropriateRarities = levelRarityMap[level] || []
  return appropriateRarities.includes(rarity)
}

/**
 * Lógica de blacklist para niveles avanzados
 */
function shouldBlacklistVerbForLevel(lemma, verbFamilies, level, tense) {
  // B2: Filtrar verbos extremadamente raros
  if (level === 'B2') {
    const rarity = getVerbPedagogicalRarity(lemma)
    return rarity === 'extremely_rare'
  }
  
  // C1: Permitir solo irregulares y raros (como está configurado actualmente)
  if (level === 'C1') {
    // Mantener la lógica existente: solo verbos irregulares
    const frequency = getVerbFrequency(lemma)
    const rarity = getVerbPedagogicalRarity(lemma)
    
    // Filtrar verbos muy comunes regulares (demasiado fáciles para C1)
    if (rarity === 'essential' || rarity === 'important') {
      return true
    }
    
    return false
  }
  
  // C2: Solo verbos extremadamente raros y defectivos
  if (level === 'C2') {
    const rarity = getVerbPedagogicalRarity(lemma)
    
    // C2 debería enfocarse en verbos extremadamente raros
    return !['rare', 'extremely_rare'].includes(rarity)
  }
  
  return false
}

// ============================================================================
// FUNCIONES DE ANÁLISIS Y DEBUGGING
// ============================================================================

/**
 * Obtiene la razón específica por la que un verbo fue filtrado
 */
export function getFilterReason(lemma, verbFamilies, userLevel, tense) {
  if (!shouldFilterVerbByLevel(lemma, verbFamilies, userLevel, tense)) {
    return null
  }
  
  const frequency = getVerbFrequency(lemma)
  const rarity = getVerbPedagogicalRarity(lemma)
  
  // Razones para whitelist (A1, A2, B1)
  if (STRICT_WHITELIST_LEVELS.includes(userLevel)) {
    return `Verbo "${lemma}" no incluido en lista pedagógica para ${userLevel} (frecuencia: ${frequency}, rareza: ${rarity})`
  }
  
  // Razones para blacklist (B2, C1, C2)
  if (userLevel === 'B2' && rarity === 'extremely_rare') {
    return `Verbo "${lemma}" demasiado raro para B2 (rareza: ${rarity})`
  }
  
  if (userLevel === 'C1' && ['essential', 'important'].includes(rarity)) {
    return `Verbo "${lemma}" demasiado básico para C1 (rareza: ${rarity})`
  }
  
  if (userLevel === 'C2' && !['rare', 'extremely_rare'].includes(rarity)) {
    return `Verbo "${lemma}" no suficientemente raro para C2 (rareza: ${rarity})`
  }
  
  return `Verbo "${lemma}" filtrado por criterios de nivel ${userLevel}`
}

/**
 * Verifica si un nivel es considerado avanzado
 */
export function isAdvancedLevel(level) {
  return ADVANCED_LEVELS.includes(level)
}

/**
 * Obtiene estadísticas completas de filtrado para un nivel
 */
export function getFilteringStats(level) {
  const allowedVerbs = getAllowedVerbsForLevel(level)
  const allVerbs = getAllowedVerbsForLevel('ALL')
  
  // Contar por categorías de rareza
  const rarityStats = {}
  const frequencyStats = {}
  
  for (const verb of allowedVerbs) {
    const rarity = getVerbPedagogicalRarity(verb)
    const frequency = getVerbFrequency(verb)
    
    rarityStats[rarity] = (rarityStats[rarity] || 0) + 1
    frequencyStats[frequency] = (frequencyStats[frequency] || 0) + 1
  }
  
  return {
    level,
    totalVerbs: allowedVerbs.length,
    totalPossibleVerbs: allVerbs.length,
    filteredCount: allVerbs.length - allowedVerbs.length,
    filteringPercentage: Math.round(((allVerbs.length - allowedVerbs.length) / allVerbs.length) * 100),
    
    // Estrategia usada
    strategy: STRICT_WHITELIST_LEVELS.includes(level) ? 'whitelist' : 
              BLACKLIST_LEVELS.includes(level) ? 'blacklist' : 'none',
    
    // Estadísticas por rareza
    rarityDistribution: rarityStats,
    
    // Estadísticas por frecuencia
    frequencyDistribution: frequencyStats,
    
    // Ejemplos
    examples: allowedVerbs.slice(0, 8),
    
    // Nivel avanzado
    isAdvanced: isAdvancedLevel(level),
    
    // Información pedagógica
    pedagogicalFocus: getPedagogicalFocusForLevel(level)
  }
}

/**
 * Obtiene el enfoque pedagógico de un nivel
 */
function getPedagogicalFocusForLevel(level) {
  const focusMap = {
    'A1': 'Verbos esenciales para supervivencia básica',
    'A2': 'Verbos comunes para comunicación cotidiana',
    'B1': 'Verbos frecuentes con irregularidades básicas',
    'B2': 'Verbos menos comunes, patrones complejos',
    'C1': 'Verbos irregulares y especializados',
    'C2': 'Verbos defectivos, raros y extremadamente difíciles',
    'ALL': 'Todos los verbos disponibles'
  }
  
  return focusMap[level] || 'Enfoque no definido'
}

// ============================================================================
// FUNCIONES DE COMPATIBILIDAD (para mantener la API existente)
// ============================================================================

// Mantener funciones existentes para compatibilidad
export const ZO_VERBS_LIST = [
  'vencer', 'ejercer', 'torcer', 'cocer', 'mecer', 'retorcer', 'convencer'
]

export const ADVANCED_THIRD_PERSON_VERBS = [
  'poseer', 'proveer', 'releer', 'instruir', 'reconstruir', 
  'sustituir', 'atribuir', 'excluir', 'podrir', 'gruñir'
]

export function isZOVerb(lemma) {
  return ZO_VERBS_LIST.includes(lemma)
}

export function isAdvancedThirdPersonVerb(lemma) {
  return ADVANCED_THIRD_PERSON_VERBS.includes(lemma)
}

// ============================================================================
// FUNCIONES DE UTILIDAD ADICIONALES
// ============================================================================

/**
 * Obtiene recomendaciones de verbos para un nivel específico
 */
export function getRecommendedVerbsForLevel(level, count = 10) {
  const allowedVerbs = getAllowedVerbsForLevel(level)
  
  // Para niveles básicos, priorizar por frecuencia
  if (STRICT_WHITELIST_LEVELS.includes(level)) {
    return allowedVerbs.slice(0, count)
  }
  
  // Para niveles avanzados, priorizar por rareza
  return allowedVerbs
    .sort((a, b) => {
      const rarityA = getVerbPedagogicalRarity(a)
      const rarityB = getVerbPedagogicalRarity(b)
      const rarityOrder = ['essential', 'important', 'useful', 'specialized', 'rare', 'extremely_rare']
      return rarityOrder.indexOf(rarityB) - rarityOrder.indexOf(rarityA)
    })
    .slice(0, count)
}

/**
 * Valida la configuración de un nivel
 */
export function validateLevelConfiguration(level) {
  const stats = getFilteringStats(level)
  const warnings = []
  
  if (stats.totalVerbs === 0) {
    warnings.push(`Nivel ${level} no tiene verbos disponibles`)
  }
  
  if (stats.totalVerbs < 10 && level !== 'C2') {
    warnings.push(`Nivel ${level} tiene muy pocos verbos (${stats.totalVerbs})`)
  }
  
  if (stats.filteringPercentage > 95 && level !== 'A1') {
    warnings.push(`Nivel ${level} filtra demasiados verbos (${stats.filteringPercentage}%)`)
  }
  
  return {
    level,
    isValid: warnings.length === 0,
    warnings,
    stats
  }
}