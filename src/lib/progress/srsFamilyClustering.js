// SRS Family Clustering: Transfer learning between related irregular verbs
// Implements mastery tracking at the family level to enable intelligent recommendations

import { IRREGULAR_FAMILIES, categorizeVerb } from '../data/irregularFamilies.js'
import { getScheduleByCell, saveSchedule } from './database.js'
import { PROGRESS_CONFIG } from './config.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:srs-clustering')

/**
 * Family clustering configuration
 */
const CLUSTERING_CONFIG = {
  // Transfer learning coefficient: how much does mastering one verb affect related verbs
  TRANSFER_COEFFICIENT: 0.3, // 30% transfer between family members

  // Family mastery threshold: minimum mastery to consider a family "known"
  FAMILY_MASTERY_THRESHOLD: 0.7, // 70% mastery across family

  // Minimum family members to enable clustering
  MIN_FAMILY_SIZE: 3,

  // Interval boost for family members when one is mastered
  FAMILY_INTERVAL_BOOST: 1.3, // 30% longer intervals for related verbs

  // Ease boost for family members
  FAMILY_EASE_BOOST: 0.2, // +0.2 ease for verbs in mastered families

  // Recency weight decay for family mastery (days)
  FAMILY_RECENCY_TAU: 14, // 2 weeks

  // Maximum family boost to prevent over-acceleration
  MAX_FAMILY_BOOST: 2.0
}

/**
 * Calculates family-level mastery for a given irregular family
 * Uses cell-level schedule as proxy for family mastery (current schema doesn't track per-verb)
 * @param {string} userId - User ID
 * @param {string} familyId - Family ID from IRREGULAR_FAMILIES
 * @param {string} mood - Mood to analyze
 * @param {string} tense - Tense to analyze
 * @param {string} person - Person to analyze
 * @returns {Promise<Object>} Family mastery data
 */
export async function calculateFamilyMastery(userId, familyId, mood, tense, person) {
  const family = IRREGULAR_FAMILIES[familyId]

  if (!family) {
    logger.warn('calculateFamilyMastery', `Unknown family: ${familyId}`)
    return { mastery: 0, verbCount: 0, masteredCount: 0 }
  }

  const verbs = family.examples || []

  if (verbs.length < CLUSTERING_CONFIG.MIN_FAMILY_SIZE) {
    logger.debug('calculateFamilyMastery', `Family ${familyId} too small (${verbs.length} verbs)`)
    return { mastery: 0, verbCount: verbs.length, masteredCount: 0 }
  }

  // Get cell-level schedule (current schema doesn't differentiate by lemma)
  // We'll use this as a proxy for the family's mastery in this cell
  try {
    const schedule = await getScheduleByCell(userId, mood, tense, person)

    if (!schedule) {
      logger.debug('calculateFamilyMastery', `No schedule found for ${mood}/${tense}/${person}`)
      return { mastery: 0, verbCount: verbs.length, masteredCount: 0 }
    }

    // Calculate mastery from schedule
    const cellMastery = calculateVerbMasteryFromSchedule(schedule)

    logger.debug('calculateFamilyMastery', `Family ${familyId} (${mood}/${tense}/${person}): ${(cellMastery * 100).toFixed(1)}% from cell schedule`)

    return {
      familyId,
      mastery: cellMastery,
      verbCount: verbs.length,
      practiceCount: schedule.reps || 0,
      masteredCount: cellMastery >= CLUSTERING_CONFIG.FAMILY_MASTERY_THRESHOLD ? verbs.length : 0,
      lastUpdated: schedule.updatedAt || new Date()
    }
  } catch (error) {
    logger.error('calculateFamilyMastery', `Error calculating family mastery for ${familyId}`, error)
    return { mastery: 0, verbCount: verbs.length, masteredCount: 0 }
  }
}

/**
 * Calculates verb mastery from a schedule object
 * @param {Object} schedule - SRS schedule
 * @returns {number} Mastery score (0-1)
 */
