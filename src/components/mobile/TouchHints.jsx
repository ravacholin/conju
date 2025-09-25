import React, { useState, useEffect } from 'react'
import './TouchHints.css'

export default function TouchHints({
  children,
  hint = 'Toca para interactuar',
  showSwipeHints = false,
  longPressHint = null,
  position = 'bottom',
  delay = 1000,
  autoHide = true,
  className = '',
  ...props
}) {
  const [showHint, setShowHint] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isTouchDevice] = useState('ontouchstart' in window || navigator.maxTouchPoints > 0)

  useEffect(() => {
    if (!isTouchDevice || hasInteracted) return

    const timer = setTimeout(() => {
      setShowHint(true)

      if (autoHide) {
        setTimeout(() => {
          setShowHint(false)
        }, 3000) // Ocultar después de 3 segundos
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [delay, autoHide, isTouchDevice, hasInteracted])

  const handleInteraction = () => {
    setHasInteracted(true)
    setShowHint(false)
  }

  if (!isTouchDevice) return children

  return (
    <div
      className={`touch-hints-container ${className}`}
      onTouchStart={handleInteraction}
      onClick={handleInteraction}
      {...props}
    >
      {children}

      {showHint && (
        <div className={`touch-hint ${position}`}>
          <div className="touch-hint-content">
            <span className="touch-hint-icon">👆</span>
            <span className="touch-hint-text">{hint}</span>
          </div>

          {showSwipeHints && (
            <div className="swipe-hints">
              <div className="swipe-hint">
                <span className="swipe-icon">👈</span>
                <span className="swipe-text">Desliza</span>
              </div>
              <div className="swipe-hint">
                <span className="swipe-icon">👉</span>
                <span className="swipe-text">Navegar</span>
              </div>
            </div>
          )}

          {longPressHint && (
            <div className="long-press-hint">
              <span className="long-press-icon">🫸</span>
              <span className="long-press-text">{longPressHint}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Componente especializado para hints de SRS
 */
export function SRSHints({ children, showDetails = false }) {
  const hints = {
    main: showDetails ? 'Toca para contraer detalles' : 'Toca "Detalles" para ver más información',
    swipe: 'Desliza para navegar entre elementos',
    longPress: 'Mantén presionado para opciones rápidas'
  }

  return (
    <TouchHints
      hint={hints.main}
      showSwipeHints={true}
      longPressHint={hints.longPress}
      position="top"
      className="srs-hints"
    >
      {children}
    </TouchHints>
  )
}

/**
 * Componente para hints de gamificación
 */
export function GamificationHints({ children, compact = false }) {
  const hint = compact
    ? 'Toca para ver progreso detallado'
    : 'Explora tus logros y estadísticas'

  return (
    <TouchHints
      hint={hint}
      position="bottom"
      className="gamification-hints"
      delay={2000}
    >
      {children}
    </TouchHints>
  )
}

/**
 * Componente para hints de viaje
 */
export function JourneyHints({ children }) {
  return (
    <TouchHints
      hint="Explora tu progreso y hitos alcanzados"
      position="top"
      className="journey-hints"
      delay={1500}
      autoHide={false}
    >
      {children}
    </TouchHints>
  )
}