/**
 * Test utilities for Spanish Conjugator
 * Centralized testing helpers and mocks
 */

import { vi } from 'vitest'
import { render } from '@testing-library/react'
// Removed direct userEvent import to avoid clipboard issues

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

/**
 * Generate mock verb forms for testing
 */
export const mockVerb = (overrides = {}) => ({
  lemma: 'hablar',
  region: 'la_general',
  forms: [
    { mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
    { mood: 'indicative', tense: 'pres', person: '2s_tu', value: 'hablas' },
    { mood: 'indicative', tense: 'pres', person: '3s', value: 'habla' }
  ],
  ...overrides
})

/**
 * Generate mock drill item
 */
export const mockDrillItem = (overrides = {}) => ({
  lemma: 'hablar',
  mood: 'indicative',
  tense: 'pres',
  person: '1s',
  expectedValue: 'hablo',
  region: 'la_general',
  ...overrides
})

/**
 * Generate mock user progress data
 */
export const mockProgressData = (overrides = {}) => ({
  userId: 'test-user-123',
  itemId: 'hablar-ind-pres-1s',
  attempts: 5,
  correct: 4,
  masteryScore: 0.8,
  lastAttempt: Date.now() - 86400000, // 1 day ago
  ...overrides
})

/**
 * Generate mock settings
 */
export const mockSettings = (overrides = {}) => ({
  level: 'A2',
  region: 'rioplatense',
  useVoseo: true,
  useTuteo: true,
  useVosotros: false,
  practiceMode: 'mixed',
  verbType: 'all',
  practicePronoun: 'both',
  ...overrides
})

// =============================================================================
// ADVANCED MOCKS
// =============================================================================

/**
 * Mock IndexedDB with realistic behavior
 */
export const createIndexedDBMock = () => {
  const stores = new Map()

  const mockDB = {
    transaction: vi.fn((_storeNames) => {
      const transaction = {
        objectStore: vi.fn((storeName) => ({
          add: vi.fn().mockResolvedValue({ success: true }),
          get: vi.fn().mockImplementation((key) =>
            Promise.resolve(stores.get(`${storeName}-${key}`))
          ),
          put: vi.fn().mockImplementation((value, key) => {
            stores.set(`${storeName}-${key || value.id}`, value)
            return Promise.resolve({ success: true })
          }),
          delete: vi.fn().mockImplementation((key) => {
            stores.delete(`${storeName}-${key}`)
            return Promise.resolve({ success: true })
          }),
          getAll: vi.fn().mockImplementation(() => {
            const storeValues = Array.from(stores.entries())
              .filter(([k]) => k.startsWith(storeName + '-'))
              .map(([, v]) => v)
            return Promise.resolve(storeValues)
          }),
          count: vi.fn().mockResolvedValue(stores.size),
          clear: vi.fn().mockImplementation(() => {
            for (const key of stores.keys()) {
              if (key.startsWith(storeName + '-')) {
                stores.delete(key)
              }
            }
            return Promise.resolve({ success: true })
          })
        }))
      }
      return transaction
    }),
    close: vi.fn()
  }

  return { mockDB, stores }
}

/**
 * Mock Zustand store
 */
export const createMockStore = (initialState = {}) => ({
  ...initialState,
  setState: vi.fn((updates) => {
    Object.assign(initialState,
      typeof updates === 'function' ? updates(initialState) : updates
    )
  }),
  getState: vi.fn(() => initialState),
  subscribe: vi.fn(),
  destroy: vi.fn()
})

// =============================================================================
// COMPONENT TESTING UTILITIES
// =============================================================================

/**
 * Enhanced render with common providers
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialSettings = mockSettings(),
    ...renderOptions
  } = options

  // Mock settings store
  const MOCK_SETTINGS_STORE = createMockStore(initialSettings)

  const Wrapper = ({ children }) => {
    // Here you would wrap with actual providers like:
    // <SettingsProvider value={mockSettingsStore}>
    //   {children}
    // </SettingsProvider>
    return children
  }

  return {
    user: { click: vi.fn(), type: vi.fn() },
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}

/**
 * Wait for async operations to complete
 */
export const waitForAsync = (timeout = 1000) =>
  new Promise(resolve => setTimeout(resolve, timeout))

/**
 * Custom matcher for DOM testing
 */
export const expectToBeInDocument = (element) => {
  expect(element).toBeInTheDocument()
  return element
}

// =============================================================================
// PERFORMANCE TESTING UTILITIES
// =============================================================================

/**
 * Measure function execution time
 */
export const measurePerformance = async (fn, iterations = 100) => {
  const times = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await fn()
    const end = performance.now()
    times.push(end - start)
  }

  return {
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
  }
}

