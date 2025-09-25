import React, { useState, useEffect } from 'react'
import { smartNotifications } from '../../lib/notifications/smartNotifications.js'
import './NotificationSettings.css'

export default function NotificationSettings({ compact = false }) {
  const [notificationState, setNotificationState] = useState({
    supported: false,
    permission: 'default',
    enabled: false,
    hasPatterns: false,
    patterns: null,
    scheduledCount: 0
  })
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    updateNotificationState()

    // Actualizar estado cada minuto
    const interval = setInterval(updateNotificationState, 60000)
    return () => clearInterval(interval)
  }, [])

  const updateNotificationState = () => {
    const stats = smartNotifications.getStats()
    setNotificationState(stats)
  }

  const handleEnableNotifications = async () => {
    setIsRequesting(true)

    try {
      const granted = await smartNotifications.requestPermission()

      if (granted) {
        // Programar notificaciones inteligentes
        await smartNotifications.scheduleSmartNotifications()
        updateNotificationState()

        // Mostrar notificación de confirmación
        if (Notification.permission === 'granted') {
          new Notification(' ¡Notificaciones activadas!', {
            body: 'Te ayudaremos a mantener tu progreso con recordatorios inteligentes.',
            icon: '/icons/logo-192x192.png'
          })
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleTestNotification = () => {
    if (notificationState.enabled) {
      new Notification('🧪 Notificación de prueba', {
        body: 'Las notificaciones están funcionando correctamente. ¡Perfecto!',
        icon: '/icons/logo-192x192.png'
      })
    }
  }

  const renderPermissionStatus = () => {
    switch (notificationState.permission) {
      case 'granted':
        return (
          <div className="permission-status granted">
            <span className="status-icon">✅</span>
            <span className="status-text">Notificaciones activadas</span>
          </div>
        )
      case 'denied':
        return (
          <div className="permission-status denied">
            <span className="status-icon">❌</span>
            <span className="status-text">Notificaciones bloqueadas</span>
          </div>
        )
      default:
        return (
          <div className="permission-status pending">
            <span className="status-icon">️</span>
            <span className="status-text">Sin configurar</span>
          </div>
        )
    }
  }

  const renderUserPatterns = () => {
    if (!notificationState.hasPatterns) {
      return (
        <div className="patterns-info">
          <p className="patterns-message">
             Analizando tus patrones de estudio para optimizar las notificaciones...
          </p>
          <div className="patterns-tip">
            <span className="tip-icon"></span>
            <span className="tip-text">
              Practica al menos 10 veces para que podamos personalizar tus recordatorios
            </span>
          </div>
        </div>
      )
    }

    const { patterns } = notificationState
    const preferredTime = patterns.preferredHours?.[0]
    const optimalTime = patterns.optimalHours?.[0]

    return (
      <div className="patterns-info">
        <h5> Tu perfil de aprendizaje</h5>
        <div className="pattern-insights">
          {preferredTime && (
            <div className="insight">
              <span className="insight-icon"></span>
              <span className="insight-text">
                Sueles estudiar a las {preferredTime}:00h
              </span>
            </div>
          )}
          {optimalTime && optimalTime !== preferredTime && (
            <div className="insight">
              <span className="insight-icon"></span>
              <span className="insight-text">
                Tu mejor rendimiento es a las {optimalTime}:00h
              </span>
            </div>
          )}
          <div className="insight">
            <span className="insight-icon"></span>
            <span className="insight-text">
              {Math.round(patterns.avgAccuracy * 100)}% de precisión promedio
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="notification-settings compact">
        <div className="compact-content">
          {renderPermissionStatus()}
          {!notificationState.enabled && (
            <button
              className="enable-btn compact"
              onClick={handleEnableNotifications}
              disabled={isRequesting || !notificationState.supported}
            >
              {isRequesting ? '⏳' : ''} Activar
            </button>
          )}
          {notificationState.scheduledCount > 0 && (
            <div className="scheduled-info">
              {notificationState.scheduledCount} programadas
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!notificationState.supported) {
    return (
      <div className="notification-settings unsupported">
        <div className="unsupported-content">
          <div className="unsupported-icon"></div>
          <h4>Notificaciones no disponibles</h4>
          <p>Tu navegador no soporta notificaciones push o estás en modo incógnito.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="notification-settings full">
      <div className="settings-header">
        <h3>
          <img src="/icons/bell.png" alt="Notificaciones" className="section-icon" onError={(e) => e.target.style.display = 'none'} />
          Notificaciones Inteligentes
        </h3>
        <p className="settings-subtitle">
          Recordatorios personalizados basados en tus patrones de aprendizaje
        </p>
      </div>

      <div className="settings-content">
        <div className="permission-section">
          <div className="section-header">
            <h4>Estado de Permisos</h4>
            {renderPermissionStatus()}
          </div>

          {notificationState.permission === 'default' && (
            <div className="enable-section">
              <p className="enable-description">
                Activa las notificaciones para recibir recordatorios inteligentes
                basados en tus mejores horarios de estudio.
              </p>
              <button
                className="enable-btn"
                onClick={handleEnableNotifications}
                disabled={isRequesting}
              >
                {isRequesting ? (
                  <>
                    <span className="btn-spinner">⏳</span>
                    Solicitando permisos...
                  </>
                ) : (
                  <>
                    <span className="btn-icon"></span>
                    Activar notificaciones inteligentes
                  </>
                )}
              </button>
            </div>
          )}

          {notificationState.permission === 'denied' && (
            <div className="denied-section">
              <div className="denied-message">
                <span className="denied-icon"></span>
                <div className="denied-text">
                  <p>Las notificaciones están bloqueadas en tu navegador.</p>
                  <p className="denied-help">
                    Para habilitarlas, haz clic en el ícono de candado junto a la URL
                    y permite las notificaciones.
                  </p>
                </div>
              </div>
            </div>
          )}

          {notificationState.enabled && (
            <div className="enabled-section">
              <div className="enabled-actions">
                <button
                  className="test-btn"
                  onClick={handleTestNotification}
                >
                  <span className="btn-icon">🧪</span>
                  Probar notificación
                </button>

                {notificationState.scheduledCount > 0 && (
                  <div className="scheduled-info">
                    <span className="scheduled-icon"></span>
                    <span className="scheduled-text">
                      {notificationState.scheduledCount} notificaciones programadas
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {renderUserPatterns()}

        {notificationState.enabled && (
          <div className="features-section">
            <h4> Características Inteligentes</h4>
            <div className="features-list">
              <div className="feature">
                <span className="feature-icon"></span>
                <div className="feature-content">
                  <h5>Timing Personalizado</h5>
                  <p>Te recordamos estudiar en tus horarios de mejor rendimiento</p>
                </div>
              </div>

              <div className="feature">
                <span className="feature-icon"></span>
                <div className="feature-content">
                  <h5>Preservación de Rachas</h5>
                  <p>Alertas especiales para mantener tus días consecutivos</p>
                </div>
              </div>

              <div className="feature">
                <span className="feature-icon"></span>
                <div className="feature-content">
                  <h5>Adaptativo</h5>
                  <p>Se ajusta automáticamente según tu progreso y horarios</p>
                </div>
              </div>

              <div className="feature">
                <span className="feature-icon"></span>
                <div className="feature-content">
                  <h5>SRS Inteligente</h5>
                  <p>Recordatorios cuando tus repasos están listos</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}