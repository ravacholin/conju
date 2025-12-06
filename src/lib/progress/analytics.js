// Análisis de progreso para el sistema de progreso

import { getAttemptsByUser, getAllFromDB, getMasteryByUser, batchSaveToDB } from './database.js'
import { PROGRESS_CONFIG } from './config.js'
// Mastery and goals utilities are imported where needed or re-exported below
import { getRealUserStats, getRealCompetencyRadarData, getIntelligentRecommendations } from './realTimeAnalytics.js'
import { ERROR_TAGS } from './dataModels.js'
import { createLogger } from '../utils/logger.js'
import { getMasterySnapshotForUser } from './mastery.js'

const logger = createLogger('progress:analytics')

const normalizeMoodTense = (mood, tense) => {
  if (mood === 'imperative' && tense === 'imper') {
    return { mood, tense: 'impAff' }
  }

  return { mood, tense }
}

const ensureNotCancelled = (signal) => {
  if (signal?.aborted) {
    throw new Error('Operation was cancelled')
  }
}

const getFirstFinite = (values) => {
  if (!Array.isArray(values)) return null
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue
    const numeric = typeof value === 'string' ? Number(value) : value
    if (typeof numeric === 'number' && Number.isFinite(numeric)) {
      return numeric
    }
  }
  return null
}

/**
 * Obtiene datos para el mapa de calor
 * @param {string} userId - ID del usuario
 * @param {string|null} person - Filtro de persona (opcional)
 * @param {string} timeRange - Rango de tiempo: 'last_7_days', 'last_30_days', 'last_90_days', o 'all_time' (default: 'all_time')
 * @returns {Promise<Array>} Datos para el mapa de calor
 */
