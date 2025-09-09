# Spanish Conjugator — Progreso y Analíticas

Resumen del sistema de progreso/analíticas del conjugador, centrado en pendientes y uso práctico. Se han retirado descripciones de funcionalidades ya implementadas para mantener el foco en lo que falta.

## Estado
- Base operativa activa: tracking de intentos, mastery por celda (con decaimiento), SRS por celda, orquestador emocional (flow/momentum/confianza/temporal) y UI de indicador en Drill.
- **Filtrado robusto**: Sistema de validación de nivel y dialecto completamente operativo con guardias de integridad
- Para detalles técnicos de arquitectura ver `src/lib/progress/README.md`.

## Mejoras recientes (algoritmo, UX y estética)
- **CRITICAL FIXES (2025-08-27 - Fase 3)**: Sistema de filtrado de nivel y dialecto completamente reforzado
  - **A1 restringido**: Guardia de integridad evita formas avanzadas (pluscuamperfecto, subjuntivo) en nivel A1 
  - **Dialectos precisos**: Validación dialecto rioplatense (vos) excluye vosotros correctamente
  - **Auto-corrección**: Sistema detecta y corrige automáticamente formas inválidas en tiempo real
  - **Limpieza base datos**: Eliminados 7 verbos inexistentes (tañir, redormir, empedernir, colorir, balbucir, amuar, adormir)
- **MAJOR FIXES (2025-08-27 - Fase 2)**: Completado acceso total a verbos irregulares en práctica por tema
  - **Irregulares habilitados**: TODOS los temas específicos ahora incluyen verbos irregulares (ser→fui, estar→estuve, tener→tuve)
  - **Alcance universal**: Aplica a presente de subjuntivo, imperativo, condicional, futuro - no solo pretérito indefinido
  - **Bypass inteligente**: Preserva estructura educativa por nivel mientras permite exploración libre por tema
  - **Verbos avanzados**: Incluye irregulares complejos (poseer→poseyó, instruir→instruyó) en práctica específica
- **MAJOR FIXES (2025-08-27 - Fase 1)**: Resueltos problemas críticos de experiencia de usuario
  - **Variedad total**: "Todos los verbos" ahora da acceso completo a ~90 verbos (regulares + irregulares)
  - **VOS restaurado**: Pronombre vos aparece correctamente en práctica rioplatense
  - **Anti-repetición**: Eliminada repetición monolítica - algoritmo diversificado con bonificaciones por variedad
  - **Práctica libre por tema**: Sin restricciones MCER para práctica específica de subjuntivo/imperativo/etc
- SRS sensible a pistas: correcto sin pista sube intervalo; con pista avanza medio paso; error reinicia a 1 día. Ver `src/lib/progress/srs.js` y tests `src/lib/progress/srs.test.js`.
- Grader: análisis de errores más informativo (p. ej., "cambio ortográfico (c → qu)") en `src/lib/core/grader.js`.
- UX en Drill: atajos de teclado (Enter verificar/continuar; Cmd/Ctrl+Enter "No sé"; Esc limpiar/continuar; D ver diferencias) en `src/features/drill/Drill.jsx`.
- Tokens de diseño unificados (FlowIndicator): variables añadidas en `src/App.css`.

### Correcciones de conjugación (críticas)
- Subjuntivo (vos = tú): la 2ª persona singular de vos y tú son idénticas en todo el subjuntivo y en el imperativo negativo. Se eliminan variantes con acento tipo “hablés” en estos modos/tiempos. Reglas en `src/lib/core/conjugationRules.js` y validación en `src/lib/core/grader.js`.
- Saneador de datos en tiempo de ejecución: corrige formas truncadas y personas mal rotuladas en Presente de Subjuntivo, y reconstituye ortografía zc para verbos en `-cer/-cir` (p. ej. “agradezca/agradezcan/agradezcamos/agradezcáis”). Implementado en `src/lib/core/dataSanitizer.js` e integrado antes del indexado en `src/lib/core/optimizedCache.js`.
- Estabilidad del generador: la clave del caché ahora incluye `region` y una firma de `allowedLemmas` para evitar pools obsoletos al cambiar de tema/dialecto. Ver `src/lib/core/generator.js`.

