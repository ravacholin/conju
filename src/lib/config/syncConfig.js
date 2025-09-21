// Configuration for sync endpoints with automatic environment detection

/**
 * Determines the correct sync API base URL based on the environment
 * @returns {string} The API base URL
 */
function getSafeLocation() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const { location } = window || {}
    if (!location) return null
    const hostname = typeof location.hostname === 'string' ? location.hostname : ''
    const protocol = typeof location.protocol === 'string' ? location.protocol : ''
    const origin = typeof location.origin === 'string' ? location.origin : ''
    const port = typeof location.port === 'string' ? location.port : ''

    return { hostname, protocol, origin, port }
  } catch (error) {
    console.warn('⚠️ Unable to access window.location:', error?.message || error)
    return null
  }
}

function getSyncApiBase() {
  // 1. First, check for explicit environment variable override
  const envUrl = import.meta.env.VITE_PROGRESS_SYNC_URL
  if (envUrl) {
    console.log('🔧 Using sync URL from environment variable:', envUrl)
    return envUrl
  }

  // 2. Auto-detect environment based on window.location
  const location = getSafeLocation()
  const hostname = location?.hostname || ''

  if (hostname) {
    // Development environment detection
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const devUrl = 'http://localhost:8787/api'
      console.log('🔧 Development environment detected, using:', devUrl)
      return devUrl
    }

    // Production environment detection
    if (hostname === 'verb-os.vercel.app' || hostname.includes('vercel.app')) {
      const prodUrl = 'https://conju.onrender.com/api'
      console.log('🔧 Production environment detected, using:', prodUrl)
      return prodUrl
    }
  }

  // 3. Default fallback (should rarely be used)
  const fallbackUrl = 'https://conju.onrender.com/api'
  console.log('🔧 Using fallback sync URL:', fallbackUrl)
  return fallbackUrl
}

/**
 * Gets the authentication header name for sync requests
 * @returns {string} The header name
 */
function getSyncAuthHeaderName() {
  return import.meta.env.VITE_PROGRESS_SYNC_AUTH_HEADER_NAME || 'Authorization'
}

/**
 * Checks if we're in development mode
 * @returns {boolean} True if in development
 */
function isDevelopmentMode() {
  const location = getSafeLocation()
  const hostname = location?.hostname || ''
  if (!hostname) return false
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

/**
 * Checks if we're in production mode
 * @returns {boolean} True if in production
 */
function isProductionMode() {
  const location = getSafeLocation()
  const hostname = location?.hostname || ''
  if (!hostname) return false
  return hostname === 'verb-os.vercel.app' || hostname.includes('vercel.app')
}

/**
 * Gets debug information about current sync configuration
 * @returns {object} Configuration debug info
 */
function getSyncConfigDebug() {
  const location = getSafeLocation()

  return {
    apiBase: getSyncApiBase(),
    authHeader: getSyncAuthHeaderName(),
    isDev: isDevelopmentMode(),
    isProd: isProductionMode(),
    hostname: location?.hostname || 'N/A',
    protocol: location?.protocol || 'N/A',
    port: location?.port || 'N/A',
    origin: location?.origin || 'N/A',
    envOverride: import.meta.env.VITE_PROGRESS_SYNC_URL || null,
    timestamp: new Date().toISOString()
  }
}

/**
 * Global debug function for browser console
 * Call window.debugSync() in browser console to get detailed sync info
 */
function attachGlobalSyncDebugger() {
  if (typeof window !== 'undefined') {
    window.debugSync = () => {
      console.group('🔍 SYNC DEBUG INFORMATION')
      console.log('📋 Current Configuration:', getSyncConfigDebug())

      // Try to get auth service info
      try {
        const authModule = window.authService || null
        if (authModule) {
          console.log('🔑 Authentication Status:', {
            isLoggedIn: authModule.isLoggedIn?.() || false,
            hasToken: !!authModule.getToken?.(),
            tokenLength: authModule.getToken?.()?.length || 0,
            user: authModule.getUser?.() || null,
            account: authModule.getAccount?.() || null
          })
        } else {
          console.log('⚠️ AuthService not found on window object')
        }
      } catch (error) {
        console.error('❌ Error getting auth info:', error)
      }

      // Try to get sync status
      try {
        const syncModule = window.cloudSync || null
        if (syncModule && syncModule.getSyncStatus) {
          console.log('☁️ Sync Status:', syncModule.getSyncStatus())
        } else {
          console.log('⚠️ CloudSync module not found on window object')
        }
      } catch (error) {
        console.error('❌ Error getting sync status:', error)
      }

      console.groupEnd()
      return getSyncConfigDebug()
    }

    console.log('🔧 Global sync debugger attached. Call window.debugSync() for detailed info.')
  }
}

export {
  getSyncApiBase,
  getSyncAuthHeaderName,
  isDevelopmentMode,
  isProductionMode,
  getSyncConfigDebug,
  attachGlobalSyncDebugger
}

export default {
  getSyncApiBase,
  getSyncAuthHeaderName,
  isDevelopmentMode,
  isProductionMode,
  getSyncConfigDebug,
  attachGlobalSyncDebugger
}

// Auto-attach debugger in browser environments
if (typeof window !== 'undefined') {
  attachGlobalSyncDebugger()
}
