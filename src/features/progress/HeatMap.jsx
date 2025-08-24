// Componente para mostrar el mapa de calor

import { useEffect, useState } from 'react'
import { formatPercentage, getMasteryColorClass } from '../../lib/progress/utils.js'

/**
 * Componente para mostrar el mapa de calor
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.data - Datos para el mapa de calor
 */
export function HeatMap({ data }) {
  const [timeRange, setTimeRange] = useState('last_30_days')
  const [hoveredCell, setHoveredCell] = useState(null)

  // Mapeo de modos a nombres en español
  const moodLabels = {
    'indicative': 'Indicativo',
    'subjunctive': 'Subjuntivo',
    'imperative': 'Imperativo',
    'conditional': 'Condicional',
    'nonfinite': 'No Finito'
  }

  // Mapeo de tiempos a nombres en español
  const tenseLabels = {
    'pres': 'Presente',
    'pretIndef': 'Pretérito',
    'impf': 'Imperfecto',
    'fut': 'Futuro',
    'pretPerf': 'Pret. Perfecto',
    'plusc': 'Pluscuamperfecto',
    'futPerf': 'Fut. Perfecto',
    'subjPres': 'Presente',
    'subjImpf': 'Imperfecto',
    'subjFut': 'Futuro',
    'subjPerf': 'Pret. Perfecto',
    'subjPlusc': 'Pluscuamperfecto',
    'impAff': 'Afirmativo',
    'impNeg': 'Negativo',
    'cond': 'Condicional',
    'condPerf': 'Cond. Perfecto',
    'inf': 'Infinitivo',
    'part': 'Participio',
    'ger': 'Gerundio'
  }

  // Agrupar datos por modo y tiempo
  const groupedData = {}
  if (data && Array.isArray(data)) {
    data.forEach(cell => {
      if (!groupedData[cell.mood]) {
        groupedData[cell.mood] = {}
      }
      groupedData[cell.mood][cell.tense] = cell
    })
  }

  // Obtener todos los modos y tiempos únicos
  const allMoods = Object.keys(groupedData)
  const allTenses = [...new Set(data?.map(cell => cell.tense) || [])]

  if (!data || data.length === 0) {
    return (
      <div className="heat-map empty">
        <p>No hay datos de progreso disponibles aún.</p>
        <p>¡Practica algunos verbos para comenzar a ver tu mapa de calor!</p>
      </div>
    )
  }

  return (
    <div className="heat-map">
      <div className="heat-map-controls">
        <div className="time-range-selector">
          <button 
            className={timeRange === 'last_7_days' ? 'active' : ''}
            onClick={() => setTimeRange('last_7_days')}
          >
            Últimos 7 días
          </button>
          <button 
            className={timeRange === 'last_30_days' ? 'active' : ''}
            onClick={() => setTimeRange('last_30_days')}
          >
            Últimos 30 días
          </button>
          <button 
            className={timeRange === 'all_time' ? 'active' : ''}
            onClick={() => setTimeRange('all_time')}
          >
            Todo el tiempo
          </button>
        </div>
      </div>

      <div className="heat-map-grid">
        {/* Encabezado de tiempos */}
        <div className="header-cell"></div>
        {allTenses.map(tense => (
          <div key={tense} className="header-cell">
            <div className="header-text" title={tenseLabels[tense] || tense}>
              {tenseLabels[tense] || tense}
            </div>
          </div>
        ))}
        
        {/* Filas por modo */}
        {allMoods.map(mood => (
          <React.Fragment key={mood}>
            <div className="row-label">
              <div className="header-text" title={moodLabels[mood] || mood}>
                {moodLabels[mood] || mood}
              </div>
            </div>
            {allTenses.map(tense => {
              const cellData = groupedData[mood]?.[tense]
              const masteryScore = cellData?.score || 0
              const attemptCount = cellData?.count || 0
              
              let cellClass = 'data-cell'
              if (cellData) {
                // Determinar color basado en el score
                if (masteryScore >= 80) {
                  cellClass += ' mastery-high'
                } else if (masteryScore >= 60) {
                  cellClass += ' mastery-medium'
                } else {
                  cellClass += ' mastery-low'
                }
              } else {
                cellClass += ' no-data'
              }
              
              return (
                <div 
                  key={`${mood}-${tense}`}
                  className={cellClass}
                  onMouseEnter={() => setHoveredCell({ mood, tense, data: cellData })}
                  onMouseLeave={() => setHoveredCell(null)}
                  title={`${moodLabels[mood] || mood} - ${tenseLabels[tense] || tense}`}
                >
                  {cellData ? (
                    <div className="cell-content">
                      <div className="mastery-score">
                        {formatPercentage(masteryScore)}
                      </div>
                      <div className="attempt-count">
                        {attemptCount} intentos
                      </div>
                    </div>
                  ) : (
                    <div className="cell-content">
                      <div className="no-data-indicator">ND</div>
                    </div>
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Leyenda */}
      <div className="heat-map-legend">
        <div className="legend-item">
          <div className="legend-color mastery-high"></div>
          <span>80-100% Mastery</span>
        </div>
        <div className="legend-item">
          <div className="legend-color mastery-medium"></div>
          <span>60-79% Mastery</span>
        </div>
        <div className="legend-item">
          <div className="legend-color mastery-low"></div>
          <span>0-59% Mastery</span>
        </div>
        <div className="legend-item">
          <div className="legend-color no-data"></div>
          <span>Sin datos</span>
        </div>
      </div>

      {/* Tooltip al pasar el mouse */}
      {hoveredCell && hoveredCell.data && (
        <div className="heat-map-tooltip">
          <div className="tooltip-header">
            <strong>{moodLabels[hoveredCell.mood] || hoveredCell.mood}</strong> -{' '}
            <strong>{tenseLabels[hoveredCell.tense] || hoveredCell.tense}</strong>
          </div>
          <div className="tooltip-content">
            <div>Mastery: {formatPercentage(hoveredCell.data.score)}</div>
            <div>Intentos: {hoveredCell.data.count}</div>
            <div>Nivel: {getMasteryLevelText(hoveredCell.data.score)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Función auxiliar para determinar el nivel de mastery como texto
function getMasteryLevelText(score) {
  if (score >= 80) return 'Dominado'
  if (score >= 60) return 'En progreso'
  return 'En dificultades'
}

export default HeatMap