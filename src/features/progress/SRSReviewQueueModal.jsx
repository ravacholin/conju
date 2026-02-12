import React, { useMemo, useState } from 'react'
import { useSRSQueue } from '../../hooks/useSRSQueue.js'
import { useSettings } from '../../state/settings.js'
import { useSessionStore } from '../../state/session.js'
import { emitProgressEvent, PROGRESS_EVENTS } from '../../lib/events/progressEventBus.js'
import './SRSReviewQueueModal.css'

const urgencyLabels = {
  4: 'Se está olvidando',
  3: 'Muy urgente',
  2: 'Urgente',
  1: 'Programado'
}

const urgencyOrder = [4, 3, 2, 1]

export default function SRSReviewQueueModal({ isOpen, onClose, onStartSession }) {
  const { queue, loading, error, stats, reload } = useSRSQueue()
  const settings = useSettings()
  const setDrillRuntimeContext = useSessionStore((state) => state.setDrillRuntimeContext)

  const [selectedUrgency, setSelectedUrgency] = useState('all')
  const [selectedPerson, setSelectedPerson] = useState('all')

  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const matchesUrgency = selectedUrgency === 'all' || Number(selectedUrgency) === item.urgency
      const matchesPerson = selectedPerson === 'all' || selectedPerson === item.person
      return matchesUrgency && matchesPerson
    })
  }, [queue, selectedUrgency, selectedPerson])

  const startFilteredSession = (filter) => {
    const detail = {
      focus: 'review',
      filter
    }

    settings.set({ practiceMode: 'review' })
    setDrillRuntimeContext({
      reviewSessionType: 'due',
      reviewSessionFilter: filter
    })

    if (typeof onStartSession === 'function') {
      onStartSession(filter)
    }

    emitProgressEvent(PROGRESS_EVENTS.NAVIGATE, detail)
    onClose?.()
  }

  if (!isOpen) return null

  return (
    <div className="srs-queue-overlay" onClick={onClose}>
      <div className="srs-queue-modal" onClick={(event) => event.stopPropagation()}>
        <header className="srs-queue__header">
          <div className="srs-queue__hero">
            <div className="hero-content">
              <h2>Revisar ahora</h2>
              <p>Control total sobre tu cola de repaso SRS</p>
            </div>
            <button className="srs-queue__close" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          <div className="srs-queue__stats">
            <div className="stat-card">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">En cola</span>
            </div>
            <div className="stat-card urgent">
              <span className="stat-value">{stats.overdue}</span>
              <span className="stat-label">Se están olvidando</span>
            </div>
            <div className="stat-card soon">
              <span className="stat-value">{stats.urgent}</span>
              <span className="stat-label">Muy urgentes</span>
            </div>
          </div>
        </header>

        <section className="srs-queue__filters">
          <div className="filter-group">
            <label>Urgencia</label>
            <select value={selectedUrgency} onChange={(event) => setSelectedUrgency(event.target.value)}>
              <option value="all">Todas</option>
              {urgencyOrder.map((level) => (
                <option key={level} value={level}>{urgencyLabels[level]}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Persona</label>
            <select value={selectedPerson} onChange={(event) => setSelectedPerson(event.target.value)}>
              <option value="all">Todas</option>
              {Array.from(new Set(queue.map((item) => item.person))).map((person) => (
                <option key={person} value={person}>{queue.find((item) => item.person === person)?.personLabel || person}</option>
              ))}
            </select>
          </div>
          <button className="srs-queue__refresh" onClick={reload} disabled={loading}>Actualizar</button>
        </section>

        <section className="srs-queue__actions">
          <button className="btn btn-primary" onClick={() => startFilteredSession({ urgency: 'urgent' })} disabled={stats.urgent === 0}>
            Repasar urgentes ({stats.urgent})
          </button>
          <button className="btn btn-secondary" onClick={() => startFilteredSession({ urgency: 'all' })} disabled={stats.total === 0}>
            Sesión completa ({stats.total})
          </button>
        </section>

        <section className="srs-queue__list">
          {loading && <p className="srs-queue__status">Cargando cola completa…</p>}
          {error && <p className="srs-queue__error">⚠️ {error}</p>}
          {!loading && filteredQueue.length === 0 && (
            <p className="srs-queue__status">No hay elementos que coincidan con los filtros seleccionados.</p>
          )}
          {!loading && filteredQueue.length > 0 && (
            <ul>
              {filteredQueue.map((item) => (
                <li key={`${item.mood}|${item.tense}|${item.person}|${item.id}`} className={`srs-queue__item urgency-${item.urgency}`}>
                  <div className="item-main">
                    <span className="item-name">{item.formattedName}</span>
                    <span className="item-person">{item.personLabel}</span>
                  </div>
                  <div className="item-meta">
                    <span className="item-mastery">Dominio: {Math.round(item.masteryScore)}%</span>
                    <span className="item-due">{new Date(item.nextDue).toLocaleString()}</span>
                    <span className="item-urgency">{urgencyLabels[item.urgency]}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
