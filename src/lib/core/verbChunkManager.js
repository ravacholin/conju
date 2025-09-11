// Sistema de gestión de chunks de verbos con carga dinámica
// Optimiza el bundle inicial cargando verbos bajo demanda

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
    
    this.initializeMetadata()
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
      description: 'Verbos más frecuentes A1'
    })
    
    this.chunkMetadata.set('common', {
      verbs: [
        'creer', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar', 'venir',
        'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar',
        'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar'
      ],
      priority: 2,
      size: 250000, // ~250KB
      description: 'Verbos comunes frecuentes'
    })
    
    this.chunkMetadata.set('irregulars', {
      verbs: [], // Se populará dinámicamente con verbos irregulares no incluidos arriba
      priority: 3,
      size: 1200000, // ~1.2MB
      description: 'Verbos irregulares complejos'
    })
    
    this.chunkMetadata.set('advanced', {
      verbs: [], // Resto de verbos
      priority: 4,
      size: 600000, // ~600KB
      description: 'Verbos avanzados y raros'
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
      return this.loadedChunks.get(chunkName)
    }
    
    // Si ya está cargándose, esperar la promesa existente
    if (this.loadingPromises.has(chunkName)) {
      return this.loadingPromises.get(chunkName)
    }
    
    this.stats.cacheMisses++
    
    // Crear nueva promesa de carga
    const loadPromise = this.performChunkLoad(chunkName)
    this.loadingPromises.set(chunkName, loadPromise)
    
    try {
      const verbs = await loadPromise
      this.loadedChunks.set(chunkName, verbs)
      this.stats.chunksLoaded++
      return verbs
    } finally {
      this.loadingPromises.delete(chunkName)
    }
  }
  
  async performChunkLoad(chunkName) {
    try {
      // Usar importación dinámica para cargar chunks
      const module = await import(`../../data/chunks/${chunkName}.js`)
      return module.verbs || module.default
    } catch (error) {
      console.warn(`Failed to load chunk ${chunkName}:`, error)
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
    
    // Filtrar verbos por los lemmas definidos en metadata
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
    // Cargar todos los chunks si es necesario (fallback)
    const allChunkNames = Array.from(this.chunkMetadata.keys())
    await Promise.all(allChunkNames.map(name => this.loadChunk(name)))
    
    const allVerbs = []
    this.loadedChunks.forEach(verbs => {
      allVerbs.push(...verbs)
    })
    
    return allVerbs
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

// Limpieza periódica
setInterval(() => verbChunkManager.cleanup(), 5 * 60 * 1000) // cada 5 minutos

export { verbChunkManager, VerbChunkManager }