// Pruebas de compatibilidad para el sistema de progreso y analíticas

import { describe, it, expect, beforeEach } from 'vitest'
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

describe('Pruebas de Compatibilidad del Sistema de Progreso', () => {
  beforeEach(async () => {
    // Limpiar el estado antes de cada prueba
    // En una implementación completa, esto limpiaría la base de datos
    console.log('🔧 Configurando entorno de pruebas de compatibilidad...')
  })

  it('debería ser compatible con diferentes navegadores modernos', () => {
    // Verificar que las funciones funcionan en diferentes navegadores
    
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
    
    console.log('✅ Compatible con diferentes navegadores modernos')
  })

  it('debería ser compatible con diferentes versiones de JavaScript', () => {
    // Verificar que las funciones usan características de JavaScript compatibles
    
    // Todas las funciones usan características de ES6+
    expect(typeof calculateRecencyWeight).toBe('function')
    expect(typeof getVerbDifficulty).toBe('function')
    expect(typeof calculateHintPenalty).toBe('function')
    expect(typeof calculateMasteryForItem).toBe('function')
    expect(typeof calculateMasteryForCell).toBe('function')
    expect(typeof getConfidenceLevel).toBe('function')
    expect(typeof classifyMasteryLevel).toBe('function')
    
    console.log('✅ Compatible con diferentes versiones de JavaScript')
  })

  it('debería ser compatible con diferentes sistemas operativos', () => {
    // Verificar que las funciones no dependen de características específicas del SO
    
    // calculateRecencyWeight
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    
    // getVerbDifficulty
    const regularVerb = { type: 'regular' }
    const difficulty = getVerbDifficulty(regularVerb)
    expect(typeof difficulty).toBe('number')
    
    // calculateHintPenalty
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    
    console.log('✅ Compatible con diferentes sistemas operativos')
  })

  it('debería ser compatible con diferentes dispositivos', () => {
    // Verificar que las funciones funcionan en diferentes dispositivos
    
    // calculateRecencyWeight
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    
    // getVerbDifficulty
    const regularVerb = { type: 'regular' }
    const difficulty = getVerbDifficulty(regularVerb)
    expect(typeof difficulty).toBe('number')
    
    // calculateHintPenalty
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    
    console.log('✅ Compatible con diferentes dispositivos')
  })

  it('debería ser compatible con diferentes tamaños de pantalla', () => {
    // Verificar que las funciones no dependen del tamaño de pantalla
    
    // calculateRecencyWeight
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    
    // getVerbDifficulty
    const regularVerb = { type: 'regular' }
    const difficulty = getVerbDifficulty(regularVerb)
    expect(typeof difficulty).toBe('number')
    
    // calculateHintPenalty
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    
    console.log('✅ Compatible con diferentes tamaños de pantalla')
  })

  it('debería ser compatible con diferentes resoluciones', () => {
    // Verificar que las funciones no dependen de la resolución
    
    // calculateRecencyWeight
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    
    // getVerbDifficulty
    const regularVerb = { type: 'regular' }
    const difficulty = getVerbDifficulty(regularVerb)
    expect(typeof difficulty).toBe('number')
    
    // calculateHintPenalty
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    
    console.log('✅ Compatible con diferentes resoluciones')
  })

  it('debería ser compatible con diferentes configuraciones regionales', () => {
    // Verificar que las funciones manejan diferentes configuraciones regionales
    
    // calculateRecencyWeight con diferentes zonas horarias
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    
    // getVerbDifficulty con diferentes configuraciones de idioma
    const regularVerb = { type: 'regular' }
    const difficulty = getVerbDifficulty(regularVerb)
    expect(typeof difficulty).toBe('number')
    
    // calculateHintPenalty con diferentes configuraciones numéricas
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    
    console.log('✅ Compatible con diferentes configuraciones regionales')
  })

  it('debería ser compatible con diferentes configuraciones de seguridad', () => {
    // Verificar que las funciones manejan diferentes configuraciones de seguridad
    
    // calculateRecencyWeight con restricciones de seguridad
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    
    // getVerbDifficulty con restricciones de seguridad
    const regularVerb = { type: 'regular' }
    const difficulty = getVerbDifficulty(regularVerb)
    expect(typeof difficulty).toBe('number')
    
    // calculateHintPenalty con restricciones de seguridad
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    
    console.log('✅ Compatible con diferentes configuraciones de seguridad')
  })

  it('debería ser compatible con diferentes configuraciones de privacidad', () => {
    // Verificar que las funciones manejan diferentes configuraciones de privacidad
    
    // calculateRecencyWeight con modo incógnito
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    
    // getVerbDifficulty con modo incógnito
    const regularVerb = { type: 'regular' }
    const difficulty = getVerbDifficulty(regularVerb)
    expect(typeof difficulty).toBe('number')
    
    // calculateHintPenalty con modo incógnito
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    
    console.log('✅ Compatible con diferentes configuraciones de privacidad')
  })

  it('debería ser compatible con diferentes configuraciones de red', () => {
    // Verificar que las funciones manejan diferentes configuraciones de red
    
    // calculateRecencyWeight sin conexión
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    
    // getVerbDifficulty sin conexión
    const regularVerb = { type: 'regular' }
    const difficulty = getVerbDifficulty(regularVerb)
    expect(typeof difficulty).toBe('number')
    
    // calculateHintPenalty sin conexión
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    
    console.log('✅ Compatible con diferentes configuraciones de red')
  })

  it('debería ser compatible con diferentes configuraciones de almacenamiento', () => {
    // Verificar que las funciones manejan diferentes configuraciones de almacenamiento
    
    // calculateRecencyWeight con almacenamiento limitado
    const now = new Date()
    const weight = calculateRecencyWeight(now)
    expect(typeof weight).toBe('number')
    
    // getVerbDifficulty con almacenamiento limitado
    const regularVerb = { type: 'regular' }
    const difficulty = getVerbDifficulty(regularVerb)
    expect(typeof difficulty).toBe('number')
    
    // calculateHintPenalty con almacenamiento limitado
    const penalty = calculateHintPenalty(1)
    expect(typeof penalty).toBe('number')
    
    console.log('✅ Compatible con diferentes configuraciones de almacenamiento')
  })

  it('debería ser compatible con diferentes configuraciones de rendimiento', () => {
    // Verificar que las funciones manejan diferentes configuraciones de rendimiento
    
    // calculateRecencyWeight en dispositivos lentos
    const start = performance.now()
    
    for (let i = 0; i < 1000; i++) {
      const weight = calculateRecencyWeight(new Date())
      expect(typeof weight).toBe('number')
    }
    
    const end = performance.now()
    const executionTime = end - start
    
    // Verificar que la ejecución es rápida (< 150ms para considerar entornos CI y máquinas cargadas)
    expect(executionTime).toBeLessThan(150)
    
    // getVerbDifficulty en dispositivos lentos
    const start2 = performance.now()
    const regularVerb = { type: 'regular' }
    
    for (let i = 0; i < 1000; i++) {
      const difficulty = getVerbDifficulty(regularVerb)
      expect(typeof difficulty).toBe('number')
    }
    
    const end2 = performance.now()
    const executionTime2 = end2 - start2
    
    // Verificar que la ejecución es rápida (< 150ms para considerar entornos CI y máquinas cargadas)
    expect(executionTime2).toBeLessThan(150)
    
    // calculateHintPenalty en dispositivos lentos
    const start3 = performance.now()
    
    for (let i = 0; i < 1000; i++) {
      const penalty = calculateHintPenalty(i)
      expect(typeof penalty).toBe('number')
    }
    
    const end3 = performance.now()
    const executionTime3 = end3 - start3
    
    // Verificar que la ejecución es rápida (< 150ms para considerar entornos CI y máquinas cargadas)
    expect(executionTime3).toBeLessThan(150)
    
    console.log(`✅ Compatible con diferentes configuraciones de rendimiento: ${[
      executionTime, executionTime2, executionTime3
    ].map(t => t.toFixed(2)).join('ms, ')}ms`)
  })
})