export async function getHeatMapData(userId, person = null, timeRange = 'all_time', signal) {
  try {
    ensureNotCancelled(signal)
    // Calcular fecha de corte basada en el rango de tiempo
    const now = Date.now()
    let cutoffDate = 0

    switch (timeRange) {
      case 'last_7_days':
        cutoffDate = now - (7 * 24 * 60 * 60 * 1000)
        break
      case 'last_30_days':
        cutoffDate = now - (30 * 24 * 60 * 60 * 1000)
        break
      case 'last_90_days':
        cutoffDate = now - (90 * 24 * 60 * 60 * 1000)
        break
      case 'all_time':
      default:
        cutoffDate = 0
        break
    }

    // Estrategia Robustez: 
    // 1. Intentar obtener mastery de DB.
    // 2. Si está vacío (usuario antiguo sin migración), calcular desde attempts.
    // 3. Si range es 'all_time', usar la versión optimizada o el fallback.

    let masteryRecords = await getMasteryByUser(userId)

    // Check for empty or legacy (missing 'count') records
    const isMasteryEmpty = !masteryRecords || masteryRecords.length === 0
    let hasLegacyRecords = false

    if (timeRange === 'all_time' && !isMasteryEmpty) {
      // Si tenemos registros pero les falta 'count' (son legacy/decayed), 
      // los tratamos como "vacíos" para forzar el recálculo real.
      hasLegacyRecords = masteryRecords.some(r => r.count === undefined)
    }

    let attempts = []

    if (timeRange === 'all_time') {
      if (isMasteryEmpty || hasLegacyRecords) {
        // FALLBACK: No hay mastery válida (o es legacy), debemos calcularla.
        // Usamos new Date(0) para forzar el uso del índice temporal en IDB si existe, que puede ser más rápido
        logger.info('getHeatMapData', 'Mastery empty, falling back to calculation from attempts')
        attempts = await getAttemptsByUser(userId, { startDate: new Date(0) })

        if (attempts.length > 0) {
          masteryRecords = await getMasterySnapshotForUser(userId, { attempts })
          // Backfill asíncrono para que la próxima vez sea rápido
          batchSaveToDB('mastery', masteryRecords).catch(e =>
            logger.warn('getHeatMapData', 'Failed to backfill mastery', e)
          )
        }
      }
      // Si mastery existe, no necesitamos fetch attempts para all_time (usamos mastery.count)
    } else {
      // Para otros rangos, siempre necesitamos attempts filtrados 
      attempts = await getAttemptsByUser(userId, { startDate: cutoffDate > 0 ? cutoffDate : null })

      if (isMasteryEmpty) {
        // Intentamos recuperar mastery base con los attempts que tenemos (better than nothing)
        const partialSnapshot = await getMasterySnapshotForUser(userId, { attempts })
        masteryRecords = partialSnapshot
      }
    }

    ensureNotCancelled(signal)

    // Filtrar intentos por rango de tiempo (redundante si la DB ya filtró, pero seguro)
    const filteredAttempts = attempts.filter(a => {
      const timestamp = new Date(a?.createdAt || a?.timestamp || 0).getTime()
      return timestamp >= cutoffDate
    })

    const isAllTimeRange = timeRange === 'all_time'

    // Agrupar por modo y tiempo
    const groupedData = {}

    const ensureGroup = (mood, tense) => {
      const groupKey = `${mood}|${tense}`
      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          mood,
          tense,
          weightedSum: 0,
          weight: 0,
          count: 0,
          lastAttempt: 0
        }
      }
      return groupedData[groupKey]
    }

    // Precompute attempt counts and last attempt per mood|tense|person
    const attemptCounts = new Map()
    const attemptLatest = new Map()
    filteredAttempts.forEach(a => {
      if (!a || !a.mood || !a.tense) return
      if (person && a.person && a.person !== person) return
      const timestamp = new Date(a?.createdAt || a?.timestamp || 0).getTime()
      if (!Number.isFinite(timestamp) || timestamp <= 0) return
      const { mood, tense } = normalizeMoodTense(a.mood, a.tense)
      const key = `${mood}|${tense}|${a.person || ''}`
      attemptCounts.set(key, (attemptCounts.get(key) || 0) + 1)
      const latest = attemptLatest.get(key) || 0
      if (timestamp > latest) {
        attemptLatest.set(key, timestamp)
      }
      ensureGroup(mood, tense)
    })

    for (const record of masteryRecords) {
      if (person && record.person && record.person !== person) continue
      ensureNotCancelled(signal)
      const { mood, tense } = normalizeMoodTense(record.mood, record.tense)
      const group = ensureGroup(mood, tense)
      // Determine weight for this person cell: attempts in window (fallback to 1)
      const wKey = `${mood}|${tense}|${record.person || ''}`
      const w = attemptCounts.get(wKey) || 0
      if (w > 0) {
        group.weightedSum += record.score * w
        group.weight += w
      } else if (isAllTimeRange) {
        // For all-time range, use recorded counts from DB (count if available, else n)
        // If count/n is missing, fallback to 1 to show presence
        const recordCount = record.count !== undefined ? record.count : (record.n || 0)
        const weight = recordCount > 0 ? recordCount : 1

        group.weightedSum += record.score * weight
        group.weight += weight

        // Ensure accurate counts and dates for all-time view
        group.count += recordCount
        if (record.updatedAt || record.lastAttempt) {
          const ts = new Date(record.lastAttempt || record.updatedAt).getTime()
          if (Number.isFinite(ts) && ts > group.lastAttempt) {
            group.lastAttempt = ts
          }
        }
      }
    }

    // Incorporate attempt aggregates (counts and lastAttempt) per mood|tense
    for (const [key, count] of attemptCounts.entries()) {
      const [mood, tense] = key.split('|')
      const group = ensureGroup(mood, tense)
      group.count += count
    }

    for (const [key, timestamp] of attemptLatest.entries()) {
      const [mood, tense] = key.split('|')
      const group = ensureGroup(mood, tense)
      group.lastAttempt = Math.max(group.lastAttempt, timestamp || 0)
    }

    // Calcular promedios
    const heatMapData = Object.values(groupedData)
      .filter(group => isAllTimeRange || group.count > 0)
      .map(group => {
        const score = group.weight > 0
          ? (group.weightedSum / group.weight)
          : 0
        return {
          mood: group.mood,
          tense: group.tense,
          score,
          count: group.count, // total attempts across persons (0 if no attempt yet)
          colorClass: getMasteryColorClass(score),
          lastAttempt: group.lastAttempt || null
        }
      })

    ensureNotCancelled(signal)

    return heatMapData
  } catch (error) {
    logger.error('getHeatMapData', 'Error al obtener datos para el mapa de calor', error)
    return []
  }
}

/**
 * Determina el color para un valor de mastery
 * @param {number} score - Valor de mastery
 * @returns {string} Clase CSS para el color
 */
function getMasteryColorClass(score) {
  if (score >= 80) return 'mastery-high'
  if (score >= 60) return 'mastery-medium'
  return 'mastery-low'
}

/**
 * Obtiene datos para el radar de competencias
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Datos para el radar de competencias
 */
// Use real-time analytics for competency radar data
export const getCompetencyRadarData = getRealCompetencyRadarData

/**
 * Obtiene datos para un radar de errores (top temas por frecuencia reciente)
 * @param {string} userId
 * @returns {Promise<{ axes: Array<{key:string,label:string,value:number,tag:string,count:number}> }>} 
 */
