// Prueba aislada de error de integración forzando fallo en IndexedDB
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock de IndexedDB para entorno de pruebas
import 'fake-indexeddb/auto'

describe('Integración - Errores de DB', () => {
  beforeEach(() => {
    // Asegurar módulos limpios para cada prueba en este archivo
    vi.resetModules()
  })

  it('debería manejar errores de integración correctamente', async () => {
    // Mock idb específicamente para este test
    vi.doMock('idb', () => ({
      openDB: vi.fn().mockRejectedValue(new Error('Error de base de datos'))
    }))
    
    const { initProgressSystem, resetProgressSystem } = await import('./all.js')
    
    // Verificar que el sistema puede manejar errores de DB de manera elegante
    await expect(async () => {
      await resetProgressSystem()
      await initProgressSystem()
    }).rejects.toThrow()
    
    // Limpiar el mock después del test
    vi.doUnmock('idb')
  })
})

