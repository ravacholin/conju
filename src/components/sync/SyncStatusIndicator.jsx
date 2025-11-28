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
        icon: 'ERR',
        label: 'ERROR DE SYNC',
        className: 'error',
        color: '#ff0000'
      };
    }

    if (syncStatus.isSyncing) {
      return {
        icon: 'SYNC',
        label: 'SINCRONIZANDO...',
        className: 'syncing',
        color: '#ffff00'
      };
    }

    if (!syncStatus.isOnline) {
      return {
        icon: 'OFF',
        label: 'SIN CONEXIÓN',
        className: 'offline',
        color: '#555555'
      };
    }

    if (syncStatus.lastSyncTime) {
      const timeSinceSync = Date.now() - syncStatus.lastSyncTime;
      const minutesAgo = Math.floor(timeSinceSync / 60000);

      if (minutesAgo < 5) {
        return {
          icon: 'OK',
          label: 'SINCRONIZADO',
          className: 'synced',
          color: '#00ff00'
        };
      } else if (minutesAgo < 60) {
        return {
          icon: 'OLD',
          label: `SYNC HACE ${minutesAgo}M`,
          className: 'stale',
          color: '#ffaa00'
        };
      } else {
        return {
          icon: 'OLD',
          label: 'SYNC ANTIGUO',
          className: 'stale',
          color: '#ff8800'
        };
      }
    }

    return {
      icon: '?',
      label: 'NO SINCRONIZADO',
      className: 'unknown',
      color: '#333333'
    };
  };

  const statusConfig = getStatusConfig();

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return 'Nunca';

    const timeSinceSync = Date.now() - syncStatus.lastSyncTime;
    const minutesAgo = Math.floor(timeSinceSync / 60000);

    if (minutesAgo < 1) return 'Hace menos de 1 minuto';
    if (minutesAgo < 60) return `Hace ${minutesAgo} minuto${minutesAgo > 1 ? 's' : ''}`;

    const hoursAgo = Math.floor(minutesAgo / 60);
    return `Hace ${hoursAgo} hora${hoursAgo > 1 ? 's' : ''}`;
  };

  return (
    <div
      className={`sync-status-indicator ${statusConfig.className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="sync-status-icon" title={statusConfig.label}>
        <span className="icon">{statusConfig.icon}</span>
      </div>

      {isExpanded && (
        <div className="sync-status-tooltip">
          <div className="tooltip-header">
            <strong>Estado de Sincronización</strong>
          </div>
          <div className="tooltip-body">
            <div className="status-row">
              <span className="label">Estado:</span>
              <span className="value" style={{ color: statusConfig.color }}>
                {statusConfig.label}
              </span>
            </div>

            <div className="status-row">
              <span className="label">Última sync:</span>
              <span className="value">{formatLastSync()}</span>
            </div>

            {!syncStatus.isOnline && (
              <div className="status-row warning">
                <span className="label">[!]</span>
                <span className="value">SIN INTERNET</span>
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
                <span className="label">[i]</span>
                <span className="value">MODO LOCAL</span>
              </div>
            )}

            {syncStatus.lastResult?.uploaded > 0 && (
              <div className="status-row success">
                <span className="label">[^]</span>
                <span className="value">{syncStatus.lastResult.uploaded} SUBIDOS</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SyncStatusIndicator;
