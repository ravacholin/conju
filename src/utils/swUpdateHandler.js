/**
 * Service Worker Update Handler
 * Manages PWA updates and provides user notifications for new versions
 */

let updateAvailable = false
let registration = null
let initialized = false
let updateIntervalId = null

/**
 * Initialize service worker update detection
 */
export function initSWUpdateHandler() {
  if (initialized) return
  initialized = true
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        registration = await navigator.serviceWorker.ready

        // Check for updates every 30 seconds when app is active
        if (!updateIntervalId) {
          updateIntervalId = setInterval(() => {
            if (!document.hidden) {
              registration.update()
            }
          }, 30000)
        }

        // Listen for new service worker installation
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              updateAvailable = true
              showUpdateNotification()
            }
          })
        })

        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'CACHE_UPDATED') {
            updateAvailable = true
            showUpdateNotification()
          }
        })

      } catch (error) {
        console.error('SW registration failed:', error)
      }
    })
  }
}

/**
 * Show update notification to user
 */
function showUpdateNotification() {
  // Create simple notification banner
  if (document.getElementById('sw-update-banner')) return

  const banner = document.createElement('div')
  banner.id = 'sw-update-banner'
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #0f172a;
    color: white;
    padding: 12px;
    text-align: center;
    z-index: 10000;
    border-bottom: 2px solid #1e293b;
    font-family: system-ui, -apple-system, sans-serif;
  `

  banner.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 16px;">
      <span>🚀 Nueva versión disponible</span>
      <button id="sw-update-btn" style="
        background: #3b82f6;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">Actualizar</button>
      <button id="sw-dismiss-btn" style="
        background: transparent;
        color: #94a3b8;
        border: 1px solid #475569;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      ">Después</button>
    </div>
  `

  document.body.prepend(banner)

  document.getElementById('sw-update-btn').addEventListener('click', () => {
    applyUpdate()
  })

  document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
    banner.remove()
  })
}

/**
 * Apply the service worker update
 */
export function applyUpdate() {
  if (updateAvailable && registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  }
}

/**
 * Force check for updates
 */
export function checkForUpdate() {
  if (registration) {
    registration.update()
  }
}

// Initialize when module loads
if (typeof window !== 'undefined') {
  initSWUpdateHandler()
}
