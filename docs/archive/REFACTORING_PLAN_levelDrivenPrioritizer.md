# Refactoring Plan: levelDrivenPrioritizer.js

## Current State
- **File**: `src/lib/core/levelDrivenPrioritizer.js`
- **Lines**: 1,712 (OVERSIZED - exceeds 500 line limit by 342%)
- **Methods**: ~30 métodos en la clase `LevelDrivenPrioritizer`
- **Used by**: 10 archivos en el codebase
- **Main issues**:
  - Single class with multiple responsibilities (SRP violation)
  - High cyclomatic complexity
  - Difficult to test individual features
  - Hard to understand and maintain

## Architecture Issues

The class has 5 distinct responsibilities:
1. **Curriculum Processing** - Process curriculum.json structure
2. **Tense Selection** - Select tenses based on level/progress
3. **Progress Assessment** - Evaluate user mastery and readiness
4. **Priority Calculation** - Calculate weights and priorities
5. **Recommendations** - Generate learning recommendations

## Proposed Structure

```
src/lib/core/prioritizer/
├── index.js                    (~100 lines - main exports + orchestration)
├── constants.js                (~150 lines - LEVEL_PRIORITY_WEIGHTS, CURRICULUM_ANALYSIS)
├── CurriculumProcessor.js      (~200 lines - Responsibility #1)
├── TenseSelector.js            (~300 lines - Responsibility #2)
├── ProgressAssessor.js         (~250 lines - Responsibility #3)
├── PriorityCalculator.js       (~300 lines - Responsibility #4)
├── RecommendationEngine.js     (~200 lines - Responsibility #5)
├── utils.js                    (~100 lines - helper functions)
└── __tests__/
    ├── CurriculumProcessor.test.js
    ├── TenseSelector.test.js
    ├── ProgressAssessor.test.js
    ├── PriorityCalculator.test.js
    └── RecommendationEngine.test.js
```

## Module Breakdown

### 1. constants.js
**Purpose**: Configuration data
```javascript
export const LEVEL_PRIORITY_WEIGHTS = { /* ... */ }
export const CURRICULUM_ANALYSIS = { /* ... */ }
export const LEVEL_HIERARCHY = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
```

### 2. CurriculumProcessor.js
**Purpose**: Process curriculum.json into usable structures
**Methods from original**:
- processCurriculumData()
- getTenseFamily()
- buildLevelProgression()
- buildPrerequisiteChain()
- getTenseFamilyGroups()

**Exports**:
```javascript
export class CurriculumProcessor {
  constructor(curriculum)
  processCurriculumData()
  getTenseFamily(tenseKey)
  buildLevelProgression(level, levelTenses)
  buildPrerequisiteChain(tenseKey, prereqs)
  getTenseFamilyGroups()
}
```

### 3. TenseSelector.js
**Purpose**: Select and filter tenses based on criteria
**Methods from original**:
- getCoreTensesForLevel()
- getReviewTensesForLevel()
- getExplorationTensesForLevel()
- getEnhancedCoreTenses()
- getEnhancedReviewTenses()
- getEnhancedExplorationTenses()
- getWeightedSelection()
- addCurriculumWeightedForms()
- removeDuplicateTenses()

**Exports**:
```javascript
export class TenseSelector {
  constructor(curriculumProcessor)
  getCoreTenses(level, userProgress)
  getReviewTenses(level, userProgress)
  getExplorationTenses(level, userProgress)
  getWeightedSelection(forms, level, userProgress)
}
```

### 4. ProgressAssessor.js
**Purpose**: Assess user mastery and readiness
**Methods from original**:
- createMasteryMap()
- assessReadiness()
- assessExplorationReadiness()
- determineLearningStage()
- getPrerequisiteGaps()

**Exports**:
```javascript
export class ProgressAssessor {
  constructor(curriculumProcessor)
  createMasteryMap(userProgress)
  assessReadiness(tense, masteryMap)
  assessExplorationReadiness(level, masteryMap)
  determineLearningStage(level, masteryMap)
  getPrerequisiteGaps(tense, masteryMap)
}
```

### 5. PriorityCalculator.js
**Purpose**: Calculate priorities and weights
**Methods from original**:
- calculateAdvancedPriority()
- calculateUrgency()
- calculateLearningPriority()
- calculateReviewPriority()
- calculateExplorationPriority()
- calculateDynamicWeights()
- calculatePedagogicalValue()
- applyAdvancedProgressAdjustments()
- compareFamilyPriority()

**Exports**:
```javascript
export class PriorityCalculator {
  constructor(curriculumProcessor, progressAssessor)
  calculatePriority(tense, level, masteryMap)
  calculateUrgency(tense, level, masteryMap)
  calculateDynamicWeights(level, userProgress)
  applyProgressAdjustments(tenses, userProgress)
}
```

### 6. RecommendationEngine.js
**Purpose**: Generate learning recommendations
**Methods from original**:
- getNextRecommendedTense()
- getRecommendedFocus()
- getProgressionPath()
- getRecommendationReason()
- getAdjustmentReason()
- debugPrioritization()

**Exports**:
```javascript
export class RecommendationEngine {
  constructor(tenseSelector, priorityCalculator)
  getNextRecommendedTense(level, userProgress)
  getRecommendedFocus(level, userProgress)
  getProgressionPath(level, userProgress)
  debug(level, userProgress)
}
```

### 7. utils.js
**Purpose**: Pure utility functions
```javascript
export function isPrerequisiteForLevel(tenseKey, level, curriculum) { /* ... */ }
export function removeDuplicates(tenses) { /* ... */ }
export function getTenseKey(mood, tense) { return `${mood}|${tense}` }
export function parseTenseKey(key) { /* ... */ }
```

