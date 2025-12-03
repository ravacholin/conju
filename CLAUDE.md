# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Frontend Development
npm run dev                 # Development server (starts on port 5173)
npm run dev:learning        # Development server with learning mode pre-opened
npm run build               # Build for production
npm run chunks:build        # Build code chunks separately
npm run preview             # Preview production build
npm run preview:learning    # Preview with learning mode pre-opened

# Backend Development
npm run server:start        # Start backend server (port 8787)

# For full-stack development, run both:
# Terminal 1: npm run server:start
# Terminal 2: npm run dev

# Quality & Testing
npm run lint                # Run ESLint
npm run quality:check       # Run lint + tests
npm run quality:fix         # Auto-fix linting issues

npm test                    # Run tests with Vitest
npm run test:run           # Run tests once (no watch)
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
npm run test:ui            # Run tests with Vitest UI
npm run test:coverage:ui   # Run tests with coverage UI

# Test Suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests with Playwright
npm run test:e2e:ui       # Run e2e tests with Playwright UI
npm run test:e2e:debug    # Debug e2e tests
npm run test:visual       # Run visual regression tests
npm run test:smoke        # Smoke tests
npm run test:performance  # Performance tests
npm run test:all          # Run all test suites

# Run a single test file
npx vitest run src/path/to/test.js

# Data Validation (critical - run before commits)
npm run validate-integrity  # Detects data inconsistencies
npm run audit:all           # Comprehensive dataset auditing
npm run audit:strict        # Audit with strict validation (fails on warnings)
```

## Architecture Overview

Spanish Conjugator is a full-stack application with a React frontend and Node.js/Express backend for progress synchronization.

### Frontend (React SPA)
- React-based Spanish verb conjugation learning app
- Sophisticated progress tracking system with local-first data storage
- Interactive practice with adaptive algorithms and SRS (Spaced Repetition System)
- PWA support with offline capabilities

### Backend (Node.js/Express)
- **Location**: `server/` directory
- **Purpose**: Progress synchronization across devices
- **Port**: 8787 (configurable via PORT env var)
- **Database**: SQLite with migrations
- **Authentication**: Google OAuth integration
- **CORS**: Configured for multiple origins (localhost + production)

### Core Directories

- **`src/data/`** - Verb database and curriculum data
  - `verbs.js` - Main verb database (~94 verbs with complete paradigms)
  - `priorityVerbs.js` - High-priority verbs for expansion
  - `curriculum.json` - CEFR level definitions (A1-C2)

- **`src/lib/core/`** - Core business logic
  - `generator.js` - Exercise selection algorithm with SRS integration
  - `grader.js` - Answer evaluation with accent tolerance
  - `levelVerbFiltering.js` - CEFR level-based verb filtering
  - `optimizedCache.js` - Intelligent caching with LRU eviction

- **`src/lib/data/`** - Language data structures
  - `irregularFamilies.js` - 31 irregular verb families with linguistic patterns
  - `levels.js` - CEFR level configurations

- **`src/lib/progress/`** - Complete progress tracking system
  - Advanced mastery calculation with recency weighting
  - SRS (Spaced Repetition System) with adaptive intervals
  - Emotional intelligence components (flow detection, momentum tracking)
  - Progress analytics with heat maps and competency radar

- **`src/features/drill/`** - Practice interface
  - `Drill.jsx` - Main practice component
  - `useProgressTracking.js` - Progress integration hook

- **`src/state/settings.js`** - Global Zustand store for user preferences

### Key Concepts

**Verb Database Structure:**
Each verb has regional paradigms (rioplatense, la_general, peninsular) with forms containing mood/tense/person/value. The system supports dialectal variations (voseo, tuteo, vosotros).

**Irregular Families:**
31 linguistic categories including stem changes (e→ie, o→ue), orthographic changes (-car→-qu), strong preterites, and specialized categories like defective verbs.

**Progress System:**
- Mastery scores calculated with recency decay (τ=10 days)
- SRS intervals: 1d, 3d, 7d, 14d, 30d, then doubling
- Error classification into 8 linguistic categories
- Emotional intelligence tracking (flow states, momentum, confidence)

**Generator Algorithm:**
1. Filter eligible forms by user settings (level, dialect, practice mode)
2. Apply SRS-based weighting for due items
3. Random selection with bias toward items needing practice
4. Intelligent caching for performance (target <50ms response time)

## Common Development Tasks

### Adding New Verbs
1. Add to `src/data/priorityVerbs.js` or `src/data/additionalVerbs.js`
2. Follow the paradigm structure with regionTags and forms
3. Run `node src/validate-data.js` to verify structure
4. System automatically categorizes into irregular families

### Modifying Irregular Families
- Edit `src/lib/data/irregularFamilies.js`
- Each family needs ≥6 examples and clear linguistic pattern
- Specify affected tenses for proper filtering

### Progress System Integration
```javascript
import { useProgressTracking } from './features/drill/useProgressTracking.js'

