import React from 'react';
import './SessionSummary.css';

function SessionSummary({ onFinish, summary = {} }) {
  const {
    grade = 'C',
    accuracy = 0,
    averageTime = 0,
    maxStreak = 0,
    points = 0,
    totalAttempts = 0,
    correctAnswers = 0,
    errorPatterns = {},
    recommendations = []
  } = summary;

  // Color mapping for grades
  const getGradeColor = (grade) => {
    const colors = {
      'A+': '#00ff88',
      'A': '#00ff88',
      'A-': '#7dd3fc',
      'B+': '#7dd3fc',
      'B': '#60a5fa',
      'B-': '#3b82f6',
      'C+': '#fbbf24',
      'C': '#f59e0b',
      'C-': '#d97706',
      'D+': '#fb923c',
      'D': '#ea580c',
      'D-': '#dc2626',
      'F': '#ef4444'
    };
    return colors[grade] || '#6b7280';
  };

  // Get error pattern descriptions
  const getErrorDescription = (pattern) => {
    const descriptions = {
      accent_error: 'Errores de acentos',
      person_error: 'Errores de persona',
      wrong_tense: 'Tiempo verbal incorrecto',
      complete_error: 'Errores diversos'
    };
    return descriptions[pattern] || pattern;
  };

  return (
    <div className="App">
      <div className="main-content">
        <div className="session-summary">
          <div className="summary-header">
            <h1>¡Sesión Completada!</h1>
          </div>

          {/* Grade Display */}
          <div className="grade-display">
            <div 
              className="grade-circle"
              style={{ 
                borderColor: getGradeColor(grade),
                boxShadow: `0 0 20px ${getGradeColor(grade)}40`
              }}
            >
              <span 
                className="grade-text"
                style={{ color: getGradeColor(grade) }}
              >
                {grade}
              </span>
            </div>
          </div>

          {/* Core Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Precisión</div>
              <div className={`metric-value ${accuracy >= 80 ? 'success' : accuracy >= 60 ? 'warning' : 'error'}`}>
                {accuracy}%
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Tiempo Promedio</div>
              <div className={`metric-value ${averageTime < 2 ? 'success' : averageTime < 4 ? 'warning' : 'error'}`}>
                {averageTime}s
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Mejor Racha</div>
              <div className={`metric-value ${maxStreak >= 10 ? 'success' : maxStreak >= 5 ? 'warning' : ''}`}>
                {maxStreak}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Puntos Ganados</div>
              <div className="metric-value success">
                {points.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="detailed-stats">
            <div className="stats-section">
              <h3>Estadísticas de la Sesión</h3>
              <div className="stats-list">
                <div className="stat-row">
                  <span>Respuestas totales:</span>
                  <span>{totalAttempts}</span>
                </div>
                <div className="stat-row">
                  <span>Respuestas correctas:</span>
                  <span>{correctAnswers}</span>
                </div>
                <div className="stat-row">
                  <span>Respuestas incorrectas:</span>
                  <span>{totalAttempts - correctAnswers}</span>
                </div>
              </div>
            </div>

            {/* Error Patterns */}
            {Object.keys(errorPatterns).length > 0 && (
              <div className="stats-section">
                <h3>Análisis de Errores</h3>
                <div className="error-patterns">
                  {Object.entries(errorPatterns).map(([pattern, count]) => (
                    <div key={pattern} className="error-pattern">
                      <span className="pattern-name">{getErrorDescription(pattern)}</span>
                      <span className="pattern-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="stats-section">
                <h3>Recomendaciones para Mejorar</h3>
                <div className="recommendations-list">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="recommendation">
                      <span className="rec-icon">💡</span>
                      <span className="rec-text">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="summary-actions">
            {recommendations.length > 0 && (
              <button className="btn-secondary practice-more-btn">
                Practicar Errores Específicos
              </button>
            )}
            <button className="btn-primary" onClick={onFinish}>
              Continuar Aprendizaje
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionSummary;
