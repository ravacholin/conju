import React from 'react';
import './SessionSummary.css';

function SessionSummary({ onFinish }) {
  return (
    <div className="session-summary">
      <h2>¡Sesión Completada!</h2>
      <p>Aquí se mostrarán tus estadísticas.</p>
      {/* Placeholder for stats like accuracy, streak, etc. */}
      <div className="summary-stats-placeholder">
        <p>Precisión: 90%</p>
        <p>Mejor racha: 15</p>
      </div>
      <button className="btn-primary" onClick={onFinish}>
        Volver al Menú
      </button>
    </div>
  );
}

export default SessionSummary;