export async function getErrorRadarData(userId) {
  try {
    const [attempts, mastery] = await Promise.all([
      getAttemptsByUser(userId),
      getMasterySnapshotForUser(userId)
    ])

    const recent = attempts.slice(-400)
    // Contar errores por tag (solo intentos incorrectos con tags)
    const counts = new Map()
    let _totalIncorrect = 0
    for (const a of recent) {
      if (!a.correct && Array.isArray(a.errorTags) && a.errorTags.length > 0) {
        _totalIncorrect += 1
        for (const t of a.errorTags) {
          counts.set(t, (counts.get(t) || 0) + 1)
        }
      }
    }
    // Complementar con agregados guardados en mastery.errorCounts (ponderación suave)
    for (const m of mastery) {
      if (m?.errorCounts && typeof m.errorCounts === 'object') {
        for (const [tag, n] of Object.entries(m.errorCounts)) {
          counts.set(tag, (counts.get(tag) || 0) + 0.5 * Number(n || 0))
        }
      }
    }

    // Mapear etiquetas a nombres amigables y agrupar ortografía
    const ORTHO = new Set([ERROR_TAGS.ORTHOGRAPHY_G_GU, ERROR_TAGS.ORTHOGRAPHY_C_QU, ERROR_TAGS.ORTHOGRAPHY_Z_C])
    const labelOf = (tag) => {
      switch (tag) {
        case ERROR_TAGS.ACCENT: return 'Acentuación'
        case ERROR_TAGS.VERBAL_ENDING: return 'Terminaciones'
        case ERROR_TAGS.IRREGULAR_STEM: return 'Raíz irregular'
        case ERROR_TAGS.WRONG_PERSON: return 'Persona'
        case ERROR_TAGS.WRONG_TENSE: return 'Tiempo'
        case ERROR_TAGS.WRONG_MOOD: return 'Modo'
        case ERROR_TAGS.CLITIC_PRONOUNS: return 'Clíticos'
        case ERROR_TAGS.OTHER_VALID_FORM: return 'Otra forma válida'
        default: return 'Ortografía'
      }
    }

    // Reducir counts agrupando ortografía
    const reduced = new Map()
    for (const [tag, n] of counts.entries()) {
      const key = ORTHO.has(tag) ? 'orthography' : tag
      reduced.set(key, (reduced.get(key) || 0) + n)
    }

    // Elegir top 5
    const top = Array.from(reduced.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const maxCount = top.length > 0 ? top[0][1] : 0
    const axes = top.map(([key, count]) => {
      const tag = key === 'orthography' ? 'orthography' : key
      const label = key === 'orthography' ? 'Ortografía' : labelOf(key)
      const value = maxCount > 0 ? (count / maxCount) * 100 : 0
      return { key: String(key), label, value, tag, count }
    })

    return { axes }
  } catch (error) {
    logger.warn('getErrorRadarData', 'Error radar unavailable', error)
    return { axes: [] }
  }
}

export async function getPronunciationStats(userId, signal) {
  try {
    ensureNotCancelled(signal)
    const attempts = await getAttemptsByUser(userId)
    ensureNotCancelled(signal)

    const pronunciationAttempts = attempts.filter(attempt => {
      if (!attempt) return false
      if (attempt.practiceType === 'pronunciation') return true
      if (attempt.meta && typeof attempt.meta === 'object' && attempt.meta.type === 'pronunciation') return true
      return Boolean(attempt.pronunciation && typeof attempt.pronunciation === 'object')
    })

    if (pronunciationAttempts.length === 0) {
      return {
        totalAttempts: 0,
        successRate: 0,
        averageAccuracy: 0,
        averagePedagogicalScore: 0,
        averageConfidence: 0,
        recentAttempts: []
      }
    }

    let accuracySum = 0
    let accuracyCount = 0
    let pedagogicalSum = 0
    let pedagogicalCount = 0
    let confidenceSum = 0
    let confidenceCount = 0
    let correctCount = 0

    const attemptsWithMetadata = pronunciationAttempts.map(attempt => {
      const stats = attempt.pronunciation || {}
      const meta = attempt.meta && typeof attempt.meta === 'object' ? attempt.meta : {}
      const accuracy = getFirstFinite([stats.accuracy, meta.accuracy])
      const pedagogical = getFirstFinite([stats.pedagogicalScore, meta.pedagogicalScore])
      const confidence = getFirstFinite([stats.confidence, meta.confidence])

      if (accuracy !== null) {
        accuracySum += accuracy
        accuracyCount += 1
      }
      if (pedagogical !== null) {
        pedagogicalSum += pedagogical
        pedagogicalCount += 1
      }
      if (confidence !== null) {
        confidenceSum += confidence
        confidenceCount += 1
      }
      if (attempt.correct) {
        correctCount += 1
      }

      const timestamp = new Date(attempt.createdAt || attempt.timestamp || Date.now())
      const timingValue = typeof stats.timingMs === 'number' ? stats.timingMs : getFirstFinite([meta.timing, attempt.latencyMs])

      return {
        id: attempt.id,
        correct: Boolean(attempt.correct),
        accuracy,
        pedagogicalScore: pedagogical,
        confidence,
        semanticType: stats.semanticType || meta.semanticType || null,
        recognized: stats.recognized || meta.recognized || attempt.userAnswer || null,
        target: stats.target || meta.target || attempt.correctAnswer || null,
        createdAt: timestamp.toISOString(),
        createdAtMs: timestamp.getTime(),
        timingMs: Number.isFinite(timingValue) ? timingValue : null
      }
    })

    const recentAttempts = attemptsWithMetadata
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
      .slice(0, 8)
      .map(({ createdAtMs, ...rest }) => rest)

    const toAverage = (sum, count) => (count > 0 ? Math.round((sum / count) * 10) / 10 : 0)
    const successRate = Math.round((correctCount / pronunciationAttempts.length) * 100)

    return {
      totalAttempts: pronunciationAttempts.length,
      successRate: Number.isFinite(successRate) ? successRate : 0,
      averageAccuracy: toAverage(accuracySum, accuracyCount),
      averagePedagogicalScore: toAverage(pedagogicalSum, pedagogicalCount),
      averageConfidence: toAverage(confidenceSum, confidenceCount),
      recentAttempts
    }
  } catch (error) {
    logger.error('getPronunciationStats', 'Error al obtener estadísticas de pronunciación', error)
    if (signal?.aborted) {
      throw new Error('Operation was cancelled')
    }

    return {
      totalAttempts: 0,
      successRate: 0,
      averageAccuracy: 0,
      averagePedagogicalScore: 0,
      averageConfidence: 0,
      recentAttempts: []
    }
  }
}

/**
 * Genera dataset de Inteligencia de Errores (tags, heatmap, leeches)
 */
export async function getErrorIntelligence(userId, signal) {
  try {
    ensureNotCancelled(signal)
    const [attempts, mastery] = await Promise.all([
      getAttemptsByUser(userId),
      getMasterySnapshotForUser(userId)
    ])
    ensureNotCancelled(signal)
    const DECAY_TAU = 10
    const now = Date.now()
    const byDay = new Map()
    const days = []
    for (let i = 20; i >= 0; i--) {
      const k = new Date(now - i * 86400000).toDateString()
      days.push(k)
      byDay.set(k, { tagCounts: new Map(), totalIncorrect: 0, total: 0 })
    }
    const tagTotals = new Map()
    const tagRawCounts = new Map()
    const comboCountsByTag = new Map()

    for (const a of attempts) {
      const k = new Date(a.createdAt || 0).toDateString()
      if (!byDay.has(k)) continue
      const day = byDay.get(k)
      day.total += 1
      if (!a.correct && Array.isArray(a.errorTags)) {
        const ageDays = (now - new Date(a.createdAt).getTime()) / 86400000
        const w = Math.exp(-ageDays / DECAY_TAU)
        day.totalIncorrect += 1
        for (const t of a.errorTags) {
          day.tagCounts.set(t, (day.tagCounts.get(t) || 0) + 1)
          tagTotals.set(t, (tagTotals.get(t) || 0) + w)
          tagRawCounts.set(t, (tagRawCounts.get(t) || 0) + 1)
          if (!comboCountsByTag.has(t)) comboCountsByTag.set(t, new Map())
          const key = `${a.mood}|${a.tense}`
          const m = comboCountsByTag.get(t)
          m.set(key, (m.get(key) || 0) + 1)
        }
      }
    }
    for (const m of mastery) {
      if (m?.errorCounts && typeof m.errorCounts === 'object') {
        for (const [tag, n] of Object.entries(m.errorCounts)) {
          tagTotals.set(tag, (tagTotals.get(tag) || 0) + 0.5 * Number(n || 0))
          tagRawCounts.set(tag, (tagRawCounts.get(tag) || 0) + Number(n || 0))
        }
      }
    }
    const severityOf = (tag) => {
      switch (tag) {
        case ERROR_TAGS.WRONG_MOOD:
        case ERROR_TAGS.WRONG_TENSE: return 2.0
        case ERROR_TAGS.IRREGULAR_STEM: return 1.8
        case ERROR_TAGS.VERBAL_ENDING: return 1.5
        case ERROR_TAGS.CLITIC_PRONOUNS: return 1.4
        case ERROR_TAGS.OTHER_VALID_FORM: return 1.2
        case ERROR_TAGS.ACCENT:
        case ERROR_TAGS.ORTHOGRAPHY_C_QU:
        case ERROR_TAGS.ORTHOGRAPHY_G_GU:
        case ERROR_TAGS.ORTHOGRAPHY_Z_C: return 1.1
        case ERROR_TAGS.WRONG_PERSON:
        default: return 1.6
      }
    }
    const labelOf = (tag) => {
      switch (tag) {
        case ERROR_TAGS.ACCENT: return 'Acentuación'
        case ERROR_TAGS.VERBAL_ENDING: return 'Terminaciones'
        case ERROR_TAGS.IRREGULAR_STEM: return 'Raíz irregular'
        case ERROR_TAGS.WRONG_PERSON: return 'Persona'
        case ERROR_TAGS.WRONG_TENSE: return 'Tiempo'
        case ERROR_TAGS.WRONG_MOOD: return 'Modo'
        case ERROR_TAGS.CLITIC_PRONOUNS: return 'Clíticos'
        case ERROR_TAGS.OTHER_VALID_FORM: return 'Otra forma válida'
        case ERROR_TAGS.ORTHOGRAPHY_C_QU:
        case ERROR_TAGS.ORTHOGRAPHY_G_GU:
        case ERROR_TAGS.ORTHOGRAPHY_Z_C: return 'Ortografía'
        default: return String(tag)
      }
    }
    const last14 = days.slice(-14)
    const last7 = days.slice(-7)
    const prev7 = days.slice(-14, -7)
    const sparkByTag = new Map()
    const trendByTag = new Map()
    for (const d of last14) {
      const day = byDay.get(d)
      if (!day) continue
      for (const [tag, c] of day.tagCounts.entries()) {
        if (!sparkByTag.has(tag)) sparkByTag.set(tag, Array(last14.length).fill(0))
        const arr = sparkByTag.get(tag)
        const idx = last14.indexOf(d)
        arr[idx] = c
      }
    }
    for (const [tag] of tagTotals.entries()) {
      const sum = (range) => range.reduce((s, k) => s + (byDay.get(k)?.tagCounts.get(tag) || 0), 0)
      const cur = sum(last7)
      const prev = sum(prev7)
      const trend = cur > prev ? 'up' : cur < prev ? 'down' : 'flat'
      trendByTag.set(tag, { cur, prev, trend })
    }
    const topCombosFor = (tag) => {
      const map = comboCountsByTag.get(tag)
      if (!map) return []
      return Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([k, n]) => { const [mood, tense] = k.split('|'); return { mood, tense, count: n } })
    }
    const tags = Array.from(tagTotals.entries())
      .map(([tag, w]) => ({
        tag,
        label: labelOf(tag),
        weighted: w,
        count: tagRawCounts.get(tag) || 0,
        severity: severityOf(tag),
        impact: (w || 0) * severityOf(tag),
        sparkline: sparkByTag.get(tag) || [],
        trend: trendByTag.get(tag)?.trend || 'flat',
        topCombos: topCombosFor(tag)
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 6)
    const maxImpact = tags.length ? Math.max(...tags.map(a => a.impact)) : 1
    tags.forEach(a => { a.value = maxImpact ? (a.impact / maxImpact) * 100 : 0 })

    // Heatmap error rate por Modo x Tiempo
    const moods = ['indicative', 'subjunctive', 'imperative', 'conditional', 'nonfinite']
    const tenses = ['pres', 'pretIndef', 'impf', 'fut', 'pretPerf', 'plusc', 'futPerf', 'subjPres', 'subjImpf', 'subjPerf', 'subjPlusc', 'impAff', 'impNeg', 'cond', 'condPerf', 'ger', 'part']
    const counter = new Map()
    for (const a of attempts) {
      const key = `${a.mood}|${a.tense}`
      if (!counter.has(key)) counter.set(key, { incorrect: 0, total: 0 })
      const obj = counter.get(key)
      obj.total += 1
      if (!a.correct) obj.incorrect += 1
    }
    const cells = []
    for (const mood of moods) {
      for (const tense of tenses) {
        const key = `${mood}|${tense}`
        const obj = counter.get(key) || { incorrect: 0, total: 0 }
        const errorRate = obj.total > 0 ? obj.incorrect / obj.total : 0
        if (obj.total > 0) cells.push({ mood, tense, errorRate, attempts: obj.total })
      }
    }

    // Leeches
    let leeches = []
    try {
      const schedules = await getAllFromDB('schedules')
      leeches = (schedules || [])
        .filter(s => s.userId === userId && s.leech)
        .sort((a, b) => (b.lapses || 0) - (a.lapses || 0))
        .slice(0, 6)
        .map(s => ({ mood: s.mood, tense: s.tense, person: s.person, nextDue: s.nextDue, lapses: s.lapses || 0, ease: s.ease, interval: s.interval }))
    } catch {
      // Silent fail for leeches calculation
    }

    // Resumen 7d vs 7d previos
    const last7Days = days.slice(-7)
    const prev7Days = days.slice(-14, -7)
    const sumObj = (range) => range.reduce((acc, d) => {
      const day = byDay.get(d)
      if (!day) return acc
      acc.incorrect += day.totalIncorrect || 0
      acc.total += day.total || 0
      return acc
    }, { incorrect: 0, total: 0 })
    const cur = sumObj(last7Days)
    const prev = sumObj(prev7Days)
    const errorRate7 = cur.total > 0 ? cur.incorrect / cur.total : 0
    const errorRatePrev7 = prev.total > 0 ? prev.incorrect / prev.total : 0
    const trend = errorRate7 > errorRatePrev7 ? 'up' : errorRate7 < errorRatePrev7 ? 'down' : 'flat'

    const summary = {
      errorRate7,
      errorRatePrev7,
      incorrect7: cur.incorrect,
      total7: cur.total,
      trend
    }

    ensureNotCancelled(signal)

    return { tags, heatmap: { moods, tenses, cells }, leeches, summary }
  } catch (error) {
    logger.warn('getErrorIntelligence', 'Error intelligence unavailable', error)
    return { tags: [], heatmap: { moods: [], tenses: [], cells: [] }, leeches: [], summary: { errorRate7: 0, errorRatePrev7: 0, incorrect7: 0, total7: 0, trend: 'flat' } }
  }
}

/**
 * Obtiene datos para la línea de progreso temporal
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Datos para la línea de progreso
 */
export async function getProgressLineData(userId) {
  try {
    // Obtener todos los mastery records del usuario
    const masteryRecords = await getMasterySnapshotForUser(userId)

    if (masteryRecords.length === 0) {
      return []
    }

    // Agrupar por fecha
    const dataByDate = {}

    masteryRecords.forEach(record => {
      // Asumir que hay un campo updatedAt o timestamp
      const dateKey = record.updatedAt
        ? new Date(record.updatedAt).toDateString()
        : new Date().toDateString()

      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = {
          date: new Date(dateKey),
          scores: []
        }
      }

      dataByDate[dateKey].scores.push(record.score)
    })

    // Calcular promedios por día y ordenar
    const progressData = Object.values(dataByDate)
      .map(dayData => ({
        date: dayData.date,
        score: Math.round(dayData.scores.reduce((sum, score) => sum + score, 0) / dayData.scores.length)
      }))
      .sort((a, b) => a.date - b.date)

    // Si hay pocos datos, llenar con datos de los últimos 30 días
    if (progressData.length < 7) {
      const today = new Date()
      const avgScore = progressData.length > 0
        ? progressData.reduce((sum, item) => sum + item.score, 0) / progressData.length
        : 50

      const filledData = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)

        // Buscar si hay dato real para esta fecha
        const realData = progressData.find(item =>
          item.date.toDateString() === date.toDateString()
        )

        filledData.push(realData || {
          date,
          score: Math.round(avgScore + (Math.random() - 0.5) * 10) // Ligera variación
        })
      }

      return filledData
    }

    return progressData
  } catch (error) {
    logger.error('getProgressLineData', 'Error al obtener datos para la línea de progreso', error)
    return []
  }
}

