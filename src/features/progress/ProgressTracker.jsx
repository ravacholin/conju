// Componente básico para mostrar el progreso del usuario

import { useEffect, useState } from 'react'
import { getUserStats } from '../lib/progress/tracking.js'
import { isProgressSystemInitialized, getCurrentUserId } from '../lib/progress/index.js'

export default function ProgressTracker() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        
        // Verificar si el sistema de progreso está inicializado
        if (!isProgressSystemInitialized()) {
          throw new Error('Sistema de progreso no inicializado')
        }
        
        // Obtener estadísticas del usuario
        const userId = getCurrentUserId()
        const userStats = await getUserStats()
        
        setStats(userStats)
        setError(null)
      } catch (err) {
        console.error('Error al cargar estadísticas:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  if (loading) {
    return <div className="progress-tracker">Cargando estadísticas...</div>
  }

  if (error) {
    return <div className="progress-tracker error">Error: {error}</div>
  }

  if (!stats) {
    return <div className="progress-tracker">No hay datos disponibles</div>
  }

  return (
    <div className="progress-tracker">
      <h3>Estadísticas de Progreso</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalAttempts}</div>
          <div className="stat-label">Intentos Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.correctAttempts}</div>
          <div className="stat-label">Respuestas Correctas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.currentStreak}</div>
          <div className="stat-label">Racha Actual</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.longestStreak}</div>
          <div className="stat-label">Mejor Racha</div>
        </div>
      </div>
      <div className="last-active">
        Última actividad: {new Date(stats.lastActive).toLocaleDateString('es-ES')}
      </div>
    </div>
  )
}