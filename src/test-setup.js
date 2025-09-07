// Test setup for Spanish Conjugator
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage for tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock IndexedDB for tests
globalThis.indexedDB = {
  open: vi.fn().mockResolvedValue({
    result: {
      transaction: vi.fn().mockReturnValue({
        objectStore: vi.fn().mockReturnValue({
          add: vi.fn().mockResolvedValue({}),
          get: vi.fn().mockResolvedValue({}),
          put: vi.fn().mockResolvedValue({}),
        }),
      }),
    },
  }),
}