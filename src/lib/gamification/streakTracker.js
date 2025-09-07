// Streak tracking system for maintaining user engagement
// Handles daily practice streaks, perfect answer streaks, and related statistics

export class StreakTracker {
  constructor(initialData = {}) {
    this.currentStreak = initialData.currentStreak || 0;
    this.longestStreak = initialData.longestStreak || 0;
    this.lastPracticeDate = initialData.lastPracticeDate || null;
    this.currentPerfectStreak = initialData.currentPerfectStreak || 0;
    this.longestPerfectStreak = initialData.longestPerfectStreak || 0;
    this.streakStartDate = initialData.streakStartDate || null;
    this.practiceCalendar = initialData.practiceCalendar || {}; // date -> session count
    this.streakFreezes = initialData.streakFreezes || 0; // Premium feature: protect streak
    this.totalSessionDays = initialData.totalSessionDays || 0;
  }

  // Check if user practiced today
  checkTodaysPractice() {
    const today = this.getTodayString();
    return this.practiceCalendar[today] > 0;
  }

  // Record a practice session
  recordPracticeSession(sessionDate = null) {
    const dateString = sessionDate || this.getTodayString();
    const yesterday = this.getYesterdayString();
    
    // Update practice calendar
    if (!this.practiceCalendar[dateString]) {
      this.practiceCalendar[dateString] = 0;
      this.totalSessionDays++;
    }
    this.practiceCalendar[dateString]++;

    // Update streak logic
    if (!this.lastPracticeDate) {
      // First ever practice session
      this.currentStreak = 1;
      this.streakStartDate = dateString;
    } else if (this.lastPracticeDate === yesterday) {
      // Continuing streak from yesterday
      this.currentStreak++;
    } else if (this.lastPracticeDate === dateString) {
      // Already practiced today, no streak change
      return this.currentStreak;
    } else {
      // Streak broken, start fresh
      this.currentStreak = 1;
      this.streakStartDate = dateString;
    }

    // Update longest streak record
    if (this.currentStreak > this.longestStreak) {
      this.longestStreak = this.currentStreak;
    }

    this.lastPracticeDate = dateString;
    return this.currentStreak;
  }

  // Record a correct answer for perfect streak tracking
  recordCorrectAnswer() {
    this.currentPerfectStreak++;
    if (this.currentPerfectStreak > this.longestPerfectStreak) {
      this.longestPerfectStreak = this.currentPerfectStreak;
    }
    return this.currentPerfectStreak;
  }

  // Record an incorrect answer (breaks perfect streak)
  recordIncorrectAnswer() {
    this.currentPerfectStreak = 0;
  }

  // Check if streak is at risk (last practice was yesterday)
  isStreakAtRisk() {
    if (!this.lastPracticeDate || this.currentStreak === 0) {
      return false;
    }
    
    const yesterday = this.getYesterdayString();
    return this.lastPracticeDate === yesterday;
  }

  // Check if streak is broken (last practice was more than a day ago)
  isStreakBroken() {
    if (!this.lastPracticeDate || this.currentStreak === 0) {
      return false;
    }
    
    const yesterday = this.getYesterdayString();
    const today = this.getTodayString();
    
    return this.lastPracticeDate !== yesterday && this.lastPracticeDate !== today;
  }

  // Use a streak freeze (premium feature)
  useStreakFreeze() {
    if (this.streakFreezes > 0) {
      this.streakFreezes--;
      // Extend last practice date to today to protect streak
      this.lastPracticeDate = this.getTodayString();
      return true;
    }
    return false;
  }

  // Add streak freezes (premium reward)
  addStreakFreezes(count) {
    this.streakFreezes += count;
  }

  // Get practice statistics for a date range
  getPracticeStats(days = 30) {
    const stats = {
      totalSessions: 0,
      activeDays: 0,
      averageSessionsPerDay: 0,
      mostActiveDay: null,
      maxSessionsInDay: 0
    };

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateString = this.formatDate(d);
      const sessions = this.practiceCalendar[dateString] || 0;
      
      if (sessions > 0) {
        stats.totalSessions += sessions;
        stats.activeDays++;
        
        if (sessions > stats.maxSessionsInDay) {
          stats.maxSessionsInDay = sessions;
          stats.mostActiveDay = dateString;
        }
      }
    }

