# Level-Driven Prioritizer - Modular Refactoring

## Overview

This directory contains the refactored modular version of `levelDrivenPrioritizer.js`.

**Original file**: 1,712 lines (342% over 500-line limit)
**Target**: Multiple modules, each <300 lines

## Refactoring Status

### ✅ Phase 1 Complete (Current Status)

**Extracted modules**:
- ✅ `constants.js` (122 lines) - All configuration constants
- ✅ `utils.js` (146 lines) - Pure utility functions
- ✅ `CurriculumProcessor.js` (225 lines) - Curriculum data processing
- ✅ `index.js` (40 lines) - Backwards-compatible exports

**Total extracted**: ~533 lines (31% of original)

**Benefits achieved**:
- Constants are now reusable across the codebase
- Pure functions are testable in isolation
- Curriculum processing is its own responsibility
- Zero breaking changes (fully backwards compatible)

### 🚧 Phase 2 Pending (Next Steps)

**Remaining work** (~1,179 lines to refactor):

1. **ProgressAssessor module** (~300 lines)
   - Methods: `createMasteryMap`, `assessReadiness`, `assessExplorationReadiness`, `determineLearningStage`, `getPrerequisiteGaps`

2. **PriorityCalculator module** (~350 lines)
   - Methods: `calculateAdvancedPriority`, `calculateUrgency`, `calculateLearningPriority`, `calculateReviewPriority`, `calculateExplorationPriority`, `calculateDynamicWeights`, `calculatePedagogicalValue`, `applyAdvancedProgressAdjustments`

3. **TenseSelector module** (~400 lines)
   - Methods: `getCoreTensesForLevel`, `getReviewTensesForLevel`, `getExplorationTensesForLevel`, `getEnhancedCoreTenses`, `getEnhancedReviewTenses`, `getEnhancedExplorationTenses`, `getWeightedSelection`, `removeDuplicateTenses`

4. **RecommendationEngine module** (~200 lines)
   - Methods: `getNextRecommendedTense`, `getRecommendedFocus`, `getProgressionPath`, `debugPrioritization`

5. **Main orchestrator** (~100 lines)
   - Simplified `LevelDrivenPrioritizer` class that delegates to modules

### 📊 Architecture

```
src/lib/core/prioritizer/
├── index.js                    ✅ Backwards-compatible exports
├── constants.js                ✅ Configuration data
├── utils.js                    ✅ Pure utility functions
├── CurriculumProcessor.js      ✅ Curriculum processing
├── ProgressAssessor.js         🚧 TODO
├── PriorityCalculator.js       🚧 TODO
├── TenseSelector.js            🚧 TODO
├── RecommendationEngine.js     🚧 TODO
└── __tests__/                  🚧 TODO
    ├── CurriculumProcessor.test.js
    ├── ProgressAssessor.test.js
    ├── PriorityCalculator.test.js
    ├── TenseSelector.test.js
    └── RecommendationEngine.test.js
```

## Usage

### Current (Backwards Compatible)

All existing code continues to work without changes:

```javascript
// Old import still works
import { levelPrioritizer, getPrioritizedTensesForLevel } from '../core/levelDrivenPrioritizer.js'

// New import also works (same exports)
import { levelPrioritizer, getPrioritizedTensesForLevel } from '../core/prioritizer/index.js'
```

### New Modular API (Available Now)

You can now use the extracted modules independently:

```javascript
import { CURRICULUM_ANALYSIS, LEVEL_PRIORITY_WEIGHTS } from '../core/prioritizer/constants.js'
import { getTenseFamily, getFormComplexity } from '../core/prioritizer/utils.js'
import { CurriculumProcessor } from '../core/prioritizer/CurriculumProcessor.js'

// Use curriculum processor independently
const processor = new CurriculumProcessor()
const levelData = processor.getLevelData('B1')
const family = processor.getTenseFamily('indicative|pres')
```

## Benefits

### Achieved (Phase 1)
- ✅ Constants centralized (easier to maintain)
- ✅ Utils are pure functions (easily testable)
- ✅ Curriculum processing decoupled (reusable)
- ✅ Zero breaking changes
- ✅ Better code organization

### Planned (Phase 2)
- 🎯 All files <300 lines (maintainability)
- 🎯 Each module has single responsibility (SRP)
- 🎯 Comprehensive unit tests
- 🎯 Better tree-shaking (smaller bundle)
- 🎯 Faster onboarding for new developers

## Testing

### Phase 1 Modules (Ready to Test)

```bash
# Test constants
npm test -- constants.test.js

# Test utils
npm test -- utils.test.js

# Test CurriculumProcessor
npm test -- CurriculumProcessor.test.js
```

### Integration Test

The original exports still work, so existing tests should pass:

```bash
npm test -- levelDrivenPrioritizer.test.js
```

## Migration Guide (For Phase 2)

When Phase 2 is complete, update imports:

```javascript
// OLD (will be deprecated)
import { levelPrioritizer } from '../core/levelDrivenPrioritizer.js'

// NEW (recommended)
import { levelPrioritizer } from '../core/prioritizer/index.js'

// OR use specific modules
import { TenseSelector } from '../core/prioritizer/TenseSelector.js'
import { PriorityCalculator } from '../core/prioritizer/PriorityCalculator.js'
```

## Files Affected (Phase 2 Migration)

When completing Phase 2, these 10 files will need import updates:
1. `src/lib/progress/studyPlansV2.js`
2. `src/lib/progress/personalizedCoaching.js`
3. `src/lib/progress/AdaptivePracticeEngine.js`
4. `src/lib/core/quickLevelTest.js`
5. `src/lib/core/levelDrivenTesting.js`
6. `src/lib/core/generator.js`
7. `src/lib/core/FormSelectorService.js`
8. `src/hooks/useDrillMode_refactored.js`
9. `src/hooks/useDrillMode.js`
10. Test files

**Migration script** will be provided to automate this.

## Timeline

| Phase | Status | Lines Refactored | Effort | ETA |
|-------|--------|------------------|--------|-----|
| Phase 1 | ✅ DONE | 533 (31%) | 2 hours | Complete |
| Phase 2 | 🚧 TODO | 1,179 (69%) | 1-2 days | TBD |
| Testing | 🚧 TODO | N/A | 0.5 days | TBD |
| Migration | 🚧 TODO | N/A | 0.5 days | TBD |

## Principles

1. **Backwards Compatibility**: No breaking changes until Phase 2 complete
2. **Single Responsibility**: Each module does one thing well
3. **Testability**: All modules independently testable
4. **Performance**: No performance degradation
5. **Safety**: Gradual migration with verification at each step

---

**Status**: 📋 Phase 1 Complete, Phase 2 Planned
**Last Updated**: 2025-10-20
**Contributor**: Claude Code