/**
 * Memory usage tracker
 */
export const trackMemory = () => {
  if (typeof performance === 'undefined' || !performance.memory) {
    return { used: 0, total: 0, percentage: 0 }
  }

  const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory
  return {
    used: usedJSHeapSize,
    total: totalJSHeapSize,
    limit: jsHeapSizeLimit,
    percentage: (usedJSHeapSize / totalJSHeapSize) * 100
  }
}

// =============================================================================
// DATA VALIDATION HELPERS
// =============================================================================

/**
 * Validate verb form structure
 */
export const isValidVerbForm = (form) => {
  return form &&
    typeof form === 'object' &&
    typeof form.lemma === 'string' &&
    typeof form.mood === 'string' &&
    typeof form.tense === 'string' &&
    typeof form.person === 'string' &&
    typeof form.value === 'string'
}

/**
 * Create test database with sample data
 */
export const createTestDatabase = async () => {
  const { mockDB, stores } = createIndexedDBMock()

  // Populate with sample data
  const sampleVerbs = [
    mockVerb({ lemma: 'hablar' }),
    mockVerb({ lemma: 'comer', forms: [
      { mood: 'indicative', tense: 'pres', person: '1s', value: 'como' }
    ]}),
    mockVerb({ lemma: 'vivir', forms: [
      { mood: 'indicative', tense: 'pres', person: '1s', value: 'vivo' }
    ]})
  ]

  for (const verb of sampleVerbs) {
    stores.set(`verbs-${verb.lemma}`, verb)
  }

  return { mockDB, stores }
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Assert that generator produces valid forms
 */
export const expectValidGeneratorOutput = (result) => {
  expect(result).toBeDefined()
  if (result) {
    expect(isValidVerbForm(result)).toBe(true)
    expect(result.lemma).toMatch(/^[a-záéíóúñü]+r?$/)
    expect(['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']).toContain(result.mood)
  }
  return result
}

/**
 * Assert progress tracking data integrity
 */
export const expectValidProgressData = (data) => {
  expect(data).toBeDefined()
  expect(data.userId).toBeTruthy()
  expect(data.itemId).toBeTruthy()
  expect(typeof data.masteryScore === 'number').toBe(true)
  expect(data.masteryScore).toBeGreaterThanOrEqual(0)
  expect(data.masteryScore).toBeLessThanOrEqual(1)
  return data
}

// =============================================================================
// CLEANUP UTILITIES
// =============================================================================

/**
 * Clean up test environment
 */
export const cleanupTests = () => {
  vi.clearAllMocks()
  vi.resetAllMocks()
  vi.restoreAllMocks()

  // Clear any global state
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
    window.sessionStorage.clear()
  }
}

// Export commonly used testing library functions
export * from '@testing-library/react'
export { vi }

// Simple user event simulation without clipboard issues
export const userEvent = {
  setup: () => ({
    click: vi.fn(),
    type: vi.fn(),
    keyboard: vi.fn(),
    hover: vi.fn(),
    unhover: vi.fn(),
    selectOptions: vi.fn()
  })
}