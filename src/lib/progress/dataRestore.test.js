// Pruebas para el módulo de restauración de datos

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createBackup, restoreProgressData, importFromFile } from './dataRestore.js'

// Mock de IndexedDB para pruebas
import 'fake-indexeddb/auto'

// Mock del userManager
vi.mock('./userManager.js', () => ({
  getCurrentUserId: vi.fn().mockReturnValue('test-user-123')
}))

// Mock del dataExport
vi.mock('./dataExport.js', () => ({
  exportProgressData: vi.fn().mockResolvedValue({
    metadata: {
      userId: 'test-user-123',
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      totalRecords: 10
    },
    data: {
      attempts: [
        { id: 'attempt-1', correct: true, createdAt: new Date().toISOString() }
      ],
      mastery: [
        { id: 'mastery-1', score: 85 }
      ],
      schedules: [
        { id: 'schedule-1', nextDue: new Date().toISOString() }
      ]
    }
  })
}))

// Mock de database.js
vi.mock('./database.js', () => ({
  saveToDB: vi.fn().mockResolvedValue(undefined)
}))

describe('Sistema de Restauración de Datos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createBackup', () => {
    it('debería crear respaldo exitosamente con localStorage disponible', async () => {
      // Simular localStorage disponible
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        configurable: true
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const backupData = await createBackup()

      expect(backupData).toBeDefined()
      expect(backupData.metadata.backupType).toBe('automatic')
      expect(backupData.metadata.backupId).toMatch(/^backup_\d+$/)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'progress_backup_test-user-123',
        expect.any(String)
      )

      consoleSpy.mockRestore()
    })

    it('debería crear respaldo sin localStorage disponible en SSR', async () => {
      // Simular entorno SSR (sin window)
      const originalWindow = global.window
      delete global.window

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const backupData = await createBackup()

      expect(backupData).toBeDefined()
      expect(backupData.metadata.backupType).toBe('automatic')
      expect(backupData.metadata.backupId).toMatch(/^backup_\d+$/)
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '️ localStorage no disponible - respaldo no persistido localmente'
      )

      // Restaurar window
      global.window = originalWindow
      consoleWarnSpy.mockRestore()
      consoleLogSpy.mockRestore()
    })

    it('debería crear respaldo sin localStorage cuando no está definido', async () => {
      // Simular window sin localStorage
      const originalLocalStorage = window.localStorage
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        configurable: true
      })

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const backupData = await createBackup()

      expect(backupData).toBeDefined()
      expect(backupData.metadata.backupType).toBe('automatic')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '️ localStorage no disponible - respaldo no persistido localmente'
      )

      // Restaurar localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        configurable: true
      })
      consoleWarnSpy.mockRestore()
      consoleLogSpy.mockRestore()
    })

    it('debería manejar errores de localStorage pero continuar con el respaldo', async () => {
      // Simular localStorage que lanza error
      const mockLocalStorage = {
        setItem: vi.fn().mockImplementation(() => {
          throw new Error('QuotaExceededError: localStorage is full')
        }),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        configurable: true
      })

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const backupData = await createBackup()

      expect(backupData).toBeDefined()
      expect(backupData.metadata.backupType).toBe('automatic')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '️ No se pudo guardar el respaldo en localStorage:',
        'QuotaExceededError: localStorage is full'
      )

      consoleWarnSpy.mockRestore()
      consoleLogSpy.mockRestore()
    })

    it('debería usar el userId proporcionado como parámetro', async () => {
      const customUserId = 'custom-user-456'
      const { getCurrentUserId } = await import('./userManager.js')

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const backupData = await createBackup(customUserId)

      expect(backupData).toBeDefined()
      expect(getCurrentUserId).not.toHaveBeenCalled() // No debería llamar getCurrentUserId

      consoleLogSpy.mockRestore()
    })
  })

  describe('restoreProgressData', () => {
    it('debería validar formato de datos importados', async () => {
      const invalidData = { invalid: 'format' }

      await expect(restoreProgressData(invalidData)).rejects.toThrow(
        'Formato de datos inválido'
      )
    })

    it('debería procesar datos válidos correctamente', async () => {
      const validData = {
        metadata: {
          userId: 'test-user',
          exportDate: new Date().toISOString(),
          version: '1.0.0'
        },
        data: {
          attempts: [
            {
              id: 'attempt-1',
              userId: 'original-user',
              correct: true,
              timestamp: new Date().toISOString()
            }
          ],
          mastery: [
            {
              id: 'mastery-1',
              userId: 'original-user',
              mood: 'indicativo',
              tense: 'presente',
              score: 85
            }
          ]
        }
      }

      const result = await restoreProgressData(validData, {
        userId: 'target-user',
        overwriteExisting: true
      })

      expect(result).toBeDefined()
      expect(result.totalProcessed).toBeGreaterThan(0)
      expect(result.attempts.imported).toBe(1)
      expect(result.mastery.imported).toBe(1)
    })
  })

  describe('importFromFile', () => {
    it('debería importar archivo JSON válido', async () => {
      const validData = {
        metadata: {
          userId: 'test-user',
          exportDate: new Date().toISOString(),
          version: '1.0.0'
        },
        data: {
          attempts: []
        }
      }

      const mockFile = new File([JSON.stringify(validData)], 'backup.json', {
        type: 'application/json'
      })

      const result = await importFromFile(mockFile)

      expect(result).toBeDefined()
      expect(result.totalProcessed).toBe(0) // No hay registros para importar
    })

    it('debería rechazar archivo con JSON inválido', async () => {
      const mockFile = new File(['invalid json content'], 'invalid.json', {
        type: 'application/json'
      })

      await expect(importFromFile(mockFile)).rejects.toThrow(
        'El archivo no contiene JSON válido'
      )
    })
  })
})