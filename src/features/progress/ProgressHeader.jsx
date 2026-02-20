import React from 'react'
import router from '../../lib/routing/Router.js'
import AccountButton from '../../components/auth/AccountButton.jsx'

// Styles dedicated to the dashboard header and refresh button
const refreshButtonStyles = `
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .header-account-section {
    display: flex;
    align-items: center;
  }

  .dashboard-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
  }

  .refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 1.1rem;
    border-radius: 0;
    border: 2px solid var(--border);
    background: var(--panel);
    color: var(--text);
    font-weight: 700;
    cursor: pointer;
    transition: background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  }

  .refresh-btn:hover:not(:disabled) {
    background: var(--hover, #222222);
    box-shadow: 3px 3px 0px var(--border);
    transform: translateY(-1px);
  }

  .refresh-btn:disabled {
    cursor: wait;
    opacity: 0.75;
  }

  .refresh-btn.is-refreshing::before {
    content: '';
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 0;
    border: 2px solid var(--border);
    border-top-color: var(--text);
    animation: dashboard-spin 0.9s linear infinite;
  }

  .refresh-status {
    font-size: 0.85rem;
    color: var(--muted);
  }

  @keyframes dashboard-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
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
  loading = false,
  refreshing = false,
  onRefresh = () => { },
  syncing = false,
  _onSync,
  syncEnabled = true,
  _onOpenDataPanel
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
        <div className="header-account-section">
          <AccountButton />
        </div>
      </div>
      <h1>
        <img src="/icons/chart.png" alt="Analíticas" className="section-icon" />
        Progreso y Analíticas
      </h1>
      <div className="dashboard-controls">
        <button
          type="button"
          className={`refresh-btn ${refreshing ? 'is-refreshing' : ''}`}
          onClick={() => onRefresh?.()}
          disabled={refreshing || loading}
          aria-live="polite"
        >
          {refreshing ? 'Actualizando...' : 'Refrescar'}
        </button>
        {refreshing && (
          <span className="refresh-status" role="status">
            Actualizando métricas
          </span>
        )}
        {!refreshing && syncing && syncEnabled && (
          <span className="refresh-status" role="status">
            Sincronizando progreso…
          </span>
        )}
      </div>
    </header>
  )
}
