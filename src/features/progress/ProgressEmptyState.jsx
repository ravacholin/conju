import React from 'react'

export default function ProgressEmptyState({
  onSync,
  syncEnabled,
  syncing,
  onNavigateToDrill,
  onNavigateHome,
  systemReady,
  onRefresh
}) {
  const handleSync = React.useCallback(() => {
    if (!syncEnabled || !onSync) return
    onSync()
  }, [onSync, syncEnabled])

  const handleStartPractice = React.useCallback(() => {
    if (onNavigateToDrill) {
      onNavigateToDrill()
    }
  }, [onNavigateToDrill])

  const handleGoHome = React.useCallback(() => {
    if (onNavigateHome) {
      onNavigateHome()
    }
  }, [onNavigateHome])

  const handleRefresh = React.useCallback(() => {
    if (onRefresh) {
      onRefresh()
    }
  }, [onRefresh])

  return (
    <div className="progress-empty-state" data-testid="progress-empty-state">
      <img
        className="empty-state-illustration"
        src="/icons/lightbulb.png"
        alt="Sin datos de progreso"
      />

      <div className="empty-state-copy">
        <h2 className="empty-state-title">
          {systemReady ? 'Aún no tenemos datos de tu progreso' : 'Estamos preparando tu tablero'}
        </h2>
        <p className="empty-state-description">
          Sin sesiones sincronizadas no podemos generar estadísticas. Sincronizá tus avances o comenzá una práctica guiada
          para que el tablero cobre vida.
        </p>
      </div>

      <div className="empty-state-actions">
        <button
          type="button"
          className="empty-action primary"
          onClick={handleStartPractice}
          disabled={!onNavigateToDrill}
        >
          Iniciar práctica
        </button>

        <button
          type="button"
          className="empty-action secondary"
          onClick={handleSync}
          disabled={!syncEnabled || syncing || !onSync}
        >
          {syncing ? 'Sincronizando…' : 'Sincronizar progreso'}
        </button>

        <button type="button" className="empty-action ghost" onClick={handleRefresh} disabled={!onRefresh}>
          Reintentar carga
        </button>

        <button type="button" className="empty-action ghost" onClick={handleGoHome} disabled={!onNavigateHome}>
          Volver al inicio
        </button>
      </div>
    </div>
  )
}
