# Progress Dashboard First View

## Objetivo
Reducir carga inicial del dashboard priorizando bloques accionables y diferir analíticas secundarias.

## Cambios aplicados
- Primera vista enfocada en bloques de acción inmediata.
- Secciones avanzadas detrás de toggle: `Ver análisis avanzados`.
- Barra de CTAs rápidos siempre visible:
  - `Practicar ahora`
  - `Repasar SRS`
  - `Actualizar progreso`
- Instrumentación runtime:
  - log `Progress first view ready` con `elapsedMs` en `ProgressDashboard`.

## Impacto esperado
- Menor trabajo de render inicial (menos paneles montados por defecto).
- Menor costo de carga en primera vista, especialmente en dispositivos lentos.
- Misma funcionalidad completa disponible bajo demanda vía toggle.

## Validación
- `npx vitest run src/features/progress/ProgressDashboard.smoke.test.jsx src/features/progress/ProgressDashboard.navigation.test.jsx`
- `npx eslint src/features/progress/ProgressDashboard.jsx src/features/progress/ProgressDashboard.smoke.test.jsx src/features/progress/ProgressDashboard.navigation.test.jsx`
