import { useState, useEffect, useCallback } from 'react';
import { getSyncStatus } from '../lib/progress/cloudSync.js';

/**
 * Hook para monitorear el estado de sincronización en tiempo real
 * Optimizado para evitar re-renders innecesarios y memory leaks
 * @returns {Object} Estado de sincronización actual
 */
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState(() => getSyncStatus());

  // Helper to compare sync status objects for equality
  const areStatusesEqual = useCallback((a, b) => {
    return (
      a.isSyncing === b.isSyncing &&
      a.lastSyncTime?.getTime() === b.lastSyncTime?.getTime() &&
      a.syncError === b.syncError &&
      a.isOnline === b.isOnline &&
      a.isIncognitoMode === b.isIncognitoMode &&
      a.syncEnabled === b.syncEnabled &&
      a.isLocalSync === b.isLocalSync
    );
  }, []);

  // Only update state if values actually changed
  const updateStatus = useCallback(() => {
    const newStatus = getSyncStatus();
    setSyncStatus(prevStatus => {
      if (areStatusesEqual(prevStatus, newStatus)) {
        return prevStatus; // Prevent re-render
      }
      return newStatus;
    });
  }, [areStatusesEqual]);

  useEffect(() => {
    // Event-based updates instead of polling
    const handleSyncEvent = () => updateStatus();
    const handleNetworkChange = () => updateStatus();
    const handleFocus = () => updateStatus();

    // Listen to custom sync events from cloudSync
    window.addEventListener('progress:cloud-sync', handleSyncEvent);

    // Network state changes
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    // Window focus (user returns to tab)
    window.addEventListener('focus', handleFocus);

    // Fallback polling (reduced to 30s) for edge cases where events might be missed
    // This is a safety net only
    const fallbackInterval = setInterval(updateStatus, 30000);

    return () => {
      window.removeEventListener('progress:cloud-sync', handleSyncEvent);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(fallbackInterval);
    };
  }, [updateStatus]);

  return syncStatus;
}
