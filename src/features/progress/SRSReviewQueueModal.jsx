import React, { useMemo, useState } from 'react'
import { useSRSQueue } from '../../hooks/useSRSQueue.js'
import { formatMoodTense } from '../../lib/utils/verbLabels.js'
import './SRSReviewQueueModal.css'

const urgencyLabels = {
  4: 'Se está olvidando',
  3: 'Muy urgente',
  2: 'Urgente',
  1: 'Programado'
}

const urgencyOrder = [4, 3, 2, 1]

export default function SRSReviewQueueModal({
  isOpen,
  onClose,
  onStartPreset,
  onFilterSelected,
  activeFilter
}) {
  const { queue, loading, error, stats, reload, insights } = useSRSQueue()

  const [selectedUrgency, setSelectedUrgency] = useState('all')
  const [selectedPerson, setSelectedPerson] = useState('all')
  const [includeNew, setIncludeNew] = useState(false)
  const [sessionLimit, setSessionLimit] = useState(10)
  const [selectedTenseKey, setSelectedTenseKey] = useState(null)

  const thematicTenses = useMemo(
    () => (insights?.breakdown?.byTense || []).slice(0, 6),
    [insights]
  )

  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const matchesUrgency = selectedUrgency === 'all' || Number(selectedUrgency) === item.urgency
      const matchesPerson = selectedPerson === 'all' || selectedPerson === item.person
      const matchesTense = !selectedTenseKey || selectedTenseKey === `${item.mood}|${item.tense}`
      return matchesUrgency && matchesPerson && matchesTense
    })
  }, [queue, selectedUrgency, selectedPerson, selectedTenseKey])

  if (!isOpen) return null

  const handleStartCustomSession = () => {
    const filter = {
      urgency: selectedUrgency === 'all' ? 'all' : Number(selectedUrgency) >= 3 ? 'urgent' : 'scheduled'
    }

    if (selectedPerson !== 'all') {
      filter.person = selectedPerson
    }

    if (selectedTenseKey) {
      const [mood, tense] = selectedTenseKey.split('|')
      filter.mood = mood
      filter.tense = tense
    }

    if (includeNew) filter.mixNewWithDue = true
    if (sessionLimit && sessionLimit > 0) filter.limit = sessionLimit

    onStartPreset?.('custom', filter)
  }

  const handleApplyFilterToPanel = () => {
    if (!selectedTenseKey) {
      onFilterSelected?.(null)
      return
    }
    const [mood, tense] = selectedTenseKey.split('|')
    onFilterSelected?.({ mood, tense })
  }

  return (
    <div className="srs-queue-overlay" onClick={onClose}>
      <div className="srs-queue-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header className="srs-queue__header">
          <div className="srs-queue__hero">
            <div className="hero-content">
              <h2>Cola de repaso</h2>
              <p>Explora, filtra y lanza sesiones adaptadas a tu objetivo.</p>
            </div>
            <button className="srs-queue__close" onClick={onClose} aria-label="Cerrar">✕</button>
          </div>

          <div className="srs-queue__stats" aria-live="polite">
            <div className="stat-card">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">En cola</span>
            </div>
            <div className="stat-card urgent">
              <span className="stat-value">{stats.overdue}</span>
              <span className="stat-label">Se olvidan</span>
            </div>
            <div className="stat-card soon">
              <span className="stat-value">{stats.urgent}</span>
              <span className="stat-label">Muy urgentes</span>
            </div>
          </div>
        </header>

        <section className="srs-queue__filters" aria-label="Filtros de cola">
          <div className="filter-group">
            <label htmlFor="filter-urgency">Urgencia</label>
            <select id="filter-urgency" value={selectedUrgency} onChange={(event) => setSelectedUrgency(event.target.value)}>
              <option value="all">Todas</option>
              {urgencyOrder.map((level) => (
                <option key={level} value={level}>{urgencyLabels[level]}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filter-person">Persona</label>
            <select id="filter-person" value={selectedPerson} onChange={(event) => setSelectedPerson(event.target.value)}>
              <option value="all">Todas</option>
              {Array.from(new Set(queue.map((item) => item.person))).map((person) => (
                <option key={person} value={person}>{queue.find((item) => item.person === person)?.personLabel || person}</option>
              ))}
            </select>
          </div>
          <button className="srs-queue__refresh" onClick={reload} disabled={loading}>Actualizar</button>
        </section>

        <section className="srs-queue__themes" aria-label="Filtros temáticos">
          <h3>Atajos temáticos</h3>
          <div className="theme-chips">
            {thematicTenses.map((entry) => (
              <button
                key={entry.key}
                type="button"
                className={`theme-chip ${selectedTenseKey === entry.key ? 'is-active' : ''}`}
                onClick={() => setSelectedTenseKey(selectedTenseKey === entry.key ? null : entry.key)}
                aria-pressed={selectedTenseKey === entry.key}
              >
                {entry.label}
                <span className="theme-chip__count">{entry.count}</span>
              </button>
            ))}
            <button
              type="button"
              className="theme-chip theme-chip--clear"
              onClick={() => setSelectedTenseKey(null)}
              disabled={!selectedTenseKey}
            >
              Limpiar
            </button>
            <button
              type="button"
              className="theme-chip theme-chip--apply"
              onClick={handleApplyFilterToPanel}
            >
              Enviar al panel
            </button>
          </div>
        </section>

        <section className="srs-queue__actions" aria-label="Iniciar sesión">
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={() => onStartPreset?.('urgent')} disabled={stats.urgent === 0}>
              Repasar urgentes ({stats.urgent})
            </button>
            <button className="btn btn-secondary" onClick={() => onStartPreset?.('balanced', { mixNewWithDue: true })}>
              Mezcla adaptativa
            </button>
            <button className="btn" onClick={() => onStartPreset?.('today')} disabled={stats.total === 0}>
              Sesión completa ({stats.total})
            </button>
          </div>

          <div className="custom-session">
            <div className="custom-session__row">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={includeNew}
                  onChange={(event) => setIncludeNew(event.target.checked)}
                />
                <span>Mezclar con contenido nuevo</span>
              </label>
              <label className="limit-input">
                <span>Ítems</span>
                <input
                  type="number"
                  min="3"
                  max="50"
                  value={sessionLimit}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    if (Number.isNaN(value)) {
                      setSessionLimit(10)
                      return
                    }
                    const clamped = Math.min(50, Math.max(3, value))
                    setSessionLimit(clamped)
                  }}
                />
              </label>
            </div>
            <button className="btn btn-outline" onClick={handleStartCustomSession} disabled={filteredQueue.length === 0 && !includeNew}>
              Lanzar sesión personalizada
            </button>
          </div>
        </section>

        <section className="srs-queue__list" aria-live="polite">
          {loading && <p className="srs-queue__status">Cargando cola completa…</p>}
          {error && <p className="srs-queue__error">⚠️ {error}</p>}
          {!loading && !error && filteredQueue.length === 0 && (
            <p className="srs-queue__status">No hay elementos que coincidan con los filtros seleccionados.</p>
          )}
          {!loading && !error && filteredQueue.length > 0 && (
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

        {activeFilter && (
          <footer className="srs-queue__footer" aria-live="polite">
            <p>Filtro activo en panel: {formatFilterLabel(activeFilter)}</p>
          </footer>
        )}
      </div>
    </div>
  )
}

function formatFilterLabel(filter) {
  if (!filter) return ''
  if (filter.mood && filter.tense) {
    return formatMoodTense(filter.mood, filter.tense)
  }
  if (filter.mood) return filter.mood
  return ''
}
