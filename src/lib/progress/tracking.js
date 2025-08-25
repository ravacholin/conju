// Sistema de tracking de eventos para el sistema de progreso

import { saveAttempt, saveMastery, getMasteryByCell, getByIndex } from './database.js'
import { getOrCreateItem } from './itemManagement.js'
import { PROGRESS_CONFIG } from './config.js'
// import { calculateNextInterval, updateSchedule } from './srs.js'
// import { calculateMasteryForItem } from './mastery.js'
import { ERROR_TAGS } from './dataModels.js'

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
    } catch (e) {
      // Continuar con ID canónico aunque falle la creación
    }

    // Crear objeto de intento (enriquecido con celda para analíticas reales)
    const attempt = {
      id: attemptId,
      userId: currentSession.userId,
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
    
    // Guardar intento en la base de datos
    await saveAttempt(attempt)
    
    console.log(`✅ Intento registrado: ${attemptId}`, attempt)

    // Recalcular y guardar mastery de la celda basada en intentos reales del usuario
    try {
      // Obtener intentos del usuario y filtrar por celda actual
      const allUserAttempts = await getByIndex('attempts', 'userId', currentSession.userId)
      const windowMs = 90 * 24 * 60 * 60 * 1000 // 90 días de ventana para recencia
      const now = Date.now()
      let weightedCorrect = 0
      let weightedTotal = 0
      let weightedN = 0
      for (const a of allUserAttempts) {
        if (a.mood === mood && a.tense === tense && a.person === person && a.verbId) {
          const ageDays = (now - new Date(a.createdAt).getTime()) / (24*60*60*1000)
          const recencyWeight = Math.exp(-ageDays / PROGRESS_CONFIG.DECAY_TAU)
          weightedTotal += recencyWeight
          weightedN += recencyWeight
          weightedCorrect += recencyWeight * (a.correct ? 1 : 0)
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
        updatedAt: new Date()
      }
      await saveMastery(masteryRecord)
    } catch (e) {
      console.warn('No se pudo actualizar mastery de la celda:', e)
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

/**
 * Clasifica un error específico
 * @param {string} userAnswer - Respuesta del usuario
 * @param {string} correctAnswer - Respuesta correcta
 * @param {Object} item - Ítem practicado
 * @returns {string[]} Etiquetas de error
 */
export function classifyError(userAnswer, correctAnswer, item) {
  const errors = []
  
  // Normalizar las respuestas para comparación
  const normalizedUser = normalizeAnswer(userAnswer)
  const normalizedCorrect = normalizeAnswer(correctAnswer)
  
  // Si las respuestas son idénticas, no hay error
  if (normalizedUser === normalizedCorrect) {
    return []
  }
  
  // Verificar errores específicos
  
  // 1. Persona equivocada
  if (item.person && userAnswer && correctAnswer) {
    // Extraer la persona de la respuesta correcta si está disponible
    const _unused_correctPerson = item.person
    
    // Esta es una implementación simplificada
    // En la práctica, se necesitaría un análisis más complejo
    // Por ahora, marcamos como error de persona si hay diferencia
    errors.push(ERROR_TAGS.WRONG_PERSON)
  }
  
  // 2. Terminación verbal
  // Verificar si la raíz es correcta pero la terminación no
  if (item.form && item.form.lemma) {
    const lemma = item.form.lemma
    // Verificar si la respuesta del usuario contiene la raíz correcta
    // pero tiene una terminación incorrecta
    if (normalizedUser && normalizedCorrect && 
        normalizedCorrect.startsWith(lemma.slice(0, -2)) && 
        !normalizedUser.startsWith(lemma.slice(0, -2))) {
      errors.push(ERROR_TAGS.VERBAL_ENDING)
    }
  }
  
  // 3. Raíz irregular
  // Verificar si la terminación es correcta pero la raíz no
  if (item.form && item.form.value) {
    const correctEnding = normalizedCorrect.slice(-2)
    const userEnding = normalizedUser.slice(-2)
    
    if (correctEnding === userEnding && normalizedUser !== normalizedCorrect) {
      errors.push(ERROR_TAGS.IRREGULAR_STEM)
    }
  }
  
  // 4. Acentuación
  // Verificar si la diferencia es solo en acentuación
  if (normalizedUser.replace(/[\u0300-\u036f]/g, '') === 
      normalizedCorrect.replace(/[\u0300-\u036f]/g, '') && 
      normalizedUser !== normalizedCorrect) {
    errors.push(ERROR_TAGS.ACCENT)
  }
  
  // 5. Ortografía (g/gu, c/qu, z/c)
  // Verificar errores comunes de ortografía
  if (normalizedUser.replace(/gu/g, 'g') === normalizedCorrect ||
      normalizedUser.replace(/g/g, 'gu') === normalizedCorrect ||
      normalizedUser.replace(/qu/g, 'c') === normalizedCorrect ||
      normalizedUser.replace(/c/g, 'qu') === normalizedCorrect ||
      normalizedUser.replace(/z/g, 'c') === normalizedCorrect ||
      normalizedUser.replace(/c/g, 'z') === normalizedCorrect) {
    errors.push(ERROR_TAGS.ORTHOGRAPHY_G_GU)
  }
  
  // Si no se identifican errores específicos, marcar como error general
  if (errors.length === 0) {
    errors.push(ERROR_TAGS.WRONG_PERSON) // Por defecto
  }
  
  return errors
}

/**
 * Normaliza una respuesta para comparación
 * @param {string} answer - Respuesta a normalizar
 * @returns {string} Respuesta normalizada
 */
function normalizeAnswer(answer) {
  if (!answer || typeof answer !== 'string') return ''
  
  return answer
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim()
}
