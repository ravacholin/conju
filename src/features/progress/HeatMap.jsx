// Componente para el mapa de calor de mastery por modo y tiempo

import { useEffect, useState } from 'react'
import { getMasteryByUser } from '../../lib/progress/database.js'
import { getCurrentUserId } from '../../lib/progress/index.js'
import { MOOD_LABELS, TENSE_LABELS } from '../../lib/utils/verbLabels.js'

export default function HeatMap() {
  const [masteryData, setMasteryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('last_30_days') // 'last_7_days', 'last_30_days', 'all_time'

  useEffect(() => {
    const loadMasteryData = async () => {
      try {
        setLoading(true)
        const userId = getCurrentUserId()
        if (!userId) return

        const masteryRecords = await getMasteryByUser(userId)
        setMasteryData(masteryRecords)
      } catch (err) {
        console.error('Error al cargar datos de mastery:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMasteryData()
  }, [timeRange])

  // Agrupar datos por modo y tiempo
  const groupedData = masteryData.reduce((acc, record) => {
    const key = `${record.mood}|${record.tense}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(record)
    return acc
  }, {})

  // Calcular promedio por celda
  const cellAverages = Object.keys(groupedData).reduce((acc, key) => {
    const records = groupedData[key]
    const avgScore = records.reduce((sum, record) => sum + record.score, 0) / records.length
    const [mood, tense] = key.split('|')
    acc[key] = {
      mood,
      tense,
      score: Math.round(avgScore),
      count: records.length
    }
    return acc
  }, {})

  // Organizar datos en una matriz
  const moods = ['indicative', 'subjunctive', 'imperative', 'conditional']
  const tenses = ['pres', 'pretIndef', 'impf', 'fut', 'subjPres', 'subjImpf', 'impAff', 'cond']

  if (loading) {
    return <div className="heat-map">Cargando mapa de calor...</div>
  }

  return (
    <div className="heat-map">
      <div className="heat-map-header">
        <h3>Mapa de Calor de Mastery</h3>
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
        {tenses.map(tense => (
          <div key={tense} className="header-cell">
            {TENSE_LABELS[tense] || tense}
          </div>
        ))}
        
        {/* Filas por modo */}
        {moods.map(mood => (
          <>
            <div key={`${mood}-label`} className="row-label">
              {MOOD_LABELS[mood] || mood}
            </div>
            {tenses.map(tense => {
              const key = `${mood}|${tense}`
              const cellData = cellAverages[key]
              
              let cellClass = 'data-cell'
              let cellContent = ''
              
              if (cellData) {
                // Determinar color basado en el score
                if (cellData.score >= 80) {
                  cellClass += ' high-mastery'
                } else if (cellData.score >= 60) {
                  cellClass += ' medium-mastery'
                } else {
                  cellClass += ' low-mastery'
                }
                
                cellContent = (
                  <>
                    <div className="mastery-score">{cellData.score}</div>
                    <div className="attempt-count">{cellData.count} intentos</div>
                  </>
                )
              } else {
                cellClass += ' no-data'
                cellContent = 'ND'
              }
              
              return (
                <div 
                  key={key} 
                  className={cellClass}
                  onClick={() => console.log('Detalle para:', mood, tense)}
                >
                  {cellContent}
                </div>
              )
            })}
          </>
        ))}
      </div>
      
      <div className="heat-map-legend">
        <div className="legend-item">
          <div className="legend-color high"></div>
          <span>80-100% Mastery</span>
        </div>
        <div className="legend-item">
          <div className="legend-color medium"></div>
          <span>60-79% Mastery</span>
        </div>
        <div className="legend-item">
          <div className="legend-color low"></div>
          <span>0-59% Mastery</span>
        </div>
        <div className="legend-item">
          <div className="legend-color no-data"></div>
          <span>Sin datos</span>
        </div>
      </div>
    </div>
  )
}