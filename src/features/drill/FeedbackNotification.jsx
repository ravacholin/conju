// Componente para mostrar notificaciones de feedback inmediato

import { useState, useEffect } from 'react'

/**
 * Componente que muestra feedback inmediato después de cada respuesta
 */
export default function FeedbackNotification({ 
  result, 
  currentStreak,
  onClose 
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [animationClass, setAnimationClass] = useState('')

  useEffect(() => {
    if (result) {
      setIsVisible(true)
      setAnimationClass('fade-in')
      
      // Auto-ocultar después de 2 segundos
      const timer = setTimeout(() => {
        setAnimationClass('fade-out')
        setTimeout(() => {
          setIsVisible(false)
          if (onClose) onClose()
        }, 300)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [result, onClose])

  if (!isVisible || !result) return null

  const getNotificationConfig = () => {
    if (result.correct) {
      let emoji = '✅'
      let message = '¡Correcto!'
      let extraMessage = ''

      // Diferentes mensajes según la racha
      if (currentStreak >= 10) {
        emoji = '🔥'
        message = '¡Increíble!'
        extraMessage = `${currentStreak} seguidas`
      } else if (currentStreak >= 5) {
        emoji = '⚡'
        message = '¡Excelente!'
        extraMessage = `${currentStreak} seguidas`
      } else if (currentStreak >= 3) {
        emoji = '✨'
        message = '¡Muy bien!'
        extraMessage = `${currentStreak} seguidas`
      }

      return {
        type: 'success',
        emoji,
        message,
        extraMessage,
        color: '#4CAF50'
      }
    } else {
      return {
        type: 'error',
        emoji: '❌',
        message: 'Incorrecto',
        extraMessage: result.correctAnswer ? `Era: ${result.correctAnswer}` : '',
        color: '#f44336'
      }
    }
  }

  const config = getNotificationConfig()

  return (
    <div className={`feedback-notification ${config.type} ${animationClass}`}>
      <div className="feedback-content">
        <div className="feedback-emoji">{config.emoji}</div>
        <div className="feedback-text">
          <div className="feedback-message">{config.message}</div>
          {config.extraMessage && (
            <div className="feedback-extra">{config.extraMessage}</div>
          )}
        </div>
      </div>
    </div>
  )
}