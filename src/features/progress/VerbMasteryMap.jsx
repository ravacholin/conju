import React, { useMemo, memo } from 'react'
import { useSettings } from '../../state/settings.js'
import { formatPercentage } from '../../lib/progress/utils.js'
import './verb-mastery-map.css'

export function VerbMasteryMap({ data, onNavigateToDrill }) {
  const settings = useSettings()
  // Tooltip disabled per user request; remove hover state

  // Configuración de modos con sus tiempos organizados lingüísticamente
  // SOLO MOSTRAR las formas que realmente han sido practicadas
  // Data comes with English mood names, so we use those as keys
  const moodConfig = {
    indicative: {
      label: 'Indicativo',
      icon: '/hechos-indicativo.png',
      description: 'Modo de la realidad y la objetividad',
      tenses: [
        { key: 'pres', label: 'Presente', group: 'simple' },
        { key: 'pretIndef', label: 'Pretérito indefinido', group: 'simple' },
        { key: 'impf', label: 'Pretérito imperfecto', group: 'simple' },
        { key: 'fut', label: 'Futuro simple', group: 'simple' },
        { key: 'pretPerf', label: 'Pretérito perfecto compuesto', group: 'compound' },
        { key: 'plusc', label: 'Pretérito pluscuamperfecto', group: 'compound' },
        { key: 'futPerf', label: 'Futuro perfecto', group: 'compound' }
      ]
    },
    subjunctive: {
      label: 'Subjuntivo',
      icon: '/posib-subj.png',
      description: 'Modo de la subjetividad y la irrealidad',
      tenses: [
        { key: 'subjPres', label: 'Presente', group: 'simple' },
        { key: 'subjImpf', label: 'Pretérito imperfecto', group: 'simple' },
        { key: 'subjPerf', label: 'Pretérito perfecto', group: 'compound' },
        { key: 'subjPlusc', label: 'Pretérito pluscuamperfecto', group: 'compound' }
      ]
    },
    conditional: {
      label: 'Condicional',
      icon: '/posib-condic.png',
      description: 'Modo de la probabilidad y la cortesía',
      tenses: [
        { key: 'cond', label: 'Condicional simple', group: 'simple' },
        { key: 'condPerf', label: 'Condicional compuesto', group: 'compound' }
      ]
    },
    imperative: {
      label: 'Imperativo',
      icon: '/megaf-imperat.png',
      description: 'Modo del mandato y la exhortación',
      tenses: [
        { key: 'impAff', label: 'Imperativo afirmativo', group: 'simple' },
        { key: 'impNeg', label: 'Imperativo negativo', group: 'simple' }
      ]
    },
    nonfinite: {
      label: 'Formas no personales',
      icon: '/no-finitas-infinite.png',
      description: 'Formas verbales sin flexión personal',
      tenses: [
        { key: 'inf', label: 'Infinitivo', group: 'simple' },
        { key: 'ger', label: 'Gerundio', group: 'simple' },
        { key: 'part', label: 'Participio', group: 'simple' }
      ]
    }
  }

  // Helper function to normalize tense keys to handle variations
  const normalizeTenseKey = (tenseKey) => {
    const normalizationMap = {
      'Imp–': 'impf',
      'imp': 'impf',
      'pres': 'pres',
      'fut': 'fut',
      'pretIndef': 'pretIndef',
      'pretPerf': 'pretPerf',
      'plusc': 'plusc',
      'futPerf': 'futPerf',
      'subjPres': 'subjPres',
      'subjImpf': 'subjImpf',
      'subjPerf': 'subjPerf',
      'subjPlusc': 'subjPlusc',
      'cond': 'cond',
      'condPerf': 'condPerf',
      'impAff': 'impAff',
      'impNeg': 'impNeg',
      'inf': 'inf',
      'ger': 'ger',
      'part': 'part'
    }
    return normalizationMap[tenseKey] || tenseKey
  }

  // Helper function to get proper tense label
  const getTenseLabel = (normalizedKey, originalKey) => {
    const labelMap = {
      'impf': 'Pretérito imperfecto',
      'pres': 'Presente',
      'fut': 'Futuro simple',
      'pretIndef': 'Pretérito indefinido',
      'pretPerf': 'Pretérito perfecto compuesto',
      'plusc': 'Pretérito pluscuamperfecto',
      'futPerf': 'Futuro perfecto',
      'subjPres': 'Presente',
      'subjImpf': 'Pretérito imperfecto',
      'subjPerf': 'Pretérito perfecto',
      'subjPlusc': 'Pretérito pluscuamperfecto',
      'cond': 'Condicional simple',
      'condPerf': 'Condicional compuesto',
      'impAff': 'Imperativo afirmativo',
      'impNeg': 'Imperativo negativo',
      'inf': 'Infinitivo',
      'ger': 'Gerundio',
      'part': 'Participio'
    }
    return labelMap[normalizedKey] || originalKey
  }

  // Agrupar datos SOLO por formas que realmente han sido practicadas (count > 0)
  const masteryByMode = useMemo(() => {
    const result = {}

    // Solo incluir datos que tienen intentos reales
    const practicedData = data?.filter(cell => cell.count > 0) || []

    practicedData.forEach(cell => {
      if (!result[cell.mood]) {
        const moodInfo = moodConfig[cell.mood] || {
          label: cell.mood,
          icon: '📝',
          description: 'Modo verbal'
        }
        result[cell.mood] = {
          ...moodInfo,
          tenses: new Map(), // Use Map to consolidate by normalized key
          avgScore: 0,
          totalAttempts: 0,
          hasAnyData: true
        }
      }

      // Normalizar clave de tiempo para manejar variaciones (ej: "Imp–" -> "impf")
      const normalizedTenseKey = normalizeTenseKey(cell.tense)

      // Encontrar la configuración del tiempo o usar default
      const tenseConfig = moodConfig[cell.mood]?.tenses.find(t => t.key === normalizedTenseKey) || {
        key: normalizedTenseKey,
        label: getTenseLabel(normalizedTenseKey, cell.tense),
        group: 'simple'
      }

      // Check if this normalized tense already exists
      const existingTense = result[cell.mood].tenses.get(normalizedTenseKey)

      if (existingTense) {
        // Consolidate: combine scores and counts
        const combinedCount = existingTense.count + cell.count
        const weightedScore = ((existingTense.score * existingTense.count) + (cell.score * cell.count)) / combinedCount

        result[cell.mood].tenses.set(normalizedTenseKey, {
          ...existingTense,
          score: Math.round(weightedScore),
          count: combinedCount
        })
      } else {
        // Add new tense entry
        result[cell.mood].tenses.set(normalizedTenseKey, {
          ...tenseConfig,
          score: cell.score,
          count: cell.count,
          hasData: true
        })
      }

      result[cell.mood].totalAttempts += cell.count
    })
    
    // Convert Maps back to arrays and calculate averages
    Object.keys(result).forEach(mood => {
      const tensesArray = Array.from(result[mood].tenses.values())
      result[mood].tenses = tensesArray

      const tenseScores = tensesArray.map(t => t.score)
      result[mood].avgScore = tenseScores.length > 0
        ? Math.round(tenseScores.reduce((sum, score) => sum + score, 0) / tenseScores.length)
        : 0
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
    if (!hasData) return 'No practicado'
    if (score >= 85) return 'Excelente'
    if (score >= 70) return 'Bien'
    if (score >= 50) return 'Regular'
    return 'Necesita práctica'
  }

  const handleTenseClick = (mood, tense) => {
    try {

      // Map display mood keys to data mood keys
      // The data uses English mood names, so we keep them as-is
      const moodMapping = {
        'indicative': 'indicative',
        'subjunctive': 'subjunctive',
        'conditional': 'conditional',
        'imperative': 'imperative',
        'nonfinite': 'nonfinite'
      }

      // Update configuration for specific practice FIRST
      // Use getState() and set() to avoid race conditions
      const currentSettings = useSettings.getState()
      const newSettings = {
        ...currentSettings,
        practiceMode: 'specific',
        specificMood: moodMapping[mood] || mood,  // Map to correct mood key
        specificTense: tense,
        // CRITICAL FIX: Always set level to ALL when navigating from progress
        // This ensures any tense from the progress map can be practiced regardless of user's last level selection
        level: 'ALL'
      }

      settings.set(newSettings)

      // Wait for settings to be applied before navigation to avoid race condition
      setTimeout(() => {

        // Navigate to drill mode (the AppRouter will handle regeneration)
        if (onNavigateToDrill) {
          onNavigateToDrill()
        } else {
          // Fallback: dispatch event for when accessed from drill
          window.dispatchEvent(new CustomEvent('progress:navigate', {
            detail: { mood, tense }
          }))
        }
      }, 50) // Small delay to ensure settings persistence
    } catch (error) {
      console.error('Error clicking mastery cell:', error)
    }
  }

  if (!data || data.length === 0) {
    return (
      <div className="verb-mastery-map empty">
        <div className="empty-state">
          <h3>
            <img src="/icons/map.png" alt="Mapa" className="section-icon" />
            Mapa de Dominio Verbal
          </h3>
          <p>Practicá algunas conjugaciones para ver tu progreso acá.</p>
          <p>Este mapa te va a mostrar qué modos y tiempos dominás mejor.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <h2>
        <img src="/icons/map.png" alt="Mapa" className="section-icon" />
        Mapa de Dominio por Modo y Tiempo
      </h2>
      
      <div className="verb-mastery-map">
        {Object.keys(masteryByMode).length === 0 ? (
          <div className="empty-state">
            <p>No hay formas practicadas todavía.</p>
            <p>¡Comienza a practicar para ver tu progreso aquí!</p>
          </div>
        ) : (
          Object.entries(masteryByMode).map(([moodKey, mood]) => {
            return (
            <div key={moodKey} className="mood-section">
              <div className="mood-header">
                <div className="mood-title">
                  <span className="mood-icon">{typeof mood.icon === 'string' && mood.icon.startsWith('/') ? (<img src={mood.icon} alt="" className="inline-icon" />) : mood.icon}</span>
                  <div className="mood-info">
                    <h3>{mood.label}</h3>
                    <p className="mood-description">{mood.description}</p>
                  </div>
                </div>
                <div className="mood-stats">
                  <div className="mood-stat">
                    <div className="stat-value">{mood.avgScore}%</div>
                    <div className="stat-label">Promedio</div>
                  </div>
                  <div className="mood-stat">
                    <div className="stat-value">{mood.totalAttempts}</div>
                    <div className="stat-label">Intentos</div>
                  </div>
                </div>
              </div>

              <div className="tense-grid">
                {mood.tenses.map(tense => {
                  return (
                    <div
                      key={tense.key}
                      className={`tense-card ${getMasteryColor(tense.score, tense.hasData)}`}
                      onClick={() => handleTenseClick(moodKey, tense.key)}
                      title={`${mood.label} - ${tense.label} — Clic para practicar`}
                    >
                      <div className="tense-name">{tense.label}</div>
                      <div className="tense-score">{formatPercentage(tense.score)}</div>
                      <div className="tense-status">{getMasteryLabel(tense.score, tense.hasData)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
        )}

        {/* Tooltip intentionally disabled */}
      </div>

      {/* Legend */}
      <div className="mastery-legend">
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color mastery-excellent"></div>
            <span>Excelente (85-100%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color mastery-good"></div>
            <span>Bien (70-84%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color mastery-fair"></div>
            <span>Regular (50-69%)</span>
          </div>
          <div className="legend-item">
            <div className="legend-color mastery-poor"></div>
            <span>Necesita práctica (0-49%)</span>
          </div>
        </div>
      </div>
    </>
  )
}

export default memo(VerbMasteryMap)