function calculateVerbMasteryFromSchedule(schedule) {
  // Factors:
  // 1. Interval length (longer = better retention)
  // 2. Ease factor (higher = easier for user)
  // 3. Reps count (more reps = more exposure)
  // 4. Lapses (fewer lapses = better mastery)
  // 5. Recent performance (lastAnswerCorrect)

  const interval = schedule.interval || 0
  const ease = schedule.ease || 2.5
  const reps = schedule.reps || 0
  const lapses = schedule.lapses || 0
  const leech = schedule.leech || false
  const lastCorrect = schedule.lastAnswerCorrect ?? true

  // Normalize interval (0-30 days → 0-1, capped)
  const intervalScore = Math.min(1, interval / 30)

  // Normalize ease (1.3-3.2 → 0-1)
  const easeScore = (ease - 1.3) / (3.2 - 1.3)

  // Normalize reps (0-10 → 0-1, capped)
  const repsScore = Math.min(1, reps / 10)

  // Penalize lapses (exponential decay)
  const lapsePenalty = Math.exp(-lapses / 3) // 3 lapses → 37% reduction

  // Penalize leeches
  const leechPenalty = leech ? 0.5 : 1.0

  // Recent performance bonus
  const recentBonus = lastCorrect ? 1.1 : 0.9

  // Weighted combination
  const mastery = (
    0.4 * intervalScore +
    0.3 * easeScore +
    0.2 * repsScore +
    0.1
  ) * lapsePenalty * leechPenalty * recentBonus

  return Math.min(1, Math.max(0, mastery))
}

/**
 * Applies family clustering boost to a schedule update
 * @param {string} userId - User ID
 * @param {string} lemma - Verb lemma
 * @param {Object} cell - Cell (mood, tense, person)
 * @param {Object} scheduleUpdate - Proposed schedule update from SRS
 * @returns {Promise<Object>} Enhanced schedule update with family boost
 */
export async function applyFamilyClusteringBoost(userId, lemma, cell, scheduleUpdate) {
  // Get all families this verb belongs to
  const families = categorizeVerb(lemma)

  if (!families || families.length === 0) {
    logger.debug('applyFamilyClusteringBoost', `${lemma} has no irregular families, no clustering boost`)
    return scheduleUpdate
  }

  logger.debug('applyFamilyClusteringBoost', `${lemma} belongs to families: ${families.join(', ')}`)

  // Calculate mastery for each family this verb belongs to
  const familyMasteries = await Promise.all(
    families.map(familyId =>
      calculateFamilyMastery(userId, familyId, cell.mood, cell.tense, cell.person)
    )
  )

  // Find highest family mastery (best case for transfer learning)
  const maxFamilyMastery = Math.max(...familyMasteries.map(fm => fm.mastery), 0)

  if (maxFamilyMastery < 0.3) {
    logger.debug('applyFamilyClusteringBoost', `${lemma}: family mastery too low (${(maxFamilyMastery * 100).toFixed(1)}%), no boost`)
    return scheduleUpdate
  }

  // Calculate transfer boost based on family mastery
  const transferBoost = CLUSTERING_CONFIG.TRANSFER_COEFFICIENT * maxFamilyMastery

  // Apply interval boost (multiplicative)
  const intervalMultiplier = Math.min(
    CLUSTERING_CONFIG.MAX_FAMILY_BOOST,
    1 + transferBoost * CLUSTERING_CONFIG.FAMILY_INTERVAL_BOOST
  )

  // Apply ease boost (additive)
  const easeBoost = transferBoost * CLUSTERING_CONFIG.FAMILY_EASE_BOOST

  const enhancedSchedule = {
    ...scheduleUpdate,
    interval: Math.max(1, Math.round(scheduleUpdate.interval * intervalMultiplier)),
    ease: Math.min(
      PROGRESS_CONFIG.SRS_ADVANCED?.EASE_MAX ?? 3.2,
      scheduleUpdate.ease + easeBoost
    ),
    // Track family clustering metadata
    familyClusteringApplied: true,
    familyMastery: maxFamilyMastery,
    familyBoostMultiplier: intervalMultiplier
  }

  logger.info('applyFamilyClusteringBoost', `${lemma} boosted by family mastery (${(maxFamilyMastery * 100).toFixed(1)}%)`, {
    originalInterval: scheduleUpdate.interval,
    boostedInterval: enhancedSchedule.interval,
    originalEase: scheduleUpdate.ease.toFixed(2),
    boostedEase: enhancedSchedule.ease.toFixed(2),
    multiplier: intervalMultiplier.toFixed(2)
  })

  return enhancedSchedule
}

