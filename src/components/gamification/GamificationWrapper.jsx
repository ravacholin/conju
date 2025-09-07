import React, { useEffect, useState } from 'react';
import useGamification from '../../lib/gamification/useGamification.js';
import AchievementModal from './AchievementModal.jsx';
import StreakDisplay from './StreakDisplay.jsx';
import ProgressDashboard from './ProgressDashboard.jsx';

function GamificationWrapper({ 
  children, 
  currentExerciseResult = null,
  showCompactStreak = false,
  showDashboard = false,
  exerciseStartTime = null
}) {
  const {
    achievements,
    stats,
    newAchievements,
    showAchievementModal,
    startPracticeSession,
    recordExerciseResult,
    dismissAchievementModal,
    getMotivationalMessage,
    getStreakMilestones,
    getCalendarHeatMap,
    getSessionSummary,
    getUserLevelInfo,
    isStreakAtRisk
  } = useGamification();

  const [hasStartedSession, setHasStartedSession] = useState(false);

  // Start practice session on mount
  useEffect(() => {
    if (!hasStartedSession) {
      startPracticeSession();
      setHasStartedSession(true);
    }
  }, [startPracticeSession, hasStartedSession]);

  // Record exercise results when they come in
  useEffect(() => {
    if (currentExerciseResult && currentExerciseResult.processed !== true) {
      const responseTime = exerciseStartTime ? 
        new Date().getTime() - exerciseStartTime.getTime() : 3000;

      recordExerciseResult({
        isCorrect: currentExerciseResult.correct,
        responseTime: responseTime,
        tense: currentExerciseResult.tense || 'unknown',
        person: currentExerciseResult.person || 'unknown',
        verb: currentExerciseResult.lemma || currentExerciseResult.verb || 'unknown',
        difficulty: currentExerciseResult.difficulty || 'medium'
      });

      // Mark as processed to prevent duplicate recording
      currentExerciseResult.processed = true;
    }
  }, [currentExerciseResult, exerciseStartTime, recordExerciseResult]);

  const motivationalMessage = getMotivationalMessage();
  const streakMilestones = getStreakMilestones();
  const calendarHeatMap = getCalendarHeatMap();
  const sessionSummary = getSessionSummary();
  const userLevel = getUserLevelInfo();
  const streakAtRisk = isStreakAtRisk();

  if (showDashboard) {
    return (
      <ProgressDashboard
        userStats={stats}
        achievements={achievements}
        streakMilestones={streakMilestones}
        motivationalMessage={motivationalMessage}
        calendarHeatMap={calendarHeatMap}
        sessionSummary={sessionSummary}
        userLevel={userLevel}
      />
    );
  }

  return (
    <div className="gamification-wrapper">
      {showCompactStreak && (
        <div className="compact-streak-container">
          <StreakDisplay
            currentStreak={stats.currentStreak}
            longestStreak={stats.longestStreak}
            motivationalMessage={motivationalMessage}
            streakMilestones={streakMilestones}
            isAtRisk={streakAtRisk}
            compact={true}
          />
        </div>
      )}

      {children}

      <AchievementModal
        achievements={newAchievements}
        isVisible={showAchievementModal}
        onClose={dismissAchievementModal}
      />

      <style jsx>{`
        .gamification-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .compact-streak-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 100;
        }

        @media (max-width: 768px) {
          .compact-streak-container {
            top: 10px;
            right: 10px;
          }
        }
      `}</style>
    </div>
  );
}

export default GamificationWrapper;