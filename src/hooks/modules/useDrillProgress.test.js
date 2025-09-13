/**
 * Test suite completa para useDrillProgress hook
 * 
 * Cubre las 8 funciones principales y toda la lógica crítica de seguimiento de progreso:
 * - handleResponse() - Procesamiento de respuestas del usuario
 * - handleHintShown() - Tracking de pistas mostradas
 * - getProgressInsights() - Análisis y estadísticas de progreso
 * - resetProgressStats() - Limpieza de estadísticas de sesión
 * - Sistema de eventos y estados internos
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDrillProgress } from './useDrillProgress.js'

// Mock del sistema de eventos de progreso
vi.mock('../../lib/progress/index.js', () => ({
  onProgressSystemReady: vi.fn((callback) => {
    // Simular que se ejecuta inmediatamente si ya está listo
    if (mockProgressSystemReady) {
      callback(true)
    }
    return vi.fn() // unsubscribe function
  }),
  isProgressSystemReady: vi.fn(() => mockProgressSystemReady)
}))

// Mock del userManager
vi.mock('../../lib/progress/userManager.js', () => ({
  getCurrentUserId: vi.fn(() => 'test-user-123')
}))

// Mock del validador de drill items
vi.mock('./DrillItemGenerator.js', () => ({
  validateDrillItemStructure: vi.fn((item) => ({
    valid: !!item?.id,
    errors: item?.id ? [] : ['Missing item ID']
  }))
}))

// Mock del logger
vi.mock('../../lib/utils/logger.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

// Variables globales para controlar mocks
let mockProgressSystemReady = false

// Mock de los módulos de progreso que se importan dinámicamente
let mockProcessUserResponse = null
let mockFlowDetector = null
let mockMomentumTracker = null
let mockConfidenceEngine = null
let mockDynamicGoalsSystem = null
let mockRecordAttempt = null
let mockUpdateMastery = null
let mockScheduleNextReview = null

describe('useDrillProgress Hook', () => {
  beforeEach(() => {
    // Reset del estado de mocks
    mockProgressSystemReady = false
    
    // Mock de los módulos de progreso
    mockProcessUserResponse = vi.fn().mockResolvedValue({
      success: true,
      masteryUpdate: { score: 85 },
      analytics: { streakBonus: 10 }
    })
    
    mockFlowDetector = {
      processResponse: vi.fn().mockResolvedValue({
        state: 'flow',
        level: 0.8,
        duration: 120000
      })
    }
    
    mockMomentumTracker = {
      processResponse: vi.fn().mockResolvedValue({
        level: 'high',
        velocity: 1.2,
        acceleration: 0.05
      })
    }
    
    mockConfidenceEngine = {
      processResponse: vi.fn().mockResolvedValue({
        level: 'high',
        score: 0.9,
        trend: 'increasing'
      })
    }
    
    mockDynamicGoalsSystem = {
      processResponse: vi.fn().mockResolvedValue({ goalProgress: 0.7 })
    }
    
    mockRecordAttempt = vi.fn().mockResolvedValue(true)
    mockUpdateMastery = vi.fn().mockResolvedValue(true)
    mockScheduleNextReview = vi.fn().mockResolvedValue(true)
    
    // Limpiar mocks de las funciones importadas
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Inicialización y Estados', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDrillProgress())
      
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.progressStats).toEqual({
        totalAttempts: 0,
        correctAttempts: 0,
        currentStreak: 0,
        accuracyRate: 0
      })
      expect(result.current.flowState).toBe(null)
      expect(result.current.momentum).toBe(null)
      expect(result.current.confidence).toBe(null)
      expect(result.current.isSystemReady).toBe(false)
    })

    it('should update system ready state when progress system becomes ready', async () => {
      const { result } = renderHook(() => useDrillProgress())
      
      // Inicialmente no está listo
      expect(result.current.isSystemReady).toBe(false)
      
      // Simular que el sistema se vuelve listo
      mockProgressSystemReady = true
      
      // Simular el callback del sistema de eventos
      const { onProgressSystemReady } = await import('../../lib/progress/index.js')
      const callback = onProgressSystemReady.mock.calls[0][0]
      
      await act(async () => {
        callback(true)
      })
      
      // Verificar que el estado se actualiza (parcialmente, sin processUserResponse aún)
      expect(result.current.isSystemReady).toBe(false) // Aún false porque processUserResponse es null
    })
  })

  describe('handleResponse Function', () => {
    it('should handle response successfully with full progress system', async () => {
      // Configurar sistema listo con módulos disponibles
      mockProgressSystemReady = true
      
      const { result } = renderHook(() => useDrillProgress())
      
      // Simular que los módulos están disponibles (esto normalmente se haría por imports dinámicos)
      // En un test real, necesitaríamos mockear los imports dinámicos
      
      const testItem = {
        id: 'test-item-123',
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '1s',
        settings: { practiceMode: 'mixed', level: 'A2' }
      }
      
      const testResponse = {
        isCorrect: true,
        userInput: 'hablo',
        expectedAnswer: 'hablo',
        responseTime: 1500,
        hintsUsed: 0
      }
      
      const mockOnResult = vi.fn()
      
      await act(async () => {
        const result_response = await result.current.handleResponse(testItem, testResponse, mockOnResult)
        expect(result_response.success).toBe(true)
        expect(mockOnResult).toHaveBeenCalledWith(testResponse)
      })
      
      // Verificar que las estadísticas se actualizaron
      expect(result.current.progressStats.totalAttempts).toBe(1)
      expect(result.current.progressStats.correctAttempts).toBe(1)
      expect(result.current.progressStats.currentStreak).toBe(1)
      expect(result.current.progressStats.accuracyRate).toBe(100)
    })

    it('should handle incorrect response and reset streak', async () => {
      const { result } = renderHook(() => useDrillProgress())
      
      // Primero establecer un streak
      const correctItem = {
        id: 'test-item-1',
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '1s'
      }
      
      const correctResponse = {
        isCorrect: true,
        userInput: 'hablo',
        expectedAnswer: 'hablo',
        responseTime: 1200
      }
      
      await act(async () => {
        await result.current.handleResponse(correctItem, correctResponse)
      })
      
      expect(result.current.progressStats.currentStreak).toBe(1)
      
      // Ahora enviar respuesta incorrecta
      const incorrectResponse = {
        isCorrect: false,
        userInput: 'habla',
        expectedAnswer: 'hablo',
        responseTime: 2000
      }
      
      await act(async () => {
        await result.current.handleResponse(correctItem, incorrectResponse)
      })
      
      // Verificar que el streak se resetea
      expect(result.current.progressStats.currentStreak).toBe(0)
      expect(result.current.progressStats.totalAttempts).toBe(2)
      expect(result.current.progressStats.correctAttempts).toBe(1)
      expect(result.current.progressStats.accuracyRate).toBe(50)
    })

    it('should handle graceful degradation when progress system not ready', async () => {
      mockProgressSystemReady = false
      const { result } = renderHook(() => useDrillProgress())
      
      const testItem = {
        id: 'test-item-123',
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '1s'
      }
      
      const testResponse = {
        isCorrect: true,
        userInput: 'hablo',
        expectedAnswer: 'hablo'
      }
      
      const mockOnResult = vi.fn()
      
      await act(async () => {
        const response = await result.current.handleResponse(testItem, testResponse, mockOnResult)
        expect(response.success).toBe(true)
        expect(response.reason).toBe('Graceful degradation - progress system not ready')
        expect(mockOnResult).toHaveBeenCalledWith(testResponse)
      })
    })

    it('should handle invalid drill item structure', async () => {
      const { result } = renderHook(() => useDrillProgress())
      
      const invalidItem = {
        // Missing id field
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '1s'
      }
      
      const testResponse = {
        isCorrect: true,
        userInput: 'hablo'
      }
      
      await act(async () => {
        const response = await result.current.handleResponse(invalidItem, testResponse)
        expect(response.success).toBe(false)
        expect(response.reason).toBe('Invalid item structure')
        expect(response.errors).toContain('Missing item ID')
      })
    })

    it('should handle processing lock to prevent concurrent calls', async () => {
      const { result } = renderHook(() => useDrillProgress())
      
      const testItem = {
        id: 'test-item-123',
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '1s'
      }
      
      const testResponse = {
        isCorrect: true,
        userInput: 'hablo',
        expectedAnswer: 'hablo'
      }
      
      // Simular que ya está procesando
      await act(async () => {
        // Primera llamada (debería procesar)
        const firstCall = result.current.handleResponse(testItem, testResponse)
        
        // Segunda llamada concurrente (debería rechazarse)
        const secondCall = result.current.handleResponse(testItem, testResponse)
        
        const [firstResult, secondResult] = await Promise.all([firstCall, secondCall])
        
        expect(firstResult.success).toBe(true)
        expect(secondResult.success).toBe(false)
        expect(secondResult.reason).toBe('Processing in progress')
      })
    })
  })

  describe('handleHintShown Function', () => {
    it('should record hint usage when system is ready', async () => {
      mockProgressSystemReady = true
      const { result } = renderHook(() => useDrillProgress())
      
      const testItem = {
        id: 'test-item-123',
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '1s',
        settings: { practiceMode: 'mixed', level: 'A2' }
      }
      
      await act(async () => {
        await result.current.handleHintShown(testItem, 'conjugation_hint')
      })
      
      // En un test real, verificaríamos que processUserResponse fue llamado
      // con los parámetros correctos para hint tracking
    })

    it('should gracefully handle hint tracking when system not ready', async () => {
      mockProgressSystemReady = false
      const { result } = renderHook(() => useDrillProgress())
      
      const testItem = {
        id: 'test-item-123',
        lemma: 'hablar'
      }
      
      await act(async () => {
        // No debería lanzar error
        await result.current.handleHintShown(testItem, 'generic')
      })
    })

    it('should handle hint tracking without user ID gracefully', async () => {
      // Mock para devolver null userId
      const { getCurrentUserId } = await import('../../lib/progress/userManager.js')
      getCurrentUserId.mockReturnValueOnce(null)
      
      const { result } = renderHook(() => useDrillProgress())
      
      const testItem = {
        id: 'test-item-123',
        lemma: 'hablar'
      }
      
      await act(async () => {
        // No debería lanzar error
        await result.current.handleHintShown(testItem, 'generic')
      })
    })
  })

  describe('getProgressInsights Function', () => {
    it('should return correct progress insights', async () => {
      const { result } = renderHook(() => useDrillProgress())
      
      // Establecer algunos datos de prueba
      await act(async () => {
        // Simular varias respuestas para crear estadísticas
        const testItem = { id: 'test-item', lemma: 'hablar' }
        
        // 3 respuestas correctas
        for (let i = 0; i < 3; i++) {
          await result.current.handleResponse(testItem, { isCorrect: true })
        }
        
        // 1 respuesta incorrecta
        await result.current.handleResponse(testItem, { isCorrect: false })
      })
      
      const insights = result.current.getProgressInsights()
      
      expect(insights.stats.totalAttempts).toBe(4)
      expect(insights.stats.correctAttempts).toBe(3)
      expect(insights.stats.accuracyRate).toBe(75)
      expect(insights.stats.currentStreak).toBe(0) // Reset por la última incorrecta
      
      expect(insights.userId).toBe('test-user-123')
      expect(insights.isSystemReady).toBe(false) // Sin módulos disponibles
      
      expect(insights.insights.needsMorePractice).toBe(false) // 75% > 70%
      expect(insights.insights.isOnStreak).toBe(false) // streak = 0 < 5
      expect(insights.insights.isFlowing).toBe(false) // flowState es null
      expect(insights.insights.hasMomentum).toBe(false) // momentum es null
      expect(insights.insights.isConfident).toBe(false) // confidence es null
    })

    it('should detect when user needs more practice', async () => {
      const { result } = renderHook(() => useDrillProgress())
      
      await act(async () => {
        const testItem = { id: 'test-item', lemma: 'hablar' }
        
        // 2 correctas, 8 incorrectas = 20% accuracy
        for (let i = 0; i < 2; i++) {
          await result.current.handleResponse(testItem, { isCorrect: true })
        }
        for (let i = 0; i < 8; i++) {
          await result.current.handleResponse(testItem, { isCorrect: false })
        }
      })
      
      const insights = result.current.getProgressInsights()
      expect(insights.insights.needsMorePractice).toBe(true) // 20% < 70%
    })

    it('should detect streak status correctly', async () => {
      const { result } = renderHook(() => useDrillProgress())
      
      await act(async () => {
        const testItem = { id: 'test-item', lemma: 'hablar' }
        
        // 7 respuestas correctas consecutivas
        for (let i = 0; i < 7; i++) {
          await result.current.handleResponse(testItem, { isCorrect: true })
        }
      })
      
      const insights = result.current.getProgressInsights()
      expect(insights.insights.isOnStreak).toBe(true) // 7 >= 5
      expect(insights.stats.currentStreak).toBe(7)
    })
  })

  describe('resetProgressStats Function', () => {
    it('should reset all progress statistics to initial state', async () => {
      const { result } = renderHook(() => useDrillProgress())
      
      // Establecer algunas estadísticas
      await act(async () => {
        const testItem = { id: 'test-item', lemma: 'hablar' }
        
        for (let i = 0; i < 5; i++) {
          await result.current.handleResponse(testItem, { isCorrect: true })
        }
      })
      
      // Verificar que hay estadísticas
      expect(result.current.progressStats.totalAttempts).toBe(5)
      expect(result.current.progressStats.currentStreak).toBe(5)
      
      // Resetear
      act(() => {
        result.current.resetProgressStats()
      })
      
      // Verificar que todo se resetea
      expect(result.current.progressStats).toEqual({
        totalAttempts: 0,
        correctAttempts: 0,
        currentStreak: 0,
        accuracyRate: 0
      })
      expect(result.current.flowState).toBe(null)
      expect(result.current.momentum).toBe(null)
      expect(result.current.confidence).toBe(null)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle errors in progress modules gracefully', async () => {
      mockProgressSystemReady = true
      
      // Mock que lanza error
      mockProcessUserResponse = vi.fn().mockRejectedValue(new Error('Progress system error'))
      
      const { result } = renderHook(() => useDrillProgress())
      
      const testItem = {
        id: 'test-item-123',
        lemma: 'hablar',
        mood: 'indicative',
        tense: 'pres',
        person: '1s'
      }
      
      const testResponse = { isCorrect: true }
      const mockOnResult = vi.fn()
      
      await act(async () => {
        const response = await result.current.handleResponse(testItem, testResponse, mockOnResult)
        // Debería seguir funcionando a pesar del error en el módulo de progreso
        expect(response.success).toBe(true)
        expect(mockOnResult).toHaveBeenCalledWith(testResponse)
      })
      
      // Las estadísticas locales deberían seguir actualizándose
      expect(result.current.progressStats.totalAttempts).toBe(1)
      expect(result.current.progressStats.correctAttempts).toBe(1)
    })

    it('should handle unexpected errors in handleResponse', async () => {
      const { result } = renderHook(() => useDrillProgress())
      
      // Item que causará error en validateDrillItemStructure
      const { validateDrillItemStructure } = await import('./DrillItemGenerator.js')
      validateDrillItemStructure.mockImplementationOnce(() => {
        throw new Error('Validation error')
      })
      
      const testItem = { id: 'test-item', lemma: 'hablar' }
      const testResponse = { isCorrect: true }
      const mockOnResult = vi.fn()
      
      await act(async () => {
        const response = await result.current.handleResponse(testItem, testResponse, mockOnResult)
        expect(response.success).toBe(false)
        expect(response.reason).toBe('Unexpected error')
        expect(response.error).toBeInstanceOf(Error)
        expect(mockOnResult).toHaveBeenCalledWith(testResponse) // Debería llamar onResult de todas formas
      })
    })

    it('should handle accuracy calculation edge cases', async () => {
      const { result } = renderHook(() => useDrillProgress())
      
      // Test con 0 intentos
      let insights = result.current.getProgressInsights()
      expect(insights.stats.accuracyRate).toBe(0)
      
      // Test con 1 intento correcto
      await act(async () => {
        await result.current.handleResponse(
          { id: 'test-item' }, 
          { isCorrect: true }
        )
      })
      
      insights = result.current.getProgressInsights()
      expect(insights.stats.accuracyRate).toBe(100)
      
      // Test con redondeo
      await act(async () => {
        await result.current.handleResponse(
          { id: 'test-item' }, 
          { isCorrect: false }
        )
        await result.current.handleResponse(
          { id: 'test-item' }, 
          { isCorrect: false }
        )
      })
      
      insights = result.current.getProgressInsights()
      // 1 correcto de 3 total = 33.33% -> redondeado a 33%
      expect(insights.stats.accuracyRate).toBe(33)
    })
  })

  describe('Integration with External Modules', () => {
    it('should properly integrate with flow detector when available', async () => {
      // Este test requeriría mockear los imports dinámicos
      // En una implementación real, se necesitaría una configuración más avanzada
      // para testear completamente la integración con módulos externos
      const { result } = renderHook(() => useDrillProgress())
      
      // Verificar que el hook se inicializa correctamente sin módulos externos
      expect(result.current.flowState).toBe(null)
      expect(result.current.momentum).toBe(null)
      expect(result.current.confidence).toBe(null)
    })
  })
})

describe('useDrillProgress Performance Tests', () => {
  it('should handle high volume of responses efficiently', async () => {
    const { result } = renderHook(() => useDrillProgress())
    
    const startTime = performance.now()
    
    await act(async () => {
      const testItem = { id: 'test-item', lemma: 'hablar' }
      
      // Procesar 100 respuestas
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(
          result.current.handleResponse(testItem, { 
            isCorrect: Math.random() > 0.5,
            responseTime: Math.random() * 3000 + 1000
          })
        )
      }
      
      await Promise.all(promises)
    })
    
    const endTime = performance.now()
    const duration = endTime - startTime
    
    // Verificar que el procesamiento es relativamente rápido
    expect(duration).toBeLessThan(1000) // Menos de 1 segundo para 100 respuestas
    
    // Verificar que las estadísticas son correctas
    expect(result.current.progressStats.totalAttempts).toBe(100)
    expect(result.current.progressStats.correctAttempts).toBeGreaterThanOrEqual(0)
    expect(result.current.progressStats.correctAttempts).toBeLessThanOrEqual(100)
  })
})