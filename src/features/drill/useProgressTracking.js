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
import { incrementSessionCount, getCurrentUserId } from '../../lib/progress/userManager.js'
import { isProgressSystemInitialized } from '../../lib/progress/index.js'

/**
 * Hook personalizado para tracking de progreso en Drill
 * @param {Object} currentItem - Ítem actual que se está practicando
 * @param {Function} onResult - Función que se llama cuando hay un resultado
 * @returns {Object} Funciones para manejar el tracking
 */
export function useProgressTracking(currentItem, onResult) {
  const attemptIdRef = useRef(null)
  const itemStartTimeRef = useRef(null)
  const sessionInitializedRef = useRef(false)
  const progressSystemReadyRef = useRef(false)

  // Verificar si el sistema de progreso está listo
  useEffect(() => {
    const checkProgressSystem = () => {
      try {
        const isReady = isProgressSystemInitialized()
        if (isReady !== progressSystemReadyRef.current) {
          progressSystemReadyRef.current = isReady
          console.log(`📊 Sistema de progreso ${isReady ? 'listo' : 'no disponible'}`)
        }
      } catch (error) {
        console.warn('Error al verificar estado del sistema de progreso:', error)
        progressSystemReadyRef.current = false
      }
    }

    // Verificar inmediatamente
    checkProgressSystem()

    // Verificar periódicamente hasta que esté listo
    const interval = setInterval(() => {
      if (!progressSystemReadyRef.current) {
        checkProgressSystem()
      } else {
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // Efecto para iniciar el tracking cuando cambia el ítem
  useEffect(() => {
    if (currentItem && currentItem.id && progressSystemReadyRef.current) {
      // Inicializar sesión solo una vez
      if (!sessionInitializedRef.current) {
        try {
          const userId = getCurrentUserId()
          if (userId) {
            incrementSessionCount(userId)
            sessionInitializedRef.current = true
            console.log('📊 Nueva sesión de práctica iniciada')
          } else {
            console.warn('Usuario no disponible para inicializar sesión')
          }
        } catch (error) {
          console.warn('Error al inicializar sesión:', error)
        }
      }
      
      // Registrar inicio de intento con protección
      try {
        attemptIdRef.current = trackAttemptStarted(currentItem)
        itemStartTimeRef.current = Date.now()
        console.log(`🎯 Intento iniciado para ítem ${currentItem.id}`)
      } catch (error) {
        console.warn('Error al iniciar tracking de intento:', error)
        // Continuar sin tracking para no romper el flujo
        attemptIdRef.current = null
        itemStartTimeRef.current = Date.now() // Mantener tiempo para latencia
      }
    } else if (currentItem && currentItem.id && !progressSystemReadyRef.current) {
      console.log('⏳ Esperando a que el sistema de progreso esté listo...')
    }
    
    // Cleanup: registrar fin de intento si es necesario
    return () => {
      if (attemptIdRef.current) {
        console.log(`🔚 Intento ${attemptIdRef.current} finalizado (cleanup)`)
        attemptIdRef.current = null
        itemStartTimeRef.current = null
      }
    }
  }, [currentItem?.id, progressSystemReadyRef.current])

  /**
   * Maneja el resultado de un intento
   * @param {Object} result - Resultado del intento
   */
  const handleResult = async (result) => {
    // Llamar al callback original
    if (onResult) {
      onResult(result)
    }
    
    // Registrar el resultado del intento solo si el sistema está listo
    if (progressSystemReadyRef.current && attemptIdRef.current && itemStartTimeRef.current) {
      try {
        const latencyMs = Date.now() - itemStartTimeRef.current
        
        // Registrar intento completado
        await trackAttemptSubmitted(attemptIdRef.current, {
          correct: result.correct,
          latencyMs,
          hintsUsed: result.hintsUsed || 0,
          errorTags: result.errorTags || [],
          userAnswer: result.userAnswer,
          correctAnswer: result.correctAnswer,
          item: currentItem
        })
        
        console.log(`✅ Intento ${attemptIdRef.current} registrado`)
      } catch (error) {
        console.warn('Error al registrar resultado del intento:', error)
      } finally {
        // Limpiar referencias siempre
        attemptIdRef.current = null
        itemStartTimeRef.current = null
      }
    } else if (itemStartTimeRef.current) {
      // Si no hay tracking pero sí había tiempo, limpiarlo
      console.log('🔄 Resultado procesado sin tracking (sistema no listo)')
      itemStartTimeRef.current = null
    }
  }

  /**
   * Registra que se mostró una pista
   */
  const handleHintShown = async () => {
    if (!progressSystemReadyRef.current) {
      console.log('💡 Pista mostrada (sin tracking)')
      return
    }
    
    try {
      await trackHintShown()
      console.log('💡 Pista mostrada y registrada')
    } catch (error) {
      console.warn('Error al registrar pista:', error)
    }
  }

  /**
   * Registra que se incrementó una racha
   */
  const handleStreakIncremented = async () => {
    if (!progressSystemReadyRef.current) {
      console.log('🔥 Racha incrementada (sin tracking)')
      return
    }
    
    try {
      await trackStreakIncremented()
      console.log('🔥 Racha incrementada y registrada')
    } catch (error) {
      console.warn('Error al registrar racha:', error)
    }
  }

  /**
   * Registra que se inició un drill de tiempo
   * @param {string} tense - Tiempo que se practica
   */
  const handleTenseDrillStarted = async (tense) => {
    if (!progressSystemReadyRef.current) {
      console.log(`🔁 Drill de tiempo ${tense} iniciado (sin tracking)`)
      return
    }
    
    try {
      await trackTenseDrillStarted(tense)
      console.log(`🔁 Drill de tiempo ${tense} iniciado y registrado`)
    } catch (error) {
      console.warn('Error al registrar inicio de drill:', error)
    }
  }

  /**
   * Registra que se finalizó un drill de tiempo
   * @param {string} tense - Tiempo que se practicaba
   */
  const handleTenseDrillEnded = async (tense) => {
    if (!progressSystemReadyRef.current) {
      console.log(`✅ Drill de tiempo ${tense} finalizado (sin tracking)`)
      return
    }
    
    try {
      await trackTenseDrillEnded(tense)
      console.log(`✅ Drill de tiempo ${tense} finalizado y registrado`)
    } catch (error) {
      console.warn('Error al registrar fin de drill:', error)
    }
  }

  return {
    handleResult,
    handleHintShown,
    handleStreakIncremented,
    handleTenseDrillStarted,
    handleTenseDrillEnded
  }
}