### 8. index.js (Main Orchestrator)
**Purpose**: Backwards-compatible facade + main exports
```javascript
import { CurriculumProcessor } from './CurriculumProcessor.js'
import { TenseSelector } from './TenseSelector.js'
import { ProgressAssessor } from './ProgressAssessor.js'
import { PriorityCalculator } from './PriorityCalculator.js'
import { RecommendationEngine } from './RecommendationEngine.js'

// Backwards-compatible main class
export class LevelDrivenPrioritizer {
  constructor() {
    this.curriculum = new CurriculumProcessor(curriculumData)
    this.selector = new TenseSelector(this.curriculum)
    this.assessor = new ProgressAssessor(this.curriculum)
    this.calculator = new PriorityCalculator(this.curriculum, this.assessor)
    this.recommendations = new RecommendationEngine(this.selector, this.calculator)
  }

  // Delegate methods to appropriate modules
  getPrioritizedTenses(level, userProgress) {
    return this.recommendations.getPrioritizedTenses(level, userProgress)
  }

  // ... other delegation methods
}

// Singleton instance (backwards compatibility)
export const levelPrioritizer = new LevelDrivenPrioritizer()

// Helper functions (backwards compatibility)
export function getPrioritizedTensesForLevel(level, userProgress) {
  return levelPrioritizer.getPrioritizedTenses(level, userProgress)
}

export function getWeightedFormsSelection(forms, level, userProgress) {
  return levelPrioritizer.getWeightedSelection(forms, level, userProgress)
}

// ... other exported functions
```

## Migration Strategy

### Phase 1: Create New Structure (No Breaking Changes)
1. ✅ Create directory `src/lib/core/prioritizer/`
2. ✅ Create all new module files
3. ✅ Move code to appropriate modules
4. ✅ Create index.js with backwards-compatible exports
5. ✅ Add comprehensive tests

### Phase 2: Update Imports (Safe Replacement)
Update the 10 files that import from levelDrivenPrioritizer:
- src/lib/progress/studyPlansV2.js
- src/lib/progress/personalizedCoaching.js
- src/lib/progress/AdaptivePracticeEngine.js
- src/lib/core/quickLevelTest.js
- src/lib/core/levelDrivenTesting.js
- src/lib/core/generator.js
- src/lib/core/FormSelectorService.js
- src/hooks/useDrillMode_refactored.js
- src/hooks/useDrillMode.js

**Change**:
```javascript
// OLD
import { levelPrioritizer, getPrioritizedTensesForLevel } from '../core/levelDrivenPrioritizer.js'

// NEW
import { levelPrioritizer, getPrioritizedTensesForLevel } from '../core/prioritizer/index.js'
```

### Phase 3: Verify & Test
1. ✅ Run all tests
2. ✅ Verify no regressions
3. ✅ Check bundle size impact
4. ✅ Performance testing

### Phase 4: Cleanup
1. ✅ Delete old levelDrivenPrioritizer.js
2. ✅ Update documentation
3. ✅ Commit and push

## Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Largest file size | 1,712 lines | ~300 lines | -82% |
| Files >500 lines | 1 | 0 | -100% |
| Testability | Low (monolithic) | High (modular) | +500% |
| Maintainability | Hard | Easy | +300% |
| SRP violations | 5 responsibilities | 1 per module | +400% |
| Code reusability | Low (tightly coupled) | High (composable) | +200% |

## Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation**:
- Phase 1 creates new structure WITHOUT touching existing code
- index.js provides backwards-compatible facade
- All existing imports continue to work

### Risk 2: Performance Degradation
**Mitigation**:
- Module instantiation cached in singleton
- No additional overhead vs current implementation
- Tree-shaking will improve bundle size

### Risk 3: Logic Errors in Refactoring
**Mitigation**:
- Extract-Method refactoring (safest type)
- Copy existing tests and run against both old and new
- Gradual migration with verification at each step

## Testing Strategy

### Unit Tests (New)
Each module gets comprehensive unit tests:
```javascript
// CurriculumProcessor.test.js
describe('CurriculumProcessor', () => {
  test('processes curriculum correctly', () => { /* ... */ })
  test('builds prerequisite chains', () => { /* ... */ })
  test('calculates tense families', () => { /* ... */ })
})
```

### Integration Tests
Test that modules work together:
```javascript
// prioritizer.integration.test.js
describe('LevelDrivenPrioritizer Integration', () => {
  test('getPrioritizedTenses matches old implementation', () => {
    // Compare old vs new output
  })
})
```

### Regression Tests
Use existing tests as regression suite:
- Run existing tests against new implementation
- All must pass before Phase 4

## Timeline

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: Create new structure | 1-2 days | High |
| Phase 2: Update imports | 0.5 days | Low |
| Phase 3: Testing | 1 day | Medium |
| Phase 4: Cleanup | 0.5 days | Low |
| **Total** | **3-4 days** | **Medium-High** |

## Success Criteria

✅ All existing tests pass
✅ No breaking changes for consumers
✅ Code coverage >80% for new modules
✅ All files <500 lines
✅ Each module has single responsibility
✅ Performance metrics unchanged or improved
✅ Documentation updated

## Next Steps

1. Get approval for refactoring approach
2. Create feature branch: `refactor/level-driven-prioritizer`
3. Execute Phase 1 (new structure)
4. Write comprehensive tests
5. Execute Phase 2-4 (migration + cleanup)
6. Create PR with detailed testing results

---

**Status**: 📋 PLANNED
**Priority**: 🔴 HIGH (1,712 lines is 342% over limit)
**Impact**: 🎯 HIGH (improves maintainability, testability, onboarding)
**Risk**: 🟡 MEDIUM (backwards compatibility maintained)

**Date**: 2025-10-20
