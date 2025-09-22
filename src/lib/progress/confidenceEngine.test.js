// Pruebas para el motor de confianza
import { describe, it, expect, beforeEach } from 'vitest'
import { ConfidenceEngine } from './confidenceEngine.js'

describe('ConfidenceEngine', () => {
  let engine

  beforeEach(() => {
    engine = new ConfidenceEngine()
  })

  describe('División por cero en calculateSessionTrend', () => {
    it('debe manejar correctamente exactamente 10 respuestas (older vacío)', () => {
      // Simular exactamente 10 respuestas para reproducir el bug
      const mockResponses = []
      for (let i = 0; i < 10; i++) {
        mockResponses.push({
          isCorrect: i % 2 === 0, // alternando correcto/incorrecto
          responseTime: 3000,
          timestamp: Date.now() + i * 1000
        })
      }

      // Establecer las respuestas en el engine
      engine.responsePatterns = mockResponses

      // Calcular tendencia - no debería lanzar error por división por cero
      const trend = engine.calculateSessionTrend()

      // Debe devolver 0.5 cuando older está vacío
      expect(trend).toBe(0.5)
    })

    it('debe manejar correctamente menos de 10 respuestas', () => {
      const mockResponses = []
      for (let i = 0; i < 5; i++) {
        mockResponses.push({
          isCorrect: true,
          responseTime: 3000,
          timestamp: Date.now() + i * 1000
        })
      }

      engine.responsePatterns = mockResponses
      const trend = engine.calculateSessionTrend()

      // Con menos de 10 respuestas, debe devolver 0.5
      expect(trend).toBe(0.5)
    })

    it('debe calcular tendencia correctamente con más de 10 respuestas', () => {
      const mockResponses = []
      // Primeras 10 respuestas: 50% correctas
      for (let i = 0; i < 10; i++) {
        mockResponses.push({
          isCorrect: i % 2 === 0,
          responseTime: 3000,
          timestamp: Date.now() + i * 1000
        })
      }
      // Últimas 10 respuestas: 80% correctas (mejor)
      for (let i = 10; i < 20; i++) {
        mockResponses.push({
          isCorrect: i % 5 !== 0, // 80% correcto
          responseTime: 3000,
          timestamp: Date.now() + i * 1000
        })
      }

      engine.responsePatterns = mockResponses
      const trend = engine.calculateSessionTrend()

      // La tendencia debe ser positiva (>0.5) porque las respuestas recientes son mejores
      expect(trend).toBeGreaterThan(0.5)
    })

    it('debe devolver exactamente 0.5 cuando older.length === 0', () => {
      // Caso específico que causaba el bug
      const mockResponses = []
      for (let i = 0; i < 10; i++) {
        mockResponses.push({
          isCorrect: true,
          responseTime: 3000,
          timestamp: Date.now() + i * 1000
        })
      }

      engine.responsePatterns = mockResponses

      // Verificar que older queda vacío (esto es el escenario del bug)
      const recent = mockResponses.slice(-10)
      const older = mockResponses.slice(-20, -10)
      expect(older.length).toBe(0)
      expect(recent.length).toBe(10)

      // La función debe manejar esto correctamente
      const trend = engine.calculateSessionTrend()
      expect(trend).toBe(0.5)
    })
  })

  describe('Umbrales de confianza en getConfidenceLevel', () => {
    it('debe clasificar correctamente el nivel "overconfident"', () => {
      // Valor por encima del umbral OVERCONFIDENT (0.9)
      const level = engine.getConfidenceLevel(0.95)
      expect(level).toBe('overconfident')
    })

    it('debe clasificar correctamente el nivel "confident"', () => {
      // Valor entre CONFIDENT (0.7) y OVERCONFIDENT (0.9)
      const level = engine.getConfidenceLevel(0.8)
      expect(level).toBe('confident')
    })

    it('debe clasificar correctamente el nivel "uncertain"', () => {
      // Valor entre UNCERTAIN (0.5) y CONFIDENT (0.7)
      const level = engine.getConfidenceLevel(0.6)
      expect(level).toBe('uncertain')
    })

    it('debe clasificar correctamente el nivel "hesitant"', () => {
      // Valor entre HESITANT (0.3) y UNCERTAIN (0.5)
      const level = engine.getConfidenceLevel(0.4)
      expect(level).toBe('hesitant')
    })

    it('debe clasificar correctamente el nivel "struggling"', () => {
      // Valor por debajo del umbral HESITANT (0.3)
      const level = engine.getConfidenceLevel(0.2)
      expect(level).toBe('struggling')
    })

    it('debe manejar valores límite correctamente', () => {
      // Probar exactamente en los umbrales
      expect(engine.getConfidenceLevel(0.9)).toBe('overconfident')
      expect(engine.getConfidenceLevel(0.899)).toBe('confident')
      expect(engine.getConfidenceLevel(0.7)).toBe('confident')
      expect(engine.getConfidenceLevel(0.699)).toBe('uncertain')
      expect(engine.getConfidenceLevel(0.5)).toBe('uncertain')
      expect(engine.getConfidenceLevel(0.499)).toBe('hesitant')
      expect(engine.getConfidenceLevel(0.3)).toBe('hesitant')
      expect(engine.getConfidenceLevel(0.299)).toBe('struggling')
    })

    it('debe acceder correctamente a los umbrales de configuración', () => {
      // Verificar que los umbrales están definidos correctamente
      expect(engine.confidenceThresholds.OVERCONFIDENT).toBe(0.9)
      expect(engine.confidenceThresholds.CONFIDENT).toBe(0.7)
      expect(engine.confidenceThresholds.UNCERTAIN).toBe(0.5)
      expect(engine.confidenceThresholds.HESITANT).toBe(0.3)
    })

    it('debe funcionar con valores extremos', () => {
      expect(engine.getConfidenceLevel(1.0)).toBe('overconfident')
      expect(engine.getConfidenceLevel(0.0)).toBe('struggling')
      expect(engine.getConfidenceLevel(-0.1)).toBe('struggling')
      expect(engine.getConfidenceLevel(1.1)).toBe('overconfident')
    })
  })

  describe('Integración de confianza y tendencia', () => {
    it('debe generar análisis de confianza coherente', () => {
      // Configurar respuestas que simulan alta confianza
      const highConfidenceResponses = []
      for (let i = 0; i < 15; i++) {
        highConfidenceResponses.push({
          isCorrect: true,
          responseTime: 2500, // Tiempo óptimo
          timestamp: Date.now() + i * 1000,
          mood: 'indicative',
          tense: 'present',
          verb: 'hablar'
        })
      }

      engine.responsePatterns = highConfidenceResponses

      // Analizar confianza
      const confidenceState = engine.getCurrentConfidenceState()

      // Debe tener estado de confianza definido
      expect(confidenceState).toBeDefined()
      expect(confidenceState.level).toBeDefined()

      // La tendencia de sesión debe ser buena
      const sessionTrend = engine.calculateSessionTrend()
      expect(sessionTrend).toBeGreaterThanOrEqual(0.5)
    })

    it('debe manejar respuestas inconsistentes sin errores', () => {
      // Mezcla de respuestas buenas y malas
      const mixedResponses = []
      for (let i = 0; i < 12; i++) {
        mixedResponses.push({
          isCorrect: Math.random() > 0.5,
          responseTime: 1000 + Math.random() * 4000,
          timestamp: Date.now() + i * 1000,
          mood: i % 2 === 0 ? 'indicative' : 'subjunctive',
          tense: i % 3 === 0 ? 'present' : 'past',
          verb: i % 2 === 0 ? 'ser' : 'estar'
        })
      }

      engine.responsePatterns = mixedResponses

      // No debe lanzar errores
      expect(() => {
        engine.getCurrentConfidenceState()
        engine.calculateSessionTrend()
        engine.getTopConfidenceAreas(3)
      }).not.toThrow()
    })
  })
})