# Progress Refresh Measurement

## Objetivo
Comparar costo de refresh incremental vs refresh completo en dashboard de progreso.

## Escenarios medidos (tests)
- Archivo: `src/features/progress/useProgressDashboardData.test.js`

1. `refreshFromEvent` parcial (`attemptId`):
- invalida y recarga solo keys afectadas.
- no vuelve a ejecutar analíticas pesadas (`advancedAnalytics`, `studyPlan`).

2. `sync` (full refresh):
- dispara recarga completa.
- vuelve a ejecutar bloques pesados.

3. modo primera vista (`enableSecondaryData=false`):
- difiere analíticas secundarias hasta habilitar modo avanzado.

## Resultado operativo
- El refresh incremental evita recomputos secundarios no impactados.
- El refresh completo mantiene cobertura total para consistencia post-sync.
- La primera vista reduce trabajo inicial al diferir carga avanzada.