// In drill components
const { handleResult, handleHintShown } = useProgressTracking(currentItem, onResult)
```

### SRS Integration in Learning Components
Learning components (`MeaningfulPractice`, `CommunicativePractice`) require `eligibleForms` prop for SRS integration:

```javascript
// In LearnTenseFlow.jsx - generate eligible forms for SRS integration
const eligibleForms = useMemo(() => {
  if (!selectedTense?.tense || !selectedTense?.mood) return [];

  const basePool = buildFormsForRegion(settings.region || 'la_general');
  const learningSettings = {
    ...settings,
    practiceMode: 'specific',
    specificMood: selectedTense.mood,
    specificTense: selectedTense.tense,
    verbType: verbType || 'all',
    selectedFamilies
  };

  return getEligibleFormsForSettings(basePool, learningSettings);
}, [selectedTense, settings, verbType, selectedFamilies]);

// Pass to learning components
<MeaningfulPractice eligibleForms={eligibleForms} ... />
<CommunicativePractice eligibleForms={eligibleForms} ... />
```

### Sync Debugging
```javascript
// In browser console
window.debugSync()           // Complete sync diagnostics
window.authService.getToken() // Check auth token
window.cloudSync.getSyncStatus() // Get sync status
```

### Cache Debugging
```javascript
// In browser console
getCacheStats()    // View cache statistics
clearAllCaches()   // Clear all caches for testing
```

## Data Validation Requirements

**Critical:** Always run `npm run validate-integrity` before committing. This detects:
- Duplicate verbs
- Missing verb forms
- Broken references in irregular families
- Structural inconsistencies
- Mood/tense mapping integrity issues

The validator must exit with code 0 (no errors) for CI/CD pipeline success. Use `npm run audit:all` for comprehensive data auditing.

## Performance Considerations

- Generator targets <50ms response time for exercise selection
- Cache system requires 3-5 second warm-up on app start
- Target >80% cache hit rate after warm-up
- Memory usage should stay under 20MB for caches

## Testing Strategy

- Use `npm test` for unit tests (Vitest)
- Manual testing should include all dialect combinations
- Test each irregular family for proper verb filtering
- Validate progress tracking through complete user sessions

## Database Schema

The app uses IndexedDB for local storage with these stores:
- `users`, `verbs`, `items`, `attempts`, `mastery`, `schedules`
- Progress system is local-first with optional cloud sync
- All analytics calculated client-side

## Code Style Notes

- Use Zustand for global state management
- Follow React functional components with hooks
- Prefer explicit imports from specific modules
- Cache performance is critical - always consider lookup efficiency
- The progress system has extensive TypeScript-style JSDoc annotations
- PWA functionality provided by vite-plugin-pwa (auto-registration in production)
- Code chunking strategy: vendor libs, verb data, progress system, and core engine are separate chunks

## Logging Policy

**CRITICAL**: Production logging must be minimal to avoid performance degradation and console pollution.

### Centralized Logger Usage

Always use the centralized logger from `src/lib/utils/logger.js` instead of direct `console.*` calls:

```javascript
import { createLogger } from '../utils/logger.js'

const logger = createLogger('moduleName:context')

// Development only - silenced in production
logger.debug('Detailed debugging info', { data })

// Production warnings - only if needed
logger.warn('Something unexpected happened', { context })

// Production errors - always shown
logger.error('Critical error occurred', error)
```

### Logger Behavior

- **Development** (`import.meta.env.DEV`): All logs visible (debug, info, warn, error)
- **Production** (`import.meta.env.PROD`): Only ERROR level logs visible
- **Automatic filtering**: No need to wrap logs in `if (isDev)` checks

### Migration Pattern

```javascript
// ❌ OLD - Avoid this
console.log('Processing item:', item)
console.warn('Cache miss detected')
console.error('Failed to load:', error)

// ✅ NEW - Use centralized logger
logger.debug('Processing item', { item })
logger.warn('Cache miss detected')
logger.error('Failed to load', error)
```

### Exceptions

Direct `console.*` calls are acceptable ONLY in:
- **Node.js scripts** (validate-data.js, audit-*.js, etc.)
- **Test files** (*.test.js, test-setup.js)
- **Error boundaries** (console.error for critical UI errors)
- **Development-only debug utilities** (window.debugSync, etc.)

### Production Console Policy

In production builds, the console should be **nearly silent** except for:
1. Critical errors that affect user experience
2. Security warnings (CSP violations, etc.)
3. Essential diagnostic information (sync failures, etc.)

**Target**: Reduce production console output from ~1,300+ messages to <10 messages in typical user sessions.

## Configuration Files

- **Vite**: Development server configured with PWA support, code chunking, and terser minification
- **ESLint**: Configured for React with hooks linting, separate rules for Node.js scripts
- **Vitest**: Test configuration with jsdom environment, 20s timeout, coverage reporting
- **PWA**: Auto-registration, workbox caching, 5MB file size limit, offline support

## Sync Troubleshooting

### Sync System Architecture (Updated 2025-12-03)

The sync system is **fully implemented** and uses intelligent environment detection for seamless operation across development and production.

**Architecture**:
- `src/lib/config/syncConfig.js` - Intelligent environment detection and URL configuration
- `src/lib/progress/cloudSync.js` - Complete frontend sync client (NOT stubbed)
- `src/lib/progress/syncCoordinator.js` - Account-based sync orchestration
- `server/src/auth-routes.js` - Complete auth and sync endpoints
- `server/src/auth-service.js` - Account management and data merging

**Environment Detection**:
- **Development**: Auto-detects `localhost` → uses `http://localhost:8787/api`
- **Production**: Auto-detects `verb-os.vercel.app` → uses `https://conju.onrender.com/api`
- **Override**: Manual configuration via `VITE_PROGRESS_SYNC_URL` environment variable

