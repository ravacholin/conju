// Sistema SRS (Spaced Repetition System) para el sistema de progreso

import { PROGRESS_CONFIG, VERB_DIFFICULTY, FREQUENCY_DIFFICULTY_BONUS } from './config.js'
import { ERROR_TAGS } from './dataModels.js'
import { saveSchedule, getScheduleByCell, getDueSchedules, getMasteryByCell } from './database.js'
import { getVerbMetadata } from './verbMetadataProvider.js'

// Helpers
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))
const randomInRange = (min, max) => min + Math.random() * (max - min)

const DAY_IN_MS = 24 * 60 * 60 * 1000

const CEFR_MODIFIERS = {
  A1: 0.85,
  A2: 0.9,
  B1: 0.95,
  B2: 1,
  C1: 1.08,
  C2: 1.12
}

const BASE_DIFFICULTY_MULTIPLIER = VERB_DIFFICULTY?.REGULAR || 1

function normalizeCEFR(value) {
  if (!value) return null
  const normalized = String(value).trim().toUpperCase()
  const match = normalized.match(/[ABC][12]/)
  return match ? match[0] : null
}

function normalizeFrequency(value) {
  if (!value) return null
  const normalized = String(value).trim().toLowerCase()
  if (normalized.startsWith('low') || normalized.startsWith('baja')) return 'low'
  if (normalized.startsWith('high') || normalized.startsWith('alta')) return 'high'
  if (normalized.startsWith('med')) return 'medium'
  if (normalized === '1' || normalized === '2') return 'low'
  if (normalized === '4' || normalized === '5') return 'high'
  return 'medium'
}

function inferDifficultyMultiplierFromVerbType(type) {
  if (!type) return BASE_DIFFICULTY_MULTIPLIER
  const normalized = String(type).toLowerCase()
  if (normalized.includes('highly') || normalized.includes('irregular')) {
    return VERB_DIFFICULTY?.HIGHLY_IRREGULAR || 1.2
  }
  if (normalized.includes('orthographic') || normalized.includes('ortográfico')) {
    return VERB_DIFFICULTY?.ORTHOGRAPHIC_CHANGE || 1.15
  }
  if (normalized.includes('stem') || normalized.includes('diphth') || normalized.includes('cambio')) {
    return VERB_DIFFICULTY?.DIPHTHONG || 1.1
  }
  return BASE_DIFFICULTY_MULTIPLIER
}

function inferDifficultyLevel(meta) {
  if (!meta) return 'medium'

  if (typeof meta.difficultyLevel === 'string') {
    const normalized = meta.difficultyLevel.toLowerCase()
    if (normalized.includes('fac')) return 'easy'
    if (normalized.includes('dif') || normalized.includes('hard')) return 'hard'
    if (normalized.includes('medium') || normalized.includes('normal')) return 'medium'
  }

  if (typeof meta.difficultyRating === 'string') {
    const normalized = meta.difficultyRating.toLowerCase()
    if (normalized.includes('hard') || normalized.includes('dif')) return 'hard'
    if (normalized.includes('easy') || normalized.includes('fac')) return 'easy'
  }

  if (typeof meta.difficultyRating === 'number') {
    const rating = meta.difficultyRating > 1 ? meta.difficultyRating / 100 : meta.difficultyRating
    if (rating >= 0.7) return 'hard'
    if (rating <= 0.35) return 'easy'
  }

  if (typeof meta.difficultyMultiplier === 'number') {
    if (meta.difficultyMultiplier >= 1.15) return 'hard'
    if (meta.difficultyMultiplier <= 0.9) return 'easy'
  }

  if (typeof meta.verbType === 'string') {
    const normalized = meta.verbType.toLowerCase()
    if (normalized.includes('irregular') || normalized.includes('cambio') || normalized.includes('stem')) {
      return 'hard'
    }
  }

  return 'medium'
}

function applyComponentFactor(components, key, factor) {
  if (!key || typeof factor !== 'number' || Number.isNaN(factor)) return
  const current = components[key] ?? 1
  components[key] = Number((current * factor).toFixed(3))
}

