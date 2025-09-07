import React, { useState } from 'react';
import StreakDisplay from './StreakDisplay.jsx';
import './ProgressDashboard.css';

function ProgressDashboard({ 
  userStats, 
  achievements, 
  streakMilestones, 
  motivationalMessage,
  calendarHeatMap,
  sessionSummary,
  userLevel 
}) {
  const [selectedTab, setSelectedTab] = useState('overview');

  const renderOverview = () => (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{userStats?.totalExercises || 0}</div>
            <div className="stat-label">Ejercicios Completados</div>
          </div>
        </div>
        
        <div className="stat-card secondary">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-value">{achievements?.length || 0}</div>
            <div className="stat-label">Logros Desbloqueados</div>
          </div>
        </div>
        
        <div className="stat-card accent">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-value">{userStats?.currentPerfectStreak || 0}</div>
            <div className="stat-label">Racha Perfecta</div>
          </div>
        </div>
        
        <div className="stat-card level">
          <div className="stat-icon">🌟</div>
          <div className="stat-content">
            <div className="stat-value">Nivel {userLevel?.level || 1}</div>
            <div className="stat-label">{userLevel?.name || 'Principiante'}</div>
          </div>
        </div>
      </div>

      <StreakDisplay 
        currentStreak={userStats?.currentStreak || 0}
        longestStreak={userStats?.longestStreak || 0}
        motivationalMessage={motivationalMessage}
        streakMilestones={streakMilestones}
        isAtRisk={false}
      />

      {sessionSummary && sessionSummary.totalAnswers > 0 && (
        <div className="session-summary">
          <h3>Resumen de la Sesión</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Duración:</span>
              <span className="summary-value">{sessionSummary.duration} min</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Precisión:</span>
              <span className="summary-value">{sessionSummary.accuracy}%</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Tiempo promedio:</span>
              <span className="summary-value">{sessionSummary.averageResponseTime}s</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Ritmo:</span>
              <span className="summary-value">{sessionSummary.exercisesPerMinute}/min</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAchievements = () => (
    <div className="achievements-tab">
      <div className="achievements-header">
        <h3>Logros Desbloqueados ({achievements?.length || 0})</h3>
        <div className="total-points">
          Total: {userStats?.totalPoints || 0} puntos
        </div>
      </div>
      
      <div className="achievements-grid">
        {achievements && achievements.length > 0 ? (
          achievements
            .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
            .map((achievement) => (
              <div key={achievement.id} className="achievement-item">
                <div className="achievement-tier-badge">
                  <span 
                    className={`tier-indicator ${achievement.tier.name}`}
                    style={{ borderColor: achievement.tier.color }}
                  >
                    {achievement.tier.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="achievement-icon-small">{achievement.icon}</div>
                <div className="achievement-info">
                  <h4 className="achievement-title-small">{achievement.title}</h4>
                  <p className="achievement-desc-small">{achievement.description}</p>
                  <div className="achievement-meta">
                    <span className="achievement-points-small">
                      +{achievement.tier.points} pts
                    </span>
                    <span className="achievement-date">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="no-achievements">
            <div className="no-achievements-icon">🏆</div>
            <h4>¡Tus primeros logros te esperan!</h4>
            <p>Sigue practicando para desbloquear increíbles recompensas</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProgress = () => {
    const tenseAccuracy = userStats?.tenseAccuracy || {};
    const tensesPracticed = userStats?.tensesPracticed || {};
    
    return (
      <div className="progress-tab">
        <h3>Progreso por Tiempo Verbal</h3>
        
        <div className="tense-progress-grid">
          {Object.entries(tensesPracticed).map(([tense, count]) => {
            const accuracy = tenseAccuracy[tense] || 0;
            const tenseNames = {
              'pres': 'Presente',
              'pretIndef': 'Pretérito Indefinido',
              'impf': 'Imperfecto',
              'fut': 'Futuro',
              'presSub': 'Subjuntivo Presente',
              'cond': 'Condicional'
            };
            
            return (
              <div key={tense} className="tense-progress-card">
                <div className="tense-header">
                  <h4>{tenseNames[tense] || tense}</h4>
                  <div className="tense-count">{count} ejercicios</div>
                </div>
                <div className="accuracy-bar">
                  <div className="accuracy-label">Precisión</div>
                  <div className="accuracy-track">
                    <div 
                      className="accuracy-fill"
                      style={{ width: `${Math.round(accuracy * 100)}%` }}
                    />
                  </div>
                  <div className="accuracy-value">
                    {Math.round(accuracy * 100)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {Object.keys(tensesPracticed).length === 0 && (
          <div className="no-progress">
            <div className="no-progress-icon">📈</div>
            <h4>¡Comienza a practicar!</h4>
            <p>Tu progreso aparecerá aquí una vez que completes algunos ejercicios</p>
          </div>
        )}
      </div>
    );
  };

  const renderCalendar = () => (
    <div className="calendar-tab">
      <h3>Calendario de Actividad</h3>
      <div className="activity-calendar">
        {calendarHeatMap && calendarHeatMap.length > 0 ? (
          <div className="calendar-grid">
            {calendarHeatMap.map((day) => (
              <div 
                key={day.date}
                className={`calendar-day level-${day.level}`}
                title={`${day.date}: ${day.sessions} sesiones`}
              />
            ))}
          </div>
        ) : (
          <div className="calendar-placeholder">
            <div className="calendar-placeholder-icon">📅</div>
            <p>Tu calendario de actividad aparecerá aquí</p>
          </div>
        )}
        
        <div className="calendar-legend">
          <span>Menos</span>
          <div className="legend-scale">
            {[0, 1, 2, 3, 4].map(level => (
              <div key={level} className={`legend-item level-${level}`} />
            ))}
          </div>
          <span>Más</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="progress-dashboard">
      <div className="dashboard-header">
        <h2>Tu Progreso</h2>
        <div className="level-indicator">
          <div 
            className="level-badge"
            style={{ borderColor: userLevel?.color }}
          >
            Nivel {userLevel?.level || 1}
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          Resumen
        </button>
        <button 
          className={`tab-button ${selectedTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setSelectedTab('achievements')}
        >
          Logros
        </button>
        <button 
          className={`tab-button ${selectedTab === 'progress' ? 'active' : ''}`}
          onClick={() => setSelectedTab('progress')}
        >
          Progreso
        </button>
        <button 
          className={`tab-button ${selectedTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setSelectedTab('calendar')}
        >
          Calendario
        </button>
      </div>

      <div className="dashboard-content">
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'achievements' && renderAchievements()}
        {selectedTab === 'progress' && renderProgress()}
        {selectedTab === 'calendar' && renderCalendar()}
      </div>
    </div>
  );
}

export default ProgressDashboard;