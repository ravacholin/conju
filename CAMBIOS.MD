# CAMBIOS

## Objetivo
Este documento identifica debilidades, flaquezas, riesgos y oportunidades de mejora en toda la app. Incluye un plan paso a paso para elevar funcionamiento, rendimiento, calidad y experiencia.

## Resumen ejecutivo
- La app ya es muy ambiciosa, pero la complejidad esta repartida de forma desigual: UI y routing cargan demasiada responsabilidad, mientras que el motor y el sistema de progreso crecen sin una capa de orquestacion clara.
- El rendimiento depende de muchos parches defensivos (timeouts, fallbacks, cargas diferidas) que funcionan pero generan deuda tecnica y dificil trazabilidad.
- La calidad de datos (verbos, irregularidades, etiquetas) es critica para confianza del usuario y necesita un pipeline de validacion riguroso.
- El progreso y la sincronizacion son poderosos, pero la UX no siempre traduce esa inteligencia en acciones claras.
- El mayor salto a "siguiente nivel" vendra de: arquitectura de navegacion limpia, modelo de datos auditable, y un sistema de aprendizaje guiado con objetivos y feedback claros.

## Cambios realizados (P0 - slice 1)
- Router inicializa `history.state` al arrancar para evitar estados huérfanos en Back.
- Se elimino la navegacion inicial duplicada en onboarding (menos loops y popstate inconsistentes).
- Se creo un store de sesion dedicado (`src/state/session.js`) para sacar estado efimero de `useSettings`.
- Flujos de sesiones personalizadas y de plan migrados a `useSessionStore`.
- `useSettings` ahora valida y migra con Zod; defaults completos para claves usadas por onboarding.
- Se agrego diagnostico de generacion en Drill cuando el pool queda vacio o tarda demasiado.
- Se reforzo `mergeAccountDataLocally` para `attempts`: updates con `id` consistente al resolver conflictos por timestamp.
- Se agregaron tests de regresion de merge para `attempts`:
- `local newer` no debe sobreescribirse con remoto viejo.
- fallback por clave compuesta cuando remoto no trae `id`.
- Tests de onboarding y drill ejecutados y ajustados donde correspondia.
- Fix de regresion en hooks de drill: selectores de `useSessionStore` estabilizados con `useShallow` para evitar loops de render en React 19.
- Validacion global posterior: suite completa `npm test -- --run` en verde (`130` archivos, `996` tests pass).

## Cambios realizados (P1 - slice 1: filtro especifico)
- Se optimizo el filtrado de practica especifica en `DrillFormFilters` con indice memoizado por combinacion `mood|tense`.
- `filterForSpecificPractice` ahora evita escaneo completo repetido del pool cuando la practica es especifica.
- Se mantiene soporte para tensiones mixtas (`impMixed`, `nonfiniteMixed`) sobre el nuevo indice.
- Tests agregados y verdes:
- `src/hooks/modules/DrillFormFilters.test.js`
- `src/hooks/modules/useDrillGenerator.generateNextItem.test.js`

## Cambios realizados (P1 - slice 2: fast-path por persona)
- Se extendio `buildSpecificConstraints` para transportar `specificPerson` en `review specific` y casos especificos.
- Se amplió el indice de filtrado especifico a `mood|tense|person` para fast-path mas fino.
- `filterForSpecificPractice`, `matchesSpecific` y `filterDueForSpecific` ahora respetan `specificPerson` cuando existe.
- Se incluyo `specificPerson` en la key de cache de elegibles en `useDrillGenerator` para evitar colisiones de cache.
- Tests verdes:
- `src/hooks/modules/specificConstraints.test.js`
- `src/hooks/modules/DrillFormFilters.test.js`
- `src/hooks/modules/useDrillGenerator.generateNextItem.test.js`

## Cambios realizados (P1 - slice 3: politica de cache e invalidacion por eventos)
- `ProgressDataCache.get` ahora soporta politica por request:
- `ttl` override por entrada (persistido en la entrada cacheada).
- `forceRefresh` para bypass explicito del cache en refresh selectivos.
- Se agrego `invalidateByDataType(dataTypes, userId?)` para invalidar por tipo de dato con alcance opcional por usuario.
- Se extrajo y reutilizo una sola funcion `resolveProgressUpdateKeys(detail)` para mapear eventos de progreso a claves de datos.
- El listener global de `progress:dataUpdated` ahora invalida por tipo con granularidad y evita invalidaciones completas innecesarias.
- `useProgressDashboardData` usa el mismo resolvedor y fuerza invalidacion selectiva previa a `refreshFromEvent`, reduciendo riesgo de datos stale por TTL.
- `settings:changed` y `progress:challengeCompleted` migrados a invalidacion por tipo (`recommendations`, `heatMap`, `dailyChallenges`).
- Tests agregados/actualizados:
- `src/lib/cache/ProgressDataCache.test.js` (TTL override, force refresh, invalidacion por tipo/usuario y mapeo de eventos).

## Cambios realizados (P1 - slice 4: SW update checks menos agresivos)
- Se rediseño `swUpdateHandler` para reducir polling agresivo de updates:
- Intervalo de chequeo paso de `30s` a `5min` cuando la app esta activa.
- Se agrego throttling minimo (`60s`) entre checks para evitar rafagas.
- Se agregaron triggers reactivos para chequear en momentos utiles:
- `focus` de ventana.
- `visibilitychange` al volver a pestaña visible.
- `online` (forzado) al recuperar conexion.
- Se agrego chequeo diferido en idle (`requestIdleCallback` o fallback con timeout).
- `checkForUpdate()` ahora usa el mismo pipeline seguro (`safeCheckForUpdate`) en modo forzado.
- Se mantiene deduplicacion global de intervalos via `window.__CONJU_SW_UPDATE_INTERVAL__`.