function computePersonalization(meta = {}, context = {}) {
  let modifier = 1
  const components = {}

  if (typeof meta.masteryScore === 'number') {
    if (meta.masteryScore >= 85) {
      const factor = 1.13
      modifier *= factor
      applyComponentFactor(components, 'mastery', factor)
    } else if (meta.masteryScore < 50) {
      const factor = 0.78
      modifier *= factor
      applyComponentFactor(components, 'mastery', factor)
    } else if (meta.masteryScore < 70) {
      const factor = 0.92
      modifier *= factor
      applyComponentFactor(components, 'mastery', factor)
    }
  }

  const frequency = normalizeFrequency(meta.lexicalFrequency)
  if (frequency === 'low') {
    const penalty = 1 - (FREQUENCY_DIFFICULTY_BONUS?.LOW ?? 0.05)
    modifier *= penalty
    applyComponentFactor(components, 'frequency', penalty)
  } else if (frequency === 'high') {
    const bonus = 1 + (FREQUENCY_DIFFICULTY_BONUS?.HIGH ?? 0.02)
    modifier *= bonus
    applyComponentFactor(components, 'frequency', bonus)
  }

  const cefr = normalizeCEFR(meta.cefrLevel)
  if (cefr && CEFR_MODIFIERS[cefr]) {
    const cefrFactor = CEFR_MODIFIERS[cefr]
    modifier *= cefrFactor
    applyComponentFactor(components, 'cefr', cefrFactor)
  }

  const difficultyLevel = inferDifficultyLevel(meta)
  if (difficultyLevel === 'hard') {
    const factor = 0.88
    modifier *= factor
    applyComponentFactor(components, 'difficulty', factor)
  } else if (difficultyLevel === 'easy') {
    const factor = 1.08
    modifier *= factor
    applyComponentFactor(components, 'difficulty', factor)
  }

  if (typeof meta.momentumScore === 'number') {
    if (meta.momentumScore >= 0.85) {
      const factor = 1.12
      modifier *= factor
      applyComponentFactor(components, 'momentum', factor)
    } else if (meta.momentumScore <= 0.35) {
      const factor = 0.88
      modifier *= factor
      applyComponentFactor(components, 'momentum', factor)
    }
  }

  if (typeof meta.confidenceCategory === 'string') {
    const normalized = meta.confidenceCategory.toLowerCase()
    if (normalized.includes('confident')) {
      const factor = 1.06
      modifier *= factor
      applyComponentFactor(components, 'confidence', factor)
    } else if (normalized.includes('hesitant') || normalized.includes('uncertain')) {
      const factor = 0.9
      modifier *= factor
      applyComponentFactor(components, 'confidence', factor)
    }
  }

  if (typeof meta.flowState === 'string') {
    const normalized = meta.flowState.toLowerCase()
    if (normalized.includes('struggle')) {
      const factor = 0.87
      modifier *= factor
      applyComponentFactor(components, 'flow', factor)
    } else if (normalized.includes('flow')) {
      const factor = 1.05
      modifier *= factor
      applyComponentFactor(components, 'flow', factor)
    }
  }

  if (typeof meta.streakLength === 'number' && meta.streakLength > 0) {
    const capped = Math.min(meta.streakLength, 6)
    const factor = 1 + capped * 0.02
    modifier *= factor
    applyComponentFactor(components, 'streak', factor)
  }

  if (Array.isArray(meta.skillTags) && meta.skillTags.length > 0) {
    const tags = meta.skillTags.map(tag => String(tag).toLowerCase())
    if (tags.some(tag => tag.includes('subjunt'))) {
      const factor = 0.93
      modifier *= factor
      applyComponentFactor(components, 'tags', factor)
    }
    if (tags.some(tag => tag.includes('imperativo'))) {
      const factor = 0.95
      modifier *= factor
      applyComponentFactor(components, 'tags', factor)
    }
  }

  const clamped = clamp(modifier, 0.55, 1.55)
  const finalModifier = context.correct === false ? Math.min(1, clamped) : clamped

  return {
    modifier: Number(finalModifier.toFixed(3)),
    components,
    rawModifier: modifier
  }
}

/**
 * Calcula el próximo intervalo basado en el desempeño
 * @param {Object} schedule - Schedule actual
 * @param {boolean} correct - Si la respuesta fue correcta
 * @param {number} hintsUsed - Número de pistas usadas
 * @returns {Object} Nuevo intervalo y fecha
 */
