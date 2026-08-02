# Settings vs Session Audit

Fecha: 2026-02-12

## Objetivo
Separar estado persistente (`useSettings`) de estado efímero de sesión (`useSessionStore`) para reducir riesgo de inconsistencias y escritura accidental de claves no contractuales.

## Estado persistente (`useSettings`)
- Configuración de usuario y UX durable:
- nivel, región, pronombres, modos, tolerancias ortográficas, objetivos diarios, recordatorios, toggles de features.

## Estado efímero migrado a sesión
- `currentBlock`:
- ahora fuente runtime en `useSessionStore.runtimeCurrentBlock`.
- `reviewSessionType` / `reviewSessionFilter`:
- ahora fuente runtime en `useSessionStore.runtimeReviewSessionType` y `useSessionStore.runtimeReviewSessionFilter`.
- Modos de juego (`resistanceActive`, `resistanceMsLeft`, `resistanceStartTs`, `reverseActive`, `doubleActive`):
- ahora en el slice de juego de `useSessionStore`, sin `persist`. Antes vivían en
  `useSettings` y, aunque no estaban en `PERSISTED_SETTINGS_KEYS`, se filtraban por el
  canal de IndexedDB (`settingsPersistenceQueue` guarda el estado completo del store),
  con lo cual los modos quedaban activos tras recargar o al sincronizar otro dispositivo.
- Cursores de rotación (`conmutacionIdx`, `nextSecondPerson`):
- también en el slice de juego. `FormSelectorService` los avanza en cada ítem; persistirlos
  escribía en localStorage en caliente sin ningún beneficio.

## Preferencias durables que NO se migran
- `resistanceBestMsByLevel` (récord de supervivencia), `conmutacionSeq`, `enableC2Conmutacion`,
  `rotateSecondPerson`, `cliticsPercent`.

## API del slice de juego
- `useSessionStore.setGameMode(partial)`: escritura parcial acotada a las claves del slice.
  Aplica la exclusividad Inverso ↔ Dos × Dos y limpia el cronómetro al apagar Supervivencia.
- `useSessionStore.clearGameSession()`: resetea el slice.
- `getRuntimeDrillSettings(baseSettings)` mergea el slice, así que el generador y
  `FormSelector*` lo reciben sin conocer el store.

## Puntos de integración actualizados
- Generador consume merge runtime:
- `src/hooks/modules/useDrillGenerator.js` usa `getRuntimeDrillSettings(...)`.
- Escritores de contexto efímero:
- `src/components/AppRouter.jsx`
- `src/components/drill/DrillMode.jsx`
- `src/features/drill/SessionHUD.jsx`
- `src/features/progress/ProgressDashboard.jsx`
- `src/features/progress/SRSPanel.jsx`
- `src/features/progress/SRSReviewQueue.jsx`
- `src/features/progress/SRSReviewQueueModal.jsx`
- `src/features/progress/HeatMapSRS.jsx`
- `src/features/progress/ErrorRadar.jsx`
- `src/features/progress/ErrorInsights.jsx`
- `src/features/progress/ErrorIntelligence.jsx`
- `src/features/progress/EnhancedErrorAnalysis.jsx`

## Guardrails
- `useSettings.set(...)` ignora claves desconocidas en runtime (`DEV` warning).
- Se evita que estado transitorio “contamine” el store persistido por error.

## Pendientes recomendados
- Revisar `cameFromTema` para moverlo a contexto de sesión si deja de ser necesario como estado de flujo en settings.
- Evaluar exclusión explícita de `currentBlock` / `reviewSession*` del estado de `useSettings` una vez cerrada la migración completa.
- `allowedLemmas` y los campos `chunks*Failsafe*` siguen siendo runtime dentro de `useSettings`
  (no persistidos, pero tampoco en el store de sesión).
