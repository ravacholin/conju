# Spanish Conjugator — Progreso y Analíticas

Resumen del sistema de progreso/analíticas del conjugador, centrado en pendientes y uso práctico. Se han retirado descripciones de funcionalidades ya implementadas para mantener el foco en lo que falta.

## Estado
- Base operativa activa: tracking de intentos, mastery por celda (con decaimiento), SRS por celda, orquestador emocional (flow/momentum/confianza/temporal) y UI de indicador en Drill.
- Para detalles técnicos de arquitectura ver `src/lib/progress/README.md`.

## Pendientes Prioritarios
- Review Mode (SRS):
  - Superficie “Revisar ahora” con `getDueItems(userId)` y selector de items pendientes.
  - Métrica visual de due/overdue en dashboard.
- Mastery fuente única:
  - Retirar stubs en `srs.js` y usar `lib/progress/mastery.js` como única fuente en cálculos/vistas.
- Dashboard y recomendaciones:
  - Integrar señales de `confidence/momentum` en `ProgressDashboard.jsx` y `PracticeRecommendations.jsx`.
  - Panel de insights de sesión y tendencias (corto/medio plazo).
- Tests y verificación:
  - Unit: thresholds de momentum, calibración de confianza por latencia, ventanas circadianas, actualización SRS.
  - Integración: intento → DB → mastery → dashboard.
- BD y migraciones:
  - Plan de bump de `DB_VERSION` con migraciones no destructivas.
  - Índices adicionales si consultas lo requieren (userId+mood+tense+person en attempts).
- Privacidad y control:
  - Modo incógnito + consentimiento granular para analytics.
- Exportación docente:
  - CSV con intentos, etiquetas de error y métricas emocionales agregadas (no sensibles).
- Análisis de confusiones:
  - Matriz persona/tiempo y mejoras de clasificación de errores (p. ej., 2s_tu vs 2s_vos, subj/indic).
- SRS por clúster:
  - Intervalos por familias de irregularidad para fomentar transferencia.
- Configuración y tuning:
  - Llevar umbrales de momentum/confianza a `PROGRESS_CONFIG` y exponer toggles de A/B.
- Documentación:
  - Alinear referencias a `useProgressTracking` y actualizar guías rápidas.

## Uso rápido (desarrollo)
- **Indicador de estado**: visible en Drill (esquina superior derecha) vía `FlowIndicator`.
- **Evento UI**: orquestador emite `progress-emo-update` con `{ flowState, momentumType, metrics }`.
- **Tracking**: `features/drill/useProgressTracking.js` → `lib/progress/tracking.js` (persiste intento, actualiza SRS, recalcula mastery).
- **Debugging**: 
  - Panel visual en práctica específica muestra configuración vs ejercicio actual
  - Console logs detallados para filtrado de formas verbales
  - API unificada: `window.SpanishConjugator.{FlowDetector, MomentumTracker, ConfidenceEngine, etc.}`

## Contribución
- Issues: descripción, pasos para reproducir, logs relevantes.
- PRs: rama por feature, cambios acotados, incluir tests cuando aplique.

## Licencia
Parte del proyecto Spanish Conjugator; misma licencia que el proyecto principal.

## Registro de Actualizaciones
- 2025-08-26 (Tarde): 
  - **Housekeeping completo**: Centralizó configuración, agregó sistema de logging inteligente, prevención de memory leaks
  - **API unificada**: Estandarizó debugging bajo `window.SpanishConjugator.*`
  - **Bug fix crítico**: Corrigió selección de tiempos verbales en práctica específica
  - **Debugging mejorado**: Panel visual para validar configuración vs ejercicio actual
- 2025-08-26 (Mañana): Integrado orquestador emocional, indicador UI y cableado SRS post‑intento. Arreglo `database.deleteDB()` (usa `idb.deleteDB`).
