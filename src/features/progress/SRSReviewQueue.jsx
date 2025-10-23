import React from 'react'
import { useSRSQueue } from '../../hooks/useSRSQueue.js'
import { useSettings } from '../../state/settings.js'
import './srs-review-queue.css'

const urgencyLabels = {
  4: 'Se está olvidando',
  3: 'Muy urgente',
  2: 'Urgente',
  1: 'Programado'
}

const urgencyTag = {
  4: 'urgency-overdue',
  3: 'urgency-high',
  2: 'urgency-medium',
  1: 'urgency-low'
}

function formatDueDate(dateString) {
  try {
    const date = new Date(dateString)
    return date.toLocaleString()
  } catch (error) {
    return dateString
  }
}

export default function SRSReviewQueue({ onNavigateToDrill }) {
  const { queue, loading, error, stats, reload } = useSRSQueue()
  const settings = useSettings()

  const handleStartSession = (filterOverrides = {}) => {
    const reviewSessionFilter = {
      urgency: 'all',
      ...filterOverrides
    }

    settings.set({
      practiceMode: 'review',
      reviewSessionType: 'due',
      reviewSessionFilter
    })

    if (typeof onNavigateToDrill === 'function') {
      onNavigateToDrill()
    } else {
      window.dispatchEvent(new CustomEvent('progress:navigate', {
        detail: {
          focus: 'review',
          sessionType: 'due',
          filter: reviewSessionFilter
        }
      }))
    }
  }

  if (!queue?.length && !loading) {
    return null
  }

  return (
    <div className="srs-review-queue">
      <div className="srs-review-queue__header">
        <div>
          <h3>Cola prioritaria SRS</h3>
          <p className="srs-review-queue__subtitle">
            Gestioná tus repasos críticos y retomá el control en segundos.
          </p>
        </div>
        <button className="srs-review-queue__refresh" onClick={reload} disabled={loading}>
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      <div className="srs-review-queue__stats">
        <div className="stat">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">En cola</span>
        </div>
        <div className="stat">
          <span className="stat-value stat-urgent">{stats.overdue}</span>
          <span className="stat-label">Se están olvidando</span>
        </div>
        <div className="stat">
          <span className="stat-value">{stats.urgent}</span>
          <span className="stat-label">Muy urgentes</span>
        </div>
      </div>

      <div className="srs-review-queue__actions">
        <button
          className="btn-action primary"
          onClick={() => handleStartSession({ urgency: 'urgent' })}
          disabled={stats.urgent === 0}
        >
          Repasar urgentes ({stats.urgent})
        </button>
        <button
          className="btn-action"
          onClick={() => handleStartSession({ urgency: 'all' })}
          disabled={stats.total === 0}
        >
          Sesión completa ({stats.total})
        </button>
      </div>

      {error && <p className="srs-review-queue__error">⚠️ {error}</p>}

      <ul className="srs-review-queue__list">
        {loading && (
          <li className="srs-review-queue__status">Cargando cola de repaso…</li>
        )}
        {!loading &&
          queue.map((item) => (
            <li
              key={`${item.mood}|${item.tense}|${item.person}|${item.id}`}
              className={`queue-item ${urgencyTag[item.urgency] || 'urgency-low'}`}
            >
              <div className="item-main">
                <span className="item-name">{item.formattedName}</span>
                <span className="item-person">{item.personLabel}</span>
              </div>
              <div className="item-meta">
                <span className="item-urgency">{urgencyLabels[item.urgency] || 'Programado'}</span>
                <span className="item-due">{formatDueDate(item.nextDue)}</span>
                <span className="item-mastery">Dominio: {Math.round(item.masteryScore)}%</span>
              </div>
              <button
                className="btn-item"
                onClick={() => handleStartSession({
                  mood: item.mood,
                  tense: item.tense,
                  person: item.person
                })}
              >
                Practicar
              </button>
            </li>
          ))}
      </ul>
    </div>
  )
}
