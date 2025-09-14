import React from 'react'
import router from '../../lib/routing/Router.js'

// Styles dedicated to the dashboard header and refresh button
const refreshButtonStyles = `
  .dashboard-controls {
    margin: 0.5rem 0;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  .refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: white;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .refresh-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .inline-icon {
    width: 14px;
    height: 14px;
    opacity: 0.8;
  }
`

// Inject styles once per document
if (typeof document !== 'undefined' && !document.querySelector('#dashboard-refresh-styles')) {
  const styleElement = document.createElement('style')
  styleElement.id = 'dashboard-refresh-styles'
  styleElement.textContent = refreshButtonStyles
  document.head.appendChild(styleElement)
}

export default function ProgressHeader({
  onNavigateHome,
  onNavigateToDrill,
  loading,
  refreshing,
  onRefresh,
  syncing = false,
  onSync,
  syncEnabled = true
}) {
  return (
    <header className="dashboard-header">
      <div className="header-top">
        <div className="icon-row">
          <button
            onClick={() => router.back()}
            className="icon-btn"
            title="Volver"
            aria-label="Volver"
          >
            <img src="/back.png" alt="Volver" className="menu-icon" />
          </button>
          {onNavigateHome && (
            <button onClick={onNavigateHome} className="icon-btn" title="Menú">
              <img src="/home.png" alt="Menú" className="menu-icon" />
            </button>
          )}
          {onNavigateToDrill && (
            <button onClick={onNavigateToDrill} className="icon-btn" title="Práctica">
              <img src="/verbosmain_transparent.png" alt="Práctica" className="menu-icon" />
            </button>
          )}
        </div>
      </div>
      <h1>
        <img src="/icons/chart.png" alt="Analíticas" className="section-icon" />
        Progreso y Analíticas
      </h1>
      <p>Seguimiento detallado de tu dominio del español</p>
      <div className="dashboard-controls">
        <button
          onClick={onRefresh}
          className="refresh-btn"
          disabled={loading || refreshing}
          title="Refrescar datos (bypasa caché)"
        >
          <img src="/icons/refresh.png" alt="Refrescar" className="inline-icon" />
          {refreshing ? 'Actualizando...' : 'Refrescar'}
        </button>
        {typeof onSync === 'function' && (
          <button
            onClick={onSync}
            className="refresh-btn"
            disabled={loading || refreshing || syncing}
            title={syncEnabled ? 'Sincronizar con la nube' : 'Configurar sincronización'}
          >
            <img src="/icons/cloud-sync.png" alt="Sincronizar" className="inline-icon" />
            {syncing ? 'Sincronizando...' : 'Sync ahora'}
          </button>
        )}
      </div>
      {refreshing && (
        <div className="refresh-indicator">
          <img src="/icons/refresh.png" alt="Actualizando" className="inline-icon" />
          <span>Actualizando métricas...</span>
        </div>
      )}
    </header>
  )
}
