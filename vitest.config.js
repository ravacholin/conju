// Configuración de pruebas para Vitest

import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.js'],
    testTimeout: 20000,
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', 'build'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'test-setup.js']
    }
  }
})
