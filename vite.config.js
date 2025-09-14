import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    // Dev helper: auto-arranca el servidor de sync local si existe
    {
      name: 'spawn-sync-server',
      apply: 'serve',
      configureServer() {
        try {
          const serverDir = join(process.cwd(), 'server')
          const nodeModulesDir = join(serverDir, 'node_modules')
          if (!existsSync(nodeModulesDir)) {
            console.log('[spawn-sync-server] Instalando dependencias del servidor...')
            spawnSync('npm', ['i', '--silent'], { stdio: 'inherit', cwd: serverDir })
          }
          const proc = spawn(process.env.NODE || 'node', ['src/index.js'], {
            stdio: 'inherit',
            env: process.env,
            cwd: serverDir,
          })
          process.on('exit', () => { try { proc.kill() } catch {} })
        } catch (e) {
          console.warn('[spawn-sync-server] No se pudo iniciar el servidor de sync:', e?.message)
        }
      }
    },
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
        cleanupOutdatedCaches: true,
        // Force immediate activation and cache invalidation
        navigateFallbackDenylist: [/^\/_/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/verb-os\.vercel\.app\/assets\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dynamic-assets',
              cacheKeyWillBeUsed: async ({ request }) => {
                // Force fresh fetch for chunks when they fail to load
                return `${request.url}?t=${Date.now()}`
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
          
          // NEW: Verb chunks - different chunk for each verb group
          if (id.includes('src/data/chunks/core.js')) {
            return 'verbs-core' // Core verbs - highest priority, smallest bundle
          }
          if (id.includes('src/data/chunks/common.js')) {
            return 'verbs-common' // Common verbs - loaded early
          }
          if (id.includes('src/data/chunks/irregulars.js')) {
            return 'verbs-irregulars' // Irregular verbs - loaded on demand
          }
          if (id.includes('src/data/chunks/advanced.js')) {
            return 'verbs-advanced' // Advanced verbs - loaded when needed
          }
          if (id.includes('src/data/chunks/')) {
            return 'verbs-misc' // Any other verb chunks
          }
          
          // LEGACY: Heavy verb data - now only fallback
          if (id.includes('src/data/verbs.js')) {
            return 'data-verbs-fallback' // Original file as fallback
          }
          
          // Chunk manager and verb loading system
          if (id.includes('src/lib/core/verbChunkManager.js')) {
            return 'chunk-manager' // Load early for dynamic chunks
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
    open: '/?mode=learning'
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    open: '/?mode=learning'
  }
}))
