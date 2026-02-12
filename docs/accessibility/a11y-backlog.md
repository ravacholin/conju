# A11y Backlog

Fecha de auditoría inicial: 2026-02-12.

## Cobertura automática mínima
- `src/features/progress/ProgressDashboard.a11y.test.jsx`
- `src/components/drill/DrillMode.a11y.test.jsx`
- `src/components/drill/DrillMode.keyboard.test.jsx`
- Runner: `npm run test:a11y`

## Hallazgos actuales
- `critical`: ninguno en la primera pasada automática.
- `high`: ninguno en la primera pasada automática.
- `medium`: ninguno en la primera pasada automática.
- Flujo teclado Drill validado:
  - cierre de panel con `Escape`,
  - restauración de foco al trigger,
  - orden base de tab en header.

## Riesgos residuales
- `high`: contraste de color real no validado en jsdom (regla `color-contrast` desactivada en tests automáticos).
- `medium`: foco por teclado en flujos multi-panel depende de pruebas E2E/manuales.

## Próximo paso recomendado
- Integrar chequeo de contraste y navegación de teclado en Playwright + axe en browser real.
