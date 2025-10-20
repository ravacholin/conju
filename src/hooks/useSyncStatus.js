import { useState, useEffect } from 'react';
import { getSyncStatus } from '../lib/progress/cloudSync.js';

/**
 * Hook para monitorear el estado de sincronización en tiempo real
 * @returns {Object} Estado de sincronización actual
 */
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState(() => getSyncStatus());

  useEffect(() => {
    // Actualizar estado cada 2 segundos
    const interval = setInterval(() => {
      setSyncStatus(getSyncStatus());
    }, 2000);

    // Actualizar inmediatamente en eventos de foco
    const handleFocus = () => {
      setSyncStatus(getSyncStatus());
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);
    window.addEventListener('offline', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      window.removeEventListener('offline', handleFocus);
    };
  }, []);

  return syncStatus;
}
