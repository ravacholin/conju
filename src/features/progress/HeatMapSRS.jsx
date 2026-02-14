import React, { useMemo, useEffect, useRef } from 'react'
import { useSettings } from '../../state/settings.js'
import { useSessionStore } from '../../state/session.js'
import { formatPercentage } from '../../lib/progress/utils.js'
import { useSRSQueue } from '../../hooks/useSRSQueue.js'
import { HEATMAP_MOOD_CONFIG } from './heatMapConfig.js'
import { buildDrillSettingsUpdate } from './drillNavigationConfig.js'

const TENSE_LABEL_FALLBACKS = {
  impAff: 'Imperativo afirmativo',
  impNeg: 'Imperativo negativo'
}

const LEGACY_IMPERATIVE_COMBO = 'imperative-imper'
const IMPERATIVE_AFFIRMATIVE_COMBO = 'imperative-impAff'

function normalizeLegacyHeatMapCombos(heatMap = {}) {
  if (!heatMap || typeof heatMap !== 'object') return {}

  const result = {}
  Object.entries(heatMap).forEach(([combo, value]) => {
    if (combo === LEGACY_IMPERATIVE_COMBO) {
      if (!result[IMPERATIVE_AFFIRMATIVE_COMBO]) result[IMPERATIVE_AFFIRMATIVE_COMBO] = value
      return
    }
    result[combo] = value
  })
  return result
}

/**
 * Heat Map — mood × tense mastery visualization with click-to-drill.
 * Simplified: no SRS summary overlay, no time range selector (always "all time").
 */
export default function HeatMapSRS({ data, onNavigateToDrill }) {
  const settings = useSettings()
  const setDrillRuntimeContext = useSessionStore((state) => state.setDrillRuntimeContext)
  const navigateTimeoutRef = useRef(null)
  const { queue } = useSRSQueue()

  const filteredData = useMemo(() => {
    if (!data?.heatMap) return {}
    if (typeof data.heatMap === 'object' && !Array.isArray(data.heatMap)) {
      return normalizeLegacyHeatMapCombos(data.heatMap)
    }
    return {}
  }, [data])

  const moodConfig = HEATMAP_MOOD_CONFIG

  const getTenseLabel = (tense) => {
    if (tense?.label) return tense.label
    if (tense?.key && TENSE_LABEL_FALLBACKS[tense.key]) return TENSE_LABEL_FALLBACKS[tense.key]
    return tense?.key || ''
  }

  const getCellData = (mood, tense) => {
    const key = `${mood}-${tense}`
    const cellData = filteredData[key]

    if (!cellData) {
      return { mastery: 0, attempts: 0, level: 'no-data', srsStatus: null }
    }

    const mastery = cellData.mastery || 0
    const attempts = cellData.attempts || 0
    const srsItems = queue?.filter(item => item.mood === mood && item.tense === tense) || []

    let level = 'no-data'
    if (mastery >= 0.8) level = 'mastery-high'
    else if (mastery >= 0.6) level = 'mastery-medium'
    else if (mastery >= 0.3) level = 'mastery-low'
    else if (attempts > 0) level = 'mastery-low'

    return { mastery, attempts, level, srsStatus: srsItems.length > 0 ? 'due' : null }
  }

  const scheduleNavigateToDrill = () => {
    if (!onNavigateToDrill) return
    if (navigateTimeoutRef.current) clearTimeout(navigateTimeoutRef.current)
    navigateTimeoutRef.current = setTimeout(() => {
      navigateTimeoutRef.current = null
      onNavigateToDrill()
    }, 150)
  }

  useEffect(() => () => {
    if (navigateTimeoutRef.current) {
      clearTimeout(navigateTimeoutRef.current)
      navigateTimeoutRef.current = null
    }
  }, [])

  const handleCellClick = (mood, tense) => {
    if (!onNavigateToDrill) return
    settings.set(buildDrillSettingsUpdate({}, {
      practiceMode: 'specific',
      specificMood: mood,
      specificTense: tense
    }))
    setDrillRuntimeContext({ currentBlock: null, reviewSessionType: 'due', reviewSessionFilter: {} })
    scheduleNavigateToDrill()
  }

  const handleCellKeyDown = (event, mood, tense) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    handleCellClick(mood, tense)
  }

  return (
    <div className="heatmap-srs" data-testid="mastery-map">
      <div className="section-header">
        <h2>Mapa de Dominio</h2>
        <p>Clic en cualquier celda para practicar</p>
      </div>

      <div className="heat-map">
        {Object.entries(moodConfig).map(([mood, config]) => {
          const tensesWithData = config.tenses.filter(tense => {
            const cellData = getCellData(mood, tense.key)
            return cellData.attempts > 0 || cellData.srsStatus === 'due'
          })

          if (tensesWithData.length === 0) return null

          return (
            <div key={mood} className="mood-section">
              <div className="mood-header">
                <img src={config.icon} alt={config.label} className="mood-icon" />
                <span className="mood-label">{config.label}</span>
              </div>

              <div className="tense-grid">
                {tensesWithData.map(tense => {
                  const cellData = getCellData(mood, tense.key)
                  const tenseLabel = getTenseLabel(tense)

                  return (
                    <div
                      key={tense.key}
                      className={`data-cell ${cellData.level} ${cellData.srsStatus === 'due' ? 'srs-due' : ''}`}
                      onClick={() => handleCellClick(mood, tense.key)}
                      onKeyDown={(event) => handleCellKeyDown(event, mood, tense.key)}
                      role="button"
                      tabIndex={0}
                      title={`${config.label} - ${tenseLabel}`}
                      aria-label={`Practicar ${config.label} ${tenseLabel}`}
                    >
                      <div className="cell-content">
                        <div className="tense-label">{tenseLabel}</div>
                        {cellData.attempts > 0 ? (
                          <>
                            <div className="mastery-score">{formatPercentage(cellData.mastery)}</div>
                            <div className="attempt-count">
                              {cellData.attempts} {cellData.attempts === 1 ? 'intento' : 'intentos'}
                            </div>
                          </>
                        ) : cellData.srsStatus === 'due' ? (
                          <div className="srs-indicator-text">Listo para repasar</div>
                        ) : (
                          <div className="no-data-indicator">Sin datos</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="heat-map-legend">
        <div className="legend-item">
          <div className="legend-color mastery-high"></div>
          <span>Alto (80%+)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color mastery-medium"></div>
          <span>Medio (60-79%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color mastery-low"></div>
          <span>Bajo (&lt;60%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color no-data"></div>
          <span>Sin datos</span>
        </div>
      </div>
    </div>
  )
}
