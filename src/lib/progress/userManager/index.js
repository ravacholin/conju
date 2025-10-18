import {
  getCurrentUserId,
  getUserSettings,
  updateUserSettings,
  incrementSessionCount
} from '../userSettingsStore.js'
import {
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
} from '../authBridge.js'
import { syncAccountData, syncNow, flushSyncQueue, __testing as syncTesting } from '../syncCoordinator.js'
import {
  mergeAccountDataLocally,
  resolveMergeUserId,
  isReliableUserId,
  __testing as mergerTesting
} from '../dataMerger.js'

export {
  getCurrentUserId,
  getUserSettings,
  updateUserSettings,
  incrementSessionCount
}

export {
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

export { syncAccountData, syncNow, flushSyncQueue }

export { mergeAccountDataLocally, resolveMergeUserId, isReliableUserId }

const userManager = {
  getCurrentUserId,
  getUserSettings,
  updateUserSettings,
  incrementSessionCount,
  setSyncEndpoint,
  getSyncEndpoint,
  isSyncEnabled,
  isLocalSyncMode,
  syncNow,
  syncAccountData,
  flushSyncQueue,
  setSyncAuthToken,
  getSyncAuthToken,
  clearSyncAuthToken,
  setSyncAuthHeaderName
}

export default userManager

export const __testing = {
  ...syncTesting,
  ...mergerTesting,
  mergeAccountDataLocally,
  resolveMergeUserId,
  isReliableUserId
}

