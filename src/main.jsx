import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Register service worker in production with error handling
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const enableSW = import.meta.env.VITE_ENABLE_PWA !== 'false'
  if (enableSW) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado exitosamente:', registration.scope)
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Actualizacion del Service Worker encontrada')
        })
      })
      .catch((error) => {
        console.error('❌ Error al registrar Service Worker:', error)
        
        // Report error details for production debugging
        const errorDetails = {
          message: error.message,
          name: error.name,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        }
        
        // Log detailed error for debugging
        console.error('📊 Detalles del error de Service Worker:', errorDetails)
        
        // Optional: Send error to analytics service in production
        if (typeof window.gtag !== 'undefined') {
          window.gtag('event', 'exception', {
            description: `SW Registration Failed: ${error.message}`,
            fatal: false
          })
        }
      })
    })
  } else {
    console.log('⏸️ Registro de Service Worker deshabilitado por VITE_ENABLE_PWA=false')
  }
}

// Global error handlers to avoid silent failures
if (typeof window !== 'undefined') {
  const showGlobalErrorBanner = (msg) => {
    try {
      const id = 'global-error-banner'
      if (document.getElementById(id)) return
      const el = document.createElement('div')
      el.id = id
      el.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#7f1d1d;color:#fff;padding:8px 12px;z-index:9999;font-family:sans-serif;font-size:14px;'
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
