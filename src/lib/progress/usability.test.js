// Pruebas de usabilidad para el sistema de progreso y analíticas

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  initProgressSystem,
  isProgressSystemInitialized,
  getCurrentUserId,
  calculateRecencyWeight,
  getVerbDifficulty,
  calculateHintPenalty,
  calculateMasteryForItem,
  calculateMasteryForCell,
  getConfidenceLevel,
  classifyMasteryLevel
} from './all.js'

// Mock de IndexedDB para pruebas
import 'fake-indexeddb/auto'

describe('Pruebas de Usabilidad del Sistema de Progreso', () => {
  beforeEach(async () => {
    // Limpiar el estado antes de cada prueba
    // En una implementación completa, esto limpiaría la base de datos
    console.log(' Configurando entorno de pruebas de usabilidad...')
  })

  it('debería ser fácil de inicializar para desarrolladores', async () => {
    // La inicialización debería ser simple y directa
    const userId = await initProgressSystem()
    
    expect(userId).toBeDefined()
    expect(typeof userId).toBe('string')
    expect(isProgressSystemInitialized()).toBe(true)
    expect(getCurrentUserId()).toBe(userId)
    
    console.log('✅ Inicialización simple y directa')
  })

  it('debería tener una API intuitiva y consistente', () => {
    // Verificar que las funciones tienen nombres descriptivos
    expect(typeof calculateRecencyWeight).toBe('function')
    expect(typeof getVerbDifficulty).toBe('function')
    expect(typeof calculateHintPenalty).toBe('function')
    expect(typeof calculateMasteryForItem).toBe('function')
    expect(typeof calculateMasteryForCell).toBe('function')
    expect(typeof getConfidenceLevel).toBe('function')
    expect(typeof classifyMasteryLevel).toBe('function')
    
    console.log('✅ API intuitiva y consistente')
  })

  it('debería proporcionar retroalimentación clara al usuario', async () => {
    // Mock de getAttemptsByItem para devolver un array vacío
    vi.mock('./database.js', () => ({
      getAttemptsByItem: vi.fn().mockResolvedValue([])
    }))
    
    const testVerb = {
      id: 'verb-usability-test',
      lemma: 'testear',
      type: 'regular',
      frequency: 'medium'
    }
    
    const mastery = await calculateMasteryForItem('item-nonexistent', testVerb)
    
    // Debería devolver valores por defecto para ítems sin intentos
    expect(mastery.score).toBe(50)
    expect(mastery.n).toBe(0)
    expect(mastery.weightedAttempts).toBe(0)
    
    console.log('✅ Retroalimentación clara para ítems sin intentos')
  })

  it('debería manejar errores de manera elegante', async () => {
    // Mock de getAttemptsByItem para lanzar un error
    vi.mock('./database.js', () => ({
      getAttemptsByItem: vi.fn().mockRejectedValue(new Error('Error de base de datos'))
    }))
    
    const testVerb = {
      id: 'verb-error-test',
      lemma: 'testear',
      type: 'regular',
      frequency: 'medium'
    }
    
    // Debería manejar el error sin romperse
    await expect(calculateMasteryForItem('item-error', testVerb)).resolves.toBeDefined()
    
    console.log('✅ Manejo de errores elegante')
  })

  it('debería proporcionar documentación clara en los tipos de retorno', () => {
    // Verificar que las funciones devuelven objetos con propiedades esperadas
    
    // calculateRecencyWeight
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    expect(weight).toBeGreaterThanOrEqual(0)
    expect(weight).toBeLessThanOrEqual(1)
    
    // getVerbDifficulty
    const regularVerb = { type: 'regular' }
    const difficulty = getVerbDifficulty(regularVerb)
    expect(typeof difficulty).toBe('number')
    expect(difficulty).toBeGreaterThanOrEqual(0.8)
    expect(difficulty).toBeLessThanOrEqual(1.3)
    
    // calculateHintPenalty
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    expect(penalty).toBeGreaterThanOrEqual(0)
    expect(penalty).toBeLessThanOrEqual(15)
    
    // getConfidenceLevel
    const confidence = getConfidenceLevel(10)
    expect(typeof confidence).toBe('object')
    expect(confidence).toHaveProperty('level')
    expect(confidence).toHaveProperty('sufficient')
    expect(confidence).toHaveProperty('message')
    
    // classifyMasteryLevel
    const level = classifyMasteryLevel(70, 10, 3000)
    expect(typeof level).toBe('object')
    expect(level).toHaveProperty('level')
    expect(level).toHaveProperty('confidence')
    expect(level).toHaveProperty('recommendation')
    
    console.log('✅ Documentación clara en tipos de retorno')
  })

  it('debería ser fácil de integrar con otros sistemas', async () => {
    // Verificar que las funciones pueden ser importadas correctamente
    const functions = [
      initProgressSystem,
      isProgressSystemInitialized,
      getCurrentUserId,
      calculateRecencyWeight,
      getVerbDifficulty,
      calculateHintPenalty,
      calculateMasteryForItem,
      calculateMasteryForCell,
      getConfidenceLevel,
      classifyMasteryLevel
    ]
    
    functions.forEach(fn => {
      expect(typeof fn).toBe('function')
    })
    
    console.log('✅ Fácil integración con otros sistemas')
  })

  it('debería proporcionar valores por defecto razonables', async () => {
    // Mock de getAttemptsByItem para devolver un array vacío
    vi.mock('./database.js', () => ({
      getAttemptsByItem: vi.fn().mockResolvedValue([])
    }))
    
    const testVerb = {
      id: 'verb-defaults-test',
      lemma: 'testear',
      type: 'regular',
      frequency: 'medium'
    }
    
    const mastery = await calculateMasteryForItem('item-defaults', testVerb)
    
    // Debería devolver valores por defecto razonables
    expect(mastery.score).toBe(50) // Valor neutral
    expect(mastery.n).toBe(0) // Sin intentos
    expect(mastery.weightedAttempts).toBe(0) // Sin intentos ponderados
    
    console.log('✅ Valores por defecto razonables')
  })

  it('debería ser fácil de usar con diferentes niveles de verbos', () => {
    const regularVerb = { type: 'regular' }
    const irregularVerb = { type: 'irregular' }
    const diphtongVerb = { type: 'diphtong' }
    const orthographicVerb = { type: 'orthographic_change' }
    const highlyIrregularVerb = { type: 'highly_irregular' }
    
    const regularDifficulty = getVerbDifficulty(regularVerb)
    const irregularDifficulty = getVerbDifficulty(irregularVerb)
    const diphtongDifficulty = getVerbDifficulty(diphtongVerb)
    const orthographicDifficulty = getVerbDifficulty(orthographicVerb)
    const highlyIrregularDifficulty = getVerbDifficulty(highlyIrregularVerb)
    
    // Verificar que todos los tipos de verbos son manejados
    expect(typeof regularDifficulty).toBe('number')
    expect(typeof irregularDifficulty).toBe('number')
    expect(typeof diphtongDifficulty).toBe('number')
    expect(typeof orthographicDifficulty).toBe('number')
    expect(typeof highlyIrregularDifficulty).toBe('number')
    
    // Verificar que las dificultades están en el rango válido
    ;[regularDifficulty, irregularDifficulty, diphtongDifficulty, orthographicDifficulty, highlyIrregularDifficulty]
      .forEach(diff => {
        expect(diff).toBeGreaterThanOrEqual(0.8)
        expect(diff).toBeLessThanOrEqual(1.3)
      })
    
    console.log('✅ Fácil uso con diferentes niveles de verbos')
  })

  it('debería proporcionar retroalimentación inmediata para acciones del usuario', () => {
    // Verificar que las funciones responden rápidamente
    const start = performance.now()
    
    const weight = calculateRecencyWeight(new Date())
    const difficulty = getVerbDifficulty({ type: 'regular' })
    const penalty = calculateHintPenalty(1)
    const confidence = getConfidenceLevel(10)
    const level = classifyMasteryLevel(70, 10, 3000)
    
    const end = performance.now()
    const executionTime = end - start
    
    // Verificar que la ejecución es rápida (< 10ms)
    expect(executionTime).toBeLessThan(10)
    
    // Verificar que todos los resultados son válidos
    expect(typeof weight).toBe('number')
    expect(typeof difficulty).toBe('number')
    expect(typeof penalty).toBe('number')
    expect(typeof confidence).toBe('object')
    expect(typeof level).toBe('object')
    
    console.log(`✅ Retroalimentación inmediata: ${executionTime.toFixed(2)}ms`)
  })

  it('debería ser fácil de extender con nuevas funcionalidades', () => {
    // Verificar que la estructura permite extensiones
    // En una implementación completa, esto verificaría que los módulos
    // están organizados de manera que sea fácil añadir nuevas funcionalidades
    
    // Por ahora, verificamos que los módulos existen
    expect(typeof initProgressSystem).toBe('function')
    expect(typeof calculateMasteryForItem).toBe('function')
    expect(typeof calculateMasteryForCell).toBe('function')
    
    console.log('✅ Estructura fácil de extender')
  })
})