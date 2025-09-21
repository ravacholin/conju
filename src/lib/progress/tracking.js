// Sistema de tracking de eventos para el sistema de progreso

import { saveAttempt, saveMastery, getByIndex } from './database.js'
// import { getMasteryByCell } from './database.js'
import { classifyError } from './errorClassification.js'
import { getOrCreateItem } from './itemManagement.js'
import { PROGRESS_CONFIG } from './config.js'
// import { calculateNextInterval, updateSchedule } from './srs.js'
// import { calculateMasteryForItem } from './mastery.js'
import { ERROR_TAGS } from './dataModels.js'
import { processAttempt as processAttemptOrchestrated } from './progressOrchestrator.js'
import { updateSchedule } from './srs.js'

// Estado del tracking
let currentSession = null
let currentUserId = null

/**
 * Inicializa el sistema de tracking
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export async function initTracking(userId) {
  console.log(`🎯 Inicializando tracking para usuario ${userId}`)
  
  try {
    // Crear sesión actual
    currentSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      startedAt: new Date(),
      endedAt: null
    }
    
    currentUserId = userId
    
    console.log(`✅ Tracking inicializado para sesión ${currentSession.id}`)
  } catch (error) {
    console.error('❌ Error al inicializar el sistema de tracking:', error)
    throw error
  }
}

// Mantener el tracking alineado cuando cambia el userId (p. ej., tras login/migración)
if (typeof window !== 'undefined') {
  try {
    window.addEventListener('progress:user-id-changed', (e) => {
      try {
        const newUserId = e?.detail?.newUserId
        if (!newUserId || typeof newUserId !== 'string') return

        // Finalizar sesión actual (si existiera) y abrir una nueva con el nuevo userId
        if (currentSession && !currentSession.endedAt) {
          currentSession.endedAt = new Date()
        }

        currentSession = {
          id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: newUserId,
          startedAt: new Date(),
          endedAt: null
        }
        currentUserId = newUserId

        console.log('🔄 Tracking actualizado tras cambio de userId:', {
          newUserId: currentUserId,
          sessionId: currentSession.id
        })
      } catch (innerErr) {
        console.warn('⚠️ No se pudo actualizar tracking tras cambio de userId:', innerErr?.message || innerErr)
      }
    })
  } catch {/* ignore listener wiring errors */}
}

/**
 * Registra el inicio de un intento
 * @param {Object} item - Ítem que se va a practicar
 * @returns {string} ID del intento
 */
export function trackAttemptStarted(item) {
  if (!currentSession) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  console.log(`🎯 Intento iniciado: ${attemptId} para ítem ${item.id}`)
  return attemptId
}

/**
 * Registra la finalización de un intento
 * @param {string} attemptId - ID del intento
 * @param {Object} result - Resultado del intento
 * @returns {Promise<void>}
 */
