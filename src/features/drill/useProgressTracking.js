// Hook personalizado para tracking de progreso en Drill

import { useEffect, useRef } from 'react'
import { 
  trackAttemptStarted, 
  trackAttemptSubmitted,
  trackHintShown,
  trackStreakIncremented,
  trackTenseDrillStarted,
  trackTenseDrillEnded
} from './tracking.js'

/**
 * Hook personalizado para tracking de progreso en Drill
 * @param {Object} currentItem - Ítem actual que se está practicando
 * @param {Function} onResult - Función que se llama cuando hay un resultado
 * @returns {Object} Funciones para manejar el tracking
 */
export function useProgressTracking(currentItem, onResult) {
  const attemptIdRef = useRef(null)
  const itemStartTimeRef = useRef(null)

  // Efecto para iniciar el tracking cuando cambia el ítem
  useEffect(() => {
    if (currentItem && currentItem.id) {
      // Registrar inicio de intento
      attemptIdRef.current = trackAttemptStarted(currentItem)
      itemStartTimeRef.current = Date.now()
      
      console.log(`🎯 Intento iniciado para ítem ${currentItem.id}`)
    }
    
    // Cleanup: registrar fin de intento si es necesario
    return () => {
      if (attemptIdRef.current) {
        console.log(`🔚 Intento ${attemptIdRef.current} finalizado (cleanup)`)
        attemptIdRef.current = null
        itemStartTimeRef.current = null
      }
    }
  }, [currentItem?.id])

  /**
   * Maneja el resultado de un intento
   * @param {Object} result - Resultado del intento
   */
  const handleResult = async (result) => {
    // Llamar al callback original
    if (onResult) {
      onResult(result)
    }
    
    // Registrar el resultado del intento
    if (attemptIdRef.current && itemStartTimeRef.current) {
      const latencyMs = Date.now() - itemStartTimeRef.current
      
      // Registrar intento completado
      await trackAttemptSubmitted(attemptIdRef.current, {
        correct: result.correct,
        latencyMs,
        hintsUsed: result.hintsUsed || 0,
        errorTags: result.errorTags || [],
        userAnswer: result.userAnswer,
        correctAnswer: result.correctAnswer
      })
      
      console.log(`✅ Intento ${attemptIdRef.current} registrado`)
      
      // Limpiar referencias
      attemptIdRef.current = null
      itemStartTimeRef.current = null
    }
  }

  /**
   * Registra que se mostró una pista
   */
  const handleHintShown = async () => {
    await trackHintShown()
    console.log('💡 Pista mostrada')
  }

  /**
   * Registra que se incrementó una racha
   */
  const handleStreakIncremented = async () => {
    await trackStreakIncremented()
    console.log('🔥 Racha incrementada')
  }

  /**
   * Registra que se inició un drill de tiempo
   * @param {string} tense - Tiempo que se practica
   */
  const handleTenseDrillStarted = async (tense) => {
    await trackTenseDrillStarted(tense)
    console.log(`🔁 Drill de tiempo ${tense} iniciado`)
  }

  /**
   * Registra que se finalizó un drill de tiempo
   * @param {string} tense - Tiempo que se practicaba
   */
  const handleTenseDrillEnded = async (tense) => {
    await trackTenseDrillEnded(tense)
    console.log(`✅ Drill de tiempo ${tense} finalizado`)
  }

  return {
    handleResult,
    handleHintShown,
    handleStreakIncremented,
    handleTenseDrillStarted,
    handleTenseDrillEnded
  }
}