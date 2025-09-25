// Sistema de Gamificación para SRS y Progreso
import { PROGRESS_CONFIG } from './config.js'
import { saveUser, getUserById } from './database.js'
import { getCurrentUserId } from './userManager.js'

// Configuración de gamificación
export const GAMIFICATION_CONFIG = {
  XP: {
    REVIEW_CORRECT: 10,
    REVIEW_PERFECT_SPEED: 15,  // <2s response time
    REVIEW_STREAK_BONUS: 5,     // per consecutive correct
    FIRST_ATTEMPT_BONUS: 5,     // correct without hints
    LAPSE_RECOVERY: 20,         // recovering from lapse
    MASTERY_MILESTONE: 50,      // reaching 80% mastery
    DAILY_GOAL_BONUS: 100,      // completing daily review goal
    WEEKLY_GOAL_BONUS: 300,     // completing weekly review goal
  },

  STREAKS: {
    DAILY_REVIEW: 'daily_review_streak',
    PERFECT_SESSIONS: 'perfect_sessions_streak',
    CONSECUTIVE_CORRECT: 'consecutive_correct_streak',
    LAPSE_FREE_DAYS: 'lapse_free_streak',
  },

  BADGES: {
    // Review Milestones
    FIRST_REVIEW: { id: 'first_review', name: 'Primer Repaso', description: 'Completaste tu primera sesión SRS', xp: 50 },
    CENTURY_CLUB: { id: 'century_reviews', name: 'Club de los 100', description: '100 reviews completados', xp: 200 },
    MARATHON_REVIEWER: { id: 'thousand_reviews', name: 'Maratonista', description: '1000 reviews completados', xp: 500 },

    // Streak Badges
    WEEK_WARRIOR: { id: 'week_streak', name: 'Guerrero Semanal', description: '7 días seguidos de repaso', xp: 150 },
    MONTH_MASTER: { id: 'month_streak', name: 'Maestro Mensual', description: '30 días seguidos de repaso', xp: 500 },
    YEAR_LEGEND: { id: 'year_streak', name: 'Leyenda Anual', description: '365 días seguidos de repaso', xp: 2000 },

    // Performance Badges
    SPEED_DEMON: { id: 'speed_demon', name: 'Demonio de Velocidad', description: '50 respuestas perfectas <2s', xp: 100 },
    PERFECTIONIST: { id: 'perfectionist', name: 'Perfeccionista', description: 'Sesión perfecta sin errores ni pistas', xp: 100 },
    LAPSE_SLAYER: { id: 'lapse_slayer', name: 'Cazador de Lapsos', description: '30 días sin lapsos', xp: 300 },

    // Mastery Badges
    MASTERY_NOVICE: { id: 'mastery_10', name: 'Novato', description: '10 formas dominadas (80%+)', xp: 100 },
    MASTERY_APPRENTICE: { id: 'mastery_50', name: 'Aprendiz', description: '50 formas dominadas', xp: 250 },
    MASTERY_EXPERT: { id: 'mastery_100', name: 'Experto', description: '100 formas dominadas', xp: 500 },
    MASTERY_MASTER: { id: 'mastery_200', name: 'Maestro', description: '200 formas dominadas', xp: 1000 },
  },

  LEVELS: {
    // XP thresholds for levels
    THRESHOLDS: [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6600, 8200, 10000, 12000, 14500, 17500, 21000, 25000, 29500, 35000],
    NAMES: [
      'Principiante',
      'Explorador',
      'Estudiante',
      'Practicante',
      'Aventurero',
      'Conocedor',
      'Especialista',
      'Veterano',
      'Experto',
      'Maestro',
      'Gran Maestro',
      'Virtuoso',
      'Leyenda',
      'Sabio',
      'Gurú',
      'Sensei',
      'Ninja',
      'Samurai',
      'Shogun',
      'Emperador'
    ]
  }
}

/**
 * Calcula el nivel actual basado en XP total
 */
export function calculateLevel(totalXP) {
  const thresholds = GAMIFICATION_CONFIG.LEVELS.THRESHOLDS
  const names = GAMIFICATION_CONFIG.LEVELS.NAMES

  let level = 0
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (totalXP >= thresholds[i]) {
      level = i
      break
    }
  }

  return {
    level: level + 1,
    name: names[level] || 'Emperador',
    currentXP: totalXP,
    levelXP: thresholds[level],
    nextLevelXP: thresholds[level + 1] || null,
    progress: thresholds[level + 1] ?
      Math.round(((totalXP - thresholds[level]) / (thresholds[level + 1] - thresholds[level])) * 100) : 100
  }
}

