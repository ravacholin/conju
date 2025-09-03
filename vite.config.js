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
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/zustand')) {
            return 'vendor-state' 
          }
          if (id.includes('node_modules')) {
            return 'vendor-libs'
          }
          
          // Heavy verb data - load separately
          if (id.includes('src/data/verbs.js')) {
            return 'data-verbs'
          }
          
          // Progress system - heavy modules
          if (id.includes('src/lib/progress/')) {
            return 'progress-system'
          }
          
          // Core logic
          if (id.includes('src/lib/core/')) {
            return 'core-engine'
          }
        }
      }
    },
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2
      }
    } : undefined,
    sourcemap: mode === 'development'
  },
  server: {
    // Force IPv4 to avoid rare ::1 issues on some setups
    host: '127.0.0.1',
    port: 5175,
    strictPort: false
  }
}))
