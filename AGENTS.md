# Repository Guidelines

## Project Structure & Module Organization
Application code lives in `src/`, grouped by responsibility: shared UI in `src/components/`, hooks in `src/hooks/`, and state helpers in `src/state/`. Feature entry points sit in `src/features/`, while spaced-repetition and progress orchestration live in `src/lib/progress/` (see the README there before touching schedulers). Utilities stay in `src/lib/utils/`. Static assets belong in `public/`, and build artifacts land in `dist/`. Keep tests beside implementations as `<module>.test.js` or `.spec.js` files.

## Build, Test, and Development Commands
- `npm run dev` — start the Vite dev server with hot reload.
- `npm run build` — produce an optimized production bundle.
- `npm run preview` — serve the built bundle locally for a final check.
- `npm run lint` — run ESLint to enforce project rules.
- `npm test` — execute the Vitest suite; target a file with `npx vitest run src/features/foo/foo.test.js`.

## Coding Style & Naming Conventions
Write modern ESM JavaScript with React function components and 2-space indentation. Components, providers, and pages use `PascalCase.jsx`; hooks and utilities use `camelCase.js`. Keep hooks pure and comply with the Rules of Hooks. Format via Prettier (`npx prettier -w .`) and rely on ESLint for static checks.

## Testing Guidelines
Vitest (jsdom) backs both unit and integration coverage. Favor deterministic cases that capture progress tracking and SRS edge conditions. Mock IO sparingly and assert user-facing behavior. Run `npm test` before pushing and add new suites alongside new modules.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat:`, `fix(scope):`, `docs:`) and branch as `feature/<short-desc>` or `fix/<short-desc>`. PRs should summarize the change set, link the tracking issue, include UI screenshots when visuals shift, and confirm `npm run lint` plus `npm test` both pass. Update related docs, especially `src/lib/progress/README.md`, when behavior changes.

## Security & Configuration Tips
Never commit secrets or `.env` files. Coordinate schema updates in `src/lib/progress/database.js` to avoid data loss. Prefer documented config files (`vite.config.js`, `eslint.config.js`) over ad-hoc environment toggles.
