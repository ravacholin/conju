# Plan — Mejoras profundas Spanish Conjugator (conju)

## Contexto

El usuario quiere mejoras profundas manteniendo el minimalismo: **cero menús nuevos, cero rutas nuevas, cero pasos extra**. Decisiones firmes del usuario:

1. **Eliminar el subsistema meaningful-practice COMPLETAMENTE**, incluidos los modos Historia (Story) y Línea de Tiempo (Timeline) — lo considera sin valor pedagógico y disfuncional. La app queda: Drill + Learning + Progreso + Onboarding.
2. **Un solo ejercicio nuevo**: "AL OÍDO" (dictado con TTS), integrado al panel de juegos existente del Drill.
3. Mejoras de arquitectura de mayor valor/menor riesgo.

Hallazgos verificados que condicionan el plan:
- El lazy loading por ruta **ya existe** (`AppRouter.jsx` usa `React.lazy` + `lazyWithRetry`) — no es una fase.
- Los refactors de `generator.js` y `userManager.js` que CLAUDE.md lista como pendientes **ya están hechos** — la doc está obsoleta.
- `ProgressUnlocksPanel.jsx` es **código muerto** (solo lo importa su propio test).
- Ningún test referencia `meaningfulPractice` fuera de los que se borran con sus directorios — la remoción es de bajo riesgo.
- Los hits de "timeline" en `InteractiveErrorVisualizations.jsx` y `ErrorAnalysisForensics.jsx` son vistas internas de gráficos, **no** el modo Timeline — NO tocarlos.

**No-go explícitos (no re-evaluar):** consolidación de los 6 caches, reescritura completa de `database.js`, tocar el flujo de onboarding, resucitar cualquier parte de meaningful-practice.

**Gates de calidad en CADA fase:** `npm run lint && npm test && npm run validate-integrity` (todos en 0). Cada fase es un commit independiente y shippeable.

---

## Fase 0 — Línea base (sin cambios de código)

1. `npm run lint && npm test && npm run validate-integrity`. Registrar cualquier fallo PREEXISTENTE (no arreglarlo; solo anotarlo para no atribuirlo a fases posteriores).
2. `npm run build` y anotar tamaños de `dist/assets/*.js` como referencia (la Fase 1 debe reducirlos).

---

## Fase 1 — Eliminación total de meaningful-practice (~35 archivos, ~570K)

### 1a. Borrar directorios completos
- `src/lib/meaningful-practice/` (motor: ExerciseFactory, clases, GamificationEngine, assessment, README)
- `src/data/meaningful-practice/` (contenido JSON)
- `src/features/story/` (StoryMode.jsx + StoryMode.test.jsx)
- `src/features/timeline/` (TimelineMode.jsx + TimelineMode.test.jsx)
- `src/features/progress/ProgressUnlocksPanel.jsx` + `ProgressUnlocksPanel.test.jsx` (código muerto)

### 1b. Rutas
- `src/lib/routing/routeContract.js`: quitar `'story'` y `'timeline'` del array de modos (líneas 8-9), quitar `ROUTES.story` y `ROUTES.timeline` (líneas 25-26), quitar `story|timeline` del regex de pathname (línea 66).
- `src/components/AppRouter.jsx`: quitar los `lazy(...)` de StoryMode/TimelineMode (líneas 50-54), `handleStartStoryMode`/`handleStartTimelineMode` (178-183), los bloques `currentMode === 'story'` y `'timeline'` (534-551), y las props `onNavigateToStory/onNavigateToTimeline` (525-526, 577-578).

### 1c. Drill (props muertas)
- `src/components/drill/DrillMode.jsx`: quitar props `onNavigateToStory/onNavigateToTimeline` (JSDoc 52-53, destructuring 101-102, pasada a DrillHeader 483-484).
- `src/components/drill/DrillHeader.jsx`: quitar `_onNavigateToStory/_onNavigateToTimeline` (líneas 50-51).
- Tests: `DrillMode.a11y.test.jsx` (líneas 58-59) y `DrillMode.keyboard.test.jsx` (líneas 79-80): quitar esas props de los renders.

### 1d. Capa de sync (estrategia: eliminar productores y consumidores; los campos legacy en datos remotos quedan simplemente ignorados)
- `src/lib/progress/gamificationSync.js`: eliminar `getMeaningfulPracticeUpdatedAt`, `getMeaningfulPracticeStats`, `writeMeaningfulPracticeStats` (líneas ~12-48), la lógica `localMp/useLocalMp/meaningfulPractice*` del merge (~60-78) y sus exports (~87-89). Conservar el resto del merge de gamificación intacto.
- `src/lib/progress/dataMerger.js`: quitar los imports de esos helpers (líneas 14-16) y las ramas de merge de `meaningfulPractice` (~610-679).
- `src/lib/progress/syncCoordinator.js`: quitar el import (línea 17) y el bloque de upload de `meaningfulPractice` (~610-629).
- `src/lib/progress/progressRepository.js`: actualizar el comentario de la línea 4 que menciona meaningful-practice.

