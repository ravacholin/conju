import React from 'react'
import { useSettings } from '../../state/settings.js'

const GOAL_TYPES = {
  attempts: { key: 'attemptsToday', unit: 'intentos' },
  minutes: { key: 'focusMinutesToday', unit: 'min' }
}

function getMasteryColor(ratio) {
  if (ratio >= 0.7) return '#7de9b8'
  if (ratio >= 0.4) return '#f5d688'
  return '#ff9f7a'
}

export default function SummaryStrip({ srsStats, userStats, onSRSReview }) {
  const settings = useSettings()
  const stats = userStats || {}

  const itemsDue = srsStats?.total || 0
  const streak = stats.streakDays || 0

  const totalMastery = stats.totalMastery ?? stats.overallMastery ?? stats.averageMastery ?? stats.accuracy ?? 0
  const masteryRatio = Math.min(1, Math.max(0, totalMastery > 1 ? totalMastery / 100 : totalMastery))
  const masteryPercent = Math.round(masteryRatio * 100)

  const goalType = settings.dailyGoalType || 'attempts'
  const goalConfig = GOAL_TYPES[goalType] || GOAL_TYPES.attempts
  const goalValue = Number(settings.dailyGoalValue) || 20
  const currentRaw = stats?.[goalConfig.key]
  const current = Number.isFinite(currentRaw) ? currentRaw : 0
  const goalProgress = goalValue > 0 ? Math.min(1, current / goalValue) : 0

  const formatGoalValue = (v) => {
    if (!Number.isFinite(v)) return '0'
    return goalType === 'minutes'
      ? (Math.round(v * 10) / 10).toString()
      : Math.round(v).toString()
  }

  return (
    <div className="summary-strip">
      <button
        type="button"
        className={`summary-cell summary-cell--srs ${itemsDue > 0 ? 'has-items' : ''}`}
        onClick={itemsDue > 0 ? onSRSReview : undefined}
        disabled={itemsDue === 0}
      >
        <div className="summary-value" style={itemsDue > 0 ? { color: '#7de9b8' } : { color: '#555' }}>
          {itemsDue}
        </div>
        <div className="summary-label">pendiente{itemsDue !== 1 ? 's' : ''}</div>
      </button>

      <div className="summary-cell">
        <div className="summary-value">{streak}</div>
        <div className="summary-label">racha</div>
      </div>

      <div className="summary-cell">
        <div className="summary-value" style={{ color: getMasteryColor(masteryRatio) }}>
          {masteryPercent}%
        </div>
        <div className="summary-label">dominio</div>
      </div>

      <div className="summary-cell">
        <div className="summary-value">
          {formatGoalValue(current)}/{formatGoalValue(goalValue)}
        </div>
        <div className="summary-label">hoy</div>
        <div className="summary-goal-bar">
          <div className="summary-goal-fill" style={{ width: `${Math.round(goalProgress * 100)}%` }} />
        </div>
      </div>
    </div>
  )
}
