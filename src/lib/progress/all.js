// Exportar todos los componentes del sistema de progreso

// Modelos de datos
export { ERROR_TAGS, FREQUENCY_LEVELS, VERB_DIFFICULTY } from './dataModels.js'

// Base de datos
export {
  saveToDB,
  getFromDB,
  getAllFromDB,
  getByIndex,
  getOneByIndex,
  deleteFromDB,
  updateInDB,
  saveUser,
  getUser,
  saveVerb,
  getVerb,
  getVerbByLemma,
  saveItem,
  getItem,
  getItemByProperties,
  saveAttempt,
  getAttempt,
  getAttemptsByItem,
  saveMastery,
  getMastery,
  getMasteryByCell,
  getMasteryByUser,
  saveSchedule,
  getSchedule,
  getScheduleByCell,
  getDueSchedules
} from './database.js'

// Mastery
export {
  calculateRecencyWeight,
  getVerbDifficulty,
  calculateHintPenalty,
  calculateMasteryForItem,
  calculateMasteryForCell,
  calculateMasteryForTimeOrMood,
  getConfidenceLevel,
  classifyMasteryLevel
} from './mastery.js'

// Tracking
export {
  initTracking,
  trackAttemptStarted,
  trackAttemptSubmitted,
  trackSessionEnded,
  trackHintShown,
  trackStreakIncremented,
  trackTenseDrillStarted,
  trackTenseDrillEnded,
  getUserStats,
  classifyError
} from './tracking.js'

// SRS
export {
  calculateNextInterval,
  updateSchedule,
  getDueItems,
  isItemDue
} from './srs.js'

// Utilidades
export {
  generateId,
  formatDate,
  dateDiffInDays,
  msToSeconds,
  groupBy,
  average,
  maxBy,
  minBy
} from './utils.js'

// UI
export {
  formatPercentage,
  formatTime,
  getMasteryColorClass,
  getMasteryLevelText,
  getMasteryIcon,
  formatRelativeDate
} from './uiUtils.js'

// Analytics
export {
  getHeatMapData,
  getCompetencyRadarData,
  getProgressLineData,
  getUserStats as getAnalyticsUserStats
} from './analytics.js'

// Goals
export {
  getWeeklyGoals,
  checkWeeklyProgress,
  getRecommendations
} from './goals.js'

// Teacher Mode
export {
  generateStudentReport,
  exportToCSV,
  generateSessionCode,
  getClassStats
} from './teacherMode.js'

// Diagnosis
export {
  performInitialDiagnosis,
  scheduleMonthlyRecalibration,
  performRecalibration
} from './diagnosis.js'

// Cloud Sync
export {
  syncWithCloud,
  getSyncStatus,
  setIncognitoMode,
  hasPendingSyncData,
  forceSync,
  exportDataForBackup,
  importDataFromBackup
} from './cloudSync.js'

// Inicialización
export {
  initProgressSystem,
  isProgressSystemInitialized,
  getCurrentUserId
} from './index.js'

export {
  initializeFullProgressSystem,
  isFullProgressSystemInitialized
} from './fullInitialization.js'