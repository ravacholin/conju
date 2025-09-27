# Repository Guidelines

This guide orients contributors to the spanish-conjugator codebase so that updates stay consistent, reliable, and easy to review.

## Project Structure & Module Organization
- **`src/components/`**: Shared React UI building blocks kept framework-agnostic where possible.
- **`src/features/`**: Feature entry points wiring UI, hooks, and state for a conjugation flow.
- **`src/hooks/` & `src/state/`**: Reusable React hooks and state helpers that must remain pure and side-effect aware.
- **`src/lib/progress/`**: Spaced-repetition logic; read the local README before modifying schedulers or persistence code.
- **`src/lib/utils/`**: Cross-cutting helpers; prefer extending here instead of duplicating logic.
- **Tests**: Co-locate as `<module>.test.js` or `.spec.js` beside implementation files for quick discovery.
- **Assets & build**: Place static assets under `public/`, and expect build artifacts in `dist/` only.

## Build, Test, and Development Commands
- `npm run dev`: Starts the Vite dev server with hot reload for local iteration.
- `npm run build`: Produces an optimized production bundle in `dist/`.
- `npm run preview`: Serves the built bundle to verify production behavior.
- `npm run lint`: Runs ESLint across the project; fix or annotate violations before opening a PR.
- `npm test`: Executes Vitest suites (jsdom). Target files with `npx vitest run src/features/foo/foo.test.js` when narrowing scope.

## Coding Style & Naming Conventions
- **Language**: Modern ESM JavaScript with React function components; avoid legacy class components.
- **Indentation**: Use two spaces; never tab characters.
- **Naming**: Components/providers/pages in `PascalCase.jsx`, hooks and utilities in `camelCase.js`.
- **Formatting**: Run `npx prettier -w .` after large edits; rely on ESLint to enforce rules.

## Testing Guidelines
- **Framework**: Vitest with jsdom; keep tests deterministic and behavior-focused.
- **Coverage**: Exercise spaced-repetition edge cases and user-visible flows when touching `src/lib/progress/`.
- **Structure**: Mirror implementation filenames and colocate tests; mock IO sparingly.
- **Execution**: Run `npm test` before pushing; narrow runs with `npx vitest run` for faster feedback.

## Commit & Pull Request Guidelines
- **Commits**: Follow Conventional Commits (e.g., `feat(progress): add session scheduler`).
- **Branches**: Use `feature/<short-desc>` or `fix/<short-desc>`.
- **Pull Requests**: Summarize changes, link issues, include screenshots for UI tweaks, and confirm `npm run lint` plus `npm test` both pass.
- **Documentation**: Update related READMEs, especially `src/lib/progress/README.md`, whenever behavior or schema changes.

## Security & Configuration Tips
- Keep secrets and environment files out of the repo; never commit `.env`.
- Coordinate schema adjustments in `src/lib/progress/database.js` to avoid user data loss.
- Prefer documented configuration files (`vite.config.js`, `eslint.config.js`) over ad-hoc flags.
