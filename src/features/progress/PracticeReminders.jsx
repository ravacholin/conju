import React, { useEffect, useMemo, useRef } from 'react'
import { useSettings } from '../../state/settings.js'

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const normalizeTime = (time) => {
  if (typeof time !== 'string' || !time.includes(':')) {
    return '19:00'
  }
  const [hours, minutes] = time.split(':')
  const normalizedHours = String(Math.max(0, Math.min(23, Number(hours) || 0))).padStart(2, '0')
  const normalizedMinutes = String(Math.max(0, Math.min(59, Number(minutes) || 0))).padStart(2, '0')
  return `${normalizedHours}:${normalizedMinutes}`
}

export default function PracticeReminders({
  reminders = [],
  userStats = {},
  onNavigateToDrill,
  onShowToast
}) {
  const {
    dailyGoalType,
    dailyGoalValue,
    practiceReminderEnabled,
    practiceReminderTime,
    practiceReminderDays,
    setPracticeReminderEnabled,
    setPracticeReminderTime,
    togglePracticeReminderDay
  } = useSettings()

  const normalizedTime = normalizeTime(practiceReminderTime)
  const reminderDays = Array.isArray(practiceReminderDays) && practiceReminderDays.length > 0
    ? practiceReminderDays
    : [0, 1, 2, 3, 4, 5, 6]

  const sortedReminders = useMemo(() => {
    if (!Array.isArray(reminders)) return []
    return [...reminders].sort((a, b) => {
      const priorityA = PRIORITY_ORDER[a?.priority] ?? 99
      const priorityB = PRIORITY_ORDER[b?.priority] ?? 99
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      return (a?.message || '').localeCompare(b?.message || '')
    })
  }, [reminders])

  const goalUnit = dailyGoalType === 'minutes' ? 'minutos' : 'intentos'
  const goalValue = Number.isFinite(Number(dailyGoalValue)) ? Number(dailyGoalValue) : 0
  const progressToday = dailyGoalType === 'minutes'
    ? Number(userStats?.focusMinutesToday) || 0
    : Number(userStats?.attemptsToday) || 0
  const progressPercent = goalValue > 0 ? Math.min(100, Math.round((progressToday / goalValue) * 100)) : 0

  const lastTriggeredRef = useRef('')

  useEffect(() => {
    if (!practiceReminderEnabled) {
      lastTriggeredRef.current = ''
      return undefined
    }

    const checkReminder = () => {
      const now = new Date()
      const todayIndex = now.getDay()
      if (!reminderDays.includes(todayIndex)) {
        return
      }

      const [hours, minutes] = normalizeTime(practiceReminderTime).split(':').map(Number)
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        return
      }

      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const scheduledMinutes = hours * 60 + minutes
      const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`

      if (nowMinutes < scheduledMinutes) {
        if (lastTriggeredRef.current !== todayKey) {
          return
        }
        // Permitir un nuevo recordatorio si el usuario editó la hora hacia atrás
        lastTriggeredRef.current = ''
        return
      }

      if (lastTriggeredRef.current === todayKey) {
        return
      }

      const target = goalValue > 0 ? goalValue : (dailyGoalType === 'minutes' ? 15 : 20)
      const current = progressToday

      if (target > 0 && current >= target) {
        lastTriggeredRef.current = todayKey
        return
      }

      lastTriggeredRef.current = todayKey
      const unitLabel = goalUnit
      onShowToast?.({
        message: `¿Ya alcanzaste tu meta diaria de ${target} ${unitLabel}? ¡Un repaso rápido aún cuenta!`,
        type: 'info',
        duration: 4200
      })
    }

    const interval = window.setInterval(checkReminder, 60000)
    // Ejecutar una comprobación inmediata para usuarios atrasados
    checkReminder()

    return () => {
      window.clearInterval(interval)
    }
  }, [
    practiceReminderEnabled,
    practiceReminderTime,
    reminderDays,
    goalUnit,
    goalValue,
    progressToday,
    onShowToast
  ])

  const handleQuickEnable = () => {
    if (!practiceReminderEnabled) {
      setPracticeReminderEnabled(true)
    }
    setPracticeReminderTime(normalizedTime)
    onShowToast?.({
      message: `Recordatorio diario activado a las ${normalizedTime}.`,
      type: 'success',
      duration: 3200
    })
  }

  const handleToggleDay = (dayIndex) => {
    togglePracticeReminderDay?.(dayIndex)
  }

  const renderReminderCard = (reminder) => {
    if (!reminder) return null
    const priorityClass = `priority-${reminder.priority || 'low'}`
    return (
      <li key={reminder.id || reminder.message} className={`reminder-card ${priorityClass}`}>
        <div className="reminder-text">{reminder.message}</div>
        <div className="reminder-actions">
          <button type="button" className="reminder-button" onClick={handleQuickEnable}>
            Activar recordatorio diario
          </button>
          {onNavigateToDrill && (
            <button type="button" className="reminder-button secondary" onClick={onNavigateToDrill}>
              Practicar ahora
            </button>
          )}
        </div>
      </li>
    )
  }

  return (
    <div className="practice-reminders">
      <div className="section-header">
        <h2>
          <img src="/icons/bell.png" alt="Recordatorios" className="section-icon" />
          Recordatorios inteligentes
        </h2>
        <p>
          Usa avisos automáticos para cumplir tu meta diaria de {goalValue} {goalUnit}. Actualmente llevas {progressToday}{' '}
          {goalUnit} ({progressPercent}% completado).
        </p>
      </div>

      <div className="reminder-settings">
        <div className="setting-row">
          <label className="toggle">
            <input
              type="checkbox"
              checked={practiceReminderEnabled}
              onChange={(event) => setPracticeReminderEnabled(event.target.checked)}
            />
            <span>Activar recordatorio diario</span>
          </label>
        </div>

        <div className="setting-row">
          <label className="setting-field" htmlFor="practice-reminder-time">
            <span>Hora del aviso</span>
            <input
              id="practice-reminder-time"
              type="time"
              value={normalizedTime}
              onChange={(event) => setPracticeReminderTime(event.target.value)}
              disabled={!practiceReminderEnabled}
            />
          </label>
        </div>

        <div className="setting-row days-picker">
          <span>Días activos</span>
          <div className="weekday-grid" role="group" aria-label="Días con recordatorio">
            {WEEKDAY_LABELS.map((label, index) => {
              const active = reminderDays.includes(index)
              return (
                <button
                  key={label}
                  type="button"
                  className={`weekday ${active ? 'active' : ''}`}
                  onClick={() => handleToggleDay(index)}
                  aria-pressed={active}
                  disabled={!practiceReminderEnabled}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {sortedReminders.length > 0 ? (
        <ul className="reminder-list">
          {sortedReminders.map(renderReminderCard)}
        </ul>
      ) : (
        <div className="reminder-empty">
          <p>
            ¡Todo al día! Tus sesiones recientes cumplen los objetivos. Mantén los avisos activos para sostener el ritmo.
          </p>
        </div>
      )}
    </div>
  )
}