/**
 * Otorga XP al usuario y actualiza su progreso
 */
export async function awardXP(userId, xpAmount, reason = 'general', metadata = {}) {
  try {
    const user = await getUserById(userId)
    if (!user) return null

    const currentTotalXP = user.totalXP || 0
    const newTotalXP = currentTotalXP + xpAmount

    const oldLevel = calculateLevel(currentTotalXP)
    const newLevel = calculateLevel(newTotalXP)
    const leveledUp = newLevel.level > oldLevel.level

    // Actualizar usuario con nuevo XP
    const updatedUser = {
      ...user,
      totalXP: newTotalXP,
      updatedAt: new Date()
    }

    await saveUser(updatedUser)

    // Disparar evento de XP ganado
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gamification:xp-awarded', {
        detail: {
          userId,
          amount: xpAmount,
          reason,
          metadata,
          totalXP: newTotalXP,
          leveledUp,
          oldLevel: oldLevel.level,
          newLevel: newLevel.level,
          newLevelName: newLevel.name
        }
      }))
    }

    return {
      xpAwarded: xpAmount,
      totalXP: newTotalXP,
      leveledUp,
      levelInfo: newLevel
    }
  } catch (error) {
    console.error('Error awarding XP:', error)
    return null
  }
}

/**
 * Actualiza las rachas del usuario
 */
export async function updateStreak(userId, streakType, successful = true) {
  try {
    const user = await getUserById(userId)
    if (!user) return null

    const streaks = user.streaks || {}
    const today = new Date().toDateString()

    if (successful) {
      if (!streaks[streakType] || streaks[streakType].lastDate !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const wasYesterday = streaks[streakType]?.lastDate === yesterday.toDateString()

        streaks[streakType] = {
          count: wasYesterday ? (streaks[streakType].count + 1) : 1,
          lastDate: today,
          bestStreak: Math.max((streaks[streakType]?.bestStreak || 0), wasYesterday ? (streaks[streakType].count + 1) : 1)
        }
      }
    } else {
      // Romper la racha
      if (streaks[streakType]) {
        streaks[streakType].count = 0
      }
    }

    const updatedUser = {
      ...user,
      streaks,
      updatedAt: new Date()
    }

    await saveUser(updatedUser)

    // Disparar evento de racha actualizada
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gamification:streak-updated', {
        detail: {
          userId,
          streakType,
          successful,
          currentStreak: streaks[streakType]?.count || 0,
          bestStreak: streaks[streakType]?.bestStreak || 0
        }
      }))
    }

    return streaks[streakType]
  } catch (error) {
    console.error('Error updating streak:', error)
    return null
  }
}

/**
 * Verifica y otorga insignias automáticamente
 */
export async function checkAndAwardBadges(userId) {
  try {
    const user = await getUserById(userId)
    if (!user) return []

    const userBadges = user.badges || []
    const newBadges = []

    // Verificar insignias de review count
    const reviewCount = user.stats?.totalReviews || 0
    if (reviewCount >= 1 && !userBadges.includes('first_review')) {
      newBadges.push(GAMIFICATION_CONFIG.BADGES.FIRST_REVIEW)
    }
    if (reviewCount >= 100 && !userBadges.includes('century_reviews')) {
      newBadges.push(GAMIFICATION_CONFIG.BADGES.CENTURY_CLUB)
    }
    if (reviewCount >= 1000 && !userBadges.includes('thousand_reviews')) {
      newBadges.push(GAMIFICATION_CONFIG.BADGES.MARATHON_REVIEWER)
    }

    // Verificar insignias de rachas
    const dailyStreak = user.streaks?.daily_review_streak?.count || 0
    if (dailyStreak >= 7 && !userBadges.includes('week_streak')) {
      newBadges.push(GAMIFICATION_CONFIG.BADGES.WEEK_WARRIOR)
    }
    if (dailyStreak >= 30 && !userBadges.includes('month_streak')) {
      newBadges.push(GAMIFICATION_CONFIG.BADGES.MONTH_MASTER)
    }
    if (dailyStreak >= 365 && !userBadges.includes('year_streak')) {
      newBadges.push(GAMIFICATION_CONFIG.BADGES.YEAR_LEGEND)
    }

    // Otorgar nuevas insignias
    if (newBadges.length > 0) {
      const totalXP = newBadges.reduce((sum, badge) => sum + badge.xp, 0)
      const updatedBadges = [...userBadges, ...newBadges.map(b => b.id)]

      const updatedUser = {
        ...user,
        badges: updatedBadges,
        totalXP: (user.totalXP || 0) + totalXP,
        updatedAt: new Date()
      }

      await saveUser(updatedUser)

      // Disparar evento de insignias ganadas
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gamification:badges-awarded', {
          detail: {
            userId,
            newBadges,
            totalXP: updatedUser.totalXP
          }
        }))
      }
    }

    return newBadges
  } catch (error) {
    console.error('Error checking badges:', error)
    return []
  }
}

