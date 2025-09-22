// Sistema de gestión de chunks de verbos con carga dinámica
// Optimiza el bundle inicial cargando verbos bajo demanda

// Import for irregular verb categorization when metadata is missing
import { categorizeVerb } from '../data/irregularFamilies.js'

class VerbChunkManager {
  constructor() {
    this.loadedChunks = new Map() // chunkName -> verbs array
    this.chunkMetadata = new Map() // chunkName -> metadata
    this.loadingPromises = new Map() // chunkName -> Promise
    this.verbIndex = new Map() // lemma -> chunkName
    this.preloadQueue = []
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      chunksLoaded: 0,
      totalLoadTime: 0
    }
    this.manifest = null
    this.manifestPromise = null
    this.manifestLoadedAt = 0
    this.manifestTTL = 60 * 1000 // refresh manifest cada minuto para datos dinámicos
    this.refreshTimer = null
    this.fetchAvailable = typeof window !== 'undefined' && typeof window.fetch === 'function'
    this.chunkBaseUrl = '/'
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) {
        this.chunkBaseUrl = import.meta.env.BASE_URL
      }
    } catch {
      // Ignorar si BASE_URL no está disponible (tests / SSR)
    }
    
    this.initializeMetadata()
    if (this.fetchAvailable) {
      this.ensureManifest().catch(error => {
        console.warn('No se pudo cargar manifest de chunks al iniciar:', error)
      })
      this.scheduleManifestRefresh()
    }
  }
  
  initializeMetadata() {
    // Metadata de chunks - define qué verbos están en cada chunk
    this.chunkMetadata.set('core', {
      verbs: [
        'ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber',
        'querer', 'llegar', 'pasar', 'deber', 'poner', 'parecer', 'quedar'
      ],
      priority: 1,
      size: 179000, // ~179KB
      description: 'Verbos más frecuentes A1',
      lastAccess: 0
    })
    
    this.chunkMetadata.set('common', {
      verbs: [
        'creer', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir',
        'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar',
        'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar'
      ],
      priority: 2,
      size: 250000, // ~250KB
      description: 'Verbos comunes frecuentes',
      lastAccess: 0
    })
    
    this.chunkMetadata.set('irregulars', {
      verbs: [], // Se populará dinámicamente con verbos irregulares no incluidos arriba
      priority: 3,
      size: 1200000, // ~1.2MB
      description: 'Verbos irregulares complejos',
      lastAccess: 0
    })
    
    this.chunkMetadata.set('advanced', {
      verbs: [], // Resto de verbos
      priority: 4,
      size: 600000, // ~600KB
      description: 'Verbos avanzados y raros',
      lastAccess: 0
    })
    
    // Construir índice verbo -> chunk
    this.buildVerbIndex()
  }
  
  buildVerbIndex() {
    this.chunkMetadata.forEach((metadata, chunkName) => {
      metadata.verbs.forEach(verbLemma => {
        this.verbIndex.set(verbLemma, chunkName)
      })
    })
  }

  scheduleManifestRefresh() {
    if (!this.fetchAvailable) {
      return
    }
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
    this.refreshTimer = setInterval(() => {
      this.ensureManifest(true).catch(error => {
        console.warn('Refresco automático del manifest de chunks falló:', error)
      })
    }, this.manifestTTL)
  }

  async ensureManifest(force = false) {
    if (!this.fetchAvailable) {
      return null
    }
    const now = Date.now()
    if (!force && this.manifest && now - this.manifestLoadedAt < this.manifestTTL) {
      return this.manifest
    }
    if (this.manifestPromise && !force) {
      return this.manifestPromise
    }

    const versionBuster = Date.now()
    const fetchManifest = async () => {
      const manifestUrl = `${this.buildChunkUrl('manifest.json')}?v=${versionBuster}`
      const response = await fetch(manifestUrl, {
        cache: 'no-store'
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      this.manifest = data
      this.manifestLoadedAt = Date.now()
      this.updateMetadataFromManifest(data)
      return data
    }

    this.manifestPromise = fetchManifest()
      .catch(error => {
        this.manifestPromise = null
        throw error
      })
      .finally(() => {
        this.manifestPromise = null
      })

    return this.manifestPromise
  }

  updateMetadataFromManifest(manifest) {
    if (!manifest || !Array.isArray(manifest.chunks)) {
      return
    }
    manifest.chunks.forEach(chunk => {
      const existing = this.chunkMetadata.get(chunk.name) || {}
      const metadata = {
        ...existing,
        verbs: Array.isArray(chunk.lemmas) ? chunk.lemmas : existing.verbs || [],
        priority: chunk.priority ?? existing.priority ?? 5,
        description: existing.description || chunk.description || '',
        revision: chunk.revision || existing.revision || manifest.version,
        bytes: chunk.bytes ?? existing.bytes ?? 0,
        hash: chunk.hash ?? existing.hash ?? null,
        lastUpdated: manifest.generatedAt || new Date().toISOString(),
        lastAccess: existing.lastAccess || 0
      }
      this.chunkMetadata.set(chunk.name, metadata)
    })

    // Mantener metadata existente pero limpiar índice para chunks actualizados
    this.verbIndex.clear()
    this.buildVerbIndex()
  }

  buildChunkUrl(resource) {
    const base = this.chunkBaseUrl || '/'
    if (base === '/' || base === './') {
      return `/chunks/${resource}`
    }
    const normalized = base.endsWith('/') ? base.slice(0, -1) : base
    return `${normalized}/chunks/${resource}`
  }
  
  async ensureVerbsLoaded(verbLemmas) {
    const startTime = performance.now()
    const requiredChunks = new Set()
    
    // Determinar qué chunks necesitamos
    verbLemmas.forEach(lemma => {
      const chunkName = this.getChunkForVerb(lemma)
      if (chunkName && !this.loadedChunks.has(chunkName)) {
        requiredChunks.add(chunkName)
      }
    })
    
    // Cargar chunks necesarios en paralelo
    const loadPromises = Array.from(requiredChunks).map(chunkName => 
      this.loadChunk(chunkName)
    )
    
    await Promise.all(loadPromises)
    
    this.stats.totalLoadTime += performance.now() - startTime
    return this.getVerbsFromLemmas(verbLemmas)
  }
  
  async loadChunk(chunkName) {
    // Si ya está cargado, retornar inmediatamente
    if (this.loadedChunks.has(chunkName)) {
      this.stats.cacheHits++
      const metadata = this.chunkMetadata.get(chunkName)
      if (metadata) {
        metadata.lastAccess = Date.now()
      }
      return this.loadedChunks.get(chunkName)
    }

    // Si ya está cargándose, esperar la promesa existente
    if (this.loadingPromises.has(chunkName)) {
      return this.loadingPromises.get(chunkName)
    }

    if (this.fetchAvailable) {
      try {
        await this.ensureManifest()
      } catch (error) {
        console.warn('No se pudo actualizar manifest antes de cargar chunk:', error)
      }
    }

    this.stats.cacheMisses++

    // Crear nueva promesa de carga
    const loadPromise = this.performChunkLoad(chunkName)
    this.loadingPromises.set(chunkName, loadPromise)

    try {
      const verbs = await loadPromise
      this.loadedChunks.set(chunkName, verbs)
      this.stats.chunksLoaded++
      const metadata = this.chunkMetadata.get(chunkName)
      if (metadata) {
        metadata.lastAccess = Date.now()
      }
      return verbs
    } finally {
      this.loadingPromises.delete(chunkName)
    }
  }
  
  async performChunkLoad(chunkName) {
    if (this.fetchAvailable) {
      try {
        const manifest = await this.ensureManifest()
        const chunkInfo = manifest?.chunks?.find(entry => entry.name === chunkName)
        if (!chunkInfo) {
          console.warn(`Manifest no contiene información para el chunk ${chunkName}`)
        } else {
          const revision = encodeURIComponent(chunkInfo.revision || manifest.version || Date.now())
          const chunkUrl = `${this.buildChunkUrl(`${chunkName}.json`)}?v=${revision}`
          const response = await fetch(chunkUrl, {
            cache: 'no-store'
          })
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          const verbs = await response.json()
          const metadata = this.chunkMetadata.get(chunkName) || {}
          metadata.verbs = Array.isArray(chunkInfo.lemmas) ? chunkInfo.lemmas : metadata.verbs || []
          metadata.priority = chunkInfo.priority ?? metadata.priority ?? 5
          metadata.bytes = chunkInfo.bytes ?? metadata.bytes ?? 0
          metadata.hash = chunkInfo.hash ?? metadata.hash ?? null
          metadata.revision = chunkInfo.revision || metadata.revision || manifest.version
          metadata.lastUpdated = manifest.generatedAt || new Date().toISOString()
          metadata.lastAccess = Date.now()
          this.chunkMetadata.set(chunkName, metadata)
          this.buildVerbIndex()
          return verbs
        }
      } catch (error) {
        console.warn(`Carga dinámica de chunk ${chunkName} falló, usando fallback local:`, error)
        this.handleChunkFailure(chunkName, error)
      }
    }

    try {
      // Usar importación dinámica para cargar chunks legacy (cuando existen)
      const module = await import(`../../data/chunks/${chunkName}.js`)
      return module.verbs || module.default
    } catch (error) {
      console.warn(`Failed to load chunk ${chunkName} desde bundle legacy:`, error)
      // Fallback: cargar desde el archivo principal si el chunk no existe
      return this.loadFromMainFile(chunkName)
    }
  }
  
  async loadFromMainFile(chunkName) {
    // Fallback: cargar todos los verbos y filtrar
    const { verbs } = await import('../../data/verbs.js')
    const metadata = this.chunkMetadata.get(chunkName)

    if (!metadata) {
      console.warn(`No metadata found for chunk ${chunkName}`)
      return []
    }

    // Enhanced fallback: if metadata.verbs is empty (common when manifest fails),
    // derive verbs dynamically based on chunk type
    if (metadata.verbs.length === 0) {
      console.log(`🔄 Empty metadata for chunk ${chunkName}, deriving verbs dynamically`)

      if (chunkName === 'irregulars') {
        // For irregulars chunk: identify irregular verbs using categorizeVerb
        // BUT prioritize common/frequent irregulars for theme practice

        // Get core and common verb lists for frequency filtering
        const coreVerbs = new Set(this.chunkMetadata.get('core')?.verbs || [])
        const commonVerbs = new Set(this.chunkMetadata.get('common')?.verbs || [])

        // Common irregular verbs for theme practice (B1 level appropriate)
        const commonIrregularVerbs = new Set([
          // From core/common chunks that are irregular
          'ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber',
          'querer', 'poner', 'parecer', 'creer', 'seguir', 'venir', 'pensar', 'salir', 'volver',
          'conocer', 'vivir', 'sentir', 'empezar',
          // Common irregular verbs for third-person families
          'dormir', 'morir', 'pedir', 'servir', 'repetir', 'preferir', 'mentir', 'competir',
          'leer', 'construir', 'destruir', 'huir', 'incluir', 'concluir',
          // Orthographic changes (common)
          'buscar', 'sacar', 'tocar', 'llegar', 'pagar', 'jugar', 'almorzar', 'organizar'
        ])

        // Load priority verbs for extended coverage
        let priorityVerbLemmas = new Set()
        try {
          const { priorityVerbs } = await import('../../data/priorityVerbs.js')
          priorityVerbLemmas = new Set(priorityVerbs.map(v => v.lemma))
        } catch (error) {
          console.warn('Could not load priorityVerbs for frequency filtering:', error)
        }

        const irregularVerbs = verbs.filter(verb => {
          // First check if verb has explicit type marking
          let isIrregular = false
          if (verb.type === 'irregular') {
            isIrregular = true
          } else {
            // If no explicit type, use categorizeVerb to detect irregularity
            try {
              const families = categorizeVerb(verb.lemma, verb)
              isIrregular = families.length > 0 // Has irregular families
            } catch (error) {
              console.warn(`Failed to categorize verb ${verb.lemma}:`, error)
              return false
            }
          }

          if (!isIrregular) return false

          // Priority filtering for theme practice (B1 level)
          return commonIrregularVerbs.has(verb.lemma) ||    // High-frequency irregulars
                 coreVerbs.has(verb.lemma) ||              // Core verbs
                 commonVerbs.has(verb.lemma) ||            // Common verbs
                 priorityVerbLemmas.has(verb.lemma)        // Priority verbs
        })

        console.log(`📊 Derived ${irregularVerbs.length} irregular verbs dynamically (prioritizing frequency)`)
        return irregularVerbs
      }

      if (chunkName === 'advanced') {
        // For advanced chunk: include remaining verbs not in core/common/irregulars
        const coreVerbs = new Set(this.chunkMetadata.get('core')?.verbs || [])
        const commonVerbs = new Set(this.chunkMetadata.get('common')?.verbs || [])

        const advancedVerbs = verbs.filter(verb => {
          if (coreVerbs.has(verb.lemma) || commonVerbs.has(verb.lemma)) {
            return false
          }
          // Don't include obvious irregulars in advanced (they should be in irregulars)
          try {
            const families = categorizeVerb(verb.lemma, verb)
            return families.length === 0 // Regular verbs or minor irregularities
          } catch (error) {
            return true // Include by default if categorization fails
          }
        })

        console.log(`📊 Derived ${advancedVerbs.length} advanced verbs dynamically`)
        return advancedVerbs
      }

      // For other chunks with empty metadata, return empty array
      console.warn(`Cannot derive verbs for unknown chunk type: ${chunkName}`)
      return []
    }

    // Standard path: filter by predefined lemmas in metadata
    const chunkVerbs = verbs.filter(verb =>
      metadata.verbs.includes(verb.lemma)
    )

    return chunkVerbs
  }
  
  getChunkForVerb(lemma) {
    // Buscar en índice primero
    if (this.verbIndex.has(lemma)) {
      return this.verbIndex.get(lemma)
    }
    
    // Para verbos no catalogados, usar heurística
    // Verbos cortos y comunes van a 'common'
    // Verbos raros van a 'advanced'
    if (lemma.length <= 5) {
      return 'common'
    }
    
    return 'advanced'
  }
  
  getVerbsFromLemmas(lemmas) {
    const result = []
    
    lemmas.forEach(lemma => {
      const chunkName = this.getChunkForVerb(lemma)
      const chunk = this.loadedChunks.get(chunkName)
      
      if (chunk) {
        const verb = chunk.find(v => v.lemma === lemma)
        if (verb) {
          result.push(verb)
        }
      }
    })
    
    return result
  }
  
  // Pre-carga inteligente basada en configuración de usuario
  async preloadByUserSettings(settings) {
    const chunksToPreload = ['core'] // Siempre precargar core
    
    // Basado en nivel del usuario
    if (settings.level) {
      if (['A1', 'A2'].includes(settings.level)) {
        chunksToPreload.push('common')
      }
      if (['B1', 'B2', 'C1', 'C2'].includes(settings.level)) {
        chunksToPreload.push('irregulars')
      }
    }
    
    // Basado en tipo de práctica preferido
    if (settings.verbType === 'irregular') {
      chunksToPreload.push('irregulars')
    }
    
    // Precargar en background
    this.preloadQueue = chunksToPreload
    this.performBackgroundPreload()
  }
  
  async performBackgroundPreload() {
    // Usar requestIdleCallback si está disponible
    const preload = async () => {
      while (this.preloadQueue.length > 0) {
        const chunkName = this.preloadQueue.shift()
        await this.loadChunk(chunkName)
        
        // Yield control para evitar bloquear UI
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }
    
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(preload)
    } else {
      setTimeout(preload, 100)
    }
  }
  
  // API para obtener estadísticas de rendimiento
  getStats() {
    const totalRequests = this.stats.cacheHits + this.stats.cacheMisses
    const hitRate = totalRequests > 0 ? (this.stats.cacheHits / totalRequests * 100).toFixed(1) : 0
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      loadedChunks: Array.from(this.loadedChunks.keys()),
      averageLoadTime: this.stats.chunksLoaded > 0 
        ? (this.stats.totalLoadTime / this.stats.chunksLoaded).toFixed(2) 
        : 0
    }
  }

  handleChunkFailure(chunkName, error) {
    console.warn(`Registrando fallo en chunk ${chunkName}:`, error?.message || error)
    // Forzar nueva carga de manifest en el siguiente intento
    this.manifestLoadedAt = 0
  }
  
  // Limpieza de memoria - descargar chunks menos usados
  cleanup() {
    const now = Date.now()
    const TTL = 5 * 60 * 1000 // 5 minutos
    
    this.loadedChunks.forEach((verbs, chunkName) => {
      const metadata = this.chunkMetadata.get(chunkName)
      
      // No descargar chunks de alta prioridad
      if (metadata && metadata.priority <= 2) {
        return
      }
      
      // Descargar si no se ha usado recientemente
      const lastAccess = metadata?.lastAccess || 0
      if (now - lastAccess > TTL) {
        this.loadedChunks.delete(chunkName)
        console.log(`Unloaded chunk: ${chunkName}`)
      }
    })
  }
  
  // API de conveniencia para compatibilidad con código existente
  async getAllVerbs() {
    try {
      // Cargar todos los chunks si es necesario (fallback)
      const allChunkNames = Array.from(this.chunkMetadata.keys())
      await Promise.all(allChunkNames.map(name => this.loadChunk(name)))

      const allVerbs = []
      this.loadedChunks.forEach(verbs => {
        allVerbs.push(...verbs)
      })

      if (allVerbs.length > 0) {
        return allVerbs
      }
    } catch (error) {
      console.warn('getAllVerbs: Chunk loading failed, using main file fallback:', error)
    }

    // FAILSAFE: If chunks completely fail, load from main verbs file
    try {
      const { verbs: allVerbs } = await import('../../data/verbs.js')
      console.log('🚨 getAllVerbs: Successfully loaded from main verbs file as fallback')
      return allVerbs
    } catch (fallbackError) {
      console.error('💀 CRITICAL: getAllVerbs main file fallback also failed:', fallbackError)
      throw new Error('CRITICAL: All verb loading methods failed in getAllVerbs')
    }
  }

  /**
   * Robust failsafe method that guarantees verb loading
   * Uses multiple fallback strategies with timeout protection
   * @param {Array} preferredChunks - Chunks to try loading first
   * @param {number} maxAttempts - Maximum retry attempts per strategy
   * @param {number} timeoutMs - Timeout for each strategy
   * @returns {Array} - Array of verbs (guaranteed to have content)
   */
  async getVerbsWithRobustFailsafe(preferredChunks = ['core'], maxAttempts = 2, timeoutMs = 3000) {
    const strategies = [
      // Strategy 1: Try preferred chunks
      async () => {
        console.log('🔄 Strategy 1: Loading preferred chunks:', preferredChunks)
        const verbs = []
        for (const chunkName of preferredChunks) {
          try {
            await this.loadChunk(chunkName)
            const chunkVerbs = this.loadedChunks.get(chunkName) || []
            verbs.push(...chunkVerbs)
          } catch (error) {
            console.warn(`Failed to load preferred chunk ${chunkName}:`, error)
          }
        }
        return verbs
      },

      // Strategy 2: Try all chunks
      async () => {
        console.log('🔄 Strategy 2: Loading all available chunks')
        return await this.getAllVerbs()
      },

      // Strategy 3: Emergency fallback to main file
      async () => {
        console.log('🚨 Strategy 3: Emergency fallback to main verbs file')
        const { verbs: allVerbs } = await import('../../data/verbs.js')
        return allVerbs
      },

      // Strategy 4: Minimal essential verbs (absolute last resort)
      async () => {
        console.log('💀 Strategy 4: Loading minimal essential verbs')
        const essentialLemmas = ['ser', 'estar', 'haber', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber']
        try {
          const { verbs: allVerbs } = await import('../../data/verbs.js')
          return allVerbs.filter(verb => essentialLemmas.includes(verb.lemma))
        } catch {
          // Absolute fallback: hardcoded minimal verb structure
          return essentialLemmas.map(lemma => ({
            lemma,
            paradigms: [{
              regionTags: ['la_general', 'rioplatense', 'peninsular'],
              forms: [{ mood: 'indicative', tense: 'pres', person: '1s', value: lemma === 'ser' ? 'soy' : lemma }]
            }]
          }))
        }
      }
    ]

    for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`🎯 Trying strategy ${strategyIndex + 1}, attempt ${attempt}`)

          // Wrap strategy execution with timeout
          const strategyPromise = strategies[strategyIndex]()
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Strategy timeout')), timeoutMs)
          )

          const verbs = await Promise.race([strategyPromise, timeoutPromise])

          if (verbs && verbs.length > 0) {
            console.log(`✅ Strategy ${strategyIndex + 1} succeeded with ${verbs.length} verbs`)
            return verbs
          }
        } catch (error) {
          console.warn(`Strategy ${strategyIndex + 1}, attempt ${attempt} failed:`, error.message)

          // If it's the last attempt of the last strategy, prepare for critical failure
          if (strategyIndex === strategies.length - 1 && attempt === maxAttempts) {
            console.error('💀 CRITICAL: All failsafe strategies exhausted')

            // Auto-disable chunks if they keep failing
            try {
              const { useSettings } = await import('../../state/settings.js')
              const store = useSettings.getState()
              if (store.enableChunks) {
                console.log('🔧 Auto-disabling chunks due to repeated failures')
                store.set({
                  enableChunks: false,
                  chunksFailsafeActivated: true,
                  chunksFailsafeCount: (store.chunksFailsafeCount || 0) + 1
                })
              }
            } catch {
              // Settings update failed, but continue
            }

            throw new Error('CRITICAL: All verb loading strategies failed - application cannot continue')
          }

          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100 * attempt))
        }
      }
    }
  }

  // Para práctica por tema: cargar verbos basado en familias irregulares o temas específicos
  async getVerbsByTheme(theme, irregularFamilies = []) {
    const relevantChunks = new Set(['core']) // Siempre incluir core

    // Si se especificaron familias irregulares, incluir chunk de irregulares
    if (irregularFamilies.length > 0) {
      relevantChunks.add('irregulars')
    }

    // Para temas específicos, incluir chunks relevantes
    switch (theme) {
      case 'basic':
      case 'frequent':
        relevantChunks.add('common')
        break
      case 'advanced':
      case 'literary':
        relevantChunks.add('advanced')
        break
      case 'irregular':
      case 'PRETERITE_THIRD_PERSON': // Explicit support for third-person irregular theme
        relevantChunks.add('irregulars')
        break
      default:
        // Para temas desconocidos, cargar common como fallback
        relevantChunks.add('common')
    }

    // Cargar chunks relevantes
    await Promise.all(Array.from(relevantChunks).map(chunk => this.loadChunk(chunk)))

    const themeVerbs = []
    relevantChunks.forEach(chunkName => {
      const chunk = this.loadedChunks.get(chunkName)
      if (chunk) {
        themeVerbs.push(...chunk)
      }
    })

    // Enhanced fallback: if no verbs found, try robust failsafe
    if (themeVerbs.length === 0) {
      console.warn(`🚨 getVerbsByTheme returned 0 verbs for theme "${theme}", activating failsafe`)
      try {
        const failsafeVerbs = await this.getVerbsWithRobustFailsafe(Array.from(relevantChunks))
        console.log(`📊 Failsafe recovered ${failsafeVerbs.length} verbs for theme "${theme}"`)
        return failsafeVerbs
      } catch (error) {
        console.error(`💀 Theme failsafe also failed for "${theme}":`, error)
        return []
      }
    }

    return themeVerbs
  }
  
  // Fallback rápido: si no encuentra verbos específicos, cargar desde archivo principal
  async getVerbsWithFallback(lemmas, maxWaitTime = 2000) {
    try {
      // Intentar cargar con timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), maxWaitTime)
      )
      
      const loadPromise = this.ensureVerbsLoaded(lemmas)
      const verbs = await Promise.race([loadPromise, timeoutPromise])
      
      if (verbs.length > 0) {
        return verbs
      }
    } catch (error) {
      console.warn('Chunk loading timed out or failed, using fallback:', error.message)
    }
    
    // Fallback: cargar desde archivo principal directamente
    try {
      const { verbs: allVerbs } = await import('../../data/verbs.js')
      return allVerbs.filter(verb => lemmas.includes(verb.lemma))
    } catch (fallbackError) {
      console.error('Fallback loading failed:', fallbackError)
      return []
    }
  }
  
  async getVerbByLemma(lemma) {
    const verbs = await this.ensureVerbsLoaded([lemma])
    return verbs.find(verb => verb.lemma === lemma)
  }
}

// Singleton instance
const verbChunkManager = new VerbChunkManager()

// Inicialización con configuración por defecto
verbChunkManager.preloadByUserSettings({ level: 'A1', verbType: 'mixed' })

// Limpieza periódica (solo en navegador)
if (typeof window !== 'undefined') {
  setInterval(() => verbChunkManager.cleanup(), 5 * 60 * 1000) // cada 5 minutos
}

export { verbChunkManager, VerbChunkManager }
