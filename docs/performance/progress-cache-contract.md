# Progress Cache Contract

## Objetivo
Documentar dependencias de datos, invalidez por eventos y TTL por bloque del dashboard.

## Tipos de dato y TTL
Fuente: `src/lib/cache/ProgressDataCache.js` (`PROGRESS_CACHE_TTL_MS`).

- `heatMap`: 3m
- `userStats`: 2m
- `weeklyGoals`: 10m
- `weeklyProgress`: 1m
- `recommendations`: 3m
- `dailyChallenges`: 1m
- `pronunciationStats`: 3m
- `errorIntel`: 5m
- `studyPlan`: 5m
- `advancedAnalytics`: 6m
- `community`: 2m
- `offlineStatus`: 30s
- `expertMode`: 5m
- `dynamicLevelEvaluation`: 2m
- `dynamicLevelProgress`: 1m
- `dynamicLevelInfo`: 5m
- `levelRecommendation`: 2m

## Mapeo de eventos a invalidez parcial
Fuente: `EVENT_TYPE_TO_CACHE_TYPES` en `src/lib/cache/ProgressDataCache.js`.

- `drill_result` / `practice_session` -> core keys (`heatMap`, `userStats`, `weeklyGoals`, `weeklyProgress`, `recommendations`, `dailyChallenges`, `pronunciationStats`)
- `challenge_completed` -> `dailyChallenges`, `weeklyGoals`, `weeklyProgress`, `userStats`
- `mastery_update` -> `heatMap`, `userStats`, `recommendations`
- `error_logged` -> `errorIntel`, `recommendations`
- `settings_change` -> `recommendations`, `heatMap`
- `sync` / `forceFullRefresh` -> refresh completo

## Dependencias por sección principal
- `ProgressOverview`: `userStats`
- `HeatMapSRS`: `heatMap`
- `SmartPractice`: `heatMap` + `recommendations`
- `FrequentErrorsPanel` / `ErrorIntelligence`: `errorIntel`
- `DailyPlanPanel`: `studyPlan`
- `PronunciationStatsWidget` + `AccuracyTrend`: `pronunciationStats`

## Estrategia de carga diferida
- `useProgressDashboardData({ enableSecondaryData })` permite diferir secciones secundarias.
- Con `enableSecondaryData=false`, se cargan solo claves primarias de primera vista.
- Al habilitar modo avanzado, se disparan cargas secundarias pendientes sin forzar refresh completo.

## Cobertura de tests
- `src/lib/cache/ProgressDataCache.test.js` valida:
  - política de TTL explícita,
  - mapping de eventos a keys,
  - resolución de invalidación parcial para `settings_change`.
