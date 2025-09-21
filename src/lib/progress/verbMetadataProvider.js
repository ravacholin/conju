// Proveedor ligero de metadatos de verbos para motores emocionales
// Evita la carga completa del dataset de verbos para operaciones de análisis

import { isIrregularInTense } from '../utils/irregularityUtils.js'

/**
 * Interfaz ligera para obtener metadatos de verbos sin cargar el dataset completo
 */
class VerbMetadataProvider {
  constructor() {
    this.verbsModule = null
    this.cachedVerbs = new Map()
  }

  /**
   * Inyectar dataset de verbos (lazy loading)
   * @param {Array} verbs - Dataset de verbos
   */
  injectVerbs(verbs) {
    this.verbsModule = verbs
    this.cachedVerbs.clear()
  }

  /**
   * Obtener metadatos de un verbo por lemma
   * @param {string} lemma - Lemma del verbo
   * @returns {Object|null} Metadatos del verbo o null si no se encuentra
   */
  async getVerbMetadata(lemma) {
    if (!lemma) return null

    // Verificar cache
    if (this.cachedVerbs.has(lemma)) {
      return this.cachedVerbs.get(lemma)
    }

    // Cargar verbos si no están disponibles
    if (!this.verbsModule) {
      try {
        const { verbs } = await import('../../data/verbs.js')
        this.verbsModule = verbs
      } catch (error) {
        console.warn('No se pudo cargar dataset de verbos:', error)
        return null
      }
    }

    // Buscar verbo
    const verb = this.verbsModule.find(v => v.lemma === lemma)
    if (!verb) return null

    // Crear metadatos ligeros
    const metadata = {
      lemma: verb.lemma,
      type: verb.type || 'regular',
      frequency: verb.frequency || 'medium',
      // Función para verificar irregularidad por tiempo específico
      isIrregularInTense: (tense) => isIrregularInTense(verb, tense)
    }

    // Cachear para futuras consultas
    this.cachedVerbs.set(lemma, metadata)

    return metadata
  }

  /**
   * Verificar si un verbo es irregular en un tiempo específico
   * @param {string} lemma - Lemma del verbo
   * @param {string} tense - Tiempo verbal
   * @returns {Promise<boolean>} Si es irregular en ese tiempo
   */
  async isVerbIrregularInTense(lemma, tense) {
    const metadata = await this.getVerbMetadata(lemma)
    if (!metadata) return false

    return metadata.isIrregularInTense(tense)
  }

  /**
   * Obtener tipo de verbo (regular/irregular)
   * @param {string} lemma - Lemma del verbo
   * @returns {Promise<string>} Tipo del verbo
   */
  async getVerbType(lemma) {
    const metadata = await this.getVerbMetadata(lemma)
    return metadata?.type || 'regular'
  }

  /**
   * Obtener frecuencia del verbo
   * @param {string} lemma - Lemma del verbo
   * @returns {Promise<string>} Frecuencia del verbo
   */
  async getVerbFrequency(lemma) {
    const metadata = await this.getVerbMetadata(lemma)
    return metadata?.frequency || 'medium'
  }

  /**
   * Limpiar cache
   */
  clearCache() {
    this.cachedVerbs.clear()
  }

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats() {
    return {
      size: this.cachedVerbs.size,
      keys: Array.from(this.cachedVerbs.keys())
    }
  }
}

// Singleton para uso global
export const verbMetadataProvider = new VerbMetadataProvider()

/**
 * Función de conveniencia para inyectar verbos en el provider
 * @param {Array} verbs - Dataset de verbos
 */
export function injectVerbsIntoProvider(verbs) {
  verbMetadataProvider.injectVerbs(verbs)
}

/**
 * Función de conveniencia para obtener metadatos de verbo
 * @param {string} lemma - Lemma del verbo
 * @returns {Promise<Object|null>} Metadatos del verbo
 */
export function getVerbMetadata(lemma) {
  return verbMetadataProvider.getVerbMetadata(lemma)
}

/**
 * Función de conveniencia para verificar irregularidad
 * @param {string} lemma - Lemma del verbo
 * @param {string} tense - Tiempo verbal
 * @returns {Promise<boolean>} Si es irregular en ese tiempo
 */
export function isVerbIrregularInTense(lemma, tense) {
  return verbMetadataProvider.isVerbIrregularInTense(lemma, tense)
}