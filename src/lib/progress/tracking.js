// Sistema de tracking de eventos para el sistema de progreso

import {
  saveAttempt,
  saveMastery,
  getByIndex,
  getAttemptsByUser,
  getMasteryByUser,
  saveEvent,
} from "./database.js";
// import { getMasteryByCell } from './database.js'
import { classifyError } from "./errorClassification.js";
import { getOrCreateItem } from "./itemManagement.js";
import { PROGRESS_CONFIG } from "./config.js";
// import { calculateNextInterval, updateSchedule } from './srs.js'
// import { calculateMasteryForItem } from './mastery.js'
import { ERROR_TAGS } from "./dataModels.js";
import { processAttempt as processAttemptOrchestrated } from "./progressOrchestrator.js";
import { updateSchedule } from "./srs.js";
import { notifyNewAttempt } from "./incrementalMastery.js";
import {
  recordGlobalCompetency,
  refreshGlobalDynamicEvaluations,
} from "../levels/userLevelProfile.js";
import { checkUserProgression } from "../levels/levelProgression.js";
import { createLogger } from "../utils/logger.js";
import { generateId } from "../utils/id.js";
import { emitProgressEvent, PROGRESS_EVENTS } from "../events/progressEventBus.js";

const logger = createLogger("progress:tracking");

// Estado del tracking
let currentSession = null;
let currentUserId = null;

/**
 * Inicializa el sistema de tracking
 * @param {string} userId - ID del usuario
 * @returns {Promise<void>}
 */
export async function initTracking(userId) {
  logger.debug("initTracking", `Inicializando tracking para usuario ${userId}`);

  try {
    // Crear sesión actual
    currentSession = {
      id: generateId("session"),
      userId,
      startedAt: new Date(),
      endedAt: null,
    };

    currentUserId = userId;

    logger.debug(
      "initTracking",
      `Tracking inicializado para sesión ${currentSession.id}`,
    );
  } catch (error) {
    logger.error(
      "initTracking",
      "Error al inicializar el sistema de tracking",
      error,
    );
    throw error;
  }
}

// Mantener el tracking alineado cuando cambia el userId (p. ej., tras login/migración)
if (typeof window !== "undefined") {
  try {
    window.addEventListener("progress:user-id-changed", (e) => {
      try {
        const newUserId = e?.detail?.newUserId;
        if (!newUserId || typeof newUserId !== "string") return;

        // Finalizar sesión actual (si existiera) y abrir una nueva con el nuevo userId
        if (currentSession && !currentSession.endedAt) {
          currentSession.endedAt = new Date();
        }

        currentSession = {
          id: generateId("session"),
          userId: newUserId,
          startedAt: new Date(),
          endedAt: null,
        };
        currentUserId = newUserId;

        logger.debug(
          "user-id-changed",
          "Tracking actualizado tras cambio de userId",
          {
            newUserId: currentUserId,
            sessionId: currentSession.id,
          },
        );
      } catch (innerErr) {
        logger.warn(
          "user-id-changed",
          "No se pudo actualizar tracking tras cambio de userId",
          innerErr,
        );
      }
    });
  } catch {
    /* ignore listener wiring errors */
  }
}

/**
 * Registra el inicio de un intento
 * @param {Object} item - Ítem que se va a practicar
 * @returns {string} ID del intento
 */
export function trackAttemptStarted(item) {
  if (!currentSession) {
    throw new Error("Sistema de tracking no inicializado");
  }

  const attemptId = generateId("attempt");

  logger.debug(
    "trackAttemptStarted",
    `Intento iniciado: ${attemptId} para ítem ${item.id}`,
  );
  return attemptId;
}

/**
 * Registra la finalización de un intento
 * @param {string} attemptId - ID del intento
 * @param {Object} result - Resultado del intento
 * @returns {Promise<void>}
 */
