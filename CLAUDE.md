# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server (starts on port 5173, opens in learning mode)
npm run dev

# Development server with learning mode pre-opened
npm run dev:learning

# Build for production (includes prebuild validation)
npm run build

# Preview production build
npm run preview

# Preview with learning mode pre-opened
npm run preview:learning

# Run linting with ESLint
npm run lint

# Run tests with Vitest
npm test

# Run tests with coverage
npm test -- --coverage

# Run a single test file
npx vitest run src/path/to/test.js

# Run tests in watch mode
npx vitest

# Data validation (critical - run before commits)
node src/validate-data.js

# Audit dataset consistency (validate person/mood/tense alignment)
node scripts/audit-consistency.js

# Validate mood/tense mapping integrity (prevents "Undefined - undefined" bugs)
npm run validate-integrity
```

## Architecture Overview

Spanish Conjugator is a React-based Spanish verb conjugation learning app with a sophisticated progress tracking system. The app teaches verb conjugations through interactive practice with adaptive algorithms.

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

### Cache Debugging
```javascript
// In browser console
getCacheStats()    // View cache statistics
clearAllCaches()   // Clear all caches for testing
```

## Data Validation Requirements

**Critical:** Always run `node src/validate-data.js` before committing. This detects:
- Duplicate verbs
- Missing verb forms
- Broken references in irregular families
- Structural inconsistencies

The validator must exit with code 0 (no errors) for CI/CD pipeline success.

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

## Configuration Files

- **Vite**: Development server configured with PWA support, code chunking, and terser minification
- **ESLint**: Configured for React with hooks linting, separate rules for Node.js scripts
- **Vitest**: Test configuration with jsdom environment, 20s timeout, coverage reporting
- **PWA**: Auto-registration, workbox caching, 5MB file size limit, offline support

## Known Issues & Limitations

- 186 validation errors in verb database (ongoing cleanup)
- Only 32% coverage of high-frequency Spanish verbs
- Some regional restrictions (e.g., "coger" only in Spain)
- Mobile performance optimization pending

This codebase prioritizes linguistic accuracy, performance optimization, and comprehensive progress tracking for effective Spanish verb learning.