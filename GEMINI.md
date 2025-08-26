# GEMINI.md

## Project Overview

This project is a Spanish conjugation trainer built as a Progressive Web App (PWA). It is designed to help users practice and improve their Spanish conjugation skills through interactive drills. The application features a sophisticated progress tracking and analytics system that monitors user performance, mastery, and confidence levels.

**Key Technologies:**

*   **Frontend:** React, Vite
*   **State Management:** Zustand
*   **Data Persistence:** IndexedDB (via `idb` and `idb-keyval`)
*   **Testing:** Vitest, React Testing Library
*   **Linting:** ESLint
*   **Styling:** CSS

**Architecture:**

The application is structured around two main modes:

1.  **Onboarding Flow:** A guided setup process where users can select their preferred dialect, difficulty level, and other practice settings.
2.  **Drill Mode:** The core practice interface where users are presented with conjugation exercises. This mode includes real-time feedback, progress tracking, and an adaptive practice engine that adjusts the difficulty based on user performance.

The project also includes a comprehensive analytics system that tracks user progress, mastery of specific verb forms, and other metrics. This data is used to provide personalized practice recommendations and to help users identify areas where they need improvement.

## Building and Running

**Prerequisites:**

*   Node.js and npm (or a compatible package manager)

**Installation:**

```bash
npm install
```

**Development:**

To start the development server, run:

```bash
npm run dev
```

This will start the Vite development server and open the application in your default browser.

**Building for Production:**

To build the application for production, run:

```bash
npm run build
```

This will create a `dist` directory with the optimized production build of the application.

**Previewing the Production Build:**

To preview the production build locally, run:

```bash
npm run preview
```

**Testing:**

To run the test suite, run:

```bash
npm run test
```

**Linting:**

To lint the codebase, run:

```bash
npm run lint
```

## Development Conventions

*   **State Management:** The project uses Zustand for global state management. State is persisted to IndexedDB using `idb-keyval`.
*   **Component Structure:** Components are organized by feature (e.g., `onboarding`, `drill`) and are located in the `src/components` directory.
*   **Routing:** The application uses a custom router component (`src/components/AppRouter.jsx`) to manage the different application modes.
*   **Styling:** The project uses plain CSS for styling. Global styles are defined in `src/index.css`, and component-specific styles are in `src/App.css`.
*   **Data:** Verb data is stored in `src/data/verbs.js`.
*   **Progress and Analytics:** The core logic for the progress and analytics system is located in `src/lib/progress`.
*   **PWA:** The application is a PWA, and the service worker is configured in `vite.config.js`.