export async function trackAttemptSubmitted(attemptId, result) {
  if (!currentSession) {
    throw new Error("Sistema de tracking no inicializado");
  }

  try {
    // Usar etiquetas si vienen desde la UI; si no, clasificar
    let errorTags = dedupeErrorTags(result.errorTags);
    if (errorTags.length === 0 && !result.correct && !result.isAccentError) {
      errorTags = classifyCompositeAnswers(
        result.userAnswer,
        result.correctAnswer,
        result.item,
      );
    }
    errorTags = dedupeErrorTags(errorTags);
    // Derivar identidad canónica del ítem/celda
    const lemma =
      result.item?.lemma || result.item?.form?.lemma || "unknown_verb";
    const mood = result.item?.mood || result.item?.form?.mood;
    const tense = result.item?.tense || result.item?.form?.tense;
    const person = result.item?.person || result.item?.form?.person;
    const verbId = result.item?.verbId || lemma;
    // Asegurar que exista un ítem canónico en DB (no bloqueante si falla)
    let canonicalItemId = `item-${verbId}-${mood}-${tense}-${person}`;
    try {
      const item = await getOrCreateItem(verbId, mood, tense, person);
      canonicalItemId = item.id;
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
      createdAt: new Date(),
      syncedAt: 0,
    };

    const attemptMeta =
      result.meta && typeof result.meta === "object"
        ? { ...result.meta }
        : null;
    const rawPracticeType = result.practiceType || attemptMeta?.type || null;
    const practiceType =
      rawPracticeType === "pronunciation"
        ? "pronunciation"
        : rawPracticeType || "conjugation";

    // Ejecutar orquestador emocional y adjuntar al intento antes de guardar
    let orchestrated = null;
    try {
      orchestrated = processAttemptOrchestrated({
        correct: baseAttempt.correct,
        latencyMs: baseAttempt.latencyMs,
        hintsUsed: baseAttempt.hintsUsed,
        item: {
          mood,
          tense,
          person,
          verbId,
          lemma: result.item?.lemma || result.item?.form?.lemma,
        },
        errorTags,
      });
    } catch {
      // Failed to get orchestrated data, continue without it
      orchestrated = null;
    }

    // Crear objeto de intento (enriquecido con analíticas emocionales)
    const attempt = {
      ...baseAttempt,
      flowState: orchestrated?.flowState,
      momentumType: orchestrated?.momentumType,
      momentumScore: orchestrated?.momentumScore,
      confidenceOverall: orchestrated?.confidenceOverall,
      confidenceCategory: orchestrated?.confidenceCategory,
      practiceType,
    };

    if (attemptMeta) {
      attempt.meta = attemptMeta;
    }

    if (practiceType === "pronunciation") {
      const accuracy = toFiniteNumber(attemptMeta?.accuracy);
      const pedagogicalScore = toFiniteNumber(attemptMeta?.pedagogicalScore);
      const confidence = toFiniteNumber(attemptMeta?.confidence);
      const timingMs = toFiniteNumber(attemptMeta?.timing ?? result.latencyMs);
      const recognizedFallback = (() => {
        const flattened = flattenAnswerStructure(result.userAnswer)
          .join(" ")
          .trim();
        return flattened.length > 0 ? flattened : null;
      })();
      const targetFallback = (() => {
        if (typeof result.correctAnswer === "string") {
          return result.correctAnswer;
        }
        const flattened = flattenAnswerStructure(result.correctAnswer);
        return flattened.length > 0 ? flattened[0] : null;
      })();
      attempt.pronunciation = {
        accuracy: accuracy === null ? null : Math.round(accuracy * 100) / 100,
        pedagogicalScore:
          pedagogicalScore === null
            ? null
            : Math.round(pedagogicalScore * 100) / 100,
        confidence:
          confidence === null ? null : Math.round(confidence * 100) / 100,
        semanticType: attemptMeta?.semanticType || null,
        recognized: attemptMeta?.recognized ?? recognizedFallback,
        target: attemptMeta?.target ?? targetFallback,
        timingMs: timingMs === null ? null : Math.round(timingMs),
      };
    }

    // Guardar intento en la base de datos
    await saveAttempt(attempt);

    // Invalidar cache de mastery para el ítem actualizado
    notifyNewAttempt(canonicalItemId);

    logger.debug(
      "trackAttemptSubmitted",
      `Intento registrado: ${attemptId}`,
      attempt,
    );

    // Notificar que se actualizaron los datos de progreso
    emitProgressEvent(PROGRESS_EVENTS.DATA_UPDATED, {
      attemptId,
      mood,
      tense,
      person,
      correct: attempt.correct,
      userId: currentSession.userId,
    });

    // Actualizar SRS para la celda practicada (pasar metadatos para adaptación)
    try {
      await updateSchedule(
        currentSession.userId,
        { mood, tense, person },
        attempt.correct,
        attempt.hintsUsed,
        { latencyMs: attempt.latencyMs, errorTags },
      );
    } catch (error) {
      logger.warn("trackAttemptSubmitted", "No se pudo actualizar SRS", error);
    }

    // Integrar con sistema de niveles - actualizar competencia del usuario
    try {
      await recordGlobalCompetency(
        mood,
        tense,
        attempt.correct,
        attempt.latencyMs,
      );

      // Trigger dynamic evaluation refresh every 5-10 attempts for responsive feedback
      const shouldRefreshDynamic = Math.random() < 0.15; // 15% chance
      if (shouldRefreshDynamic) {
        // Don't await to avoid blocking - refresh in background
        refreshGlobalDynamicEvaluations().catch((error) => {
          logger.warn(
            "trackAttemptSubmitted",
            "Error refreshing dynamic evaluations",
            error,
          );
        });
      }

      // Check for automatic level progression with dynamic system
      const shouldCheckProgression = Math.random() < 0.08; // 8% chance (slightly less frequent)
      if (shouldCheckProgression) {
        const { checkGlobalLevelRecommendation } = await import(
          "../levels/userLevelProfile.js"
        );
        const recommendation = await checkGlobalLevelRecommendation();

        if (recommendation.shouldChange && recommendation.confidence > 0.85) {
          logger.debug(
            "trackAttemptSubmitted",
            `Recomendación de cambio de nivel: ${recommendation.currentLevel} → ${recommendation.recommendedLevel} (confianza: ${recommendation.confidence})`,
          );

          // Dispatch dynamic level recommendation event
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("level:recommendation", {
                detail: {
                  currentLevel: recommendation.currentLevel,
                  recommendedLevel: recommendation.recommendedLevel,
                  confidence: recommendation.confidence,
                  reason: recommendation.reason,
                  evaluation: recommendation.evaluation,
                  automatic: true,
                },
              }),
            );
          }
        }

        // Also check traditional progression for compatibility
        const progressionResult = await checkUserProgression();
        if (progressionResult.promoted) {
          logger.debug(
            "trackAttemptSubmitted",
            `Usuario promovido automáticamente de ${progressionResult.from} a ${progressionResult.to}`,
          );

          // Dispatch traditional level promotion event
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("level:promotion", {
                detail: {
                  from: progressionResult.from,
                  to: progressionResult.to,
                  confidence: progressionResult.confidence,
                  automatic: true,
                  type: "traditional",
                },
              }),
            );
          }
        }
      }
    } catch (error) {
      logger.warn(
        "trackAttemptSubmitted",
        "No se pudo actualizar sistema de niveles",
        error,
      );
    }

    // Recalcular y guardar mastery de la celda basada en intentos reales del usuario
    try {
      // Obtener intentos del usuario y filtrar por celda actual
      const allUserAttempts =
        (await getByIndex("attempts", "userId", currentSession.userId)) || [];
      const _windowMs = 90 * 24 * 60 * 60 * 1000; // 90 días de ventana para recencia
      const now = Date.now();
      let weightedCorrect = 0;
      let weightedTotal = 0;
      let _weightedN = 0;
      const errorCounts = {};
      for (const a of allUserAttempts) {
        if (
          a.mood === mood &&
          a.tense === tense &&
          a.person === person &&
          a.verbId
        ) {
          const ageDays =
            (now - new Date(a.createdAt).getTime()) / (24 * 60 * 60 * 1000);
          const recencyWeight = Math.exp(-ageDays / PROGRESS_CONFIG.DECAY_TAU);
          weightedTotal += recencyWeight;
          _weightedN += recencyWeight;
          weightedCorrect += recencyWeight * (a.correct ? 1 : 0);
          // Acumular errores con decaimiento
          if (Array.isArray(a.errorTags)) {
            for (const tag of a.errorTags) {
              errorCounts[tag] = (errorCounts[tag] || 0) + recencyWeight;
            }
          }
        }
      }
      let score = 50;
      if (weightedTotal > 0) {
        score = 100 * (weightedCorrect / weightedTotal);
      }
      // Calculate raw count
      const rawCount = allUserAttempts.filter(
        a => a.mood === mood &&
          a.tense === tense &&
          a.person === person &&
          a.verbId
      ).length;

      const masteryRecord = {
        id: `${currentSession.userId}|${mood}|${tense}|${person}`,
        userId: currentSession.userId,
        mood,
        tense,
        person,
        score: Math.round(score * 100) / 100,
        n: Math.round(_weightedN),
        count: rawCount, // Raw count of attempts
        errorCounts,
        updatedAt: new Date(),
        syncedAt: 0,
      };
      await saveMastery(masteryRecord);
    } catch (error) {
      logger.warn(
        "trackAttemptSubmitted",
        "No se pudo actualizar mastery de la celda",
        error,
      );
    }
  } catch (error) {
    logger.error(
      "trackAttemptSubmitted",
      `Error al registrar intento ${attemptId}`,
      error,
    );
    throw error;
  }
}