/**
 * Obtiene estadísticas generales del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Estadísticas generales
 */
// Use real-time analytics for user statistics
export const getUserStats = getRealUserStats

/**
 * Calcula métricas recientes (últimas 24h) para desafíos diarios
 * @param {string} userId
 * @returns {Promise<{ attemptsToday: number, correctToday: number, accuracyToday: number, bestStreakToday: number, focusMinutesToday: number }>}
 */
export async function getDailyChallengeMetrics(userId, signal) {
  try {
    ensureNotCancelled(signal)
    const attempts = await getAttemptsByUser(userId)
    const startOfDay = new Date().setHours(0, 0, 0, 0)

    let attemptsToday = 0
    let correctToday = 0
    let latencyTotal = 0
    let bestStreakToday = 0
    let streak = 0

    const todaysAttempts = attempts
      .filter(a => {
        const created = new Date(a?.createdAt || 0).getTime()
        return Number.isFinite(created) && created >= startOfDay
      })
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))

    for (const attempt of todaysAttempts) {
      attemptsToday += 1
      if (attempt.correct) {
        correctToday += 1
        streak += 1
        bestStreakToday = Math.max(bestStreakToday, streak)
      } else {
        streak = 0
      }
      latencyTotal += attempt.latencyMs || 0
    }

    const accuracyToday = attemptsToday > 0 ? (correctToday / attemptsToday) * 100 : 0
    const focusMinutesToday = latencyTotal > 0 ? Math.round((latencyTotal / 60000) * 10) / 10 : 0

    ensureNotCancelled(signal)

    return {
      attemptsToday,
      correctToday,
      accuracyToday,
      bestStreakToday,
      focusMinutesToday
    }
  } catch (error) {
    logger.warn('getDailyChallengeMetrics', 'No se pudieron calcular métricas de desafíos diarios', error)
    return {
      attemptsToday: 0,
      correctToday: 0,
      accuracyToday: 0,
      bestStreakToday: 0,
      focusMinutesToday: 0
    }
  }
}

