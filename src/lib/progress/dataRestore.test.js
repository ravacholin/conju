// Pruebas para el módulo de restauración de datos

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createBackup, restoreProgressData, importFromFile } from './dataRestore.js'

const storeData = {
  attempts: new Map(),
  mastery: new Map(),
  schedules: new Map()
}

const resetStores = () => {
  Object.values(storeData).forEach(store => store.clear())
}

const seedStore = (storeName, record) => {
  storeData[storeName].set(record.id || `${storeName}-${storeData[storeName].size + 1}`, record)
}

// Mock de IndexedDB para pruebas
import 'fake-indexeddb/auto'

// Mock del userManager
vi.mock('./userManager/index.js', () => ({
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
vi.mock('./database.js', () => {
  const mockApi = {
    saveToDB: vi.fn(async (storeName, data) => {
      const id = data.id || `${storeName}-${storeData[storeName].size + 1}`
      storeData[storeName].set(id, { ...data, id })
    }),
    getFromDB: vi.fn(async (storeName, id) => storeData[storeName].get(id) || null),
    getByIndex: vi.fn(async (storeName, indexName, value) => {
      const values = Array.from(storeData[storeName].values())
      switch (indexName) {
        case 'itemId':
          return values.filter(record => record.itemId === value)
        case 'userId':
          return values.filter(record => record.userId === value)
        case 'mood-tense-person':
          return values.filter(record =>
            Array.isArray(value) &&
            record.mood === value[0] &&
            record.tense === value[1] &&
            record.person === value[2]
          )
        default:
          return values
      }
    }),
    getOneByIndex: vi.fn(async (storeName, indexName, value) => {
      const results = await mockApi.getByIndex(storeName, indexName, value)
      return Array.isArray(results) && results.length > 0 ? results[0] : null
    }),
    getAllFromDB: vi.fn(async (storeName) => Array.from(storeData[storeName].values()))
  }

  return mockApi
})

describe('Sistema de Restauración de Datos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStores()
  })

  afterEach(() => {
    vi.clearAllMocks()
    resetStores()
  })

  describe('createBackup', () => {
    it('debería crear respaldo exitosamente con localStorage disponible', async () => {
      // Simular localStorage disponible
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn()
      }

      if (!global.window) {
        global.window = {}
      }

      Object.defineProperty(global.window, 'localStorage', {
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
        expect.stringContaining('⚠️ localStorage no disponible - respaldo no persistido localmente')
      )

      // Restaurar window
      global.window = originalWindow
      consoleWarnSpy.mockRestore()
      consoleLogSpy.mockRestore()
    })

    it('debería crear respaldo sin localStorage cuando no está definido', async () => {
      // Simular window sin localStorage
      if (!global.window) {
        global.window = {}
      }
      const originalLocalStorage = global.window.localStorage
      Object.defineProperty(global.window, 'localStorage', {
        value: undefined,
        configurable: true
      })

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const backupData = await createBackup()

      expect(backupData).toBeDefined()
      expect(backupData.metadata.backupType).toBe('automatic')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ localStorage no disponible - respaldo no persistido localmente')
      )

      // Restaurar localStorage
      Object.defineProperty(global.window, 'localStorage', {
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

      if (!global.window) {
        global.window = {}
      }

      Object.defineProperty(global.window, 'localStorage', {
        value: mockLocalStorage,
        configurable: true
      })

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const backupData = await createBackup()

      expect(backupData).toBeDefined()
      expect(backupData.metadata.backupType).toBe('automatic')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ No se pudo guardar el respaldo en localStorage:'),
        expect.stringContaining('QuotaExceededError: localStorage is full')
      )

      consoleWarnSpy.mockRestore()
      consoleLogSpy.mockRestore()
    })

    it('debería usar el userId proporcionado como parámetro', async () => {
      const customUserId = 'custom-user-456'
      const { getCurrentUserId } = await import('./userManager/index.js')

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

    it('debería omitir registros existentes cuando no se permite sobrescribir', async () => {
      const baseAttempt = {
        id: 'attempt-1',
        userId: 'target-user',
        itemId: 'item-1',
        timestamp: '2024-01-01T00:00:00.000Z'
      }
      const baseMastery = {
        id: 'mastery-1',
        userId: 'target-user',
        mood: 'indicativo',
        tense: 'presente',
        person: '1s'
      }
      const baseSchedule = {
        id: 'schedule-1',
        userId: 'target-user',
        itemId: 'item-1'
      }

      seedStore('attempts', baseAttempt)
      seedStore('mastery', baseMastery)
      seedStore('schedules', baseSchedule)

      const importData = {
        metadata: {
          userId: 'target-user',
          exportDate: new Date().toISOString(),
          version: '1.0.0'
        },
        data: {
          attempts: [baseAttempt],
          mastery: [baseMastery],
          schedules: [baseSchedule]
        }
      }

      const { saveToDB } = await import('./database.js')
      const result = await restoreProgressData(importData, {
        userId: 'target-user',
        overwriteExisting: false
      })

      expect(result.attempts.skipped).toBe(1)
      expect(result.mastery.skipped).toBe(1)
      expect(result.schedules.skipped).toBe(1)
      expect(result.totalProcessed).toBe(0)
      expect(saveToDB).not.toHaveBeenCalled()
    })

    it('debería sobrescribir registros existentes cuando se permite', async () => {
      const attempt = {
        id: 'attempt-1',
        userId: 'target-user',
        itemId: 'item-1',
        timestamp: '2024-01-01T00:00:00.000Z'
      }
      const mastery = {
        id: 'mastery-1',
        userId: 'target-user',
        mood: 'indicativo',
        tense: 'presente',
        person: '1s'
      }
      const schedule = {
        id: 'schedule-1',
        userId: 'target-user',
        itemId: 'item-1'
      }

      seedStore('attempts', attempt)
      seedStore('mastery', mastery)
      seedStore('schedules', schedule)

      const importData = {
        metadata: {
          userId: 'target-user',
          exportDate: new Date().toISOString(),
          version: '1.0.0'
        },
        data: {
          attempts: [{ ...attempt, correct: false }],
          mastery: [{ ...mastery, score: 90 }],
          schedules: [{ ...schedule, nextDue: new Date().toISOString() }]
        }
      }

      const { saveToDB } = await import('./database.js')
      const result = await restoreProgressData(importData, {
        userId: 'target-user',
        overwriteExisting: true
      })

      expect(result.attempts.imported).toBe(1)
      expect(result.mastery.imported).toBe(1)
      expect(result.schedules.imported).toBe(1)
      expect(result.totalProcessed).toBe(3)
      expect(saveToDB).toHaveBeenCalledTimes(3)
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