function dedupeErrorTags(tags) {
  if (!tags) return [];
  const normalized = Array.isArray(tags) ? tags : [tags];
  return Array.from(new Set(normalized.filter(Boolean)));
}

function toFiniteNumber(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const numeric =
    typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof numeric === "number" && Number.isFinite(numeric)) {
    return numeric;
  }

  return null;
}

function flattenAnswerStructure(answer) {
  if (Array.isArray(answer)) {
    return answer
      .filter((value) => value !== undefined && value !== null)
      .map((value) => String(value));
  }

  if (answer && typeof answer === "object") {
    return Object.values(answer)
      .filter((value) => value !== undefined && value !== null)
      .map((value) => String(value));
  }

  if (answer === undefined || answer === null) {
    return [];
  }

  return [String(answer)];
}

function classifyCompositeAnswers(userAnswer, correctAnswer, item) {
  const userValues = flattenAnswerStructure(userAnswer);
  const correctValues = flattenAnswerStructure(correctAnswer);
  const maxLength = Math.max(userValues.length, correctValues.length, 1);
  const combined = new Set();

  for (let i = 0; i < maxLength; i++) {
    const user = userValues[i] ?? userValues[userValues.length - 1] ?? "";
    const correct =
      correctValues[i] ?? correctValues[correctValues.length - 1] ?? "";
    const tags = classifyError(user, correct, item);
    if (Array.isArray(tags)) {
      tags.filter(Boolean).forEach((tag) => combined.add(tag));
    }
  }

  return Array.from(combined);
}