// Re-export functions from goals.js for backward compatibility
export { getWeeklyGoals, checkWeeklyProgress } from './goals.js'

/**
 * Genera recomendaciones basadas en el progreso
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de recomendaciones
 */
// Use intelligent recommendations from real-time analytics
export const getRecommendations = getIntelligentRecommendations

/**
 * Analíticas avanzadas para dashboards enriquecidos (Fase 3)
 * @param {string} userId
 * @returns {Promise<Object>} Conjunto de métricas avanzadas
 */
export async function getAdvancedAnalytics(userId, signal) {
  const config = PROGRESS_CONFIG.ADVANCED_ANALYTICS_CONFIG || {}
  const retentionWindow = config.RETENTION_WINDOW_DAYS || 30
  const engagementWindow = config.ENGAGEMENT_WINDOW_DAYS || 14
  const dayMs = 24 * 60 * 60 * 1000

  try {
    ensureNotCancelled(signal)
    const [attempts, mastery] = await Promise.all([
      getAttemptsByUser(userId),
      getMasterySnapshotForUser(userId)
    ])

    ensureNotCancelled(signal)

    const dailyStats = new Map()
    const segmentStats = prepareSegments(config.TIME_OF_DAY_SEGMENTS)
    const sessions = new Map()
    const activeDays = new Set()

    let totalCorrect = 0
    let totalLatency = 0

    attempts.forEach(attempt => {
      const timestamp = new Date(attempt?.createdAt || attempt?.timestamp || Date.now())
      const dayKey = timestamp.toISOString().slice(0, 10)
      activeDays.add(dayKey)

      const dayEntry = dailyStats.get(dayKey) || { total: 0, correct: 0, latency: 0 }
      dayEntry.total += 1
      if (attempt.correct) {
        dayEntry.correct += 1
        totalCorrect += 1
      }
      dayEntry.latency += attempt.latencyMs || attempt.latency || 0
      totalLatency += attempt.latencyMs || attempt.latency || 0
      dailyStats.set(dayKey, dayEntry)

      const hour = timestamp.getHours()
      if (segmentStats.length) {
        segmentStats.forEach(segment => {
          if (hourInSegment(hour, segment)) {
            segment.total += 1
            if (attempt.correct) segment.correct += 1
            segment.latency += attempt.latencyMs || attempt.latency || 0
          }
        })
      }

      const sessionKey = attempt.sessionId || `day:${dayKey}`
      const sessionEntry = sessions.get(sessionKey) || { attempts: 0, correct: 0, latency: 0, dayKey }
      sessionEntry.attempts += 1
      if (attempt.correct) sessionEntry.correct += 1
      sessionEntry.latency += attempt.latencyMs || attempt.latency || 0
      sessions.set(sessionKey, sessionEntry)
    })

    ensureNotCancelled(signal)

    const retentionSeries = buildRetentionSeries(dailyStats, retentionWindow)
    const retentionTrend = computeRetentionTrend(retentionSeries)
    const engagementMetrics = computeEngagementMetrics(sessions, activeDays, engagementWindow, totalLatency)
    const masteryDistribution = computeMasteryDistribution(mastery)
    const timeOfDayPerformance = segmentStats.map(segment => ({
      key: segment.key,
      label: segment.label,
      attempts: segment.total,
      accuracy: segment.total ? Math.round((segment.correct / segment.total) * 100) : 0,
      averageLatency: segment.total ? Math.round(segment.latency / segment.total) : 0
    }))

    ensureNotCancelled(signal)

    return {
      retention: {
        windowDays: retentionWindow,
        overallAccuracy: attempts.length ? Math.round((totalCorrect / attempts.length) * 100) : 0,
        dailyAccuracy: retentionSeries,
        trend: retentionTrend
      },
      engagement: engagementMetrics,
      timeOfDay: timeOfDayPerformance,
      mastery: masteryDistribution
    }
  } catch (error) {
    logger.warn('getAdvancedAnalytics', 'Advanced analytics unavailable', error)
    return {
      retention: { windowDays: 0, overallAccuracy: 0, dailyAccuracy: [], trend: null },
      engagement: null,
      timeOfDay: [],
      mastery: null
    }
  }
}

