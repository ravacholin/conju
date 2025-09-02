import React, { useEffect, useState } from 'react'
import { getSRSStats } from '../../lib/progress/analytics.js'
import { getDueSchedules, getMasteryByUser } from '../../lib/progress/database.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { useSettings } from '../../state/settings.js'
import './srs-panel.css'

/**
 * Mapeo de modos a nombres gramaticales amigables
 */
const MOOD_LABELS = {
  'indicative': 'Indicativo',
  'subjunctive': 'Subjuntivo', 
  'imperative': 'Imperativo',
  'conditional': 'Condicional',
  'nonfinite': 'Formas no personales'
}

/**
 * Mapeo de tiempos a nombres gramaticales amigables
 */
const TENSE_LABELS = {
  'pres': 'Presente',
  'pretIndef': 'Pretérito indefinido',
  'impf': 'Pretérito imperfecto',
  'fut': 'Futuro simple',
  'pretPerf': 'Pretérito perfecto compuesto',
  'plusc': 'Pretérito pluscuamperfecto',
  'futPerf': 'Futuro perfecto',
  'subjPres': 'Presente de subjuntivo',
  'subjImpf': 'Pretérito imperfecto de subjuntivo',
  'subjFut': 'Futuro de subjuntivo',
  'subjPerf': 'Pretérito perfecto de subjuntivo',
  'subjPlusc': 'Pretérito pluscuamperfecto de subjuntivo',
  'impAff': 'Imperativo afirmativo',
  'impNeg': 'Imperativo negativo',
  'cond': 'Condicional simple',
  'condPerf': 'Condicional compuesto',
  'inf': 'Infinitivo',
  'part': 'Participio',
  'ger': 'Gerundio'
}

/**
 * Formatea mood/tense a nombres amigables
 */
function formatMoodTense(mood, tense) {
  const moodLabel = MOOD_LABELS[mood] || mood
  const tenseLabel = TENSE_LABELS[tense] || tense
  
  if (mood === 'subjunctive' && tenseLabel.includes('subjuntivo')) {
    return tenseLabel
  }
  
  if (mood === 'indicative') {
    return tenseLabel
  }
  
  return `${tenseLabel} (${moodLabel})`
}

