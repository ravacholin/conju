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
- baseline: `npm run perf:generator:baseline`
- chequeo vs baseline: `npm run perf:generator:check` (`PERF_GENERATOR_STRICT=1` para modo bloqueante)
- salidas:
- `docs/performance/generator-benchmark.json`
- `docs/performance/generator-benchmark.md`
- `docs/performance/generator-baseline.json`
- `docs/performance/generator-benchmark-check.md`
- baseline 2026-02-12 (`la_general`, 22412 forms):
- sin indice p95 `0.304753ms`
- con indice p95 `0.000528ms`

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
5. Actualizar baseline cuando se apruebe una mejora intencional:
- `npm run perf:generator:baseline`
6. Validar regresion contra baseline:
- `npm run perf:generator:check`

## Criterio de gate (pre-CI budget)
- Si `total JS+CSS` sube mas de `10%` respecto al baseline vigente, bloquear merge hasta justificar en ADR.
- Si un chunk individual supera `+15%` respecto a la referencia, abrir ticket de optimizacion.

## Proximos pasos
1. Agregar escenario de medicion de dashboard cold/warm con Playwright.
2. Endurecer gate de benchmark de generador en CI (`PERF_GENERATOR_STRICT=1`) cuando estabilice variabilidad.
3. Convertir thresholds restantes de dashboard/bundle en check automatizado de CI.