### 1e. Verificación de cierre
1. `grep -rn "meaningful-practice\|meaningfulPractice\|MeaningfulPractice\|StoryMode\|TimelineMode\|ROUTES.story\|ROUTES.timeline\|onNavigateToStory\|onNavigateToTimeline" src/` → **cero resultados** (salvo strings no relacionados ya identificados: vistas "timeline" de gráficos en `InteractiveErrorVisualizations.jsx` y `ErrorAnalysisForensics.jsx`).
2. `npm run lint && npm test && npm run validate-integrity && npm run build` — el build no debe tener imports rotos; comparar tamaño de chunks contra Fase 0 (debe bajar).
3. Manual (`npm run dev`): drill completo funciona; navegar a `/story` o `/timeline` en la URL no rompe (el router normaliza a un modo válido); dashboard de Progreso renderiza sin el panel de unlocks.

**Criterio de aceptación:** cero referencias vivas, suite verde, bundle más chico, app funcional.

---

## Fase 2 — Split de estado transitorio de juego (arquitectura + bugfix real)

Hoy los flags efímeros de juego viven en el store Zustand **persistido** (`src/state/settings.js`, líneas 68-89) → los modos quedan activos tras recargar (bug). Migrarlos al store de sesión no persistido siguiendo el patrón ya establecido de `runtimeCurrentBlock` + `getRuntimeDrillSettings()` en `src/state/session.js` (documentado como pendiente en `docs/state/settings-ephemeral-audit.md`).

**Modificar:**
- `src/state/session.js`: agregar al estado inicial `resistanceActive: false`, `resistanceMsLeft: 0`, `resistanceStartTs: null`, `reverseActive: false`, `doubleActive: false`, `conmutacionIdx: 0`, `nextSecondPerson: '2s_vos'`. Acciones nuevas: `setGameMode(partial)` (con exclusividad: activar `reverseActive` apaga `doubleActive` y viceversa) y `clearGameSession()`. Extender `getRuntimeDrillSettings(baseSettings)` para mergear estos campos (así generator/FormFilter/FormSelector, que reciben settings ya mergeados vía `src/hooks/modules/useDrillGenerator.js`, no se tocan).
- `src/state/settings.js`: eliminar de los defaults esos 7 campos. **Conservar** (son preferencias persistentes): `resistanceBestMsByLevel`, `conmutacionSeq`, `enableC2Conmutacion`, `rotateSecondPerson`, `cliticsPercent`. Agregar migración del persist que descarte las claves viejas.
- Consumidores (reemplazar lectura `settings.X` → `useSessionStore`, escritura → acciones nuevas):
  - `src/components/drill/GamesPanel.jsx` (toggles de los 3 modos)
  - `src/features/drill/Drill.jsx` (lecturas de `reverseActive`, `doubleActive`, `resistanceActive`)
  - `src/features/drill/SessionHUD.jsx`
  - `src/features/drill/useResistanceTimer.ts` (+ su test)
  - Barrido final: `grep -rn "resistanceActive\|resistanceMsLeft\|resistanceStartTs\|reverseActive\|doubleActive\|conmutacionIdx\|nextSecondPerson" src/` y redirigir todo escritor/lector restante.
- Tests: ajustar `src/state/settings.migration.test.js`; agregar en `src/state/session.test.js` casos de exclusividad de `setGameMode` y de `clearGameSession`.
- Actualizar `docs/state/settings-ephemeral-audit.md` (migración completada).

**Verificación manual:** activar Supervivencia → recargar página → NO queda activo (comportamiento nuevo deseado); récord `resistanceBestMsByLevel` sí sobrevive; Inverso y Dos×Dos se excluyen mutuamente.

**Criterio de aceptación:** ningún flag de juego en `localStorage` bajo el persist de settings; los 3 modos funcionan igual en sesión; tests verdes.

---

## Fase 3 — Nuevo modo "AL OÍDO" (dictado con TTS)

La app **pronuncia** la forma conjugada (TTS existente, voz por región) y el usuario la **escribe**. Entrena comprensión auditiva + ortografía/tildes. Reutiliza ~95% del pipeline: mismo `currentItem`, mismo `grade()`, mismo `handleResult`. Sin archivos nuevos (salvo test).

**Modificar:**
- `src/state/session.js`: agregar `dictationActive: false` al slice de Fase 2; `setGameMode` lo hace excluyente con `reverseActive`/`doubleActive` (puede convivir con `resistanceActive`).
- `src/components/drill/GamesPanel.jsx`: cuarta entrada en `GAME_MODES`: `id: 'dictation'`, ícono existente en `/public` (p.ej. `/megaf-imperat.png`), `label: 'AL OÍDO'`, `desc: 'Escuchá y escribí'`, `needsRegen: false`. En el toggle, chequear soporte: `typeof window !== 'undefined' && 'speechSynthesis' in window`; si no hay, mostrar aviso inline y no activar.
- `src/features/drill/Drill.jsx`, cuando `dictationActive` (y no reverse/double):
  1. Ocultar el enunciado que revela la forma (lemma+tiempo); mostrar botón grande "🔊 Escuchar de nuevo" + etiqueta de persona (`PERSON_LABELS`, ya importado) para desambiguar homófonos.
  2. En el `useEffect` existente sobre `currentItem` (líneas ~67-80): si `dictationActive`, llamar `speak(currentItem.value || currentItem.form?.value)` (hook `useSpeech` ya instanciado en el componente; mover el destructuring arriba si hace falta).
  3. En `handleSubmit`, rama antes de la genérica: calificar con `grade()` normal pero enviar `practiceType: 'dictation'` y `meta: { dictation: true }` en el `extendedResult` a `handleResult`. Diff, feedback, SRS y motor adaptativo quedan igual.
