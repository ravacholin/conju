# A11y Browser Plan

## Objetivo
Cubrir contraste y navegación real en browser (limitaciones de jsdom).

## Alcance inicial
- Progress Dashboard (vista inicial + modo avanzado).
- Drill mode (header + overlays quick switch/games/pronunciación).

## Estrategia técnica
1. Playwright E2E + inyección de `axe-core` en página real.
2. Ejecutar chequeos por ruta clave:
   - `/` -> progreso
   - `/` -> drill
3. Capturar:
   - violaciones `critical/high/medium`,
   - screenshot por violación,
   - selector objetivo.

## Gate gradual
- Fase A: reporte no bloqueante en CI (artifact).
- Fase B: bloquear solo `critical`.
- Fase C: bloquear `critical + high`.

## Entregable esperado
- `docs/accessibility/a11y-report.json`
- `docs/accessibility/a11y-report.md`
