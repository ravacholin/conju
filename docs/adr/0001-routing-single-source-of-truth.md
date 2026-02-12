# ADR-0001: Fuente única de verdad para navegación

- Fecha: 2026-02-12
- Estado: Aprobado
- Slice: Fase 1.2 (inicio)

## Contexto
- La app usa un router propio con History API.
- Había validación de rutas duplicada y reglas implícitas (`mode` + `step`) repartidas.
- Riesgo: inconsistencias como aceptar `step` en modos no-onboarding, o construir URLs no canónicas (`/drill/3`).

## Decisión
- Mantener router propio (no migrar ahora a React Router).
- Formalizar contrato de ruta en un módulo dedicado:
  - `src/lib/routing/routeContract.js`
  - parseo, normalización y construcción de URL en un solo punto.
- Regla explícita:
  - `step` solo aplica a `mode=onboarding`.
  - Para cualquier otro `mode`, `step = null`.

## Consecuencias
- Positivas:
  - Menor duplicación y menor riesgo de drift de reglas.
  - URLs más canónicas y predecibles.
  - Base sólida para migrar rutas críticas sin romper navegación.
- Trade-off:
  - Seguimos con router interno (deuda controlada), pero con contrato explícito y testeado.

## Implementación inicial
- `Router` consume ahora:
  - `normalizeRoute(...)`
  - `parseRouteFromURL(...)`
  - `buildRouteURL(...)`
- Tests de contrato:
  - `src/lib/routing/routeContract.test.js`
