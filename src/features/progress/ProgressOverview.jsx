import React from 'react'
import AccountButton from '../../components/auth/AccountButton.jsx'
import { useSettings } from '../../state/settings.js'

const GOAL_TYPES = {
  attempts: {
    key: 'attemptsToday',
    label: 'Intentos',
    unit: 'intentos'
  },
  minutes: {
    key: 'focusMinutesToday',
    label: 'Minutos enfocados',
    unit: 'minutos'
  }
}

/**
 * Progress Overview - Clean header with essential stats and navigation
 * Replaces: ProgressHeader, ProgressTracker, WeeklyGoalsPanel
 */
export default function ProgressOverview({
  userStats,
  onNavigateHome,
  onNavigateToDrill,
  _syncing,
  _onSync,
  _syncEnabled,
  _onRefresh
}) {
  const settings = useSettings()
  const stats = userStats || {}
  const streak = stats.streakDays || 0
  const totalAttempts = stats.totalAttempts || 0
  const itemsDue = stats.itemsDue || 0

  const totalMastery =
    stats.totalMastery ??
    stats.overallMastery ??
    stats.averageMastery ??
    stats.accuracy ??
    0

  const masteryRatio = Math.min(
    1,
    Math.max(0, totalMastery > 1 ? totalMastery / 100 : totalMastery)
  )

  const getDominanceLevel = (userLevel, masteryScore) => {
    // Primary level is user's CEFR level
    const cefrLevel = userLevel || 'A1'

    // Get CEFR level colors and descriptions
    const cefrInfo = {
      'A1': { label: 'A1 - Principiante', color: '#4a5568', description: 'Nivel básico inicial' },
      'A2': { label: 'A2 - Elemental', color: '#2d3748', description: 'Nivel básico consolidado' },
      'B1': { label: 'B1 - Intermedio', color: '#2a69ac', description: 'Nivel intermedio' },
      'B2': { label: 'B2 - Intermedio alto', color: '#1a365d', description: 'Nivel intermedio avanzado' },
      'C1': { label: 'C1 - Avanzado', color: '#744210', description: 'Nivel avanzado' },
      'C2': { label: 'C2 - Superior', color: '#553c0e', description: 'Nivel de dominio nativo' }
    }

    const baseInfo = cefrInfo[cefrLevel] || cefrInfo['A1']

    // Add mastery qualifier based on performance within level
    let qualifier = ''
    if (masteryScore >= 0.85) {
      qualifier = ' (Sólido)'
    } else if (masteryScore >= 0.7) {
      qualifier = ' (En progreso)'
    } else if (masteryScore >= 0.4) {
      qualifier = ' (Inicial)'
    } else if (totalAttempts >= 10) {
      qualifier = ' (En desarrollo)'
    }

    return {
      level: baseInfo.label + qualifier,
      color: baseInfo.color,
      description: baseInfo.description
    }
  }

  const masteryInfo = getDominanceLevel(settings.userLevel, masteryRatio)

  const defaultGoalType = settings.dailyGoalType || 'attempts'
  const storedGoalValue = Number(settings.dailyGoalValue)
  const defaultGoalValue = Number.isFinite(storedGoalValue) ? storedGoalValue : 20

  const [goalType, setGoalType] = React.useState(defaultGoalType)
  const [goalValue, setGoalValue] = React.useState(defaultGoalValue)

  React.useEffect(() => {
    setGoalType(settings.dailyGoalType || 'attempts')
  }, [settings.dailyGoalType])

  React.useEffect(() => {
    const numericValue = Number(settings.dailyGoalValue)
    if (Number.isFinite(numericValue)) {
      setGoalValue(numericValue)
    }
  }, [settings.dailyGoalValue])

  const goalConfig = GOAL_TYPES[goalType] || GOAL_TYPES.attempts
  const currentValueRaw = stats?.[goalConfig.key]
  const currentValue = Number.isFinite(currentValueRaw) ? currentValueRaw : 0
  const sanitizedGoal = Number.isFinite(goalValue) ? Math.max(0, goalValue) : 0
  const progressRatio = sanitizedGoal > 0 ? Math.min(1, currentValue / sanitizedGoal) : 0
  const progressPercent = Math.round(progressRatio * 100)
  const isMinutesGoal = goalConfig.unit === 'minutos'

  const formatValue = (value) => {
    if (!Number.isFinite(value)) return '0'
    if (isMinutesGoal) {
      return Number.isInteger(value) ? value.toString() : (Math.round(value * 10) / 10).toString()
    }
    return Math.round(value).toString()
  }

  const progressLabel = `${formatValue(currentValue)} / ${formatValue(sanitizedGoal)} ${goalConfig.unit}`

  const handleGoalTypeChange = (event) => {
    const newType = event?.target?.value === 'minutes' ? 'minutes' : 'attempts'
    setGoalType(newType)
    settings.setDailyGoalType?.(newType)
  }

  const handleGoalValueChange = (event) => {
    const value = Number(event?.target?.value)
    const sanitized = Number.isFinite(value) ? Math.max(0, value) : 0
    const normalized = goalType === 'minutes' ? Math.round(sanitized * 10) / 10 : Math.round(sanitized)
    setGoalValue(normalized)
    settings.setDailyGoalValue?.(normalized)
  }

  return (
    <div className="progress-overview">
      {/* Header with navigation */}
      <div className="overview-header">
        <div className="nav-actions">
          <div className="nav-left">
            <button
              type="button"
              className="nav-btn"
              onClick={() => window.history.back()}
              title="Volver atrás"
            >
              <img src="/back.png" alt="Volver" className="nav-icon" />
            </button>

            <button
              type="button"
              className="nav-btn"
              onClick={onNavigateHome}
              title="Inicio"
            >
              <img src="/home.png" alt="Inicio" className="nav-icon" />
            </button>

            <button
              type="button"
              className="nav-btn logo-btn"
              onClick={onNavigateToDrill}
              title="Practicar"
            >
              <img src="/verbosmain.png" alt="Practicar" className="nav-icon logo-icon" />
            </button>
          </div>

          <div className="header-actions">
            <AccountButton />
          </div>
        </div>

        <h1>Progreso y Analíticas</h1>
        <p>Tu progreso en el dominio de las conjugaciones del español</p>
      </div>

      {/* Key stats */}
      <div className="overview-stats">
        <div className="stat-card primary-action" onClick={onNavigateToDrill}>
          <div className="stat-icon">
            <img src="/play.png" alt="Practicar" className="section-icon" />
          </div>
          <div className="stat-content">
            <div className="stat-value highlight">
              {itemsDue > 0 ? itemsDue : 'Todo al día'}
            </div>
            <div className="stat-label">
              {itemsDue > 0 ? 'Elementos por repasar' : 'Listo para practicar'}
            </div>
          </div>
          <div className="stat-arrow">→</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <img src="/crono.png" alt="Racha" className="section-icon" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{streak}</div>
            <div className="stat-label">Días de racha</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <img src="/icons/brain.png" alt="Nivel" className="section-icon" />
          </div>
          <div className="stat-content">
            <div
              className="stat-value"
              style={{ color: masteryInfo.color }}
            >
              {masteryInfo.level}
            </div>
            <div className="stat-label">Nivel de dominio</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <img src="/icons/chart.png" alt="Total" className="section-icon" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{totalAttempts}</div>
            <div className="stat-label">Ejercicios completados</div>
          </div>
        </div>

        <div className="stat-card goal-card">
          <div className="goal-card-header">
            <div className="goal-title">
              <div className="goal-icon">
                <img src="/icons/timer.png" alt="Meta diaria" className="section-icon" />
              </div>
              <div>
                <h3 className="goal-heading">Meta diaria</h3>
                <p className="goal-progress-text">{progressLabel}</p>
              </div>
            </div>
            <span className="goal-percentage">{progressPercent}%</span>
          </div>

          <div className="goal-progress">
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={sanitizedGoal || 1}
              aria-valuenow={Math.min(currentValue, sanitizedGoal)}
              aria-label={`Progreso diario: ${progressLabel}`}
            >
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="goal-progress-label">{progressLabel}</span>
          </div>

          <div className="goal-controls">
            <label className="goal-field" htmlFor="daily-goal-type">
              <span>Tipo de meta</span>
              <select
                id="daily-goal-type"
                value={goalType}
                onChange={handleGoalTypeChange}
              >
                <option value="attempts">Intentos</option>
                <option value="minutes">Minutos</option>
              </select>
            </label>

            <label className="goal-field" htmlFor="daily-goal-value">
              <span>Cantidad objetivo</span>
              <input
                id="daily-goal-value"
                type="number"
                min="0"
                step={goalType === 'minutes' ? '0.5' : '1'}
                value={goalValue}
                onChange={handleGoalValueChange}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