## Cambios realizados (P1 - slice 5: sync status sin listeners duplicados)
- `useSyncStatus` fue refactorizado a una suscripcion global compartida para evitar duplicar listeners/intervals cuando hay multiples consumidores.
- Se centralizaron handlers y lifecycle con attach/detach global:
- eventos `progress:cloud-sync`, `online`, `offline`, `focus`, `visibilitychange`.
- El fallback polling se redujo y endurecio:
- intervalo paso a `2 min`.
- polling ignora tabs ocultas (`document.hidden`) y refresca al volver visible.
- Se mantiene actualizacion inmediata al montar cada consumidor, sin re-renders innecesarios (comparador de estado).
- Tests nuevos:
- `src/hooks/useSyncStatus.test.js` cubriendo deduplicacion de listeners, teardown del ultimo consumidor y politica de polling en hidden/visible.

## Cambios realizados (P1 - slice 6: limpieza de logs ruidosos en drill)
- Se reemplazaron `console.log`/`console.error` en rutas criticas de generacion por `logger` estructurado.
- Archivos impactados:
- `src/hooks/modules/useDrillGenerator.js`
- `src/hooks/useDrillMode.js`
- `generateNextItem` ahora reporta fallbacks y errores criticos con contexto estructurado (settings, stack, tipo de fallback) sin ruido de consola directa.
- Los flujos de fallback de emergencia ahora usan `logger.debug/info/warn/error`, manteniendo trazabilidad en dev sin saturar salida ni mezclar canales.

## Cambios realizados (P1 - slice 7: recuperacion guiada cuando el pool queda vacio)
- Se fortalecio la UX de diagnostico en Drill para convertir sugerencias en acciones aplicables.
- `DrillMode` ahora ofrece botones accionables por sugerencia (no solo texto), aplicando ajustes y regenerando automaticamente:
- cambiar a modo mixto.
- ampliar tipo de verbo a `all`.
- quitar filtro de familia.
- ampliar pronombres.
- Se extrajo logica de diagnostico a modulo dedicado:
- `src/components/drill/generationDiagnostics.js`
- Se estandarizo logging de DrillMode con `createLogger`, removiendo `console.warn/error` directos en timeouts y manejo de eventos.
- Test agregado:
- `src/components/drill/generationDiagnostics.test.js` para validar sugerencias y detalle de diagnostico.

## Cambios realizados (P1 - slice 8: lifecycle de intervalos en progress system)
- Se encapsulo el scheduler de limpieza de mastery en helpers dedicados dentro de `src/lib/progress/index.js`:
- `ensureMasteryCleanupScheduler()`: crea un unico intervalo global.
- `clearMasteryCleanupScheduler()`: limpia intervalo y referencia global.
- Se evita acumulacion de `setInterval` entre reinicializaciones del sistema (`initProgressSystem` -> `resetProgressSystem` -> `initProgressSystem`).
- Se agrego cleanup explicito del scheduler al ejecutar `resetProgressSystem`.
- Test agregado:
- `src/lib/progress/index.test.js` verifica deduplicacion del scheduler y limpieza correcta en reset.

## Cambios realizados (P1 - slice 9: robustez de cancelacion de auto-sync)
- Se corrigio `cancelScheduledSync` en `src/lib/progress/cloudSync.js` para limpiar tambien timers con id `0` (caso valido en algunos runtimes/test env).
- Antes la condicion truthy podia omitir `clearInterval(0)` y dejar estado inconsistente.
- Test agregado en `src/lib/progress/cloudSync.memoryLeak.test.js`:
- valida que `cancelScheduledSync()` invoque `clearInterval(0)` cuando `setInterval` devuelve `0`.

## Cambios realizados (P1 - slice 10: recordatorios con scheduling eficiente)
- Se optimizo `PracticeReminders` para evitar polling fijo por `setInterval(60s)`:
- ahora usa `setTimeout` alineado al siguiente minuto (`getMsUntilNextMinute`) y solo evalua recordatorios cuando la pestaña esta visible.
- Se agregaron triggers reactivos en `focus` y `visibilitychange` para refrescar al volver a la app.
- `practiceReminderDays` ahora se memoiza y normaliza para evitar re-suscripciones innecesarias del efecto.
- Se extrajeron utilidades a `src/features/progress/practiceReminderScheduler.js`:
- `normalizeReminderDays(days)`
- `getMsUntilNextMinute(nowMs)`
- Tests agregados:
- `src/features/progress/practiceReminderScheduler.test.js`

## Cambios realizados (P1 - slice 11: auto-sync consciente de visibilidad/conectividad)
- Se agrego `shouldRunAutoSyncTick` en `src/lib/progress/cloudSync.js` para centralizar politica de ejecucion de ticks de auto-sync.
- `scheduleAutoSync` ahora omite sincronizacion cuando:
- la app esta en incognito,
- el cliente esta offline,
- la pestaña esta oculta (`document.hidden`).
- Listeners globales `online/offline` de `cloudSync` ahora enrutan por `handleConnectivityChange(...)` para mantener una sola logica de conectividad.
- Limpieza menor: se eliminaron variables de `catch` no usadas en persistencia de `lastSyncTime`.
- Test agregado/actualizado:
- `src/lib/progress/cloudSync.memoryLeak.test.js` valida la politica de `shouldRunAutoSyncTick`.

## Cambios realizados (P1 - slice 12: deduplicacion de listeners globales de cloud sync)
- Se reforzo bootstrap de `cloudSync` para evitar listeners globales duplicados en recargas/HMR:
- guardia global `__CONJU_CLOUDSYNC_EVENTS__` para registrar `online/offline` una sola vez.
- Se deduplico el initial sync diferido con `__CONJU_CLOUDSYNC_INITIAL_TIMEOUT__` para no acumular timeouts.
- Test actualizado:
- `src/lib/progress/cloudSync.memoryLeak.test.js` ahora cubre que `handleConnectivityChange` refleja correctamente estado online/offline en `getSyncStatus()`.