/**
 * Gets intelligent verb recommendations based on family clustering
 * Recommends verbs from families that are partially mastered
 * @param {string} userId - User ID
 * @param {string} mood - Mood to recommend for
 * @param {string} tense - Tense to recommend for
 * @param {string} person - Person to recommend for
 * @param {number} limit - Maximum recommendations
 * @returns {Promise<Array>} Recommended verbs with reasoning
 */
export async function getIntelligentRecommendations(userId, mood, tense, person, limit = 5) {
  const recommendations = []

  // Analyze all irregular families
  for (const [familyId, family] of Object.entries(IRREGULAR_FAMILIES)) {
    // Skip families not affected by this tense
    if (family.affectedTenses && !family.affectedTenses.includes(tense)) {
      continue
    }

    const familyMastery = await calculateFamilyMastery(userId, familyId, mood, tense, person)

    // Recommend families that are partially learned (sweet spot for transfer learning)
    // Sweet spot: 30-90% mastery (user has seen the pattern but hasn't fully mastered it)
    if (familyMastery.mastery > 0.3 && familyMastery.mastery < 0.9) {
      // Use paradigmatic verbs as recommendations (most representative examples)
      const paradigmaticVerbs = family.paradigmaticVerbs || family.examples.slice(0, 3)

      recommendations.push({
        familyId,
        familyName: family.name,
        familyPattern: family.pattern,
        currentMastery: familyMastery.mastery,
        suggestedVerbs: paradigmaticVerbs.slice(0, 3),
        reasoning: `You've mastered ${(familyMastery.mastery * 100).toFixed(0)}% of ${family.name}. These verbs share the pattern: ${family.pattern}`,
        totalVerbs: family.examples.length
      })
    }
  }

  // Sort by mastery (prioritize families close to completion for motivation)
  recommendations.sort((a, b) => b.currentMastery - a.currentMastery)

  logger.info('getIntelligentRecommendations', `Generated ${recommendations.length} family-based recommendations for ${mood}/${tense}/${person}`)

  return recommendations.slice(0, limit)
}

/**
 * Gets family statistics for analytics dashboard
 * @param {string} userId - User ID
 * @param {string} mood - Mood to analyze
 * @param {string} tense - Tense to analyze
 * @param {string} person - Person to analyze
 * @returns {Promise<Object>} Family statistics
 */
export async function getFamilyStatistics(userId, mood, tense, person) {
  const stats = {
    totalFamilies: 0,
    masteredFamilies: 0,
    learningFamilies: 0,
    newFamilies: 0,
    familyDetails: []
  }

  for (const [familyId, family] of Object.entries(IRREGULAR_FAMILIES)) {
    // Skip families not affected by this tense
    if (family.affectedTenses && !family.affectedTenses.includes(tense)) {
      continue
    }

    stats.totalFamilies++

    const familyMastery = await calculateFamilyMastery(userId, familyId, mood, tense, person)

    if (familyMastery.mastery >= CLUSTERING_CONFIG.FAMILY_MASTERY_THRESHOLD) {
      stats.masteredFamilies++
    } else if (familyMastery.mastery > 0.1) {
      stats.learningFamilies++
    } else {
      stats.newFamilies++
    }

    stats.familyDetails.push({
      id: familyId,
      name: family.name,
      pattern: family.pattern,
      mastery: familyMastery.mastery,
      verbCount: family.examples.length,
      practiceCount: familyMastery.practiceCount,
      masteredCount: familyMastery.masteredCount
    })
  }

  // Sort by mastery descending
  stats.familyDetails.sort((a, b) => b.mastery - a.mastery)

  logger.debug('getFamilyStatistics', `Family stats for ${mood}/${tense}/${person}`, {
    total: stats.totalFamilies,
    mastered: stats.masteredFamilies,
    learning: stats.learningFamilies,
    new: stats.newFamilies
  })

  return stats
}

export {
  CLUSTERING_CONFIG
}