export default function SRSPanel({ onNavigateToDrill }) {
  const [stats, setStats] = useState({ dueNow: 0, dueToday: 0 })
  const [loading, setLoading] = useState(true)
  const [dueItems, setDueItems] = useState([])
  const [showDetails, setShowDetails] = useState(false)
  const [reviewStats, setReviewStats] = useState({
    urgent: 0,
    scheduled: 0,
    overdue: 0
  })
  const settings = useSettings()

  useEffect(() => {
    loadSRSData()
  }, [])

  const loadSRSData = async () => {
    try {
      setLoading(true)
      const uid = getCurrentUserId()
      const now = new Date()
      
      // Cargar datos básicos y detallados en paralelo
      const [basicStats, dueSchedules, masteryData] = await Promise.all([
        getSRSStats(uid, now),
        getDueSchedules(uid, now),
        getMasteryByUser(uid)
      ])
      
      setStats(basicStats)
      
      // Enriquecer schedules con datos de mastery
      const masteryMap = new Map(masteryData.map(m => [`${m.mood}|${m.tense}|${m.person}`, m]))
      
      const enrichedItems = dueSchedules.map(schedule => {
        const key = `${schedule.mood}|${schedule.tense}|${schedule.person}`
        const mastery = masteryMap.get(key) || { score: 0 }
        return {
          ...schedule,
          masteryScore: mastery.score,
          formattedName: formatMoodTense(schedule.mood, schedule.tense),
          urgency: getUrgency(schedule.nextDue, now)
        }
      }).sort((a, b) => {
        // Ordenar por urgencia, luego por mastery score (menor primero)
        if (a.urgency !== b.urgency) return b.urgency - a.urgency
        return a.masteryScore - b.masteryScore
      })
      
      setDueItems(enrichedItems)
      
      // Calcular estadísticas detalladas
      const urgent = enrichedItems.filter(item => item.urgency > 2).length
      const overdue = enrichedItems.filter(item => new Date(item.nextDue) < now).length
      const scheduled = enrichedItems.length - overdue
      
      setReviewStats({ urgent, scheduled, overdue })
      
    } catch (error) {
      console.error('Error loading SRS data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUrgency = (nextDue, now) => {
    const diffHours = (new Date(nextDue) - now) / (1000 * 60 * 60)
    if (diffHours < 0) return 4 // Vencido
    if (diffHours < 6) return 3  // Muy urgente
    if (diffHours < 24) return 2 // Urgente
    return 1 // Normal
  }

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 4: return 'urgent-overdue'
      case 3: return 'urgent-high'
      case 2: return 'urgent-medium' 
      default: return 'urgent-low'
    }
  }

  const getUrgencyLabel = (urgency) => {
    switch(urgency) {
      case 4: return 'Vencido'
      case 3: return 'Muy urgente'
      case 2: return 'Urgente'
      default: return 'Programado'
    }
  }

  const startReviewSession = (sessionType = 'all') => {
    try {
      // Configurar modo de práctica específico para repaso
      settings.set({ 
        practiceMode: 'review',
        reviewSessionType: sessionType
      })
      
      // Navigate to drill mode
      if (onNavigateToDrill) {
        onNavigateToDrill()
      } else {
        // Fallback: dispatch event for when accessed from drill
        window.dispatchEvent(new CustomEvent('progress:navigate', { 
          detail: { focus: 'review', sessionType } 
        }))
      }
    } catch (error) {
      console.error('Error starting review session:', error)
    }
  }

  const getMasteryColor = (score) => {
    if (score >= 80) return 'mastery-high'
    if (score >= 60) return 'mastery-medium'
    return 'mastery-low'
  }

  if (loading) {
    return (
      <div className="srs-panel">
        <div className="srs-loading">
          <div className="spinner"></div>
          <p>Analizando tu cola de repaso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="srs-panel">
      <div className="srs-header">
        <div className="srs-title">
          <h3>
            <img src="/icons/bolt.png" alt="Repaso" className="section-icon lg" />
            Repaso Inteligente
          </h3>
          <p className="srs-explanation">
            El sistema te muestra exactamente qué repasar y cuándo, 
            basado en tu curva de olvido personal para maximizar la retención.
          </p>
          <div className="srs-how-it-works">
            <span className="how-icon"><img src="/icons/brain.png" alt="Cómo funciona" className="inline-icon lg" /></span>
            <span className="how-text">Cuanto mejor domines algo, menos frecuentemente lo verás</span>
          </div>
        </div>
        <button 
          className="toggle-details-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Resumen' : 'Detalles'}
        </button>
      </div>

      <div className="srs-overview">
        {reviewStats.overdue > 0 && (
          <div className="srs-stat-card urgent">
            <div className="stat-indicator urgent-indicator"></div>
            <div className="stat-content">
              <div className="stat-number">{reviewStats.overdue}</div>
              <div className="stat-label">Se te están olvidando</div>
              <div className="stat-sublabel">¡Repásalos antes de perderlos!</div>
            </div>
          </div>
        )}
        
        <div className="srs-stat-card ready">
          <div className="stat-indicator ready-indicator"></div>
          <div className="stat-content">
            <div className="stat-number">{stats.dueNow}</div>
            <div className="stat-label">{stats.dueNow === 1 ? 'Listo para repasar' : 'Listos para repasar'}</div>
            <div className="stat-sublabel">Momento perfecto para reforzar</div>
          </div>
        </div>
        
        {stats.dueToday > stats.dueNow && (
          <div className="srs-stat-card scheduled">
            <div className="stat-indicator scheduled-indicator"></div>
            <div className="stat-content">
              <div className="stat-number">{stats.dueToday - stats.dueNow}</div>
              <div className="stat-label">Más tarde hoy</div>
              <div className="stat-sublabel">Programados para después</div>
            </div>
          </div>
        )}
      </div>

      <div className="srs-actions">
        {stats.dueNow > 0 ? (
          <button 
            className="btn btn-primary srs-main-btn"
            onClick={() => startReviewSession('urgent')}
          >
            <div className="btn-content">
              <span className="btn-icon"><img src="/icons/bolt.png" alt="Repaso" className="inline-icon lg" /></span>
              <div className="btn-text">
                <div className="btn-title">
                  {reviewStats.overdue > 0 ? 'Recuperar lo olvidado' : 'Empezar repaso inteligente'}
                </div>
                <div className="btn-subtitle">
                  {stats.dueNow} {stats.dueNow === 1 ? 'elemento' : 'elementos'} • ~{Math.ceil(stats.dueNow * 1.5)} min
                </div>
              </div>
              <span className="btn-arrow">→</span>
            </div>
          </button>
        ) : (
          <div className="srs-no-items">
            <div className="no-items-icon"><img src="/icons/sparks.png" alt="Todo bajo control" className="inline-icon lg" /></div>
            <div className="no-items-title">Todo bajo control</div>
            <div className="no-items-subtitle">Vuelve más tarde o practica algo nuevo</div>
          </div>
        )}
        
        <div className="srs-quick-options">
          {stats.dueToday > stats.dueNow && (
            <button 
              className="btn btn-outline btn-compact"
              onClick={() => startReviewSession('today')}
            >
              Sesión completa ({stats.dueToday})
            </button>
          )}
          
          <button 
            className="btn btn-outline btn-compact"
            onClick={() => startReviewSession('light')}
          >
            Repaso rápido (5 min)
          </button>
        </div>
      </div>

      {showDetails && dueItems.length > 0 && (
        <div className="srs-details">
          <div className="srs-details-header">
            <h4>
              <img src="/icons/chart.png" alt="Cola" className="inline-icon lg" />
              Cola de repaso detallada
            </h4>
            <div className="srs-legend">
              <div className="legend-explanation">
                Los colores indican qué tan urgente es repasar cada elemento:
              </div>
              <div className="legend-items">
                <span className="legend-item urgent-overdue">Se está olvidando</span>
                <span className="legend-item urgent-high">Muy urgente</span>
                <span className="legend-item urgent-medium">Urgente</span>
                <span className="legend-item urgent-low">Programado</span>
              </div>
            </div>
          </div>
          
          <div className="srs-items-list">
            {dueItems.slice(0, 8).map((item, index) => {
              const timeLeft = new Date(item.nextDue) - new Date()
              const hoursLeft = Math.round(timeLeft / (1000 * 60 * 60))
              const daysLeft = Math.round(timeLeft / (1000 * 60 * 60 * 24))
              
              const getTimeDisplay = () => {
                if (timeLeft < 0) {
                  const hoursOverdue = Math.abs(hoursLeft)
                  if (hoursOverdue < 24) return `${hoursOverdue}h atrasado`
                  return `${Math.abs(daysLeft)}d atrasado`
                }
                if (hoursLeft < 1) return 'Ahora'
                if (hoursLeft < 24) return `en ${hoursLeft}h`
                return `en ${daysLeft}d`
              }
              
              return (
                <div key={index} className={`srs-item ${getUrgencyColor(item.urgency)}`}>
                  <div className="srs-item-main">
                    <div className="srs-item-name">{item.formattedName}</div>
                    <div className="srs-item-person">
                      {item.person === '1s' ? 'Primera persona singular' : 
                       item.person === '2s_tu' ? 'Segunda persona singular (tú)' :
                       item.person === '3s' ? 'Tercera persona singular' : item.person}
                    </div>
                  </div>
                  <div className="srs-item-stats">
                    <div className="mastery-display">
                      <div className="mastery-label">Dominio</div>
                      <div className={`mastery-value ${getMasteryColor(item.masteryScore)}`}>
                        {Math.round(item.masteryScore)}%
                      </div>
                    </div>
                    <div className="timing-display">
                      <div className="timing-label">Momento</div>
                      <div className="timing-value">{getTimeDisplay()}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            
            {dueItems.length > 8 && (
              <div className="srs-more-items">
                <span className="more-icon">⋯</span>
                <span>Y {dueItems.length - 8} elementos más en la cola</span>
              </div>
            )}
          </div>
        </div>
      )}

      {stats.dueNow === 0 && stats.dueToday === 0 && (
        <div className="srs-empty">
          <div className="empty-icon"><img src="/icons/brain.png" alt="Sin pendientes" className="inline-icon lg" /></div>
          <div className="empty-content">
            <h4>Sistema en reposo</h4>
            <p className="empty-main">Tu memoria está consolidada por ahora</p>
            <p className="empty-sub">Continúa practicando para que el sistema aprenda tu ritmo de olvido</p>
            <div className="empty-tip">
              <span className="tip-icon"><img src="/icons/lightbulb.png" alt="Tip" className="inline-icon lg" /></span>
              <span>Tip: Cuanto más practiques, más inteligente se vuelve el sistema</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