    stats.averageSessionsPerDay = stats.activeDays > 0 ? 
      (stats.totalSessions / stats.activeDays).toFixed(1) : 0;

    return stats;
  }

  // Get streak milestones for motivation
  getStreakMilestones() {
    const milestones = [3, 7, 14, 30, 50, 100, 365];
    const currentStreak = this.currentStreak;
    
    const nextMilestone = milestones.find(m => m > currentStreak);
    const lastMilestone = milestones.filter(m => m <= currentStreak).pop();
    
    return {
      current: currentStreak,
      next: nextMilestone,
      last: lastMilestone,
      progress: nextMilestone ? (currentStreak / nextMilestone) : 1,
      daysToNext: nextMilestone ? nextMilestone - currentStreak : 0
    };
  }

  // Get calendar heat map data for visualization
  getCalendarHeatMap(months = 12) {
    const heatMapData = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - months);

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateString = this.formatDate(d);
      const sessions = this.practiceCalendar[dateString] || 0;
      
      heatMapData.push({
        date: dateString,
        sessions: sessions,
        level: this.getHeatMapLevel(sessions)
      });
    }

    return heatMapData;
  }

  // Determine heat map intensity level
  getHeatMapLevel(sessions) {
    if (sessions === 0) return 0;
    if (sessions <= 2) return 1;
    if (sessions <= 5) return 2;
    if (sessions <= 10) return 3;
    return 4;
  }

  // Get encouraging messages based on streak status
  getMotivationalMessage() {
    const { current, next, daysToNext } = this.getStreakMilestones();
    
    if (current === 0) {
      return {
        message: "¡Comienza tu primera racha hoy!",
        type: "start",
        icon: "🚀"
      };
    }
    
    if (this.isStreakAtRisk()) {
      return {
        message: `¡Tu racha de ${current} días está en riesgo! Practica hoy para mantenerla.`,
        type: "warning",
        icon: "⚠️"
      };
    }
    
    if (current >= 100) {
      return {
        message: `¡Increíble! ${current} días consecutivos. Eres una leyenda del español.`,
        type: "legendary",
        icon: "👑"
      };
    }
    
    if (current >= 30) {
      return {
        message: `¡Fantástico! ${current} días de práctica constante.`,
        type: "excellent",
        icon: "🌟"
      };
    }
    
    if (current >= 7) {
      return {
        message: `¡Una semana completa! Llevas ${current} días seguidos.`,
        type: "good",
        icon: "🔥"
      };
    }
    
    if (next && daysToNext <= 3) {
      return {
        message: `¡Solo ${daysToNext} días más para alcanzar ${next} días consecutivos!`,
        type: "milestone",
        icon: "🎯"
      };
    }
    
    return {
      message: `¡Excelente! Llevas ${current} días de racha.`,
      type: "positive",
      icon: "💪"
    };
  }

  // Utility methods
  getTodayString() {
    return this.formatDate(new Date());
  }

  getYesterdayString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.formatDate(yesterday);
  }

  formatDate(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Export data for persistence
  toJSON() {
    return {
      currentStreak: this.currentStreak,
      longestStreak: this.longestStreak,
      lastPracticeDate: this.lastPracticeDate,
      currentPerfectStreak: this.currentPerfectStreak,
      longestPerfectStreak: this.longestPerfectStreak,
      streakStartDate: this.streakStartDate,
      practiceCalendar: this.practiceCalendar,
      streakFreezes: this.streakFreezes,
      totalSessionDays: this.totalSessionDays
    };
  }
}

// Factory function to create or restore a streak tracker
export function createStreakTracker(savedData = null) {
  if (savedData) {
    return new StreakTracker(savedData);
  }
  return new StreakTracker();
}

// Helper function to calculate time-based achievements
export function getTimeBasedStats() {
  const now = new Date();
  const hour = now.getHours();
  
  return {
    isEarlyMorning: hour >= 5 && hour < 7,  // 5-7 AM
    isLateNight: hour >= 22 || hour < 5,    // 10 PM - 5 AM
    isWeekend: now.getDay() === 0 || now.getDay() === 6,
    dayOfWeek: now.getDay(),
    hour: hour
  };
}