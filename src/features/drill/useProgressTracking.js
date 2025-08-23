// Hook personalizado para integrar el tracking de progreso con el componente de práctica

import { useEffect, useRef } from 'react'
import { useSettings } from '../../state/settings.js'
import { 
  trackAttemptStarted, 
  trackAttemptSubmitted, 
  trackSessionEnded,
  trackHintShown,
  trackStreakIncremented,
  trackTenseDrillStarted,
  trackTenseDrillEnded
} from '../../lib/progress/tracking.js'

/**
 * Hook para manejar el tracking de progreso en el componente de práctica
 * @param {Object} currentItem - Ítem actual que se está practicando
 * @param {Function} onResult - Función que se llama cuando hay un resultado
 */
export function useProgressTracking(currentItem, onResult) {
  const settings = useSettings()
  const attemptIdRef = useRef(null)
  const itemStartTimeRef = useRef(null)

  // Efecto para iniciar el tracking cuando cambia el ítem
  useEffect(() => {
    if (currentItem && currentItem.id) {
      // Registrar inicio de intento
      attemptIdRef.current = trackAttemptStarted(currentItem)
      itemStartTimeRef.current = Date.now()
      
      // Si el ítem tiene un tiempo específico, registrar inicio de drill
      if (currentItem.tense) {
        trackTenseDrillStarted(currentItem.tense)
      }
    }
    
    // Cleanup: registrar fin de drill si es necesario
    return () => {
      if (currentItem && currentItem.tense) {
        trackTenseDrillEnded(currentItem.tense)
      }
    }
  }, [currentItem?.id])

  // Función para manejar el resultado de un intento
  const handleResult = (result) => {
    // Llamar al callback original
    if (onResult) {
      onResult(result)
    }
    
    // Registrar el resultado del intento
    if (attemptIdRef.current && itemStartTimeRef.current) {
      const latencyMs = Date.now() - itemStartTimeRef.current
      
      trackAttemptSubmitted(attemptIdRef.current, {
        correct: result.correct,
        latencyMs,
        hintsUsed: result.hintsUsed || 0,
        errorTags: result.errorTags || []
      })
      
      // Si fue correcto, registrar incremento de racha
      if (result.correct) {
        trackStreakIncremented()
      }
      
      // Limpiar referencias
      attemptIdRef.current = null
      itemStartTimeRef.current = null
    }
  }

  // Función para registrar que se mostró una pista
  const handleHintShown = () => {
    trackHintShown()
  }

  return {
    handleResult,
    handleHintShown
  }
}