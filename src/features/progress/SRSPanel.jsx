import React, { useEffect, useMemo, useState } from 'react'
import { useSettings } from '../../state/settings.js'
import { useSRSQueue } from '../../hooks/useSRSQueue.js'
import { formatMoodTense } from '../../lib/utils/verbLabels.js'
import SRSSparkline from './SRSSparkline.jsx'
import SRSReviewQueueModal from './SRSReviewQueueModal.jsx'
import './srs-panel.css'

const VIEW_MODES = {
  CARDS: 'cards',
  COMPACT: 'compact'
}

const PRESET_PRIORITY = ['urgent', 'balanced', 'light', 'today']
const MINUTES_PER_ITEM = 1.5
const DAY_MS = 24 * 60 * 60 * 1000

function presetRank(id) {
  const index = PRESET_PRIORITY.indexOf(id)
  return index === -1 ? PRESET_PRIORITY.length + 1 : index
}

function orderPresets(builtIn = {}, custom = []) {
  const builtInArray = Object.values(builtIn)
    .filter(Boolean)
    .sort((a, b) => presetRank(a.id) - presetRank(b.id))
  const customArray = Array.isArray(custom) ? custom.filter(Boolean) : []
  return [...builtInArray, ...customArray]
}

function getUrgencyLabel(value) {
  switch (value) {
    case 4:
      return 'Vencido'
    case 3:
      return 'Muy urgente'
    case 2:
      return 'Próximo'
    default:
      return 'Programado'
  }
}

function getUrgencyClass(value) {
  switch (value) {
    case 4:
      return 'overdue'
    case 3:
      return 'high'
    case 2:
      return 'medium'
    default:
      return 'low'
  }
}

function getTimeDisplay(nextDue) {
  const now = new Date()
  const due = new Date(nextDue)
  const diffMs = due.getTime() - now.getTime()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))

  if (diffMs <= 0) {
    const hoursOverdue = Math.abs(diffHours)
    if (hoursOverdue < 24) return `${hoursOverdue}h atrasado`
    const daysOverdue = Math.max(1, Math.round(Math.abs(diffMs) / DAY_MS))
    return `${daysOverdue}d atrasado`
  }

  if (diffHours < 1) return 'Ahora'
  if (diffHours < 24) return `en ${diffHours}h`
  const diffDays = Math.round(diffMs / DAY_MS)
  return `en ${diffDays}d`
}

function getMemoryTier(item) {
  if (item.leech) {
    return { label: 'En rescate', tone: 'warning' }
  }

  if (typeof item.masteryScore === 'number' && item.masteryScore >= 85) {
    return { label: 'Maestría', tone: 'success' }
  }

  if (typeof item.reps === 'number' && item.reps >= 4) {
    return { label: 'Consolidando', tone: 'info' }
  }

  return { label: 'En progreso', tone: 'neutral' }
}

function filterQueue(queue, filter) {
  if (!filter) return queue
  return queue.filter((item) => {
    if (filter.mood && item.mood !== filter.mood) return false
    if (filter.tense && item.tense !== filter.tense) return false
    if (filter.person && item.person !== filter.person) return false
    return true
  })
}

function formatMinutes(minutes) {
  if (!minutes || minutes < 1) return '⩽1 min'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!rest) return `${hours} h`
  return `${hours} h ${rest} min`
}

function summarizeSparkline(buckets = []) {
  if (!buckets.length) return 'Sin próximos repasos programados.'
  const firstThree = buckets.slice(0, 3)
  return firstThree
    .map((bucket) => `${bucket.label}: ${bucket.count}`)
    .join(' · ')
}

