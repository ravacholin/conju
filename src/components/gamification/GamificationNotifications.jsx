import React, { useCallback, useEffect, useState } from 'react'
import './GamificationNotifications.css'
import useTimeouts from '../../hooks/useTimeouts'

export default function GamificationNotifications() {
  const [notifications, setNotifications] = useState([])
  const { scheduleTimeout, cancelTimeout } = useTimeouts()

  const removeNotification = useCallback((id) => {
    cancelTimeout(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [cancelTimeout])

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random()
    const newNotification = { ...notification, id, timestamp: Date.now() }

    setNotifications(prev => [...prev, newNotification])

    const duration = notification.duration || 4000

    scheduleTimeout(id, () => {
      removeNotification(id)
    }, duration)
  }, [removeNotification, scheduleTimeout])

  useEffect(() => {
    // Escuchar eventos de gamificación
    const handleXPAwarded = (event) => {
      const { amount, reason, leveledUp, newLevelName } = event.detail

      // Notificación de XP
      addNotification({
        type: 'xp',
        title: `+${amount} XP`,
        message: getXPMessage(reason),
        icon: '/icons/star.png',
        duration: 3000
      })

      // Notificación de subida de nivel
      if (leveledUp) {
        addNotification({
          type: 'level',
          title: '¡Nivel alcanzado!',
          message: `Ahora eres un ${newLevelName}`,
          icon: '/icons/trophy.png',
          duration: 5000,
          priority: true
        })
      }
    }

    const handleBadgesAwarded = (event) => {
      const { newBadges } = event.detail

      newBadges.forEach(badge => {
        addNotification({
          type: 'badge',
          title: '¡Nuevo logro!',
          message: badge.name,
          description: badge.description,
          icon: `/icons/badges/${badge.id}.png`,
          fallbackIcon: '/icons/trophy.png',
          duration: 6000,
          priority: true
        })
      })
    }

    const handleStreakUpdated = (event) => {
      const { successful, currentStreak, streakType } = event.detail

      if (successful && currentStreak > 0 && currentStreak % 5 === 0) {
        const streakName = getStreakName(streakType)
        addNotification({
          type: 'streak',
          title: '¡Racha increíble!',
          message: `${currentStreak} ${streakName} seguidos`,
          icon: '/icons/fire.png',
          duration: 4000
        })
      }
    }

    window.addEventListener('gamification:xp-awarded', handleXPAwarded)
    window.addEventListener('gamification:badges-awarded', handleBadgesAwarded)
    window.addEventListener('gamification:streak-updated', handleStreakUpdated)

    return () => {
      window.removeEventListener('gamification:xp-awarded', handleXPAwarded)
      window.removeEventListener('gamification:badges-awarded', handleBadgesAwarded)
      window.removeEventListener('gamification:streak-updated', handleStreakUpdated)
    }
  }, [addNotification])

  const getXPMessage = (reason) => {
    switch (reason) {
      case 'srs_review':
        return 'Buen trabajo en el repaso'
      case 'perfect_speed':
        return 'Respuesta súper rápida'
      case 'streak_bonus':
        return 'Bonus por racha'
      case 'first_attempt':
        return 'Perfecto al primer intento'
      case 'lapse_recovery':
        return 'Excelente recuperación'
      default:
        return 'Experiencia ganada'
    }
  }

  const getStreakName = (streakType) => {
    switch (streakType) {
      case 'daily_review_streak':
        return 'días de repaso'
      case 'consecutive_correct_streak':
        return 'respuestas correctas'
      case 'lapse_free_streak':
        return 'días sin lapsos'
      default:
        return 'elementos'
    }
  }

  const handleImageError = (event) => {
    event.target.src = event.target.dataset.fallback || '/icons/star.png'
  }

  if (notifications.length === 0) return null

  return (
    <div className="gamification-notifications">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification ${notification.type} ${notification.priority ? 'priority' : ''}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-content">
            <div className="notification-icon">
              <img
                src={notification.icon}
                alt={notification.title}
                data-fallback={notification.fallbackIcon}
                onError={handleImageError}
              />
            </div>
            <div className="notification-text">
              <div className="notification-title">{notification.title}</div>
              <div className="notification-message">{notification.message}</div>
              {notification.description && (
                <div className="notification-description">{notification.description}</div>
              )}
            </div>
          </div>
          <div className="notification-close">×</div>
        </div>
      ))}
    </div>
  )
}