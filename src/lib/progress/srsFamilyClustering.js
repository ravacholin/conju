// SRS Family Clustering: Transfer learning between related irregular verbs
// Implements mastery tracking at the family level to enable intelligent recommendations

import { IRREGULAR_FAMILIES, IRREGULARITY_CLUSTERS, categorizeVerb } from '../data/irregularFamilies.js'
import { getScheduleByCell } from './database.js'
import { PROGRESS_CONFIG } from './config.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:srs-clustering')

function getClusterByFamily(familyId) {
  return Object.values(IRREGULARITY_CLUSTERS).find(cluster =>
    cluster.families?.includes(familyId)
  ) || null
}

function aggregateClusterPerformance(familyMasteries = []) {
  if (!familyMasteries.length) return null

  const clusters = {}
  const practiceWeight = CLUSTER_PROMOTION_CONFIG.PRACTICE_WEIGHT ?? 0.15

  for (const mastery of familyMasteries) {
    const cluster = getClusterByFamily(mastery.familyId)

    if (!cluster) continue

    const weight = 1 + (mastery.practiceCount || 0) * practiceWeight

    if (!clusters[cluster.id]) {
      clusters[cluster.id] = {
        ...cluster,
        totalMastery: 0,
        totalWeight: 0,
        practiceCount: 0,
        families: []
      }
    }

    clusters[cluster.id].totalMastery += (mastery.mastery || 0) * weight
    clusters[cluster.id].totalWeight += weight
    clusters[cluster.id].practiceCount += mastery.practiceCount || 0
    clusters[cluster.id].families.push(mastery.familyId)
  }

  const ranked = Object.values(clusters)
    .map(cluster => ({
      ...cluster,
      mastery: cluster.totalWeight > 0 ? cluster.totalMastery / cluster.totalWeight : 0
    }))
    .sort((a, b) => b.mastery - a.mastery)

  return ranked[0] || null
}

function calculateClusterMultiplier(clusterPerformance) {
  if (!clusterPerformance) return { multiplier: 1, promotionApplied: false }

  const promotionThreshold = CLUSTER_PROMOTION_CONFIG.PROMOTION_THRESHOLD ?? 0.6
  const dropThreshold = CLUSTER_PROMOTION_CONFIG.DROP_THRESHOLD ?? 0.35
  const floorMultiplier = CLUSTER_PROMOTION_CONFIG.FLOOR_MULTIPLIER ?? 0.9
  const intervalBonus = CLUSTER_PROMOTION_CONFIG.INTERVAL_BONUS ?? 0.25
  const maxBoost = CLUSTER_PROMOTION_CONFIG.MAX_CLUSTER_BOOST ?? 1.35
  const practiceWeight = CLUSTER_PROMOTION_CONFIG.PRACTICE_WEIGHT ?? 0.15

  const practiceBoost = Math.min(0.2, (clusterPerformance.practiceCount || 0) * practiceWeight / 10)
  const adjustedMastery = Math.min(1, (clusterPerformance.mastery || 0) + practiceBoost)

  if (adjustedMastery >= promotionThreshold) {
    const overThreshold = adjustedMastery - promotionThreshold
    const multiplier = Math.min(maxBoost, 1 + overThreshold * intervalBonus)
    return { multiplier, promotionApplied: true }
  }

  if (adjustedMastery < dropThreshold) {
    return { multiplier: floorMultiplier, promotionApplied: false }
  }

  return { multiplier: 1, promotionApplied: false }
}

