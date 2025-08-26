# Repository Guidelines

## Project Structure & Module Organization
- `src/`: app code (React + Vite). Key areas:
  - `src/lib/progress/`: progress/SRS, analytics, and orchestration (see `README.md`).
  - `src/features/`: feature-level UI (dashboards, tracking wrappers).
  - `src/components/`, `src/hooks/`, `src/state/`, `src/lib/utils/`.
- `public/`: static assets. `dist/`: build output. `scripts/`: helper scripts.
- Tests co-located under `src/**/*.{test,spec}.js` (many in `src/lib/progress/`).

## Build, Test, and Development Commands
- `npm run dev`: start Vite dev server.
- `npm run build`: production build to `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run lint`: run ESLint using `eslint.config.js`.
- `npm test`: run Vitest (jsdom, globals; setup via `test-setup.js`).
- `npm test -- --coverage`: run tests with coverage reports.
- Example script usage: `node src/validate-data.js` (dataset checks).

## Coding Style & Naming Conventions
- JavaScript (ESM) + React. Prefer functional components.
- Indentation: 2 spaces; keep lines focused and small functions.
- Naming: Components `PascalCase.jsx`; utilities/tests `camelCase.js` with `*.test.js` for tests.
- Linting: ESLint configured for React hooks and Node scripts; fix findings before PR.
- Formatting: Prettier available — e.g., `npx prettier -w .` before submitting.

## Testing Guidelines
- Framework: Vitest with jsdom; global setup in `test-setup.js` (IndexedDB, localStorage, matchMedia mocks).
- Location: co-locate tests near code; pattern `*.test.js` or `*.spec.js`.
- Run: `npm test` or a single file (e.g., `npx vitest run src/lib/progress/progress.test.js`).
- Coverage: include meaningful assertions for core flows (tracking, mastery, SRS, orchestrator). Use `--coverage` when relevant.

## Commit & Pull Request Guidelines
- Commit style: Conventional-ish prefixes seen in history — `feat:`, `fix(scope):`, `docs:`, `chore:`, `ui:`, `theme(scope):`.
- Branches: `feature/<short-desc>` or `fix/<short-desc>`.
- PRs must: describe scope and rationale, link issues, include screenshots for UI changes, and pass `npm run lint` and `npm test`.
- Keep PRs focused and small; update adjacent docs (e.g., `src/lib/progress/README.md`, `README.md`) when behavior changes.

## Pointers & Architecture
- Read `ARCHITECTURE.md` and `src/lib/progress/README.md` before modifying progress/SRS.
- IndexedDB is the local store; avoid breaking schema — coordinate changes via `src/lib/progress/database.js` and config.
