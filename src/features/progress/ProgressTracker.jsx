// Componente para mostrar el tracker de progreso

import { formatPercentage, getMasteryColorClass, getMasteryLevelText } from '../../lib/progress/utils.js'

/**
 * Componente para mostrar el tracker de progreso
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.stats - Estadísticas del usuario
 */
export function ProgressTracker({ stats }) {
  if (!stats) {
    return (
      <div className="progress-tracker loading">
        <p>Cargando estadísticas...</p>
      </div>
    )
  }

  const {
    totalMastery,
    masteredCells,
    inProgressCells,
    strugglingCells,
    totalAttempts,
    avgLatency
  } = stats

  return (
    <div className="progress-tracker">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">
            <span className={getMasteryColorClass(totalMastery)}>
              {formatPercentage(totalMastery)}
            </span>
          </div>
          <div className="stat-label">Mastery Global</div>
          <div className="stat-sublabel">{getMasteryLevelText(totalMastery)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-value success">{masteredCells}</div>
          <div className="stat-label">Celdas Dominadas</div>
          <div className="stat-sublabel">M ≥ 80%</div>
        </div>

        <div className="stat-card">
          <div className="stat-value warning">{inProgressCells}</div>
          <div className="stat-label">En Progreso</div>
          <div className="stat-sublabel">60% ≤ M &lt; 80%</div>
        </div>

        <div className="stat-card">
          <div className="stat-value error">{strugglingCells}</div>
          <div className="stat-label">En Dificultades</div>
          <div className="stat-sublabel">M &lt; 60%</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{totalAttempts}</div>
          <div className="stat-label">Intentos Totales</div>
          <div className="stat-sublabel">Práctica acumulada</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {avgLatency ? `${(avgLatency / 1000).toFixed(1)}s` : 'N/A'}
          </div>
          <div className="stat-label">Latencia Promedio</div>
          <div className="stat-sublabel">Tiempo de respuesta</div>
        </div>
      </div>

      <div className="progress-summary">
        <h3>Resumen del Progreso</h3>
        <p>
          Has dominado <strong>{masteredCells}</strong> celdas de un total de{' '}
          <strong>{masteredCells + inProgressCells + strugglingCells}</strong>.
        </p>
        <p>
          Tu mastery global es de <strong>{formatPercentage(totalMastery)}</strong>,
          lo que indica un nivel <strong>{getMasteryLevelText(totalMastery).toLowerCase()}</strong>.
        </p>
      </div>
    </div>
  )
}

export default ProgressTracker