export function calculateNextInterval(schedule, correct, hintsUsed, meta = {}) {
  // Campos existentes + defaults razonables
  let {
    interval = 0,   // días
    ease = PROGRESS_CONFIG.SRS_ADVANCED?.EASE_START ?? 2.5,
    reps = 0,
    lapses = 0,
    leech = false
  } = schedule || {}

  const ADV = PROGRESS_CONFIG.SRS_ADVANCED || {}
  const intervals = PROGRESS_CONFIG.SRS_INTERVALS || [1, 3, 7, 14, 30, 90]

  // Derivar calificación (Q: 0-5) a partir del resultado y metadatos
  // Q=5: correcto sin pista y en tiempo normal; Q=4: correcto con pista o lento; Q=3: fallo leve (p.ej. acento)
  // Q<=2: fallo normal
  let q
  if (correct) {
    q = 5
    if (hintsUsed > 0) q -= ADV.HINT_Q_PENALTY || 1
    const slowMs = ADV.SPEED?.SLOW_MS ?? 6000
    if (typeof meta.latencyMs === 'number' && meta.latencyMs > slowMs) {
      q = Math.max(3, q - 1)
    }
  } else {
    const onlyAccent = Array.isArray(meta.errorTags) && meta.errorTags.length > 0 &&
      meta.errorTags.every(t => t === ERROR_TAGS.ACCENT)
    q = onlyAccent ? 3 : 2
  }

  // SM-2 inspired adjustment of ease
  const deltaE = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  ease = clamp(
    (ease ?? ADV.EASE_START ?? 2.5) + deltaE,
    ADV.EASE_MIN ?? 1.3,
    ADV.EASE_MAX ?? 3.2
  )

  let computedInterval = interval

  if (q < 3) {
    lapses = (lapses || 0) + 1
    reps = 0
    const rl = ADV.RELEARN_STEPS || [0.25, 1]
    computedInterval = rl[0]
    if (lapses >= (ADV.LEECH_THRESHOLD || 8)) {
      leech = true
      ease = Math.max(ADV.EASE_MIN ?? 1.3, ease - (ADV.LEECH_EASE_PENALTY || 0.4))
    }
  } else {
    if (hintsUsed > 0) {
      const currentIdx = Math.max(0, Math.min(reps - 1, intervals.length - 1))
      const currentInterval = reps > 0 ? intervals[currentIdx] : (ADV.FIRST_STEPS?.[0] || 1)
      const nextIdx = Math.min(Math.max(reps, 0), intervals.length - 1)
      const nextInterval = intervals[nextIdx]
      computedInterval = Math.max(ADV.FIRST_STEPS?.[0] || 1, Math.round((currentInterval + nextInterval) / 2))
    } else {
      if (reps === 0) {
        computedInterval = (ADV.FIRST_STEPS?.[0] || 1)
        reps = 1
      } else if (reps === 1) {
        computedInterval = (ADV.FIRST_STEPS?.[1] || 3)
        reps = 2
      } else {
        computedInterval = Math.max(1, Math.round((interval || intervals[reps - 1] || 1) * ease))
        reps += 1
      }

      if (q === 3) computedInterval = Math.max(1, Math.round(computedInterval * 0.8))
      if (q === 5) computedInterval = Math.max(1, Math.round(computedInterval * 1.1))
    }
  }

  let personalizationSnapshot = null
  let intervalAfterPersonalization = computedInterval

  if (typeof computedInterval === 'number' && Number.isFinite(computedInterval) && computedInterval > 0) {
    const personalization = computePersonalization(meta, { correct, baseInterval: computedInterval, schedule })
    const effectiveModifier = Number.isFinite(personalization.modifier) ? personalization.modifier : 1
    intervalAfterPersonalization = Math.max(0.05, computedInterval * effectiveModifier)
    const decimals = intervalAfterPersonalization >= 1 ? 1 : 2
    intervalAfterPersonalization = Number(intervalAfterPersonalization.toFixed(decimals))

    personalizationSnapshot = {
      modifier: personalization.modifier,
      components: personalization.components,
      baseInterval: computedInterval,
      intervalAfterPersonalization,
      metaSummary: {
        lexicalFrequency: normalizeFrequency(meta.lexicalFrequency),
        cefrLevel: normalizeCEFR(meta.cefrLevel),
        difficultyLevel: inferDifficultyLevel(meta),
        masteryScore: typeof meta.masteryScore === 'number' ? meta.masteryScore : null
      }
    }
  }

  let randomized = intervalAfterPersonalization
  if (!(hintsUsed > 0)) {
    const fuzzRatio = ADV.FUZZ_RATIO ?? 0.1
    const fuzz = fuzzRatio * intervalAfterPersonalization
    const randomizedRaw = randomInRange(Math.max(0, intervalAfterPersonalization - fuzz), intervalAfterPersonalization + fuzz)
    randomized = intervalAfterPersonalization >= 1
      ? Math.max(1, randomizedRaw)
      : Math.max(0.05, randomizedRaw)
  }

  const now = new Date()
  const intervalRounded = Number(randomized.toFixed(randomized >= 1 ? 1 : 2))
  const nextDue = new Date(now.getTime() + intervalRounded * DAY_IN_MS)

  if (personalizationSnapshot) {
    personalizationSnapshot.randomizedInterval = intervalRounded
    personalizationSnapshot.appliedAt = now.toISOString()
  }

  return {
    interval: intervalRounded,
    ease,
    reps,
    lapses,
    leech,
    nextDue,
    lastAnswerCorrect: !!correct,
    lastLatencyMs: meta.latencyMs,
    personalization: personalizationSnapshot
  }
}

