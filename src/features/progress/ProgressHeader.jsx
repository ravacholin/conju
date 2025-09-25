import React from 'react'
import router from '../../lib/routing/Router.js'
import AccountButton from '../../components/auth/AccountButton.jsx'

// Styles dedicated to the dashboard header and refresh button
const refreshButtonStyles = `
  .dashboard-controls {
    /* Controls have been removed */
    display: none;
  }

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
  syncEnabled = true,
  onOpenDataPanel
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
        {/* Buttons have been removed as sync is now automatic */}
      </div>
    </header>
  )
}