**Debug Tools**:
- Run `window.debugSync()` in browser console for detailed sync diagnostics
- Both `authService` and `cloudSync` are exposed globally for debugging
- Comprehensive logging throughout sync flow

**Critical Bugs Fixed (2025-12-03)**:

✅ **FIXED: Data Loss on Login** - Users experiencing complete data loss after Google login
- **Root Cause #1**: Upload endpoints used wrong paths (`/mastery` instead of `/progress/mastery/bulk`) → 404 errors
- **Root Cause #2**: Upload requests sent wrong format (array instead of `{ records: [...] }`)
- **Root Cause #3**: Race condition - sync happened before userId migration completed
- **Root Cause #4**: Successfully uploaded items weren't marked as synced
- **Fix Location**: `src/lib/progress/syncCoordinator.js` lines 216-306
- **Fix Details**:
  - Replaced `postJSON()` calls with `tryBulk()` (correct paths & format)
  - Added `markSynced()` calls after successful uploads
  - Added migration wait before sync (prevents stale userId queries)
  - Enhanced error logging with stack traces

**Common Sync Issues & Solutions**:

1. **Environment Mismatch**:
   - **Symptom**: Sync works in one environment but not another
   - **Solution**: Check `window.debugSync()` output for correct URL detection

2. **Authentication Failures**:
   - **Symptom**: Google login works but sync fails with 401 errors
   - **Solution**: Verify token validity with `window.authService.getToken()`

3. **Server Connectivity**:
   - **Development**: Ensure backend is running with `npm run server:start`
   - **Production**: Verify `https://conju.onrender.com` is accessible

4. **CORS Issues**:
   - Check browser network tab for CORS errors
   - Verify server CORS configuration includes frontend origin

5. **404 Errors on Sync** (FIXED):
   - **Symptom**: Console shows `Failed to load resource: 404` for `/api/mastery`, `/api/schedules`
   - **Cause**: Incorrect API paths in sync upload logic
   - **Status**: Fixed in 2025-12-03 release
   - **Prevention**: Always use `tryBulk()` helper instead of direct `postJSON()` calls

6. **Empty Progress After Login** (FIXED):
   - **Symptom**: Heat maps empty, no progress data visible after successful login
   - **Cause**: Upload failures + userId migration race condition
   - **Status**: Fixed in 2025-12-03 release
   - **Prevention**: Sync now waits for migration to complete before uploading data

## Architecture Guidelines

### Module Complexity Limits

To maintain code quality and testability, modules should adhere to these limits:

**File Size Limits:**
- **Maximum**: 500 lines per module
- **Target**: 200-300 lines per module
- **Exception**: Data files (verbs.js, curriculum.json) can be larger

**Function Complexity:**
- **Maximum**: 50 lines per function
- **Cyclomatic Complexity**: <10 per function
- **Nesting Depth**: <4 levels

### Refactoring Triggers

A module needs refactoring when:
1. File exceeds 500 lines
2. Single function exceeds 100 lines
3. Cyclomatic complexity >15
4. More than 5 responsibilities in one module

### Modularization Strategy

**Example: generator.js refactoring plan**
```
generator.js (1,416 lines) →
  ├── FormFilterService.js (~300 lines)
  ├── FormSelectorService.js (~150 lines)
  ├── FormValidator.js (~150 lines)
  └── generator.js (~400 lines - orchestration)
```

**Example: userManager.js refactoring plan**
```
userManager.js (1,260 lines) →
  ├── UserSettingsStore.js (~100 lines)
  ├── DataMergeService.js (~400 lines)
  ├── AuthTokenManager.js ✅ (already extracted)
  ├── SyncService.js ✅ (already extracted)
  └── userManager.js (~300 lines - orchestration)
```

### Testing Requirements

When extracting modules:
1. Write unit tests for each new module
2. Maintain integration tests for orchestration layer
3. Verify functional equivalence with existing tests
4. Target >80% code coverage for business logic

## Known Issues & Limitations

- 186 validation errors in verb database (ongoing cleanup)
- Only 32% coverage of high-frequency Spanish verbs
- Some regional restrictions (e.g., "coger" only in Spain)
- Mobile performance optimization pending
- **Architecture debt**: generator.js (1,416 lines) and userManager.js (1,260 lines) need modularization

This codebase prioritizes linguistic accuracy, performance optimization, and comprehensive progress tracking for effective Spanish verb learning.