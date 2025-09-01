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

export default function SRSPanel() {
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
    // Configurar modo de práctica específico para repaso
    settings.set({ 
      practiceMode: 'review',
      reviewSessionType: sessionType
    })
    
    window.dispatchEvent(new CustomEvent('progress:navigate', { 
      detail: { focus: 'review', sessionType } 
    }))
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
          <h3>🔄 Sistema de Repaso Espaciado (SRS)</h3>
          <p>Repasa en el momento óptimo para maximizar tu retención</p>
        </div>
        <button 
          className="toggle-details-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '📋 Vista simple' : '📊 Ver detalles'}
        </button>
      </div>

      <div className="srs-overview">
        <div className="srs-stat-card urgent">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-number">{reviewStats.overdue}</div>
            <div className="stat-label">Vencidos</div>
          </div>
        </div>
        
        <div className="srs-stat-card ready">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-number">{stats.dueNow}</div>
            <div className="stat-label">Listos ahora</div>
          </div>
        </div>
        
        <div className="srs-stat-card scheduled">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.dueToday}</div>
            <div className="stat-label">Para hoy</div>
          </div>
        </div>
      </div>

      <div className="srs-actions">
        <button 
          className="btn btn-primary srs-start-btn"
          onClick={() => startReviewSession('urgent')}
          disabled={stats.dueNow === 0}
        >
          <span className="btn-icon">🎯</span>
          {reviewStats.overdue > 0 ? 'Recuperar vencidos' : 'Empezar repaso'}
          {stats.dueNow > 0 && <span className="btn-badge">{stats.dueNow}</span>}
        </button>
        
        {stats.dueToday > stats.dueNow && (
          <button 
            className="btn btn-secondary"
            onClick={() => startReviewSession('today')}
          >
            <span className="btn-icon">📚</span>
            Sesión completa del día
            <span className="btn-badge">{stats.dueToday}</span>
          </button>
        )}
        
        <button 
          className="btn btn-outline"
          onClick={() => startReviewSession('light')}
        >
          <span className="btn-icon">☕</span>
          Repaso ligero (5 min)
        </button>
      </div>

      {showDetails && dueItems.length > 0 && (
        <div className="srs-details">
          <div className="srs-details-header">
            <h4>📋 Elementos pendientes de repaso</h4>
            <div className="srs-legend">
              <span className="legend-item urgent-overdue">Vencido</span>
              <span className="legend-item urgent-high">Muy urgente</span>
              <span className="legend-item urgent-medium">Urgente</span>
              <span className="legend-item urgent-low">Programado</span>
            </div>
          </div>
          
          <div className="srs-items-list">
            {dueItems.slice(0, 10).map((item, index) => {
              const timeLeft = new Date(item.nextDue) - new Date()
              const hoursLeft = Math.round(timeLeft / (1000 * 60 * 60))
              
              return (
                <div key={index} className={`srs-item ${getUrgencyColor(item.urgency)}`}>
                  <div className="srs-item-content">
                    <div className="srs-item-name">{item.formattedName}</div>
                    <div className="srs-item-meta">
                      <span className="srs-person">
                        {item.person === '1s' ? '1ª sing' : 
                         item.person === '2s_tu' ? '2ª sing (tú)' :
                         item.person === '3s' ? '3ª sing' : item.person}
                      </span>
                      <span className={`mastery-badge ${getMasteryColor(item.masteryScore)}`}>
                        {Math.round(item.masteryScore)}%
                      </span>
                    </div>
                  </div>
                  <div className="srs-item-timing">
                    <div className={`urgency-badge ${getUrgencyColor(item.urgency)}`}>
                      {getUrgencyLabel(item.urgency)}
                    </div>
                    <div className="time-info">
                      {timeLeft < 0 ? 
                        `${Math.abs(hoursLeft)}h vencido` : 
                        hoursLeft < 1 ? 'Ahora' : `en ${hoursLeft}h`}
                    </div>
                  </div>
                </div>
              )
            })}
            
            {dueItems.length > 10 && (
              <div className="srs-more-items">
                <span>... y {dueItems.length - 10} elementos más</span>
              </div>
            )}
          </div>
        </div>
      )}

      {stats.dueNow === 0 && stats.dueToday === 0 && (
        <div className="srs-empty">
          <div className="empty-icon">🎉</div>
          <h4>¡Todo al día!</h4>
          <p>No hay elementos pendientes de repaso por el momento.</p>
          <p>Sigue practicando para crear más contenido que repasar.</p>
        </div>
      )}
    </div>
  )
}