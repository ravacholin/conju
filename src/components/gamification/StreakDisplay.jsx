import React from 'react';
import './StreakDisplay.css';

function StreakDisplay({ 
  currentStreak, 
  longestStreak, 
  motivationalMessage, 
  streakMilestones, 
  isAtRisk = false,
  compact = false 
}) {
  const { current, next, progress, daysToNext } = streakMilestones || {};
  
  if (compact) {
    return (
      <div className={`streak-display-compact ${isAtRisk ? 'at-risk' : ''}`}>
        <div className="streak-icon">
          {isAtRisk ? '⚠️' : '🔥'}
        </div>
        <div className="streak-info">
          <span className="streak-number">{currentStreak}</span>
          <span className="streak-label">días</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`streak-display ${isAtRisk ? 'at-risk' : ''}`}>
      <div className="streak-header">
        <div className="streak-main">
          <div className="streak-flame">
            {isAtRisk ? '⚠️' : currentStreak > 0 ? '🔥' : '💤'}
          </div>
          <div className="streak-numbers">
            <div className="current-streak">
              <span className="streak-value">{currentStreak}</span>
              <span className="streak-unit">
                {currentStreak === 1 ? 'día' : 'días'}
              </span>
            </div>
            {longestStreak > currentStreak && (
              <div className="longest-streak">
                Récord: {longestStreak}
              </div>
            )}
          </div>
        </div>
        
        {motivationalMessage && (
          <div className={`motivational-message ${motivationalMessage.type}`}>
            <span className="message-icon">{motivationalMessage.icon}</span>
            <span className="message-text">{motivationalMessage.message}</span>
          </div>
        )}
      </div>

      {next && current > 0 && (
        <div className="streak-progress">
          <div className="progress-info">
            <span className="progress-text">
              {daysToNext === 1 ? 
                '¡Solo 1 día más para el siguiente hito!' :
                `${daysToNext} días para alcanzar ${next}`
              }
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            >
              <div className="progress-shine"></div>
            </div>
            <div className="progress-markers">
              {Array.from({ length: 4 }, (_, i) => (
                <div 
                  key={i}
                  className={`progress-marker ${
                    (i + 1) / 4 <= progress ? 'filled' : ''
                  }`}
                  style={{ left: `${(i + 1) * 25}%` }}
                />
              ))}
            </div>
          </div>
          <div className="milestone-indicators">
            <span className="current-milestone">{current}</span>
            <span className="next-milestone">{next}</span>
          </div>
        </div>
      )}

      {currentStreak === 0 && (
        <div className="streak-starter">
          <div className="starter-icon">🚀</div>
          <div className="starter-text">
            <h4>¡Comienza tu racha hoy!</h4>
            <p>Practica todos los días para construir un hábito sólido</p>
          </div>
        </div>
      )}

      {currentStreak >= 100 && (
        <div className="streak-legend">
          <div className="legend-crown">👑</div>
          <div className="legend-text">
            <h4>¡Eres una leyenda!</h4>
            <p>Tu dedicación es verdaderamente inspiradora</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StreakDisplay;