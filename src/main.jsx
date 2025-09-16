import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
// Inicializar automáticamente el sistema de progreso
import './lib/progress/autoInit.js'
// Initialize service worker update handling
import './utils/swUpdateHandler.js'
// Wire sync endpoint and auth from env (if provided)
import { setSyncEndpoint, setSyncAuthToken, setSyncAuthHeaderName, syncNow } from './lib/progress/userManager.js'
import { getCurrentUserId as getUID } from './lib/progress/userManager.js'

// Read env-provided sync config and apply once on load
if (typeof window !== 'undefined') {
  const syncUrl = import.meta.env?.VITE_PROGRESS_SYNC_URL || 'http://localhost:8787/api'
  const syncToken = import.meta.env?.VITE_PROGRESS_SYNC_TOKEN || null
  const syncHeader = import.meta.env?.VITE_PROGRESS_SYNC_AUTH_HEADER_NAME || null
  if (syncUrl) setSyncEndpoint(syncUrl)
  if (syncHeader) setSyncAuthHeaderName(syncHeader)
  if (syncToken) {
    setSyncAuthToken(syncToken, { persist: false })
  } else {
    // Fallback: usar userId local como token y cabecera X-User-Id
    setSyncAuthHeaderName('X-User-Id')
    const uid = getUID()
    if (uid) setSyncAuthToken(uid, { persist: false })
  }

  // Setup automatic sync on login
  window.addEventListener('auth-login', async () => {
    console.log('🔄 Iniciando sincronización automática después del login...')
    try {
      const result = await syncNow()
      if (result.success) {
        console.log('✅ Sincronización automática completada:', result)
      } else {
        console.log('⚠️ Sincronización automática falló:', result.reason)
      }
    } catch (error) {
      console.warn('❌ Error en sincronización automática:', error.message)
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// PWA registration is injected by vite-plugin-pwa (injectRegister: 'auto') in production.
// If you need a custom update UI, migrate to `virtual:pwa-register` here.

// Global error handlers to avoid silent failures
if (typeof window !== 'undefined') {
  const showGlobalErrorBanner = (msg) => {
    try {
      const id = 'global-error-banner'
      if (document.getElementById(id)) return
      const el = document.createElement('div')
      el.id = id
      el.style.cssText = 'position:fixed;top:0;left:0;right:0;background:var(--accent-red);color:#fff;padding:8px 12px;z-index:9999;font-family:sans-serif;font-size:14px;'
      el.textContent = `⚠️ Error de aplicación: ${msg}`
      document.body.appendChild(el)
    } catch {/* ignore DOM errors */}
  }
  window.addEventListener('error', (e) => {
    console.error('🛑 Window error:', e.error || e.message)
    if (import.meta.env.PROD) showGlobalErrorBanner(e?.message || 'Error inesperado')
  })
  window.addEventListener('unhandledrejection', (e) => {
    console.error('🛑 Unhandled rejection:', e.reason)
    if (import.meta.env.PROD) showGlobalErrorBanner(e?.reason?.message || 'Promesa rechazada sin manejar')
  })
}
