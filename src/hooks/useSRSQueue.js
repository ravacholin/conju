import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDueSchedules, getMasteryByUser } from '../lib/progress/database.js'
import { getCurrentUserId } from '../lib/progress/userManager/index.js'
import { formatMoodTense } from '../lib/utils/verbLabels.js'

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

export function useSRSQueue() {
  const [loading, setLoading] = useState(false)
  const [queue, setQueue] = useState([])
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

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
      const [dueSchedules, masteryData] = await Promise.all([
        getDueSchedules(userId, now),
        getMasteryByUser(userId)
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
      setLastUpdated(now)
    } catch (err) {
      console.error('Failed to load SRS queue:', err)
      setError(err.message || 'No se pudo cargar la cola de repaso')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const stats = useMemo(() => {
    const now = new Date()
    const urgent = queue.filter((item) => item.urgency >= 3).length
    const overdue = queue.filter((item) => new Date(item.nextDue) < now).length
    return {
      total: queue.length,
      urgent,
      overdue,
      scheduled: queue.length - overdue
    }
  }, [queue])

  return {
    queue,
    loading,
    error,
    stats,
    lastUpdated,
    reload: loadQueue
  }
}
