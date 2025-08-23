// Configuración de pruebas (setup file)

// Configuración global para las pruebas
console.log('🔧 Configurando entorno de pruebas...')

// Mock de IndexedDB para pruebas
import 'fake-indexeddb/auto'

// Mock de localStorage
const localStorageMock = (() => {
  let store = {}
  
  return {
    getItem(key) {
      return store[key] || null
    },
    setItem(key, value) {
      store[key] = value.toString()
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    }
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
})

console.log('✅ Entorno de pruebas configurado')