## Cambios realizados (P1 - slice 13: cache key de generacion con contexto de review)
- Se extrajo y endurecio la construccion de keys de cache de elegibles en `src/hooks/modules/drillCacheKey.js`.
- `buildEligibleFormsKey(...)` ahora incorpora fingerprint estable de `reviewSessionType + reviewSessionFilter`.
- Esto evita reutilizar cache de elegibles entre filtros de review semanticamente distintos.
- Se centralizo tambien `shouldCacheEligibleForms(...)` para que la politica de cache quede explicita y testeable.
- `useDrillGenerator` ahora consume esta capa para todas las rutas de cache (generacion, viabilidad, stats).
- Tests nuevos:
- `src/hooks/modules/drillCacheKey.test.js`

## Cambios realizados (P1 - slice 14: lazy load real en dashboard de progreso)
- Se movio carga de secciones pesadas del dashboard a lazy imports con `safeLazy`:
- `HeatMapSRS`, `SmartPractice`, `StudyInsights`, `PronunciationStatsWidget`, `AccuracyTrendCard`, `ErrorIntelligence`.
- Cada seccion lazy ahora tiene `Suspense` con fallback inmediato para mantener percepcion de carga rapida.
- Esto reduce trabajo y peso de render inicial del dashboard mientras se muestran placeholders claros.
- Tests smoke ajustados a render asincrono de componentes lazy:
- `src/features/progress/ProgressDashboard.smoke.test.jsx`

## Estado P1
- P1 finalizado (slices 1 a 14 completos y documentados).

## Cambios realizados (P2 - slice 1: plan del dia accionable)
- Se agrego `DailyPlanPanel` en progreso para mostrar sesiones concretas del plan personalizado con:
- titulo, motivo, dificultad y duracion estimada.
- CTA directa `Empezar sesión` por recomendacion.
- Integracion en `ProgressDashboard`:
- al iniciar una sesion sugerida, aplica `drillConfig` al store (`practiceMode`, specific/review settings) y navega a Drill.
- Esto conecta analitica -> accion inmediata y reduce friccion de “que hago ahora”.
- Tests agregados/actualizados:
- `src/features/progress/DailyPlanPanel.test.jsx`
- `src/features/progress/ProgressDashboard.smoke.test.jsx` (incluye panel en smoke).

## Cambios realizados (P2 - slice 2: story/timeline desbloqueables por progreso real)
- Se agrego `ProgressUnlocksPanel` para vincular progreso con recompensas de experiencia:
- desbloqueo de Story por intentos totales.
- desbloqueo de Timeline por racha o dominio global.
- Cada recompensa muestra requisito actual y estado (`Bloqueado` / `Abrir ahora`) con CTA directa.
- Integracion en `ProgressDashboard` y cableado de navegacion real desde `AppRouter`:
- `onNavigateToStory`
- `onNavigateToTimeline`
- Tests agregados/actualizados:
- `src/features/progress/ProgressUnlocksPanel.test.jsx`
- `src/features/progress/ProgressDashboard.smoke.test.jsx`

## Cambios realizados (P2 - slice 3: feedback explicativo de errores)
- Se incorporo capa de feedback pedagógico en `ErrorIntelligence` con formato:
- Regla
- Ejemplo correcto
- Contraejemplo
- La selección se basa en las combinaciones con mayor tasa de error del heatmap reciente.
- Se extrajo la lógica a `src/features/progress/errorFeedbackCoach.js` para mantenerla pura y testeable.
- Tests agregados:
- `src/features/progress/errorFeedbackCoach.test.js`

## Cambios realizados (P2 - slice 4: plan del dia con checklist real)
- Se extendio `DailyPlanPanel` con checklist diario por sesion:
- marca de tarea hecha por item (`Hecha`).
- contador visible `Checklist: X/Y`.
- persistencia local por dia para no perder estado al recargar.
- Nueva capa de almacenamiento simple:
- `src/features/progress/dailyPlanChecklist.js`
- Tests agregados/actualizados:
- `src/features/progress/DailyPlanPanel.test.jsx`
- `src/features/progress/dailyPlanChecklist.test.js`

## Cambios realizados (P2 - slice 5: ruta de aprendizaje adaptativa)
- Se agrego `LearningJourneyPanel` con una ruta de progreso clara en 3 hitos:
- Base estable (intentos), Consistencia (racha) y Dominio operativo (mastery).
- Cada hito muestra progreso porcentual y CTA `Practicar ahora` mientras este pendiente.
- Se incorporo un mensaje adaptativo segun estado real del usuario y plan disponible.
- Se extrajo la logica a una capa pura testeable:
- `src/features/progress/learningJourneyPlan.js`
- Integracion en `ProgressDashboard` para conectar progreso -> accion en Drill.
- Tests agregados/actualizados:
- `src/features/progress/learningJourneyPlan.test.js`
- `src/features/progress/LearningJourneyPanel.test.jsx`
- `src/features/progress/ProgressDashboard.smoke.test.jsx`

## Cambios realizados (P2 - slice 6: modo coach de 5 minutos)
- Se agrego `CoachModePanel` para ejecutar micro-sesiones con objetivo claro y duracion fija.
- El panel genera un plan automatico segun datos reales:
- foco especifico en la combinacion mas debil cuando existe evidencia.
- fallback de recuperacion de confianza o practica mixta cuando no hay señal suficiente.
- Se extrajo la estrategia a una capa pura testeable:
- `src/features/progress/coachSessionPlan.js`
- Integracion en `ProgressDashboard`:
- al iniciar coach aplica `drillConfig` (specific/review/mixed) y navega directo a Drill.
- Tests agregados/actualizados:
- `src/features/progress/coachSessionPlan.test.js`
- `src/features/progress/CoachModePanel.test.jsx`
- `src/features/progress/ProgressDashboard.smoke.test.jsx`

