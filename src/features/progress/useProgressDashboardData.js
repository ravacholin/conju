import { useEffect, useRef, useState, useCallback } from 'react'
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
import { progressDataCache, resolveProgressUpdateKeys } from '../../lib/cache/ProgressDataCache.js'
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
import { createProgressUpdateBatcher } from './progressUpdateBatcher.js'
import { createLazyTaskScheduler } from './lazyTaskScheduler.js'
import { onProgressEvent, PROGRESS_EVENTS } from '../../lib/events/progressEventBus.js'

const PRIMARY_DATA_KEYS = ['heatMap', 'userStats', 'weeklyGoals', 'weeklyProgress', 'recommendations', 'dailyChallenges', 'errorIntel', 'studyPlan']

const SECONDARY_DATA_KEYS = [
  'pronunciationStats',
  'advancedAnalytics',
  'community',
  'offlineStatus',
  'expertMode',
  'dynamicLevelEvaluation',
  'dynamicLevelProgress',
  'dynamicLevelInfo',
  'levelRecommendation'
]

const HEAVY_ANALYTICS_KEYS = [
  'errorIntel',
  ...SECONDARY_DATA_KEYS
]

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

export default function useProgressDashboardData(options = {}) {
  const { enableSecondaryData = true } = options
  const [heatMapData, setHeatMapData] = useState(null)
  const [errorIntel, setErrorIntel] = useState(null)
  const [userStats, setUserStats] = useState({})
  const [weeklyGoals, setWeeklyGoals] = useState({})
  const [weeklyProgress, setWeeklyProgress] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [practiceReminders, setPracticeReminders] = useState([])
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
  const heavyLoadSchedulerRef = useRef(createLazyTaskScheduler())

  const buildPracticeReminders = useCallback((stats) => {
    const reminders = []
    const totalAttempts = Number(stats?.totalAttempts ?? stats?.attemptsTotal ?? stats?.total ?? 0)
    const lastAttemptAt = stats?.lastAttemptAt ?? stats?.lastAttempt ?? null

    if (!totalAttempts && !lastAttemptAt) {
      reminders.push({
        id: 'no-practice-yet',
        priority: 'high',
        message: 'Todavía no registraste práctica reciente. Hacé una sesión corta para empezar a medir tu progreso.'
      })
    }

    return reminders
  }, [])

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

    if (status === 'success' && PRIMARY_DATA_KEYS.includes(key)) {
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
        const nextStats = value || {}
        setUserStats(nextStats)
        setPracticeReminders(buildPracticeReminders(nextStats))
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
          const cacheKey = `${userId}:studyPlan`
          const plan = await progressDataCache.get(
            cacheKey,
            ({ signal: cacheSignal }) => generatePersonalizedStudyPlan(userId, { signal: cacheSignal }),
            'studyPlan',
            { signal }
          )
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
          const cacheKey = `${userId}:advancedAnalytics`
          const analytics = await progressDataCache.get(
            cacheKey,
            ({ signal: cacheSignal }) => getAdvancedAnalytics(userId, cacheSignal),
            'advancedAnalytics',
            { signal }
          )
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
          const cacheKey = `${userId}:community`
          const snapshot = await progressDataCache.get(
            cacheKey,
            ({ signal: cacheSignal }) => getCommunitySnapshot(userId, { signal: cacheSignal }),
            'community',
            { signal }
          )
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
          const cacheKey = `${userId}:offlineStatus`
          const status = await progressDataCache.get(
            cacheKey,
            ({ signal: cacheSignal }) => getOfflineStatus(true, { signal: cacheSignal }),
            'offlineStatus',
            { signal }
          )
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
          const cacheKey = `${userId}:expertMode`
          const settings = await progressDataCache.get(
            cacheKey,
            async ({ signal: cacheSignal }) => {
              if (cacheSignal?.aborted) throw new Error('Cancelled')
              return getExpertModeSettings(userId)
            },
            'expertMode',
            { signal }
          )
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
          const cacheKey = `${userId}:dynamicLevelEvaluation`
          const evaluation = await progressDataCache.get(
            cacheKey,
            ({ signal: cacheSignal }) => getGlobalDynamicEvaluation({ signal: cacheSignal }),
            'dynamicLevelEvaluation',
            { signal }
          )
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
          const cacheKey = `${userId}:dynamicLevelProgress`
          const progress = await progressDataCache.get(
            cacheKey,
            ({ signal: cacheSignal }) => getGlobalDynamicProgress({ signal: cacheSignal }),
            'dynamicLevelProgress',
            { signal }
          )
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
          const cacheKey = `${userId}:dynamicLevelInfo`
          const info = await progressDataCache.get(
            cacheKey,
            ({ signal: cacheSignal }) => getGlobalDynamicLevelInfo({ signal: cacheSignal }),
            'dynamicLevelInfo',
            { signal }
          )
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
          const cacheKey = `${userId}:levelRecommendation`
          const recommendation = await progressDataCache.get(
            cacheKey,
            ({ signal: cacheSignal }) => checkGlobalLevelRecommendation({ signal: cacheSignal }),
            'levelRecommendation',
            { signal }
          )
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
    async (keys, { userId, timeout = 10000, throwOnFailure = false } = {}) => {
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
          operations[key] = async (signal) => ({
            ok: true,
            value: await definition.loader(signal)
          })
          applicable.push([key, definition])
        }
      })

      if (applicable.length === 0) {
        return {}
      }

      const results = await asyncController.current.executeAll(operations, timeout)
      const normalizedResults = {}
      const failedKeys = []

      applicable.forEach(([key, definition]) => {
        const payload = results[key]
        if (!payload || payload.ok !== true) {
          failedKeys.push(key)
          return
        }

        try {
          definition.apply?.(payload.value)
          normalizedResults[key] = payload.value
        } catch (applyError) {
          logger.warn('runOperations', `Failed to apply result for ${key}`, applyError)
          failedKeys.push(key)
        }
      })

      if (throwOnFailure && failedKeys.length > 0) {
        const error = new Error(`Failed operations: ${failedKeys.join(', ')}`)
        error.failedKeys = failedKeys
        throw error
      }

      return normalizedResults
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
      const trackedKeys = [...PRIMARY_DATA_KEYS, ...SECONDARY_DATA_KEYS]
      const initialStatus = trackedKeys.reduce((acc, key) => {
        const isSecondary = SECONDARY_DATA_KEYS.includes(key)
        acc[key] = !enableSecondaryData && isSecondary ? 'idle' : 'loading'
        return acc
      }, {})
      sectionStatusRef.current = initialStatus
      setSectionStatus(initialStatus)
    }

    try {
      heavyLoadSchedulerRef.current.cancel()
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
          await runOperations([key], { userId, throwOnFailure: true })
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
        PRIMARY_DATA_KEYS.map(key => loadTrackedKey(key, { updateLoading: !isRefresh }))
      )
      const hasCoreSuccess = coreResults.some(result => result.success)

      if (!hasCoreSuccess) {
        const firstError = coreResults.find(result => !result.success)?.error
        throw firstError || new Error('No se pudieron cargar los datos principales.')
      }

      if (!isRefresh) {
        if (!enableSecondaryData) {
          return
        }

        const startHeavyLoad = () => {
          const pendingKeys = HEAVY_ANALYTICS_KEYS.filter(
            key => sectionStatusRef.current[key] !== 'success' && sectionStatusRef.current[key] !== 'idle'
          )

          if (pendingKeys.length === 0) {
            return
          }

          Promise.all(pendingKeys.map(key => loadTrackedKey(key, { errorLog: 'error' })))
            .then(results => {
              const failedKeys = results.filter(result => !result.success).map(result => result.key)
              if (failedKeys.length > 0) {
                logger.error('loadData', 'Lazy heavy analytics failed, triggering failsafe', { failedKeys })
                return Promise.all(
                  failedKeys.map(key => loadTrackedKey(key, { errorLog: 'error' }))
                )
              }
              return null
            })
            .catch((error) => {
              logger.error('loadData', 'Unexpected lazy heavy analytics error', error)
            })
        }

        heavyLoadSchedulerRef.current.schedule(startHeavyLoad, {
          idleTimeout: 3000,
          fallbackTimeout: 5000,
          onFallback: () => {
            logger.warn('loadData', 'Lazy loading taking too long, falling back to scheduled run')
          }
        })
      } else if (enableSecondaryData) {
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
  }, [enableSecondaryData, runOperations, updateSectionStatus])

  const refreshFromEvent = useCallback(
    async (detail = {}, operationKeysOverride) => {
      const userId = getCurrentUserId()

      if (!userId) {
        return loadData(true)
      }

      const operationKeysRaw = Array.isArray(operationKeysOverride)
        ? operationKeysOverride
        : resolveProgressUpdateKeys(detail)
      const operationKeys = enableSecondaryData
        ? operationKeysRaw
        : operationKeysRaw?.filter((key) => !SECONDARY_DATA_KEYS.includes(key))

      if (!operationKeys || operationKeys.length === 0) {
        return loadData(true)
      }

      setRefreshing(true)

      try {
        progressDataCache.invalidateByDataType(operationKeys, userId)

        operationKeys.forEach((key) => {
          if (sectionStatusRef.current[key] !== 'loading') {
            updateSectionStatus(key, 'loading')
          }
        })

        const result = await runOperations(operationKeys, { userId, throwOnFailure: true })

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
    [enableSecondaryData, loadData, runOperations, updateSectionStatus]
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
    if (!systemReady || !enableSecondaryData) {
      return
    }

    const userId = getCurrentUserId()
    if (!userId) {
      return
    }

    const pendingSecondary = SECONDARY_DATA_KEYS.filter(
      (key) => sectionStatusRef.current[key] !== 'success'
    )

    if (pendingSecondary.length === 0) {
      return
    }

    let cancelled = false
    Promise.all(
      pendingSecondary.map((key) => {
        if (sectionStatusRef.current[key] !== 'loading') {
          updateSectionStatus(key, 'loading')
        }
        return runOperations([key], { userId, throwOnFailure: true })
          .then(() => {
            if (!cancelled) {
              updateSectionStatus(key, 'success')
            }
          })
          .catch((error) => {
            if (!cancelled) {
              updateSectionStatus(key, 'error')
              logger.warn('loadSecondaryData', `Failed to load deferred section ${key}`, error)
            }
          })
      })
    ).catch((error) => {
      if (!cancelled) {
        logger.warn('loadSecondaryData', 'Unexpected deferred load error', error)
      }
    })

    return () => {
      cancelled = true
    }
  }, [enableSecondaryData, runOperations, systemReady, updateSectionStatus])

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
    let mounted = true
    const updateBatcher = createProgressUpdateBatcher({
      delay: 400,
      onFlush: ({ fullRefresh, keys }) => {
        if (!mounted) return

        const task = fullRefresh || !keys || keys.length === 0
          ? () => loadData(true)
          : () => refreshFromEvent({}, keys)

        Promise.resolve(task()).catch(error => {
          logger.warn('scheduleRefresh', 'Dashboard refresh task failed', error)
        })
      }
    })

    const handleProgressUpdate = (detail = {}) => {
      const operationKeys = resolveProgressUpdateKeys(detail)

      if (import.meta.env?.DEV) {
        logger.debug('handleProgressUpdate', '🔄 Datos de progreso actualizados', { detail, operationKeys })
      }

      updateBatcher.addUpdate(operationKeys)
    }

    const unsubscribe = onProgressEvent(PROGRESS_EVENTS.DATA_UPDATED, handleProgressUpdate, { validate: true })

    return () => {
      mounted = false
      updateBatcher.dispose()
      unsubscribe()
    }
  }, [loadData, refreshFromEvent])

  // Cleanup async operations on component unmount
  useEffect(() => {
    return () => {
      heavyLoadSchedulerRef.current.cancel()
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
    practiceReminders,
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
    // actions
    loadData,
    refresh,
    refreshFromEvent,
    completeChallenge
  }
}