export async function trackAttemptSubmitted(attemptId, result) {
  if (!currentSession) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  try {
    // Usar etiquetas si vienen desde la UI; si no, clasificar
    let errorTags = Array.isArray(result.errorTags) ? result.errorTags : []
    if (errorTags.length === 0 && !result.correct && !result.isAccentError) {
      errorTags = classifyError(result.userAnswer, result.correctAnswer, result.item)
    }
    // Derivar identidad canónica del ítem/celda
    const lemma = result.item?.lemma || result.item?.form?.lemma || 'unknown_verb'
    const mood = result.item?.mood || result.item?.form?.mood
    const tense = result.item?.tense || result.item?.form?.tense
    const person = result.item?.person || result.item?.form?.person
    const verbId = result.item?.verbId || lemma
    // Asegurar que exista un ítem canónico en DB (no bloqueante si falla)
    let canonicalItemId = `item-${verbId}-${mood}-${tense}-${person}`
    try {
      const item = await getOrCreateItem(verbId, mood, tense, person)
      canonicalItemId = item.id
    } catch {
      // Continuar con ID canónico aunque falle la creación
    }

    // Datos básicos comunes
    const baseAttempt = {
      id: attemptId,
      userId: currentSession.userId,
      sessionId: currentSession.id,
      itemId: canonicalItemId,
      mood,
      tense,
      person,
      verbId,
      correct: result.correct,
      latencyMs: result.latencyMs,
      hintsUsed: result.hintsUsed || 0,
      errorTags,
      userAnswer: result.userAnswer ?? null,
      correctAnswer: result.correctAnswer ?? null,
      createdAt: new Date()
    }

    // Ejecutar orquestador emocional y adjuntar al intento antes de guardar
    let orchestrated = null
    try {
      orchestrated = processAttemptOrchestrated({
        correct: baseAttempt.correct,
        latencyMs: baseAttempt.latencyMs,
        hintsUsed: baseAttempt.hintsUsed,
        item: { mood, tense, person, verbId, lemma: result.item?.lemma || result.item?.form?.lemma },
        errorTags
      })
    } catch {
      // Failed to get orchestrated data, continue without it
      orchestrated = null
    }

    // Crear objeto de intento (enriquecido con analíticas emocionales)
    const attempt = {
      ...baseAttempt,
      flowState: orchestrated?.flowState,
      momentumType: orchestrated?.momentumType,
      momentumScore: orchestrated?.momentumScore,
      confidenceOverall: orchestrated?.confidenceOverall,
      confidenceCategory: orchestrated?.confidenceCategory
    }
    
    // Guardar intento en la base de datos
    await saveAttempt(attempt)
    
    console.log(`✅ Intento registrado: ${attemptId}`, attempt)

    // Notificar que se actualizaron los datos de progreso
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('progress:dataUpdated', {
        detail: { 
          attemptId, 
          mood, 
          tense, 
          person, 
          correct: attempt.correct,
          userId: currentSession.userId
        }
      }))
    }

    // Actualizar SRS para la celda practicada (pasar metadatos para adaptación)
    try {
      await updateSchedule(
        currentSession.userId,
        { mood, tense, person },
        attempt.correct,
        attempt.hintsUsed,
        { latencyMs: attempt.latencyMs, errorTags }
      )
    } catch (error) {
      console.warn('No se pudo actualizar SRS:', error)
    }

    // Recalcular y guardar mastery de la celda basada en intentos reales del usuario
    try {
      // Obtener intentos del usuario y filtrar por celda actual
      const allUserAttempts = await getByIndex('attempts', 'userId', currentSession.userId)
      const _windowMs = 90 * 24 * 60 * 60 * 1000 // 90 días de ventana para recencia
      const now = Date.now()
      let weightedCorrect = 0
      let weightedTotal = 0
      let _weightedN = 0
      const errorCounts = {}
      for (const a of allUserAttempts) {
        if (a.mood === mood && a.tense === tense && a.person === person && a.verbId) {
          const ageDays = (now - new Date(a.createdAt).getTime()) / (24*60*60*1000)
          const recencyWeight = Math.exp(-ageDays / PROGRESS_CONFIG.DECAY_TAU)
          weightedTotal += recencyWeight
          _weightedN += recencyWeight
          weightedCorrect += recencyWeight * (a.correct ? 1 : 0)
          // Acumular errores con decaimiento
          if (Array.isArray(a.errorTags)) {
            for (const tag of a.errorTags) {
              errorCounts[tag] = (errorCounts[tag] || 0) + recencyWeight
            }
          }
        }
      }
      let score = 50
      if (weightedTotal > 0) {
        score = 100 * (weightedCorrect / weightedTotal)
      }
      const masteryRecord = {
        id: `${currentSession.userId}|${mood}|${tense}|${person}`,
        userId: currentSession.userId,
        mood,
        tense,
        person,
        score: Math.round(score * 100) / 100,
        n: Math.round(_weightedN),
        errorCounts,
        updatedAt: new Date()
      }
      await saveMastery(masteryRecord)
    } catch (error) {
      console.warn('No se pudo actualizar mastery de la celda:', error)
    }
  } catch (error) {
    console.error(`❌ Error al registrar intento ${attemptId}:`, error)
    throw error
  }
}

/**
 * Registra el final de una sesión
 * @param {Object} sessionData - Datos adicionales de la sesión
 * @returns {Promise<void>}
 */
export async function trackSessionEnded(sessionData = {}) {
  if (!currentSession) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  try {
    // Marcar fin de sesión
    currentSession.endedAt = new Date()
    
    console.log(`🔚 Sesión finalizada: ${currentSession.id}`, sessionData)
  } catch (error) {
    console.error('❌ Error al finalizar sesión:', error)
    throw error
  }
}

/**
 * Registra que se mostró una pista
 * @returns {Promise<void>}
 */
export async function trackHintShown() {
  try {
    // En una implementación completa, esto guardaría el evento
    console.log('💡 Pista mostrada')
  } catch (error) {
    console.error('❌ Error al mostrar pista:', error)
    throw error
  }
}

/**
 * Registra que se incrementó una racha
 * @returns {Promise<void>}
 */
export async function trackStreakIncremented() {
  try {
    // En una implementación completa, esto guardaría el evento
    console.log('🔥 Racha incrementada')
  } catch (error) {
    console.error('❌ Error al incrementar racha:', error)
    throw error
  }
}

/**
 * Registra el inicio de un drill de tiempo
 * @param {string} tense - Tiempo que se practica
 * @returns {Promise<void>}
 */
export async function trackTenseDrillStarted(tense) {
  try {
    // En una implementación completa, esto guardaría el evento
    console.log(`🔁 Drill de tiempo ${tense} iniciado`)
  } catch (error) {
    console.error('❌ Error al iniciar drill de tiempo:', error)
    throw error
  }
}

/**
 * Registra el final de un drill de tiempo
 * @param {string} tense - Tiempo que se practicaba
 * @returns {Promise<void>}
 */
export async function trackTenseDrillEnded(tense) {
  try {
    // En una implementación completa, esto guardaría el evento
    console.log(`✅ Drill de tiempo ${tense} finalizado`)
  } catch (error) {
    console.error('❌ Error al finalizar drill de tiempo:', error)
    throw error
  }
}

/**
 * Obtiene las estadísticas actuales del usuario
 * @returns {Promise<Object>} Estadísticas del usuario
 */
export async function getUserStats() {
  if (!currentUserId) {
    throw new Error('Sistema de tracking no inicializado')
  }
  
  try {
    // En una implementación completa, esto calcularía estadísticas reales
    // basadas en los datos de la base de datos
    
    return {
      userId: currentUserId,
      totalAttempts: 0,
      correctAttempts: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActive: new Date()
    }
  } catch (error) {
    console.error('❌ Error al obtener estadísticas del usuario:', error)
    throw error
  }
}

// Re-export classifyError for backward compatibility
export { classifyError }