## Cambios realizados (P2 - slice 7: focus mode por objetivo unico)
- Se agrego `FocusModePanel` para ejecutar sesiones con un unico frente activo y evitar dispersion.
- Se incorporaron 3 tracks maximos con prioridad adaptativa:
- reparar punto debil (combo con menor mastery y evidencia).
- reactivar dominio (combos buenos pero estancados).
- bloque base/mixto segun mastery global.
- Se extrajo la logica de construccion a capa pura:
- `src/features/progress/focusTracks.js`
- Integracion en `ProgressDashboard`:
- cada track aplica su `drillConfig` y navega directamente a Drill.
- Tests agregados/actualizados:
- `src/features/progress/focusTracks.test.js`
- `src/features/progress/FocusModePanel.test.jsx`
- `src/features/progress/ProgressDashboard.smoke.test.jsx`

## Cambios realizados (P2 - slice 8: panel de errores frecuentes accionable)
- Se agrego `FrequentErrorsPanel` para convertir inteligencia de errores en acciones de correccion inmediatas.
- El panel selecciona hasta 3 combinaciones prioritarias (mayor tasa de error con evidencia) y muestra:
- combo mood/tense.
- tasa de error en porcentaje.
- volumen de intentos recientes.
- CTA `Corregir ahora` para abrir Drill en modo especifico directo al problema.
- Se extrajo la priorizacion a una capa pura testeable:
- `src/features/progress/frequentErrorsPlan.js`
- Integracion en `ProgressDashboard` con handler dedicado de sesion correctiva.
- Tests agregados/actualizados:
- `src/features/progress/frequentErrorsPlan.test.js`
- `src/features/progress/FrequentErrorsPanel.test.jsx`
- `src/features/progress/ProgressDashboard.smoke.test.jsx`

## Estado P2
- P2 finalizado (slices 1 a 8 completos y documentados).

## Cambios realizados (P3 - slice 1: accesibilidad en tarjetas de practica inteligente)
- Se mejoro `SmartPractice` para navegacion por teclado real en recomendaciones:
- cada tarjeta ahora expone `role="button"` + `tabIndex=0` + activacion con `Enter`/`Space`.
- Se elimino el `button` anidado visual (ahora `span`) para evitar semantica interactiva duplicada.
- Resultado: recomendaciones accionables tanto por mouse como por teclado, con menor friccion de accesibilidad.
- Tests agregados/actualizados:
- `src/features/progress/SmartPractice.test.jsx`

## Cambios realizados (P3 - slice 2: cache y deduplicacion de recomendaciones ML)
- Se agrego cache en memoria con TTL para recomendaciones ML de `SmartPractice`:
- clave estable por señales relevantes de `userStats`.
- reutilizacion de resultados recientes para evitar recalculo innecesario.
- deduplicacion de requests en vuelo para prevenir llamadas duplicadas concurrentes.
- Se incorporo guard de cancelacion en `useEffect` para evitar updates de estado tras unmount.
- Nueva capa utilitaria:
- `src/features/progress/smartPracticeMlCache.js`
- Tests agregados/actualizados:
- `src/features/progress/smartPracticeMlCache.test.js`
- `src/features/progress/SmartPractice.test.jsx`

## Cambios realizados (P3 - slice 3: normalizacion unica de configuracion drill)
- Se extrajo la construccion de settings de navegacion a Drill a una sola capa:
- `src/features/progress/drillNavigationConfig.js`
- Se unifico su uso en `ProgressDashboard` para todos los disparadores:
- plan del dia, SRS review, coach mode, focus mode y correccion de errores.
- La normalizacion evita arrastrar estado stale entre modos (por ejemplo `specificMood/specificTense` fuera de `specific`).
- Se fijaron defaults seguros para `reviewSessionType` y `reviewSessionFilter`.
- Tests agregados/actualizados:
- `src/features/progress/drillNavigationConfig.test.js`
- `src/features/progress/ProgressDashboard.smoke.test.jsx`

## Estado P3
- P3 finalizado (slices 1 a 3 completos y documentados).

## Cambios realizados (P4 - slice 1: accesibilidad teclado en heatmap)
- Se hizo accesible por teclado el grid de `HeatMapSRS`:
- cada celda practica ahora expone `role="button"` y `tabIndex=0`.
- activacion por `Enter`/`Space` con el mismo flujo de click.
- indicador SRS tambien es activable por teclado con semantica explicita.
- Se agregaron `aria-label` descriptivos por mood/tense para mejorar navegacion asistida.
- Tests agregados/actualizados:
- `src/features/progress/HeatMapSRS.test.jsx`

## Cambios realizados (P4 - slice 2: batching de eventos de progreso sin perdida de keys)
- Se reemplazo el debounce ad-hoc de `progress:dataUpdated` por un batcher dedicado:
- nueva capa: `src/features/progress/progressUpdateBatcher.js`.
- Ahora los eventos cercanos se consolidan en una sola ejecucion sin perder claves intermedias.
- Si llega un evento sin keys, se eleva correctamente a `full refresh`.
- Integrado en `useProgressDashboardData` para reducir trabajo redundante y evitar refrescos parciales incompletos.
- Tests agregados/actualizados:
- `src/features/progress/progressUpdateBatcher.test.js`
- `src/features/progress/useProgressDashboardData.test.js`

