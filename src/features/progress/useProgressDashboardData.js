import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  getHeatMapData,
  getUserStats,
  getWeeklyGoals,
  checkWeeklyProgress,
  getRecommendations,
  getAdvancedAnalytics,
  getPronunciationStats
} from '../../lib/progress/analytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager/index.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('progress:dashboard')
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

const CORE_DATA_KEYS = ['heatMap', 'userStats', 'weeklyGoals', 'weeklyProgress', 'recommendations', 'dailyChallenges', 'pronunciationStats']

const HEAVY_ANALYTICS_KEYS = [
  'errorIntel',
  'studyPlan',
  'advancedAnalytics',
  'community',
  'offlineStatus',
  'expertMode',
  'dynamicLevelEvaluation',
  'dynamicLevelProgress',
  'dynamicLevelInfo',
  'levelRecommendation'
]

const EVENT_TYPE_TO_KEYS = {
  challenge_completed: ['dailyChallenges', 'weeklyGoals', 'weeklyProgress', 'userStats'],
  drill_result: CORE_DATA_KEYS,
  practice_session: CORE_DATA_KEYS,
  mastery_update: ['heatMap', 'userStats', 'recommendations'],
  error_logged: ['errorIntel', 'recommendations'],
  settings_change: ['recommendations', 'heatMap']
}

