import { useEffect, useRef, useState } from 'react'
import { getHeatMapData, getUserStats, getWeeklyGoals, checkWeeklyProgress, getRecommendations } from '../../lib/progress/analytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { progressDataCache } from '../../lib/cache/ProgressDataCache.js'
import { AsyncController } from '../../lib/utils/AsyncController.js'

export default function useProgressDashboardData() {
  const [heatMapData, setHeatMapData] = useState([])
  const [errorIntel, setErrorIntel] = useState(null)
  const [userStats, setUserStats] = useState({})
  const [weeklyGoals, setWeeklyGoals] = useState({})
  const [weeklyProgress, setWeeklyProgress] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [systemReady, setSystemReady] = useState(false)
  const [personFilter] = useState('')

  // AsyncController for managing cancellable operations
  const asyncController = useRef(new AsyncController())

  const loadData = async (isRefresh = false) => {
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
            return Array.isArray(result) ? result : []
          } catch (e) {
            if (!signal.aborted) console.warn('Failed to load heat map data:', e)
            return []
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

      setError(null)
      setLoading(false)
      setRefreshing(false)
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err)
      setError(err.message || 'Error desconocido al cargar datos')
      setLoading(false)
      setRefreshing(false)
    }
  }

  const refresh = () => {
    const userId = getCurrentUserId()
    if (userId) {
      progressDataCache.invalidateUser(userId)
    }
    loadData(true)
  }

  // Check if progress system is ready
  useEffect(() => {
    const checkSystemReady = async () => {
      try {
        // Wait for user ID to be available
        let attempts = 0
        const maxAttempts = 50 // 5 seconds max

        while (attempts < maxAttempts) {
          const userId = getCurrentUserId()
          if (userId) {
            setSystemReady(true)
            loadData()
            return
          }
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        // If we get here, system didn't initialize properly
        setError('Sistema de progreso no inicializado. Refresca la página.')
        setLoading(false)
      } catch (err) {
        console.error('Error checking system readiness:', err)
        setError('Error al verificar sistema de progreso')
        setLoading(false)
      }
    }

    checkSystemReady()
  }, [])

  useEffect(() => {
    if (systemReady) {
      loadData()
    }
  }, [personFilter, systemReady])

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
    loading,
    error,
    refreshing,
    systemReady,
    // actions
    loadData,
    refresh
  }
}