## Cambios realizados (P4 - slice 3: deteccion explicita de fallos en operaciones async)
- Se reforzo `runOperations` en `useProgressDashboardData`:
- cada loader ahora se envuelve con payload `{ ok, value }` para distinguir fallo real vs `null` valido.
- Se agrego opcion `throwOnFailure` para que las rutas sensibles marquen error cuando una seccion falla.
- `loadTrackedKey` y `refreshFromEvent` usan esta señal para no etiquetar como `success` operaciones que realmente fallaron.
- Se agrego test de regresion para verificar fallback a recarga total cuando falla un refresh parcial.
- Tests agregados/actualizados:
- `src/features/progress/useProgressDashboardData.test.js`

## Estado P4
- P4 finalizado (slices 1 a 3 completos y documentados).

## Cambios realizados (P5 - slice 1: SmartPractice con navegacion drill normalizada)
- `SmartPractice` ahora usa `buildDrillSettingsUpdate` como fuente unica para configurar Drill.
- Se eliminaron updates ad-hoc de settings que podian dejar estado residual entre modos.
- Beneficio: transiciones mas consistentes entre recomendaciones `specific` y `mixed`.
- Tests agregados/actualizados:
- `src/features/progress/SmartPractice.test.jsx`
- `src/features/progress/drillNavigationConfig.test.js`

## Cambios realizados (P5 - slice 2: normalizacion drill extendida a heatmap y micro-drills)
- Se aplico la misma capa de normalizacion (`buildDrillSettingsUpdate`) en:
- `HeatMapSRS` (click celda, click SRS puntual y review SRS general).
- `ErrorIntelligence` (micro-drills por tags/combos).
- Esto evita arrastrar configuraciones stale entre `specific`, `review` y `mixed`.
- Se cubrio regresion para `currentBlock` en mixed mode en tests de config.
- Tests agregados/actualizados:
- `src/features/progress/HeatMapSRS.test.jsx`
- `src/features/progress/drillNavigationConfig.test.js`

## Cambios realizados (P5 - slice 3: invalidacion reactiva de cache ML en SmartPractice)
- Se agrego invalidacion explicita de cache ML por clave y global:
- `invalidateCachedSmartPracticeRecommendation(key)`
- `invalidateAllSmartPracticeRecommendations()`
- `SmartPractice` ahora escucha `progress:dataUpdated` y, cuando detecta cambios de practica/sync, invalida su cache y regenera recomendaciones.
- Resultado: menor riesgo de recomendaciones stale luego de nuevas respuestas del usuario.
- Tests agregados/actualizados:
- `src/features/progress/smartPracticeMlCache.test.js`
- `src/features/progress/SmartPractice.test.jsx`

## Estado P5
- P5 finalizado (slices 1 a 3 completos y documentados).

## Cambios realizados (P6 - slice 1: unificacion de navegacion a Drill en dashboard)
- Se incorporo `applyDrillConfigAndNavigate` en `ProgressDashboard` para centralizar:
- normalizacion de settings de Drill (`buildDrillSettingsUpdate`).
- disparo de navegacion a Drill.
- Se elimino duplicacion de logica en handlers de:
- plan diario, SRS review, coach mode, focus mode y panel de errores frecuentes.
- Se agrego test dedicado de wiring para validar que la sesion iniciada desde `DailyPlanPanel` aplica config normalizada antes de navegar.
- Tests agregados/actualizados:
- `src/features/progress/ProgressDashboard.navigation.test.jsx`

## Cambios realizados (P6 - slice 2: guard anti doble-disparo de navegacion a Drill)
- Se agrego un lock temporal en `ProgressDashboard` para evitar navegaciones duplicadas por clicks rapidos repetidos.
- El guard se libera automaticamente luego de una ventana corta de cooldown y se limpia en unmount.
- Impacto: menos riesgo de doble push de estado y transiciones redundantes en Drill.
- Tests agregados/actualizados:
- `src/features/progress/ProgressDashboard.navigation.test.jsx` (caso de doble trigger + reintento post-cooldown)

## Cambios realizados (P6 - slice 3: deduplicacion de timers de navegacion en heatmap)
- `HeatMapSRS` ahora centraliza la navegacion diferida a Drill en `scheduleNavigateToDrill`.
- Si llegan multiples triggers rapidos (click/teclado), se colapsan en una unica navegacion efectiva.
- Se agrega cleanup de timeout en unmount para evitar timers colgando.
- Tests agregados/actualizados:
- `src/features/progress/HeatMapSRS.test.jsx` (nuevo caso de deduplicacion de navegacion rapida)

## Estado P6
- P6 finalizado (slices 1 a 3 completos y documentados).

## Cambios realizados (P7 - slice 1: refresh ML de SmartPractice con debounce)
- Se optimizo la reaccion de `SmartPractice` ante `progress:dataUpdated`:
- ahora invalida cache y reagenda recarga con debounce de 250ms.
- multiples eventos rapidos se consolidan en una sola regeneracion ML.
- Se agrego cleanup explicito del timer de debounce en unmount.
- Tambien se memoizo `getMoodTenseLabel` para evitar recomputos evitables en `useMemo`.
- Tests agregados/actualizados:
- `src/features/progress/SmartPractice.test.jsx`

## Cambios realizados (P7 - slice 2: keys estables para tarjetas de recomendaciones)
- Se reemplazo el `key={index}` en tarjetas de `SmartPractice` por una key estable de identidad.
- Nueva utilidad:
- `src/features/progress/smartPracticeRecommendationKey.js`
- Esto reduce riesgo de re-mount innecesario de tarjetas cuando cambia el orden/fuente de recomendaciones.
- Tests agregados/actualizados:
- `src/features/progress/smartPracticeRecommendationKey.test.js`

