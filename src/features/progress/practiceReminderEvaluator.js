import { normalizeReminderDays } from './practiceReminderScheduler.js'

function buildTodayKey(now) {
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
}

export function shouldTriggerPracticeReminder({
  now = new Date(),
  reminderEnabled = false,
  reminderTime = '19:00',
  reminderDays = [],
  lastTriggeredKey = '',
  goalType = 'attempts',
  goalValue = 0,
  progressToday = 0
} = {}) {
  if (!reminderEnabled) {
    return {
      shouldNotify: false,
      nextLastTriggeredKey: ''
    }
  }

  const normalizedDays = normalizeReminderDays(reminderDays)
  const todayIndex = now.getDay()
  if (!normalizedDays.includes(todayIndex)) {
    return {
      shouldNotify: false,
      nextLastTriggeredKey: lastTriggeredKey
    }
  }

  const [hoursRaw, minutesRaw] = String(reminderTime || '').split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return {
      shouldNotify: false,
      nextLastTriggeredKey: lastTriggeredKey
    }
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const scheduledMinutes = hours * 60 + minutes
  const todayKey = buildTodayKey(now)

  if (nowMinutes < scheduledMinutes) {
    if (lastTriggeredKey !== todayKey) {
      return {
        shouldNotify: false,
        nextLastTriggeredKey: lastTriggeredKey
      }
    }

    // User moved reminder time backwards: allow one more notification later today.
    return {
      shouldNotify: false,
      nextLastTriggeredKey: ''
    }
  }

  if (lastTriggeredKey === todayKey) {
    return {
      shouldNotify: false,
      nextLastTriggeredKey: lastTriggeredKey
    }
  }

  const target = Number(goalValue) > 0
    ? Number(goalValue)
    : goalType === 'minutes' ? 15 : 20
  const current = Number(progressToday) || 0

  if (target > 0 && current >= target) {
    return {
      shouldNotify: false,
      nextLastTriggeredKey: todayKey
    }
  }

  return {
    shouldNotify: true,
    nextLastTriggeredKey: todayKey,
    target
  }
}