const resolveKeysFromDetail = (detail = {}) => {
  if (!detail || detail.forceFullRefresh || detail.fullRefresh) {
    return null
  }

  const { type, attemptId, challengeId, mood, tense, person } = detail

  if (type === 'sync') {
    return null
  }

  if (type && EVENT_TYPE_TO_KEYS[type]) {
    return EVENT_TYPE_TO_KEYS[type]
  }

  if (attemptId || mood || tense || person) {
    return CORE_DATA_KEYS
  }

  if (challengeId) {
    return ['dailyChallenges']
  }

  return null
}

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
  const [pronunciationStats, setPronunciationStats] = useState({ totalAttempts: 0, recentAttempts: [] })
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
  const [personFilter] = useState('')
  const [sectionStatus, setSectionStatus] = useState({})
  const [initialSectionsReady, setInitialSectionsReady] = useState(false)

  // AsyncController for managing cancellable operations
  const asyncController = useRef(new AsyncController())
  const hasInitialLoad = useRef(false)
  const lastPersonFilterRef = useRef(personFilter)
  const sectionStatusRef = useRef({})
  const firstCoreLoadedRef = useRef(false)

  const updateSectionStatus = useCallback((key, status) => {
    if (!key) {
      return
    }

    sectionStatusRef.current = {
      ...sectionStatusRef.current,
      [key]: status
    }

    setSectionStatus(prev => {
      if (prev[key] === status) {
        return prev
      }
      return {
        ...prev,
        [key]: status
      }
    })

    if (status === 'success' && CORE_DATA_KEYS.includes(key)) {
      if (!firstCoreLoadedRef.current) {
        firstCoreLoadedRef.current = true
        setInitialSectionsReady(true)
        setLoading(false)
      }
    }
  }, [setInitialSectionsReady, setLoading])

  const getOperationDefinitions = (userId) => ({
    heatMap: {
      loader: async (signal) => {
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
          if (!signal.aborted) logger.warn('getOperationDefinitions:heatMap', 'Failed to load heat map data', e)
          return normalizeHeatMapResult(null, 'all')
        }
      },
      apply: (value) => {
        setHeatMapData(value || normalizeHeatMapResult(null, 'all'))
      }
    },
    errorIntel: {
      loader: async (signal) => {
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
          if (!signal.aborted) logger.warn('getOperationDefinitions:errorIntel', 'Failed to load error intelligence data', e)
          return null
        }
      },
      apply: (value) => {
        setErrorIntel(value || null)
      }
    },
    userStats: {
      loader: async (signal) => {
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
          if (!signal.aborted) logger.warn('getOperationDefinitions:userStats', 'Failed to load user stats', e)
          return {}
        }
      },
      apply: (value) => {
        setUserStats(value || {})
      }
    },
    weeklyGoals: {
      loader: async (signal) => {
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
          if (!signal.aborted) logger.warn('getOperationDefinitions:weeklyGoals', 'Failed to load weekly goals', e)
          return {}
        }
      },
      apply: (value) => {
        setWeeklyGoals(value || {})
      }
    },
    weeklyProgress: {
      loader: async (signal) => {
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
          if (!signal.aborted) logger.warn('getOperationDefinitions:weeklyProgress', 'Failed to load weekly progress', e)
          return {}
        }
      },
      apply: (value) => {
        setWeeklyProgress(value || {})
      }
    },
    recommendations: {
      loader: async (signal) => {
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
          if (!signal.aborted) logger.warn('getOperationDefinitions:recommendations', 'Failed to load recommendations', e)
          return []
        }
      },
      apply: (value) => {
        setRecommendations(Array.isArray(value) ? value : [])
      }
    },
    dailyChallenges: {
      loader: async (signal) => {
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
          if (!signal.aborted) logger.warn('getOperationDefinitions:dailyChallenges', 'Failed to load daily challenges', e)
          return { date: null, metrics: {}, challenges: [] }
        }
      },
      apply: (value) => {
        setDailyChallenges(value || { date: null, metrics: {}, challenges: [] })
      }
    },
    pronunciationStats: {
      loader: async (signal) => {
        const emptyStats = {
          totalAttempts: 0,
          successRate: 0,
          averageAccuracy: 0,
          averagePedagogicalScore: 0,
          averageConfidence: 0,
          recentAttempts: []
        }

        try {
          const cacheKey = `${userId}:pronunciationStats`
          const result = await progressDataCache.get(
            cacheKey,
            ({ signal: cacheSignal }) => getPronunciationStats(userId, cacheSignal),
            'pronunciationStats',
            { signal }
          )

          if (signal.aborted) throw new Error('Cancelled')

          if (!result || typeof result !== 'object') {
            return emptyStats
          }

          return {
            totalAttempts: Number.isFinite(result.totalAttempts) ? result.totalAttempts : Number(result.totalAttempts) || 0,
            successRate: Number.isFinite(result.successRate) ? result.successRate : Number(result.successRate) || 0,
            averageAccuracy: Number.isFinite(result.averageAccuracy) ? result.averageAccuracy : Number(result.averageAccuracy) || 0,
            averagePedagogicalScore: Number.isFinite(result.averagePedagogicalScore)
              ? result.averagePedagogicalScore
              : Number(result.averagePedagogicalScore) || 0,
            averageConfidence: Number.isFinite(result.averageConfidence) ? result.averageConfidence : Number(result.averageConfidence) || 0,
            recentAttempts: Array.isArray(result.recentAttempts) ? result.recentAttempts : []
          }
        } catch (e) {
          if (!signal.aborted) logger.warn('getOperationDefinitions:pronunciationStats', 'Failed to load pronunciation stats', e)
          return emptyStats
        }
      },
      apply: (value) => {
        if (!value || typeof value !== 'object') {
          setPronunciationStats({
            totalAttempts: 0,
            successRate: 0,
            averageAccuracy: 0,
            averagePedagogicalScore: 0,
            averageConfidence: 0,
            recentAttempts: []
          })
          return
        }

        setPronunciationStats({
          totalAttempts: Number.isFinite(value.totalAttempts) ? value.totalAttempts : Number(value.totalAttempts) || 0,
          successRate: Number.isFinite(value.successRate) ? value.successRate : Number(value.successRate) || 0,
          averageAccuracy: Number.isFinite(value.averageAccuracy) ? value.averageAccuracy : Number(value.averageAccuracy) || 0,
          averagePedagogicalScore: Number.isFinite(value.averagePedagogicalScore)
            ? value.averagePedagogicalScore
            : Number(value.averagePedagogicalScore) || 0,
          averageConfidence: Number.isFinite(value.averageConfidence) ? value.averageConfidence : Number(value.averageConfidence) || 0,
          recentAttempts: Array.isArray(value.recentAttempts) ? value.recentAttempts : []
        })
      }
    },
    studyPlan: {
      loader: async (signal) => {
        try {
          const plan = await generatePersonalizedStudyPlan(userId, { signal })
          if (signal.aborted) throw new Error('Cancelled')
          return plan || null
        } catch (e) {
          if (!signal.aborted) logger.warn('getOperationDefinitions:studyPlan', 'Failed to generate study plan', e)
          return null
        }
      },
      apply: (value) => {
        setStudyPlan(value || null)
      }
    },
    advancedAnalytics: {
      loader: async (signal) => {
        try {
          const analytics = await getAdvancedAnalytics(userId, signal)
          if (signal.aborted) throw new Error('Cancelled')
          return analytics || null
        } catch (e) {
          if (!signal.aborted) logger.warn('getOperationDefinitions:advancedAnalytics', 'Failed to load advanced analytics', e)
          return null
        }
      },
      apply: (value) => {
        setAdvancedAnalytics(value || null)
      }
    },
    community: {
      loader: async (signal) => {
        try {
          const snapshot = await getCommunitySnapshot(userId, { signal })
          if (signal.aborted) throw new Error('Cancelled')
          return snapshot || null
        } catch (e) {
          if (!signal.aborted) logger.warn('getOperationDefinitions:community', 'Failed to load community snapshot', e)
          return null
        }
      },
      apply: (value) => {
        setCommunitySnapshot(value || null)
      }
    },
    offlineStatus: {
      loader: async (signal) => {
        try {
          const status = await getOfflineStatus(true, { signal })
          if (signal.aborted) throw new Error('Cancelled')
          return status ?? null
        } catch (e) {
          if (!signal.aborted) logger.warn('getOperationDefinitions:offlineStatus', 'Failed to determine offline status', e)
          return null
        }
      },
      apply: (value) => {
        setOfflineStatus(value ?? null)
      }
    },
    expertMode: {
      loader: async (signal) => {
        try {
          if (signal.aborted) throw new Error('Cancelled')
          const settings = getExpertModeSettings(userId)
          if (signal.aborted) throw new Error('Cancelled')
          return settings
        } catch (e) {
          if (!signal.aborted) logger.warn('getOperationDefinitions:expertMode', 'Failed to retrieve expert mode settings', e)
          return null
        }
      },
      apply: (value) => {
        setExpertModeSettings(value ?? getExpertModeSettings(userId))
      }
    },
    dynamicLevelEvaluation: {
      loader: async (signal) => {
        try {
          const evaluation = await getGlobalDynamicEvaluation({ signal })
          if (signal.aborted) throw new Error('Cancelled')
          return evaluation || null
        } catch (e) {
          if (!signal.aborted) logger.warn('getOperationDefinitions:dynamicLevelEvaluation', 'Failed to load dynamic level evaluation', e)
          return null
        }
      },
      apply: (value) => {
        setDynamicLevelEvaluation(value || null)
      }
    },
    dynamicLevelProgress: {
      loader: async (signal) => {
        try {
          const progress = await getGlobalDynamicProgress({ signal })
          if (signal.aborted) throw new Error('Cancelled')
          return progress || null
        } catch (e) {
          if (!signal.aborted) logger.warn('getOperationDefinitions:dynamicLevelProgress', 'Failed to load dynamic level progress', e)
          return null
        }
      },
      apply: (value) => {
        setDynamicLevelProgress(value || null)
      }
    },
    dynamicLevelInfo: {
      loader: async (signal) => {
        try {
          const info = await getGlobalDynamicLevelInfo({ signal })
          if (signal.aborted) throw new Error('Cancelled')
          return info || null
        } catch (e) {
          if (!signal.aborted) logger.warn('getOperationDefinitions:dynamicLevelInfo', 'Failed to load dynamic level info', e)
          return null
        }
      },
      apply: (value) => {
        setDynamicLevelInfo(value || null)
      }
    },
    levelRecommendation: {
      loader: async (signal) => {
        try {
          const recommendation = await checkGlobalLevelRecommendation({ signal })
          if (signal.aborted) throw new Error('Cancelled')
          return recommendation || null
        } catch (e) {
          if (!signal.aborted) logger.warn('getOperationDefinitions:levelRecommendation', 'Failed to check level recommendation', e)
          return null
        }
      },
      apply: (value) => {
        setLevelRecommendation(value || null)
      }
    }
  })

  const runOperations = useCallback(
    async (keys, { userId, timeout = 10000 } = {}) => {
      if (!Array.isArray(keys) || keys.length === 0) {
        return {}
      }

      const definitions = getOperationDefinitions(userId)
      const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))
      const operations = {}
      const applicable = []

      uniqueKeys.forEach((key) => {
        const definition = definitions[key]
        if (definition?.loader) {
          operations[key] = definition.loader
          applicable.push([key, definition])
        }
      })

      if (applicable.length === 0) {
        return {}
      }

      const results = await asyncController.current.executeAll(operations, timeout)

      applicable.forEach(([key, definition]) => {
        try {
          definition.apply?.(results[key])
        } catch (applyError) {
          logger.warn('runOperations', `Failed to apply result for ${key}`, applyError)
        }
      })

      return results
    },
    [personFilter]
  )

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
      setError(null)
      setInitialSectionsReady(false)
      firstCoreLoadedRef.current = false
      const trackedKeys = [...CORE_DATA_KEYS, ...HEAVY_ANALYTICS_KEYS]
      const initialStatus = trackedKeys.reduce((acc, key) => {
        acc[key] = 'loading'
        return acc
      }, {})
      sectionStatusRef.current = initialStatus
      setSectionStatus(initialStatus)
    }

    try {
      asyncController.current.cancelAll()

      const userId = getCurrentUserId()
      if (!userId) {
        throw new Error('Usuario no inicializado. Espera un momento y reintenta.')
      }

      if (!isRefresh) {
        const warmupLoaders = {
          userStats: () => getUserStats(userId),
          weeklyGoals: () => getWeeklyGoals(userId)
        }
        progressDataCache.warmup(userId, warmupLoaders)
      }

      const loadTrackedKey = async (key, { errorLog = 'warn', updateLoading = true } = {}) => {
        const currentStatus = sectionStatusRef.current[key]
        if ((updateLoading || currentStatus === 'error') && currentStatus !== 'loading') {
          updateSectionStatus(key, 'loading')
        }

        try {
          await runOperations([key], { userId })
          updateSectionStatus(key, 'success')
          return { key, success: true }
        } catch (error) {
          updateSectionStatus(key, 'error')
          if (errorLog === 'error') {
            logger.error('loadData', `Failed to load section ${key}`, error)
          } else {
            logger.warn('loadData', `Failed to load section ${key}`, error)
          }
          return { key, success: false, error }
        }
      }

      const coreResults = await Promise.all(
        CORE_DATA_KEYS.map(key => loadTrackedKey(key, { updateLoading: !isRefresh }))
      )
      const hasCoreSuccess = coreResults.some(result => result.success)

      if (!hasCoreSuccess) {
        const firstError = coreResults.find(result => !result.success)?.error
        throw firstError || new Error('No se pudieron cargar los datos principales.')
      }

      if (!isRefresh) {
        let lazyLoadCompleted = false
        let lazyLoadTimeoutId = null
        let fallbackTriggered = false

        const finalizeLazyLoad = () => {
          if (lazyLoadCompleted) {
            return
          }
          lazyLoadCompleted = true
          if (lazyLoadTimeoutId) {
            clearTimeout(lazyLoadTimeoutId)
            lazyLoadTimeoutId = null
          }
        }

        const startHeavyLoad = () => {
          if (lazyLoadCompleted) {
            return
          }

          Promise.all(HEAVY_ANALYTICS_KEYS.map(key => loadTrackedKey(key, { errorLog: 'error' })))
            .then(results => {
              if (fallbackTriggered) {
                return null
              }

              const failedKeys = results.filter(result => !result.success).map(result => result.key)
              if (failedKeys.length > 0) {
                logger.error('loadData', 'Lazy heavy analytics failed, triggering failsafe', { failedKeys })
                return Promise.all(
                  failedKeys.map(key => loadTrackedKey(key, { errorLog: 'error' }))
                )
              }
              return null
            })
            .finally(finalizeLazyLoad)
        }

        lazyLoadTimeoutId = setTimeout(() => {
          if (lazyLoadCompleted) {
            return
          }

          const pendingKeys = HEAVY_ANALYTICS_KEYS.filter(
            key => sectionStatusRef.current[key] !== 'success'
          )

          if (pendingKeys.length === 0) {
            finalizeLazyLoad()
            return
          }

          fallbackTriggered = true
          logger.warn('loadData', 'Lazy loading taking too long, falling back to synchronous load')
          Promise.all(pendingKeys.map(key => loadTrackedKey(key, { errorLog: 'error' })))
            .finally(finalizeLazyLoad)
        }, 5000)

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          window.requestIdleCallback(startHeavyLoad, { timeout: 3000 })
        } else {
          setTimeout(startHeavyLoad, 100)
        }
      } else {
        await runOperations(HEAVY_ANALYTICS_KEYS, { userId })
        HEAVY_ANALYTICS_KEYS.forEach(key => updateSectionStatus(key, 'success'))
      }

      setError(null)
    } catch (err) {
      logger.error('loadData', 'Error al cargar datos del dashboard', err)
      setError(err.message || 'Error desconocido al cargar datos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [runOperations, updateSectionStatus])

  const refreshFromEvent = useCallback(
    async (detail = {}, operationKeysOverride) => {
      const userId = getCurrentUserId()

      if (!userId) {
        return loadData(true)
      }

      const operationKeys = Array.isArray(operationKeysOverride)
        ? operationKeysOverride
        : resolveKeysFromDetail(detail)

      if (!operationKeys || operationKeys.length === 0) {
        return loadData(true)
      }

      setRefreshing(true)

      try {
        operationKeys.forEach((key) => {
          if (sectionStatusRef.current[key] !== 'loading') {
            updateSectionStatus(key, 'loading')
          }
        })

        const result = await runOperations(operationKeys, { userId })

        operationKeys.forEach((key) => updateSectionStatus(key, 'success'))

        return result
      } catch (error) {
        logger.warn('refreshFromEvent', 'Partial dashboard refresh failed, falling back to full reload', error)
        operationKeys.forEach((key) => updateSectionStatus(key, 'error'))
        await loadData(true)
      } finally {
        setRefreshing(false)
      }

      return undefined
    },
    [loadData, runOperations, updateSectionStatus]
  )

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
      logger.error('completeChallenge', 'Error al marcar desafío diario como completado', error)
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
          if (!hasInitialLoad.current) {
            hasInitialLoad.current = true
            setSystemReady(true)
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
    let pendingAction = null
    let mounted = true

    const scheduleRefresh = (action) => {
      if (!mounted) return
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId)
      }
      pendingAction = action
      refreshTimeoutId = setTimeout(() => {
        if (!mounted) return
        const task = pendingAction
        pendingAction = null
        refreshTimeoutId = null
        if (typeof task === 'function') {
          Promise.resolve(task()).catch(error => {
            logger.warn('scheduleRefresh', 'Dashboard refresh task failed', error)
          })
        }
      }, 400)
    }

    const handleProgressUpdate = (event) => {
      const detail = event?.detail || {}
      const operationKeys = resolveKeysFromDetail(detail)

      if (import.meta.env?.DEV) {
        logger.debug('handleProgressUpdate', '🔄 Datos de progreso actualizados', { detail, operationKeys })
      }

      if (!operationKeys || operationKeys.length === 0) {
        scheduleRefresh(() => loadData(true))
      } else {
        scheduleRefresh(() => refreshFromEvent(detail, operationKeys))
      }
    }

    window.addEventListener('progress:dataUpdated', handleProgressUpdate)

    return () => {
      mounted = false
      if (refreshTimeoutId) {
        clearTimeout(refreshTimeoutId)
      }
      window.removeEventListener('progress:dataUpdated', handleProgressUpdate)
    }
  }, [loadData, refreshFromEvent])

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
        logger.debug('cache-stats', '📊 Cache Stats', stats)
      }

      // Log cache stats every 30 seconds in development
      const interval = setInterval(logCacheStats, 30000)
      return () => clearInterval(interval)
    }
  }, [])

  const practiceReminders = useMemo(() => {
    const reminders = []
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000

    const heatMapEntries =
      heatMapData && typeof heatMapData === 'object' && heatMapData.heatMap
        ? Object.entries(heatMapData.heatMap)
        : []

    const lastAttempts = heatMapEntries
      .map(([, entry]) => Number(entry?.lastAttempt))
      .filter(timestamp => Number.isFinite(timestamp) && timestamp > 0)

    const latestAttempt = lastAttempts.length > 0 ? Math.max(...lastAttempts) : null

    if (!latestAttempt) {
      reminders.push({
        id: 'no-practice-yet',
        category: 'activity',
        priority: 'high',
        message: 'Aún no registramos sesiones recientes. Practica un verbo para iniciar tu racha.',
        metadata: {}
      })
    } else {
      const daysSincePractice = Math.max(0, Math.floor((now - latestAttempt) / dayMs))
      if (daysSincePractice >= 2) {
        reminders.push({
          id: 'gap-multi-day',
          category: 'activity',
          priority: 'high',
          message: `Han pasado ${daysSincePractice} días desde tu última práctica. Retoma una sesión corta para evitar perder progreso.`,
          metadata: { daysSincePractice }
        })
      } else if (daysSincePractice === 1) {
        reminders.push({
          id: 'gap-single-day',
          category: 'activity',
          priority: 'medium',
          message: 'Tomaste un descanso ayer. Una sesión rápida hoy mantendrá tu racha activa.',
          metadata: { daysSincePractice }
        })
      }
    }

    const untouchedCells = heatMapEntries.filter(([, entry]) => (entry?.attempts || 0) === 0)
    if (untouchedCells.length > 0) {
      const sample = untouchedCells
        .slice(0, 2)
        .map(([key]) => key.replace('-', ' '))
        .filter(Boolean)
      const detail = sample.length > 0 ? ` (${sample.join(', ')})` : ''
      reminders.push({
        id: 'untouched-areas',
        category: 'coverage',
        priority: 'low',
        message: `Hay ${untouchedCells.length} áreas sin intentos recientes${detail}. Agenda un recordatorio para repasarlas.`,
        metadata: { untouchedCount: untouchedCells.length }
      })
    }

    const sessionsGoal = Number(weeklyGoals?.SESSIONS) || 0
    const sessionsCompleted = Number(weeklyProgress?.sessionsCompleted) || 0
    const sessionsRemaining = Math.max(0, sessionsGoal - sessionsCompleted)
    if (sessionsGoal > 0 && sessionsRemaining >= Math.ceil(sessionsGoal / 2)) {
      reminders.push({
        id: 'sessions-behind',
        category: 'weekly-goal',
        priority: sessionsRemaining >= sessionsGoal ? 'high' : 'medium',
        message: `Quedan ${sessionsRemaining} sesiones para tu meta semanal de ${sessionsGoal}. Programa avisos para distribuirlas mejor.`,
        metadata: { sessionsRemaining, sessionsGoal }
      })
    }

    const attemptsGoal = Number(weeklyGoals?.ATTEMPTS) || 0
    const attemptsMade = Number(weeklyProgress?.attemptsMade) || 0
    const attemptsRemaining = Math.max(0, attemptsGoal - attemptsMade)
    if (attemptsGoal > 0 && attemptsRemaining > attemptsGoal * 0.4) {
      reminders.push({
        id: 'attempts-behind',
        category: 'weekly-goal',
        priority: 'medium',
        message: `Te faltan ${attemptsRemaining} intentos para tu meta semanal (${attemptsGoal}). Considera dividirlos en sesiones diarias.`,
        metadata: { attemptsRemaining, attemptsGoal }
      })
    }

    const focusGoal = Number(weeklyGoals?.FOCUS_TIME) || 0
    const focusMinutes = Number(weeklyProgress?.focusTime) || 0
    if (focusGoal > 0 && focusMinutes < focusGoal * 0.6) {
      reminders.push({
        id: 'focus-time',
        category: 'weekly-goal',
        priority: 'low',
        message: `Llevas ${focusMinutes} minutos enfocados de los ${focusGoal} planeados esta semana. Un recordatorio diario podría ayudarte a cerrar la brecha.`,
        metadata: { focusMinutes, focusGoal }
      })
    }

    const attemptsToday = Number(userStats?.attemptsToday) || 0
    const focusToday = Number(userStats?.focusMinutesToday) || 0
    if (attemptsToday === 0 && focusToday === 0 && latestAttempt) {
      reminders.push({
        id: 'no-progress-today',
        category: 'daily-goal',
        priority: 'medium',
        message: 'Todavía no registramos progreso hoy. Configura un recordatorio para asegurar al menos una mini sesión diaria.',
        metadata: {}
      })
    }

    return reminders
  }, [heatMapData, weeklyGoals, weeklyProgress, userStats])

  return {
    // state
    heatMapData,
    errorIntel,
    userStats,
    weeklyGoals,
    weeklyProgress,
    recommendations,
    dailyChallenges,
    pronunciationStats,
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
    systemReady,
    sectionsStatus: sectionStatus,
    initialSectionsReady,
    practiceReminders,
    // actions
    loadData,
    refresh,
    refreshFromEvent,
    completeChallenge
  }
}