## Cambios realizados (P7 - slice 3: scheduler cancelable para carga lazy pesada del dashboard)
- Se agrego un scheduler reutilizable para tareas lazy con idle + fallback y cancelacion segura:
- `src/features/progress/lazyTaskScheduler.js`
- `useProgressDashboardData` ahora usa este scheduler para la carga de analiticas pesadas:
- cancela tareas pendientes cuando arranca un nuevo `loadData`.
- evita ejecutar multiples corridas lazy superpuestas.
- mantiene fallback controlado si no hay idle a tiempo.
- Se agrego cleanup explicito del scheduler en unmount.
- Tests agregados/actualizados:
- `src/features/progress/lazyTaskScheduler.test.js`
- `src/features/progress/useProgressDashboardData.test.js`

## Estado P7
- P7 finalizado (slices 1 a 3 completos y documentados).

## Cambios realizados (P8 - slice 1: robustez operativa en flujo SRS)
- `useSRSQueue` ahora enriquece cada item con `itemKey` estable y ordena de forma determinista:
- urgencia desc, mastery asc, nextDue asc, `itemKey` asc.
- Se migro el manejo de errores de `console.error` a logger estructurado del proyecto.
- `SRSPanel` usa `itemKey` estable (con fallback) para evitar keys por indice.
- `SRSPanel` reutiliza `personLabel` proveniente del hook para evitar duplicacion de mapeo de persona en UI.
- `SRSPanel` incorpora guard anti doble-disparo al iniciar repaso (cooldown corto + cleanup en unmount).
- `SRSPanel` ahora normaliza configuracion de review con `buildDrillSettingsUpdate`.
- Tests agregados/actualizados:
- `src/hooks/useSRSQueue.test.js`
- `src/features/progress/SRSPanel.test.jsx`
- `src/features/progress/drillNavigationConfig.test.js`

## Cambios realizados (P8 - slice 2: configuracion SRS review extraida y testeable)
- Se extrajo la construccion de filtros/config de sesiones SRS review a una capa pura:
- `src/features/progress/srsReviewSessionConfig.js`
- API introducida:
- `buildSrsReviewFilter(sessionType)`
- `buildSrsReviewDrillConfig(sessionType)`
- `SRSPanel` ahora consume esta capa en `startReviewSession`, reduciendo logica inline y facilitando validacion de reglas por tipo de sesion.
- Tests agregados/actualizados:
- `src/features/progress/srsReviewSessionConfig.test.js`
- `src/features/progress/SRSPanel.test.jsx`

## Cambios realizados (P8 - slice 3: debounce de eventos SRS para evitar recargas redundantes)
- `SRSPanel` ahora coalescea eventos `progress:srs-updated` en una sola recarga efectiva con debounce corto.
- Esto evita rafagas de `loadSRSData + reload` cuando se disparan multiples updates seguidos.
- Se agrego cleanup del timer de debounce al desmontar.
- Tests agregados/actualizados:
- `src/features/progress/SRSPanel.test.jsx` (caso de eventos rapidos coalescidos)

## Estado P8
- P8 finalizado (slices 1 a 3 completos y documentados).

## Cambios realizados (P9 - slice 1: proteccion anti respuestas stale en cola SRS)
- Se reforzo `useSRSQueue` para ignorar respuestas viejas cuando hay recargas superpuestas:
- se agrega `requestId` incremental y aplicacion de estado solo para la request mas reciente.
- se evita actualizar estado luego de un unmount.
- Beneficio: menos riesgo de que una respuesta lenta pise una cola mas nueva.
- Tests agregados/actualizados:
- `src/hooks/useSRSQueue.test.js` (nuevo caso de race entre reloads)

## Cambios realizados (P9 - slice 2: cooldown reutilizable para acciones criticas)
- Se agrego helper reutilizable `createActionCooldown`:
- `src/features/progress/actionCooldown.js`
- Se aplico en `ProgressDashboard` para unificar el guard anti doble-navegacion a Drill y eliminar manejo manual de timers/locks.
- Se mantiene el mismo comportamiento funcional con una implementacion mas simple y testeable.
- Tests agregados/actualizados:
- `src/features/progress/actionCooldown.test.js`
- `src/features/progress/ProgressDashboard.navigation.test.jsx`

## Cambios realizados (P9 - slice 3: SRSPanel migrado a cooldown compartido)
- `SRSPanel` ahora usa `createActionCooldown` para el guard anti doble-disparo de `startReviewSession`.
- Se elimino logica manual de lock+timeout local, manteniendo el mismo comportamiento funcional.
- Esto alinea el control de concurrencia de acciones con el dashboard y reduce codigo duplicado.
- Tests agregados/actualizados:
- `src/features/progress/SRSPanel.test.jsx`
- `src/features/progress/actionCooldown.test.js`

## Estado P9
- P9 finalizado (slices 1 a 3 completos y documentados).

## Cambios realizados (P10 - slice 1: debouncer reusable para eventos de progreso)
- Se agrego utilidad reusable `createEventDebouncer`:
- `src/features/progress/eventDebouncer.js`
- Se integro en `SmartPractice` para reemplazar manejo manual de timeout en `progress:dataUpdated`.
- Beneficio: menos codigo de timer ad-hoc y comportamiento de coalescing centralizado/testeable.
- Tests agregados/actualizados:
- `src/features/progress/eventDebouncer.test.js`
- `src/features/progress/SmartPractice.test.jsx`

## Cambios realizados (P10 - slice 2: SRSPanel migrado a debouncer compartido)
- `SRSPanel` ahora reutiliza `createEventDebouncer` para `progress:srs-updated`.
- Se elimina debounce manual por timeout local, manteniendo el mismo comportamiento de coalescing.
- Beneficio: menor duplicacion de logica de timers y cleanup consistente.
- Tests agregados/actualizados:
- `src/features/progress/SRSPanel.test.jsx`
- `src/features/progress/eventDebouncer.test.js`