function prepareSegments(rawSegments = []) {
  if (!Array.isArray(rawSegments) || rawSegments.length === 0) {
    return []
  }
  return rawSegments.map(segment => ({
    key: segment.key,
    label: segment.label,
    startHour: Number.isFinite(segment.startHour) ? segment.startHour : 0,
    endHour: Number.isFinite(segment.endHour) ? segment.endHour : 23,
    total: 0,
    correct: 0,
    latency: 0
  }))
}

function hourInSegment(hour, segment) {
  if (segment.startHour <= segment.endHour) {
    return hour >= segment.startHour && hour <= segment.endHour
  }
  // Segmento que cruza medianoche
  return hour >= segment.startHour || hour <= segment.endHour
}

function buildRetentionSeries(dailyStats, windowSize) {
  const dayMs = 24 * 60 * 60 * 1000
  const series = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = windowSize - 1; i >= 0; i--) {
    const day = new Date(today.getTime() - i * dayMs)
    const dayKey = day.toISOString().slice(0, 10)
    const entry = dailyStats.get(dayKey)
    const accuracy = entry && entry.total
      ? Math.round((entry.correct / entry.total) * 100)
      : 0
    series.push({ date: dayKey, accuracy, attempts: entry?.total || 0 })
  }
  return series
}

function computeRetentionTrend(series) {
  if (!Array.isArray(series) || series.length === 0) {
    return null
  }
  const last7 = series.slice(-7)
  const prev7 = series.slice(-14, -7)
  const avg = (data) => data.length ? data.reduce((sum, item) => sum + item.accuracy, 0) / data.length : 0
  const recent = avg(last7)
  const previous = avg(prev7)
  return {
    recent: Math.round(recent),
    previous: Math.round(previous),
    delta: Math.round((recent - previous) * 10) / 10
  }
}

