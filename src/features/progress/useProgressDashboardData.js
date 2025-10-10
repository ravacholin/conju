import { useEffect, useRef, useState, useCallback } from 'react'
import { getHeatMapData, getUserStats, getWeeklyGoals, checkWeeklyProgress, getRecommendations, getAdvancedAnalytics } from '../../lib/progress/analytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { progressDataCache } from '../../lib/cache/ProgressDataCache.js'
import { AsyncController } from '../../lib/utils/AsyncController.js'
import { getDailyChallengeSnapshot, markChallengeCompleted } from '../../lib/progress/challenges.js'
import { onProgressSystemReady, isProgressSystemReady } from '../../lib/progress/index.js'
import { generatePersonalizedStudyPlan, invalidateStudyPlan, onStudyPlanUpdated } from '../../lib/progress/studyPlans.js'
import { getCommunitySnapshot, onCommunitySnapshot, clearCommunityCache } from '../../lib/progress/social.js'
import { getOfflineStatus, onOfflineStatusChange, clearOfflineCache } from '../../lib/progress/offlineSupport.js'
import { getExpertModeSettings, onExpertModeChange } from '../../lib/progress/expertMode.js'
import {
  getGlobalDynamicEvaluation,
  getGlobalDynamicProgress,
  getGlobalDynamicLevelInfo,
  checkGlobalLevelRecommendation
} from '../../lib/levels/userLevelProfile.js'

const normalizeHeatMapResult = (rawData, rangeKey = 'all') => {
  const timestamp = Date.now()

  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData) && rawData.heatMap) {
    return {
      heatMap: rawData.heatMap || {},
      range: rawData.range || rangeKey,
      updatedAt: rawData.updatedAt || timestamp
    }
  }

  if (!Array.isArray(rawData) || rawData.length === 0) {
    return { heatMap: {}, range: rangeKey, updatedAt: timestamp }
  }

  const heatMapObject = {}

  rawData.forEach(item => {
    if (item.mood && item.tense) {
      const key = `${item.mood}-${item.tense}`
      const rawLastAttempt = item.lastAttempt ?? null
      let normalizedLastAttempt = null
      if (typeof rawLastAttempt === 'number') {
        normalizedLastAttempt = rawLastAttempt
      } else if (typeof rawLastAttempt === 'string') {
        const parsed = new Date(rawLastAttempt).getTime()
        normalizedLastAttempt = Number.isFinite(parsed) ? parsed : null
      }

      heatMapObject[key] = {
        mastery: item.score / 100,
        attempts: item.count || 0,
        lastAttempt: normalizedLastAttempt
      }
    }
  })

  return { heatMap: heatMapObject, range: rangeKey, updatedAt: timestamp }
}

