import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker in production with error handling
if ('serviceWorker' in navigator && import.meta.env.PROD) {
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
        if (typeof gtag !== 'undefined') {
          gtag('event', 'exception', {
            description: `SW Registration Failed: ${error.message}`,
            fatal: false
          })
        }
      })
  })
}
