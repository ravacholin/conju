// Pruebas para el sistema de progreso

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

describe('Sistema de Progreso', () => {
  beforeEach(async () => {
    // Limpiar el estado antes de cada prueba
    // En una implementación completa, esto limpiaría la base de datos
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
})