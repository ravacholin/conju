// Test setup for Spanish Conjugator
import '@testing-library/jest-dom'

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
global.indexedDB = {
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