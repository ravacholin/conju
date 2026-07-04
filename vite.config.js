import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// import { spawn, spawnSync } from 'node:child_process'
// import { existsSync } from 'node:fs'
// import { join } from 'node:path'

// Kept in sync with workbox.maximumFileSizeToCacheInBytes below. If the data-verbs chunk
// grows past this limit, Workbox silently drops it from the PWA precache — the app then
// loses offline support for the core verb dataset with no build-time signal.
const PWA_PRECACHE_LIMIT_BYTES = 5 * 1024 * 1024

// Warns (loudly, in the build log) when the data-verbs chunk approaches the precache
// limit above, instead of relying on Workbox's silent drop to surface the problem.
function checkDataVerbsChunkSize() {
  return {
    name: 'check-data-verbs-chunk-size',
    apply: 'build',
    generateBundle(_options, bundle) {
      const warnThreshold = PWA_PRECACHE_LIMIT_BYTES * 0.8
      for (const chunkOrAsset of Object.values(bundle)) {
        if (chunkOrAsset.type !== 'chunk' || chunkOrAsset.name !== 'data-verbs') continue
        const size = Buffer.byteLength(chunkOrAsset.code, 'utf8')
        if (size > warnThreshold) {
          const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(2)
          console.warn(
            `⚠️  [check-data-verbs-chunk-size] data-verbs chunk is ${mb(size)}MB ` +
            `(limit for the PWA precache is ${mb(PWA_PRECACHE_LIMIT_BYTES)}MB). ` +
            `If it crosses the limit, Workbox silently excludes it from the offline precache.`
          )
        }
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    checkDataVerbsChunkSize(),
    // Dev helper: auto-arranca el servidor de sync local si existe
    // DESHABILITADO: Usando servidor remoto en conju.onrender.com
    // {
    //   name: 'spawn-sync-server',
    //   apply: 'serve',
    //   configureServer() {
    //     console.log('[sync-server] Usando servidor remoto: https://conju.onrender.com/api')
    //   }
    // },
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
        maximumFileSizeToCacheInBytes: PWA_PRECACHE_LIMIT_BYTES,
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Force immediate activation and cache invalidation
        navigateFallbackDenylist: [/^\/_/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/verb-os\.vercel\.app\/assets\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dynamic-assets',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
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
        // Generate more stable chunk names to reduce cache invalidation
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const name = facadeModuleId.split('/').pop()?.replace('.jsx', '') || 'chunk'
            return `assets/${name}-[hash].js`
          }
          return 'assets/[name]-[hash].js'
        },
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
          
          // Verb data - now loaded directly
          if (id.includes('src/data/verbs.js')) {
            return 'data-verbs' // Main verb data
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
    target: 'esnext',
    // Verb datasets are intentionally split but some single modules (legacy fallbacks)
    // remain heavy; raise limit to avoid noisy warnings while keeping code-splitting.
    chunkSizeWarningLimit: 3000,
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
    // Bind to all interfaces for reliability; allow localhost and LAN
    host: true,
    port: 5173,
    strictPort: false,
    open: '/learning',
    // Handle SPA routing - fallback to index.html for all routes
    middlewares: {
      fallthrough: false
    }
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    open: '/learning'
  }
}))
