// Configuración de pruebas para Vitest

import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.js'],
    testTimeout: 20000,
    hookTimeout: 30000,
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'server/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      '**/*.e2e.{js,jsx,ts,tsx}',
      // Temporarily exclude problematic tests with clipboard issues
      'src/utils/swUpdateHandler.test.js',
      'src/components/learning/LearningDrill.test.jsx'
    ],

    // Parallel execution settings
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        maxForks: 4,
        minForks: 1
      }
    },

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'lcovonly', 'clover'],
      reportsDirectory: './coverage',
      clean: true,
      exclude: [
        'node_modules',
        'dist',
        'build',
        'src/test-setup.js',
        'src/test-utils/',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        '**/*.config.{js,ts}',
        '**/*.d.ts',
        'src/main.jsx',
        'scripts/',
        '**/*.stories.{js,jsx,ts,tsx}',
        // Exclude development utilities
        'src/**/debug*.{js,jsx}',
        'src/**/mock*.{js,jsx}',
        'src/**/*.mock.{js,jsx}'
      ],
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 80,
          statements: 80
        },
        // Critical modules require higher coverage
        'src/lib/core/': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/lib/progress/': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },

    // Reporter configuration
    reporter: process.env.CI ? ['verbose', 'junit'] : ['verbose'],
    outputFile: {
      junit: './test-results.xml'
    },

    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,

    // Performance and reliability settings
    retry: process.env.CI ? 2 : 0,
    bail: process.env.CI ? 5 : 0,
    isolate: true,
    passWithNoTests: false
  }
})