/**
 * Actualiza el schedule para una celda específica
 * @param {string} userId - ID del usuario
 * @param {Object} cell - Celda (modo, tiempo, persona)
 * @param {boolean} correct - Si la respuesta fue correcta
 * @param {number} hintsUsed - Número de pistas usadas
 * @returns {Promise<void>}
 */
export async function updateSchedule(userId, cell, correct, hintsUsed, meta = {}) {
  // Buscar schedule existente para esta celda
  let schedule = await getScheduleByCell(userId, cell.mood, cell.tense, cell.person)
  
  // Si no existe, crear uno nuevo
  if (!schedule) {
    schedule = {
      id: `${userId}|${cell.mood}|${cell.tense}|${cell.person}`,
      userId,
      mood: cell.mood,
      tense: cell.tense,
      person: cell.person,
      interval: 0,
      ease: PROGRESS_CONFIG.SRS_ADVANCED?.EASE_START ?? 2.5,
      reps: 0,
      lapses: 0,
      leech: false,
      nextDue: new Date(),
      createdAt: new Date()
    }
  }

  const [masteryRecord, verbMetadata] = await Promise.all([
    getMasteryByCell(userId, cell.mood, cell.tense, cell.person),
    meta?.lemma ? getVerbMetadata(meta.lemma).catch(() => null) : Promise.resolve(null)
  ])

  const lexicalFrequency = normalizeFrequency(meta.lexicalFrequency ?? verbMetadata?.frequency)
  const cefrLevel = normalizeCEFR(meta.cefrLevel ?? meta.cefr ?? meta.cefrLevel)

  let difficultyMultiplier = typeof meta.difficultyMultiplier === 'number' ? meta.difficultyMultiplier : null
  if (difficultyMultiplier === null && typeof meta.difficultyRating === 'number' && !Number.isNaN(meta.difficultyRating)) {
    const rating = meta.difficultyRating > 10 ? meta.difficultyRating / 100 : meta.difficultyRating
    const normalized = clamp(rating, 0, 1)
    difficultyMultiplier = 0.8 + normalized * 0.6 // Escala suave entre 0.8 y 1.4
  }
  if (difficultyMultiplier === null && typeof meta.difficultyRating === 'string') {
    const normalized = meta.difficultyRating.toLowerCase()
    if (normalized.includes('hard') || normalized.includes('dif')) difficultyMultiplier = 1.2
    else if (normalized.includes('easy') || normalized.includes('fac')) difficultyMultiplier = 0.9
  }
  if (difficultyMultiplier === null) {
    difficultyMultiplier = inferDifficultyMultiplierFromVerbType(verbMetadata?.type)
  }

  if (typeof difficultyMultiplier === 'number' && Number.isFinite(difficultyMultiplier)) {
    difficultyMultiplier = clamp(difficultyMultiplier, 0.6, 1.6)
  }

  const personalizedMeta = {
    ...meta,
    verbType: verbMetadata?.type || meta.verbType
  }

  if (lexicalFrequency) personalizedMeta.lexicalFrequency = lexicalFrequency
  if (cefrLevel) personalizedMeta.cefrLevel = cefrLevel
  if (typeof difficultyMultiplier === 'number' && Number.isFinite(difficultyMultiplier)) {
    personalizedMeta.difficultyMultiplier = Number(difficultyMultiplier.toFixed(2))
  }
  if (typeof meta.difficultyLevel !== 'string') {
    personalizedMeta.difficultyLevel = inferDifficultyLevel({
      ...personalizedMeta,
      difficultyMultiplier
    })
  }
  if (typeof masteryRecord?.score === 'number') {
    personalizedMeta.masteryScore = masteryRecord.score
  }
  if (typeof masteryRecord?.n === 'number') {
    personalizedMeta.masterySamples = masteryRecord.n
  }

  const intervalResult = calculateNextInterval(schedule, correct, hintsUsed, personalizedMeta)

  const adaptationProfile = {
    ...(schedule?.adaptationProfile || {}),
    lexicalFrequency: lexicalFrequency ?? schedule?.adaptationProfile?.lexicalFrequency ?? null,
    difficultyLevel: personalizedMeta.difficultyLevel || schedule?.adaptationProfile?.difficultyLevel || null,
    difficultyMultiplier: typeof personalizedMeta.difficultyMultiplier === 'number'
      ? personalizedMeta.difficultyMultiplier
      : schedule?.adaptationProfile?.difficultyMultiplier ?? null,
    verbType: verbMetadata?.type || schedule?.adaptationProfile?.verbType || personalizedMeta.verbType || null,
    masteryScore: typeof masteryRecord?.score === 'number'
      ? masteryRecord.score
      : schedule?.adaptationProfile?.masteryScore ?? null,
    masterySamples: typeof masteryRecord?.n === 'number'
      ? masteryRecord.n
      : schedule?.adaptationProfile?.masterySamples ?? 0,
    cefrLevel: cefrLevel || schedule?.adaptationProfile?.cefrLevel || null,
    lastModifier: intervalResult.personalization?.modifier ?? schedule?.adaptationProfile?.lastModifier ?? 1,
    lastComponents: intervalResult.personalization?.components || schedule?.adaptationProfile?.lastComponents || {},
    updatedAt: new Date()
  }

  const updatedSchedule = {
    ...schedule,
    ...intervalResult,
    updatedAt: new Date(),
    adaptationProfile,
    lastReviewContext: {
      ...(schedule?.lastReviewContext || {}),
      practiceMode: personalizedMeta.practiceMode || schedule?.lastReviewContext?.practiceMode || null,
      recommendedBy: personalizedMeta.recommendedBy || schedule?.lastReviewContext?.recommendedBy || null,
      mixNewWithDue: personalizedMeta.mixNewWithDue ?? schedule?.lastReviewContext?.mixNewWithDue ?? false,
      sessionId: personalizedMeta.sessionId || schedule?.lastReviewContext?.sessionId || null
    }
  }

  await saveSchedule(updatedSchedule)
}