## Cambios realizados (P10 - slice 3: guards SSR para listeners de ventana en progreso)
- Se agregaron guards `typeof window !== 'undefined'` en efectos que registran listeners globales en:
- `SmartPractice` (`progress:dataUpdated`)
- `SRSPanel` (`progress:open-review-queue`, `progress:srs-updated`)
- Esto evita errores en entornos sin `window` y mejora robustez para renderizado no-browser/tests.
- Tests agregados/actualizados:
- `src/features/progress/SmartPractice.test.jsx`
- `src/features/progress/SRSPanel.test.jsx`

## Estado P10
- P10 finalizado (slices 1 a 3 completos y documentados).

## Cambios realizados (P11 - slice 1: evaluador puro para recordatorios de practica)
- Se extrajo la decision de disparo del recordatorio diario a una capa pura:
- `src/features/progress/practiceReminderEvaluator.js`
- `PracticeReminders` ahora delega la logica de elegibilidad/estado (`lastTriggeredKey`) a esta utilidad.
- Beneficio: menor complejidad en UI y reglas testeables sin depender del componente.
- Tests agregados/actualizados:
- `src/features/progress/practiceReminderEvaluator.test.js`

## Cambios realizados (P11 - slice 2: robustez de PracticeReminders en runtime no-browser)
- Se agrego guard defensivo en `PracticeReminders` para evitar registrar listeners cuando `window/document` no existen.
- Se agregaron tests de comportamiento del componente para validar:
- disparo de toast cuando corresponde recordatorio.
- no disparo cuando el recordatorio esta desactivado.
- Tests agregados/actualizados:
- `src/features/progress/PracticeReminders.test.jsx`
- `src/features/progress/practiceReminderEvaluator.test.js`

Tests ejecutados:
- `npx vitest run src/hooks/useOnboardingFlow.test.js src/components/onboarding/navigationBack.test.jsx`
- `npx vitest run src/hooks/useDrillMode.generation-smoke.test.js src/hooks/useDrillMode.result-normalization.test.js`

## Mapa actual end to end
- UI: React + componentes locales y features (drill, learning, progress, story, timeline).
- Routing: router propio con History API + estados internos en hooks.
- Estado: Zustand global con persistencia localStorage e IndexedDB (sync).
- Motor: generacion de items, filtros, SRS, analiticas y clasificacion de errores.
- Datos: dataset de verbos grande con carga lazy y fallbacks.
- Progreso: modulo extenso con tracking, analitica, sync, retos, coaching, etc.
- Infra: Vite + PWA + service worker + sync server.

## Debilidades y flaquezas (por area)

### Producto y UX
- Flujo de onboarding largo y con demasiadas bifurcaciones. Falta claridad del "que hago ahora".
- Modo drill potente pero sin narrativa de progreso inmediato. El usuario puede sentirse en bucle.
- Modo learning, story y timeline no estan integrados como un camino unico. Parecen islas.
- Falta un sistema de objetivos claros por sesion (meta diaria, semanal, nivel, micro-objetivos).
- Personalizacion profunda en settings, pero sin explicar el impacto en resultados.

### Navegacion y routing
- Router propio con varios puntos de verdad (URL, estado interno, store). Riesgo de estados desincronizados.
- Uso intenso de listeners globales y referencias mutables en hooks. Riesgo de leaks y comportamiento no determinista.
- Acciones de navegacion disparan regeneracion de items con timeouts defensivos; esto oculta causas reales.

### Estado y sincronizacion
- Store `useSettings` mezcla configuracion persistente con estado temporal (sesiones, resultados, flags). Esto complica persistencia y depuracion.
- Se setean campos en el store que no existen en el esquema inicial (ej. sesiones). Esto produce inconsistencias silenciosas.
- Persistencia doble (localStorage + IndexedDB) con debounces independientes. Riesgo de race conditions y escrituras redundantes.
- Falta tipado estricto; errores de keys o valores no son detectados en build.

### Generacion de ejercicios
- Pipeline de generacion es complejo y defensivo (timeouts, fallbacks, logs). Indica fragilidad en filtros y criterios.
- Filtros encadenados pueden producir pools vacios. El sistema responde con regeneraciones y fallbacks, pero la UX sufre.
- El generador depende de settings globales leidos fuera de React, lo que puede introducir stale state.

### Datos linguisticos
- Riesgo de inconsistencias en irregularidades y listas de verbos. Existen backups y variantes que no garantizan un source of truth.
- Cambios en reglas pueden introducir regresiones silenciosas sin una suite de validacion linguistica.
- Duplicacion de conocimiento entre reglas, familias irregulares y tablas auxiliares.

### Progreso y analiticas
- Modulo de progreso es enorme y con responsabilidades mezcladas. La UI usa solo una fraccion del potencial.
- Se recalculan datos pesados frecuentemente. Carga inicial del dashboard puede ser pesada.
- Falta una politica clara de cache, expiracion y invalidacion por eventos.

### Rendimiento
- Carga inicial todavia pesada por dependencias y procesos de bootstrap (sync, analytics, SW updates).
- Se hacen `setInterval` y listeners globales en varios modulos; en multiples tabs el costo se multiplica.
- Se usan logs y `console` en rutas criticas. En prod se filtran, pero en dev afectan rendimiento.
- La generacion de items puede tardar segundos cuando hay filtros restrictivos.

### Memoria y estabilidad
- Muchos timers y listeners no estan unificados bajo un gestor de lifecycle. Riesgo de leaks en sesiones largas.
- Fallbacks de emergencia pueden ocultar errores reales e impedir depuracion.
- Uso de `window` como bus de eventos sin contratos claros.

### Seguridad y privacidad
- El cliente soporta tokens de sync via envs. Riesgo si se filtra en build o se expone en frontend.
- No hay un modelo claro de consentimiento y minimizacion de datos para analytics.

### Accesibilidad
- Falta de enfoque consistente en focus management y aria en flujos clave.
- No hay pruebas automaticas de accesibilidad.

