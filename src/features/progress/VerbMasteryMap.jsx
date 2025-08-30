import React, { useMemo, useState, memo } from 'react'
import { useSettings } from '../../state/settings.js'
import { formatPercentage } from '../../lib/progress/utils.js'
import './verb-mastery-map.css'

export function VerbMasteryMap({ data }) {
  const settings = useSettings()
  const [hoveredCell, setHoveredCell] = useState(null)

  // Configuración de modos con sus tiempos organizados lingüísticamente
  const moodConfig = {
    indicative: {
      label: 'Indicativo',
      icon: '📋',
      description: 'Hechos y realidad',
      tenses: [
        { key: 'pres', label: 'Presente', group: 'simple' },
        { key: 'pretIndef', label: 'Pretérito', group: 'simple' },
        { key: 'impf', label: 'Imperfecto', group: 'simple' },
        { key: 'fut', label: 'Futuro', group: 'simple' },
        { key: 'pretPerf', label: 'Pret. Perfecto', group: 'compound' },
        { key: 'plusc', label: 'Pluscuamperfecto', group: 'compound' },
        { key: 'futPerf', label: 'Fut. Perfecto', group: 'compound' }
      ]
    },
    subjunctive: {
      label: 'Subjuntivo',
      icon: '🤔',
      description: 'Duda, emoción, deseo',
      tenses: [
        { key: 'subjPres', label: 'Presente', group: 'simple' },
        { key: 'subjImpf', label: 'Imperfecto', group: 'simple' },
        { key: 'subjPerf', label: 'Perfecto', group: 'compound' },
        { key: 'subjPlusc', label: 'Pluscuamperfecto', group: 'compound' }
      ]
    },
    conditional: {
      label: 'Condicional',
      icon: '❓',
      description: 'Hipótesis y cortesía',
      tenses: [
        { key: 'cond', label: 'Simple', group: 'simple' },
        { key: 'condPerf', label: 'Perfecto', group: 'compound' }
      ]
    },
    imperative: {
      label: 'Imperativo',
      icon: '❗',
      description: 'Órdenes y ruegos',
      tenses: [
        { key: 'impAff', label: 'Afirmativo', group: 'simple' },
        { key: 'impNeg', label: 'Negativo', group: 'simple' }
      ]
    },
    nonfinite: {
      label: 'No Finitas',
      icon: '∞',
      description: 'Formas impersonales',
      tenses: [
        { key: 'inf', label: 'Infinitivo', group: 'simple' },
        { key: 'ger', label: 'Gerundio', group: 'simple' },
        { key: 'part', label: 'Participio', group: 'simple' }
      ]
    }
  }

  // Agrupar datos por modo y tiempo
  const masteryByMode = useMemo(() => {
    const result = {}
    
    Object.keys(moodConfig).forEach(mood => {
      result[mood] = {
        ...moodConfig[mood],
        tenses: moodConfig[mood].tenses.map(tense => {
          const cellData = data?.find(cell => 
            cell.mood === mood && cell.tense === tense.key
          )
          return {
            ...tense,
            score: cellData?.score || 0,
            count: cellData?.count || 0,
            hasData: !!cellData
          }
        })
      }
      
      // Calculate mood average
      const tenseScores = result[mood].tenses
        .filter(t => t.hasData)
        .map(t => t.score)
      
      result[mood].avgScore = tenseScores.length > 0 
        ? Math.round(tenseScores.reduce((sum, score) => sum + score, 0) / tenseScores.length)
        : 0
        
      result[mood].totalAttempts = result[mood].tenses
        .reduce((sum, t) => sum + t.count, 0)
    })
    
    return result
  }, [data])

  const getMasteryColor = (score, hasData = true) => {
    if (!hasData) return 'mastery-none'
    if (score >= 85) return 'mastery-excellent'
    if (score >= 70) return 'mastery-good' 
    if (score >= 50) return 'mastery-fair'
    return 'mastery-poor'
  }

  const getMasteryLabel = (score, hasData = true) => {
    if (!hasData) return 'Sin datos'
    if (score >= 85) return 'Excelente'
    if (score >= 70) return 'Bien'
    if (score >= 50) return 'Regular'
    return 'Necesita práctica'
  }

  const handleTenseClick = (mood, tense) => {
    try {
      console.log(`Mastery map clicked: ${mood}/${tense}`)
      settings.set({ 
        practiceMode: 'specific', 
        specificMood: mood, 
        specificTense: tense 
      })
      window.dispatchEvent(new CustomEvent('progress:navigate', { 
        detail: { mood, tense } 
      }))
    } catch (error) {
      console.error('Error clicking mastery cell:', error)
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="verb-mastery-map empty">
        <div className="empty-state">
          <h3>🎯 Mapa de Dominio Verbal</h3>
          <p>Practica algunas conjugaciones para ver tu progreso aquí.</p>
          <p>Este mapa te mostrará qué modos y tiempos dominas mejor.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="verb-mastery-map">
      <div className="mastery-header">
        <h3>🗺️ Mapa de Dominio por Modo Gramatical</h3>
        <p>Haz clic en cualquier tiempo para practicarlo específicamente</p>
      </div>

      <div className="mood-sections">
        {Object.entries(masteryByMode).map(([moodKey, mood]) => {
          const hasAnyData = mood.tenses.some(t => t.hasData)
          
          if (!hasAnyData) return null // Skip moods with no data
          
          return (
            <div key={moodKey} className={`mood-section ${getMasteryColor(mood.avgScore, hasAnyData)}`}>
              <div className="mood-header">
                <div className="mood-title">
                  <span className="mood-icon">{mood.icon}</span>
                  <div className="mood-info">
                    <h4>{mood.label}</h4>
                    <p className="mood-description">{mood.description}</p>
                  </div>
                </div>
                <div className="mood-stats">
                  <div className="mood-score">
                    <span className="score-value">{mood.avgScore}%</span>
                    <span className="score-label">promedio</span>
                  </div>
                  <div className="mood-attempts">
                    <span className="attempts-value">{mood.totalAttempts}</span>
                    <span className="attempts-label">intentos</span>
                  </div>
                </div>
              </div>

              <div className="tense-grid">
                {mood.tenses.map(tense => {
                  if (!tense.hasData) return null
                  
                  return (
                    <div
                      key={tense.key}
                      className={`tense-card ${getMasteryColor(tense.score, tense.hasData)}`}
                      onClick={() => handleTenseClick(moodKey, tense.key)}
                      onMouseEnter={() => setHoveredCell({ 
                        mood: moodKey, 
                        tense: tense.key, 
                        data: tense 
                      })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${mood.label} - ${tense.label} — Clic para practicar`}
                    >
                      <div className="tense-header">
                        <span className="tense-name">{tense.label}</span>
                        <span className="tense-group">{tense.group}</span>
                      </div>
                      <div className="tense-score">
                        <span className="score-main">{formatPercentage(tense.score)}</span>
                        <span className="score-label">{getMasteryLabel(tense.score, tense.hasData)}</span>
                      </div>
                      <div className="tense-attempts">
                        {tense.count} intentos
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="mastery-tooltip">
          <div className="tooltip-header">
            <strong>{masteryByMode[hoveredCell.mood]?.label}</strong> - {hoveredCell.data.label}
          </div>
          <div className="tooltip-content">
            <div>Dominio: {formatPercentage(hoveredCell.data.score)}</div>
            <div>Intentos: {hoveredCell.data.count}</div>
            <div>Nivel: {getMasteryLabel(hoveredCell.data.score, hoveredCell.data.hasData)}</div>
            <div className="tooltip-action">🎯 Clic para practicar</div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mastery-legend">
        <h4>Niveles de Dominio</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color mastery-excellent"></div>
            <span>85-100% Excelente</span>
          </div>
          <div className="legend-item">
            <div className="legend-color mastery-good"></div>
            <span>70-84% Bien</span>
          </div>
          <div className="legend-item">
            <div className="legend-color mastery-fair"></div>
            <span>50-69% Regular</span>
          </div>
          <div className="legend-item">
            <div className="legend-color mastery-poor"></div>
            <span>0-49% Necesita práctica</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(VerbMasteryMap)