function computeEngagementMetrics(sessions, activeDays, engagementWindow, totalLatency) {
  if (!sessions || sessions.size === 0) {
    return {
      sessionsPerWeek: 0,
      averageSessionMinutes: 0,
      averageAttemptsPerSession: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalPracticeMinutes: 0
    }
  }

  const sessionEntries = Array.from(sessions.values())
  const totalSessions = sessionEntries.length
  const totalAttempts = sessionEntries.reduce((sum, session) => sum + session.attempts, 0)
  const totalMinutes = totalLatency > 0 ? Math.round((totalLatency / 60000) * 10) / 10 : 0

  const recentSessions = sessionEntries.filter(session => {
    if (!session.dayKey) return true
    const sessionDate = new Date(session.dayKey)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - engagementWindow)
    return sessionDate >= cutoff
  })

  const sessionsPerWeek = recentSessions.length
  const averageSessionMinutes = totalSessions ? Math.round((totalMinutes / totalSessions) * 10) / 10 : 0
  const averageAttemptsPerSession = totalSessions ? Math.round((totalAttempts / totalSessions) * 10) / 10 : 0

  const streaks = computeActivityStreaks(activeDays)

  return {
    sessionsPerWeek,
    averageSessionMinutes,
    averageAttemptsPerSession,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    totalPracticeMinutes: totalMinutes
  }
}

