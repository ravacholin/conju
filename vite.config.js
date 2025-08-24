import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Allow disabling PWA generation in environments where workbox/terser
      // combination is unstable (e.g., some Node 22 builds)
      disable: process.env.DISABLE_PWA === 'true' || process.versions?.node?.startsWith?.('22.'),
      // Avoid terser renderChunk issues on some Node/terser combos
      minify: false,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 // 5MB limit
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
  server: {
    // Force IPv4 to avoid rare ::1 issues on some setups
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
})
