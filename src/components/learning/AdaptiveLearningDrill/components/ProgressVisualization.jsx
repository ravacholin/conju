/**
 * ProgressVisualization.jsx - Visualización de progreso para el drill adaptativo
 *
 * Muestra el progreso del usuario de forma visual y motivacional,
 * incluyendo estadísticas en tiempo real, etapas completadas,
 * y reconocimientos de logros.
 */

import React from 'react';
import { PROGRESSION_STAGES, SCORING_CONFIG } from '../utils/constants.js';

/**
 * Componente principal de visualización de progreso
 */
function ProgressVisualization({
  currentStage,
  sessionStats,
  exerciseHistory
}) {
  // Calcular métricas derivadas
  const accuracy = sessionStats.totalAttempts > 0 ?
    (sessionStats.correctAnswers / sessionStats.totalAttempts) * 100 : 0;

  const points = calculateTotalPoints(sessionStats, exerciseHistory);
  const stageProgress = calculateStageProgress(currentStage, exerciseHistory);

  return (
    <div className="progress-visualization">
      {/* Panel principal de estadísticas */}
      <div className="stats-panel">
        <StatCard
          icon="🎯"
          value={`${Math.round(accuracy)}%`}
          label="Precisión"
          color={getAccuracyColor(accuracy)}
          trend={getAccuracyTrend(exerciseHistory)}
        />

        <StatCard
          icon="🔥"
          value={sessionStats.currentStreak}
          label="Racha"
          color={getStreakColor(sessionStats.currentStreak)}
          highlight={sessionStats.currentStreak > 0}
        />

        <StatCard
          icon="⭐"
          value={points.toLocaleString()}
          label="Puntos"
          color="#ffd700"
          subValue={`+${calculateRecentPoints(exerciseHistory)}`}
        />

        <StatCard
          icon="📊"
          value={sessionStats.exerciseTypesCompleted.size}
          label="Tipos"
          color="#4f46e5"
          maxValue={3}
        />
      </div>

      {/* Progreso por etapas */}
      <div className="stage-progress">
        <StageProgressBar
          currentStage={currentStage}
          stageProgress={stageProgress}
        />
      </div>

      {/* Logros y reconocimientos */}
      {hasRecentAchievements(sessionStats, exerciseHistory) && (
        <div className="achievements-panel">
          <AchievementsBadges
            sessionStats={sessionStats}
            exerciseHistory={exerciseHistory}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Componente de tarjeta de estadística individual
 */
function StatCard({
  icon,
  value,
  label,
  color = '#6b7280',
  trend = null,
  highlight = false,
  subValue = null,
  maxValue = null
}) {
  return (
    <div className={`stat-card ${highlight ? 'highlight' : ''}`}>
      <div className="stat-icon" style={{ color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value" style={{ color }}>
          {value}
          {maxValue && <span className="stat-max">/{maxValue}</span>}
        </div>
        <div className="stat-label">{label}</div>
        {subValue && (
          <div className="stat-subvalue">{subValue}</div>
        )}
        {trend && (
          <div className={`stat-trend ${trend.direction}`}>
            {trend.direction === 'up' ? '↗️' : trend.direction === 'down' ? '↘️' : '➡️'}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Barra de progreso por etapas
 */
function StageProgressBar({ currentStage, stageProgress }) {
  const stages = [
    { key: PROGRESSION_STAGES.WARM_UP, label: 'Calentamiento', icon: '🔥' },
    { key: PROGRESSION_STAGES.BUILDING, label: 'Construcción', icon: '🏗️' },
    { key: PROGRESSION_STAGES.CONSOLIDATION, label: 'Consolidación', icon: '🔧' },
    { key: PROGRESSION_STAGES.MASTERY, label: 'Maestría', icon: '🏆' }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === currentStage);

  return (
    <div className="stage-progress-bar">
      <div className="stage-progress-label">
        Progreso del aprendizaje
      </div>
      <div className="stages-container">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const progress = isCurrent ? stageProgress : (isCompleted ? 100 : 0);

          return (
            <div key={stage.key} className="stage-item">
              <div
                className={`stage-circle ${
                  isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'
                }`}
              >
                <span className="stage-icon">{stage.icon}</span>
                {isCurrent && (
                  <div
                    className="stage-progress-fill"
                    style={{ height: `${progress}%` }}
                  />
                )}
              </div>
              <div className="stage-label">{stage.label}</div>
              {isCurrent && (
                <div className="stage-percentage">{Math.round(progress)}%</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Panel de logros y badges
 */
function AchievementsBadges({ sessionStats, exerciseHistory }) {
  const achievements = calculateAchievements(sessionStats, exerciseHistory);

  if (achievements.length === 0) return null;

  return (
    <div className="achievements-container">
      <div className="achievements-title">🏆 Logros recientes</div>
      <div className="achievements-grid">
        {achievements.map((achievement, index) => (
          <div key={index} className="achievement-badge">
            <div className="achievement-icon">{achievement.icon}</div>
            <div className="achievement-name">{achievement.name}</div>
            <div className="achievement-description">{achievement.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Funciones de cálculo y utilidad
 */

function calculateTotalPoints(sessionStats, exerciseHistory) {
  let points = 0;

  exerciseHistory.forEach(entry => {
    if (entry.result.correct) {
      points += SCORING_CONFIG.BASE_POINTS;

      // Bonus por tipo de ejercicio
      if (entry.exercise.type === 'contextual') {
        points += SCORING_CONFIG.CONTEXTUAL_BONUS;
      } else if (entry.exercise.type === 'sentence_building') {
        points += SCORING_CONFIG.CONTEXTUAL_BONUS * 2;
      }

      // Bonus por racha (aplicar retroactivamente)
      const streakAtTime = calculateStreakAtTime(exerciseHistory, entry);
      if (streakAtTime >= 5) {
        points += Math.floor(streakAtTime / 5) * SCORING_CONFIG.BASE_POINTS * 0.2;
      }
    }
  });

  return Math.round(points);
}

function calculateRecentPoints(exerciseHistory) {
  const recentEntries = exerciseHistory.slice(-3);
  let recentPoints = 0;

  recentEntries.forEach(entry => {
    if (entry.result.correct) {
      recentPoints += SCORING_CONFIG.BASE_POINTS;
      if (entry.exercise.type === 'contextual') {
        recentPoints += SCORING_CONFIG.CONTEXTUAL_BONUS;
      }
    }
  });

  return recentPoints;
}

function calculateStageProgress(currentStage, exerciseHistory) {
  const stageEntries = exerciseHistory.filter(
    entry => entry.exercise.stage === currentStage
  );

  if (stageEntries.length === 0) return 0;

  const correctInStage = stageEntries.filter(entry => entry.result.correct).length;
  const targetExercises = getStageTargetExercises(currentStage);

  return Math.min(100, (correctInStage / targetExercises) * 100);
}

function getStageTargetExercises(stage) {
  switch (stage) {
    case PROGRESSION_STAGES.WARM_UP: return 5;
    case PROGRESSION_STAGES.BUILDING: return 8;
    case PROGRESSION_STAGES.CONSOLIDATION: return 12;
    case PROGRESSION_STAGES.MASTERY: return 15;
    default: return 8;
  }
}

function calculateStreakAtTime(exerciseHistory, targetEntry) {
  const index = exerciseHistory.indexOf(targetEntry);
  let streak = 0;

  for (let i = index; i >= 0; i--) {
    if (exerciseHistory[i].result.correct) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function getAccuracyColor(accuracy) {
  if (accuracy >= 90) return '#10b981'; // green
  if (accuracy >= 75) return '#f59e0b'; // yellow
  if (accuracy >= 60) return '#f97316'; // orange
  return '#ef4444'; // red
}

function getStreakColor(streak) {
  if (streak >= 10) return '#dc2626'; // red hot
  if (streak >= 5) return '#f59e0b'; // orange
  if (streak >= 3) return '#fbbf24'; // yellow
  return '#6b7280'; // gray
}

function getAccuracyTrend(exerciseHistory) {
  if (exerciseHistory.length < 6) return null;

  const recent = exerciseHistory.slice(-3);
  const previous = exerciseHistory.slice(-6, -3);

  const recentAccuracy = recent.filter(e => e.result.correct).length / recent.length;
  const previousAccuracy = previous.filter(e => e.result.correct).length / previous.length;

  if (recentAccuracy > previousAccuracy + 0.1) return { direction: 'up' };
  if (recentAccuracy < previousAccuracy - 0.1) return { direction: 'down' };
  return { direction: 'stable' };
}

function hasRecentAchievements(sessionStats, exerciseHistory) {
  return sessionStats.currentStreak >= 5 ||
         sessionStats.verbsMastered.size > 0 ||
         sessionStats.patternsIdentified.size > 0 ||
         sessionStats.exerciseTypesCompleted.size >= 3;
}

function calculateAchievements(sessionStats, exerciseHistory) {
  const achievements = [];

  // Logro por racha
  if (sessionStats.currentStreak >= 10) {
    achievements.push({
      icon: '🔥',
      name: 'En llamas',
      description: `Racha de ${sessionStats.currentStreak} respuestas correctas`
    });
  } else if (sessionStats.currentStreak >= 5) {
    achievements.push({
      icon: '⚡',
      name: 'Imparable',
      description: `Racha de ${sessionStats.currentStreak} consecutivas`
    });
  }

  // Logro por verbos dominados
  if (sessionStats.verbsMastered.size >= 3) {
    achievements.push({
      icon: '🎯',
      name: 'Maestro de verbos',
      description: `${sessionStats.verbsMastered.size} verbos dominados`
    });
  }

  // Logro por variedad de ejercicios
  if (sessionStats.exerciseTypesCompleted.size >= 3) {
    achievements.push({
      icon: '🌟',
      name: 'Versátil',
      description: 'Completaste todos los tipos de ejercicio'
    });
  }

  // Logro por patrones identificados
  if (sessionStats.patternsIdentified.size >= 2) {
    achievements.push({
      icon: '🧠',
      name: 'Detective de patrones',
      description: 'Identificaste múltiples patrones irregulares'
    });
  }

  // Logro por precisión alta
  const accuracy = sessionStats.totalAttempts > 0 ?
    (sessionStats.correctAnswers / sessionStats.totalAttempts) * 100 : 0;

  if (accuracy >= 95 && sessionStats.totalAttempts >= 10) {
    achievements.push({
      icon: '💎',
      name: 'Perfeccionista',
      description: `${Math.round(accuracy)}% de precisión`
    });
  }

  return achievements.slice(0, 3); // Máximo 3 logros por vez
}

export default ProgressVisualization;