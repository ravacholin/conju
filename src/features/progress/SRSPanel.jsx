import React, { useEffect, useMemo, useState } from 'react'
import { getSRSStats } from '../../lib/progress/analytics.js'
import { useSettings } from '../../state/settings.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { useSRSQueue } from '../../hooks/useSRSQueue.js'
import SRSReviewQueueModal from './SRSReviewQueueModal.jsx'
import GamificationDisplay from '../../components/gamification/GamificationDisplay.jsx'
import SRSAnalytics from '../../components/srs/SRSAnalytics.jsx'
import ProgressJourney from '../../components/progress/ProgressJourney.jsx'
import { SRSHints, GamificationHints, JourneyHints } from '../../components/mobile/TouchHints.jsx'
import NotificationSettings from '../../components/notifications/NotificationSettings.jsx'
import './srs-panel.css'

/**
 * Formatea mood/tense a nombres amigables
 */

export default function SRSPanel({ onNavigateToDrill }) {
  const [stats, setStats] = useState({ dueNow: 0, dueToday: 0 })
  const [showDetails, setShowDetails] = useState(false)
  const [showQueueModal, setShowQueueModal] = useState(false)
  const settings = useSettings()
  const { queue, loading, stats: queueStats } = useSRSQueue()

  useEffect(() => {
    loadSRSData()
    const openHandler = () => setShowQueueModal(true)
    window.addEventListener('progress:open-review-queue', openHandler)
    return () => {
      window.removeEventListener('progress:open-review-queue', openHandler)
    }
  }, [])

  const loadSRSData = async () => {
    try {
      const now = new Date()
      const uid = getCurrentUserId()
      if (!uid) {
        setStats({ dueNow: 0, dueToday: 0 })
        return
      }
      const basicStats = await getSRSStats(uid, now)
      setStats(basicStats)
    } catch (error) {
      console.error('Error loading SRS data:', error)
    }
  }

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 4: return 'urgent-overdue'
      case 3: return 'urgent-high'
      case 2: return 'urgent-medium' 
      default: return 'urgent-low'
    }
  }

  const GET_URGENCY_LABEL = (urgency) => {
    switch(urgency) {
      case 4: return 'Vencido'
      case 3: return 'Muy urgente'
      case 2: return 'Urgente'
      default: return 'Programado'
    }
  }

  const startReviewSession = (sessionType = 'all') => {
    try {
      let filter
      switch (sessionType) {
        case 'urgent':
          filter = { urgency: 'urgent' }
          break
        case 'light':
          filter = { limit: 'light', urgency: 'urgent' }
          break
        case 'today':
          filter = { urgency: 'all' }
          break
        default:
          filter = { urgency: 'all' }
      }

      settings.set({ 
        practiceMode: 'review',
        reviewSessionType: sessionType,
        reviewSessionFilter: filter
      })
      
      if (onNavigateToDrill) {
        onNavigateToDrill()
      } else {
        window.dispatchEvent(new CustomEvent('progress:navigate', { 
          detail: { focus: 'review', sessionType, filter } 
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

  const reviewStats = useMemo(() => {
    const total = queueStats.total || 0
    const urgent = queueStats.urgent || 0
    const overdue = queueStats.overdue || 0
    const scheduled = queueStats.scheduled || 0

    return {
      urgent,
      overdue,
      scheduled,
      total,
      // Calculate percentages for visual indicators
      urgentPct: total ? Math.round((urgent / total) * 100) : 0,
      overduePct: total ? Math.round((overdue / total) * 100) : 0,
      scheduledPct: total ? Math.round((scheduled / total) * 100) : 0,
      // Estimate session time (1.5 minutes per item)
      urgentTime: Math.ceil(urgent * 1.5),
      totalTime: Math.ceil(total * 1.5)
    }
  }, [queueStats])

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
    <SRSHints showDetails={showDetails}>
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
        <button className="toggle-details-btn secondary" onClick={() => setShowQueueModal(true)}>
          Revisar ahora
        </button>
      </div>

      {/* Gamification Display */}
      <div className="srs-gamification-section">
        <GamificationHints compact={true}>
          <GamificationDisplay compact={true} showBadges={false} />
        </GamificationHints>
      </div>

      <div className="srs-overview">
        {reviewStats.overdue > 0 && (
          <div className="srs-stat-card urgent">
            <div className="stat-indicator urgent-indicator"></div>
            <div className="stat-content">
              <div className="stat-header">
                <div className="stat-number">{reviewStats.overdue}</div>
                <div className="stat-progress">
                  <div className="progress-ring" style={{'--progress': reviewStats.overduePct}}>
                    <span className="progress-text">{reviewStats.overduePct}%</span>
                  </div>
                </div>
              </div>
              <div className="stat-label">Se te están olvidando</div>
              <div className="stat-sublabel">¡Repásalos antes de perderlos!</div>
              <div className="stat-time">~{Math.ceil(reviewStats.overdue * 1.5)} min</div>
            </div>
          </div>
        )}

        <div className="srs-stat-card ready">
          <div className="stat-indicator ready-indicator"></div>
          <div className="stat-content">
            <div className="stat-header">
              <div className="stat-number">{stats.dueNow}</div>
              <div className="stat-progress">
                <div className="progress-ring" style={{'--progress': reviewStats.urgentPct}}>
                  <span className="progress-text">{reviewStats.urgentPct}%</span>
                </div>
              </div>
            </div>
            <div className="stat-label">{stats.dueNow === 1 ? 'Listo para repasar' : 'Listos para repasar'}</div>
            <div className="stat-sublabel">Momento perfecto para reforzar</div>
            <div className="stat-time">~{reviewStats.urgentTime} min</div>
          </div>
        </div>

        {stats.dueToday > stats.dueNow && (
          <div className="srs-stat-card scheduled">
            <div className="stat-indicator scheduled-indicator"></div>
            <div className="stat-content">
              <div className="stat-header">
                <div className="stat-number">{stats.dueToday - stats.dueNow}</div>
                <div className="stat-progress">
                  <div className="progress-ring" style={{'--progress': reviewStats.scheduledPct}}>
                    <span className="progress-text">{reviewStats.scheduledPct}%</span>
                  </div>
                </div>
              </div>
              <div className="stat-label">Más tarde hoy</div>
              <div className="stat-sublabel">Programados para después</div>
              <div className="stat-time">~{Math.ceil((stats.dueToday - stats.dueNow) * 1.5)} min</div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Analytics when not showing details */}
      {!showDetails && stats.dueNow > 0 && (
        <div className="srs-compact-analytics">
          <SRSAnalytics compact={true} />
        </div>
      )}

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
                  {reviewStats.overdue > 0 ? 'Recuperá lo olvidado' : 'Empezá el repaso inteligente'}
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
            <div className="no-items-subtitle">Volvé más tarde o practicá algo nuevo</div>
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

      {showDetails && (
        <div className="srs-expanded-content">
          {/* Progress Journey Section */}
          <div className="srs-journey-section">
            <JourneyHints>
              <ProgressJourney compact={false} />
            </JourneyHints>
          </div>

          {/* Analytics Section */}
          <div className="srs-analytics-section">
            <SRSAnalytics compact={false} />
          </div>

          {/* Notifications Section */}
          <div className="srs-notifications-section">
            <NotificationSettings compact={false} />
          </div>

          {/* Queue Details */}
          {queue.length > 0 && (
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
                {queue.slice(0, 8).map((item, index) => {
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

                {queue.length > 8 && (
                  <div className="srs-more-items">
                    <span className="more-icon">⋯</span>
                    <span>Y {queue.length - 8} elementos más en la cola</span>
                  </div>
                )}
              </div>
            </div>
          )}
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

      <SRSReviewQueueModal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        onStartSession={(filter) => {
          settings.set({ practiceMode: 'review', reviewSessionFilter: filter })
        }}
      />
      </div>
    </SRSHints>
  )
}
