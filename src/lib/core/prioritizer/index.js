/**
 * Level-Driven Prioritizer - Modular Architecture
 *
 * This module provides backwards-compatible exports while supporting
 * the new modular architecture.
 *
 * Status: Phase 1 Complete
 * - ✅ Constants extracted to constants.js
 * - ✅ Utils extracted to utils.js
 * - ✅ CurriculumProcessor extracted to CurriculumProcessor.js
 * - 🚧 Main class still in ../levelDrivenPrioritizer.js (Phase 2 pending)
 *
 * Next steps:
 * - Extract ProgressAssessor logic (~300 lines)
 * - Extract TenseSelector logic (~400 lines)
 * - Extract PriorityCalculator logic (~300 lines)
 * - Move main class here
 * - Delete old file
 */

// Re-export new modular components
export { LEVEL_HIERARCHY, LEVEL_PRIORITY_WEIGHTS, CURRICULUM_ANALYSIS } from './constants.js'
export {
  getTenseKey,
  parseTenseKey,
  getTenseFamily,
  getFormComplexity,
  getLevelBaseComplexity,
  removeDuplicateTenses,
  isPrerequisiteForLevel,
  compareFamilyPriority
} from './utils.js'
export { CurriculumProcessor } from './CurriculumProcessor.js'

// Re-export from original file for backwards compatibility
// TODO Phase 2: Move these to new modular structure
export {
  LevelDrivenPrioritizer,
  levelPrioritizer,
  getPrioritizedTensesForLevel,
  getWeightedFormsSelection,
  getEnhancedMixedPracticeSelection,
  debugLevelPrioritization
} from '../levelDrivenPrioritizer.js'
