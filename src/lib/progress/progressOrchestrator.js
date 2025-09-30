// Orquestador de métricas emocionales y de sesión
// Une FlowStateDetector, MomentumTracker, ConfidenceEngine y TemporalIntelligence

import { FlowStateDetector } from './flowStateDetection.js'
import { MomentumTracker } from './momentumTracker.js'
import confidenceEngine from './confidenceEngine.js'
import temporalIntelligence from './temporalIntelligence.js'
import { sessionManager } from './sessionManager.js'

// Instancias únicas por sesión de app
const flowDetector = new FlowStateDetector()
const momentum = new MomentumTracker()

// Estado compartido mínimo para UI
let lastState = {
  flowState: 'neutral',
  momentumType: 'steady_progress',
  momentumScore: 0.5,
  confidenceOverall: 0.5,
  confidenceCategory: 0.5,
  metrics: {
    currentStreak: { correct: 0 },
    flowPercentage: 0,
    consistencyScore: 0,
    totalResponses: 0,
    sessionDuration: 0,
    deepFlowSessions: 0
  }
}

function dispatchUpdate() {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const ev = new CustomEvent('progress-emo-update', { detail: { ...lastState } })
      window.dispatchEvent(ev)
    }
  } catch {
    /* ignore */
  }
}

/**
 * Procesa un intento y actualiza todos los motores.
 * @param {Object} attemptCtx - Datos del intento
 * @param {boolean} attemptCtx.correct
 * @param {number} attemptCtx.latencyMs
 * @param {number} attemptCtx.hintsUsed
 * @param {Object} attemptCtx.item - { mood, tense, person, verbId, lemma }
 * @param {string[]} [attemptCtx.errorTags]
 * @returns {Object} resumen con estados para persistencia/UI
 */
export function processAttempt(attemptCtx) {
  const response = {
    correct: !!attemptCtx.correct,
    responseTime: Math.max(0, attemptCtx.latencyMs || 0),
    hintsUsed: attemptCtx.hintsUsed || 0,
    item: attemptCtx.item || null,
    verb: attemptCtx.item?.lemma || attemptCtx.item?.verbId || 'unknown',
    mood: attemptCtx.item?.mood,
    tense: attemptCtx.item?.tense,
    person: attemptCtx.item?.person,
    errorTags: attemptCtx.errorTags || []
  }

  // 1) Flow
  const flowRes = flowDetector.processResponse(response)

  // 2) Momentum (usa flowState para enriquecer estado emocional)
  const momRes = momentum.processResponse(response, flowRes.currentState)

  // 3) Confianza
  const confRes = confidenceEngine.processResponse({
    isCorrect: response.correct,
    responseTime: response.responseTime,
    verb: response.verb,
    mood: response.mood,
    tense: response.tense,
    person: response.person,
    hintsUsed: response.hintsUsed,
    previousAttempts: 0,
    sessionContext: {}
  })

  // 3.5) Session tracking (if active)
  if (sessionManager.hasActiveSession()) {
    sessionManager.recordItemResult({
      isCorrect: response.correct,
      latencyMs: response.responseTime,
      hintsUsed: response.hintsUsed
    })
  }

  // 4) Temporal: actualizar carga y patrones a nivel de sesión (ligero)
  try {
    temporalIntelligence.processSession({
      startTime: Date.now() - Math.max(1000, response.responseTime),
      endTime: Date.now(),
      responses: [{ isCorrect: response.correct }],
      averageAccuracy: response.correct ? 1 : 0,
      averageResponseTime: response.responseTime,
      totalCorrect: response.correct ? 1 : 0,
      totalIncorrect: response.correct ? 0 : 1,
      fatigueLevel: 0.5,
      interruptions: 0,
      sessionType: 'mixed'
    })
  } catch {
    /* ignore */
  }

  // Actualizar estado compartido para UI
  lastState = {
    flowState: flowRes.currentState,
    momentumType: momRes.currentMomentum,
    momentumScore: momRes.momentumScore,
    confidenceOverall: confRes.confidence?.overall ?? 0.5,
    confidenceCategory: confRes.confidence?.category ?? 0.5,
    metrics: {
      currentStreak: { correct: momRes.streaks?.confidence || 0 },
      flowPercentage: Math.round(((flowRes.flowMetrics?.totalFlowTime || 0) / Math.max(1, Date.now() - (flowDetector.sessionStartTime || Date.now()))) * 100),
      consistencyScore: Math.round((momRes.trends ? Math.max(0, Math.min(1, 1 - Math.abs(momRes.trends.shortTerm || 0))) : 0.5) * 100),
      totalResponses: (confidenceEngine?.responsePatterns?.length || 0),
      sessionDuration: Date.now() - (momentum.sessionStartTime || Date.now()),
      deepFlowSessions: flowRes.flowMetrics?.deepFlowSessions || 0
    }
  }

  dispatchUpdate()

  return {
    flowState: lastState.flowState,
    momentumType: lastState.momentumType,
    momentumScore: lastState.momentumScore,
    confidenceOverall: lastState.confidenceOverall,
    confidenceCategory: lastState.confidenceCategory
  }
}

export function getOrchestratorState() {
  return { ...lastState }
}

export function resetOrchestrator() {
  try { flowDetector.reset() } catch {
    // Ignore reset errors
  }
  try { momentum.reset() } catch {
    // Ignore reset errors
  }
  try { confidenceEngine.reset && confidenceEngine.reset() } catch {
    // Ignore reset errors
  }
}

/**
 * Obtiene el estado completo incluyendo sesión personalizada
 * @returns {Object} Estado completo del orquestador con datos de sesión
 */
export function getCompleteState() {
  const orchestratorState = getOrchestratorState()
  const sessionProgress = sessionManager.hasActiveSession() ? sessionManager.getSessionProgress() : null

  return {
    ...orchestratorState,
    session: sessionProgress
  }
}

/**
 * Inicia una nueva sesión personalizada
 * @param {Object} sessionData - Datos de la sesión del AdaptivePracticeEngine
 * @returns {boolean} Éxito de inicialización
 */
export function startPersonalizedSession(sessionData) {
  return sessionManager.startSession(sessionData)
}

/**
 * Finaliza la sesión actual
 * @returns {Object|null} Métricas finales de la sesión
 */
export function endPersonalizedSession() {
  return sessionManager.endSession()
}

export default {
  processAttempt,
  getOrchestratorState,
  getCompleteState,
  resetOrchestrator,
  startPersonalizedSession,
  endPersonalizedSession
}