## Cómo continuar (plan práctico)
1) Fase 2 de lint (progreso):
   - Objetivo: limpiar imports/variables no usados y casos simples sin refactors.
   - Archivos sugeridos: `AdaptivePracticeEngine.js`, `DifficultyManager.js`, `confidenceEngine.js`, `dynamicGoals.js`, `dataExport.js`, `dataRestore.js`, `diagnosis.js`, `enhancedCloudSync.js`, `flowStateDetection.js`.
   - Comando: `npx eslint src/lib/progress --max-warnings=0` y aplicar mínimos cambios (renombrar a `_var`, quitar imports, mover declaraciones fuera de `case`).

2) Estabilizar prueba de rendimiento (opcional en CI):
   - Archivo: `src/lib/progress/compatibility.test.js` (bloque “configuraciones de rendimiento”).
   - Si el entorno es lento, subir umbral a 150–200 ms o condicionar por `process.env.CI`.

3) “Review Now” (SRS):
   - Usar `getDueItems(userId)` de `src/lib/progress/srs.js` para una vista de repaso rápido.
   - Sugerencia UI: botón en dashboard que liste celdas pendientes y permita lanzar Drill filtrado.

4) Métricas en FlowIndicator (opcional):
   - Añadir métricas de sesión y due count (`getDueItems`) al panel de detalles en `src/features/progress/FlowIndicator.jsx`.

5) Verificación rápida:
   - Dev: `npm run dev`.
   - Lint: `npm run lint` (o `npx eslint src/...`).
   - Tests: `npm test` (o `node node_modules/vitest/dist/cli.js run`). Cobertura: `npm test -- --coverage`.

## Notas para PRs
- Mantener commits pequeños y descriptivos (prefijos tipo `feat:`, `fix(scope):`, `docs:`).
- Ejecutar `npm run lint` y `npm test` antes de abrir PR.
- Documentar cambios de comportamiento en `src/lib/progress/README.md` cuando aplique.

## PWA/Service Worker y caché
- Unificación en `vite-plugin-pwa`: se eliminó el SW manual y el registro custom. El plugin genera el Service Worker (Workbox) con `autoUpdate`, `skipWaiting` y `clientsClaim`.
- Registro automático: `injectRegister: 'auto'` inyecta el registro en producción. Si quieres UI de “nueva versión disponible”, usa `virtual:pwa-register` en `src/main.jsx`.
- Precaching con revisiones: `index.html` y assets se precachean con hash/revision; al desplegar una nueva build, el SW detecta cambios y actualiza sin borrar caché.
- Forzar actualización: normalmente basta recargar una vez tras el despliegue. El SW nuevo toma control inmediatamente; si el dispositivo tenía un SW antiguo, cerrar y reabrir la pestaña lo adopta.
- Desactivar PWA temporalmente: exporta `DISABLE_PWA=true` (ver `vite.config.js`).

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

## Desarrollo En Pausa (On-Hold Development)

*A fecha de 2025-08-28, el foco de desarrollo ha cambiado hacia la implementación de funcionalidades de alto impacto para el usuario, como el Sistema de Objetivos Dinámicos. Las siguientes tareas de mantenimiento y refactorización quedan en pausa y podrán ser re-evaluadas en el futuro.*

*   **Limpieza de Código (Linting):** Pausada la limpieza completa de variables e imports no utilizados en `src/lib/progress`. Se completó un progreso parcial.
*   **Estabilización de Pruebas de Rendimiento:** Pospuesta la actualización de los umbrales de tiempo en `src/lib/progress/compatibility.test.js`.
*   **Refactorización de Lógica de Mastery:** Pospuesta la consolidación de los cálculos de `mastery` para que `mastery.js` sea la única fuente de verdad.

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
- 2025-09-09:
  - fix(levels): A1 → Mixto/Todos respeta el nivel CEFR para el pool de verbos. Se aplica un filtro global por nivel (a regulares e irregulares) antes de cualquier otra lógica de selección. Esto evita que aparezcan verbos avanzados en A1 (p. ej., “fraguar”, “atestiguar”, “ampliar”).
  - test: agregado en `src/lib/core/generator.levels.test.js` el caso “A1 mixed/all: excludes advanced lemmas from selection”.
  - impacto: práctica por nivel A1 se siente más coherente (verbos de uso básico y alta frecuencia).
