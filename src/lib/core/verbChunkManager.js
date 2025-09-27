// Sistema de gestión de chunks de verbos con carga dinámica
// Optimiza el bundle inicial cargando verbos bajo demanda

// Import for irregular verb categorization when metadata is missing
import { categorizeVerb } from '../data/irregularFamilies.js'
import { expandSimplifiedGroup } from '../data/simplifiedFamilyGroups.js'

const MIN_CHUNK_COVERAGE = 0.9

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
    this.chunkHealth = {
      status: 'healthy',
      lowCoverage: new Map(),
      failures: 0,
      lastFailureAt: 0,
      recoveryTimer: null,
      recoveryBackoffMs: 1000
    }
    this.supplementalCache = new Map()
    this.globalFallbackVerbs = null
    this.manifest = null
    this.manifestPromise = null
    this.manifestLoadedAt = 0
    this.manifestTTL = 60 * 1000 // refresh manifest cada minuto para datos dinámicos
    this.refreshTimer = null
    this.fetchAvailable = typeof window !== 'undefined' && typeof window.fetch === 'function'
    this.chunkBaseUrl = '/'
    if (typeof import.meta !== 'undefined' && import.meta?.vitest) {
      this.fetchAvailable = false
    }
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
    const manifestTask = (async () => {
      try {
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
      } catch (error) {
        console.warn('No se pudo cargar el manifest de chunks, usando metadata estática:', error)
        // Mantener metadata existente y continuar sin manifest
        return null
      } finally {
        this.manifestPromise = null
      }
    })()

    this.manifestPromise = manifestTask
    return manifestTask
  }

  updateMetadataFromManifest(manifest) {
    if (!manifest || !Array.isArray(manifest.chunks)) {
      return
    }
    manifest.chunks.forEach(chunk => {
      const existing = this.chunkMetadata.get(chunk.name) || {}
      const expectedCount = chunk.expectedCount ?? existing.expectedCount ?? (Array.isArray(existing.verbs) ? existing.verbs.length : 0)
      const lemmaCount = Array.isArray(chunk.lemmas) ? chunk.lemmas.length : (existing.verbs?.length ?? 0)
      const coverageRatio = expectedCount > 0 ? lemmaCount / expectedCount : 1
      const metadata = {
        ...existing,
        verbs: Array.isArray(chunk.lemmas) ? chunk.lemmas : existing.verbs || [],
        priority: chunk.priority ?? existing.priority ?? 5,
        description: existing.description || chunk.description || '',
        revision: chunk.revision || existing.revision || manifest.version,
        bytes: chunk.bytes ?? existing.bytes ?? 0,
        hash: chunk.hash ?? existing.hash ?? null,
        lastUpdated: manifest.generatedAt || new Date().toISOString(),
        lastAccess: existing.lastAccess || 0,
        expectedCount,
        coverage: Number.isFinite(coverageRatio) ? coverageRatio : 1
      }
      this.chunkMetadata.set(chunk.name, metadata)

      if (metadata.expectedCount > 0 && metadata.coverage < MIN_CHUNK_COVERAGE) {
        this.chunkHealth.lowCoverage.set(chunk.name, {
          expected: metadata.expectedCount,
          actual: metadata.verbs.length,
          coverage: metadata.coverage,
          flaggedAt: Date.now()
        })
        console.warn(`⚠️  Chunk ${chunk.name} coverage ${(metadata.coverage * 100).toFixed(1)}% below threshold; supplementing with fallback data`)
        this.ensureGlobalFallbackVerbs().catch(error => {
          console.warn('Failed to warm global fallback verbs:', error)
        })
      } else {
        this.chunkHealth.lowCoverage.delete(chunk.name)
      }
    })

    // Mantener metadata existente pero limpiar índice para chunks actualizados
    this.verbIndex.clear()
    this.buildVerbIndex()
  }

  buildChunkUrl(resource) {
    const base = this.chunkBaseUrl || '/'
    try {
      if (typeof window !== 'undefined' && window.location) {
        const origin = window.location.origin || 'http://localhost'
        const basePath = base.startsWith('http')
          ? base
          : `${origin}${base.startsWith('/') ? base : `/${base}`}`
        const normalizedBase = basePath.endsWith('/') ? basePath : `${basePath}/`
        return new URL(`chunks/${resource}`, normalizedBase).toString()
      }
    } catch {
      // Ignorar y usar fallback relativo/absoluto
    }

    if (base.startsWith('http')) {
      const normalized = base.endsWith('/') ? base : `${base}/`
      return `${normalized}chunks/${resource}`
    }

    return `/chunks/${resource}`
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

    // Get verbs from loaded chunks
    const verbs = this.getVerbsFromLemmas(verbLemmas)

    // Check for missing lemmas and apply fallback
    const foundLemmas = new Set(verbs.map(verb => verb.lemma))
    const missingLemmas = verbLemmas.filter(lemma => !foundLemmas.has(lemma))

    if (missingLemmas.length > 0) {
      console.log(`🔄 Chunk fallback: ${missingLemmas.length} missing lemmas [${missingLemmas.slice(0, 3).join(', ')}${missingLemmas.length > 3 ? '...' : ''}]`)

      try {
        const fallbackVerbs = await this.loadMissingLemmasFromMainStore(missingLemmas)
        verbs.push(...fallbackVerbs)

        // Update chunks and index with fallback verbs
        fallbackVerbs.forEach(verb => {
          const chunkName = this.getChunkForVerb(verb.lemma)
          let chunk = this.loadedChunks.get(chunkName)
          if (!chunk) {
            chunk = []
            this.loadedChunks.set(chunkName, chunk)
          }

          // Add to chunk with fallback marker
          const existingIndex = chunk.findIndex(v => v.lemma === verb.lemma)
          if (existingIndex === -1) {
            chunk.push({ ...verb, _source: 'fallback' })
          }

          // Update index
          this.verbIndex.set(verb.lemma, chunkName)
        })

        console.log(`✅ Recovered ${fallbackVerbs.length} verbs from main store`)
      } catch (error) {
        console.warn(`❌ Fallback failed for missing lemmas:`, error)
      }
    }

    this.stats.totalLoadTime += performance.now() - startTime
    return verbs
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

  async ensureGlobalFallbackVerbs() {
    if (Array.isArray(this.globalFallbackVerbs) && this.globalFallbackVerbs.length > 0) {
      return this.globalFallbackVerbs
    }
    try {
      const { verbs } = await import('../../data/verbs.js')
      this.globalFallbackVerbs = Array.isArray(verbs) ? verbs : []
    } catch (error) {
      console.warn('Failed to load global fallback verbs:', error)
      this.globalFallbackVerbs = []
    }
    return this.globalFallbackVerbs
  }

  async handleCriticalFailure(reason) {
    this.chunkHealth.status = 'degraded'
    this.chunkHealth.lastFailureAt = Date.now()
    this.chunkHealth.failures += 1

    try {
      const { useSettings } = await import('../../state/settings.js')
      const store = useSettings.getState()
      const failureMessage = typeof reason === 'string' ? reason : reason?.message || 'Unknown chunk failure'
      store.set({
        enableChunks: false,
        chunksFailsafeActivated: true,
        chunksFailsafeCount: (store.chunksFailsafeCount || 0) + 1,
        chunksRecoveryScheduledAt: new Date().toISOString(),
        lastChunkFailureReason: failureMessage
      })
    } catch (error) {
      console.warn('Failed to update settings store after chunk failure:', error)
    }

    this.scheduleRecoveryAttempt()
  }

  scheduleRecoveryAttempt() {
    if (this.chunkHealth.recoveryTimer) {
      return
    }

    const delay = Math.min(this.chunkHealth.recoveryBackoffMs, 5 * 60 * 1000)
    this.chunkHealth.status = 'recovering'
    this.chunkHealth.recoveryTimer = setTimeout(() => {
      this.attemptRecovery().catch(error => {
        console.warn('Chunk recovery attempt failed:', error)
        this.chunkHealth.status = 'degraded'
        this.scheduleRecoveryAttempt()
      })
    }, delay)

    // Exponential backoff up to 5 minutes
    this.chunkHealth.recoveryBackoffMs = Math.min(this.chunkHealth.recoveryBackoffMs * 2, 5 * 60 * 1000)
  }

  async attemptRecovery() {
    this.chunkHealth.recoveryTimer = null
    try {
      await this.ensureManifest(true)
      await this.loadChunk('core')
      await this.loadChunk('common')
      this.chunkHealth.status = 'healthy'
      this.chunkHealth.failures = 0
      this.chunkHealth.recoveryBackoffMs = 1000

      try {
        const { useSettings } = await import('../../state/settings.js')
        const store = useSettings.getState()
        store.set({
          enableChunks: true,
          chunksFailsafeActivated: false,
          chunksRecoveryScheduledAt: null,
          lastChunkFailureReason: null
        })
      } catch (error) {
        console.warn('Failed to update settings store after successful recovery:', error)
      }

      console.log('✅ Chunk system recovered and re-enabled after failsafe')
    } catch (error) {
      console.warn('Chunk recovery attempt could not restore the system yet:', error)
      throw error
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

          // Check if chunk is undersized and supplement if needed
          const supplementedVerbs = await this.checkAndSupplementChunk(chunkName, verbs, metadata)
          return supplementedVerbs
        }
      } catch (error) {
        console.warn(`Carga dinámica de chunk ${chunkName} falló, usando fallback local:`, error)
        this.handleChunkFailure(chunkName, error)
      }
    }

    try {
      // Usar importación dinámica para cargar chunks legacy (cuando existen)
      // Vite requires static imports, so we use a more compatible approach
      const chunkPath = new URL(`../../data/chunks/${chunkName}.js`, import.meta.url).href
      const module = await import(/* @vite-ignore */ chunkPath)
      return module.verbs || module.default
    } catch (error) {
      console.warn(`Failed to load chunk ${chunkName} desde bundle legacy:`, error)
      // Fallback: cargar desde el archivo principal si el chunk no existe
      return this.loadFromMainFile(chunkName)
    }
  }
  
  async checkAndSupplementChunk(chunkName, currentVerbs, metadata) {
    const expectedCount = metadata.expectedCount
    const actualCount = currentVerbs.length

    if (!expectedCount || actualCount >= expectedCount) {
      return currentVerbs // Chunk is adequately sized
    }

    const shortage = expectedCount - actualCount
    console.log(`📊 Chunk ${chunkName} is undersized: ${actualCount}/${expectedCount} verbs (${shortage} short)`)

    try {
      const supplementVerbs = await this.supplementChunkFromMainStore(chunkName, shortage, currentVerbs)
      if (supplementVerbs.length > 0) {
        console.log(`✅ Supplemented ${chunkName} with ${supplementVerbs.length} additional verbs`)

        // Update the chunk data
        const combinedVerbs = [...currentVerbs, ...supplementVerbs]
        this.loadedChunks.set(chunkName, combinedVerbs)

        // Update metadata
        metadata.verbs = [...(metadata.verbs || []), ...supplementVerbs.map(v => v.lemma)]
        metadata.supplementedAt = new Date().toISOString()
        metadata.supplementCount = supplementVerbs.length
        this.chunkMetadata.set(chunkName, metadata)

        // Rebuild index to include new verbs
        this.buildVerbIndex()

        return combinedVerbs
      }
    } catch (error) {
      console.warn(`Failed to supplement chunk ${chunkName}:`, error)
    }

    return currentVerbs
  }

  async supplementChunkFromMainStore(chunkName, targetCount, existingVerbs) {
    try {
      const verbs = await this.ensureGlobalFallbackVerbs()

      // Get existing lemmas to avoid duplicates
      const existingLemmas = new Set(existingVerbs.map(v => v.lemma))

      // Load categorization function for intelligent supplementation
      let categorizeVerb
      try {
        const irregularModule = await import('../data/irregularFamilies.js')
        categorizeVerb = irregularModule.categorizeVerb
      } catch (error) {
        console.warn('Could not load categorizeVerb for supplementation:', error)
      }

      // Load frequency function
      let determineVerbFrequency
      try {
        const verbInitModule = await import('../progress/verbInitialization.js')
        determineVerbFrequency = verbInitModule.determineVerbFrequency
      } catch (error) {
        console.warn('Could not load determineVerbFrequency for supplementation:', error)
      }

      // Filter candidates based on chunk type
      const candidates = verbs.filter(verb => {
        if (existingLemmas.has(verb.lemma)) return false

        switch (chunkName) {
          case 'core': {
            // Add high-frequency regular verbs
            const frequency = determineVerbFrequency ? determineVerbFrequency(verb.lemma) : 'medium'
            const isIrregular = categorizeVerb ? (categorizeVerb(verb.lemma, verb)?.length > 0) : false
            return frequency === 'high' && !isIrregular
          }

          case 'common': {
            // Add medium-frequency regular verbs
            const medFreq = determineVerbFrequency ? determineVerbFrequency(verb.lemma) : 'medium'
            const isIrregularCommon = categorizeVerb ? (categorizeVerb(verb.lemma, verb)?.length > 0) : false
            return medFreq === 'medium' && !isIrregularCommon
          }

          case 'irregulars': {
            // Add irregular verbs that weren't included
            if (categorizeVerb) {
              try {
                const families = categorizeVerb(verb.lemma, verb)
                return families.length > 0
              } catch {
                return verb.type === 'irregular'
              }
            }
            return verb.type === 'irregular'
          }

          case 'advanced': {
            // Add any remaining regular verbs
            const isIrregularAdv = categorizeVerb ? (categorizeVerb(verb.lemma, verb)?.length > 0) : false
            return !isIrregularAdv
          }

          default:
            return true
        }
      })

      // Sort candidates by priority (frequency, length, alphabetical)
      const sortedCandidates = candidates.sort((a, b) => {
        if (determineVerbFrequency) {
          const aFreq = determineVerbFrequency(a.lemma)
          const bFreq = determineVerbFrequency(b.lemma)
          const freqOrder = { high: 1, medium: 2, low: 3 }
          const aOrder = freqOrder[aFreq] || 3
          const bOrder = freqOrder[bFreq] || 3
          if (aOrder !== bOrder) return aOrder - bOrder
        }

        // Prefer shorter verbs (often more common)
        if (a.lemma.length !== b.lemma.length) {
          return a.lemma.length - b.lemma.length
        }

        return a.lemma.localeCompare(b.lemma)
      })

      // Take up to targetCount verbs
      const supplementVerbs = sortedCandidates.slice(0, targetCount).map(verb => ({
        ...verb,
        _source: 'supplement',
        _supplementedAt: new Date().toISOString()
      }))

      console.log(`📈 Selected ${supplementVerbs.length} supplement verbs for ${chunkName}: [${supplementVerbs.slice(0, 3).map(v => v.lemma).join(', ')}${supplementVerbs.length > 3 ? '...' : ''}]`)

      return supplementVerbs

    } catch (error) {
      console.error(`Failed to supplement chunk ${chunkName} from main store:`, error)
      return []
    }
  }

  async loadMissingLemmasFromMainStore(missingLemmas) {
    try {
      const allVerbs = await this.ensureGlobalFallbackVerbs()
      const foundVerbs = Array.isArray(allVerbs)
        ? allVerbs.filter(verb => missingLemmas.includes(verb.lemma))
        : []

      // If we didn't find all verbs, try priority verbs
      const stillMissing = missingLemmas.filter(lemma =>
        !foundVerbs.some(verb => verb.lemma === lemma)
      )

      if (stillMissing.length > 0) {
        try {
          const { priorityVerbs } = await import('../../data/priorityVerbs.js')
          const priorityFound = priorityVerbs.filter(verb =>
            stillMissing.includes(verb.lemma)
          )
          foundVerbs.push(...priorityFound)
        } catch (error) {
          console.warn('Could not load priority verbs for fallback:', error)
        }
      }

      return foundVerbs
    } catch (error) {
      console.error('Critical: Failed to load verbs from fallback dataset:', error)
      return []
    }
  }

  async loadFromMainFile(chunkName) {
    // Fallback: cargar todos los verbos y filtrar
    const verbs = await this.ensureGlobalFallbackVerbs()
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
          } catch {
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
    const notFound = []

    lemmas.forEach(lemma => {
      const chunkName = this.getChunkForVerb(lemma)
      const chunk = this.loadedChunks.get(chunkName)

      if (chunk) {
        const verb = chunk.find(v => v.lemma === lemma)
        if (verb) {
          result.push(verb)
        } else {
          notFound.push(lemma)
        }
      } else {
        notFound.push(lemma)
      }
    })

    // Log missing verbs for debugging
    if (notFound.length > 0) {
      console.warn(`⚠️  getVerbsFromLemmas: ${notFound.length} verbs not found in loaded chunks: [${notFound.slice(0, 3).join(', ')}${notFound.length > 3 ? '...' : ''}]`)
    }

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

  /**
   * Precarga verbos basados en SRS - items debidos y próximos
   * @param {string} userId - ID del usuario
   * @param {Date} currentDate - Fecha actual
   * @param {number} hoursAhead - Horas hacia adelante para incluir
   * @returns {Promise<void>}
   */
  async preloadDueVerbs(userId, currentDate = new Date(), hoursAhead = 24) {
    if (!userId) {
      console.warn('⚠️  preloadDueVerbs: No userId provided, skipping SRS preload')
      return 0
    }

    try {
      // Import SRS module dynamically to avoid circular dependencies
      const { extractDueLemmas } = await import('../progress/srs.js')

      const dueLemmas = await extractDueLemmas(userId, currentDate, hoursAhead)

      if (dueLemmas.length === 0) {
        console.log('📊 SRS: No due lemmas found, skipping preload')
        return 0
      }

      console.log(`🔄 SRS: Preloading ${dueLemmas.length} due verbs into chunks`)
      const startTime = performance.now()

      // Preload all due verbs - this will trigger chunk loading if needed
      await this.ensureVerbsLoaded(dueLemmas)

      const loadTime = performance.now() - startTime
      console.log(`✅ SRS: Preloaded due verbs in ${loadTime.toFixed(2)}ms`)

      // Update stats
      this.stats.srsPreloadCount = (this.stats.srsPreloadCount || 0) + 1
      this.stats.lastSrsPreloadTime = Date.now()
      this.stats.lastSrsPreloadDuration = loadTime
      return dueLemmas.length
    } catch (error) {
      console.error('❌ SRS: Failed to preload due verbs:', error)
      return 0
    }
  }

  /**
   * Error-driven preloading basado en analytics de errores
   * @param {string} userId - ID del usuario
   * @param {number} limitVerbs - Límite de verbos a precargar
   * @returns {Promise<number>} Número de verbos precargados
   */
  async preloadErrorProneVerbs(userId, limitVerbs = 15) {
    if (!userId) {
      console.warn('⚠️  preloadErrorProneVerbs: No userId provided, skipping error-driven preload')
      return 0
    }

    try {
      // Import analytics dynamically to avoid circular dependencies
      const { getErrorIntelligence } = await import('../progress/analytics.js')
      const errorData = await getErrorIntelligence(userId)

      // Extraer verbos de las combinaciones más problemáticas
      const errorProneVerbs = new Set()

      for (const tag of errorData.tags.slice(0, 3)) { // Top 3 error tags
        for (const combo of tag.topCombos) {
          // Buscar verbos que coincidan con mood/tense problemático
          const verbsForCombo = await this.getVerbsForMoodTense(combo.mood, combo.tense)
          verbsForCombo.slice(0, 5).forEach(verb => errorProneVerbs.add(verb))
        }
      }

      // Preload error-prone verbs
      const verbList = Array.from(errorProneVerbs).slice(0, limitVerbs)
      if (verbList.length > 0) {
        console.log(`⚠️ Chunk: Preloading ${verbList.length} error-prone verbs`)
        await this.ensureVerbsLoaded(verbList)
      }

      return verbList.length
    } catch (error) {
      console.warn('Error-driven preloading failed:', error)
      return 0
    }
  }

  /**
   * Mastery-aware preloading para verbos con bajo dominio
   * @param {string} userId - ID del usuario
   * @param {number} threshold - Umbral de mastery (0-100)
   * @param {number} limitVerbs - Límite de verbos a precargar
   * @returns {Promise<number>} Número de verbos precargados
   */
  async preloadLowMasteryVerbs(userId, threshold = 60, limitVerbs = 10) {
    if (!userId) {
      console.warn('⚠️  preloadLowMasteryVerbs: No userId provided, skipping mastery-aware preload')
      return 0
    }

    try {
      // Import mastery calculation
      const { getMasteryByUser } = await import('../progress/database.js')
      const masteryRecords = await getMasteryByUser(userId)

      // Encontrar verbos con bajo mastery
      const lowMasteryVerbs = masteryRecords
        .filter(record => record.score < threshold)
        .sort((a, b) => a.score - b.score) // Menor score primero
        .slice(0, limitVerbs)
        .map(record => record.lemma)
        .filter(lemma => lemma) // Remove undefined

      if (lowMasteryVerbs.length > 0) {
        console.log(`📈 Chunk: Preloading ${lowMasteryVerbs.length} low-mastery verbs`)
        await this.ensureVerbsLoaded(lowMasteryVerbs)
      }

      return lowMasteryVerbs.length
    } catch (error) {
      console.warn('Mastery-aware preloading failed:', error)
      return 0
    }
  }

  /**
   * Precarga inteligente que combina configuración del usuario, SRS, errores y mastery
   * @param {Object} settings - Configuración del usuario
   * @param {string} userId - ID del usuario (opcional)
   * @returns {Promise<Object>} Estadísticas de precarga
   */
  async smartPreload(settings, userId = null) {
    const results = {
      settingsDriven: 0,
      srsDriven: 0,
      errorDriven: 0,
      masteryDriven: 0,
      totalTime: 0
    }

    const startTime = performance.now()

    try {
      const tasks = []

      // Settings-driven preloading (baja prioridad)
      tasks.push(
        this.preloadByUserSettings(settings).then(() => {
          results.settingsDriven = 1
        })
      )

      if (userId) {
        // SRS-driven preloading (alta prioridad)
        tasks.push(
          this.preloadDueVerbs(userId).then(() => {
            results.srsDriven = 1
          })
        )

        // Error-driven preloading (media prioridad)
        tasks.push(
          this.preloadErrorProneVerbs(userId, 10).then(count => {
            results.errorDriven = count
          })
        )

        // Mastery-aware preloading (media prioridad)
        tasks.push(
          this.preloadLowMasteryVerbs(userId, 50, 8).then(count => {
            results.masteryDriven = count
          })
        )
      }

      // Execute all preloading tasks in parallel
      await Promise.allSettled(tasks)

      results.totalTime = performance.now() - startTime
      console.log(`🎯 Smart preloading completed in ${results.totalTime.toFixed(2)}ms:`, results)

      return results
    } catch (error) {
      console.warn('Smart preloading failed:', error)
      results.totalTime = performance.now() - startTime
      return results
    }
  }

  /**
   * Helper: Obtener verbos para una combinación mood/tense específica
   * @param {string} mood - Mood del verbo
   * @param {string} tense - Tense del verbo
   * @returns {Promise<Array<string>>} Lista de lemmas
   */
  async getVerbsForMoodTense(mood, tense) {
    try {
      // Esta es una implementación simplificada
      // En un sistema completo, esto consultaría la base de datos de verbos
      // filtrada por disponibilidad en mood/tense específico

      // Por ahora, devolvemos algunos verbos comunes que suelen tener esa forma
      const commonVerbs = ['ser', 'estar', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber', 'querer']

      // Filtros específicos por mood/tense problemáticos
      if (mood === 'subjunctive') {
        return ['ser', 'estar', 'haber', 'dar', 'ir', 'saber', 'ver']
      }

      if (tense === 'pretIndef') {
        return ['ser', 'estar', 'tener', 'hacer', 'decir', 'ir', 'dar', 'poder', 'querer', 'venir']
      }

      return commonVerbs
    } catch (error) {
      console.warn('Error getting verbs for mood/tense:', error)
      return []
    }
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

            // Apply frequency filtering if irregulars are included in preferredChunks
            if (preferredChunks.includes('irregulars')) {
              const filteredVerbs = await this.applyFrequencyFilteringToIrregulars(verbs)
              console.log(`📊 Applied failsafe frequency filtering: ${verbs.length} → ${filteredVerbs.length} verbs`)
              return filteredVerbs
            }

            return verbs
          }
        } catch (error) {
          console.warn(`Strategy ${strategyIndex + 1}, attempt ${attempt} failed:`, error.message)

          // If it's the last attempt of the last strategy, prepare for critical failure
          if (strategyIndex === strategies.length - 1 && attempt === maxAttempts) {
            console.error('💀 CRITICAL: All failsafe strategies exhausted')
            await this.handleCriticalFailure(error)
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

    // Filter by specific irregular families if requested
    let filteredVerbs = themeVerbs
    if (irregularFamilies.length > 0) {
      console.log(`🔍 Filtering ${themeVerbs.length} verbs by irregular families: ${irregularFamilies.join(', ')}`)

      filteredVerbs = themeVerbs.filter(verb => {
        try {
          const verbFamilies = categorizeVerb(verb.lemma, verb)

          return irregularFamilies.some(selectedFamily => {
            // Check if it's a simplified group that needs expansion
            const expandedFamilies = expandSimplifiedGroup(selectedFamily)
            if (expandedFamilies.length > 0) {
              // It's a simplified group - check if the verb belongs to ANY of the included families
              return verbFamilies.some(vf => expandedFamilies.includes(vf))
            } else {
              // It's a regular family - check direct match
              return verbFamilies.includes(selectedFamily)
            }
          })
        } catch (error) {
          console.warn(`Failed to categorize verb ${verb.lemma} for family filtering:`, error)
          return false // Exclude verbs that can't be categorized
        }
      })

      console.log(`📊 Family filtering: ${themeVerbs.length} → ${filteredVerbs.length} verbs`)
    }

    // Enhanced fallback: if no verbs found, try robust failsafe
    if (filteredVerbs.length === 0) {
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

    // Apply frequency filtering for ALL irregular verb loading to avoid rare verbs
    // This ensures theme practice always shows B1-appropriate verbs
    if (relevantChunks.has('irregulars')) {
      return this.applyFrequencyFilteringToIrregulars(filteredVerbs)
    }

    return filteredVerbs
  }

  // Apply frequency filtering to irregular verbs for theme practice
  async applyFrequencyFilteringToIrregulars(verbs) {
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

    // Load priority verbs for extended coverage (currently unused for theme practice)
    // let priorityVerbLemmas = new Set()
    // try {
    //   const { priorityVerbs } = await import('../../data/priorityVerbs.js')
    //   priorityVerbLemmas = new Set(priorityVerbs.map(v => v.lemma))
    // } catch {
    //   console.warn('Could not load priorityVerbs for frequency filtering')
    // }

    const filteredVerbs = verbs.filter(verb => {
      // First check if verb is irregular
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
      // For theme practice, be more restrictive - only use truly common verbs
      return commonIrregularVerbs.has(verb.lemma) ||    // High-frequency irregulars
             coreVerbs.has(verb.lemma) ||              // Core verbs (A1)
             commonVerbs.has(verb.lemma)               // Common verbs (A2-B1)
             // NOTE: Intentionally exclude priorityVerbLemmas for theme practice
             // as it includes advanced C1/C2 verbs like "proseguir", "argüir"
    })

    console.log(`📊 Applied frequency filtering: ${verbs.length} → ${filteredVerbs.length} irregular verbs`)
    return filteredVerbs
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
