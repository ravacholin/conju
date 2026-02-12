// Componente para mostrar el mapa de calor

import { useMemo, useState, memo, Fragment } from 'react'
import { useSettings } from '../../state/settings.js'
import { formatPercentage } from '../../lib/progress/utils.js'
import { createLogger } from '../../lib/utils/logger.js'
import { emitProgressEvent, PROGRESS_EVENTS } from '../../lib/events/progressEventBus.js'

const logger = createLogger('features:HeatMap')

// import { getEligiblePool } from '../../lib/core/eligibility.js'

/**
 * Componente para mostrar el mapa de calor
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.data - Datos para el mapa de calor
 */
export function HeatMap({ data }) {
  const settings = useSettings()
  const [timeRange, setTimeRange] = useState('last_30_days')
  const [hoveredCell, setHoveredCell] = useState(null)

  // Mapeo de modos a nombres gramaticales correctos
  const moodLabels = {
    'indicative': 'Indicativo',
    'subjunctive': 'Subjuntivo',
    'imperative': 'Imperativo',
    'conditional': 'Condicional',
    'nonfinite': 'Formas no personales'
  }

  // Mapeo de tiempos a nombres gramaticales correctos
  const tenseLabels = {
    'pres': 'Presente',
    'pretIndef': 'Pretérito indefinido',
    'impf': 'Pretérito imperfecto',
    'fut': 'Futuro simple',
    'pretPerf': 'Pretérito perfecto compuesto',
    'plusc': 'Pretérito pluscuamperfecto',
    'futPerf': 'Futuro perfecto',
    'subjPres': 'Presente',
    'subjImpf': 'Pretérito imperfecto',
    'subjFut': 'Futuro',
    'subjPerf': 'Pretérito perfecto',
    'subjPlusc': 'Pretérito pluscuamperfecto',
    'impAff': 'Imperativo afirmativo',
    'impNeg': 'Imperativo negativo',
    'cond': 'Condicional simple',
    'condPerf': 'Condicional compuesto',
    'inf': 'Infinitivo',
    'part': 'Participio',
    'ger': 'Gerundio'
  }

  // Solo mostrar formas que han sido REALMENTE practicadas
  // (los datos ya vienen filtrados desde analytics.js)
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    // Solo devolver datos que realmente tienen intentos
    return data.filter(cell => cell.count > 0)
  }, [data])

  // Agrupar datos filtrados por modo y tiempo
  const groupedData = useMemo(() => {
    const g = {}
    filteredData.forEach(cell => {
      if (!g[cell.mood]) g[cell.mood] = {}
      g[cell.mood][cell.tense] = cell
    })
    return g
  }, [filteredData])

  // Obtener modos y tiempos únicos solo de las formas PRACTICADAS, ordenados lógicamente
  const allMoods = useMemo(() => {
    const moods = new Set()
    filteredData.forEach(cell => moods.add(cell.mood))
    
    // Orden lógico de modos
    const moodOrder = ['indicative', 'subjunctive', 'conditional', 'imperative', 'nonfinite']
    return moodOrder.filter(mood => moods.has(mood))
  }, [filteredData])
  
  const allTenses = useMemo(() => {
    const tenses = new Set()
    filteredData.forEach(cell => tenses.add(cell.tense))
    
    // Orden lógico de tiempos
    const tenseOrder = [
      'pres', 'pretIndef', 'impf', 'fut', 
      'pretPerf', 'plusc', 'futPerf',
      'subjPres', 'subjImpf', 'subjFut',
      'subjPerf', 'subjPlusc',
      'cond', 'condPerf',
      'impAff', 'impNeg',
      'inf', 'part', 'ger'
    ]
    return tenseOrder.filter(tense => tenses.has(tense))
  }, [filteredData])

  if (!filteredData || filteredData.length === 0) {
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
          <Fragment key={mood}>
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
                  onClick={() => {
                    try {
                      logger.debug(`Heat map clicked: ${mood}/${tense}`)
                      // Set specific practice settings
                      settings.set({
                        practiceMode: 'specific',
                        specificMood: mood,
                        specificTense: tense
                      })
                      // Wait for settings to propagate before dispatching navigation event (increased delay)
                      setTimeout(() => {
                        emitProgressEvent(PROGRESS_EVENTS.NAVIGATE, { mood, tense })
                      }, 150)
                    } catch (error) {
                      logger.error('Error clicking heat map cell:', error)
                    }
                  }}
                  title={`${moodLabels[mood] || mood} - ${tenseLabels[tense] || tense} — Haz clic para practicar esta celda`}
                  role="button"
                  tabIndex={0}
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
          </Fragment>
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
            <div style={{ marginTop: 6, opacity: 0.8 }}>Haz clic para practicar esta celda</div>
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

export default memo(HeatMap)
