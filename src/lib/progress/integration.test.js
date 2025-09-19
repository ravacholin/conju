// Pruebas de integración para el sistema de progreso y analíticas

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Nota: los mocks específicos se aplican dentro de cada prueba para reducir acoplamiento
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

describe('Pruebas de Integración del Sistema de Progreso', () => {
  beforeEach(async () => {
    // Limpiar el estado antes de cada prueba
    // En una implementación completa, esto limpiaría la base de datos
    console.log('🔧 Configurando entorno de pruebas de integración...')
  })

  it('debería integrar correctamente todas las funciones del sistema', async () => {
    // Inicializar el sistema
    const userId = await initProgressSystem()
    expect(userId).toBeDefined()
    expect(typeof userId).toBe('string')
    expect(isProgressSystemInitialized()).toBe(true)
    expect(getCurrentUserId()).toBe(userId)
    
    // Verificar que todas las funciones están disponibles
    expect(typeof calculateRecencyWeight).toBe('function')
    expect(typeof getVerbDifficulty).toBe('function')
    expect(typeof calculateHintPenalty).toBe('function')
    expect(typeof calculateMasteryForItem).toBe('function')
    expect(typeof calculateMasteryForCell).toBe('function')
    expect(typeof getConfidenceLevel).toBe('function')
    expect(typeof classifyMasteryLevel).toBe('function')
    
    console.log('✅ Integración básica completada')
  })

  it('debería integrar correctamente el cálculo de mastery para un ítem', async () => {
    const testVerb = {
      id: 'verb-integration-test',
      lemma: 'testear',
      type: 'regular',
      frequency: 'medium'
    }
    
    // Mock de getAttemptsByItem para devolver un array vacío
    vi.mock('./database.js', () => ({
      getAttemptsByItem: vi.fn().mockResolvedValue([])
    }))
    
    const mastery = await calculateMasteryForItem('item-nonexistent', testVerb)
    
    // Verificar resultados
    expect(mastery.score).toBe(50)
    expect(mastery.n).toBe(0)
    expect(mastery.weightedAttempts).toBe(0)
    
    console.log('✅ Integración de cálculo de mastery para ítem completada')
  })

  it('debería integrar correctamente el cálculo de mastery para una celda', async () => {
    const items = []
    const verbsMap = {}
    
    const mastery = await calculateMasteryForCell(items, verbsMap)
    
    // Verificar resultados
    expect(mastery.score).toBe(50)
    expect(mastery.n).toBe(0)
    expect(mastery.weightedN).toBe(0)
    
    console.log('✅ Integración de cálculo de mastery para celda completada')
  })

  it('debería integrar correctamente la determinación del nivel de confianza', () => {
    const confidenceLow = getConfidenceLevel(5)
    const confidenceMedium = getConfidenceLevel(10)
    const confidenceHigh = getConfidenceLevel(25)
    
    // Verificar resultados
    expect(confidenceLow.level).toBe('bajo')
    expect(confidenceLow.sufficient).toBe(false)
    
    expect(confidenceMedium.level).toBe('medio')
    expect(confidenceMedium.sufficient).toBe(true)
    
    expect(confidenceHigh.level).toBe('alto')
    expect(confidenceHigh.sufficient).toBe(true)
    
    console.log('✅ Integración de determinación del nivel de confianza completada')
  })

  it('debería integrar correctamente la clasificación del nivel de mastery', () => {
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
    
    console.log('✅ Integración de clasificación del nivel de mastery completada')
  })

  it('debería integrar correctamente el cálculo del peso por recencia', () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
    
    const weightNow = calculateRecencyWeight(now)
    const weightOneDay = calculateRecencyWeight(oneDayAgo)
    const weightTenDays = calculateRecencyWeight(tenDaysAgo)
    
    // Verificar resultados
    expect(weightNow).toBeCloseTo(1.0, 2)
    expect(weightOneDay).toBeLessThan(weightNow)
    expect(weightTenDays).toBeLessThan(weightOneDay)
    
    console.log('✅ Integración de cálculo del peso por recencia completada')
  })

  it('debería integrar correctamente el cálculo de la dificultad del verbo', () => {
    const regularVerb = { type: 'regular' }
    const irregularVerb = { type: 'irregular' }
    const highFrequencyVerb = { type: 'regular', frequency: 'high' }
    const lowFrequencyVerb = { type: 'regular', frequency: 'low' }
    
    const regularDifficulty = getVerbDifficulty(regularVerb)
    const irregularDifficulty = getVerbDifficulty(irregularVerb)
    const highFreqDifficulty = getVerbDifficulty(highFrequencyVerb)
    const lowFreqDifficulty = getVerbDifficulty(lowFrequencyVerb)
    
    // Verificar resultados
    expect(regularDifficulty).toBe(1.0)
    expect(irregularDifficulty).toBe(1.2)
    // Para verbos regulares, la frecuencia no afecta la dificultad
    expect(highFreqDifficulty).toBe(lowFreqDifficulty)
    
    console.log('✅ Integración de cálculo de la dificultad del verbo completada')
  })

  it('debería integrar correctamente el cálculo de la penalización por pistas', () => {
    const penalty0 = calculateHintPenalty(0)
    const penalty1 = calculateHintPenalty(1)
    const penalty3 = calculateHintPenalty(3)
    const penalty5 = calculateHintPenalty(5) // Debería estar por debajo del máximo
    
    // Verificar resultados
    expect(penalty0).toBe(0)
    expect(penalty1).toBe(5)
    expect(penalty3).toBe(15)
    expect(penalty5).toBe(15) // Máximo
    
    console.log('✅ Integración de cálculo de la penalización por pistas completada')
  })

  it('debería integrar correctamente todas las funciones en conjunto', async () => {
    // Inicializar el sistema
    await initProgressSystem()
    
    // Crear un verbo de prueba
    const testVerb = {
      id: 'verb-full-integration-test',
      lemma: 'integrar',
      type: 'regular',
      frequency: 'medium'
    }
    
    // Mock de getAttemptsByItem para devolver un array vacío
    vi.mock('./database.js', () => ({
      getAttemptsByItem: vi.fn().mockResolvedValue([])
    }))
    
    // Calcular dificultad del verbo
    const difficulty = getVerbDifficulty(testVerb)
    expect(typeof difficulty).toBe('number')
    expect(difficulty).toBeGreaterThanOrEqual(0.8)
    expect(difficulty).toBeLessThanOrEqual(1.3)
    
    // Calcular penalización por pistas
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    expect(penalty).toBeGreaterThanOrEqual(0)
    expect(penalty).toBeLessThanOrEqual(15)
    
    // Calcular peso por recencia
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    expect(weight).toBeGreaterThanOrEqual(0)
    expect(weight).toBeLessThanOrEqual(1)
    
    // Calcular mastery para el ítem
    const mastery = await calculateMasteryForItem('item-full-integration', testVerb)
    expect(typeof mastery).toBe('object')
    expect(mastery.score).toBe(50)
    expect(mastery.n).toBe(0)
    expect(mastery.weightedAttempts).toBe(0)
    
    // Determinar nivel de confianza
    const confidence = getConfidenceLevel(10)
    expect(typeof confidence).toBe('object')
    expect(confidence.level).toBe('medio')
    expect(confidence.sufficient).toBe(true)
    
    // Clasificar nivel de mastery
    const level = classifyMasteryLevel(70, 10, 3000)
    expect(typeof level).toBe('object')
    expect(level.level).toBe('atención')
    expect(level.confidence.sufficient).toBe(true)
    
    console.log('✅ Integración completa de todas las funciones completada')
  })

  // El caso de error de integración se prueba en integration-db-error.test.js

  it('debería mantener la coherencia entre todas las funciones', async () => {
    // Inicializar el sistema
    await initProgressSystem()
    
    // Crear verbos de prueba
    const regularVerb = { type: 'regular' }
    const irregularVerb = { type: 'irregular' }
    
    // Verificar coherencia en el cálculo de dificultad
    const regularDifficulty = getVerbDifficulty(regularVerb)
    const irregularDifficulty = getVerbDifficulty(irregularVerb)
    
    expect(regularDifficulty).toBe(1.0)
    expect(irregularDifficulty).toBe(1.2)
    expect(regularDifficulty).toBeLessThan(irregularDifficulty)
    
    // Verificar coherencia en la penalización por pistas
    const penalty0 = calculateHintPenalty(0)
    const penalty1 = calculateHintPenalty(1)
    const penalty3 = calculateHintPenalty(3)
    const penalty5 = calculateHintPenalty(5)
    
    expect(penalty0).toBe(0)
    expect(penalty1).toBe(5)
    expect(penalty3).toBe(15)
    expect(penalty5).toBe(15) // Máximo
    
    // Verificar coherencia en el peso por recencia
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
    
    const weightNow = calculateRecencyWeight(now)
    const weightOneDay = calculateRecencyWeight(oneDayAgo)
    const weightTenDays = calculateRecencyWeight(tenDaysAgo)
    
    expect(weightNow).toBeCloseTo(1.0, 2)
    expect(weightOneDay).toBeLessThan(weightNow)
    expect(weightTenDays).toBeLessThan(weightOneDay)
    
    console.log('✅ Coherencia entre todas las funciones verificada')
  })
})
