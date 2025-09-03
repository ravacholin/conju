# Arquitectura de la Aplicación: Spanish Conjugator PWA

Este documento describe la arquitectura técnica de la aplicación "Spanish Conjugator", una Progressive Web App (PWA) construida con React. El objetivo es proporcionar una guía detallada para que los desarrolladores y agentes de IA puedan comprender rápidamente la estructura, el flujo de datos y la lógica de negocio del proyecto.

## 1. Visión General de la Arquitectura

La aplicación está diseñada como una Single-Page Application (SPA) utilizando las siguientes tecnologías clave:

-   **Framework Frontend:** React con Vite para un desarrollo y empaquetado rápido.
-   **Gestión de Estado:** Zustand para un manejo de estado global, simple y potente.
-   **Persistencia de Datos:** IndexedDB (a través de `idb-keyval`) para almacenar el progreso del usuario y la configuración, con un fallback a `localStorage`.
-   **Enrutamiento:** Un componente de enrutador personalizado basado en el estado de la aplicación.
-   **Estilo:** CSS plano.

La arquitectura se centra en tres modos de operación principales, gestionados por un enrutador central:

1.  **Onboarding (`onboarding`):** Un flujo guiado para que los usuarios configuren sus preferencias de práctica (dialecto, nivel, etc.).
2.  **Drill (`drill`):** La interfaz principal de práctica donde los usuarios realizan los ejercicios de conjugación.
3.  **Progress (`progress`):** Un panel de control para visualizar el progreso y las analíticas del usuario.

## 2. Flujo de la Aplicación y Enrutamiento

El componente `src/components/AppRouter.jsx` actúa como el sistema nervioso central de la aplicación. No utiliza una librería de enrutamiento tradicional basada en URL, sino un **enrutador basado en estado**.

-   **Estado Principal:** Un estado de React `currentMode` determina qué vista principal (`OnboardingFlow`, `DrillMode`, o `ProgressDashboard`) se renderiza.
-   **Navegación:** Las funciones como `handleStartPractice`, `handleHome`, y `handleGoToProgress` cambian el valor de `currentMode` para navegar entre las secciones.
-   **Historial del Navegador:** El `AppRouter` interactúa con la `History API` del navegador (`window.history.pushState` y el evento `popstate`) para permitir que los botones de "atrás" y "adelante" del navegador funcionen de manera intuitiva, sincronizando el estado de la aplicación con la URL del navegador de forma manual.

## 3. Gestión de Estado

La gestión de estado se divide en dos categorías principales:

### 3.1. Estado Global de Configuración (Zustand)

El estado global que persiste entre sesiones es gestionado por Zustand en `src/state/settings.js`.

-   **Creación del Store:** Se utiliza `create(persist(...))` para crear un store que automáticamente guarda una parte del estado en el almacenamiento del cliente.
-   **Persistencia:** El middleware `persist` de Zustand se configura para guardar en `spanish-conjugator-settings`. Solo se persiste la configuración del usuario a largo plazo (nivel, dialecto, modo de práctica), excluyendo el estado temporal de la sesión.
-   **Acceso y Modificación:** El hook `useSettings()` se utiliza en toda la aplicación para acceder a las configuraciones. El store expone un método `set({ ... })` para realizar actualizaciones atómicas del estado.

El estado global incluye:
-   `level`: Nivel de dificultad del usuario (A1, A2, etc.).
-   `region`: Dialecto seleccionado (`peninsular`, `rioplatense`, etc.).
-   `practiceMode`: Modo de práctica (`mixed`, `specific`).
-   `specificMood`, `specificTense`: Para el modo de práctica específico.
-   `verbType`: Filtro por tipo de verbo (`all`, `regular`, `irregular`).
-   Y otras configuraciones para modos de juego avanzados (`resistanceActive`, `doubleActive`, etc.).

### 3.2. Persistencia de Progreso (IndexedDB)

El progreso detallado del usuario (historial de respuestas, estadísticas, etc.) se guarda en IndexedDB para mayor capacidad y rendimiento.

-   **Wrapper:** Las funciones `saveProgress` y `loadProgress` en `src/lib/store.js` actúan como una capa de abstracción sobre `idb-keyval`.
-   **Fallback:** Si IndexedDB no está disponible o falla, el sistema cambia automáticamente a `localStorage` para garantizar la robustez.

## 4. Modelo de Datos de Verbos

La fuente principal de datos de conjugación es `src/data/verbs.js`.

