// Funciones de tracking para el sistema de progreso

import {
  trackAttemptStarted as internalTrackAttemptStarted,
  trackAttemptSubmitted as internalTrackAttemptSubmitted,
  trackSessionEnded as internalTrackSessionEnded,
  trackHintShown as internalTrackHintShown,
  trackStreakIncremented as internalTrackStreakIncremented,
  trackTenseDrillStarted as internalTrackTenseDrillStarted,
  trackTenseDrillEnded as internalTrackTenseDrillEnded,
  getUserStats as internalGetUserStats,
} from "../../lib/progress/tracking.js";
import { classifyError as internalClassifyError } from "../../lib/progress/errorClassification.js";
import { createLogger } from "../../lib/utils/logger.js";
import { generateId } from "../../lib/utils/id.js";

const logger = createLogger("drill:tracking");

/**
 * Registra el inicio de un intento
 * @param {Object} item - Ítem que se va a practicar
 * @returns {string} ID del intento
 */
export function trackAttemptStarted(item) {
  try {
    const attemptId = internalTrackAttemptStarted(item);
    logger.debug(
      "trackAttemptStarted",
      `Intento ${attemptId} iniciado para ítem ${item.id}`,
    );
    return attemptId;
  } catch (error) {
    logger.error("trackAttemptStarted", "Error al iniciar intento", error);
    // Generar ID de respaldo robusto y ordenable
    return generateId("attempt");
  }
}

/**
 * Registra la finalización de un intento
 * @param {string} attemptId - ID del intento
 * @param {Object} result - Resultado del intento
 * @returns {Promise<void>}
 */
export async function trackAttemptSubmitted(attemptId, result) {
  try {
    await internalTrackAttemptSubmitted(attemptId, result);
    logger.debug("trackAttemptSubmitted", `Intento ${attemptId} registrado`);
  } catch (error) {
    logger.error("trackAttemptSubmitted", "Error al registrar intento", error);
  }
}

/**
 * Registra el final de una sesión
 * @param {Object} sessionData - Datos adicionales de la sesión
 * @returns {Promise<void>}
 */
export async function trackSessionEnded(sessionData = {}) {
  try {
    await internalTrackSessionEnded(sessionData);
    logger.debug("trackSessionEnded", "Sesión finalizada");
  } catch (error) {
    logger.error("trackSessionEnded", "Error al finalizar sesión", error);
  }
}

/**
 * Registra que se mostró una pista
 * @returns {Promise<void>}
 */
export async function trackHintShown() {
  try {
    await internalTrackHintShown();
    logger.debug("trackHintShown", "Pista mostrada");
  } catch (error) {
    logger.error("trackHintShown", "Error al mostrar pista", error);
  }
}

/**
 * Registra que se incrementó una racha
 * @returns {Promise<void>}
 */
export async function trackStreakIncremented() {
  try {
    await internalTrackStreakIncremented();
    logger.debug("trackStreakIncremented", "Racha incrementada");
  } catch (error) {
    logger.error("trackStreakIncremented", "Error al incrementar racha", error);
  }
}

/**
 * Registra el inicio de un drill de tiempo
 * @param {string} tense - Tiempo que se practica
 * @returns {Promise<void>}
 */
export async function trackTenseDrillStarted(tense) {
  try {
    await internalTrackTenseDrillStarted(tense);
    logger.debug("trackTenseDrillStarted", `Drill de tiempo ${tense} iniciado`);
  } catch (error) {
    logger.error(
      "trackTenseDrillStarted",
      "Error al iniciar drill de tiempo",
      error,
    );
  }
}

/**
 * Registra el final de un drill de tiempo
 * @param {string} tense - Tiempo que se practicaba
 * @returns {Promise<void>}
 */
export async function trackTenseDrillEnded(tense) {
  try {
    await internalTrackTenseDrillEnded(tense);
    logger.debug("trackTenseDrillEnded", `Drill de tiempo ${tense} finalizado`);
  } catch (error) {
    logger.error(
      "trackTenseDrillEnded",
      "Error al finalizar drill de tiempo",
      error,
    );
  }
}

/**
 * Obtiene las estadísticas actuales del usuario
 * @returns {Promise<Object>} Estadísticas del usuario
 */
export async function getUserStats() {
  try {
    const stats = await internalGetUserStats();
    return stats;
  } catch (error) {
    logger.error(
      "getUserStats",
      "Error al obtener estadísticas del usuario",
      error,
    );
    return {};
  }
}

/**
 * Clasifica un error de conjugación
 * @param {string} userAnswer - Respuesta del usuario
 * @param {string} correctAnswer - Respuesta correcta
 * @param {Object} item - Ítem practicado
 * @returns {string[]} Etiquetas de error
 */
export function classifyError(userAnswer, correctAnswer, item) {
  try {
    const errors = internalClassifyError(userAnswer, correctAnswer, item);
    return errors;
  } catch (error) {
    logger.error("classifyError", "Error al clasificar error", error);
    // Devolver error genérico si falla la clasificación
    return ["error_general"];
  }
}
