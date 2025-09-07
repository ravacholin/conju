// Panel de gestión de datos - Exportación, importación y sincronización
// Funcionalidades avanzadas de Fase 5

import { useState, useEffect } from 'react'
import { exportProgressData, exportToCSV, downloadExportedData, generateProgressReport } from '../../lib/progress/dataExport.js'
import { importFromFile, createBackup } from '../../lib/progress/dataRestore.js'
import { enhancedCloudSync } from '../../lib/progress/enhancedCloudSync.js'
// import { getCurrentUserId } from '../../lib/progress/userManager.js'

/**
 * Panel avanzado de gestión de datos del usuario
 */
export default function DataManagementPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('export')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [syncStatus, setSyncStatus] = useState('idle')
  
  // Estado para importación
  const [importFile, setImportFile] = useState(null)
  const [importOptions, setImportOptions] = useState({
    overwriteExisting: false,
    validateData: true
  })

  // Estado para sincronización
  const [syncOptions, setSyncOptions] = useState({
    strategy: 'smart',
    conflictStrategy: 'merge'
  })

  useEffect(() => {
    // Verificar estado de sincronización al cargar
    checkSyncStatus()
  }, [])

  const checkSyncStatus = async () => {
    try {
      // En implementación real, verificaría el estado actual
      setSyncStatus('ready')
    } catch (error) {
      /* handle silently */
      setSyncStatus('error')
    }
  }

  const handleExportJSON = async () => {
    setLoading(true)
    setError('')
    try {
      setStatus('Exportando datos en formato JSON...')
      const data = await exportProgressData()
      const filename = `progress_export_${new Date().toISOString().split('T')[0]}.json`
      downloadExportedData(data, filename)
      setStatus('✅ Datos exportados exitosamente')
    } catch (err) {
      setError(`Error al exportar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async (dataType) => {
    setLoading(true)
    setError('')
    try {
      setStatus(`Exportando ${dataType} en formato CSV...`)
      const csvData = await exportToCSV(null, dataType)
      const filename = `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`
      downloadExportedData(csvData, filename, 'text/csv')
      setStatus(`✅ ${dataType} exportado exitosamente`)
    } catch (err) {
      setError(`Error al exportar CSV: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setLoading(true)
    setError('')
    try {
      setStatus('Generando reporte completo de progreso...')
      const report = await generateProgressReport()
      const filename = `progress_report_${new Date().toISOString().split('T')[0]}.json`
      downloadExportedData(report, filename)
      setStatus('✅ Reporte generado exitosamente')
    } catch (err) {
      setError(`Error al generar reporte: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleImportData = async () => {
    if (!importFile) {
      setError('Por favor selecciona un archivo para importar')
      return
    }

    setLoading(true)
    setError('')
    try {
      setStatus('Importando datos...')
      const result = await importFromFile(importFile, importOptions)
      setStatus(`✅ Importación completada: ${result.totalProcessed} registros procesados`)
      setImportFile(null)
    } catch (err) {
      setError(`Error al importar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    setLoading(true)
    setError('')
    try {
      setStatus('Creando respaldo automático...')
      const backup = await createBackup()
      const filename = `backup_${backup.metadata.backupId}.json`
      downloadExportedData(backup, filename)
      setStatus('✅ Respaldo creado exitosamente')
    } catch (err) {
      setError(`Error al crear respaldo: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setLoading(true)
    setSyncStatus('syncing')
    setError('')
    try {
      setStatus(`Sincronizando con estrategia ${syncOptions.strategy}...`)
      const result = await enhancedCloudSync(syncOptions)
      setStatus(`✅ Sincronización completada: ${result.status}`)
      setSyncStatus('synced')
    } catch (err) {
      setError(`Error en sincronización: ${err.message}`)
      setSyncStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing': return '🔄'
      case 'synced': return '✅'
      case 'error': return '❌'
      default: return '☁️'
    }
  }

  return (
    <div className="data-management-panel">
      <div className="panel-header">
        <h2>🗂️ Gestión de Datos</h2>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="panel-tabs">
        <button 
          className={activeTab === 'export' ? 'active' : ''} 
          onClick={() => setActiveTab('export')}
        >
          📤 Exportar
        </button>
        <button 
          className={activeTab === 'import' ? 'active' : ''} 
          onClick={() => setActiveTab('import')}
        >
          📥 Importar
        </button>
        <button 
          className={activeTab === 'sync' ? 'active' : ''} 
          onClick={() => setActiveTab('sync')}
        >
          ☁️ Sincronizar
        </button>
        <button 
          className={activeTab === 'backup' ? 'active' : ''} 
          onClick={() => setActiveTab('backup')}
        >
          💾 Respaldo
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'export' && (
          <div className="export-section">
            <h3>Exportar Datos de Progreso</h3>
            <div className="export-options">
              <button onClick={handleExportJSON} disabled={loading}>
                📄 Exportar Todo (JSON)
              </button>
              <button onClick={() => handleExportCSV('attempts')} disabled={loading}>
                📊 Exportar Intentos (CSV)
              </button>
              <button onClick={() => handleExportCSV('mastery')} disabled={loading}>
                🎯 Exportar Dominio (CSV)
              </button>
              <button onClick={() => handleExportCSV('schedules')} disabled={loading}>
                ⏰ Exportar Horarios (CSV)
              </button>
              <button onClick={handleGenerateReport} disabled={loading}>
                📈 Generar Reporte Completo
              </button>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="import-section">
            <h3>Importar Datos de Progreso</h3>
            <div className="import-form">
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
              <div className="import-options">
                <label>
                  <input
                    type="checkbox"
                    checked={importOptions.overwriteExisting}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      overwriteExisting: e.target.checked
                    }))}
                  />
                  Sobrescribir datos existentes
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={importOptions.validateData}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      validateData: e.target.checked
                    }))}
                  />
                  Validar datos antes de importar
                </label>
              </div>
              <button onClick={handleImportData} disabled={loading || !importFile}>
                📥 Importar Datos
              </button>
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="sync-section">
            <h3>Sincronización en la Nube {getSyncStatusIcon()}</h3>
            <div className="sync-options">
              <div className="sync-strategy">
                <label>Estrategia de sincronización:</label>
                <select
                  value={syncOptions.strategy}
                  onChange={(e) => setSyncOptions(prev => ({
                    ...prev,
                    strategy: e.target.value
                  }))}
                >
                  <option value="smart">🧠 Inteligente</option>
                  <option value="delta">📊 Solo cambios</option>
                  <option value="full">🔄 Completa</option>
                  <option value="force">💪 Forzada</option>
                </select>
              </div>
              <div className="conflict-strategy">
                <label>Resolución de conflictos:</label>
                <select
                  value={syncOptions.conflictStrategy}
                  onChange={(e) => setSyncOptions(prev => ({
                    ...prev,
                    conflictStrategy: e.target.value
                  }))}
                >
                  <option value="merge">🤝 Fusionar</option>
                  <option value="local">📱 Local gana</option>
                  <option value="remote">☁️ Remoto gana</option>
                </select>
              </div>
              <button onClick={handleSync} disabled={loading}>
                ☁️ Sincronizar Ahora
              </button>
            </div>
            <div className="sync-status">
              <p>Estado: {syncStatus}</p>
              <p>Última sincronización: {new Date().toLocaleString()}</p>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="backup-section">
            <h3>Sistema de Respaldos</h3>
            <div className="backup-actions">
              <button onClick={handleCreateBackup} disabled={loading}>
                💾 Crear Respaldo Manual
              </button>
              <div className="backup-info">
                <p>💡 Los respaldos automáticos se crean cada vez que sincronizas</p>
                <p>🔒 Tus datos se guardan localmente de forma segura</p>
                <p>☁️ La sincronización permite acceder desde cualquier dispositivo</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {status && (
        <div className={`status-message ${error ? 'error' : 'success'}`}>
          {error || status}
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Procesando...</p>
        </div>
      )}
    </div>
  )
}