-   **Estructura:** Es un array de objetos, donde cada objeto representa un verbo.
-   **Objeto Verbo:**
    -   `id` / `lemma`: El infinitivo del verbo (ej. "hablar").
    -   `type`: `'regular'` o `'irregular'`.
    -   `paradigms`: Un array que contiene las conjugaciones para diferentes regiones.
        -   `regionTags`: Un array de regiones donde se aplica el paradigma.
        -   `forms`: Un array muy grande de objetos de forma.
            -   `mood`: Modo (ej. "indicative").
            -   `tense`: Tiempo (ej. "pres").
            -   `person`: Persona y número (ej. "1s", "2s_tu", "2s_vos").
            -   `value`: La conjugación correcta (ej. "hablo").
            -   `alt`: Un array de formas alternativas aceptadas (ej. `hablara` / `hablase`).
            -   `accepts`: Un objeto para mapear formas alternativas entre dialectos (ej. `tú` y `vos`).

## 5. Lógica de Negocio: El Motor de Práctica (`Drill Engine`)

El corazón de la aplicación reside en el hook `src/hooks/useDrillMode.js`. Su función principal, `generateNextItem`, es responsable de seleccionar el próximo desafío para el usuario.

Este proceso sigue un **sistema de selección jerárquico y adaptativo**:

1.  **Filtro Inicial:** Se parte de un conjunto de formas verbales elegibles (`eligibleForms`) que ya han sido filtradas según la configuración del usuario (dialecto, modo específico, etc.).

2.  **Nivel 1: Sistema de Repetición Espaciada (SRS):**
    -   Se consultan los elementos "vencidos" (due) que el usuario necesita repasar, utilizando `getDueItems` de `src/lib/progress/srs.js`.
    -   Si se encuentra un elemento SRS, se selecciona una forma verbal que coincida con ese criterio.

3.  **Nivel 2: Motor de Práctica Adaptativa:**
    -   Si no hay elementos SRS, se invoca a `getNextRecommendedItem` de `src/lib/progress/AdaptivePracticeEngine.js`.
    -   Este motor utiliza un análisis más profundo del rendimiento del usuario para recomendar una combinación específica de `mood` y `tense` donde el usuario muestra debilidad o necesita refuerzo.

4.  **Nivel 3: Generador Estándar (Fallback):**
    -   Si ninguno de los sistemas anteriores devuelve un elemento, se utiliza la función `chooseNext` de `src/lib/core/generator.js`.
    -   Esta función aplica una lógica de selección más general, teniendo en cuenta el historial reciente para evitar repeticiones.

La función `handleDrillResult` se encarga de procesar la respuesta del usuario, actualizar el historial y, crucialmente, alimentar los resultados a todo el sistema de progreso y analíticas.

## 6. Sistema de Progreso y Analíticas (`src/lib/progress/`)

Este es el subsistema más complejo de la aplicación. Es una colección de módulos diseñados para modelar el conocimiento y el estado emocional del usuario en tiempo real.

-   **`srs.js`:** Implementa un algoritmo de Spaced Repetition System para programar futuras revisiones.
-   **`AdaptivePracticeEngine.js`:** El motor principal de recomendaciones. Analiza el historial de rendimiento para encontrar las áreas de mejora más efectivas.
-   **`DifficultyManager.js`:** Evalúa el rendimiento de la sesión para sugerir ajustes en la dificultad.
-   **`flowStateDetection.js`:** Modela el estado de "flow" (concentración) del usuario basándose en la velocidad y precisión de las respuestas.
-   **`momentumTracker.js`:** Analiza patrones emocionales y de rendimiento para detectar rachas y caídas.
-   **`confidenceEngine.js`:** Mide la confianza del usuario en diferentes áreas para construirla de manera efectiva.
-   **`dynamicGoals.js`:** Establece y rastrea micro-objetivos para mantener al usuario motivado.
-   **`personalizedCoaching.js`:** Ofrece consejos y recomendaciones personalizadas basadas en el nivel y rendimiento.
-   **`userManager.js` y `database.js`:** Gestionan la identidad del usuario y la estructura de la base de datos en IndexedDB.

## 7. Estructura de Componentes de UI

Los componentes de React están organizados por funcionalidad en `src/components/`.

-   **`components/onboarding/`:** Contiene los componentes para cada paso del flujo de configuración inicial (`DialectSelection`, `LevelSelection`, etc.).
-   **`components/drill/`:** Contiene los componentes para la interfaz de práctica (`DrillMode`, `DrillHeader`, `SettingsPanel`).
-   **`features/progress/`:** Contiene los componentes para el panel de progreso, como `ProgressDashboard.jsx`.
-   **`hooks/`:** Contiene los hooks de lógica de negocio más importantes, como `useDrillMode.js` y `useOnboardingFlow.js`, que encapsulan la mayor parte de la lógica de la interfaz de usuario para sus respectivas secciones.