- Test nuevo en `src/features/drill/` (patrón de tests vecinos): con `dictationActive: true`, el submit envía `practiceType: 'dictation'` a `handleResult`.

**Reutilizar:** `src/features/drill/useSpeech.ts`, `src/lib/core/grader.js`, `src/features/drill/useProgressTracking.js`, `src/features/drill/Diff.jsx`.

**Verificación manual:** activar AL OÍDO → suena la forma al aparecer cada ítem; replay funciona; error de tilde marcado con feedback; combina con Supervivencia; Inverso/Dos×Dos lo desactivan; sin regresión en los otros modos.

**Criterio de aceptación:** activable solo desde GamesPanel (cero menús nuevos); intentos registrados con `practiceType: 'dictation'`; tests verdes.

---

## Fase 4 — Refresco de documentación

- `CLAUDE.md`:
  - Eliminar toda referencia a meaningful-practice, Story, Timeline y la sección "SRS Integration in Learning Components" (cita componentes `MeaningfulPractice`/`CommunicativePractice` que ya no existen).
  - Eliminar/reescribir los ejemplos de refactoring de `generator.js` y `userManager.js` (ya completados; `generator.js` = 412 líneas, `userManager` = barrel de 86).
  - Documentar: el slice de juego en `src/state/session.js` + patrón `getRuntimeDrillSettings` (Fase 2), los 4 modos de juego del GamesPanel (incl. AL OÍDO), y los no-go decididos (consolidación de caches, reescritura total de database.js).
- `docs/state/settings-ephemeral-audit.md` y `docs/state/settings-write-invariants.md`: actualizar al estado post-Fase 2.
- `grep -rn "meaningful" docs/ CLAUDE.md` → limpiar referencias restantes (o marcarlas como histórico en `docs/archive/`).

**Criterio de aceptación:** cada afirmación de CLAUDE.md apunta a un archivo existente; cero menciones de features eliminadas como vivas.

---

## Fase 5 (opcional — solo si 1-4 quedaron verdes) — Rebanada segura de `database.js`

Continuar la descomposición ya iniciada (`src/lib/progress/database/connection/`, `database/cache/`) extrayendo **una sola** rebanada cohesiva con API idéntica:

1. `grep -n "^export" src/lib/progress/database.js` y agrupar los exports de *attempts* (guardar/leer intentos).
2. Crear `src/lib/progress/database/attempts.js` moviendo esas funciones **verbatim** (mismos nombres y firmas), importando conexión/cache desde los submódulos existentes.
3. En `database.js`, reemplazar los cuerpos movidos por `export { ... } from './database/attempts.js'`. **Ningún otro archivo cambia sus imports.**
4. Correr los 5 test-files de database (`database.migration`, `database.range`, `database.schedules`, `database.unsynced-normalization`, `database.userSettingsRace`) y luego la suite completa.

**Criterio de aceptación:** suite verde sin modificar ningún test; `database.js` reduce ≥300 líneas; cero cambios de imports fuera de `src/lib/progress/database*`.

---

## Orden y justificación

| Fase | Valor | Riesgo |
|---|---|---|
| 1 Eliminación meaningful-practice | Muy alto (pedido explícito; −35 archivos, bundle más chico, menos superficie de mantenimiento) | Bajo (sin tests externos que lo referencien; panel de unlocks ya muerto) |
| 2 Split settings | Alto (corrige bug real: modos de juego persistidos entre sesiones; ordena el store) | Medio, mitigado por patrón existente + tests |
| 3 Al oído | Alto (ejercicio nuevo real con ~100 líneas, cero menús) | Bajo |
| 4 Docs | Medio (CLAUDE.md guía a los próximos agentes; hoy miente) | Nulo |
| 5 database.js | Medio | Medio (por eso opcional y acotada a una rebanada) |

## Git

Trabajar en la rama `claude/mejoras-arquitectura-plan-y4tgz9` (crearla desde el default si no existe). Un commit por fase con mensaje descriptivo. Push con `git push -u origin claude/mejoras-arquitectura-plan-y4tgz9` y crear PR al terminar.

## Archivos críticos

- `src/lib/routing/routeContract.js`, `src/components/AppRouter.jsx`
- `src/components/drill/DrillMode.jsx`, `DrillHeader.jsx`, `GamesPanel.jsx`
- `src/lib/progress/gamificationSync.js`, `dataMerger.js`, `syncCoordinator.js`
- `src/state/settings.js`, `src/state/session.js`
- `src/features/drill/Drill.jsx`, `useSpeech.ts`, `useProgressTracking.js`
- `CLAUDE.md`
