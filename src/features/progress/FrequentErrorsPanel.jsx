import React, { useMemo } from 'react'
import { buildFrequentErrorsPlan } from './frequentErrorsPlan.js'

export default function FrequentErrorsPanel({ errorIntel, onStartCorrectiveDrill }) {
  const plan = useMemo(() => buildFrequentErrorsPlan(errorIntel), [errorIntel])

  return (
    <section className="frequent-errors-panel" data-testid="frequent-errors-panel">
      <div className="section-header">
        <h2>
          <img src="/icons/error.png" alt="Errores frecuentes" className="section-icon" />
          Errores frecuentes
        </h2>
        <p>{plan.description}</p>
      </div>

      {plan.items.length > 0 ? (
        <ul className="reminder-list">
          {plan.items.map((item) => (
            <li key={item.id} className="reminder-card priority-high">
              <div className="reminder-text">
                <strong>{item.mood}/{item.tense}</strong>
                <div>{item.errorRate}% error en {item.attempts} intentos recientes.</div>
              </div>
              <div className="reminder-actions">
                <button
                  type="button"
                  className="reminder-button secondary"
                  onClick={() => onStartCorrectiveDrill?.(item)}
                >
                  Corregir ahora
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="weekly-goals-callout">
          <h3>{plan.headline}</h3>
          <p>Si quieres subir dificultad, usa Focus mode para abrir un frente nuevo.</p>
        </div>
      )}
    </section>
  )
}