### Testing
- El core tiene muchos tests, pero la UI critica (onboarding, navegacion, back, drill flow) carece de e2e robusto.
- Tests de datos linguisticos no cubren regresiones de irregularidades y reglas.
- Falta un set de fixtures estables para validaciones linguisticas.

### Build y operaciones
- Config de PWA agresiva en update checks (intervalos cortos). Puede generar consumo innecesario.
- ManualChunks basados en rutas pueden romperse con refactors y mover archivos.
- No hay presupuesto de bundle size ni CI que lo controle.

## Oportunidades de mejora concretas (con impacto)

### P0 Estabilidad y confianza
- Unificar routing en una sola fuente de verdad. Alternativas: React Router o state machine pura con URL sincronizada via replace.
- Definir un modelo de estado y versionado para `useSettings`. Evitar setear claves no definidas.
- Reducir listeners globales y timers dispersos. Centralizar en un "lifecycle manager".
- Auditar sync y merges para asegurar consistencia cross device (especialmente attempts).

### P1 Rendimiento y UX
- Indexar data de verbos por combinaciones (mood, tense, person) para generacion O(1) o near O(1).
- Cachear resultados de generacion por configuracion y resetear solo cuando cambian settings relevantes.
- Mover carga pesada del progreso a un lazy load real y un "skeleton" rapido.
- Reducir el polling del SW update y hacerlo por focus/idle.

### P2 Next level (experiencia)
- Curar una ruta de aprendizaje: itinerarios por nivel con micro logros y mensajes adaptativos.
- Integrar story y timeline como recompensas desbloqueables vinculadas a progreso real.
- Introducir panel de "plan del dia" con tareas accionables y explicacion del por que.
- Personalizar el feedback del error con reglas humanas y ejemplos relevantes.

## Plan paso a paso (exhaustivo)

1. Diagnostico base y metricas
- Instrumentar tiempos reales de generacion de items y carga del dashboard.
- Medir bundle size y TTI en desktop y mobile.
- Definir SLAs: generacion < 50ms p95, dashboard < 1.5s p95 en cold cache.

2. Estabilizar navegacion
- Elegir un solo router y migrar flujos paso a paso.
- Eliminar sincronizaciones cruzadas entre router, hook y store.
- Agregar tests de navegacion para rutas criticas.

3. Consolidar estado
- Separar store de configuracion persistente y store de session/ephemeral.
- Definir schema con Zod para settings y validarlo en cada carga.
- Versionar settings y agregar migraciones.

4. Rehacer generacion
- Precomputar indices de verbos y formas por region y nivel.
- Separar filtros deterministas de priorizacion adaptativa.
- Implementar reporte de causas cuando el pool queda vacio (UI explica y propone cambios).

5. Calidad de datos
- Definir un pipeline de validacion de verbos con tests regresivos.
- Unificar fuentes de irregularidades en un solo archivo canonical.
- Crear reporte automatico de inconsistencias.

6. Progreso y analiticas
- Definir un grafo de dependencias de datos y cache con TTL.
- Reducir recomputos pesados y moverlos a background (idle or worker).
- Mejorar la UX: menos tarjetas, mas insights accionables.

7. Rendimiento general
- Mover caches y calculos pesados a Web Worker donde aplique.
- Optimizar componentes con memoizacion y selectors especificos en Zustand.
- Introducir presupuestos de performance en CI.

8. Accesibilidad y UX
- Revisar focus management en onboarding y drill.
- Auditar contraste y tamanos en mobile.
- Agregar tests a11y basicos con axe.

9. Seguridad y privacidad
- Evitar tokens en frontend; usar exchange seguro por backend.
- Documentar politica de datos locales y opt-in de analytics.

10. Operacion y mantenimiento
- Documentar limites de datasets y guidelines de performance.
- Limpiar backups viejos y datos duplicados.
- Mantener un changelog tecnicos por release.

## Ideas de diseno y producto para "siguiente nivel"

- Mapa de aprendizaje visual: ruta por niveles con checkpoints claros.
- Modo "coach": mini sesiones de 5 minutos con objetivos y feedback al final.
- Explicaciones inteligentes: mostrar regla + ejemplo + contraejemplo.
- Sistema de micro retos diarios con recompensas que desbloqueen story/timeline.
- "Focus mode": sesiones dedicadas a una dificultad (por ejemplo, preterito vs imperfecto).
- Panel de "errores frecuentes" con ejercicios correctivos.
- Feedback multimodal: audio real y pronunciacion guiada.
- Perfil de usuario con diagnostico de fortalezas y debilidades por persona/tiempo.

## Metricas y validacion
- TTI y tiempo de carga inicial en mobile.
- Generacion de item p50 y p95 por configuracion.
- Conversion de onboarding a primera sesion.
- Retencion D1/D7 con recordatorios.
- Reduccion de errores por categoria (mood, tense, person).

## Riesgos y mitigaciones
- Refactor de routing puede romper navegacion. Mitigar con tests E2E y rollout gradual.
- Cambios en generacion pueden alterar el tipo de ejercicios. Mitigar con fixtures y golden tests.
- Auditoria linguistica puede revelar muchos errores. Mitigar con un plan por prioridades (top verbos).

## Quick wins (1 a 7 dias)
- Reducir logs ruidosos y centralizar logger.
- Bajar intervalos agresivos de SW update.
- Limpiar listeners duplicados y timeouts sin cleanup.
- Mostrar mensaje claro cuando el pool de ejercicios queda vacio.

## Grandes apuestas (4 a 8 semanas)
- Re-arquitectura del routing.
- Indices de datos por combinacion y worker para generacion.
- Pipeline de validacion linguistica automatizado.
- Experiencia guiada de aprendizaje end to end.
