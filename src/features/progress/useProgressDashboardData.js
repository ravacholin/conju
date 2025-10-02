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

export default function useProgressDashboardData() {
  const [heatMapData, setHeatMapData] = useState([])
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [systemReady, setSystemReady] = useState(false)
  const [personFilter] = useState('')

  // AsyncController for managing cancellable operations
  const asyncController = useRef(new AsyncController())

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
        setError(null)
      }

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

      // Define operations with cache integration
      const operations = {
        heatMap: async (signal) => {
          try {
            const cacheKey = `${userId}:heatMap:${personFilter || 'all'}`
            const result = await progressDataCache.get(
              cacheKey,
              () => getHeatMapData(userId, personFilter || null),
              'heatMap'
            )
            if (signal.aborted) throw new Error('Cancelled')

            // Transform array format to object format expected by new components
            if (Array.isArray(result) && result.length > 0) {
              const heatMapObject = {}
              result.forEach(item => {
                if (item.mood && item.tense) {
                  const key = `${item.mood}-${item.tense}`
                  heatMapObject[key] = {
                    mastery: item.score / 100, // Convert score to 0-1 range
                    attempts: item.count || 0,
                    lastAttempt: Date.now() // Use current time as placeholder
                  }
                }
              })
              return { heatMap: heatMapObject }
            }
            return { heatMap: {} }
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load heat map data:', e)
            return { heatMap: {} }
          }
        },

        errorIntel: async (signal) => {
          try {
            const cacheKey = `${userId}:errorIntel`
            const result = await progressDataCache.get(
              cacheKey,
              async () => {
                const { getErrorIntelligence } = await import('../../lib/progress/analytics.js')
                return getErrorIntelligence(userId)
              },
              'errorIntel'
            )
            if (signal.aborted) throw new Error('Cancelled')
            return result && typeof result === 'object' ? result : null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load error intelligence data:', e)
            return null
          }
        },

        userStats: async (signal) => {
          try {
            const cacheKey = `${userId}:userStats`
            const result = await progressDataCache.get(
              cacheKey,
              () => getUserStats(userId),
              'userStats'
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
              () => getWeeklyGoals(userId),
              'weeklyGoals'
            )
            if (signal.aborted) throw new Error('Cancelled')
            return result && typeof result === 'object' ? result : {}
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load weekly goals:', e)
            return {}
          }
        },

        weeklyProgress: async (signal) => {
          try {
            const cacheKey = `${userId}:weeklyProgress`
            const result = await progressDataCache.get(
              cacheKey,
              () => checkWeeklyProgress(userId),
              'weeklyProgress'
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
              () => getRecommendations(userId),
              'recommendations'
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
              () => getDailyChallengeSnapshot(userId),
              'dailyChallenges'
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
            const plan = await generatePersonalizedStudyPlan(userId)
            if (signal.aborted) throw new Error('Cancelled')
            return plan || null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to generate study plan:', e)
            return null
          }
        },

        advancedAnalytics: async (signal) => {
          try {
            const analytics = await getAdvancedAnalytics(userId)
            if (signal.aborted) throw new Error('Cancelled')
            return analytics || null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load advanced analytics:', e)
            return null
          }
        },

        community: async (signal) => {
          try {
            const snapshot = await getCommunitySnapshot(userId)
            if (signal.aborted) throw new Error('Cancelled')
            return snapshot || null
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load community snapshot:', e)
            return null
          }
        },

        offlineStatus: async (signal) => {
          try {
            const status = await getOfflineStatus(true)
            if (signal.aborted) throw new Error('Cancelled')
            return status
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to determine offline status:', e)
            return null
          }
        },

        expertMode: async (signal) => {
          try {
            const settings = getExpertModeSettings(userId)
            if (signal.aborted) throw new Error('Cancelled')
            return settings
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to retrieve expert mode settings:', e)
            return null
          }
        }
      }

      // Execute all operations with proper cancellation and timeout
      const results = await asyncController.current.executeAll(operations, 10000)

      // Update state with results
      setHeatMapData(results.heatMap || [])
      setErrorIntel(results.errorIntel || null)
      setUserStats(results.userStats || {})
      setWeeklyGoals(results.weeklyGoals || {})
      setWeeklyProgress(results.weeklyProgress || {})
      setRecommendations(results.recommendations || [])
      setDailyChallenges(results.dailyChallenges || { date: null, metrics: {}, challenges: [] })
      setStudyPlan(results.studyPlan || null)
      setAdvancedAnalytics(results.advancedAnalytics || null)
      setCommunitySnapshot(results.community || null)
      setOfflineStatus(results.offlineStatus || null)
      setExpertModeSettings(results.expertMode || getExpertModeSettings(userId))

      setError(null)
      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err)
      setError(err.message || 'Error desconocido al cargar datos')
      setLoading(false)
      setRefreshing(false)
    }
  }, [personFilter]) // Only depend on personFilter since other state setters are stable

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
          loadData()
        } else {
          setError('Sistema de progreso inicializado pero usuario no disponible.')
          setLoading(false)
        }
      }
    })

    return unsubscribe
  }, [loadData])

  useEffect(() => {
    if (systemReady) {
      loadData()
    }
  }, [personFilter, systemReady])

  useEffect(() => {
    const unsubscribePlan = onStudyPlanUpdated(({ plan }) => setStudyPlan(plan))
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
    loading,
    error,
    refreshing,
    systemReady,
    // actions
    loadData,
    refresh,
    completeChallenge
  }
}
