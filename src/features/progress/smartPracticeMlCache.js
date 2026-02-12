const CACHE_TTL_MS = 5 * 60 * 1000

const recommendationCache = new Map()
const inFlightRequests = new Map()

export function buildSmartPracticeRecommendationKey(userStats = {}) {
  const totalAttempts = Number(userStats?.totalAttempts || userStats?.attemptsTotal || 0)
  const totalMastery = Number(userStats?.totalMastery || 0)
  const streakDays = Number(userStats?.streakDays || 0)
  const lastAttemptAt = Number(userStats?.lastAttemptAt || userStats?.lastAttempt || 0)

  return `a:${totalAttempts}|m:${Math.round(totalMastery)}|s:${streakDays}|l:${lastAttemptAt}`
}

export function getCachedSmartPracticeRecommendation(key, now = Date.now()) {
  const entry = recommendationCache.get(key)
  if (!entry) {
    return null
  }

  if (entry.expiresAt <= now) {
    recommendationCache.delete(key)
    return null
  }

  return entry.value
}

export function cacheSmartPracticeRecommendation(key, value, now = Date.now()) {
  if (!key || !value) {
    return
  }

  recommendationCache.set(key, {
    value,
    expiresAt: now + CACHE_TTL_MS
  })
}

export function getOrCreateRecommendationRequest(key, factory) {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)
  }

  const request = Promise.resolve()
    .then(factory)
    .finally(() => {
      inFlightRequests.delete(key)
    })

  inFlightRequests.set(key, request)
  return request
}

export function invalidateCachedSmartPracticeRecommendation(key) {
  if (!key) {
    return
  }
  recommendationCache.delete(key)
}

export function invalidateAllSmartPracticeRecommendations() {
  recommendationCache.clear()
}

export function __resetSmartPracticeRecommendationCache() {
  invalidateAllSmartPracticeRecommendations()
  inFlightRequests.clear()
}
