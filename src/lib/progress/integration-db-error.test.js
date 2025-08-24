// Prueba aislada de error de integración forzando fallo en IndexedDB
import { describe, it, expect, beforeEach, vi } from 'vitest'
// Mock de idb antes de cualquier import para este archivo
vi.mock('idb', () => ({
  openDB: vi.fn().mockRejectedValue(new Error('Error de base de datos'))
}))
// Mock de IndexedDB para entorno de pruebas
import 'fake-indexeddb/auto'

describe('Integración - Errores de DB', () => {
  beforeEach(() => {
    // Asegurar módulos limpios para cada prueba en este archivo
    vi.resetModules()
  })

  it('debería manejar errores de integración correctamente', async () => {
    const { initProgressSystem, resetProgressSystem } = await import('./all.js')
    await resetProgressSystem()
    await expect(initProgressSystem()).rejects.toThrow('Error de base de datos')
  })
})