const FAMILY_CLUSTER_CONFIG = PROGRESS_CONFIG.SRS_CLUSTERING?.FAMILY || {}
const CLUSTER_PROMOTION_CONFIG = PROGRESS_CONFIG.SRS_CLUSTERING?.CLUSTER_PROMOTION || {}

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

  const minFamilySize = FAMILY_CLUSTER_CONFIG.MIN_FAMILY_SIZE ?? 3

  if (verbs.length < minFamilySize) {
    logger.debug('calculateFamilyMastery', `Family ${familyId} too small (${verbs.length} verbs)`)
    return { familyId, mastery: 0, verbCount: verbs.length, masteredCount: 0 }
  }

  // Get cell-level schedule (current schema doesn't differentiate by lemma)
  // We'll use this as a proxy for the family's mastery in this cell
  try {
    const schedule = await getScheduleByCell(userId, mood, tense, person)

    if (!schedule) {
      logger.debug('calculateFamilyMastery', `No schedule found for ${mood}/${tense}/${person}`)
      return { familyId, mastery: 0, verbCount: verbs.length, masteredCount: 0 }
    }

    // Calculate mastery from schedule
    const cellMastery = calculateVerbMasteryFromSchedule(schedule)

    logger.debug('calculateFamilyMastery', `Family ${familyId} (${mood}/${tense}/${person}): ${(cellMastery * 100).toFixed(1)}% from cell schedule`)

    return {
      familyId,
      mastery: cellMastery,
      verbCount: verbs.length,
      practiceCount: schedule.reps || 0,
      masteredCount: cellMastery >= (FAMILY_CLUSTER_CONFIG.FAMILY_MASTERY_THRESHOLD ?? 0.7) ? verbs.length : 0,
      lastUpdated: schedule.updatedAt || new Date()
    }
  } catch (error) {
    logger.error('calculateFamilyMastery', `Error calculating family mastery for ${familyId}`, error)
    return { familyId, mastery: 0, verbCount: verbs.length, masteredCount: 0 }
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
  const minMasteryForBoost = FAMILY_CLUSTER_CONFIG.MIN_MASTERY_FOR_BOOST ?? 0.3

  let enhancedSchedule = { ...scheduleUpdate }

  if (maxFamilyMastery >= minMasteryForBoost) {
    // Calculate transfer boost based on family mastery
    const transferBoost = (FAMILY_CLUSTER_CONFIG.TRANSFER_COEFFICIENT ?? 0.3) * maxFamilyMastery

    // Apply interval boost (multiplicative)
    const intervalMultiplier = Math.min(
      FAMILY_CLUSTER_CONFIG.MAX_FAMILY_BOOST ?? 2.0,
      1 + transferBoost * (FAMILY_CLUSTER_CONFIG.FAMILY_INTERVAL_BOOST ?? 1.3)
    )

    // Apply ease boost (additive)
    const easeBoost = transferBoost * (FAMILY_CLUSTER_CONFIG.FAMILY_EASE_BOOST ?? 0.2)

    enhancedSchedule = {
      ...enhancedSchedule,
      interval: Math.max(1, Math.round(scheduleUpdate.interval * intervalMultiplier)),
      ease: Math.min(
        PROGRESS_CONFIG.SRS_ADVANCED?.EASE_MAX ?? 3.2,
        (scheduleUpdate.ease ?? PROGRESS_CONFIG.SRS_ADVANCED?.EASE_START ?? 2.5) + easeBoost
      ),
      // Track family clustering metadata
      familyClusteringApplied: true,
      familyMastery: maxFamilyMastery,
      familyBoostMultiplier: intervalMultiplier
    }
  } else {
    logger.debug('applyFamilyClusteringBoost', `${lemma}: family mastery too low (${(maxFamilyMastery * 100).toFixed(1)}%), no family boost`)
  }

  const clusterPerformance = aggregateClusterPerformance(familyMasteries)
  const { multiplier: clusterMultiplier, promotionApplied } = calculateClusterMultiplier(clusterPerformance)

  if (clusterMultiplier !== 1) {
    enhancedSchedule = {
      ...enhancedSchedule,
      interval: Math.max(1, Math.round(enhancedSchedule.interval * clusterMultiplier)),
      clusterPromotionApplied: promotionApplied,
      clusterContext: clusterPerformance?.id,
      clusterMastery: clusterPerformance?.mastery,
      clusterIntervalMultiplier: clusterMultiplier
    }
  }

  const familyMultiplier = enhancedSchedule.familyBoostMultiplier ?? 1

  logger.info('applyFamilyClusteringBoost', `${lemma} boosted by family mastery (${(maxFamilyMastery * 100).toFixed(1)}%)`, {
    originalInterval: scheduleUpdate.interval,
    boostedInterval: enhancedSchedule.interval,
    originalEase: scheduleUpdate.ease.toFixed(2),
    boostedEase: enhancedSchedule.ease.toFixed(2),
    multiplier: familyMultiplier.toFixed(2),
    clusterMultiplier: clusterMultiplier.toFixed(2)
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

    if (familyMastery.mastery >= (FAMILY_CLUSTER_CONFIG.FAMILY_MASTERY_THRESHOLD ?? 0.7)) {
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
