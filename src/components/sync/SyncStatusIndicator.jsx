import React, { useState } from 'react';
import { useSyncStatus } from '../../hooks/useSyncStatus.js';
import './SyncStatusIndicator.css';

/**
 * SyncStatusIndicator - Indicador visual del estado de sincronización
 * Muestra si el progreso está sincronizado, sincronizando, o tiene errores
 */
function SyncStatusIndicator() {
  const syncStatus = useSyncStatus();
  const [isExpanded, setIsExpanded] = useState(false);

  // No mostrar si está en modo incógnito o sync deshabilitado
  if (syncStatus.isIncognitoMode || !syncStatus.syncEnabled) {
    return null;
  }

  // Determinar estado visual
  const getStatusConfig = () => {
    if (syncStatus.syncError) {
      return {
        code: 'ERR',
        label: 'ERROR DE SINCRONIZACIÓN',
        className: 'error'
      };
    }

    if (syncStatus.isSyncing) {
      return {
        code: 'SYNC',
        label: 'SINCRONIZANDO...',
        className: 'syncing'
      };
    }

    if (!syncStatus.isOnline) {
      return {
        code: 'OFF',
        label: 'SIN CONEXIÓN',
        className: 'offline'
      };
    }

    if (syncStatus.lastSyncTime) {
      const timeSinceSync = Date.now() - syncStatus.lastSyncTime;
      const minutesAgo = Math.floor(timeSinceSync / 60000);

      if (minutesAgo < 5) {
        return {
          code: 'OK',
          label: 'SISTEMA SINCRONIZADO',
          className: 'synced'
        };
      } else {
        return {
          code: 'IDLE',
          label: `ÚLTIMA SYNC: ${minutesAgo}M`,
          className: 'stale'
        };
      }
    }

    return {
      code: 'N/A',
      label: 'NO SINCRONIZADO',
      className: 'unknown'
    };
  };

  const statusConfig = getStatusConfig();

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return 'NUNCA';

    const timeSinceSync = Date.now() - syncStatus.lastSyncTime;
    const minutesAgo = Math.floor(timeSinceSync / 60000);

    if (minutesAgo < 1) return '< 1 MIN';
    if (minutesAgo < 60) return `${minutesAgo} MIN`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${hoursAgo} HR${hoursAgo > 1 ? 'S' : ''}`;
  };

  return (
    <div
      className={`sync-status-indicator ${statusConfig.className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="sync-status-badge" title={statusConfig.label}>
        <span className="status-code">{statusConfig.code}</span>
      </div>

      {isExpanded && (
        <div className="sync-status-tooltip">
          <div className="tooltip-header">
            <strong>ESTADO DEL SISTEMA</strong>
          </div>
          <div className="tooltip-body">
            <div className="status-row">
              <span className="label">ESTADO:</span>
              <span className="value">
                {statusConfig.label}
              </span>
            </div>

            <div className="status-row">
              <span className="label">ÚLTIMA SYNC:</span>
              <span className="value">{formatLastSync()}</span>
            </div>

            {!syncStatus.isOnline && (
              <div className="status-row warning">
                <span className="label">!</span>
                <span className="value">OFFLINE</span>
              </div>
            )}

            {syncStatus.syncError && (
              <div className="status-row error">
                <span className="label">ERR:</span>
                <span className="value">{syncStatus.syncError}</span>
              </div>
            )}

            {syncStatus.isLocalSync && (
              <div className="status-row info">
                <span className="label">i</span>
                <span className="value">MODO LOCAL</span>
              </div>
            )}

            {syncStatus.lastResult?.uploaded > 0 && (
              <div className="status-row success">
                <span className="label">↑</span>
                <span className="value">{syncStatus.lastResult.uploaded} REGISTROS</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SyncStatusIndicator;
