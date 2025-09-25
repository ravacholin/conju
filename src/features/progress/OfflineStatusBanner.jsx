import React from 'react'
import './offline-status-banner.css'

export default function OfflineStatusBanner({ status, onSync, syncEnabled }) {
  if (!status) {
    return null
  }

  if (!status.isOffline && !status.pendingSync) {
    return null
  }

  return (
    <div className={`offline-banner ${status.isOffline ? 'offline' : 'pending'}`}>
      <div>
        {status.isOffline ? (
          <>
            <strong>Modo offline activo.</strong>
            <span> Tus avances se guardarán y se sincronizarán cuando recuperes conexión.</span>
          </>
        ) : (
          <>
            <strong>Datos pendientes de sincronizar.</strong>
            <span> {status.queueSize || 0} elementos en cola.</span>
          </>
        )}
      </div>
      {onSync && syncEnabled && !status.isOffline && (
        <button type="button" onClick={onSync}>Sincronizar ahora</button>
      )}
    </div>
  )
}
