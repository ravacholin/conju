import React, { useEffect, useState, useMemo } from 'react'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { getAttemptsByUser, getMasteryByUser } from '../../lib/progress/database.js'
import { getGamificationStats } from '../../lib/progress/gamification.js'
import './ProgressJourney.css'

export default function ProgressJourney({ compact = false }) {
  const [data, setData] = useState({
    attempts: [],
    mastery: [],
    gamification: null,
    loading: true
  })

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true }))
      const userId = getCurrentUserId()
      if (!userId) return

      const [attempts, mastery, gamification] = await Promise.all([
        getAttemptsByUser(userId),
        getMasteryByUser(userId),
        getGamificationStats(userId)
      ])

      setData({
        attempts,
        mastery,
        gamification,
        loading: false
      })
    } catch (error) {
      console.error('Error loading progress data:', error)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  const journey = useMemo(() => {
    if (data.loading || !data.attempts.length) return null

    const now = new Date()
    const firstAttempt = data.attempts.length > 0
      ? new Date(Math.min(...data.attempts.map(a => new Date(a.createdAt))))
      : now

    const daysSinceStart = Math.max(1, Math.ceil((now - firstAttempt) / (1000 * 60 * 60 * 24)))
    const totalAttempts = data.attempts.length
    const correctAttempts = data.attempts.filter(a => a.correct).length
    const overallAccuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0

    // Calcular hitos alcanzados
    const milestones = [
      {
        id: 'first_steps',
        title: 'Primeros Pasos',
        description: 'Has comenzado tu viaje de aprendizaje',
        icon: '/icons/sparks.png',
        threshold: 1,
        achieved: totalAttempts >= 1,
        value: Math.min(totalAttempts, 1),
        color: '#10b981'
      },
      {
        id: 'getting_started',
        title: 'Calentando Motores',
        description: 'Completaste tus primeros 10 intentos',
        icon: '/icons/bolt.png',
        threshold: 10,
        achieved: totalAttempts >= 10,
        value: Math.min(totalAttempts, 10),
        color: '#f59e0b'
      },
      {
        id: 'building_momentum',
        title: 'Construyendo Impulso',
        description: 'Ya llevas 50 intentos, ¡vas bien!',
        icon: '/icons/brain.png',
        threshold: 50,
        achieved: totalAttempts >= 50,
        value: Math.min(totalAttempts, 50),
        color: '#3b82f6'
      },
      {
        id: 'dedicated_learner',
        title: 'Estudiante Dedicado',
        description: 'Has completado 100 ejercicios de repaso',
        icon: '/icons/trophy.png',
        threshold: 100,
        achieved: totalAttempts >= 100,
        value: Math.min(totalAttempts, 100),
        color: '#8b5cf6'
      },
      {
        id: 'master_in_training',
        title: 'Maestro en Entrenamiento',
        description: '250 intentos demuestran tu compromiso',
        icon: '/icons/chart.png',
        threshold: 250,
        achieved: totalAttempts >= 250,
        value: Math.min(totalAttempts, 250),
        color: '#ef4444'
      },
      {
        id: 'spanish_warrior',
        title: 'Guerrero del Español',
        description: '500 intentos te convierten en un veterano',
        icon: '/icons/trophy.png',
        threshold: 500,
        achieved: totalAttempts >= 500,
        value: Math.min(totalAttempts, 500),
        color: '#84cc16'
      }
    ]

    // Estadísticas de progreso
    const masteredForms = data.mastery.filter(m => m.score >= 80).length
    const strugglingForms = data.mastery.filter(m => m.score < 50).length
    const currentLevel = data.gamification?.level?.level || 1
    const currentStreak = data.gamification?.streaks?.daily || 0

    // Calcular tendencia de mejora (últimos 7 días vs 7 anteriores)
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000)

    const recentAttempts = data.attempts.filter(a => new Date(a.createdAt) >= sevenDaysAgo)
    const previousAttempts = data.attempts.filter(a => {
      const date = new Date(a.createdAt)
      return date >= fourteenDaysAgo && date < sevenDaysAgo
    })

    const recentAccuracy = recentAttempts.length > 0
      ? (recentAttempts.filter(a => a.correct).length / recentAttempts.length) * 100
      : overallAccuracy

    const previousAccuracy = previousAttempts.length > 0
      ? (previousAttempts.filter(a => a.correct).length / previousAttempts.length) * 100
      : overallAccuracy

    const accuracyTrend = recentAccuracy - previousAccuracy

    return {
      daysSinceStart,
      totalAttempts,
      overallAccuracy,
      milestones,
      masteredForms,
      strugglingForms,
      currentLevel,
      currentStreak,
      accuracyTrend,
      achievedMilestones: milestones.filter(m => m.achieved).length,
      nextMilestone: milestones.find(m => !m.achieved),
      firstAttemptDate: firstAttempt
    }
  }, [data])

  if (data.loading) {
    return (
      <div className="progress-journey loading">
        <div className="spinner"></div>
        <p>Construyendo tu historia de aprendizaje...</p>
      </div>
    )
  }

  if (!journey) {
    return (
      <div className="progress-journey empty">
        <div className="journey-start">
          <div className="start-icon">
            <img src="/icons/sparks.png" alt="Inicio del Viaje" style={{width: "64px", height: "64px"}} />
          </div>
          <h3>Tu Viaje Comienza Aquí</h3>
          <p>Cada repaso que completes se convertirá en parte de tu historia de aprendizaje</p>
          <div className="start-encouragement">
            <span>¡Da el primer paso y comienza a practicar!</span>
          </div>
        </div>
      </div>
    )
  }

  const getMotivationalMessage = () => {
    const { currentStreak, accuracyTrend, achievedMilestones, totalAttempts } = journey

    if (currentStreak >= 7) {
      return `¡Increíble! Llevas ${currentStreak} días seguidos practicando. ¡Eres imparable!`
    }

    if (accuracyTrend > 10) {
      return `¡Tu precisión ha mejorado muchísimo! Sigues evolucionando.`
    }

    if (achievedMilestones >= 4) {
      return `Ya has conquistado ${achievedMilestones} hitos importantes. ¡Eres un verdadero dedicado!`
    }

    if (totalAttempts > 100) {
      return `Con ${totalAttempts} intentos, has demostrado una dedicación admirable.`
    }

    return `Cada paso cuenta en tu viaje. ¡Sigue construyendo tu historia!`
  }

  if (compact) {
    return (
      <div className="progress-journey compact">
        <div className="journey-summary">
          <div className="journey-icon">
            <img src="/icons/trophy.png" alt="Viaje" style={{width: "32px", height: "32px"}} />
          </div>
          <div className="journey-stats">
            <div className="stat">
              <span className="value">{journey.daysSinceStart}</span>
              <span className="label">días aprendiendo</span>
            </div>
            <div className="stat">
              <span className="value">{journey.achievedMilestones}</span>
              <span className="label">hitos conquistados</span>
            </div>
            <div className="stat">
              <span className="value">{Math.round(journey.overallAccuracy)}%</span>
              <span className="label">precisión general</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="progress-journey full">
      <div className="journey-header">
        <h3>
          <img src="/icons/map.png" alt="Viaje" className="section-icon" onError={(e) => e.target.style.display = 'none'} />
          Tu Viaje de Aprendizaje
        </h3>
        <div className="journey-subtitle">
          {journey.daysSinceStart} días transformando tu español, un repaso a la vez
        </div>
      </div>

      <div className="journey-hero">
        <div className="hero-stats">
          <div className="hero-stat primary">
            <span className="value">{journey.totalAttempts}</span>
            <span className="label">intentos completados</span>
          </div>
          <div className="hero-stat">
            <span className="value">{Math.round(journey.overallAccuracy)}%</span>
            <span className="label">precisión general</span>
          </div>
          <div className="hero-stat">
            <span className="value">{journey.masteredForms}</span>
            <span className="label">formas dominadas</span>
          </div>
        </div>

        <div className="motivational-message">
          <div className="message-icon">
            <img src="/icons/sparks.png" alt="Motivación" style={{width: "24px", height: "24px"}} />
          </div>
          <div className="message-text">{getMotivationalMessage()}</div>
        </div>
      </div>

      <div className="milestones-section">
        <h4>Hitos del Viaje</h4>
        <div className="milestones-timeline">
          {journey.milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`milestone ${milestone.achieved ? 'achieved' : 'pending'}`}
            >
              <div className="milestone-connector">
                {index < journey.milestones.length - 1 && (
                  <div className={`connector-line ${milestone.achieved ? 'completed' : 'remaining'}`} />
                )}
              </div>

              <div className="milestone-content">
                <div className="milestone-icon" style={{ backgroundColor: "#404040" }}>
                  <img src={milestone.icon} alt={milestone.title} style={{width: "28px", height: "28px"}} />
                </div>

                <div className="milestone-info">
                  <h5 className="milestone-title">{milestone.title}</h5>
                  <p className="milestone-description">{milestone.description}</p>

                  {milestone.achieved ? (
                    <div className="milestone-achievement">
                      <span className="achievement-badge">Completado</span>
                    </div>
                  ) : (
                    <div className="milestone-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(milestone.value / milestone.threshold) * 100}%`,
                            backgroundColor: "#007bff"
                          }}
                        />
                      </div>
                      <div className="progress-text">
                        {milestone.value} / {milestone.threshold}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {journey.nextMilestone && (
        <div className="next-milestone">
          <h4>Próximo Objetivo</h4>
          <div className="next-milestone-card">
            <div className="next-icon" style={{ backgroundColor: "#404040" }}>
              <img src={journey.nextMilestone.icon} alt={journey.nextMilestone.title} style={{width: "24px", height: "24px"}} />
            </div>
            <div className="next-info">
              <h5>{journey.nextMilestone.title}</h5>
              <p>{journey.nextMilestone.description}</p>
              <div className="next-progress">
                <span className="remaining">
                  {journey.nextMilestone.threshold - journey.nextMilestone.value} intentos restantes
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="journey-insights">
        <h4>Perspectivas de tu Viaje</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <img src="/icons/calendar.png" alt="Calendario" style={{width: "24px", height: "24px"}} />
            </div>
            <div className="insight-content">
              <div className="insight-value">
                {journey.firstAttemptDate.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="insight-label">Comenzaste tu viaje</div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">
              <img src="/icons/bolt.png" alt="Racha" style={{width: "24px", height: "24px"}} />
            </div>
            <div className="insight-content">
              <div className="insight-value">{journey.currentStreak} días</div>
              <div className="insight-label">Racha actual</div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">
              <img src="/icons/chart.png" alt="Tendencia" style={{width: "24px", height: "24px"}} />
            </div>
            <div className="insight-content">
              <div className={`insight-value ${
                journey.accuracyTrend > 0 ? 'positive' :
                journey.accuracyTrend < 0 ? 'negative' : 'neutral'
              }`}>
                {journey.accuracyTrend > 0 ? '+' : ''}{journey.accuracyTrend.toFixed(1)}%
              </div>
              <div className="insight-label">Tendencia de precisión</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}