import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar dataset de verbos como chunk independiente
          'verbs-data': ['./src/data/verbs.js'],
          // Separar React y dependencias grandes
          'vendor-react': ['react', 'react-dom'],
          // Separar Zustand para state management
          'vendor-state': ['zustand']
        },
        // Configurar tamaño de chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId && facadeModuleId.includes('verbs.js')) {
            return 'assets/verbs-[hash].js'
          }
          return 'assets/[name]-[hash].js'
        }
      }
    },
    // Aumentar límite de advertencia para chunks grandes
    chunkSizeWarningLimit: 1000,
    // Optimizar para producción
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
