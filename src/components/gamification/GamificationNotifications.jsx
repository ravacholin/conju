import React, { useEffect, useRef, useState } from 'react'
import './GamificationNotifications.css'

export default function GamificationNotifications() {
  const [notifications, setNotifications] = useState([])
  const timeoutsRef = useRef(new Map())
  const MAX_NOTIFICATIONS = 4

  useEffect(() => {
    // Escuchar eventos de gamificación
    const handleXPAwarded = (event) => {
      const { amount, reason, leveledUp, newLevelName } = event.detail

      // Notificación de XP
      addNotification({
        type: 'xp',
        title: `+${amount} XP`,
        message: getXPMessage(reason),
        icon: '/icons/sparks.png',
        duration: 3000,
        meta: {
          amount,
          reason
        }
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
          icon: '/icons/bolt.png',
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
      timeoutsRef.current.forEach(timeoutId => {
        clearTimeout(timeoutId)
      })
      timeoutsRef.current.clear()
    }
  }, [])

  const addNotification = (notification) => {
    const timestamp = Date.now()
    let merged = false
    let newId

    setNotifications(prev => {
      if (notification.type === 'xp') {
        const lastNotification = prev[prev.length - 1]
        if (
          lastNotification &&
          lastNotification.type === 'xp' &&
          lastNotification.meta?.reason === notification.meta?.reason
        ) {
          merged = true
          const accumulatedAmount = (lastNotification.meta?.amount || 0) + (notification.meta?.amount || 0)
          const collapsedCount = (lastNotification.collapsedCount || 1) + 1
          const mergedNotification = {
            ...lastNotification,
            title: `+${accumulatedAmount} XP`,
            meta: {
              ...lastNotification.meta,
              amount: accumulatedAmount
            },
            collapsedCount,
            timestamp
          }

          return [...prev.slice(0, -1), mergedNotification]
        }
      }

      newId = Date.now() + Math.random()
      const newNotification = {
        ...notification,
        id: newId,
        timestamp,
        collapsedCount: notification.collapsedCount || 1
      }

      const updatedNotifications = [...prev, newNotification]
      const overflowCount = updatedNotifications.length - MAX_NOTIFICATIONS

      if (overflowCount > 0) {
        const removedNotifications = updatedNotifications.slice(0, overflowCount)
        removedNotifications.forEach(notificationToRemove => {
          const timeoutId = timeoutsRef.current.get(notificationToRemove.id)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutsRef.current.delete(notificationToRemove.id)
          }
        })
      }

      return updatedNotifications.slice(-MAX_NOTIFICATIONS)
    })

    if (!merged && newId) {
      // Auto-remover después de la duración especificada
      const timeoutId = setTimeout(() => {
        removeNotification(newId, { skipTimerClear: true })
      }, notification.duration || 4000)

      timeoutsRef.current.set(newId, timeoutId)
    }
  }

  const removeNotification = (id, options = {}) => {
    const { skipTimerClear = false } = options

    if (!skipTimerClear) {
      const timeoutId = timeoutsRef.current.get(id)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }

    timeoutsRef.current.delete(id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

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
    const { target } = event

    if (!target) return

    // Avoid infinite loops by clearing the error handler before swapping the source
    target.onerror = null

    if (import.meta.env.DEV) {
      // Surface missing icon information in development for easier debugging/metrics
      console.warn('Gamification notification icon missing, applying fallback', {
        attemptedSrc: target.src,
        fallbackSrc: target.dataset?.fallback || '/icons/sparks.png'
      })
    }

    target.src = target.dataset?.fallback || '/icons/sparks.png'
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
          {notification.collapsedCount > 1 && (
            <div
              className="notification-badge"
              aria-label={`${notification.collapsedCount} eventos combinados`}
            >
              ×{notification.collapsedCount}
            </div>
          )}
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