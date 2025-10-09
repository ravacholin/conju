import React, { useState, useMemo, useEffect } from 'react'
import { useSettings } from '../../state/settings.js'
import { formatPercentage } from '../../lib/progress/utils.js'
import { getSRSStats, getHeatMapData } from '../../lib/progress/analytics.js'
import { useSRSQueue } from '../../hooks/useSRSQueue.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { HEATMAP_MOOD_CONFIG } from './heatMapConfig.js'

/**
 * Combined Heat Map + SRS - Unified mastery visualization with SRS indicators
 * Replaces: VerbMasteryMap, SRSPanel, SRSReviewQueueModal
 */
export default function HeatMapSRS({ data, onNavigateToDrill }) {
  const settings = useSettings()
  const [selectedTimeRange, setSelectedTimeRange] = useState('all')
  const [heatMapData, setHeatMapData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { queue, stats: srsStats } = useSRSQueue()

  // Fetch heat map data when time range changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const userId = getCurrentUserId()
        if (!userId) {
          setLoading(false)
          return
        }

        // Map UI range keys to API range keys
        const timeRangeMap = {
          'all': 'all_time',
          'week': 'last_7_days',
          'month': 'last_30_days',
          '3months': 'last_90_days'
        }

        const apiTimeRange = timeRangeMap[selectedTimeRange] || 'all_time'
        const rawData = await getHeatMapData(userId, null, apiTimeRange)

        // Transform array format to object format
        if (Array.isArray(rawData) && rawData.length > 0) {
          const heatMapObject = {}
          rawData.forEach(item => {
            if (item.mood && item.tense) {
              const key = `${item.mood}-${item.tense}`
              const rawLastAttempt = item.lastAttempt ?? null
              let normalizedLastAttempt = null
              if (typeof rawLastAttempt === 'number') {
                normalizedLastAttempt = rawLastAttempt
              } else if (typeof rawLastAttempt === 'string') {
                const parsed = new Date(rawLastAttempt).getTime()
                normalizedLastAttempt = Number.isFinite(parsed) ? parsed : null
              }
              heatMapObject[key] = {
                mastery: item.score / 100, // Convert score from 0-100 to 0-1 range
                attempts: item.count || 0,
                lastAttempt: normalizedLastAttempt
              }
            }
          })
          setHeatMapData({ heatMap: heatMapObject })
        } else {
          setHeatMapData({ heatMap: {} })
        }
      } catch (error) {
        console.error('Error fetching heat map data:', error)
        setHeatMapData({ heatMap: {} })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedTimeRange])

  // Mood configuration with PNG icons
  const moodConfig = HEATMAP_MOOD_CONFIG

  // SRS stats summary
  const srsData = srsStats || { dueNow: 0, dueToday: 0, total: 0 }

  // Use fetched data or fallback to prop data
  const filteredData = useMemo(() => {
    const dataSource = heatMapData || data
    if (!dataSource?.heatMap) return {}

    return dataSource.heatMap
  }, [heatMapData, data])

  // Get mastery level and SRS status for a cell
  const getCellData = (mood, tense) => {
    const key = `${mood}-${tense}`
    const cellData = filteredData[key]

    if (!cellData) {
      return {
        mastery: 0,
        attempts: 0,
        level: 'no-data',
        srsStatus: null
      }
    }

    const mastery = cellData.mastery || 0
    const attempts = cellData.attempts || 0

    // Check if this combination has SRS items due
    const srsItems = queue?.filter(item =>
      item.mood === mood && item.tense === tense
    ) || []

    let level = 'no-data'
    if (mastery >= 0.8) level = 'mastery-high'
    else if (mastery >= 0.6) level = 'mastery-medium'
    else if (mastery >= 0.3) level = 'mastery-low'
    else if (attempts > 0) level = 'mastery-low'

    return {
      mastery,
      attempts,
      level,
      srsStatus: srsItems.length > 0 ? 'due' : null
    }
  }

  // Handle cell click
  const handleCellClick = (mood, tense) => {
    if (onNavigateToDrill) {
      // Set specific practice mode
      settings.set({
        practiceMode: 'specific',
        specificMood: mood,
        specificTense: tense
      })
      onNavigateToDrill()
    }
  }

  // Handle SRS click for specific mood/tense combination
  const handleSRSClick = (mood, tense, event) => {
    event.stopPropagation() // Prevent cell click
    if (onNavigateToDrill) {
      // Set SRS review mode with specific filter
      settings.set({
        practiceMode: 'review',
        reviewSessionType: 'specific',
        reviewSessionFilter: {
          mood: mood,
          tense: tense,
          urgency: 'all'
        }
      })
      onNavigateToDrill()
    }
  }

  // Handle SRS practice
  const handleSRSPractice = () => {
    if (onNavigateToDrill) {
      settings.set({ practiceMode: 'review', reviewSessionType: 'due' })
      onNavigateToDrill()
    }
  }

  return (
    <div className="heatmap-srs">
      <div className="section-header">
        <h2>
          <img src="/icons/map.png" alt="Mapa" className="section-icon" />
          Mapa de Dominio
        </h2>
        <p>Haz clic en cualquier celda para practicar esa combinación</p>
      </div>

      {loading && (
        <div className="loading-indicator" style={{ padding: '1rem', textAlign: 'center', opacity: 0.7 }}>
          Cargando datos...
        </div>
      )}

      {/* SRS Summary */}
      {srsData.dueNow > 0 && (
        <div className="srs-summary" onClick={handleSRSPractice}>
          <div className="srs-content">
            <img src="/icons/timer.png" alt="SRS" className="srs-icon" />
            <div className="srs-text">
              <strong>{srsData.dueNow}</strong> elementos listos para repasar
              {srsData.dueToday > srsData.dueNow && (
                <span className="srs-today"> • {srsData.dueToday} hoy</span>
              )}
            </div>
          </div>
          <div className="srs-arrow">→</div>
        </div>
      )}

      {/* Time range selector */}
      <div className="heat-map-controls">
        <div className="time-range-selector">
          {[
            { key: 'all', label: 'Todo' },
            { key: '3months', label: '3 meses' },
            { key: 'month', label: 'Mes' },
            { key: 'week', label: 'Semana' }
          ].map(range => (
            <button
              key={range.key}
              className={selectedTimeRange === range.key ? 'active' : ''}
              onClick={() => setSelectedTimeRange(range.key)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heat map grid */}
      <div className="heat-map">
        {Object.entries(moodConfig).map(([mood, config]) => {
          // Filter tenses to show only those with data or SRS items
          const tensesWithData = config.tenses.filter(tense => {
            const cellData = getCellData(mood, tense.key)
            return cellData.attempts > 0 || cellData.srsStatus === 'due'
          })

          // Only show tenses that actually have data
          let tensesToShow = tensesWithData

          // Only show mood section if it has tenses to show
          if (tensesToShow.length === 0) return null

          return (
            <div key={mood} className="mood-section">
              <div className="mood-header">
                <img src={config.icon} alt={config.label} className="mood-icon" />
                <span className="mood-label">{config.label}</span>
              </div>

              <div className="tense-grid">
                {tensesToShow.map(tense => {
                  const cellData = getCellData(mood, tense.key)

                  return (
                    <div
                      key={tense.key}
                      className={`data-cell ${cellData.level} ${cellData.srsStatus === 'due' ? 'srs-due' : ''}`}
                      onClick={() => handleCellClick(mood, tense.key)}
                      title={`${config.label} - ${tense.label}`}
                    >
                      <div className="cell-content">
                        {cellData.srsStatus === 'due' && (
                          <div
                            className="srs-indicator clickable"
                            onClick={(e) => handleSRSClick(mood, tense.key, e)}
                            title={`Practicar SRS: ${config.label} - ${tense.label}`}
                          >
                            <img src="/icons/timer.png" alt="SRS" className="srs-badge" />
                          </div>
                        )}

                        <div className="tense-label">{tense.label}</div>

                        {cellData.attempts > 0 ? (
                          <>
                            <div className="mastery-score">
                              {formatPercentage(cellData.mastery)}
                            </div>
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

      {/* Legend */}
      <div className="heat-map-legend">
        <div className="legend-item">
          <div className="legend-color mastery-high"></div>
          <span>Dominio alto (80%+)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color mastery-medium"></div>
          <span>Dominio medio (60-79%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color mastery-low"></div>
          <span>Dominio bajo (&lt;60%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color no-data"></div>
          <span>Sin datos</span>
        </div>
        <div className="legend-item">
          <img src="/icons/timer.png" alt="SRS" className="legend-srs" />
          <span>Listo para repasar (SRS)</span>
        </div>
      </div>
    </div>
  )
}