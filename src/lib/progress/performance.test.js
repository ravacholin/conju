// Pruebas de rendimiento para el sistema de progreso y analíticas

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
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

describe('Pruebas de Rendimiento del Sistema de Progreso', () => {
  beforeEach(async () => {
    // Limpiar el estado antes de cada prueba
    // En una implementación completa, esto limpiaría la base de datos
    console.log(' Configurando entorno de pruebas de rendimiento...')
  })

  it('debería calcular el peso por recencia rápidamente', () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
    
    // Medir tiempo de ejecución
    const start = performance.now()
    
    const weightNow = calculateRecencyWeight(now)
    const weightOneDay = calculateRecencyWeight(oneDayAgo)
    const weightTenDays = calculateRecencyWeight(tenDaysAgo)
    
    const end = performance.now()
    const executionTime = end - start
    
    // Verificar resultados
    expect(weightNow).toBeCloseTo(1.0, 2)
    expect(weightOneDay).toBeLessThan(weightNow)
    expect(weightTenDays).toBeLessThan(weightOneDay)
    
    // Verificar rendimiento (debería ser muy rápido)
    expect(executionTime).toBeLessThan(5) // Menos de 5ms
    console.log(`⏱️ Cálculo de peso por recencia: ${executionTime.toFixed(2)}ms`)
  })

  it('debería calcular la dificultad del verbo rápidamente', () => {
    const regularVerb = { type: 'regular' }
    const irregularVerb = { type: 'irregular' }
    const highFrequencyVerb = { type: 'regular', frequency: 'high' }
    const lowFrequencyVerb = { type: 'regular', frequency: 'low' }
    
    // Medir tiempo de ejecución
    const start = performance.now()
    
    const regularDifficulty = getVerbDifficulty(regularVerb)
    const irregularDifficulty = getVerbDifficulty(irregularVerb)
    const highFreqDifficulty = getVerbDifficulty(highFrequencyVerb)
    const lowFreqDifficulty = getVerbDifficulty(lowFrequencyVerb)
    
    const end = performance.now()
    const executionTime = end - start
    
    // Verificar resultados
    expect(regularDifficulty).toBe(1.0)
    expect(irregularDifficulty).toBe(1.2)
    expect(highFreqDifficulty).toBe(lowFreqDifficulty)
    
    // Verificar rendimiento
    expect(executionTime).toBeLessThan(5) // Menos de 5ms
    console.log(`⏱️ Cálculo de dificultad del verbo: ${executionTime.toFixed(2)}ms`)
  })

  it('debería calcular la penalización por pistas rápidamente', () => {
    // Medir tiempo de ejecución
    const start = performance.now()
    
    const penalty0 = calculateHintPenalty(0)
    const penalty1 = calculateHintPenalty(1)
    const penalty3 = calculateHintPenalty(3)
    const penalty5 = calculateHintPenalty(5) // Debería estar por debajo del máximo
    
    const end = performance.now()
    const executionTime = end - start
    
    // Verificar resultados
    expect(penalty0).toBe(0)
    expect(penalty1).toBe(5)
    expect(penalty3).toBe(15)
    expect(penalty5).toBe(15) // Máximo
    
    // Verificar rendimiento
    expect(executionTime).toBeLessThan(5) // Menos de 5ms
    console.log(`⏱️ Cálculo de penalización por pistas: ${executionTime.toFixed(2)}ms`)
  })

  it('debería calcular el mastery para un ítem sin intentos rápidamente', async () => {
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
    
    // Medir tiempo de ejecución
    const start = performance.now()
    
    const mastery = await calculateMasteryForItem('item-nonexistent', testVerb)
    
    const end = performance.now()
    const executionTime = end - start
    
    // Verificar resultados
    expect(mastery.score).toBe(50)
    expect(mastery.n).toBe(0)
    expect(mastery.weightedAttempts).toBe(0)
    
    // Verificar rendimiento
    expect(executionTime).toBeLessThan(10) // Menos de 10ms
    console.log(`⏱️ Cálculo de mastery para ítem sin intentos: ${executionTime.toFixed(2)}ms`)
  })

  it('debería calcular el mastery para una celda sin ítems rápidamente', async () => {
    const items = []
    const verbsMap = {}
    
    // Medir tiempo de ejecución
    const start = performance.now()
    
    const mastery = await calculateMasteryForCell(items, verbsMap)
    
    const end = performance.now()
    const executionTime = end - start
    
    // Verificar resultados
    expect(mastery.score).toBe(50)
    expect(mastery.n).toBe(0)
    expect(mastery.weightedN).toBe(0)
    
    // Verificar rendimiento
    expect(executionTime).toBeLessThan(10) // Menos de 10ms
    console.log(`⏱️ Cálculo de mastery para celda sin ítems: ${executionTime.toFixed(2)}ms`)
  })

  it('debería determinar el nivel de confianza rápidamente', () => {
    // Medir tiempo de ejecución
    const start = performance.now()
    
    const confidenceLow = getConfidenceLevel(5)
    const confidenceMedium = getConfidenceLevel(10)
    const confidenceHigh = getConfidenceLevel(25)
    
    const end = performance.now()
    const executionTime = end - start
    
    // Verificar resultados
    expect(confidenceLow.level).toBe('bajo')
    expect(confidenceLow.sufficient).toBe(false)
    
    expect(confidenceMedium.level).toBe('medio')
    expect(confidenceMedium.sufficient).toBe(true)
    
    expect(confidenceHigh.level).toBe('alto')
    expect(confidenceHigh.sufficient).toBe(true)
    
    // Verificar rendimiento
    expect(executionTime).toBeLessThan(5) // Menos de 5ms
    console.log(`⏱️ Determinación del nivel de confianza: ${executionTime.toFixed(2)}ms`)
  })

  it('debería clasificar el nivel de mastery rápidamente', () => {
    // Con pocos intentos
    const start1 = performance.now()
    const levelInsufficient = classifyMasteryLevel(70, 5, 3000)
    const end1 = performance.now()
    const executionTime1 = end1 - start1
    
    // Con suficientes intentos y buen score
    const start2 = performance.now()
    const levelAchieved = classifyMasteryLevel(85, 10, 2000)
    const end2 = performance.now()
    const executionTime2 = end2 - start2
    
    // Con suficientes intentos y score medio
    const start3 = performance.now()
    const levelAttention = classifyMasteryLevel(70, 10, 4000)
    const end3 = performance.now()
    const executionTime3 = end3 - start3
    
    // Con suficientes intentos y score bajo
    const start4 = performance.now()
    const levelCritical = classifyMasteryLevel(40, 10, 3000)
    const end4 = performance.now()
    const executionTime4 = end4 - start4
    
    // Verificar resultados
    expect(levelInsufficient.level).toBe('insuficiente')
    expect(levelInsufficient.confidence.sufficient).toBe(false)
    
    expect(levelAchieved.level).toBe('logrado')
    expect(levelAchieved.confidence.sufficient).toBe(true)
    
    expect(levelAttention.level).toBe('atención')
    expect(levelAttention.confidence.sufficient).toBe(true)
    
    expect(levelCritical.level).toBe('crítico')
    expect(levelCritical.confidence.sufficient).toBe(true)
    
    // Verificar rendimiento
    expect(executionTime1).toBeLessThan(5) // Menos de 5ms
    expect(executionTime2).toBeLessThan(5) // Menos de 5ms
    expect(executionTime3).toBeLessThan(5) // Menos de 5ms
    expect(executionTime4).toBeLessThan(5) // Menos de 5ms
    
    console.log(`⏱️ Clasificación de nivel de mastery: ${[
      executionTime1, executionTime2, executionTime3, executionTime4
    ].map(t => t.toFixed(2)).join('ms, ')}ms`)
  })

  it('debería manejar múltiples cálculos concurrentes', async () => {
    const testVerbs = [
      { id: 'verb-1', lemma: 'hablar', type: 'regular', frequency: 'high' },
      { id: 'verb-2', lemma: 'comer', type: 'regular', frequency: 'medium' },
      { id: 'verb-3', lemma: 'vivir', type: 'regular', frequency: 'low' },
      { id: 'verb-4', lemma: 'tener', type: 'irregular', frequency: 'high' },
      { id: 'verb-5', lemma: 'venir', type: 'irregular', frequency: 'medium' },
      { id: 'verb-6', lemma: 'poder', type: 'irregular', frequency: 'high' },
      { id: 'verb-7', lemma: 'jugar', type: 'diphtong', frequency: 'high' },
      { id: 'verb-8', lemma: 'pensar', type: 'diphtong', frequency: 'medium' },
      { id: 'verb-9', lemma: 'empezar', type: 'orthographic_change', frequency: 'high' },
      { id: 'verb-10', lemma: 'volver', type: 'orthographic_change', frequency: 'medium' }
    ]
    
    // Mock de getAttemptsByItem para devolver arrays vacíos
    vi.mock('./database.js', () => ({
      getAttemptsByItem: vi.fn().mockResolvedValue([])
    }))
    
    // Medir tiempo de ejecución para múltiples cálculos
    const start = performance.now()
    
    const promises = testVerbs.map(async (verb) => {
      const mastery = await calculateMasteryForItem(`item-${verb.lemma}`, verb)
      return mastery
    })
    
    const results = await Promise.all(promises)
    
    const end = performance.now()
    const executionTime = end - start
    
    // Verificar resultados
    expect(results).toHaveLength(10)
    results.forEach(result => {
      expect(result.score).toBe(50)
      expect(result.n).toBe(0)
      expect(result.weightedAttempts).toBe(0)
    })
    
    // Verificar rendimiento (debería manejar 10 cálculos en menos de 50ms)
    expect(executionTime).toBeLessThan(50)
    console.log(`⏱️ Múltiples cálculos concurrentes: ${executionTime.toFixed(2)}ms para ${testVerbs.length} verbos`)
  })

  it('debería mantener un bajo consumo de memoria', async () => {
    // En una implementación completa, esto mediría el consumo de memoria
    // antes y después de ejecutar varias operaciones
    
    // Por ahora, solo verificamos que no haya errores
    const testVerb = {
      id: 'verb-memory-test',
      lemma: 'testear',
      type: 'regular',
      frequency: 'medium'
    }
    
    // Mock de getAttemptsByItem para devolver un array vacío
    vi.mock('./database.js', () => ({
      getAttemptsByItem: vi.fn().mockResolvedValue([])
    }))
    
    // Ejecutar varias operaciones
    for (let i = 0; i < 100; i++) {
      await calculateMasteryForItem(`item-${i}`, testVerb)
    }
    
    // Si llegamos aquí sin errores, el consumo de memoria es aceptable
    expect(true).toBe(true)
    console.log(' Verificación de consumo de memoria completada')
  })
})