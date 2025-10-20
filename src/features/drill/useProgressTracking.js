// Hook personalizado para tracking de progreso en Drill

import { useEffect, useRef, useState } from 'react'
import {
  trackAttemptStarted,
  trackAttemptSubmitted,
  trackHintShown,
  trackStreakIncremented,
  trackTenseDrillStarted,
  trackTenseDrillEnded
} from './tracking.js'
import { incrementSessionCount, getCurrentUserId } from '../../lib/progress/userManager/index.js'
import {
  isProgressSystemInitialized,
  onProgressSystemReady
} from '../../lib/progress/index.js'
import { createLogger } from '../../lib/utils/logger.js'
import { incrementSessionAttempts } from '../../lib/progress/planTracking.js'
import { useSettings } from '../../state/settings.js'
import { getAdaptiveEngine } from '../../lib/progress/AdaptiveDifficultyEngine.js'

/**
 * Hook personalizado para tracking de progreso en Drill
 * @param {Object} currentItem - Ítem actual que se está practicando
 * @param {Function} onResult - Función que se llama cuando hay un resultado
 * @returns {Object} Funciones para manejar el tracking
 */
export function useProgressTracking(currentItem, onResult) {
  const logger = createLogger('useProgressTracking')
  const attemptIdRef = useRef(null)
  const itemStartTimeRef = useRef(null)
  const sessionInitializedRef = useRef(false)
  const [progressSystemReady, setProgressSystemReady] = useState(false)
  const settings = useSettings()

  // Verificar si el sistema de progreso está listo usando eventos
  useEffect(() => {
    // Verificar estado inicial
    const initialState = isProgressSystemInitialized()
    if (initialState !== progressSystemReady) {
      setProgressSystemReady(initialState)
      logger.debug(`Estado inicial del sistema de progreso: ${initialState ? 'listo' : 'no disponible'}`)
    }

    // Suscribirse a eventos de cambio de estado (más eficiente que sondeo)
    const unsubscribe = onProgressSystemReady((isReady) => {
      setProgressSystemReady(isReady)
      logger.debug(`Sistema de progreso ahora está: ${isReady ? 'listo' : 'no disponible'}`)
    })

    return unsubscribe
  }, [])

  // Efecto para iniciar el tracking cuando cambia el ítem
  useEffect(() => {
    if (currentItem && currentItem.id && progressSystemReady) {
      // Inicializar sesión solo una vez
      if (!sessionInitializedRef.current) {
        try {
          const userId = getCurrentUserId()
          if (userId) {
            incrementSessionCount(userId)
            sessionInitializedRef.current = true
            logger.debug('Nueva sesión de práctica iniciada')
          } else {
            logger.warn('Usuario no disponible para inicializar sesión')
          }
        } catch (error) {
          logger.warn('Error al inicializar sesión:', error)
        }
      }
      
      // Registrar inicio de intento con protección
      try {
        attemptIdRef.current = trackAttemptStarted(currentItem)
        itemStartTimeRef.current = Date.now()
        logger.debug(`Intento iniciado para ítem ${currentItem.id}`)
      } catch (error) {
        logger.warn('Error al iniciar tracking de intento:', error)
        // Continuar sin tracking para no romper el flujo
        attemptIdRef.current = null
        itemStartTimeRef.current = Date.now() // Mantener tiempo para latencia
      }
    } else if (currentItem && currentItem.id && !progressSystemReady) {
      logger.debug('Esperando a que el sistema de progreso esté listo...')
    }
    
    // Cleanup: registrar fin de intento si es necesario
    return () => {
      if (attemptIdRef.current) {
        logger.debug(`Intento ${attemptIdRef.current} finalizado (cleanup)`)
        attemptIdRef.current = null
        itemStartTimeRef.current = null
      }
    }
  }, [currentItem?.id, progressSystemReady])

  /**
   * Maneja el resultado de un intento
   * @param {Object} result - Resultado del intento
   */
  const handleResult = async (result) => {
    // Llamar al callback original
    if (onResult) {
      onResult(result)
    }

    // Si hay una sesión de plan activa, incrementar el contador
    if (settings.activeSessionId && settings.activePlanId) {
      try {
        incrementSessionAttempts(settings.activeSessionId, result.correct)
        logger.debug(`Plan session attempt tracked: ${result.correct ? 'correct' : 'incorrect'}`)
      } catch (error) {
        logger.warn('Error al rastrear intento de sesión de plan:', error)
      }
    }

    // Process response with Adaptive Difficulty Engine
    if (currentItem && itemStartTimeRef.current) {
      try {
        const adaptiveEngine = getAdaptiveEngine()
        const latencyMs = Date.now() - itemStartTimeRef.current

        const adaptiveResponse = {
          correct: result.correct,
          latency: latencyMs,
          verbId: currentItem.lemma,
          mood: currentItem.mood,
          tense: currentItem.tense
        }

        const adaptiveResult = adaptiveEngine.processResponse(adaptiveResponse)

        logger.debug('Adaptive difficulty processed', {
          flowState: adaptiveResult.flowState,
          difficultyBoost: adaptiveResult.difficultyBoost,
          adjustment: adaptiveResult.adjustment
        })
      } catch (error) {
        logger.warn('Error al procesar adaptive difficulty:', error)
      }
    }

    // Registrar el resultado del intento solo si el sistema está listo
    if (progressSystemReady && attemptIdRef.current && itemStartTimeRef.current) {
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
          item: currentItem,
          practiceType: result.practiceType,
          meta: result.meta
        })

        logger.debug(`Intento ${attemptIdRef.current} registrado`)
      } catch (error) {
        logger.warn('Error al registrar resultado del intento:', error)
      } finally {
        // Limpiar referencias siempre
        attemptIdRef.current = null
        itemStartTimeRef.current = null
      }
    } else if (itemStartTimeRef.current) {
      // Si no hay tracking pero sí había tiempo, limpiarlo
      logger.debug('Resultado procesado sin tracking (sistema no listo)')
      itemStartTimeRef.current = null
    }
  }

  /**
   * Registra que se mostró una pista
   */
  const handleHintShown = async () => {
    if (!progressSystemReady) {
      logger.debug('Pista mostrada (sin tracking)')
      return
    }
    
    try {
      await trackHintShown()
      logger.debug('Pista mostrada y registrada')
    } catch (error) {
      logger.warn('Error al registrar pista:', error)
    }
  }

  /**
   * Registra que se incrementó una racha
   */
  const handleStreakIncremented = async () => {
    if (!progressSystemReady) {
      logger.debug('Racha incrementada (sin tracking)')
      return
    }
    
    try {
      await trackStreakIncremented()
      logger.debug('Racha incrementada y registrada')
    } catch (error) {
      logger.warn('Error al registrar racha:', error)
    }
  }

  /**
   * Registra que se inició un drill de tiempo
   * @param {string} tense - Tiempo que se practica
   */
  const handleTenseDrillStarted = async (tense) => {
    if (!progressSystemReady) {
      logger.debug(`Drill de tiempo ${tense} iniciado (sin tracking)`)
      return
    }
    
    try {
      await trackTenseDrillStarted(tense)
      logger.debug(`Drill de tiempo ${tense} iniciado y registrado`)
    } catch (error) {
      logger.warn('Error al registrar inicio de drill:', error)
    }
  }

  /**
   * Registra que se finalizó un drill de tiempo
   * @param {string} tense - Tiempo que se practicaba
   */
  const handleTenseDrillEnded = async (tense) => {
    if (!progressSystemReady) {
      logger.debug(`Drill de tiempo ${tense} finalizado (sin tracking)`)
      return
    }
    
    try {
      await trackTenseDrillEnded(tense)
      logger.debug(`Drill de tiempo ${tense} finalizado y registrado`)
    } catch (error) {
      logger.warn('Error al registrar fin de drill:', error)
    }
  }

  return {
    handleResult,
    handleHintShown,
    handleStreakIncremented,
    handleTenseDrillStarted,
    handleTenseDrillEnded,
    progressSystemReady
  }
}