function computeActivityStreaks(activeDaysSet) {
  if (!activeDaysSet || activeDaysSet.size === 0) {
    return { current: 0, best: 0 }
  }
  const dayMs = 24 * 60 * 60 * 1000
  const sortedDates = Array.from(activeDaysSet)
    .map(dayKey => new Date(dayKey))
    .sort((a, b) => a - b)

  let best = 0
  let streak = 0
  let previous = null

  sortedDates.forEach(date => {
    if (!previous) {
      streak = 1
    } else {
      const diff = Math.round((date - previous) / dayMs)
      streak = diff === 1 ? streak + 1 : 1
    }
    if (streak > best) best = streak
    previous = date
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const lastDate = sortedDates[sortedDates.length - 1]
  const diffFromToday = lastDate ? Math.round((today - lastDate) / dayMs) : Infinity
  const current = diffFromToday === 0 ? streak : 0

  return { current, best }
}

function computeMasteryDistribution(mastery) {
  if (!Array.isArray(mastery) || mastery.length === 0) {
    return {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      averageScore: 0,
      topStruggles: []
    }
  }

  let high = 0
  let medium = 0
  let low = 0
  let totalScore = 0

  mastery.forEach(record => {
    const score = record.score || 0
    totalScore += score
    if (score >= 80) high += 1
    else if (score >= 60) medium += 1
    else low += 1
  })

  const sortedByScore = [...mastery]
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, 5)
    .map(record => ({
      mood: record.mood,
      tense: record.tense,
      person: record.person,
      score: record.score
    }))

  return {
    total: mastery.length,
    high,
    medium,
    low,
    averageScore: Math.round(totalScore / mastery.length),
    topStruggles: sortedByScore
  }
}

/**
 * Obtiene estadísticas resumidas de SRS (debidos ahora y hoy)
 * @param {string} userId - ID del usuario
 * @param {Date} now - Fecha de referencia
 * @returns {Promise<{dueNow:number,dueToday:number}>}
 */
export async function getSRSStats(userId, now = new Date()) {
  try {
    const { getDueSchedules } = await import('./database.js')
    const allDue = await getDueSchedules(userId, now)
    const dueToday = allDue.length

    const nextHour = new Date(now.getTime() + 60 * 60 * 1000)
    const dueNow = allDue.filter(item => new Date(item.nextDue) <= nextHour).length

    return { dueNow, dueToday }
  } catch (error) {
    logger.warn('getSRSStats', 'SRS stats unavailable', error)
    return { dueNow: 0, dueToday: 0 }
  }
}
