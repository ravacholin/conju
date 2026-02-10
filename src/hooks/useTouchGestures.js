import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Hook personalizado para manejar gestos táctiles en dispositivos móviles
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Propiedades y handlers para gestos
 */
export function useTouchGestures(options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onDoubleTap,
    onLongPress,
    swipeThreshold = 50, // píxeles mínimos para considerar swipe
    longPressDelay = 500, // ms para considerar long press
    doubleTapDelay = 300, // ms entre taps para double tap
    enabled = true
  } = options

  const ref = useRef(null)
  const touchStart = useRef({ x: 0, y: 0, time: 0 })
  const touchEnd = useRef({ x: 0, y: 0, time: 0 })
  const [isPressed, setIsPressed] = useState(false)
  const tapCountRef = useRef(0)
  const longPressTimer = useRef(null)
  const doubleTapTimer = useRef(null)

  const clearTimers = useCallback(({ clearDoubleTap = true } = {}) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (clearDoubleTap && doubleTapTimer.current) {
      clearTimeout(doubleTapTimer.current)
      doubleTapTimer.current = null
    }
    if (clearDoubleTap) {
      tapCountRef.current = 0
    }
  }, [])

  const handleTouchStart = useCallback((e) => {
    if (!enabled) return

    const touch = e.touches[0]
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    setIsPressed(true)

    // Iniciar timer para long press
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress(e)
        setIsPressed(false)
      }, longPressDelay)
    }
  }, [enabled, onLongPress, longPressDelay])

  const handleTouchEnd = useCallback((e) => {
    if (!enabled) return

    const touch = e.changedTouches[0]
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    }

    setIsPressed(false)
    clearTimers({ clearDoubleTap: false })

    const deltaX = touchEnd.current.x - touchStart.current.x
    const deltaY = touchEnd.current.y - touchStart.current.y
    const deltaTime = touchEnd.current.time - touchStart.current.time
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Determinar tipo de gesto
    if (distance < 10 && deltaTime < 300) {
      // Es un tap
      tapCountRef.current += 1

      if (doubleTapTimer.current) {
        // Es el segundo tap de un double tap
        clearTimeout(doubleTapTimer.current)
        doubleTapTimer.current = null
        tapCountRef.current = 0
        if (onDoubleTap) {
          onDoubleTap(e)
          return
        }
      }

      // Configurar timer para determinar si es single o double tap
      doubleTapTimer.current = setTimeout(() => {
        if (tapCountRef.current === 1 && onTap) {
          onTap(e)
        }
        tapCountRef.current = 0
        doubleTapTimer.current = null
      }, doubleTapDelay)

    } else if (distance >= swipeThreshold) {
      // Es un swipe
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)

      if (isHorizontal) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight(e, { distance, deltaX, deltaY, deltaTime })
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft(e, { distance, deltaX, deltaY, deltaTime })
        }
      } else {
        if (deltaY < 0 && onSwipeUp) {
          onSwipeUp(e, { distance, deltaX, deltaY, deltaTime })
        } else if (deltaY > 0 && onSwipeDown) {
          onSwipeDown(e, { distance, deltaX, deltaY, deltaTime })
        }
      }
    }
  }, [enabled, onTap, onDoubleTap, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, swipeThreshold, doubleTapDelay, clearTimers])

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false)
    clearTimers()
  }, [clearTimers])

  useEffect(() => {
    const element = ref.current
    if (!element || !enabled) return

    // Configurar event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchcancel', handleTouchCancel)
      clearTimers()
    }
  }, [enabled, handleTouchStart, handleTouchEnd, handleTouchCancel, clearTimers])

  // Cleanup en unmount
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  const isTouchDevice =
    typeof window !== 'undefined' &&
    (('ontouchstart' in window) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0))
  const supportsHover =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(hover: hover)').matches
      : false

  return {
    ref,
    isPressed,
    // Utilidades para detección de dispositivo
    isTouchDevice,
    supportsHover
  }
}

/**
 * Hook simplificado para swipe navigation
 * @param {Function} onSwipeLeft - Handler para swipe izquierdo
 * @param {Function} onSwipeRight - Handler para swipe derecho
 * @param {Object} options - Opciones adicionales
 */
export function useSwipeNavigation(onSwipeLeft, onSwipeRight, options = {}) {
  return useTouchGestures({
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold: options.threshold || 100,
    enabled: options.enabled !== false
  })
}

/**
 * Hook para detectar long press en elementos
 * @param {Function} onLongPress - Handler para long press
 * @param {number} delay - Delay en ms para considerar long press
 */
export function useLongPress(onLongPress, delay = 500) {
  return useTouchGestures({
    onLongPress,
    longPressDelay: delay
  })
}

/**
 * Hook para mejorar interacciones de tap/click
 * @param {Function} onTap - Handler para tap único
 * @param {Function} onDoubleTap - Handler para doble tap
 */
export function useEnhancedTap(onTap, onDoubleTap) {
  return useTouchGestures({
    onTap,
    onDoubleTap
  })
}

export default useTouchGestures
