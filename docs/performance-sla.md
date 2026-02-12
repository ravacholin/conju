# Performance SLA

## Objetivo
Establecer objetivos medibles de performance para Drill y Progress Dashboard, con baseline reproducible y seguimiento por release.

## SLA (objetivos)
- Drill generation latency: `p95 < 50ms`.
- Progress Dashboard (cold load, mobile target): `p95 < 1500ms`.
- JS+CSS total de build de referencia: no crecer mas de `+10%` sin ADR.

## Baseline inicial (2026-02-12)
Fuente: `npm run build` + `npm run perf:baseline`.

- Total JS: `3,475.50 KB` (`31` archivos).
- Total CSS: `176.78 KB` (`6` archivos).
- Total JS+CSS: `3,652.27 KB`.
- Chunks dominantes:
- `verbs.js-CtkZnfoZ.js`: `1,962.89 KB`.
- `progress-system-BoSx3o7-.js`: `354.40 KB`.
- `LearnTenseFlow-qm6jiF8L.js`: `260.46 KB`.

Archivos generados:
- `docs/performance/baseline.json`
- `docs/performance/baseline.md`

## Estado de metricas runtime
Parcialmente instrumentado:
- Drill generation (specific filtering) con benchmark reproducible:
- comando: `npm run perf:generator`
- salidas: `docs/performance/generator-benchmark.json` y `docs/performance/generator-benchmark.md`
- baseline 2026-02-12 (`la_general`, 22412 forms):
- sin indice p95 `0.392ms`
- con indice p95 `0ms` (redondeado)

Pendiente:
- Dashboard cold/warm p50/p95 con perfil mobile.

## Protocolo de medicion
1. Ejecutar build:
- `npm run build`
2. Recolectar baseline de assets:
- `npm run perf:baseline`
3. Guardar snapshot de resultados por release en `docs/performance/`.
4. Medir impacto del filtro especifico con:
- `npm run perf:generator`

## Criterio de gate (pre-CI budget)
- Si `total JS+CSS` sube mas de `10%` respecto al baseline vigente, bloquear merge hasta justificar en ADR.
- Si un chunk individual supera `+15%` respecto a la referencia, abrir ticket de optimizacion.

## Proximos pasos
1. Agregar escenario de medicion de dashboard cold/warm con Playwright.
2. Convertir baseline de `perf:generator` en check automatizado de CI.
3. Convertir estos thresholds en check automatizado de CI.
