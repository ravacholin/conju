import React from 'react'

export default function GeneralRecommendations({ recommendations = [], onSelect }) {
  return (
    <section className="dashboard-section">
      <h2>
        <img src="/icons/lightbulb.png" alt="Recomendaciones" className="section-icon" />
        Recomendaciones
      </h2>
      <div className="recommendations">
        {recommendations.length > 0 ? (
          recommendations.slice(0, 3).map((rec, index) => (
            <div
              key={index}
              className={`recommendation-card priority-${rec.priority}`}
              onClick={() => onSelect && onSelect(rec)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) onSelect(rec) }}
            >
              <h3>{rec.title}</h3>
              <p>{rec.description}</p>
            </div>
          ))
        ) : (
          <p>Sigue practicando para recibir recomendaciones personalizadas.</p>
        )}
      </div>
    </section>
  )
}
