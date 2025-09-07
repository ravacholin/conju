// Gamification hook that integrates achievements and streaks with the learning system
// Provides a unified interface for tracking progress, unlocking achievements, and maintaining streaks

import { useState, useEffect, useCallback, useRef } from 'react';
import { checkAchievements, calculateTotalPoints, getUserLevel } from './achievements.js';
import { createStreakTracker, getTimeBasedStats } from './streakTracker.js';

const STORAGE_KEYS = {
  ACHIEVEMENTS: 'spanish_conjugator_achievements',
  STREAK_DATA: 'spanish_conjugator_streak_data',
  STATS: 'spanish_conjugator_gamification_stats',
  NOTIFICATIONS: 'spanish_conjugator_achievement_notifications'
};

export function useGamification() {
  const [achievements, setAchievements] = useState([]);
  const [streakTracker, setStreakTracker] = useState(null);
  const [stats, setStats] = useState({
    totalExercises: 0,
    currentStreak: 0,
    currentPerfectStreak: 0,
    tenseAccuracy: {},
    tensesPracticed: {},
    verbsPracticed: {},
    personsPracticed: {},
    fastAnswers: 0,
    lightningAnswers: 0,
    weekendSessions: 0,
    earlyBirdSessions: 0,
    nightOwlSessions: 0,
    totalPoints: 0,
    level: 1
  });
  const [newAchievements, setNewAchievements] = useState([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const sessionStatsRef = useRef({
    sessionStartTime: null,
    sessionAnswerTimes: [],
    sessionCorrectAnswers: 0,
    sessionTotalAnswers: 0
  });

  // Initialize gamification system
  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = useCallback(() => {
    try {
      // Load achievements
      const savedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      }

      // Load streak data
      const savedStreakData = localStorage.getItem(STORAGE_KEYS.STREAK_DATA);
      const tracker = createStreakTracker(savedStreakData ? JSON.parse(savedStreakData) : null);
      setStreakTracker(tracker);

      // Load stats
      const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        const totalPoints = calculateTotalPoints(achievements);
        const level = getUserLevel(totalPoints);
        
        setStats({
          ...parsedStats,
          totalPoints,
          level: level.level,
          currentStreak: tracker.currentStreak
        });
      }

      // Start session tracking
      sessionStatsRef.current.sessionStartTime = new Date();
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }
  }, [achievements]);

  // Save data to localStorage
  const saveGamificationData = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
      if (streakTracker) {
        localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(streakTracker.toJSON()));
      }
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving gamification data:', error);
    }
  }, [achievements, streakTracker, stats]);

  // Auto-save when data changes
  useEffect(() => {
    saveGamificationData();
  }, [achievements, stats, streakTracker]);

  // Record a practice session start
  const startPracticeSession = useCallback(() => {
    if (streakTracker) {
      const newStreak = streakTracker.recordPracticeSession();
      const timeStats = getTimeBasedStats();
      
      setStats(prevStats => {
        const updatedStats = {
          ...prevStats,
          currentStreak: newStreak,
          weekendSessions: timeStats.isWeekend ? prevStats.weekendSessions + 1 : prevStats.weekendSessions,
          earlyBirdSessions: timeStats.isEarlyMorning ? prevStats.earlyBirdSessions + 1 : prevStats.earlyBirdSessions,
          nightOwlSessions: timeStats.isLateNight ? prevStats.nightOwlSessions + 1 : prevStats.nightOwlSessions
        };
        
        // Check for new achievements
        checkAndUnlockAchievements(updatedStats);
        return updatedStats;
      });
    }
    
    sessionStatsRef.current.sessionStartTime = new Date();
    sessionStatsRef.current.sessionAnswerTimes = [];
    sessionStatsRef.current.sessionCorrectAnswers = 0;
    sessionStatsRef.current.sessionTotalAnswers = 0;
  }, [streakTracker]);

  // Record an exercise result
  const recordExerciseResult = useCallback((result) => {
    const { isCorrect, responseTime, tense, person, verb } = result;
    const currentTime = new Date();
    
    // Update session stats
    sessionStatsRef.current.sessionTotalAnswers++;
    if (isCorrect) {
      sessionStatsRef.current.sessionCorrectAnswers++;
      sessionStatsRef.current.sessionAnswerTimes.push(responseTime);
    }

    setStats(prevStats => {
      const updatedStats = {
        ...prevStats,
        totalExercises: prevStats.totalExercises + 1,
        tenseAccuracy: {
          ...prevStats.tenseAccuracy,
          [tense]: calculateNewAccuracy(prevStats.tenseAccuracy[tense] || 0, isCorrect)
        },
        tensesPracticed: {
          ...prevStats.tensesPracticed,
          [tense]: (prevStats.tensesPracticed[tense] || 0) + 1
        },
        verbsPracticed: {
          ...prevStats.verbsPracticed,
          [verb]: (prevStats.verbsPracticed[verb] || 0) + 1
        },
        personsPracticed: {
          ...prevStats.personsPracticed,
          [person]: (prevStats.personsPracticed[person] || 0) + 1
        }
      };

      // Update perfect streak
      if (streakTracker) {
        if (isCorrect) {
          updatedStats.currentPerfectStreak = streakTracker.recordCorrectAnswer();
        } else {
          streakTracker.recordIncorrectAnswer();
          updatedStats.currentPerfectStreak = 0;
        }
      }

      // Track fast answers
      if (isCorrect && responseTime < 3000) {
        updatedStats.fastAnswers = prevStats.fastAnswers + 1;
      }
      if (isCorrect && responseTime < 2000) {
        updatedStats.lightningAnswers = prevStats.lightningAnswers + 1;
      }

      // Check for new achievements
      checkAndUnlockAchievements(updatedStats);
      
      return updatedStats;
    });
  }, [streakTracker]);

  // Check and unlock new achievements
  const checkAndUnlockAchievements = useCallback((currentStats) => {
    const newlyUnlocked = checkAchievements(currentStats, achievements);
    
    if (newlyUnlocked.length > 0) {
      setAchievements(prev => [...prev, ...newlyUnlocked]);
      setNewAchievements(newlyUnlocked);
      setShowAchievementModal(true);
      
      // Update total points and level
      const newTotalPoints = calculateTotalPoints([...achievements, ...newlyUnlocked]);
      const newLevel = getUserLevel(newTotalPoints);
      
      setStats(prev => ({
        ...prev,
        totalPoints: newTotalPoints,
        level: newLevel.level
      }));
    }
  }, [achievements]);

  // Calculate accuracy with exponential smoothing
  const calculateNewAccuracy = (currentAccuracy, isCorrect) => {
    const alpha = 0.1; // Smoothing factor
    const newResult = isCorrect ? 1 : 0;
    return currentAccuracy * (1 - alpha) + newResult * alpha;
  };

  // Get current motivational message
  const getMotivationalMessage = useCallback(() => {
    if (streakTracker) {
      return streakTracker.getMotivationalMessage();
    }
    return { message: "¡Comienza a practicar hoy!", type: "start", icon: "🚀" };
  }, [streakTracker]);

  // Get streak milestones
  const getStreakMilestones = useCallback(() => {
    if (streakTracker) {
      return streakTracker.getStreakMilestones();
    }
    return { current: 0, next: 3, progress: 0, daysToNext: 3 };
  }, [streakTracker]);

  // Get calendar heat map data
  const getCalendarHeatMap = useCallback((months = 12) => {
    if (streakTracker) {
      return streakTracker.getCalendarHeatMap(months);
    }
    return [];
  }, [streakTracker]);

  // Get session summary
  const getSessionSummary = useCallback(() => {
    const session = sessionStatsRef.current;
    const sessionDuration = session.sessionStartTime ? 
      (new Date() - session.sessionStartTime) / 1000 / 60 : 0; // in minutes
    
    const averageTime = session.sessionAnswerTimes.length > 0 ?
      session.sessionAnswerTimes.reduce((a, b) => a + b, 0) / session.sessionAnswerTimes.length : 0;

    return {
      duration: Math.round(sessionDuration),
      totalAnswers: session.sessionTotalAnswers,
      correctAnswers: session.sessionCorrectAnswers,
      accuracy: session.sessionTotalAnswers > 0 ? 
        (session.sessionCorrectAnswers / session.sessionTotalAnswers * 100).toFixed(1) : 0,
      averageResponseTime: Math.round(averageTime / 1000), // in seconds
      exercisesPerMinute: sessionDuration > 0 ? 
        (session.sessionTotalAnswers / sessionDuration).toFixed(1) : 0
    };
  }, []);

  // Dismiss achievement modal
  const dismissAchievementModal = useCallback(() => {
    setShowAchievementModal(false);
    setNewAchievements([]);
  }, []);

  // Get user level info
  const getUserLevelInfo = useCallback(() => {
    const totalPoints = calculateTotalPoints(achievements);
    return getUserLevel(totalPoints);
  }, [achievements]);

  // Check if streak is at risk
  const isStreakAtRisk = useCallback(() => {
    return streakTracker ? streakTracker.isStreakAtRisk() : false;
  }, [streakTracker]);

  return {
    // Data
    achievements,
    stats,
    newAchievements,
    showAchievementModal,
    
    // Actions
    startPracticeSession,
    recordExerciseResult,
    dismissAchievementModal,
    
    // Getters
    getMotivationalMessage,
    getStreakMilestones,
    getCalendarHeatMap,
    getSessionSummary,
    getUserLevelInfo,
    isStreakAtRisk,
    
    // Utilities
    saveGamificationData,
    loadGamificationData
  };
}

export default useGamification;