/**
 * Registra el final de una sesión
 * @param {Object} sessionData - Datos adicionales de la sesión
 * @returns {Promise<void>}
 */
export async function trackSessionEnded(sessionData = {}) {
  if (!currentSession) {
    throw new Error("Sistema de tracking no inicializado");
  }

  try {
    // Marcar fin de sesión
    currentSession.endedAt = new Date();

    logger.debug(
      "trackSessionEnded",
      `Sesión finalizada: ${currentSession.id}`,
      sessionData,
    );
  } catch (error) {
    logger.error("trackSessionEnded", "Error al finalizar sesión", error);
    throw error;
  }
}

/**
 * Registra que se mostró una pista
 * @param {Object} context - Contexto del hint (opcional)
 * @returns {Promise<void>}
 */
export async function trackHintShown(context = {}) {
  if (!currentSession) {
    throw new Error("Sistema de tracking no inicializado");
  }

  try {
    const hintEvent = {
      id: generateId("event-hint"),
      type: "hint_shown",
      userId: currentSession.userId,
      sessionId: currentSession.id,
      itemId: context.itemId || null,
      verbId: context.verbId || null,
      mood: context.mood || null,
      tense: context.tense || null,
      person: context.person || null,
      hintType: context.hintType || "general",
      createdAt: new Date(),
    };

    await saveEvent(hintEvent);
    logger.debug(
      "trackHintShown",
      `Pista mostrada y registrada: ${hintEvent.id}`,
    );
  } catch (error) {
    logger.error("trackHintShown", "Error al registrar pista mostrada", error);
    throw error;
  }
}

