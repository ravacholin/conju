import React, { useState, useEffect } from 'react'
import { useSettings } from '../../state/settings.js'
import { getCurrentUserProfile, getLevelColor, getLevelDescription } from '../../lib/levels/userLevelProfile.js'
import { getProgressionStatus } from '../../lib/levels/levelProgression.js'
import ClickableCard from '../shared/ClickableCard.jsx'

function LevelDashboard({ onStartPlacementTest, onLevelChange }) {
  const settings = useSettings()
  const [profile, setProfile] = useState(null)
  const [progressionStatus, setProgressionStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [settings.userLevel])

  const loadUserData = async () => {
    try {
      setLoading(true)
      const userProfile = await getCurrentUserProfile()
      const status = await getProgressionStatus()

      setProfile(userProfile)
      setProgressionStatus(status)

      // Sync with settings state
      if (userProfile.getCurrentLevel() !== settings.userLevel) {
        settings.setUserLevel(userProfile.getCurrentLevel())
      }
      if (userProfile.getLevelProgress() !== settings.userLevelProgress) {
        settings.setUserLevelProgress(userProfile.getLevelProgress())
      }
    } catch (error) {
      console.error('Failed to load user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLevelChange = async (newLevel) => {
    try {
      if (profile) {
        await profile.setLevel(newLevel, 'manual')
        settings.setUserLevel(newLevel)
        loadUserData()
        onLevelChange && onLevelChange(newLevel)
      }
    } catch (error) {
      console.error('Failed to change level:', error)
    }
  }

  const handleStartPlacementTest = () => {
    onStartPlacementTest && onStartPlacementTest()
  }

  if (loading) {
    return (
      <div className="level-dashboard loading">
        <div className="loading-text">Cargando nivel...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="level-dashboard error">
        <div className="error-text">Error cargando perfil de usuario</div>
      </div>
    )
  }

  const levelInfo = profile.getLevelDisplayInfo()
  const nextRequirements = progressionStatus?.eligibility?.requirements

  return (
    <div className="level-dashboard">
      <div className="level-header">
        <div className="current-level">
          <div
            className="level-badge"
            style={{ borderColor: getLevelColor(levelInfo.current) }}
          >
            {levelInfo.current}
          </div>
          <div className="level-info">
            <div className="level-name">{getLevelDescription(levelInfo.current)}</div>
            <div className="level-progress-bar">
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${levelInfo.progress}%`,
                    backgroundColor: getLevelColor(levelInfo.current)
                  }}
                />
              </div>
              <div className="progress-text">{Math.round(levelInfo.progress)}%</div>
            </div>
          </div>
        </div>

        {!levelInfo.isMaxLevel && (
          <div className="next-level-preview">
            <div className="next-level-text">Siguiente: {levelInfo.next}</div>
            <div className="next-level-description">
              {getLevelDescription(levelInfo.next)}
            </div>
          </div>
        )}
      </div>

      <div className="level-stats">
        <div className="stat-item">
          <div className="stat-label">Competencia general</div>
          <div className="stat-value">{levelInfo.overallCompetency}%</div>
        </div>

        {levelInfo.readyForPromotion && (
          <div className="promotion-ready">
            <div className="promotion-text">Listo para avanzar</div>
            <ClickableCard
              className="promotion-button"
              onClick={() => handleLevelChange(levelInfo.next)}
              title={`Avanzar a ${levelInfo.next}`}
            >
              Avanzar a {levelInfo.next}
            </ClickableCard>
          </div>
        )}
      </div>

      {nextRequirements && !levelInfo.readyForPromotion && (
        <div className="requirements-section">
          <div className="requirements-title">
            Para {levelInfo.next} necesitas:
          </div>
          <div className="requirements-list">
            {progressionStatus.eligibility.evaluation.missingRequirements.map((req, index) => (
              <div key={index} className="requirement-item">
                <div className="requirement-status incomplete" />
                <div className="requirement-text">{req.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="level-actions">
        <ClickableCard
          className="action-button secondary"
          onClick={handleStartPlacementTest}
          title="Hacer test de nivel"
        >
          Evaluar mi nivel
        </ClickableCard>

        <div className="manual-level-section">
          <div className="manual-level-title">Cambio manual de nivel:</div>
          <div className="level-selector">
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => (
              <ClickableCard
                key={level}
                className={`level-option ${level === levelInfo.current ? 'current' : ''}`}
                onClick={() => handleLevelChange(level)}
                title={`Cambiar a nivel ${level}`}
              >
                {level}
              </ClickableCard>
            ))}
          </div>
        </div>
      </div>

      {progressionStatus?.notifications && progressionStatus.notifications.length > 0 && (
        <div className="recent-notifications">
          <div className="notifications-title">Progreso reciente:</div>
          {progressionStatus.notifications.slice(0, 3).map((notification, index) => (
            <div key={index} className="notification-item">
              {notification.type === 'level_promotion' && (
                <div className="notification-text">
                  Avanzaste de {notification.from} a {notification.to}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LevelDashboard