# Refactoring Plan: database.js → Modular Architecture

## Current State

**File**: `src/lib/progress/database.js`
**Size**: 1,330 lines (266% over 500-line limit)
**Exports**: 50 functions
**Complexity**: CRITICAL - Multiple responsibilities mixed

## Problem Analysis

The current `database.js` violates Single Responsibility Principle by handling:
1. Database connection management
2. In-memory caching
3. Generic CRUD operations
4. User-specific operations
5. Verb-specific operations
6. Item-specific operations
7. Attempts tracking
8. Mastery tracking
9. Schedule management
10. Learning session tracking
11. Event tracking
12. Data migration

## Proposed Modular Architecture

```
src/lib/progress/database/
├── index.js                      (~100 lines) - Main orchestrator & exports
├── connection/
│   ├── DatabaseConnection.js     (~150 lines) - DB init, close, delete
│   └── TransactionManager.js     (~100 lines) - Transaction timeout handling
├── cache/
│   └── CacheManager.js           (~120 lines) - In-memory cache operations
├── repositories/
│   ├── GenericRepository.js      (~200 lines) - CRUD operations, batch ops
│   ├── UserRepository.js         (~80 lines) - User operations
│   ├── VerbRepository.js         (~80 lines) - Verb operations
│   ├── ItemRepository.js         (~100 lines) - Item operations
│   ├── AttemptsRepository.js     (~120 lines) - Attempts operations
│   ├── MasteryRepository.js      (~120 lines) - Mastery operations
│   ├── ScheduleRepository.js     (~120 lines) - Schedule operations
│   ├── SessionRepository.js      (~100 lines) - Learning session operations
│   └── EventRepository.js        (~120 lines) - Event operations
└── migration/
    └── MigrationService.js       (~150 lines) - User ID migration

Total: ~1,660 lines (distributed across 14 modules, avg ~118 lines each)
```

## Refactoring Phases

### Phase 1: Extract Core Infrastructure (Priority: CRITICAL)

**Modules to create**:
1. ✅ `connection/DatabaseConnection.js`
   - Functions: `initDB`, `closeDB`, `deleteDB`, `initializeFullDB`
   - Internal: `dbInstance`, `isInitializing`

2. ✅ `connection/TransactionManager.js`
   - Functions: `withTimeout`
   - Utilities for safe transaction handling

3. ✅ `cache/CacheManager.js`
   - Functions: Cache operations (`setCacheEntry`, `getCacheEntry`, etc.)
   - Exports: `clearAllCaches`, `getCacheStats`, `resetMemoryCaches`
   - Internal: `attemptsCache`, `masteryCache`

**Dependencies**: None (foundational layer)

**Time estimate**: 2-3 hours

---

### Phase 2: Extract Generic Repository (Priority: HIGH)

**Module to create**:
1. ✅ `repositories/GenericRepository.js`
   - Functions: `saveToDB`, `getFromDB`, `getAllFromDB`, `getByIndex`, `getOneByIndex`, `deleteFromDB`, `updateInDB`, `batchSaveToDB`, `batchUpdateInDB`
   - This provides the base layer for all specific repositories

**Dependencies**: DatabaseConnection, CacheManager

**Time estimate**: 2-3 hours

---

### Phase 3: Extract Specific Repositories (Priority: HIGH)

**Modules to create** (can be done in parallel):

1. ✅ `repositories/UserRepository.js`
   - Functions: `saveUser`, `getUser`, `getUserById`

2. ✅ `repositories/VerbRepository.js`
   - Functions: `saveVerb`, `getVerb`, `getVerbByLemma`

3. ✅ `repositories/ItemRepository.js`
   - Functions: `saveItem`, `getItem`, `getItemByProperties`

4. ✅ `repositories/AttemptsRepository.js`
   - Functions: `saveAttempt`, `getAttempt`, `getAttemptsByItem`, `getAttemptsByUser`, `getRecentAttempts`

5. ✅ `repositories/MasteryRepository.js`
   - Functions: `saveMastery`, `getMastery`, `getMasteryByCell`, `getMasteryByUser`

6. ✅ `repositories/ScheduleRepository.js`
   - Functions: `saveSchedule`, `getSchedule`, `getScheduleByCell`, `getDueSchedules`

7. ✅ `repositories/SessionRepository.js`
   - Functions: `saveLearningSession`, `updateLearningSession`, `getLearningSessionsByUser`

8. ✅ `repositories/EventRepository.js`
   - Functions: `saveEvent`, `getEvent`, `getEventsByUser`, `getEventsByType`, `getEventsBySession`, `getRecentEvents`

**Dependencies**: GenericRepository, CacheManager

**Time estimate**: 3-4 hours (all 8 repositories)

---

### Phase 4: Extract Migration Service (Priority: MEDIUM)

**Module to create**:
1. ✅ `migration/MigrationService.js`
   - Functions: `migrateUserIdInLocalDB`, `validateUserIdMigration`, `revertUserIdMigration`

**Dependencies**: All repositories

**Time estimate**: 1-2 hours

---

### Phase 5: Create Orchestrator & Testing (Priority: CRITICAL)

**Tasks**:
1. ✅ Create `index.js` orchestrator
   - Re-exports all functions for backwards compatibility
   - Maintains existing API

2. ✅ Update dependent files
   - Find all files importing from `database.js`
   - Update to new import path
   - Verify no breaking changes

3. ✅ Create comprehensive tests
   - Unit tests for each repository
   - Integration tests for orchestrator
   - Cache behavior tests

**Time estimate**: 2-3 hours

---

### Phase 6: Migration & Cleanup

**Tasks**:
1. ✅ Delete old `database.js`
2. ✅ Update documentation
3. ✅ Final testing

**Time estimate**: 1 hour

---

## Total Effort Estimate

**Total time**: 11-16 hours across 6 phases

## Benefits

1. **Maintainability**: Modules <200 lines, single responsibility
2. **Testability**: Each repository independently testable
3. **Performance**: No degradation (same underlying operations)
4. **Scalability**: Easy to add new stores/repositories
5. **Clarity**: Clear separation between concerns
6. **Backwards Compatibility**: Zero breaking changes

## Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes in imports | Maintain full backwards compatibility through index.js |
| Cache behavior changes | Preserve exact same caching logic |
| Transaction handling issues | Thorough testing of all DB operations |
| Migration complexity | Extensive migration service testing |

## Success Criteria

- ✅ All 50 functions maintain exact same behavior
- ✅ No performance degradation
- ✅ All existing tests pass
- ✅ New unit tests for all modules (target: >80% coverage)
- ✅ Zero breaking changes to dependent files
- ✅ All modules <250 lines

---

**Status**: 📋 Phase 1 Ready to Start
**Created**: 2025-10-20
**Contributor**: Claude Code
