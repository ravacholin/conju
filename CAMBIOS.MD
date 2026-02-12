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
