# Informe de Auditoría Técnica y Plan de Limpieza/Optimización

Este informe sintetiza problemas actuales y riesgos potenciales del código, su impacto en UX/fiabilidad/rendimiento, y propone un plan de saneamiento priorizado con tareas accionables.

## Resumen Ejecutivo
- Navegación “Back” compleja y frágil: mezcla estado interno con History API (push/replace/manual) y produce comportamientos no deterministas (no volver, loops, salida de la webapp). Alto impacto en UX.
- Fuente de verdad múltiple del estado: React local state + store global (`useSettings`) + `history.state` duplican responsabilidades y generan cierres obsoletos y decisiones inconsistentes.
- Generación de pool de formas pesado: se construye en memoria todo el conjunto de formas por región en `AppRouter`, y se inyectan no finitas sintéticas en cada recomputación sin deduplicación estricta.
- Datos lingüísticos con inconsistencias: mapas de irregulares/participios contienen posibles errores y clasificaciones dudosas (ej: “oír” en PRET_J; “desenvolvuelto” vs “desenvuelto”). Riesgo de respuestas incorrectas.
- Logging/telemetría ruidosa en producción: muchas trazas `console.log`/`console.error` sin guardas de entorno.
- PWA integrando Workbox: correcto en general, pero falta patrón uniforme de actualización UX y pruebas de no-cache de HTML.
- Falta de pruebas de navegación/UX: no hay tests que validen la máquina de estados del onboarding o la integración del Back (UI/hardware).

## Hallazgos Detallados (con impacto y acciones)

### 1) Back/Navegación (crítico)
- Síntomas:
  - Botón “Back” de UI no siempre vuelve un paso; requiere dobles toques.
  - Gesto Back del móvil puede cerrar la webapp en estados intermedios.
  - Estados inconsistentes entre `onboardingStep`, `useSettings` y `history.state` (guarda pushState “de protección”, loops).
- Causas raíz:
  - Mezcla de dos “routers”: máquina de pasos interna + History API manual (push/replace) + listeners `popstate` con referencias obsoletas (effect sin dependencias usando `onboardingFlow` y `settings` del cierre inicial).
  - “Guard pushes” al montar que inflan el stack e impiden salir correctamente.
- Acciones recomendadas:
  1. Adoptar un único router declarativo: React Router (o minimal custom) y mapear cada paso a una ruta (`/dialecto`, `/menu`, `/modo`, `/tiempos`, `/tipo`, `/familia`, `/drill`). Usar `navigate(-1)` para Back y dejar que el stack de navegador sea la verdad.
  2. Si se mantiene máquina de pasos, NO usar `history.back()` ni `pushState` automáticos; en su lugar, un “state machine” pura (XState o reducer central) y un único sincronizador opcional a la URL con replaceState (no push) para deep-linking.
  3. Eliminar “guard pushes” y listeners `popstate` con cierres obsoletos; si quedan listeners, suscribe con dependencias correctas o usa refs estables.
  4. Añadir pruebas de regresión (Vitest + @testing-library/react) para secuencias clave: “Vos → Por tema → Indicativo → Back”, “Nivel → Específico → Modo/Tiempo → Tipo → Back x2”, “Drill → Back”.

### 2) Gestión de Estado y Efectos
- Síntomas:
  - `useSettings.getState()` usado en generador (no reactivo) mezclado con React state (riesgo de desincronización).
  - `setTimeout` en `AppRouter` y listeners globales sin cleanup; posibles fugas y efectos duplicados (StrictMode).
- Acciones:
  1. Centralizar estado de onboarding (paso, selecciones) en una sola fuente (store o reducer). Exponer selectores inmutables.
  2. Encapsular efectos con cleanup: remover listeners y timers en `useEffect` returns.
  3. Evitar leer estado global “fuera” de React sin suscripción; preferir hooks del store para obtener valores reactivos.

### 3) Construcción del Pool de Formas (rendimiento y duplicados)
- Síntomas:
  - `allFormsForRegion` itera todos los verbos y construye todas las formas en memoria; añade formas no finitas sintéticas en cada recomputación.
  - No hay deduplicación explícita (puede haber duplicados si futuras fuentes aportan `nonfinite`).
- Acciones:
  1. Precomputar índices en arranque (por región y por combinación); guardar en cache memoizada por `region` y una “versión” de datos.
  2. Inyectar no finitas una sola vez por lema + región y deduplicar por clave (`lemma|mood|tense|person|value`).
  3. Diferir el pool completo: construir “on-demand” por combinación cuando el usuario elija (modo/tiempo), evitando cargar millones de entradas innecesarias.

### 4) Datos Lingüísticos (exactitud)
- Síntomas:
  - Posibles errores: “desenvolvuelto” (lo correcto: “desenvuelto”).
  - Clasificaciones potencialmente incorrectas: `oír` en `PRET_J` no corresponde; debería estar en `HIATUS_Y` + “yo” irregular (G_VERBS) es correcto, pero no `PRET_J`.
