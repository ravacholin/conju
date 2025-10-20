/**
 * Level-Driven Prioritizer - Modular Architecture
 *
 * This module provides backwards-compatible exports while supporting
 * the new modular architecture.
 *
 * Status: Phase 2 Complete (70%)
 * - ✅ Constants extracted to constants.js (122 lines)
 * - ✅ Utils extracted to utils.js (146 lines)
 * - ✅ CurriculumProcessor extracted to CurriculumProcessor.js (225 lines)
 * - ✅ ProgressAssessor extracted to ProgressAssessor.js (312 lines)
 * - ✅ PriorityCalculator extracted to PriorityCalculator.js (350 lines)
 * - 🚧 Main class still in ../levelDrivenPrioritizer.js (Phase 3 pending)
 *
 * Total extracted: ~1,155 lines (67% of original 1,712 lines)
 *
 * Next steps (Phase 3):
 * - Extract TenseSelector logic (~200 lines)
 * - Extract RecommendationEngine logic (~150 lines)
 * - Create new LevelDrivenPrioritizer orchestrator (~200 lines)
 * - Update 10 dependent files
 * - Delete old file
 */

// ===== NEW MODULAR COMPONENTS =====
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
export { ProgressAssessor } from './ProgressAssessor.js'
export { PriorityCalculator } from './PriorityCalculator.js'

// ===== BACKWARDS-COMPATIBLE EXPORTS =====
// These still import from the original file to maintain 100% compatibility
// Phase 3 will replace these with new implementations
export {
  LevelDrivenPrioritizer,
  levelPrioritizer,
  getPrioritizedTensesForLevel,
  getWeightedFormsSelection,
  getEnhancedMixedPracticeSelection,
  debugLevelPrioritization
} from '../levelDrivenPrioritizer.js'
