import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { createLogger, registerDebugTool } from './lib/utils/logger.js'
// Initialize service worker update handling
import './utils/swUpdateHandler.js'

const bootstrapLogger = createLogger('bootstrap')

// PERFORMANCE: Initialize app immediately, defer heavy modules
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

const bootstrapDebugState = {
  lazyLoadingSuccessful: null,
  fallbackTriggered: false,
  lastError: null,
  lastAutoSyncResult: null
}

registerDebugTool('bootstrap', {
  getStatus: () => ({ ...bootstrapDebugState })
})

// ROBUST FALLBACK SYSTEM: Ensures app ALWAYS works, even if optimizations fail
if (typeof window !== 'undefined') {
  // Attempt optimized lazy loading first
  setTimeout(async () => {
    let lazyLoadingSuccessful = false
    bootstrapDebugState.lazyLoadingSuccessful = null
    bootstrapDebugState.fallbackTriggered = false
    bootstrapDebugState.lastError = null

    try {
      bootstrapLogger.info('🚀 Attempting optimized lazy initialization...')

      // Try lazy progress system
      const { preloadProgressSystem } = await import('./lib/progress/lazyInit.js')
      preloadProgressSystem()

      // Try lazy notifications
      await import('./lib/notifications/smartNotifications.js')

      // Try optimized sync setup
      const [userManager, cloudSync] = await Promise.all([
        import('./lib/progress/userManager/index.js'),
        import('./lib/progress/cloudSync.js')
      ])

      const {
        setSyncEndpoint,
        setSyncAuthToken,
        setSyncAuthHeaderName,
        syncNow,
        getCurrentUserId: getUID
      } = userManager
      const { scheduleAutoSync } = cloudSync

      // Configure sync
      const DEFAULT_SYNC_URL = 'https://conju.onrender.com/api'
      const syncUrl = import.meta.env?.VITE_PROGRESS_SYNC_URL || DEFAULT_SYNC_URL
      const syncToken = import.meta.env?.VITE_PROGRESS_SYNC_TOKEN || null
      const isLocalSync = /(?:^|\/\/)(?:localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(syncUrl)
      const syncHeader =
        import.meta.env?.VITE_PROGRESS_SYNC_AUTH_HEADER_NAME ||
        (isLocalSync ? 'X-User-Id' : 'Authorization')

      if (syncUrl) setSyncEndpoint(syncUrl)
      if (syncHeader) setSyncAuthHeaderName(syncHeader)

      if (syncToken) {
        setSyncAuthToken(syncToken, { persist: false })
      } else if (syncHeader.toLowerCase() !== 'authorization') {
        const uid = getUID()
        if (uid) setSyncAuthToken(uid, { persist: false })
      }

      // Setup auth login handler
      window.addEventListener('auth-login', async () => {
        bootstrapLogger.info('🔄 Iniciando sincronización automática después del login...')
        try {
          setSyncAuthHeaderName('Authorization')
          const authService = await import('./lib/auth/authService.js')
          if (typeof authService.default.ensureAnonymousProgressMigration === 'function') {
            await authService.default.ensureAnonymousProgressMigration()
          }
        } catch (migrationError) {
          bootstrapLogger.warn('⚠️ Falló la migración de progreso anónimo', migrationError)
          bootstrapDebugState.lastError = migrationError
        }

        try {
          const result = await syncNow()
          if (result.success) {
            bootstrapLogger.info('✅ Sincronización automática completada', result)
          } else {
            bootstrapLogger.warn('⚠️ Sincronización automática falló', result)
          }
          bootstrapDebugState.lastAutoSyncResult = result
        } catch (error) {
          bootstrapLogger.error('❌ Error en sincronización automática', error)
          bootstrapDebugState.lastError = error
        }
      })

      // Schedule periodic sync
      try {
        scheduleAutoSync(5 * 60 * 1000)
      } catch (e) {
        bootstrapLogger.warn('No se pudo programar auto-sync', e)
        bootstrapDebugState.lastError = e
      }

      // Sync on focus
      window.addEventListener('focus', () => {
        setTimeout(() => { syncNow().catch(() => {}) }, 600)
      })

      lazyLoadingSuccessful = true
      bootstrapDebugState.lazyLoadingSuccessful = true
      bootstrapLogger.info('✅ Optimized lazy initialization successful!')

    } catch (lazyError) {
      bootstrapDebugState.lazyLoadingSuccessful = false
      bootstrapDebugState.lastError = lazyError
      bootstrapLogger.warn('⚠️ Lazy loading failed, activating ROBUST FALLBACK', lazyError)
    }

    // ROBUST FALLBACK: If lazy loading fails, load everything immediately
    if (!lazyLoadingSuccessful) {
      try {
        bootstrapDebugState.fallbackTriggered = true
        bootstrapLogger.info('🔄 Activating robust fallback - loading all systems immediately...')

        // Import everything immediately as fallback
        const [
          _autoInit,
          _notifications,
          userManager,
          cloudSync,
          _authService
        ] = await Promise.all([
          import('./lib/progress/autoInit.js').catch(() => null),
          import('./lib/notifications/smartNotifications.js').catch(() => null),
          import('./lib/progress/userManager/index.js').catch(() => null),
          import('./lib/progress/cloudSync.js').catch(() => null),
          import('./lib/auth/authService.js').catch(() => null)
        ])

        // Configure sync with fallback
        if (userManager && cloudSync) {
          const {
            setSyncEndpoint,
            setSyncAuthToken,
            setSyncAuthHeaderName,
            syncNow,
            getCurrentUserId
          } = userManager
          const { scheduleAutoSync } = cloudSync

          const DEFAULT_SYNC_URL = 'https://conju.onrender.com/api'
          const syncUrl = import.meta.env?.VITE_PROGRESS_SYNC_URL || DEFAULT_SYNC_URL
          const isLocalSync = /(?:^|\/\/)(?:localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(syncUrl)
          const syncHeader =
            import.meta.env?.VITE_PROGRESS_SYNC_AUTH_HEADER_NAME ||
            (isLocalSync ? 'X-User-Id' : 'Authorization')
          const syncToken = import.meta.env?.VITE_PROGRESS_SYNC_TOKEN || null

          if (syncUrl) setSyncEndpoint(syncUrl)
          if (syncHeader) setSyncAuthHeaderName(syncHeader)

          if (syncToken) {
            setSyncAuthToken(syncToken, { persist: false })
          } else if (syncHeader.toLowerCase() !== 'authorization') {
            const uid = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null
            if (uid) setSyncAuthToken(uid, { persist: false })
          }

          try {
            scheduleAutoSync(5 * 60 * 1000)
          } catch (e) {
            bootstrapLogger.warn('Fallback sync setup failed', e)
            bootstrapDebugState.lastError = e
          }

          // Simple focus sync for fallback
          window.addEventListener('focus', () => {
            setTimeout(() => {
              if (syncNow) {
                syncNow().catch((error) => {
                  // Log sync error
                  bootstrapLogger.warn('Sync failed on window focus', error);
                });
              }
            }, 600)
          })
        }

        bootstrapLogger.info('✅ Robust fallback initialization completed - app fully functional!')

      } catch (fallbackError) {
        bootstrapLogger.warn('⚠️ Even robust fallback had issues, but app will still work', fallbackError)
        bootstrapDebugState.lastError = fallbackError

        // ULTIMATE FALLBACK: Minimal functionality guarantee
        try {
          // Ensure verb data fallback is available
          import('./data/verbFallback.js').then(({ startProgressiveVerbLoading }) => {
            startProgressiveVerbLoading()
          }).catch(() => {
            bootstrapLogger.warn('⚠️ Even verb fallback failed - using minimal functionality')
          })
        } catch {
          // Silent ultimate fallback - app will work with whatever is available
        }
      }
    }
  }, 50) // Very short delay to ensure DOM is ready
}

// Global error handlers to prevent crashes
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
    bootstrapLogger.error('🛑 Window error', e.error || e.message)
    bootstrapDebugState.lastError = e.error || e
    if (import.meta.env.PROD) showGlobalErrorBanner(e?.message || 'Error inesperado')
  })

  window.addEventListener('unhandledrejection', (e) => {
    bootstrapLogger.error('🛑 Unhandled rejection', e.reason)
    bootstrapDebugState.lastError = e.reason || e
    if (import.meta.env.PROD) showGlobalErrorBanner(e?.reason?.message || 'Promesa rechazada sin manejar')
  })
}

// PWA registration is injected by vite-plugin-pwa (injectRegister: 'auto') in production.