/**
 * Obtiene ítems pendientes para revisión
 * @param {string} userId - ID del usuario
 * @param {Date} currentDate - Fecha actual
 * @returns {Promise<Array>} Ítems pendientes
 */
export async function getDueItems(userId, currentDate = new Date()) {
  try {
    const schedules = await getDueSchedules(userId, currentDate)
    // Normalizar a celdas básicas y ordenar por fecha próxima
    return schedules
      .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
      .map(s => ({ mood: s.mood, tense: s.tense, person: s.person, nextDue: s.nextDue }))
  } catch (error) {
    console.error('Error obteniendo ítems SRS pendientes:', error)
    return []
  }
}

/**
 * Extrae lemmas únicos de los horarios SRS para preloading de chunks
 * @param {string} userId - ID del usuario
 * @param {Date} currentDate - Fecha actual
 * @param {number} hoursAhead - Horas hacia adelante para incluir items próximos
 * @returns {Promise<Array<string>>} Lista de lemmas únicos
 */
export async function extractDueLemmas(userId, currentDate = new Date(), hoursAhead = 24) {
  try {
    const extendedDate = new Date(currentDate.getTime() + hoursAhead * 60 * 60 * 1000)
    const schedules = await getDueSchedules(userId, extendedDate)

    // Extraer lemmas únicos de los schedules
    const lemmas = new Set()
    schedules.forEach(schedule => {
      if (schedule.lemma) {
        lemmas.add(schedule.lemma)
      }
    })

    const uniqueLemmas = Array.from(lemmas)
    console.log(`📊 SRS: Found ${uniqueLemmas.length} unique due lemmas in next ${hoursAhead}h`)
    return uniqueLemmas
  } catch (error) {
    console.error('Error extracting due lemmas from SRS:', error)
    return []
  }
}

