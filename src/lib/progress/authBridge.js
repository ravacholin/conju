import authService from '../auth/authService.js'
import AuthTokenManager from './AuthTokenManager.js'

export const setSyncEndpoint = AuthTokenManager.setSyncEndpoint
export const getSyncEndpoint = AuthTokenManager.getSyncEndpoint
export const isSyncEnabled = AuthTokenManager.isSyncEnabled
export const isLocalSyncMode = AuthTokenManager.isLocalSyncMode
export const setSyncAuthToken = AuthTokenManager.setSyncAuthToken
export const getSyncAuthToken = AuthTokenManager.getSyncAuthToken
export const clearSyncAuthToken = AuthTokenManager.clearSyncAuthToken
export const setSyncAuthHeaderName = AuthTokenManager.setSyncAuthHeaderName

export function getSyncAuthHeaderName() {
  return AuthTokenManager.getSyncAuthHeaderName()
}

export function isAuthenticated() {
  return authService.isLoggedIn()
}

export function getAuthToken() {
  return authService.getToken?.() || null
}

export function getAuthenticatedUser() {
  return authService.getUser?.() || null
}

export function getAuthenticatedAccount() {
  return authService.getAccount?.() || null
}

export function clearAuthState() {
  // Cleanup auto-sync timers to prevent memory leaks
  // Dynamic import to avoid circular dependency
  if (typeof window !== 'undefined') {
    import('./cloudSync.js').then(({ cancelScheduledSync }) => {
      cancelScheduledSync()
    }).catch(() => {
      // Silent fail - cleanup is best effort
    })
  }

  return authService.clearAuth()
}

export default {
  setSyncEndpoint,
  getSyncEndpoint,
  isSyncEnabled,
  isLocalSyncMode,
  setSyncAuthToken,
  getSyncAuthToken,
  clearSyncAuthToken,
  setSyncAuthHeaderName,
  getSyncAuthHeaderName,
  isAuthenticated,
  getAuthToken,
  getAuthenticatedUser,
  getAuthenticatedAccount,
  clearAuthState
}