- Acciones:
  1. Auditoría exhaustiva de las listas de irregulares: participios y gerundios; corregir entradas dudosas.
  2. Añadir tests unitarios de reglas (conjugationRules) para participios/gerundios y familias clave.
  3. Consolidar fuente única para irregularidades (no duplicar entre `conjugationRules`, `irregularFamilies` y builder no finito).

### 5) Selector/Generador (elección del próximo ítem)
- Síntomas:
  - Mucho logging y ramas complejas (SRS, adaptativo, fallback) con comparaciones repetidas.
  - Riesgo de “pool vacío” por filtros encadenados.
- Acciones:
  1. Simplificar pipeline: input (pool) → filtros deterministas → priorizador → selector; registrar métricas solo en DEV.
  2. Validaciones tempranas con errores explícitos; pruebas con fixtures representativas.
  3. Medir tiempo de generación con performance marks y alertar si >50ms.

### 6) PWA/Service Worker
- Síntomas:
  - Integración con `vite-plugin-pwa` correcta; falta UX de actualización (banner “Hay una nueva versión”).
  - Verificar que `index.html` usa network-first (Workbox) y no quedan SWs manuales.
- Acciones:
  1. Añadir `virtual:pwa-register` con `onNeedRefresh` para recargar suave.
  2. Smoke test de caching en prod (no servir HTML obsoleto).

### 7) Logging, Telemetría y Privacidad
- Síntomas:
  - `console.log` masivo en producción.
  - Envíos a `gtag` solo para errores de SW; no hay mascarado de datos.
- Acciones:
  1. Guardar logs por entorno (`if (import.meta.env.DEV)`), o usar logger con niveles.
  2. Revisar que no se registren datos personales; documentar política de datos locales.

### 8) Accesibilidad y UX Móvil
- Síntomas:
  - Dependencia de back de hardware sin patrón consistente.
  - Poca señal visual de navegación entre pasos.
- Acciones:
  1. Añadir transiciones sutiles y encabezados claros del paso actual.
  2. Asegurar focus management (enfocar primer control al cambiar de pantalla).
  3. Revisar `aria-label` en botones/cards.

### 9) Build/Config
- Síntomas:
  - `manualChunks` con rutas relativas sensibles; revisar robustez.
  - Many logs/sourcemaps en modos inadecuados.
- Acciones:
  1. Revisar `terser` y sourcemaps: solo en DEV.
  2. Medir tamaño de bundle y refactorizar librerías pesadas bajo split.

## Plan de Limpieza y Optimización (por fases)

### Fase 1 — Navegación y Back (bloqueante)
1. Migrar a React Router (o FSM pura) y mapear pasos → rutas; eliminar History hacks.
2. Unificar Back: UI → `navigate(-1)` y hardware → `popstate` del router.
3. Pruebas de regresión de rutas/Back (Vitest + jsdom/@testing-library/react).

### Fase 2 — Estado y Efectos
1. Reducer/Store único para onboarding; exponer acciones atómicas.
2. Limpiar listeners/timers y evitar cierres obsoletos.
3. Remover `getState()` no reactivo en generador; pasar settings como parámetros.

### Fase 3 — Pool de Formas y Rendimiento
1. Preíndices por región y por combinación; memo estable por versión de datos.
2. Inyección no finita one-time + deduplicación.
3. Construcción on-demand por combinación; medir y fijar SLA (<25ms promedio).

### Fase 4 — Datos Lingüísticos
1. Auditar mapas de gerundios/participios y familias; corregir “desenvuelto”, `oír` en PRET_J, etc.
2. Tests unitarios para casos especiales (hiatos, e→i, o→u, participios dobles).
3. Fuente única de irregularidades y validadores.

### Fase 5 — PWA y UX de actualización
1. Añadir banner “Nueva versión disponible. Recargar”.
2. Test de Workbox (cache-busting de HTML, assets hashed).

### Fase 6 — Logging/Privacidad
1. Logger con niveles por entorno.
2. Línea base mínima de telemetría anónima (opcional/consentimiento).

### Fase 7 — Accesibilidad y UX
1. Focus management y títulos/aria en cada pantalla.
2. Transiciones ligeras entre pasos.

## Métricas y Validación
- UX Back: 100% de rutas de onboarding con “un toque = un paso atrás”; tests automatizados.
- Rendimiento: generación de próximo ítem <25ms p50, <60ms p95.
- Tamaño de bundle: objetivo < 500KB gz (sin datos).
- Errores de datos: 0 falsos irregulares en set validado (lista curated).

## Riesgos y Mitigaciones
- Cambiar la navegación puede romper deep-links: mitigar con redirects y rutas canónicas.
- Refactor de generador puede alterar selección: cubrir con pruebas y fixtures.
- Auditoría lingüística lleva tiempo: priorizar top 100 verbos/tiempos.

---

Este plan prioriza eliminar la causa raíz del Back errático y clarificar una sola fuente de verdad para el estado y la navegación. Luego, optimiza performance y exactitud lingüística, con pruebas que eviten regresiones.