- 2025-08-27 (Final):
  - **CRÍTICO**: Sistema de filtrado nivel/dialecto completamente reforzado
  - **fix(nivel A1)**: Guardia de integridad impide formas avanzadas (pluscuamperfecto, subjuntivo perfecto) en nivel A1
  - **fix(dialecto vos)**: Validación dialecto rioplatense excluye vosotros correctamente en toda práctica
  - **fix(auto-corrección)**: Sistema detecta y corrige automáticamente formas inválidas generadas por algoritmos
  - **fix(base datos)**: Eliminados 7 verbos inexistentes que causaban confusión (tañir, redormir, empedernir, colorir, balbucir, amuar, adormir)
  - **arquitectura**: Enhanced Integrity Guard en `useDrillMode.js` + level parameter fixes en `AdaptivePracticeEngine.js`
- 2025-08-27 (Hotfix):
  - **fix(progress/UI)**: Arreglado crash al abrir el panel de Progreso desde Drill causado por uso de `React.Fragment` sin import explícito. Se sustituyó por `Fragment` importado desde `react` en `src/features/progress/HeatMap.jsx`.
- 2025-08-27 (Noche):
  - **CRÍTICO**: Habilitado acceso completo a verbos irregulares en práctica por tema
  - **fix(irregulares)**: TODOS los temas específicos ahora incluyen verbos irregulares (ser, estar, tener, hacer, venir, etc.)
  - **fix(alcance universal)**: Aplica a presente subjuntivo, imperativo, condicional, futuro - no solo pretérito indefinido
  - **fix(verbos avanzados)**: Incluidos irregulares complejos (poseer, proveer, instruir) en práctica específica
  - **arquitectura**: Bypass inteligente preserva funcionalidad educativa por nivel mientras permite exploración libre
- 2025-08-27 (Tarde):
  - **MAJOR**: Solucionados problemas críticos de variedad y dialecto en generador
  - **fix(variedad)**: "Todos los verbos" ahora accede a la base completa (~90 verbos) saltando restricciones `allowedLemmas`
  - **fix(repetición)**: Algoritmo de selección mejorado elimina repetición monolítica (hablar/comer constantes)
  - **fix(vos)**: Pronombre VOS ahora aparece correctamente en práctica rioplatense (era `practicePronoun='both'`, ahora `='all'`)
  - **fix(práctica por tema)**: Bypassed restricciones MCER cuando se practica por tema específico
  - **fix(dialecto consistente)**: `practicePronoun='all'` ahora respeta restricciones regionales en lugar de globales
- 2025-08-27 (Mañana):
  - fix(conjugación): Subjuntivo vos=tú y ajuste de imperativo negativo (2ª persona) → `conjugationRules.js`, `grader.js`.
  - fix(data): Saneador de Presente de Subjuntivo (re-etiquetado de persona, reconstrucción zc) → `dataSanitizer.js` + hook en `optimizedCache.js`.
  - fix(generator): Invalida caché por `region` y `allowedLemmas` para que "Por tema" no se quede con un solo verbo.
- 2025-08-26 (Tarde): 
  - **Housekeeping completo**: Centralizó configuración, agregó sistema de logging inteligente, prevención de memory leaks
  - **API unificada**: Estandarizó debugging bajo `window.SpanishConjugator.*`
  - **Bug fix crítico**: Corrigió selección de tiempos verbales en práctica específica
  - **Debugging mejorado**: Panel visual para validar configuración vs ejercicio actual
- 2025-08-26 (Mañana): Integrado orquestador emocional, indicador UI y cableado SRS post‑intento. Arreglo `database.deleteDB()` (usa `idb.deleteDB`).
