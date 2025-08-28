import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      // Disable PWA in non‑production or when explicitly requested, or on some Node 22 builds
      disable: mode !== 'production' || process.env.DISABLE_PWA === 'true' || process.versions?.node?.startsWith?.('22.'),
      // Avoid terser renderChunk issues on some Node/terser combos
      minify: false,
      // Inject registration automatically to avoid manual SW registration
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB limit
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      },
      manifest: {
        name: 'VerbOS - Conjugador de Español',
        short_name: 'VerbOS',
        description: 'Entrenador de conjugación de verbos en español',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0f172a',
        icons: [
          { src: 'favicon.png', sizes: '192x192', type: 'image/png' },
          { src: 'favicon.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Core vendor libraries
          vendor: ['react', 'react-dom'],
          // Progress system (heavy analytical components)
          progress: [
            './src/lib/progress/database.js',
            './src/lib/progress/analytics.js',
            './src/lib/progress/realTimeAnalytics.js',
            './src/lib/progress/AdaptivePracticeEngine.js',
            './src/lib/progress/DifficultyManager.js'
          ],
          // Data chunks (verb data)
          data: ['./src/data/verbs.js'],
          // Utilities and helpers
          utils: [
            './src/lib/progress/utils.js',
            './src/lib/progress/helpers.js',
            './src/lib/core/optimizedCache.js'
          ]
        }
      }
    },
    // Increase warning limit for large bundles (progress system is complex)
    chunkSizeWarningLimit: 800,
    // Enable minification for production
    minify: mode === 'production' ? 'terser' : false,
    // Generate source maps for debugging
    sourcemap: mode === 'development'
  },
  server: {
    // Force IPv4 to avoid rare ::1 issues on some setups
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
}))