/**
 * Procesa el resultado de un review SRS y otorga recompensas
 */
export async function processSRSReview(userId, reviewResult) {
  const {
    correct,
    hintsUsed,
    responseTimeMs,
    wasLapse,
    recoveredFromLapse,
    isFirstAttempt,
    consecutiveCorrect = 0
  } = reviewResult

  let totalXP = 0

  if (correct) {
    // XP base por respuesta correcta
    totalXP += GAMIFICATION_CONFIG.XP.REVIEW_CORRECT

    // Bonus por velocidad
    if (responseTimeMs < 2000) {
      totalXP += GAMIFICATION_CONFIG.XP.REVIEW_PERFECT_SPEED
    }

    // Bonus por primer intento sin pistas
    if (isFirstAttempt && hintsUsed === 0) {
      totalXP += GAMIFICATION_CONFIG.XP.FIRST_ATTEMPT_BONUS
    }

    // Bonus por racha consecutiva
    if (consecutiveCorrect > 1) {
      totalXP += Math.min(consecutiveCorrect * GAMIFICATION_CONFIG.XP.REVIEW_STREAK_BONUS, 50)
    }

    // Bonus especial por recuperarse de un lapse
    if (recoveredFromLapse) {
      totalXP += GAMIFICATION_CONFIG.XP.LAPSE_RECOVERY
    }

    // Actualizar racha diaria
    await updateStreak(userId, GAMIFICATION_CONFIG.STREAKS.DAILY_REVIEW, true)

    // Actualizar racha consecutiva
    await updateStreak(userId, GAMIFICATION_CONFIG.STREAKS.CONSECUTIVE_CORRECT, true)

    // Actualizar racha libre de lapses si no fue un lapse
    if (!wasLapse) {
      await updateStreak(userId, GAMIFICATION_CONFIG.STREAKS.LAPSE_FREE_DAYS, true)
    }
  } else {
    // Romper rachas en caso de error
    await updateStreak(userId, GAMIFICATION_CONFIG.STREAKS.CONSECUTIVE_CORRECT, false)
  }

  // Otorgar XP total
  if (totalXP > 0) {
    await awardXP(userId, totalXP, 'srs_review', reviewResult)
  }

  // Verificar y otorgar insignias
  await checkAndAwardBadges(userId)

  return { xpAwarded: totalXP }
}

/**
 * Obtiene estadísticas de gamificación para un usuario
 */
export async function getGamificationStats(userId) {
  try {
    const user = await getUserById(userId)
    if (!user) return null

    const levelInfo = calculateLevel(user.totalXP || 0)
    const streaks = user.streaks || {}
    const badges = user.badges || []

    return {
      level: levelInfo,
      totalXP: user.totalXP || 0,
      badges: badges.map(badgeId => GAMIFICATION_CONFIG.BADGES[badgeId.toUpperCase()] || { id: badgeId }),
      streaks: {
        daily: streaks[GAMIFICATION_CONFIG.STREAKS.DAILY_REVIEW]?.count || 0,
        consecutive: streaks[GAMIFICATION_CONFIG.STREAKS.CONSECUTIVE_CORRECT]?.count || 0,
        lapseFree: streaks[GAMIFICATION_CONFIG.STREAKS.LAPSE_FREE_DAYS]?.count || 0,
        perfectSessions: streaks[GAMIFICATION_CONFIG.STREAKS.PERFECT_SESSIONS]?.count || 0
      },
      stats: user.stats || {}
    }
  } catch (error) {
    console.error('Error getting gamification stats:', error)
    return null
  }
}

/**
 * Helper para integración fácil con el sistema SRS existente
 */
export async function handleSRSReviewComplete(cell, correct, hintsUsed, metadata = {}) {
  const userId = getCurrentUserId()
  if (!userId) return

  const reviewResult = {
    correct,
    hintsUsed,
    responseTimeMs: metadata.latencyMs,
    wasLapse: metadata.wasLapse || false,
    recoveredFromLapse: metadata.recoveredFromLapse || false,
    isFirstAttempt: hintsUsed === 0,
    consecutiveCorrect: metadata.consecutiveCorrect || 0
  }

  return await processSRSReview(userId, reviewResult)
}