export default function SRSPanel({ onNavigateToDrill }) {
  const [showQueueModal, setShowQueueModal] = useState(false)
  const [viewMode, setViewMode] = useState(VIEW_MODES.CARDS)
  const [activeFilter, setActiveFilter] = useState(null)

  const {
    reviewSessionPresets,
    customReviewPresets,
    activeReviewPreset,
    setActiveReviewPreset,
    set: updateSettings
  } = useSettings((state) => ({
    reviewSessionPresets: state.reviewSessionPresets,
    customReviewPresets: state.customReviewPresets,
    activeReviewPreset: state.activeReviewPreset,
    setActiveReviewPreset: state.setActiveReviewPreset,
    set: state.set
  }))

  const { queue, loading, stats: queueStats, insights } = useSRSQueue()

  useEffect(() => {
    const openHandler = () => setShowQueueModal(true)
    window.addEventListener('progress:open-review-queue', openHandler)
    return () => {
      window.removeEventListener('progress:open-review-queue', openHandler)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleResize = () => {
      if (window.innerWidth < 760) {
        setViewMode(VIEW_MODES.COMPACT)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const allPresets = useMemo(
    () => orderPresets(reviewSessionPresets, customReviewPresets),
    [reviewSessionPresets, customReviewPresets]
  )

  const highlightTenses = useMemo(
    () => (insights?.breakdown?.byTense || []).slice(0, 4),
    [insights]
  )

  const filteredQueue = useMemo(
    () => filterQueue(queue, activeFilter),
    [queue, activeFilter]
  )

  const queuePreview = useMemo(() => {
    const limit = viewMode === VIEW_MODES.CARDS ? 4 : 10
    return filteredQueue.slice(0, limit)
  }, [filteredQueue, viewMode])

  const todayBucketCount = insights?.upcomingBuckets?.[0]?.count ?? 0
  const dueNowCount = Math.max(queueStats.urgent - queueStats.overdue, 0)
  const dueLaterToday = Math.max(todayBucketCount, 0)

  const metrics = useMemo(
    () => [
      {
        id: 'overdue',
        label: 'Necesitan rescate',
        value: queueStats.overdue,
        description: queueStats.overdue ? 'Atendelos cuanto antes' : 'Sin vencidos por ahora',
        time: queueStats.overdue ? formatMinutes(Math.ceil(queueStats.overdue * MINUTES_PER_ITEM)) : '—',
        tone: 'danger'
      },
      {
        id: 'urgent',
        label: 'Listos ahora',
        value: dueNowCount,
        description: dueNowCount ? 'Intervalo perfecto para reforzar' : 'Todo tranquilo por el momento',
        time: dueNowCount ? formatMinutes(Math.ceil(dueNowCount * MINUTES_PER_ITEM)) : '—',
        tone: 'primary'
      },
      {
        id: 'later',
        label: 'Llegan hoy',
        value: dueLaterToday,
        description: dueLaterToday ? 'Se activarán más tarde hoy' : 'Sin repasos pendientes más tarde',
        time: dueLaterToday ? formatMinutes(Math.ceil(dueLaterToday * MINUTES_PER_ITEM)) : '—',
        tone: 'neutral'
      }
    ],
    [queueStats.overdue, dueNowCount, dueLaterToday]
  )

  const startReviewSession = (presetId, overrides = {}) => {
    const preset = allPresets.find((p) => p.id === presetId)
    const filter = {
      urgency: preset?.urgency || overrides.urgency || 'all'
    }

    if (preset?.limit || overrides.limit) filter.limit = overrides.limit ?? preset?.limit
    if (preset?.includeNew || overrides.mixNewWithDue) filter.mixNewWithDue = overrides.mixNewWithDue ?? preset?.includeNew
    if (preset?.mixRatio || overrides.mixRatio) filter.mixRatio = overrides.mixRatio ?? preset?.mixRatio
    if (preset?.mood || overrides.mood) filter.mood = overrides.mood ?? preset?.mood
    if (preset?.tense || overrides.tense) filter.tense = overrides.tense ?? preset?.tense
    if (preset?.person || overrides.person) filter.person = overrides.person ?? preset?.person
    if (overrides.customLabel) filter.customLabel = overrides.customLabel

    const finalFilter = { ...filter, ...overrides }

    setActiveReviewPreset(presetId)
    updateSettings({
      practiceMode: 'review',
      reviewSessionType: presetId,
      reviewSessionFilter: finalFilter
    })

    const detail = { focus: 'review', filter: finalFilter, presetId }
    if (onNavigateToDrill) {
      onNavigateToDrill()
    } else {
      window.dispatchEvent(new CustomEvent('progress:navigate', { detail }))
    }

    window.dispatchEvent(
      new CustomEvent('progress:review-session-started', {
        detail: {
          presetId,
          filter: finalFilter,
          stats: queueStats,
          queueSize: queue.length
        }
      })
    )
  }

  const toggleActiveFilter = (entry) => {
    if (!entry) {
      setActiveFilter(null)
      return
    }

    if (activeFilter && activeFilter.mood === entry.mood && activeFilter.tense === entry.tense) {
      setActiveFilter(null)
    } else {
      setActiveFilter({ mood: entry.mood, tense: entry.tense })
    }
  }

  const activeFilterLabel = activeFilter ? formatMoodTense(activeFilter.mood, activeFilter.tense) : null
  const sparklineSummary = summarizeSparkline(insights?.upcomingBuckets)

  if (loading) {
    return (
      <div className="srs-panel srs-panel--loading" role="status" aria-live="polite">
        <div className="srs-panel__spinner" />
        <p>Analizando tu cola de repaso…</p>
      </div>
    )
  }

  return (
    <div className={`srs-panel ${viewMode === VIEW_MODES.COMPACT ? 'srs-panel--compact' : ''}`}>
      <header className="srs-panel__header">
        <div className="srs-panel__title-group">
          <h3>Repaso inteligente</h3>
          <p className="srs-panel__subtitle">
            El sistema ajusta la curva de olvido según tu desempeño. Prioriza lo urgente y proyecta los repasos de los próximos días.
          </p>
        </div>
        <div className="srs-panel__header-actions">
          <div className="view-toggle" role="group" aria-label="Modo de visualización de cola">
            <button
              type="button"
              className={`view-toggle__btn ${viewMode === VIEW_MODES.CARDS ? 'is-active' : ''}`}
              onClick={() => setViewMode(VIEW_MODES.CARDS)}
              aria-pressed={viewMode === VIEW_MODES.CARDS}
            >
              Tarjetas
            </button>
            <button
              type="button"
              className={`view-toggle__btn ${viewMode === VIEW_MODES.COMPACT ? 'is-active' : ''}`}
              onClick={() => setViewMode(VIEW_MODES.COMPACT)}
              aria-pressed={viewMode === VIEW_MODES.COMPACT}
            >
              Lista
            </button>
          </div>
          <button type="button" className="srs-panel__open-queue" onClick={() => setShowQueueModal(true)}>
            Administrar cola
          </button>
        </div>
      </header>

      <section className="srs-panel__metrics" aria-live="polite">
        {metrics.map((metric) => (
          <article key={metric.id} className={`metric-card metric-card--${metric.tone}`}>
            <header>
              <span className="metric-card__label">{metric.label}</span>
              <strong className="metric-card__value">{metric.value}</strong>
            </header>
            <p className="metric-card__description">{metric.description}</p>
            <footer>{metric.time}</footer>
          </article>
        ))}
      </section>

      <section className="srs-panel__sparkline" aria-label="Proyección de repasos para los próximos días">
        <div className="srs-panel__sparkline-header">
          <div>
            <strong>Próximos 7 días</strong>
            <p className="srs-panel__sparkline-subtitle">{sparklineSummary}</p>
          </div>
          <span className="srs-panel__sparkline-total">Total programado: {insights?.upcomingBuckets?.reduce((sum, bucket) => sum + bucket.count, 0) || 0}</span>
        </div>
        <SRSSparkline buckets={insights?.upcomingBuckets} />
      </section>

      <section className="srs-panel__sessions" aria-label="Sesiones sugeridas">
        {allPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`preset-button ${activeReviewPreset === preset.id ? 'is-active' : ''}`}
            onClick={() => startReviewSession(preset.id)}
          >
            <span className="preset-button__title">{preset.label}</span>
            <span className="preset-button__meta">
              {preset.includeNew ? 'Mezcla con nuevo' : getUrgencyLabel(preset.urgency === 'urgent' ? 3 : 2)}
            </span>
          </button>
        ))}
        <button
          type="button"
          className="preset-button preset-button--mix"
          onClick={() => startReviewSession('balanced', { mixNewWithDue: true })}
        >
          <span className="preset-button__title">Mezcla adaptativa</span>
          <span className="preset-button__meta">Urgentes + recomendaciones nuevas</span>
        </button>
      </section>

      <section className="srs-panel__filters" aria-label="Filtros temáticos">
        <div className="filter-chip-group">
          {highlightTenses.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className={`filter-chip ${activeFilter && activeFilter.mood === entry.mood && activeFilter.tense === entry.tense ? 'is-active' : ''}`}
              onClick={() => toggleActiveFilter(entry)}
              aria-pressed={!!activeFilter && activeFilter.mood === entry.mood && activeFilter.tense === entry.tense}
            >
              {entry.label}
              <span className="filter-chip__count">{entry.count}</span>
            </button>
          ))}
          <button
            type="button"
            className="filter-chip filter-chip--clear"
            onClick={() => toggleActiveFilter(null)}
            disabled={!activeFilter}
          >
            Limpiar
          </button>
        </div>
        <div className="srs-panel__filter-status">
          {activeFilterLabel ? `Filtrando por ${activeFilterLabel}` : `Elementos en cola: ${queueStats.total}`}
        </div>
      </section>

      <section className={`srs-panel__queue ${viewMode === VIEW_MODES.COMPACT ? 'srs-panel__queue--compact' : ''}`} aria-label="Cola prioritaria">
        {queuePreview.length === 0 ? (
          <div className="srs-panel__empty">
            <p>Sin pendientes en este filtro. Podés practicar algo nuevo o volver más tarde.</p>
            <button type="button" onClick={() => startReviewSession('balanced', { mixNewWithDue: true })}>
              Mezclar con contenido nuevo
            </button>
          </div>
        ) : viewMode === VIEW_MODES.CARDS ? (
          <div className="queue-cards">
            {queuePreview.map((item) => {
              const tier = getMemoryTier(item)
              const urgencyLabel = getUrgencyLabel(item.urgency)
              const adjustment = item.personalization?.modifier
                ? Math.round((item.personalization.modifier - 1) * 100)
                : null
              const difficulty = item.adaptationProfile?.difficultyLevel
              const frequency = item.adaptationProfile?.lexicalFrequency

              return (
                <article key={`${item.mood}|${item.tense}|${item.person}`} className="queue-card">
                  <header className="queue-card__header">
                    <div>
                      <h4>{item.formattedName}</h4>
                      <p className="queue-card__person">{item.personLabel}</p>
                    </div>
                    <span className={`memory-badge memory-badge--${tier.tone}`}>{tier.label}</span>
                  </header>
                  <div className="queue-card__meta">
                    <span className={`urgency-tag urgency-tag--${getUrgencyClass(item.urgency)}`}>{urgencyLabel}</span>
                    <span className="queue-card__time">{getTimeDisplay(item.nextDue)}</span>
                  </div>
                  <dl className="queue-card__details">
                    <div>
                      <dt>Dominio</dt>
                      <dd>{Math.round(item.masteryScore)}%</dd>
                    </div>
                    {difficulty && (
                      <div>
                        <dt>Dificultad</dt>
                        <dd className={`difficulty-tag difficulty-tag--${difficulty}`}>{difficulty}</dd>
                      </div>
                    )}
                    {frequency && (
                      <div>
                        <dt>Frecuencia</dt>
                        <dd>{frequency}</dd>
                      </div>
                    )}
                    {typeof adjustment === 'number' && adjustment !== 0 && (
                      <div>
                        <dt>Ajuste</dt>
                        <dd>{adjustment > 0 ? `+${adjustment}%` : `${adjustment}%`}</dd>
                      </div>
                    )}
                  </dl>
                </article>
              )
            })}
          </div>
        ) : (
          <ul className="queue-list">
            {queuePreview.map((item) => (
              <li key={`${item.mood}|${item.tense}|${item.person}`}>
                <span className={`queue-list__urgency queue-list__urgency--${getUrgencyClass(item.urgency)}`}>{getUrgencyLabel(item.urgency)}</span>
                <span className="queue-list__label">{item.formattedName}</span>
                <span className="queue-list__person">{item.personLabel}</span>
                <span className="queue-list__score">{Math.round(item.masteryScore)}%</span>
                <span className="queue-list__time">{getTimeDisplay(item.nextDue)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="srs-panel__footer">
        <div>
          <p className="srs-panel__footer-text">
            Tip: mantené una racha de urgentes para desbloquear insignias de memoria.
          </p>
        </div>
        <div className="srs-panel__footer-actions">
          <button type="button" onClick={() => startReviewSession('urgent')}>Repasar urgentes</button>
          <button type="button" onClick={() => setShowQueueModal(true)}>Abrir cola completa</button>
        </div>
      </footer>

      <SRSReviewQueueModal
        isOpen={showQueueModal}
        onClose={() => setShowQueueModal(false)}
        onStartPreset={(presetId, overrides) => {
          startReviewSession(presetId, overrides)
          setShowQueueModal(false)
        }}
        onFilterSelected={(filter) => setActiveFilter(filter)}
        activeFilter={activeFilter}
      />
    </div>
  )
}
