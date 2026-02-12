import { describe, expect, it } from 'vitest'
import { shouldTriggerPracticeReminder } from './practiceReminderEvaluator.js'

describe('practiceReminderEvaluator', () => {
  it('triggers when scheduled time passed and goal not reached', () => {
    const now = new Date(2026, 1, 10, 19, 30, 0, 0)
    const dayIndex = now.getDay()
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
    const result = shouldTriggerPracticeReminder({
      now,
      reminderEnabled: true,
      reminderTime: '19:00',
      reminderDays: [dayIndex],
      lastTriggeredKey: '',
      goalType: 'attempts',
      goalValue: 20,
      progressToday: 5
    })

    expect(result.shouldNotify).toBe(true)
    expect(result.nextLastTriggeredKey).toBe(todayKey)
    expect(result.target).toBe(20)
  })

  it('does not trigger when goal is already completed', () => {
    const now = new Date(2026, 1, 10, 19, 30, 0, 0)
    const dayIndex = now.getDay()
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
    const result = shouldTriggerPracticeReminder({
      now,
      reminderEnabled: true,
      reminderTime: '19:00',
      reminderDays: [dayIndex],
      lastTriggeredKey: '',
      goalType: 'minutes',
      goalValue: 15,
      progressToday: 30
    })

    expect(result.shouldNotify).toBe(false)
    expect(result.nextLastTriggeredKey).toBe(todayKey)
  })

  it('resets trigger state when user moves reminder time backwards', () => {
    const now = new Date(2026, 1, 10, 18, 10, 0, 0)
    const dayIndex = now.getDay()
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
    const result = shouldTriggerPracticeReminder({
      now,
      reminderEnabled: true,
      reminderTime: '19:00',
      reminderDays: [dayIndex],
      lastTriggeredKey: todayKey,
      goalType: 'attempts',
      goalValue: 20,
      progressToday: 0
    })

    expect(result.shouldNotify).toBe(false)
    expect(result.nextLastTriggeredKey).toBe('')
  })
})
