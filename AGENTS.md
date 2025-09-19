# Repository Guidelines

## Project Structure & Module Organization
The app lives under `src/`, organized by responsibility: shared UI in `src/components/`, hooks in `src/hooks/`, and state helpers in `src/state/`. Feature entry points reside in `src/features/`, while SRS and progress logic sit in `src/lib/progress/` (see the co-located README for orchestration details). Utility helpers stay in `src/lib/utils/`. Static assets belong in `public/`; production builds compile into `dist/`. Place tests beside their subjects as `*.test.js` or `*.spec.js` files.

## Build, Test, and Development Commands
Use `npm run dev` for the Vite development server with hot reload. Ship-ready builds come from `npm run build`, and `npm run preview` serves the built assets locally. Run ESLint with `npm run lint` to enforce code quality, and execute `npm test` for the Vitest suite. Target a single suite via `npx vitest run <relative-test-path>`.

## Coding Style & Naming Conventions
Code is modern ESM JavaScript with React functional components and 2-space indentation. Components and providers follow `PascalCase.jsx`; utilities and hooks use `camelCase.js`. Keep modules focused and follow React Hooks rules. Format with Prettier (`npx prettier -w .`) and let ESLint surface rule violations.

## Testing Guidelines
Vitest (jsdom environment) handles unit and integration coverage. Tests must stay deterministic, fast, and colocated with implementation. Name suites after the module under test and prefer high-value cases around progress tracking, SRS workflows, and orchestrator behavior. Run `npm test` locally before opening a PR.

## Commit & Pull Request Guidelines
Write conventional commit messages such as `feat:`, `fix(scope):`, `docs:`, or `chore:`. Branch names follow `feature/<short-desc>` or `fix/<short-desc>`. Pull requests should summarize the change, link issues, include UI screenshots when visuals shift, and confirm `npm run lint` plus `npm test` both pass. Update related docs (e.g., `src/lib/progress/README.md`) when behavior changes.

## Security & Configuration Tips
Never commit secrets or `.env` files. IndexedDB schema lives in `src/lib/progress/database.js`; coordinate updates carefully to avoid data loss. Prefer documented config files over ad-hoc environment variables.