/**
 * Registra que se incrementó una racha
 * @param {Object} context - Contexto de la racha
 * @returns {Promise<void>}
 */
export async function trackStreakIncremented(context = {}) {
  if (!currentSession) {
    throw new Error("Sistema de tracking no inicializado");
  }

  try {
    const streakEvent = {
      id: generateId("event-streak"),
      type: "streak_incremented",
      userId: currentSession.userId,
      sessionId: currentSession.id,
      streakType: context.streakType || "general",
      streakLength: context.streakLength || 1,
      itemId: context.itemId || null,
      verbId: context.verbId || null,
      mood: context.mood || null,
      tense: context.tense || null,
      person: context.person || null,
      createdAt: new Date(),
    };

    await saveEvent(streakEvent);
    logger.debug(
      "trackStreakIncremented",
      `Racha incrementada y registrada: ${streakEvent.id} (longitud: ${streakEvent.streakLength})`,
    );
  } catch (error) {
    logger.error(
      "trackStreakIncremented",
      "Error al registrar incremento de racha",
      error,
    );
    throw error;
  }
}

/**
 * Registra el inicio de un drill de tiempo
 * @param {string} tense - Tiempo que se practica
 * @param {Object} context - Contexto adicional del drill
 * @returns {Promise<void>}
 */
export async function trackTenseDrillStarted(tense, context = {}) {
  if (!currentSession) {
    throw new Error("Sistema de tracking no inicializado");
  }

  try {
    const drillEvent = {
      id: generateId("event-drill-start"),
      type: "tense_drill_started",
      userId: currentSession.userId,
      sessionId: currentSession.id,
      tense: tense,
      mood: context.mood || null,
      verbType: context.verbType || null,
      targetCount: context.targetCount || null,
      difficulty: context.difficulty || null,
      createdAt: new Date(),
    };

    await saveEvent(drillEvent);
    logger.debug(
      "trackTenseDrillStarted",
      `Drill de tiempo ${tense} iniciado y registrado: ${drillEvent.id}`,
    );
  } catch (error) {
    logger.error(
      "trackTenseDrillStarted",
      "Error al registrar inicio de drill de tiempo",
      error,
    );
    throw error;
  }
}

/**
 * Registra el final de un drill de tiempo
 * @param {string} tense - Tiempo que se practicaba
 * @param {Object} results - Resultados del drill
 * @returns {Promise<void>}
 */
