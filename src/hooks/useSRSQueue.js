import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDueSchedules, getMasteryByUser, getUpcomingSchedules } from '../lib/progress/database.js'
import { getCurrentUserId } from '../lib/progress/userManager.js'
import { formatMoodTense } from '../lib/utils/verbLabels.js'
import { useSettings } from '../state/settings.js'
import { maybeNotifySRSReview } from '../lib/progress/SRSNotifications.js'

function computeUrgency(nextDue, now) {
  const diffHours = (new Date(nextDue) - now) / (1000 * 60 * 60)
  if (diffHours < 0) return 4
  if (diffHours < 6) return 3
  if (diffHours < 24) return 2
  return 1
}

function getPersonLabel(person) {
  switch (person) {
    case '1s': return '1ª persona singular'
    case '2s_tu': return '2ª persona singular (tú)'
    case '2s_vos': return '2ª persona singular (vos)'
    case '3s': return '3ª persona singular'
    case '1p': return '1ª persona plural'
    case '2p_vosotros': return '2ª persona plural (vosotros)'
    case '3p': return '3ª persona plural'
    default: return person
  }
}

function summarizeQueue(items, now = new Date()) {
  const urgent = items.filter((item) => item.urgency >= 3).length
  const overdue = items.filter((item) => new Date(item.nextDue) < now).length
  return {
    total: items.length,
    urgent,
    overdue,
    scheduled: items.length - overdue
  }
}

const MOOD_LABELS = {
  indicative: 'Indicativo',
  subjunctive: 'Subjuntivo',
  imperative: 'Imperativo',
  conditional: 'Condicional',
  infinitive: 'Infinitivo',
  gerund: 'Gerundio'
}

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function bucketUpcomingSchedules(schedules, now = new Date(), days = 7) {
  const base = startOfDay(now)
  const buckets = Array.from({ length: days }, (_, index) => {
    const bucketDate = new Date(base.getTime() + index * DAY_MS)
    const label = index === 0 ? 'Hoy' : index === 1 ? 'Mañana' : `+${index}d`
    return {
      index,
      date: bucketDate.toISOString(),
      label,
      count: 0
    }
  })

  schedules.forEach((schedule) => {
    const due = new Date(schedule.nextDue)
    const diffDays = Math.floor((startOfDay(due) - base) / DAY_MS)
    if (diffDays >= 0 && diffDays < buckets.length) {
      buckets[diffDays].count += 1
    }
  })

  return buckets
}

function buildBreakdowns(queue) {
  const byMood = new Map()
  const byTense = new Map()
  const byPerson = new Map()

  queue.forEach((item) => {
    const moodEntry = byMood.get(item.mood) || {
      key: item.mood,
      label: MOOD_LABELS[item.mood] || item.mood,
      count: 0
    }
    moodEntry.count += 1
    byMood.set(item.mood, moodEntry)

    const tenseKey = `${item.mood}|${item.tense}`
    const tenseEntry = byTense.get(tenseKey) || {
      key: tenseKey,
      label: item.formattedName,
      mood: item.mood,
      tense: item.tense,
      count: 0
    }
    tenseEntry.count += 1
    byTense.set(tenseKey, tenseEntry)

    const personEntry = byPerson.get(item.person) || {
      key: item.person,
      label: item.personLabel || item.person,
      count: 0
    }
    personEntry.count += 1
    byPerson.set(item.person, personEntry)
  })

  const toSortedArray = (map) => Array.from(map.values()).sort((a, b) => b.count - a.count)

  return {
    byMood: toSortedArray(byMood),
    byTense: toSortedArray(byTense),
    byPerson: toSortedArray(byPerson)
  }
}

export function useSRSQueue() {
  const [loading, setLoading] = useState(false)
  const [queue, setQueue] = useState([])
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [insights, setInsights] = useState({
    upcomingBuckets: [],
    breakdown: {
      byMood: [],
      byTense: [],
      byPerson: []
    }
  })
  const {
    srsNotificationsEnabled,
    srsNotificationUrgentThreshold,
    srsNotificationOverdueThreshold,
    srsNotificationCooldownMinutes
  } = useSettings((state) => ({
    srsNotificationsEnabled: state.srsNotificationsEnabled,
    srsNotificationUrgentThreshold: state.srsNotificationUrgentThreshold,
    srsNotificationOverdueThreshold: state.srsNotificationOverdueThreshold,
    srsNotificationCooldownMinutes: state.srsNotificationCooldownMinutes
  }))

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const userId = getCurrentUserId()
      if (!userId) {
        setQueue([])
        return
      }

      const now = new Date()
      const [dueSchedules, masteryData, upcomingSchedules] = await Promise.all([
        getDueSchedules(userId, now),
        getMasteryByUser(userId),
        getUpcomingSchedules(userId, now, 70)
      ])

      const masteryMap = new Map((masteryData || []).map((record) => [
        `${record.mood}|${record.tense}|${record.person}`,
        record
      ]))

      const enriched = (dueSchedules || []).map((schedule) => {
        const key = `${schedule.mood}|${schedule.tense}|${schedule.person}`
        const mastery = masteryMap.get(key) || { score: 0 }
        return {
          ...schedule,
          masteryScore: mastery.score,
          formattedName: formatMoodTense(schedule.mood, schedule.tense),
          personLabel: getPersonLabel(schedule.person),
          urgency: computeUrgency(schedule.nextDue, now)
        }
      }).sort((a, b) => {
        if (a.urgency !== b.urgency) return b.urgency - a.urgency
        return a.masteryScore - b.masteryScore
      })

      setQueue(enriched)
      const summary = summarizeQueue(enriched, now)
      if (srsNotificationsEnabled) {
        maybeNotifySRSReview(
          { ...summary, dueNow: summary.urgent },
          {
            enabled: srsNotificationsEnabled,
            urgentThreshold: srsNotificationUrgentThreshold,
            overdueThreshold: srsNotificationOverdueThreshold,
            cooldownMinutes: srsNotificationCooldownMinutes
          }
        )
      }
      const breakdown = buildBreakdowns(enriched)
      const upcomingBuckets = bucketUpcomingSchedules(upcomingSchedules, now, 7)
      setInsights({
        upcomingBuckets,
        breakdown
      })
      setLastUpdated(now)
    } catch (err) {
      console.error('Failed to load SRS queue:', err)
      setError(err.message || 'No se pudo cargar la cola de repaso')
    } finally {
      setLoading(false)
    }
  }, [
    srsNotificationsEnabled,
    srsNotificationCooldownMinutes,
    srsNotificationOverdueThreshold,
    srsNotificationUrgentThreshold
  ])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const stats = useMemo(() => {
    const summary = summarizeQueue(queue, new Date())
    return {
      ...summary,
      dueNow: summary.urgent
    }
  }, [queue])

  return {
    queue,
    loading,
    error,
    stats,
    insights,
    lastUpdated,
    reload: loadQueue
  }
}
