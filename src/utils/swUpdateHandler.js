/**
 * Service Worker Update Handler
 * Manages PWA updates and provides user notifications for new versions
 */

let updateAvailable = false
let registration = null
let initialized = false
let updateIntervalId = null
let lastUpdateCheckAt = 0

const ACTIVE_CHECK_INTERVAL_MS = 5 * 60 * 1000
const MIN_CHECK_GAP_MS = 60 * 1000

function clearExistingInterval() {
  if (typeof window !== 'undefined' && window.__CONJU_SW_UPDATE_INTERVAL__) {
    clearInterval(window.__CONJU_SW_UPDATE_INTERVAL__)
    window.__CONJU_SW_UPDATE_INTERVAL__ = null
  }
}

function scheduleIdleCheck() {
  if (typeof window === 'undefined') {
    return
  }

  const performCheck = () => {
    safeCheckForUpdate('idle')
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(performCheck, { timeout: 5000 })
    return
  }

  setTimeout(performCheck, 1500)
}

function safeCheckForUpdate(_reason, options = {}) {
  const { force = false } = options

  if (!registration || typeof registration.update !== 'function') {
    return
  }

  if (!force && typeof document !== 'undefined' && document.hidden) {
    return
  }

  const now = Date.now()
  if (!force && now - lastUpdateCheckAt < MIN_CHECK_GAP_MS) {
    return
  }
  lastUpdateCheckAt = now

  Promise.resolve(registration.update()).catch((error) => {
    if (import.meta.env?.DEV) {
      console.warn('SW update check failed:', error)
    }
  })
}

function setupReactiveUpdateChecks() {
  if (typeof window === 'undefined') {
    return
  }

  window.addEventListener('focus', () => safeCheckForUpdate('focus'))
  window.addEventListener('online', () => safeCheckForUpdate('online', { force: true }))
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      safeCheckForUpdate('visibility')
    }
  })
}

/**
 * Initialize service worker update detection
 */
export function initSWUpdateHandler() {
  if (initialized) return
  if (typeof window !== 'undefined') {
    if (window.__CONJU_SW_UPDATE_HANDLER__) {
      initialized = true
      return
    }
    window.__CONJU_SW_UPDATE_HANDLER__ = true
  }
  initialized = true
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        registration = await navigator.serviceWorker.ready

        clearExistingInterval()

        // Poll liviano + triggers reactivos (focus/visibility/online)
        if (!updateIntervalId) {
          updateIntervalId = setInterval(() => {
            safeCheckForUpdate('interval')
          }, ACTIVE_CHECK_INTERVAL_MS)
          if (typeof window !== 'undefined') {
            window.__CONJU_SW_UPDATE_INTERVAL__ = updateIntervalId
          }
        }

        setupReactiveUpdateChecks()
        scheduleIdleCheck()

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
  safeCheckForUpdate('manual', { force: true })
}

// Initialize when module loads
if (typeof window !== 'undefined') {
  initSWUpdateHandler()
}