/**
 * Determina si un ítem necesita ser revisado según el SRS
 * @param {Object} schedule - Schedule del ítem
 * @param {Date} currentDate - Fecha actual
 * @returns {boolean} Si necesita revisión
 */
export function isItemDue(schedule, currentDate = new Date()) {
  if (!schedule || !schedule.nextDue) return true
  return new Date(schedule.nextDue) <= currentDate
}

/**
 * Calcula el mastery score para un ítem específico
 * @param {Object} attempt - Intento de práctica
 * @param {Object} verb - Verbo asociado
 * @returns {number} Mastery score (0-100)
 */
export function calculateItemMastery() {
  // En una implementación completa, esto calcularía el mastery score
  // basado en el intento y las características del verbo
  
  // Por ahora, devolvemos un valor por defecto
  return 50
}

/**
 * Calcula el mastery score para una celda (modo-tiempo-persona)
 * @param {Array} attempts - Array de intentos
 * @param {Object} verbsMap - Mapa de verbos por ID
 * @returns {number} Mastery score (0-100)
 */
export function calculateCellMastery() {
  // En una implementación completa, esto calcularía el mastery score
  // para una celda basado en todos los intentos
  
  // Por ahora, devolvemos un valor por defecto
  return 50
}

/**
 * Calcula el mastery score para un tiempo o modo completo
 * @param {Array} cells - Array de celdas (cada una con sus mastery scores)
 * @param {Object} weights - Pesos para cada celda
 * @returns {number} Mastery score (0-100)
 */
export function calculateTimeOrMoodMastery() {
  // En una implementación completa, esto calcularía el mastery score
  // para un tiempo o modo completo basado en las celdas
  
  // Por ahora, devolvemos un valor por defecto
  return 50
}

/**
 * Actualiza el schedule con nueva información
 * @param {Object} schedule - Schedule actual
 * @param {Object} newItem - Nuevo ítem para programar
 * @returns {Object} Schedule actualizado
 */
export function updateScheduleWithNewItem(schedule) {
  // En una implementación completa, esto actualizaría el schedule
  // con información del nuevo ítem
  
  return {
    ...schedule,
    // En una implementación completa, aquí se añadiría la nueva información
  }
}

/**
 * Reinicia el schedule para una celda
 * @param {Object} schedule - Schedule a reiniciar
 * @returns {Object} Schedule reiniciado
 */
export function resetSchedule(schedule) {
  return {
    ...schedule,
    interval: 0,
    ease: 2.5,
    reps: 0,
    nextDue: new Date()
  }
}

/**
 * Acelera el schedule para un ítem fácil
 * @param {Object} schedule - Schedule actual
 * @returns {Object} Schedule acelerado
 */
export function accelerateSchedule(schedule) {
  // En una implementación completa, esto aceleraría el schedule
  // para ítems que el usuario domina fácilmente
  
  return {
    ...schedule,
    // En una implementación completa, aquí se aplicarían los cambios
  }
}

/**
 * Retrasa el schedule para un ítem difícil
 * @param {Object} schedule - Schedule actual
 * @returns {Object} Schedule retrasado
 */
export function delaySchedule(schedule) {
  // En una implementación completa, esto retrasaría el schedule
  // para ítems que el usuario encuentra difíciles
  
  return {
    ...schedule,
    // En una implementación completa, aquí se aplicarían los cambios
  }
}