export async function trackTenseDrillEnded(tense, results = {}) {
  if (!currentSession) {
    throw new Error("Sistema de tracking no inicializado");
  }

  try {
    const drillEvent = {
      id: generateId("event-drill-end"),
      type: "tense_drill_ended",
      userId: currentSession.userId,
      sessionId: currentSession.id,
      tense: tense,
      mood: results.mood || null,
      totalAttempts: results.totalAttempts || 0,
      correctAttempts: results.correctAttempts || 0,
      accuracy: results.accuracy || 0,
      averageLatency: results.averageLatency || null,
      duration: results.duration || null,
      completed: results.completed || false,
      createdAt: new Date(),
    };

    await saveEvent(drillEvent);
    logger.debug(
      "trackTenseDrillEnded",
      `Drill de tiempo ${tense} finalizado y registrado: ${drillEvent.id} (${drillEvent.correctAttempts}/${drillEvent.totalAttempts})`,
    );
  } catch (error) {
    logger.error(
      "trackTenseDrillEnded",
      "Error al registrar finalización de drill de tiempo",
      error,
    );
    throw error;
  }
}

/**
 * Obtiene las estadísticas actuales del usuario
 * @returns {Promise<Object>} Estadísticas del usuario
 */
export async function getUserStats() {
  if (!currentUserId) {
    throw new Error("Sistema de tracking no inicializado");
  }

  try {
    // Obtener intentos del usuario ordenados por fecha
    const allAttempts = (await getAttemptsByUser(currentUserId)) || [];
    const sortedAttempts = allAttempts.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );

    // Calcular totales básicos
    const totalAttempts = sortedAttempts.length;
    const correctAttempts = sortedAttempts.filter((a) => a.correct).length;
    const correctPercentage =
      totalAttempts > 0
        ? Math.round((correctAttempts / totalAttempts) * 100)
        : 0;

    // Calcular última actividad
    let lastActive = null;
    if (sortedAttempts.length > 0) {
      lastActive = new Date(
        sortedAttempts[sortedAttempts.length - 1].createdAt,
      );
    }

    // Calcular rachas
    let currentStreak = 0;
    let longestStreak = 0;
    let currentStreakCount = 0;
    let maxStreakCount = 0;

    // Recorrer intentos desde el más reciente hacia atrás para racha actual
    for (let i = sortedAttempts.length - 1; i >= 0; i--) {
      if (sortedAttempts[i].correct) {
        currentStreakCount++;
      } else {
        break; // La racha actual se rompió
      }
    }
    currentStreak = currentStreakCount;

    // Recorrer todos los intentos para encontrar la racha más larga
    let tempStreak = 0;
    for (const attempt of sortedAttempts) {
      if (attempt.correct) {
        tempStreak++;
        maxStreakCount = Math.max(maxStreakCount, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    longestStreak = maxStreakCount;

    // Obtener datos de mastery para estadísticas adicionales
    const masteryData = await getMasteryByUser(currentUserId);
    const averageMastery =
      masteryData.length > 0
        ? Math.round(
          masteryData.reduce((sum, m) => sum + m.score, 0) /
          masteryData.length,
        )
        : 0;

    // Calcular días de práctica únicos
    const uniqueDays = new Set(
      sortedAttempts.map((a) => new Date(a.createdAt).toDateString()),
    ).size;

    // Estadísticas de sesiones (basadas en gaps de tiempo > 30 min)
    let sessionCount = 0;
    let lastSessionEnd = null;
    const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutos

    for (const attempt of sortedAttempts) {
      const attemptTime = new Date(attempt.createdAt);
      if (!lastSessionEnd || attemptTime - lastSessionEnd > SESSION_GAP_MS) {
        sessionCount++;
      }
      lastSessionEnd = attemptTime;
    }

    return {
      userId: currentUserId,
      totalAttempts,
      correctAttempts,
      correctPercentage,
      currentStreak,
      longestStreak,
      lastActive,
      averageMastery,
      uniquePracticeDays: uniqueDays,
      totalSessions: sessionCount,
      averageAttemptsPerSession:
        sessionCount > 0 ? Math.round(totalAttempts / sessionCount) : 0,
    };
  } catch (error) {
    logger.error(
      "getUserStats",
      "Error al obtener estadísticas del usuario",
      error,
    );
    throw error;
  }
}

// Re-export classifyError for backward compatibility
export { classifyError };
