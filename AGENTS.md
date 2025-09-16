# Repository Guidelines

This guide summarizes how to work in this repo: structure, commands, style, tests, and contribution flow.

## Project Structure & Module Organization
- `src/`: React + Vite app code.
  - `src/lib/progress/`: SRS/progress logic, analytics, orchestrators (see `README.md`).
  - `src/features/`: feature-level UI (dashboards, tracking wrappers).
  - `src/components/`, `src/hooks/`, `src/state/`, `src/lib/utils/`.
- Tests: co-located under `src/**/*.{test,spec}.js` (e.g., `src/lib/progress/progress.test.js`).
- `public/`: static assets. `dist/`: build output. `scripts/`: helper scripts.

## Build, Test, and Development Commands
- `npm run dev`: start Vite dev server.
- `npm run build`: production build to `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run lint`: run ESLint (`eslint.config.js`).
- `npm test`: run Vitest (jsdom, globals).
- Single test file: `npx vitest run src/lib/progress/progress.test.js`.
- Example data check: `node src/validate-data.js`.

## Coding Style & Naming Conventions
- JavaScript (ESM) + React functional components; 2-space indentation.
- Components: `PascalCase.jsx`; utilities/tests: `camelCase.js`; tests: `*.test.js` / `*.spec.js`.
- Follow React Hooks rules; keep components small and pure.
- Use ESLint for issues and Prettier for bulk formatting (`npx prettier -w .`).

## Testing Guidelines
- Framework: Vitest with jsdom; global setup in `test-setup.js` (IndexedDB, localStorage, matchMedia mocks).
- Focus on progress tracking, mastery, SRS, and orchestrator flows.
- Keep tests co-located, isolated, fast, and clearly named.

## Commit & Pull Request Guidelines
- Commits: `feat:`, `fix(scope):`, `docs:`, `chore:`, `ui:`, `theme(scope):`.
- Branches: `feature/<short-desc>` or `fix/<short-desc>`.
- PRs: explain scope/rationale, link issues, add UI screenshots, and pass `npm run lint` and `npm test`.
- Update adjacent docs when behavior changes (e.g., `src/lib/progress/README.md`, `README.md`).

## Architecture & Data Notes
- Read `ARCHITECTURE.md` and `src/lib/progress/README.md` before modifying progress/SRS.
- IndexedDB is the local store; coordinate schema via `src/lib/progress/database.js` and related config. Avoid breaking schema.

## Security & Configuration
- Do not commit secrets. Keep `.env` local and excluded.
- Prefer documented configuration files over ad-hoc env usage in code.

