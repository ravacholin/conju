// Pruebas para el sistema de progreso y analíticas

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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

describe('Sistema de Progreso', () => {
  beforeEach(async () => {
    // Limpiar el estado antes de cada prueba
    // En una implementación completa, esto limpiaría la base de datos
    console.log(' Configurando entorno de pruebas...')
  })

  afterEach(() => {
    // Limpiar después de cada prueba
    console.log('🧹 Limpiando entorno de pruebas...')
  })

  it('debería inicializar el sistema de progreso', async () => {
    const userId = await initProgressSystem()
    expect(userId).toBeDefined()
    expect(typeof userId).toBe('string')
    expect(isProgressSystemInitialized()).toBe(true)
    expect(getCurrentUserId()).toBe(userId)
  })

  it('debería calcular el peso por recencia correctamente', () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
    
    const weightNow = calculateRecencyWeight(now)
    const weightOneDay = calculateRecencyWeight(oneDayAgo)
    const weightTenDays = calculateRecencyWeight(tenDaysAgo)
    
    expect(weightNow).toBeCloseTo(1.0, 2)
    expect(weightOneDay).toBeLessThan(weightNow)
    expect(weightTenDays).toBeLessThan(weightOneDay)
  })

  it('debería calcular la dificultad del verbo correctamente', () => {
    const regularVerb = { type: 'regular' }
    const irregularVerb = { type: 'irregular' }
    const highFrequencyVerb = { type: 'regular', frequency: 'high' }
    const lowFrequencyVerb = { type: 'regular', frequency: 'low' }
    
    const regularDifficulty = getVerbDifficulty(regularVerb)
    const irregularDifficulty = getVerbDifficulty(irregularVerb)
    const highFreqDifficulty = getVerbDifficulty(highFrequencyVerb)
    const lowFreqDifficulty = getVerbDifficulty(lowFrequencyVerb)
    
    expect(regularDifficulty).toBe(1.0)
    expect(irregularDifficulty).toBe(1.2)
    // Para verbos regulares, la frecuencia no afecta la dificultad
    expect(highFreqDifficulty).toBe(lowFreqDifficulty)
  })

  it('debería calcular la penalización por pistas correctamente', () => {
    const penalty0 = calculateHintPenalty(0)
    const penalty1 = calculateHintPenalty(1)
    const penalty3 = calculateHintPenalty(3)
    const penalty5 = calculateHintPenalty(5) // Debería estar por debajo del máximo
    
    expect(penalty0).toBe(0)
    expect(penalty1).toBe(5)
    expect(penalty3).toBe(15)
    expect(penalty5).toBe(15) // Máximo
  })

  it('debería calcular el mastery para un ítem sin intentos', async () => {
    const testVerb = {
      id: 'verb-test-mastery',
      lemma: 'testear',
      type: 'regular',
      frequency: 'medium'
    }
    
    // Mock de getAttemptsByItem para devolver un array vacío
    vi.mock('./database.js', () => ({
      getAttemptsByItem: vi.fn().mockResolvedValue([])
    }))
    
    const mastery = await calculateMasteryForItem('item-nonexistent', testVerb)
    
    // Debería devolver valores por defecto para ítems sin intentos
    expect(mastery.score).toBe(50)
    expect(mastery.n).toBe(0)
    expect(mastery.weightedAttempts).toBe(0)
  })

  it('debería calcular el mastery para una celda sin ítems', async () => {
    const items = []
    const verbsMap = {}
    
    const mastery = await calculateMasteryForCell(items, verbsMap)
    
    // Debería devolver valores por defecto para celdas sin ítems
    expect(mastery.score).toBe(50)
    expect(mastery.n).toBe(0)
    expect(mastery.weightedN).toBe(0)
  })

  it('debería determinar el nivel de confianza correctamente', () => {
    const confidenceLow = getConfidenceLevel(5)
    const confidenceMedium = getConfidenceLevel(10)
    const confidenceHigh = getConfidenceLevel(25)
    
    expect(confidenceLow.level).toBe('bajo')
    expect(confidenceLow.sufficient).toBe(false)
    
    expect(confidenceMedium.level).toBe('medio')
    expect(confidenceMedium.sufficient).toBe(true)
    
    expect(confidenceHigh.level).toBe('alto')
    expect(confidenceHigh.sufficient).toBe(true)
  })

  it('debería clasificar el nivel de mastery correctamente', () => {
    // Con pocos intentos
    const levelInsufficient = classifyMasteryLevel(70, 5, 3000)
    expect(levelInsufficient.level).toBe('insuficiente')
    expect(levelInsufficient.confidence.sufficient).toBe(false)

    // Con suficientes intentos y buen score
    const levelAchieved = classifyMasteryLevel(85, 10, 2000)
    expect(levelAchieved.level).toBe('logrado')
    expect(levelAchieved.confidence.sufficient).toBe(true)

    // Con suficientes intentos y score medio
    const levelAttention = classifyMasteryLevel(70, 10, 4000)
    expect(levelAttention.level).toBe('atención')
    expect(levelAttention.confidence.sufficient).toBe(true)

    // Con suficientes intentos y score bajo
    const levelCritical = classifyMasteryLevel(40, 10, 3000)
    expect(levelCritical.level).toBe('crítico')
    expect(levelCritical.confidence.sufficient).toBe(true)
  })

  it('debería resolver initProgressSystem antes de completar todos los lotes', async () => {
    // Importar funciones específicas del sistema de eventos para monitorear progreso
    const { onBatchProgress, getBatchInitializationProgress, resetProgressSystemState } = await import('./ProgressSystemEvents.js')

    // Resetear estado del sistema para prueba limpia
    resetProgressSystemState()

    let batchUpdatesReceived = 0
    let systemResolvedBeforeCompletion = false

    // Monitorear progreso de lotes
    const unsubscribe = onBatchProgress((progress) => {
      batchUpdatesReceived++
      console.log(` Test: Lote ${progress.completedBatches}/${progress.totalBatches} completado`)

      // Si el sistema ya está inicializado pero los lotes siguen en proceso
      if (isProgressSystemInitialized() && progress.isRunning) {
        systemResolvedBeforeCompletion = true
      }
    })

    // Tiempo antes de inicialización
    const startTime = Date.now()

    // Inicializar sistema (debería resolver rápidamente)
    const userId = await initProgressSystem()

    // Tiempo después de que initProgressSystem resuelva
    const systemResolvedTime = Date.now()

    // Verificar que el sistema está inicializado
    expect(userId).toBeDefined()
    expect(isProgressSystemInitialized()).toBe(true)
    expect(getCurrentUserId()).toBe(userId)

    // Dar tiempo para que los lotes se procesen en background
    await new Promise(resolve => setTimeout(resolve, 100))

    // Obtener estado final de progreso por lotes
    const finalProgress = getBatchInitializationProgress()

    // Limpiar suscripción
    unsubscribe()

    // Verificaciones de comportamiento asincrónico
    console.log(`⏱️ Test: Sistema resuelto en ${systemResolvedTime - startTime}ms`)
    console.log(` Test: ${batchUpdatesReceived} actualizaciones de progreso recibidas`)
    console.log(` Test: Estado final - batches: ${finalProgress.completedBatches}, creados: ${finalProgress.totalCreated}`)

    // El sistema debería resolver rápidamente (< 50ms típicamente)
    expect(systemResolvedTime - startTime).toBeLessThan(500) // Tolerancia amplia para CI

    // Si hubo procesamiento por lotes, debería haber recibido actualizaciones
    if (finalProgress.totalBatches > 0) {
      expect(batchUpdatesReceived).toBeGreaterThan(0)
      // El sistema debería haberse resuelto antes de completar todos los lotes
      expect(systemResolvedBeforeCompletion).toBe(true)
    }
  }, 10000) // Timeout de 10s para permitir procesamiento por lotes
})