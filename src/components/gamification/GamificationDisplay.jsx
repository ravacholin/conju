import React, { useEffect, useState } from 'react'
import { getGamificationStats } from '../../lib/progress/gamification.js'
import { getCurrentUserId } from '../../lib/progress/userManager/index.js'
import './GamificationDisplay.css'

export default function GamificationDisplay({ compact = false, showBadges = true }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGamificationStats()

    // Escuchar eventos de gamificación
    const handleXPAwarded = () => loadGamificationStats()
    const handleBadgeAwarded = () => loadGamificationStats()
    const handleStreakUpdated = () => loadGamificationStats()

    window.addEventListener('gamification:xp-awarded', handleXPAwarded)
    window.addEventListener('gamification:badges-awarded', handleBadgeAwarded)
    window.addEventListener('gamification:streak-updated', handleStreakUpdated)

    return () => {
      window.removeEventListener('gamification:xp-awarded', handleXPAwarded)
      window.removeEventListener('gamification:badges-awarded', handleBadgeAwarded)
      window.removeEventListener('gamification:streak-updated', handleStreakUpdated)
    }
  }, [])

  const loadGamificationStats = async () => {
    try {
      setLoading(true)
      const userId = getCurrentUserId()
      if (!userId) {
        setStats(null)
        return
      }

      const gamificationData = await getGamificationStats(userId)
      setStats(gamificationData)
    } catch (error) {
      console.error('Error loading gamification stats:', error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="gamification-display loading">
        <div className="spinner small"></div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const { level, streaks, badges } = stats
  const recentBadges = badges.slice(-3)

  if (compact) {
    return (
      <div className="gamification-display compact">
        <div className="level-info">
          <div className="level-badge">
            <span className="level-number">Nv{level.level}</span>
            <span className="level-name">{level.name}</span>
          </div>
          <div className="xp-bar">
            <div
              className="xp-progress"
              style={{ width: `${level.progress}%` }}
            ></div>
            <span className="xp-text">
              {level.nextLevelXP ? `${level.currentXP - level.levelXP}/${level.nextLevelXP - level.levelXP} XP` : 'MAX'}
            </span>
          </div>
        </div>

        <div className="streaks-compact">
          <div className="streak-item">
            <img src="/icons/calendar.png" alt="Racha diaria" className="streak-icon" />
            <span className="streak-number">{streaks.daily}</span>
          </div>
          <div className="streak-item">
            <img src="/icons/bolt.png" alt="Consecutivas" className="streak-icon" />
            <span className="streak-number">{streaks.consecutive}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gamification-display full">
      <div className="gamification-header">
        <h4>
          <img src="/icons/trophy.png" alt="Progreso" className="section-icon" />
          Tu Progreso
        </h4>
      </div>

      <div className="level-section">
        <div className="level-info-full">
          <div className="level-avatar">
            <div className="level-circle">
              <span className="level-number">{level.level}</span>
            </div>
            <div className="level-details">
              <h5 className="level-title">{level.name}</h5>
              <p className="level-subtitle">Nivel {level.level}</p>
            </div>
          </div>

          <div className="xp-section">
            <div className="xp-bar-container">
              <div className="xp-bar">
                <div
                  className="xp-progress"
                  style={{ width: `${level.progress}%` }}
                ></div>
              </div>
              <div className="xp-labels">
                <span className="xp-current">{level.currentXP} XP</span>
                {level.nextLevelXP && (
                  <span className="xp-next">Siguiente: {level.nextLevelXP} XP</span>
                )}
              </div>
            </div>

            {level.nextLevelXP && (
              <div className="xp-remaining">
                <span>{level.nextLevelXP - level.currentXP} XP para subir de nivel</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="streaks-section">
        <h5>Rachas Actuales</h5>
        <div className="streaks-grid">
          <div className="streak-card daily">
            <div className="streak-icon-wrapper">
              <img src="/icons/calendar.png" alt="Días seguidos" className="streak-icon" />
            </div>
            <div className="streak-info">
              <span className="streak-number">{streaks.daily}</span>
              <span className="streak-label">Días seguidos</span>
            </div>
          </div>

          <div className="streak-card consecutive">
            <div className="streak-icon-wrapper">
              <img src="/icons/bolt.png" alt="Consecutivas" className="streak-icon" />
            </div>
            <div className="streak-info">
              <span className="streak-number">{streaks.consecutive}</span>
              <span className="streak-label">Consecutivas</span>
            </div>
          </div>

          <div className="streak-card perfect">
            <div className="streak-icon-wrapper">
              <img src="/diana.png" alt="Sin lapsos" className="streak-icon" />
            </div>
            <div className="streak-info">
              <span className="streak-number">{streaks.lapseFree}</span>
              <span className="streak-label">Sin lapsos</span>
            </div>
          </div>
        </div>
      </div>

      {showBadges && recentBadges.length > 0 && (
        <div className="badges-section">
          <h5>Logros Recientes</h5>
          <div className="badges-row">
            {recentBadges.map((badge, index) => (
              <div key={badge.id || index} className="badge-item" title={badge.description}>
                <div className="badge-icon">
                  <img src={`/icons/badges/${badge.id || 'default'}.png`}
                       alt={badge.name}
                       onError={(e) => {
                         e.target.src = '/icons/trophy.png'
                       }} />
                </div>
                <span className="badge-name">{badge.name}</span>
              </div>
            ))}
          </div>
          {badges.length > 3 && (
            <div className="badges-more">
              <span>+{badges.length - 3} logros más</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
