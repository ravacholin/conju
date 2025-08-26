# Project Context for Qwen Code

## Project Overview

This is a Spanish Conjugator web application built with React and Vite. The core functionality allows users to practice and master Spanish verb conjugations across various tenses, moods, and persons.

A significant recent addition is a comprehensive **Progress Tracking and Analytics System**. This system provides advanced metrics on user performance, including mastery scores per grammatical cell (mood-tense-person), emotional intelligence insights (flow state, momentum, confidence), Spaced Repetition System (SRS) for optimized practice, error classification, and analytical dashboards.

### Key Technologies

- **Framework**: React (v19+)
- **Build Tool**: Vite (v7+)
- **Language**: JavaScript (ES Modules)
- **State Management**: Zustand (v5+)
- **Database**: IndexedDB (using `idb` v8+ and `idb-keyval` v6+)
- **Testing**: Vitest (v3+), Testing Library
- **UI**: Custom CSS (Tailwind-like utility classes observed)
- **PWA**: Vite Plugin PWA

### Core Architecture

- **`/src`**: Main source code.
  - **`/src/lib/conjugator`**: Core logic for verb conjugation.
  - **`/src/lib/progress`**: The new Progress Tracking and Analytics System.
  - **`/src/features`**: Feature-specific components (Drill, Practice, Progress Dashboard, Settings).
  - **`/src/components`**: Reusable UI components.
- **`/public`**: Static assets.
- **`/scripts`**: Utility scripts for data processing.
- **Configuration Files**: `package.json`, `vite.config.js`, `eslint.config.js`, etc.

## Building and Running

### Prerequisites

- Node.js (version compatible with package dependencies)
- npm (comes with Node.js)

### Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

### Development Commands

- **Start Development Server**:
    ```bash
    npm run dev
    ```
    Starts the local development server, usually accessible at `http://localhost:5173`.

- **Build for Production**:
    ```bash
    npm run build
    ```
    Creates an optimized production build in the `dist` directory.

- **Preview Production Build**:
    ```bash
    npm run preview
    ```
    Serves the production build locally for testing.

- **Run Linter**:
    ```bash
    npm run lint
    ```
    Checks the code for style and potential errors using ESLint.

- **Run Tests**:
    ```bash
    npm run test
    ```
    Executes the test suite using Vitest.

## Development Conventions

- **Language & Framework**: Modern JavaScript (ES Modules) with React functional components and hooks.
- **State Management**: Zustand is used for global state management. The new progress system also uses IndexedDB for persistent user data.
- **Styling**: Utility-first CSS classes are used extensively, similar to Tailwind CSS.
- **Testing**: Vitest with Testing Library for unit and integration tests. Test files are typically colocated with the code they test (e.g., `*.test.jsx`).
- **Code Style**: ESLint is configured to enforce code style and catch potential issues. Prettier is likely used for formatting (check `package.json` scripts).
- **Documentation**: Significant inline documentation and README files exist, especially for the `src/lib/progress` module, detailing its architecture, data models, and API.

## Progress Tracking and Analytics System (`/src/lib/progress`)

This is a key subsystem with its own internal architecture:

- **Initialization**: `initProgressSystem()` initializes the whole module, including IndexedDB.
- **Data Models**: Defined in `dataModels.js`. Core entities include `User`, `Verb`, `Item` (a practice cell), `Attempt` (a practice event), `Mastery` (score for a cell), `Schedule` (SRS data).
- **Database**: IndexedDB persistence is managed by `database.js`.
- **Tracking**: `tracking.js` is the main entry point for recording user interactions (e.g., `trackAttemptStarted`, `trackAttemptSubmitted`). It orchestrates saving attempts, updating mastery, and updating SRS schedules.
- **Mastery Calculation**: `mastery.js` contains the logic for calculating weighted mastery scores based on recency, difficulty, and hint usage.
- **SRS**: `srs.js` manages the Spaced Repetition System logic for scheduling item reviews.
- **Emotional Intelligence**: A suite of modules (`progressOrchestrator.js`, `flowStateDetection.js`, `momentumTracker.js`, `confidenceEngine.js`, `temporalIntelligence.js`) analyze user behavior (speed, accuracy, streaks) to provide insights into flow, momentum, and confidence, emitting events for UI updates.
- **Error Classification**: `errorClassification.js` analyzes incorrect answers and tags them with specific error types (e.g., wrong person, verbal ending, accentuation).
- **Configuration**: `config.js` centralizes all system parameters and thresholds.
- **API**: `index.js` and `all.js` expose the public API for interacting with the progress system.
- **UI Integration**: `src/features/drill/useProgressTracking.js` integrates the tracking system into the main Drill practice feature.