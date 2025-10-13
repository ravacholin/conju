// Test setup for Spanish Conjugator
import '@testing-library/jest-dom'
import { vi, beforeEach, afterEach } from 'vitest'
import { createIndexedDBMock } from './test-utils/index.js'

vi.mock('@testing-library/react', async () => {
  const actual = await vi.importActual('@testing-library/react')

  return {
    ...actual,
    render: (...args) => {
      if (
        globalThis.__FORCE_SSR_FALLBACK__ &&
        typeof globalThis.window === 'undefined' &&
        globalThis.document?.defaultView
      ) {
        globalThis.window = globalThis.document.defaultView
        globalThis.__SSR_WINDOW_FALLBACK__ = true
      }
      return actual.render(...args)
    }
  }
})

// =============================================================================
// ENVIRONMENT SETUP
// =============================================================================

// Performance API mock for consistent testing
globalThis.performance = globalThis.performance || {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  },
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => [])
}

// =============================================================================
// WEB APIS MOCKS
// =============================================================================

// Enhanced localStorage mock with realistic behavior
const createStorage = () => {
  const storage = new Map()
  return {
    getItem: vi.fn((key) => storage.get(key) || null),
    setItem: vi.fn((key, value) => storage.set(key, String(value))),
    removeItem: vi.fn((key) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    get length() { return storage.size },
    key: vi.fn((index) => Array.from(storage.keys())[index] || null)
  }
}

// Create storage instances that persist across tests
const mockLocalStorage = createStorage()
const mockSessionStorage = createStorage()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
})

// Mock clipboard API - provide minimal implementation to avoid test library issues
Object.defineProperty(navigator, 'clipboard', {
  value: {
    readText: vi.fn().mockResolvedValue(''),
    writeText: vi.fn().mockResolvedValue(undefined),
    read: vi.fn().mockResolvedValue([]),
    write: vi.fn().mockResolvedValue(undefined)
  },
  writable: true,
  configurable: true
})

// Provide minimal ClipboardItem for user-event compatibility
Object.defineProperty(window, 'ClipboardItem', {
  value: function ClipboardItem(data) {
    this.data = data
  },
  writable: true,
  configurable: true
})

// Enhanced IndexedDB mock
const { mockDB } = createIndexedDBMock()
globalThis.indexedDB = {
  open: vi.fn().mockImplementation((_name, _version) => {
    return Promise.resolve({
      result: mockDB,
      transaction: mockDB.transaction
    })
  }),
  deleteDatabase: vi.fn().mockResolvedValue({ success: true })
}

// Service Worker mock
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: { postMessage: vi.fn() },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: { postMessage: vi.fn() },
      addEventListener: vi.fn(),
      update: vi.fn()
    }),
    addEventListener: vi.fn()
  },
  writable: true
})

// Cache API mock for PWA testing
globalThis.caches = {
  open: vi.fn().mockResolvedValue({
    match: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue(undefined),
    addAll: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(true),
    keys: vi.fn().mockResolvedValue([])
  }),
  match: vi.fn().mockResolvedValue(undefined),
  has: vi.fn().mockResolvedValue(false),
  delete: vi.fn().mockResolvedValue(true),
  keys: vi.fn().mockResolvedValue([])
}

// =============================================================================
// DOM & BROWSER APIS
// =============================================================================

// ResizeObserver mock
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}))

// IntersectionObserver mock
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  trigger: (entries) => callback(entries)
}))

// matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

// scrollTo mock
window.scrollTo = vi.fn()

// Ensure media elements support promise-based play invocation in tests
const ensureMediaPlaybackMocks = () => {
  if (typeof globalThis.HTMLMediaElement === 'undefined') return

  const currentPlay = globalThis.HTMLMediaElement.prototype.play
  if (!currentPlay || !currentPlay.__isMockPlayback) {
    const mockPlay = vi.fn(() => Promise.reject(new Error('Audio playback not supported in tests')))
    mockPlay.__isMockPlayback = true

    Object.defineProperty(globalThis.HTMLMediaElement.prototype, 'play', {
      configurable: true,
      writable: true,
      value: mockPlay
    })
  }
}

ensureMediaPlaybackMocks()

if (typeof globalThis.SpeechSynthesisUtterance === 'undefined') {
  globalThis.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text = '') {
    this.text = text
    this.lang = 'es-ES'
    this.rate = 1
    this.pitch = 1
    this.volume = 1
    this.onstart = null
    this.onend = null
    this.onerror = null
  }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Suppress console warnings in tests unless explicitly needed
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

console.error = (...args) => {
  if (
    args[0]?.includes?.('Warning: ReactDOM.render is deprecated') ||
    args[0]?.includes?.('Warning: componentWillMount has been renamed')
  ) {
    return
  }
  originalConsoleError.call(console, ...args)
}

console.warn = (...args) => {
  if (args[0]?.includes?.('deprecated')) {
    return
  }
  originalConsoleWarn.call(console, ...args)
}

// =============================================================================
// GLOBAL TEST HOOKS
// =============================================================================

beforeEach(() => {
  ensureMediaPlaybackMocks()

  // Reset all mocks before each test
  vi.clearAllMocks()

  // Clear DOM
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = ''
  }

  if (typeof window !== 'undefined') {
    // Reset window location
    try {
      delete window.location
    } catch {
      // ignore deletion issues in secure contexts
    }
    window.location = {
      href: 'http://localhost:5173',
      origin: 'http://localhost:5173',
      pathname: '/',
      search: '',
      hash: '',
      reload: vi.fn()
    }
  }
})

afterEach(() => {
  // Cleanup after each test
  vi.resetAllMocks()

  // Clear storage safely
  if (typeof window !== 'undefined') {
    if (window.localStorage?.clear) {
      window.localStorage.clear()
    }
    if (window.sessionStorage?.clear) {
      window.sessionStorage.clear()
    }
  }

  if (typeof globalThis !== 'undefined' && globalThis.__SSR_WINDOW_FALLBACK__) {
    delete globalThis.__SSR_WINDOW_FALLBACK__
  }

  if (typeof globalThis !== 'undefined' && globalThis.__FORCE_SSR_FALLBACK__) {
    delete globalThis.__FORCE_SSR_FALLBACK__
  }

  // Clean up timers
  vi.useRealTimers()
})

// =============================================================================
// CUSTOM MATCHERS
// =============================================================================

expect.extend({
  toHaveValidVerbForm(received) {
    const isValid = received &&
      typeof received === 'object' &&
      typeof received.lemma === 'string' &&
      typeof received.mood === 'string' &&
      typeof received.tense === 'string' &&
      typeof received.person === 'string' &&
      typeof received.value === 'string'

    return {
      message: () =>
        isValid
          ? `Expected ${received} not to be a valid verb form`
          : `Expected ${received} to be a valid verb form with lemma, mood, tense, person, and value`,
      pass: isValid
    }
  },

  toHaveValidMasteryScore(received) {
    const isValid = typeof received === 'number' &&
      received >= 0 &&
      received <= 1

    return {
      message: () =>
        isValid
          ? `Expected ${received} not to be a valid mastery score`
          : `Expected ${received} to be a number between 0 and 1`,
      pass: isValid
    }
  }
})

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.VITE_APP_VERSION = '1.0.0-test'

// Disable animations for testing
const disableAnimations = () => {
  const style = document.createElement('style')
  style.innerHTML = `
    *, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }
  `
  document.head.appendChild(style)
}

// Apply animation disable on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', disableAnimations)
} else {
  disableAnimations()
}
