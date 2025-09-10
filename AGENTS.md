# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + Vite app code.
  - `src/lib/progress/`: SRS/progress logic, analytics, orchestrators (read `README.md`).
  - `src/features/`: feature-level UI (dashboards, tracking wrappers).
  - `src/components/`, `src/hooks/`, `src/state/`, `src/lib/utils/`.
- `public/`: static assets. `dist/`: build output. `scripts/`: helper scripts.
- Tests co-located under `src/**/*.{test,spec}.js` (many in `src/lib/progress/`).

## Build, Test, and Development Commands
- `npm run dev`: start Vite dev server.
- `npm run build`: production build to `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run lint`: run ESLint (`eslint.config.js`).
- `npm test`: run Vitest (jsdom, globals). `npm test -- --coverage` for coverage.
- Example script: `node src/validate-data.js` for dataset checks.

## Coding Style & Naming Conventions
- Language: JavaScript (ESM) + React functional components.
- Indentation: 2 spaces; prefer small, focused functions.
- Naming: Components `PascalCase.jsx`; utilities/tests `camelCase.js`; tests `*.test.js`/`*.spec.js`.
- Linting: fix all ESLint findings before PR; respect React Hooks rules.
- Formatting: use Prettier when touching many files (`npx prettier -w .`).

## Testing Guidelines
- Framework: Vitest with jsdom; global setup in `test-setup.js` (IndexedDB, localStorage, matchMedia mocks).
- Location: co-locate tests near code (e.g., `src/lib/progress/progress.test.js`).
- Run: `npm test` or a single file via `npx vitest run <path/to/file.test.js>`.
- Aim for meaningful coverage on progress tracking, mastery, SRS, and orchestrator flows.

## Commit & Pull Request Guidelines
- Commits: conventional-ish prefixes — `feat:`, `fix(scope):`, `docs:`, `chore:`, `ui:`, `theme(scope):`.
- Branches: `feature/<short-desc>` or `fix/<short-desc>`.
- PRs must: describe scope/rationale, link issues, add screenshots for UI changes, and pass `npm run lint` and `npm test`.
- Update adjacent docs when behavior changes (e.g., `src/lib/progress/README.md`, `README.md`).

## Architecture & Data Notes
- Read `ARCHITECTURE.md` and `src/lib/progress/README.md` before modifying progress/SRS.
- IndexedDB is the local store; avoid breaking schema — coordinate via `src/lib/progress/database.js` and config.
- Keep changes focused; avoid unrelated refactors in the same PR.