export default function useProgressDashboardData() {
  const [heatMapData, setHeatMapData] = useState(null)
  const [errorIntel, setErrorIntel] = useState(null)
  const [userStats, setUserStats] = useState({})
  const [weeklyGoals, setWeeklyGoals] = useState({})
  const [weeklyProgress, setWeeklyProgress] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [dailyChallenges, setDailyChallenges] = useState({ date: null, metrics: {}, challenges: [] })
  const [studyPlan, setStudyPlan] = useState(null)
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null)
  const [communitySnapshot, setCommunitySnapshot] = useState(null)
  const [offlineStatus, setOfflineStatus] = useState(null)
  const [expertModeSettings, setExpertModeSettings] = useState(null)
  const [dynamicLevelEvaluation, setDynamicLevelEvaluation] = useState(null)
  const [dynamicLevelProgress, setDynamicLevelProgress] = useState(null)
  const [dynamicLevelInfo, setDynamicLevelInfo] = useState(null)
  const [levelRecommendation, setLevelRecommendation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [systemReady, setSystemReady] = useState(false)
  const [advancedLoading, setAdvancedLoading] = useState(false)
  const [personFilter] = useState('')

  // AsyncController for managing cancellable operations
  const asyncController = useRef(new AsyncController())
  const hasInitialLoad = useRef(false)
  const lastPersonFilterRef = useRef(personFilter)
  const advancedRequestDataRef = useRef(null)
  const [advancedRequestToken, setAdvancedRequestToken] = useState(0)

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
        setError(null)
      }

      setAdvancedLoading(false)
      advancedRequestDataRef.current = null

      // Cancel every tracked dashboard request so prior keyed operations stop mutating state
      asyncController.current.cancelAll()

      // Get current user ID
      const userId = getCurrentUserId()
      if (!userId) {
        throw new Error('Usuario no inicializado. Espera un momento y reintenta.')
      }

      // Cache warmup for commonly used data
      if (!isRefresh) {
        const warmupLoaders = {
          userStats: () => getUserStats(userId),
          weeklyGoals: () => getWeeklyGoals(userId)
        }
        progressDataCache.warmup(userId, warmupLoaders)
      }

      // Define basic operations with cache integration
      const basicOperations = {
        heatMap: async (signal) => {
          try {
            const cacheKey = `${userId}:heatMap:${personFilter || 'all'}`
            const result = await progressDataCache.get(
              cacheKey,
              ({ signal: cacheSignal }) => getHeatMapData(userId, personFilter || null, 'all_time', cacheSignal),
              'heatMap',
              { signal }
            )
            if (signal.aborted) throw new Error('Cancelled')

            return normalizeHeatMapResult(result, 'all')
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load heat map data:', e)
            return normalizeHeatMapResult(null, 'all')
          }
        },

        userStats: async (signal) => {
          try {
            const cacheKey = `${userId}:userStats`
            const result = await progressDataCache.get(
              cacheKey,
              ({ signal: cacheSignal }) => getUserStats(userId, cacheSignal),
              'userStats',
              { signal }
            )
            if (signal.aborted) throw new Error('Cancelled')
            return result && typeof result === 'object' ? result : {}
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load user stats:', e)
            return {}
          }
        },

        weeklyGoals: async (signal) => {
          try {
            const cacheKey = `${userId}:weeklyGoals`
            const result = await progressDataCache.get(
              cacheKey,
              ({ signal: cacheSignal }) => getWeeklyGoals(userId, cacheSignal),
              'weeklyGoals',
              { signal }
            )
            if (signal.aborted) throw new Error('Cancelled')
            return result && typeof result === 'object' ? result : {}
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load weekly goals:', e)
            return {}
          }
        }
      }

      // Execute basic operations with proper cancellation and timeout
      const basicResults = await asyncController.current.executeAll(basicOperations, 10000)

      // Update state with basic results
      setHeatMapData(
        basicResults.heatMap
          ? normalizeHeatMapResult(basicResults.heatMap, 'all')
          : normalizeHeatMapResult(null, 'all')
      )
      setUserStats(basicResults.userStats || {})
      setWeeklyGoals(basicResults.weeklyGoals || {})

      setError(null)
      setLoading(false)
      setRefreshing(false)

      advancedRequestDataRef.current = { userId }
      setAdvancedRequestToken(token => token + 1)
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err)
      setError(err.message || 'Error desconocido al cargar datos')
      setLoading(false)
      setRefreshing(false)
      setAdvancedLoading(false)
    }
  }, [personFilter]) // Only depend on personFilter since other state setters are stable

  useEffect(() => {
    if (!advancedRequestToken || !advancedRequestDataRef.current) {
      return
    }

    let cancelled = false
    let idleHandle = null
    let timeoutHandle = null
    const { userId } = advancedRequestDataRef.current

    const runAdvancedPhase = async () => {
      if (cancelled) return
      setAdvancedLoading(true)

      const advancedOperations = {
        errorIntel: async (signal) => {
          try {
            const cacheKey = `${userId}:errorIntel`
            const result = await progressDataCache.get(
              cacheKey,
              async ({ signal: cacheSignal }) => {
                if (cacheSignal?.aborted) {
                  throw new Error('Operation was cancelled')
                }
                const { getErrorIntelligence } = await import('../../lib/progress/analytics.js')
                return getErrorIntelligence(userId, cacheSignal)
              },
              'errorIntel',
              { signal }
            )
            if (signal.aborted) throw new Error('Cancelled')
            return result && typeof result === 'object' ? result : null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load error intelligence data:', e)
            return null
          }
        },

        weeklyProgress: async (signal) => {
          try {
            const cacheKey = `${userId}:weeklyProgress`
            const result = await progressDataCache.get(
              cacheKey,
              ({ signal: cacheSignal }) => checkWeeklyProgress(userId, cacheSignal),
              'weeklyProgress',
              { signal }
            )
            if (signal.aborted) throw new Error('Cancelled')
            return result && typeof result === 'object' ? result : {}
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load weekly progress:', e)
            return {}
          }
        },

        recommendations: async (signal) => {
          try {
            const cacheKey = `${userId}:recommendations`
            const result = await progressDataCache.get(
              cacheKey,
              ({ signal: cacheSignal }) => getRecommendations(userId, cacheSignal),
              'recommendations',
              { signal }
            )
            if (signal.aborted) throw new Error('Cancelled')
            return Array.isArray(result) ? result : []
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load recommendations:', e)
            return []
          }
        },

        dailyChallenges: async (signal) => {
          try {
            const cacheKey = `${userId}:dailyChallenges`
            const result = await progressDataCache.get(
              cacheKey,
              ({ signal: cacheSignal }) => getDailyChallengeSnapshot(userId, { signal: cacheSignal }),
              'dailyChallenges',
              { signal }
            )
            if (signal.aborted) throw new Error('Cancelled')
            if (!result || typeof result !== 'object') return { date: null, metrics: {}, challenges: [] }
            return result
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load daily challenges:', e)
            return { date: null, metrics: {}, challenges: [] }
          }
        },

        studyPlan: async (signal) => {
          try {
            const plan = await generatePersonalizedStudyPlan(userId, { signal })
            if (signal.aborted) throw new Error('Cancelled')
            return plan || null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to generate study plan:', e)
            return null
          }
        },

        advancedAnalytics: async (signal) => {
          try {
            const analytics = await getAdvancedAnalytics(userId, signal)
            if (signal.aborted) throw new Error('Cancelled')
            return analytics || null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load advanced analytics:', e)
            return null
          }
        },

        community: async (signal) => {
          try {
            const snapshot = await getCommunitySnapshot(userId, { signal })
            if (signal.aborted) throw new Error('Cancelled')
            return snapshot || null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load community snapshot:', e)
            return null
          }
        },

        offlineStatus: async (signal) => {
          try {
            const status = await getOfflineStatus(true, { signal })
            if (signal.aborted) throw new Error('Cancelled')
            return status
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to determine offline status:', e)
            return null
          }
        },

        expertMode: async (signal) => {
          try {
            if (signal.aborted) throw new Error('Cancelled')
            const settings = getExpertModeSettings(userId)
            if (signal.aborted) throw new Error('Cancelled')
            return settings
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to retrieve expert mode settings:', e)
            return null
          }
        },

        dynamicLevelEvaluation: async (signal) => {
          try {
            const evaluation = await getGlobalDynamicEvaluation({ signal })
            if (signal.aborted) throw new Error('Cancelled')
            return evaluation || null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load dynamic level evaluation:', e)
            return null
          }
        },

        dynamicLevelProgress: async (signal) => {
          try {
            const progress = await getGlobalDynamicProgress({ signal })
            if (signal.aborted) throw new Error('Cancelled')
            return progress || null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load dynamic level progress:', e)
            return null
          }
        },

        dynamicLevelInfo: async (signal) => {
          try {
            const info = await getGlobalDynamicLevelInfo({ signal })
            if (signal.aborted) throw new Error('Cancelled')
            return info || null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load dynamic level info:', e)
            return null
          }
        },

        levelRecommendation: async (signal) => {
          try {
            const recommendation = await checkGlobalLevelRecommendation({ signal })
            if (signal.aborted) throw new Error('Cancelled')
            return recommendation || null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to check level recommendation:', e)
            return null
          }
        }
      }

      try {
        const results = await asyncController.current.executeAll(advancedOperations, 10000)
        if (cancelled) return

        setErrorIntel(results.errorIntel || null)
        setWeeklyProgress(results.weeklyProgress || {})
        setRecommendations(results.recommendations || [])
        setDailyChallenges(results.dailyChallenges || { date: null, metrics: {}, challenges: [] })
        setStudyPlan(results.studyPlan || null)
        setAdvancedAnalytics(results.advancedAnalytics || null)
        setCommunitySnapshot(results.community || null)
        setOfflineStatus(results.offlineStatus || null)
        setExpertModeSettings(results.expertMode || getExpertModeSettings(userId))
        setDynamicLevelEvaluation(results.dynamicLevelEvaluation || null)
        setDynamicLevelProgress(results.dynamicLevelProgress || null)
        setDynamicLevelInfo(results.dynamicLevelInfo || null)
        setLevelRecommendation(results.levelRecommendation || null)
      } catch (advancedError) {
        if (!cancelled) {
          console.error('Error al cargar datos avanzados del dashboard:', advancedError)
        }
      } finally {
        if (!cancelled) {
          setAdvancedLoading(false)
        }
      }
    }

    const scheduleAdvancedPhase = () => {
      if (cancelled) return
      if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(() => {
          runAdvancedPhase()
        })
      } else {
        timeoutHandle = setTimeout(() => {
          runAdvancedPhase()
        }, 0)
      }
    }

    scheduleAdvancedPhase()

    return () => {
      cancelled = true
      if (idleHandle !== null && typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle)
      }
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle)
      }
    }
  }, [advancedRequestToken])

  const completeChallenge = async (challengeId) => {
    try {
      const userId = getCurrentUserId()
      if (!userId) {
        throw new Error('Usuario no inicializado')
      }
      const result = await markChallengeCompleted(userId, challengeId)
      progressDataCache.invalidate(`${userId}:dailyChallenges`)
      if (result?.challenges) {
        setDailyChallenges(prev => {
          if (!prev || !Array.isArray(prev.challenges)) {
            return prev
          }
          const completed = result.challenges.find(c => c.id === challengeId)
          const completedAt = completed?.completedAt || new Date().toISOString()
          return {
            ...prev,
            challenges: prev.challenges.map(challenge =>
              challenge.id === challengeId
                ? { ...challenge, status: 'completed', completedAt }
                : challenge
            )
          }
        })
      }
    } catch (error) {
      console.error('Error al marcar desafío diario como completado:', error)
    }
  }

  const refresh = () => {
    const userId = getCurrentUserId()
    if (userId) {
      progressDataCache.invalidateUser(userId)
      invalidateStudyPlan(userId)
      clearCommunityCache(userId)
      clearOfflineCache()
    }
    loadData(true)
  }

  // Check if progress system is ready
  useEffect(() => {
    // Check immediately if system is already ready
    if (isProgressSystemReady()) {
      const userId = getCurrentUserId()
      if (userId) {
        setSystemReady(true)
        hasInitialLoad.current = true
        loadData()
        return
      }
    }

    // Listen for progress system ready event
    const unsubscribe = onProgressSystemReady((ready) => {
      if (ready) {
        const userId = getCurrentUserId()
        if (userId) {
          setSystemReady(true)
          if (!hasInitialLoad.current) {
            hasInitialLoad.current = true
            loadData()
          }
        } else {
          setError('Sistema de progreso inicializado pero usuario no disponible.')
          setLoading(false)
        }
      }
    })

    return unsubscribe
  }, [loadData])

  useEffect(() => {
    if (!systemReady) {
      return
    }

    const personFilterChanged = lastPersonFilterRef.current !== personFilter
    lastPersonFilterRef.current = personFilter

    if (!personFilterChanged && hasInitialLoad.current) {
      return
    }

    hasInitialLoad.current = true
    loadData()
  }, [personFilter, systemReady, loadData])

  useEffect(() => {
    const unsubscribePlan = onStudyPlanUpdated(
      ({ plan }) => setStudyPlan(plan || null),
      { immediate: true }
    )
    const unsubscribeCommunity = onCommunitySnapshot(({ snapshot }) => setCommunitySnapshot(snapshot))
    const unsubscribeOffline = onOfflineStatusChange(status => setOfflineStatus(status))
    const unsubscribeExpert = onExpertModeChange(({ settings }) => setExpertModeSettings(settings))
    return () => {
      unsubscribePlan?.()
      unsubscribeCommunity?.()
      unsubscribeOffline?.()
      unsubscribeExpert?.()
    }
  }, [])

  // Escuchar eventos de actualización de progreso para refrescar automáticamente
  useEffect(() => {
    let refreshTimeoutId = null
    let mounted = true

    const scheduleRefresh = () => {
      if (!mounted) return
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId)
      }
      refreshTimeoutId = setTimeout(() => {
        if (!mounted) return
        loadData(true)
        refreshTimeoutId = null
      }, 500)
    }

    const handleProgressUpdate = (event) => {
      console.log('🔄 Datos de progreso actualizados, refrescando dashboard...', event.detail)
      scheduleRefresh()
    }

    window.addEventListener('progress:dataUpdated', handleProgressUpdate)

    return () => {
      mounted = false
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId)
      }
      window.removeEventListener('progress:dataUpdated', handleProgressUpdate)
    }
  }, [personFilter, loadData])

  // Cleanup async operations on component unmount
  useEffect(() => {
    return () => {
      asyncController.current.destroy()
    }
  }, [])

  // Debug cache performance in development
  useEffect(() => {
    if (import.meta.env?.DEV) {
      const logCacheStats = () => {
        const stats = progressDataCache.getStats()
        console.log('📊 Cache Stats:', stats)
      }

      // Log cache stats every 30 seconds in development
      const interval = setInterval(logCacheStats, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  return {
    // state
    heatMapData,
    errorIntel,
    userStats,
    weeklyGoals,
    weeklyProgress,
    recommendations,
    dailyChallenges,
    studyPlan,
    advancedAnalytics,
    communitySnapshot,
    offlineStatus,
    expertModeSettings,
    // Dynamic level system data
    dynamicLevelEvaluation,
    dynamicLevelProgress,
    dynamicLevelInfo,
    levelRecommendation,
    loading,
    error,
    refreshing,
    advancedLoading,
    systemReady,
    // actions
    loadData,
    refresh,
    completeChallenge
  }
}
