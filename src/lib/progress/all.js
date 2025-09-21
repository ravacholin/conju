// Exportar todas las funciones del sistema de progreso y analíticas

// Configuración y modelos de datos
export { 
  PROGRESS_CONFIG 
} from './config.js'

export { 
  VERB_DIFFICULTY, 
  FREQUENCY_DIFFICULTY_BONUS,
  ERROR_TAGS,
  FREQUENCY_LEVELS
} from './dataModels.js'

// Las definiciones de tipos JSDoc están disponibles desde dataModels.js
// No necesitan ser re-exportadas

// Base de datos
export {
  initDB,
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
  getDueSchedules,
  initializeFullDB,
  closeDB,
  deleteDB,
  clearAllCaches,
  getCacheStats
} from './database.js'

// Mastery (optimized with incremental caching)
export {
  getVerbDifficulty,
  calculateMasteryForTimeOrMood,
  getConfidenceLevel,
  classifyMasteryLevel
} from './mastery.js'

// Optimized mastery functions with incremental caching
export {
  calculateMasteryForItem,
  calculateMasteryForCell,
  notifyNewAttempt,
  getMasteryCacheStats,
  clearMasteryCache,
  cleanupMasteryCache
} from './incrementalMastery.js'

// Penalties
export {
  calculateHintPenalty
} from './penalties.js'

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
  minBy,
  formatPercentage,
  getMasteryColorClass,
  getMasteryLevelText,
  getMasteryIcon,
  formatRelativeDate,
  formatTimeOnly
} from './utils.js'

// Helpers
export { calculateRecencyWeight } from './helpers.js'

// UI
export {
  formatTime
} from './uiUtils.js'

// Analytics
export {
  getHeatMapData,
  getCompetencyRadarData,
  getProgressLineData,
  getUserStats as getAnalyticsUserStats
} from './analytics.js'

// Initialization API (re-exported for test compatibility)
export {
  initProgressSystem,
  isProgressSystemInitialized,
  getCurrentUserId,
  endCurrentSession,
  resetProgressSystem
} from './index.js'

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

// Note: Removed circular dependency exports that were causing blank page issues
// Components and hooks should import directly from their specific modules
// instead of through this all.js file to avoid circular dependencies
