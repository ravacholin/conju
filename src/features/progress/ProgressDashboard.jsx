// Componente principal de progreso que combina todas las vistas

import { useState, useEffect } from 'react'
import { initProgressSystem, isProgressSystemInitialized } from '../../lib/progress/index.js'
import ProgressTracker from './ProgressTracker.jsx'
import HeatMap from './HeatMap.jsx'
import CompetencyRadar from './CompetencyRadar.jsx'
import './progress.css'

export default function ProgressDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initializeProgress = async () => {
      try {
        setLoading(true)
        
        // Inicializar el sistema de progreso si no está inicializado
        if (!isProgressSystemInitialized()) {
          await initProgressSystem()
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Error al inicializar el sistema de progreso:', err)
        setError('Error al inicializar el sistema de progreso')
        setLoading(false)
      }
    }

    initializeProgress()
  }, [])

  if (loading) {
    return <div className="progress-dashboard">Inicializando sistema de progreso...</div>
  }

  if (error) {
    return <div className="progress-dashboard error">{error}</div>
  }

  return (
    <div className="progress-dashboard">
      <div className="dashboard-header">
        <h2>Progreso y Analíticas</h2>
        <div className="tab-navigation">
          <button 
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Vista General
          </button>
          <button 
            className={activeTab === 'heatmap' ? 'active' : ''}
            onClick={() => setActiveTab('heatmap')}
          >
            Mapa de Calor
          </button>
          <button 
            className={activeTab === 'radar' ? 'active' : ''}
            onClick={() => setActiveTab('radar')}
          >
            Radar de Competencias
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <ProgressTracker />
            <div className="dashboard-section">
              <h3>Resumen de Progreso</h3>
              <p>Este es un resumen de tu progreso general en la conjugación de verbos en español.</p>
              <div className="progress-summary">
                <div className="summary-card">
                  <h4>Mastery Global</h4>
                  <div className="summary-value">72%</div>
                  <div className="summary-description">Promedio de todos los modos y tiempos</div>
                </div>
                <div className="summary-card">
                  <h4>Verbos Practicados</h4>
                  <div className="summary-value">42</div>
                  <div className="summary-description">De 200+ disponibles</div>
                </div>
                <div className="summary-card">
                  <h4>Racha Actual</h4>
                  <div className="summary-value">7 días</div>
                  <div className="summary-description">¡Sigue así!</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="heatmap-tab">
            <HeatMap />
          </div>
        )}

        {activeTab === 'radar' && (
          <div className="radar-tab">
            <CompetencyRadar />
          </div>
        )}
      </div>
    </div>
  )
}